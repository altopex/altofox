"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Sparkles,
  Download,
  RotateCcw,
  Smartphone,
  Tablet,
  Monitor,
  Code,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Layers,
  Palette,
  ArrowRight,
  Copy,
  Check,
  Zap,
  Globe,
  Settings,
} from "lucide-react";
import JSZip from "jszip";
import { THEMES, Theme } from "@/lib/themes";
import { GeneratedFile, ChatGeneratorResult } from "@/lib/chat-generator/generator-prompt";

const PROMPT_SUGGESTIONS = [
  "Create a modern landing page for an emergency plumber in Dallas offering 24/7 leak detection & water heater repair.",
  "Build a clean website for a roofing contractor in Austin with free drone inspections and storm damage repairs.",
  "Design a high-converting website for a local residential electrician in Atlanta with panel upgrade specials.",
  "Create a mobile-optimized landing page for an HVAC company in Miami with same-day AC repair dispatch.",
  "Create a trusted landing page for a family-owned house cleaning & maid service in Denver.",
];

interface ChatGeneratorProps {
  onOpenSettings?: () => void;
}

export function ChatGenerator({ onOpenSettings }: ChatGeneratorProps) {
  // Input states
  const [prompt, setPrompt] = useState("");
  const [selectedThemeId, setSelectedThemeId] = useState("modern-pro");
  const [outputType, setOutputType] = useState<"single" | "multi">("single");

  // Active AI provider & model (retrieved from localStorage for display & pass-through)
  const [activeProvider, setActiveProvider] = useState<string>("gemini");
  const [activeModel, setActiveModel] = useState<string>("gemini-1.5-pro");
  const [hasProviderKey, setHasProviderKey] = useState<boolean>(false);

  // Generation execution states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>("");
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Generated output states (ephemeral in-memory, ZERO database writes)
  const [generatedResult, setGeneratedResult] = useState<ChatGeneratorResult | null>(null);
  const [activePagePath, setActivePagePath] = useState<string>("index.html");
  const [viewMode, setViewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [viewTab, setViewTab] = useState<"preview" | "code">("preview");
  const [refreshKey, setRefreshKey] = useState(0);

  // Download & copy feedback states
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Abort controller ref for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load configured AI provider on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const provider =
      localStorage.getItem("ranklocal_active_provider") ||
      localStorage.getItem("altofox_active_provider") ||
      "gemini";
    const model =
      localStorage.getItem("ranklocal_active_model") ||
      localStorage.getItem("altofox_active_model") ||
      "gemini-1.5-pro";
    const key =
      localStorage.getItem(`ranklocal_key_${provider}`) ||
      localStorage.getItem(`altofox_key_${provider}`) ||
      "";

    setActiveProvider(provider);
    setActiveModel(model);
    setHasProviderKey(Boolean(key));
  }, []);

  // Selected Theme Details
  const currentTheme = useMemo(() => {
    return THEMES.find((t) => t.id === selectedThemeId) || THEMES[0];
  }, [selectedThemeId]);

  // Current active file content
  const activeFile = useMemo(() => {
    if (!generatedResult || !generatedResult.files.length) return null;
    return (
      generatedResult.files.find((f) => f.path === activePagePath) ||
      generatedResult.files.find((f) => f.path.endsWith(".html")) ||
      generatedResult.files[0]
    );
  }, [generatedResult, activePagePath]);

  // Prepared HTML for preview iframe: if multi-page with separate styles.css, inline it
  const previewHtml = useMemo(() => {
    if (!generatedResult || !generatedResult.files.length) return "";
    const htmlFile =
      generatedResult.files.find((f) => f.path === activePagePath) ||
      generatedResult.files.find((f) => f.path.endsWith(".html")) ||
      generatedResult.files[0];

    if (!htmlFile) return "";
    let content = htmlFile.content || "";

    // If there is a separate styles.css, inline it inside <head> so the sandboxed iframe renders accurately
    const cssFile = generatedResult.files.find((f) => f.path === "styles.css" || f.path.endsWith(".css"));
    if (cssFile && cssFile.content && !content.includes(cssFile.content)) {
      if (content.includes("</head>")) {
        content = content.replace("</head>", `<style>\n${cssFile.content}\n</style>\n</head>`);
      } else {
        content = `<style>\n${cssFile.content}\n</style>\n` + content;
      }
    }

    return content;
  }, [generatedResult, activePagePath]);

  // Handle Generate
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setGenerationError("Please enter a description of the website you want to create.");
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setGenerationStep("Analyzing natural-language requirements…");

    // Prepare credentials from localStorage if present
    const directKey =
      localStorage.getItem(`ranklocal_key_${activeProvider}`) ||
      localStorage.getItem(`altofox_key_${activeProvider}`) ||
      undefined;
    const directBaseUrl =
      localStorage.getItem(`ranklocal_base_url_${activeProvider}`) ||
      localStorage.getItem(`altofox_base_url_${activeProvider}`) ||
      undefined;
    const directOrgId =
      localStorage.getItem(`ranklocal_org_id_${activeProvider}`) ||
      localStorage.getItem(`altofox_org_id_${activeProvider}`) ||
      undefined;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Step feedback updates
      setTimeout(() => {
        if (isGenerating) setGenerationStep("Structuring semantic HTML5 sections & design tokens…");
      }, 1500);

      setTimeout(() => {
        if (isGenerating) setGenerationStep("Crafting trade-specific copy, local SEO & responsive CSS…");
      }, 3500);

      const res = await fetch("/api/chat-generator/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          prompt: prompt.trim(),
          themeId: selectedThemeId,
          outputType,
          provider: activeProvider,
          model: activeModel,
          apiKey: directKey,
          baseUrl: directBaseUrl,
          organizationId: directOrgId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Generation failed. Please try again with a refined prompt.");
      }

      setGeneratedResult(data.result);
      setActivePagePath("index.html");
      setViewTab("preview");
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      if (err.name === "AbortError") {
        setGenerationError("Generation was cancelled.");
      } else {
        console.error("[ChatGenerator] Error:", err);
        setGenerationError(err.message || "Failed to generate website. Please check your AI provider key.");
      }
    } finally {
      setIsGenerating(false);
      setGenerationStep("");
      abortControllerRef.current = null;
    }
  };

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Handle Download (Single HTML or Full ZIP)
  const handleDownload = async () => {
    if (!generatedResult || !generatedResult.files.length) return;

    setIsDownloading(true);
    try {
      const safeName = (generatedResult.title || "website")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      if (generatedResult.files.length === 1 && generatedResult.files[0].path.endsWith(".html")) {
        // Direct HTML file download
        const file = generatedResult.files[0];
        const blob = new Blob([file.content], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${safeName}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Multi-file ZIP download
        const zip = new JSZip();
        for (const file of generatedResult.files) {
          zip.file(file.path, file.content);
        }

        zip.file(
          "README.md",
          `# ${generatedResult.title}\n\nGenerated with RankLocal Chat Generator.\nDouble-click \`index.html\` to view in your browser. Zero build step required.\n`
        );

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${safeName}-static-website.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err: any) {
      alert(`Download error: ${err.message || "Could not package files"}`);
    } finally {
      setIsDownloading(false);
    }
  };

  // Copy active code to clipboard
  const handleCopyCode = () => {
    if (!activeFile?.content) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Open preview in standalone browser tab
  const handleOpenInNewTab = () => {
    if (!previewHtml) return;
    const blob = new Blob([previewHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  return (
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3 text-purple-600" />
              <span>Prompt-to-Site</span>
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Zero Database • Instant Static Output
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Chat Generator</span>
            <Sparkles className="w-5 h-5 text-purple-600" />
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Describe what you need in natural language. Generates clean, responsive HTML &amp; CSS ready to preview and download.
          </p>
        </div>

        {/* AI Provider Indicator */}
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
          <div className={`w-2 h-2 rounded-full ${hasProviderKey ? "bg-emerald-500" : "bg-amber-500"} animate-pulse`} />
          <span className="text-slate-600 font-medium">
            AI: <strong className="text-slate-900 uppercase">{activeProvider}</strong> ({activeModel})
          </span>
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="text-indigo-600 hover:text-indigo-800 text-[11px] font-bold underline ml-1"
            >
              Settings
            </button>
          )}
        </div>
      </div>

      {/* Main Input Form (Shown when no result or when refining) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
            What would you like to create?
          </label>
          <div className="relative">
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Create a high-converting landing page for an emergency plumber in Dallas with 24/7 service, customer reviews, pricing estimates, and clear click-to-call phone buttons."
              className="w-full p-3.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-hidden leading-relaxed placeholder:text-slate-400 font-sans"
              disabled={isGenerating}
            />
          </div>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-500">Quick Inspiration Prompts:</div>
          <div className="flex flex-wrap gap-1.5">
            {PROMPT_SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPrompt(s)}
                disabled={isGenerating}
                className="text-[11px] bg-slate-50 hover:bg-purple-50 hover:border-purple-200 text-slate-600 hover:text-purple-900 border border-slate-200 px-2.5 py-1 rounded-lg transition text-left"
              >
                {s.split(" for ")[1] ? `“${s.split(" for ")[1].split(" with ")[0]}”` : `“${s.slice(0, 35)}…”`}
              </button>
            ))}
          </div>
        </div>

        {/* Optional Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          {/* Theme Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-purple-600" />
              <span>Theme Style</span>
            </label>
            <select
              value={selectedThemeId}
              onChange={(e) => setSelectedThemeId(e.target.value)}
              disabled={isGenerating}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
            >
              {THEMES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.fonts.heading} • {t.heroStyle})
                </option>
              ))}
            </select>
          </div>

          {/* Output Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              <span>Output Structure</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOutputType("single")}
                disabled={isGenerating}
                className={`py-2 px-3 rounded-xl border text-xs font-medium text-center transition ${
                  outputType === "single"
                    ? "border-purple-600 bg-purple-50 text-purple-900 font-bold shadow-2xs"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Landing Page (1 file)
              </button>
              <button
                type="button"
                onClick={() => setOutputType("multi")}
                disabled={isGenerating}
                className={`py-2 px-3 rounded-xl border text-xs font-medium text-center transition ${
                  outputType === "multi"
                    ? "border-purple-600 bg-purple-50 text-purple-900 font-bold shadow-2xs"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Mini-Site (Multi-page)
              </button>
            </div>
          </div>
        </div>

        {/* Error message */}
        {generationError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold">Generation Error</div>
              <p className="text-[11px] text-rose-700 mt-0.5">{generationError}</p>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              className="text-[11px] font-bold text-rose-800 underline hover:no-underline shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Action Button & In-Flight State */}
        <div className="pt-2 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Press generate to create pure static HTML &amp; CSS.
          </span>

          <div className="flex items-center space-x-2">
            {isGenerating && (
              <button
                type="button"
                onClick={handleCancelGeneration}
                className="px-3 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition"
              >
                Cancel
              </button>
            )}

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:transform-none"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{generationStep || "Generating Website…"}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Website</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Generated Output Preview Section */}
      {generatedResult && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col space-y-0 animate-in fade-in zoom-in-98 duration-200">
          {/* Header Bar */}
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 to-purple-50/30">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{generatedResult.title}</h3>
                <p className="text-[11px] text-slate-500">
                  {generatedResult.files.length} static {generatedResult.files.length === 1 ? "file" : "files"} ready • Theme: {generatedResult.themeUsed}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setRefreshKey((k) => k + 1)}
                title="Reload Preview"
                className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleOpenInNewTab}
                className="hidden sm:inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Tab</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Packaging…</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>
                      {downloadSuccess
                        ? "Downloaded!"
                        : generatedResult.files.length === 1
                        ? "Download HTML"
                        : "Download ZIP"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sub Toolbar: Page Tabs + Viewport switchers + Preview/Code toggle */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Page selection pills if multiple files */}
            <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5">
              {generatedResult.files.map((file) => (
                <button
                  key={file.path}
                  type="button"
                  onClick={() => setActivePagePath(file.path)}
                  className={`px-3 py-1 rounded-lg font-mono text-[11px] transition ${
                    activePagePath === file.path
                      ? "bg-white text-indigo-700 border border-indigo-200 font-bold shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  {file.path}
                </button>
              ))}
            </div>

            {/* View Mode & Code Toggle */}
            <div className="flex items-center space-x-3">
              {/* Device Viewport Buttons */}
              <div className="bg-slate-200/70 p-0.5 rounded-lg flex items-center space-x-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("desktop")}
                  title="Desktop (1280px)"
                  className={`p-1.5 rounded-md transition ${
                    viewMode === "desktop" ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("tablet")}
                  title="Tablet (768px)"
                  className={`p-1.5 rounded-md transition ${
                    viewMode === "tablet" ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("mobile")}
                  title="Mobile (375px)"
                  className={`p-1.5 rounded-md transition ${
                    viewMode === "mobile" ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* View/Code Tabs */}
              <div className="flex items-center space-x-1 border-l border-slate-200 pl-3">
                <button
                  type="button"
                  onClick={() => setViewTab("preview")}
                  className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    viewTab === "preview" ? "bg-white text-indigo-700 shadow-2xs border border-slate-200" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewTab("code")}
                  className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    viewTab === "code" ? "bg-white text-indigo-700 shadow-2xs border border-slate-200" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Code</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Frame Viewport */}
          <div className="bg-slate-100 p-4 min-h-[580px] h-[calc(100vh-22rem)] flex items-center justify-center overflow-hidden">
            {viewTab === "preview" ? (
              <div
                className={`h-full transition-all duration-300 rounded-xl overflow-hidden border border-slate-200 shadow-md bg-white ${
                  viewMode === "desktop"
                    ? "w-full"
                    : viewMode === "tablet"
                    ? "w-[768px] max-w-full"
                    : "w-[375px] max-w-full rounded-[24px] border-4 border-slate-800"
                }`}
              >
                <iframe
                  key={refreshKey}
                  srcDoc={previewHtml}
                  title="Chat Generator Live Preview"
                  className="w-full h-full border-0 bg-white"
                  sandbox="allow-scripts allow-forms allow-same-origin allow-modals"
                />
              </div>
            ) : (
              <div className="w-full h-full rounded-xl overflow-hidden border border-slate-200 bg-slate-900 flex flex-col shadow-md">
                <div className="bg-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-300 border-b border-slate-700">
                  <span className="font-mono">{activeFile?.path}</span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white font-semibold text-[11px] transition"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
                  </button>
                </div>
                <pre className="flex-1 p-4 overflow-auto text-slate-100 font-mono text-xs leading-relaxed">
                  {activeFile?.content || ""}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
