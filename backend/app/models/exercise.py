import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Text, ForeignKey, Enum as SAEnum, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy import DateTime

from app.core.database import Base


class Exercise(Base):
    __tablename__ = "exercises"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    topic_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("topics.id"), nullable=False)
    level: Mapped[str] = mapped_column(
        SAEnum("A1", "A2", "B1", "B2", name="exercise_level_enum"), nullable=False
    )
    exam_type: Mapped[str] = mapped_column(
        SAEnum("FIDE", "DELF", "BOTH", name="exercise_exam_enum"), nullable=False
    )
    exercise_type: Mapped[str] = mapped_column(
        SAEnum(
            "writing_prompt",
            "fill_blank",
            "translation",
            "grammar_correction",
            "role_play",
            "multiple_choice",
            name="exercise_type_enum",
        ),
        nullable=False,
    )
    mode: Mapped[str] = mapped_column(
        SAEnum("writing", "speaking", name="exercise_mode_enum"), default="writing"
    )
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    context: Mapped[str] = mapped_column(Text, default="")
    expected_elements: Mapped[list] = mapped_column(JSONB, default=list)
    rubric: Mapped[dict] = mapped_column(JSONB, default=dict)
    prompt_version: Mapped[str] = mapped_column(String(50), default="v1")
    difficulty: Mapped[str] = mapped_column(
        SAEnum("easy", "medium", "hard", name="difficulty_enum"), default="medium"
    )
    times_used: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    topic: Mapped["Topic"] = relationship(back_populates="exercises")  # noqa: F821
    responses: Mapped[list["UserResponse"]] = relationship(back_populates="exercise")  # noqa: F821
