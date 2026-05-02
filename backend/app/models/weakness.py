import uuid
from datetime import datetime, timezone

from sqlalchemy import Integer, ForeignKey, JSON, Enum as SAEnum, DateTime, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class Weakness(Base):
    __tablename__ = "weaknesses"
    __table_args__ = (UniqueConstraint("user_id", "topic_id", name="uq_weakness_user_topic"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    topic_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("topics.id"), nullable=False)
    error_count: Mapped[int] = mapped_column(Integer, default=1)
    severity: Mapped[str] = mapped_column(
        SAEnum("low", "medium", "high", name="weakness_severity_enum"), default="medium"
    )
    error_type_counts: Mapped[dict] = mapped_column(JSON, default=dict)
    last_seen: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship(back_populates="weaknesses")  # noqa: F821
    topic: Mapped["Topic"] = relationship(back_populates="weaknesses")  # noqa: F821
