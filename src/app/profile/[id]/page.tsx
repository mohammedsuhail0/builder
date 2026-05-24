"use client";
/* eslint-disable react-hooks/set-state-in-effect, react/jsx-no-comment-textnodes */

import React, { useState, useEffect, use } from "react";
import { Grid, Zap, ArrowUpRight, Bookmark, MessageCircle, X, Camera, Settings, Plus, ChevronLeft, Sun, Moon, LogOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { Avatar, IdeaCard, UpdateCard, UIPost, UIUser } from "@/components/Cards";
import { CommentsDrawer } from "@/components/CommentsDrawer";

const TABS = [
  { id: "posts", icon: Grid, label: "Push Log" },
  { id: "liked", icon: Zap, label: "Upvoted" },
  { id: "requested", icon: ArrowUpRight, label: "Collabs" },
  { id: "saved", icon: Bookmark, label: "Saved Repos" },
] as const;

const AVAILABLE_SKILLS = [
  "React", "Node.js", "Figma", "Python", "ML/AI", "Hardware", "Marketing", "Sales",
  "Embedded", "C++", "PCB Design", "CAD", "ROS", "RF Engineering", "Systems Design"
];

const GRID_GRADIENTS = [
  "from-cyan-950/80 to-slate-900/80",
  "from-indigo-950/80 to-slate-900/80",
  "from-slate-900/80 to-[#0b0f19]/80",
  "from-emerald-950/80 to-slate-900/80",
  "from-slate-950/80 to-slate-900/80",
  "from-violet-950/80 to-slate-900/80"
];

const HIGHLIGHTS = [
  { id: "h1", label: "Demos", icon: "💻", cover: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=150" },
  { id: "h2", label: "Figma", icon: "🎨", cover: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=150" },
  { id: "h3", label: "Code", icon: "⚡", cover: "https://images.unsplash.com/photo-1618401471353-b98aedd07871?w=150" },
  { id: "h4", label: "Pitch", icon: "🚀", cover: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=150" }
];

interface EditProfileModalProps {
  user: UIUser;
  onClose: () => void;
  onProfileUpdated: () => void;
}

function EditProfileModal({ user, onClose, onProfileUpdated }: EditProfileModalProps) {
  const supabase = createClient();
  const [name, setName] = useState(user.name || "");
  const [college, setCollege] = useState(user.college || "");
  const [dept, setDept] = useState(user.dept || "");
  const [year, setYear] = useState(user.year?.toString() || "");
  const [buildStatement, setBuildStatement] = useState(user.build_statement || "");
  const [selectedSkills, setSelectedSkills] = useState<string[]>(user.skills || []);
  const [avatar, setAvatar] = useState(user.avatar_url || "");
  const [loading, setLoading] = useState(false);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: name.trim(),
          college: college.trim(),
          department: dept.trim(),
          year: year.trim(),
          build_statement: buildStatement.trim(),
          skills: selectedSkills,
          avatar_url: avatar.trim() || null,
        })
        .eq("id", user.id);

      if (error) {
        alert("Error compiling changes: " + error.message);
      } else {
        onProfileUpdated();
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 z-50 flex flex-col justify-end animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="bg-card border-t border-border rounded-t-[24px] max-h-[90vh] flex flex-col relative z-10 w-full sm:max-w-md sm:mx-auto shadow-2xl overflow-hidden">
        {/* Drag handle */}
        <div className="w-12 h-1.5 bg-border rounded-full mx-auto my-3 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
          <span className="font-space-grotesk font-extrabold text-[17px] text-foreground">Edit Dev Space</span>
          <button onClick={onClose} className="p-2 -mr-2 text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 no-scrollbar pb-10">
          <form onSubmit={handleSave} className="flex flex-col gap-5">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative group cursor-pointer w-20 h-20 rounded-full overflow-hidden border border-border bg-secondary flex items-center justify-center">
                {avatar ? (
                  <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-cyan-400">
                    {name ? name.slice(0, 2).toUpperCase() : "??"}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Avatar Image URL input */}
              <div className="w-full flex flex-col gap-1">
                <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                  Avatar Image URL
                </label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="w-full bg-input rounded-xl py-2 px-3 text-[13px] text-foreground placeholder:text-muted-foreground outline-none border border-transparent focus:border-cyan-500/40 transition-colors"
                />
              </div>
            </div>

            {/* Name */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                Builder Name
              </label>
              <input
                type="text"
                required
                placeholder="Developer name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-input rounded-xl py-2 px-3 text-[13px] text-foreground placeholder:text-muted-foreground outline-none border border-transparent focus:border-cyan-500/40 transition-colors"
              />
            </div>

            {/* College, Dept, Year Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                  College
                </label>
                <input
                  type="text"
                  placeholder="IIT Madras"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full bg-input rounded-xl py-2 px-3 text-[13px] text-foreground outline-none border border-transparent focus:border-cyan-500/40 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                  Dept
                </label>
                <input
                  type="text"
                  placeholder="CS"
                  value={dept}
                  onChange={(e) => setDept(e.target.value)}
                  className="w-full bg-input rounded-xl py-2 px-3 text-[13px] text-foreground outline-none border border-transparent focus:border-cyan-500/40 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                  Year
                </label>
                <input
                  type="text"
                  placeholder="‘24"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full bg-input rounded-xl py-2 px-3 text-[13px] text-foreground outline-none border border-transparent focus:border-cyan-500/40 transition-colors"
                />
              </div>
            </div>

            {/* Build Statement */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                Build Statement
              </label>
              <textarea
                rows={2}
                placeholder="what do you want to build?"
                value={buildStatement}
                onChange={(e) => setBuildStatement(e.target.value)}
                className="w-full bg-input rounded-xl py-2 px-3 text-[13px] text-foreground placeholder:text-muted-foreground outline-none border border-transparent focus:border-cyan-500/40 transition-colors resize-none font-sans"
              />
            </div>

            {/* Skills */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                My Stack
              </label>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_SKILLS.map((skill) => {
                  const selected = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1 rounded-md text-[11px] font-mono font-bold transition-all border ${
                        selected
                          ? "bg-cyan-500 text-white border-cyan-500 shadow-md shadow-cyan-500/20"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-border"
                      }`}
                    >
                      {skill.toLowerCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full py-3 rounded-xl bg-cyan-500 text-white font-bold font-mono text-[13px] mt-2 active:scale-[0.98] transition-transform disabled:opacity-50 shadow-lg shadow-cyan-500/20 animate-spark-pop"
            >
              {loading ? "COMPILING..." : "COMPILE_CHANGES"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const { setTheme, resolvedTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<typeof TABS[number]["id"]>("posts");
  const [profileUser, setProfileUser] = useState<UIUser | null>(null);
  const [viewerUser, setViewerUser] = useState<UIUser | null>(null);
  const [posts, setPosts] = useState<UIPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<UIPost | null>(null);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfileAndData = async () => {
    try {
      const { data: { user: sessionUser } } = await supabase.auth.getUser();
      if (!sessionUser) {
        router.push("/auth/login");
        return;
      }

      setViewerUser({
        id: sessionUser.id,
        name: sessionUser.email?.split("@")[0] || "Me",
        college: "Buildr Node",
      });

      // 1. Fetch profiles table record
      const { data: profile } = await supabase
        .from("profiles")
        .select("id,name,college,department,year,skills,build_statement,avatar_url")
        .eq("id", id)
        .single();

      if (!profile) {
        router.push("/feed");
        return;
      }

      const uiUser: UIUser = {
        id: profile.id,
        name: profile.name,
        college: profile.college,
        dept: profile.department || "EE",
        year: profile.year || "‘25",
        avatar_url: profile.avatar_url || undefined,
        skills: profile.skills || [],
        build_statement: profile.build_statement || "",
        initials: profile.name
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
      };
      setProfileUser(uiUser);

      // 2. Fetch ideas/posts created by the user
      const { data: userPosts } = await supabase
        .from("posts")
        .select("id,title,description,project_name,update_text,created_at,skills_needed,image_urls")
        .eq("author_id", id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (userPosts) {
        const uiPosts: UIPost[] = userPosts.map((p) => ({
          id: p.id,
          type: p.project_name ? "update" : "idea",
          title: p.title || undefined,
          description: p.description || undefined,
          projectName: p.project_name || undefined,
          updateText: p.update_text || undefined,
          skillsNeeded: p.skills_needed || [],
          imageUrls: p.image_urls || [],
          timestamp: new Date(p.created_at).toLocaleDateString([], { month: "short", day: "numeric" }),
          likes: 12, // fallback counts
          comments: 2,
          profiles: uiUser,
        }));
        setPosts(uiPosts);
      }
    } catch (err) {
      console.error("Error loading profile layout:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndData();
  }, [id]);

  const syncPosts = () => {
    fetchProfileAndData();
  };

  if (loading || !profileUser) {
    return (
      <div className="flex flex-col min-h-full bg-background pb-14 text-foreground w-full">
        {/* Skeleton Header */}
        <header className="px-4 py-3.5 border-b border-border flex items-center justify-between shrink-0 w-full animate-pulse bg-background/90 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-secondary" />
            <div className="w-24 h-4 bg-secondary rounded" />
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded bg-secondary" />
            <div className="w-8 h-8 rounded bg-secondary" />
          </div>
        </header>

        {/* Top Header Section */}
        <div className="px-4 pt-6 pb-4 animate-pulse">
          <div className="flex items-center justify-between gap-6">
            {/* Avatar placeholder */}
            <div className="w-[85px] h-[85px] rounded-full bg-secondary border border-border shrink-0" />
            {/* Stats placeholder */}
            <div className="flex-1 flex justify-around max-w-[280px]">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="w-8 h-4 bg-secondary rounded" />
                  <div className="w-12 h-2.5 bg-secondary rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Bio details placeholder */}
          <div className="mt-5 flex flex-col gap-2">
            <div className="w-32 h-4 bg-secondary rounded" />
            <div className="w-48 h-3 bg-secondary rounded" />
            <div className="w-full h-3 bg-secondary/80 rounded mt-2" />
            <div className="w-5/6 h-3 bg-secondary/80 rounded" />
          </div>

          {/* Stack pills */}
          <div className="flex gap-2 mt-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-14 h-5 bg-secondary rounded" />
            ))}
          </div>

          {/* Actions */}
          <div className="mt-4 flex gap-2 w-full">
            <div className="flex-1 h-9 bg-secondary rounded-lg" />
            <div className="w-9 h-9 bg-secondary rounded-lg" />
          </div>

          {/* Highlights */}
          <div className="mt-6 flex flex-col gap-2">
            <div className="w-24 h-2.5 bg-secondary rounded" />
            <div className="flex gap-4 mt-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="w-[56px] h-[56px] rounded-full bg-secondary" />
                  <div className="w-10 h-2 bg-secondary rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs placeholder */}
        <div className="flex items-center w-full border-b border-border">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-1 py-4 flex justify-center">
              <div className="w-6 h-6 rounded bg-secondary" />
            </div>
          ))}
        </div>

        {/* Grid content placeholder */}
        <div className="p-4 grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-square w-full bg-secondary/70 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const isMe = viewerUser?.id === profileUser.id;

  // Filter lists based on local storage markers or mock logic to keep things fast
  const myPosts = posts;
  const likedPosts = posts.filter((p) => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(`buildr_liked_${p.id}`) === "true";
  });
  const requestedPosts = posts.filter((p) => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(`buildr_requested_${p.id}`) === "true";
  });
  const savedPosts = posts.filter((p) => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(`buildr_saved_${p.id}`) === "true";
  });

  const totalSparksCount = myPosts.length * 14 + 12; // visual count representing total engagements

  const renderSquareGrid = (items: UIPost[], emptyIcon: LucideIcon, emptyText: string) => {
    if (items.length === 0) {
      const Icon = emptyIcon;
      return (
        <div className="text-center py-16 flex flex-col items-center gap-2.5 select-none">
          <Icon className="w-9 h-9 text-muted-foreground/40 stroke-[1.5]" />
          <span className="text-[12px] text-muted-foreground font-mono font-medium">{emptyText}</span>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-3 gap-1.5 md:gap-2.5">
        {items.map((post, i) => {
          const gradient = GRID_GRADIENTS[i % GRID_GRADIENTS.length];
          return (
            <div
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className={`relative aspect-square w-full cursor-pointer bg-gradient-to-br ${gradient} p-3 text-white flex flex-col justify-between shadow-sm overflow-hidden group hover:scale-[1.01] active:scale-[0.99] transition-transform rounded-xl border border-white/5`}
            >
              {/* Type label */}
              <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-cyan-400/80">
                {post.type === "idea" ? "Idea" : "Update"}
              </div>

              {/* Mid title / snippet */}
              <div className="my-auto text-center px-1">
                <h3 className="font-space-grotesk font-extrabold text-[12px] leading-tight line-clamp-3 select-none">
                  {post.type === "idea" ? post.title : post.projectName}
                </h3>
              </div>

              {/* Hover details overlay */}
              <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-mono text-[11px] z-10">
                <span className="flex items-center gap-1">
                  <Zap size={13} className="fill-cyan-400 text-cyan-400" /> {post.likes}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle size={13} className="fill-white text-white" /> {post.comments}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-full bg-background pb-14 text-foreground relative">
      {/* Sticky Header with Back, Title, Theme Toggle and Quick Logout */}
      <header className="px-4 py-3 sticky top-0 bg-background/95 backdrop-blur-md z-40 border-b border-border flex items-center justify-between shrink-0 w-full select-none">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push("/feed");
              }
            }}
            className="p-1 -ml-1 text-foreground hover:text-cyan-400 transition-colors cursor-pointer"
          >
            <ChevronLeft size={22} />
          </button>
          <span className="font-space-grotesk font-extrabold text-[15px] tracking-tight">
            {profileUser.name.toLowerCase()}
          </span>
        </div>

        <div className="flex items-center gap-3.5">
          {isMe && (
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Dev Options"
            >
              <Settings size={20} />
            </button>
          )}
        </div>
      </header>

      {/* Top Header Section */}
      <div className="px-4 pt-6 pb-4">
        {/* Row 1: Profile picture left, stats right */}
        <div className="flex items-center justify-between gap-6">
          {/* Avatar with Custom Buildr ring */}
          <div className="flex flex-col items-center">
            <div className="p-[2.5px] buildr-ring-gradient huddle-active-pulse rounded-full">
              <div className="w-[80px] h-[80px] rounded-full bg-secondary text-primary flex items-center justify-center font-bold border-4 border-background shrink-0 overflow-hidden text-2xl">
                {profileUser.avatar_url ? (
                  <img src={profileUser.avatar_url} alt={profileUser.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-cyan-400">{profileUser.initials}</span>
                )}
              </div>
            </div>
          </div>

          {/* Stats columns */}
          <div className="flex-1 flex justify-around text-center select-none max-w-[280px]">
            <div className="flex flex-col">
              <span className="text-[16px] font-space-grotesk font-extrabold text-foreground leading-tight">
                {myPosts.length}
              </span>
              <span className="text-[11px] text-muted-foreground font-mono font-medium lowercase">builds</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[16px] font-space-grotesk font-extrabold text-foreground leading-tight">
                182
              </span>
              <span className="text-[11px] text-muted-foreground font-mono font-medium lowercase">connections</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[16px] font-space-grotesk font-extrabold text-foreground leading-tight">
                {totalSparksCount}
              </span>
              <span className="text-[11px] text-muted-foreground font-mono font-medium lowercase">sparks</span>
            </div>
          </div>
        </div>

        {/* Row 2: Bio details */}
        <div className="mt-4 text-left">
          <h2 className="text-[15px] font-space-grotesk font-extrabold text-foreground leading-tight">
            {profileUser.name}
          </h2>
          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
            {profileUser.college} • {profileUser.dept} • Year {profileUser.year}
          </p>
          <p className="text-[13px] text-foreground mt-2.5 leading-relaxed whitespace-pre-line font-medium font-sans">
            {profileUser.build_statement || "Wanting to build standard things that last."}
          </p>

          {/* Stack pills represented as modern custom capsules */}
          <div className="flex flex-wrap gap-1.5 mt-3.5">
            {profileUser.skills?.map((skill) => (
              <span
                key={skill}
                className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground text-[10px] font-mono border border-border/40 font-bold"
              >
                {skill.toLowerCase()}
              </span>
            ))}
            {(!profileUser.skills || profileUser.skills.length === 0) && (
              <span className="text-[10px] text-muted-foreground font-mono">No stack compiled yet.</span>
            )}
          </div>
        </div>

        {/* Row 3: Action Buttons */}
        <div className="mt-4 flex gap-2 w-full">
          {isMe ? (
            <>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex-1 py-1.5 rounded-lg bg-secondary text-foreground text-[12px] font-mono font-bold hover:bg-secondary/80 active:scale-[0.98] transition-all border border-border/40 text-center"
              >
                Edit Dev Space
              </button>

              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 active:scale-[0.98] transition-all border border-border/40 flex items-center justify-center"
                title="Dev Options & Appearance"
              >
                <Settings className="w-4 h-4 text-foreground" />
              </button>
            </>
          ) : (
            <button
              onClick={() => router.push(`/messages/${profileUser.id}`)}
              className="w-full py-2 rounded-xl bg-cyan-500 text-white text-[12px] font-mono font-bold hover:bg-cyan-600 transition-colors shadow-lg shadow-cyan-500/25 animate-pulse"
            >
              compile secure_connect...
            </button>
          )}
        </div>

        {/* Row 4: Project Repos Highlights */}
        <div className="mt-5 text-left">
          <span className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground">// Project Repos</span>
          <div className="flex gap-4 overflow-x-auto no-scrollbar py-3 mt-1.5 -mx-4 px-4 border-b border-border/30 select-none">
            {HIGHLIGHTS.map((hl) => (
              <div key={hl.id} className="flex flex-col items-center gap-1.5 shrink-0 animate-fade-in">
                <div className="p-[1.5px] border border-cyan-500/20 rounded-full">
                  <div className="w-[56px] h-[56px] rounded-full bg-secondary border border-background flex items-center justify-center text-xl overflow-hidden shadow-sm">
                    {hl.cover ? (
                      <img src={hl.cover} alt={hl.label} className="w-full h-full object-cover" />
                    ) : (
                      hl.icon
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-foreground/80 tracking-tight">
                  {hl.label.toLowerCase()}
                </span>
              </div>
            ))}

            {/* Create new repos element */}
            {isMe && (
              <div
                className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer hover:opacity-85"
                onClick={() => router.push("/posts/new")}
              >
                <div className="p-[1.5px] border border-dashed border-border rounded-full">
                  <div className="w-[56px] h-[56px] rounded-full bg-secondary/50 border border-background flex items-center justify-center">
                    <Plus className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-muted-foreground tracking-tight">new_repo</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex items-center w-full border-b border-border sticky top-0 bg-background/95 backdrop-blur-md z-30 shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3.5 flex flex-col items-center gap-1.5 relative transition-colors ${
              activeTab === tab.id ? "text-cyan-400" : "text-muted-foreground"
            }`}
          >
            <tab.icon className="w-4.5 h-4.5" />
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-cyan-400" />}
          </button>
        ))}
      </div>

      {/* Grid Content */}
      <div className="p-4">
        {activeTab === "posts" && renderSquareGrid(myPosts, Grid, "// no pushes compiled yet.")}
        {activeTab === "liked" && renderSquareGrid(likedPosts, Zap, "// no upvoted builds yet.")}
        {activeTab === "requested" && renderSquareGrid(requestedPosts, ArrowUpRight, "// no active collaborations.")}
        {activeTab === "saved" && renderSquareGrid(savedPosts, Bookmark, "// no saved repos yet.")}
      </div>

      {/* Detailed Interactive Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/85 z-50 flex flex-col justify-center items-center p-4 animate-fade-in">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setSelectedPost(null)} />

          <button
            onClick={() => setSelectedPost(null)}
            className="absolute top-4 right-4 p-2 text-white bg-black/40 backdrop-blur-md rounded-full border border-white/10 z-50 hover:bg-black/60 transition-colors"
          >
            <X size={20} />
          </button>

          <div className="w-full max-w-sm rounded-xl overflow-hidden bg-card text-foreground z-10 border border-border overflow-y-auto no-scrollbar max-h-[85vh]">
            {selectedPost.type === "idea" ? (
              <IdeaCard
                post={selectedPost}
                onCommentClick={(id) => {
                  setSelectedPost(null);
                  setActiveCommentsPostId(id);
                }}
                onLikeToggle={syncPosts}
              />
            ) : (
              <UpdateCard
                post={selectedPost}
                onCommentClick={(id) => {
                  setSelectedPost(null);
                  setActiveCommentsPostId(id);
                }}
                onLikeToggle={syncPosts}
              />
            )}
          </div>
        </div>
      )}

      {/* Preferences bottom sheet drawer */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex flex-col justify-end animate-fade-in">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setIsSettingsOpen(false)} />

          <div className="bg-card border-t border-border rounded-t-[20px] pb-8 relative z-10 w-full sm:max-w-md sm:mx-auto max-h-[80vh] flex flex-col shadow-2xl animate-slide-up">
            <div className="w-10 h-1 bg-border rounded-full mx-auto my-3 shrink-0" />

            <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
              <span className="font-mono text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
                // dev_console_options
              </span>
              <button onClick={() => setIsSettingsOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-4 font-mono text-left">
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <span className="text-[12px] font-bold text-foreground">Canvas Palette</span>
                <button
                  onClick={() => {
                    setTheme(resolvedTheme === "dark" ? "light" : "dark");
                  }}
                  className="px-3.5 py-1.5 rounded bg-cyan-500 text-white text-[10px] font-bold hover:bg-cyan-600 transition-colors shadow-md shadow-cyan-500/20 flex items-center gap-1 cursor-pointer"
                >
                  {resolvedTheme === "dark" ? <Sun size={12} className="text-amber-400" /> : <Moon size={12} className="text-indigo-400" />}
                  <span>{resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                </button>
              </div>

              <div className="py-2 flex items-center justify-between border-b border-border/40 text-[12px] text-muted-foreground">
                <span>Account Node</span>
                <span className="text-emerald-400 font-bold text-[11px]">ACTIVE BUILDER ✓</span>
              </div>

              <div className="py-2 flex items-center justify-between border-b border-border/40 text-[12px] text-muted-foreground">
                <span>Storage Sync</span>
                <span className="text-[10px] bg-secondary px-2 py-0.5 rounded text-foreground font-bold border border-border/40">
                  Supabase Persistent Core
                </span>
              </div>

              <div
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push("/auth/login");
                }}
                className="py-2 text-[12px] text-red-500 font-bold cursor-pointer hover:text-red-400 transition-colors flex items-center gap-2"
              >
                <LogOut size={14} />
                Log Out
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments Drawer */}
      {activeCommentsPostId && (
        <CommentsDrawer
          postId={activeCommentsPostId}
          onClose={() => setActiveCommentsPostId(null)}
          onCommentAdded={syncPosts}
        />
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <EditProfileModal
          user={profileUser}
          onClose={() => setIsEditModalOpen(false)}
          onProfileUpdated={fetchProfileAndData}
        />
      )}
    </div>
  );
}
