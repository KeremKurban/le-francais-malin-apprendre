import uuid
from datetime import datetime, timezone

from sqlalchemy import Float, ForeignKey, Enum as SAEnum, DateTime, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class SkillLevel(Base):
    __tablename__ = "skill_levels"
    __table_args__ = (UniqueConstraint("user_id", "skill", name="uq_skill_user"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    skill: Mapped[str] = mapped_column(
        SAEnum("grammar", "vocabulary", "writing", "speaking", "communication", name="skill_enum"),
        nullable=False,
    )
    estimated_level: Mapped[str] = mapped_column(
        SAEnum("A1", "A2", "B1", "B2", name="skill_level_enum"), default="A2"
    )
    confidence: Mapped[float] = mapped_column(Float, default=0.5)
    score_history: Mapped[float] = mapped_column(Float, default=0.0)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship(back_populates="skill_levels")  # noqa: F821
