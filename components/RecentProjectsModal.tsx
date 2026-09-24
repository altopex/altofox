"use client";

import React, { useEffect, useState } from "react";
import { X, FolderArchive, Download, ExternalLink, Calendar, FileCode2, Loader2 } from "lucide-react";

interface ProjectItem {
  id: string;
  name: string;
  prompt: string;
  provider: string;
  model: string;
  fileCount: number;
  createdAt: string;
  downloadUrl: string;
}

interface RecentProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (projectId: string) => void;
}

export function RecentProjectsModal({
  isOpen,
  onClose,
  onSelectProject,
}: RecentProjectsModalProps) {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch("/api/projects")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setProjects(data.projects);
          }
        })
        .catch((err) => console.error("Failed to load projects:", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Recent Generated Websites</h2>
              <p className="text-xs text-slate-400">View or re-download previously generated static websites</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
              <p className="text-xs">Loading websites...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm">No websites generated yet.</p>
              <p className="text-xs text-slate-500 mt-1">
                Enter a prompt on the home screen to create your first static website!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-xl border border-slate-800 bg-slate-800/40 hover:border-slate-700 hover:bg-slate-800 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-white text-sm truncate">{p.name}</h3>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                        {p.provider}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">{p.prompt}</p>
                    <div className="flex items-center space-x-4 text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <FileCode2 className="w-3.5 h-3.5" /> {p.fileCount} static files
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(p.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => {
                        onSelectProject(p.id);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-medium border border-sky-500/20 transition flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Preview
                    </button>
                    <a
                      href={p.downloadUrl}
                      download
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium border border-emerald-500/20 transition flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      ZIP
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
