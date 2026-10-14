from pydantic import BaseModel
from datetime import datetime


class ExamGenerateRequest(BaseModel):
    topic: str
    difficulty: str = "medium"
    question_count: int = 10
    duration_minutes: int = 30
    document_id: int | None = None


class ExamQuestionResponse(BaseModel):
    id: int
    question: str
    question_type: str

    option_a: str | None
    option_b: str | None
    option_c: str | None
    option_d: str | None

    explanation: str | None
    difficulty: str | None
    order_index: int

    class Config:
        from_attributes = True


class ExamResponse(BaseModel):
    id: int
    title: str
    topic: str | None
    difficulty: str
    question_count: int
    duration_minutes: int

    user_id: int
    document_id: int | None
    created_at: datetime

    questions: list[ExamQuestionResponse] = []

    class Config:
        from_attributes = True


class ExamSubmitRequest(BaseModel):
    answers: dict[str, str]
    time_taken_seconds: int | None = None