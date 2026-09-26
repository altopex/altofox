"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { BRAND } from "@/config/brand";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Root Application Error Handler]:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-6">
      <header className="max-w-7xl mx-auto w-full py-6 flex items-center justify-between">
        <Link href="/" className="text-xl font-black tracking-tight text-white flex items-center space-x-2">
          <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white">R</span>
          <span>{BRAND.name}</span>
        </Link>
      </header>

      <main className="max-w-md mx-auto w-full text-center space-y-6 my-auto">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">Something Went Wrong</h1>
          <p className="text-sm text-slate-400">
            An unexpected error occurred while loading this page. Our team has been notified.
          </p>
        </div>

        {error?.message && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-left font-mono text-xs text-rose-300 overflow-x-auto max-h-32">
            {error.message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold border border-slate-700 transition"
          >
            <Home className="w-4 h-4" />
            <span>Go Home</span>
          </Link>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto w-full py-6 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} {BRAND.legalName}. All rights reserved.
      </footer>
    </div>
  );
}
