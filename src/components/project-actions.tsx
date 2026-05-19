"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function FollowButton({
  projectId,
  following,
}: {
  projectId: string;
  following: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    await fetch(`/api/projects/${projectId}/follow`, {
      method: following ? "DELETE" : "POST",
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className="rounded-xl border border-zinc-300 px-3 py-2 text-sm disabled:opacity-60"
      type="button"
    >
      {busy ? "..." : following ? "Unfollow" : "Follow"}
    </button>
  );
}

export function AddUpdateForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [milestone, setMilestone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/projects/${projectId}/updates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, isMilestone: milestone }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Failed to post update.");
      return;
    }
    setContent("");
    setMilestone(false);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 grid gap-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
        maxLength={2000}
        className="min-h-24 rounded-xl border border-zinc-300 bg-surface px-4 py-3 text-sm"
        placeholder="Share progress update..."
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={milestone}
          onChange={(e) => setMilestone(e.target.checked)}
        />
        Mark as milestone
      </label>
      <button
        type="submit"
        disabled={busy}
        className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {busy ? "Posting..." : "Post Update"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </form>
  );
}

