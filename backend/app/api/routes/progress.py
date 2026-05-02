from fastapi import APIRouter
from sqlalchemy import select, func

from app.core.deps import DB, CurrentUser
from app.models.session import LearningSession
from app.models.response import UserResponse
from app.models.weakness import Weakness
from app.models.skill_level import SkillLevel
from app.models.recommendation import ReviewRecommendation
from app.models.topic import Topic
from app.schemas.progress import (
    DashboardResponse,
    SkillLevelOut,
    WeaknessOut,
    RecommendationOut,
)

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("/dashboard", response_model=DashboardResponse)
async def dashboard(db: DB, current_user: CurrentUser):
    user_id = current_user.id

    # Session stats
    sessions_result = await db.execute(
        select(func.count()).where(LearningSession.user_id == user_id)
    )
    total_sessions = sessions_result.scalar() or 0

    responses_result = await db.execute(
        select(UserResponse).where(UserResponse.user_id == user_id).order_by(
            UserResponse.created_at.desc()
        ).limit(50)
    )
    recent_responses = responses_result.scalars().all()
    total_responses = len(recent_responses)
    avg_score = sum(r.score for r in recent_responses) / total_responses if total_responses else 0
    recent_scores = [r.score for r in recent_responses[:10]]

    # Skill levels
    skill_result = await db.execute(
        select(SkillLevel).where(SkillLevel.user_id == user_id)
    )
    skill_levels = [SkillLevelOut.model_validate(s) for s in skill_result.scalars().all()]

    # Weaknesses with topic names
    weakness_result = await db.execute(
        select(Weakness, Topic)
        .join(Topic, Weakness.topic_id == Topic.id)
        .where(Weakness.user_id == user_id)
        .order_by(Weakness.error_count.desc())
        .limit(5)
    )
    top_weaknesses = [
        WeaknessOut(
            topic_id=w.topic_id,
            topic_name=t.name,
            error_count=w.error_count,
            severity=w.severity,
            error_type_counts=w.error_type_counts,
            last_seen=w.last_seen.isoformat(),
        )
        for w, t in weakness_result.all()
    ]

    # Recommendations
    reco_result = await db.execute(
        select(ReviewRecommendation, Topic)
        .join(Topic, ReviewRecommendation.topic_id == Topic.id)
        .where(
            ReviewRecommendation.user_id == user_id,
            ReviewRecommendation.completed_at.is_(None),
        )
        .order_by(ReviewRecommendation.priority)
        .limit(5)
    )
    recommendations = [
        RecommendationOut(
            id=r.id,
            topic_id=r.topic_id,
            topic_name=t.name,
            priority=r.priority,
            reason=r.reason,
            exercise_type=r.exercise_type,
        )
        for r, t in reco_result.all()
    ]

    return DashboardResponse(
        total_sessions=total_sessions,
        total_exercises=sum(1 for _ in recent_responses),
        total_responses=total_responses,
        average_score=round(avg_score, 1),
        skill_levels=skill_levels,
        top_weaknesses=top_weaknesses,
        recommendations=recommendations,
        recent_scores=recent_scores,
        streak_days=0,
    )


@router.get("/weaknesses", response_model=list[WeaknessOut])
async def weaknesses(db: DB, current_user: CurrentUser):
    result = await db.execute(
        select(Weakness, Topic)
        .join(Topic, Weakness.topic_id == Topic.id)
        .where(Weakness.user_id == current_user.id)
        .order_by(Weakness.error_count.desc())
    )
    return [
        WeaknessOut(
            topic_id=w.topic_id,
            topic_name=t.name,
            error_count=w.error_count,
            severity=w.severity,
            error_type_counts=w.error_type_counts,
            last_seen=w.last_seen.isoformat(),
        )
        for w, t in result.all()
    ]


@router.get("/recommendations", response_model=list[RecommendationOut])
async def recommendations(db: DB, current_user: CurrentUser):
    result = await db.execute(
        select(ReviewRecommendation, Topic)
        .join(Topic, ReviewRecommendation.topic_id == Topic.id)
        .where(
            ReviewRecommendation.user_id == current_user.id,
            ReviewRecommendation.completed_at.is_(None),
        )
        .order_by(ReviewRecommendation.priority)
    )
    return [
        RecommendationOut(
            id=r.id,
            topic_id=r.topic_id,
            topic_name=t.name,
            priority=r.priority,
            reason=r.reason,
            exercise_type=r.exercise_type,
        )
        for r, t in result.all()
    ]
