"""
Exercise generation service.
Calls OpenAI API with a versioned prompt and returns a structured exercise.
"""
import json
import re
import uuid
from typing import Optional

from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import get_settings
from app.models.exercise import Exercise
from app.models.topic import Topic
from app.prompts.exercise_prompts import (
    EXERCISE_SYSTEM_PROMPT_V1,
    EXERCISE_USER_TEMPLATE_V1,
    PROMPT_VERSION,
)

settings = get_settings()
client = AsyncOpenAI(
    api_key=settings.openrouter_api_key,
    base_url=settings.openrouter_base_url,
)


def _extract_json(text: str) -> dict:
    """Try several strategies to pull a JSON object out of a model response."""
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    fence = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if fence:
        try:
            return json.loads(fence.group(1))
        except json.JSONDecodeError:
            pass
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end > start:
        try:
            return json.loads(text[start : end + 1])
        except json.JSONDecodeError:
            pass
    raise ValueError(f"No valid JSON found in model response: {text[:200]!r}")


async def generate_exercise(
    db: AsyncSession,
    exam_type: str,
    level: str,
    exercise_type: str,
    mode: str,
    topic_id: Optional[uuid.UUID] = None,
    extra_context: str = "",
) -> Exercise:
    """Generate an exercise via OpenAI API and persist it."""
    topic = await _resolve_topic(db, topic_id, exam_type, level)

    user_message = EXERCISE_USER_TEMPLATE_V1.format(
        exam_type=exam_type,
        level=level,
        topic_name=topic.name,
        category=topic.category,
        exercise_type=exercise_type,
        mode=mode,
        extra_context=extra_context or "Aucun contexte supplémentaire",
    )

    response = await client.chat.completions.create(
        model=settings.openrouter_model,
        max_tokens=2048,
        messages=[
            {"role": "system", "content": EXERCISE_SYSTEM_PROMPT_V1},
            {"role": "user", "content": user_message},
        ],
    )

    content = response.choices[0].message.content
    if not content:
        finish_reason = response.choices[0].finish_reason
        raise ValueError(f"Model returned no text content (finish_reason={finish_reason!r}). Check OPENROUTER_MODEL and API key.")

    data = _extract_json(content)

    exercise = Exercise(
        topic_id=topic.id,
        level=level,
        exam_type=exam_type,
        exercise_type=exercise_type,
        mode=mode,
        prompt=data["prompt"],
        context=data.get("context", ""),
        expected_elements=data.get("expected_elements", []),
        rubric=data.get("rubric", {}),
        prompt_version=PROMPT_VERSION,
        difficulty=data.get("difficulty", "medium"),
    )
    db.add(exercise)
    await db.flush()
    return exercise


async def _resolve_topic(
    db: AsyncSession,
    topic_id: Optional[uuid.UUID],
    exam_type: str,
    level: str,
) -> Topic:
    if topic_id:
        result = await db.execute(select(Topic).where(Topic.id == topic_id))
        topic = result.scalar_one_or_none()
        if topic:
            return topic

    # For FIDE, topics have no level — don't filter by level
    if exam_type == "FIDE":
        result = await db.execute(
            select(Topic).where(Topic.exam_type.in_(["FIDE", "BOTH"])).limit(1)
        )
    else:
        result = await db.execute(
            select(Topic).where(
                Topic.exam_type.in_([exam_type, "BOTH"]),
                Topic.level == level,
            ).limit(1)
        )
    topic = result.scalar_one_or_none()

    if not topic:
        result = await db.execute(select(Topic).limit(1))
        topic = result.scalar_one_or_none()

    if not topic:
        topic = Topic(
            name="Expression écrite",
            description="Exercice général de production écrite",
            exam_type=exam_type,
            level=level,
            category="writing",
        )
        db.add(topic)
        await db.flush()

    return topic
