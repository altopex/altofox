"use client";

import React, { useState, useMemo, useEffect } from "react";
import JSZip from "jszip";
import {
  Download,
  Smartphone,
  Tablet,
  Monitor,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Lock,
  Globe,
  RefreshCw,
  PlusCircle,
  FileCheck,
  Code,
  Layers,
  ExternalLink,
  Palette,
  Loader2,
  Columns,
  ShieldCheck,
  FolderKanban,
  BookOpen,
  Search,
  FileEdit,
} from "lucide-react";
import { QualityReport, runQualityChecksAndAutoFix } from "../lib/quality/quality-checker";
import { runClientMobileCheck, PageMobileAuditResult } from "../lib/quality/mobile-checker";
import { QualityScorecard } from "./QualityScorecard";

export interface ProjectFileItem {
  path: string;
  content: string;
  mimeType?: string | null;
}

export interface ProjectPhotoItem {
  id?: string;
  url: string;
  downloadUrl?: string;
  alt?: string;
  localPath: string;
  localWebpPath?: string;
  width?: number;
  height?: number;
  slot?: string;
  photographer?: string;
  photographerUrl?: string;
  sourceUrl?: string;
  source?: string;
}

export interface ProjectData {
  projectId: string;
  name: string;
  notes?: string;
  provider: string;
  model: string;
  themeName?: string;
  downloadUrl?: string;
  websiteDomain?: string;
  files: ProjectFileItem[];
  photos?: ProjectPhotoItem[];
  qualityReport?: QualityReport;
}

interface LivePreviewProps {
  project: ProjectData;
  onNewWebsite: () => void;
  onGenerateAgain?: () => void;
  onTryAnotherTheme?: () => void;
  onOpenManager?: () => void;
  onOpenKeywordMap?: () => void;
  onOpenFindReplace?: () => void;
  onOpenBlogManager?: () => void;
}

export function LivePreview({
  project,
  onNewWebsite,
  onGenerateAgain,
  onTryAnotherTheme,
  onOpenManager,
  onOpenKeywordMap,
  onOpenFindReplace,
  onOpenBlogManager,
}: LivePreviewProps) {
  // Show mobile preview by default next to desktop preview ("split" mode)
  const [viewMode, setViewMode] = useState<"split" | "desktop" | "mobile" | "tablet">("split");
  const [activePage, setActivePage] = useState<string>("index.html");
  const [refreshKey, setRefreshKey] = useState(0);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [zippingStatus, setZippingStatus] = useState("");
  const [mobileAudit, setMobileAudit] = useState<PageMobileAuditResult | null>(null);
  const [isMobileAuditing, setIsMobileAuditing] = useState(false);

  // List of all HTML pages generated
  const htmlFiles = project.files.filter((f) => f.path.toLowerCase().endsWith(".html"));

  // Inlined preview HTML for the currently selected page
  const inlinedPreviewHtml = useMemo(() => {
    let html =
      project.files.find((f) => f.path.toLowerCase() === activePage.toLowerCase())?.content ||
      project.files.find((f) => f.path.toLowerCase() === "index.html")?.content ||
      project.files.find((f) => f.path.toLowerCase().endsWith(".html"))?.content ||
      "<!DOCTYPE html><html><body><h1>No HTML content found</h1></body></html>";

    const css =
      project.files.find((f) => f.path.toLowerCase() === "css/style.css" || f.path.toLowerCase() === "styles.css")?.content ||
      project.files.find((f) => f.path.toLowerCase().endsWith(".css"))?.content || "";
    const js =
      project.files.find((f) => f.path.toLowerCase() === "js/main.js" || f.path.toLowerCase() === "script.js")?.content ||
      project.files.find((f) => f.path.toLowerCase().endsWith(".js"))?.content || "";

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

    // Replace local image paths with their high-res remote CDN URLs for live preview
    html = html.replace(
      /<img([^>]*?)src=["']images\/[^"']+["']([^>]*?)data-remote-src=["']([^"']+)["']([^>]*?)>/gi,
      '<img$1src="$3"$2data-remote-src="$3"$4>'
    );
    html = html.replace(
      /<img([^>]*?)data-remote-src=["']([^"']+)["']([^>]*?)src=["']images\/[^"']+["']([^>]*?)>/gi,
      '<img$1data-remote-src="$2"$3src="$2"$4>'
    );
    html = html.replace(
      /style=["']background-image:\s*url\(['"]images\/[^'"]+['"]\);["']([^>]*?)data-bg-remote=["']([^"']+)["']/gi,
      'style="background-image: url(\'$2\');"$1data-bg-remote="$2"'
    );
    // Strip <source srcset="images/..." type="image/webp"> in preview so preview loads remote <img> src
    html = html.replace(/<source[^>]*?srcset=["']images\/[^"']+["'][^>]*?>/gi, "");

    return html;
  }, [project.files, activePage]);

  // Comprehensive Quality Report (use server report or compute client-side)
  const qualityReport: QualityReport = useMemo(() => {
    if (project.qualityReport) return project.qualityReport;
    const res = runQualityChecksAndAutoFix(project.files, {
      businessName: project.name,
      domain: project.websiteDomain,
    });
    return res.report;
  }, [project]);

  // Run automated hidden iframe mobile audit at 360px, 390px, 768px, 1280px
  useEffect(() => {
    let isMounted = true;
    setIsMobileAuditing(true);

    runClientMobileCheck(inlinedPreviewHtml, activePage, [360, 390, 768, 1280])
      .then((auditResult) => {
        if (isMounted) {
          setMobileAudit(auditResult);
          setIsMobileAuditing(false);
          if (auditResult.hasAnyOverflow) {
            const overflow = auditResult.breakpoints.find((b) => b.hasOverflow);
            console.warn(`[Mobile Audit] Overflow on ${activePage} at ${overflow?.width}px:`, overflow?.overflowElement);
          } else {
            console.log(`[Mobile Audit] Zero horizontal scrolling on ${activePage} across 360, 390, 768, 1280px.`);
          }
        }
      })
      .catch((err) => {
        console.warn("[Mobile Audit] Audit error:", err);
        if (isMounted) setIsMobileAuditing(false);
      });

    return () => {
      isMounted = false;
    };
  }, [inlinedPreviewHtml, activePage]);

  // Canvas helper to resize and compress photos into JPEG + WebP (~80% quality)
  const processImageWithCanvas = async (
    blob: Blob,
    maxWidth: number
  ): Promise<{ jpgBlob: Blob; webpBlob: Blob }> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") {
        resolve({ jpgBlob: blob, webpBlob: blob });
        return;
      }

      const img = new Image();
      const objectUrl = URL.createObjectURL(blob);
      img.crossOrigin = "anonymous";

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        let width = img.naturalWidth || 800;
        let height = img.naturalHeight || 600;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
        }

        canvas.toBlob(
          (webpBlob) => {
            canvas.toBlob(
              (jpgBlob) => {
                resolve({
                  webpBlob: webpBlob || blob,
                  jpgBlob: jpgBlob || blob,
                });
              },
              "image/jpeg",
              0.82
            );
          },
          "image/webp",
          0.82
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ jpgBlob: blob, webpBlob: blob });
      };

      img.src = objectUrl;
    });
  };

  // Download all files as a clean ZIP package named after the business
  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      setZippingStatus("Gathering website files…");
      const zip = new JSZip();

      // Add all HTML pages, styles.css, script.js, sitemap.xml, robots.txt, CREDITS.txt
      for (const file of project.files) {
        zip.file(file.path, file.content);
      }

      // Add clean README
      zip.file(
        "README.md",
        `# ${project.name}\n\nGenerated with AltoFox Static Website Builder.\n\n## How to Open\nDouble-click \`index.html\` to open your website in any browser (Chrome, Safari, Edge, Firefox).\nAll relative page links, styles, and stock photos in /images are self-contained with zero build step required.\n`
      );

      // Collect photos to bundle into /images
      const photosToFetch: Array<{
        remoteUrl: string;
        localPath: string;
        localWebpPath: string;
        slot: string;
      }> = [];

      const seenPaths = new Set<string>();

      if (project.photos && project.photos.length > 0) {
        for (const p of project.photos) {
          if (!seenPaths.has(p.localPath)) {
            seenPaths.add(p.localPath);
            photosToFetch.push({
              remoteUrl: p.downloadUrl || p.url,
              localPath: p.localPath,
              localWebpPath: p.localWebpPath || p.localPath.replace(/\.jpg$/, ".webp"),
              slot: p.slot || "service",
            });
          }
        }
      } else {
        // Parse from HTML files if project.photos not present
        for (const file of project.files) {
          if (!file.path.endsWith(".html")) continue;
          const imgRegex = /<img[^>]*?src=["'](images\/[^"']+)["'][^>]*?data-remote-src=["']([^"']+)["'][^>]*?>/gi;
          let match;
          while ((match = imgRegex.exec(file.content)) !== null) {
            const localPath = match[1];
            const remoteUrl = match[2];
            if (!seenPaths.has(localPath)) {
              seenPaths.add(localPath);
              photosToFetch.push({
                remoteUrl,
                localPath,
                localWebpPath: localPath.replace(/\.jpg$/, ".webp"),
                slot: localPath.includes("hero") ? "hero" : "service",
              });
            }
          }
          const bgRegex = /style=["']background-image:\s*url\(['"](images\/[^'"]+)['"]\);["'][^>]*?data-bg-remote=["']([^"']+)["']/gi;
          let bgMatch;
          while ((bgMatch = bgRegex.exec(file.content)) !== null) {
            const localPath = bgMatch[1];
            const remoteUrl = bgMatch[2];
            if (!seenPaths.has(localPath)) {
              seenPaths.add(localPath);
              photosToFetch.push({
                remoteUrl,
                localPath,
                localWebpPath: localPath.replace(/\.jpg$/, ".webp"),
                slot: "hero",
              });
            }
          }
        }
      }

      // Download and optimize photos via local server proxy (avoids CORS)
      let photoCount = 0;
      for (const item of photosToFetch) {
        photoCount++;
        setZippingStatus(`Optimizing photo ${photoCount} of ${photosToFetch.length}…`);
        try {
          const proxyUrl = `/api/images/proxy?url=${encodeURIComponent(item.remoteUrl)}`;
          const response = await fetch(proxyUrl);
          if (response.ok) {
            const blob = await response.blob();
            const isHero = item.slot === "hero" || item.localPath.includes("hero");
            const isAvatar = item.slot === "avatar";
            const maxWidth = isHero ? 1920 : isAvatar ? 200 : 800;

            const processed = await processImageWithCanvas(blob, maxWidth);
            zip.file(item.localPath, processed.jpgBlob);
            zip.file(item.localWebpPath, processed.webpBlob);
          }
        } catch (imgErr) {
          console.warn(`Could not bundle image ${item.localPath}:`, imgErr);
        }
      }

      setZippingStatus("Compressing ZIP package…");
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

      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 1000);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error("ZIP download failed:", err);
      alert("Failed to create ZIP download. Please try again.");
    } finally {
      setIsZipping(false);
      setZippingStatus("");
    }
  };

  const handleOpenInNewTab = () => {
    try {
      const blob = new Blob([inlinedPreviewHtml], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      console.error("Open in new tab failed:", e);
    }
  };

  const displayDomain =
    project.websiteDomain?.trim() ||
    `www.${project.name.toLowerCase().replace(/[^a-z0-9]/g, "") || "mysite"}.com`;

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Success Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-[12px] border border-[#E2E8F0] shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-[#ECFDF5] text-[#10B981] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <span>Your website is ready!</span>
              <span className="text-xl">🎉</span>
            </h1>
            <p className="text-xs text-[#64748B]">
              Generated for <strong className="text-[#0F172A]">{project.name}</strong> •{" "}
              Theme: <strong className="text-[#0F172A]">{project.themeName || "Modern Pro"}</strong> •{" "}
              {htmlFiles.length} pages ready to download
            </p>
          </div>
        </div>

        {/* Quick actions on mobile header */}
        <div className="flex items-center space-x-2">
          {onOpenManager && (
            <button
              type="button"
              onClick={onOpenManager}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-[10px] border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-xs font-semibold text-indigo-700 transition"
              title="Open full Website Manager with Page Editor, SEO snippet preview, and Search Console tab"
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Website Manager</span>
            </button>
          )}
          <button
            type="button"
            onClick={onNewWebsite}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-[10px] border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Website</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-[10px] bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold shadow-sm transition disabled:opacity-75"
          >
            {isZipping ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{zippingStatus || "Bundling ZIP…"}</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>{downloadSuccess ? "Downloaded!" : "Download ZIP"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Split Layout: Left Browser Preview + Right Action Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Browser-style Preview Frame (8 of 12 cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-3">
          {/* Page Tabs & Device Controls */}
          <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-2 flex flex-wrap items-center justify-between gap-2 shadow-sm">
            {/* Page selector tabs */}
            <div className="flex items-center gap-1 overflow-x-auto max-w-full py-0.5">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider px-2 shrink-0">
                Pages:
              </span>
              {htmlFiles.map((h) => {
                const isActive = activePage.toLowerCase() === h.path.toLowerCase();
                return (
                  <button
                    key={h.path}
                    type="button"
                    onClick={() => setActivePage(h.path)}
                    className={`px-3 py-1 rounded-[8px] text-xs font-medium transition shrink-0 ${
                      isActive
                        ? "bg-[#4F46E5] text-white font-semibold shadow-sm"
                        : "bg-slate-100 hover:bg-slate-200 text-[#0F172A]"
                    }`}
                  >
                    {h.path}
                  </button>
                );
              })}
            </div>

            {/* Viewport device toggles */}
            <div className="flex items-center space-x-1 shrink-0 ml-auto">
              <div className="bg-slate-100 p-0.5 rounded-[8px] flex items-center space-x-0.5 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode("split")}
                  title="Dual Preview (Desktop + Mobile side-by-side)"
                  className={`px-2.5 py-1 rounded-[6px] text-xs font-semibold flex items-center gap-1.5 transition ${
                    viewMode === "split"
                      ? "bg-white text-[#4F46E5] shadow-xs"
                      : "text-[#64748B] hover:text-[#0F172A]"
                  }`}
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Desktop + Mobile</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("desktop")}
                  title="Desktop View (1280px)"
                  className={`p-1.5 rounded-[6px] transition ${
                    viewMode === "desktop"
                      ? "bg-white text-[#4F46E5] shadow-xs font-semibold"
                      : "text-[#64748B] hover:text-[#0F172A]"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("tablet")}
                  title="Tablet View (768px)"
                  className={`p-1.5 rounded-[6px] transition ${
                    viewMode === "tablet"
                      ? "bg-white text-[#4F46E5] shadow-xs font-semibold"
                      : "text-[#64748B] hover:text-[#0F172A]"
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("mobile")}
                  title="Mobile View (375px)"
                  className={`p-1.5 rounded-[6px] transition ${
                    viewMode === "mobile"
                      ? "bg-white text-[#4F46E5] shadow-xs font-semibold"
                      : "text-[#64748B] hover:text-[#0F172A]"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setRefreshKey((k) => k + 1)}
                title="Reload Preview"
                className="p-1.5 rounded-[8px] border border-[#E2E8F0] hover:bg-slate-50 text-[#64748B] hover:text-[#0F172A] transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Browser Frame */}
          <div className="bg-white border border-[#E2E8F0] rounded-[16px] shadow-sm overflow-hidden flex flex-col">
            {/* Fake Chrome Address Bar */}
            <div className="bg-slate-50 border-b border-[#E2E8F0] px-4 py-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center space-x-1.5 shrink-0">
                <span className="w-3 h-3 rounded-full bg-slate-300 inline-block" />
                <span className="w-3 h-3 rounded-full bg-slate-300 inline-block" />
                <span className="w-3 h-3 rounded-full bg-slate-300 inline-block" />
              </div>

              {/* URL Pill */}
              <div className="flex-1 max-w-md mx-auto bg-white border border-[#E2E8F0] rounded-full px-3 py-1 flex items-center justify-between space-x-2 text-xs text-[#64748B] shadow-2xs">
                <div className="flex items-center space-x-2 truncate">
                  <Lock className="w-3 h-3 text-[#10B981] shrink-0" />
                  <span className="truncate">
                    https://{displayDomain}/{activePage}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleOpenInNewTab}
                  title="Open in new tab"
                  className="p-0.5 text-slate-400 hover:text-[#4F46E5] transition shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="w-24 shrink-0 flex items-center justify-end space-x-1.5">
                <button
                  type="button"
                  onClick={handleOpenInNewTab}
                  title="Open in new tab"
                  className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 rounded-[6px] border border-slate-200 bg-white hover:bg-slate-100 text-[11px] font-medium text-[#64748B] hover:text-[#0F172A] transition"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Tab</span>
                </button>
                <span className="text-[10px] font-mono text-[#94A3B8] uppercase">
                  {viewMode}
                </span>
              </div>
            </div>

            {/* Viewport Iframe Container */}
            {viewMode === "split" ? (
              <div className="bg-slate-100 min-h-[580px] h-[calc(100vh-21rem)] p-3 sm:p-4 overflow-hidden flex flex-col xl:flex-row gap-4 items-stretch justify-center">
                {/* Desktop Viewport */}
                <div className="flex-1 min-w-0 h-full flex flex-col rounded-[10px] overflow-hidden border border-[#E2E8F0] shadow-md bg-white">
                  <div className="bg-slate-50 border-b border-slate-200 px-3 py-1.5 flex items-center justify-between text-[11px] text-[#64748B]">
                    <div className="flex items-center gap-1.5 font-semibold text-[#0F172A]">
                      <Monitor className="w-3.5 h-3.5 text-[#4F46E5]" />
                      <span>Desktop Preview (1280px)</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">Fluid Responsive</span>
                  </div>
                  <iframe
                    key={`desk-${refreshKey}`}
                    srcDoc={inlinedPreviewHtml}
                    title="Desktop Preview"
                    className="w-full flex-1 border-0 bg-white"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
                  />
                </div>

                {/* Mobile Viewport (Default side-by-side) */}
                <div className="w-full xl:w-[375px] shrink-0 h-full flex flex-col rounded-[24px] overflow-hidden border-4 border-slate-800 shadow-xl bg-white relative">
                  {/* Phone Notch Header */}
                  <div className="bg-slate-800 text-white px-4 py-1.5 flex items-center justify-between text-[11px] select-none">
                    <span className="font-semibold text-[10px]">9:41</span>
                    <div className="w-16 h-3.5 bg-slate-900 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-slate-700" />
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-400">5G 100%</span>
                  </div>
                  <div className="bg-slate-50 border-b border-slate-200 px-3 py-1 flex items-center justify-between text-[10px] text-[#64748B]">
                    <div className="flex items-center gap-1">
                      <Smartphone className="w-3 h-3 text-[#4F46E5]" />
                      <span className="font-bold text-[#0F172A]">Mobile (375px)</span>
                    </div>
                    <span className="text-emerald-600 font-semibold">Primary Traffic</span>
                  </div>
                  <iframe
                    key={`mob-${refreshKey}`}
                    srcDoc={inlinedPreviewHtml}
                    title="Mobile Preview"
                    className="w-full flex-1 border-0 bg-white"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-slate-100 min-h-[580px] h-[calc(100vh-21rem)] flex items-center justify-center p-2 sm:p-4 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-[10px] overflow-hidden border border-[#E2E8F0] shadow-md bg-white ${
                    viewMode === "desktop"
                      ? "w-full"
                      : viewMode === "tablet"
                      ? "w-[768px] max-w-full"
                      : "w-[375px] max-w-full rounded-[24px] border-4 border-slate-800 flex flex-col"
                  }`}
                >
                  {viewMode === "mobile" && (
                    <div className="bg-slate-800 text-white px-4 py-1.5 flex items-center justify-between text-[11px] select-none">
                      <span className="font-semibold text-[10px]">9:41</span>
                      <div className="w-16 h-3.5 bg-slate-900 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-slate-700" />
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-400">5G 100%</span>
                    </div>
                  )}
                  <iframe
                    key={refreshKey}
                    srcDoc={inlinedPreviewHtml}
                    title="Generated Static Website Live Preview"
                    className="w-full h-full border-0 bg-white"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Actions & Quality Scorecard (4 of 12 cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          {/* Automated Website Quality Scorecard */}
          <QualityScorecard
            report={qualityReport}
            mobileAudit={mobileAudit}
            activePage={activePage}
            isMobileAuditing={isMobileAuditing}
          />

          {/* Quick Optimization & Content Tools */}
          {(onOpenKeywordMap || onOpenFindReplace || onOpenBlogManager || onOpenManager) && (
            <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-sm space-y-3">
              <div>
                <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block mb-1">
                  Local SEO & Optimization
                </span>
                <h3 className="text-sm font-bold text-[#0F172A]">Site Optimization Tools</h3>
              </div>

              <div className="grid grid-cols-1 gap-2 pt-1">
                {onOpenManager && (
                  <button
                    type="button"
                    onClick={onOpenManager}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition text-left group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                        <FolderKanban className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">Website Manager</div>
                        <div className="text-[11px] text-slate-500">Edit pages, GSC analytics & 301 redirects</div>
                      </div>
                    </div>
                  </button>
                )}

                {onOpenKeywordMap && (
                  <button
                    type="button"
                    onClick={onOpenKeywordMap}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition text-left group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                        <Search className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">Keyword Map & Scoring</div>
                        <div className="text-[11px] text-slate-500">Target keywords, SEO score & cannibalization</div>
                      </div>
                    </div>
                  </button>
                )}

                {onOpenFindReplace && (
                  <button
                    type="button"
                    onClick={onOpenFindReplace}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition text-left group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                        <FileEdit className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">Find & Replace & NAP</div>
                        <div className="text-[11px] text-slate-500">Smart phone replacer & global business variables</div>
                      </div>
                    </div>
                  </button>
                )}

                {onOpenBlogManager && (
                  <button
                    type="button"
                    onClick={onOpenBlogManager}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition text-left group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">Homeowner Blog Posts</div>
                        <div className="text-[11px] text-slate-500">Generate 15 topic ideas & 1200+ word guides</div>
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Download & Action Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-sm space-y-4">
            <div>
              <span className="text-[11px] font-semibold text-[#4F46E5] uppercase tracking-wider block mb-1">
                Ready to Publish
              </span>
              <h3 className="text-base font-bold text-[#0F172A]">Get Your Website Files</h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Download a clean, production-ready static ZIP archive. Zero build step or database required.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              {/* Primary Download Button */}
              <button
                type="button"
                onClick={handleDownloadZip}
                disabled={isZipping}
                className="w-full inline-flex items-center justify-center space-x-2 py-3 px-4 rounded-[10px] bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-bold shadow-sm transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-75"
              >
                {isZipping ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{zippingStatus || "Bundling ZIP Package…"}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>{downloadSuccess ? "Downloaded!" : "Download ZIP Package"}</span>
                  </>
                )}
              </button>

              {/* Generate Again Button */}
              {onGenerateAgain && (
                <button
                  type="button"
                  onClick={onGenerateAgain}
                  className="w-full inline-flex items-center justify-center space-x-2 py-2.5 px-4 rounded-[10px] border border-[#CBD5E1] bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A] transition"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>Generate Again</span>
                </button>
              )}

              {/* Try Another Theme Button */}
              {onTryAnotherTheme && (
                <button
                  type="button"
                  onClick={onTryAnotherTheme}
                  className="w-full inline-flex items-center justify-center space-x-2 py-2.5 px-4 rounded-[10px] border border-[#CBD5E1] bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A] transition"
                >
                  <Palette className="w-3.5 h-3.5 text-[#4F46E5]" />
                  <span>Try Another Theme</span>
                </button>
              )}

              {/* Start a New Website Button */}
              <button
                type="button"
                onClick={onNewWebsite}
                className="w-full inline-flex items-center justify-center space-x-1.5 py-2 px-4 rounded-[10px] hover:bg-slate-100 text-xs font-semibold text-[#64748B] transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Start a New Website</span>
              </button>
            </div>
          </div>

          {/* Checklist Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Included In Your Package
            </h4>
            <ul className="space-y-2.5 text-xs text-[#64748B]">
              <li className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#0F172A]">{htmlFiles.length} HTML Pages</strong> (Home, About, Services, Contact, etc.)
                </span>
              </li>
              <li className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#0F172A]">Shared styles.css &amp; script.js</strong> (responsive design &amp; mobile menu)
                </span>
              </li>
              <li className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#0F172A]">Schema.org LocalBusiness JSON-LD</strong> (structured data for Google rich snippets)
                </span>
              </li>
              <li className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#0F172A]">Local SEO meta tags &amp; canonicals</strong> on every page
                </span>
              </li>
              <li className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#0F172A]">sitemap.xml &amp; robots.txt</strong> ready for search engine indexing
                </span>
              </li>
              <li className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#0F172A]">Zero Build Step:</strong> Double-click <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">index.html</code> to open immediately in any browser
                </span>
              </li>
            </ul>
          </div>

          {/* Theme & Model info card */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] p-3 text-[11px] text-[#64748B] flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <Palette className="w-3.5 h-3.5 text-[#4F46E5]" />
              <span>Theme: <strong className="text-[#0F172A]">{project.themeName || "Modern Pro"}</strong></span>
            </span>
            <span className="uppercase font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-[#0F172A]">
              {project.model}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
