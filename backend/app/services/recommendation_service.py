"""
Generates review recommendations based on user weaknesses.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.models.weakness import Weakness
from app.models.recommendation import ReviewRecommendation

EXERCISE_TYPE_MAP = {
    "grammar": "grammar_correction",
    "vocabulary": "writing_prompt",
    "spelling": "fill_blank",
    "syntax": "writing_prompt",
    "register": "role_play",
    "conjugation": "fill_blank",
}


async def refresh_recommendations(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> None:
    """Rebuild top-5 recommendations from current weaknesses."""
    await db.execute(
        delete(ReviewRecommendation).where(
            ReviewRecommendation.user_id == user_id,
            ReviewRecommendation.completed_at.is_(None),
        )
    )

    result = await db.execute(
        select(Weakness)
        .where(Weakness.user_id == user_id)
        .order_by(Weakness.error_count.desc())
        .limit(5)
    )
    weaknesses = result.scalars().all()

    for idx, weakness in enumerate(weaknesses):
        dominant_error = _dominant_error_type(weakness.error_type_counts)
        exercise_type = EXERCISE_TYPE_MAP.get(dominant_error, "writing_prompt")
        reason = (
            f"Vous avez fait {weakness.error_count} erreur(s) de type '{dominant_error}' "
            f"sur ce sujet. Entraînez-vous avec un exercice de type '{exercise_type}'."
        )
        db.add(
            ReviewRecommendation(
                user_id=user_id,
                topic_id=weakness.topic_id,
                priority=idx + 1,
                reason=reason,
                exercise_type=exercise_type,
            )
        )

    await db.flush()


def _dominant_error_type(counts: dict) -> str:
    if not counts:
        return "grammar"
    return max(counts, key=lambda k: counts[k])
