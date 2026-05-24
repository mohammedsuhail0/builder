"use client";

import React from "react";
import { Terminal, Home } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-6 text-center bg-background text-foreground">
      <div className="bg-secondary/30 border border-border/50 rounded-3xl p-8 max-w-md w-full shadow-2xl backdrop-blur-md flex flex-col items-center gap-6">
        <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-full border border-cyan-500/20">
          <Terminal size={32} />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="font-space-grotesk font-extrabold text-[40px] leading-none tracking-tight text-white select-none">
            404
          </h1>
          <h2 className="font-space-grotesk font-bold text-sm text-cyan-400 uppercase tracking-widest mt-1">
            {"// route_not_found"}
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed mt-2.5 max-w-[280px] mx-auto">
            The source node you requested cannot be located. It might have been deleted, compiled elsewhere, or is private.
          </p>
        </div>

        <button
          onClick={() => router.push("/feed")}
          className="w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary/80 hover:bg-secondary text-foreground font-bold text-xs border border-border/80 hover:border-border transition-all duration-200 cursor-pointer shadow-sm active:scale-[0.99]"
        >
          <Home size={14} />
          Return to Feed
        </button>
      </div>
    </div>
  );
}
