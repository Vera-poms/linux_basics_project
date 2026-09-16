from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.connection import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    current_lab_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    lab_progress: Mapped[list["LabProgress"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Lab(Base):
    """Mirrors the id/title of the frontend's static LABS content, just enough to be a real FK target."""

    __tablename__ = "labs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)

    progress_rows: Mapped[list["LabProgress"]] = relationship(back_populates="lab")


class LabProgress(Base):
    __tablename__ = "lab_progress"
    __table_args__ = (UniqueConstraint("user_id", "lab_id", name="uq_lab_progress_user_lab"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    lab_id: Mapped[int] = mapped_column(ForeignKey("labs.id"), nullable=False)
    done: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    hint_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    user: Mapped["User"] = relationship(back_populates="lab_progress")
    lab: Mapped["Lab"] = relationship(back_populates="progress_rows")
