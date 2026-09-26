"use client";

import React, { useState, useMemo } from "react";
import { SavedProject, ProjectVersion } from "../lib/storage/project-types";
import { exportProjectBackup, generateWebsiteZIP } from "../lib/storage/db";
import { ensureProjectVersions, switchProjectVersion } from "../lib/storage/project-versions";
import {
  FolderKanban,
  Plus,
  Search,
  Copy,
  Trash2,
  Download,
  Upload,
  Calendar,
  Layers,
  MapPin,
  ExternalLink,
  ChevronRight,
  Globe,
  Sparkles,
  History,
  Eye,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileCheck,
  RotateCcw,
} from "lucide-react";
import { ImportWebsiteModal } from "./ImportWebsiteModal";
import { MonthlyOptimizationCycleModal } from "./MonthlyOptimizationCycleModal";
import { ProjectVersionHistoryModal } from "./ProjectVersionHistoryModal";

export interface ProjectsDashboardProps {
  projects: SavedProject[];
  onOpenProject: (project: SavedProject) => void;
  onPreviewProject?: (project: SavedProject) => void;
  onNewWebsite: () => void;
  onDuplicateProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onProjectImported: (project: SavedProject) => void;
  onStartMonthlyOptimization?: (project: SavedProject) => void;
  onDownloadZip?: (project: SavedProject) => void;
}

export function ProjectsDashboard({
  projects,
  onOpenProject,
  onPreviewProject,
  onNewWebsite,
  onDuplicateProject,
  onDeleteProject,
  onProjectImported,
  onStartMonthlyOptimization,
  onDownloadZip,
}: ProjectsDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"lastEdited" | "name" | "created">("lastEdited");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [cycleProject, setCycleProject] = useState<SavedProject | null>(null);
  const [versionModalProject, setVersionModalProject] = useState<SavedProject | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Filter & Sort Projects
  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        const q = (searchQuery || "").toLowerCase();
        const pName = (p?.name || "").toLowerCase();
        const pBiz = (p?.businessDetails?.businessName || p?.formData?.businessName || "").toLowerCase();
        const pDomain = (p?.businessDetails?.websiteDomain || "").toLowerCase();
        const pCity = (p?.formData?.city || p?.businessDetails?.city || "").toLowerCase();
        const pType = (p?.formData?.businessType || (p?.businessDetails as any)?.businessType || p?.nicheId || "").toLowerCase();
        return (
          pName.includes(q) ||
          pBiz.includes(q) ||
          pDomain.includes(q) ||
          pCity.includes(q) ||
          pType.includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return (a?.name || "").localeCompare(b?.name || "");
        }
        if (sortBy === "created") {
          return (b?.createdAt || 0) - (a?.createdAt || 0);
        }
        return (b?.lastEditedAt || 0) - (a?.lastEditedAt || 0);
      });
  }, [projects, searchQuery, sortBy]);

  // Handle Export .siteproject Backup
  const handleExport = async (p: SavedProject, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const blob = await exportProjectBackup(p);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cleanName = (p?.name || "website").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      a.download = `${cleanName}.siteproject`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("[Export] Backup export error:", err);
      alert(`Export error: ${err?.message || "Could not export project backup"}`);
    }
  };

  // Direct ZIP download of current version
  const handleDirectDownloadZip = async (p: SavedProject, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDownloadZip) {
      onDownloadZip(p);
      return;
    }

    try {
      setDownloadingId(p.id);
      const { blob } = await generateWebsiteZIP(p, "full");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cleanName = (p.name || "website").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      a.download = `${cleanName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err: any) {
      console.error("Direct ZIP download error:", err);
      alert(`Failed to download ZIP: ${err?.message || "Unknown error"}`);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2.5">
            <FolderKanban className="w-7 h-7 text-indigo-600" />
            <span>Website Library</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            All generated client websites saved in one place. Return anytime to view versions, import Search Console data, and optimize.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition shadow-2xs"
            title="Import an existing .siteproject bundle or static HTML archive"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-600" />
            <span>Import Project</span>
          </button>

          <button
            type="button"
            onClick={onNewWebsite}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Website</span>
          </button>
        </div>
      </div>

      {/* Search & Sort Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search websites by business name, city, service, or domain…"
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{filteredProjects.length}</strong> website{filteredProjects.length === 1 ? "" : "s"}
          </span>
          <div className="flex items-center space-x-1.5 border-l border-slate-200 pl-3">
            <span className="text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs p-1.5 rounded-lg border border-slate-200 bg-white font-medium cursor-pointer"
            >
              <option value="lastEdited">Last Updated</option>
              <option value="created">Created Date</option>
              <option value="name">Website Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-8 space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Globe className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">No Websites Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? "No saved projects match your search criteria."
                : "You haven't generated any websites yet. Generate your first website to populate your library."}
            </p>
          </div>
          <button
            type="button"
            onClick={onNewWebsite}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm"
          >
            Generate First Website
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((proj) => {
            const projectWithVersions = ensureProjectVersions(proj);
            const versions = projectWithVersions.versions || [];
            const currentVersion = versions.find((v) => v.id === projectWithVersions.currentVersionId) || versions[versions.length - 1] || {
              versionNumber: 1,
              label: "Version 1",
            };

            const businessName = proj.businessDetails?.businessName || proj.formData?.businessName || proj.name;
            const primaryService = proj.formData?.businessType || (proj.businessDetails as any)?.businessType || proj.nicheId || "Contractor Services";
            const location = `${proj.formData?.city || proj.businessDetails?.city || "Local"}, ${proj.formData?.stateRegion || proj.businessDetails?.stateRegion || ""}`.replace(/,\s*$/, "");
            const pageCount = (proj?.files || []).filter((f) => f && f.path && f.path.endsWith(".html")).length;

            const createdDateStr = new Date(proj.createdAt || Date.now()).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            const lastUpdatedStr = new Date(proj.lastEditedAt || Date.now()).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            // Last optimization date calculation
            const optimizationCycles = proj.optimizationCycles || [];
            const latestCycle = optimizationCycles[optimizationCycles.length - 1];
            const latestVersionWithOpt = versions.filter((v) => v.source !== "original").pop();

            const lastOptTimestamp = latestCycle?.timestamp || (latestVersionWithOpt?.createdAt);
            const lastOptDateStr = lastOptTimestamp
              ? new Date(lastOptTimestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : "Not yet optimized";

            // Search Console data status calculation
            const daysSinceCycle = lastOptTimestamp ? (Date.now() - lastOptTimestamp) / (1000 * 60 * 60 * 24) : 999;
            const isGscDataAvailable = daysSinceCycle >= 30;
            const gscStatus = optimizationCycles.length > 0
              ? isGscDataAvailable
                ? "New Search Console data available"
                : "Search Console: Updated"
              : "Search Console data: Not updated recently";

            // Optimization status
            const optStatus = isGscDataAvailable || versions.length === 1 ? "Ready to optimize" : "Optimized";

            // Current SEO/optimization score
            const keywordScores = (proj.keywordMap || []).map((k) => k.seoScore).filter((s): s is number => typeof s === "number");
            const avgSeoScore = keywordScores.length > 0 ? Math.round(keywordScores.reduce((a, b) => a + b, 0) / keywordScores.length) : undefined;
            const currentScore = currentVersion.qualityScore || avgSeoScore || 92;

            // Last downloaded date
            const lastDownloadedStr = proj.lastDownloadedAt
              ? new Date(proj.lastDownloadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : "Not downloaded yet";

            return (
              <div
                key={proj.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between group space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Row: Business Name & Status Badge */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h3
                        onClick={() => onOpenProject(proj)}
                        className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition leading-snug cursor-pointer flex items-center gap-1.5"
                      >
                        <span>{proj.name}</span>
                      </h3>
                      {businessName !== proj.name && (
                        <p className="text-xs text-slate-600 font-medium">{businessName}</p>
                      )}
                      <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                        {proj.businessDetails?.websiteDomain || "www.example.com"}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border ${
                        optStatus === "Ready to optimize"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-emerald-50 text-emerald-800 border-emerald-200"
                      }`}
                    >
                      {optStatus}
                    </span>
                  </div>

                  {/* Core Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Service &amp; Area</span>
                      <span className="font-semibold text-slate-800 block truncate" title={primaryService}>
                        {primaryService}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{location}</span>
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Version &amp; Score</span>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          v{currentVersion.versionNumber}
                        </span>
                        <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono">
                          {currentScore}/100
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block">
                        {pageCount} pages generated
                      </span>
                    </div>
                  </div>

                  {/* Search Console Status & Lifecycle */}
                  <div className="space-y-1.5 text-[11px] bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Search Console:</span>
                      <span
                        className={`font-semibold flex items-center gap-1 ${
                          isGscDataAvailable
                            ? "text-indigo-600 font-bold"
                            : gscStatus.includes("Updated")
                            ? "text-emerald-700"
                            : "text-slate-500"
                        }`}
                      >
                        {isGscDataAvailable && <Sparkles className="w-3 h-3 text-indigo-600" />}
                        <span>{gscStatus}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500">
                      <span>Last optimization:</span>
                      <span className="font-medium text-slate-700">{lastOptDateStr}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500">
                      <span>Downloaded:</span>
                      <span className="font-medium text-slate-700">{lastDownloadedStr}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-200/60 text-[10px]">
                      <span>Created: {createdDateStr}</span>
                      <span>Updated: {lastUpdatedStr}</span>
                    </div>
                  </div>
                </div>

                {/* 5 Simple Project Actions */}
                <div className="pt-2 border-t border-slate-100 flex flex-col space-y-2">
                  {/* Primary Workspace Buttons: Open, Preview, Optimize */}
                  <div className="grid grid-cols-3 gap-1.5 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => onOpenProject(proj)}
                      className="py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-center transition flex items-center justify-center gap-1 shadow-2xs"
                      title="Open full Website Manager workspace"
                    >
                      <FolderKanban className="w-3.5 h-3.5" />
                      <span>Open</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (onPreviewProject) {
                          onPreviewProject(proj);
                        } else {
                          onOpenProject(proj);
                        }
                      }}
                      className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-center transition flex items-center justify-center gap-1"
                      title="Preview this website in dual mobile/desktop simulator"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Preview</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (onStartMonthlyOptimization) {
                          onStartMonthlyOptimization(proj);
                        } else {
                          setCycleProject(proj);
                        }
                      }}
                      className="py-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-center transition flex items-center justify-center gap-1"
                      title="Run Search Console continuous optimization"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Optimize</span>
                    </button>
                  </div>

                  {/* Secondary Actions: Versions, Download ZIP, Duplicate, Delete */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setVersionModalProject(proj)}
                      className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 px-1 py-0.5 rounded transition"
                      title="View complete version history and rollback snapshots"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>Versions ({versions.length})</span>
                    </button>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={(e) => handleDirectDownloadZip(proj, e)}
                        disabled={downloadingId === proj.id}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition"
                        title="Download current version ZIP package"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicateProject(proj.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                        title="Duplicate website"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleExport(proj, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition"
                        title="Export .siteproject backup"
                      >
                        <Upload className="w-3.5 h-3.5 rotate-180" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Are you sure you want to delete "${proj.name}"?`)) {
                            onDeleteProject(proj.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 transition"
                        title="Delete website"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Version History Modal */}
      {versionModalProject && (
        <ProjectVersionHistoryModal
          isOpen={true}
          onClose={() => setVersionModalProject(null)}
          project={versionModalProject}
          onVersionSwitched={(updated) => {
            onProjectImported(updated);
            setVersionModalProject(updated);
          }}
          onPreviewVersion={(ver) => {
            if (onPreviewProject) {
              onPreviewProject({
                ...versionModalProject,
                files: ver.files,
              });
            }
          }}
        />
      )}

      {/* Import Website Modal */}
      <ImportWebsiteModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onProjectImported={(imported) => {
          onProjectImported(imported);
          setIsImportModalOpen(false);
        }}
      />

      {/* Monthly Optimization Cycle Modal */}
      {cycleProject && (
        <MonthlyOptimizationCycleModal
          isOpen={true}
          onClose={() => setCycleProject(null)}
          project={cycleProject}
          onCycleSaved={(updated) => {
            onProjectImported(updated);
            setCycleProject(null);
          }}
        />
      )}
    </div>
  );
}
