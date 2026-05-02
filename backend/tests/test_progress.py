import pytest
from tests.conftest import register_and_login


@pytest.fixture
async def auth_headers(client):
    token = await register_and_login(client, "progress_user@example.com")
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_dashboard_empty(client, auth_headers):
    resp = await client.get("/api/v1/progress/dashboard", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_sessions"] == 0
    assert data["total_responses"] == 0
    assert data["average_score"] == 0
    assert isinstance(data["skill_levels"], list)
    assert isinstance(data["top_weaknesses"], list)
    assert isinstance(data["recommendations"], list)


@pytest.mark.asyncio
async def test_weaknesses_empty(client, auth_headers):
    resp = await client.get("/api/v1/progress/weaknesses", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_recommendations_empty(client, auth_headers):
    resp = await client.get("/api/v1/progress/recommendations", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_dashboard_requires_auth(client):
    resp = await client.get("/api/v1/progress/dashboard")
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_dashboard_reflects_sessions(client, auth_headers):
    await client.post(
        "/api/v1/sessions",
        json={"exam_type": "DELF", "mode": "writing", "level": "B1"},
        headers=auth_headers,
    )
    resp = await client.get("/api/v1/progress/dashboard", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["total_sessions"] >= 1
