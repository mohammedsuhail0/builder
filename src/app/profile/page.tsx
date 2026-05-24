"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function OwnProfileRedirect() {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user }, error: err } = await supabase.auth.getUser();
        if (err || !user) {
          router.push("/auth/login");
          return;
        }
        router.replace(`/profile/${user.id}`);
      } catch (e) {
        console.error("Profile routing error:", e);
        setError("Unable to sync session. Please try logging in again.");
      }
    };
    checkUser();
  }, []);

  return error ? (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground font-mono text-xs p-4 text-center">
      <div className="max-w-xs space-y-4">
        <p className="text-red-400 font-bold">{error}</p>
        <button
          onClick={() => router.push("/auth/login")}
          className="px-4 py-2 bg-secondary rounded-lg border border-border/40 hover:bg-secondary/80 transition-colors"
        >
          Go to Login
        </button>
      </div>
    </div>
  ) : (
    <div className="w-full h-full flex flex-col bg-background pb-14 text-foreground animate-pulse p-4 text-left">
      {/* Skeleton Header */}
      <header className="py-3 flex items-center justify-between border-b border-border mb-6">
        <div className="w-24 h-4 bg-secondary rounded" />
        <div className="w-6 h-6 rounded bg-secondary" />
      </header>
      {/* Profile Card info */}
      <div className="flex items-center gap-6 mb-6">
        <div className="w-[70px] h-[70px] rounded-full bg-secondary" />
        <div className="flex-1 flex justify-around">
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-4 bg-secondary rounded" />
            <div className="w-10 h-2 bg-secondary rounded" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-4 bg-secondary rounded" />
            <div className="w-10 h-2 bg-secondary rounded" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-4 bg-secondary rounded" />
            <div className="w-10 h-2 bg-secondary rounded" />
          </div>
        </div>
      </div>
      {/* Profile text lines */}
      <div className="flex flex-col gap-2 mb-6">
        <div className="w-28 h-4 bg-secondary rounded" />
        <div className="w-full h-3 bg-secondary/80 rounded" />
        <div className="w-5/6 h-3 bg-secondary/80 rounded" />
      </div>
      {/* Tabs */}
      <div className="border-b border-border flex justify-around py-3 mb-4">
        <div className="w-6 h-6 bg-secondary rounded" />
        <div className="w-6 h-6 bg-secondary rounded" />
        <div className="w-6 h-6 bg-secondary rounded" />
      </div>
      {/* Grid */}
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="aspect-square bg-secondary/70 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
