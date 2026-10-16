
from sentence_transformers import SentenceTransformer

MODEL_NAME = "BAAI/bge-small-en-v1.5"
_model = None


def get_model():
    global _model

    if _model is None:
        _model = SentenceTransformer(
            MODEL_NAME,
            device="cpu"
        )

    return _model


def generate_embedding(text: str):
    embedding = get_model().encode(
        text,
        normalize_embeddings=True
    )
    return embedding.tolist()


def generate_embeddings(texts: list[str]):
    embeddings = get_model().encode(
        texts,
        normalize_embeddings=True,
        batch_size=4
    )
    return embeddings.tolist()
