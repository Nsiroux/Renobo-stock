"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import RenoboBrand from "@/components/RenoboBrand";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const configError =
    !hasSupabaseEnv || !supabase
      ? "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local."
      : null;
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [checkingRecovery, setCheckingRecovery] = useState(() => !configError);

  useEffect(() => {
    if (configError || !supabase) {
      return;
    }

    let isMounted = true;

    async function initializeRecovery() {
      const code = searchParams.get("code");

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          if (isMounted) {
            setError(exchangeError.message);
            setCheckingRecovery(false);
          }
          return;
        }
      }

      if (typeof window !== "undefined" && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type");

        if (type === "recovery" && accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            if (isMounted) {
              setError(sessionError.message);
              setCheckingRecovery(false);
            }
            return;
          }

          window.history.replaceState(null, "", window.location.pathname);
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (isMounted) {
        setReady(Boolean(session));
        setCheckingRecovery(false);
      }
    }

    void initializeRecovery();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) {
        return;
      }

      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true);
        setCheckingRecovery(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [configError, searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (configError || !supabase) {
      setError(configError);
      return;
    }

    if (password !== confirmPassword) {
      setError("De wachtwoorden komen niet overeen.");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setMessage("Je wachtwoord werd aangepast. Je kan nu opnieuw inloggen.");
    setLoading(false);

    setTimeout(() => {
      router.replace("/login");
    }, 1200);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-3xl border border-line bg-surface p-6 shadow-sm">
        <RenoboBrand compact />
        <h1 className="mt-5 text-2xl font-semibold text-foreground">Nieuw wachtwoord instellen</h1>
        <p className="mt-2 text-sm text-muted">
          Kies een nieuw wachtwoord nadat je de resetlink uit de e-mail hebt geopend.
        </p>

        {checkingRecovery ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
              Resetlink wordt gecontroleerd...
            </div>
          </div>
        ) : !ready ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
              Open de resetlink uit je e-mail om hier een nieuw wachtwoord in te stellen.
            </div>
            <Link
              href="/login"
              className="block w-full rounded-2xl border border-neutral-300 px-4 py-3 text-center font-medium text-foreground"
            >
              Terug naar login
            </Link>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                className="mb-2 block text-sm font-medium text-foreground"
                htmlFor="password"
              >
                Nieuw wachtwoord
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

            <div>
              <label
                className="mb-2 block text-sm font-medium text-foreground"
                htmlFor="confirm-password"
              >
                Herhaal wachtwoord
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none"
                required
              />
            </div>

            {configError || error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {configError ?? error}
              </div>
            ) : null}

            {message ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-[var(--brand)] px-4 py-3 font-medium text-white disabled:opacity-50"
            >
              {loading ? "Bezig..." : "Wachtwoord opslaan"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
