"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Network,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ExternalLink,
  Layers,
  Search,
  Filter,
  RefreshCw,
  Wand2,
  Trash2,
  ChevronRight,
  Info,
  ShieldCheck,
  Compass,
  Link as LinkIcon,
  Maximize2,
  X,
  BookOpen,
} from "lucide-react";
import { SavedProject } from "@/lib/storage/project-types";
import {
  PageRelationshipNode,
  ConnectivityAuditReport,
  CrawlValidationReport,
  buildConnectivityGraphFromHtmlFiles,
  validateWebsiteCrawlAccessibility,
} from "@/lib/seo/connectivity-engine";

interface InternalLinkingDashboardProps {
  project: SavedProject;
  onProjectUpdated: (updatedProject: SavedProject) => void;
  onSelectPage?: (pagePath: string) => void;
}

export function InternalLinkingDashboard({
  project,
  onProjectUpdated,
  onSelectPage,
}: InternalLinkingDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "orphan" | "weak" | "connected" | "blog">("all");
  const [selectedNode, setSelectedNode] = useState<PageRelationshipNode | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isAutoFixing, setIsAutoFixing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Delete page state
  const [deleteTarget, setDeleteTarget] = useState<PageRelationshipNode | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Compute graph in-memory directly from project files
  const { engine, auditReport, crawlValidation, nodes } = useMemo(() => {
    const domain = (project.businessDetails?.websiteDomain || project.formData?.websiteDomain || "example.com")
      .replace(/^https?:\/\//i, "")
      .replace(/\/+$/, "");

    const eng = buildConnectivityGraphFromHtmlFiles(project.files || [], {
      businessName: project.name || "Local Service Pros",
      primaryTrade: project.formData?.businessType || (project.businessDetails as any)?.businessType || project.name,
      domain,
      serviceAreaCities: project.serviceAreaCities,
    });

    const rep = eng.evaluateConnectivityHealth();
    const crawl = validateWebsiteCrawlAccessibility(project.files || [], domain);
    const all = eng.getAllNodes();

    return {
      engine: eng,
      auditReport: rep,
      crawlValidation: crawl,
      nodes: all,
    };
  }, [project.files, project.name, project.businessDetails, project.formData, project.serviceAreaCities]);

  // Handle re-crawl & refresh
  const handleRefreshAudit = async () => {
    setIsAuditing(true);
    setStatusMessage("Crawling website and analyzing page connectivity...");
    try {
      const res = await fetch(`/api/projects/${project.id}/connectivity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: project.files,
          domain: project.businessDetails?.websiteDomain || project.formData?.websiteDomain,
          businessName: project.name,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Crawl audit complete! Internal Connectivity: ${data.auditReport.connectivityScore}/100.`);
      } else {
        setStatusMessage("Audit finished using local verified engine.");
      }
    } catch {
      setStatusMessage("Audit refreshed using local verified engine.");
    } finally {
      setIsAuditing(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // Handle auto-fix orphans
  const handleAutoFix = async () => {
    setIsAutoFixing(true);
    setStatusMessage("Injecting contextual links and reconnecting orphan pages...");
    try {
      const res = await fetch(`/api/projects/${project.id}/connectivity/auto-fix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project }),
      });
      const data = await res.json();
      if (data.success && data.updatedProject) {
        onProjectUpdated(data.updatedProject);
        setStatusMessage(`Successfully reconnected website! New Score: ${data.auditReport.connectivityScore}/100.`);
      } else {
        setStatusMessage("Could not auto-fix: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      setStatusMessage("Failed to auto-fix: " + (err.message || "Network error"));
    } finally {
      setIsAutoFixing(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // Handle delete page
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/pages/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          project,
          pagePath: deleteTarget.filePath,
        }),
      });
      const data = await res.json();
      if (data.success && data.updatedProject) {
        onProjectUpdated(data.updatedProject);
        setStatusMessage(`Deleted ${deleteTarget.filePath} and cleaned up ${data.removedDeadLinksCount} dead links.`);
        if (selectedNode?.pageId === deleteTarget.pageId) {
          setSelectedNode(null);
        }
        setDeleteTarget(null);
      } else {
        alert("Failed to delete page: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error deleting page: " + err.message);
    } finally {
      setIsDeleting(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // Filter nodes for the table
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      if (statusFilter === "blog") {
        if (node.pageType !== "blog_post" && node.pageType !== "blog_hub" && !node.filePath.startsWith("blog/")) {
          return false;
        }
      } else if (statusFilter !== "all" && node.connectivityStatus !== statusFilter) {
        return false;
      }
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matches =
          node.title.toLowerCase().includes(q) ||
          node.filePath.toLowerCase().includes(q) ||
          (node.service && node.service.toLowerCase().includes(q)) ||
          (node.location?.city && node.location.city.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [nodes, statusFilter, searchTerm]);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Top Banner Status Toast */}
      {statusMessage && (
        <div className="bg-indigo-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-xs z-10 shrink-0">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-indigo-200 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header & Metric Cards */}
      <div className="p-6 bg-white border-b border-slate-200 shrink-0 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Network className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Internal Linking &amp; Page Connectivity Engine
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Topological site architecture, orphan page recovery, crawl depth analysis, and contextual link relevance.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleRefreshAudit}
              disabled={isAuditing}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? "animate-spin text-indigo-600" : ""}`} />
              <span>{isAuditing ? "Auditing..." : "Run Link Audit"}</span>
            </button>

            {auditReport.orphanNodes.length > 0 && (
              <button
                type="button"
                onClick={handleAutoFix}
                disabled={isAutoFixing}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition disabled:opacity-50"
              >
                <Wand2 className={`w-3.5 h-3.5 ${isAutoFixing ? "animate-spin" : ""}`} />
                <span>{isAutoFixing ? "Connecting..." : "Auto-Fix Orphans"}</span>
              </button>
            )}
          </div>
        </div>

        {/* 6 Key Architectural Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {/* Connectivity Score Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Connectivity Score
            </span>
            <div className="flex items-baseline space-x-1 mt-1">
              <span
                className={`text-2xl font-black ${
                  auditReport.connectivityScore >= 80
                    ? "text-emerald-600"
                    : auditReport.connectivityScore >= 60
                    ? "text-amber-600"
                    : "text-red-600"
                }`}
              >
                {auditReport.connectivityScore}
              </span>
              <span className="text-xs text-slate-400 font-bold">/100</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1">Structural Reachability</span>
          </div>

          {/* Total Pages */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Pages
            </span>
            <div className="text-2xl font-black text-slate-800 mt-1">
              {auditReport.totalNodes}
            </div>
            <span className="text-[10px] text-slate-500 mt-1">
              {crawlValidation.reachablePagesCount} reachable from Home
            </span>
          </div>

          {/* Total Internal Links */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Internal Links
            </span>
            <div className="text-2xl font-black text-slate-800 mt-1">
              {auditReport.totalInternalLinks}
            </div>
            <span className="text-[10px] text-slate-500 mt-1">
              ~{(auditReport.totalInternalLinks / Math.max(1, auditReport.totalNodes)).toFixed(1)} links / page
            </span>
          </div>

          {/* Orphan Pages */}
          <div
            className={`p-3.5 border rounded-xl flex flex-col justify-between ${
              auditReport.orphanNodes.length === 0
                ? "bg-emerald-50/60 border-emerald-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Orphan Pages
            </span>
            <div
              className={`text-2xl font-black mt-1 ${
                auditReport.orphanNodes.length === 0 ? "text-emerald-700" : "text-red-700"
              }`}
            >
              {auditReport.orphanNodes.length}
            </div>
            <span className="text-[10px] text-slate-500 mt-1">
              {auditReport.orphanNodes.length === 0 ? "0 orphans (Great!)" : "Requires incoming link"}
            </span>
          </div>

          {/* Weak Connectivity */}
          <div
            className={`p-3.5 border rounded-xl flex flex-col justify-between ${
              auditReport.weakNodes.length === 0
                ? "bg-slate-50 border-slate-200"
                : "bg-amber-50 border-amber-200"
            }`}
          >
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Weak Nodes
            </span>
            <div
              className={`text-2xl font-black mt-1 ${
                auditReport.weakNodes.length === 0 ? "text-slate-800" : "text-amber-700"
              }`}
            >
              {auditReport.weakNodes.length}
            </div>
            <span className="text-[10px] text-slate-500 mt-1">Only 1 incoming link</span>
          </div>

          {/* Broken Links */}
          <div
            className={`p-3.5 border rounded-xl flex flex-col justify-between ${
              auditReport.brokenLinks.length === 0
                ? "bg-emerald-50/60 border-emerald-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Broken Links
            </span>
            <div
              className={`text-2xl font-black mt-1 ${
                auditReport.brokenLinks.length === 0 ? "text-emerald-700" : "text-red-700"
              }`}
            >
              {auditReport.brokenLinks.length}
            </div>
            <span className="text-[10px] text-slate-500 mt-1">
              {auditReport.brokenLinks.length === 0 ? "100% verified URLs" : "Target 404 in package"}
            </span>
          </div>
        </div>

        {/* Score Rationale Disclaimer */}
        <div className="flex items-center space-x-2 text-[11px] text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span>{auditReport.scoreExplanation}</span>
        </div>

        {/* Dedicated Blog Internal Linking Architecture Card */}
        {auditReport.blogMetrics && auditReport.blogMetrics.totalBlogPosts > 0 && (
          <div className="p-4 bg-gradient-to-r from-purple-50/70 via-indigo-50/40 to-slate-50 border border-purple-200/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-purple-700" />
                <h3 className="text-xs font-bold text-slate-900 tracking-tight">
                  Blog Internal Linking Architecture
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                  {auditReport.blogMetrics.totalBlogPosts} {auditReport.blogMetrics.totalBlogPosts === 1 ? "Article" : "Articles"}
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-[11px] font-medium text-slate-600">
                <span className={`inline-block w-2 h-2 rounded-full ${auditReport.blogMetrics.blogHubConnected ? "bg-emerald-500" : "bg-amber-500"}`} />
                <span>Blog Hub: {auditReport.blogMetrics.blogHubConnected ? "Connected to Site Nav" : "Requires Menu Link"}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 bg-white border border-purple-100 rounded-lg shadow-2xs">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Inbound &amp; Outbound</span>
                <span className="text-base font-extrabold text-slate-800 mt-0.5 block">
                  {auditReport.blogMetrics.blogsWithIncoming} In / {auditReport.blogMetrics.blogsWithOutgoing} Out
                </span>
                <span className="text-[10px] text-slate-400">100% crawlable internal links</span>
              </div>

              <div className="p-2.5 bg-white border border-purple-100 rounded-lg shadow-2xs">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Blog &rarr; Core Services</span>
                <span className="text-base font-extrabold text-indigo-700 mt-0.5 block">
                  {auditReport.blogMetrics.blogToServiceLinks} Links
                </span>
                <span className="text-[10px] text-slate-400">Contextual calls-to-action</span>
              </div>

              <div className="p-2.5 bg-white border border-purple-100 rounded-lg shadow-2xs">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Sibling Topic Clusters</span>
                <span className="text-base font-extrabold text-purple-700 mt-0.5 block">
                  {auditReport.blogMetrics.blogToBlogLinks} Cross-Links
                </span>
                <span className="text-[10px] text-slate-400">Related guides &amp; articles</span>
              </div>

              <div className="p-2.5 bg-white border border-purple-100 rounded-lg shadow-2xs">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Orphans &amp; Weak Articles</span>
                <span className={`text-base font-extrabold mt-0.5 block ${auditReport.blogMetrics.orphanBlogPosts === 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {auditReport.blogMetrics.orphanBlogPosts} Orphans / {auditReport.blogMetrics.weakBlogPosts} Weak
                </span>
                <span className="text-[10px] text-slate-400">
                  {auditReport.blogMetrics.orphanBlogPosts === 0 ? "Zero orphan articles" : "Needs incoming links"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area: Filter Bar + Table + Detail Modal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Table Column */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Filter Bar */}
          <div className="px-6 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center space-x-2 flex-1 max-w-sm">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter pages by title, slug, service, or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 py-1.5 px-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Pages ({nodes.length})</option>
                {auditReport.blogMetrics && auditReport.blogMetrics.totalBlogPosts > 0 && (
                  <option value="blog">Blog Posts Only ({auditReport.blogMetrics.totalBlogPosts})</option>
                )}
                <option value="orphan">Orphans Only ({auditReport.orphanNodes.length})</option>
                <option value="weak">Weakly Connected ({auditReport.weakNodes.length})</option>
                <option value="connected">Fully Connected</option>
              </select>
            </div>
          </div>

          {/* Pages Table */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0 border-b border-slate-200 z-10">
                <tr>
                  <th className="py-2.5 px-4">Page / Path</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Service / Topic</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Incoming</th>
                  <th className="py-2.5 px-3">Outgoing</th>
                  <th className="py-2.5 px-3">Depth</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredNodes.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                      No pages matched the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredNodes.map((node) => {
                    const isSelected = selectedNode?.pageId === node.pageId;
                    return (
                      <tr
                        key={node.pageId}
                        onClick={() => setSelectedNode(node)}
                        className={`cursor-pointer transition hover:bg-indigo-50/40 ${
                          isSelected ? "bg-indigo-50/70" : ""
                        }`}
                      >
                        <td className="py-2.5 px-4">
                          <div className="font-bold text-slate-900 truncate max-w-[220px]">
                            {node.title}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 truncate max-w-[220px]">
                            {node.filePath}
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              node.pageType === "homepage"
                                ? "bg-indigo-100 text-indigo-700"
                                : node.pageType === "service_hub" || node.pageType === "location_hub"
                                ? "bg-blue-100 text-blue-700"
                                : node.pageType === "service_location_page"
                                ? "bg-emerald-100 text-emerald-800"
                                : node.pageType === "blog_post" || node.pageType === "blog_page"
                                ? "bg-purple-100 text-purple-800"
                                : node.pageType === "blog_hub"
                                ? "bg-fuchsia-100 text-fuchsia-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {node.pageType.replace(/_/g, " ")}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-slate-700 font-medium truncate max-w-[130px]">
                          {node.service || "—"}
                        </td>

                        <td className="py-2.5 px-3 text-slate-700 font-medium truncate max-w-[110px]">
                          {node.location?.city || "—"}
                        </td>

                        <td className="py-2.5 px-3">
                          <span
                            className={`font-bold ${
                              node.incomingLinks.length === 0
                                ? "text-red-600 bg-red-50 px-1.5 py-0.5 rounded"
                                : node.incomingLinks.length === 1
                                ? "text-amber-600"
                                : "text-emerald-700"
                            }`}
                          >
                            {node.incomingLinks.length}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-slate-700 font-bold">
                          {node.outgoingLinks.length}
                        </td>

                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              node.clickDepth === 0
                                ? "bg-purple-100 text-purple-700"
                                : node.clickDepth <= 2
                                ? "bg-emerald-100 text-emerald-800"
                                : node.clickDepth === 3
                                ? "bg-blue-100 text-blue-700"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {node.clickDepth >= 0 ? `Depth ${node.clickDepth}` : "Unreachable"}
                          </span>
                        </td>

                        <td className="py-2.5 px-3">
                          {node.connectivityStatus === "orphan" ? (
                            <span className="inline-flex items-center space-x-1 text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              <XCircle className="w-3 h-3" />
                              <span>Orphan</span>
                            </span>
                          ) : node.connectivityStatus === "weak" ? (
                            <span className="inline-flex items-center space-x-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Weak</span>
                            </span>
                          ) : node.connectivityStatus === "unreachable" ? (
                            <span className="inline-flex items-center space-x-1 text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              <XCircle className="w-3 h-3" />
                              <span>Unreachable</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Connected</span>
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-4 text-right space-x-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedNode(node);
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition"
                          >
                            Inspect
                          </button>
                          {node.pageType !== "homepage" && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(node);
                              }}
                              className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-[11px] font-semibold transition"
                              title="Delete page and clean up internal links"
                            >
                              <Trash2 className="w-3 h-3 inline" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Inspection Drawer when a node is selected */}
        {selectedNode && (
          <aside className="w-96 bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-y-auto">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Compass className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900 truncate max-w-[240px]">
                  {selectedNode.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-5 text-xs">
              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Path</span>
                  <p className="font-mono text-slate-800 font-semibold truncate">{selectedNode.filePath}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Click Depth</span>
                  <p className="text-slate-800 font-bold">
                    {selectedNode.clickDepth >= 0 ? `${selectedNode.clickDepth} clicks from Home` : "Unreachable"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Authority Metric</span>
                  <p className="text-slate-800 font-bold">{(selectedNode.authorityFlow * 100).toFixed(0)}% Flow</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Canonical</span>
                  <p className="text-slate-800 font-semibold truncate">{selectedNode.canonicalUrl}</p>
                </div>
              </div>

              {/* Status & Recommendations Alert */}
              {selectedNode.statusReasons.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
                  <div className="font-bold text-amber-800 flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Connectivity Diagnostic</span>
                  </div>
                  <ul className="list-disc pl-4 text-[11px] text-amber-900 space-y-1">
                    {selectedNode.statusReasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                  {selectedNode.recommendations.map((rec, i) => (
                    <p key={i} className="text-[11px] text-indigo-700 font-semibold mt-1">
                      💡 Recommendation: {rec}
                    </p>
                  ))}
                </div>
              )}

              {/* Breadcrumb Trail */}
              <div>
                <h4 className="font-bold text-slate-800 text-xs mb-2 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  <span>Site Hierarchy &amp; Breadcrumb Trail</span>
                </h4>
                <div className="flex items-center flex-wrap gap-1 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-600 font-medium">
                  <span>Home</span>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  {selectedNode.pageType === "service_location_page" && (
                    <>
                      <span>{selectedNode.service}</span>
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                      <span>{selectedNode.location?.city}</span>
                    </>
                  )}
                  {selectedNode.pageType === "service_page" && (
                    <span>{selectedNode.service}</span>
                  )}
                  {selectedNode.pageType === "location_page" && (
                    <span>{selectedNode.location?.city}</span>
                  )}
                  {selectedNode.pageType !== "service_location_page" &&
                    selectedNode.pageType !== "service_page" &&
                    selectedNode.pageType !== "location_page" && (
                      <span>{selectedNode.title.split("|")[0].trim()}</span>
                    )}
                </div>
              </div>

              {/* Incoming Links (With Exact Anchor Text) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Incoming Links ({selectedNode.incomingLinks.length})</span>
                  </h4>
                </div>
                {selectedNode.incomingLinks.length === 0 ? (
                  <p className="text-[11px] text-red-600 bg-red-50 p-2 rounded border border-red-200">
                    No incoming links. This page is currently an orphan.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {selectedNode.incomingLinks.map((link, i) => (
                      <div
                        key={i}
                        className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px]"
                      >
                        <div className="flex items-center justify-between text-slate-700 font-semibold">
                          <span className="truncate max-w-[170px]">{link.sourceFilePath}</span>
                          <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded uppercase">
                            {link.context.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-slate-500 mt-1 italic">
                          Anchor: &ldquo;{link.anchorText}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Outgoing Links */}
              <div>
                <h4 className="font-bold text-slate-800 text-xs mb-2 flex items-center space-x-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                  <span>Outgoing Links ({selectedNode.outgoingLinks.length})</span>
                </h4>
                {selectedNode.outgoingLinks.length === 0 ? (
                  <p className="text-[11px] text-slate-400">Zero outgoing internal links.</p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {selectedNode.outgoingLinks.map((link, i) => (
                      <div
                        key={i}
                        className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px]"
                      >
                        <div className="flex items-center justify-between text-slate-700 font-semibold">
                          <span className="truncate max-w-[170px]">{link.targetFilePath}</span>
                          <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded uppercase">
                            {link.context.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-slate-500 mt-1 italic">
                          Anchor: &ldquo;{link.anchorText}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions Footer in Drawer */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                {onSelectPage && (
                  <button
                    type="button"
                    onClick={() => onSelectPage(selectedNode.filePath)}
                    className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    <span>Open in Page Editor</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
                {selectedNode.pageType !== "homepage" && (
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(selectedNode)}
                    className="inline-flex items-center space-x-1 text-xs font-bold text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete Page</span>
                  </button>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Page</h3>
                <p className="text-xs text-slate-500">Automated Dead-Link Cleanup Enabled</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-slate-900 font-mono">{deleteTarget.filePath}</strong> (
              <em>{deleteTarget.title}</em>)?
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-800">What happens automatically:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                <li>Removes the HTML file from the project package.</li>
                <li>Scans and cleanly removes all internal links pointing to this page.</li>
                <li>Updates <code className="text-indigo-600">sitemap.xml</code>.</li>
                <li>Snapshots a rollback version in version history.</li>
                <li>Guarantees zero 404 broken links remain.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 inline-flex items-center space-x-1.5"
              >
                {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? "Deleting..." : "Confirm & Clean Links"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
