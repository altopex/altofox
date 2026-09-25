"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  Clock,
  LogOut,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Mail,
  ShieldAlert,
  Building2,
} from "lucide-react";

export default function PendingApprovalPage() {
  const router = useRouter();
  const { user, profile, isApproved, signOut, refreshProfile } = useAuth();
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  const checkApprovalStatus = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/auth/check-status");
      if (res.ok) {
        const data = await res.json();
        setLastChecked(new Date());
        if (data.isApproved) {
          await refreshProfile();
          router.replace("/dashboard");
          return;
        }
      }
    } catch {
      // Ignore network errors during poll
    } finally {
      setChecking(false);
    }
  }, [refreshProfile, router]);

  // If already approved in context, redirect immediately
  useEffect(() => {
    if (isApproved) {
      router.replace("/dashboard");
    }
  }, [isApproved, router]);

  // Auto-poll every 30 seconds as requested
  useEffect(() => {
    const timer = setInterval(() => {
      checkApprovalStatus();
    }, 30000);
    return () => clearInterval(timer);
  }, [checkApprovalStatus]);

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Team Member";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 font-sans transition-colors">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-50 dark:opacity-20">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 rounded-full bg-amber-400/15 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6">
        {/* Top Brand Logo */}
        <div className="flex items-center justify-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Alto<span className="text-indigo-600">Fox</span>
          </span>
        </div>

        {/* Status Graphic */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-amber-100 dark:bg-amber-950/60 animate-ping opacity-30" />
          <div className="relative w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-inner">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>
        </div>

        {/* Heading & Notice */}
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Waiting for Approval</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white pt-1">
            Thanks, {displayName}!
          </h1>

          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
            Your AltoFox account has been created and is waiting for workspace owner approval. We&apos;ll email you at <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.email}</span> when you&apos;re in.
          </p>
        </div>

        {/* Details Card */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 text-xs text-left space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Account Email</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
              {user?.email}
            </span>
          </div>
          {profile?.company_name && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Company</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {profile.company_name}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Auto-check</span>
            <span className="text-slate-600 dark:text-slate-400">
              Active every 30s
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={checkApprovalStatus}
            disabled={checking}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white transition shadow-sm flex items-center justify-center space-x-2 disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? "animate-spin" : ""}`} />
            <span>{checking ? "Checking approval status…" : "Check Status Now"}</span>
          </button>

          <button
            type="button"
            onClick={() => signOut().then(() => router.replace("/login"))}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition flex items-center justify-center space-x-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out / Switch account</span>
          </button>
        </div>

        {/* Last Checked */}
        <p className="text-[11px] text-slate-400">
          Last checked: {lastChecked.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
