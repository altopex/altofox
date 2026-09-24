"use client";

import React, { useState, useEffect, useMemo } from "react";
import JSZip from "jszip";
import {
  Download,
  Smartphone,
  Tablet,
  Monitor,
  RotateCcw,
  Sparkles,
  Loader2,
  FileCode,
  Eye,
  Check,
  Copy,
  PlusCircle,
  Save,
  Undo2,
  Rocket,
  X,
  Globe,
  Layers,
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
  downloadUrl?: string;
}

interface LivePreviewProps {
  project: ProjectData;
  onNewWebsite: () => void;
  onProjectUpdated: (updated: ProjectData) => void;
}

const QUICK_PROMPT_CHIPS = [
  { label: "📞 Sticky Emergency Call Bar", prompt: "Add a sticky mobile call-now bar with click-to-dial button at the bottom of the screen." },
  { label: "⭐ 3 Local Customer Reviews", prompt: "Add 3 authentic local customer testimonials with 5 gold stars and specific neighborhood names." },
  { label: "🏷️ $50 Off First Service Coupon", prompt: "Add an attractive promotional coupon section with '$50 OFF Any First Service' and coupon code PROMO50." },
  { label: "❓ 5 Homeowner FAQ Accordions", prompt: "Add 5 detailed homeowner FAQ accordions addressing emergency rates, warranties, licensing, and response times." },
  { label: "📍 Local Service Neighborhoods Grid", prompt: "Add an interactive 8-area neighborhood coverage grid showing local zip codes and surrounding towns served." },
  { label: "🎨 Modern High-Contrast Gradient Theme", prompt: "Enhance the design with modern subtle dark gradient cards, polished box shadows, and crisp typography." },
];

export function LivePreview({
  project,
  onNewWebsite,
  onProjectUpdated,
}: LivePreviewProps) {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const [selectedFile, setSelectedFile] = useState<string>("index.html");
  const [activePage, setActivePage] = useState<string>("index.html");
  const [copied, setCopied] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Direct In-Browser Code Editor State
  const [editedContents, setEditedContents] = useState<Record<string, string>>({});
  const [savingFile, setSavingFile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Deploy Modal State
  const [deployModalOpen, setDeployModalOpen] = useState(false);

  // Chat refinement state
  const [chatPrompt, setChatPrompt] = useState("");
  const [refining, setRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);

  // List of HTML pages for multi-page switcher
  const htmlFiles = project.files.filter((f) => f.path.toLowerCase().endsWith(".html"));

  // Sync edited contents when project updates
  useEffect(() => {
    const initialMap: Record<string, string> = {};
    for (const f of project.files) {
      initialMap[f.path] = f.content;
    }
    setEditedContents(initialMap);
  }, [project.files]);

  const currentOriginalContent =
    project.files.find((f) => f.path === selectedFile)?.content || "";
  const currentEditorContent =
    editedContents[selectedFile] !== undefined
      ? editedContents[selectedFile]
      : currentOriginalContent;

  const isCurrentFileDirty = currentEditorContent !== currentOriginalContent;

  // Pure Client-side Live Inlined Preview HTML (Zero Server Latency / Zero DB dependency)
  const inlinedPreviewHtml = useMemo(() => {
    let html =
      project.files.find((f) => f.path.toLowerCase() === activePage.toLowerCase())?.content ||
      project.files.find((f) => f.path.toLowerCase() === "index.html")?.content ||
      project.files.find((f) => f.path.toLowerCase().endsWith(".html"))?.content ||
      "<!DOCTYPE html><html><body><h1>No HTML file found</h1></body></html>";

    const css = project.files.find((f) => f.path.toLowerCase() === "styles.css")?.content || "";
    const js = project.files.find((f) => f.path.toLowerCase() === "script.js")?.content || "";

    if (css) {
      const styleTag = `<style>\n/* Inlined styles.css */\n${css}\n</style>`;
      html = html.includes("</head>")
        ? html.replace("</head>", `${styleTag}\n</head>`)
        : `${styleTag}\n${html}`;
    }

    if (js) {
      const scriptTag = `<script>\n// Inlined script.js\ndocument.addEventListener("DOMContentLoaded", function() {\n${js}\n});\n</script>`;
      html = html.includes("</body>")
        ? html.replace("</body>", `${scriptTag}\n</body>`)
        : `${html}\n${scriptTag}`;
    }

    return html;
  }, [project.files, activePage]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentEditorContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1-Click Instant Client-Side ZIP Download (Zero Database or Server Route Needed)
  const handleDownloadZip = async () => {
    try {
      const zip = new JSZip();
      project.files.forEach((f) => {
        zip.file(f.path, f.content);
      });

      zip.file(
        "README.md",
        `# ${project.name}

Static website generated by AltoFox Static Website Builder.
AI Model: ${project.provider.toUpperCase()} (${project.model})

## How to Run & Preview
Double-click \`index.html\` to open the website in any web browser (Chrome, Safari, Firefox, Edge).

## Free 1-Click Deployment
- **Netlify Drop**: Drag and drop this unzipped folder into https://app.netlify.com/drop for instant free live hosting.
- **GitHub Pages**: Push to GitHub and enable Pages in repository settings.
- **Vercel**: Run \`npx vercel\` inside this unzipped folder.
`
      );

      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 9 },
      });

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      const safeName =
        project.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "") || "static-website";
      a.download = `${safeName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("ZIP packaging error:", err);
    }
  };

  // Direct In-Browser File Edit & Save
  const handleSaveDirectEdits = async () => {
    if (!isCurrentFileDirty || savingFile) return;

    setSavingFile(true);
    const updatedFiles = project.files.map((f) =>
      f.path === selectedFile ? { ...f, content: currentEditorContent } : f
    );

    // Update parent state immediately
    onProjectUpdated({
      ...project,
      files: updatedFiles,
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
    setRefreshKey((k) => k + 1);
    setSavingFile(false);

    // Optionally sync with backend if available
    try {
      fetch(`/api/projects/${project.projectId}/files`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: selectedFile,
          content: currentEditorContent,
        }),
      }).catch(() => {});
    } catch {
      // Non-blocking
    }
  };

  const handleRevertFile = () => {
    setEditedContents((prev) => ({
      ...prev,
      [selectedFile]: currentOriginalContent,
    }));
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
          files: project.files,
          instruction: chatPrompt.trim(),
          provider: project.provider,
          model: project.model,
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.files)) {
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

  // Calculate line numbers for editor
  const lineCount = currentEditorContent.split("\n").length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-3 space-y-3">
      {/* Top Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xl backdrop-blur-md shrink-0">
        {/* Left: Project title & New Website */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onNewWebsite}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5 text-sky-400" />
            <span>New Site</span>
          </button>

          <div className="h-4 w-px bg-slate-800" />

          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-semibold text-white truncate max-w-[180px] sm:max-w-xs">
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
              className={`px-3 py-1 rounded text-xs font-medium transition flex items-center gap-1.5 ${
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
              className={`px-3 py-1 rounded text-xs font-medium transition flex items-center gap-1.5 ${
                viewMode === "code"
                  ? "bg-slate-800 text-sky-400 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Code Files ({project.files.length})</span>
              {Object.keys(editedContents).some(
                (p) =>
                  editedContents[p] !==
                  project.files.find((f) => f.path === p)?.content
              ) && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
            </button>
          </div>

          {/* Page Selector (if multiple HTML pages exist) */}
          {viewMode === "preview" && htmlFiles.length > 1 && (
            <div className="flex items-center space-x-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-xs">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={activePage}
                onChange={(e) => setActivePage(e.target.value)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
              >
                {htmlFiles.map((h) => (
                  <option key={h.path} value={h.path} className="bg-slate-900 text-white">
                    {h.path}
                  </option>
                ))}
              </select>
            </div>
          )}

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
                title="Tablet View (768px)"
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
                title="Mobile View (375px)"
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

        {/* Right: Deploy Guide & Direct ZIP Download */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setDeployModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-medium transition"
          >
            <Rocket className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Deploy Free</span>
          </button>

          {/* Primary High-Visibility Download Button */}
          <button
            type="button"
            onClick={handleDownloadZip}
            className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Download className="w-4 h-4" />
            <span>Download ZIP</span>
          </button>
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
                key={refreshKey}
                srcDoc={inlinedPreviewHtml}
                title="Generated Static Website Live Preview"
                className="w-full h-full border-0 bg-white"
                sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
              />
            </div>
          </div>
        ) : (
          /* In-Browser Interactive Code Editor */
          <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden">
            {/* File selection tabs & Save/Revert Controls */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-950/80 shrink-0">
              <div className="flex items-center space-x-2 overflow-x-auto">
                {project.files.map((file) => {
                  const isFileModified =
                    editedContents[file.path] !== undefined &&
                    editedContents[file.path] !== file.content;
                  return (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFile(file.path)}
                      className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition flex items-center gap-1.5 ${
                        selectedFile === file.path
                          ? "bg-slate-800 text-sky-400 border border-slate-700 shadow-sm"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                      }`}
                    >
                      <span>{file.path}</span>
                      {isFileModified && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Unsaved changes" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {isCurrentFileDirty && (
                  <button
                    onClick={handleRevertFile}
                    title="Revert edits to original"
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition flex items-center gap-1"
                  >
                    <Undo2 className="w-3 h-3" />
                    <span>Revert</span>
                  </button>
                )}

                <button
                  onClick={handleSaveDirectEdits}
                  disabled={!isCurrentFileDirty || savingFile}
                  className={`px-3 py-1 rounded text-xs font-medium border transition flex items-center gap-1.5 ${
                    isCurrentFileDirty
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-600/30"
                      : "bg-slate-800/60 text-slate-500 border-slate-700/50 cursor-not-allowed"
                  }`}
                >
                  {savingFile ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : saveSuccess ? (
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>{saveSuccess ? "Saved!" : "Save & Preview"}</span>
                </button>

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
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Code Editor with Line Numbers */}
            <div className="flex-1 flex overflow-hidden bg-slate-950 font-mono text-xs text-slate-200">
              {/* Line numbers gutter */}
              <div className="w-12 py-3 bg-slate-950 border-r border-slate-850 select-none text-right pr-3 text-slate-600 overflow-hidden leading-5">
                {lineNumbers.map((num) => (
                  <div key={num}>{num}</div>
                ))}
              </div>

              {/* Textarea Code Editor */}
              <textarea
                value={currentEditorContent}
                onChange={(e) =>
                  setEditedContents((prev) => ({
                    ...prev,
                    [selectedFile]: e.target.value,
                  }))
                }
                spellCheck={false}
                className="flex-1 p-3 bg-transparent text-slate-200 focus:outline-none resize-none leading-5 font-mono selection:bg-sky-500/30 overflow-auto whitespace-pre"
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom AI Refinement & Copilot Chips */}
      <div className="shrink-0 bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-xl backdrop-blur-md space-y-2.5">
        {/* Quick Suggestion Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
          <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-sky-400" />
            Quick Enhancements:
          </span>
          {QUICK_PROMPT_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setChatPrompt(chip.prompt)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 whitespace-nowrap transition"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Refinement input form */}
        <form onSubmit={handleRefine} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={chatPrompt}
              onChange={(e) => setChatPrompt(e.target.value)}
              placeholder="Ask AI to update the static website (e.g., 'Change theme to navy blue', 'Add pricing table', 'Add emergency dispatch hours')..."
              disabled={refining}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
            />
          </div>

          <button
            type="submit"
            disabled={refining || !chatPrompt.trim()}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:hover:bg-sky-500 text-white font-medium text-xs rounded-lg transition flex items-center justify-center gap-1.5 shadow-lg shadow-sky-500/20 shrink-0"
          >
            {refining ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Updating Website...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask AI to Update</span>
              </>
            )}
          </button>
        </form>

        {refineError && (
          <p className="text-xs text-red-400 px-1">{refineError}</p>
        )}
      </div>

      {/* Free Deployment Guide Modal */}
      {deployModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Rocket className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">How to Publish This Static Website (Free)</h2>
                  <p className="text-xs text-slate-400">Pure HTML, CSS & JS runs anywhere without servers</p>
                </div>
              </div>
              <button
                onClick={() => setDeployModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-300">
              {/* Option 1: Netlify Drop */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Globe className="w-4 h-4" /> Option 1: Netlify Drop (30 Seconds — Zero Build)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                    Drag & Drop
                  </span>
                </div>
                <p className="text-slate-400 text-xs">
                  1. Click <strong>&quot;Download ZIP&quot;</strong> and unzip the folder on your computer.<br />
                  2. Go to{" "}
                  <a
                    href="https://app.netlify.com/drop"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 hover:underline font-semibold"
                  >
                    app.netlify.com/drop
                  </a>
                  .<br />
                  3. Drag and drop the unzipped folder into your browser. Your website is instantly live with free SSL!
                </p>
              </div>

              {/* Option 2: Vercel CLI */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sky-400 flex items-center gap-1.5">
                    <Rocket className="w-4 h-4" /> Option 2: Vercel CLI
                  </span>
                </div>
                <p className="text-slate-400 text-xs font-mono bg-slate-900 p-2 rounded border border-slate-800">
                  cd {project.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}<br />
                  npx vercel
                </p>
              </div>

              {/* Option 3: GitHub Pages */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-purple-400 flex items-center gap-1.5">
                    <Layers className="w-4 h-4" /> Option 3: GitHub Pages
                  </span>
                </div>
                <p className="text-slate-400 text-xs">
                  Upload the folder to a GitHub repository, enable GitHub Pages in Settings, and your website is hosted permanently for free.
                </p>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={handleDownloadZip}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
              >
                <Download className="w-4 h-4" />
                <span>Download Website ZIP</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
