"""SQLAlchemy models. Money is stored as integer cents — never floats."""
from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    category: Mapped[str] = mapped_column(String(30), index=True)
    name: Mapped[str] = mapped_column(String(150))
    price_cents: Mapped[int] = mapped_column(Integer)
    old_price_cents: Mapped[int | None] = mapped_column(Integer, nullable=True)
    rating: Mapped[float] = mapped_column(Numeric(2, 1))
    tag: Mapped[str | None] = mapped_column(String(10), nullable=True)
    emoji: Mapped[str] = mapped_column(String(8))
    grad: Mapped[str] = mapped_column(String(200))
    short_desc: Mapped[str] = mapped_column(String(200))
    long_desc: Mapped[str] = mapped_column(Text)
    stock: Mapped[int] = mapped_column(Integer, default=0)
    colors: Mapped[list] = mapped_column(JSON, default=list)
    features: Mapped[list] = mapped_column(JSON, default=list)
    specs: Mapped[list] = mapped_column(JSON, default=list)


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    ref: Mapped[str] = mapped_column(String(24), unique=True)
    total_cents: Mapped[int] = mapped_column(Integer)
    payment: Mapped[str] = mapped_column(String(20))
    address: Mapped[dict] = mapped_column(JSON)
    placed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    name: Mapped[str] = mapped_column(String(150))
    price_cents: Mapped[int] = mapped_column(Integer)
    qty: Mapped[int] = mapped_column(Integer)

    order: Mapped["Order"] = relationship(back_populates="items")


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    rating: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(120))
    text: Mapped[str] = mapped_column(Text)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
