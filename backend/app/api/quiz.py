from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models.user import User
from app.models.quiz import Quiz
from app.models.quiz_question import QuizQuestion
from app.schemas.quiz import (QuizGenerateRequest,QuizResponse,QuizSubmitRequest,)
from app.services.rag.retrieval import search_documents
from app.services.quiz.quiz_generator import generate_quiz
from app.models.quiz_attempt import QuizAttempt

router = APIRouter(
    prefix="/quiz",
    tags=["Quiz"]
)


@router.post("/generate", response_model=QuizResponse)
def generate_quiz_endpoint(
    request: QuizGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # --------------------------------
    # Validate question count
    # --------------------------------

    if request.question_count < 1 or request.question_count > 20:
        raise HTTPException(
            status_code=400,
            detail="Question count must be between 1 and 20."
        )

    # --------------------------------
    # Validate difficulty
    # --------------------------------

    allowed_difficulties = {
        "easy",
        "medium",
        "hard"
    }

    if request.difficulty.lower() not in allowed_difficulties:
        raise HTTPException(
            status_code=400,
            detail="Difficulty must be easy, medium, or hard."
        )

    # --------------------------------
    # Retrieve relevant document chunks
    # --------------------------------

    try:
        chunks = search_documents(
            query=request.topic,
            user_id=current_user.id,
            top_k=8,
            document_id=request.document_id
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Document retrieval failed: {str(exc)}"
        )

    if not chunks:
        raise HTTPException(
            status_code=404,
            detail="No relevant information found in the selected document."
        )

    # --------------------------------
    # Build context
    # --------------------------------

    context_parts = []

    for chunk in chunks:
        filename = chunk.get("filename", "Unknown document")
        page_number = chunk.get("page_number")
        content = chunk.get("content", "")

        source = filename

        if page_number is not None:
            source += f" - Page {page_number}"

        context_parts.append(
            f"[Source: {source}]\n{content}"
        )

    context = "\n\n".join(context_parts)

    # --------------------------------
    # Generate questions using LLM
    # --------------------------------

    try:
        questions = generate_quiz(
            topic=request.topic,
            context=context,
            difficulty=request.difficulty.lower(),
            question_count=request.question_count,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Quiz generation failed: {str(exc)}"
        )

    # --------------------------------
    # Create Quiz
    # --------------------------------

    quiz = Quiz(
        title=f"{request.topic} Quiz",
        topic=request.topic,
        difficulty=request.difficulty.lower(),
        question_count=len(questions),
        user_id=current_user.id,
        document_id=request.document_id,
    )

    db.add(quiz)
    db.flush()

    # --------------------------------
    # Save questions
    # --------------------------------

    for index, question in enumerate(questions):

        required_fields = [
            "question",
            "option_a",
            "option_b",
            "option_c",
            "option_d",
            "correct_answer",
            "explanation",
        ]

        for field in required_fields:
            if not question.get(field):
                raise HTTPException(
                    status_code=500,
                    detail=f"Generated question is missing: {field}"
                )

        quiz_question = QuizQuestion(
            quiz_id=quiz.id,
            question=question["question"],
            option_a=question["option_a"],
            option_b=question["option_b"],
            option_c=question["option_c"],
            option_d=question["option_d"],
            correct_answer=question["correct_answer"],
            explanation=question["explanation"],
            difficulty=question.get(
                "difficulty",
                request.difficulty.lower()
            ),
            order_index=index,
        )

        db.add(quiz_question)

    db.commit()
    db.refresh(quiz)

    return quiz

# --------------------------------
# Get all quizzes
# --------------------------------

@router.get("", response_model=list[QuizResponse])
def get_quizzes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    quizzes = (
        db.query(Quiz)
        .filter(Quiz.user_id == current_user.id)
        .order_by(Quiz.created_at.desc())
        .all()
    )

    return quizzes


# --------------------------------
# Get single quiz
# --------------------------------

@router.get("/{quiz_id}", response_model=QuizResponse)
def get_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    quiz = (
        db.query(Quiz)
        .filter(
            Quiz.id == quiz_id,
            Quiz.user_id == current_user.id,
        )
        .first()
    )

    if not quiz:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found."
        )

    return quiz


# --------------------------------
# Delete quiz
# --------------------------------

@router.delete("/{quiz_id}")
def delete_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    quiz = (
        db.query(Quiz)
        .filter(
            Quiz.id == quiz_id,
            Quiz.user_id == current_user.id,
        )
        .first()
    )

    if not quiz:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found."
        )

    db.delete(quiz)
    db.commit()

    return {
        "message": "Quiz deleted successfully."
    }
# --------------------------------
# Submit Quiz
# --------------------------------

@router.post("/{quiz_id}/submit")
def submit_quiz(
    quiz_id: int,
    request: QuizSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # --------------------------------
    # Find quiz
    # --------------------------------

    quiz = (
        db.query(Quiz)
        .filter(
            Quiz.id == quiz_id,
            Quiz.user_id == current_user.id,
        )
        .first()
    )

    if not quiz:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found."
        )

    # --------------------------------
    # Get questions
    # --------------------------------

    questions = (
        db.query(QuizQuestion)
        .filter(
            QuizQuestion.quiz_id == quiz.id
        )
        .order_by(QuizQuestion.order_index)
        .all()
    )

    if not questions:
        raise HTTPException(
            status_code=400,
            detail="This quiz has no questions."
        )

    # --------------------------------
    # Evaluate answers
    # --------------------------------

    results = []

    correct_count = 0
    wrong_count = 0
    skipped_count = 0

    for question in questions:

        user_answer = request.answers.get(str(question.id))

        correct_answer = question.correct_answer

        is_skipped = user_answer is None

        is_correct = (
            not is_skipped
            and user_answer.upper() == correct_answer.upper()
        )

        if is_skipped:
            skipped_count += 1
        elif is_correct:
            correct_count += 1
        else:
            wrong_count += 1

        results.append({
        "question_id": question.id,
        "question": question.question,
        "selected_answer": user_answer,
        "correct_answer": correct_answer,
        "is_correct": is_correct,
        "is_skipped": is_skipped,
        "explanation": question.explanation,})

    # --------------------------------
    # Calculate score
    # --------------------------------

    total_questions = len(questions)

    score_percentage = round(
        (correct_count / total_questions) * 100,
        2
    )
    attempt = QuizAttempt(
        quiz_id=quiz.id,
        user_id=current_user.id,
        total_questions=total_questions,
        correct_answers=correct_count,
        wrong_answers=wrong_count,
        skipped_questions=skipped_count,
        score=score_percentage,
    )

    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return {
        "attempt_id": attempt.id,
        "quiz_id": quiz.id,
        "title": quiz.title,
        "total_questions": total_questions,
        "answered_questions": total_questions - skipped_count,
        "correct_answers": correct_count,
        "wrong_answers": wrong_count,
        "skipped_questions": skipped_count,
        "score": score_percentage,
        "results": results,
    }
@router.get("/{quiz_id}/attempts")
def get_quiz_attempts(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # --------------------------------
    # Verify quiz belongs to user
    # --------------------------------

    quiz = (
        db.query(Quiz)
        .filter(
            Quiz.id == quiz_id,
            Quiz.user_id == current_user.id,
        )
        .first()
    )

    if not quiz:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found."
        )

    # --------------------------------
    # Get attempts for this quiz
    # --------------------------------

    attempts = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.quiz_id == quiz_id
        )
        .order_by(
            QuizAttempt.created_at.desc()
        )
        .all()
    )

    return attempts