"use client";
/* eslint-disable react-hooks/set-state-in-effect, react/jsx-no-comment-textnodes */

import React, { useState, useEffect } from "react";
import { Zap, MessageCircle, Send, Bookmark, MoreHorizontal, Smile, Terminal } from "lucide-react";
import { useRouter } from "next/navigation";

// Define hybrid types that work with both mock data and real Supabase columns
export type UIUser = {
  id: string;
  name: string;
  initials?: string;
  avatar_url?: string | null;
  avatar?: string; // fallback
  college: string;
  dept?: string;
  department?: string;
  year?: string | number;
  build_statement?: string;
  buildStatement?: string;
  skills?: string[];
};

export type UIPost = {
  id: string;
  type?: "idea" | "update";
  title?: string;
  description?: string;
  projectName?: string;
  project_name?: string;
  updateText?: string;
  update_text?: string;
  skills_needed?: string[];
  skillsNeeded?: string[];
  image_urls?: string[];
  imageUrls?: string[];
  created_at?: string;
  timestamp?: string;
  likes?: number;
  comments?: number;
  isRequested?: boolean;
  is_requested?: boolean;
  liked?: boolean;
  author_id?: string;
  profiles?: UIUser | null;
  author?: UIUser; // fallback
  idea_timestamps?: {
    posted_at: string;
    author_name: string;
    author_college: string;
  }[] | null;
};

// Reusable micro-components
export function Avatar({
  user,
  size = "md",
  hasStory = true,
}: {
  user: UIUser;
  size?: "sm" | "md" | "lg" | "xl";
  hasStory?: boolean;
}) {
  const sizes = {
    sm: "w-8 h-8 text-[11px]",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
  };

  const initials =
    user.initials ||
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ||
    "??";

  const avatarSrc = user.avatar_url || user.avatar;

  const borderClass = hasStory
    ? "p-[1.5px] buildr-ring-gradient huddle-active-pulse rounded-full"
    : "border border-border rounded-full";

  return (
    <div className={borderClass}>
      <div
        className={`${sizes[size]} rounded-full bg-secondary text-primary flex items-center justify-center font-bold border border-background shrink-0 overflow-hidden relative`}
      >
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt={user.name}
            className="w-full h-full object-cover absolute inset-0"
          />
        ) : (
          <span className="font-bold select-none">{initials}</span>
        )}
      </div>
    </div>
  );
}

export function AvatarStack({ users, max = 3 }: { users: UIUser[]; max?: number }) {
  const displayUsers = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className="flex items-center -space-x-2">
      {displayUsers.map((user, i) => (
        <div
          key={user.id}
          className="relative z-10 border-2 border-background rounded-full"
          style={{ zIndex: 10 - i }}
        >
          <Avatar user={user} size="sm" hasStory={false} />
        </div>
      ))}
      {remaining > 0 && (
        <div
          className="relative z-0 border-2 border-background rounded-full bg-secondary w-8 h-8 flex items-center justify-center text-[11px] font-bold text-secondary-foreground"
          style={{ zIndex: 0 }}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}

export function SkillPill({ skill }: { skill: string }) {
  return (
    <span className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-[12px] font-semibold tracking-wide whitespace-nowrap border border-border/10 shadow-sm">
      {skill}
    </span>
  );
}

export function WantInButton({
  requested: initialRequested,
  postId,
}: {
  requested?: boolean;
  postId: string;
}) {
  const [requested, setRequested] = useState(initialRequested || false);
  const router = useRouter();

  // Load request state from localStorage if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isReq = localStorage.getItem(`buildr_requested_${postId}`) === "true";
      if (isReq) setRequested(true);
    }
  }, [postId]);

  const handleRequest = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!requested) {
      setRequested(true);
      if (typeof window !== "undefined") {
        localStorage.setItem(`buildr_requested_${postId}`, "true");
      }
      // Let's redirect to messages/DM after a short micro-animation
      setTimeout(() => {
        router.push(`/messages?postId=${postId}`);
      }, 150);
    } else {
      router.push(`/messages?postId=${postId}`);
    }
  };

  return (
    <button
      onClick={handleRequest}
      className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all transform active:scale-95 cursor-pointer ${
        requested
          ? "bg-secondary text-foreground"
          : "bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/25"
      }`}
    >
      {requested ? "requested ✓" : "want in"}
    </button>
  );
}

// Helper to extract clean field values from hybrid profiles/author rows
const getAuthor = (post: UIPost): UIUser => {
  if (post.profiles) return post.profiles;
  if (post.author) return post.author;

  // Fallback using timestamps
  const ts = post.idea_timestamps?.[0];
  return {
    id: post.author_id || "unknown",
    name: ts?.author_name || "Unknown Builder",
    college: ts?.author_college || "Buildr Institute",
    dept: "CS",
    initials: (ts?.author_name || "UB")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
  };
};

const getSkillsNeeded = (post: UIPost): string[] => {
  return post.skills_needed || post.skillsNeeded || [];
};

const getTitle = (post: UIPost): string => {
  return post.title || "Untitled Idea";
};

const getDescription = (post: UIPost): string => {
  return post.description || "";
};

const getLikesCount = (post: UIPost): number => {
  return typeof post.likes === "number" ? post.likes : 0;
};

const getCommentsCount = (post: UIPost): number => {
  return typeof post.comments === "number" ? post.comments : 0;
};

const getTimestamp = (post: UIPost): string => {
  if (post.timestamp) return post.timestamp;
  if (post.idea_timestamps?.[0]?.posted_at) {
    return new Date(post.idea_timestamps[0].posted_at).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (post.created_at) {
    return new Date(post.created_at).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return "Just now";
};

export function IdeaCard({
  post,
  onCommentClick,
  onLikeToggle,
}: {
  post: UIPost;
  onCommentClick?: (postId: string) => void;
  onLikeToggle?: () => void;
}) {
  const author = getAuthor(post);
  const title = getTitle(post);
  const description = getDescription(post);
  const skillsNeeded = getSkillsNeeded(post);
  const timeStr = getTimestamp(post);

  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(getLikesCount(post));
  const [saved, setSaved] = useState(false);
  const [showSparkPop, setShowSparkPop] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [commentCount, setCommentCount] = useState(getCommentsCount(post));
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const [rxRes, cmRes] = await Promise.all([
        fetch(`/api/reactions?ids=${encodeURIComponent(post.id)}`, { cache: "no-store" }),
        fetch(`/api/comments?postId=${encodeURIComponent(post.id)}`, { cache: "no-store" }),
      ]);
      if (rxRes.ok) {
        const rx = await rxRes.json();
        setLikesCount(rx?.counts?.[post.id] ?? getLikesCount(post));
        setLiked(Boolean(rx?.liked?.[post.id]));
      }
      if (cmRes.ok) {
        const cm = await cmRes.json();
        setCommentCount(Array.isArray(cm?.data) ? cm.data.length : getCommentsCount(post));
      }
      if (typeof window !== "undefined") {
        setSaved(localStorage.getItem(`buildr_saved_${post.id}`) === "true");
      }
    };
    load();
  }, [post.id, post.likes, post.comments]);

  const handleLike = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextLiked = !liked;
    setLiked(nextLiked);
    const delta = nextLiked ? 1 : -1;
    setLikesCount((prev) => Math.max(0, prev + delta));

    fetch("/api/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: post.id, liked: nextLiked }),
    }).catch(() => undefined);

    if (onLikeToggle) onLikeToggle();
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSaved = !saved;
    setSaved(nextSaved);
    if (typeof window !== "undefined") {
      localStorage.setItem(`buildr_saved_${post.id}`, nextSaved ? "true" : "false");
    }
  };

  const handleImageTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTap < DOUBLE_TAP_DELAY) {
      if (!liked) {
        handleLike();
      }
      setShowSparkPop(true);
      setTimeout(() => setShowSparkPop(false), 750);
    } else {
      setLastTap(now);
    }
  };

  return (
    <div className="bg-card border-y sm:border sm:rounded-2xl border-border py-4 flex flex-col gap-3.5 shadow-sm transition-[box-shadow,border-color] duration-150 hover:shadow-md hover:border-primary/10 w-full text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between px-4">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => router.push(`/profile/${author.id}`)}
        >
          <Avatar user={author} size="sm" hasStory={true} />
          <div className="flex flex-col">
            <span className="text-foreground text-[13.5px] font-bold leading-none flex items-center gap-1.5">
              {author.name}
              <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded-[4px] font-mono leading-none">
                BUILDER
              </span>
            </span>
            <span className="text-muted-foreground text-[10.5px] mt-1">
              {author.college} · {author.dept || author.department || "CS"}
            </span>
          </div>
        </div>
        <button className="text-muted-foreground p-1.5 hover:text-foreground transition-colors cursor-pointer">
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Workspace Frame */}
      <div
        onClick={handleImageTap}
        className="relative aspect-square w-full bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] flex flex-col items-center justify-center p-6 text-center select-none cursor-pointer border-y border-border/10 overflow-hidden group"
      >
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <span className="text-accent/40 font-mono uppercase tracking-widest text-[9px] absolute top-4 left-4 flex items-center gap-1">
          <Terminal size={10} /> buildr // workspace_idea
        </span>

        <h2 className="text-white font-space-grotesk font-extrabold text-[20px] leading-snug drop-shadow-md px-2 max-w-[280px] z-10 transition-transform group-hover:scale-102">
          {title}
        </h2>

        <p className="text-slate-300 text-[12.5px] mt-3 font-medium max-w-[260px] leading-relaxed drop-shadow-sm line-clamp-5 z-10">
          {description}
        </p>

        {skillsNeeded.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 mt-4 max-w-[260px] z-10">
            {skillsNeeded.map((s) => (
              <span
                key={s}
                className="px-2 py-0.5 rounded-md bg-white/5 text-slate-300 text-[9px] font-mono border border-white/10 uppercase tracking-wide"
              >
                #{s}
              </span>
            ))}
          </div>
        )}

        {showSparkPop && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <Zap className="w-24 h-24 text-accent fill-accent animate-spark-pop drop-shadow-[0_8px_32px_rgba(6,182,212,0.5)]" />
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between px-4 pt-1">
        <div className="flex items-center gap-5">
          <button
            onClick={handleLike}
            className={`transition-all duration-150 transform hover:scale-110 active:scale-75 cursor-pointer ${
              liked ? "text-accent" : "text-foreground hover:text-primary"
            }`}
          >
            <Zap size={22} className={liked ? "fill-accent stroke-accent" : "stroke-[2]"} />
          </button>

          <button
            onClick={() => onCommentClick && onCommentClick(post.id)}
            className="text-foreground hover:text-primary transition-all duration-150 transform hover:scale-110 active:scale-75 cursor-pointer"
          >
            <MessageCircle size={22} />
          </button>

          <button
            onClick={() => router.push(`/messages?postId=${post.id}`)}
            className="text-foreground hover:text-primary transition-all duration-150 transform hover:scale-110 active:scale-75 cursor-pointer"
          >
            <Send size={20} className="rotate-12" />
          </button>
        </div>

        <button
          onClick={handleSave}
          className={`transition-all duration-150 transform hover:scale-110 active:scale-75 cursor-pointer ${
            saved ? "text-primary" : "text-foreground hover:text-primary"
          }`}
        >
          <Bookmark size={22} className={saved ? "fill-primary stroke-primary" : "stroke-[2]"} />
        </button>
      </div>

      {/* Details */}
      <div className="flex flex-col gap-1 px-4">
        <span className="text-[13px] font-extrabold text-foreground leading-none">
          {likesCount} Sparks
        </span>

        <p className="text-[13px] text-foreground leading-normal mt-1">
          <span className="font-extrabold mr-1.5 hover:underline cursor-pointer">{author.name}</span>
          <span className="text-foreground/90">{description}</span>
        </p>

        {/* Collaborators wanted card */}
        <div className="flex items-center justify-between bg-secondary/50 rounded-xl px-4 py-2.5 mt-2 border border-border/10">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-[11px] font-extrabold tracking-wide uppercase text-secondary-foreground">
              Collaborators wanted
            </span>
          </div>
          <WantInButton requested={post.isRequested || post.is_requested} postId={post.id} />
        </div>

        {onCommentClick && (
          <button
            onClick={() => onCommentClick(post.id)}
            className="text-[12.5px] text-primary text-left hover:text-primary/80 font-bold mt-2 cursor-pointer"
          >
            Show discussions ({commentCount})
          </button>
        )}

        <span className="text-[9.5px] text-muted-foreground uppercase tracking-wider mt-1.5 font-bold">
          {timeStr}
        </span>
      </div>
    </div>
  );
}

export function UpdateCard({
  post,
  onCommentClick,
  onLikeToggle,
}: {
  post: UIPost;
  onCommentClick?: (postId: string) => void;
  onLikeToggle?: () => void;
}) {
  const author = getAuthor(post);
  const projectName = post.projectName || post.project_name || "Untitled Project";
  const updateText = post.updateText || post.update_text || "";
  const timeStr = getTimestamp(post);

  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(getLikesCount(post));
  const [saved, setSaved] = useState(false);
  const [showSparkPop, setShowSparkPop] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [commentCount, setCommentCount] = useState(getCommentsCount(post));
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const [rxRes, cmRes] = await Promise.all([
        fetch(`/api/reactions?ids=${encodeURIComponent(post.id)}`, { cache: "no-store" }),
        fetch(`/api/comments?postId=${encodeURIComponent(post.id)}`, { cache: "no-store" }),
      ]);
      if (rxRes.ok) {
        const rx = await rxRes.json();
        setLikesCount(rx?.counts?.[post.id] ?? getLikesCount(post));
        setLiked(Boolean(rx?.liked?.[post.id]));
      }
      if (cmRes.ok) {
        const cm = await cmRes.json();
        setCommentCount(Array.isArray(cm?.data) ? cm.data.length : getCommentsCount(post));
      }
      if (typeof window !== "undefined") {
        setSaved(localStorage.getItem(`buildr_saved_${post.id}`) === "true");
      }
    };
    load();
  }, [post.id, post.likes, post.comments]);

  const handleLike = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextLiked = !liked;
    setLiked(nextLiked);
    const delta = nextLiked ? 1 : -1;
    setLikesCount((prev) => Math.max(0, prev + delta));

    fetch("/api/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: post.id, liked: nextLiked }),
    }).catch(() => undefined);

    if (onLikeToggle) onLikeToggle();
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSaved = !saved;
    setSaved(nextSaved);
    if (typeof window !== "undefined") {
      localStorage.setItem(`buildr_saved_${post.id}`, nextSaved ? "true" : "false");
    }
  };

  const handleImageTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTap < DOUBLE_TAP_DELAY) {
      if (!liked) {
        handleLike();
      }
      setShowSparkPop(true);
      setTimeout(() => setShowSparkPop(false), 750);
    } else {
      setLastTap(now);
    }
  };

  return (
    <div className="bg-card border-y sm:border sm:rounded-2xl border-border py-4 flex flex-col gap-3.5 shadow-sm transition-[box-shadow,border-color] duration-150 hover:shadow-md hover:border-primary/10 w-full text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between px-4">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => router.push(`/profile/${author.id}`)}
        >
          <Avatar user={author} size="sm" hasStory={true} />
          <div className="flex flex-col">
            <span className="text-foreground text-[13.5px] font-bold leading-none hover:underline cursor-pointer flex items-center gap-1.5">
              {author.name}
              <span className="text-[10px] bg-accent/10 text-accent border border-accent/20 px-1.5 py-0.5 rounded-[4px] font-mono leading-none">
                CREATOR
              </span>
            </span>
            <span className="text-muted-foreground text-[10.5px] mt-1">
              updated {projectName}
            </span>
          </div>
        </div>
        <button className="text-muted-foreground p-1.5 hover:text-foreground transition-colors cursor-pointer">
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* coding terminal frame */}
      <div
        onClick={handleImageTap}
        className="relative aspect-video w-full bg-gradient-to-br from-[#060814] to-[#111425] flex flex-col items-center justify-center p-5 text-center select-none cursor-pointer border-y border-border/10 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-accent/5 pointer-events-none" />

        <span className="text-primary/40 font-mono uppercase tracking-widest text-[8px] absolute top-3 left-4 flex items-center gap-1">
          <Terminal size={10} /> buildr // update_terminal
        </span>

        <div className="absolute top-3 right-4 flex items-center gap-1.5 bg-black/40 border border-white/5 rounded-full px-2 py-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[8px] text-accent font-bold font-mono">PUSH COMPILE</span>
        </div>

        <div className="w-[85%] rounded-xl bg-black/75 border border-white/10 backdrop-blur-md p-4 text-left font-mono max-w-[280px] shadow-lg relative z-10">
          <p className="text-white/20 text-[9px]">// repository: {projectName}</p>
          <p className="text-accent font-bold text-xs mt-1 font-mono">➜ status: DEPLOY_SUCCESS</p>
          <p className="text-slate-300 text-xs mt-2 leading-relaxed font-mono">
            {updateText}
          </p>
        </div>

        {showSparkPop && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <Zap className="w-24 h-24 text-accent fill-accent animate-spark-pop drop-shadow-[0_8px_32px_rgba(6,182,212,0.5)]" />
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between px-4 pt-1">
        <div className="flex items-center gap-5">
          <button
            onClick={handleLike}
            className={`transition-all duration-150 transform hover:scale-110 active:scale-75 cursor-pointer ${
              liked ? "text-accent" : "text-foreground hover:text-primary"
            }`}
          >
            <Zap size={22} className={liked ? "fill-accent stroke-accent" : "stroke-[2]"} />
          </button>

          <button
            onClick={() => onCommentClick && onCommentClick(post.id)}
            className="text-foreground hover:text-primary transition-all duration-150 transform hover:scale-110 active:scale-75 cursor-pointer"
          >
            <MessageCircle size={22} />
          </button>

          <button
            onClick={() => router.push(`/messages?postId=${post.id}`)}
            className="text-foreground hover:text-primary transition-all duration-150 transform hover:scale-110 active:scale-75 cursor-pointer"
          >
            <Send size={20} className="rotate-12" />
          </button>
        </div>

        <button
          onClick={handleSave}
          className={`transition-all duration-150 transform hover:scale-110 active:scale-75 cursor-pointer ${
            saved ? "text-primary" : "text-foreground hover:text-primary"
          }`}
        >
          <Bookmark size={22} className={saved ? "fill-primary stroke-primary" : "stroke-[2]"} />
        </button>
      </div>

      {/* Details */}
      <div className="flex flex-col gap-1 px-4">
        <span className="text-[13px] font-extrabold text-foreground leading-none">
          {likesCount} Sparks
        </span>

        <p className="text-[13px] text-foreground leading-normal mt-1">
          <span className="font-extrabold mr-1.5 hover:underline cursor-pointer">{author.name}</span>
          <span className="text-foreground/90">{updateText}</span>
        </p>

        {onCommentClick && (
          <button
            onClick={() => onCommentClick(post.id)}
            className="text-[12.5px] text-primary text-left hover:text-primary/80 font-bold mt-2 cursor-pointer"
          >
            Show discussions ({commentCount})
          </button>
        )}

        <span className="text-[9.5px] text-muted-foreground uppercase tracking-wider mt-1.5 font-bold">
          {timeStr}
        </span>
      </div>
    </div>
  );
}
