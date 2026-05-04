from typing import Optional, Literal
from uuid import UUID
from pydantic import BaseModel


class GenerateExerciseRequest(BaseModel):
    topic_id: Optional[UUID] = None
    exam_type: str = "DELF"
    level: str = "B1"
    exercise_type: str = "writing_prompt"
    mode: str = "writing"
    context: Optional[str] = None
    #: ``fresh`` = new LLM generation (stored for reuse across users). ``history`` = recycle an exercise this user already saw.
    exercise_pool: Literal["fresh", "history"] = "fresh"


class ExerciseOut(BaseModel):
    id: UUID
    topic_id: UUID
    level: str
    exam_type: str
    exercise_type: str
    mode: str
    prompt: str
    context: str
    rubric: dict
    prompt_version: str
    difficulty: str
    content: dict | None = None

    class Config:
        from_attributes = True
