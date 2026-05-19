"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function SendMessageForm({ recipientId }: { recipientId: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    setError(null);
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId, content }),
    });
    const data = await res.json();
    setSending(false);
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Failed to send.");
      return;
    }
    setContent("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 flex gap-2">
      <input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="flex-1 rounded-xl border border-zinc-300 bg-surface px-4 py-3 text-sm"
        placeholder="Write a message..."
      />
      <button
        type="submit"
        disabled={sending}
        className="rounded-xl bg-brand px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
      >
        {sending ? "Sending..." : "Send"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </form>
  );
}

