"""
Pydantic v2 schemas for the voice chat feature.
"""
from pydantic import BaseModel


class StartSessionRequest(BaseModel):
    exam_type: str | None = None
    level: str | None = None


class StartSessionResponse(BaseModel):
    session_id: str
    exam_type: str
    level: str
    topic: str
    greeting: str  # First agent message (already generated)


class ChatMessageRequest(BaseModel):
    user_message: str
    turn_number: int


class ChatMessageResponse(BaseModel):
    agent_message: str
    turn_number: int


class EndSessionResponse(BaseModel):
    session_id: str
    score: float
    overall_feedback: str
    grammar_errors: list[dict]
    vocabulary_suggestions: list[dict]
    strengths: list[str]
    improvements: list[str]
    transcript: list[dict]  # all turns


class VoiceSessionSummary(BaseModel):
    session_id: str
    exam_type: str
    level: str
    topic: str | None
    score: float | None
    created_at: str
    status: str
