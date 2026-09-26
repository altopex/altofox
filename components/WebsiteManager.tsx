"use client";

import React, { useState, useEffect, useMemo } from "react";
import { SavedProject, URLRedirect, ProjectChangeLogEntry } from "../lib/storage/project-types";
import { saveProjectToDB, exportProjectBackup, generateWebsiteZIP } from "../lib/storage/db";
import { KeywordMapModal, KeywordMapEntry } from "./KeywordMapModal";
import { FindReplaceModal } from "./FindReplaceModal";
import { SearchConsoleHub } from "./SearchConsoleHub";
import { auditPageSEO } from "../lib/seo/on-page-scorer";
import { Theme, THEMES } from "../lib/themes";
import { MonthlyOptimizationCycleModal } from "./MonthlyOptimizationCycleModal";
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
} from "lucide-react";
import { useProjectPresence } from "@/lib/supabase/presence";
import { ConflictModal } from "./editor/ConflictModal";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { logActivity } from "@/lib/supabase/activity";
import { ActivityFeed } from "./activity/ActivityFeed";
import { RankRentManager } from "./rankrent/RankRentManager";
import { analyzeHtmlRecommendations, BuilderRecommendation } from "@/lib/recommendations/recommendation-engine";
import { applyRecommendationFix, applyAllRecommendations } from "@/lib/recommendations/fix-applier";
import { RecommendationFixPanel } from "./editor/RecommendationFixPanel";

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
  const [project, setProject] = useState<SavedProject>(initialProject);
  const [activeTab, setActiveTab] = useState<
    "pages" | "business-details" | "keywords" | "images" | "settings" | "history" | "search-console" | "cycles" | "rank-rent"
  >("pages");

  // Modals
  const [isKeywordModalOpen, setIsKeywordModalOpen] = useState(false);
  const [isFindReplaceModalOpen, setIsFindReplaceModalOpen] = useState(false);
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);

  // Selected Page in Pages Tab
  const [selectedPagePath, setSelectedPagePath] = useState<string>("index.html");
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
    return project.files.find((f) => f.path === selectedPagePath) || project.files[0];
  }, [project.files, selectedPagePath]);

  const [pageTitle, setPageTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [pageH1, setPageH1] = useState("");
  const [activeHtmlContent, setActiveHtmlContent] = useState("");

  // Sync state when page changes
  useEffect(() => {
    if (currentPageFile) {
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

    // Update <title>
    if (pageTitle) {
      updatedHtml = updatedHtml.replace(
        /<title[^>]*>[\s\S]*?<\/title>/i,
        `<title>${pageTitle}</title>`
      );
    }

    // Update meta description
    if (metaDescription) {
      updatedHtml = updatedHtml.replace(
        /<meta[^>]*?name=["']description["'][^>]*?content=["'][^"']*["']/i,
        `<meta name="description" content="${metaDescription}">`
      );
    }

    // Update H1
    if (pageH1) {
      updatedHtml = updatedHtml.replace(
        /<h1([^>]*)>[\s\S]*?<\/h1>/i,
        `<h1$1>${pageH1}</h1>`
      );
    }

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
    const { blob, changedFilesCount } = await generateWebsiteZIP(
      project,
      mode,
      project.lastDownloadedAt
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${
      mode === "changed-only" ? "changed-files" : "full-website"
    }.zip`;
    a.click();
    URL.revokeObjectURL(url);

    // Update lastDownloadedAt
    const updated = { ...project, lastDownloadedAt: Date.now() };
    await saveProjectToDB(updated);
    setProject(updated);
  };

  // Group pages by category
  const groupedPages = useMemo(() => {
    const mainPages: string[] = [];
    const servicePages: string[] = [];
    const locationPages: string[] = [];
    const blogPages: string[] = [];

    project.files
      .filter((f) => f.path.endsWith(".html"))
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
                Saved &amp; IndexedDB Synced
              </span>
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
                  <span className="text-xs font-bold text-slate-800">Pages List</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {project.files.filter((f) => f.path.endsWith(".html")).length} Total
                  </span>
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
                        onClick={() => setSelectedPagePath(path)}
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
                          onClick={() => setSelectedPagePath(path)}
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
                          onClick={() => setSelectedPagePath(path)}
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
                          onClick={() => setSelectedPagePath(path)}
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
                        onChange={(e) => setPageTitle(e.target.value)}
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
                        onChange={(e) => setMetaDescription(e.target.value)}
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
                        onChange={(e) => setPageH1(e.target.value)}
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
                      Sections are assembled using the active theme (&quot;{project.theme.name}&quot;). Content stays fully responsive and compliant across mobile and desktop.
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
                    <iframe
                      title="Page Preview"
                      srcDoc={activeHtmlContent || currentPageFile?.content}
                      className="w-full h-full border-0"
                    />
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

              <SearchConsoleHub
                files={project.files}
                keywordMap={project.keywordMap}
                serviceAreas={project.serviceAreaCities.map((c) => c.city)}
                businessType={project.formData?.businessType || "Contractor"}
                city={project.formData?.city || "Local"}
                changeLog={project.changeLog}
                onApplyOptimization={(path, newHtml, logSummary) => {
                  const updatedFiles = project.files.map((f) =>
                    f.path === path ? { ...f, content: newHtml, lastModified: Date.now() } : f
                  );
                  const logEntry: ProjectChangeLogEntry = {
                    id: `log-${Date.now()}`,
                    timestamp: Date.now(),
                    dateStr: new Date().toLocaleDateString(),
                    summary: logSummary,
                    affectedPages: [path],
                  };
                  const updated = {
                    ...project,
                    files: updatedFiles,
                    lastEditedAt: Date.now(),
                    changeLog: [logEntry, ...(project.changeLog || [])],
                  };
                  saveProjectToDB(updated);
                  setProject(updated);
                  onProjectUpdated(updated);
                }}
              />
            </div>
          )}

          {/* TAB 3: KEYWORDS TAB */}
          {activeTab === "keywords" && (
            <div className="flex-1 p-6">
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
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .map((cycle, idx, allCycles) => {
                      const prevCycle = allCycles[idx + 1] || null;
                      const clicksDiff = prevCycle
                        ? cycle.siteMetrics.clicks - prevCycle.siteMetrics.clicks
                        : null;
                      const impDiff = prevCycle
                        ? cycle.siteMetrics.impressions - prevCycle.siteMetrics.impressions
                        : null;
                      const posDiff = prevCycle
                        ? Number((prevCycle.siteMetrics.position - cycle.siteMetrics.position).toFixed(1))
                        : null;
                      const ctrDiff = prevCycle
                        ? Number(((cycle.siteMetrics.ctr - prevCycle.siteMetrics.ctr) * 100).toFixed(2))
                        : null;

                      return (
                        <div
                          key={cycle.id}
                          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                            <div className="flex items-center space-x-2.5">
                              <span className="text-xs font-bold bg-indigo-600 text-white px-2.5 py-0.5 rounded-full">
                                Cycle #{cycle.cycleNumber}
                              </span>
                              <span className="text-xs font-bold text-slate-900">
                                {cycle.dateStr}
                              </span>
                              <span className="text-[11px] text-slate-500 font-mono">
                                ({cycle.dateRange})
                              </span>
                            </div>

                            <span className="text-xs text-slate-500">
                              {cycle.pagesChanged.length} pages optimized
                            </span>
                          </div>

                          {/* Metrics Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-0.5">
                              <span className="text-[10px] uppercase font-bold text-slate-400">
                                Clicks
                              </span>
                              <div className="text-base font-extrabold text-slate-900">
                                {cycle.siteMetrics.clicks.toLocaleString()}
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
                                {cycle.siteMetrics.impressions.toLocaleString()}
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
                                {cycle.siteMetrics.position.toFixed(1)}
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
                                {(cycle.siteMetrics.ctr * 100).toFixed(1)}%
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

          {/* TAB 8: RANK & RENT COMMAND CENTER */}
          {activeTab === "rank-rent" && (
            <div className="flex-1 overflow-y-auto bg-slate-50">
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
            </div>
          )}
        </main>
      </div>

      {/* Monthly Optimization Cycle Modal */}
      {isCycleModalOpen && (
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
      )}

      {/* Find & Replace Modal */}
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

      {/* Conflict Modal */}
      {conflictData && (
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
      )}
    </div>
  );
}
