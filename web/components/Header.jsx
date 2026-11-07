"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "./CartContext";

export default function Header() {
  const { count, hydrated } = useCart();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Resolve signed-in user from the backend cookie
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setMenuOpen(false);
  }

  function search(e) {
    if (e.key === "Enter" && query.trim()) {
      router.push(`/product?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <header className="header">
      <div className="container header-inner">
        <Link href="/" className="logo">⚡ Voltra</Link>
        <div className="search-wrap">
          <input
            id="searchInput"
            placeholder="Search products…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={search}
          />
        </div>
        <nav className="nav">
          <Link href="/#" className="nav-link">Shop</Link>
          <div className="account-wrap" ref={menuRef}>
            {user ? (
              <>
                <button className="account-btn" onClick={() => setMenuOpen((o) => !o)}>
                  <span className="avatar-sm">{user.name.charAt(0).toUpperCase()}</span>
                  <span>{user.name.split(" ")[0]}</span>
                </button>
                <div className={`account-menu ${menuOpen ? "open" : ""}`}>
                  <div className="am-head">
                    <div className="am-name">{user.name}</div>
                    <div className="am-email">{user.email}</div>
                  </div>
                  <Link className="am-item" href="/checkout">📦 My orders</Link>
                  <button className="am-item out" onClick={logout}>↩ Log out</button>
                </div>
              </>
            ) : (
              <Link className="account-btn" href="/auth">👤 Login</Link>
            )}
          </div>
          <Link href="/#" className="cart-btn" aria-label="Cart">
            🛒 Cart
            <span className="cart-count" style={{ display: hydrated && count ? "grid" : "none" }}>{count}</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
