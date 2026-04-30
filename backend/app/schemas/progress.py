from typing import List, Dict, Optional
from uuid import UUID
from pydantic import BaseModel


class SkillLevelOut(BaseModel):
    skill: str
    estimated_level: str
    confidence: float
    score_history: float

    class Config:
        from_attributes = True


class WeaknessOut(BaseModel):
    topic_id: UUID
    topic_name: str
    error_count: int
    severity: str
    error_type_counts: Dict[str, int]
    last_seen: str


class RecommendationOut(BaseModel):
    id: UUID
    topic_id: UUID
    topic_name: str
    priority: int
    reason: str
    exercise_type: str


class DashboardResponse(BaseModel):
    total_sessions: int
    total_exercises: int
    total_responses: int
    average_score: float
    skill_levels: List[SkillLevelOut]
    top_weaknesses: List[WeaknessOut]
    recommendations: List[RecommendationOut]
    recent_scores: List[float]
    streak_days: int
