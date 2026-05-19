"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function PostImageUpload({
  onChange,
}: {
  onChange: (paths: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (files.length > 4) {
      setError("Max 4 images.");
      return;
    }
    setUploading(true);
    setError(null);
    const supabase = createClient();
    const paths: string[] = [];

    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Each image must be <= 5MB.");
        setUploading(false);
        return;
      }
      const filePath = `posts/${Date.now()}-${Math.random().toString(16).slice(2)}-${file.name}`;
      const { error: upErr } = await supabase.storage
        .from("post-images")
        .upload(filePath, file, { upsert: false });
      if (upErr) {
        setError(upErr.message);
        setUploading(false);
        return;
      }
      paths.push(filePath);
    }

    onChange(paths);
    setUploading(false);
  }

  return (
    <div className="grid gap-2">
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => onFiles(e.target.files)}
        className="rounded-xl border border-zinc-300 bg-surface px-3 py-2 text-sm"
      />
      {uploading ? <p className="text-xs text-muted">Uploading...</p> : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

