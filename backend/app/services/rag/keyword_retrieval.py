from rank_bm25 import BM25Okapi

from app.database import SessionLocal
from app.models import DocumentChunk

def search_keyword(
    query: str,
    user_id: int,
    top_k: int = 5
):
    db = SessionLocal()

    try:
        chunks = (
            db.query(DocumentChunk)
            .join(DocumentChunk.document)
            .filter(DocumentChunk.document.has(user_id=user_id))
            .all()
        )

        if not chunks:
            return []

        documents = [chunk.content for chunk in chunks]

        tokenized_documents = [
            document.lower().split()
            for document in documents
        ]

        bm25 = BM25Okapi(tokenized_documents)

        query_tokens = query.lower().split()

        scores = bm25.get_scores(query_tokens)

        ranked_indexes = sorted(
            range(len(scores)),
            key=lambda i: scores[i],
            reverse=True
        )[:top_k]

        results = []

        for index in ranked_indexes:
            chunk = chunks[index]

            results.append({
                "chunk_id": chunk.id,
                "document_id": chunk.document_id,
                "filename": chunk.document.filename,
                "page_number": chunk.page_number,
                "content": chunk.content,
                "score": float(scores[index])
            })

        return results

    finally:
        db.close()