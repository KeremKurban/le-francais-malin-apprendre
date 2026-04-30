import pytest


async def _get_token(client):
    await client.post(
        "/api/v1/auth/register",
        json={"email": "session@example.com", "username": "sessionuser", "password": "pass"},
    )
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "session@example.com", "password": "pass"},
    )
    return resp.json()["access_token"]


@pytest.mark.asyncio
async def test_create_and_list_session(client):
    token = await _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    create = await client.post(
        "/api/v1/sessions",
        json={"exam_type": "DELF", "mode": "writing", "level": "B1"},
        headers=headers,
    )
    assert create.status_code == 201
    session_id = create.json()["id"]

    lst = await client.get("/api/v1/sessions", headers=headers)
    assert lst.status_code == 200
    assert any(s["id"] == session_id for s in lst.json())


@pytest.mark.asyncio
async def test_end_session(client):
    token = await _get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    create = await client.post(
        "/api/v1/sessions",
        json={"exam_type": "FIDE", "mode": "writing", "level": "B1"},
        headers=headers,
    )
    session_id = create.json()["id"]

    end = await client.patch(f"/api/v1/sessions/{session_id}/end", headers=headers)
    assert end.status_code == 200
    assert end.json()["ended_at"] is not None
