"use client";
/* eslint-disable react-hooks/set-state-in-effect, react/jsx-no-comment-textnodes */

import React, { useState, useEffect, useRef } from "react";
import { Zap, MessageCircle, Send, Bookmark, Music, Play, Pause, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar, UIPost, UIUser } from "@/components/Cards";
import { CommentsDrawer } from "../feed/page";

const LOOP_BG_GRADIENTS = [
  "from-[#0b0f19] via-[#111c30] to-[#0b0f19]",
  "from-[#051622] via-[#1a3a4b] to-[#051622]",
  "from-[#071615] via-[#113a36] to-[#071615]",
  "from-[#120a21] via-[#281a44] to-[#120a21]",
  "from-[#1c110b] via-[#3a2012] to-[#1c110b]",
];

const fallbackLoopsUsers: UIUser[] = [
  {
    id: "u1",
    name: "Priya M.",
    initials: "PM",
    college: "IIT Madras",
    dept: "EE",
    year: "‘25",
    build_statement: "want to build — hardware that doesn't suck.",
  },
  {
    id: "u2",
    name: "Rahul K.",
    initials: "RK",
    college: "BITS Pilani",
    dept: "Mech",
    year: "‘24",
    build_statement: "want to build — consumer robotics.",
  },
];

const fallbackLoopsPosts: UIPost[] = [
  {
    id: "p2",
    type: "update",
    author: fallbackLoopsUsers[1],
    projectName: "SyncPods",
    updateText: "Finally got the webRTC connection stable across networks. Big blocker removed.",
    timestamp: "2h ago",
    likes: 12,
    comments: 1,
  },
  {
    id: "p1",
    type: "idea",
    author: fallbackLoopsUsers[0],
    title: "Nova Class",
    description:
      "An alternative scheduling tool for our college because the official one is always down. Need someone good with reverse engineering bad APIs.",
    skillsNeeded: ["Reverse Engineering", "Backend", "React"],
    timestamp: "May 20, 10:45 AM",
    likes: 24,
    comments: 2,
    isRequested: false,
  },
  {
    id: "p3",
    type: "idea",
    author: fallbackLoopsUsers[1],
    title: "Drone Delivery Protocol",
    description:
      "Working on a standard communication protocol for intra-campus drone delivery. Currently drafting the spec, looking for RF engineers.",
    skillsNeeded: ["RF Engineering", "Systems Design"],
    timestamp: "May 19, 04:20 PM",
    likes: 56,
    comments: 0,
    isRequested: true,
  },
];

export default function ReelsPage() {
  const [updates, setUpdates] = useState<UIPost[]>([]);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<Record<string, boolean>>({});
  const [showZapPop, setShowZapPop] = useState<Record<string, boolean>>({});
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const syncUpdates = async () => {
    try {
      setLoading(true);
      // 1. Fetch live posts (focusing on updates or newest ideas)
      const { data: dbPosts } = await supabase
        .from("posts")
        .select(
          "id,title,description,skills_needed,image_urls,created_at,author_id,profiles(id,name,college,department,year,skills,avatar_url,build_statement)",
        )
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(30);

      let finalPosts: UIPost[] = [];
      if (dbPosts && dbPosts.length > 0) {
        finalPosts = dbPosts.map((p) => {
          const profile = p.profiles as unknown as UIUser | null;
          return {
            id: p.id,
            type: p.title ? "idea" : "update",
            title: p.title || undefined,
            projectName: p.title || "Repository",
            description: p.description || undefined,
            updateText: p.description || undefined,
            skills_needed: p.skills_needed,
            image_urls: p.image_urls,
            created_at: p.created_at,
            author_id: p.author_id,
            profiles: profile,
            likes: 15,
            comments: 0,
          };
        });
      }

      // Combine with fallbacks
      const combined = [...finalPosts, ...fallbackLoopsPosts];
      const unique = combined.filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);

      // Sync comments count from localStorage overlays
      const uniqueWithComments = unique.map((post) => {
        let localCount = 0;
        if (typeof window !== "undefined") {
          const localCommentsStr = localStorage.getItem(`buildr_comments_${post.id}`);
          if (localCommentsStr) {
            try {
              localCount = JSON.parse(localCommentsStr).length;
            } catch (_) {}
          }
        }
        const baseComments = post.comments || 0;
        return {
          ...post,
          comments: baseComments + localCount,
        };
      });

      setUpdates(uniqueWithComments);

      // Sync saved maps
      if (typeof window !== "undefined") {
        const savedMap: Record<string, boolean> = {};
        uniqueWithComments.forEach((post) => {
          savedMap[post.id] = localStorage.getItem(`buildr_saved_${post.id}`) === "true";
        });
        setSavedPosts(savedMap);
      }
    } catch (err) {
      console.error("Error synchronizing reels page updates:", err);
    } finally {
      // Small artificial timeout so skeleton screen shimmer is beautifully visible and feels organic
      setTimeout(() => {
        setLoading(false);
      }, 600);
    }
  };

  useEffect(() => {
    syncUpdates();
  }, []);

  const handleLike = (postId: string) => {
    if (typeof window === "undefined") return;
    const likedKey = `buildr_liked_${postId}`;
    const wasLiked = localStorage.getItem(likedKey) === "true";

    setUpdates((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const originalLikes = post.likes || 0;
          if (wasLiked) {
            localStorage.setItem(likedKey, "false");
            return { ...post, likes: Math.max(0, originalLikes - 1) };
          } else {
            localStorage.setItem(likedKey, "true");
            return { ...post, likes: originalLikes + 1 };
          }
        }
        return post;
      }),
    );
  };

  const handleDoubleTap = (postId: string) => {
    if (typeof window === "undefined") return;
    const likedKey = `buildr_liked_${postId}`;
    const wasLiked = localStorage.getItem(likedKey) === "true";

    if (!wasLiked) {
      handleLike(postId);
    }

    // Trigger glowing electric bolt popping animation
    setShowZapPop((prev) => ({ ...prev, [postId]: true }));
    setTimeout(() => {
      setShowZapPop((prev) => ({ ...prev, [postId]: false }));
    }, 750);
  };

  const handleSave = (postId: string) => {
    const isSaved = savedPosts[postId];
    localStorage.setItem(`buildr_saved_${postId}`, isSaved ? "false" : "true");
    setSavedPosts((prev) => ({ ...prev, [postId]: !isSaved }));
  };

  const togglePlay = (postId: string) => {
    setIsPlaying((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  return (
    <div className="flex flex-col h-full w-full bg-black text-white relative select-none">
      {/* Header overlay */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pt-4 pb-2 bg-gradient-to-b from-black/90 to-transparent">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/feed")}
            className="p-1 rounded-full bg-black/40 text-white hover:bg-black/60 border border-white/5 transition-colors cursor-pointer"
          >
            <ChevronLeft size={22} />
          </button>
          <span className="font-space-grotesk font-extrabold text-[20px] tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            Build Loops
          </span>
        </div>
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#111827]/80 backdrop-blur-md border border-cyan-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[10px] font-mono tracking-wider text-cyan-400">ACTIVE HUD</span>
        </div>
      </div>

      {/* Compiler Ticker HUD Panel Overlay */}
      <div className="absolute top-[60px] left-0 right-0 z-30 flex items-center justify-between px-4 py-1.5 bg-black/40 backdrop-blur-md border-y border-white/5 font-mono text-[10px] text-cyan-400/80">
        <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>
            BRANCH: <span className="text-white">main</span>
          </span>
          <span className="text-white/20">|</span>
          <span className="animate-pulse">COMPILING... 98.4% COVERAGE</span>
        </div>
        <div className="text-[9px] text-white/30 tracking-widest shrink-0">ENV: WSL2_BUILD</div>
      </div>

      {/* Scrollable Loops Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-scroll snap-y snap-mandatory h-full w-full no-scrollbar"
        style={{ scrollBehavior: "smooth" }}
      >
        {loading ? (
          <div className="snap-start relative w-full h-[calc(100vh-68px)] flex items-center justify-center bg-black overflow-hidden">
            {/* Cybernetic skeleton background backdrop */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0b0f19] via-[#111c30] to-[#0b0f19] flex flex-col items-center justify-center opacity-90">
              <div className="absolute top-[25%] left-[8%] w-32 h-32 rounded-full bg-cyan-500/5 blur-2xl animate-pulse" />
              <div className="absolute bottom-[25%] right-[8%] w-48 h-48 rounded-full bg-indigo-500/5 blur-3xl animate-pulse" />

              {/* Shimmering syntax-colored terminal frame mock skeleton */}
              <div className="w-[88%] max-w-sm rounded-2xl bg-[#0b0f19]/50 border border-white/5 backdrop-blur-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col gap-4 animate-pulse">
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  </div>
                  <div className="w-24 h-2 bg-white/10 rounded-full" />
                </div>

                <div className="font-mono text-left text-xs leading-relaxed flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <div className="w-32 h-3 bg-white/10 rounded-full" />
                    <div className="w-10 h-4 bg-white/10 rounded" />
                  </div>
                  <div className="w-48 h-3.5 bg-cyan-500/10 rounded" />

                  <div className="mt-3 p-3 rounded-lg bg-black/40 border border-white/5 flex flex-col gap-2">
                    <div className="w-full h-3 bg-white/10 rounded-full" />
                    <div className="w-11/12 h-3 bg-white/10 rounded-full" />
                    <div className="w-4/5 h-3 bg-white/10 rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Cyberpunk HUD Info & Action Overlay Shimmer */}
            <div className="absolute inset-x-0 bottom-0 z-20 p-4 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex items-end justify-between gap-6 pb-6 animate-pulse">
              {/* Left column description & tags */}
              <div className="flex flex-col gap-3.5 max-w-[76%] text-left">
                {/* User credentials */}
                <div className="flex items-center gap-2.5">
                  <div className="rounded-full w-8 h-8 bg-white/10" />
                  <div className="flex flex-col gap-1.5">
                    <div className="w-24 h-3.5 bg-white/15 rounded-full" />
                    <div className="w-12 h-2.5 bg-white/10 rounded-full" />
                  </div>
                </div>

                {/* Build desc */}
                <div className="flex flex-col gap-2">
                  <div className="w-48 h-3 bg-white/10 rounded-full" />
                  <div className="w-64 h-3 bg-white/10 rounded-full" />
                </div>

                {/* Project branch & sound loop tag */}
                <div className="w-40 h-5 bg-white/10 rounded-full" />
              </div>

              {/* Right side command actions column */}
              <div className="flex flex-col items-center gap-4.5 shrink-0 pb-1">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="flex flex-col items-center gap-1.5">
                    <div className="w-11 h-11 rounded-full bg-white/10 border border-white/5" />
                    <div className="w-6 h-2 bg-white/10 rounded-full" />
                  </div>
                ))}
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/5 mt-2" />
              </div>
            </div>
          </div>
        ) : updates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
            <span className="text-sm font-mono">// no loops compiled</span>
            <button
              onClick={() => router.push("/posts/new")}
              className="mt-4 px-6 py-2 bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500 text-white rounded-full font-bold text-xs shadow-lg shadow-indigo-500/20 cursor-pointer"
            >
              Push First Loop
            </button>
          </div>
        ) : (
          updates.map((post, index) => {
            const author = post.profiles || post.author || fallbackLoopsUsers[0];
            const authorName = author.name || "arjun";
            const isLiked = typeof window !== "undefined" && localStorage.getItem(`buildr_liked_${post.id}`) === "true";
            const saved = !!savedPosts[post.id];
            const bgGrad = LOOP_BG_GRADIENTS[index % LOOP_BG_GRADIENTS.length];
            const isReelPlaying = isPlaying[post.id] !== false;
            const projectName = post.projectName || post.projectName || "buildr-core";
            const updateText = post.updateText || post.description || "";

            return (
              <div
                key={post.id}
                className="snap-start relative w-full h-[calc(100vh-68px)] flex items-center justify-center bg-black overflow-hidden"
                onDoubleClick={() => handleDoubleTap(post.id)}
              >
                {/* Cyberpunk network background backdrop */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${bgGrad} flex flex-col items-center justify-center opacity-90`}
                >
                  <div className="absolute top-[25%] left-[8%] w-32 h-32 rounded-full bg-cyan-500/5 blur-2xl animate-pulse" />
                  <div
                    className="absolute bottom-[25%] right-[8%] w-48 h-48 rounded-full bg-indigo-500/5 blur-3xl animate-pulse"
                    style={{ animationDelay: "1.5s" }}
                  />

                  {/* Floating syntax-colored terminal frame mock */}
                  <div className="w-[88%] max-w-sm rounded-2xl bg-[#0b0f19]/70 border border-white/5 backdrop-blur-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]/80" />
                      </div>
                      <span className="text-[10px] text-white/30 font-mono tracking-tight">
                        buildr-compiler v2.4
                      </span>
                    </div>

                    <div className="font-mono text-left text-xs leading-relaxed select-none">
                      <div className="flex items-center justify-between text-white/40">
                        <span>// project: {projectName}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-cyan-400 border border-cyan-500/20">
                          Active
                        </span>
                      </div>
                      <p className="mt-2.5 font-bold text-emerald-400 flex items-center gap-1">
                        <span className="text-cyan-400">⚡</span> COMPILE_SUCCESSFUL: 100% OK
                      </p>

                      <div className="mt-3 p-3 rounded-lg bg-black/40 border border-white/5 text-white/90 font-sans text-[13px] leading-relaxed">
                        {updateText}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Big popping electric lightning bolt overlay (double tap) */}
                {showZapPop[post.id] && (
                  <div className="absolute z-30 pointer-events-none flex items-center justify-center">
                    <Zap
                      size={96}
                      className="text-cyan-400 fill-cyan-400 animate-spark-pop drop-shadow-[0_0_35px_rgba(34,211,238,0.9)]"
                    />
                  </div>
                )}

                {/* Play/Pause control handler */}
                <button
                  onClick={() => togglePlay(post.id)}
                  className="absolute inset-0 z-10 w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/10 cursor-pointer"
                >
                  <div className="p-3.5 rounded-full bg-[#0b0f19]/80 backdrop-blur-md border border-white/10 text-white transform active:scale-95 transition-transform shadow-2xl">
                    {isReelPlaying ? <Pause size={24} /> : <Play size={24} />}
                  </div>
                </button>

                {/* Cyberpunk HUD Info & Action Overlay */}
                <div className="absolute inset-x-0 bottom-0 z-20 p-4 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex items-end justify-between gap-6 pb-6">
                  {/* Left column description & tags */}
                  <div className="flex flex-col gap-3.5 max-w-[76%] text-left">
                    {/* User credentials */}
                    <div className="flex items-center gap-2.5">
                      <div className="rounded-full p-[1.5px] buildr-ring-gradient huddle-active-pulse">
                        <div className="rounded-full border border-black overflow-hidden bg-black">
                          <Avatar user={author} size="sm" hasStory={false} />
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-white flex items-center gap-1.5">
                          {authorName}
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            Dev
                          </span>
                        </span>
                      </div>
                      <button
                        onClick={() => router.push(`/profile/${author.id}`)}
                        className="px-2.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] font-mono border border-white/15 transition-colors ml-1 cursor-pointer"
                      >
                        connect
                      </button>
                    </div>

                    {/* Build desc */}
                    <p className="text-[13px] leading-relaxed text-white/90 font-sans">
                      {projectName ? (
                        <span className="text-cyan-400 font-mono font-bold mr-1.5">#{projectName}</span>
                      ) : null}
                      {updateText}
                    </p>

                    {/* Project branch & sound loop tag */}
                    <div className="flex items-center gap-2 text-[10px] text-white/60 font-mono bg-black/40 border border-white/5 py-1 px-2.5 rounded-full w-fit max-w-full">
                      <Music size={10} className="shrink-0 text-cyan-400 animate-pulse" />
                      <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                        cycle_frequency_128hz • {authorName}
                      </div>
                    </div>
                  </div>

                  {/* Right side command actions column */}
                  <div className="flex flex-col items-center gap-4.5 shrink-0 text-white pb-1 select-none">
                    {/* Upvote Sparks button */}
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`w-11 h-11 rounded-full bg-[#0b0f19]/70 border cursor-pointer ${
                          isLiked
                            ? "border-cyan-400 text-cyan-400"
                            : "border-white/10 text-white/90"
                        } flex items-center justify-center hover:bg-black/60 transition-transform active:scale-75 shadow-lg`}
                      >
                        <Zap size={20} className={isLiked ? "fill-cyan-400" : ""} />
                      </button>
                      <span className="text-[10px] font-mono tracking-wider font-bold text-white/80">
                        {post.likes || 0}
                      </span>
                    </div>

                    {/* Discussions toggle */}
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => setActiveCommentsPostId(post.id)}
                        className="w-11 h-11 rounded-full bg-[#0b0f19]/70 border border-white/10 text-white/90 flex items-center justify-center hover:bg-black/60 transition-transform active:scale-75 shadow-lg cursor-pointer"
                      >
                        <MessageCircle size={20} />
                      </button>
                      <span className="text-[10px] font-mono tracking-wider font-bold text-white/80">
                        {post.comments || 0}
                      </span>
                    </div>

                    {/* Collaboration share plane */}
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => router.push("/messages")}
                        className="w-11 h-11 rounded-full bg-[#0b0f19]/70 border border-white/10 text-white/90 flex items-center justify-center hover:bg-black/60 transition-transform active:scale-75 shadow-lg cursor-pointer"
                      >
                        <Send size={18} className="rotate-12 translate-x-[0.5px]" />
                      </button>
                      <span className="text-[9px] font-mono text-white/60 tracking-wider">COLLAB</span>
                    </div>

                    {/* Saved repo folder bookmark */}
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => handleSave(post.id)}
                        className={`w-11 h-11 rounded-full bg-[#0b0f19]/70 border cursor-pointer ${
                          saved ? "border-emerald-400 text-emerald-400" : "border-white/10 text-white/90"
                        } flex items-center justify-center hover:bg-black/60 transition-transform active:scale-75 shadow-lg`}
                      >
                        <Bookmark size={18} className={saved ? "fill-emerald-400" : ""} />
                      </button>
                      <span className="text-[9px] font-mono text-white/60 tracking-wider">
                        {saved ? "PINNED" : "PIN"}
                      </span>
                    </div>

                    {/* Spinning visual repo disc */}
                    <div
                      className="w-8 h-8 rounded-full border border-white/20 bg-black/80 flex items-center justify-center overflow-hidden animate-spin mt-2"
                      style={{ animationDuration: "6s" }}
                    >
                      <Avatar user={author} size="sm" hasStory={false} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Full Interactive Comments Drawer Overlay */}
      {activeCommentsPostId && (
        <CommentsDrawer
          postId={activeCommentsPostId}
          onClose={() => setActiveCommentsPostId(null)}
          onCommentAdded={syncUpdates}
        />
      )}
    </div>
  );
}
