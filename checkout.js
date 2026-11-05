/* ===== Voltra — checkout logic ===== */

const USERS_KEY = "voltra-users";
const SESSION_KEY = "voltra-session";
const CART_KEY = "voltra-cart";
const ORDERS_KEY = "voltra-orders";
const FREE_SHIP_MIN = 50;
const SHIP_COST = 6.99;

const PRODUCTS = [
  { id: 1,  name: "Pulse Cans Pro",     price: 199,  emoji: "🎧", grad: "linear-gradient(135deg,#6c5ce7,#4834d4)" },
  { id: 2,  name: "Pixel Buds Air",     price: 89,   emoji: "🎵", grad: "linear-gradient(135deg,#00b8d4,#01579b)" },
  { id: 3,  name: "BoomBox Mini",       price: 59,   emoji: "🔊", grad: "linear-gradient(135deg,#ff6b3d,#e7316b)" },
  { id: 4,  name: "VPhone X5",          price: 899,  emoji: "📱", grad: "linear-gradient(135deg,#0f2027,#2c5364)" },
  { id: 5,  name: "VPhone Lite",        price: 449,  emoji: "☎️", grad: "linear-gradient(135deg,#11998e,#38ef7d)" },
  { id: 6,  name: "AirBook 14",         price: 1299, emoji: "💻", grad: "linear-gradient(135deg,#414345,#8e9eab)" },
  { id: 7,  name: "CreatorBook Pro 16", price: 1899, emoji: "🖥️", grad: "linear-gradient(135deg,#3a1c71,#d76d77)" },
  { id: 8,  name: "Pulse Watch S",      price: 279,  emoji: "⌚", grad: "linear-gradient(135deg,#1e3c72,#2a5298)" },
  { id: 9,  name: "Track Band 3",       price: 79,   emoji: "📟", grad: "linear-gradient(135deg,#8e2de2,#4a00e0)" },
  { id: 10, name: "FastCharge 65W GaN", price: 39,   emoji: "🔌", grad: "linear-gradient(135deg,#f7971e,#ffd200)" },
  { id: 11, name: "PocketDrive 2TB",    price: 129,  emoji: "💾", grad: "linear-gradient(135deg,#005c97,#363795)" },
  { id: 12, name: "Grip Mat Wireless",  price: 49,   emoji: "🖱️", grad: "linear-gradient(135deg,#232526,#950d3d)" },
];

const $ = (sel) => document.querySelector(sel);
const money = (n) => `$${n.toFixed(2)}`;

/* ---------- storage helpers ---------- */
function load(obj, key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function getCart() { return load(null, CART_KEY, {}); }
function saveCart(c) { localStorage.setItem(CART_KEY, JSON.stringify(c)); }
function getSession() { return load(null, SESSION_KEY, null); }
function getUsers() { return load([], USERS_KEY, []); }
function getOrders() { return load([], ORDERS_KEY, []); }
function saveOrders(o) { localStorage.setItem(ORDERS_KEY, JSON.stringify(o)); }

function currentUser() {
  const s = getSession();
  if (!s) return null;
  return getUsers().find((u) => u.email === s.email) || null;
}

function cartEntries() {
  const cart = getCart();
  return Object.entries(cart)
    .map(([id, qty]) => ({ product: PRODUCTS.find((p) => p.id === Number(id)), qty }))
    .filter((e) => e.product && e.qty > 0);
}

function totals(entries) {
  const subtotal = entries.reduce((s, { product: p, qty }) => s + p.price * qty, 0);
  const shipping = subtotal >= FREE_SHIP_MIN || subtotal === 0 ? 0 : SHIP_COST;
  return { subtotal, shipping, total: subtotal + shipping };
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ---------- gate: must be signed in ---------- */
function showGate() {
  $("#checkoutMain").innerHTML = `
    <div class="checkout-gate">
      <span class="big">🔐</span>
      <h1>Sign in to check out</h1>
      <p>You need an account to place an order. It takes 30 seconds.</p>
      <a href="auth.html" class="btn btn-primary">Sign in / Create account</a>
    </div>`;
}

/* ---------- checkout form ---------- */
function renderCheckout() {
  const user = currentUser();
  const entries = cartEntries();

  if (!user) return showGate();

  if (entries.length === 0) {
    $("#checkoutMain").innerHTML = `
      <div class="checkout-gate">
        <span class="big">🛒</span>
        <h1>Your cart is empty</h1>
        <p>Add some gear before checking out.</p>
        <a href="index.html" class="btn btn-primary">Browse the store</a>
      </div>`;
    return;
  }

  const { subtotal, shipping, total } = totals(entries);
  const emailPrefill = user.email;

  $("#checkoutMain").innerHTML = `
    <h1 class="co-title">Checkout</h1>
    <p class="co-sub">Signed in as <strong>${escapeHtml(user.name)}</strong> — this demo saves your order locally.</p>

    <div class="checkout-grid">
      <!-- ===== LEFT: forms ===== -->
      <div>
        <form id="checkoutForm" novalidate>
          <!-- Contact -->
          <section class="checkout-card">
            <h2><span class="step">1.</span> Contact</h2>
            <div class="form-grid">
              <div class="field field-hint full">
                <input type="email" id="coEmail" placeholder="Email for order updates" value="${escapeHtml(emailPrefill)}" />
              </div>
            </div>
          </section>

          <!-- Shipping -->
          <section class="checkout-card">
            <h2><span class="step">2.</span> Shipping address</h2>
            <div class="form-grid">
              <div class="field field-hint"><input id="coFirst" placeholder="First name" /></div>
              <div class="field field-hint"><input id="coLast" placeholder="Last name" /></div>
              <div class="field field-hint full"><input id="coStreet" placeholder="Street address" /></div>
              <div class="field field-hint"><input id="coCity" placeholder="City" /></div>
              <div class="field field-hint"><input id="coZip" placeholder="ZIP / Postal code" /></div>
              <div class="field field-hint"><input id="coCountry" placeholder="Country" value="United States" /></div>
              <div class="field field-hint"><input id="coPhone" placeholder="Phone (optional)" /></div>
            </div>
          </section>

          <!-- Payment -->
          <section class="checkout-card">
            <h2><span class="step">3.</span> Payment</h2>
            <div class="methods">
              <label class="method selected" id="methodCard">
                <input type="radio" name="payMethod" value="card" checked />
                <span class="m-emoji">💳</span>
                <span><span class="m-name">Credit / debit card</span><br /><span class="m-note">Visa, Mastercard — demo, no real charge</span></span>
              </label>
              <label class="method" id="methodCash">
                <input type="radio" name="payMethod" value="cod" />
                <span class="m-emoji">💵</span>
                <span><span class="m-name">Cash on delivery</span><br /><span class="m-note">Pay when your order arrives</span></span>
              </label>
            </div>

            <div class="form-grid" id="cardFields">
              <div class="pay-preview full"><span id="cardBrand">💳</span><span id="cardPreview">•••• •••• •••• ••••</span></div>
              <div class="field field-hint full"><input id="coCardNum" inputmode="numeric" maxlength="19" placeholder="Card number  ·  4242 4242 4242 4242" /></div>
              <div class="field field-hint"><input id="coCardExp" inputmode="numeric" maxlength="5" placeholder="Expiry · MM/YY" /></div>
              <div class="field field-hint"><input id="coCardCvc" inputmode="numeric" maxlength="4" placeholder="CVC" /></div>
            </div>
          </section>

          <p class="form-error" id="coError" hidden></p>
          <button type="submit" class="btn btn-primary btn-block">Place order · ${money(total)}</button>
          <p class="secure-note">🔒 Demo checkout — no real payment is processed.</p>
        </form>
      </div>

      <!-- ===== RIGHT: summary ===== -->
      <aside class="checkout-card summary-card">
        <h2 class="summary-title">Order summary</h2>
        <div class="summary-items">
          ${entries.map(({ product: p, qty }) => `
            <div class="si-row">
              <div class="si-emoji" style="background:${p.grad}">
                ${p.emoji}<span class="si-badge">${qty}</span>
              </div>
              <div>
                <div class="si-name">${p.name}</div>
                <div class="si-price">${qty} × ${money(p.price)}</div>
              </div>
              <div class="si-price"><strong>${money(p.price * qty)}</strong></div>
            </div>`).join("")}
        </div>
        <hr class="summary-divider" />
        <div class="summary-row muted"><span>Subtotal</span><span>${money(subtotal)}</span></div>
        <div class="summary-row muted"><span>Shipping</span><span>${shipping === 0 ? "Free" : money(shipping)}</span></div>
        <div class="summary-row total"><span>Total</span><span>${money(total)}</span></div>
      </aside>
    </div>`;

  wireCheckoutForm(total);
}

/* ---------- payment interactions ---------- */
function wireCheckoutForm(total) {
  // method radio → toggle card fields
  document.querySelectorAll('input[name="payMethod"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      const isCard = radio.value === "card";
      document.getElementById("methodCard").classList.toggle("selected", isCard);
      document.getElementById("methodCash").classList.toggle("selected", !isCard);
      document.getElementById("cardFields").style.display = isCard ? "" : "none";
    });
  });

  // Card number: auto-format + brand detect
  const numEl = document.getElementById("coCardNum");
  numEl.addEventListener("input", () => {
    const digits = numEl.value.replace(/\D/g, "").slice(0, 16);
    numEl.value = digits.replace(/(.{4})/g, "$1 ").trim();
    document.getElementById("cardPreview").textContent =
      (digits + "••••••••••••••••").replace(/(.{4})/g, "$1 ").trim();
    const starts = digits.slice(0, 1);
    document.getElementById("cardBrand").textContent =
      starts === "4" ? "💳" : starts === "5" ? "🏦" : starts === "3" ? "🥇" : "💳"; // visa / mastercard / amex
  });

  // Expiry auto-format MM/YY
  const expEl = document.getElementById("coCardExp");
  expEl.addEventListener("input", () => {
    const digits = expEl.value.replace(/\D/g, "").slice(0, 4);
    expEl.value = digits.length > 2 ? digits.slice(0, 2) + "/" + digits.slice(2) : digits;
  });

  document.getElementById("coCardCvc").addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "");
  });

  document.getElementById("checkoutForm").addEventListener("submit", (e) => {
    e.preventDefault();
    submitOrder(total);
  });
}

/* ---------- place order ---------- */
function validateCheckout(isCard) {
  const need = (id) => !document.getElementById(id).value.trim();
  const err = document.getElementById("coError");

  if (need("coEmail")) return "Enter your email.";
  if (need("coFirst") || need("coLast")) return "Enter your full shipping name.";
  if (need("coStreet")) return "Enter your street address.";
  if (need("coCity")) return "Enter your city.";
  if (need("coZip")) return "Enter your ZIP / postal code.";

  if (isCard) {
    const digits = document.getElementById("coCardNum").value.replace(/\D/g, "");
    if (digits.length < 15) return "Card number looks too short — check it (tip: 4242 4242 4242 4242 works).";
    const exp = document.getElementById("coCardExp").value;
    if (!/^\d{2}\/\d{2}$/.test(exp)) return "Expiry must be in MM/YY format.";
    const month = Number(exp.slice(0, 2));
    if (month < 1 || month > 12) return "Expiry month must be between 01 and 12.";
    if (document.getElementById("coCardCvc").value.length < 3) return "CVC must be 3–4 digits.";
  }

  err.hidden = true;
  return null;
}

function submitOrder(total) {
  const isCard = document.querySelector('input[name="payMethod"]:checked').value === "card";
  const err = validateCheckout(isCard);
  if (err) {
    const el = document.getElementById("coError");
    el.textContent = "⚠ " + err;
    el.hidden = false;
    return;
  }

  const user = currentUser();
  const entries = cartEntries();
  const orderId = "VOL-" + Math.random().toString(36).slice(2, 7).toUpperCase() + "-" + Date.now().toString(36).slice(-3).toUpperCase();

  const order = {
    id: orderId,
    placedAt: new Date().toISOString(),
    email: user.email,
    items: entries.map(({ product: p, qty }) => ({ name: p.name, price: p.price, qty })),
    total,
    payment: isCard ? "card" : "cash on delivery",
    address: {
      name: document.getElementById("coFirst").value.trim() + " " + document.getElementById("coLast").value.trim(),
      street: document.getElementById("coStreet").value.trim(),
      city: document.getElementById("coCity").value.trim(),
      zip: document.getElementById("coZip").value.trim(),
      country: document.getElementById("coCountry").value.trim(),
    },
  };

  const orders = getOrders();
  orders.push(order);
  saveOrders(orders);
  saveCart({});

  renderConfirmation(order);
}

/* ---------- confirmation ---------- */
function renderConfirmation(order) {
  $("#checkoutMain").innerHTML = `
    <div class="confirm-wrap">
      <div class="check">✓</div>
      <h1>Order placed! 🎉</h1>
      <p>Thanks — your order is confirmed and (pretend) on its way. A confirmation email would go out now.</p>
      <div class="order-id">${order.id}</div>
      <p>${order.items.reduce((s, i) => s + i.qty, 0)} item(s) · ${money(order.total)} · ${order.payment === "card" ? "💳 Card" : "💵 Cash on delivery"}</p>
      <div class="confirm-actions">
        <button class="btn btn-primary" id="viewOrders">📦 View my orders</button>
        <a class="btn btn-ghost" href="index.html">Continue shopping</a>
      </div>
    </div>`;

  document.getElementById("viewOrders").addEventListener("click", () => {
    alert(`Orders stored for ${order.email}:\n\n` +
      getOrders().map((o) => `${o.id} — ${money(o.total)} (${new Date(o.placedAt).toLocaleString()})`).join("\n"));
  });
}

/* ---------- init ---------- */
renderCheckout();
