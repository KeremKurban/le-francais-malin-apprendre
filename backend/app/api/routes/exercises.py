from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.core.deps import DB, CurrentUser
from app.models.exercise import Exercise
from app.schemas.exercise import GenerateExerciseRequest, ExerciseOut
from app.services.exercise_service import generate_exercise
from app.services.exercise_pool_service import (
    pick_exercise_from_history,
    register_fresh_exercise_for_pool_and_user,
)

router = APIRouter(prefix="/exercises", tags=["exercises"])

_HISTORY_EMPTY = (
    "Aucun exercice dans votre historique pour ces critères. "
    "Choisissez « Nouveau » pour en générer un, ou pratiquez d’abord avec un exercice neuf."
)


@router.post("/generate", response_model=ExerciseOut)
async def generate(body: GenerateExerciseRequest, db: DB, current_user: CurrentUser):
    if body.exercise_pool == "history":
        exercise = await pick_exercise_from_history(
            db=db,
            user_id=current_user.id,
            exam_type=body.exam_type,
            level=body.level,
            exercise_type=body.exercise_type,
            topic_id=body.topic_id,
        )
        if exercise is None:
            raise HTTPException(status_code=404, detail=_HISTORY_EMPTY)
        return exercise

    exercise = await generate_exercise(
        db=db,
        exam_type=body.exam_type,
        level=body.level,
        exercise_type=body.exercise_type,
        mode=body.mode,
        topic_id=body.topic_id,
        extra_context=body.context or "",
    )
    await register_fresh_exercise_for_pool_and_user(
        db=db,
        user_id=current_user.id,
        exercise=exercise,
        exam_type=body.exam_type,
        level=body.level,
        exercise_type=body.exercise_type,
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
