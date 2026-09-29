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
import { HostingPublishingPanel } from "./publishing/HostingPublishingPanel";
import { LivePreview, ProjectData } from "./LivePreview";
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
    "overview" | "preview" | "publish" | "optimization" | "settings"
  >("overview");
  const [optimizationSubTab, setOptimizationSubTab] = useState<"audit" | "linking" | "cycles">("audit");
  const [settingsSubTab, setSettingsSubTab] = useState<"general" | "theme" | "versions" | "rank-rent" | "export">("general");

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
            onClick={() => setActiveTab("preview")}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Live Preview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("publish")}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200 hover:bg-orange-100 text-orange-700 text-xs font-bold transition shadow-xs cursor-pointer"
            title="Publish website to Cloudflare, Vercel, Netlify, or GitHub"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Publish</span>
          </button>

          <div className="relative group">
            <button
              type="button"
              onClick={() => handleDownloadZip("full")}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download ZIP</span>
            </button>
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 hidden group-hover:block z-30">
              <button
                type="button"
                onClick={() => handleDownloadZip("full")}
                className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 block cursor-pointer"
              >
                Full Website ZIP
              </button>
              <button
                type="button"
                onClick={() => handleDownloadZip("changed-only")}
                className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 block cursor-pointer"
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
        <aside className="w-52 bg-slate-900 text-slate-300 flex flex-col shrink-0 text-xs font-semibold">
          <div className="p-3.5 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between">
            <span>Workspace</span>
            <span className="text-[10px] text-emerald-400 font-mono">Synced</span>
          </div>
          <nav className="flex-1 p-2 space-y-1.5 overflow-y-auto">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                activeTab === "overview"
                  ? "bg-indigo-600 text-white font-bold shadow-xs"
                  : "hover:bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Overview &amp; Pages</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition cursor-pointer ${
                activeTab === "preview"
                  ? "bg-indigo-600 text-white font-bold shadow-xs"
                  : "hover:bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>Live Preview</span>
              </div>
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full">
                Interactive
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("publish")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition cursor-pointer ${
                activeTab === "publish"
                  ? "bg-indigo-600 text-white font-bold shadow-xs"
                  : "hover:bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <UploadCloud className="w-4 h-4 text-orange-400" />
                <span>Publish</span>
              </div>
              <span className="text-[10px] font-bold bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded-full">
                Hosting
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("optimization")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition cursor-pointer ${
                activeTab === "optimization"
                  ? "bg-indigo-600 text-white font-bold shadow-xs"
                  : "hover:bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Optimization &amp; SEO</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                activeTab === "settings"
                  ? "bg-indigo-600 text-white font-bold shadow-xs"
                  : "hover:bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings &amp; Theme</span>
            </button>
          </nav>
        </aside>

        {/* Center Main Work Area */}
        <main className="flex-1 flex overflow-hidden">
          {/* TAB 1: OVERVIEW TAB */}
          {activeTab === "overview" && (
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

          {/* TAB 2: LIVE PREVIEW TAB */}
          {activeTab === "preview" && (
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-100">
              <LivePreview
                project={{
                  projectId: project.id,
                  name: project.name,
                  notes: project.formData?.notes,
                  provider: "anthropic",
                  model: "claude-3-5-sonnet",
                  themeName: project.theme?.name || "Modern Pro",
                  websiteDomain:
                    project.businessDetails?.websiteDomain ||
                    project.formData?.websiteDomain ||
                    `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.com`,
                  files: project.files,
                  photos: (project as any).photos || [],
                  customContentInstructions: project.customContentInstructions,
                }}
                onNewWebsite={onBackToDashboard}
                onOpenManager={() => setActiveTab("overview")}
                isSaved={true}
                onUpdateProject={(updatedData) => {
                  const updated: SavedProject = {
                    ...project,
                    files: updatedData.files.map((f) => ({
                      path: f.path,
                      content: f.content,
                      mimeType: f.mimeType ?? undefined,
                    })),
                    lastEditedAt: Date.now(),
                  };
                  setProject(updated);
                  onProjectUpdated(updated);
                  saveProjectToDB(updated);
                }}
              />
            </div>
          )}

          {/* TAB 3: PUBLISH TAB */}
          {activeTab === "publish" && (
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                  <div className="border-b border-slate-100 pb-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5">
                          <UploadCloud className="w-6 h-6 text-indigo-600" />
                          <span>Publish &amp; Hosting Center</span>
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                          Deploy directly to Cloudflare Pages, Vercel, Netlify, or GitHub Pages. Zero complex setup.
                        </p>
                      </div>
                      {project.publishedUrl && (
                        <a
                          href={project.publishedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition"
                        >
                          <span>Live Site</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  <HostingPublishingPanel
                    projectName={project.name}
                    projectId={project.id}
                    files={project.files}
                    photos={(project as any).photos || []}
                    websiteDomain={project.businessDetails?.websiteDomain || project.formData?.websiteDomain}
                    onPublished={(res) => {
                      const updated = {
                        ...project,
                        publishedUrl: res.liveUrl,
                        hostingProvider: res.provider,
                        lastEditedAt: Date.now(),
                      };
                      setProject(updated);
                      onProjectUpdated(updated);
                      saveProjectToDB(updated);
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: OPTIMIZATION TAB */}
          {activeTab === "optimization" && (
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
              {/* Sub-navigation bar */}
              <div className="h-12 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => setOptimizationSubTab("audit")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      optimizationSubTab === "audit"
                        ? "bg-indigo-50 text-indigo-700 shadow-2xs"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Quality &amp; Auto-Fix
                  </button>
                  <button
                    type="button"
                    onClick={() => setOptimizationSubTab("linking")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      optimizationSubTab === "linking"
                        ? "bg-indigo-50 text-indigo-700 shadow-2xs"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Internal Linking Topology
                  </button>
                  <button
                    type="button"
                    onClick={() => setOptimizationSubTab("cycles")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      optimizationSubTab === "cycles"
                        ? "bg-indigo-50 text-indigo-700 shadow-2xs"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Search Console &amp; Cycles
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCycleModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Run Optimization Cycle</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {optimizationSubTab === "audit" && (
                  <div className="max-w-4xl mx-auto space-y-6">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                      <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>On-Page Quality &amp; Conversion Health</span>
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Inspecting active page: <span className="font-mono font-bold text-slate-700">{selectedPagePath}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={selectedPagePath}
                            onChange={(e) => handleSelectPage(e.target.value)}
                            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1 bg-white font-medium cursor-pointer"
                          >
                            {(project.files || [])
                              .filter((f) => f && f.path && f.path.endsWith(".html"))
                              .map((f) => (
                                <option key={f.path} value={f.path}>
                                  {f.path}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>

                      {(() => {
                        const auditContext = {
                          pagePath: selectedPagePath,
                          primaryKeyword: (project.formData?.keywords || [])[0] || (project.keywordMap || [])[0]?.primaryKeyword,
                          businessName: project.businessDetails?.businessName || project.formData?.businessName || project.name,
                          phone: project.businessDetails?.phone || project.formData?.phone,
                          city: project.businessDetails?.city || project.formData?.city,
                          trade: project.formData?.businessType || (project.businessDetails as any)?.businessType,
                        };
                        const recs = analyzeHtmlRecommendations(activeHtmlContent, auditContext);

                        return (
                          <RecommendationFixPanel
                            recommendations={recs}
                            onApplyFix={async (rec: BuilderRecommendation) => {
                              const fixRes = applyRecommendationFix(activeHtmlContent, rec);
                              const fixedHtml = fixRes.updatedHtml;
                              const updatedFiles = project.files.map((f) =>
                                f.path === selectedPagePath ? { ...f, content: fixedHtml, lastModified: Date.now() } : f
                              );
                              const updatedProject: SavedProject = {
                                ...project,
                                files: updatedFiles,
                                lastEditedAt: Date.now(),
                              };
                              setProject(updatedProject);
                              onProjectUpdated(updatedProject);
                              await saveProjectToDB(updatedProject);
                              setActiveHtmlContent(fixedHtml);
                            }}
                            onApplyAll={async () => {
                              const allRes = applyAllRecommendations(activeHtmlContent, recs);
                              const allFixedHtml = allRes.updatedHtml;
                              const updatedFiles = project.files.map((f) =>
                                f.path === selectedPagePath ? { ...f, content: allFixedHtml, lastModified: Date.now() } : f
                              );
                              const updatedProject: SavedProject = {
                                ...project,
                                files: updatedFiles,
                                lastEditedAt: Date.now(),
                              };
                              setProject(updatedProject);
                              onProjectUpdated(updatedProject);
                              await saveProjectToDB(updatedProject);
                              setActiveHtmlContent(allFixedHtml);
                            }}
                          />
                        );
                      })()}
                    </div>
                  </div>
                )}

                {optimizationSubTab === "linking" && (
                  <InternalLinkingDashboard
                    project={project}
                    onProjectUpdated={(updated) => {
                      setProject(updated);
                      onProjectUpdated(updated);
                    }}
                    onSelectPage={(pagePath) => {
                      setSelectedPagePath(pagePath);
                      setActiveTab("overview");
                    }}
                  />
                )}

                {optimizationSubTab === "cycles" && (
                  <div className="max-w-5xl mx-auto space-y-6">
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
                        setActiveTab("overview");
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
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: SETTINGS TAB */}
          {activeTab === "settings" && (
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
              <div className="h-12 bg-white border-b border-slate-200 px-6 flex items-center space-x-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setSettingsSubTab("general")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    settingsSubTab === "general"
                      ? "bg-indigo-50 text-indigo-700 shadow-2xs"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  General &amp; Prompt
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsSubTab("theme")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    settingsSubTab === "theme"
                      ? "bg-indigo-50 text-indigo-700 shadow-2xs"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Theme &amp; Colors
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsSubTab("versions")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    settingsSubTab === "versions"
                      ? "bg-indigo-50 text-indigo-700 shadow-2xs"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Version History
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsSubTab("rank-rent")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    settingsSubTab === "rank-rent"
                      ? "bg-indigo-50 text-indigo-700 shadow-2xs"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Rank &amp; Rent
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsSubTab("export")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    settingsSubTab === "export"
                      ? "bg-indigo-50 text-indigo-700 shadow-2xs"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Backup &amp; Export
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {settingsSubTab === "general" && (
                  <div className="max-w-3xl mx-auto space-y-6">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                      <h3 className="text-base font-bold text-slate-900">Custom Content Instructions</h3>
                      <p className="text-xs text-slate-500">
                        Prompt guidance injected into every page generation and monthly cycle for this specific client or brand.
                      </p>
                      <textarea
                        value={settingsInstructions}
                        onChange={(e) => setSettingsInstructions(e.target.value)}
                        rows={5}
                        placeholder="e.g. Always emphasize our 24/7 dispatch and 100% satisfaction guarantee. Mention we are family-owned since 2004."
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-indigo-500"
                      />
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={handleClearCustomInstructions}
                          className="text-xs text-slate-400 hover:text-red-500 cursor-pointer"
                        >
                          Reset to Defaults
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveCustomInstructions}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                        >
                          Save Instructions
                        </button>
                      </div>
                      {settingsSavedToast && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-medium">
                          {settingsSavedToast}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {settingsSubTab === "theme" && (
                  <div className="max-w-4xl mx-auto space-y-6">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">{project.theme?.name || "Modern Pro"}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{project.theme?.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsThemeModalOpen(true)}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer"
                        >
                          Switch Theme
                        </button>
                      </div>
                      <div className="max-w-md border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                        <ThemeMiniPreview theme={project.theme || THEMES[0]} colors={project.theme?.colors} />
                      </div>
                    </div>
                  </div>
                )}

                {settingsSubTab === "versions" && (
                  <div className="max-w-4xl mx-auto space-y-4">
                    <h3 className="text-base font-bold text-slate-900">Project Snapshots &amp; Changelog</h3>
                    <div className="space-y-2">
                      {project.changeLog && project.changeLog.length > 0 ? (
                        project.changeLog.map((log) => (
                          <div key={log.id} className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
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

                {settingsSubTab === "rank-rent" && (
                  <div className="max-w-5xl mx-auto">
                    <RankRentManager
                      project={project}
                      onProjectUpdated={(updated) => {
                        setProject(updated);
                        onProjectUpdated(updated);
                      }}
                      onShowToast={(msg) => console.log("[Rank & Rent]", msg)}
                    />
                  </div>
                )}

                {settingsSubTab === "export" && (
                  <div className="max-w-3xl mx-auto space-y-6">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                      <h3 className="text-base font-bold text-slate-900">Export &amp; Backups</h3>
                      <p className="text-xs text-slate-500">
                        Export the complete .siteproject project package or download full production ZIP archive.
                      </p>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleDownloadZip("full")}
                          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                        >
                          Download Website ZIP
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const blob = await exportProjectBackup(project);
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.siteproject`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          }}
                          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
                        >
                          Export .siteproject
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
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
          setActiveTab("overview");
        }}
        onSelectExistingPage={(pagePath) => {
          handleSelectPage(pagePath);
          setActiveTab("overview");
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
