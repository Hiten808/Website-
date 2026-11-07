"""Pydantic request/response schemas."""
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------
class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    joined_at: datetime


# ---------- Products ----------
class ProductOut(BaseModel):
    id: int
    category: str
    name: str
    price_cents: int
    old_price_cents: int | None
    rating: float
    tag: str | None
    emoji: str
    grad: str
    short_desc: str
    long_desc: str
    stock: int
    colors: list
    features: list
    specs: list


# ---------- Orders ----------
class OrderItemIn(BaseModel):
    product_id: int
    qty: int = Field(ge=1, le=99)


class AddressIn(BaseModel):
    name: str
    street: str
    city: str
    zip: str
    country: str


class OrderIn(BaseModel):
    items: list[OrderItemIn]
    payment: str = Field(pattern="^(card|cod)$")
    address: AddressIn


class OrderItemOut(BaseModel):
    product_id: int
    name: str
    price_cents: int
    qty: int


class OrderOut(BaseModel):
    id: int
    ref: str
    total_cents: int
    payment: str
    address: dict
    placed_at: datetime
    items: list[OrderItemOut]


# ---------- Reviews ----------
class ReviewIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    title: str = Field(min_length=1, max_length=120)
    text: str = Field(min_length=10, max_length=2000)


class ReviewOut(BaseModel):
    id: int
    product_id: int
    rating: int
    title: str
    text: str
    verified: bool
    created_at: datetime
    author_name: str | None = None
