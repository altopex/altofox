"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { ActivityFeed } from "../activity/ActivityFeed";
import {
  FolderGit2,
  FileCode,
  TrendingUp,
  AlertTriangle,
  Plus,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Clock,
  Search,
  CheckCircle,
  Database,
} from "lucide-react";

interface TeamDashboardProps {
  onNewProject: () => void;
  onOpenProject: (projectId: string) => void;
  onOpenImportLocal: () => void;
  onNavigateToProjects: () => void;
}

export function TeamDashboard({
  onNewProject,
  onOpenProject,
  onOpenImportLocal,
  onNavigateToProjects,
}: TeamDashboardProps) {
  const { user, profile } = useAuth();

  const [stats, setStats] = useState({
    projectsCount: 0,
    totalPagesCount: 0,
    optimizedThisMonth: 0,
    needingRefresh: 0,
  });

  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [pagesToOptimize, setPagesToOptimize] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();

      // 1. Projects
      const { data: projects } = await supabase
        .from("projects")
        .select("id, name, domain, niche, main_city, updated_at")
        .eq("status", "active")
        .order("updated_at", { ascending: false })
        .limit(6);

      // 2. Count total projects
      const { count: projCount } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // 3. Count total pages
      const { count: pagesCount } = await supabase
        .from("pages")
        .select("*", { count: "exact", head: true });

      // 4. Pages needing refresh (last_meaningful_update older than 60 days or low SEO)
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
      const { data: stalePages } = await supabase
        .from("pages")
        .select("id, project_id, title, slug, url_path, last_meaningful_update")
        .lt("last_meaningful_update", sixtyDaysAgo)
        .limit(5);

      // 5. Optimization cycles this month
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { count: cycleCount } = await supabase
        .from("optimization_cycles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfMonth);

      setRecentProjects(projects || []);
      setPagesToOptimize(stalePages || []);
      setStats({
        projectsCount: projCount || projects?.length || 0,
        totalPagesCount: pagesCount || 0,
        optimizedThisMonth: cycleCount || 0,
        needingRefresh: stalePages?.length || 0,
      });
    } catch (err) {
      console.error("[Dashboard] Load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const firstName = profile?.full_name?.split(" ")[0] || "Team Member";

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* 1. WELCOME HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 to-indigo-800 text-white p-6 sm:p-7 rounded-3xl shadow-lg shadow-indigo-950/10 relative overflow-hidden">
        <div className="relative z-10 space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-700/60 border border-indigo-500/30 text-[11px] font-semibold text-indigo-200 mb-1">
            <Sparkles className="w-3 h-3 text-indigo-300" />
            <span>Private Studio Environment</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-xs text-indigo-200/90 leading-relaxed">
            Collaborate on high-ranking local business static websites with Google spam-compliant reviews, automated quality checks, and real-time team change tracking.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenImportLocal}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-indigo-700/50 hover:bg-indigo-700 border border-indigo-500/40 text-xs font-semibold text-white shadow-xs transition"
          >
            <Database className="w-4 h-4 text-indigo-300" />
            <span>Import Local Data</span>
          </button>

          <button
            type="button"
            onClick={onNewProject}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-indigo-50 text-indigo-900 text-xs font-bold shadow-md transition"
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>New Static Website</span>
          </button>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
      </div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Projects */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Active Projects</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FolderGit2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.projectsCount}
          </div>
          <div className="text-[11px] text-slate-400">Team websites in database</div>
        </div>

        {/* Total Pages */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Total Pages</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileCode className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.totalPagesCount}
          </div>
          <div className="text-[11px] text-slate-400">Services, locations &amp; blogs</div>
        </div>

        {/* Pages Optimized This Month */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Optimized (This Month)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.optimizedThisMonth}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            <span>Search Console &amp; SEO cycles</span>
          </div>
        </div>

        {/* Needs Refresh */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Pages Needing Refresh</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.needingRefresh}
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400">
            &gt; 60 days since update
          </div>
        </div>
      </div>

      {/* 3. TWO COLUMN MAIN CONTENT: RECENT PROJECTS + TEAM ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Projects + Opportunities (2 Cols wide) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Projects Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Recent Projects
                </h2>
              </div>
              <button
                type="button"
                onClick={onNavigateToProjects}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Loading team projects…
              </div>
            ) : recentProjects.length === 0 ? (
              <div className="py-8 text-center space-y-2 text-slate-400 text-xs">
                <FolderGit2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p>No projects generated yet in your Supabase workspace.</p>
                <button
                  type="button"
                  onClick={onNewProject}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
                >
                  Create your first site
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recentProjects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onOpenProject(p.id)}
                    className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 hover:border-indigo-300 dark:hover:border-indigo-700 text-left transition space-y-2 group"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                        {p.name}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 shrink-0 ml-1" />
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {p.domain || "No domain set"} • {p.main_city || "All regions"}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>
                        Updated {new Date(p.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Console & Pages to Optimize Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Pages to Optimize &amp; Refresh
                </h2>
              </div>
              <span className="text-[11px] text-slate-400">
                Identified via freshness &amp; SEO rankings
              </span>
            </div>

            {pagesToOptimize.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>All pages are up to date! Great job!</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {pagesToOptimize.map((pg) => (
                  <div
                    key={pg.id}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {pg.title}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {pg.url_path} • Last updated {new Date(pg.last_meaningful_update).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenProject(pg.project_id)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 shrink-0"
                    >
                      Optimize
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Team Activity Feed (1 Col wide) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-5">
          <ActivityFeed maxItems={15} showHeader={true} />
        </div>
      </div>
    </div>
  );
}
