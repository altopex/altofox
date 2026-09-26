"use client";

import React, { useState, useMemo } from "react";
import { SavedProject } from "../lib/storage/project-types";
import { exportProjectBackup, importProjectBackup } from "../lib/storage/db";
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
  Key,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { ImportWebsiteModal } from "./ImportWebsiteModal";
import { MonthlyOptimizationCycleModal } from "./MonthlyOptimizationCycleModal";

interface ProjectsDashboardProps {
  projects: SavedProject[];
  onOpenProject: (project: SavedProject) => void;
  onNewWebsite: () => void;
  onDuplicateProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onProjectImported: (project: SavedProject) => void;
  onStartMonthlyOptimization?: (project: SavedProject) => void;
}

export function ProjectsDashboard({
  projects,
  onOpenProject,
  onNewWebsite,
  onDuplicateProject,
  onDeleteProject,
  onProjectImported,
  onStartMonthlyOptimization,
}: ProjectsDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"lastEdited" | "name">("lastEdited");
  const [rentFilter, setRentFilter] = useState<"all" | "rented" | "available">("all");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [cycleProject, setCycleProject] = useState<SavedProject | null>(null);

  // Rank & Rent MRR & Stats
  const rankRentStats = useMemo(() => {
    let mrr = 0;
    let rentedCount = 0;
    let availableCount = 0;

    for (const p of projects) {
      if (p.rankRentConfig?.status === "rented") {
        rentedCount++;
        mrr += p.rankRentConfig.monthlyRent || 0;
      } else if (p.rankRentConfig?.status === "available" || !p.rankRentConfig) {
        availableCount++;
      }
    }

    return { mrr, rentedCount, availableCount };
  }, [projects]);

  // Filter & Sort Projects
  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        // Rent status filter
        if (rentFilter === "rented" && p.rankRentConfig?.status !== "rented") {
          return false;
        }
        if (rentFilter === "available" && p.rankRentConfig?.status === "rented") {
          return false;
        }

        const q = (searchQuery || "").toLowerCase();
        const pName = (p?.name || "").toLowerCase();
        const pDomain = (p?.businessDetails?.websiteDomain || "").toLowerCase();
        const pCity = (p?.formData?.city || "").toLowerCase();
        const pType = (p?.formData?.businessType || "").toLowerCase();
        return (
          pName.includes(q) ||
          pDomain.includes(q) ||
          pCity.includes(q) ||
          pType.includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return (a?.name || "").localeCompare(b?.name || "");
        }
        return (b?.lastEditedAt || 0) - (a?.lastEditedAt || 0);
      });
  }, [projects, searchQuery, sortBy, rentFilter]);

  // Handle Export Backup
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

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2.5">
            <FolderKanban className="w-7 h-7 text-indigo-600" />
            <span>My Websites</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Reopen, edit, or optimize any website. Zero-loss storage saved permanently in IndexedDB.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-600" />
            <span>Import website</span>
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

      {/* Rank & Rent Recurring Revenue Banner */}
      {projects.length > 0 && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-extrabold tracking-tight">Rank &amp; Rent Portfolio</span>
                <span className="text-[10px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded-full">
                  Lead Gen Mode
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {rankRentStats.rentedCount} rented website{rankRentStats.rentedCount === 1 ? "" : "s"} &bull; {rankRentStats.availableCount} available to lease
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-6 border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Monthly Lease MRR</span>
              <div className="text-xl font-black text-emerald-400 mt-0.5">
                ${rankRentStats.mrr.toLocaleString()}
                <span className="text-xs text-slate-400 font-normal"> / mo</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Annual Run-Rate</span>
              <div className="text-xl font-black text-indigo-300 mt-0.5">
                ${(rankRentStats.mrr * 12).toLocaleString()}
                <span className="text-xs text-slate-400 font-normal"> / yr</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls: Search, Rent Filters & Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, city, trade, or domain…"
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Rank & Rent Filter Tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setRentFilter("all")}
              className={`px-2.5 py-1 rounded-lg transition ${
                rentFilter === "all"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({projects.length})
            </button>
            <button
              type="button"
              onClick={() => setRentFilter("rented")}
              className={`px-2.5 py-1 rounded-lg transition ${
                rentFilter === "rented"
                  ? "bg-white text-emerald-700 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Rented ({rankRentStats.rentedCount})
            </button>
            <button
              type="button"
              onClick={() => setRentFilter("available")}
              className={`px-2.5 py-1 rounded-lg transition ${
                rentFilter === "available"
                  ? "bg-white text-blue-700 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Available ({rankRentStats.availableCount})
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs p-1.5 rounded-lg border border-slate-200 bg-white cursor-pointer"
          >
            <option value="lastEdited">Last Edited</option>
            <option value="name">Website Name</option>
          </select>
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
                : "You haven't generated any static websites yet. Launch the wizard to build your first local business site."}
            </p>
          </div>
          <button
            type="button"
            onClick={onNewWebsite}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm"
          >
            Start Website Builder
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((proj) => {
            const pageCount = (proj?.files || []).filter((f) => f && f.path && f.path.endsWith(".html")).length;
            const lastEditedStr = new Date(proj?.lastEditedAt || Date.now()).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={proj.id}
                onClick={() => onOpenProject(proj)}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between group space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Row: Niche + Rank & Rent Status + Last Edited */}
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                        {proj.formData?.businessType || "Contractor"}
                      </span>
                      {proj.rankRentConfig?.status === "rented" ? (
                        <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>${proj.rankRentConfig.monthlyRent || 0}/mo</span>
                        </span>
                      ) : proj.rankRentConfig?.status === "available" ? (
                        <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                          Available
                        </span>
                      ) : null}
                    </div>
                    <span className="text-slate-400 font-mono flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{lastEditedStr}</span>
                    </span>
                  </div>

                  {/* Title & Domain */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition leading-snug">
                      {proj.name}
                    </h3>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {proj.businessDetails?.websiteDomain || "www.example.com"}
                    </p>
                  </div>

                  {/* Location & Page Count */}
                  <div className="flex items-center space-x-3 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <span className="flex items-center space-x-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {proj.formData?.city || "Local"}, {proj.formData?.stateRegion || "TX"}
                      </span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>{pageCount} pages</span>
                    </span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-1">
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
                      <Download className="w-3.5 h-3.5" />
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

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onStartMonthlyOptimization) {
                          onStartMonthlyOptimization(proj);
                        } else {
                          setCycleProject(proj);
                        }
                      }}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold transition shadow-2xs"
                      title="Run Monthly Search Console Optimization"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                      <span>Optimize this month</span>
                    </button>

                    <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition inline-flex items-center">
                      <span>Manage</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
