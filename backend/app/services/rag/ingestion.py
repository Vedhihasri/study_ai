
from app.services.rag.embedding_service import generate_embeddings
from app.services.rag.pinecone_service import get_index


def index_document_chunks(document, chunks):
    index = get_index()

    valid_chunks = [
        chunk for chunk in chunks
        if chunk.content and chunk.content.strip()
    ]

    if not valid_chunks:
        return 0

    texts = [chunk.content for chunk in valid_chunks]
    embeddings = generate_embeddings(texts)

    vectors = []

    for chunk, embedding in zip(valid_chunks, embeddings):
        vector_id = f"document-{document.id}-chunk-{chunk.id}"

        metadata = {
            "document_id": document.id,
            "chunk_id": chunk.id,
            "user_id": document.user_id,
            "filename": document.filename,
            "content": chunk.content,
        }

        if chunk.page_number is not None:
            metadata["page_number"] = chunk.page_number

        vectors.append({
            "id": vector_id,
            "values": embedding,
            "metadata": metadata,
        })

    index.upsert(vectors=vectors)

    return len(vectors)