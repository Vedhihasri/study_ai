import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db

from app.models.user import User
from app.models.document import Document
from app.models.flashcard_set import FlashcardSet
from app.models.flashcard import Flashcard

from app.schemas.flashcard import (
    FlashcardGenerateRequest,
    FlashcardSetResponse
)

from app.services.rag.retrieval import search_documents
from app.services.rag.context_builder import build_context
from app.services.flashcard_service import generate_flashcards


router = APIRouter(
    prefix="/flashcards",
    tags=["Flashcards"]
)


# --------------------------------
# Generate flashcards
# --------------------------------

@router.post(
    "/generate",
    response_model=FlashcardSetResponse
)
def create_flashcard_set(
    request: FlashcardGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # --------------------------------
    # 1. Validate card count
    # --------------------------------

    if request.card_count < 1 or request.card_count > 30:
        raise HTTPException(
            status_code=400,
            detail="Card count must be between 1 and 30"
        )

    # --------------------------------
    # 2. Validate difficulty
    # --------------------------------

    allowed_difficulties = {
        "easy",
        "medium",
        "hard"
    }

    if request.difficulty not in allowed_difficulties:
        raise HTTPException(
            status_code=400,
            detail="Difficulty must be easy, medium, or hard"
        )

    # --------------------------------
    # 3. Validate document ownership
    # --------------------------------

    document = (
        db.query(Document)
        .filter(
            Document.id == request.document_id,
            Document.user_id == current_user.id
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    # --------------------------------
    # 4. Check document status
    # --------------------------------

    if document.status != "processed":
        raise HTTPException(
            status_code=400,
            detail="Document is not ready for flashcard generation"
        )

    # --------------------------------
    # 5. Retrieve relevant chunks
    # --------------------------------

    results = search_documents(
        query=request.topic,
        user_id=current_user.id,
        top_k=8,
        document_id=request.document_id
    )

    if not results:
        raise HTTPException(
            status_code=404,
            detail="No relevant information found for this topic"
        )

    # --------------------------------
    # 6. Build RAG context
    # --------------------------------

    context = build_context(results)

    if not context.strip():
        raise HTTPException(
            status_code=404,
            detail="Could not build context from the document"
        )

    # --------------------------------
    # 7. Generate flashcards using LLM
    # --------------------------------

    try:

        raw_response = generate_flashcards(
            topic=request.topic,
            context=context,
            difficulty=request.difficulty,
            card_count=request.card_count
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"Flashcard generation failed: {str(error)}"
        )

    # --------------------------------
    # 8. Parse LLM JSON
    # --------------------------------

    try:

        parsed_response = json.loads(raw_response)

        generated_cards = parsed_response.get(
            "flashcards",
            []
        )

    except json.JSONDecodeError:

        raise HTTPException(
            status_code=500,
            detail="AI returned an invalid flashcard format"
        )

    # --------------------------------
    # 9. Validate generated cards
    # --------------------------------

    if not generated_cards:
        raise HTTPException(
            status_code=500,
            detail="AI did not generate any flashcards"
        )

    valid_cards = []

    for card in generated_cards:

        question = card.get("question")
        answer = card.get("answer")

        if not question or not answer:
            continue

        valid_cards.append({
            "question": question.strip(),
            "answer": answer.strip()
        })

    if not valid_cards:
        raise HTTPException(
            status_code=500,
            detail="AI generated invalid flashcards"
        )

    # --------------------------------
    # 10. Create flashcard set
    # --------------------------------

    flashcard_set = FlashcardSet(
        title=f"{request.topic} Flashcards",
        topic=request.topic,
        difficulty=request.difficulty,
        card_count=len(valid_cards),
        user_id=current_user.id,
        document_id=request.document_id
    )

    db.add(flashcard_set)
    db.commit()
    db.refresh(flashcard_set)

    # --------------------------------
    # 11. Save individual flashcards
    # --------------------------------

    for index, card in enumerate(valid_cards):

        flashcard = Flashcard(
            flashcard_set_id=flashcard_set.id,
            question=card["question"],
            answer=card["answer"],
            order_index=index
        )

        db.add(flashcard)

    db.commit()
    db.refresh(flashcard_set)

    # --------------------------------
    # 12. Return flashcard set
    # --------------------------------

    return flashcard_set


# --------------------------------
# Get all flashcard sets
# --------------------------------

@router.get(
    "",
    response_model=list[FlashcardSetResponse]
)
@router.get(
    "/",
    response_model=list[FlashcardSetResponse]
)
def get_flashcard_sets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    flashcard_sets = (
        db.query(FlashcardSet)
        .filter(
            FlashcardSet.user_id == current_user.id
        )
        .order_by(
            FlashcardSet.created_at.desc()
        )
        .all()
    )

    return flashcard_sets


# --------------------------------
# Get one flashcard set
# --------------------------------

@router.get(
    "/{set_id}",
    response_model=FlashcardSetResponse
)
def get_flashcard_set(
    set_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    flashcard_set = (
        db.query(FlashcardSet)
        .filter(
            FlashcardSet.id == set_id,
            FlashcardSet.user_id == current_user.id
        )
        .first()
    )

    if not flashcard_set:
        raise HTTPException(
            status_code=404,
            detail="Flashcard set not found"
        )

    return flashcard_set


# --------------------------------
# Delete flashcard set
# --------------------------------

@router.delete("/{set_id}")
def delete_flashcard_set(
    set_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    flashcard_set = (
        db.query(FlashcardSet)
        .filter(
            FlashcardSet.id == set_id,
            FlashcardSet.user_id == current_user.id
        )
        .first()
    )

    if not flashcard_set:
        raise HTTPException(
            status_code=404,
            detail="Flashcard set not found"
        )

    db.delete(flashcard_set)
    db.commit()

    return {
        "message": "Flashcard set deleted successfully",
        "set_id": set_id
    }