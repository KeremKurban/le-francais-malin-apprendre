from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.core.deps import DB, CurrentUser
from app.models.exercise import Exercise
from app.models.response import UserResponse
from app.models.session import LearningSession
from app.schemas.evaluation import EvaluateRequest, EvaluateResponse, EvaluationResult, ErrorDetail, NextStep
from app.services.evaluation_service import evaluate_response
from app.services.weakness_service import update_weakness, update_skill_level
from app.services.recommendation_service import refresh_recommendations

router = APIRouter(prefix="/evaluations", tags=["evaluations"])


@router.post("/evaluate", response_model=EvaluateResponse)
async def evaluate(body: EvaluateRequest, db: DB, current_user: CurrentUser):
    # Load exercise
    result = await db.execute(select(Exercise).where(Exercise.id == body.exercise_id))
    exercise = result.scalar_one_or_none()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    # Load session
    result = await db.execute(
        select(LearningSession).where(
            LearningSession.id == body.session_id,
            LearningSession.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Persist the raw response first
    response = UserResponse(
        exercise_id=exercise.id,
        session_id=session.id,
        user_id=current_user.id,
        content=body.response_content,
        attempt_number=body.attempt_number,
    )
    db.add(response)
    await db.flush()

    # Evaluate with Claude + MLflow
    eval_data = await evaluate_response(db, exercise, response)

    # Update session stats
    session.total_exercises += 1
    session.score_total += int(eval_data["score"])
    if eval_data["score"] >= 70:
        session.correct_responses += 1

    # Update weakness + skill level tracking
    error_type_counts = eval_data.get("error_type_counts", {})
    await update_weakness(db, current_user.id, exercise.topic_id, error_type_counts)
    await update_skill_level(db, current_user.id, "writing", eval_data["score"])
    await update_skill_level(db, current_user.id, "grammar", 100 - sum(
        v for k, v in error_type_counts.items() if k in ("grammar", "conjugation", "syntax")
    ) * 10)

    await refresh_recommendations(db, current_user.id)

    return EvaluateResponse(
        evaluation=EvaluationResult(
            response_id=response.id,
            score=eval_data["score"],
            overall_feedback=eval_data.get("overall_feedback", ""),
            strengths=eval_data.get("strengths", []),
            improvements=eval_data.get("improvements", []),
            errors=[
                ErrorDetail(
                    error_type=e["error_type"],
                    severity=e["severity"],
                    original_text=e["original_text"],
                    correction=e["correction"],
                    explanation=e["explanation"],
                )
                for e in eval_data.get("errors", [])
            ],
            next_steps=[
                NextStep(
                    type=ns["type"],
                    description=ns["description"],
                    exercise_hint=ns.get("exercise_hint"),
                )
                for ns in eval_data.get("next_steps", [])
            ],
            mlflow_run_id=eval_data.get("mlflow_run_id"),
        ),
        weaknesses_updated=bool(error_type_counts),
        skill_levels_updated=True,
    )
