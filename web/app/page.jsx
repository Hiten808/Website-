"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";
import { useCart } from "../components/CartContext";
import { useToast } from "../components/Toast";

const CATEGORIES = [
  ["all", "All"],
  ["audio", "Audio"],
  ["phones", "Phones"],
  ["laptops", "Laptops"],
  ["wearables", "Wearables"],
  ["accessories", "Accessories"],
];

export default function StorePage() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("featured");
  const { hydrated } = useCart();
  // Read search param once on mount
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setQuery(q);
  }, []);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => (r.ok ? r.json() : []))
      .then(setProducts)
      .catch(() => setProducts([]));
  }, []);

  const list = useMemo(() => {
    let out = products.filter((p) => {
      const okCat = category === "all" || p.category === category;
      const q = query.toLowerCase();
      const okQ = !q || p.name.toLowerCase().includes(q) || p.short_desc.toLowerCase().includes(q);
      return okCat && okQ;
    });
    if (sort === "price-asc") out = [...out].sort((a, b) => a.price_cents - b.price_cents);
    else if (sort === "price-desc") out = [...out].sort((a, b) => b.price_cents - a.price_cents);
    else if (sort === "rating") out = [...out].sort((a, b) => b.rating - a.rating);
    return out;
  }, [products, category, query, sort]);

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <span className="hero-badge">New season · New tech</span>
            <h1>Gear that keeps up<br />with <span className="accent">you.</span></h1>
            <p>Premium electronics at honest prices. Free shipping over $50, 30-day returns on everything.</p>
            <Link href="/#products" className="btn btn-primary">Shop now ↓</Link>
          </div>
          <div className="hero-art" aria-hidden="true">🎧</div>
        </div>
      </section>

      {/* Deal banner */}
      <section className="deal-banner" id="deals">
        <div className="container deal-inner">
          <span>🔥 FLASH SALE</span>
          <strong>Up to 40% off selected audio</strong>
          <span>Limited time only — code <code>VOLTRA40</code></span>
        </div>
      </section>

      <main className="container store-main" id="products">
        <div className="toolbar">
          <div className="filters">
            {CATEGORIES.map(([value, label]) => (
              <button
                key={value}
                className={`chip ${category === value ? "active" : ""}`}
                onClick={() => setCategory(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <select className="sortSelect" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="featured">Sort: Featured</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
            <option value="rating">Top rated</option>
          </select>
        </div>

        <div className="product-grid">
          {list.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
        {!hydrated ? <p className="pd-loading">Loading catalog…</p> : null}
        {hydrated && products.length === 0 ? (
          <p className="empty-msg">
            Catalog not reachable — is the backend running on port 8000 and seeded?
          </p>
        ) : null}
        {hydrated && products.length > 0 && list.length === 0 ? (
          <p className="empty-msg">No products match your search. 💡</p>
        ) : null}
      </main>
    </>
  );
}
