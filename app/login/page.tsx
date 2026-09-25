"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { AuthBrandedPanel } from "@/components/auth/AuthBrandedPanel";
import {
  Sparkles,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Shield,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/dashboard";

  const { signInWithPassword, signInWithOtp, user, isApproved, loading: authLoading } = useAuth();

  const [mode, setMode] = useState<"password" | "magic_link">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [googleAuthEnabled, setGoogleAuthEnabled] = useState(false);

  // Check URL error params
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setErrorMessage(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  // Load public auth settings
  useEffect(() => {
    fetch("/api/auth/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.google_auth_enabled) setGoogleAuthEnabled(true);
      })
      .catch(() => {});
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      if (isApproved) {
        router.replace(redirectTarget);
      } else {
        router.replace("/pending");
      }
    }
  }, [user, isApproved, authLoading, router, redirectTarget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
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
          if (res.error?.toLowerCase().includes("invalid login credentials")) {
            setErrorMessage("Incorrect email or password. Please verify your credentials.");
          } else if (res.error?.toLowerCase().includes("email not confirmed")) {
            setErrorMessage("Please confirm your email address before signing in. Check your inbox.");
          } else {
            setErrorMessage(res.error || "Failed to sign in. Please try again.");
          }
          setLoading(false);
          return;
        }

        // On successful sign in, fetch status to route appropriately
        const statusRes = await fetch("/api/auth/check-status").catch(() => null);
        const statusData = statusRes ? await statusRes.json().catch(() => null) : null;

        if (statusData?.isApproved) {
          router.replace(redirectTarget);
        } else {
          router.replace("/pending");
        }
      } else {
        // Magic link
        const res = await signInWithOtp(email);
        if (!res.success) {
          setErrorMessage(res.error || "Unable to send login link.");
          setLoading(false);
          return;
        }
        setSuccessMessage(res.message || "A secure login link was sent to your email!");
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {/* Left Column: Sign In Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl flex flex-col justify-between">
          <div>
            {/* Top Brand Logo */}
            <div className="flex items-center space-x-3 mb-8">
              <Link href="/" className="flex items-center space-x-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 group-hover:scale-105 transition">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Alto<span className="text-indigo-600">Fox</span>
                </span>
              </Link>
            </div>

            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Welcome back
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Sign in to manage your local static websites and team projects.
              </p>
            </div>

            {/* Error & Success Messages */}
            {errorMessage && (
              <div className="mb-5 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">{errorMessage}</div>
              </div>
            )}

            {successMessage && (
              <div className="mb-5 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl flex items-start gap-2.5 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">{successMessage}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Password Input (Only in password mode) */}
              {mode === "password" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:border-indigo-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Remember Me Checkbox */}
              {mode === "password" && (
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
                  />
                  <label htmlFor="remember" className="text-xs text-slate-600 dark:text-slate-400">
                    Remember my session on this device
                  </label>
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] transition shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in…</span>
                  </>
                ) : mode === "password" ? (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Send Login Link</span>
                  </>
                )}
              </button>

              {/* Google OAuth (if enabled) */}
              {googleAuthEnabled && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      // Trigger Google OAuth via Supabase
                      window.location.href = "/api/auth/google";
                    }}
                    className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
                  >
                    <span>Continue with Google</span>
                  </button>
                </div>
              )}
            </form>

            {/* Mode Switcher */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
              {mode === "password" ? (
                <button
                  type="button"
                  onClick={() => {
                    setMode("magic_link");
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-xs text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  Prefer passwordless? <span className="font-semibold text-indigo-600 dark:text-indigo-400 underline">Email me a login link</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMode("password");
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-xs text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  ← Back to <span className="font-semibold text-indigo-600 dark:text-indigo-400">Password login</span>
                </button>
              )}
            </div>
          </div>

          {/* Bottom Signup Link */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 text-center mt-6">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Don&apos;t have an account yet?{" "}
              <Link
                href="/signup"
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Right Column: Branded Panel */}
        <AuthBrandedPanel />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
