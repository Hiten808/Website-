/* ============================================================
   Voltra — product page (rewritten)
   Renders one product, fully defensive: invalid/missing ?id
   falls back to a product picker instead of a blank page.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- constants ---------- */
  var PRODUCTS = window.PRODUCTS || [];
  var CATEGORY_NAMES = window.CATEGORY_NAMES || {};
  var CART_KEY = "voltra-cart";
  var WISH_KEY = "voltra-wishlist";
  var REVIEWS_KEY = "voltra-reviews";

  var REVIEW_POOL = [
    { name: "Aarav M.",   rating: 5, title: "Worth every rupee",   text: "Used it daily for three weeks and honestly can't find a fault. The build feels expensive and it does exactly what the page promises.", date: "2 weeks ago",  verified: true },
    { name: "Sofia K.",   rating: 4, title: "Almost perfect",      text: "Great quality and everything works as advertised. Docking one star because I wanted one more colour option — otherwise flawless.",   date: "1 month ago",  verified: true },
    { name: "Jordan T.",  rating: 5, title: "My third Voltra order", text: "Voltra keeps getting it right. Fast delivery, clean packaging, and the product quality is consistent across their range.",          date: "1 month ago",  verified: true },
    { name: "Mei L.",     rating: 4, title: "Solid daily driver",  text: "Does the job beautifully. Took a day to get used to, after which I forgot it even had settings — just use and enjoy.",             date: "2 months ago", verified: false },
    { name: "Rahul P.",   rating: 5, title: "Exceeded expectations", text: "I read reviews like these and never believe them. I believe them now. Genuinely better than I expected for the price.",           date: "3 months ago", verified: true },
    { name: "Elena V.",   rating: 4, title: "Good, with one nit",  text: "Performance and finish are excellent. Minor gripe: the manual is short. Everything is really that simple though.",                 date: "4 months ago", verified: false },
  ];

  /* ---------- tiny helpers ---------- */
  function $(sel) { return document.querySelector(sel); }
  function money(n) { return "$" + n.toFixed(2); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function stars(r) {
    var full = Math.round(r);
    return "★".repeat(full) + "☆".repeat(5 - full);
  }
  function pctOff(p) {
    return p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  }
  function tagText(p) {
    return p.tag === "sale" ? ("-" + pctOff(p) + "% off")
         : p.tag === "hot"  ? "🔥 Best seller"
         : p.tag === "new"  ? "New"
         : "";
  }
  function readJson(key, fallback) {
    try { var v = JSON.parse(localStorage.getItem(key)); return v === null || v === undefined ? fallback : v; }
    catch (e) { return fallback; }
  }
  function writeJson(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
  function getCart() { return readJson(CART_KEY, {}); }
  function addToCartStorage(productId, qty) {
    var cart = getCart();
    cart[productId] = (cart[productId] || 0) + qty;
    writeJson(CART_KEY, cart);
    return cart;
  }
  function shortText(text, n) {
    var m = text.match(/[^.!?]+[.!?]/g) || [text];
    return m.slice(0, n || 2).join(" ");
  }

  var toastTimer;
  function toast(msg) {
    var el = $("#toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2200);
  }

  /* ---------- resolve product from URL ---------- */
  var idParam = new URLSearchParams(location.search).get("id");
  var idNum = parseInt(idParam, 10);
  // No/blank id → default to first product; unknown id → picker screen (never blank)
  var product = PRODUCTS.filter(function (p) { return p.id === idNum; })[0] || null;
  var knownId = idParam !== null && idParam !== "" && !isNaN(idNum);

  var selColor = 0;
  var qty = 1;

  function galleryViews(p) {
    return [
      { emoji: p.emoji, grad: p.grad, transform: "" },
      { emoji: p.emoji, grad: "linear-gradient(135deg,#141926,#232b3f)", transform: "scale(-1,1)" },
      { emoji: p.emoji, grad: "linear-gradient(155deg,#0b0e14,#1c2333 60%,#2a2f4a)", transform: "scale(1.25) rotate(-10deg)" },
      { emoji: "📦",   grad: "linear-gradient(135deg,#6c4f0f,#241a05)", transform: "" }
    ];
  }

  function savedReviews(p) {
    var all = readJson(REVIEWS_KEY, {}) || {};
    return all[p.id] || [];
  }
  function allReviews(p) {
    var seedCount = 4 + (p.id % 3); // stable per product
    return (savedReviews(p)).concat(REVIEW_POOL.slice(0, seedCount));
  }

  function relatedProducts(p) {
    return PRODUCTS
      .filter(function (x) { return x.id !== p.id; })
      .sort(function (a, b) {
        var sameA = a.category === p.category, sameB = b.category === p.category;
        if (sameA !== sameB) return sameA ? -1 : 1;
        return b.rating - a.rating;
      })
      .slice(0, 4);
  }

  /* ---------- renderers ---------- */
  function render() {
    var header = $("#accountLabel");
    if (header && document.getElementById("userLoaded") === null) {
      // mirror login state without depending on auth.js
      var session = readJson("voltra-session", null);
      var users = readJson("voltra-users", []);
      var me = session && users.filter(function (u) { return u.email === session.email; })[0];
      if (me) header.textContent = "👤 " + me.name.split(" ")[0];
    }

    if (!product) return renderPicker();

    document.title = product.name + " — Voltra";

    var views = galleryViews(product);
    var reviews = allReviews(product);
    var related = relatedProducts(product);
    var low = product.stock <= 8;

    var html =
      crumbs(product) +
      '<div class="pd-grid">' +
        gallery(product, views) +
        buyColumn(product) +
      "</div>" +
      detailTabs(product, reviews) +
      relatedSection(related);

    $("#productMain").innerHTML = html;
    updateCartPill();
    wire(product, views);
  }

  function crumbs(p) {
    return '<nav class="crumbs">' +
      '<a href="index.html">Store</a> › ' +
      '<a href="index.html#products">' + esc(CATEGORY_NAMES[p.category] || p.category) + "</a> › " +
      '<span class="here">' + esc(p.name) + "</span></nav>";
  }

  function gallery(p, views) {
    return '<div class="gallery">' +
      '<div class="pd-stage" id="pdStage" style="background:' + p.grad + '">' +
        '<span class="view-emoji" id="stageEmoji" style="transform:' + views[0].transform + '">' + p.emoji + "</span>" +
        (tagText(p) ? '<span class="pd-tag ' + (p.tag === "sale" ? "" : p.tag) + '">' + tagText(p) + "</span>" : "") +
        '<span class="zoom-note">HOVER TO ZOOM</span>' +
      "</div>" +
      '<div class="thumbs" id="thumbs">' + views.map(function (v, i) {
        return '<button class="thumb' + (i === 0 ? " active" : "") + '" data-view="' + i + '" style="background:' + v.grad + '" aria-label="View ' + (i + 1) + '">' + v.emoji + "</button>";
      }).join("") + "</div></div>";
  }

  function buyColumn(p) {
    var low = p.stock <= 8;
    var wish = (readJson(WISH_KEY, []) || []).indexOf(p.id) !== -1;
    return '<div class="pd-buy">' +
      '<span class="pd-cat">' + esc(CATEGORY_NAMES[p.category] || p.category) + "</span>" +
      '<h1 class="pd-title">' + esc(p.name) + "</h1>" +
      '<div class="pd-rating-row"><span class="stars">' + stars(p.rating) + "</span><span>" + p.rating +
        ' · <a href="#reviews">' + allReviews(p).length + " reviews</a></span></div>" +
      '<div class="pd-price-row"><span class="pd-price">' + money(p.price) + "</span>" +
        (p.oldPrice ? '<span class="pd-old">' + money(p.oldPrice) + '</span>' : "") +
        (pctOff(p) ? '<span class="pd-save">SAVE ' + pctOff(p) + '%</span>' : "") + "</div>" +
      '<p class="stock-note ' + (low ? "low" : "ok") + '">' +
        (low ? "⚠ Only " + p.stock + " left — order soon" : "✅ In stock — ships today") + "</p>" +
      '<p class="pd-desc">' + esc(p.desc) + ". " + esc(shortText(p.longDesc, 2)) + "</p>" +

      '<div class="opt-label">Colour — <b id="colorName">' + esc(p.colors[selColor].name) + "</b></div>" +
      '<div class="swatches" id="swatches">' + p.colors.map(function (c, i) {
        return '<button class="swatch' + (i === 0 ? " active" : "") + '" data-color="' + i + '" style="background:' + c.hex + '" title="' + esc(c.name) + '" aria-label="' + esc(c.name) + '"></button>';
      }).join("") + "</div>" +

      '<div class="opt-label">Quantity</div>' +
      '<div class="qty-predict"><div class="qty-box">' +
        '<button class="qty-big" id="qtyMinus" aria-label="Decrease">−</button>' +
        '<input id="pdpQty" value="1" inputmode="numeric" aria-label="Quantity" />' +
        '<button class="qty-big" id="qtyPlus" aria-label="Increase">+</button>' +
      '</div><span class="max-qty">max ' + p.stock + "</span></div>" +

      '<div class="buy-row">' +
        '<button class="btn-cart" id="addToCart">Add to cart</button>' +
        '<button class="btn-buy" id="buyNow">Buy now ⚡</button>' +
      "</div>" +
      '<button class="wish-btn' + (wish ? " active" : "") + '" id="wishBtn">' + (wish ? "♥ Saved for later" : "♡ Save for later") + "</button>" +
      '<div class="trust-row">' +
        '<div class="trust"><span>🚚</span>Free ship over $50</div>' +
        '<div class="trust"><span>↩️</span>30-day returns</div>' +
        '<div class="trust"><span>🛡️</span>2-year warranty</div>' +
      "</div></div>";
  }

  function detailTabs(p, reviews) {
    return '<div class="detail-tabs" id="reviews">' +
      '<div class="s-tabs">' +
        '<button class="s-tab active" data-tab="desc">Description</button>' +
        '<button class="s-tab" data-tab="feat">Key features</button>' +
        '<button class="s-tab" data-tab="spec">Specifications</button>' +
        '<button class="s-tab" data-tab="rev">Reviews (' + reviews.length + ")</button>" +
      "</div>" +
      '<div class="s-panel active" data-panel="desc"><h3>About the ' + esc(p.name) + "</h3><p>" + esc(p.longDesc) + "</p></div>" +
      '<div class="s-panel" data-panel="feat"><h3>Why you\'ll like it</h3><ul>' +
        p.features.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ul></div>" +
      '<div class="s-panel" data-panel="spec"><h3>Full specifications</h3><table class="spec-table">' +
        p.specs.map(function (row) { return "<tr><td>" + esc(row[0]) + "</td><td>" + esc(row[1]) + "</td></tr>"; }).join("") +
        '<tr><td>Category</td><td>' + esc(CATEGORY_NAMES[p.category] || p.category) + "</td></tr>" +
        "<tr><td>Warranty</td><td>2 years, Voltra factory</td></tr>" +
      "</table></div>" +
      '<div class="s-panel" data-panel="rev"><h3>What people say</h3>' +
        reviewFormHtml() +
        '<div id="reviewList">' + reviews.map(reviewHtml).join("") + "</div>" +
      "</div></div>";
  }

  function reviewFormHtml() {
    return '<form class="review-form" id="reviewForm" novalidate>' +
      '<div class="rf-row"><input id="rvName" placeholder="Your name" />' +
      '<select id="rvRating"><option value="5">★★★★★ — 5</option><option value="4">★★★★☆ — 4</option>' +
      '<option value="3">★★★☆☆ — 3</option><option value="2">★★☆☆☆ — 2</option><option value="1">★☆☆☆☆ — 1</option></select></div>' +
      '<textarea id="rvText" placeholder="Share your honest experience…"></textarea>' +
      '<p class="rf-error" id="rvError" hidden></p>' +
      '<button type="submit">Post review</button></form>';
  }

  function reviewHtml(r) {
    return '<div class="review">' +
      '<div class="rv-head"><span class="rv-stars">' + stars(r.rating) + "</span>" +
      '<span class="rv-name">' + esc(r.name) + "</span>" +
      (r.verified ? '<span class="rv-badge">Verified</span>' : "") +
      '<span class="rv-date">' + esc(r.date || "") + "</span></div>" +
      '<div class="rv-title">' + esc(r.title) + "</div>" +
      '<div class="rv-text">' + esc(r.text) + "</div></div>";
  }

  function relatedSection(list) {
    return '<section class="related"><h2>You may also like</h2><div class="product-grid">' +
      list.map(function (p) {
        return '<article class="card">' +
          '<a class="card-img" href="product.html?id=' + p.id + '" style="background:' + p.grad + '"><span aria-hidden="true">' + p.emoji + "</span></a>" +
          '<div class="card-body"><span class="card-cat">' + esc(CATEGORY_NAMES[p.category] || p.category) + "</span>" +
          '<h3 class="card-title"><a href="product.html?id=' + p.id + '">' + esc(p.name) + "</a></h3>" +
          '<p class="card-rating"><span class="stars">' + stars(p.rating) + "</span> " + p.rating + "</p>" +
          '<div class="card-foot"><span class="price">' + money(p.price) + '</span>' +
          '<button class="add-btn" data-id="' + p.id + '">Add to cart</button></div></div></article>';
      }).join("") + "</div></section>";
  }

  // Unknown ?id → friendly picker, NOT a blank page
  function renderPicker() {
    if (knownId) document.title = "Product not found — Voltra";
    $("#productMain").innerHTML =
      '<div class="pd-missing"><span class="big">🔍</span><h1>' +
      (knownId ? "Product not found" : "Browse the range") + "</h1><p>" +
      (knownId ? "That link looks outdated — here's everything we stock." : "Pick something great below.") +
      '</p><a class="btn btn-ghost" href="index.html">Open the full store</a></div>' +
      '<section class="related"><div class="product-grid">' +
      PRODUCTS.map(function (p) {
        return '<article class="card">' +
          '<a class="card-img" href="product.html?id=' + p.id + '" style="background:' + p.grad + '"><span aria-hidden="true">' + p.emoji + "</span></a>" +
          '<div class="card-body"><span class="card-cat">' + esc(CATEGORY_NAMES[p.category] || p.category) + "</span>" +
          '<h3 class="card-title"><a href="product.html?id=' + p.id + '">' + esc(p.name) + "</a></h3>" +
          '<div class="card-foot"><span class="price">' + money(p.price) + "</span></div></div></article>";
      }).join("") + "</div></section>";
  }

  /* ---------- interactions ---------- */
  function wire(p, views) {
    updateCartPill();

    // gallery
    document.body.addEventListener("click", function onViewReset(e) { /* noop */ }, { once: true });
    document.getElementById("thumbs").addEventListener("click", function (e) {
      var b = e.target.closest(".thumb");
      if (!b) return;
      var i = Number(b.getAttribute("data-view"));
      document.querySelectorAll("#thumbs .thumb").forEach(function (x) { x.classList.remove("active"); });
      b.classList.add("active");
      var v = views[i] || views[0];
      document.getElementById("stageEmoji").textContent = v.emoji;
      document.getElementById("stageEmoji").style.transform = v.transform;
      document.getElementById("pdStage").style.background = v.grad;
    });

    // colour swatches
    document.getElementById("swatches").addEventListener("click", function (e) {
      var s = e.target.closest(".swatch");
      if (!s) return;
      document.querySelectorAll("#swatches .swatch").forEach(function (x) { x.classList.remove("active"); });
      s.classList.add("active");
      selColor = Number(s.getAttribute("data-color"));
      document.getElementById("colorName").textContent = p.colors[selColor].name;
    });

    // quantity
    var qtyInput = document.getElementById("pdpQty");
    function clampQty() {
      var n = Math.floor(Number(qtyInput.value) || 1);
      qty = Math.min(Math.max(1, n), p.stock);
      qtyInput.value = qty;
    }
    document.getElementById("qtyMinus").addEventListener("click", function () { qtyInput.value = Math.max(1, (Number(qtyInput.value) || 1) - 1); clampQty(); });
    document.getElementById("qtyPlus").addEventListener("click", function () { qtyInput.value = Math.min(p.stock, (Number(qtyInput.value) || 1) + 1); clampQty(); });
    qtyInput.addEventListener("input", clampQty);

    // add to cart
    document.getElementById("addToCart").addEventListener("click", function () {
      clampQty();
      addToCartStorage(p.id, qty);
      toast(p.emoji + " " + qty + " × " + p.name + " added to cart");
      var b = this;
      b.classList.add("added");
      b.textContent = "✓ Added to cart";
      setTimeout(function () { b.classList.remove("added"); b.textContent = "Add to cart"; }, 1100);
      updateCartPill();
    });

    // buy now
    document.getElementById("buyNow").addEventListener("click", function () {
      clampQty();
      addToCartStorage(p.id, qty);
      location.href = "checkout.html";
    });

    // wishlist
    document.getElementById("wishBtn").addEventListener("click", function () {
      var wish = readJson(WISH_KEY, []) || [];
      var i = wish.indexOf(p.id);
      if (i === -1) { wish.push(p.id); toast("💖 Saved for later"); }
      else { wish.splice(i, 1); toast("Removed from saved items"); }
      writeJson(WISH_KEY, wish);
      var saved = wish.indexOf(p.id) !== -1;
      this.classList.toggle("active", saved);
      this.textContent = saved ? "♥ Saved for later" : "♡ Save for later";
    });

    // tabs
    document.querySelectorAll(".s-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        document.querySelectorAll(".s-tab").forEach(function (t) { t.classList.remove("active"); });
        document.querySelectorAll(".s-panel").forEach(function (panel) { panel.classList.remove("active"); });
        tab.classList.add("active");
        var panel = document.querySelector('[data-panel="' + tab.getAttribute("data-tab") + '"]');
        if (panel) panel.classList.add("active");
      });
    });

    // review form
    document.getElementById("reviewForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("rvName").value.trim();
      var text = document.getElementById("rvText").value.trim();
      var rating = Number(document.getElementById("rvRating").value) || 5;
      var errEl = document.getElementById("rvError");
      errEl.hidden = true;
      if (name.length < 2) { errEl.textContent = "⚠ Enter your name."; errEl.hidden = false; return; }
      if (text.length < 10) { errEl.textContent = "⚠ Review must be at least 10 characters."; errEl.hidden = false; return; }

      var review = {
        name: name,
        rating: rating,
        title: (text.split(/[.!?]/)[0] || "Review").slice(0, 80),
        text: text,
        date: new Date().toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }),
        verified: false
      };
      var all = readJson(REVIEWS_KEY, {}) || {};
      (all[p.id] = all[p.id] || []).unshift(review);
      writeJson(REVIEWS_KEY, all);

      document.getElementById("reviewList").insertAdjacentHTML("afterbegin", reviewHtml(review));
      this.reset();
      toast("✅ Thanks for the review!");
    });

    // related cards add to cart
    document.querySelectorAll(".related .add-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var rel = PRODUCTS.filter(function (x) { return x.id === Number(btn.getAttribute("data-id")); })[0];
        if (!rel) return;
        addToCartStorage(rel.id, 1);
        toast(rel.emoji + " " + rel.name + " added");
        btn.classList.add("added");
        btn.textContent = "✓ Added";
        setTimeout(function () { btn.classList.remove("added"); btn.textContent = "Add to cart"; }, 1100);
        updateCartPill();
      });
    });
  }

  function updateCartPill() {
    var cart = getCart();
    var n = 0;
    Object.keys(cart).forEach(function (k) { n += Math.max(0, cart[k] | 0); });
    var pill = document.getElementById("cartCountPdp");
    if (pill) pill.textContent = n;
  }

  /* ---------- boot ---------- */
  function boot() {
    try {
      render();
    } catch (err) {
      // Never leave the user with a blank page
      console.error("Voltra product page error:", err);
      var main = $("#productMain");
      if (main) {
        main.innerHTML =
          '<div class="pd-missing"><span class="big">🛠️</span><h1>Something hiccuped</h1>' +
          "<p>We hit an unexpected error showing this product.</p>" +
          '<a class="btn btn-primary" href="index.html">Back to the store</a></div>';
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
