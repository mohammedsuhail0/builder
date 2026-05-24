"use client";

import React, { useState, useEffect } from "react";
import { X, Send, Heart } from "lucide-react";
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
  const [commentLikes, setCommentLikes] = useState<Record<string, { liked: boolean; count: number }>>({});
  
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

  // Load comment likes from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("buildr_comment_likes");
      if (stored) {
        try {
          setCommentLikes(JSON.parse(stored));
        } catch (_) {}
      }
    }
  }, [postId]);

  const handleLikeComment = (commentId: string) => {
    if (typeof window === "undefined") return;
    setCommentLikes((prev) => {
      const current = prev[commentId] || { liked: false, count: 0 };
      const nextLiked = !current.liked;
      const nextCount = nextLiked ? current.count + 1 : Math.max(0, current.count - 1);
      
      const updated = {
        ...prev,
        [commentId]: { liked: nextLiked, count: nextCount }
      };
      
      localStorage.setItem("buildr_comment_likes", JSON.stringify(updated));
      return updated;
    });
  };

  const syncComments = async () => {
    try {
      const res = await fetch(`/api/comments?postId=${encodeURIComponent(postId)}`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        const apiComments = Array.isArray(json.data) ? json.data : [];
        
        // Merge with local comments if any
        const localData = typeof window !== "undefined" ? localStorage.getItem(`buildr_comments_${postId}`) : null;
        const localComments = localData ? JSON.parse(localData) : [];
        
        const combined = [...apiComments];
        localComments.forEach((lc: Comment) => {
          if (!combined.some(c => c.id === lc.id)) {
            combined.push(lc);
          }
        });
        combined.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        setComments(combined);
      } else {
        // Fallback to local storage
        const localData = typeof window !== "undefined" ? localStorage.getItem(`buildr_comments_${postId}`) : null;
        const localComments = localData ? JSON.parse(localData) : [];
        setComments(localComments);
      }
    } catch (err) {
      console.error("Error fetching comments, falling back to localStorage:", err);
      const localData = typeof window !== "undefined" ? localStorage.getItem(`buildr_comments_${postId}`) : null;
      const localComments = localData ? JSON.parse(localData) : [];
      setComments(localComments);
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

    const tempId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    const localCommentObj: Comment = {
      id: tempId,
      post_id: postId,
      author_id: currentUser?.id || "local-user",
      text,
      created_at: new Date().toISOString(),
      profiles: currentUser ? {
        id: currentUser.id,
        name: currentUser.name,
        avatar_url: null,
      } : {
        id: "local-user",
        name: "builder",
        avatar_url: null,
      }
    };

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, text }),
      });

      if (res.ok) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("buildr_comment_added", { detail: { postId } }));
        }
        await syncComments();
        onCommentAdded();
      } else {
        console.warn("API comment creation failed, saving to local storage fallback");
        saveLocalComment(localCommentObj);
      }
    } catch (err) {
      console.error("Failed to add comment, saving to local storage fallback:", err);
      saveLocalComment(localCommentObj);
    }
  };

  const saveLocalComment = (comment: Comment) => {
    if (typeof window !== "undefined") {
      const localData = localStorage.getItem(`buildr_comments_${postId}`);
      const localComments = localData ? JSON.parse(localData) : [];
      localComments.push(comment);
      localStorage.setItem(`buildr_comments_${postId}`, JSON.stringify(localComments));
      
      window.dispatchEvent(new CustomEvent("buildr_comment_added", { detail: { postId } }));
      syncComments();
      onCommentAdded();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex flex-col justify-end">
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
              const isLiked = commentLikes[comment.id]?.liked || false;
              const likeCount = commentLikes[comment.id]?.count || 0;
              
              return (
                <div key={comment.id} className="flex gap-3 items-start animate-fade-in">
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
                  <div className="flex flex-col flex-1 bg-secondary/40 rounded-[18px] px-4 py-2.5 border border-border/10 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-foreground leading-none">
                        {authorName}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{formatTimestamp(comment.created_at)}</span>
                    </div>
                    <p className="text-[13px] text-foreground/90 mt-2 leading-relaxed pr-8">{comment.text}</p>
                    
                    {/* Heart Like Button */}
                    <button
                      type="button"
                      onClick={() => handleLikeComment(comment.id)}
                      className={`absolute right-3.5 bottom-2.5 flex items-center gap-1 text-[10px] font-mono font-bold transition-all transform active:scale-75 hover:scale-105 cursor-pointer ${
                        isLiked 
                          ? "text-rose-500 animate-spark-pop" 
                          : "text-muted-foreground hover:text-rose-400"
                      }`}
                      title={isLiked ? "Unlike input" : "Like input"}
                    >
                      <Heart 
                        size={12} 
                        className={`${isLiked ? "fill-rose-500 stroke-rose-500 animate-spark-pop" : "stroke-[2.5]"}`} 
                      />
                      {likeCount > 0 && <span>{likeCount}</span>}
                    </button>
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
