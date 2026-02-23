from sqlalchemy import BigInteger, DateTime, Double, ForeignKey, Text, String, SmallInteger, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional
from db import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    icon_path: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    banner_path: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[str] = mapped_column(DateTime, server_default=func.current_timestamp())

class Post(Base):
    __tablename__ = "posts"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    lat: Mapped[float] = mapped_column(Double, nullable=False)
    lng: Mapped[float] = mapped_column(Double, nullable=False)
    image_path: Mapped[str] = mapped_column(String(255), nullable=True)
    place_name: Mapped[str] = mapped_column(String(100), nullable=True)
    rating: Mapped[int] = mapped_column(SmallInteger, nullable=True)
    created_at: Mapped[str] = mapped_column(DateTime, server_default=func.current_timestamp())

    user = relationship("User")

class UnlockedPost(Base):
    __tablename__ = "unlocked_posts"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    post_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("posts.id"), nullable=False)
    unlocked_at: Mapped[str] = mapped_column(DateTime, server_default=func.current_timestamp())

class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    post_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("posts.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.current_timestamp())

    user = relationship("User")


class Like(Base):
    __tablename__ = "likes"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    post_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("posts.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[int] = mapped_column(DateTime, server_default=func.current_timestamp())
