"use client";

import React, { useState } from "react";
import {
  Download,
  ExternalLink,
  Smartphone,
  Tablet,
  Monitor,
  RotateCcw,
  Sparkles,
  Send,
  Loader2,
  FileCode,
  Eye,
  Check,
  Copy,
  PlusCircle,
} from "lucide-react";

export interface ProjectFileItem {
  path: string;
  content: string;
  mimeType?: string | null;
}

export interface ProjectData {
  projectId: string;
  name: string;
  notes?: string;
  provider: string;
  model: string;
  files: ProjectFileItem[];
  downloadUrl: string;
}

interface LivePreviewProps {
  project: ProjectData;
  onNewWebsite: () => void;
  onProjectUpdated: (updated: ProjectData) => void;
}

export function LivePreview({
  project,
  onNewWebsite,
  onProjectUpdated,
}: LivePreviewProps) {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const [selectedFile, setSelectedFile] = useState<string>("index.html");
  const [copied, setCopied] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Chat refinement state
  const [chatPrompt, setChatPrompt] = useState("");
  const [refining, setRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);

  const previewUrl = `/api/projects/${project.projectId}/preview?v=${refreshKey}`;

  const currentFileContent =
    project.files.find((f) => f.path === selectedFile)?.content ||
    project.files[0]?.content ||
    "";

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentFileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatPrompt.trim() || refining) return;

    setRefining(true);
    setRefineError(null);

    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.projectId,
          instruction: chatPrompt.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        onProjectUpdated({
          ...project,
          notes: data.notes || project.notes,
          files: data.files,
        });
        setChatPrompt("");
        setRefreshKey((k) => k + 1);
      } else {
        setRefineError(data.error || "Failed to update website.");
      }
    } catch (err) {
      setRefineError(err instanceof Error ? err.message : "Error sending edit request");
    } finally {
      setRefining(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 space-y-4">
      {/* Top Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xl backdrop-blur-md shrink-0">
        {/* Left: Project title & New Website */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onNewWebsite}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5 text-sky-400" />
            <span>New Site</span>
          </button>

          <div className="h-4 w-px bg-slate-800" />

          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-xs">
                {project.name}
              </h2>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {project.provider}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Device Toggle & View Mode */}
        <div className="flex items-center space-x-2">
          {/* Mode Switcher: Preview vs Code */}
          <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex items-center space-x-1">
            <button
              onClick={() => setViewMode("preview")}
              className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center gap-1 ${
                viewMode === "preview"
                  ? "bg-slate-800 text-sky-400 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Preview</span>
            </button>
            <button
              onClick={() => setViewMode("code")}
              className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center gap-1 ${
                viewMode === "code"
                  ? "bg-slate-800 text-sky-400 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Files ({project.files.length})</span>
            </button>
          </div>

          {/* Device switcher (only in preview mode) */}
          {viewMode === "preview" && (
            <div className="hidden sm:flex bg-slate-950 p-1 rounded-lg border border-slate-800 items-center space-x-1">
              <button
                onClick={() => setDevice("desktop")}
                title="Desktop View"
                className={`p-1.5 rounded transition ${
                  device === "desktop"
                    ? "bg-slate-800 text-sky-400"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDevice("tablet")}
                title="Tablet View"
                className={`p-1.5 rounded transition ${
                  device === "tablet"
                    ? "bg-slate-800 text-sky-400"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDevice("mobile")}
                title="Mobile View"
                className={`p-1.5 rounded transition ${
                  device === "mobile"
                    ? "bg-slate-800 text-sky-400"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Reload Preview button */}
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            title="Reload Preview"
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Open in New Tab & Big Direct Download Button */}
        <div className="flex items-center space-x-2">
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open pure website in a full browser tab"
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-medium transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in Tab</span>
          </a>

          {/* Primary High-Visibility Download Button */}
          <a
            href={project.downloadUrl}
            download
            className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Download className="w-4 h-4" />
            <span>Download Website (.ZIP)</span>
          </a>
        </div>
      </div>

      {/* Main Viewport Content Area */}
      <div className="flex-1 min-h-0 bg-slate-950 border border-slate-800/80 rounded-2xl overflow-hidden relative shadow-2xl flex flex-col">
        {viewMode === "preview" ? (
          <div className="flex-1 w-full h-full flex items-center justify-center p-2 sm:p-4 bg-slate-950/60 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-white ${
                device === "desktop"
                  ? "w-full"
                  : device === "tablet"
                  ? "w-[768px] max-w-full"
                  : "w-[375px] max-w-full"
              }`}
            >
              <iframe
                src={previewUrl}
                title="Generated Static Website Live Preview"
                className="w-full h-full border-0 bg-white"
                sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
              />
            </div>
          </div>
        ) : (
          /* Simple File Inspector */
          <div className="flex-1 flex flex-col h-full bg-slate-900">
            {/* File selection tabs */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center space-x-2 overflow-x-auto">
                {project.files.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file.path)}
                    className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition ${
                      selectedFile === file.path
                        ? "bg-slate-800 text-sky-400 border border-slate-700"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                    }`}
                  >
                    {file.path}
                  </button>
                ))}
              </div>

              <button
                onClick={handleCopyCode}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Code display */}
            <div className="flex-1 overflow-auto p-4 bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed selection:bg-sky-500/30">
              <pre>{currentFileContent}</pre>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Chat Refinement Input Bar */}
      <div className="shrink-0 bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-xl backdrop-blur-md">
        <form onSubmit={handleRefine} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={chatPrompt}
              onChange={(e) => setChatPrompt(e.target.value)}
              placeholder="Ask AI to make changes or additions (e.g., 'Change theme to dark emerald', 'Add a working contact form', 'Add pricing cards')..."
              disabled={refining}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
            />
          </div>

          <button
            type="submit"
            disabled={refining || !chatPrompt.trim()}
            className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:hover:bg-sky-500 text-white font-medium text-sm rounded-lg transition flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 shrink-0"
          >
            {refining ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Updating Website...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Ask AI to Update</span>
              </>
            )}
          </button>
        </form>

        {refineError && (
          <p className="text-xs text-red-400 mt-2 px-1">{refineError}</p>
        )}
      </div>
    </div>
  );
}
