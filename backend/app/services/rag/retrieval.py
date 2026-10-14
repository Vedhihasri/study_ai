from app.services.rag.embedding_service import generate_embedding
from app.services.rag.pinecone_service import get_index


def search_documents(
    query: str,
    user_id: int,
    top_k: int = 5,
    document_id: int | None = None
):
    index = get_index()

    query_embedding = generate_embedding(query)

    # Always search only the current user's documents
    query_filter = {
        "user_id": user_id
    }

    # If a document was selected,
    # search only that document
    if document_id is not None:
        query_filter["document_id"] = document_id

    results = index.query(
        vector=query_embedding,
        top_k=top_k,
        include_metadata=True,
        filter=query_filter
    )

    matches = []

    for match in results["matches"]:

        metadata = match.get("metadata", {})

        # Extra safety check for user
        if metadata.get("user_id") != user_id:
            continue

        # Extra safety check for document
        if (
            document_id is not None
            and metadata.get("document_id") != document_id
        ):
            continue

        matches.append({
            "chunk_id": metadata.get("chunk_id"),
            "document_id": metadata.get("document_id"),
            "filename": metadata.get("filename"),
            "page_number": metadata.get("page_number"),
            "content": metadata.get("content"),
            "score": match.get("score")
        })

    return matches