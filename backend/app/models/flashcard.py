from sqlalchemy import Column, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Flashcard(Base):
    __tablename__ = "flashcards"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    flashcard_set_id = Column(
        Integer,
        ForeignKey("flashcard_sets.id"),
        nullable=False
    )

    question = Column(
        Text,
        nullable=False
    )

    answer = Column(
        Text,
        nullable=False
    )

    order_index = Column(
        Integer,
        nullable=False
    )

    flashcard_set = relationship(
        "FlashcardSet",
        back_populates="flashcards"
    )