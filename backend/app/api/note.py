from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db

from app.models.user import User
from app.models.note import Note
from app.models.document import Document

from app.schemas.note import (
    NoteCreate,
    NoteGenerateRequest,
    NoteResponse
)

from app.services.rag.retrieval import search_documents
from app.services.rag.context_builder import build_context
from app.services.llm_service import generate_answer


router = APIRouter(
    prefix="/notes",
    tags=["Notes"]
)


# --------------------------------
# Get user's notes
# --------------------------------

@router.get(
    "",
    response_model=list[NoteResponse]
)
def get_user_notes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    notes = (
        db.query(Note)
        .filter(
            Note.user_id == current_user.id
        )
        .order_by(
            Note.created_at.desc()
        )
        .all()
    )

    return notes


# --------------------------------
# Get single note
# --------------------------------

@router.get(
    "/{note_id}",
    response_model=NoteResponse
)
def get_note(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    note = (
        db.query(Note)
        .filter(
            Note.id == note_id,
            Note.user_id == current_user.id
        )
        .first()
    )

    if not note:
        raise HTTPException(
            status_code=404,
            detail="Note not found"
        )

    return note


# --------------------------------
# Generate AI note
# --------------------------------

@router.post(
    "/generate",
    response_model=NoteResponse
)
def generate_note(
    request: NoteGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # --------------------------------
    # 1. Validate document
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

    if document.status != "processed":
        raise HTTPException(
            status_code=400,
            detail="Document is not ready for AI note generation"
        )

    # --------------------------------
    # 2. Search relevant chunks
    # --------------------------------

    results = search_documents(
        query=request.topic,
        user_id=current_user.id,
        top_k=5,
        document_id=request.document_id
    )

    if not results:
        raise HTTPException(
            status_code=404,
            detail="No relevant information found in this document"
        )

    # --------------------------------
    # 3. Build RAG context
    # --------------------------------

    context = build_context(results)

    # --------------------------------
    # 4. Build note-generation prompt
    # --------------------------------

    prompt = f"""
You are an AI study-notes generator.

Generate clear, well-organized study notes about the topic:
{request.topic}

Depth: {request.depth}
Style: {request.style}

IMPORTANT FORMATTING RULES:
- Do NOT use Markdown.
- Do NOT use #, ##, ### headings.
- Do NOT use **bold**, *italic*, or `code` formatting.
- Do NOT use --- or other horizontal separators.
- Do NOT use Markdown tables.
- Do NOT include phrases such as "Source 1", "Source 2", "Source 3" unless the source information is specifically required.
- Do NOT include citations inside every bullet.
- Do NOT add information that is not supported by the provided document.
- Do NOT mention that you are an AI.
- Do NOT say "based on the provided excerpts" repeatedly.
- Keep the language simple and suitable for students.

STRUCTURE THE NOTES LIKE THIS:

TITLE
Short title for the topic.

OVERVIEW
Give a short 2–4 sentence explanation of the topic.

KEY CONCEPTS
• Concept name: Explain the concept clearly.
• Concept name: Explain the concept clearly.
• Concept name: Explain the concept clearly.

IMPORTANT POINTS
• Important point
• Important point
• Important point

FORMULAS
Include this section only when formulas are present in the document.

Formula name:
formula

Where:
variable = meaning

EXAMPLES
Include examples only when the document provides examples or they can be directly explained from the document content.

Example 1:
Explain the example clearly.

QUICK REVISION
• Short point
• Short point
• Short point
• Short point

IMPORTANT:
Use normal text headings such as:
TITLE
OVERVIEW
KEY CONCEPTS
IMPORTANT POINTS
FORMULAS
EXAMPLES
QUICK REVISION

Do not add Markdown symbols before or around these headings.
Do not use decorative separators.
Keep the notes concise but sufficiently detailed for exam preparation.

Document Context:
{context}
"""


    # --------------------------------
    # 5. Generate notes using LLM
    # --------------------------------

    answer = generate_answer(
        question=prompt,
        context=context,
        conversation_history=""
    )

    # --------------------------------
    # 6. Create title
    # --------------------------------

    title = f"{request.topic} - AI Notes"

    # --------------------------------
    # 7. Save generated note
    # --------------------------------

    note = Note(
        title=title,
        topic=request.topic,
        content=answer,
        depth=request.depth,
        style=request.style,
        user_id=current_user.id,
        document_id=request.document_id
    )

    db.add(note)
    db.commit()
    db.refresh(note)

    return note


# --------------------------------
# Create manual note
# --------------------------------

@router.post(
    "",
    response_model=NoteResponse
)
def create_note(
    note_data: NoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    note = Note(
        title=note_data.title,
        topic=note_data.topic,
        content=note_data.content,
        depth=note_data.depth,
        style=note_data.style,
        document_id=note_data.document_id,
        user_id=current_user.id
    )

    db.add(note)
    db.commit()
    db.refresh(note)

    return note


# --------------------------------
# Delete note
# --------------------------------

@router.delete("/{note_id}")
def delete_note(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    note = (
        db.query(Note)
        .filter(
            Note.id == note_id,
            Note.user_id == current_user.id
        )
        .first()
    )

    if not note:
        raise HTTPException(
            status_code=404,
            detail="Note not found"
        )

    db.delete(note)
    db.commit()

    return {
        "message": "Note deleted successfully",
        "note_id": note_id
    }