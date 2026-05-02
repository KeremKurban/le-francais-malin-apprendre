import uuid
from typing import Optional

from sqlalchemy import String, Text, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class Topic(Base):
    __tablename__ = "topics"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    exam_type: Mapped[str] = mapped_column(
        SAEnum("FIDE", "DELF", "BOTH", name="topic_exam_type_enum"), nullable=False
    )
    level: Mapped[Optional[str]] = mapped_column(
        SAEnum("A1", "A2", "B1", "B2", name="topic_level_enum"), nullable=True
    )
    category: Mapped[str] = mapped_column(
        SAEnum("grammar", "vocabulary", "communication", "writing", "listening", name="category_enum"),
        nullable=False,
    )
    swiss_context: Mapped[bool] = mapped_column(default=False)
    parent_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("topics.id"), nullable=True
    )

    children: Mapped[list["Topic"]] = relationship("Topic", back_populates="parent")
    parent: Mapped[Optional["Topic"]] = relationship("Topic", back_populates="children", remote_side=[id])
    exercises: Mapped[list["Exercise"]] = relationship(back_populates="topic")  # noqa: F821
    weaknesses: Mapped[list["Weakness"]] = relationship(back_populates="topic")  # noqa: F821
    recommendations: Mapped[list["ReviewRecommendation"]] = relationship(back_populates="topic")  # noqa: F821
