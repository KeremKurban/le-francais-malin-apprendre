from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field


class GenerateExerciseRequest(BaseModel):
    topic_id: Optional[UUID] = None
    exam_type: str = "DELF"
    level: str = "B1"
    exercise_type: str = "writing_prompt"
    mode: str = "writing"
    context: Optional[str] = None
    use_cache: bool = True


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
