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
  X,
} from "lucide-react";
import { BRAND } from "@/config/brand";
import { RankLocalIcon } from "@/components/brand/RankLocalLogo";

export interface LoginCardProps {
  asModal?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  customTitle?: string;
  customSubtitle?: string;
}

export function LoginCard({
  asModal = false,
  onClose,
  onSuccess,
  customTitle,
  customSubtitle,
}: LoginCardProps = {}) {
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
        } else {
          onSuccess?.();
        }
      } else if (mode === "magic_link") {
        const res = await signInWithOtp(email);
        if (res.success) {
          setSuccessMessage(res.message || "A secure magic login link was sent to your email!");
          onSuccess?.();
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

  const cardContent = (
    <div className="relative w-full max-w-[420px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none p-7 sm:p-8 space-y-6">
      {/* Close button if modal */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Return to Website Builder"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Header / Logo */}
      <div className="text-center space-y-2.5">
        <div className="inline-flex items-center justify-center mb-1">
          <RankLocalIcon className="w-12 h-12" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {customTitle || `${BRAND.name} Studio`}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-indigo-500" />
            <span>{customSubtitle || "Private Team Workspace & Cloud Storage"}</span>
          </p>
        </div>
      </div>

      {/* Invite-Only Notice Banner */}
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/60 rounded-xl p-3 flex items-start gap-2.5 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
        <Lock className="w-3.5 h-3.5 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>
          Access is restricted to invited team members. Public sign-up is disabled.
        </span>
      </div>

      {/* Feedback Alerts */}
      {errorMessage && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-700 dark:text-emerald-300 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Mode Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Team Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={`e.g. alex@${BRAND.domain}`}
              className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition"
            />
          </div>
        </div>

        {/* Password Field (Only in password mode) */}
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
                className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition"
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold transition shadow-md shadow-indigo-500/20 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying credentials…</span>
            </>
          ) : mode === "password" ? (
            <>
              <span>Sign in to Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </>
          ) : mode === "magic_link" ? (
            <>
              <Mail className="w-4 h-4" />
              <span>Send Magic Login Link</span>
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
  );

  if (asModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
        {cardContent}
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 font-sans transition-colors">
      {/* Background Accent Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-60 dark:opacity-20">
        <div className="absolute -top-[30%] -left-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-indigo-300/40 to-blue-200/20 blur-3xl" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[45%] h-[45%] rounded-full bg-gradient-to-tl from-purple-300/40 to-pink-200/20 blur-3xl" />
      </div>

      {cardContent}
    </div>
  );
}
