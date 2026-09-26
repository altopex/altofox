import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";
import { BRAND } from "@/config/brand";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-6">
      <header className="max-w-7xl mx-auto w-full py-6 flex items-center justify-between">
        <Link href="/" className="text-xl font-black tracking-tight text-white flex items-center space-x-2">
          <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white">R</span>
          <span>{BRAND.name}</span>
        </Link>
      </header>

      <main className="max-w-md mx-auto w-full text-center space-y-6 my-auto">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-3xl font-extrabold">
          404
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">Page Not Found</h1>
          <p className="text-sm text-slate-400">
            The page you are looking for doesn&apos;t exist, was moved, or requires different permissions.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition shadow-md"
          >
            <Home className="w-4 h-4" />
            <span>Go to Homepage</span>
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold border border-slate-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Dashboard</span>
          </Link>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto w-full py-6 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} {BRAND.legalName}. All rights reserved.
      </footer>
    </div>
  );
}
