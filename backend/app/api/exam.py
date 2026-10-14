from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models.exam_attempt import ExamAttempt
from app.schemas.exam import ExamSubmitRequest
from app.models.user import User
from app.models.exam import Exam
from app.models.exam_question import ExamQuestion

from app.schemas.exam import (
    ExamGenerateRequest,
    ExamResponse,
)

from app.services.rag.retrieval import search_documents
from app.services.exam.exam_generator import generate_exam


router = APIRouter(
    prefix="/exam",
    tags=["Exam"]
)


@router.post("/generate", response_model=ExamResponse)
def generate_exam_endpoint(
    request: ExamGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # -----------------------------
    # Validate question count
    # -----------------------------
    if request.question_count < 1 or request.question_count > 50:
        raise HTTPException(
            status_code=400,
            detail="Question count must be between 1 and 50."
        )

    # -----------------------------
    # Validate difficulty
    # -----------------------------
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

    # -----------------------------
    # Validate duration
    # -----------------------------
    if request.duration_minutes < 1 or request.duration_minutes > 180:
        raise HTTPException(
            status_code=400,
            detail="Duration must be between 1 and 180 minutes."
        )

    # -----------------------------
    # Retrieve study material
    # -----------------------------
    chunks = search_documents(
        query=request.topic,
        user_id=current_user.id,
        top_k=8,
        document_id=request.document_id
    )

    if not chunks:
        raise HTTPException(
            status_code=404,
            detail="No relevant study material found for this topic."
        )

    # -----------------------------
    # Build context
    # -----------------------------
    context_parts = []

    for chunk in chunks:

        filename = chunk.get("filename", "Unknown")
        page_number = chunk.get("page_number")

        source = filename

        if page_number is not None:
            source += f", page {page_number}"

        context_parts.append(
            f"Source: {source}\n"
            f"{chunk.get('content', '')}"
        )

    context = "\n\n---\n\n".join(context_parts)

    # -----------------------------
    # Generate exam questions
    # -----------------------------
    try:

        questions = generate_exam(
            topic=request.topic,
            difficulty=request.difficulty.lower(),
            question_count=request.question_count,
            context=context
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate exam: {str(e)}"
        )

    # -----------------------------
    # Create Exam
    # -----------------------------
    exam = Exam(
        title=f"{request.topic} Exam",
        topic=request.topic,
        difficulty=request.difficulty.lower(),
        question_count=len(questions),
        duration_minutes=request.duration_minutes,
        user_id=current_user.id,
        document_id=request.document_id
    )

    db.add(exam)
    db.flush()

    # -----------------------------
    # Save questions
    # -----------------------------
    for index, question_data in enumerate(questions):

        required_fields = [
            "question",
            "option_a",
            "option_b",
            "option_c",
            "option_d",
            "correct_answer"
        ]

        for field in required_fields:

            if not question_data.get(field):
                raise HTTPException(
                    status_code=500,
                    detail=f"Generated question is missing: {field}"
                )

        question = ExamQuestion(
            exam_id=exam.id,
            question=question_data["question"],
            question_type=question_data.get(
                "question_type",
                "mcq"
            ),
            option_a=question_data["option_a"],
            option_b=question_data["option_b"],
            option_c=question_data["option_c"],
            option_d=question_data["option_d"],
            correct_answer=question_data["correct_answer"],
            explanation=question_data.get("explanation"),
            difficulty=question_data.get(
                "difficulty",
                request.difficulty.lower()
            ),
            order_index=index
        )

        db.add(question)

    db.commit()
    db.refresh(exam)

    return exam
@router.get("", response_model=list[ExamResponse])
def get_exams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    exams = (
        db.query(Exam)
        .filter(Exam.user_id == current_user.id)
        .order_by(Exam.created_at.desc())
        .all()
    )

    return exams
@router.get("/{exam_id}", response_model=ExamResponse)
def get_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exam = (
        db.query(Exam)
        .filter(
            Exam.id == exam_id,
            Exam.user_id == current_user.id
        )
        .first()
    )

    if not exam:
        raise HTTPException(
            status_code=404,
            detail="Exam not found."
        )

    return exam

@router.post("/{exam_id}/submit")
def submit_exam(
    exam_id: int,
    request: ExamSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # -----------------------------
    # Verify exam ownership
    # -----------------------------
    exam = (
        db.query(Exam)
        .filter(
            Exam.id == exam_id,
            Exam.user_id == current_user.id
        )
        .first()
    )

    if not exam:
        raise HTTPException(
            status_code=404,
            detail="Exam not found."
        )

    # -----------------------------
    # Get questions
    # -----------------------------
    questions = (
        db.query(ExamQuestion)
        .filter(
            ExamQuestion.exam_id == exam.id
        )
        .order_by(ExamQuestion.order_index)
        .all()
    )

    if not questions:
        raise HTTPException(
            status_code=400,
            detail="Exam has no questions."
        )

    correct_count = 0
    wrong_count = 0
    skipped_count = 0

    results = []

    # -----------------------------
    # Evaluate answers
    # -----------------------------
    for question in questions:

        user_answer = request.answers.get(
            str(question.id)
        )

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
            "explanation": question.explanation
        })

    # -----------------------------
    # Calculate score
    # -----------------------------
    total_questions = len(questions)

    score_percentage = round(
        (correct_count / total_questions) * 100,
        2
    )

    # -----------------------------
    # Save attempt
    # -----------------------------
    attempt = ExamAttempt(
        exam_id=exam.id,
        user_id=current_user.id,
        total_questions=total_questions,
        correct_answers=correct_count,
        wrong_answers=wrong_count,
        skipped_questions=skipped_count,
        score=score_percentage,
        time_taken_seconds=request.time_taken_seconds
    )

    db.add(attempt)

    db.commit()
    db.refresh(attempt)

    return {
        "attempt_id": attempt.id,
        "exam_id": exam.id,
        "title": exam.title,
        "total_questions": total_questions,
        "answered_questions": (
            correct_count + wrong_count
        ),
        "correct_answers": correct_count,
        "wrong_answers": wrong_count,
        "skipped_questions": skipped_count,
        "score": score_percentage,
        "time_taken_seconds": request.time_taken_seconds,
        "results": results
    }

@router.post("/{exam_id}/submit")
def submit_exam(
    exam_id: int,
    request: ExamSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # -----------------------------
    # Verify exam ownership
    # -----------------------------
    exam = (
        db.query(Exam)
        .filter(
            Exam.id == exam_id,
            Exam.user_id == current_user.id
        )
        .first()
    )

    if not exam:
        raise HTTPException(
            status_code=404,
            detail="Exam not found."
        )

    # -----------------------------
    # Get questions
    # -----------------------------
    questions = (
        db.query(ExamQuestion)
        .filter(
            ExamQuestion.exam_id == exam.id
        )
        .order_by(ExamQuestion.order_index)
        .all()
    )

    if not questions:
        raise HTTPException(
            status_code=400,
            detail="Exam has no questions."
        )

    correct_count = 0
    wrong_count = 0
    skipped_count = 0

    results = []

    # -----------------------------
    # Evaluate answers
    # -----------------------------
    for question in questions:

        user_answer = request.answers.get(
            str(question.id)
        )

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
            "explanation": question.explanation
        })

    # -----------------------------
    # Calculate score
    # -----------------------------
    total_questions = len(questions)

    score_percentage = round(
        (correct_count / total_questions) * 100,
        2
    )

    # -----------------------------
    # Save attempt
    # -----------------------------
    attempt = ExamAttempt(
        exam_id=exam.id,
        user_id=current_user.id,
        total_questions=total_questions,
        correct_answers=correct_count,
        wrong_answers=wrong_count,
        skipped_questions=skipped_count,
        score=score_percentage,
        time_taken_seconds=request.time_taken_seconds
    )

    db.add(attempt)

    db.commit()
    db.refresh(attempt)

    return {
        "attempt_id": attempt.id,
        "exam_id": exam.id,
        "title": exam.title,
        "total_questions": total_questions,
        "answered_questions": (
            correct_count + wrong_count
        ),
        "correct_answers": correct_count,
        "wrong_answers": wrong_count,
        "skipped_questions": skipped_count,
        "score": score_percentage,
        "time_taken_seconds": request.time_taken_seconds,
        "results": results
    }

@router.get("/{exam_id}/attempts")
def get_exam_attempts(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    exam = (
        db.query(Exam)
        .filter(
            Exam.id == exam_id,
            Exam.user_id == current_user.id,
        )
        .first()
    )

    if not exam:
        raise HTTPException(
            status_code=404,
            detail="Exam not found",
        )

    attempts = (
        db.query(ExamAttempt)
        .filter(
            ExamAttempt.exam_id == exam_id,
            ExamAttempt.user_id == current_user.id,
        )
        .order_by(ExamAttempt.created_at.desc())
        .all()
    )

    return attempts