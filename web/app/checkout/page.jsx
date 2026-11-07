"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "../../components/CartContext";
import { useToast } from "../../components/Toast";

const FREE_SHIP_MIN_CENTS = 5000;
const SHIP_COST_CENTS = 699;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clear } = useCart();
  const showToast = useToast();

  const [catalog, setCatalog] = useState([]);
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);
  const [payMethod, setPayMethod] = useState("card");
  const [cardNum, setCardNum] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvc, setCvc] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [form, setForm] = useState({
    street: "", city: "", zip: "", country: "United States", phone: "",
  });

  const entryList = items
    .map(({ productId, qty }) => ({ product: catalog.find((p) => p.id === productId), qty }))
    .filter((e) => e.product);

  const subtotal = entryList.reduce((s, { product: p, qty }) => s + p.price_cents * qty, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIP_MIN_CENTS ? 0 : SHIP_COST_CENTS;
  const total = subtotal + shipping;
  const money = (c) => `$${(c / 100).toFixed(2)}`;

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/auth/me").then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([products, me]) => {
      setCatalog(products);
      setUser(me);
      setChecked(true);
    });
  }, []);

  const cardDigits = cardNum.replace(/\D/g, "");
  const cardBrand = cardDigits.startsWith("4") ? "💳" : cardDigits.startsWith("5") ? "🏦" : cardDigits.startsWith("3") ? "🥇" : "💳";

  function validate() {
    if (!form.street.trim()) return "Enter your street address.";
    if (!form.city.trim()) return "Enter your city.";
    if (!form.zip.trim()) return "Enter your ZIP / postal code.";
    if (payMethod === "card") {
      if (cardDigits.length < 15) return "Card number looks too short — try 4242 4242 4242 4242 (demo).";
      if (!/^\d{2}\/\d{2}$/.test(cardExp)) return "Expiry must be in MM/YY format.";
      const month = Number(cardExp.slice(0, 2));
      if (month < 1 || month > 12) return "Expiry month must be between 01 and 12.";
      if (cardCvc.length < 3) return "CVC must be 3–4 digits.";
    }
    return null;
  }

  async function placeOrder(e) {
    e.preventDefault();
    setError("");
    const problem = validate();
    if (problem) { setError(problem); return; }

    setBusy(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map(({ productId, qty }) => ({ product_id: productId, qty })),
        payment: payMethod,
        address: {
          name: user ? user.name : "",
          street: form.street,
          city: form.city,
          zip: form.zip,
          country: form.country,
        },
      }),
    });

    if (res.status === 201) {
      const order = await res.json();
      clear();
      setConfirmation(order);
      showToast(`✅ Order ${order.ref} placed!`);
      setBusy(false);
      return;
    }
    if (res.status === 401) {
      showToast("🔐 Sign in to place your order…");
      router.push("/auth");
      return;
    }
    let msg = "Could not place the order.";
    try {
      const data = await res.json();
      msg = typeof data.detail === "string" ? data.detail : "Could not place the order.";
    } catch {}
    setError(msg);
    setBusy(false);
  }

  if (!checked) {
    return <main className="checkout-main container"><p className="pd-loading">Loading checkout…</p></main>;
  }

  if (!user) {
    return (
      <main className="checkout-main container">
        <div className="checkout-gate">
          <span className="big">🔐</span>
          <h1>Sign in to check out</h1>
          <p>You need an account to place an order. It takes 30 seconds.</p>
          <Link href="/auth" className="btn btn-primary">Sign in / Create account</Link>
        </div>
      </main>
    );
  }

  if (confirmation) {
    const itemCount = confirmation.items.reduce((s2, i) => s2 + i.qty, 0);
    return (
      <main className="checkout-main container">
        <div className="confirm-wrap">
          <div className="check">✓</div>
          <h1>Order placed! 🎉</h1>
          <p>Thanks — your order is confirmed and (pretend) on its way.</p>
          <div className="order-id">{confirmation.ref}</div>
          <p>
            {itemCount} item(s) · {money(confirmation.total_cents)} ·{" "}
            {confirmation.payment === "card" ? "💳 Card" : "💵 Cash on delivery"}
          </p>
          <div className="confirm-actions">
            <Link className="btn btn-primary" href="/">Continue shopping</Link>
          </div>
        </div>
      </main>
    );
  }

  if (entryList.length === 0) {
    return (
      <main className="checkout-main container">
        <div className="checkout-gate">
          <span className="big">🛒</span>
          <h1>Your cart is empty</h1>
          <p>Add some gear before checking out.</p>
          <Link href="/" className="btn btn-primary">Browse the store</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-main container">
      <h1 className="co-title">Checkout</h1>
      <p className="co-sub">
        Signed in as <strong>{user.name}</strong> — demo checkout, no real payment is processed.
      </p>

      <form className="checkout-grid" onSubmit={placeOrder} noValidate>
        <div>
          <section className="checkout-card">
            <h2><span className="step">1.</span> Contact</h2>
            <div className="form-grid">
              <div className="field field-hint full">
                <input type="email" placeholder="Email for order updates" value={user.email} readOnly disabled />
              </div>
            </div>
          </section>

          <section className="checkout-card">
            <h2><span className="step">2.</span> Shipping address</h2>
            <div className="form-grid">
              <div className="field field-hint full"><input placeholder="Street address" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} /></div>
              <div className="field field-hint"><input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div className="field field-hint"><input placeholder="ZIP / Postal code" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} /></div>
              <div className="field field-hint"><input placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
              <div className="field field-hint"><input placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
          </section>

          <section className="checkout-card">
            <h2><span className="step">3.</span> Payment</h2>
            <div className="methods">
              <label className={`method ${payMethod === "card" ? "selected" : ""}`}>
                <input type="radio" name="payMethod" checked={payMethod === "card"} onChange={() => setPayMethod("card")} />
                <span className="m-emoji">💳</span>
                <span><span className="m-name">Credit / debit card</span><br /><span className="m-note">Visa, Mastercard — demo, no real charge</span></span>
              </label>
              <label className={`method ${payMethod === "cod" ? "selected" : ""}`}>
                <input type="radio" name="payMethod" checked={payMethod === "cod"} onChange={() => setPayMethod("cod")} />
                <span className="m-emoji">💵</span>
                <span><span className="m-name">Cash on delivery</span><br /><span className="m-note">Pay when your order arrives</span></span>
              </label>
            </div>

            {payMethod === "card" ? (
              <div className="form-grid" style={{ marginTop: 14 }}>
                <div className="pay-preview full">
                  <span>{cardBrand}</span>
                  <span>{(cardDigits + "••••".repeat(4)).slice(0, 16).replace(/(.{4})/g, "$1 ").trim() || "•••• •••• •••• ••••"}</span>
                </div>
                <div className="field field-hint full">
                  <input inputMode="numeric" maxLength={19} placeholder="Card number · 4242 4242 4242 4242" value={cardNum}
                    onChange={(e) => setCardNum(e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim())} />
                </div>
                <div className="field field-hint">
                  <input inputMode="numeric" maxLength={5} placeholder="Expiry · MM/YY" value={cardExp}
                    onChange={(e) => {
                      const d = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setCardExp(d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d);
                    }} />
                </div>
                <div className="field field-hint">
                  <input inputMode="numeric" maxLength={4} placeholder="CVC" value={cardCvc}
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, ""))} />
                </div>
              </div>
            ) : null}
          </section>

          {error ? <p className="form-error">⚠ {error}</p> : null}
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? "Placing order…" : `Place order · ${money(total)}`}
          </button>
          <p className="secure-note">🔒 Demo checkout — data is stored in your local Postgres.</p>
        </div>

        <aside className="checkout-card summary-card">
          <h2 className="summary-title">Order summary</h2>
          <div className="summary-items">
            {entryList.map(({ product: p, qty }) => (
              <div className="si-row" key={p.id}>
                <div className="si-emoji" style={{ background: p.grad }}>
                  {p.emoji}<span className="si-badge">{qty}</span>
                </div>
                <div>
                  <div className="si-name">{p.name}</div>
                  <div className="si-price">{qty} × {money(p.price_cents)}</div>
                </div>
                <div className="si-price"><strong>{money(p.price_cents * qty)}</strong></div>
              </div>
            ))}
          </div>
          <hr className="summary-divider" />
          <div className="summary-row muted"><span>Subtotal</span><span>{money(subtotal)}</span></div>
          <div className="summary-row muted"><span>Shipping</span><span>{shipping === 0 ? "Free" : money(shipping)}</span></div>
          <div className="summary-row total"><span>Total</span><span>{money(total)}</span></div>
        </aside>
      </form>
    </main>
  );
}
