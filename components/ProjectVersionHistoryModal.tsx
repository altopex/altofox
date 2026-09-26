"use client";

import React, { useState } from "react";
import { SavedProject, ProjectVersion } from "../lib/storage/project-types";
import { ensureProjectVersions, switchProjectVersion } from "../lib/storage/project-versions";
import { generateWebsiteZIP } from "../lib/storage/db";
import {
  History,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Download,
  Eye,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  FileText,
  AlertCircle,
} from "lucide-react";

interface ProjectVersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: SavedProject;
  onVersionSwitched?: (updatedProject: SavedProject) => void;
  onPreviewVersion?: (version: ProjectVersion) => void;
}

export function ProjectVersionHistoryModal({
  isOpen,
  onClose,
  project,
  onVersionSwitched,
  onPreviewVersion,
}: ProjectVersionHistoryModalProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const projectWithVersions = ensureProjectVersions(project);
  const versions = (projectWithVersions.versions || []).slice().reverse(); // newest first
  const currentVersionId = projectWithVersions.currentVersionId || versions[0]?.id;

  const handleSwitch = (version: ProjectVersion) => {
    const updated = switchProjectVersion(projectWithVersions, version.id);
    if (onVersionSwitched) {
      onVersionSwitched(updated);
    }
  };

  const handleDownloadVersionZip = async (version: ProjectVersion, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setDownloadingId(version.id);
      // Create temporary project object scoped to this version's files
      const tempProject: SavedProject = {
        ...projectWithVersions,
        files: version.files,
      };

      const { blob } = await generateWebsiteZIP(tempProject, "full");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cleanName = (project.name || "website").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      a.download = `${cleanName}-v${version.versionNumber}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err: any) {
      console.error("Failed to download version ZIP:", err);
      alert(`Could not download version ZIP: ${err?.message || "Unknown error"}`);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Version History</span>
                <span className="text-xs font-normal text-slate-500">• {project.name}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {versions.length} recorded version{versions.length === 1 ? "" : "s"}. The original website is safely preserved and never overwritten.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 font-bold transition text-xs"
          >
            ✕
          </button>
        </div>

        {/* Versions List */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {versions.map((ver, idx) => {
            const isCurrent = ver.id === currentVersionId;
            const isOriginal = ver.source === "original" || ver.versionNumber === 1;

            return (
              <div
                key={ver.id}
                className={`p-4 rounded-xl border transition-all ${
                  isCurrent
                    ? "bg-indigo-50/40 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs"
                    : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md">
                        Version {ver.versionNumber}
                      </span>

                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          isOriginal
                            ? "bg-slate-100 text-slate-700 border border-slate-200"
                            : ver.source === "search_console"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-indigo-100 text-indigo-800 border border-indigo-200"
                        }`}
                      >
                        {isOriginal
                          ? "Original website"
                          : ver.source === "search_console"
                          ? "Search Console optimization"
                          : "SEO optimization"}
                      </span>

                      {isCurrent && (
                        <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active in Workspace</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 font-medium pt-1">
                      {ver.summary || (isOriginal ? "Initial generated website" : "Optimized pages & content")}
                    </p>

                    <div className="flex items-center space-x-3 text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{ver.dateStr}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <Layers className="w-3 h-3 text-slate-400" />
                        <span>{(ver.files || []).filter((f) => f.path.endsWith(".html")).length} pages</span>
                      </span>
                      {ver.affectedPages && ver.affectedPages.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-slate-600 font-medium">
                            {ver.affectedPages.length} page{ver.affectedPages.length === 1 ? "" : "s"} modified
                          </span>
                        </>
                      )}
                      {ver.qualityScore && (
                        <>
                          <span>•</span>
                          <span className="font-bold text-emerald-600">
                            Quality: {ver.qualityScore}/100
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Version Actions */}
                  <div className="flex items-center space-x-2 shrink-0 pt-2 sm:pt-0">
                    {onPreviewVersion && (
                      <button
                        type="button"
                        onClick={() => {
                          onPreviewVersion(ver);
                          onClose();
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1 transition"
                        title="Preview this version in simulator"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="hidden sm:inline">Preview</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleDownloadVersionZip(ver, e)}
                      disabled={downloadingId === ver.id}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1 transition"
                      title="Download full ZIP archive of this version"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-600" />
                      <span className="hidden sm:inline">ZIP</span>
                    </button>

                    {!isCurrent ? (
                      <button
                        type="button"
                        onClick={() => handleSwitch(ver)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Switch to this</span>
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-indigo-600 px-2 py-1">
                        Active
                      </span>
                    )}
                  </div>
                </div>

                {/* Modified Pages Breakdown */}
                {ver.affectedPages && ver.affectedPages.length > 0 && !isOriginal && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5 text-[10px]">
                    <span className="text-slate-400 font-semibold uppercase tracking-wider py-0.5">Pages modified:</span>
                    {ver.affectedPages.slice(0, 8).map((p) => (
                      <span key={p} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                        {p}
                      </span>
                    ))}
                    {ver.affectedPages.length > 8 && (
                      <span className="text-slate-400 py-0.5">+{ver.affectedPages.length - 8} more</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Immutable history: Switching versions preserves all snapshots without loss.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
