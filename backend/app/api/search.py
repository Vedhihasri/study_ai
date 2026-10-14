from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.auth import get_current_user
from app.models.user import User
from app.services.rag.retrieval import search_documents


router = APIRouter(
    prefix="/search",
    tags=["Search"]
)


class SearchRequest(BaseModel):
    query: str
    top_k: int = 5


@router.post("")
def search(
    data: SearchRequest,
    current_user: User = Depends(get_current_user)
):
    results = search_documents(
        query=data.query,
        user_id=current_user.id,
        top_k=data.top_k
    )

    return {
        "query": data.query,
        "results": results
    }