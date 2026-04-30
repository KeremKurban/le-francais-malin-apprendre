from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel


class TopicOut(BaseModel):
    id: UUID
    name: str
    description: str
    exam_type: str
    level: Optional[str]
    category: str
    swiss_context: bool
    parent_id: Optional[UUID]

    class Config:
        from_attributes = True


class TopicListResponse(BaseModel):
    topics: List[TopicOut]
    total: int
