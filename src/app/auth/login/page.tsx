"use client";

import { FormEvent, useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isMvpMode } from "@/lib/mvp-mode";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");

  useEffect(() => {
    async function consumeInviteHash() {
      if (typeof window === "undefined") return;
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : "";
      if (!hash) return;
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const flowType = params.get("type");
      if (!accessToken || !refreshToken || flowType !== "invite") return;

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) {
        setError(sessionError.message);
        return;
      }

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname + window.location.search,
      );
      router.push("/onboarding/password");
      router.refresh();
    }

    consumeInviteHash();
  }, [router, supabase.auth]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (isMvpMode()) {
      router.push("/feed");
      router.refresh();
      return;
    }
    setLoading(true);
    setError(null);

    const { error: authError } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    if (mode === "signup") {
      router.push("/onboarding/profile");
      router.refresh();
      return;
    }
    router.push("/feed");
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6">
      <h1 className="font-heading text-3xl font-semibold">Buildr Login</h1>
      <p className="mt-2 text-sm text-muted">
        Temporary test mode: invite not required.
      </p>
      <Link href="/demo" className="mt-2 text-sm text-brand underline">
        View inside demo without login
      </Link>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <input
          className="w-full rounded-xl border border-zinc-300 bg-surface px-4 py-3"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full rounded-xl border border-zinc-300 bg-surface px-4 py-3"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          className="w-full rounded-xl bg-brand px-4 py-3 font-medium text-white disabled:opacity-60"
          type="submit"
          disabled={loading}
        >
          {loading
            ? mode === "login"
              ? "Signing in..."
              : "Creating..."
            : mode === "login"
              ? "Sign in"
              : "Create account"}
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm"
        >
          {mode === "login"
            ? "Create new account"
            : "Already have account? Sign in"}
        </button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>
    </main>
  );
}
