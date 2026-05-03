import asyncio
from uuid import UUID

from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.core.deps import DB, CurrentUser
from app.models.async_evaluation import AsyncEvaluation
from app.models.exercise import Exercise
from app.models.response import UserResponse
from app.models.session import LearningSession
from app.schemas.evaluation import (
    EvaluateRequest, EvaluateResponse, EvaluationResult, ErrorDetail, NextStep,
    AsyncEvaluationAccepted, AsyncEvaluationStatus,
)
from app.services.async_eval_service import run_evaluation_background, log_task_error
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


@router.post("/evaluate-async", response_model=AsyncEvaluationAccepted, status_code=202)
async def evaluate_async_endpoint(body: EvaluateRequest, db: DB, current_user: CurrentUser):
    # validate exercise exists
    exercise = (await db.execute(select(Exercise).where(Exercise.id == body.exercise_id))).scalar_one_or_none()
    if not exercise:
        raise HTTPException(404, "Exercise not found")
    session = (await db.execute(
        select(LearningSession).where(LearningSession.id == body.session_id, LearningSession.user_id == current_user.id)
    )).scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Session not found")

    response = UserResponse(
        exercise_id=exercise.id, session_id=session.id, user_id=current_user.id,
        content=body.response_content, attempt_number=body.attempt_number,
    )
    db.add(response)
    await db.flush()

    ae = AsyncEvaluation(
        user_id=current_user.id, session_id=session.id,
        exercise_id=exercise.id, response_id=response.id,
        response_content=body.response_content, attempt_number=body.attempt_number,
    )
    db.add(ae)
    await db.flush()
    eval_id = ae.id

    task = asyncio.create_task(run_evaluation_background(eval_id))
    task.add_done_callback(log_task_error)

    return AsyncEvaluationAccepted(evaluation_id=eval_id, response_id=response.id)


@router.get("/{evaluation_id}", response_model=AsyncEvaluationStatus)
async def get_evaluation_status(evaluation_id: UUID, db: DB, current_user: CurrentUser):
    ae = (await db.execute(
        select(AsyncEvaluation).where(AsyncEvaluation.id == evaluation_id, AsyncEvaluation.user_id == current_user.id)
    )).scalar_one_or_none()
    if not ae:
        raise HTTPException(404, "Evaluation not found")
    return AsyncEvaluationStatus(
        evaluation_id=ae.id, response_id=ae.response_id,
        status=ae.status, result=ae.result if ae.result else None,
        error_message=ae.error_message,
        created_at=ae.created_at, completed_at=ae.completed_at,
    )
