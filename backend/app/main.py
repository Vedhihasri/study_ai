from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.models import User
from app.api.auth import router as auth_router
from fastapi import Depends
from app.auth import get_current_user
from app.api.documents import router as documents_router
from app.api.search import router as search_router
from app.api.chat import router as chat_router
from app.api.note import router as notes_router
from app.api.flashcards import router as flashcards_router
from app.api.quiz import router as quiz_router
from app.api.exam import router as exam_router
from app.api.analytics import router as analytics_router
from app.models.tutor import TutorSession, TutorMessage
from app.api.dashboard import router as dashboard_router
from app.api import tutor

Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="StudyAI API",
    description="AI-powered study assistant",
    version="1.0.0"
)
app.include_router(auth_router)
app.include_router(documents_router)
app.include_router(search_router)
app.include_router(chat_router)
app.include_router(notes_router)
app.include_router(flashcards_router)
app.include_router(quiz_router)
app.include_router(exam_router)
app.include_router(analytics_router)
app.include_router(tutor.router)
app.include_router(dashboard_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "StudyAI API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }

@app.get("/me")
def get_me(
    current_user: User = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email
    }
