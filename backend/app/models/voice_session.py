import uuid
from datetime import datetime, timezone
from sqlalchemy import String, JSON, Enum as SAEnum, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base


class VoiceSession(Base):
    __tablename__ = "voice_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = mapped_column(SAEnum("active", "completed", name="voice_session_status"), default="active")
    exam_type: Mapped[str] = mapped_column(String(20), nullable=False)  # FIDE or DELF
    level: Mapped[str] = mapped_column(String(10), nullable=False)       # A1/A2/B1/B2
    topic_chosen: Mapped[str] = mapped_column(String(200), nullable=True)
    turns: Mapped[list] = mapped_column(JSON, default=list)              # [{role, content, ts}]
    summary: Mapped[str] = mapped_column(Text, nullable=True)            # stored for future sessions
    feedback: Mapped[dict] = mapped_column(JSON, nullable=True)          # structured feedback
    score: Mapped[float] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    ended_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship(back_populates="voice_sessions")  # noqa: F821
