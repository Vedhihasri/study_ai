from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.document import Document
from app.models.tutor import TutorSession, TutorMessage
from app.schemas.tutor import (
    TutorSessionCreate,
    TutorSessionResponse,
    TutorSessionDetail,
    TutorMessageCreate,
)
from app.services.tutor_service import generate_tutor_response
from app.auth import get_current_user
import json
from app.services.rag.retrieval import search_documents
from app.services.quiz.quiz_generator import generate_quiz

router = APIRouter(prefix="/tutor", tags=["AI Tutor"])


def get_owned_session(
    session_id: int,
    user_id: int,
    db: Session,
) -> TutorSession:
    session = (
        db.query(TutorSession)
        .filter(
            TutorSession.id == session_id,
            TutorSession.user_id == user_id,
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tutor session not found",
        )

    return session


@router.post(
    "/sessions",
    response_model=TutorSessionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_tutor_session(
    payload: TutorSessionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    topic = payload.topic.strip()

    if not topic:
        raise HTTPException(
            status_code=400,
            detail="Topic cannot be empty",
        )

    # Verify the selected document belongs to this user.
    if payload.document_id is not None:
        document = (
            db.query(Document)
            .filter(
                Document.id == payload.document_id,
                Document.user_id == current_user.id,
            )
            .first()
        )

        if not document:
            raise HTTPException(
                status_code=404,
                detail="Document not found",
            )

    session = TutorSession(
        user_id=current_user.id,
        topic=topic,
        document_id=payload.document_id,
        level=payload.level,
        style=payload.style,
        status="active",
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return session


@router.get(
    "/sessions",
    response_model=list[TutorSessionResponse],
)
def list_tutor_sessions(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return (
        db.query(TutorSession)
        .filter(TutorSession.user_id == current_user.id)
        .order_by(TutorSession.created_at.desc())
        .all()
    )


@router.get(
    "/sessions/{session_id}",
    response_model=TutorSessionDetail,
)
def get_tutor_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    session = get_owned_session(
        session_id=session_id,
        user_id=current_user.id,
        db=db,
    )

    return session


@router.post("/sessions/{session_id}/messages")
def send_tutor_message(
    session_id: int,
    payload: TutorMessageCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    session = get_owned_session(
        session_id=session_id,
        user_id=current_user.id,
        db=db,
    )

    if session.status != "active":
        raise HTTPException(
            status_code=400,
            detail="This tutor session has ended",
        )

    question = payload.content.strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty",
        )

    # Load recent conversation history BEFORE saving this question.
    previous_messages = (
        db.query(TutorMessage)
        .filter(TutorMessage.session_id == session.id)
        .order_by(TutorMessage.created_at.desc())
        .limit(10)
        .all()
    )[::-1]

    conversation_history = "\n".join(
        f"{message.role}: {message.content}"
        for message in previous_messages
    )

    # Generate a document-grounded teaching response.
    result = generate_tutor_response(
        topic=session.topic,
        question=question,
        level=session.level,
        style=session.style,
        user_id=current_user.id,
        document_id=session.document_id,
        conversation_history=conversation_history,
    )

    user_message = TutorMessage(
        session_id=session.id,
        role="user",
        message_type="text",
        content=question,
    )

    assistant_message = TutorMessage(
        session_id=session.id,
        role="assistant",
        message_type="text",
        content=result["answer"],
    )

    try:
        db.add(user_message)
        db.add(assistant_message)
        db.commit()
        db.refresh(user_message)
        db.refresh(assistant_message)
    except Exception:
        db.rollback()
        raise

    return {
        "session_id": session.id,
        "user_message": {
            "id": user_message.id,
            "role": user_message.role,
            "message_type": user_message.message_type,
            "content": user_message.content,
            "created_at": user_message.created_at,
        },
        "assistant_message": {
            "id": assistant_message.id,
            "role": assistant_message.role,
            "message_type": assistant_message.message_type,
            "content": assistant_message.content,
            "created_at": assistant_message.created_at,
        },
        "sources": result["sources"],
    }


@router.post("/sessions/{session_id}/end")
def end_tutor_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    session = get_owned_session(
        session_id=session_id,
        user_id=current_user.id,
        db=db,
    )

    if session.status == "active":
        session.status = "ended"
        session.ended_at = datetime.utcnow()
        db.commit()
        db.refresh(session)

    return {
        "message": "Tutor session ended",
        "session_id": session.id,
        "status": session.status,
        "ended_at": session.ended_at,
    }

@router.post("/sessions/{session_id}/hint")
def get_tutor_hint(
    session_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    session = get_owned_session(
        session_id=session_id,
        user_id=current_user.id,
        db=db,
    )

    if session.status != "active":
        raise HTTPException(
            status_code=400,
            detail="This tutor session has ended",
        )

    # Load recent conversation history.
    previous_messages = (
        db.query(TutorMessage)
        .filter(TutorMessage.session_id == session.id)
        .order_by(TutorMessage.created_at.desc())
        .limit(10)
        .all()
    )[::-1]

    conversation_history = "\n".join(
        f"{message.role}: {message.content}"
        for message in previous_messages
    )

    # Ask the existing tutor AI for a hint, not a full solution.
    hint_prompt = (
        f"The learner is studying: {session.topic}.\n"
        "Give exactly one short, useful hint for understanding "
        "the topic or progressing with their current question.\n"
        "Use the learner's level and study context. "
        "Do not reveal the complete answer or solution. "
        "Do not provide a full explanation. "
        "If there is no specific question yet, give a helpful "
        "starting clue about the topic."
    )

    try:
        result = generate_tutor_response(
            topic=session.topic,
            question=hint_prompt,
            level=session.level,
            style=session.style,
            user_id=current_user.id,
            document_id=session.document_id,
            conversation_history=conversation_history,
        )
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to generate a hint right now",
        )

    return {
        "session_id": session.id,
        "hint": result["answer"],
        "sources": result.get("sources", []),
    }

@router.post("/sessions/{session_id}/quick-check")
def generate_tutor_quick_check(
    session_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    session = get_owned_session(
        session_id=session_id,
        user_id=current_user.id,
        db=db,
    )

    if session.status != "active":
        raise HTTPException(
            status_code=400,
            detail="This tutor session has ended",
        )

    try:
        chunks = search_documents(
            query=session.topic,
            user_id=current_user.id,
            top_k=8,
            document_id=session.document_id,
        )

        if not chunks:
            raise HTTPException(
                status_code=404,
                detail="Upload relevant study material to generate a quick check.",
            )

        context = "\n\n".join(
            f"[Source: {chunk.get('filename', 'Study material')}]\n"
            f"{chunk.get('content', '')}"
            for chunk in chunks
        )

        difficulty = {
            "beginner": "easy",
            "intermediate": "medium",
            "advanced": "hard",
        }.get(session.level, "medium")

        questions = generate_quiz(
            topic=session.topic,
            context=context,
            difficulty=difficulty,
            question_count=1,
        )

        question = questions[0]

        required = [
            "question",
            "option_a",
            "option_b",
            "option_c",
            "option_d",
            "correct_answer",
            "explanation",
        ]

        if any(not question.get(key) for key in required):
            raise ValueError("The generated question is incomplete.")

        correct_answer = question["correct_answer"].strip().upper()

        if correct_answer not in {"A", "B", "C", "D"}:
            raise ValueError("The generated answer key is invalid.")

        # Keep the answer key on the server in the saved message.
        saved_question = TutorMessage(
            session_id=session.id,
            role="assistant",
            message_type="quick_check",
            content=json.dumps(question),
        )

        db.add(saved_question)
        db.commit()
        db.refresh(saved_question)

        return {
            "question_id": saved_question.id,
            "question": question["question"],
            "options": {
                "A": question["option_a"],
                "B": question["option_b"],
                "C": question["option_c"],
                "D": question["option_d"],
            },
        }

    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to generate a quick-check question.",
        )


@router.post("/sessions/{session_id}/quick-check/{question_id}/answer")
def evaluate_tutor_quick_check(
    session_id: int,
    question_id: int,
    payload: TutorMessageCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    session = get_owned_session(
        session_id=session_id,
        user_id=current_user.id,
        db=db,
    )

    if session.status != "active":
        raise HTTPException(
            status_code=400,
            detail="This tutor session has ended",
        )

    saved_question = (
        db.query(TutorMessage)
        .filter(
            TutorMessage.id == question_id,
            TutorMessage.session_id == session.id,
            TutorMessage.role == "assistant",
            TutorMessage.message_type == "quick_check",
        )
        .first()
    )

    if not saved_question:
        raise HTTPException(
            status_code=404,
            detail="Quick-check question not found.",
        )

    try:
        question = json.loads(saved_question.content)
    except (TypeError, json.JSONDecodeError):
        raise HTTPException(
            status_code=500,
            detail="Saved quick-check question is invalid.",
        )

    selected = payload.content.strip().upper()

    if selected not in {"A", "B", "C", "D"}:
        raise HTTPException(
            status_code=400,
            detail="Answer must be A, B, C, or D.",
        )

    correct = question["correct_answer"].strip().upper()

    return {
        "question_id": question_id,
        "selected_answer": selected,
        "correct_answer": correct,
        "is_correct": selected == correct,
        "explanation": question["explanation"],
    }
