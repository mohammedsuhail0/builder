"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MarkNotificationsReadButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function markAllRead() {
    setBusy(true);
    await fetch("/api/notifications", { method: "PATCH" });
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      onClick={markAllRead}
      disabled={busy}
      type="button"
      className="rounded-xl border border-zinc-300 px-3 py-2 text-sm disabled:opacity-60"
    >
      {busy ? "Marking..." : "Mark all read"}
    </button>
  );
}

