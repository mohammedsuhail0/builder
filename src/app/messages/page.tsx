"use client";
/* eslint-disable react-hooks/set-state-in-effect, react/jsx-no-comment-textnodes */

import React, { useState, useEffect } from "react";
import { Search, ChevronLeft, MessageSquarePlus, Terminal } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar, UIUser } from "@/components/Cards";

interface DMThread {
  id: string;
  user: UIUser;
  lastMessage: string;
  time: string;
  unread: number;
  timestampNum: number;
}

const supabase = createClient();

export default function DMsPage() {
  const router = useRouter();
  const [dms, setDms] = useState<DMThread[]>([]);
  const [activeBuilders, setActiveBuilders] = useState<UIUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Sync data
  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Fallback for demo or redirect to login
        router.push("/auth/login");
        return;
      }
      setCurrentUserId(user.id);

      // 1. Fetch conversations from thread API
      const res = await fetch("/api/messages/thread");
      const threads: DMThread[] = await res.json();
      setDms(Array.isArray(threads) ? threads : []);

      // 2. Fetch other active builders for horizontal tray
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,name,college,department,avatar_url,year,skills,build_statement")
        .neq("id", user.id)
        .limit(10);

      if (profiles) {
        const uiUsers: UIUser[] = profiles.map(p => ({
          id: p.id,
          name: p.name,
          college: p.college,
          dept: p.department || "CS",
          avatar_url: p.avatar_url || undefined,
          year: p.year || "",
          skills: p.skills || [],
          build_statement: p.build_statement || "",
          initials: p.name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
        }));
        setActiveBuilders(uiUsers);
      }
    } catch (err) {
      console.error("Error fetching message data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to new messages real-time sync
    const channel = supabase
      .channel("messages_inbox_sync")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredDms = dms.filter((dm) =>
    dm.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dm.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-full bg-background text-foreground relative select-none">
      {/* Top Header */}
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 bg-background/95 backdrop-blur-md z-40 border-b border-border">
        <div className="flex items-center gap-1">
          <button
            onClick={() => router.push("/feed")}
            className="p-1 -ml-1 text-foreground hover:text-cyan-400 transition-colors"
          >
            <ChevronLeft size={22} />
          </button>

          <span className="font-space-grotesk font-extrabold text-[18px] tracking-tight flex items-center gap-2">
            Collaborations
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              ACTIVE
            </span>
          </span>
        </div>

        <button
          onClick={() => router.push("/explore")}
          className="text-foreground hover:text-cyan-400 p-1.5 rounded-lg hover:bg-secondary/50 transition-all animate-pulse"
          title="Find new developers"
        >
          <MessageSquarePlus size={20} />
        </button>
      </header>

      {/* Search Inbox */}
      <div className="px-4 py-3 border-b border-border/40 bg-card">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search channels & developers..."
            className="w-full bg-secondary/60 rounded-full py-1.5 pl-10 pr-4 text-[13px] text-foreground placeholder:text-muted-foreground outline-none border border-border/10 focus:border-cyan-500/40 transition-colors font-sans"
          />
        </div>
      </div>

      {/* Active Builders Horizontal Tray */}
      <div className="flex flex-col gap-2 py-3.5 border-b border-border/40 bg-card select-none">
        <span className="text-[11px] font-mono tracking-wider uppercase text-muted-foreground px-4">// active_huddles</span>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1 px-4">
          {loading ? (
            <div className="flex gap-4 animate-pulse">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="flex flex-col items-center shrink-0">
                  <div className="w-12 h-12 bg-white/10 rounded-full border border-white/5" />
                  <div className="w-10 h-2 bg-white/10 rounded mt-2" />
                </div>
              ))}
            </div>
          ) : (
            activeBuilders.map((user) => (
              <div
                key={user.id}
                className="flex flex-col items-center shrink-0 cursor-pointer group"
                onClick={() => router.push(`/messages/${user.id}`)}
              >
                <div className="relative">
                  <div className="rounded-full p-[1.5px] buildr-ring-gradient huddle-active-pulse">
                    <div className="rounded-full border-2 border-background overflow-hidden">
                      <Avatar user={user} size="md" hasStory={false} />
                    </div>
                  </div>
                  {/* Pulsing online badge */}
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-card shadow-sm animate-pulse" />
                </div>
                <span className="text-[10px] mt-1.5 text-muted-foreground group-hover:text-cyan-400 font-mono tracking-tight max-w-[58px] truncate text-center transition-colors">
                  {user.name.split(" ")[0].toLowerCase()}
                </span>
              </div>
            ))
          )}
          {!loading && activeBuilders.length === 0 && (
            <span className="text-[10px] text-muted-foreground font-mono px-4">No other builders registered.</span>
          )}
        </div>
      </div>

      {/* Collaboration Threads List */}
      <div className="flex flex-col flex-1 divide-y divide-border/30 bg-background">
        {loading ? (
          <div className="divide-y divide-border/30 bg-background animate-pulse">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="flex items-center gap-3.5 px-4 py-4 border-l-2 border-transparent">
                <div className="relative shrink-0">
                  <div className="rounded-full w-12 h-12 bg-white/10 border border-white/5" />
                  <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-500/20 rounded-full border-2 border-background" />
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="h-3.5 bg-white/15 rounded-full w-1/3" />
                    <div className="h-2.5 bg-white/10 rounded-full w-12" />
                  </div>
                  <div className="h-2.5 bg-white/10 rounded-full w-1/2" />
                  <div className="flex items-center justify-between gap-2 mt-1.5">
                    <div className="h-3 bg-white/10 rounded-full w-2/3" />
                    <div className="w-3.5 h-3.5 bg-white/10 rounded-full shrink-0" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredDms.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground text-xs font-mono">
            // no collaborative channels found.
          </div>
        ) : (
          filteredDms.map((dm) => {
            const hasUnread = dm.unread > 0;
            return (
              <div
                key={dm.id}
                onClick={() => router.push(`/messages/${dm.id}`)}
                className="flex items-center gap-3.5 px-4 py-4 cursor-pointer hover:bg-secondary/25 transition-all select-none border-l-2 border-transparent hover:border-cyan-500"
              >
                <div className="relative shrink-0">
                  <div className="rounded-full p-[1px] border border-white/5">
                    <Avatar user={dm.user} size="lg" hasStory={false} />
                  </div>
                  <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background animate-pulse" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[13.5px] truncate font-space-grotesk ${
                        hasUnread ? "text-foreground font-bold" : "text-foreground font-medium"
                      }`}
                    >
                      {dm.user.name}
                    </span>
                    <span className="text-muted-foreground text-[10px] font-mono shrink-0">
                      {dm.time}
                    </span>
                  </div>

                  {dm.user.college && (
                    <div className="mt-0.5 flex gap-1 items-center">
                      <span className="text-[10px] font-mono text-muted-foreground/80 truncate">
                        {dm.user.college} • {dm.user.dept}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 mt-1.5">
                    <p
                      className={`text-[12.5px] truncate flex-1 font-sans ${
                        hasUnread ? "text-cyan-400 font-semibold" : "text-muted-foreground"
                      }`}
                    >
                      {dm.lastMessage}
                    </p>
                    {hasUnread ? (
                      <div className="w-2 h-2 bg-cyan-400 rounded-full shrink-0 animate-ping" />
                    ) : (
                      <Terminal size={14} className="text-muted-foreground/40 shrink-0" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
