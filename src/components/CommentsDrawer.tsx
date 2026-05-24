"use client";

import React, { useState, useEffect } from "react";
import { X, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/Cards";

type CommentAuthor = {
  id: string;
  name: string;
  avatar_url?: string | null;
};

type Comment = {
  id: string;
  post_id: string;
  author_id: string;
  text: string;
  created_at: string;
  profiles?: CommentAuthor | null;
};

export function CommentsDrawer({
  postId,
  onClose,
  onCommentAdded,
}: {
  postId: string;
  onClose: () => void;
  onCommentAdded: () => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; initials: string } | null>(null);
  
  const supabase = createClient();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const formatTimestamp = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    } catch (_) {
      return "Just now";
    }
  };

  const syncComments = async () => {
    try {
      const res = await fetch(`/api/comments?postId=${encodeURIComponent(postId)}`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setComments(Array.isArray(json.data) ? json.data : []);
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncComments();

    // Preload current user context to eliminate latency in submitting comments
    const preloadUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const name = user.email?.split("@")[0] || "builder";
          const initials = getInitials(name);
          setCurrentUser({ id: user.id, name, initials });
        }
      } catch (err) {
        console.error("Error preloading user context inside discussions drawer:", err);
      }
    };
    preloadUser();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const text = newComment.trim();
    setNewComment("");

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, text }),
      });

      if (res.ok) {
        // Dispatch custom event for cross-component reloads
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("buildr_comment_added", { detail: { postId } }));
        }
        await syncComments();
        onCommentAdded();
      }
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex flex-col justify-end">
      {/* Backdrop click close */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

      {/* Container */}
      <div className="bg-card border-t border-border rounded-t-[24px] max-h-[85vh] flex flex-col relative z-10 w-full sm:max-w-md sm:mx-auto shadow-2xl overflow-hidden">
        {/* Drag handle */}
        <div className="w-12 h-1.5 bg-border/40 rounded-full mx-auto my-3 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
          <span className="font-space-grotesk font-extrabold text-[17px] text-foreground">
            Discussions ({comments.length})
          </span>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 no-scrollbar">
          {loading ? (
            <div className="flex flex-col gap-3.5 animate-pulse">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-secondary" />
                  <div className="flex-1 bg-secondary/20 h-16 rounded-xl" />
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-[13px] font-medium font-mono">
              {"// no logs found. start the build discussion!"}
            </div>
          ) : (
            comments.map((comment) => {
              const authorName = comment.profiles?.name || "builder";
              const authorInitials = getInitials(authorName);
              return (
                <div key={comment.id} className="flex gap-3 items-start">
                  <Avatar 
                    user={{ 
                      id: comment.author_id, 
                      name: authorName, 
                      college: "", 
                      initials: authorInitials,
                      avatar_url: comment.profiles?.avatar_url || undefined
                    }} 
                    size="sm" 
                    hasStory={false} 
                  />
                  <div className="flex flex-col flex-1 bg-secondary/40 rounded-[18px] px-4 py-2.5 border border-border/10">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-foreground leading-none">
                        {authorName}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{formatTimestamp(comment.created_at)}</span>
                    </div>
                    <p className="text-[13px] text-foreground/90 mt-2 leading-relaxed">{comment.text}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input box */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-card pb-safe">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add your input to the build..."
              className="flex-1 bg-input rounded-full py-2.5 px-4 text-[13px] text-foreground placeholder:text-muted-foreground outline-none border border-border/30 focus:border-primary/50 transition-colors bg-secondary/50"
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="p-2.5 rounded-full bg-primary text-white disabled:opacity-30 disabled:bg-secondary disabled:text-muted-foreground transition-colors shrink-0 cursor-pointer"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
