import pytest


@pytest.mark.asyncio
async def test_register_and_login(client):
    reg = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "username": "testuser",
            "password": "securepassword",
            "target_exam": "DELF",
            "target_level": "B1",
        },
    )
    assert reg.status_code == 201
    token = reg.json()["access_token"]
    assert token

    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "securepassword"},
    )
    assert login.status_code == 200
    assert login.json()["access_token"]

    me = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == "test@example.com"


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    await client.post(
        "/api/v1/auth/register",
        json={"email": "wrong@example.com", "username": "wronguser", "password": "correct"},
    )
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "wrong@example.com", "password": "incorrect"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me_unauthenticated(client):
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 403
