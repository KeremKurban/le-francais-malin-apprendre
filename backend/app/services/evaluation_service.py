"""
Response evaluation service.
Calls OpenAI API to evaluate user responses, stores errors, and logs to MLflow.
"""
import json
import re
import uuid
from typing import Dict, List

import mlflow
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import get_settings
from app.models.exercise import Exercise
from app.models.response import UserResponse
from app.models.error import ResponseError
from app.models.experiment_run import ExperimentRun
from app.prompts.evaluation_prompts import (
    EVALUATION_SYSTEM_PROMPT_V1,
    EVALUATION_USER_TEMPLATE_V1,
    PROMPT_VERSION,
)
from app.services.mlflow_service import mlflow_service

settings = get_settings()
client = AsyncOpenAI(
    api_key=settings.openrouter_api_key,
    base_url=settings.openrouter_base_url,
)


def _mlflow_log_safe(filename: str, text: str) -> None:
    """Log a text artifact to the active MLflow run, silently ignoring failures."""
    try:
        mlflow.log_text(text, filename)
    except Exception:
        pass


def _extract_json(text: str) -> dict:
    """Try several strategies to pull a JSON object out of a model response."""
    text = text.strip()
    # 1. Direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # 2. Fenced code block  ```json ... ``` or ``` ... ```
    fence = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if fence:
        try:
            return json.loads(fence.group(1))
        except json.JSONDecodeError:
            pass
    # 3. First { ... last }
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end > start:
        try:
            return json.loads(text[start : end + 1])
        except json.JSONDecodeError:
            pass
    raise ValueError(f"No valid JSON found in model response: {text[:200]!r}")


def _fallback_evaluation(raw: str) -> dict:
    """Return a minimal valid evaluation when the model ignores the JSON format."""
    feedback = raw.strip()[:800] if raw.strip() else "Évaluation non disponible."
    return {
        "score": 50,
        "overall_feedback": feedback,
        "strengths": [],
        "improvements": ["Le modèle n'a pas retourné une évaluation structurée. Réessayez."],
        "errors": [],
        "next_steps": [
            {"type": "retry", "description": "Soumettez à nouveau votre réponse.", "exercise_hint": None}
        ],
    }


async def evaluate_response(
    db: AsyncSession,
    exercise: Exercise,
    response: UserResponse,
) -> Dict:
    """Evaluate a user response with OpenAI and persist errors + MLflow run."""
    rubric_text = json.dumps(exercise.rubric, ensure_ascii=False, indent=2)

    user_message = EVALUATION_USER_TEMPLATE_V1.format(
        exercise_prompt=exercise.prompt,
        exercise_context=exercise.context or "Pas de contexte spécifique",
        rubric=rubric_text,
        level=exercise.level,
        exam_type=exercise.exam_type,
        user_response=response.content,
    )

    run_name = f"eval-{exercise.level}-{exercise.exam_type}-{PROMPT_VERSION}"
    params = {
        "exam_type": exercise.exam_type,
        "level": exercise.level,
        "exercise_type": exercise.exercise_type,
        "prompt_version": PROMPT_VERSION,
        "attempt_number": response.attempt_number,
    }

    result_holder: Dict = {}
    run_id = "no-mlflow-run"

    messages: List[Dict] = [
        {"role": "system", "content": EVALUATION_SYSTEM_PROMPT_V1},
        {"role": "user", "content": user_message},
    ]

    with mlflow_service.start_eval_run(
        run_name=run_name,
        prompt_version=PROMPT_VERSION,
        model_name=settings.openrouter_model,
        eval_type="response_evaluation",
        params=params,
    ) as (result_holder, run_id):
        # Log the full prompt so it's visible in the MLflow UI
        _mlflow_log_safe("prompt_messages.json", json.dumps(messages, ensure_ascii=False, indent=2))

        api_response = await client.chat.completions.create(
            model=settings.openrouter_model,
            max_tokens=2048,
            messages=messages,
        )

        content = api_response.choices[0].message.content
        if not content:
            finish_reason = api_response.choices[0].finish_reason
            raise ValueError(f"Model returned no text content (finish_reason={finish_reason!r}). Check OPENROUTER_MODEL and API key.")

        # Log the raw model response before any parsing
        _mlflow_log_safe("model_response_raw.txt", content)

        try:
            evaluation = _extract_json(content)
        except ValueError:
            print(f"[eval] JSON parse failed, using fallback. Raw response: {content[:300]!r}")
            evaluation = _fallback_evaluation(content)
        score = float(evaluation.get("score", 0))

        error_type_counts: Dict[str, int] = {}
        for err in evaluation.get("errors", []):
            et = err.get("error_type", "unknown")
            error_type_counts[et] = error_type_counts.get(et, 0) + 1

        result_holder["metrics"] = {
            "score": score,
            "error_count": len(evaluation.get("errors", [])),
            "strengths_count": len(evaluation.get("strengths", [])),
        }
        result_holder["artifacts"] = {
            "evaluation": evaluation,
            "request_params": params,
        }

    # Persist errors
    for err in evaluation.get("errors", []):
        db.add(
            ResponseError(
                response_id=response.id,
                user_id=response.user_id,
                topic_id=exercise.topic_id,
                error_type=err.get("error_type", "grammar"),
                severity=err.get("severity", "moderate"),
                original_text=err.get("original_text", ""),
                correction=err.get("correction", ""),
                explanation=err.get("explanation", ""),
            )
        )

    # Persist the MLflow run reference
    db.add(
        ExperimentRun(
            mlflow_run_id=run_id,
            experiment_name=settings.mlflow_experiment_name,
            prompt_version=PROMPT_VERSION,
            model_name=settings.openrouter_model,
            eval_type="response_evaluation",
            metrics=result_holder.get("metrics", {}),
            params=params,
        )
    )

    # Update response with evaluation data
    response.evaluation = evaluation
    response.score = score
    await db.flush()

    return {**evaluation, "mlflow_run_id": run_id, "error_type_counts": error_type_counts}
