from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Product, Review
from ..schemas import ProductOut, ReviewIn, ReviewOut
from ..security import current_user
from ..models import User

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductOut])
def list_products(
    category: str | None = Query(default=None),
    q: str | None = Query(default=None),
    sort: str = Query(default="featured", pattern="^(featured|price-asc|price-desc|rating)$"),
    db: Session = Depends(get_db),
):
    stmt = select(Product)
    if category and category != "all":
        stmt = stmt.where(Product.category == category)
    if q:
        like = f"%{q.lower()}%"
        stmt = stmt.where(
            Product.name.ilike(like) | Product.short_desc.ilike(like) | Product.long_desc.ilike(like)
        )
    if sort == "price-asc":
        stmt = stmt.order_by(Product.price_cents.asc())
    elif sort == "price-desc":
        stmt = stmt.order_by(Product.price_cents.desc())
    elif sort == "rating":
        stmt = stmt.order_by(Product.rating.desc())
    else:
        stmt = stmt.order_by(Product.id.asc())
    return db.scalars(stmt).all()


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    return product


@router.get("/{product_id}/reviews", response_model=list[ReviewOut])
def list_reviews(product_id: int, db: Session = Depends(get_db)):
    stmt = (
        select(Review)
        .where(Review.product_id == product_id)
        .order_by(Review.created_at.desc())
    )
    reviews = db.scalars(stmt).all()
    out = []
    for r in reviews:
        item = ReviewOut.model_validate(r, from_attributes=True)
        item.author_name = r.user.name if getattr(r, "user", None) else None
        out.append(item)
    return out


@router.post("/{product_id}/reviews", response_model=ReviewOut, status_code=201)
def add_review(
    product_id: int,
    body: ReviewIn,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    if not db.get(Product, product_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    review = Review(
        product_id=product_id,
        user_id=user.id,
        rating=body.rating,
        title=body.title,
        text=body.text,
        verified=True,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    out = ReviewOut.model_validate(review, from_attributes=True)
    out.author_name = user.name
    return out
