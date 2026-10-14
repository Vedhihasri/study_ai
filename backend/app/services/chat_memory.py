from sqlalchemy.orm import Session

from app.models.chat_message import ChatMessage


def get_recent_messages(
    db: Session,
    session_id: int,
    limit: int = 6
):
    messages = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.session_id == session_id
        )
        .order_by(
            ChatMessage.created_at.desc()
        )
        .limit(limit)
        .all()
    )

    messages.reverse()

    return messages