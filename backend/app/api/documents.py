import os
import shutil

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile
)
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.user import User

from app.services.documents.processor import extract_text
from app.services.documents.chunker import chunk_text

from app.services.rag.ingestion import index_document_chunks
from app.services.rag.pinecone_service import create_index, get_index

from app.schemas.document import DocumentResponse

router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)


@router.get("", response_model=list[DocumentResponse])
@router.get("/", response_model=list[DocumentResponse])
def get_user_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    documents = (
        db.query(Document)
        .filter(Document.user_id == current_user.id)
        .order_by(Document.created_at.desc())
        .all()
    )
    return documents



UPLOAD_DIR = "uploads"

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".txt"
}

@router.post("/upload")
def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # 1. Validate filename
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="File name is missing"
        )

    # 2. Validate extension
    extension = os.path.splitext(
        file.filename
    )[1].lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only PDF, DOCX and TXT files are allowed"
        )

    # 3. Create user's upload folder
    user_directory = os.path.join(
        UPLOAD_DIR,
        f"user_{current_user.id}"
    )

    os.makedirs(
        user_directory,
        exist_ok=True
    )

    # 4. Save uploaded file
    file_path = os.path.join(
        user_directory,
        file.filename
    )

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(
            file.file,
            buffer
        )

    # 5. Create document record
    document = Document(
        filename=file.filename,
        file_type=extension.replace(".", ""),
        file_path=file_path,
        status="pending",
        user_id=current_user.id
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    try:

        # 6. Extract text page-by-page
        pages = extract_text(file_path)

        if not pages:
            document.status = "failed"
            db.commit()

            raise HTTPException(
                status_code=400,
                detail="Could not extract text from document"
            )

        # 7. Create chunks while preserving page number
        all_chunks = []

        for page in pages:

            page_chunks = chunk_text(
                page["text"]
            )

            for chunk in page_chunks:

                all_chunks.append({
                    "content": chunk,
                    "page_number": page["page_number"]
                })

        if not all_chunks:
            document.status = "failed"
            db.commit()

            raise HTTPException(
                status_code=400,
                detail="No usable text found in document"
            )

        # 8. Save chunks to PostgreSQL
        for index, chunk_data in enumerate(all_chunks):

            document_chunk = DocumentChunk(
                document_id=document.id,
                chunk_index=index,
                page_number=chunk_data["page_number"],
                content=chunk_data["content"]
            )

            db.add(document_chunk)

        db.commit()

        # 9. Get saved chunks
        document_chunks = (
            db.query(DocumentChunk)
            .filter(
                DocumentChunk.document_id == document.id
            )
            .all()
        )

        # 10. Create Pinecone index if needed
        create_index()

        # 11. Generate embeddings and upload to Pinecone
        vectors_created = index_document_chunks(
            document,
            document_chunks
        )

        # 12. Mark document as processed
        document.status = "processed"

        db.commit()

        return {
            "message": "Document processed successfully",
            "document_id": document.id,
            "filename": document.filename,
            "chunks_created": len(document_chunks),
            "vectors_created": vectors_created,
            "status": document.status
        }

    except HTTPException:
        raise

    except Exception as error:

        document.status = "failed"

        db.commit()

        raise HTTPException(
            status_code=500,
            detail=f"Document processing failed: {str(error)}"
        )

@router.get("/{document_id}")
def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    document = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.user_id == current_user.id
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    chunks = (
        db.query(DocumentChunk)
        .filter(
            DocumentChunk.document_id == document.id
        )
        .order_by(DocumentChunk.chunk_index)
        .all()
    )

    return {
        "id": document.id,
        "filename": document.filename,
        "file_type": document.file_type,
        "file_path": document.file_path,
        "status": document.status,
        "subject_id": document.subject_id,
        "created_at": document.created_at,
        "chunks": [
            {
                "id": chunk.id,
                "chunk_index": chunk.chunk_index,
                "page_number": chunk.page_number,
                "content": chunk.content
            }
            for chunk in chunks
        ]
    }

@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    document = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.user_id == current_user.id
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    # Get document chunks before deleting the document
    chunks = (
        db.query(DocumentChunk)
        .filter(
            DocumentChunk.document_id == document.id
        )
        .all()
    )

    # Delete corresponding Pinecone vectors
    try:
        if chunks:
            index = get_index()

            vector_ids = [
                f"document-{document.id}-chunk-{chunk.id}"
                for chunk in chunks
            ]

            index.delete(ids=vector_ids)

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete document vectors: {str(error)}"
        )

    # Delete physical uploaded file
    if document.file_path and os.path.exists(document.file_path):
        try:
            os.remove(document.file_path)
        except OSError:
            pass

    # Delete database record
    db.delete(document)
    db.commit()

    return {
        "message": "Document deleted successfully",
        "document_id": document_id
    }