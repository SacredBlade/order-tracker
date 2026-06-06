"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { APP_TITLE } from "@/lib/config";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    // Full navigation so the server re-reads the new session cookie.
    router.push("/");
    router.refresh();
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: "1.5rem",
      }}
    >
      <div
        className="animate-pop"
        style={{
          width: "100%",
          maxWidth: 380,
          background: "var(--color-card)",
          border: "1px solid var(--color-line)",
          borderRadius: "var(--radius-card)",
          boxShadow: "var(--shadow-card)",
          padding: "2rem 1.75rem",
        }}
      >
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ margin: 0, fontSize: "1.4rem", letterSpacing: "-0.02em" }}>{APP_TITLE}</h1>
          <p style={{ margin: "0.35rem 0 0", color: "var(--color-ink-soft)", fontSize: "0.9rem" }}>
            Sign in to continue.
          </p>
        </div>

        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: "0.9rem" }}>
            <label className="field-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="input"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: "1.1rem" }}>
            <label className="field-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p
              role="alert"
              style={{
                margin: "0 0 1rem",
                fontSize: "0.85rem",
                color: "var(--color-danger)",
                background: "var(--color-danger-soft)",
                border: "1px solid color-mix(in oklch, var(--color-danger) 25%, transparent)",
                borderRadius: "var(--radius-box)",
                padding: "0.6rem 0.75rem",
              }}
            >
              {error}
            </p>
          )}

          <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
