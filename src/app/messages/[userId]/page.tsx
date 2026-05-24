"use client";
/* eslint-disable react-hooks/set-state-in-effect, react/jsx-no-comment-textnodes */

import React, { useState, useEffect, useRef, use } from "react";
import { ChevronLeft, Phone, Video, Info, Image as ImageIcon, Terminal } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar, UIUser } from "@/components/Cards";

interface Message {
  id: string;
  senderId: string;
  recipientId?: string;
  text: string;
  timestamp: string;
  type?: "text" | "join_request";
  ideaTitle?: string;
  status?: "pending" | "accepted" | "declined";
}

interface ChatPageProps {
  params: Promise<{ userId: string }>;
}

const supabase = createClient();

export default function ChatPage({ params }: ChatPageProps) {
  const { userId } = use(params);
  const router = useRouter();

  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [partner, setPartner] = useState<UIUser | null>(null);
  const [currentUser, setCurrentUser] = useState<UIUser | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessagesAndPartner = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      setCurrentUser({
        id: user.id,
        name: user.email?.split("@")[0] || "Me",
        college: "Buildr Node",
        initials: "ME",
      });

      // 1. Fetch partner profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id,name,college,department,year,avatar_url")
        .eq("id", userId)
        .single();

      if (profile) {
        setPartner({
          id: profile.id,
          name: profile.name,
          college: profile.college,
          dept: profile.department || "EE",
          year: profile.year || "‘25",
          avatar_url: profile.avatar_url || undefined,
          initials: profile.name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
        });
      }

      // 2. Fetch decrypted thread messages
      const res = await fetch(`/api/messages/thread?userId=${userId}`);
      const threadMsgs = await res.json();
      if (Array.isArray(threadMsgs)) {
        setMessages(threadMsgs);
      }
    } catch (err) {
      console.error("Error loading chat details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessagesAndPartner();

    // Subscribe to real-time changes in messages
    const channel = supabase
      .channel(`chat_thread_${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          // If the message is between us and the partner, sync
          const sender = payload.new.sender_id;
          const recipient = payload.new.recipient_id;
          if (
            (sender === userId && recipient === currentUser?.id) ||
            (sender === currentUser?.id && recipient === userId)
          ) {
            fetchMessagesAndPartner();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, currentUser?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!msg.trim() || !currentUser?.id) return;

    const messageText = msg.trim();
    setMsg("");

    // 1. Optimistic update
    const tempId = `temp_${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      senderId: currentUser.id,
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      // 2. Send via encrypted API route
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: userId,
          content: messageText,
        }),
      });

      if (!res.ok) {
        console.error("Failed to send message securely");
      }

      // 3. Trigger responder typing indicator for interactive premium feel
      setIsTyping(true);
      setTimeout(async () => {
        setIsTyping(false);
        const responses = [
          "That sounds like an amazing direction! Let's get a call scheduled to talk through the architecture. 🚀",
          "Absolutely. I've been thinking about this exact stack. Should we jump on a call tomorrow?",
          "Love this. I've sketched some rough Figma UI ideas. I'll drop the link in a sec!",
          "Yes! Let's do it. What time are you free today to align on goals?",
          "Awesome! I'm completely down. Let's start sketching the data schemas.",
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];

        // Save mock response dynamically to keep active feel
        await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientId: currentUser.id,
            content: randomResponse,
          }),
        });

        // Sync messages immediately
        fetchMessagesAndPartner();
      }, 1500);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleRequestResponse = async (messageId: string, status: "accepted" | "declined") => {
    if (!currentUser?.id) return;

    // Optimistically update status
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, status } : m))
    );

    // Save a custom auto-generated chat confirmation
    const confirmText =
      status === "accepted"
        ? `Offer accepted! Let's build together. 🎉`
        : "No worries, thanks for reaching out!";

    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientId: userId,
        content: confirmText,
      }),
    });

    fetchMessagesAndPartner();
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground w-full sm:max-w-md sm:mx-auto relative z-50 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 bg-background/95 backdrop-blur-md z-40 border-b border-border select-none shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/messages")}
            className="p-1 -ml-1 text-foreground hover:text-cyan-400 transition-colors"
          >
            <ChevronLeft size={22} />
          </button>

          {loading || !partner ? (
            <div className="flex items-center gap-2 animate-pulse">
              <div className="rounded-full w-8 h-8 bg-white/10 border border-white/5" />
              <div className="flex flex-col gap-1">
                <div className="w-20 h-3 bg-white/15 rounded-full" />
                <div className="w-12 h-2.5 bg-emerald-500/10 rounded-full" />
              </div>
            </div>
          ) : (
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => router.push(`/profile/${partner.id}`)}
            >
              <div className="rounded-full p-[1px] border border-white/5">
                <Avatar user={partner} size="sm" hasStory={false} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-space-grotesk font-bold text-[13.5px] leading-tight truncate">
                  {partner.name}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> active_now
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Video & Voice icons */}
        <div className="flex items-center gap-3.5 text-foreground">
          <button className="hover:text-cyan-400 transition-colors p-1.5 rounded-lg hover:bg-secondary/40">
            <Phone size={18} />
          </button>
          <button className="hover:text-cyan-400 transition-colors p-1.5 rounded-lg hover:bg-secondary/40">
            <Video size={18} />
          </button>
          <button className="hover:text-cyan-400 transition-colors p-1.5 rounded-lg hover:bg-secondary/40">
            <Info size={18} />
          </button>
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 no-scrollbar">
        {loading || !partner ? (
          <div className="flex flex-col items-center gap-2 py-6 shrink-0 animate-pulse">
            <div className="w-20 h-20 bg-white/10 rounded-full border border-white/5" />
            <div className="w-28 h-4.5 bg-white/15 rounded-full mt-2" />
            <div className="w-40 h-3 bg-white/10 rounded-full mt-1.5" />
            <div className="w-24 h-7 bg-white/10 rounded-md mt-3" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-6 shrink-0">
            <div className="p-[2px] buildr-ring-gradient huddle-active-pulse rounded-full">
              <div className="rounded-full border-2 border-background overflow-hidden">
                <Avatar user={partner} size="xl" hasStory={false} />
              </div>
            </div>
            <h2 className="text-[16px] font-space-grotesk font-extrabold mt-1">{partner.name}</h2>
            <span className="text-muted-foreground font-mono text-[10px] leading-none">
              {partner.college} • {partner.dept} • Year {partner.year}
            </span>
            <button
              onClick={() => router.push(`/profile/${partner.id}`)}
              className="mt-3 px-3.5 py-1.5 bg-secondary text-foreground text-[11px] font-mono rounded-md border border-border/40 hover:bg-secondary/80 transition-colors"
            >
              view_profile
            </button>
          </div>
        )}

        <div className="text-center my-2 select-none shrink-0">
          <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest bg-secondary/40 px-2.5 py-1 rounded-full border border-border/10">
            // secure connection active
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4 animate-pulse">
            <div className="flex justify-start">
              <div className="w-1/2 h-9 bg-white/10 rounded-[20px] rounded-bl-[4px] border border-white/5" />
            </div>
            <div className="flex justify-end">
              <div className="w-1/3 h-9 bg-gradient-to-r from-indigo-500/30 to-cyan-500/30 rounded-[20px] rounded-br-[4px] border border-cyan-500/10" />
            </div>
            <div className="flex justify-start">
              <div className="w-3/5 h-16 bg-white/5 rounded-2xl border border-white/5 p-3 flex flex-col gap-2">
                <div className="w-1/4 h-2 bg-white/10 rounded-full" />
                <div className="w-3/4 h-3 bg-white/10 rounded-full mt-1" />
                <div className="w-1/2 h-3.5 bg-white/15 rounded-full mt-1" />
              </div>
            </div>
            <div className="flex justify-end">
              <div className="w-1/2 h-9 bg-gradient-to-r from-indigo-500/30 to-cyan-500/30 rounded-[20px] rounded-br-[4px] border border-cyan-500/10" />
            </div>
            <div className="flex justify-start">
              <div className="w-2/3 h-9 bg-white/10 rounded-[20px] rounded-bl-[4px] border border-white/5" />
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.senderId === currentUser?.id;

            if (m.type === "join_request") {
              const hasResponded = m.status === "accepted" || m.status === "declined";
              return (
                <div key={m.id} className="flex justify-start">
                  <div className="bg-card border border-border rounded-2xl p-4 max-w-[85%] flex flex-col gap-3.5 shadow-sm">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] text-cyan-400 font-mono uppercase font-bold tracking-wider leading-none">
                        COLLAB REQUEST
                      </span>
                      <h3 className="text-[14px] font-space-grotesk font-extrabold text-foreground mt-1.5 leading-snug">
                        {m.ideaTitle}
                      </h3>
                    </div>
                    {hasResponded ? (
                      <div className="px-3 py-1.5 rounded-full bg-secondary text-foreground text-[11px] font-mono text-center border border-border/40">
                        {m.status === "accepted" ? "Accepted ✓" : "Declined ✗"}
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRequestResponse(m.id, "accepted")}
                          className="flex-1 py-1.5 rounded-full text-[11px] font-mono font-bold bg-cyan-500 text-white hover:bg-cyan-600 transition-all shadow-sm"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRequestResponse(m.id, "declined")}
                          className="flex-1 py-1.5 rounded-full text-[11px] font-mono font-bold bg-secondary text-foreground border border-border hover:bg-secondary/80 transition-all"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"} animate-fade-in`}>
                <div
                  className={`max-w-[75%] px-4 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                    isMe
                      ? "bg-gradient-to-r from-[#6366f1] to-[#06b6d4] text-white rounded-[20px] rounded-br-[4px] shadow-[0_4px_16px_rgba(6,182,212,0.15)]"
                      : "bg-secondary text-foreground rounded-[20px] rounded-bl-[4px] border border-border/20"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })
        )}

        {isTyping && (
          <div className="flex justify-start items-center gap-2 animate-fade-in">
            <div className="bg-secondary border border-border/20 text-muted-foreground rounded-[20px] rounded-bl-[4px] px-4 py-3 flex gap-1 items-center shadow-sm">
              <div
                className="w-1.5 h-1.5 bg-muted-foreground/80 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="w-1.5 h-1.5 bg-muted-foreground/80 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <div
                className="w-1.5 h-1.5 bg-muted-foreground/80 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Message Composer */}
      <form onSubmit={handleSend} className="px-4 py-3.5 border-t border-border bg-background pb-safe shrink-0">
        <div className="flex items-center gap-2 bg-[#0b0f19]/40 border border-border rounded-xl py-2 pl-3.5 pr-2.5">
          <div className="flex items-center justify-center w-5 h-5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[9px] font-mono shrink-0">
            &gt;_
          </div>

          <input
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="compile message..."
            className="flex-1 bg-transparent border-none text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:outline-none focus:ring-0 font-mono"
          />

          {msg.trim() ? (
            <button
              type="submit"
              className="px-3.5 py-1 rounded bg-cyan-500 text-white font-bold font-mono text-[11px] hover:bg-cyan-600 transition-colors shadow-md shadow-cyan-500/25"
            >
              RUN
            </button>
          ) : (
            <div className="flex items-center gap-3 text-muted-foreground shrink-0 pr-1.5">
              <button type="button" className="hover:text-cyan-400 transition-colors">
                <ImageIcon size={16} />
              </button>
              <button type="button" className="hover:text-cyan-400 transition-colors">
                <Terminal size={15} />
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
