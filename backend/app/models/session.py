import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import String, Integer, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class LearningSession(Base):
    __tablename__ = "learning_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    exam_type: Mapped[str] = mapped_column(
        SAEnum("FIDE", "DELF", "BOTH", name="session_exam_enum"), nullable=False
    )
    mode: Mapped[str] = mapped_column(
        SAEnum("writing", "speaking", "mock_exam", name="session_mode_enum"), default="writing"
    )
    level: Mapped[str] = mapped_column(
        SAEnum("A1", "A2", "B1", "B2", name="session_level_enum"), nullable=False
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    total_exercises: Mapped[int] = mapped_column(Integer, default=0)
    correct_responses: Mapped[int] = mapped_column(Integer, default=0)
    score_total: Mapped[int] = mapped_column(Integer, default=0)

    user: Mapped["User"] = relationship(back_populates="sessions")  # noqa: F821
    responses: Mapped[list["UserResponse"]] = relationship(back_populates="session")  # noqa: F821
