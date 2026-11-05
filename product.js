/* ===== Voltra — product page logic ===== */

const PRODUCTS = window.PRODUCTS;
const CATEGORY_NAMES = window.CATEGORY_NAMES;
const CART_KEY = "voltra-cart";
const WISH_KEY = "voltra-wishlist";
const REVIEWS_KEY = "voltra-reviews"; // { productId: [ {name, rating, title, text, date, verified} ] }

// Seeded reviewer picks so each product gets consistent reviews
const REVIEW_POOL = [
  { name: "Aarav M.", rating: 5, title: "Worth every rupee", text: "Used it daily for three weeks and honestly can't find a fault. The build feels expensive and it does exactly what the page promises." },
  { name: "Sofia K.", rating: 4, title: "Almost perfect", text: "Great quality and everything works as advertised. Docking one star because I wanted one more colour option — otherwise flawless." },
  { name: "Jordan T.", rating: 5, title: "My third Voltra order", text: "Voltra keeps getting it right. Fast delivery, clean packaging, and the product quality is consistent across their range." },
  { name: "Mei L.", rating: 4, title: "Solid daily driver", text: "Does the job beautifully. Took a day to get used to, after which I forgot it even had settings — just use and enjoy." },
  { name: "Rahul P.", rating: 5, title: "Exceeded expectations", text: "I read reviews like these and never believe them. I believe them now. Genuinely better than I expected for the price." },
  { name: "Elena V.", rating: 4, title: "Good, with one nit", text: "Performance and finish are excellent. Minor gripe: the manual is short. Everything is really that simple though." },
];

const $ = (sel) => document.querySelector(sel);
const money = (n) => `$${n.toFixed(2)}`;

function starString(rating) {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function writeJson(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}
function getCart() { return readJson(CART_KEY, {}); }
function saveCart(c) { writeJson(CART_KEY, c); }

let toastTimer;
function showToast(msg) {
  const toast = $("#toast");
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

/* ---------- state ---------- */
const params = new URLSearchParams(location.search);
const id = Number(params.get("id"));
const product = PRODUCTS.find((p) => p.id === id);

let activeColor = 0;
let qty = 1;
const allReviews = () => {
  const base = REVIEW_POOL.slice(0, 4 + (product.id % 3));
  userReviews = readJson(REVIEWS_KEY, {})[product.id] || [];
  return [...userReviews, ...base];
};
let userReviews = [];

/* ---------- render ---------- */
function render() {
  if (!product) return renderMissing();

  document.title = `${product.name} — Voltra`;
  const views = buildViews(product);
  const related = PRODUCTS
    .filter((p) => p.id !== product.id)
    .sort((a, b) => (b.category === product.category) - (a.category === product.category) || b.rating - a.rating)
    .slice(0, 4);
  const reviews = allReviews();
  const avg = product.rating;
  const lowStock = product.stock <= 8;

  $("#productMain").innerHTML = `
    <nav class="crumbs">
      <a href="index.html">Store</a> ›
      <a href="index.html#products">${CATEGORY_NAMES[product.category]}</a> ›
      <span class="here">${product.name}</span>
    </nav>

    <div class="pd-grid">
      <!-- ===== Gallery ===== -->
      <div class="gallery">
        <div class="pd-stage" id="pdStage" style="background:${product.grad}">
          <span class="view-emoji" id="stageEmoji">${views[0].emoji}</span>
          ${product.tag ? `<span class="pd-tag ${product.tag === "sale" ? "" : product.tag}">${tagLabel(product)}</span>` : ""}
          <span class="zoom-note">HOVER TO ZOOM</span>
        </div>
        <div class="thumbs" id="thumbs">
          ${views.map((v, i) => `
            <button class="thumb ${i === 0 ? "active" : ""}" data-i="${i}" style="background:${v.grad}" aria-label="View ${i + 1}">${v.emoji}</button>`).join("")}
        </div>
      </div>

      <!-- ===== Buy column ===== -->
      <div class="pd-buy">
        <span class="pd-cat">${CATEGORY_NAMES[product.category]}</span>
        <h1 class="pd-title">${product.name}</h1>
        <div class="pd-rating-row">
          <span class="stars">${starString(avg)}</span>
          <span>${avg} · <a href="#reviews">${reviews.length} reviews</a></span>
        </div>

        <div class="pd-price-row">
          <span class="pd-price">${money(product.price)}</span>
          ${product.oldPrice ? `<span class="pd-old">${money(product.oldPrice)}</span>` : ""}
          ${product.oldPrice ? `<span class="pd-save">SAVE ${Math.round((1 - product.price / product.oldPrice) * 100)}%</span>` : ""}
        </div>
        <p class="stock-note ${lowStock ? "low" : "ok"}">
          ${lowStock ? `⚠ Only ${product.stock} left — order soon` : `✅ In stock — ships today`}</p>
        <p class="pd-desc">${product.desc}. ${firstTwoSentences(product.longDesc)}</p>

        <div class="opt-label">Colour — <b id="colorName">${product.colors[activeColor].name}</b></div>
        <div class="swatches" id="swatches">
          ${product.colors.map((c, i) => `
            <button class="swatch ${i === 0 ? "active" : ""}" data-i="${i}" style="background:${c.hex}" title="${c.name}" aria-label="${c.name}"></button>`).join("")}
        </div>

        <div class="opt-label">Quantity</div>
        <div class="qty-predict">
          <div class="qty-box">
            <button class="qty-big" id="qtyMinus" aria-label="Decrease">−</button>
            <input id="pdpQty" value="1" inputmode="numeric" />
            <button class="qty-big" id="qtyPlus" aria-label="Increase">+</button>
          </div>
        </div>

        <div class="buy-row">
          <button class="btn-cart" id="addToCart">Add to cart</button>
          <button class="btn-buy" id="buyNow">Buy now ⚡</button>
        </div>
        <button class="wish-btn" id="wishBtn">♡ Save for later</button>

        <div class="trust-row">
          <div class="trust"><span>🚚</span>Free ship over $50</div>
          <div class="trust"><span>↩️</span>30-day returns</div>
          <div class="trust"><span>🛡️</span>2-year warranty</div>
        </div>
      </div>
    </div>

    <!-- ===== Detail tabs ===== -->
    <div class="detail-tabs" id="reviews">
      <div class="s-tabs">
        <button class="s-tab active" data-tab="desc">Description</button>
        <button class="s-tab" data-tab="feat">Key features</button>
        <button class="s-tab" data-tab="spec">Specifications</button>
        <button class="s-tab" data-tab="rev">Reviews (${reviews.length})</button>
      </div>

      <div class="s-panel active" data-panel="desc">
        <h3>About the ${product.name}</h3>
        <p>${product.longDesc}</p>
      </div>

      <div class="s-panel" data-panel="feat">
        <h3>Why you'll like it</h3>
        <ul>${product.features.map((f) => `<li>${f}</li>`).join("")}</ul>
      </div>

      <div class="s-panel" data-panel="spec">
        <h3>Full specifications</h3>
        <table class="spec-table">
          ${product.specs.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("")}
          <tr><td>Category</td><td>${CATEGORY_NAMES[product.category]}</td></tr>
          <tr><td>Warranty</td><td>2 years, Voltra factory</td></tr>
        </table>
      </div>

      <div class="s-panel" data-panel="rev">
        <h3>What people say</h3>
        <form class="review-form" id="reviewForm">
          <div class="rf-row">
            <input id="rvName" placeholder="Your name" />
            <select id="rvRating">
              <option value="5">★★★★★ — 5</option>
              <option value="4">★★★★☆ — 4</option>
              <option value="3">★★★☆☆ — 3</option>
              <option value="2">★★☆☆☆ — 2</option>
              <option value="1">★☆☆☆☆ — 1</option>
            </select>
          </div>
          <textarea id="rvText" placeholder="Share your honest experience…"></textarea>
          <p class="rf-error" id="rvError" hidden></p>
          <button type="submit">Post review</button>
        </form>
        <div id="reviewList">
          ${reviews.map((r) => `
            <div class="review">
              <div class="rv-head">
                <span class="rv-stars">${starString(r.rating)}</span>
                <span class="rv-name">${escapeHtml(r.name)}</span>
                ${r.verified ? `<span class="rv-badge">Verified</span>` : ""}
                <span class="rv-date">${r.date}</span>
              </div>
              <div class="rv-title">${escapeHtml(r.title)}</div>
              <div class="rv-text">${escapeHtml(r.text)}</div>
            </div>`).join("")}
        </div>
      </div>
    </div>

    <!-- ===== Related ===== -->
    <section class="related">
      <h2>You may also like</h2>
      <div class="product-grid">
        ${related.map((p) => relatedCard(p)).join("")}
      </div>
    </section>`;

  wireEverything(views, product);
}

function tagLabel(p) {
  return p.tag === "sale"
    ? `-${Math.round((1 - p.price / p.oldPrice) * 100)}% off`
    : p.tag === "hot" ? "🔥 Best seller" : "New";
}

function relatedCard(p) {
  return `
    <article class="card">
      <a class="card-img" href="product.html?id=${p.id}" style="background:${p.grad}"><span aria-hidden="true">${p.emoji}</span></a>
      <div class="card-body">
        <span class="card-cat">${CATEGORY_NAMES[p.category]}</span>
        <h3 class="card-title"><a href="product.html?id=${p.id}">${p.name}</a></h3>
        <p class="card-rating"><span class="stars">${starString(p.rating)}</span> ${p.rating}</p>
        <div class="card-foot">
          <span class="price">${money(p.price)}</span>
          <button class="add-btn" data-id="${p.id}">Add to cart</button>
        </div>
      </div>
    </article>`;
}

// Gallery "views": same emoji presented differently per thumb
function buildViews(p) {
  return [
    { emoji: p.emoji, grad: p.grad, transform: "" },
    { emoji: p.emoji, grad: "linear-gradient(135deg,#141926,#232b3f)", transform: "scale(-1,1)" },
    { emoji: p.emoji, grad: "linear-gradient(155deg,#0b0e14,#1c2333 60%,#2a2f4a)", transform: "scale(1.25) rotate(-10deg)" },
    { emoji: "📦", grad: "linear-gradient(135deg,#6c4f0f,#241a05)", transform: "" },
  ];
}

function firstTwoSentences(text) {
  const m = text.match(/[^.!?]+[.!?]/g) || [text];
  return m.slice(0, 2).join(" ");
}

/* ---------- interactions ---------- */
function wireEverything(views, product) {
  // Gallery thumbs
  const stageEmoji = $("#stageEmoji");
  document.querySelectorAll("#thumbs .thumb").forEach((t) => {
    t.addEventListener("click", () => {
      document.querySelectorAll("#thumbs .thumb").forEach((x) => x.classList.remove("active"));
      t.classList.add("active");
      const v = views[Number(t.dataset.i)];
      stageEmoji.textContent = v.emoji;
      stageEmoji.style.transform = v.transform;
      $("#pdStage").style.background = v.grad;
    });
  });

  // Colors
  document.querySelectorAll("#swatches .swatch").forEach((s) => {
    s.addEventListener("click", () => {
      document.querySelectorAll("#swatches .swatch").forEach((x) => x.classList.remove("active"));
      s.classList.add("active");
      activeColor = Number(s.dataset.i);
      $("#colorName").textContent = product.colors[activeColor].name;
    });
  });

  // Quantity
  const qtyInput = $("#pdpQty");
  const clampQty = () => {
    qty = Math.min(Math.max(1, Math.floor(Number(qtyInput.value) || 1)), product.stock);
    qtyInput.value = qty;
  };
  $("#qtyMinus").addEventListener("click", () => { qtyInput.value = Math.max(1, (Number(qtyInput.value) || 1) - 1); clampQty(); });
  $("#qtyPlus").addEventListener("click", () => { qtyInput.value = Math.min(product.stock, (Number(qtyInput.value) || 1) + 1); clampQty(); });
  qtyInput.addEventListener("input", clampQty);

  // Cart actions
  $("#addToCart").addEventListener("click", () => {
    const cart = getCart();
    cart[product.id] = (cart[product.id] || 0) + qty;
    saveCart(cart);
    showToast(`${product.emoji} ${qty} × ${product.name} added`);
    const btn = $("#addToCart");
    btn.classList.add("added");
    btn.textContent = "✓ Added to cart";
    setTimeout(() => { btn.classList.remove("added"); btn.textContent = "Add to cart"; }, 1100);
  });

  $("#buyNow").addEventListener("click", () => {
    const cart = getCart();
    cart[product.id] = (cart[product.id] || 0) + qty;
    saveCart(cart);
    location.href = "checkout.html";
  });

  // Wishlist
  renderWish();
  $("#wishBtn").addEventListener("click", () => {
    const wish = readJson(WISH_KEY, []);
    const i = wish.indexOf(product.id);
    if (i === -1) {
      wish.push(product.id);
      showToast("💖 Saved for later");
    } else {
      wish.splice(i, 1);
      showToast("Removed from saved items");
    }
    writeJson(WISH_KEY, wish);
    renderWish();
  });
  function renderWish() {
    const saved = readJson(WISH_KEY, []).includes(product.id);
    const b = $("#wishBtn");
    b.classList.toggle("active", saved);
    b.textContent = saved ? "♥ Saved for later" : "♡ Save for later";
  }

  // Tabs
  document.querySelectorAll(".s-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".s-tab").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".s-panel").forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      document.querySelector(`[data-panel="${tab.dataset.tab}"]`).classList.add("active");
    });
  });

  // Reviews form
  $("#reviewForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#rvName").value.trim();
    const text = $("#rvText").value.trim();
    const title = (text.split(/[.!?]/)[0] || "Review").slice(0, 80);
    if (name.length < 2) return showError("Enter your name.");
    if (text.length < 10) return showError("Review must be at least 10 characters.");

    userReviews = readJson(REVIEWS_KEY, {})[product.id] || [];
    userReviews.unshift({
      name,
      rating: Number($("#rvRating").value),
      title,
      text,
      date: new Date().toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }),
      verified: false,
    });
    const all = readJson(REVIEWS_KEY, {});
    all[product.id] = userReviews;
    writeJson(REVIEWS_KEY, all);

    const list = $("#reviewList");
    list.insertAdjacentHTML("afterbegin", `
      <div class="review">
        <div class="rv-head">
          <span class="rv-stars">${starString(userReviews[0].rating)}</span>
          <span class="rv-name">${escapeHtml(name)}</span>
          <span class="rv-date">${userReviews[0].date}</span>
        </div>
        <div class="rv-title">${escapeHtml(title)}</div>
        <div class="rv-text">${escapeHtml(text)}</div>
      </div>`);
    e.target.reset();
    $("#rvError").hidden = true;
    showToast("✅ Thanks for the review!");
  });

  function showError(msg) {
    const el = $("#rvError");
    el.textContent = "⚠ " + msg;
    el.hidden = false;
  }

  // Related add-to-cart
  document.querySelectorAll(".related .add-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const rel = PRODUCTS.find((p) => p.id === Number(btn.dataset.id));
      const cart = getCart();
      cart[rel.id] = (cart[rel.id] || 0) + 1;
      saveCart(cart);
      showToast(`${rel.emoji} ${rel.name} added`);
      btn.classList.add("added");
      btn.textContent = "✓ Added";
      setTimeout(() => { btn.classList.remove("added"); btn.textContent = "Add to cart"; }, 1100);
    });
  });

  // Gallery view transform reset on thumb default
  stageEmoji.style.transform = views[0].transform;
}

function renderMissing() {
  $("#productMain").innerHTML = `
    <div class="pd-missing">
      <span class="big">🛰️</span>
      <h1>Product not found</h1>
      <p>The link may be old or the assortment changed.</p>
      <a class="btn btn-primary" href="index.html">Back to the store</a>
    </div>`;
  document.title = "Product not found — Voltra";
}

/* ---------- init ---------- */
render();
