"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import { 
  Lock, 
  Eye, 
  EyeOff, 
  Terminal, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck,
  Check
} from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [strengthScore, setStrengthScore] = useState<number>(0);

  const supabase = createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  // Monitor password complexity
  useEffect(() => {
    if (!password) {
      setStrengthScore(0);
      return;
    }
    let score = 0;
    if (password.length >= 8) score += 25;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[0-9]/.test(password)) score += 25;
    if (/[^A-Za-z0-9]/.test(password)) score += 25;
    setStrengthScore(score);
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // 1. Update user password in Auth
      const { data: authData, error: authError } = await supabase.auth.updateUser({
        password: password,
      });

      if (authError) throw authError;

      // 2. Mark the profile as no longer requiring a reset
      if (authData.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ requires_password_reset: false })
          .eq("id", authData.user.id);

        if (profileError) throw profileError;
      }

      // 3. Redirect to the feed
      router.push("/feed");
      router.refresh(); // Ensure middleware re-evaluates
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to update password. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

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
          
          <h1 className="font-heading text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            SECURE YOUR ACCESS
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-sans">
            Please establish a custom security key to authorize this session
          </p>

          {/* Secure SSL Session Pill */}
          <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-[11px] font-medium text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Encrypted Password Update Portal</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="w-full rounded-[24px] border border-white/5 bg-[#0b0f19]/70 backdrop-blur-xl p-6 shadow-[0_0_50px_-12px_rgba(99,102,241,0.25)] relative overflow-hidden">
          
          {/* Neon glow edge */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

          <p className="text-xs text-slate-400 leading-relaxed mb-5 text-center">
            Admin-assigned accounts require a custom, cryptographically secure password reset upon initial entry.
          </p>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-400 animate-spark-pop mb-4">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* New Password */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pl-1">
                New Core Key
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/5 bg-slate-950/40 px-4 pl-10 pr-10 py-3 text-[14px] text-white placeholder-slate-500 transition-all duration-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Requirements Checklist & Strength Bar */}
              {password && (
                <div className="mt-3 pl-1 space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">Security Index</span>
                    <span className={
                      strengthScore === 100 ? "text-emerald-400 font-bold" :
                      strengthScore >= 50 ? "text-amber-400 font-medium" : "text-rose-500"
                    }>
                      {strengthScore === 100 ? "Excellent" :
                       strengthScore >= 50 ? "Moderate" : "Weak"}
                    </span>
                  </div>
                  <div className="h-1 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        strengthScore === 100 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
                        strengthScore >= 50 ? "bg-amber-500" : "bg-rose-500"
                      }`}
                      style={{ width: `${strengthScore}%` }}
                    />
                  </div>

                  {/* Requirements checkboxes */}
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] text-slate-500 pt-1 font-mono">
                    <div className="flex items-center gap-1">
                      <div className={`w-3 h-3 rounded-full flex items-center justify-center border ${
                        password.length >= 8 ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" : "border-slate-800"
                      }`}>
                        {password.length >= 8 && <Check className="w-2 h-2 stroke-[3]" />}
                      </div>
                      <span>8+ Characters</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-3 h-3 rounded-full flex items-center justify-center border ${
                        /[A-Z]/.test(password) ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" : "border-slate-800"
                      }`}>
                        {/[A-Z]/.test(password) && <Check className="w-2 h-2 stroke-[3]" />}
                      </div>
                      <span>1+ Uppercase</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-3 h-3 rounded-full flex items-center justify-center border ${
                        /[0-9]/.test(password) ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" : "border-slate-800"
                      }`}>
                        {/[0-9]/.test(password) && <Check className="w-2 h-2 stroke-[3]" />}
                      </div>
                      <span>1+ Digit</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-3 h-3 rounded-full flex items-center justify-center border ${
                        /[^A-Za-z0-9]/.test(password) ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" : "border-slate-800"
                      }`}>
                        {/[^A-Za-z0-9]/.test(password) && <Check className="w-2 h-2 stroke-[3]" />}
                      </div>
                      <span>1+ Symbol</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pl-1">
                Confirm Core Key
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/5 bg-slate-950/40 px-4 pl-10 pr-10 py-3 text-[14px] text-white placeholder-slate-500 transition-all duration-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 rounded-xl buildr-ring-gradient p-[1px] font-medium text-white disabled:opacity-60 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/25 active:scale-[0.98] transition-all duration-200 cursor-pointer"
            >
              <div className="w-full h-full bg-slate-950/80 rounded-[11px] py-2.5 px-4 flex items-center justify-center gap-1.5 hover:bg-transparent transition-all duration-200">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Updating Core Credentials...</span>
                  </span>
                ) : (
                  <>
                    <span>Confirm Key & Initialize Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </div>
            </button>

          </form>
        </div>

        {/* Security Engine Specs */}
        <div className="text-[10px] text-slate-500 font-sans text-center">
          Buildr Security Engine v1.4 • Enforced Security Protocol
        </div>

      </main>
    </div>
  );
}
