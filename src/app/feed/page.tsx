"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect } from "react";
import { X, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar, IdeaCard, UpdateCard, UIPost, UIUser } from "@/components/Cards";


import { CommentsDrawer } from "@/components/CommentsDrawer";


const mockFeedUsers: UIUser[] = [
  {
    id: "u1",
    name: "Priya M.",
    initials: "PM",
    college: "IIT Madras",
    dept: "EE",
    year: "‘25",
    build_statement: "want to build — hardware that doesn't suck.",
    skills: ["Embedded", "C++", "PCB Design"],
  },
  {
    id: "u2",
    name: "Rahul K.",
    initials: "RK",
    college: "BITS Pilani",
    dept: "Mech",
    year: "‘24",
    build_statement: "want to build — consumer robotics.",
    skills: ["CAD", "ROS", "Python"],
  },
];

const initialMockPosts: UIPost[] = [
  {
    id: "p1",
    type: "idea",
    author: mockFeedUsers[0],
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
    id: "p2",
    type: "update",
    author: mockFeedUsers[1],
    projectName: "SyncPods",
    updateText: "Finally got the webRTC connection stable across networks. Big blocker removed.",
    timestamp: "2h ago",
    likes: 12,
    comments: 1,
  },
  {
    id: "p3",
    type: "idea",
    author: mockFeedUsers[1],
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

const supabase = createClient();

export default function FeedPage() {
  const [posts, setPosts] = useState<UIPost[]>([]);
  const [huddles, setHuddles] = useState<UIUser[]>(mockFeedUsers);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const syncPosts = async () => {
    try {
      // 1. Fetch user session
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserEmail(user.email || "");
      }

      // 2. Fetch profiles for Live Huddle stories
      const { data: dbProfiles } = await supabase
        .from("profiles")
        .select("id,name,college,department,year,skills,avatar_url,build_statement")
        .limit(10);

      if (dbProfiles && dbProfiles.length > 0) {
        const formattedProfiles: UIUser[] = dbProfiles.map((p) => ({
          id: p.id,
          name: p.name,
          college: p.college,
          dept: p.department,
          year: p.year,
          skills: p.skills,
          avatar_url: p.avatar_url,
          build_statement: p.build_statement,
          initials: p.name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
        }));
        setHuddles(formattedProfiles);
      }

      // 3. Fetch live posts
      const { data: dbPosts, error } = await supabase
        .from("posts")
        .select(
          "id,title,description,skills_needed,image_urls,created_at,author_id,profiles(id,name,college,department,year,skills,avatar_url,build_statement),idea_timestamps(posted_at,author_name,author_college)",
        )
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(20);

      let finalPosts: UIPost[] = [];

      if (dbPosts && dbPosts.length > 0) {
        finalPosts = dbPosts.map((p) => {
          // Map database records correctly into UIPost shape
          const profile = p.profiles as unknown as UIUser | null;
          return {
            id: p.id,
            type: "idea",
            title: p.title,
            description: p.description,
            skills_needed: p.skills_needed,
            image_urls: p.image_urls,
            created_at: p.created_at,
            author_id: p.author_id,
            profiles: profile,
            likes: 0,
            comments: 0,
          };
        });
      }

      // Inject any new client-composed posts from local storage
      if (typeof window !== "undefined") {
        const localPostsStr = localStorage.getItem("buildr_local_posts");
        if (localPostsStr) {
          try {
            const localArr = JSON.parse(localPostsStr);
            if (Array.isArray(localArr)) {
              finalPosts = [...localArr, ...finalPosts];
            }
          } catch (_) {}
        }
      }

      // Combine with fallbacks to keep UI gorgeous and clone mock posts to force re-render
      const combined = [...finalPosts, ...initialMockPosts.map(p => ({ ...p }))];
      // Deduplicate by ID
      const unique = combined.filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);
      setPosts(unique);
    } catch (err) {
      console.error("Error loading feed page logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncPosts();

    // Listen to real-time additions to posts table
    const subscription = supabase
      .channel("live_feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        () => {
          syncPosts();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col min-h-full bg-background relative pb-8 text-foreground w-full">
        {/* Live Huddles Pulse */}
        <div className="flex items-center gap-4.5 px-4 py-3.5 border-b border-border/40 bg-card w-full">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center shrink-0 gap-2 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-secondary" />
              <div className="w-10 h-2 bg-secondary rounded" />
            </div>
          ))}
        </div>

        {/* Shimmering Posts */}
        <div className="flex flex-col py-2.5 gap-4 px-4 w-full">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-2xl py-4 px-4 flex flex-col gap-4 shadow-sm animate-pulse w-full">
              {/* Header skeleton */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-secondary" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="w-24 h-3 bg-secondary rounded" />
                  <div className="w-32 h-2.5 bg-secondary rounded" />
                </div>
              </div>
              {/* Main content square skeleton */}
              <div className="aspect-square w-full bg-secondary/60 rounded-xl" />
              {/* Footer text skeletons */}
              <div className="flex flex-col gap-2">
                <div className="w-16 h-3 bg-secondary rounded" />
                <div className="w-full h-3 bg-secondary rounded" />
                <div className="w-3/4 h-3 bg-secondary rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-background relative pb-8 text-foreground w-full">
      {/* Live Huddles stories tray */}
      <div className="flex items-center gap-4.5 px-4 py-3.5 overflow-x-auto no-scrollbar border-b border-border/40 bg-card select-none w-full">
        <div className="flex flex-col items-center shrink-0 cursor-pointer" onClick={() => router.push("/profile")}>
          <div className="relative">
            <Avatar
              user={{
                id: "curr",
                name: userEmail?.split("@")[0] || "arjun",
                college: "NIT Trichy",
              }}
              size="md"
              hasStory={false}
            />
            <div className="absolute bottom-0 right-0 w-4.5 h-4.5 bg-primary rounded-full border-2 border-card flex items-center justify-center text-white text-[10px] font-black leading-none select-none">
              +
            </div>
          </div>
          <span className="text-[10px] mt-2 text-muted-foreground font-bold max-w-[60px] truncate text-center">
            Live Huddle
          </span>
        </div>

        {huddles.map((user) => (
          <div
            key={user.id}
            className="flex flex-col items-center shrink-0 cursor-pointer"
            onClick={() => router.push(`/profile/${user.id}`)}
          >
            <Avatar user={user} size="md" hasStory={true} />
            <span className="text-[10px] mt-2 text-foreground/90 font-bold max-w-[60px] truncate text-center">
              {user.name.split(" ")[0].toLowerCase()}
            </span>
          </div>
        ))}
      </div>

      {/* Feed List */}
      <div className="flex flex-col py-2.5 gap-3.5 px-0 w-full">
        {posts.map((post) => {
          if (post.type === "update") {
            return (
              <UpdateCard
                key={post.id}
                post={post}
                onCommentClick={(id) => setActiveCommentsPostId(id)}
                onLikeToggle={syncPosts}
              />
            );
          }
          return (
            <IdeaCard
              key={post.id}
              post={post}
              onCommentClick={(id) => setActiveCommentsPostId(id)}
              onLikeToggle={syncPosts}
            />
          );
        })}
      </div>

      {/* Comments Drawer Overlay */}
      {activeCommentsPostId && (
        <CommentsDrawer
          postId={activeCommentsPostId}
          onClose={() => setActiveCommentsPostId(null)}
          onCommentAdded={syncPosts}
        />
      )}
    </div>
  );
}
