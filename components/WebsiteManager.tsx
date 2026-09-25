"use client";

import React, { useState, useEffect, useMemo } from "react";
import { SavedProject, URLRedirect, ProjectChangeLogEntry } from "../lib/storage/project-types";
import { saveProjectToDB, exportProjectBackup, generateWebsiteZIP } from "../lib/storage/db";
import { KeywordMapModal, KeywordMapEntry } from "./KeywordMapModal";
import { FindReplaceModal } from "./FindReplaceModal";
import { SearchConsoleHub } from "./SearchConsoleHub";
import { auditPageSEO } from "../lib/seo/on-page-scorer";
import { Theme, THEMES } from "../lib/themes";
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
} from "lucide-react";

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
    "pages" | "business-details" | "keywords" | "images" | "settings" | "history" | "search-console"
  >("pages");

  // Selected Page in Pages Tab
  const [selectedPagePath, setSelectedPagePath] = useState<string>("index.html");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [isSaving, setIsSaving] = useState(false);

  // Modals
  const [isKeywordModalOpen, setIsKeywordModalOpen] = useState(false);
  const [isFindReplaceModalOpen, setIsFindReplaceModalOpen] = useState(false);

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

  // Auto-Save helper
  const handleSavePageEdits = async () => {
    setIsSaving(true);
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

    await saveProjectToDB(updatedProject);
    setProject(updatedProject);
    onProjectUpdated(updatedProject);
    setIsSaving(false);
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

        {/* Global Action Buttons */}
        <div className="flex items-center space-x-2">
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
            <div className="flex-1 overflow-y-auto p-6">
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
        </main>
      </div>

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
    </div>
  );
}
