import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from tests.conftest import register_and_login


EXERCISE_JSON = {
    "prompt": "Décrivez votre journée typique.",
    "context": "Production écrite B1",
    "expected_elements": ["présent", "routine", "opinion"],
    "rubric": {"grammar": "Présent correct", "vocabulary": "Varié"},
    "difficulty": "medium",
}


def _make_mock_response(content: str):
    msg = MagicMock()
    msg.content = content
    msg.finish_reason = "stop"
    choice = MagicMock()
    choice.message = msg
    choice.finish_reason = "stop"
    resp = MagicMock()
    resp.choices = [choice]
    return resp


@pytest.fixture
async def auth_headers(client):
    token = await register_and_login(client, "exercise_user@example.com")
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_generate_exercise_success(client, auth_headers):
    mock_resp = _make_mock_response(json.dumps(EXERCISE_JSON))

    with patch("app.services.exercise_service.client") as mock_client:
        mock_client.chat.completions.create = AsyncMock(return_value=mock_resp)
        resp = await client.post(
            "/api/v1/exercises/generate",
            json={"exam_type": "DELF", "level": "B1", "exercise_type": "writing_prompt", "mode": "writing"},
            headers=auth_headers,
        )

    assert resp.status_code == 200
    data = resp.json()
    assert data["prompt"] == EXERCISE_JSON["prompt"]
    assert data["level"] == "B1"
    assert data["exam_type"] == "DELF"
    assert data["exercise_type"] == "writing_prompt"


@pytest.mark.asyncio
async def test_generate_exercise_with_topic(client, auth_headers, db_session):
    from app.models.topic import Topic
    topic = Topic(name="La famille", description="La famille vocabulary topic", exam_type="DELF", level="A1", category="vocabulary", swiss_context=False)
    db_session.add(topic)
    await db_session.flush()

    mock_resp = _make_mock_response(json.dumps(EXERCISE_JSON))

    with patch("app.services.exercise_service.client") as mock_client:
        mock_client.chat.completions.create = AsyncMock(return_value=mock_resp)
        resp = await client.post(
            "/api/v1/exercises/generate",
            json={
                "exam_type": "DELF",
                "level": "A1",
                "exercise_type": "writing_prompt",
                "mode": "writing",
                "topic_id": str(topic.id),
            },
            headers=auth_headers,
        )

    assert resp.status_code == 200
    assert resp.json()["topic_id"] == str(topic.id)


@pytest.mark.asyncio
async def test_generate_exercise_json_in_code_fence(client, auth_headers):
    fenced = f"```json\n{json.dumps(EXERCISE_JSON)}\n```"
    mock_resp = _make_mock_response(fenced)

    with patch("app.services.exercise_service.client") as mock_client:
        mock_client.chat.completions.create = AsyncMock(return_value=mock_resp)
        resp = await client.post(
            "/api/v1/exercises/generate",
            json={"exam_type": "DELF", "level": "B1", "exercise_type": "writing_prompt", "mode": "writing"},
            headers=auth_headers,
        )

    assert resp.status_code == 200
    assert resp.json()["prompt"] == EXERCISE_JSON["prompt"]


@pytest.mark.asyncio
async def test_generate_exercise_requires_auth(client):
    resp = await client.post(
        "/api/v1/exercises/generate",
        json={"exam_type": "DELF", "level": "B1", "exercise_type": "writing_prompt", "mode": "writing"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_get_exercise_not_found(client, auth_headers):
    import uuid
    resp = await client.get(f"/api/v1/exercises/{uuid.uuid4()}", headers=auth_headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_generate_history_empty_returns_404(client, auth_headers):
    resp = await client.post(
        "/api/v1/exercises/generate",
        json={
            "exam_type": "DELF",
            "level": "B1",
            "exercise_type": "writing_prompt",
            "mode": "writing",
            "exercise_pool": "history",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_generate_history_returns_previous_fresh_exercise(client, auth_headers):
    mock_resp = _make_mock_response(json.dumps(EXERCISE_JSON))

    with patch("app.services.exercise_service.client") as mock_client:
        mock_client.chat.completions.create = AsyncMock(return_value=mock_resp)
        first = await client.post(
            "/api/v1/exercises/generate",
            json={
                "exam_type": "DELF",
                "level": "B1",
                "exercise_type": "writing_prompt",
                "mode": "writing",
                "exercise_pool": "fresh",
            },
            headers=auth_headers,
        )

    assert first.status_code == 200
    exercise_id = first.json()["id"]

    second = await client.post(
        "/api/v1/exercises/generate",
        json={
            "exam_type": "DELF",
            "level": "B1",
            "exercise_type": "writing_prompt",
            "mode": "writing",
            "exercise_pool": "history",
        },
        headers=auth_headers,
    )
    assert second.status_code == 200
    assert second.json()["id"] == exercise_id
