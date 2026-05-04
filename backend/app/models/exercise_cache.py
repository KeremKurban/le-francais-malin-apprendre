import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy import String, Boolean, Integer, DateTime, UniqueConstraint, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class ExerciseCache(Base):
    __tablename__ = "exercise_cache"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    exercise_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("exercises.id"), unique=True)
    exam_type: Mapped[str] = mapped_column(String(20))
    level: Mapped[str] = mapped_column(String(10))
    exercise_type: Mapped[str] = mapped_column(String(50))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    pool_use_count: Mapped[int] = mapped_column(Integer, default=0)
    max_uses: Mapped[int] = mapped_column(Integer, default=50)
    cache_expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class UserSeenExercise(Base):
    __tablename__ = "user_seen_exercises"
    __table_args__ = (UniqueConstraint("user_id", "exercise_id"),)
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    exercise_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("exercises.id"))
    seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
