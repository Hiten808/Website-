"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "voltra-cart-next";
const CartContext = createContext({ cart: {}, addToCart: () => {}, setQty: () => {}, clear: () => {} });

export function CartProvider({ children }) {
  const [cart, setCart] = useState({});
  const [hydrated, setHydrated] = useState(false);

  // Load cart from localStorage once, then persist on every change
  useEffect(() => {
    try {
      setCart(JSON.parse(localStorage.getItem(STORAGE_KEY)) || {});
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);

  const addToCart = useCallback((productId, qty) => {
    setCart((c) => ({ ...c, [productId]: (c[productId] || 0) + qty }));
  }, []);

  const setQty = useCallback((productId, qty) => {
    setCart((c) => {
      const next = { ...c };
      if (qty <= 0) delete next[productId];
      else next[productId] = qty;
      return next;
    });
  }, []);

  const clear = useCallback(() => setCart({}), []);

  const items = Object.entries(cart)
    .map(([id, qty]) => ({ productId: Number(id), qty }))
    .filter((e) => e.qty > 0);

  const count = items.reduce((s, e) => s + e.qty, 0);

  return (
    <CartContext.Provider value={{ cart, items, count, addToCart, setQty, clear, hydrated }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
