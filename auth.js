/* ===== Voltra — authentication (localStorage demo) ===== */

const USERS_KEY = "voltra-users";
const SESSION_KEY = "voltra-session";

/* ---------- Storage helpers ---------- */
function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
  catch { return []; }
}
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; }
  catch { return null; }
}
function setSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email: user.email }));
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

/* ---------- Password hashing (demo-grade, NOT for real production) ---------- */
function hashPassword(password, salt = "voltra-v1") {
  const input = salt + ":" + password + ":" + password.length;
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36) +
         (4294967296 * (2097151 & h1) + (h2 >>> 0)).toString(36);
}

/* ---------- Validation helpers ---------- */
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password policy (account registration): min 8 chars, must include all four character types
function passwordPolicyErrors(pw) {
  const missing = [];
  if (pw.length < 8) missing.push("must be at least 8 characters long");
  if (!/[A-Z]/.test(pw)) missing.push("needs at least one capital letter (A–Z)");
  if (!/[a-z]/.test(pw)) missing.push("needs at least one small letter (a–z)");
  if (!/[0-9]/.test(pw)) missing.push("needs at least one number (0–9)");
  if (!/[^A-Za-z0-9]/.test(pw)) missing.push("needs at least one special symbol (!@#$…)");
  return missing;
}

// Live strength checklist shown as the user types
const PW_RULES = [
  { label: "8+ characters",        test: (pw) => pw.length >= 8 },
  { label: "Capital letter (A–Z)", test: (pw) => /[A-Z]/.test(pw) },
  { label: "Small letter (a–z)",   test: (pw) => /[a-z]/.test(pw) },
  { label: "Number (0–9)",         test: (pw) => /[0-9]/.test(pw) },
  { label: "Special symbol (!@#$…)", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

function buildPwChecklist() {
  const reg = document.getElementById("registerForm");
  if (!reg || document.getElementById("pwChecklist")) return;
  const anchor = document.getElementById("regPassword").closest(".field");
  const list = document.createElement("ul");
  list.id = "pwChecklist";
  list.className = "pw-checklist";
  list.innerHTML = PW_RULES.map((r) => `<li data-ok="false">${r.label}</li>`).join("");
  anchor.after(list);
}

function updatePwChecklist() {
  const pw = document.getElementById("regPassword").value;
  document.querySelectorAll("#pwChecklist li").forEach((li, i) => {
    li.setAttribute("data-ok", String(PW_RULES[i].test(pw)));
  });
}

function showError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = "⚠ " + msg;
  el.hidden = false;
  const success = document.getElementById("loginSuccess");
  if (success) success.hidden = true;
}

function hideErrors(ids) {
  ids.forEach((id) => { const el = document.getElementById(id); if (el) el.hidden = true; });
}

function markInvalid(input) {
  input.classList.add("shake");
  input.addEventListener("animationend", () => input.classList.remove("shake"), { once: true });
}

/* ---------- Type of page content shown ---------- */
function renderState() {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const session = getSession();

  // Already signed in → show account view
  if (session) {
    const users = getUsers();
    const user = users.find((u) => u.email === session.email);
    loginForm.innerHTML = `
      <div class="logged-note">
        <div class="avatar">${(user ? user.name.charAt(0) : "V").toUpperCase()}</div>
        <div>
          <h1>Hi, ${user ? escapeHtml(user.name) : "friend"}!</h1>
          <p>You're signed in as ${escapeHtml(session.email)}</p>
        </div>
        <div class="row">
          <a class="btn btn-primary" href="index.html">Continue shopping</a>
          <button class="btn btn-ghost" id="logoutHere">Log out</button>
        </div>
      </div>`;
    document.getElementById("tabLogin").disabled = true;
    document.getElementById("tabRegister").disabled = true;
    document.getElementById("logoutHere").addEventListener("click", () => {
      clearSession();
      location.reload();
    });
    return;
  }

  const initial = new URLSearchParams(location.search).get("mode");
  const show = initial === "register" ? registerForm : loginForm;
  const hide = initial === "register" ? loginForm : registerForm;
  hide.hidden = true;
  show.hidden = false;
  setTabs(initial === "register" ? "reg" : "login");
}

function setTabs(which) {
  document.getElementById("tabLogin").classList.toggle("active", which === "login");
  document.getElementById("tabRegister").classList.toggle("active", which === "reg");
  document.getElementById("loginForm").hidden = which !== "login";
  document.getElementById("registerForm").hidden = which !== "reg";
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ---------- Events ---------- */
// Tabs + inline switch links
document.getElementById("tabLogin").addEventListener("click", () => setTabs("login"));
document.getElementById("tabRegister").addEventListener("click", () => setTabs("reg"));
document.getElementById("goRegister").addEventListener("click", (e) => { e.preventDefault(); setTabs("reg"); });
document.getElementById("goLogin").addEventListener("click", (e) => { e.preventDefault(); setTabs("login"); });

// Show/hide passwords
document.querySelectorAll(".pw-toggle").forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = document.getElementById(btn.dataset.target);
    input.type = input.type === "password" ? "text" : "password";
  });
});

// Live password-strength checklist on the register form
buildPwChecklist();
document.getElementById("regPassword").addEventListener("input", updatePwChecklist);

/* ---------- Login ---------- */
document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  hideErrors(["loginError"]);

  const emailEl = document.getElementById("loginEmail");
  const pwEl = document.getElementById("loginPassword");
  const email = emailEl.value.trim().toLowerCase();
  const password = pwEl.value;

  if (!emailRe.test(email)) return (showError("loginError", "Enter a valid email address."), markInvalid(emailEl));
  if (!password) return (showError("loginError", "Enter your password."), markInvalid(pwEl));

  const user = getUsers().find((u) => u.email === email);
  if (!user || user.pwHash !== hashPassword(password)) {
    return (showError("loginError", "Wrong email or password."), markInvalid(pwEl));
  }

  setSession(user);
  const success = document.getElementById("loginSuccess");
  success.textContent = "✅ Signed in! Redirecting to the store…";
  success.hidden = false;
  setTimeout(() => (location.href = "index.html"), 700);
});

/* ---------- Register ---------- */
document.getElementById("registerForm").addEventListener("submit", (e) => {
  e.preventDefault();
  hideErrors(["regError"]);

  const nameEl = document.getElementById("regName");
  const emailEl = document.getElementById("regEmail");
  const pwEl = document.getElementById("regPassword");
  const pw2El = document.getElementById("regPassword2");

  const name = nameEl.value.trim();
  const email = emailEl.value.trim().toLowerCase();
  const password = pwEl.value;
  const confirm = pw2El.value;

  if (name.length < 2) return (showError("regError", "Enter your full name."), markInvalid(nameEl));
  if (!emailRe.test(email)) return (showError("regError", "Enter a valid email address."), markInvalid(emailEl));

  // Password policy: min 8, uppercase + lowercase + number + special character
  const policyErrors = passwordPolicyErrors(password);
  if (policyErrors.length > 0) {
    return (showError("regError", "Password too weak — " + policyErrors[0]), markInvalid(pwEl));
  }
  if (password !== confirm) return (showError("regError", "Passwords don't match."), markInvalid(pw2El));

  const users = getUsers();
  if (users.some((u) => u.email === email)) {
    return (showError("regError", "An account with this email already exists — sign in instead."), markInvalid(emailEl));
  }

  const user = { name, email, pwHash: hashPassword(password), joined: new Date().toISOString() };
  users.push(user);
  saveUsers(users);
  setSession(user);
  location.href = "index.html";
});

/* ---------- Init ---------- */
renderState();
