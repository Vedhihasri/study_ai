from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse
import json

from app.auth import get_current_user
from app.database import get_db

from app.models.user import User
from app.models.document import Document
from app.models.chat_session import ChatSession
from app.models.chat_message import ChatMessage

from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    SourceResponse,
    ChatSessionResponse,
    ChatMessageResponse
)

from app.services.rag.retrieval import search_documents
from app.services.rag.context_builder import build_context

from app.services.llm_service import (
    generate_answer,
    stream_answer,
    rewrite_query
)

from app.services.chat_memory import get_recent_messages


router = APIRouter(
    prefix="/chat",
    tags=["Chat"]
)


# ============================================================
# GET USER CHAT SESSIONS
# ============================================================

@router.get(
    "/sessions",
    response_model=list[ChatSessionResponse]
)
def get_user_chat_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    sessions = (
        db.query(ChatSession)
        .filter(
            ChatSession.user_id == current_user.id
        )
        .order_by(
            ChatSession.created_at.desc()
        )
        .all()
    )

    return sessions

@router.get("/search")
def search_chat_sessions(
    q: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = q.strip()

    if not query:
        return []

    sessions = (
        db.query(ChatSession)
        .filter(
            ChatSession.user_id == current_user.id,
            (
                ChatSession.title.ilike(f"%{query}%")
                |
                ChatSession.messages.any(
                    ChatMessage.content.ilike(f"%{query}%")
                )
            )
        )
        .order_by(ChatSession.created_at.desc())
        .all()
    )

    return sessions
# ============================================================
# GET MESSAGES OF A CHAT SESSION
# ============================================================

@router.get(
    "/sessions/{session_id}/messages",
    response_model=list[ChatMessageResponse]
)
def get_session_messages(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    session = (
        db.query(ChatSession)
        .filter(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Chat session not found"
        )

    messages = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.session_id == session_id
        )
        .order_by(
            ChatMessage.id.asc()
        )
        .all()
    )

    return messages


# ============================================================
# STREAM CHAT
# ============================================================

@router.post("/stream")
def stream_chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # --------------------------------------------------------
    # 1. Validate selected document
    # --------------------------------------------------------

    if request.document_id is not None:

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

    # --------------------------------------------------------
    # 2. Get or create chat session
    # --------------------------------------------------------

    if request.session_id is None:

        session = ChatSession(
            user_id=current_user.id,
            title=request.question[:50],
            document_id=request.document_id
        )

        db.add(session)
        db.commit()
        db.refresh(session)

    else:

        session = (
            db.query(ChatSession)
            .filter(
                ChatSession.id == request.session_id,
                ChatSession.user_id == current_user.id
            )
            .first()
        )

        if not session:
            raise HTTPException(
                status_code=404,
                detail="Chat session not found"
            )

    # --------------------------------------------------------
    # 3. Get conversation history
    # --------------------------------------------------------

    previous_messages = get_recent_messages(
        db=db,
        session_id=session.id
    )

    conversation_history = "\n".join(
        f"{message.role}: {message.content}"
        for message in previous_messages
    )

    # --------------------------------------------------------
    # 4. Prepare search query
    # --------------------------------------------------------

    search_query = request.question

    if previous_messages:

        search_query = rewrite_query(
            question=request.question,
            conversation_history=conversation_history
        )

    # --------------------------------------------------------
    # 5. Retrieve relevant document chunks
    # --------------------------------------------------------

    results = search_documents(
        query=search_query,
        user_id=current_user.id,
        top_k=5,
        document_id=request.document_id
    )

    # --------------------------------------------------------
    # 6. Build RAG context
    # --------------------------------------------------------

    context = build_context(results)

    # --------------------------------------------------------
    # 7. Save user message
    # --------------------------------------------------------

    user_message = ChatMessage(
        session_id=session.id,
        role="user",
        content=request.question
    )

    db.add(user_message)
    db.commit()

    # --------------------------------------------------------
    # 8. Generate streaming response
    # --------------------------------------------------------

    def generate():

        full_answer = ""

        for token in stream_answer(
            question=request.question,
            context=context,
            conversation_history=conversation_history
        ):

            full_answer += token

            data = {
                "type": "token",
                "content": token
            }

            yield (
                f"data: {json.dumps(data)}\n\n"
            )

        # ----------------------------------------------------
        # Save assistant message
        # ----------------------------------------------------

        assistant_message = ChatMessage(
            session_id=session.id,
            role="assistant",
            content=full_answer
        )

        db.add(assistant_message)
        db.commit()

        # ----------------------------------------------------
        # Build sources
        # ----------------------------------------------------

        sources = []

        seen = set()

        for result in results:

            key = (
                result["filename"],
                result["page_number"]
            )

            if key not in seen:

                seen.add(key)

                sources.append({
                    "filename": result["filename"],
                    "page_number": result["page_number"]
                })

        # ----------------------------------------------------
        # Send final event
        # ----------------------------------------------------

        yield (
            f"data: {json.dumps({
                'type': 'done',
                'session_id': session.id,
                'sources': sources
            })}\n\n"
        )

    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )


# ============================================================
# NORMAL CHAT
# ============================================================

@router.post(
    "/ask",
    response_model=ChatResponse
)
def ask_question(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # --------------------------------------------------------
    # 1. Validate selected document
    # --------------------------------------------------------

    if request.document_id is not None:

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

    # --------------------------------------------------------
    # 2. Get or create chat session
    # --------------------------------------------------------

    if request.session_id is None:

        session = ChatSession(
            user_id=current_user.id,
            title=request.question[:50],
            document_id=request.document_id
        )

        db.add(session)
        db.commit()
        db.refresh(session)

    else:

        session = (
            db.query(ChatSession)
            .filter(
                ChatSession.id == request.session_id,
                ChatSession.user_id == current_user.id
            )
            .first()
        )

        if not session:
            raise HTTPException(
                status_code=404,
                detail="Chat session not found"
            )

    # --------------------------------------------------------
    # 3. Get conversation history
    # --------------------------------------------------------

    previous_messages = get_recent_messages(
        db=db,
        session_id=session.id
    )

    conversation_history = "\n".join(
        f"{message.role}: {message.content}"
        for message in previous_messages
    )

    # --------------------------------------------------------
    # 4. Save user message
    # --------------------------------------------------------

    user_message = ChatMessage(
        session_id=session.id,
        role="user",
        content=request.question
    )

    db.add(user_message)
    db.commit()

    # --------------------------------------------------------
    # 5. Prepare search query
    # --------------------------------------------------------

    search_query = request.question

    if previous_messages:

        search_query = rewrite_query(
            question=request.question,
            conversation_history=conversation_history
        )

    # --------------------------------------------------------
    # 6. Retrieve relevant document chunks
    # --------------------------------------------------------

    results = search_documents(
        query=search_query,
        user_id=current_user.id,
        top_k=5,
        document_id=request.document_id
    )

    # --------------------------------------------------------
    # 7. Handle no results
    # --------------------------------------------------------

    if not results:

        answer = (
            "I don't have enough information "
            "in the provided documents."
        )

        assistant_message = ChatMessage(
            session_id=session.id,
            role="assistant",
            content=answer
        )

        db.add(assistant_message)
        db.commit()

        return ChatResponse(
            session_id=session.id,
            answer=answer,
            sources=[]
        )

    # --------------------------------------------------------
    # 8. Build RAG context
    # --------------------------------------------------------

    context = build_context(results)

    # --------------------------------------------------------
    # 9. Generate answer
    # --------------------------------------------------------

    answer = generate_answer(
        question=request.question,
        context=context,
        conversation_history=conversation_history
    )

    # --------------------------------------------------------
    # 10. Save assistant response
    # --------------------------------------------------------

    assistant_message = ChatMessage(
        session_id=session.id,
        role="assistant",
        content=answer
    )

    db.add(assistant_message)
    db.commit()

    # --------------------------------------------------------
    # 11. Build sources
    # --------------------------------------------------------

    sources = []

    seen = set()

    for result in results:

        key = (
            result["filename"],
            result["page_number"]
        )

        if key not in seen:

            seen.add(key)

            sources.append(
                SourceResponse(
                    filename=result["filename"],
                    page_number=result["page_number"]
                )
            )

    # --------------------------------------------------------
    # 12. Return response
    # --------------------------------------------------------

    return ChatResponse(
        session_id=session.id,
        answer=answer,
        sources=sources
    )