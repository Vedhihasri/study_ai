from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)

    quiz_id = Column(
        Integer,
        ForeignKey("quizzes.id"),
        nullable=False
    )

    question = Column(
        Text,
        nullable=False
    )

    option_a = Column(
        String,
        nullable=True
    )

    option_b = Column(
        String,
        nullable=True
    )

    option_c = Column(
        String,
        nullable=True
    )

    option_d = Column(
        String,
        nullable=True
    )

    correct_answer = Column(
        String,
        nullable=False
    )

    explanation = Column(
        Text,
        nullable=True
    )

    difficulty = Column(
        String,
        nullable=True
    )

    order_index = Column(
        Integer,
        nullable=False
    )

    quiz = relationship(
        "Quiz",
        back_populates="questions"
    )