"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect } from "react";
import { Search, Zap, MessageCircle, X, ChevronRight, Check } from "lucide-react";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar, IdeaCard, UpdateCard, UIPost, UIUser } from "@/components/Cards";
import { CommentsDrawer } from "../feed/page";

const CHIPS = ["For You", "Trending", "React", "Node.js", "Figma", "Embedded", "CAD"];

const GRID_GRADIENTS = [
  "from-pink-500/80 to-rose-500/80",
  "from-blue-600/80 to-cyan-500/80",
  "from-indigo-600/80 to-purple-500/80",
  "from-amber-500/80 to-orange-600/80",
  "from-emerald-500/80 to-teal-600/80",
  "from-violet-600/80 to-purple-600/80",
];

const fallbackExploreUsers: UIUser[] = [
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

const fallbackExplorePosts: UIPost[] = [
  {
    id: "p1",
    type: "idea",
    author: fallbackExploreUsers[0],
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
    author: fallbackExploreUsers[1],
    projectName: "SyncPods",
    updateText: "Finally got the webRTC connection stable across networks. Big blocker removed.",
    timestamp: "2h ago",
    likes: 12,
    comments: 1,
  },
  {
    id: "p3",
    type: "idea",
    author: fallbackExploreUsers[1],
    title: "Drone Delivery Protocol",
    description:
      "Working on a standard communication protocol for intra-campus drone delivery. Currently drafting the spec, looking for RF engineers.",
    skillsNeeded: ["RF Engineering", "Systems Design"],
    timestamp: "May 19, 04:20 PM",
    likes: 56,
    comments: 0,
    isRequested: true,
  },
  {
    id: "p4",
    type: "idea",
    author: fallbackExploreUsers[1],
    title: "Neural Interface Keyboard",
    description:
      "Designing a low-cost, open-source EEG headband for typing by thinking. Looking for signal processing enthusiasts.",
    skillsNeeded: ["EEG", "Signal Processing", "Python"],
    timestamp: "May 18, 02:15 PM",
    likes: 42,
    comments: 0,
    isRequested: false,
  },
];

export default function ExplorePage() {
  const [activeChip, setActiveChip] = useState("For You");
  const [posts, setPosts] = useState<UIPost[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<UIPost | null>(null);
  const [suggestions, setSuggestions] = useState<UIUser[]>([]);
  const [followedMap, setFollowedMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const syncData = async () => {
    try {
      setLoading(true);
      // 1. Fetch suggestions/users from profiles table
      const { data: dbProfiles } = await supabase
        .from("profiles")
        .select("id,name,college,department,year,skills,avatar_url,build_statement")
        .limit(10);

      if (dbProfiles && dbProfiles.length > 0) {
        const formatted: UIUser[] = dbProfiles.map((p) => ({
          id: p.id,
          name: p.name,
          college: p.college,
          dept: p.department,
          year: p.year,
          skills: p.skills || [],
          avatar_url: p.avatar_url,
          build_statement: p.build_statement,
          initials: p.name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
        }));
        setSuggestions(formatted);
      } else {
        setSuggestions(fallbackExploreUsers);
      }

      // 2. Fetch ideas/posts
      const { data: dbPosts } = await supabase
        .from("posts")
        .select(
          "id,title,description,skills_needed,image_urls,created_at,author_id,profiles(id,name,college,department,year,skills,avatar_url,build_statement)",
        )
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(50);

      let finalPosts: UIPost[] = [];
      if (dbPosts && dbPosts.length > 0) {
        finalPosts = dbPosts.map((p) => {
          const profile = p.profiles as unknown as UIUser | null;
          let localCount = 0;
          if (typeof window !== "undefined") {
            const localCommentsStr = localStorage.getItem(`buildr_comments_${p.id}`);
            if (localCommentsStr) {
              try {
                localCount = JSON.parse(localCommentsStr).length;
              } catch (_) {}
            }
          }
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
            likes: 12,
            comments: localCount,
          };
        });
      }

      // Sync from local storage additions
      if (typeof window !== "undefined") {
        const localPostsStr = localStorage.getItem("buildr_local_posts");
        if (localPostsStr) {
          try {
            const localArr = JSON.parse(localPostsStr);
            if (Array.isArray(localArr)) {
              // Map local comments count for newly added local storage posts too
              const mappedLocalArr = localArr.map((post) => {
                let localCount = 0;
                const localCommentsStr = localStorage.getItem(`buildr_comments_${post.id}`);
                if (localCommentsStr) {
                  try {
                    localCount = JSON.parse(localCommentsStr).length;
                  } catch (_) {}
                }
                return {
                  ...post,
                  comments: localCount
                };
              });
              finalPosts = [...mappedLocalArr, ...finalPosts];
            }
          } catch (_) {}
        }

        // Load followed status
        const localFollowed = localStorage.getItem("buildr_followed_map");
        if (localFollowed) {
          try {
            setFollowedMap(JSON.parse(localFollowed));
          } catch (_) {}
        }
      }

      // Map local comments count on fallbacks as well
      const mappedFallbacks = fallbackExplorePosts.map((p) => {
        let localCount = 0;
        if (typeof window !== "undefined") {
          const localCommentsStr = localStorage.getItem(`buildr_comments_${p.id}`);
          if (localCommentsStr) {
            try {
              localCount = JSON.parse(localCommentsStr).length;
            } catch (_) {}
          }
        }
        return {
          ...p,
          comments: (p.comments || 0) + localCount
        };
      });

      const combined = [...finalPosts, ...mappedFallbacks];
      const unique = combined.filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);
      setPosts(unique);

      if (selectedPost) {
        const updated = unique.find((p) => p.id === selectedPost.id);
        if (updated) setSelectedPost(updated);
      }
    } catch (err) {
      console.error("Error loading explore sync logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncData();
  }, []);

  const handleDismissSuggestion = (id: string) => {
    setSuggestions((prev) => prev.filter((u) => u.id !== id));
  };

  const handleToggleFollow = (id: string) => {
    const nextMap = { ...followedMap, [id]: !followedMap[id] };
    setFollowedMap(nextMap);
    if (typeof window !== "undefined") {
      localStorage.setItem("buildr_followed_map", JSON.stringify(nextMap));
    }
  };

  // Filter posts based on search input & chip
  const filteredPosts = posts.filter((post) => {
    const query = searchQuery.toLowerCase().trim();
    const author = post.profiles || post.author;
    const authorName = author?.name || "arjun";
    const authorSkills = author?.skills || [];
    const skillsNeeded = post.skills_needed || post.skillsNeeded || [];

    const matchesSearch =
      !query ||
      post.title?.toLowerCase().includes(query) ||
      post.description?.toLowerCase().includes(query) ||
      post.projectName?.toLowerCase().includes(query) ||
      post.updateText?.toLowerCase().includes(query) ||
      authorName.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (activeChip === "For You") return true;
    if (activeChip === "Trending") return (post.likes || 0) > 20;

    const searchTag = activeChip.toLowerCase();
    const matchesIdeaSkills = skillsNeeded.some((s) => s.toLowerCase().includes(searchTag));
    const matchesAuthorSkills = authorSkills.some((s) => s.toLowerCase().includes(searchTag));
    return matchesIdeaSkills || matchesAuthorSkills;
  });

  if (loading) {
    return (
      <div className="flex flex-col min-h-full bg-background pb-16 relative text-foreground w-full">
        {/* Shimmer Search Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-md z-40 px-4 pt-4 pb-3 border-b border-border flex flex-col gap-3 w-full animate-pulse">
          <div className="h-9 bg-secondary/80 rounded-full w-full" />
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 w-full">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-16 h-7 bg-secondary rounded-full shrink-0" />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-5 pt-3 w-full animate-pulse">
          {/* Nearby Builders skeleton */}
          <div className="flex flex-col gap-2.5 px-4 w-full">
            <div className="flex items-center justify-between">
              <div className="w-32 h-4 bg-secondary rounded" />
              <div className="w-12 h-3 bg-secondary rounded" />
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card border border-border/60 rounded-xl p-3 w-[136px] shrink-0 flex flex-col items-center gap-2.5">
                  <div className="w-[50px] h-[50px] rounded-full bg-secondary" />
                  <div className="w-16 h-3.5 bg-secondary rounded" />
                  <div className="w-20 h-2.5 bg-secondary rounded" />
                  <div className="w-full h-7 bg-secondary rounded-md" />
                </div>
              ))}
            </div>
          </div>

          {/* Masonry layout skeleton */}
          <div className="px-4 flex flex-col gap-2.5 w-full">
            <div className="w-36 h-4 bg-secondary rounded" />
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[1, 2, 3, 4, 5, 6].map((i) => {
                const height = i % 3 === 0 ? "h-64" : i % 2 === 0 ? "h-56" : "h-48";
                return (
                  <div key={i} className={`w-full ${height} bg-secondary/60 rounded-xl`} />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-background pb-16 relative text-foreground w-full">
      {/* Search Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-md z-40 px-4 pt-4 pb-3 border-b border-border flex flex-col gap-3 w-full">
        <div className="relative flex items-center gap-2 w-full">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search builders, ideas, skills..."
              className="w-full bg-secondary/60 rounded-full py-2 pl-10 pr-4 text-[13px] text-foreground placeholder:text-muted-foreground outline-none border border-border/10 focus:border-primary/50 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Chips carousel */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 w-full">
          {CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => setActiveChip(chip)}
              className={`px-4 py-1 rounded-full text-[12.5px] font-bold whitespace-nowrap transition-colors border cursor-pointer ${
                activeChip === chip
                  ? "bg-foreground text-background border-foreground"
                  : "bg-secondary/40 text-foreground border-border/30 hover:border-muted-foreground"
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-5 pt-3 w-full">
        {/* Talented Builders Nearby */}
        {suggestions.length > 0 && (
          <div className="flex flex-col gap-2.5 px-4 select-none w-full">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-extrabold text-foreground tracking-tight">
                Talented Builders Nearby
              </span>
              <button className="text-[11.5px] font-bold text-primary flex items-center gap-0.5 cursor-pointer">
                See all <ChevronRight size={13} />
              </button>
            </div>

            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 w-[calc(100%+2rem)]">
              {suggestions.map((user) => {
                const isFollowing = !!followedMap[user.id];
                return (
                  <div
                    key={user.id}
                    className="bg-card border border-border/60 rounded-xl p-3 w-[136px] shrink-0 flex flex-col items-center text-center gap-2.5 relative shadow-sm"
                  >
                    <button
                      onClick={() => handleDismissSuggestion(user.id)}
                      className="absolute top-2 right-2 text-muted-foreground/60 hover:text-foreground cursor-pointer"
                    >
                      <X size={14} />
                    </button>

                    <div className="cursor-pointer" onClick={() => router.push(`/profile/${user.id}`)}>
                      <Avatar user={user} size="lg" hasStory={true} />
                    </div>

                    <div className="flex flex-col w-full">
                      <span className="text-[12.5px] font-extrabold text-foreground truncate leading-none">
                        {user.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate mt-1">
                        {user.college}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleFollow(user.id)}
                      className={`w-full py-1 rounded-md text-[12px] font-bold border transition-colors cursor-pointer ${
                        isFollowing
                          ? "bg-secondary text-foreground border-border"
                          : "bg-primary text-primary-foreground border-primary hover:bg-primary/95"
                      }`}
                    >
                      {isFollowing ? (
                        <span className="flex items-center justify-center gap-1">
                          <Check size={11} className="stroke-[3]" /> Following
                        </span>
                      ) : (
                        "Follow"
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Explore Masonry Tiles */}
        <div className="px-4 flex flex-col gap-2.5 w-full">
          <span className="text-[12px] font-extrabold text-foreground tracking-tight select-none">
            Explore Ideas & Builds
          </span>

          {filteredPosts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-xs">
              No matching builds or ideas found. Try another search.
            </div>
          ) : (
            <div className="w-full">
              <ResponsiveMasonry columnsCountBreakPoints={{ 300: 2, 500: 2 }}>
                <Masonry gutter="8px">
                  {filteredPosts.map((post, i) => {
                    const gradient = GRID_GRADIENTS[i % GRID_GRADIENTS.length];
                    const author = post.profiles || post.author || fallbackExploreUsers[0];
                    const authorName = author.name || "arjun";
                    const authorInitials = author.initials || "??";
                    const titleStr = post.title || post.projectName || "Build";
                    const textContent = post.description || post.updateText || "";

                    return (
                      <div
                        key={post.id}
                        onClick={() => setSelectedPost(post)}
                        className={`relative w-full rounded-xl overflow-hidden cursor-pointer bg-gradient-to-br ${gradient} p-4 text-white flex flex-col justify-between shadow-sm group hover:scale-[1.01] active:scale-[0.99] transition-transform aspect-[4/5]`}
                      >
                        {/* Grid Header */}
                        <div className="flex items-center gap-1.5 z-10">
                          <div className="w-5 h-5 rounded-full overflow-hidden border border-white/20 relative">
                            {author.avatar_url || author.avatar ? (
                              <img
                                src={author.avatar_url || author.avatar || ""}
                                className="w-full h-full object-cover"
                                alt=""
                              />
                            ) : (
                              <div className="w-full h-full bg-white/20 flex items-center justify-center text-[8px] font-bold text-white uppercase">
                                {authorInitials}
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] font-extrabold truncate max-w-[80px] drop-shadow-sm">
                            {authorName.split(" ")[0]}
                          </span>
                        </div>

                        {/* Content inside tile */}
                        <div className="flex flex-col gap-1 z-10 mt-auto">
                          <h3 className="font-space-grotesk font-extrabold text-[13px] leading-tight drop-shadow-md uppercase tracking-wide truncate">
                            {titleStr}
                          </h3>
                          <p className="text-[10px] text-white/90 line-clamp-3 leading-relaxed drop-shadow-sm font-medium">
                            {textContent}
                          </p>
                        </div>

                        {/* Glassmorphic hover details */}
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-extrabold text-[12.5px] z-20">
                          <span className="flex items-center gap-1">
                            <Zap size={16} className="fill-white stroke-none" /> {post.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle size={16} className="fill-white" /> {post.comments}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </Masonry>
              </ResponsiveMasonry>
            </div>
          )}
        </div>
      </div>

      {/* Explore Grid Detailed Interactive Modal View */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/85 z-50 flex flex-col justify-center items-center p-4 animate-fade-in">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setSelectedPost(null)} />

          <button
            onClick={() => setSelectedPost(null)}
            className="absolute top-4 right-4 p-2 text-white bg-black/40 backdrop-blur-md rounded-full border border-white/10 z-50 cursor-pointer"
          >
            <X size={20} />
          </button>

          <div className="w-full max-w-sm rounded-xl overflow-hidden bg-card text-foreground z-10 border border-border overflow-y-auto no-scrollbar max-h-[85vh]">
            {selectedPost.type === "idea" || !selectedPost.type ? (
              <IdeaCard
                post={selectedPost}
                onCommentClick={(id) => {
                  setSelectedPost(null);
                  setActiveCommentsPostId(id);
                }}
                onLikeToggle={syncData}
              />
            ) : (
              <UpdateCard
                post={selectedPost}
                onCommentClick={(id) => {
                  setSelectedPost(null);
                  setActiveCommentsPostId(id);
                }}
                onLikeToggle={syncData}
              />
            )}
          </div>
        </div>
      )}

      {/* Comments Drawer Overlay */}
      {activeCommentsPostId && (
        <CommentsDrawer
          postId={activeCommentsPostId}
          onClose={() => setActiveCommentsPostId(null)}
          onCommentAdded={syncData}
        />
      )}
    </div>
  );
}
