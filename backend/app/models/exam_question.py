from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class ExamQuestion(Base):
    __tablename__ = "exam_questions"

    id = Column(Integer, primary_key=True, index=True)

    exam_id = Column(
        Integer,
        ForeignKey("exams.id"),
        nullable=False
    )

    question = Column(Text, nullable=False)

    question_type = Column(
        String,
        nullable=False,
        default="mcq"
    )

    option_a = Column(String, nullable=True)
    option_b = Column(String, nullable=True)
    option_c = Column(String, nullable=True)
    option_d = Column(String, nullable=True)

    correct_answer = Column(String, nullable=False)

    explanation = Column(Text, nullable=True)

    difficulty = Column(String, nullable=True)

    order_index = Column(Integer, nullable=False)

    exam = relationship(
        "Exam",
        back_populates="questions"
    )