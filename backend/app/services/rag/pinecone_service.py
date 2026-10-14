
import os

from dotenv import load_dotenv
from pinecone import Pinecone, ServerlessSpec

load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "study-ai")

if not PINECONE_API_KEY:
    raise ValueError("PINECONE_API_KEY is missing from the environment.")

pc = Pinecone(api_key=PINECONE_API_KEY)


def create_index():
    existing_indexes = [index["name"] for index in pc.list_indexes()]

    if INDEX_NAME not in existing_indexes:
        pc.create_index(
            name=INDEX_NAME,
            dimension=384,
            metric="cosine",
            spec=ServerlessSpec(
                cloud="aws",
                region="us-east-1",
            ),
        )


def get_index():
    return pc.Index(INDEX_NAME)