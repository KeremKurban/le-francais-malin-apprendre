import json
import uuid
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from tests.conftest import register_and_login


EXERCISE_JSON = {
    "prompt": "Écrivez un email à votre médecin.",
    "context": "Communication formelle",
    "expected_elements": ["formule de politesse"],
    "rubric": {"grammar": "Accord correct"},
    "difficulty": "medium",
}

EVAL_JSON = {
    "score": 78,
    "overall_feedback": "Bonne réponse avec quelques erreurs mineures.",
    "strengths": ["Structure claire", "Vocabulaire approprié"],
    "improvements": ["Attention aux accents"],
    "errors": [
        {
            "error_type": "spelling",
            "severity": "minor",
            "original_text": "medecin",
            "correction": "médecin",
            "explanation": "Accent manquant sur le premier e.",
        }
    ],
    "next_steps": [
        {"type": "retry", "description": "Réessayez en corrigeant les accents.", "exercise_hint": None}
    ],
}


def _make_mock_response(content: str):
    msg = MagicMock()
    msg.content = content
    choice = MagicMock()
    choice.message = msg
    choice.finish_reason = "stop"
    resp = MagicMock()
    resp.choices = [choice]
    return resp


async def _create_exercise(client, headers, db_session):
    from app.models.topic import Topic
    topic = Topic(
        name=f"Eval topic {uuid.uuid4().hex[:6]}",
        description="Evaluation communication topic",
        exam_type="DELF",
        level="B1",
        category="communication",
        swiss_context=False,
    )
    db_session.add(topic)
    await db_session.flush()

    with patch("app.services.exercise_service.client") as mock_client:
        mock_client.chat.completions.create = AsyncMock(
            return_value=_make_mock_response(json.dumps(EXERCISE_JSON))
        )
        resp = await client.post(
            "/api/v1/exercises/generate",
            json={"exam_type": "DELF", "level": "B1", "exercise_type": "writing_prompt", "mode": "writing"},
            headers=headers,
        )
    return resp.json()["id"]


@pytest.fixture
async def auth_headers(client):
    token = await register_and_login(client, "eval_user@example.com")
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_evaluate_response_success(client, auth_headers, db_session):
    exercise_id = await _create_exercise(client, auth_headers, db_session)

    session_resp = await client.post(
        "/api/v1/sessions",
        json={"exam_type": "DELF", "mode": "writing", "level": "B1"},
        headers=auth_headers,
    )
    session_id = session_resp.json()["id"]

    with patch("app.services.evaluation_service.client") as mock_client:
        mock_client.chat.completions.create = AsyncMock(
            return_value=_make_mock_response(json.dumps(EVAL_JSON))
        )
        resp = await client.post(
            "/api/v1/evaluations/evaluate",
            json={
                "exercise_id": exercise_id,
                "session_id": session_id,
                "response_content": "Je voudrais prendre un rendez-vous avec le medecin.",
                "attempt_number": 1,
            },
            headers=auth_headers,
        )

    assert resp.status_code == 200
    data = resp.json()
    assert data["evaluation"]["score"] == 78
    assert len(data["evaluation"]["errors"]) == 1
    assert data["evaluation"]["errors"][0]["error_type"] == "spelling"
    assert data["skill_levels_updated"] is True


@pytest.mark.asyncio
async def test_evaluate_response_wrong_session(client, auth_headers, db_session):
    exercise_id = await _create_exercise(client, auth_headers, db_session)

    with patch("app.services.evaluation_service.client") as mock_client:
        mock_client.chat.completions.create = AsyncMock(
            return_value=_make_mock_response(json.dumps(EVAL_JSON))
        )
        resp = await client.post(
            "/api/v1/evaluations/evaluate",
            json={
                "exercise_id": exercise_id,
                "session_id": str(uuid.uuid4()),
                "response_content": "Une réponse.",
                "attempt_number": 1,
            },
            headers=auth_headers,
        )

    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_evaluate_requires_auth(client):
    resp = await client.post(
        "/api/v1/evaluations/evaluate",
        json={
            "exercise_id": str(uuid.uuid4()),
            "session_id": str(uuid.uuid4()),
            "response_content": "test",
            "attempt_number": 1,
        },
    )
    assert resp.status_code == 403
