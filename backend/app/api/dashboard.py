
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.auth import get_current_user

from app.models.user import User
from app.models.document import Document
from app.models.chat_session import ChatSession
from app.models.chat_message import ChatMessage
from app.models.tutor import TutorSession, TutorMessage
from app.models.quiz_attempt import QuizAttempt
from app.models.exam_attempt import ExamAttempt

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    documents_count = (
        db.query(func.count(Document.id))
        .filter(Document.user_id == current_user.id)
        .scalar() or 0
    )

    chat_questions = (
        db.query(func.count(ChatMessage.id))
        .join(ChatSession, ChatMessage.session_id == ChatSession.id)
        .filter(
            ChatSession.user_id == current_user.id,
            func.lower(ChatMessage.role).in_(["user", "human"])
        )
        .scalar() or 0
    )

    tutor_questions = (
        db.query(func.count(TutorMessage.id))
        .join(TutorSession, TutorMessage.session_id == TutorSession.id)
        .filter(
            TutorSession.user_id == current_user.id,
            func.lower(TutorMessage.role).in_(["user", "human"])
        )
        .scalar() or 0
    )

    chat_sessions = (
        db.query(func.count(ChatSession.id))
        .filter(ChatSession.user_id == current_user.id)
        .scalar() or 0
    )

    tutor_sessions = (
        db.query(func.count(TutorSession.id))
        .filter(TutorSession.user_id == current_user.id)
        .scalar() or 0
    )

    quiz_attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == current_user.id)
        .all()
    )

    exam_attempts = (
        db.query(ExamAttempt)
        .filter(ExamAttempt.user_id == current_user.id)
        .all()
    )

    attempts = quiz_attempts + exam_attempts

    total_questions = sum(a.total_questions for a in attempts)
    correct_answers = sum(a.correct_answers for a in attempts)

    quiz_accuracy = (
        round(correct_answers / total_questions * 100, 2)
        if total_questions else None
    )

    recent_documents = (
        db.query(Document)
        .filter(Document.user_id == current_user.id)
        .order_by(Document.created_at.desc())
        .limit(5)
        .all()
    )

    return {
        "documents_count": documents_count,
        "questions_asked": chat_questions + tutor_questions,
        "study_sessions": chat_sessions + tutor_sessions,
        "quiz_accuracy": quiz_accuracy,
        "recent_documents": [
            {
                "id": doc.id,
                "filename": doc.filename,
                "file_type": doc.file_type,
                "status": doc.status,
                "created_at": doc.created_at.isoformat()
                if doc.created_at else None,
            }
            for doc in recent_documents
        ],
    }
