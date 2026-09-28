"use client";

import React, { useState, useMemo, useEffect } from "react";
import { BRAND } from "@/config/brand";
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
  Database,
} from "lucide-react";
import { QualityReport, runQualityChecksAndAutoFix } from "../lib/quality/quality-checker";
import { runClientMobileCheck, PageMobileAuditResult } from "../lib/quality/mobile-checker";
import { WebsiteQualityAuditReport, auditWebsiteQuality } from "../lib/quality/website-quality-auditor";
import { ImprovementActionType } from "../lib/quality/website-improver";
import { QualityScorecard } from "./QualityScorecard";
import { validateWebsiteFiles, ZipValidationResult } from "../lib/export/zip-validator";
import { buildCanonicalWebsiteFiles } from "../lib/export/canonical-files";
import {
  preparePreviewHtml,
  validatePreviewReadiness,
  extractSchemaOrgFromHtml,
  PreviewValidationReport,
} from "../lib/export/preview-renderer";
import { ProviderType } from "@/lib/ai/types";

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
  customContentInstructions?: string;
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
  onUpdateProject?: (updatedProject: ProjectData) => void;
  isSaved?: boolean;
  onSaveForFuture?: () => void;
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
  onUpdateProject,
  isSaved,
  onSaveForFuture,
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

  // Active files state & version safety (Original vs Improved)
  const [currentFiles, setCurrentFiles] = useState<ProjectFileItem[]>(project.files);
  const [originalFiles, setOriginalFiles] = useState<ProjectFileItem[] | null>(null);
  const [improvedFiles, setImprovedFiles] = useState<ProjectFileItem[] | null>(null);
  const [activeVersion, setActiveVersion] = useState<"original" | "improved">("improved");
  const [isImproving, setIsImproving] = useState(false);
  const [improvingStep, setImprovingStep] = useState("");
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [recentChanges, setRecentChanges] = useState<string[]>([]);
  const [customAuditReport, setCustomAuditReport] = useState<WebsiteQualityAuditReport | null>(null);
  const [validationResult, setValidationResult] = useState<ZipValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);

  const [telClickedNotice, setTelClickedNotice] = useState<string | null>(null);
  const [showSchemaModal, setShowSchemaModal] = useState(false);

  // Synchronize state when project changes and ensure canonical files (sitemap, robots, etc.)
  useEffect(() => {
    const canonical = buildCanonicalWebsiteFiles(project.files || [], {
      projectName: project.name,
      domain: project.websiteDomain,
    });
    setCurrentFiles(canonical.files);
    setOriginalFiles(null);
    setImprovedFiles(null);
    setActiveVersion("improved");
    setRecentChanges([]);
    setCustomAuditReport(null);
    setValidationResult(null);
  }, [project.projectId, project.files, project.name, project.websiteDomain]);

  // List of all HTML pages generated
  const htmlFiles = currentFiles.filter((f) => f.path.toLowerCase().endsWith(".html"));

  // Check if sitemap or robots exist in currentFiles
  const hasSitemap = currentFiles.some((f) => f.path.toLowerCase() === "sitemap.xml");
  const hasRobots = currentFiles.some((f) => f.path.toLowerCase() === "robots.txt");

  // Listen for iframe link clicks to navigate smoothly between pages in preview mode (POSIX resolved)
  useEffect(() => {
    const handleMsg = (e: MessageEvent) => {
      if (!e.data) return;
      if (e.data.type === "PREVIEW_NAVIGATE" && typeof e.data.path === "string") {
        const targetPath = e.data.path.toLowerCase();
        const found = currentFiles.find(
          (f) =>
            f.path.toLowerCase() === targetPath ||
            f.path.toLowerCase().replace(/^\/+/, "") === targetPath ||
            f.path.toLowerCase() === `${targetPath}.html` ||
            f.path.toLowerCase().endsWith("/" + targetPath)
        );
        if (found) {
          setActivePage(found.path);
        }
      } else if (e.data.type === "PREVIEW_TEL_CLICK") {
        setTelClickedNotice(`📞 Click-to-Call Verified: ${e.data.text || e.data.phone} (Working tel: link on mobile & desktop)`);
        setTimeout(() => setTelClickedNotice(null), 4500);
      }
    };
    window.addEventListener("message", handleMsg);
    return () => window.removeEventListener("message", handleMsg);
  }, [currentFiles]);

  // Inlined preview HTML for the currently selected page with complete asset resolution
  const inlinedPreviewHtml = useMemo(() => {
    return preparePreviewHtml({
      pagePath: activePage,
      files: currentFiles,
      photos: project.photos,
      businessDetails: {
        name: project.name,
        domain: project.websiteDomain,
      },
      viewport: viewMode,
    });
  }, [currentFiles, activePage, project.photos, project.name, project.websiteDomain, viewMode]);

  // Preview readiness report (verifying complete content, headers, heroes, services, tel links, styling)
  const previewReadiness = useMemo(() => {
    return validatePreviewReadiness(currentFiles, activePage, project.photos);
  }, [currentFiles, activePage, project.photos]);

  // Schema.org structured data extracted from current active page
  const currentSchemas = useMemo(() => {
    const activeFile = currentFiles.find((f) => f.path.toLowerCase() === activePage.toLowerCase());
    const content = activeFile?.content ? String(activeFile.content) : "";
    return extractSchemaOrgFromHtml(content);
  }, [currentFiles, activePage]);

  // Comprehensive Quality & SEO Audit Report (calculated from real checks)
  const qualityReport: WebsiteQualityAuditReport = useMemo(() => {
    if (customAuditReport) return customAuditReport;
    return auditWebsiteQuality(currentFiles, {
      businessName: project.name,
      domain: project.websiteDomain,
    });
  }, [customAuditReport, currentFiles, project.name, project.websiteDomain]);

  // Handler for targeted improvement actions (Individual or Improve All)
  const handleImproveAction = async (actionType: ImprovementActionType) => {
    setIsImproving(true);
    setActiveAction(actionType);
    setImprovingStep(
      actionType === "improve_all"
        ? "Analyzing website & applying full 95+ quality improvements…"
        : `Applying ${actionType.replace("improve_", "").replace(/_/g, " ")} improvement…`
    );

    try {
      if (!originalFiles) {
        setOriginalFiles([...currentFiles]);
      }

      // Read active provider and API key directly from localStorage so improvement reuses the generator's connected key
      const storedProvider = (typeof window !== "undefined"
        ? localStorage.getItem("altofox_active_provider") ||
          localStorage.getItem("ranklocal_active_provider") ||
          project.provider ||
          "gemini"
        : project.provider || "gemini") as ProviderType;

      const storedKey = typeof window !== "undefined"
        ? localStorage.getItem(`altofox_key_${storedProvider}`) ||
          localStorage.getItem(`ranklocal_key_${storedProvider}`) ||
          localStorage.getItem("altofox_key_gemini") ||
          localStorage.getItem("altofox_key_openai") ||
          localStorage.getItem("altofox_key_openrouter") ||
          ""
        : "";

      const storedModel = typeof window !== "undefined"
        ? localStorage.getItem(`altofox_model_${storedProvider}`) ||
          localStorage.getItem(`ranklocal_model_${storedProvider}`) ||
          localStorage.getItem("altofox_active_model") ||
          project.model ||
          undefined
        : project.model;

      const storedBaseUrl = typeof window !== "undefined"
        ? localStorage.getItem(`altofox_base_url_${storedProvider}`) ||
          localStorage.getItem(`ranklocal_base_url_${storedProvider}`) ||
          localStorage.getItem("altofox_base_url_custom") ||
          localStorage.getItem("ranklocal_base_url_custom") ||
          undefined
        : undefined;

      const storedOrgId = typeof window !== "undefined"
        ? localStorage.getItem(`altofox_org_id_${storedProvider}`) ||
          localStorage.getItem(`ranklocal_org_id_${storedProvider}`) ||
          localStorage.getItem("altofox_org_id_custom") ||
          localStorage.getItem("ranklocal_org_id_custom") ||
          undefined
        : undefined;

      const storedProviderName = typeof window !== "undefined"
        ? localStorage.getItem(`altofox_provider_name_${storedProvider}`) ||
          localStorage.getItem(`ranklocal_provider_name_${storedProvider}`) ||
          localStorage.getItem("altofox_provider_name_custom") ||
          localStorage.getItem("ranklocal_provider_name_custom") ||
          undefined
        : undefined;

      const res = await fetch("/api/projects/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionType,
          files: currentFiles,
          meta: {
            businessName: project.name,
            domain: project.websiteDomain,
            customContentInstructions: project.customContentInstructions,
          },
          projectId: project.projectId,
          provider: storedProvider,
          apiKey: storedKey || undefined,
          model: storedModel,
          baseUrl: storedBaseUrl,
          organizationId: storedOrgId,
          providerName: storedProviderName,
        }),
      });

      if (!originalFiles) {
        setOriginalFiles(currentFiles);
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.improvedFiles)) {
        setImprovedFiles(data.improvedFiles);
        setCurrentFiles(data.improvedFiles);
        setCustomAuditReport(data.report);
        setActiveVersion("improved");
        if (Array.isArray(data.changesApplied)) {
          setRecentChanges((prev) => [...prev, ...data.changesApplied]);
        }
        if (onUpdateProject) {
          onUpdateProject({
            ...project,
            files: data.improvedFiles,
            qualityReport: data.report,
          });
        }
      } else {
        alert(data.error || "Failed to apply improvement.");
      }
    } catch (err: any) {
      console.error("Improvement error:", err);
      alert(err.message || "Failed to execute improvement.");
    } finally {
      setIsImproving(false);
      setActiveAction(null);
      setImprovingStep("");
    }
  };

  const handleToggleVersion = (ver: "original" | "improved") => {
    setActiveVersion(ver);
    if (ver === "original" && originalFiles) {
      setCurrentFiles(originalFiles);
      setCustomAuditReport(null);
    } else if (ver === "improved" && improvedFiles) {
      setCurrentFiles(improvedFiles);
    } else if (ver === "improved" && project.files) {
      setCurrentFiles(project.files);
    }
  };

  // Run automated hidden iframe mobile audit at 360px, 390px, 768px, 1280px (debounced)
  useEffect(() => {
    let isMounted = true;
    setIsMobileAuditing(true);

    const timer = setTimeout(() => {
      runClientMobileCheck(inlinedPreviewHtml, activePage, [360, 390, 768, 1280])
        .then((auditResult) => {
          if (isMounted) {
            setMobileAudit(auditResult);
            setIsMobileAuditing(false);
          }
        })
        .catch((err) => {
          console.warn("[Mobile Audit] Audit error:", err);
          if (isMounted) setIsMobileAuditing(false);
        });
    }, 350);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [inlinedPreviewHtml, activePage]);

  // Canvas helper to resize and compress photos into JPEG + WebP (~80% quality)
  const processImageWithCanvas = async (
    blob: Blob,
    maxWidth: number
  ): Promise<{ jpgBlob: Blob; webpBlob: Blob }> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !blob) {
        resolve({ jpgBlob: blob, webpBlob: blob });
        return;
      }

      let settled = false;
      const finish = (result: { jpgBlob: Blob; webpBlob: Blob }) => {
        if (!settled) {
          settled = true;
          clearTimeout(safetyTimer);
          try {
            URL.revokeObjectURL(objectUrl);
          } catch {}
          resolve(result);
        }
      };

      // 3-second timeout guard to prevent hanging if image decode stalls
      const safetyTimer = setTimeout(() => {
        finish({ jpgBlob: blob, webpBlob: blob });
      }, 3000);

      let objectUrl = "";
      try {
        objectUrl = URL.createObjectURL(blob);
      } catch {
        finish({ jpgBlob: blob, webpBlob: blob });
        return;
      }

      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        try {
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
              try {
                canvas.toBlob(
                  (jpgBlob) => {
                    finish({
                      webpBlob: webpBlob || blob,
                      jpgBlob: jpgBlob || blob,
                    });
                  },
                  "image/jpeg",
                  0.82
                );
              } catch {
                finish({ jpgBlob: blob, webpBlob: webpBlob || blob });
              }
            },
            "image/webp",
            0.82
          );
        } catch {
          finish({ jpgBlob: blob, webpBlob: blob });
        }
      };

      img.onerror = () => {
        finish({ jpgBlob: blob, webpBlob: blob });
      };

      img.src = objectUrl;
    });
  };

  const handleRunValidation = () => {
    setIsValidating(true);
    try {
      const res = validateWebsiteFiles({
        files: currentFiles,
        expectedPages: currentFiles.filter((f) => f.path.endsWith(".html")).map((f) => f.path),
        domain: project?.websiteDomain || project?.name,
      });
      setValidationResult(res);
      setShowValidationModal(true);
    } finally {
      setIsValidating(false);
    }
  };

  // Download all files as a clean ZIP package named after the business
  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      setZippingStatus("Validating website package integrity…");

      const canonical = buildCanonicalWebsiteFiles(currentFiles, {
        projectName: project?.name,
        domain: project?.websiteDomain,
      });
      const validation = canonical.validation;
      setValidationResult(validation);

      if (!validation.valid && validation.errors.length > 0) {
        throw new Error(`Validation check failed: ${validation.errors.join("; ")}`);
      }

      setZippingStatus("Gathering website files…");
      const JSZipModule = await import("jszip");
      const JSZip = (JSZipModule as any).default?.default || (JSZipModule as any).default || JSZipModule;
      const zip = new JSZip();

      // Add all canonical files (ensures 100% identical files between Preview and ZIP download)
      for (const file of canonical.files) {
        if (!file?.path) continue;
        zip.file(file.path, file.content || "");
      }

      // Add clean README
      zip.file(
        "README.md",
        `# ${project?.name || "Website"}\n\nGenerated with ${BRAND.name} Static Website Builder.\n\n## How to Open\nDouble-click \`index.html\` to open your website in any browser (Chrome, Safari, Edge, Firefox).\nAll relative page links, styles, and stock photos in /images are self-contained with zero build step required.\n`
      );

      // Collect photos to bundle into /images
      const photosToFetch: Array<{
        remoteUrl: string;
        localPath: string;
        localWebpPath: string;
        slot: string;
      }> = [];

      const seenPaths = new Set<string>();

      if (project?.photos && project.photos.length > 0) {
        for (const p of project.photos) {
          const url = p.downloadUrl || p.url;
          if (url && (url.startsWith("http://") || url.startsWith("https://")) && !seenPaths.has(p.localPath)) {
            seenPaths.add(p.localPath);
            photosToFetch.push({
              remoteUrl: url,
              localPath: p.localPath,
              localWebpPath: p.localWebpPath || p.localPath.replace(/\.jpg$/, ".webp"),
              slot: p.slot || "service",
            });
          }
        }
      } else {
        // Parse from HTML files if project.photos not present
        for (const file of currentFiles || []) {
          if (!file?.path || !file.path.endsWith(".html")) continue;
          const content = file.content || "";

          const imgRegex = /<img[^>]*?src=["'](images\/[^"']+)["'][^>]*?data-remote-src=["']([^"']+)["'][^>]*?>/gi;
          let match;
          while ((match = imgRegex.exec(content)) !== null) {
            const localPath = match[1];
            const remoteUrl = match[2];
            if (remoteUrl && (remoteUrl.startsWith("http://") || remoteUrl.startsWith("https://"))) {
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
          }

          const bgRegex = /style=["']background-image:\s*url\(['"](images\/[^'"]+)['"]\);["'][^>]*?data-bg-remote=["']([^"']+)["']/gi;
          let bgMatch;
          while ((bgMatch = bgRegex.exec(content)) !== null) {
            const localPath = bgMatch[1];
            const remoteUrl = bgMatch[2];
            if (remoteUrl && (remoteUrl.startsWith("http://") || remoteUrl.startsWith("https://"))) {
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
      }

      // Download and optimize photos via local server proxy (avoids CORS)
      let photoCount = 0;
      for (const item of photosToFetch) {
        photoCount++;
        setZippingStatus(`Packaging photo ${photoCount} of ${photosToFetch.length}…`);
        try {
          const proxyUrl = `/api/images/proxy?url=${encodeURIComponent(item.remoteUrl)}`;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);
          const response = await fetch(proxyUrl, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (response.ok) {
            const blob = await response.blob();
            const isHero = item.slot === "hero" || item.localPath.includes("hero");
            const isAvatar = item.slot === "avatar";
            const maxWidth = isHero ? 1920 : isAvatar ? 200 : 800;

            try {
              const processed = await processImageWithCanvas(blob, maxWidth);
              zip.file(item.localPath, processed.jpgBlob);
              zip.file(item.localWebpPath, processed.webpBlob);
            } catch {
              // Fallback to raw blob directly if canvas operation fails
              zip.file(item.localPath, blob);
            }
          }
        } catch (imgErr) {
          console.warn(`[ZIP Export] Non-critical image failed to bundle (${item.localPath}), omitting:`, imgErr);
          // Gracefully omit non-critical missing images without halting ZIP package creation
        }
      }

      setZippingStatus("Compressing ZIP package…");
      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      const blobUrl = URL.createObjectURL(zipBlob);
      const tempLink = document.createElement("a");
      tempLink.href = blobUrl;

      // Clean business name for the filename
      const cleanName =
        (project?.name || "website")
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
    } catch (err: any) {
      console.warn("[ZIP Export] Client-side packaging failed, attempting server streaming fallback:", err);
      setZippingStatus("Streaming ZIP from server…");

      try {
        const res = await fetch("/api/projects/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: project?.name,
            files: currentFiles,
            photos: project?.photos,
          }),
        });

        if (res.ok) {
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          const tempLink = document.createElement("a");
          tempLink.href = blobUrl;
          const cleanName =
            (project?.name || "website")
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "-")
              .replace(/-+/g, "-")
              .replace(/^-|-$/g, "") || "website";
          tempLink.download = `${cleanName}.zip`;
          document.body.appendChild(tempLink);
          tempLink.click();
          document.body.removeChild(tempLink);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
          setDownloadSuccess(true);
          setTimeout(() => setDownloadSuccess(false), 3000);
          return;
        } else {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error || `Server responded with status ${res.status}`);
        }
      } catch (fallbackErr: any) {
        console.error("[ZIP Export] Server fallback also failed:", fallbackErr);
        alert(`Failed to create ZIP download: ${err?.message || fallbackErr?.message || "Unknown error"}. Please check browser console.`);
      }
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
          {!isSaved && onSaveForFuture && (
            <button
              type="button"
              onClick={onSaveForFuture}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-[10px] border border-emerald-500/50 bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold text-emerald-800 transition shadow-sm"
              title="Save this website to your dashboard for future SEO & content optimization"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Save for Future</span>
            </button>
          )}
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
          {/* Working Phone / Click-to-Call Feedback Banner */}
          {telClickedNotice && (
            <div className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-[12px] flex items-center justify-between shadow-md animate-in fade-in slide-in-from-top duration-200">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
                <span>{telClickedNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setTelClickedNotice(null)}
                className="text-white hover:bg-emerald-700 px-2 py-0.5 rounded text-[11px] font-bold transition ml-3"
              >
                Dismiss
              </button>
            </div>
          )}

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

              {/* Sitemap.xml quick preview tab */}
              {hasSitemap && (
                <button
                  type="button"
                  onClick={() => setActivePage("sitemap.xml")}
                  className={`px-2.5 py-1 rounded-[8px] text-xs font-medium transition shrink-0 ${
                    activePage.toLowerCase() === "sitemap.xml"
                      ? "bg-sky-600 text-white font-semibold shadow-sm"
                      : "bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200"
                  }`}
                  title="Inspect canonical sitemap.xml generated with project"
                >
                  sitemap.xml
                </button>
              )}

              {/* Robots.txt quick preview tab */}
              {hasRobots && (
                <button
                  type="button"
                  onClick={() => setActivePage("robots.txt")}
                  className={`px-2.5 py-1 rounded-[8px] text-xs font-medium transition shrink-0 ${
                    activePage.toLowerCase() === "robots.txt"
                      ? "bg-slate-700 text-white font-semibold shadow-sm"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                  title="Inspect canonical robots.txt generated with project"
                >
                  robots.txt
                </button>
              )}

              {/* Schema Inspector Tab */}
              <button
                type="button"
                onClick={() => setShowSchemaModal(true)}
                className="px-2.5 py-1 rounded-[8px] text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition shrink-0 flex items-center gap-1"
                title="Inspect Schema.org JSON-LD structured data on this page"
              >
                <span>Schema</span>
                <span className="bg-emerald-200 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {currentSchemas.length}
                </span>
              </button>
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
                    sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
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
                    sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
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
                    sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
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
            onImproveAction={handleImproveAction}
            isImproving={isImproving}
            improvingStep={improvingStep}
            activeAction={activeAction}
            hasOriginalVersion={Boolean(originalFiles)}
            activeVersion={activeVersion}
            onToggleVersion={handleToggleVersion}
            recentChanges={recentChanges}
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

              {/* Validate Website Package Button */}
              <button
                type="button"
                onClick={handleRunValidation}
                disabled={isValidating}
                className="w-full inline-flex items-center justify-center space-x-2 py-2 px-3 rounded-[10px] border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  {validationResult
                    ? `Validated: ${validationResult.passedChecks}/${validationResult.totalChecks} Checks Passed`
                    : "Validate Improved Website (18 Checks)"}
                </span>
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

      {/* Validation Checklist Modal */}
      {showValidationModal && validationResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${validationResult.valid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Website Package Integrity Validation</h3>
                  <p className="text-xs text-slate-500">
                    {validationResult.passedChecks} of {validationResult.totalChecks} automated verification checks passed ({validationResult.score}% integrity score)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowValidationModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-2.5 flex-1 text-xs">
              {validationResult.checks.map((check) => (
                <div
                  key={check.id}
                  className={`p-3 rounded-xl border flex items-start space-x-3 ${
                    check.passed ? "bg-emerald-50/40 border-emerald-200 text-slate-800" : "bg-red-50/50 border-red-200 text-red-900"
                  }`}
                >
                  <span className={`shrink-0 mt-0.5 font-bold ${check.passed ? "text-emerald-600" : "text-red-600"}`}>
                    {check.passed ? "✓" : "✕"}
                  </span>
                  <div>
                    <div className="font-bold">{check.name}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{check.message}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {validationResult.fileStats.totalFiles} files verified in preview set
              </span>
              <button
                type="button"
                onClick={() => setShowValidationModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition"
              >
                Close Validation Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schema.org Structured Data Inspector Modal */}
      {showSchemaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-100 text-emerald-700">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Schema.org Structured Data Inspector</h3>
                  <p className="text-xs text-slate-500">
                    Inspecting {currentSchemas.length} JSON-LD schema markup blocks on <strong className="text-slate-800">{activePage}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSchemaModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              {currentSchemas.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="font-semibold text-slate-700">No JSON-LD schema detected on this page.</p>
                  <p className="text-[11px] mt-1 text-slate-500">Local business schema is typically embedded on index.html, contact.html, and service pages.</p>
                </div>
              ) : (
                currentSchemas.map((schema, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-800">
                        Schema #{idx + 1}: <code className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{schema["@type"] || "Thing"}</code>
                      </span>
                      <span className="text-slate-500 font-mono text-[10px]">application/ld+json</span>
                    </div>
                    <pre className="p-3 bg-slate-900 text-slate-100 overflow-x-auto text-[11px] font-mono leading-relaxed max-h-60">
                      {JSON.stringify(schema, null, 2)}
                    </pre>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Google Rich Snippets Compliant
              </span>
              <button
                type="button"
                onClick={() => setShowSchemaModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
