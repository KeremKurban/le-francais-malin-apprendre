from typing import Optional

from fastapi import APIRouter, Query
from sqlalchemy import select

from app.core.deps import DB, CurrentUser
from app.models.topic import Topic
from app.schemas.topic import TopicOut, TopicListResponse

router = APIRouter(prefix="/topics", tags=["topics"])


@router.get("", response_model=TopicListResponse)
async def list_topics(
    db: DB,
    _: CurrentUser,
    exam_type: Optional[str] = Query(None),
    level: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
):
    query = select(Topic)
    if exam_type:
        query = query.where(Topic.exam_type.in_([exam_type, "BOTH"]))
    if level:
        query = query.where(Topic.level == level)
    if category:
        query = query.where(Topic.category == category)

    result = await db.execute(query.order_by(Topic.name))
    topics = result.scalars().all()
    return TopicListResponse(topics=topics, total=len(topics))


@router.get("/{topic_id}", response_model=TopicOut)
async def get_topic(topic_id: str, db: DB, _: CurrentUser):
    from uuid import UUID
    result = await db.execute(select(Topic).where(Topic.id == UUID(topic_id)))
    topic = result.scalar_one_or_none()
    if not topic:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic
