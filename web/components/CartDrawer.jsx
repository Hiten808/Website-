"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "./CartContext";

const FREE_SHIP_MIN_CENTS = 5000;
const SHIP_COST_CENTS = 699;

async function fetchProducts() {
  const res = await fetch("/api/products");
  return res.ok ? await res.json() : [];
}

export default function CartDrawer({ open, onClose }) {
  const { items, setQty, clear } = useCart();
  const [catalog, setCatalog] = useState([]);

  useEffect(() => {
    fetchProducts().then(setCatalog);
  }, []);

  const entries = items
    .map(({ productId, qty }) => ({ product: catalog.find((p) => p.id === productId), qty }))
    .filter((e) => e.product);

  const subtotal = entries.reduce((s, { product: p, qty }) => s + p.price_cents * qty, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIP_MIN_CENTS ? 0 : SHIP_COST_CENTS;
  const total = subtotal + shipping;
  const money = (c) => `$${(c / 100).toFixed(2)}`;

  return (
    <>
      <div className={`overlay ${open ? "show" : ""}`} onClick={onClose} />
      <aside className={`cart-drawer ${open ? "open" : ""}`} aria-label="Shopping cart">
        <div className="cart-head">
          <h2>Your cart</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close cart">✕</button>
        </div>
        <div className="cart-items">
          {entries.length === 0 ? (
            <div className="cart-empty">
              <span className="big">🛒</span>
              Your cart is empty.<br />Add something great!
            </div>
          ) : (
            entries.map(({ product: p, qty }) => (
              <div className="cart-item" key={p.id}>
                <div className="ci-emoji" style={{ background: p.grad }}>{p.emoji}</div>
                <div>
                  <div className="ci-name">{p.name}</div>
                  <div className="ci-price">{money(p.price_cents)} each</div>
                  <div className="ci-controls">
                    <button className="qty-btn" onClick={() => setQty(p.id, qty - 1)}>−</button>
                    <span className="qty-val">{qty}</span>
                    <button className="qty-btn" onClick={() => setQty(p.id, qty + 1)}>+</button>
                  </div>
                </div>
                <button className="ci-remove" onClick={() => setQty(p.id, 0)}>Remove</button>
              </div>
            ))
          )}
        </div>
        <div className="cart-foot">
          <div className="cart-row"><span>Subtotal</span><span>{money(subtotal)}</span></div>
          <div className="cart-row shipping"><span>Shipping</span><span>{shipping === 0 ? "Free" : money(shipping)}</span></div>
          <div className="cart-row total"><span>Total</span><span>{money(total)}</span></div>
          <Link className="btn btn-primary btn-block" href="/checkout" onClick={onClose}>Checkout</Link>
          <p className="cart-note">
            {subtotal > 0 && subtotal < FREE_SHIP_MIN_CENTS
              ? `🚚 Add ${money(FREE_SHIP_MIN_CENTS - subtotal)} more for free shipping`
              : "🚚 Free shipping over $50"}
          </p>
          {entries.length > 0 ? (
            <p className="cart-note"><button className="ci-remove" onClick={() => { clear(); }}>Clear cart</button> · <Link href="/checkout">go to checkout →</Link></p>
          ) : null}
        </div>
      </aside>
    </>
  );
}
