/* ===== Voltra — store logic ===== */

// ----- Product catalog -----
const PRODUCTS = [
  { id: 1,  name: "Pulse Cans Pro",       category: "audio",        price: 199, oldPrice: 249, rating: 4.8, tag: "sale", emoji: "🎧",
    desc: "Noise-cancelling over-ear headphones", grad: "linear-gradient(135deg,#6c5ce7,#4834d4)" },
  { id: 2,  name: "Pixel Buds Air",       category: "audio",        price: 89,  oldPrice: null, rating: 4.5, tag: null, emoji: "🎵",
    desc: "True wireless earbuds, 30h battery", grad: "linear-gradient(135deg,#00b8d4,#01579b)" },
  { id: 3,  name: "BoomBox Mini",         category: "audio",        price: 59,  oldPrice: 79, rating: 4.3, tag: "sale", emoji: "🔊",
    desc: "Waterproof pocket speaker", grad: "linear-gradient(135deg,#ff6b3d,#e7316b)" },
  { id: 4,  name: "VPhone X5",            category: "phones",       price: 899, oldPrice: null, rating: 4.9, tag: "hot", emoji: "📱",
    desc: "6.7\" OLED · 5G · 512GB", grad: "linear-gradient(135deg,#0f2027,#2c5364)" },
  { id: 5,  name: "VPhone Lite",          category: "phones",       price: 449, oldPrice: 499, rating: 4.4, tag: "sale", emoji: "☎️",
    desc: "Flagship feel, mid-range price", grad: "linear-gradient(135deg,#11998e,#38ef7d)" },
  { id: 6,  name: "AirBook 14",           category: "laptops",      price: 1299, oldPrice: null, rating: 4.9, tag: "new", emoji: "💻",
    desc: "14\" laptop · 18h battery · 1TB", grad: "linear-gradient(135deg,#414345,#8e9eab)" },
  { id: 7,  name: "CreatorBook Pro 16",   category: "laptops",      price: 1899, oldPrice: 2099, rating: 4.7, tag: "sale", emoji: "🖥️",
    desc: "For creators who don't wait", grad: "linear-gradient(135deg,#3a1c71,#d76d77)" },
  { id: 8,  name: "Pulse Watch S",        category: "wearables",    price: 279, oldPrice: null, rating: 4.6, tag: "new", emoji: "⌚",
    desc: "Health tracking, 7-day battery", grad: "linear-gradient(135deg,#1e3c72,#2a5298)" },
  { id: 9,  name: "Track Band 3",         category: "wearables",    price: 79,  oldPrice: null, rating: 4.2, tag: null, emoji: "📟",
    desc: "Sleep, steps & heart rate", grad: "linear-gradient(135deg,#8e2de2,#4a00e0)" },
  { id: 10, name: "FastCharge 65W GaN",   category: "accessories",  price: 39,  oldPrice: null, rating: 4.7, tag: null, emoji: "🔌",
    desc: "Charges laptops, phones, tabs", grad: "linear-gradient(135deg,#f7971e,#ffd200)" },
  { id: 11, name: "PocketDrive 2TB",      category: "accessories",  price: 129, oldPrice: 149, rating: 4.5, tag: "sale", emoji: "💾",
    desc: "USB-C SSD · 1050 MB/s reads", grad: "linear-gradient(135deg,#005c97,#363795)" },
  { id: 12, name: "Grip Mat Wireless",    category: "accessories",  price: 49,  oldPrice: null, rating: 4.1, tag: null, emoji: "🖱️",
    desc: "Charging mouse pad (RGB)", grad: "linear-gradient(135deg,#232526,#950d3d)" },
];

const CATEGORIES = { audio: "Audio", phones: "Phones", laptops: "Laptops", wearables: "Wearables", accessories: "Accessories" };
const FREE_SHIP_MIN = 50;
const SHIP_COST = 6.99;
const CART_KEY = "voltra-cart";
const SESSION_KEY = "voltra-session";
const USERS_KEY = "voltra-users";

// ----- State -----
let cart = loadCart();
let activeCategory = "all";
let searchQuery = "";

// ----- Helpers -----
const $ = (sel) => document.querySelector(sel);
const money = (n) => `$${n.toFixed(2)}`;

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || {};
  } catch {
    return {};
  } // { productId: quantity }
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

// ----- Auth session helpers (shared keys with auth.js) -----
function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; }
  catch { return null; }
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
  catch { return []; }
}
function currentUser() {
  const session = getSession();
  if (!session) return null;
  return getUsers().find((u) => u.email === session.email) || null;
}

// ----- Header account button (top right) -----
function renderAccount() {
  const btn = $("#accountBtn");
  const label = $("#accountLabel");
  const avatar = $("#accountAvatar");
  const user = currentUser();

  // Logged out → plain login link
  if (!user) {
    label.textContent = "👤 Login";
    avatar.hidden = true;
    btn.href = "auth.html";
    return;
  }

  // Logged in → name + avatar + dropdown menu
  label.textContent = user.name.split(" ")[0];
  avatar.hidden = false;
  avatar.textContent = user.name.charAt(0).toUpperCase();
  btn.removeAttribute("href");

  let menu = $("#accountMenu");
  if (!menu) {
    menu = document.createElement("div");
    menu.id = "accountMenu";
    menu.className = "account-menu";
    $("#accountWrap").appendChild(menu);
    // Toggle on click, close on outside click / Esc
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      menu.classList.toggle("open");
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest("#accountWrap")) menu.classList.remove("open");
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") menu.classList.remove("open");
    });
  }

  menu.innerHTML = `
    <div class="am-head">
      <div class="am-name">${user.name}</div>
      <div class="am-email">${user.email}</div>
    </div>
    <button class="am-item" id="amOrders">📦 My orders</button>
    <button class="am-item out" id="amLogout">↩ Log out</button>`;

  $("#amLogout").addEventListener("click", () => {
    clearSession();
    showToast("👋 Logged out");
    renderAccount();
  });
  $("#amOrders").addEventListener("click", () => {
    let orders = [];
    try { orders = JSON.parse(localStorage.getItem("voltra-orders")) || []; } catch {}
    if (orders.length === 0) return showToast("📦 No orders yet — go treat yourself!");
    alert(`Your orders:\n\n` + orders
      .map((o) => `${o.id} — $${o.total.toFixed(2)} · ${new Date(o.placedAt).toLocaleString()}`)
      .join("\n"));
  });
}

function starString(rating) {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

// ----- Product grid -----
function filteredProducts() {
  let list = PRODUCTS.filter((p) => {
    const matchesCategory = activeCategory === "all" || p.category === activeCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q || p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const sort = $("#sortSelect").value;
  if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
  else if (sort === "rating") list.sort((a, b) => b.rating - a.rating);

  return list;
}

function renderProducts() {
  const grid = $("#productGrid");
  const list = filteredProducts();

  $("#emptyMsg").hidden = list.length > 0;
  grid.innerHTML = list
    .map((p) => {
      const tagClass = p.tag === "sale" ? "tag" : `tag ${p.tag}`;
      const tagLabel =
        p.tag === "sale"
          ? `-${Math.round((1 - p.price / p.oldPrice) * 100)}% off`
          : p.tag === "hot"
          ? "🔥 Best seller"
          : p.tag === "new"
          ? "New"
          : "";
      return `
      <article class="card">
        <div class="card-img" style="background:${p.grad}">
          <span aria-hidden="true">${p.emoji}</span>
          ${tagLabel ? `<span class="${tagClass}">${tagLabel}</span>` : ""}
        </div>
        <div class="card-body">
          <span class="card-cat">${CATEGORIES[p.category]}</span>
          <h3 class="card-title">${p.name}</h3>
          <p class="card-rating"><span class="stars">${starString(p.rating)}</span> ${p.rating}</p>
          <div class="card-foot">
            <span class="price">${money(p.price)}${p.oldPrice ? `<span class="old">${money(p.oldPrice)}</span>` : ""}</span>
            <button class="add-btn" data-id="${p.id}">Add to cart</button>
          </div>
        </div>
      </article>`;
    })
    .join("");
}

// ----- Cart -----
function cartEntries() {
  return Object.entries(cart)
    .map(([id, qty]) => ({ product: PRODUCTS.find((p) => p.id === Number(id)), qty }))
    .filter((e) => e.product && e.qty > 0);
}

function cartQuantity() {
  return Object.values(cart).reduce((sum, q) => sum + q, 0);
}

function addToCart(id) {
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  renderCart();
  const p = PRODUCTS.find((x) => x.id === id);
  showToast(`${p.emoji} ${p.name} added to cart`);
}

function setQuantity(id, qty) {
  if (qty <= 0) delete cart[id];
  else cart[id] = qty;
  saveCart();
  renderCart();
  renderProducts();
}

function renderCart() {
  const entries = cartEntries();
  const itemsEl = $("#cartItems");

  // Countdown badge
  const totalQty = cartQuantity();
  $("#cartCount").textContent = totalQty;
  $("#cartCount").style.display = totalQty ? "grid" : "none";

  if (entries.length === 0) {
    itemsEl.innerHTML = `
      <div class="cart-empty">
        <span class="big">🛒</span>
        Your cart is empty.<br />Add something great!
      </div>`;
    $("#cartFoot").style.display = "none";
    return;
  }

  $("#cartFoot").style.display = "";

  itemsEl.innerHTML = entries
    .map(({ product: p, qty }) => `
      <div class="cart-item">
        <div class="ci-emoji" style="background:${p.grad}">${p.emoji}</div>
        <div>
          <div class="ci-name">${p.name}</div>
          <div class="ci-price">${money(p.price)} each</div>
          <div class="ci-controls">
            <button class="qty-btn" data-id="${p.id}" data-delta="-1" aria-label="Decrease">−</button>
            <span class="qty-val">${qty}</span>
            <button class="qty-btn" data-id="${p.id}" data-delta="1" aria-label="Increase">+</button>
          </div>
        </div>
        <button class="ci-remove" data-id="${p.id}" aria-label="Remove">Remove</button>
      </div>`)
    .join("");

  const subtotal = entries.reduce((sum, { product: p, qty }) => sum + p.price * qty, 0);
  const shipping = subtotal >= FREE_SHIP_MIN ? 0 : SHIP_COST;
  const total = subtotal + shipping;

  $("#cartSubtotal").textContent = money(subtotal);
  $("#cartShipping").textContent = shipping === 0 ? "Free" : money(shipping);
  $("#cartTotal").textContent = money(total);

  const remaining = FREE_SHIP_MIN - subtotal;
  $("#freeShipNote").textContent =
    remaining > 0
      ? `🚚 Add ${money(remaining)} more for free shipping`
      : "✅ You've unlocked free shipping!";
}

// ----- Toast -----
let toastTimer;
function showToast(msg) {
  const toast = $("#toast");
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

// ----- Cart drawer open/close -----
function openCart() {
  $("#cartDrawer").classList.add("open");
  $("#overlay").classList.add("show");
}

function closeCart() {
  $("#cartDrawer").classList.remove("open");
  $("#overlay").classList.remove("show");
}

// ----- Checkout (goes to checkout page; requires sign-in) -----
function checkout() {
  if (!getSession()) {
    closeCart();
    showToast("🔐 Sign in to complete your order…");
    setTimeout(() => (location.href = "auth.html"), 900);
    return;
  }
  if (cartQuantity() === 0) {
    showToast("🛒 Your cart is empty");
    return;
  }
  location.href = "checkout.html";
}

// ----- Events -----
// Category chips
$("#categoryFilters").addEventListener("click", (e) => {
  const btn = e.target.closest(".chip");
  if (!btn) return;
  document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
  btn.classList.add("active");
  activeCategory = btn.dataset.category;
  renderProducts();
});

// Search
$("#searchInput").addEventListener("input", (e) => {
  searchQuery = e.target.value;
  renderProducts();
});

// Sort
$("#sortSelect").addEventListener("change", renderProducts);

// Add to cart (event delegation on grid)
$("#productGrid").addEventListener("click", (e) => {
  const btn = e.target.closest(".add-btn");
  if (!btn) return;
  addToCart(Number(btn.dataset.id));
  btn.classList.add("added");
  btn.textContent = "✓ Added";
  setTimeout(() => {
    btn.classList.remove("added");
    btn.textContent = "Add to cart";
  }, 900);
});

// Cart quantity / remove
$("#cartItems").addEventListener("click", (e) => {
  const qtyBtn = e.target.closest(".qty-btn");
  if (qtyBtn) {
    const id = Number(qtyBtn.dataset.id);
    setQuantity(id, (cart[id] || 0) + Number(qtyBtn.dataset.delta));
    return;
  }
  const removeBtn = e.target.closest(".ci-remove");
  if (removeBtn) setQuantity(Number(removeBtn.dataset.id), 0);
});

// Drawer controls
$("#cartBtn").addEventListener("click", openCart);
$("#closeCart").addEventListener("click", closeCart);
$("#overlay").addEventListener("click", closeCart);
$("#checkoutBtn").addEventListener("click", checkout);

// Esc closes drawer
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeCart();
});

// ----- Init -----
renderAccount();
renderProducts();
renderCart();
