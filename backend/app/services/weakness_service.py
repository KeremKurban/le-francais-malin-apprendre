"""
Weakness and skill-level tracking.
Called after each evaluation to update the user's memory model.
"""
import uuid
from datetime import datetime, timezone
from typing import Dict

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.weakness import Weakness
from app.models.skill_level import SkillLevel

SEVERITY_THRESHOLDS = {"low": 3, "medium": 7}

SKILL_SCORE_TO_LEVEL = {
    (85, 101): "B2",
    (70, 85): "B1",
    (55, 70): "A2",
    (0, 55): "A1",
}


async def update_weakness(
    db: AsyncSession,
    user_id: uuid.UUID,
    topic_id: uuid.UUID,
    error_type_counts: Dict[str, int],
) -> None:
    result = await db.execute(
        select(Weakness).where(
            Weakness.user_id == user_id,
            Weakness.topic_id == topic_id,
        )
    )
    weakness = result.scalar_one_or_none()

    total_errors = sum(error_type_counts.values())
    if not total_errors:
        return

    if weakness:
        weakness.error_count += total_errors
        merged = dict(weakness.error_type_counts)
        for k, v in error_type_counts.items():
            merged[k] = merged.get(k, 0) + v
        weakness.error_type_counts = merged
        weakness.last_seen = datetime.now(timezone.utc)
        weakness.severity = _compute_severity(weakness.error_count)
    else:
        weakness = Weakness(
            user_id=user_id,
            topic_id=topic_id,
            error_count=total_errors,
            error_type_counts=error_type_counts,
            severity=_compute_severity(total_errors),
        )
        db.add(weakness)

    await db.flush()


async def update_skill_level(
    db: AsyncSession,
    user_id: uuid.UUID,
    skill: str,
    new_score: float,
) -> None:
    result = await db.execute(
        select(SkillLevel).where(
            SkillLevel.user_id == user_id,
            SkillLevel.skill == skill,
        )
    )
    skill_level = result.scalar_one_or_none()

    if skill_level:
        # Exponential moving average (α=0.3) for smooth convergence
        alpha = 0.3
        updated_score = alpha * new_score + (1 - alpha) * skill_level.score_history
        skill_level.score_history = updated_score
        skill_level.estimated_level = _score_to_level(updated_score)
        skill_level.confidence = min(skill_level.confidence + 0.05, 1.0)
        skill_level.updated_at = datetime.now(timezone.utc)
    else:
        skill_level = SkillLevel(
            user_id=user_id,
            skill=skill,
            score_history=new_score,
            estimated_level=_score_to_level(new_score),
            confidence=0.3,
        )
        db.add(skill_level)

    await db.flush()


def _compute_severity(error_count: int) -> str:
    if error_count <= SEVERITY_THRESHOLDS["low"]:
        return "low"
    if error_count <= SEVERITY_THRESHOLDS["medium"]:
        return "medium"
    return "high"


def _score_to_level(score: float) -> str:
    for (low, high), level in SKILL_SCORE_TO_LEVEL.items():
        if low <= score < high:
            return level
    return "A2"
