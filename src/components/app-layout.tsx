"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Terminal, Compass, PlusSquare, Cpu, Sun, Moon, LogOut, Send } from "lucide-react";
import { clsx } from "clsx";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";

// Derive a mono badge label from current path
function usePageBadge(pathname: string): string | null {
  if (pathname.startsWith("/feed")) return "// feed";
  if (pathname.startsWith("/explore")) return "// explore";
  if (pathname.startsWith("/reels")) return "// loops";
  if (pathname.startsWith("/messages")) return "// collabs";
  if (pathname.startsWith("/profile")) return "// space";
  if (pathname.startsWith("/posts/new")) return "// new_build";
  return null;
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hide nav on specific sub-routes (like specific chats or composing new posts)
  const hideNav =
    pathname.startsWith("/auth") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/messages/"); // dynamic individual chats

  const pageBadge = usePageBadge(pathname);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const handleThemeToggle = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <div className="flex flex-col h-screen w-full sm:max-w-md sm:mx-auto sm:border-x sm:border-border relative bg-background overflow-hidden text-foreground">
      {/* ─── Persistent Global Header ─── */}
      {!hideNav && (
        <header className="flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur-md border-b border-border z-50 shrink-0 select-none">
          {/* Left: Logo + page badge */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/feed"
              className="font-space-grotesk font-black text-[20px] tracking-tight text-foreground flex items-center gap-1.5 cursor-pointer"
            >
              <span className="p-1 rounded-lg bg-primary/10 text-primary border border-primary/20 leading-none">
                <Terminal size={15} />
              </span>
              buildr<span className="text-accent animate-pulse">.</span>
            </Link>

            {pageBadge && (
              <span className="text-[10px] font-mono font-bold text-muted-foreground bg-secondary/60 border border-border/40 px-2 py-0.5 rounded-full tracking-wider hidden xs:inline-block">
                {pageBadge}
              </span>
            )}
          </div>

          {/* Right: DMs shortcut, theme toggle, logout */}
          <div className="flex items-center gap-1">
            {/* DMs / Collabs shortcut */}
            <button
              onClick={() => router.push("/messages")}
              className={clsx(
                "relative p-2 rounded-lg transition-colors cursor-pointer",
                pathname.startsWith("/messages")
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
              )}
              title="Collaborations"
            >
              <Send size={18} className="rotate-12" />
              <div className="absolute -top-0.5 -right-0.5 w-[7px] h-[7px] bg-primary rounded-full" />
            </button>

            {/* Theme toggle — only render after mount to avoid hydration mismatch */}
            <button
              onClick={handleThemeToggle}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors cursor-pointer"
              title="Toggle Theme"
              suppressHydrationWarning
            >
              {mounted ? (
                resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />
              ) : (
                <span className="w-[18px] h-[18px] block rounded bg-secondary/60 animate-pulse" />
              )}
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
              title="Log Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
      )}

      {/* ─── Scrollable page content ─── */}
      <div className={clsx("flex-1 overflow-y-auto no-scrollbar", !hideNav && "pb-[56px]")}>
        {children}
      </div>

      {/* ─── Bottom navigation bar ─── */}
      {!hideNav && (
        <div className="absolute bottom-0 left-0 right-0 z-50">
          <nav className="bg-card/90 backdrop-blur-md border-t border-border flex items-center justify-around px-2 pb-safe pt-2 h-[56px] shadow-lg select-none">
            <Link
              href="/feed"
              className={clsx(
                "flex flex-col items-center justify-center p-2.5 transition-transform duration-150 active:scale-90",
                pathname === "/feed" ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Terminal
                className={clsx(
                  "w-[23px] h-[23px] transition-all",
                  pathname === "/feed" ? "stroke-[2.5] stroke-primary" : "stroke-[2]"
                )}
              />
            </Link>

            <Link
              href="/explore"
              className={clsx(
                "flex flex-col items-center justify-center p-2.5 transition-transform duration-150 active:scale-90",
                pathname === "/explore" ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Compass
                className={clsx(
                  "w-[23px] h-[23px] transition-all",
                  pathname === "/explore" ? "stroke-[2.5] stroke-primary" : "stroke-[2]"
                )}
              />
            </Link>

            <Link
              href="/posts/new"
              className={clsx(
                "flex flex-col items-center justify-center p-2.5 transition-transform duration-150 active:scale-90",
                pathname === "/posts/new" ? "text-primary" : "text-muted-foreground"
              )}
            >
              <PlusSquare
                className={clsx(
                  "w-[23px] h-[23px] transition-all",
                  pathname === "/posts/new"
                    ? "fill-primary/10 stroke-primary stroke-[2]"
                    : "stroke-[2]"
                )}
              />
            </Link>

            <Link
              href="/reels"
              className={clsx(
                "flex flex-col items-center justify-center p-2.5 transition-transform duration-150 active:scale-90",
                pathname === "/reels" ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Cpu
                className={clsx(
                  "w-[23px] h-[23px] transition-all",
                  pathname === "/reels" ? "stroke-[2.5] stroke-primary" : "stroke-[2]"
                )}
              />
            </Link>

            <Link
              href="/profile"
              className={clsx(
                "flex flex-col items-center justify-center p-2.5 transition-transform duration-150 active:scale-90",
                pathname === "/profile" ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div
                className={clsx(
                  "w-[26px] h-[26px] rounded-full flex items-center justify-center overflow-hidden border transition-all",
                  pathname === "/profile"
                    ? "border-primary ring-1 ring-primary ring-offset-1 ring-offset-background"
                    : "border-transparent"
                )}
              >
                <div className="w-full h-full rounded-full bg-secondary text-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                  ME
                </div>
              </div>
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
