"use client";

import React, { useEffect } from "react";
import { AlertOctagon, RotateCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhanded application crash log:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center bg-background text-foreground">
      <div className="bg-secondary/40 border border-border/80 rounded-2xl p-8 max-w-md w-full shadow-xl backdrop-blur-md flex flex-col items-center gap-5">
        <div className="p-3 bg-red-500/10 text-red-500 rounded-full border border-red-500/20 animate-pulse">
          <AlertOctagon size={40} className="stroke-[1.5]" />
        </div>
        
        <div className="flex flex-col gap-2">
          <h2 className="font-space-grotesk font-extrabold text-xl text-foreground uppercase tracking-tight">
            {"// execution_fault"}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mt-1">
            An unexpected runtime compilation error occurred. The application state has been paused to prevent data corruption.
          </p>
        </div>

        <div className="w-full bg-black/30 border border-border/10 rounded-lg p-3 font-mono text-[11px] text-red-400 text-left overflow-x-auto select-all max-h-[120px] no-scrollbar">
          <span className="text-white/40">ERR:</span> {error.message || "Unknown execution exception."}
        </div>

        <button
          onClick={() => reset()}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-sm border border-primary transition-all duration-200 cursor-pointer shadow-md shadow-primary/20 hover:scale-[1.01]"
        >
          <RotateCw size={15} />
          Retry Compile
        </button>
      </div>
    </div>
  );
}
