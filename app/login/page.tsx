"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!hasSupabaseEnv || !supabase) {
      setError(
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
      );
      return;
    }

    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  async function handlePasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!hasSupabaseEnv || !supabase) {
      setError(
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
      );
      return;
    }

    if (!email) {
      setError("Vul eerst je e-mailadres in.");
      return;
    }

    setResetLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo:
        typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined,
    });

    if (resetError) {
      setError(resetError.message);
      setResetLoading(false);
      return;
    }

    setMessage("Als dit e-mailadres bestaat, werd een resetmail verzonden.");
    setResetLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-3xl border border-line bg-surface p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">Login</h1>
        <p className="mt-2 text-sm text-muted">Sign in to access the internal stock app.</p>

        <form
          className="mt-6 space-y-4"
          onSubmit={mode === "login" ? handleSubmit : handlePasswordReset}
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none"
              required
            />
          </div>

          {mode === "login" ? (
            <div>
              <label
                className="mb-2 block text-sm font-medium text-foreground"
                htmlFor="password"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none"
                required
              />
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {message ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          ) : null}

          {mode === "login" ? (
            <>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-black px-4 py-3 font-medium text-white disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Login"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("reset");
                  setError(null);
                  setMessage(null);
                }}
                className="w-full text-sm font-medium text-neutral-700 underline underline-offset-4"
              >
                Wachtwoord vergeten?
              </button>
            </>
          ) : (
            <>
              <button
                type="submit"
                disabled={resetLoading}
                className="w-full rounded-2xl bg-black px-4 py-3 font-medium text-white disabled:opacity-50"
              >
                {resetLoading ? "Bezig..." : "Resetmail verzenden"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setMessage(null);
                }}
                className="w-full text-sm font-medium text-neutral-700 underline underline-offset-4"
              >
                Terug naar login
              </button>
            </>
          )}
        </form>
      </div>
    </main>
  );
}
