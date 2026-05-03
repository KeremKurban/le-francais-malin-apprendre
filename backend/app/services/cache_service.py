import asyncio
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.exercise import Exercise
from app.models.exercise_cache import ExerciseCache, UserSeenExercise
from app.core.database import AsyncSessionLocal

POOL_LOW_WATERMARK = 3
POOL_TARGET_SIZE = 8
_refilling: set[tuple] = set()


async def get_cached_exercise(
    db: AsyncSession,
    exam_type: str,
    level: str,
    exercise_type: str,
    user_id: uuid.UUID,
    mode: str = "writing",
    topic_id: Optional[uuid.UUID] = None,
) -> Exercise:
    """Serve from cache if available, else generate synchronously and schedule refill."""
    from app.services.exercise_service import generate_exercise

    now = datetime.now(timezone.utc)

    # Exercises already seen by this user
    seen_sq = select(UserSeenExercise.exercise_id).where(UserSeenExercise.user_id == user_id)

    stmt = (
        select(ExerciseCache, Exercise)
        .join(Exercise, ExerciseCache.exercise_id == Exercise.id)
        .where(
            ExerciseCache.exam_type == exam_type,
            ExerciseCache.level == level,
            ExerciseCache.exercise_type == exercise_type,
            ExerciseCache.is_active == True,
            ExerciseCache.cache_expires_at > now,
            ExerciseCache.pool_use_count < ExerciseCache.max_uses,
            ExerciseCache.exercise_id.not_in(seen_sq),
        )
        .order_by(ExerciseCache.created_at.asc())
        .limit(1)
    )
    row = (await db.execute(stmt)).first()

    if row:
        cache_entry, exercise = row
        cache_entry.pool_use_count += 1
        exercise.times_used += 1
        db.add(UserSeenExercise(user_id=user_id, exercise_id=exercise.id))
        await db.flush()

        # Check pool depth and refill if low
        remaining = await _count_available(db, exam_type, level, exercise_type, user_id)
        if remaining < POOL_LOW_WATERMARK:
            _schedule_refill(exam_type, level, exercise_type, mode, topic_id)
        return exercise

    # Cache miss — generate live and schedule async fill
    _schedule_refill(exam_type, level, exercise_type, mode, topic_id)
    return await generate_exercise(db, exam_type, level, exercise_type, mode, topic_id)


def _schedule_refill(exam_type, level, exercise_type, mode, topic_id):
    key = (exam_type, level, exercise_type)
    if key not in _refilling:
        task = asyncio.create_task(_refill_pool(exam_type, level, exercise_type, mode, topic_id))
        task.add_done_callback(
            lambda t: t.exception() and print(f"[cache] refill error: {t.exception()}")
        )


async def _count_available(db, exam_type, level, exercise_type, user_id) -> int:
    now = datetime.now(timezone.utc)
    seen_sq = select(UserSeenExercise.exercise_id).where(UserSeenExercise.user_id == user_id)
    result = await db.execute(
        select(func.count()).select_from(ExerciseCache).where(
            ExerciseCache.exam_type == exam_type,
            ExerciseCache.level == level,
            ExerciseCache.exercise_type == exercise_type,
            ExerciseCache.is_active == True,
            ExerciseCache.cache_expires_at > now,
            ExerciseCache.pool_use_count < ExerciseCache.max_uses,
            ExerciseCache.exercise_id.not_in(seen_sq),
        )
    )
    return result.scalar_one()


async def _refill_pool(exam_type, level, exercise_type, mode, topic_id):
    from app.services.exercise_service import generate_exercise
    key = (exam_type, level, exercise_type)
    if key in _refilling:
        return
    _refilling.add(key)
    try:
        async with AsyncSessionLocal() as db:
            # Count existing active entries
            now = datetime.now(timezone.utc)
            count_result = await db.execute(
                select(func.count()).select_from(ExerciseCache).where(
                    ExerciseCache.exam_type == exam_type,
                    ExerciseCache.level == level,
                    ExerciseCache.exercise_type == exercise_type,
                    ExerciseCache.is_active == True,
                    ExerciseCache.cache_expires_at > now,
                )
            )
            existing = count_result.scalar_one()
            needed = max(0, POOL_TARGET_SIZE - existing)
            for _ in range(needed):
                exercise = await generate_exercise(db, exam_type, level, exercise_type, mode, topic_id)
                db.add(ExerciseCache(
                    exercise_id=exercise.id,
                    exam_type=exam_type,
                    level=level,
                    exercise_type=exercise_type,
                    cache_expires_at=datetime.now(timezone.utc) + timedelta(days=14),
                ))
            await db.commit()
    except Exception as e:
        print(f"[cache] _refill_pool error for {key}: {e}")
    finally:
        _refilling.discard(key)


async def warm_cache(combos: list[tuple[str, str, str]]):
    """Called at startup to pre-warm common combinations."""
    for exam_type, level, exercise_type in combos:
        _schedule_refill(exam_type, level, exercise_type, "writing", None)
