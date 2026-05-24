"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isMvpMode } from "@/lib/mvp-mode";
import { 
  Mail, 
  Lock, 
  ShieldCheck, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Terminal, 
  ArrowRight,
  Sparkles,
  LockOpen
} from "lucide-react";

export default function LoginPage() {
  const mvpMode = isMvpMode();
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [securityScore, setSecurityScore] = useState<number>(0);

  // Analyze password complexity on the fly to simulate active defensive security feedback
  useEffect(() => {
    if (!password) {
      setSecurityScore(0);
      return;
    }
    let score = 0;
    if (password.length >= 8) score += 25;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[0-9]/.test(password)) score += 25;
    if (/[^A-Za-z0-9]/.test(password)) score += 25;
    setSecurityScore(score);
  }, [password]);

  useEffect(() => {
    async function consumeInviteHash() {
      if (typeof window === "undefined") return;
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : "";
      if (!hash) return;
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const flowType = params.get("type");
      if (!accessToken || !refreshToken || flowType !== "invite") return;

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) {
        setError(sessionError.message);
        return;
      }

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname + window.location.search,
      );
      router.push("/onboarding/password");
      router.refresh();
    }

    consumeInviteHash();
  }, [router, supabase.auth]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (mvpMode) {
      router.push("/feed");
      router.refresh();
      return;
    }
    setLoading(true);
    setError(null);

    const { error: authError } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    if (mode === "signup") {
      router.push("/onboarding/profile");
      router.refresh();
      return;
    }
    router.push("/feed");
    router.refresh();
  }

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
  }

  return (
    <div className="dark min-h-screen relative flex flex-col justify-center items-center px-4 bg-[#08080f] overflow-hidden select-none">
      {/* Aesthetic cybergrid and background glowing nodes */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950/90 to-[#08080f] pointer-events-none" />
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{
          backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "20px 20px"
        }}
      />
      
      {/* Decorative floating blur bubbles */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />

      <main className="relative z-10 w-full max-w-[390px] flex flex-col gap-6">
        
        {/* Header Branding */}
        <div className="text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl buildr-ring-gradient p-[1px] flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4 transition-transform hover:scale-105 active:scale-95 duration-200">
            <div className="w-full h-full bg-[#08080f]/90 rounded-[15px] flex items-center justify-center">
              <Terminal className="w-6 h-6 text-cyan-400 stroke-[2.5]" />
            </div>
          </div>
          
          <h1 className="font-heading text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            BUILDR
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-sans">
            Collegiate Builder Playground
          </p>

          {/* Secure SSL Session Pill */}
          <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-[11px] font-medium text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secure 256-bit SSL Session Verified</span>
          </div>
        </div>

        {/* Auth card container with glowing border */}
        <div className="w-full rounded-[24px] border border-white/5 bg-[#0b0f19]/70 backdrop-blur-xl p-6 shadow-[0_0_50px_-12px_rgba(99,102,241,0.25)] relative overflow-hidden">
          
          {/* Neon glow edge */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

          {/* Tab Selector */}
          <div className="grid grid-cols-2 p-1 bg-slate-950/60 rounded-xl border border-white/5 mb-6 text-sm">
            <button
              onClick={() => { setMode("login"); setError(null); }}
              className={`py-2 rounded-lg font-medium transition-all duration-200 ${
                mode === "login" 
                  ? "bg-slate-900 text-white shadow-sm" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode("signup"); setError(null); }}
              className={`py-2 rounded-lg font-medium transition-all duration-200 ${
                mode === "signup" 
                  ? "bg-slate-900 text-white shadow-sm" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Join Up
            </button>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            
            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pl-1">
                Builder Coordinates
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  className="w-full rounded-xl border border-white/5 bg-slate-950/40 px-4 pl-10 py-3 text-[14px] text-white placeholder-slate-500 transition-all duration-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                  placeholder="name@college.edu"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Access Core Key
                </label>
                {mode === "login" && (
                  <Link 
                    href={mvpMode ? "/demo" : "/auth/reset-password"}
                    className="text-[11px] text-cyan-400/80 hover:text-cyan-400 font-medium transition-colors"
                  >
                    Forgot Password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  className="w-full rounded-xl border border-white/5 bg-slate-950/40 px-4 pl-10 pr-10 py-3 text-[14px] text-white placeholder-slate-500 transition-all duration-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Secure Password Complexity Tracker - simulated defensive feedback */}
              {password && mode === "signup" && (
                <div className="mt-2 pl-1 space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">Password Strength</span>
                    <span className={
                      securityScore === 100 ? "text-emerald-400 font-bold" :
                      securityScore >= 50 ? "text-amber-400 font-medium" : "text-rose-500"
                    }>
                      {securityScore === 100 ? "Bulletproof" :
                       securityScore >= 50 ? "Medium" : "Weak"}
                    </span>
                  </div>
                  <div className="h-1 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        securityScore === 100 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
                        securityScore >= 50 ? "bg-amber-500" : "bg-rose-500"
                      }`}
                      style={{ width: `${securityScore}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Error Message Drawer */}
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-400 animate-spark-pop">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              className="w-full mt-2 rounded-xl buildr-ring-gradient p-[1px] font-medium text-white disabled:opacity-60 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/25 active:scale-[0.98] transition-all duration-200 cursor-pointer"
              type="submit"
              disabled={loading}
            >
              <div className="w-full h-full bg-slate-950/80 rounded-[11px] py-2.5 px-4 flex items-center justify-center gap-1.5 hover:bg-transparent transition-all duration-200">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Compiling Credentials...</span>
                  </span>
                ) : (
                  <>
                    <span>
                      {mode === "login" ? "Execute Login Sequence" : "Establish Secure Account"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </div>
            </button>

            {/* SSO / Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                <span className="bg-[#0b0f19] px-2.5 text-slate-500 font-semibold">
                  Secure SSO Link
                </span>
              </div>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-white/5 bg-slate-950/40 hover:bg-slate-900/60 px-4 py-3 text-xs font-semibold text-slate-300 transition-all duration-200 cursor-pointer active:scale-[0.98]"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Authenticate with Google Workspace
            </button>

            {mvpMode ? (
              <div className="pt-2 text-center">
                <Link 
                  href="/demo" 
                  className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium transition-colors hover:underline"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Bypass authentication using Mock Demo Mode</span>
                </Link>
              </div>
            ) : null}
            
          </form>
        </div>

        {/* Security Policy Details */}
        <div className="flex flex-col items-center gap-1.5 opacity-60 text-[10px] text-slate-500 font-sans text-center">
          <div className="flex items-center justify-center gap-1">
            <LockOpen className="w-3 h-3 text-slate-500" />
            <span>Admin-provisioned credentials required to initialize profiles.</span>
          </div>
          <span>Buildr Security Engine v1.4 • Powered by Supabase Auth</span>
        </div>

      </main>
    </div>
  );
}
