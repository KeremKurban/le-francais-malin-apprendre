import asyncio
import uuid
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.models.async_evaluation import AsyncEvaluation
from app.models.exercise import Exercise
from app.models.response import UserResponse
from app.models.session import LearningSession
from app.services.evaluation_service import evaluate_response
from app.services.weakness_service import update_weakness, update_skill_level
from app.services.recommendation_service import refresh_recommendations


async def run_evaluation_background(eval_id: uuid.UUID) -> None:
    """Background task: evaluate a user response and store results in AsyncEvaluation."""
    async with AsyncSessionLocal() as db:
        try:
            ae = (await db.execute(select(AsyncEvaluation).where(AsyncEvaluation.id == eval_id))).scalar_one()
            ae.status = "running"
            ae.started_at = datetime.now(timezone.utc)
            await db.flush()

            exercise = await db.get(Exercise, ae.exercise_id)
            response = await db.get(UserResponse, ae.response_id)
            session = await db.get(LearningSession, ae.session_id)

            eval_data = await evaluate_response(db, exercise, response)

            session.total_exercises += 1
            session.score_total += int(eval_data["score"])
            if eval_data["score"] >= 70:
                session.correct_responses += 1

            error_type_counts = eval_data.get("error_type_counts", {})
            await update_weakness(db, ae.user_id, exercise.topic_id, error_type_counts)
            await update_skill_level(db, ae.user_id, "writing", eval_data["score"])
            await update_skill_level(db, ae.user_id, "grammar", max(0, 100 - sum(
                v for k, v in error_type_counts.items() if k in ("grammar", "conjugation", "syntax")
            ) * 10))
            await refresh_recommendations(db, ae.user_id)

            # Store result (drop error_type_counts from public result)
            result = {k: v for k, v in eval_data.items() if k != "error_type_counts"}
            ae.result = result
            ae.status = "done"
            ae.completed_at = datetime.now(timezone.utc)
            await db.commit()

        except Exception as e:
            await db.rollback()
            async with AsyncSessionLocal() as db2:
                ae2 = await db2.get(AsyncEvaluation, eval_id)
                if ae2:
                    ae2.status = "failed"
                    ae2.error_message = str(e)[:500]
                    await db2.commit()


def log_task_error(task: asyncio.Task) -> None:
    if not task.cancelled():
        exc = task.exception()
        if exc:
            print(f"[async_eval] unhandled task error: {exc}")
