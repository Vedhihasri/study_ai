from pydantic import BaseModel
from datetime import datetime


# --------------------------------
# Request: Generate flashcards
# --------------------------------

class FlashcardGenerateRequest(BaseModel):
    document_id: int
    topic: str
    difficulty: str = "medium"
    card_count: int = 10


# --------------------------------
# Single flashcard response
# --------------------------------

class FlashcardResponse(BaseModel):
    id: int
    question: str
    answer: str
    order_index: int

    class Config:
        from_attributes = True


# --------------------------------
# Flashcard set response
# --------------------------------

class FlashcardSetResponse(BaseModel):
    id: int
    title: str
    topic: str
    difficulty: str
    card_count: int
    user_id: int
    document_id: int
    created_at: datetime
    flashcards: list[FlashcardResponse]

    class Config:
        from_attributes = True