"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const PW_RULES = [
  { label: "8+ characters", test: (pw) => pw.length >= 8 },
  { label: "Capital letter (A–Z)", test: (pw) => /[A-Z]/.test(pw) },
  { label: "Small letter (a–z)", test: (pw) => /[a-z]/.test(pw) },
  { label: "Number (0–9)", test: (pw) => /[0-9]/.test(pw) },
  { label: "Special symbol (!@#$…)", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const checks = PW_RULES.map((r) => ({ ...r, ok: r.test(password) }));

  async function submit(e) {
    e.preventDefault();
    setError("");
    setNotice("");

    if (mode === "register") {
      if (!PW_RULES.every((r) => r.test(password))) {
        setError("Password too weak — satisfy every rule in the checklist.");
        return;
      }
      if (password !== confirm) {
        setError("Passwords don't match.");
        return;
      }
    }

    setBusy(true);
    const res = await fetch(`/api/auth/${mode === "register" ? "register" : "login"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        mode === "register" ? { name, email, password } : { email, password }
      ),
    });

    if (res.ok) {
      setNotice(mode === "register" ? "✅ Account created! Redirecting…" : "✅ Signed in! Redirecting…");
      setTimeout(() => router.push("/"), 700);
      return;
    }

    let msg = "Something went wrong";
    try {
      const data = await res.json();
      msg = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
    } catch {}
    setError(msg);
    setBusy(false);
  }

  return (
    <main className="auth-main">
      <div className="auth-card">
        <div className="auth-tabs">
          <button className={`auth-tab ${mode === "login" ? "active" : ""}`} onClick={() => { setMode("login"); setError(""); }}>
            Sign in
          </button>
          <button className={`auth-tab ${mode === "register" ? "active" : ""}`} onClick={() => { setMode("register"); setError(""); }}>
            Create account
          </button>
        </div>

        <form onSubmit={submit} noValidate>
          {mode === "login" ? (
            <>
              <h1>Welcome back 👋</h1>
              <p className="auth-sub">Sign in to check out faster.</p>
            </>
          ) : (
            <>
              <h1>Create your account</h1>
              <p className="auth-sub">30-second setup. No card needed.</p>
            </>
          )}

          {mode === "register" ? (
            <div className="field">
              <label htmlFor="regName">Full name</label>
              <input id="regName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Hiten Kumar" autoComplete="name" />
            </div>
          ) : null}

          <div className="field">
            <label htmlFor="authEmail">{mode === "login" ? "Email" : "Email address"}</label>
            <input id="authEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
          </div>

          <div className="field">
            <label htmlFor="authPassword">Password</label>
            <div className="pw-row">
              <input id="authPassword" type={showPw ? "text" : "password"} value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "register" ? "Min. 8 chars · AaZz + number + symbol" : "••••••••"}
                autoComplete={mode === "register" ? "new-password" : "current-password"} />
              <button type="button" className="pw-toggle" onClick={() => setShowPw((s) => !s)}>👁</button>
            </div>
          </div>

          {mode === "register" ? (
            <>
              <ul className="pw-checklist">
                {checks.map((c) => (
                  <li key={c.label} data-ok={String(c.ok)}>{c.label}</li>
                ))}
              </ul>
              <div className="field">
                <label htmlFor="authConfirm">Confirm password</label>
                <input id="authConfirm" type={showPw ? "text" : "password"} value={confirm}
                  onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password"
                  autoComplete="new-password" />
              </div>
            </>
          ) : null}

          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? "Please wait…" : mode === "register" ? "Create account" : "Sign in"}
          </button>

          {error ? <p className="form-error">⚠ {error}</p> : null}
          {notice ? <p className="form-success">{notice}</p> : null}

          <p className="auth-switch">
            {mode === "login" ? "No account yet? " : "Already registered? "}
            <a href="#" onClick={(e) => { e.preventDefault(); setMode(mode === "login" ? "register" : "login"); setError(""); }}>
              {mode === "login" ? "Create one free →" : "Sign in instead"}
            </a>
          </p>
        </form>
      </div>
    </main>
  );
}
