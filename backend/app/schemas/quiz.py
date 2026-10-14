from pydantic import BaseModel
from datetime import datetime


# -------------------------
# Generate Quiz Request
# -------------------------

class QuizGenerateRequest(BaseModel):
    topic: str
    difficulty: str = "medium"
    question_count: int = 5
    document_id: int | None = None


# -------------------------
# Question Response
# -------------------------

class QuizQuestionResponse(BaseModel):
    id: int
    question: str
    option_a: str | None
    option_b: str | None
    option_c: str | None
    option_d: str | None
    explanation: str | None
    difficulty: str | None
    order_index: int

    class Config:
        from_attributes = True


# -------------------------
# Quiz Response
# -------------------------

class QuizResponse(BaseModel):
    id: int
    title: str
    topic: str | None
    difficulty: str
    question_count: int
    user_id: int
    document_id: int | None
    created_at: datetime
    questions: list[QuizQuestionResponse] = []

    class Config:
        from_attributes = True

class QuizSubmitRequest(BaseModel):
    answers: dict[str, str]