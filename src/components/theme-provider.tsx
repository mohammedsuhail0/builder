"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// Suppress the React 19 false-positive warning about next-themes injecting a
// <script> tag for SSR theme detection. The tag is legitimate and only runs
// during SSR — React 19 incorrectly warns about it on the client too.
// This filter is dev-only and has zero production impact.
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const _origError = console.error;
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Encountered a script tag")
    ) {
      return; // swallow the false positive
    }
    _origError.apply(console, args);
  };
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
