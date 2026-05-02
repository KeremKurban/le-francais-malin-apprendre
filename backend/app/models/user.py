import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import String, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    target_exam: Mapped[str] = mapped_column(
        SAEnum("FIDE", "DELF", "BOTH", name="exam_type_enum"), default="DELF"
    )
    target_level: Mapped[str] = mapped_column(
        SAEnum("A1", "A2", "B1", "B2", name="level_enum"), default="B1"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    sessions: Mapped[list["LearningSession"]] = relationship(back_populates="user")  # noqa: F821
    skill_levels: Mapped[list["SkillLevel"]] = relationship(back_populates="user")  # noqa: F821
    weaknesses: Mapped[list["Weakness"]] = relationship(back_populates="user")  # noqa: F821
    recommendations: Mapped[list["ReviewRecommendation"]] = relationship(back_populates="user")  # noqa: F821
