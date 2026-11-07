"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ProductCard, { CATEGORY_NAMES, money, stars, tagLabel } from "../../../components/ProductCard";
import { useCart } from "../../../components/CartContext";
import { useToast } from "../../../components/Toast";

const SEEDED_REVIEWS = [
  { name: "Aarav M.", rating: 5, title: "Worth every rupee", text: "Used it daily for three weeks and honestly can't find a fault. The build feels expensive and it does exactly what the page promises.", date: "2 weeks ago", verified: true },
  { name: "Sofia K.", rating: 4, title: "Almost perfect", text: "Great quality and everything works as advertised. Docking one star because I wanted one more colour option — otherwise flawless.", date: "1 month ago", verified: true },
  { name: "Jordan T.", rating: 5, title: "My third Voltra order", text: "Voltra keeps getting it right. Fast delivery, clean packaging, and the product quality is consistent across their range.", date: "1 month ago", verified: true },
];

export default function ProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const showToast = useToast();

  const [product, setProduct] = useState(null);
  const [missing, setMissing] = useState(false);
  const [view, setView] = useState(0);
  const [color, setColor] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState("desc");
  const [reviews, setReviews] = useState([]);
  const [rvName, setRvName] = useState("");
  const [rvText, setRvText] = useState("");
  const [rvRating, setRvRating] = useState(5);
  const [rvError, setRvError] = useState("");

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => (r.ok ? r.json().then(setProduct) : Promise.reject()))
      .catch(() => setMissing(true));
  }, [id]);

  useEffect(() => {
    if (!product) return;
    let dead = false;
    fetch(`/api/products/${product.id}/reviews`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { if (!dead) setReviews(d); })
      .catch(() => {});
    return () => { dead = true; };
  }, [product]);

  const views = useMemo(() => (product ? [
    { emoji: product.emoji, grad: product.grad, transform: "" },
    { emoji: product.emoji, grad: "linear-gradient(135deg,#141926,#232b3f)", transform: "scale(-1,1)" },
    { emoji: product.emoji, grad: "linear-gradient(155deg,#0b0e14,#1c2333 60%,#2a2f4a)", transform: "scale(1.25) rotate(-10deg)" },
    { emoji: "📦", grad: "linear-gradient(135deg,#6c4f0f,#241a05)", transform: "" },
  ] : []), [product]);

  if (missing) return <NotFound />;
  if (!product) {
    return <main className="container product-main"><p className="pd-loading">Loading product…</p></main>;
  }

  const v = views[view] || views[0];
  const low = product.stock <= 8;
  const allReviews = [...reviews, ...SEEDED_REVIEWS];

  return (
    <main className="container product-main">
      <nav className="crumbs">
        <Link href="/">Store</Link> ›
        <Link href="/#products">{CATEGORY_NAMES[product.category]}</Link> ›
        <span className="here">{product.name}</span>
      </nav>

      <div className="pd-grid">
        <div className="gallery">
          <div className="pd-stage" style={{ background: v.grad }}>
            <span className="view-emoji" style={{ transform: v.transform }}>{v.emoji}</span>
            {tagLabel(product) ? (
              <span className={`pd-tag ${product.tag === "sale" ? "" : product.tag}`}>{tagLabel(product)}</span>
            ) : null}
            <span className="zoom-note">HOVER TO ZOOM</span>
          </div>
          <div className="thumbs">
            {views.map((tv, i) => (
              <button key={i} className={`thumb ${i === view ? "active" : ""}`} style={{ background: tv.grad }} onClick={() => setView(i)}>
                {tv.emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="pd-buy">
          <span className="pd-cat">{CATEGORY_NAMES[product.category]}</span>
          <h1 className="pd-title">{product.name}</h1>
          <div className="pd-rating-row">
            <span className="stars">{stars(product.rating)}</span>
            <span>{product.rating} · <a href="#reviews">{allReviews.length} reviews</a></span>
          </div>
          <div className="pd-price-row">
            <span className="pd-price">{money(product.price_cents)}</span>
            {product.old_price_cents ? <span className="pd-old">{money(product.old_price_cents)}</span> : null}
            {product.old_price_cents ? (
              <span className="pd-save">SAVE {Math.round((1 - product.price_cents / product.old_price_cents) * 100)}%</span>
            ) : null}
          </div>
          <p className={`stock-note ${low ? "low" : "ok"}`}>
            {low ? `⚠ Only ${product.stock} left — order soon` : "✅ In stock — ships today"}
          </p>
          <p className="pd-desc">{product.short_desc}. {product.long_desc.split(". ").slice(0, 2).join(". ")}</p>

          <div className="opt-label">Colour — <b>{product.colors?.[color]?.name}</b></div>
          <div className="swatches">
            {(product.colors || []).map((c, i) => (
              <button key={i} className={`swatch ${i === color ? "active" : ""}`} style={{ background: c.hex }} onClick={() => setColor(i)} title={c.name} />
            ))}
          </div>

          <div className="opt-label">Quantity</div>
          <div className="qty-predict">
            <div className="qty-box">
              <button className="qty-big" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
              <input className="pdpQty" value={qty} onChange={(e) => setQty(Math.max(1, Math.min(product.stock, Number(e.target.value) || 1)))} />
              <button className="qty-big" onClick={() => setQty((q) => Math.min(product.stock, q + 1))}>+</button>
            </div>
            <span className="max-qty">max {product.stock}</span>
          </div>

          <div className="buy-row">
            <button className="btn-cart" id="addToCart" onClick={(e) => {
              addToCart(product.id, qty);
              showToast(`${product.emoji} ${qty} × ${product.name} added to cart`);
              e.currentTarget.classList.add("added");
              e.currentTarget.textContent = "✓ Added to cart";
              setTimeout(() => {
                e.currentTarget.classList.remove("added");
                e.currentTarget.textContent = "Add to cart";
              }, 1100);
            }}>Add to cart</button>
            <button className="btn-buy" onClick={() => {
              addToCart(product.id, qty);
              router.push("/checkout");
            }}>Buy now ⚡</button>
          </div>
          <button className="wish-btn">♡ Save for later</button>

          <div className="trust-row">
            <div className="trust"><span>🚚</span>Free ship over $50</div>
            <div className="trust"><span>↩️</span>30-day returns</div>
            <div className="trust"><span>🛡️</span>2-year warranty</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="detail-tabs" id="reviews">
        <div className="s-tabs">
          {[["desc", "Description"], ["feat", "Key features"], ["spec", "Specifications"], ["rev", `Reviews (${allReviews.length})`]].map(([key, label]) => (
            <button key={key} className={`s-tab ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>

        <div className={`s-panel ${tab === "desc" ? "active" : ""}`}>
          <h3>About the {product.name}</h3>
          <p>{product.long_desc}</p>
        </div>
        <div className={`s-panel ${tab === "feat" ? "active" : ""}`}>
          <h3>Why you'll like it</h3>
          <ul>{(product.features || []).map((f, i) => <li key={i}>{f}</li>)}</ul>
        </div>
        <div className={`s-panel ${tab === "spec" ? "active" : ""}`}>
          <h3>Full specifications</h3>
          <table className="spec-table">
            <tbody>
              {(product.specs || []).map(([k, val], i) => <tr key={i}><td>{k}</td><td>{val}</td></tr>)}
              <tr><td>Category</td><td>{CATEGORY_NAMES[product.category]}</td></tr>
              <tr><td>Warranty</td><td>2 years, Voltra factory</td></tr>
            </tbody>
          </table>
        </div>
        <div className={`s-panel ${tab === "rev" ? "active" : ""}`}>
          <h3>What people say</h3>
          <form className="review-form" onSubmit={async (e) => {
            e.preventDefault();
            const res = await fetch(`/api/products/${product.id}/reviews`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ rating: Number(rvRating), title: rvText.split(/[.!?]/)[0] || "Review", text: rvText }),
            });
            if (res.status === 201) {
              const saved = await res.json();
              setReviews((r) => [saved, ...r]);
              showToast("✅ Thanks for the review!");
              setRvText("");
              return;
            }
            if (res.status === 401) setRvError("Sign in first to post reviews.");
            else if (res.status === 400) setRvError("Review must be at least 10 characters.");
            else if (res.status === 422) setRvError("Sign in first, and write at least 10 characters.");
            else setRvError("Could not post review.");
          }}>
            <div className="rf-row">
              <input placeholder="Displayed as your account name" value={rvName} onChange={(e) => setRvName(e.target.value)} />
              <select value={rvRating} onChange={(e) => setRvRating(e.target.value)}>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{"★".repeat(n)}{"☆".repeat(5 - n)} — {n}</option>
                ))}
              </select>
            </div>
            <textarea placeholder="Share your honest experience…" value={rvText} onChange={(e) => setRvText(e.target.value)} />
            {rvError ? <p className="rf-error">{rvError}</p> : null}
            <button type="submit">Post review</button>
          </form>
          <div>
            {allReviews.map((r, i) => (
              <div className="review" key={i}>
                <div className="rv-head">
                  <span className="rv-stars">{stars(r.rating)}</span>
                  <span className="rv-name">{r.author_name || r.name}</span>
                  {r.verified ? <span className="rv-badge">Verified</span> : null}
                  <span className="rv-date">{r.date || new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <div className="rv-title">{r.title}</div>
                <div className="rv-text">{r.text}</div>
              </div>
            ))}
          </div>
          <p className="seeded-note">Note: the first reviews are demo seed data; newly posted ones are saved in Postgres.</p>
        </div>
      </div>

      <RelatedStrip productId={product.id} category={product.category} addToCart={addToCart} showToast={showToast} />
    </main>
  );
}

function RelatedStrip({ productId, category, addToCart, showToast }) {
  const [related, setRelated] = useState([]);
  useEffect(() => {
    fetch("/api/products")
      .then((r) => (r.ok ? r.json() : []))
      .then((all) => {
        setRelated(all
          .filter((p) => p.id !== productId)
          .sort((a, b) => (b.category === category ? 1 : 0) - (a.category === category ? 1 : 0) || b.rating - a.rating)
          .slice(0, 4));
      });
  }, [productId, category]);

  return (
    <section className="related">
      <h2>You may also like</h2>
      <div className="product-grid">
        {related.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

function NotFound() {
  return (
    <main className="container product-main">
      <div className="pd-missing">
        <span className="big">🔍</span>
        <h1>Product not found</h1>
        <p>That link looks outdated — here's everything we stock.</p>
        <Link className="btn btn-primary" href="/">Back to the store</Link>
      </div>
    </main>
  );
}
