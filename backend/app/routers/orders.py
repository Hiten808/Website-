import random
import string

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Order, OrderItem, Product, User
from ..schemas import OrderIn, OrderOut
from ..security import current_user

router = APIRouter(prefix="/orders", tags=["orders"])

FREE_SHIP_MIN_CENTS = 5000   # free shipping over $50
SHIP_COST_CENTS = 699        # $6.99


def _order_ref() -> str:
    body = "".join(random.choices(string.ascii_uppercase + string.digits, k=7))
    return f"VOL-{body}"


@router.post("", response_model=OrderOut, status_code=201)
def place_order(body: OrderIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    if not body.items:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cart is empty")

    items_payload = []
    subtotal = 0
    for item in body.items:
        product = db.get(Product, item.product_id)
        if not product:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Unknown product {item.product_id}")
        if item.qty > product.stock:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Only {product.stock} left of {product.name}",
            )
        subtotal += product.price_cents * item.qty
        items_payload.append((product, item.qty))

    total = subtotal + (0 if subtotal >= FREE_SHIP_MIN_CENTS else SHIP_COST_CENTS)

    order = Order(
        user_id=user.id,
        ref=_order_ref(),
        total_cents=total,
        payment=body.payment,
        address=body.address.model_dump(),
    )
    db.add(order)
    db.flush()

    for product, qty in items_payload:
        db.add(OrderItem(order_id=order.id, product_id=product.id, name=product.name,
                         price_cents=product.price_cents, qty=qty))
        product.stock -= qty

    db.commit()
    db.refresh(order)
    return order


@router.get("/mine", response_model=list[OrderOut])
def my_orders(db: Session = Depends(get_db), user: User = Depends(current_user)):
    stmt = (
        select(Order)
        .where(Order.user_id == user.id)
        .order_by(Order.placed_at.desc())
    )
    return db.scalars(stmt).all()
