from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel


class EvaluateRequest(BaseModel):
    exercise_id: UUID
    session_id: UUID
    response_content: str
    attempt_number: int = 1


class ErrorDetail(BaseModel):
    error_type: str
    severity: str
    original_text: str
    correction: str
    explanation: str


class NextStep(BaseModel):
    type: str
    description: str
    exercise_hint: Optional[str] = None


class EvaluationResult(BaseModel):
    response_id: UUID
    score: float
    overall_feedback: str
    strengths: List[str]
    improvements: List[str]
    errors: List[ErrorDetail]
    next_steps: List[NextStep]
    mlflow_run_id: Optional[str] = None


class EvaluateResponse(BaseModel):
    evaluation: EvaluationResult
    weaknesses_updated: bool
    skill_levels_updated: bool
