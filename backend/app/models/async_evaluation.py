import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import JSON
from app.core.database import Base


class AsyncEvaluation(Base):
    __tablename__ = "async_evaluations"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("learning_sessions.id"))
    exercise_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("exercises.id"))
    response_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("user_responses.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending/running/done/failed
    response_content: Mapped[str] = mapped_column(Text)
    attempt_number: Mapped[int] = mapped_column(default=1)
    result: Mapped[dict] = mapped_column(JSON, default=dict)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
