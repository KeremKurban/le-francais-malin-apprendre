"""
Tests for the async evaluation pipeline and exercise cache endpoints.
"""
import json
import uuid
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from tests.conftest import register_and_login


EXERCISE_JSON = {
    "prompt": "Décrivez votre quartier en quelques phrases.",
    "context": "Production écrite",
    "expected_elements": ["description", "adjectifs"],
    "rubric": {"grammar": "Accords corrects"},
    "difficulty": "medium",
}

EVAL_JSON = {
    "score": 72,
    "overall_feedback": "Bonne description avec quelques erreurs.",
    "strengths": ["Vocabulaire riche"],
    "improvements": ["Attention aux accords"],
    "errors": [],
    "next_steps": [
        {"type": "retry", "description": "Réessayez.", "exercise_hint": None}
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


async def _create_exercise_and_session(client, headers, db_session):
    """Helper: create a topic, generate an exercise, and start a session."""
    from app.models.topic import Topic

    topic = Topic(
        name=f"Cache topic {uuid.uuid4().hex[:6]}",
        description="Test topic for cache/async",
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
        ex_resp = await client.post(
            "/api/v1/exercises/generate",
            json={
                "exam_type": "DELF",
                "level": "B1",
                "exercise_type": "writing_prompt",
                "mode": "writing",
                "exercise_pool": "fresh",
            },
            headers=headers,
        )
    exercise_id = ex_resp.json()["id"]

    sess_resp = await client.post(
        "/api/v1/sessions",
        json={"exam_type": "DELF", "mode": "writing", "level": "B1"},
        headers=headers,
    )
    session_id = sess_resp.json()["id"]

    return exercise_id, session_id


@pytest.fixture
async def auth_headers(client):
    token = await register_and_login(client, "cache_async_user@example.com")
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_evaluate_async_returns_202(client, auth_headers, db_session):
    """POST /evaluate-async with valid data should return 202 and an evaluation_id."""
    exercise_id, session_id = await _create_exercise_and_session(client, auth_headers, db_session)

    with patch("app.services.evaluation_service.client") as mock_eval:
        mock_eval.chat.completions.create = AsyncMock(
            return_value=_make_mock_response(json.dumps(EVAL_JSON))
        )
        with patch("app.api.routes.evaluations.asyncio.create_task") as mock_task:
            mock_task.return_value = MagicMock()
            resp = await client.post(
                "/api/v1/evaluations/evaluate-async",
                json={
                    "exercise_id": exercise_id,
                    "session_id": session_id,
                    "response_content": "Mon quartier est très calme et agréable.",
                    "attempt_number": 1,
                },
                headers=auth_headers,
            )

    assert resp.status_code == 202
    data = resp.json()
    assert "evaluation_id" in data
    assert "response_id" in data
    # Validate UUIDs
    uuid.UUID(data["evaluation_id"])
    uuid.UUID(data["response_id"])


@pytest.mark.asyncio
async def test_get_evaluation_status_pending(client, auth_headers, db_session):
    """GET /evaluations/{id} should return 'pending' or 'running' for a freshly created eval."""
    exercise_id, session_id = await _create_exercise_and_session(client, auth_headers, db_session)

    # Create the async eval (suppress actual background task)
    with patch("app.api.routes.evaluations.asyncio.create_task") as mock_task:
        mock_task.return_value = MagicMock()
        create_resp = await client.post(
            "/api/v1/evaluations/evaluate-async",
            json={
                "exercise_id": exercise_id,
                "session_id": session_id,
                "response_content": "Une réponse de test.",
                "attempt_number": 1,
            },
            headers=auth_headers,
        )

    assert create_resp.status_code == 202
    evaluation_id = create_resp.json()["evaluation_id"]

    # Poll status
    status_resp = await client.get(
        f"/api/v1/evaluations/{evaluation_id}",
        headers=auth_headers,
    )
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["status"] in ("pending", "running", "done", "failed")
    assert status_data["evaluation_id"] == evaluation_id


@pytest.mark.asyncio
async def test_evaluate_async_requires_auth(client):
    """POST /evaluate-async without auth should return 403."""
    resp = await client.post(
        "/api/v1/evaluations/evaluate-async",
        json={
            "exercise_id": str(uuid.uuid4()),
            "session_id": str(uuid.uuid4()),
            "response_content": "test",
            "attempt_number": 1,
        },
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_evaluate_async_invalid_session(client, auth_headers, db_session):
    """POST /evaluate-async with a non-existent session_id should return 404."""
    exercise_id, _ = await _create_exercise_and_session(client, auth_headers, db_session)

    resp = await client.post(
        "/api/v1/evaluations/evaluate-async",
        json={
            "exercise_id": exercise_id,
            "session_id": str(uuid.uuid4()),  # random, non-existent session
            "response_content": "Une réponse.",
            "attempt_number": 1,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 404
