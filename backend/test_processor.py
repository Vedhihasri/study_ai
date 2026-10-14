
from app.database import SessionLocal
from app.models.document import Document, DocumentChunk
from sqlalchemy import Column, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


db = SessionLocal()

try:
    document_id = 9  # Change if needed

    document = db.query(Document).filter(
        Document.id == document_id
    ).first()

    if not document:
        print("Document not found")
    else:
        print("Filename:", document.filename)

        chunks = (
            db.query(DocumentChunk)
            .filter(DocumentChunk.document_id == document_id)
            .order_by(DocumentChunk.chunk_index)
            .all()
        )

        print("Total chunks:", len(chunks))

        for chunk in chunks:
            print(
                f"\nChunk ID: {chunk.id}"
                f" | Index: {chunk.chunk_index}"
                f" | Page: {chunk.page_number}"
                f" | Characters: {len(chunk.content)}"
            )
            print(chunk.content[:500])

finally:
    db.close()