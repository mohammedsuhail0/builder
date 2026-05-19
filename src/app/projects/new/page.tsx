"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      description: String(form.get("description") ?? ""),
    };

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Failed to create project.");
      return;
    }
    router.push(`/projects/${data.projectId}`);
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10">
      <h1 className="font-heading text-3xl font-semibold">Create Project</h1>
      <form onSubmit={onSubmit} className="mt-6 grid gap-4">
        <input name="name" required maxLength={100} placeholder="Project name" className="rounded-xl border border-zinc-300 bg-surface px-4 py-3" />
        <textarea name="description" required maxLength={2000} placeholder="Project description" className="min-h-32 rounded-xl border border-zinc-300 bg-surface px-4 py-3" />
        <button disabled={loading} className="rounded-xl bg-brand px-4 py-3 font-medium text-white disabled:opacity-60" type="submit">
          {loading ? "Creating..." : "Create Project"}
        </button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>
    </main>
  );
}

