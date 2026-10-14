
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, ConfigDict


class TutorSessionCreate(BaseModel):
    topic: str = Field(min_length=1, max_length=255)
    document_id: int | None = None
    level: Literal["beginner", "intermediate", "advanced"] = "beginner"
    style: Literal[
        "guided",
        "socratic",
        "explanation-first",
    ] = "guided"


class TutorMessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=10000)


class TutorMessageResponse(BaseModel):
    id: int
    role: str
    message_type: str
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TutorSessionResponse(BaseModel):
    id: int
    topic: str
    document_id: int | None
    level: str
    style: str
    status: str
    created_at: datetime
    ended_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class TutorSessionDetail(TutorSessionResponse):
    messages: list[TutorMessageResponse] = []