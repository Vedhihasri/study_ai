from pydantic import BaseModel
from datetime import datetime


class AnalyticsOverviewResponse(BaseModel):
    average_score: float
    quizzes_completed: int
    exams_completed: int
    questions_answered: int


class PerformancePoint(BaseModel):
    date: datetime
    score: float
    type: str
    total_questions: int


class AnalyticsPerformanceResponse(BaseModel):
    data: list[PerformancePoint]

class TopicPerformancePoint(BaseModel):
    topic: str
    attempts: int
    questions: int
    correct_answers: int
    accuracy: float


class AnalyticsTopicPerformanceResponse(BaseModel):
    data: list[TopicPerformancePoint]

class WeakAreaPoint(BaseModel):
    topic: str
    accuracy: float
    attempts: int
    questions: int
    status: str


class AnalyticsWeakAreasResponse(BaseModel):
    data: list[WeakAreaPoint]

class StudyActivityPoint(BaseModel):
    date: str
    quiz_attempts: int
    exam_attempts: int
    total_attempts: int


class AnalyticsStudyActivityResponse(BaseModel):
    data: list[StudyActivityPoint]