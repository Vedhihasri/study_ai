from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user

from app.models.user import User
from app.models.quiz_attempt import QuizAttempt
from app.models.exam_attempt import ExamAttempt
from app.schemas.analytics import AnalyticsPerformanceResponse
from app.schemas.analytics import AnalyticsOverviewResponse
from app.schemas.analytics import AnalyticsTopicPerformanceResponse
from app.schemas.analytics import AnalyticsWeakAreasResponse,AnalyticsStudyActivityResponse
router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


@router.get(
    "/overview",
    response_model=AnalyticsOverviewResponse
)
def get_analytics_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # =========================
    # Quiz Attempts
    # =========================

    quiz_attempts = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.user_id == current_user.id
        )
        .all()
    )

    # =========================
    # Exam Attempts
    # =========================

    exam_attempts = (
        db.query(ExamAttempt)
        .filter(
            ExamAttempt.user_id == current_user.id
        )
        .all()
    )

    # =========================
    # Completed Counts
    # =========================

    quizzes_completed = len(quiz_attempts)

    exams_completed = len(exam_attempts)

    # =========================
    # Questions Answered
    # =========================

    quiz_questions = sum(
        attempt.total_questions
        for attempt in quiz_attempts
    )

    exam_questions = sum(
        attempt.total_questions
        for attempt in exam_attempts
    )

    questions_answered = (
        quiz_questions + exam_questions
    )

    # =========================
    # Average Score
    # =========================

    all_scores = [
        attempt.score
        for attempt in quiz_attempts
    ] + [
        attempt.score
        for attempt in exam_attempts
    ]

    if all_scores:
        average_score = round(
            sum(all_scores) / len(all_scores),
            2
        )
    else:
        average_score = 0.0

    # =========================
    # Response
    # =========================

    return {
        "average_score": average_score,
        "quizzes_completed": quizzes_completed,
        "exams_completed": exams_completed,
        "questions_answered": questions_answered
    }

@router.get("/performance", response_model=AnalyticsPerformanceResponse)
def get_performance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quiz_attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == current_user.id)
        .all()
    )

    exam_attempts = (
        db.query(ExamAttempt)
        .filter(ExamAttempt.user_id == current_user.id)
        .all()
    )

    performance = []

    for attempt in quiz_attempts:
        performance.append({
            "date": attempt.created_at,
            "score": attempt.score,
            "type": "quiz",
            "total_questions": attempt.total_questions
        })

    for attempt in exam_attempts:
        performance.append({
            "date": attempt.created_at,
            "score": attempt.score,
            "type": "exam",
            "total_questions": attempt.total_questions
        })

    performance.sort(key=lambda item: item["date"])

    return {
        "data": performance
    }

@router.get(
    "/topics",
    response_model=AnalyticsTopicPerformanceResponse
)
def get_topic_performance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    quiz_attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == current_user.id)
        .all()
    )

    exam_attempts = (
        db.query(ExamAttempt)
        .filter(ExamAttempt.user_id == current_user.id)
        .all()
    )

    topic_stats = {}

    # -------------------------
    # Quiz performance
    # -------------------------

    for attempt in quiz_attempts:

        topic = attempt.quiz.topic or "General"

        if topic not in topic_stats:
            topic_stats[topic] = {
                "attempts": 0,
                "questions": 0,
                "correct_answers": 0
            }

        topic_stats[topic]["attempts"] += 1
        topic_stats[topic]["questions"] += attempt.total_questions
        topic_stats[topic]["correct_answers"] += attempt.correct_answers

    # -------------------------
    # Exam performance
    # -------------------------

    for attempt in exam_attempts:

        topic = attempt.exam.topic or "General"

        if topic not in topic_stats:
            topic_stats[topic] = {
                "attempts": 0,
                "questions": 0,
                "correct_answers": 0
            }

        topic_stats[topic]["attempts"] += 1
        topic_stats[topic]["questions"] += attempt.total_questions
        topic_stats[topic]["correct_answers"] += attempt.correct_answers

    # -------------------------
    # Calculate accuracy
    # -------------------------

    data = []

    for topic, stats in topic_stats.items():

        accuracy = (
            (stats["correct_answers"] / stats["questions"]) * 100
            if stats["questions"] > 0
            else 0
        )

        data.append({
            "topic": topic,
            "attempts": stats["attempts"],
            "questions": stats["questions"],
            "correct_answers": stats["correct_answers"],
            "accuracy": round(accuracy, 2)
        })

    # Highest accuracy first
    data.sort(
        key=lambda item: item["accuracy"],
        reverse=True
    )

    return {
        "data": data
    }

@router.get(
    "/weak-areas",
    response_model=AnalyticsWeakAreasResponse
)
def get_weak_areas(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    quiz_attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == current_user.id)
        .all()
    )

    exam_attempts = (
        db.query(ExamAttempt)
        .filter(ExamAttempt.user_id == current_user.id)
        .all()
    )

    topic_stats = {}

    # -------------------------
    # Quiz attempts
    # -------------------------

    for attempt in quiz_attempts:

        topic = attempt.quiz.topic or "General"

        if topic not in topic_stats:
            topic_stats[topic] = {
                "attempts": 0,
                "questions": 0,
                "correct_answers": 0
            }

        topic_stats[topic]["attempts"] += 1
        topic_stats[topic]["questions"] += attempt.total_questions
        topic_stats[topic]["correct_answers"] += attempt.correct_answers

    # -------------------------
    # Exam attempts
    # -------------------------

    for attempt in exam_attempts:

        topic = attempt.exam.topic or "General"

        if topic not in topic_stats:
            topic_stats[topic] = {
                "attempts": 0,
                "questions": 0,
                "correct_answers": 0
            }

        topic_stats[topic]["attempts"] += 1
        topic_stats[topic]["questions"] += attempt.total_questions
        topic_stats[topic]["correct_answers"] += attempt.correct_answers

    # -------------------------
    # Classify topics
    # -------------------------

    data = []

    for topic, stats in topic_stats.items():

        if stats["questions"] == 0:
            continue

        accuracy = (
            stats["correct_answers"]
            / stats["questions"]
        ) * 100

        if accuracy < 60:
            status = "weak"
        elif accuracy < 80:
            status = "improving"
        else:
            status = "strong"

        data.append({
            "topic": topic,
            "accuracy": round(accuracy, 2),
            "attempts": stats["attempts"],
            "questions": stats["questions"],
            "status": status
        })

    # Weakest topics first
    data.sort(
        key=lambda item: item["accuracy"]
    )

    return {
        "data": data
    }

@router.get(
    "/study-activity",
    response_model=AnalyticsStudyActivityResponse
)
def get_study_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    quiz_attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == current_user.id)
        .all()
    )

    exam_attempts = (
        db.query(ExamAttempt)
        .filter(ExamAttempt.user_id == current_user.id)
        .all()
    )

    activity = {}

    # -------------------------
    # Quiz activity
    # -------------------------

    for attempt in quiz_attempts:

        date = attempt.created_at.date().isoformat()

        if date not in activity:
            activity[date] = {
                "quiz_attempts": 0,
                "exam_attempts": 0
            }

        activity[date]["quiz_attempts"] += 1

    # -------------------------
    # Exam activity
    # -------------------------

    for attempt in exam_attempts:

        date = attempt.created_at.date().isoformat()

        if date not in activity:
            activity[date] = {
                "quiz_attempts": 0,
                "exam_attempts": 0
            }

        activity[date]["exam_attempts"] += 1

    # -------------------------
    # Build response
    # -------------------------

    data = []

    for date, stats in activity.items():

        total_attempts = (
            stats["quiz_attempts"]
            + stats["exam_attempts"]
        )

        data.append({
            "date": date,
            "quiz_attempts": stats["quiz_attempts"],
            "exam_attempts": stats["exam_attempts"],
            "total_attempts": total_attempts
        })

    # Oldest → newest
    data.sort(
        key=lambda item: item["date"]
    )

    return {
        "data": data
    }