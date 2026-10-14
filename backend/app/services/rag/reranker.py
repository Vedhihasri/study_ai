from sentence_transformers import CrossEncoder


# Load the model once when the application starts
reranker_model = CrossEncoder(
    "cross-encoder/ms-marco-MiniLM-L-6-v2"
)


def rerank_documents(
    query: str,
    documents: list,
    top_k: int = 5
):
    if not documents:
        return []

    pairs = [
        (query, document["content"])
        for document in documents
    ]

    scores = reranker_model.predict(pairs)

    for document, score in zip(documents, scores):
        document["rerank_score"] = float(score)

    documents.sort(
        key=lambda x: x["rerank_score"],
        reverse=True
    )

    return documents[:top_k]