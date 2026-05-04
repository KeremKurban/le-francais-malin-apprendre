"""
Pick exercises from a user's history or attach freshly generated exercises to the shared pool + seen tracking.
"""
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.exercise import Exercise
from app.models.exercise_cache import ExerciseCache, UserSeenExercise


def _exam_type_match_column(exam_type: str):
    """SQL filter: DELF/FIDE requests also match BOTH topics."""
    if exam_type == "DELF":
        return Exercise.exam_type.in_(["DELF", "BOTH"])
    if exam_type == "FIDE":
        return Exercise.exam_type.in_(["FIDE", "BOTH"])
    return Exercise.exam_type == exam_type


async def pick_exercise_from_history(
    db: AsyncSession,
    user_id: uuid.UUID,
    exam_type: str,
    level: str,
    exercise_type: str,
    topic_id: Optional[uuid.UUID],
) -> Optional[Exercise]:
    """Return a random exercise this user has already seen, matching filters."""
    stmt = (
        select(Exercise)
        .join(UserSeenExercise, UserSeenExercise.exercise_id == Exercise.id)
        .where(
            UserSeenExercise.user_id == user_id,
            Exercise.exercise_type == exercise_type,
            Exercise.level == level,
            _exam_type_match_column(exam_type),
        )
    )
    if topic_id is not None:
        stmt = stmt.where(Exercise.topic_id == topic_id)

    stmt = stmt.order_by(func.random()).limit(1)
    result = await db.execute(stmt)
    exercise = result.scalar_one_or_none()
    if not exercise:
        return None

    use_row = await db.execute(
        select(UserSeenExercise).where(
            UserSeenExercise.user_id == user_id,
            UserSeenExercise.exercise_id == exercise.id,
        )
    )
    seen = use_row.scalar_one_or_none()
    if seen:
        seen.seen_at = datetime.now(timezone.utc)
        exercise.times_used += 1
        await db.flush()

    return exercise


async def register_fresh_exercise_for_pool_and_user(
    db: AsyncSession,
    user_id: uuid.UUID,
    exercise: Exercise,
    exam_type: str,
    level: str,
    exercise_type: str,
) -> None:
    """After LLM generation: record user seen + shared cache row for other users."""
    existing_seen = await db.execute(
        select(UserSeenExercise.id).where(
            UserSeenExercise.user_id == user_id,
            UserSeenExercise.exercise_id == exercise.id,
        )
    )
    if existing_seen.scalar_one_or_none() is None:
        db.add(UserSeenExercise(user_id=user_id, exercise_id=exercise.id))

    existing_cache = await db.execute(
        select(ExerciseCache.id).where(ExerciseCache.exercise_id == exercise.id)
    )
    if existing_cache.scalar_one_or_none() is None:
        db.add(
            ExerciseCache(
                exercise_id=exercise.id,
                exam_type=exam_type,
                level=level,
                exercise_type=exercise_type,
                cache_expires_at=datetime.now(timezone.utc) + timedelta(days=14),
            )
        )
    await db.flush()
