from pydantic import BaseModel
from datetime import datetime


class NoteGenerateRequest(BaseModel):
    topic: str
    depth: str = "medium"
    style: str = "study_notes"
    document_id: int


class NoteCreate(BaseModel):
    title: str
    topic: str
    content: str
    depth: str
    style: str
    document_id: int | None = None


class NoteResponse(BaseModel):
    id: int
    title: str
    topic: str
    content: str
    depth: str
    style: str
    user_id: int
    document_id: int | None
    created_at: datetime

    class Config:
        from_attributes = True