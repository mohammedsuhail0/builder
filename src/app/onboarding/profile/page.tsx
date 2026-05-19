"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ProfileOnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Session expired. Please login again.");
      setLoading(false);
      return;
    }

    const payload = {
      id: user.id,
      name: String(form.get("name") ?? ""),
      college: String(form.get("college") ?? ""),
      department: String(form.get("department") ?? ""),
      year: Number(form.get("year") ?? 1),
      build_statement: String(form.get("build_statement") ?? ""),
      skills: String(form.get("skills") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    const { error: upsertError } = await supabase.from("profiles").upsert(payload);
    setLoading(false);
    if (upsertError) {
      setError(upsertError.message);
      return;
    }

    router.push("/feed");
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-10">
      <h1 className="font-heading text-3xl font-semibold">Complete Profile</h1>
      <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
        <input name="name" required placeholder="Name" className="rounded-xl border border-zinc-300 bg-surface px-4 py-3" />
        <input name="college" required placeholder="College" className="rounded-xl border border-zinc-300 bg-surface px-4 py-3" />
        <input name="department" required placeholder="Department" className="rounded-xl border border-zinc-300 bg-surface px-4 py-3" />
        <select name="year" required className="rounded-xl border border-zinc-300 bg-surface px-4 py-3">
          <option value="1">Year 1</option>
          <option value="2">Year 2</option>
          <option value="3">Year 3</option>
          <option value="4">Year 4</option>
        </select>
        <input name="skills" placeholder="Skills (comma separated)" className="rounded-xl border border-zinc-300 bg-surface px-4 py-3" />
        <textarea name="build_statement" required maxLength={200} placeholder="I want to build..." className="min-h-24 rounded-xl border border-zinc-300 bg-surface px-4 py-3" />
        <button className="rounded-xl bg-brand px-4 py-3 font-medium text-white disabled:opacity-60" type="submit" disabled={loading}>
          {loading ? "Saving..." : "Continue to Feed"}
        </button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>
    </main>
  );
}

