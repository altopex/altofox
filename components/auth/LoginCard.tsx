"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  Lock,
  Mail,
  KeyRound,
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Shield,
  HelpCircle,
} from "lucide-react";

export function LoginCard() {
  const { signInWithPassword, signInWithOtp, resetPasswordForEmail } = useAuth();

  const [mode, setMode] = useState<"password" | "magic_link" | "forgot_password">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage("Please enter your team email address.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "password") {
        if (!password) {
          setErrorMessage("Please enter your password.");
          setLoading(false);
          return;
        }
        const res = await signInWithPassword(email, password);
        if (!res.success) {
          setErrorMessage(
            res.error?.includes("Invalid login credentials")
              ? "Invalid email or password. Only invited team members can access this workspace."
              : res.error || "Login failed. Please verify your credentials."
          );
        }
      } else if (mode === "magic_link") {
        const res = await signInWithOtp(email);
        if (res.success) {
          setSuccessMessage(res.message || "A secure magic login link was sent to your email!");
        } else {
          setErrorMessage(
            res.error?.includes("Signups not allowed") || res.error?.includes("User not found")
              ? "No team account found for this email. Contact your team owner for an invite."
              : res.error || "Failed to send login link."
          );
        }
      } else if (mode === "forgot_password") {
        const res = await resetPasswordForEmail(email);
        if (res.success) {
          setSuccessMessage(res.message || "Password reset instructions sent to your email!");
        } else {
          setErrorMessage(res.error || "Failed to send reset link.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 font-sans transition-colors">
      {/* Background Accent Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-60 dark:opacity-20">
        <div className="absolute -top-[30%] -left-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-indigo-300/40 to-blue-200/20 blur-3xl" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[45%] h-[45%] rounded-full bg-gradient-to-tl from-purple-300/40 to-pink-200/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-[420px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none p-7 sm:p-8 space-y-6">
        {/* Header / Logo */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/25 mb-1">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              AltoFox Studio
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-500" />
              <span>Private Team Workspace</span>
            </p>
          </div>
        </div>

        {/* Invite-Only Notice Banner */}
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/60 rounded-xl p-3 flex items-start gap-2.5 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
          <Lock className="w-3.5 h-3.5 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            Access is strictly restricted to invited team members. Public sign-up is disabled.
          </span>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Team Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                autoFocus
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {mode === "password" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot_password");
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:border-indigo-500 transition"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] transition shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying…</span>
              </>
            ) : mode === "password" ? (
              <>
                <span>Sign in</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : mode === "magic_link" ? (
              <>
                <Mail className="w-4 h-4" />
                <span>Send Login Link</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Send Reset Link</span>
              </>
            )}
          </button>
        </form>

        {/* Mode Switchers */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center space-y-2">
          {mode === "password" ? (
            <button
              type="button"
              onClick={() => {
                setMode("magic_link");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              Prefer a passwordless link? <span className="font-semibold text-indigo-600 dark:text-indigo-400 underline underline-offset-2">Email me a login link</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode("password");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              ← Back to standard <span className="font-semibold text-indigo-600 dark:text-indigo-400">Password login</span>
            </button>
          )}
        </div>

        {/* Footer Support Info */}
        <div className="text-center pt-1 text-[11px] text-slate-400 dark:text-slate-500">
          <span>Protected with Supabase Row Level Security &amp; AES encryption</span>
        </div>
      </div>
    </div>
  );
}
