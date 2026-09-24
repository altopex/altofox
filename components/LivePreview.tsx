"use client";

import React, { useState, useMemo } from "react";
import JSZip from "jszip";
import {
  Download,
  Smartphone,
  Tablet,
  Monitor,
  RotateCcw,
  PlusCircle,
  Layers,
  CheckCircle,
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
  downloadUrl?: string;
  files: ProjectFileItem[];
}

interface LivePreviewProps {
  project: ProjectData;
  onNewWebsite: () => void;
}

export function LivePreview({ project, onNewWebsite }: LivePreviewProps) {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [activePage, setActivePage] = useState<string>("index.html");
  const [refreshKey, setRefreshKey] = useState(0);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // List of all HTML pages generated
  const htmlFiles = project.files.filter((f) => f.path.toLowerCase().endsWith(".html"));

  // Inlined preview HTML for the currently selected page
  const inlinedPreviewHtml = useMemo(() => {
    let html =
      project.files.find((f) => f.path.toLowerCase() === activePage.toLowerCase())?.content ||
      project.files.find((f) => f.path.toLowerCase() === "index.html")?.content ||
      project.files.find((f) => f.path.toLowerCase().endsWith(".html"))?.content ||
      "<!DOCTYPE html><html><body><h1>No HTML content found</h1></body></html>";

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

  // Download all files as a clean ZIP package named after the business
  const handleDownloadZip = async () => {
    try {
      const zip = new JSZip();

      // Add all HTML pages, styles.css, script.js, sitemap.xml, robots.txt
      for (const file of project.files) {
        zip.file(file.path, file.content);
      }

      // Add a helpful README
      zip.file(
        "README.md",
        `# ${project.name}\n\nGenerated with AltoFox Static Website Builder.\n\n## How to Run\nDouble-click \`index.html\` to open your website in any browser (Google Chrome, Safari, Edge, Firefox).\nAll relative page links and styles are self-contained.\n`
      );

      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 9 },
      });

      const blobUrl = URL.createObjectURL(zipBlob);
      const tempLink = document.createElement("a");
      tempLink.href = blobUrl;

      // Clean business name for the filename
      const cleanName =
        project.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "") || "website";

      tempLink.download = `${cleanName}.zip`;
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);

      // Clean up the URL object after a short delay
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 1000);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error("ZIP download failed:", err);
      alert("Failed to create ZIP download. Please try again.");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-3 space-y-3">
      {/* Top Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xl backdrop-blur-md shrink-0">
        {/* Left: Project title & New Website */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onNewWebsite}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5 text-sky-400" />
            <span>New Website</span>
          </button>

          <div className="h-4 w-px bg-slate-800" />

          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-xs">
              {project.name}
            </h2>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              {project.provider}
            </span>
          </div>
        </div>

        {/* Center: Page Selector & Device Viewport Switcher */}
        <div className="flex items-center space-x-2">
          {/* Page Dropdown */}
          <div className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
            <Layers className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="text-slate-400 text-[11px] hidden sm:inline">Page:</span>
            <select
              value={activePage}
              onChange={(e) => setActivePage(e.target.value)}
              className="bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer"
            >
              {htmlFiles.map((h) => (
                <option key={h.path} value={h.path} className="bg-slate-900 text-white">
                  {h.path}
                </option>
              ))}
            </select>
          </div>

          {/* Viewport device toggles */}
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

          {/* Reload Preview button */}
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            title="Reload Preview"
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Direct Download ZIP Button */}
        <div>
          <button
            type="button"
            onClick={handleDownloadZip}
            className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {downloadSuccess ? (
              <>
                <CheckCircle className="w-4 h-4 text-white" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Website (.ZIP)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Viewport Preview Area */}
      <div className="flex-1 min-h-0 bg-slate-950 border border-slate-800/80 rounded-2xl overflow-hidden relative shadow-2xl flex items-center justify-center p-2 sm:p-4 bg-slate-950/60">
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
    </div>
  );
}
