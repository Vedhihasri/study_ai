from pydantic import BaseModel
from datetime import datetime


class ChatRequest(BaseModel):
    question: str
    session_id: int | None = None
    document_id: int | None = None


class SourceResponse(BaseModel):
    filename: str
    page_number: int | None


class ChatResponse(BaseModel):
    session_id: int
    answer: str
    sources: list[SourceResponse]


class ChatSessionResponse(BaseModel):
    id: int
    title: str | None
    user_id: int
    document_id: int | None
    created_at: datetime

    class Config:
        from_attributes = True


class ChatMessageResponse(BaseModel):
    id: int
    session_id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True