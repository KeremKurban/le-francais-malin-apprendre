from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.core.deps import DB, CurrentUser
from app.models.exercise import Exercise
from app.schemas.exercise import GenerateExerciseRequest, ExerciseOut
from app.services.exercise_service import generate_exercise

router = APIRouter(prefix="/exercises", tags=["exercises"])


@router.post("/generate", response_model=ExerciseOut)
async def generate(body: GenerateExerciseRequest, db: DB, current_user: CurrentUser):
    if body.use_cache and body.topic_id is None:
        from app.services.cache_service import get_cached_exercise
        exercise = await get_cached_exercise(
            db=db,
            exam_type=body.exam_type,
            level=body.level,
            exercise_type=body.exercise_type,
            user_id=current_user.id,
            mode=body.mode,
            topic_id=None,
        )
    else:
        exercise = await generate_exercise(
            db=db,
            exam_type=body.exam_type,
            level=body.level,
            exercise_type=body.exercise_type,
            mode=body.mode,
            topic_id=body.topic_id,
            extra_context=body.context or "",
        )
    return exercise


@router.get("/{exercise_id}", response_model=ExerciseOut)
async def get_exercise(exercise_id: str, db: DB, _: CurrentUser):
    from uuid import UUID
    result = await db.execute(select(Exercise).where(Exercise.id == UUID(exercise_id)))
    exercise = result.scalar_one_or_none()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return exercise
