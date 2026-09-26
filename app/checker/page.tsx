"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BRAND } from "@/config/brand";
import { RankLocalLogo } from "@/components/brand/RankLocalLogo";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Monitor,
  Smartphone,
  Tablet,
  Layout,
  Link2,
  FileText,
  Image as ImageIcon,
  Menu as MenuIcon,
  Layers,
  Terminal,
  RefreshCw,
  ArrowLeft,
  ShieldAlert,
} from "lucide-react";

interface SiteIssue {
  page: string;
  severity: "critical" | "warning";
  category: "text" | "links" | "assets" | "images" | "menu" | "structure" | "layout" | "console";
  message: string;
  details?: string;
  snippet?: string;
}

interface PageLayoutResult {
  width: number;
  hasHorizontalScroll: boolean;
  scrollWidth: number;
  viewportWidth: number;
  overflowElements: Array<{
    selector: string;
    tagName: string;
    className: string;
    width: number;
    right: number;
  }>;
  screenshotPath?: string;
}

interface PageReport {
  page: string;
  issues: SiteIssue[];
  criticalCount: number;
  warningCount: number;
  layoutResults: PageLayoutResult[];
  consoleErrors: string[];
}

interface SiteCheckerResult {
  siteId: string;
  siteName: string;
  timestamp: string;
  totalIssues: number;
  criticalCount: number;
  warningCount: number;
  pagesChecked: number;
  orphanPages: string[];
  pageReports: PageReport[];
  globalIssues: SiteIssue[];
  screenshotsDir?: string;
}

export default function SiteCheckerReportPage() {
  const [results, setResults] = useState<SiteCheckerResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSiteIndex, setSelectedSiteIndex] = useState(0);
  const [severityFilter, setSeverityFilter] = useState<"all" | "critical" | "warning">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [expandedPages, setExpandedPages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/checker")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.results)) {
          setResults(data.results);
          // Expand first 3 pages by default
          if (data.results[0]?.pageReports) {
            const initExpanded: Record<string, boolean> = {};
            data.results[0].pageReports.slice(0, 3).forEach((p: PageReport) => {
              initExpanded[p.page] = true;
            });
            setExpandedPages(initExpanded);
          }
        }
      })
      .catch((err) => console.warn("Could not load checker results:", err))
      .finally(() => setLoading(false));
  }, []);

  const currentSite = results[selectedSiteIndex];

  const togglePageExpand = (pageName: string) => {
    setExpandedPages((prev) => ({
      ...prev,
      [pageName]: !prev[pageName],
    }));
  };

  const totalCriticalAll = results.reduce((acc, r) => acc + r.criticalCount, 0);
  const totalWarningAll = results.reduce((acc, r) => acc + r.warningCount, 0);
  const totalIssuesAll = totalCriticalAll + totalWarningAll;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard"
            className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition px-2.5 py-1.5 rounded-lg hover:bg-slate-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
          <div className="h-4 w-px bg-slate-800" />
          <RankLocalLogo mode="dark" size="sm" />
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Automated Site Checker
          </span>
        </div>

        <div className="flex items-center space-x-3 text-xs text-slate-400">
          <span className="hidden sm:inline">Inspecting generated ZIP bundles</span>
          <span className="px-2 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-full font-bold flex items-center space-x-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{totalCriticalAll} Critical Issues Found</span>
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Banner Announcement */}
        <div className="bg-gradient-to-r from-rose-950/40 via-amber-950/20 to-slate-900 border border-rose-500/30 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl font-extrabold text-white flex items-center space-x-2">
                <span>RankLocal Automated Inspection Diagnostic Report</span>
              </h1>
              <p className="text-xs text-slate-300 max-w-3xl">
                This checker runs on the final generated static HTML files (the exact bundle downloaded in the ZIP) and evaluates text purity, broken relative links, missing assets, image metadata, menu consistency, page structure, headless Playwright layout across 4 screen widths, and JavaScript console errors.
              </p>
            </div>
            <div className="shrink-0 flex items-center space-x-2">
              <span className="text-[11px] font-mono bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700">
                Rule: Strict Inspection (No fixes applied yet)
              </span>
            </div>
          </div>
        </div>

        {/* Global Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <div className="text-xs text-slate-400 font-medium">Sites Evaluated</div>
            <div className="text-2xl font-black text-white mt-1">{results.length}</div>
            <div className="text-[11px] text-slate-400 mt-1">Portland, Dallas, Atlanta</div>
          </div>

          <div className="bg-rose-950/30 border border-rose-500/40 rounded-xl p-4">
            <div className="text-xs text-rose-300 font-medium flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Critical Failures</span>
            </div>
            <div className="text-2xl font-black text-rose-400 mt-1">{totalCriticalAll}</div>
            <div className="text-[11px] text-rose-300/80 mt-1">Layout, Menu, Broken Links</div>
          </div>

          <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-4">
            <div className="text-xs text-amber-300 font-medium flex items-center space-x-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Warnings</span>
            </div>
            <div className="text-2xl font-black text-amber-400 mt-1">{totalWarningAll}</div>
            <div className="text-[11px] text-amber-300/80 mt-1">Image tags, Alt, Meta tags</div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <div className="text-xs text-slate-400 font-medium">Total Issues Tracked</div>
            <div className="text-2xl font-black text-white mt-1">{totalIssuesAll}</div>
            <div className="text-[11px] text-slate-400 mt-1">Will be checked after fixes</div>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
            <p className="text-sm font-medium">Running Playwright layout suite & loading diagnostic report…</p>
          </div>
        ) : !currentSite ? (
          <div className="p-12 text-center text-slate-400 bg-slate-800/50 rounded-2xl border border-slate-800">
            No checker reports found. Run the site checker script to generate and test sites.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Site Switcher Tabs */}
            <div className="flex border-b border-slate-800 overflow-x-auto space-x-2">
              {results.map((site, idx) => (
                <button
                  key={site.siteId}
                  onClick={() => {
                    setSelectedSiteIndex(idx);
                    setExpandedPages({});
                  }}
                  className={`py-3 px-5 text-xs font-bold whitespace-nowrap border-b-2 transition flex items-center space-x-2.5 ${
                    selectedSiteIndex === idx
                      ? "border-indigo-500 text-indigo-400 bg-indigo-500/10 rounded-t-lg"
                      : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <span>{site.siteName}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      site.criticalCount > 0 ? "bg-rose-500/20 text-rose-300" : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {site.criticalCount} crit
                  </span>
                </button>
              ))}
            </div>

            {/* Current Site Header & Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
              <div className="space-y-0.5">
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <span>{currentSite.siteName}</span>
                  <span className="text-xs font-normal text-slate-400">({currentSite.pagesChecked} pages)</span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  Site ID: <code className="text-slate-300">{currentSite.siteId}</code> • Tested with Chromium Headless Shell
                </p>
              </div>

              {/* Filter controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center space-x-1 bg-slate-900 border border-slate-700 rounded-lg p-1 text-xs">
                  <button
                    onClick={() => setSeverityFilter("all")}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                      severityFilter === "all" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    All ({currentSite.totalIssues})
                  </button>
                  <button
                    onClick={() => setSeverityFilter("critical")}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                      severityFilter === "critical" ? "bg-rose-600 text-white" : "text-rose-400 hover:text-white"
                    }`}
                  >
                    Critical ({currentSite.criticalCount})
                  </button>
                  <button
                    onClick={() => setSeverityFilter("warning")}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                      severityFilter === "warning" ? "bg-amber-600 text-white" : "text-amber-400 hover:text-white"
                    }`}
                  >
                    Warnings ({currentSite.warningCount})
                  </button>
                </div>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Categories</option>
                  <option value="layout">Layout (Horizontal Scroll)</option>
                  <option value="menu">Menu & Navigation</option>
                  <option value="links">Links</option>
                  <option value="text">Text & Undefined</option>
                  <option value="assets">Assets (CSS/JS)</option>
                  <option value="images">Images</option>
                  <option value="structure">Structure & H1</option>
                  <option value="console">Console Errors</option>
                </select>
              </div>
            </div>

            {/* Global Architecture Issues */}
            {currentSite.globalIssues && currentSite.globalIssues.length > 0 && (
              <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Site-Wide Architectural Issues</span>
                </div>
                <div className="space-y-2">
                  {currentSite.globalIssues.map((gi, idx) => (
                    <div key={idx} className="bg-slate-900/80 p-3 rounded-lg border border-rose-500/20 text-xs space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white">
                          CRITICAL
                        </span>
                        <span className="font-semibold text-rose-200">[{gi.category.toUpperCase()}]</span>
                        <span className="text-slate-200">{gi.message}</span>
                      </div>
                      {gi.details && <div className="text-[11px] text-slate-400 font-mono pl-4">{gi.details}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Orphan Pages Alert */}
            {currentSite.orphanPages && currentSite.orphanPages.length > 0 && (
              <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 flex items-start space-x-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-bold text-amber-300">
                    {currentSite.orphanPages.length} Orphan Pages Detected (0 incoming internal links):
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {currentSite.orphanPages.map((op) => (
                      <code key={op} className="bg-slate-900 px-2 py-0.5 rounded border border-amber-500/30 text-amber-200 text-[11px]">
                        {op}
                      </code>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Page-by-Page Accordion List */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                Pages Inspected ({currentSite.pageReports.length})
              </h3>

              {currentSite.pageReports.map((pageRep) => {
                const isExpanded = Boolean(expandedPages[pageRep.page]);

                // Filter issues
                const filteredIssues = pageRep.issues.filter((issue) => {
                  if (severityFilter !== "all" && issue.severity !== severityFilter) return false;
                  if (categoryFilter !== "all" && issue.category !== categoryFilter) return false;
                  return true;
                });

                if (severityFilter !== "all" && filteredIssues.length === 0) {
                  return null;
                }

                const brokenLayoutCount = pageRep.layoutResults.filter((l) => l.hasHorizontalScroll).length;

                return (
                  <div
                    key={pageRep.page}
                    className="bg-slate-800/40 border border-slate-700/60 rounded-xl overflow-hidden transition"
                  >
                    {/* Page Summary Header */}
                    <button
                      type="button"
                      onClick={() => togglePageExpand(pageRep.page)}
                      className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-800/60 text-left transition"
                    >
                      <div className="flex items-center space-x-3">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                        <span className="font-mono text-xs font-bold text-white">{pageRep.page}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {brokenLayoutCount > 0 && (
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold flex items-center space-x-1">
                            <Smartphone className="w-3 h-3" />
                            <span>Overflow @ {brokenLayoutCount} widths</span>
                          </span>
                        )}

                        {pageRep.criticalCount > 0 && (
                          <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold">
                            {pageRep.criticalCount} Critical
                          </span>
                        )}

                        {pageRep.warningCount > 0 && (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                            {pageRep.warningCount} Warnings
                          </span>
                        )}

                        {pageRep.criticalCount === 0 && pageRep.warningCount === 0 && (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Clean</span>
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Page Details Body */}
                    {isExpanded && (
                      <div className="p-5 border-t border-slate-800/80 bg-slate-900/60 space-y-4">
                        {/* Responsive Layout Breakpoint Cards */}
                        <div className="space-y-2">
                          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                            <Monitor className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Playwright Viewport Layout Audits</span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {pageRep.layoutResults.map((l) => (
                              <div
                                key={l.width}
                                className={`p-3 rounded-lg border text-xs space-y-1 ${
                                  l.hasHorizontalScroll
                                    ? "bg-rose-950/20 border-rose-500/40 text-rose-300"
                                    : "bg-slate-800/40 border-slate-700/50 text-slate-300"
                                }`}
                              >
                                <div className="flex items-center justify-between font-bold">
                                  <span>{l.width}px</span>
                                  {l.hasHorizontalScroll ? (
                                    <span className="text-[10px] text-rose-400 font-extrabold">OVERFLOW</span>
                                  ) : (
                                    <span className="text-[10px] text-emerald-400">PASSED</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  ScrollWidth: {l.scrollWidth}px
                                </div>
                                {l.overflowElements && l.overflowElements.length > 0 && (
                                  <div className="text-[10px] text-rose-300 truncate font-mono">
                                    Offending: {l.overflowElements[0]?.selector}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Issues Table */}
                        <div className="space-y-2">
                          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Problems Found ({filteredIssues.length})
                          </div>

                          {filteredIssues.length === 0 ? (
                            <div className="text-xs text-slate-400 italic">No issues matching active filters.</div>
                          ) : (
                            <div className="space-y-2">
                              {filteredIssues.map((issue, iIdx) => (
                                <div
                                  key={iIdx}
                                  className={`p-3 rounded-lg border text-xs space-y-1 ${
                                    issue.severity === "critical"
                                      ? "bg-rose-950/15 border-rose-500/30 text-rose-200"
                                      : "bg-amber-950/15 border-amber-500/30 text-amber-200"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                          issue.severity === "critical"
                                            ? "bg-rose-600 text-white"
                                            : "bg-amber-500/30 text-amber-300 border border-amber-500/40"
                                        }`}
                                      >
                                        {issue.severity}
                                      </span>
                                      <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                                        [{issue.category}]
                                      </span>
                                      <span className="font-medium text-white">{issue.message}</span>
                                    </div>
                                  </div>

                                  {issue.details && (
                                    <div className="text-[11px] text-slate-400 font-mono pl-2">
                                      {issue.details}
                                    </div>
                                  )}

                                  {issue.snippet && (
                                    <div className="bg-slate-950/80 p-2 rounded text-[11px] font-mono text-slate-300 border border-slate-800 break-all">
                                      {issue.snippet}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Console Errors */}
                        {pageRep.consoleErrors && pageRep.consoleErrors.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-slate-800">
                            <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center space-x-1">
                              <Terminal className="w-3.5 h-3.5" />
                              <span>Console Errors ({pageRep.consoleErrors.length})</span>
                            </div>
                            <div className="bg-slate-950 p-2.5 rounded-lg border border-rose-500/30 font-mono text-[11px] text-rose-300 space-y-1">
                              {pageRep.consoleErrors.map((cErr, idx) => (
                                <div key={idx}>{cErr}</div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
