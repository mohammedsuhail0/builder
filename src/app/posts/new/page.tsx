"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PostImageUpload } from "@/components/post-image-upload";

export default function NewPostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
      skillsNeeded: String(form.get("skills") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      imageUrls,
    };

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Failed to publish.");
      return;
    }
    router.push("/feed");
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10">
      <h1 className="font-heading text-3xl font-semibold">Post Your Idea</h1>
      <form onSubmit={onSubmit} className="mt-6 grid gap-4">
        <input
          name="title"
          required
          maxLength={100}
          placeholder="Idea title"
          className="rounded-xl border border-zinc-300 bg-surface px-4 py-3"
        />
        <textarea
          name="description"
          required
          maxLength={1000}
          placeholder="Describe your idea"
          className="min-h-36 rounded-xl border border-zinc-300 bg-surface px-4 py-3"
        />
        <input
          name="skills"
          placeholder="Skills needed (comma separated)"
          className="rounded-xl border border-zinc-300 bg-surface px-4 py-3"
        />
        <PostImageUpload onChange={setImageUrls} />
        {imageUrls.length > 0 ? (
          <p className="text-xs text-muted">{imageUrls.length} image(s) ready.</p>
        ) : null}
        <button
          disabled={loading}
          className="rounded-xl bg-brand px-4 py-3 font-medium text-white disabled:opacity-60"
          type="submit"
        >
          {loading ? "Publishing..." : "Publish with Timestamp"}
        </button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>
    </main>
  );
}
