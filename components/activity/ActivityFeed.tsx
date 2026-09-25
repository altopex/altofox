"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ActivityLogRecord } from "@/lib/supabase/types";
import { fetchActivityLogs } from "@/lib/supabase/activity";
import {
  Activity,
  User,
  Clock,
  Filter,
  FileCode,
  FolderGit2,
  Trash2,
  Download,
  RotateCcw,
  Sparkles,
  CheckCircle,
  Search,
  RefreshCw,
} from "lucide-react";

interface ActivityFeedProps {
  projectId?: string;
  maxItems?: number;
  showHeader?: boolean;
}

export function ActivityFeed({
  projectId,
  maxItems = 50,
  showHeader = true,
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadActivities = useCallback(async () => {
    setLoading(true);
    try {
      const logs = await fetchActivityLogs({
        projectId: projectId,
        limit: maxItems,
      });
      setActivities(logs);
    } catch (err) {
      console.error("Error loading activity logs:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId, maxItems]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case "create":
      case "generate":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
          icon: Sparkles,
        };
      case "edit":
      case "optimize":
        return {
          bg: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800",
          icon: FileCode,
        };
      case "delete":
      case "trash":
        return {
          bg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
          icon: Trash2,
        };
      case "export":
        return {
          bg: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
          icon: Download,
        };
      case "restore":
      case "recover":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
          icon: RotateCcw,
        };
      default:
        return {
          bg: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
          icon: Activity,
        };
    }
  };

  const formatRelativeTime = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return "Just now";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hours = Math.floor(min / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(isoString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const filteredActivities = activities.filter((item) => {
    if (filterAction !== "all" && item.action !== filterAction) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = item.user_name?.toLowerCase().includes(q);
      const matchDesc = item.details?.description?.toLowerCase().includes(q);
      const matchType = item.entity_type?.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchType) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {projectId ? "Project Activity Log" : "Team Activity Feed"}
            </h2>
            <span className="text-[11px] text-slate-500 font-medium">
              ({filteredActivities.length})
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter */}
            <div className="relative">
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Actions</option>
                <option value="create">Created / Generated</option>
                <option value="edit">Edited / Updated</option>
                <option value="optimize">Optimized</option>
                <option value="export">Exported</option>
                <option value="delete">Deleted</option>
              </select>
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={loadActivities}
              disabled={loading}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
              title="Refresh feed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      )}

      {/* Activity Timeline List */}
      {loading && activities.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
          <span>Loading activity history…</span>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="py-8 text-center text-slate-400 dark:text-slate-600 text-xs space-y-1">
          <Activity className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-700 mb-1" />
          <p>No activity records found matching filters.</p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-3.5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-200 dark:before:bg-slate-800">
          {filteredActivities.map((log) => {
            const badge = getActionBadge(log.action);
            const Icon = badge.icon;
            const description =
              log.details?.description ||
              `${log.user_name || "A team member"} ${log.action}d a ${log.entity_type}`;

            return (
              <div key={log.id} className="relative group text-xs">
                {/* Timeline Dot */}
                <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-600 flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                </div>

                <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {/* Avatar */}
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {log.user_avatar ? (
                          <img
                            src={log.user_avatar}
                            alt={log.user_name || "User"}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          log.user_name?.charAt(0).toUpperCase() || "U"
                        )}
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {log.user_name || "Team Member"}
                      </span>

                      {/* Action Pill */}
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${badge.bg}`}
                      >
                        <Icon className="w-2.5 h-2.5" />
                        <span className="capitalize">{log.action}</span>
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      <span>{formatRelativeTime(log.created_at)}</span>
                    </div>
                  </div>

                  <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                    {description}
                  </p>

                  {/* Optional page or file link tag */}
                  {(log.details?.pageSlug || log.details?.projectName) && (
                    <div className="flex items-center gap-2 pt-0.5 text-[10px] text-slate-500">
                      {log.details?.projectName && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          <FolderGit2 className="w-2.5 h-2.5" />
                          <span>{log.details.projectName}</span>
                        </span>
                      )}
                      {log.details?.pageSlug && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          <FileCode className="w-2.5 h-2.5" />
                          <span>/{log.details.pageSlug}.html</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
