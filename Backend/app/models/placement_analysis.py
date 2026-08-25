from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship

from app.database import Base


class PlacementAnalysis(Base):
    __tablename__ = "placement_analyses"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    student_id = Column(
        Integer,
        ForeignKey("students.id"),
        nullable=False
    )

    strengths = Column(
        Text,
        nullable=True
    )

    weaknesses = Column(
        Text,
        nullable=True
    )

    priorities = Column(
        Text,
        nullable=True
    )

    roadmap = Column(
        Text,
        nullable=True
    )

    today_tasks = Column(
        Text,
        nullable=True
    )

    readiness_score = Column(
        Integer,
        nullable=True
    )

    readiness_reason = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    student = relationship("Student")