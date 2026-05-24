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
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-8 text-foreground select-none">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="font-space-grotesk font-extrabold text-2xl tracking-tight text-white">
          {"// compose_idea"}
        </h1>
      </div>
      
      <form onSubmit={onSubmit} className="grid gap-4.5 bg-card/40 border border-border/40 rounded-2xl p-5 backdrop-blur-md shadow-xl">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">// idea_title</label>
          <input
            name="title"
            required
            maxLength={100}
            placeholder="Nova Class scheduling..."
            className="w-full bg-secondary/30 rounded-xl py-3 px-4 text-[13.5px] text-foreground placeholder:text-muted-foreground outline-none border border-border/10 focus:border-primary/50 transition-all"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">// build_description</label>
          <textarea
            name="description"
            required
            maxLength={1000}
            placeholder="Describe what you want to build..."
            className="w-full bg-secondary/30 rounded-xl py-3 px-4 text-[13.5px] text-foreground placeholder:text-muted-foreground outline-none border border-border/10 focus:border-primary/50 transition-all min-h-32 resize-none no-scrollbar"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">// skills_required</label>
          <input
            name="skills"
            placeholder="React, C++, reverse engineering..."
            className="w-full bg-secondary/30 rounded-xl py-3 px-4 text-[13.5px] text-foreground placeholder:text-muted-foreground outline-none border border-border/10 focus:border-primary/50 transition-all"
          />
        </div>

        <div className="flex flex-col gap-1.5 pt-2 border-t border-border/10">
          <label className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">// attachments</label>
          <PostImageUpload onChange={setImageUrls} />
          {imageUrls.length > 0 ? (
            <p className="text-[11px] font-mono text-cyan-400/90 mt-1">{imageUrls.length} file(s) buffered.</p>
          ) : null}
        </div>

        <button
          disabled={loading}
          className="w-full mt-2 py-3.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-[13.5px] border border-primary transition-all duration-200 cursor-pointer shadow-md shadow-primary/20 disabled:opacity-60 active:scale-[0.99] flex items-center justify-center gap-2"
          type="submit"
        >
          {loading ? "Compiling..." : "Publish to Loop"}
        </button>
        {error ? <p className="text-xs text-red-400 font-mono text-center">{error}</p> : null}
      </form>
    </main>
  );
}
