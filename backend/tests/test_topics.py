import pytest
from tests.conftest import register_and_login


@pytest.fixture
async def auth_headers(client):
    token = await register_and_login(client, "topics_user@example.com")
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_list_topics_empty(client, auth_headers):
    resp = await client.get("/api/v1/topics", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "topics" in data
    assert "total" in data
    assert isinstance(data["topics"], list)


@pytest.mark.asyncio
async def test_list_topics_requires_auth(client):
    resp = await client.get("/api/v1/topics")
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_list_topics_filter_exam_type(client, auth_headers, db_session):
    from app.models.topic import Topic
    db_session.add(Topic(name="FIDE topic", description="FIDE communication topic", exam_type="FIDE", level=None, category="communication", swiss_context=True))
    db_session.add(Topic(name="DELF topic", description="DELF grammar topic", exam_type="DELF", level="B1", category="grammar", swiss_context=False))
    await db_session.flush()

    fide = await client.get("/api/v1/topics?exam_type=FIDE", headers=auth_headers)
    assert fide.status_code == 200
    names = [t["name"] for t in fide.json()["topics"]]
    assert "FIDE topic" in names
    assert "DELF topic" not in names

    delf = await client.get("/api/v1/topics?exam_type=DELF", headers=auth_headers)
    assert delf.status_code == 200
    names = [t["name"] for t in delf.json()["topics"]]
    assert "DELF topic" in names
    assert "FIDE topic" not in names


@pytest.mark.asyncio
async def test_list_topics_filter_level(client, auth_headers, db_session):
    from app.models.topic import Topic
    db_session.add(Topic(name="A1 topic", description="A1 vocabulary topic", exam_type="DELF", level="A1", category="vocabulary", swiss_context=False))
    db_session.add(Topic(name="B2 topic", description="B2 writing topic", exam_type="DELF", level="B2", category="writing", swiss_context=False))
    await db_session.flush()

    resp = await client.get("/api/v1/topics?exam_type=DELF&level=A1", headers=auth_headers)
    assert resp.status_code == 200
    names = [t["name"] for t in resp.json()["topics"]]
    assert "A1 topic" in names
    assert "B2 topic" not in names


@pytest.mark.asyncio
async def test_get_topic_not_found(client, auth_headers):
    import uuid
    resp = await client.get(f"/api/v1/topics/{uuid.uuid4()}", headers=auth_headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_get_topic_by_id(client, auth_headers, db_session):
    from app.models.topic import Topic
    topic = Topic(name="Specific topic", description="Specific communication topic", exam_type="DELF", level="B1", category="communication", swiss_context=False)
    db_session.add(topic)
    await db_session.flush()

    resp = await client.get(f"/api/v1/topics/{topic.id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["name"] == "Specific topic"
