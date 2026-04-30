import uuid
from typing import Optional
from datetime import datetime, timezone

from sqlalchemy import String, Text, ForeignKey, Enum as SAEnum, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class ResponseError(Base):
    __tablename__ = "response_errors"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    response_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("user_responses.id"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    topic_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("topics.id"), nullable=True)
    error_type: Mapped[str] = mapped_column(
        SAEnum("grammar", "vocabulary", "spelling", "syntax", "register", "conjugation", name="error_type_enum"),
        nullable=False,
    )
    severity: Mapped[str] = mapped_column(
        SAEnum("minor", "moderate", "major", name="severity_enum"), default="moderate"
    )
    original_text: Mapped[str] = mapped_column(Text, nullable=False)
    correction: Mapped[str] = mapped_column(Text, nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    response: Mapped["UserResponse"] = relationship(back_populates="errors")  # noqa: F821
