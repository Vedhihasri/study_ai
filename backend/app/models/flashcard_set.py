from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class FlashcardSet(Base):
    __tablename__ = "flashcard_sets"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    title = Column(
        String,
        nullable=False
    )

    topic = Column(
        String,
        nullable=False
    )

    difficulty = Column(
        String,
        nullable=False,
        default="medium"
    )

    card_count = Column(
        Integer,
        nullable=False,
        default=0
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    document_id = Column(
        Integer,
        ForeignKey("documents.id"),
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    user = relationship(
        "User"
    )

    document = relationship(
        "Document"
    )

    flashcards = relationship(
        "Flashcard",
        back_populates="flashcard_set",
        cascade="all, delete-orphan"
    )