from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


class CreateSessionRequest(BaseModel):
    exam_type: str = "DELF"
    mode: str = "writing"
    level: str = "B1"


class SessionOut(BaseModel):
    id: UUID
    user_id: UUID
    exam_type: str
    mode: str
    level: str
    started_at: datetime
    ended_at: Optional[datetime]
    total_exercises: int
    correct_responses: int
    score_total: int

    class Config:
        from_attributes = True


class EndSessionRequest(BaseModel):
    session_id: UUID
