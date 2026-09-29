"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { SavedProject, URLRedirect, ProjectChangeLogEntry, ProjectVersion } from "../lib/storage/project-types";
import { saveProjectToDB, exportProjectBackup, generateWebsiteZIP } from "../lib/storage/db";
import {
  ensureProjectVersions,
  createProjectVersionSnapshot,
  switchProjectVersion,
  getOriginalVersion,
  getCurrentVersion,
} from "../lib/storage/project-versions";
import { KeywordMapModal, KeywordMapEntry } from "./KeywordMapModal";
import { FindReplaceModal } from "./FindReplaceModal";
import { SearchConsoleHub } from "./SearchConsoleHub";
import { AddNewPageModal, AddNewPageInitialData } from "./AddNewPageModal";
import { auditPageSEO } from "../lib/seo/on-page-scorer";
import { Theme, THEMES, getThemeById } from "../lib/themes";
import { ThemeMiniPreview } from "./ThemeMiniPreview";
import { ThemePreviewModal } from "./ThemePreviewModal";
import { parseKeywordList, formatKeywordsForStorage } from "../lib/keywords/keyword-parser";
import { MonthlyOptimizationCycleModal } from "./MonthlyOptimizationCycleModal";
import { ErrorBoundary } from "./ErrorBoundary";
import { preparePreviewHtml } from "../lib/export/preview-renderer";
import {
  FolderKanban,
  FileText,
  Search,
  Image as ImageIcon,
  Settings,
  History,
  TrendingUp,
  Download,
  Plus,
  Trash2,
  Copy,
  ExternalLink,
  Smartphone,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  Save,
  Eye,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Layers,
  ArrowUpDown,
  Tag,
  ShieldCheck,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Key,
  Palette,
  Check,
  X,
  Network,
  UploadCloud,
} from "lucide-react";
import { PublishModal } from "./publishing/PublishModal";
import { InternalLinkingDashboard } from "./InternalLinkingDashboard";
import { useProjectPresence } from "@/lib/supabase/presence";
import { ConflictModal } from "./editor/ConflictModal";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { logActivity } from "@/lib/supabase/activity";
import { ActivityFeed } from "./activity/ActivityFeed";
import { RankRentManager } from "./rankrent/RankRentManager";
import { analyzeHtmlRecommendations, BuilderRecommendation } from "@/lib/recommendations/recommendation-engine";
import { applyRecommendationFix, applyAllRecommendations } from "@/lib/recommendations/fix-applier";
import { RecommendationFixPanel } from "./editor/RecommendationFixPanel";
import {
  sanitizeTitle,
  sanitizeMetaContent,
  sanitizeHeadline,
  sanitizeHtmlContent,
} from "@/lib/security/html-sanitizer";

interface WebsiteManagerProps {
  project: SavedProject;
  onBackToDashboard: () => void;
  onProjectUpdated: (updatedProject: SavedProject) => void;
}

export function WebsiteManager({
  project: initialProject,
  onBackToDashboard,
  onProjectUpdated,
}: WebsiteManagerProps) {
  const normalizeProject = useCallback((p: SavedProject): SavedProject => {
    const defaultTheme: Theme = THEMES[0] || {
      id: "modern-pro",
      name: "Modern Pro",
      fonts: { body: "Inter", heading: "Plus Jakarta Sans" },
      colors: {
        primary: "#1D4ED8",
        secondary: "#0F172A",
        accent: "#0EA5E9",
        background: "#F8FAFC",
        surface: "#FFFFFF",
        text: "#0F172A",
        muted: "#64748B",
      },
      heroStyle: "Split hero",
      buttonStyle: "Rounded 12px",
      borderRadius: "12px",
      sectionStyle: "Card-based",
      description: "Modern professional theme",
      designNotes: "Clean, trustworthy aesthetic",
    };

    const files = Array.isArray(p?.files) ? p.files : [];
    return {
      ...p,
      id: p?.id || "default-project-id",
      name: p?.name || "My Website",
      createdAt: p?.createdAt || Date.now(),
      lastEditedAt: p?.lastEditedAt || Date.now(),
      files,
      keywordMap: Array.isArray(p?.keywordMap) ? p.keywordMap : [],
      serviceAreaCities: Array.isArray(p?.serviceAreaCities) ? p.serviceAreaCities : [],
      customBlocks: Array.isArray(p?.customBlocks) ? p.customBlocks : [],
      changeLog: Array.isArray(p?.changeLog) ? p.changeLog : [],
      redirects: Array.isArray(p?.redirects) ? p.redirects : [],
      optimizationCycles: Array.isArray(p?.optimizationCycles) ? p.optimizationCycles : [],
      theme: p?.theme?.name ? p.theme : defaultTheme,
      businessDetails: p?.businessDetails || ({} as any),
      formData: p?.formData
        ? {
            ...p.formData,
            keywords: parseKeywordList(p.formData.keywords || p.formData.targetKeywords),
            targetKeywords: formatKeywordsForStorage(
              parseKeywordList(p.formData.targetKeywords || p.formData.keywords)
            ),
          }
        : {},
      pageContentMap: p?.pageContentMap || {},
      customContentInstructions: p?.customContentInstructions || p?.formData?.customContentInstructions || "",
      rankRentConfig: p?.rankRentConfig || undefined,
    };
  }, []);

  const [project, setProject] = useState<SavedProject>(() => normalizeProject(initialProject));

  useEffect(() => {
    if (initialProject) {
      setProject(normalizeProject(initialProject));
    }
  }, [initialProject, normalizeProject]);

  const [activeTab, setActiveTab] = useState<
    "pages" | "business-details" | "keywords" | "images" | "settings" | "history" | "search-console" | "cycles" | "rank-rent" | "internal-linking"
  >("pages");

  // Modals
  const [isKeywordModalOpen, setIsKeywordModalOpen] = useState(false);
  const [isFindReplaceModalOpen, setIsFindReplaceModalOpen] = useState(false);
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [isAddNewPageModalOpen, setIsAddNewPageModalOpen] = useState(false);
  const [newPageInitialData, setNewPageInitialData] = useState<AddNewPageInitialData | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  // Settings & Custom Content Instructions
  const [settingsInstructions, setSettingsInstructions] = useState<string>(
    () => initialProject?.customContentInstructions || initialProject?.formData?.customContentInstructions || ""
  );
  const [settingsSavedToast, setSettingsSavedToast] = useState<string | null>(null);
  const [managerError, setManagerError] = useState<string | null>(null);

  const showManagerError = (msg: string) => {
    setManagerError(msg);
    setTimeout(() => setManagerError(null), 6000);
  };

  useEffect(() => {
    if (project) {
      setSettingsInstructions(project.customContentInstructions || project.formData?.customContentInstructions || "");
    }
  }, [project]);

  const handleSaveCustomInstructions = async () => {
    const updatedProject: SavedProject = {
      ...project,
      customContentInstructions: settingsInstructions.trim(),
      lastEditedAt: Date.now(),
    };
    setProject(updatedProject);
    onProjectUpdated(updatedProject);
    await saveProjectToDB(updatedProject);
    setSettingsSavedToast("Custom Content Instructions saved successfully!");
    setTimeout(() => setSettingsSavedToast(null), 3000);
  };

  const handleClearCustomInstructions = async () => {
    setSettingsInstructions("");
    const updatedProject: SavedProject = {
      ...project,
      customContentInstructions: "",
      lastEditedAt: Date.now(),
    };
    setProject(updatedProject);
    onProjectUpdated(updatedProject);
    await saveProjectToDB(updatedProject);
    setSettingsSavedToast("Custom Content Instructions reset to default.");
    setTimeout(() => setSettingsSavedToast(null), 3000);
  };

  // Selected Page in Pages Tab
  const [selectedPagePath, setSelectedPagePath] = useState<string>(() => {
    const files = Array.isArray(initialProject?.files) ? initialProject.files : [];
    const indexFile = files.find((f) => f && f.path === "index.html");
    if (indexFile) return "index.html";
    return files[0]?.path || "index.html";
  });
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "offline">("saved");
  const [pageOpenedAt, setPageOpenedAt] = useState<number>(Date.now());
  const [conflictData, setConflictData] = useState<{
    isOpen: boolean;
    changerName: string;
    changerUpdatedAt: string;
    remoteContent: any;
  } | null>(null);

  // Supabase Realtime Presence
  const { activeUsers, concurrentEditors } = useProjectPresence(
    project.id,
    selectedPagePath,
    true
  );

  // Page Editor Field State for Selected Page
  const currentPageFile = useMemo(() => {
    const files = project.files || [];
    return (
      files.find((f) => f && f.path === selectedPagePath) ||
      files.find((f) => f && f.path.endsWith(".html")) ||
      files[0] || {
        path: "index.html",
        content: "<!DOCTYPE html><html><head><title>Home</title></head><body><h1>Welcome</h1></body></html>",
      }
    );
  }, [project.files, selectedPagePath]);

  const [pageTitle, setPageTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [pageH1, setPageH1] = useState("");
  const [activeHtmlContent, setActiveHtmlContent] = useState("");

  // Theme Switching & Preview State
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [themePreviewTarget, setThemePreviewTarget] = useState<Theme | null>(null);
  const [isThemePreviewOpen, setIsThemePreviewOpen] = useState(false);
  const [isSwitchingTheme, setIsSwitchingTheme] = useState(false);

  const handleSwitchTheme = async (newThemeId: string) => {
    setIsSwitchingTheme(true);
    try {
      const res = await fetch("/api/themes/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project,
          newThemeId,
        }),
      });
      const data = await res.json();
      if (data.success && data.project) {
        setProject(data.project);
        onProjectUpdated(data.project);
        await saveProjectToDB(data.project);
        setIsThemeModalOpen(false);
      } else {
        showManagerError("Could not switch theme: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      showManagerError("Error switching theme: " + (err?.message || "Network error"));
    } finally {
      setIsSwitchingTheme(false);
    }
  };

  const isDirtyRef = React.useRef(false);
  const isSavingRef = React.useRef(false);
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Sync state when page changes
  useEffect(() => {
    if (currentPageFile) {
      isDirtyRef.current = false;
      setActiveHtmlContent(currentPageFile.content);

      const titleMatch = currentPageFile.content.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      setPageTitle(titleMatch ? titleMatch[1].trim() : "");

      const metaMatch = currentPageFile.content.match(
        /<meta[^>]*?name=["']description["'][^>]*?content=["']([^"']*)["']/i
      );
      setMetaDescription(metaMatch ? metaMatch[1].trim() : "");

      const h1Match = currentPageFile.content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      setPageH1(h1Match ? h1Match[1].replace(/<[^>]+>/g, "").trim() : "");
    }
  }, [currentPageFile, selectedPagePath]);

  // Debounced auto-save (800ms) with isSavingRef lock to avoid race conditions
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (isDirtyRef.current) {
      setSaveStatus("saving");
      saveTimeoutRef.current = setTimeout(async () => {
        if (isSavingRef.current) return;
        isSavingRef.current = true;
        try {
          await executeSave();
          isDirtyRef.current = false;
        } catch (err) {
          console.error("Auto-save failed:", err);
        } finally {
          isSavingRef.current = false;
        }
      }, 800);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageTitle, metaDescription, pageH1]);

  const handleSelectPage = async (newPath: string) => {
    if (newPath === selectedPagePath) return;

    if (isDirtyRef.current) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      if (!isSavingRef.current) {
        isSavingRef.current = true;
        try {
          await executeSave();
        } catch (err) {
          console.error("Flush save on page switch failed:", err);
        } finally {
          isSavingRef.current = false;
          isDirtyRef.current = false;
        }
      }
    }

    setSelectedPagePath(newPath);
  };

  // Current page primary keyword & SEO audit
  const currentKeywordEntry = useMemo(() => {
    return (
      project.keywordMap.find((k) => k.pagePath === selectedPagePath) || {
        pagePath: selectedPagePath,
        primaryKeyword: `${project.formData?.businessType || "Service"} in ${project.formData?.city || "Local"}`,
        secondaryKeywords: [],
      }
    );
  }, [project.keywordMap, selectedPagePath, project.formData]);

  const currentSeoAudit = useMemo(() => {
    if (!currentPageFile) return null;
    return auditPageSEO(
      activeHtmlContent || currentPageFile.content,
      selectedPagePath,
      currentKeywordEntry.primaryKeyword,
      currentKeywordEntry.secondaryKeywords
    );
  }, [currentPageFile, activeHtmlContent, selectedPagePath, currentKeywordEntry]);

  // Real-time recommendation engine suggestions
  const currentRecommendations = useMemo(() => {
    const html = activeHtmlContent || currentPageFile?.content || "";
    if (!html) return [];
    return analyzeHtmlRecommendations(html, {
      pagePath: selectedPagePath,
      primaryKeyword: currentKeywordEntry.primaryKeyword,
      businessName: project.formData?.businessName || project.name,
      city: project.formData?.city,
      trade: project.formData?.businessType,
    });
  }, [
    activeHtmlContent,
    currentPageFile,
    selectedPagePath,
    currentKeywordEntry,
    project.formData,
    project.name,
  ]);

  const handleApplyFix = (rec: BuilderRecommendation) => {
    const currentHtml = activeHtmlContent || currentPageFile?.content || "";
    const result = applyRecommendationFix(currentHtml, rec);
    if (result.success) {
      setActiveHtmlContent(result.updatedHtml);

      // Sync field state
      const titleMatch = result.updatedHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (titleMatch) setPageTitle(titleMatch[1].trim());

      const metaMatch = result.updatedHtml.match(
        /<meta[^>]*?name=["']description["'][^>]*?content=["']([^"']*)["']/i
      );
      if (metaMatch) setMetaDescription(metaMatch[1].trim());

      const h1Match = result.updatedHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      if (h1Match) setPageH1(h1Match[1].replace(/<[^>]+>/g, "").trim());

      // Update in project files
      const updatedFiles = project.files.map((f) =>
        f.path === selectedPagePath
          ? { ...f, content: result.updatedHtml, lastModified: Date.now() }
          : f
      );
      const updatedProject: SavedProject = {
        ...project,
        files: updatedFiles,
        lastEditedAt: Date.now(),
      };
      setProject(updatedProject);
      onProjectUpdated(updatedProject);
      saveProjectToDB(updatedProject).catch(console.error);
    }
  };

  const handleApplyAllFixes = (recs: BuilderRecommendation[]) => {
    const currentHtml = activeHtmlContent || currentPageFile?.content || "";
    const result = applyAllRecommendations(currentHtml, recs);
    if (result.appliedCount > 0) {
      setActiveHtmlContent(result.updatedHtml);

      const titleMatch = result.updatedHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (titleMatch) setPageTitle(titleMatch[1].trim());

      const metaMatch = result.updatedHtml.match(
        /<meta[^>]*?name=["']description["'][^>]*?content=["']([^"']*)["']/i
      );
      if (metaMatch) setMetaDescription(metaMatch[1].trim());

      const h1Match = result.updatedHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      if (h1Match) setPageH1(h1Match[1].replace(/<[^>]+>/g, "").trim());

      const updatedFiles = project.files.map((f) =>
        f.path === selectedPagePath
          ? { ...f, content: result.updatedHtml, lastModified: Date.now() }
          : f
      );
      const updatedProject: SavedProject = {
        ...project,
        files: updatedFiles,
        lastEditedAt: Date.now(),
      };
      setProject(updatedProject);
      onProjectUpdated(updatedProject);
      saveProjectToDB(updatedProject).catch(console.error);
    }
  };

  // Save Page Edits with conflict check
  const handleSavePageEdits = async () => {
    setIsSaving(true);
    setSaveStatus("saving");

    // Check remote conflict in Supabase
    try {
      const supabase = getSupabaseBrowserClient();
      const slug = selectedPagePath.replace(/\.html$/, "");
      const { data: remotePage } = await supabase
        .from("pages")
        .select("title, seo, content, updated_at, updated_by")
        .eq("project_id", project.id)
        .eq("slug", slug)
        .single();

      if (remotePage && remotePage.updated_at) {
        const remoteTime = new Date(remotePage.updated_at).getTime();
        if (remoteTime > pageOpenedAt + 1500) {
          // Conflict detected!
          let changerName = "Another team member";
          if (remotePage.updated_by) {
            const { data: changerProfile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", remotePage.updated_by)
              .single();
            if (changerProfile?.full_name) changerName = changerProfile.full_name;
          }

          setConflictData({
            isOpen: true,
            changerName,
            changerUpdatedAt: remotePage.updated_at,
            remoteContent: remotePage,
          });
          setIsSaving(false);
          setSaveStatus("saved");
          return;
        }
      }
    } catch (checkErr) {
      console.warn("Conflict check bypassed:", checkErr);
    }

    await executeSave();
  };

  const executeSave = async () => {
    let updatedHtml = activeHtmlContent;

    const cleanTitle = sanitizeTitle(pageTitle);
    const cleanMeta = sanitizeMetaContent(metaDescription);
    const cleanH1 = sanitizeHeadline(pageH1);

    // Update <title>
    if (cleanTitle) {
      updatedHtml = updatedHtml.replace(
        /<title[^>]*>[\s\S]*?<\/title>/i,
        `<title>${cleanTitle}</title>`
      );
    }

    // Update meta description
    if (cleanMeta) {
      updatedHtml = updatedHtml.replace(
        /<meta[^>]*?name=["']description["'][^>]*?content=["'][^"']*["']/i,
        `<meta name="description" content="${cleanMeta}">`
      );
    }

    // Update H1
    if (cleanH1) {
      updatedHtml = updatedHtml.replace(
        /<h1([^>]*)>[\s\S]*?<\/h1>/i,
        `<h1$1>${cleanH1}</h1>`
      );
    }

    // Sanitize HTML to prevent XSS attacks while retaining custom HTML/CSS capability
    updatedHtml = sanitizeHtmlContent(updatedHtml);

    const updatedFiles = project.files.map((f) =>
      f.path === selectedPagePath
        ? { ...f, content: updatedHtml, lastModified: Date.now() }
        : f
    );

    const logEntry: ProjectChangeLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
      dateStr: new Date().toLocaleString(),
      summary: `Edited page metadata & sections on ${selectedPagePath}`,
      affectedPages: [selectedPagePath],
    };

    const updatedProject: SavedProject = {
      ...project,
      files: updatedFiles,
      lastEditedAt: Date.now(),
      changeLog: [logEntry, ...(project.changeLog || [])],
    };

    try {
      await saveProjectToDB(updatedProject);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("offline");
    }

    isDirtyRef.current = false;
    setProject(updatedProject);
    onProjectUpdated(updatedProject);
    setPageOpenedAt(Date.now());
    setIsSaving(false);

    // Log to Supabase Activity Log
    await logActivity({
      projectId: project.id,
      action: "edit",
      entityType: "page",
      entityId: selectedPagePath,
      details: {
        description: `Updated title and sections on /${selectedPagePath}`,
        pageSlug: selectedPagePath.replace(/\.html$/, ""),
        projectName: project.name,
      },
    });
  };

  // Download ZIP
  const handleDownloadZip = async (mode: "full" | "changed-only" = "full") => {
    try {
      const { blob, validation } = await generateWebsiteZIP(
        project,
        mode,
        project.lastDownloadedAt
      );

      if (validation && !validation.valid && validation.errors.length > 0) {
        showManagerError(`Validation failed: ${validation.errors.join("; ")}`);
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeProjectName = (project?.name || "website").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      a.download = `${safeProjectName}-${
        mode === "changed-only" ? "changed-files" : "full-website"
      }.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Update lastDownloadedAt
      const updated = { ...project, lastDownloadedAt: Date.now() };
      await saveProjectToDB(updated);
      setProject(updated);
    } catch (err: any) {
      console.error("Failed to generate or download ZIP:", err);
      showManagerError(`Could not download ZIP: ${err?.message || "Unknown error"}. Please try again.`);
    }
  };

  // Group pages by category
  const groupedPages = useMemo(() => {
    const mainPages: string[] = [];
    const servicePages: string[] = [];
    const locationPages: string[] = [];
    const blogPages: string[] = [];

    (project.files || [])
      .filter((f) => f && f.path && f.path.endsWith(".html"))
      .forEach((f) => {
        if (f.path.startsWith("blog/")) {
          blogPages.push(f.path);
        } else if (f.path.split("-").length >= 3 && !f.path.includes("service-areas")) {
          locationPages.push(f.path);
        } else if (f.path.includes("service") || f.path.includes("repair")) {
          servicePages.push(f.path);
        } else {
          mainPages.push(f.path);
        }
      });

    return { mainPages, servicePages, locationPages, blogPages };
  }, [project.files]);

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden font-sans">
      {/* Non-blocking error banner (replaces browser alert() dialogs) */}
      {managerError && (
        <div className="shrink-0 px-4 py-2 bg-rose-600 text-white text-xs font-medium flex items-center justify-between z-50">
          <span>{managerError}</span>
          <button
            type="button"
            onClick={() => setManagerError(null)}
            className="ml-4 text-white/80 hover:text-white font-bold"
          >
            ✕
          </button>
        </div>
      )}
      {/* Top Header Bar */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 shadow-xs z-20">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
            title="Return to Projects Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-bold text-slate-900 truncate max-w-[240px]">
                {project.name}
              </h1>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Saved &amp; Synced
              </span>
              {project.versions && project.versions.length > 1 && (
                <div className="flex items-center space-x-1 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full text-xs">
                  <span className="text-[10px] font-bold text-indigo-700">
                    {project.versions.find((v) => v.id === project.currentVersionId)?.label || "Active Version"}
                  </span>
                  <select
                    value={project.currentVersionId || project.versions[project.versions.length - 1].id}
                    onChange={(e) => {
                      const switched = switchProjectVersion(project, e.target.value);
                      saveProjectToDB(switched);
                      setProject(switched);
                      onProjectUpdated(switched);
                    }}
                    className="text-[10px] bg-white border border-indigo-300 rounded px-1 py-0.5 font-semibold text-slate-700"
                  >
                    {project.versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label} ({v.dateStr})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <p className="text-[10px] text-slate-500 truncate">
              Domain: {project.businessDetails?.websiteDomain || "example.com"} •{" "}
              {project.files.filter((f) => f.path.endsWith(".html")).length} pages
            </p>
          </div>
        </div>

        {/* Teammates Presence Avatars */}
        {activeUsers.length > 0 && (
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-medium text-slate-600 hidden md:inline">
              {activeUsers.length} online
            </span>
            <div className="flex -space-x-1.5 ml-1">
              {activeUsers.slice(0, 4).map((u, i) => (
                <div
                  key={u.userId || i}
                  title={`${u.fullName || u.email || "Teammate"} ${u.isEditing ? "(editing " + u.currentPageSlug + ")" : ""}`}
                  className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[9px] flex items-center justify-center ring-2 ring-white uppercase shadow-xs"
                >
                  {(u.fullName || u.email || "U").charAt(0)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Global Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsCycleModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Optimize this month</span>
          </button>

          <button
            type="button"
            onClick={() => setIsKeywordModalOpen(true)}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keyword Map</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFindReplaceModalOpen(true)}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Find &amp; Replace</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPublishModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold transition shadow-xs"
            title="Publish website directly to Cloudflare Pages edge hosting"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Publish</span>
          </button>

          <div className="relative group">
            <button
              type="button"
              onClick={() => handleDownloadZip("full")}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download ZIP</span>
            </button>
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 hidden group-hover:block z-30">
              <button
                type="button"
                onClick={() => handleDownloadZip("full")}
                className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 block"
              >
                Full Website ZIP
              </button>
              <button
                type="button"
                onClick={() => handleDownloadZip("changed-only")}
                className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 block"
              >
                Changed Files Only ZIP
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container: Sidebar + Editor + Live Preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Vertical Nav Tabs */}
        <aside className="w-48 bg-slate-900 text-slate-300 flex flex-col shrink-0 text-xs font-semibold">
          <div className="p-3 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Website Manager
          </div>
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            <button
              type="button"
              onClick={() => setActiveTab("pages")}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition ${
                activeTab === "pages"
                  ? "bg-indigo-600 text-white font-bold"
                  : "hover:bg-slate-800 text-slate-400"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Pages &amp; Sections</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("business-details")}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition ${
                activeTab === "business-details"
                  ? "bg-indigo-600 text-white font-bold"
                  : "hover:bg-slate-800 text-slate-400"
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Business Details</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("rank-rent")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
                activeTab === "rank-rent"
                  ? "bg-indigo-600 text-white font-bold"
                  : "hover:bg-slate-800 text-slate-400"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Key className="w-4 h-4 text-amber-400" />
                <span>Rank &amp; Rent</span>
              </div>
              {project.rankRentConfig?.status === "rented" ? (
                <span className="text-[9px] font-bold bg-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded-full">
                  Rented
                </span>
              ) : project.rankRentConfig?.status === "available" ? (
                <span className="text-[9px] font-bold bg-blue-500/30 text-blue-300 px-1.5 py-0.5 rounded-full">
                  Lease
                </span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("keywords")}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition ${
                activeTab === "keywords"
                  ? "bg-indigo-600 text-white font-bold"
                  : "hover:bg-slate-800 text-slate-400"
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Keywords</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("search-console")}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition ${
                activeTab === "search-console"
                  ? "bg-indigo-600 text-white font-bold"
                  : "hover:bg-slate-800 text-slate-400"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Search Console</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("cycles")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
                activeTab === "cycles"
                  ? "bg-indigo-600 text-white font-bold"
                  : "hover:bg-slate-800 text-slate-400"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <RefreshCw className="w-4 h-4" />
                <span>Cycles</span>
              </div>
              {(project.optimizationCycles?.length || 0) > 0 && (
                <span className="text-[10px] font-bold bg-indigo-500/40 text-indigo-200 px-1.5 py-0.5 rounded-full">
                  {project.optimizationCycles?.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("images")}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition ${
                activeTab === "images"
                  ? "bg-indigo-600 text-white font-bold"
                  : "hover:bg-slate-800 text-slate-400"
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Images</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("internal-linking")}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition ${
                activeTab === "internal-linking"
                  ? "bg-indigo-600 text-white font-bold"
                  : "hover:bg-slate-800 text-slate-400"
              }`}
            >
              <Network className="w-4 h-4" />
              <span>Internal Linking</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition ${
                activeTab === "settings"
                  ? "bg-indigo-600 text-white font-bold"
                  : "hover:bg-slate-800 text-slate-400"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings &amp; Theme</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition ${
                activeTab === "history"
                  ? "bg-indigo-600 text-white font-bold"
                  : "hover:bg-slate-800 text-slate-400"
              }`}
            >
              <History className="w-4 h-4" />
              <span>Change History</span>
            </button>
          </nav>
        </aside>

        {/* Center Main Work Area */}
        <main className="flex-1 flex overflow-hidden">
          {/* TAB 1: PAGES TAB */}
          {activeTab === "pages" && (
            <div className="flex-1 flex overflow-hidden">
              {/* Pages Column */}
              <div className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
                <div className="p-3 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800">Pages</span>
                    <span className="text-[10px] text-slate-500 font-mono ml-1.5">
                      ({project.files.filter((f) => f.path.endsWith(".html")).length})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewPageInitialData(null);
                      setIsAddNewPageModalOpen(true);
                    }}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition shadow-xs"
                    title="Add Dedicated Page to Website"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Page</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-4 text-xs">
                  {/* Main Pages */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1">
                      Main Pages
                    </span>
                    {groupedPages.mainPages.map((path) => (
                      <button
                        key={path}
                        type="button"
                        onClick={() => handleSelectPage(path)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition ${
                          selectedPagePath === path
                            ? "bg-indigo-50 text-indigo-700 font-bold"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="truncate">{path}</span>
                        <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                      </button>
                    ))}
                  </div>

                  {/* Services */}
                  {groupedPages.servicePages.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1">
                        Services
                      </span>
                      {groupedPages.servicePages.map((path) => (
                        <button
                          key={path}
                          type="button"
                          onClick={() => handleSelectPage(path)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition ${
                            selectedPagePath === path
                              ? "bg-indigo-50 text-indigo-700 font-bold"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span className="truncate">{path}</span>
                          <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Locations */}
                  {groupedPages.locationPages.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1">
                        Location Pages ({groupedPages.locationPages.length})
                      </span>
                      {groupedPages.locationPages.map((path) => (
                        <button
                          key={path}
                          type="button"
                          onClick={() => handleSelectPage(path)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition ${
                            selectedPagePath === path
                              ? "bg-indigo-50 text-indigo-700 font-bold"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span className="truncate">{path}</span>
                          <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Blog */}
                  {groupedPages.blogPages.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1">
                        Blog Articles ({groupedPages.blogPages.length})
                      </span>
                      {groupedPages.blogPages.map((path) => (
                        <button
                          key={path}
                          type="button"
                          onClick={() => handleSelectPage(path)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition ${
                            selectedPagePath === path
                              ? "bg-indigo-50 text-indigo-700 font-bold"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span className="truncate">{path}</span>
                          <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Form-Based Page Editor */}
              <div className="flex-1 flex flex-col bg-white overflow-hidden border-r border-slate-200">
                {/* Editor Header */}
                <div className="p-3 px-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      Editing: {selectedPagePath}
                    </span>
                    {saveStatus === "saving" && (
                      <span className="flex items-center space-x-1 text-[10px] text-indigo-600 font-medium">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Auto-saving…</span>
                      </span>
                    )}
                    {saveStatus === "saved" && !isDirtyRef.current && (
                      <span className="flex items-center space-x-1 text-[10px] text-emerald-600 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Saved</span>
                      </span>
                    )}
                    {currentSeoAudit && (
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          currentSeoAudit.totalScore >= 80
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        SEO {currentSeoAudit.totalScore}/100
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleSavePageEdits}
                    disabled={isSaving}
                    className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? "Saving…" : "Save Changes"}</span>
                  </button>
                </div>

                {/* Concurrent Editors Warning Banner */}
                {concurrentEditors.length > 0 && (
                  <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 flex items-center justify-between text-xs text-amber-900 shrink-0">
                    <div className="flex items-center space-x-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                      <span>
                        <strong>{concurrentEditors.map((u) => u.fullName || u.email).join(", ")}</strong> is currently editing this page.
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full font-semibold">
                      Simultaneous edit protection active
                    </span>
                  </div>
                )}

                {/* Editor Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                  {/* Google Search Result Preview */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Google Search Result Snippet Preview
                    </span>
                    <div className="text-xs text-slate-800 font-mono truncate">
                      https://{project.businessDetails?.websiteDomain || "example.com"}/
                      {selectedPagePath === "index.html" ? "" : selectedPagePath}
                    </div>
                    <div className="text-base text-indigo-800 font-medium hover:underline cursor-pointer truncate">
                      {pageTitle || "Page Title"}
                    </div>
                    <div className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {metaDescription || "Meta description placeholder..."}
                    </div>
                  </div>

                  {/* SEO Metadata Form */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-bold text-slate-900">SEO Title Tag</label>
                        <span
                          className={`text-[10px] font-mono ${
                            pageTitle.length >= 30 && pageTitle.length <= 60
                              ? "text-emerald-600"
                              : "text-amber-600"
                          }`}
                        >
                          {pageTitle.length}/60 chars
                        </span>
                      </div>
                      <input
                        type="text"
                        value={pageTitle}
                        onChange={(e) => {
                          isDirtyRef.current = true;
                          setPageTitle(e.target.value);
                        }}
                        className="input-base text-xs bg-white"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-bold text-slate-900">
                          Meta Description
                        </label>
                        <span
                          className={`text-[10px] font-mono ${
                            metaDescription.length >= 120 && metaDescription.length <= 160
                              ? "text-emerald-600"
                              : "text-amber-600"
                          }`}
                        >
                          {metaDescription.length}/160 chars
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        value={metaDescription}
                        onChange={(e) => {
                          isDirtyRef.current = true;
                          setMetaDescription(e.target.value);
                        }}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1">
                        Main H1 Headline
                      </label>
                      <input
                        type="text"
                        value={pageH1}
                        onChange={(e) => {
                          isDirtyRef.current = true;
                          setPageH1(e.target.value);
                        }}
                        className="input-base text-xs bg-white"
                      />
                    </div>
                  </div>

                  {/* Real-time Recommendations & 1-Click Auto-Fix Engine */}
                  <RecommendationFixPanel
                    recommendations={currentRecommendations}
                    onApplyFix={handleApplyFix}
                    onApplyAll={() => handleApplyAllFixes(currentRecommendations)}
                  />

                  {/* Sections Overview */}
                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <span>Locked Design Template Sections</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Sections are assembled using the active theme (&quot;{project.theme?.name || "Modern Pro"}&quot;). Content stays fully responsive and compliant across mobile and desktop.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Live Preview Column */}
              <div className="w-[480px] bg-slate-100 flex flex-col shrink-0 border-l border-slate-200">
                <div className="h-10 bg-white border-b border-slate-200 px-3 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center space-x-1">
                    <Eye className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Live Responsive Preview</span>
                  </span>
                  <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("desktop")}
                      className={`p-1 rounded ${
                        previewDevice === "desktop" ? "bg-white shadow-2xs text-indigo-600" : "text-slate-500"
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("mobile")}
                      className={`p-1 rounded ${
                        previewDevice === "mobile" ? "bg-white shadow-2xs text-indigo-600" : "text-slate-500"
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 p-2 flex items-center justify-center overflow-hidden">
                  <div
                    className={`bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden transition-all duration-300 ${
                      previewDevice === "mobile" ? "w-[375px] h-[640px]" : "w-full h-full"
                    }`}
                  >
                    <ErrorBoundary fallbackTitle="Page Preview Encountered an Issue">
                      <iframe
                        title="Page Preview"
                        srcDoc={preparePreviewHtml({
                          pagePath: selectedPagePath,
                          files: (project.files || []).map((f) =>
                            f.path === selectedPagePath && activeHtmlContent ? { ...f, content: activeHtmlContent } : f
                          ),
                          photos: (project as any).photos || [],
                          businessDetails: {
                            name: project.name,
                            domain: (project as any).businessDetails?.websiteDomain || (project as any).websiteDomain,
                          },
                          viewport: previewDevice,
                        })}
                        className="w-full h-full border-0"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
                      />
                    </ErrorBoundary>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SEARCH CONSOLE TAB */}
          {activeTab === "search-console" && (
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      Guided Monthly Optimization Cycle
                    </h3>
                    <p className="text-[11px] text-slate-600">
                      7-step guided workflow: upload Search Console data, compare deltas vs last cycle, pick priority opportunities, optimize HTML, and export changed files.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCycleModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Optimize this month</span>
                </button>
              </div>

              <ErrorBoundary fallbackTitle="Search Console Hub Encountered an Issue">
                <SearchConsoleHub
                  files={project.files || []}
                  keywordMap={project.keywordMap || []}
                  serviceAreas={(project.serviceAreaCities || []).map((c: any) => typeof c === "string" ? c : c?.city || "").filter(Boolean)}
                  businessType={project.formData?.businessType || "Contractor"}
                  city={project.formData?.city || "Local"}
                  changeLog={project.changeLog}
                  customContentInstructions={project.customContentInstructions || project.formData?.customContentInstructions}
                  onRequestCreateDedicatedPage={(initData) => {
                    setNewPageInitialData(initData);
                    setIsAddNewPageModalOpen(true);
                  }}
                  onSelectExistingPage={(pagePath) => {
                    handleSelectPage(pagePath);
                    setActiveTab("pages");
                  }}
                  onApplyOptimization={(path, newHtml, logSummary) => {
                    const updatedFiles = project.files.map((f) =>
                      f.path === path ? { ...f, content: newHtml, lastModified: Date.now() } : f
                    );
                    const updatedWithVersion = createProjectVersionSnapshot(project, {
                      source: "search_console",
                      summary: logSummary,
                      affectedPages: [path],
                      updatedFiles,
                    });
                    saveProjectToDB(updatedWithVersion);
                    setProject(updatedWithVersion);
                    onProjectUpdated(updatedWithVersion);
                  }}
                />
              </ErrorBoundary>
            </div>
          )}

          {/* TAB 3: KEYWORDS TAB */}
          {activeTab === "keywords" && (
            <div className="flex-1 p-6">
              <ErrorBoundary fallbackTitle="Keyword Map Encountered an Issue">
                <KeywordMapModal
                  isOpen={true}
                  onClose={() => setActiveTab("pages")}
                  files={project.files}
                  businessType={project.formData?.businessType || "Contractor"}
                  city={project.formData?.city || "Local"}
                  state={project.formData?.stateRegion || "TX"}
                  services={project.formData?.services || []}
                  keywordMap={project.keywordMap}
                  onUpdateKeywordMap={(updated) => {
                    const up = { ...project, keywordMap: updated };
                    saveProjectToDB(up);
                    setProject(up);
                    onProjectUpdated(up);
                  }}
                  onApplyOptimizedHtml={(path, newHtml) => {
                    const updatedFiles = project.files.map((f) =>
                      f.path === path ? { ...f, content: newHtml, lastModified: Date.now() } : f
                    );
                    const up = { ...project, files: updatedFiles, lastEditedAt: Date.now() };
                    saveProjectToDB(up);
                    setProject(up);
                    onProjectUpdated(up);
                  }}
                />
              </ErrorBoundary>
            </div>
          )}

          {/* TAB 4: CHANGE HISTORY */}
          {activeTab === "history" && (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <h2 className="text-base font-bold text-slate-900">Project Change History</h2>
              <div className="space-y-2">
                {project.changeLog && project.changeLog.length > 0 ? (
                  project.changeLog.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{log.summary}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{log.dateStr}</span>
                      </div>
                      {log.affectedPages && log.affectedPages.length > 0 && (
                        <div className="text-[10px] text-slate-500 font-mono">
                          Pages: {log.affectedPages.join(", ")}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">No historical changes logged yet.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: OPTIMIZATION CYCLES */}
          {activeTab === "cycles" && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4 text-indigo-600" />
                    <span>Monthly Optimization Cycles</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Search Console cycle history, rankings progress, and month-over-month performance benchmarks.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCycleModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Optimize this month</span>
                </button>
              </div>

              {!project.optimizationCycles || project.optimizationCycles.length === 0 ? (
                <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-8 space-y-4 shadow-xs max-w-lg mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900">
                      No Optimization Cycles Yet
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Upload your first monthly Google Search Console performance export to establish your baseline rankings, uncover striking-distance keywords, and optimize pages.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCycleModalOpen(true)}
                    className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Run Your First Cycle</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {[...(project.optimizationCycles || [])]
                    .sort((a, b) => (b?.timestamp || 0) - (a?.timestamp || 0))
                    .map((cycle, idx, allCycles) => {
                      const prevCycle = allCycles[idx + 1] || null;
                      const metrics = cycle?.siteMetrics || { clicks: 0, impressions: 0, position: 0, ctr: 0 };
                      const prevMetrics = prevCycle?.siteMetrics || null;

                      const clicksDiff = prevMetrics
                        ? (metrics.clicks || 0) - (prevMetrics.clicks || 0)
                        : null;
                      const impDiff = prevMetrics
                        ? (metrics.impressions || 0) - (prevMetrics.impressions || 0)
                        : null;
                      const posDiff = prevMetrics
                        ? Number(((prevMetrics.position || 0) - (metrics.position || 0)).toFixed(1))
                        : null;
                      const ctrDiff = prevMetrics
                        ? Number((((metrics.ctr || 0) - (prevMetrics.ctr || 0)) * 100).toFixed(2))
                        : null;

                      return (
                        <div
                          key={cycle.id || `cycle-${idx}`}
                          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                            <div className="flex items-center space-x-2.5">
                              <span className="text-xs font-bold bg-indigo-600 text-white px-2.5 py-0.5 rounded-full">
                                Cycle #{cycle.cycleNumber || idx + 1}
                              </span>
                              <span className="text-xs font-bold text-slate-900">
                                {cycle.dateStr || "Recent"}
                              </span>
                              <span className="text-[11px] text-slate-500 font-mono">
                                ({cycle.dateRange || "Current"})
                              </span>
                            </div>

                            <span className="text-xs text-slate-500">
                              {(cycle.pagesChanged || []).length} pages optimized
                            </span>
                          </div>

                          {/* Metrics Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-0.5">
                              <span className="text-[10px] uppercase font-bold text-slate-400">
                                Clicks
                              </span>
                              <div className="text-base font-extrabold text-slate-900">
                                {(metrics.clicks || 0).toLocaleString()}
                              </div>
                              {clicksDiff !== null && (
                                <div
                                  className={`text-[10px] font-bold flex items-center ${
                                    clicksDiff >= 0 ? "text-emerald-600" : "text-red-600"
                                  }`}
                                >
                                  {clicksDiff >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                  <span>{clicksDiff >= 0 ? "+" : ""}{clicksDiff} vs prev</span>
                                </div>
                              )}
                            </div>

                            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-0.5">
                              <span className="text-[10px] uppercase font-bold text-slate-400">
                                Impressions
                              </span>
                              <div className="text-base font-extrabold text-slate-900">
                                {(metrics.impressions || 0).toLocaleString()}
                              </div>
                              {impDiff !== null && (
                                <div
                                  className={`text-[10px] font-bold flex items-center ${
                                    impDiff >= 0 ? "text-emerald-600" : "text-red-600"
                                  }`}
                                >
                                  {impDiff >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                  <span>{impDiff >= 0 ? "+" : ""}{impDiff.toLocaleString()} vs prev</span>
                                </div>
                              )}
                            </div>

                            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-0.5">
                              <span className="text-[10px] uppercase font-bold text-slate-400">
                                Avg Position
                              </span>
                              <div className="text-base font-extrabold text-slate-900">
                                {(metrics.position || 0).toFixed(1)}
                              </div>
                              {posDiff !== null && (
                                <div
                                  className={`text-[10px] font-bold flex items-center ${
                                    posDiff >= 0 ? "text-emerald-600" : "text-amber-600"
                                  }`}
                                >
                                  {posDiff >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                  <span>{posDiff >= 0 ? "+" : ""}{posDiff} rank</span>
                                </div>
                              )}
                            </div>

                            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-0.5">
                              <span className="text-[10px] uppercase font-bold text-slate-400">
                                Organic CTR
                              </span>
                              <div className="text-base font-extrabold text-slate-900">
                                {((metrics.ctr || 0) * 100).toFixed(1)}%
                              </div>
                              {ctrDiff !== null && (
                                <div
                                  className={`text-[10px] font-bold flex items-center ${
                                    ctrDiff >= 0 ? "text-emerald-600" : "text-red-600"
                                  }`}
                                >
                                  {ctrDiff >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                  <span>{ctrDiff >= 0 ? "+" : ""}{ctrDiff}% vs prev</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Applied Optimizations Details */}
                          {cycle.appliedOptimizations && cycle.appliedOptimizations.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                              <h4 className="text-xs font-bold text-slate-800">
                                Applied Page Optimizations:
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {cycle.appliedOptimizations.map((opt, i) => (
                                  <div
                                    key={i}
                                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1"
                                  >
                                    <div className="flex items-center justify-between font-mono font-bold text-[11px] text-slate-900">
                                      <span>/{opt.pagePath}</span>
                                      {opt.seoScoreAfter && (
                                        <span className="text-emerald-600 font-bold">
                                          SEO: {opt.seoScoreBefore || 70} → {opt.seoScoreAfter}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-slate-600 leading-snug">
                                      {opt.summary}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {cycle.notes && (
                            <div className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl text-xs text-indigo-900">
                              <span className="font-bold">Cycle Notes:</span> {cycle.notes}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: SETTINGS & THEME TAB */}
          {activeTab === "settings" && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                    <Palette className="w-5 h-5 text-indigo-600" />
                    <span>Website &amp; Theme Settings</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manage your site&apos;s visual design theme, typography, color tokens, and conversion layout.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsThemeModalOpen(true)}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs"
                >
                  <Palette className="w-4 h-4" />
                  <span>Change Theme</span>
                </button>
              </div>

              {/* Current Active Theme Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Theme</span>
                      <span className="text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Active Theme</span>
                      </span>
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900">{project.theme?.name || "Modern Local Pro"}</h3>
                    <p className="text-xs text-slate-600 max-w-xl">{project.theme?.description}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsThemeModalOpen(true)}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Switch Design Theme</span>
                  </button>
                </div>

                {/* Theme Visual Preview Box */}
                <div className="max-w-md border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <ThemeMiniPreview theme={project.theme || THEMES[0]} colors={project.theme?.colors} />
                </div>

                {/* Theme Metadata: Fonts, Colors, Characteristics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Typography Pair</span>
                    <div className="font-bold text-slate-800">{project.theme?.fonts?.heading || "Plus Jakarta Sans"}</div>
                    <div className="text-slate-500 font-mono text-[11px]">+ {project.theme?.fonts?.body || "Inter"}</div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Color Palette</span>
                    <div className="flex items-center space-x-2 pt-1">
                      <span className="w-5 h-5 rounded-full border border-black/10 shadow-2xs" style={{ backgroundColor: project.theme?.colors?.primary }} title="Primary" />
                      <span className="w-5 h-5 rounded-full border border-black/10 shadow-2xs" style={{ backgroundColor: project.theme?.colors?.secondary }} title="Secondary" />
                      <span className="w-5 h-5 rounded-full border border-black/10 shadow-2xs" style={{ backgroundColor: project.theme?.colors?.accent }} title="Accent" />
                      <span className="w-5 h-5 rounded-full border border-black/10 shadow-2xs" style={{ backgroundColor: project.theme?.colors?.background }} title="Background" />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Layout &amp; Radius</span>
                    <div className="font-bold text-slate-800">{project.theme?.heroStyle || "Split Hero"}</div>
                    <div className="text-slate-500 text-[11px]">Radius: {project.theme?.borderRadius || "12px"}</div>
                  </div>
                </div>

                {project.theme?.designCharacteristics && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-700 block mb-1.5">Design &amp; Layout Characteristics:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {project.theme.designCharacteristics.map((char, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium">
                          ✓ {char}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 8: RANK & RENT COMMAND CENTER */}
          {activeTab === "rank-rent" && (
            <div className="flex-1 overflow-y-auto bg-slate-50">
              <ErrorBoundary fallbackTitle="Rank & Rent Manager Encountered an Issue">
                <RankRentManager
                  project={project}
                  onProjectUpdated={(updated) => {
                    setProject(updated);
                    onProjectUpdated(updated);
                  }}
                  onShowToast={(msg) => {
                    // Instant alert / confirmation
                    console.log("[Rank & Rent]", msg);
                  }}
                />
              </ErrorBoundary>
            </div>
          )}

          {/* TAB 9: INTERNAL LINKING & CONNECTIVITY ENGINE */}
          {activeTab === "internal-linking" && (
            <InternalLinkingDashboard
              project={project}
              onProjectUpdated={(updated) => {
                setProject(updated);
                onProjectUpdated(updated);
              }}
              onSelectPage={(pagePath) => {
                setSelectedPagePath(pagePath);
                setActiveTab("pages");
              }}
            />
          )}
        </main>
      </div>

      {/* Theme Switching Modal */}
      {isThemeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-indigo-600" />
                  <span>Choose a New Theme</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select any of the 10 distinct layouts. All existing page content, SEO metadata, phone numbers, and location pages are preserved.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsThemeModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {isSwitchingTheme && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center space-x-3 text-indigo-900 text-xs font-semibold animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Re-rendering website sections and design tokens with selected theme…</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {THEMES.filter((t) => !t.isLegacy).map((theme) => {
                  const isCurrent = project.theme?.id === theme.id;
                  return (
                    <div
                      key={theme.id}
                      className={`border rounded-xl p-4 flex flex-col justify-between transition-all ${
                        isCurrent
                          ? "border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20"
                          : "border-slate-200 hover:border-slate-300 bg-white hover:shadow-xs"
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-slate-900">{theme.name}</h4>
                          {isCurrent && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Active
                            </span>
                          )}
                        </div>

                        <ThemeMiniPreview theme={theme} colors={theme.colors} />

                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{theme.description}</p>

                        {theme.designCharacteristics && (
                          <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
                            {theme.designCharacteristics.slice(0, 2).map((char, i) => (
                              <div key={i} className="flex items-center gap-1.5 truncate">
                                <span className="w-1 h-1 rounded-full bg-indigo-500" />
                                <span className="truncate">{char}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setThemePreviewTarget(theme);
                            setIsThemePreviewOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 text-xs font-semibold text-slate-700 hover:text-indigo-600 flex items-center gap-1 bg-white transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>

                        <button
                          type="button"
                          disabled={isCurrent || isSwitchingTheme}
                          onClick={() => handleSwitchTheme(theme.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                            isCurrent
                              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs"
                          }`}
                        >
                          {isCurrent ? (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>Current</span>
                            </>
                          ) : (
                            <span>Apply Theme</span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Theme Live Preview Modal */}
      <ThemePreviewModal
        theme={themePreviewTarget}
        isOpen={isThemePreviewOpen}
        onClose={() => {
          setIsThemePreviewOpen(false);
          setThemePreviewTarget(null);
        }}
        onSelectTheme={(themeId) => handleSwitchTheme(themeId)}
        isSelected={project.theme?.id === themePreviewTarget?.id}
        projectId={project.id}
      />

      {/* Monthly Optimization Cycle Modal */}
      {isCycleModalOpen && (
        <ErrorBoundary fallbackTitle="Optimization Cycle Modal Encountered an Issue">
          <MonthlyOptimizationCycleModal
            isOpen={true}
            onClose={() => setIsCycleModalOpen(false)}
            project={project}
            onCycleSaved={(updated) => {
              setProject(updated);
              onProjectUpdated(updated);
              setIsCycleModalOpen(false);
            }}
          />
        </ErrorBoundary>
      )}

      {/* Find & Replace Modal */}
      <ErrorBoundary fallbackTitle="Find & Replace Modal Encountered an Issue">
        <FindReplaceModal
          isOpen={isFindReplaceModalOpen}
          onClose={() => setIsFindReplaceModalOpen(false)}
          files={project.files}
          onUpdateFiles={(newFiles, summary) => {
            const log: ProjectChangeLogEntry = {
              id: `log-${Date.now()}`,
              timestamp: Date.now(),
              dateStr: new Date().toLocaleDateString(),
              summary,
              affectedPages: [],
            };
            const up = {
              ...project,
              files: newFiles,
              lastEditedAt: Date.now(),
              changeLog: [log, ...(project.changeLog || [])],
            };
            saveProjectToDB(up);
            setProject(up);
            onProjectUpdated(up);
          }}
          businessDetails={project.businessDetails}
          onUpdateBusinessDetails={(details) => {
            const up = { ...project, businessDetails: details };
            saveProjectToDB(up);
            setProject(up);
            onProjectUpdated(up);
          }}
          customBlocks={project.customBlocks || []}
          onUpdateCustomBlocks={(blocks) => {
            const up = { ...project, customBlocks: blocks };
            saveProjectToDB(up);
            setProject(up);
            onProjectUpdated(up);
          }}
          mustIncludeText={project.mustIncludeText || ""}
          onUpdateMustIncludeText={(text) => {
            const up = { ...project, mustIncludeText: text };
            saveProjectToDB(up);
            setProject(up);
            onProjectUpdated(up);
          }}
          canUndo={false}
          onUndo={() => {}}
        />
      </ErrorBoundary>

      {/* Conflict Modal */}
      {conflictData && (
        <ErrorBoundary fallbackTitle="Conflict Resolution Encountered an Issue">
          <ConflictModal
            isOpen={conflictData.isOpen}
            onClose={() => setConflictData(null)}
            pageTitle={pageTitle || selectedPagePath}
            changerName={conflictData.changerName}
            changerUpdatedAt={conflictData.changerUpdatedAt}
            localContent={{
              title: pageTitle,
              metaDescription,
              h1: pageH1,
            }}
            remoteContent={conflictData.remoteContent}
            onReloadRemote={() => {
              const r = conflictData.remoteContent;
              if (r?.content?.html) setActiveHtmlContent(r.content.html);
              if (r?.title) setPageTitle(r.title);
              if (r?.seo?.metaDescription) setMetaDescription(r.seo.metaDescription);
              if (r?.content?.h1) setPageH1(r.content.h1);
              setPageOpenedAt(Date.now());
              setConflictData(null);
            }}
            onOverwriteKeepMine={async () => {
              setConflictData(null);
              await executeSave();
            }}
          />
        </ErrorBoundary>
      )}

      {/* Add New Dedicated Page Modal */}
      <AddNewPageModal
        isOpen={isAddNewPageModalOpen}
        onClose={() => setIsAddNewPageModalOpen(false)}
        project={project}
        initialData={newPageInitialData}
        onPageCreated={(updatedProject, newPagePath) => {
          setProject(updatedProject);
          onProjectUpdated(updatedProject);
          handleSelectPage(newPagePath);
          setActiveTab("pages");
        }}
        onSelectExistingPage={(pagePath) => {
          handleSelectPage(pagePath);
          setActiveTab("pages");
        }}
      />

      {/* Cloudflare Direct Publishing Modal */}
      {isPublishModalOpen && (
        <PublishModal
          isOpen={isPublishModalOpen}
          onClose={() => setIsPublishModalOpen(false)}
          projectName={project.name}
          projectId={project.id}
          files={project.files}
          photos={project.formData?.photos || []}
          websiteDomain={project.businessDetails?.websiteDomain || project.formData?.websiteDomain}
        />
      )}
    </div>
  );
}
