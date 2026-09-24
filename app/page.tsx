"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { ApiKeyModal } from "@/components/ApiKeyModal";
import { RecentProjectsModal } from "@/components/RecentProjectsModal";
import { LivePreview, ProjectData } from "@/components/LivePreview";
import { ProviderType } from "@/lib/ai/types";
import { SAMPLE_DEMO_PROJECT } from "@/lib/demo-site";
import {
  Sparkles,
  Key,
  CheckCircle2,
  Loader2,
  Wrench,
  Zap,
  Flame,
  Home,
  Trees,
  Bug,
  MapPin,
  Search,
  Phone,
  Tag,
  Building2,
  FileText,
  Paintbrush,
  Hammer,
  Eye,
  Palette,
  ShieldCheck,
} from "lucide-react";

interface StarterTemplate {
  id: string;
  title: string;
  category: string;
  badge?: string;
  description: string;
  prompt: string;
}

const COMMON_TRADES = [
  {
    id: "Plumbing & Drain Cleaning",
    label: "Plumber",
    icon: Wrench,
    defaultKeywords: "emergency plumber in Charlotte NC",
    defaultSecondary: "24/7 drain cleaning, water heater repair, burst pipe repair, sewer line inspection",
  },
  {
    id: "Licensed Electrical Services",
    label: "Electrician",
    icon: Zap,
    defaultKeywords: "licensed electrician in San Jose CA",
    defaultSecondary: "residential electrical repair, EV charger installation, panel upgrades 200 amp, emergency electrical service",
  },
  {
    id: "HVAC Heating & AC Repair",
    label: "HVAC / AC",
    icon: Flame,
    defaultKeywords: "emergency AC repair in Austin TX",
    defaultSecondary: "air conditioning installation, furnace tune-up, heat pump replacement, 24/7 HVAC repair",
  },
  {
    id: "Roofing & Storm Restoration",
    label: "Roofing",
    icon: Home,
    defaultKeywords: "roofing contractor in Denver CO",
    defaultSecondary: "hail damage roof repair, residential roof replacement, free roof inspection, storm damage",
  },
  {
    id: "Lawn Care & Landscaping",
    label: "Landscaping",
    icon: Trees,
    defaultKeywords: "landscaping and lawn care Orlando FL",
    defaultSecondary: "sprinkler repair, sod installation, palm tree trimming, commercial landscape maintenance",
  },
  {
    id: "Pest Control & Extermination",
    label: "Pest Control",
    icon: Bug,
    defaultKeywords: "emergency pest control service",
    defaultSecondary: "termite inspection, bed bug heat treatment, rodent removal, wasp nest removal",
  },
  {
    id: "Professional Painting & Drywall",
    label: "Painting",
    icon: Paintbrush,
    defaultKeywords: "interior and exterior house painters",
    defaultSecondary: "cabinet refinishing, drywall repair, deck staining, residential painting",
  },
  {
    id: "Handyman & Home Remodeling",
    label: "Handyman",
    icon: Hammer,
    defaultKeywords: "local handyman and home repairs",
    defaultSecondary: "bathroom remodel, drywall patching, fixture installation, door and trim repair",
  },
];

const COLOR_THEMES = [
  { id: "oceanic-blue", label: "Trust Navy & Cyan", dot: "bg-sky-500", primary: "#0284c7" },
  { id: "safety-amber", label: "Safety Amber & Gold", dot: "bg-amber-500", primary: "#d97706" },
  { id: "emerald-green", label: "Eco Emerald & Forest", dot: "bg-emerald-500", primary: "#059669" },
  { id: "crimson-red", label: "Emergency Red & Slate", dot: "bg-rose-500", primary: "#e11d48" },
  { id: "ice-teal", label: "Cool Ice & Teal", dot: "bg-teal-500", primary: "#0d9488" },
  { id: "modern-dark", label: "Modern Slate & Indigo", dot: "bg-indigo-500", primary: "#6366f1" },
];

const AI_PROVIDERS: { id: ProviderType; label: string; defaultModel: string }[] = [
  { id: "gemini", label: "Google Gemini", defaultModel: "gemini-1.5-pro" },
  { id: "openai", label: "ChatGPT (OpenAI)", defaultModel: "gpt-4o" },
  { id: "anthropic", label: "Claude (Anthropic)", defaultModel: "claude-3-5-sonnet-20241022" },
  { id: "groq", label: "Groq (Fast Llama)", defaultModel: "llama-3.3-70b-versatile" },
  { id: "deepseek", label: "DeepSeek", defaultModel: "deepseek-chat" },
  { id: "openrouter", label: "OpenRouter", defaultModel: "anthropic/claude-3.5-sonnet" },
  { id: "custom", label: "Custom / Ollama", defaultModel: "llama3" },
];

export default function HomePage() {
  // Navigation & Modals
  const [keysModalOpen, setKeysModalOpen] = useState(false);
  const [recentModalOpen, setRecentModalOpen] = useState(false);

  // Active Provider & Model
  const [activeProvider, setActiveProvider] = useState<ProviderType>("gemini");
  const [activeModel, setActiveModel] = useState<string>("gemini-1.5-pro");
  const [configuredProviders, setConfiguredProviders] = useState<string[]>([]);
  const [templates, setTemplates] = useState<StarterTemplate[]>([]);

  // Theme & Styling
  const [selectedTheme, setSelectedTheme] = useState(COLOR_THEMES[0].id);

  // Local Home Service Form Fields
  const [serviceCategory, setServiceCategory] = useState("Plumbing & Drain Cleaning");
  const [targetLocation, setTargetLocation] = useState("Charlotte, North Carolina");
  const [businessName, setBusinessName] = useState("Carolina Pro Plumbing & Drain");
  const [focusKeywords, setFocusKeywords] = useState("emergency plumber in Charlotte NC");
  const [secondaryKeywords, setSecondaryKeywords] = useState(
    "24/7 drain cleaning, water heater repair, burst pipe repair, sewer line inspection"
  );
  const [phone, setPhone] = useState("(704) 555-0199");
  const [additionalInstructions, setAdditionalInstructions] = useState("");

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Active Project (if generated or loaded)
  const [currentProject, setCurrentProject] = useState<ProjectData | null>(null);

  // Check which providers have keys configured
  const refreshKeysStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/keys");
      const data = await res.json();
      if (data.success && Array.isArray(data.providers)) {
        const configured = data.providers
          .filter((p: { hasKey: boolean }) => p.hasKey)
          .map((p: { provider: string }) => p.provider);
        setConfiguredProviders(configured);

        // Auto select first configured provider if active doesn't have a key
        setActiveProvider((prev) => {
          if (!configured.includes(prev) && configured.length > 0) {
            const firstConfigured = configured[0] as ProviderType;
            if (firstConfigured === "gemini") setActiveModel("gemini-1.5-pro");
            else if (firstConfigured === "openai") setActiveModel("gpt-4o");
            else if (firstConfigured === "anthropic") setActiveModel("claude-3-5-sonnet-20241022");
            else if (firstConfigured === "groq") setActiveModel("llama-3.3-70b-versatile");
            else if (firstConfigured === "deepseek") setActiveModel("deepseek-chat");
            else if (firstConfigured === "openrouter") setActiveModel("anthropic/claude-3.5-sonnet");
            else if (firstConfigured === "custom") {
              const customRecord = data.providers.find((p: { provider: string }) => p.provider === "custom");
              if (customRecord?.defaultModel) setActiveModel(customRecord.defaultModel);
            }
            return firstConfigured;
          }
          return prev;
        });
      }
    } catch (err) {
      console.error("Failed to load key statuses:", err);
    }
  }, []);

  // Load starter templates
  const loadTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/templates");
      const data = await res.json();
      if (data.success && Array.isArray(data.templates)) {
        setTemplates(data.templates);
      }
    } catch (err) {
      console.error("Failed to load templates:", err);
    }
  }, []);

  useEffect(() => {
    refreshKeysStatus();
    loadTemplates();
  }, [refreshKeysStatus, loadTemplates]);

  const hasKeyForActiveProvider = configuredProviders.includes(activeProvider);

  // Cycle generation steps for nice user feedback
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (generating) {
      setGenerationStep(0);
      interval = setInterval(() => {
        setGenerationStep((prev) => (prev < 3 ? prev + 1 : prev));
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [generating]);

  // Handle Generate
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (generating) return;

    if (!targetLocation.trim() || !serviceCategory.trim()) {
      setGenerationError("Please provide at least a Target Location and Service Trade.");
      return;
    }

    if (!hasKeyForActiveProvider) {
      setKeysModalOpen(true);
      return;
    }

    setGenerating(true);
    setGenerationError(null);

    const themeObj = COLOR_THEMES.find((t) => t.id === selectedTheme);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: businessName.trim() || `${targetLocation} ${serviceCategory}`,
          serviceCategory: serviceCategory.trim(),
          targetLocation: targetLocation.trim(),
          focusKeywords: focusKeywords.trim(),
          secondaryKeywords: secondaryKeywords.trim(),
          phone: phone.trim(),
          prompt:
            additionalInstructions.trim() ||
            `Build a high-converting local home service website for ${businessName} in ${targetLocation}.`,
          provider: activeProvider,
          model: activeModel,
          theme: {
            primaryColor: themeObj?.primary || "#0284c7",
            fontStyle: "Modern Clean Sans-Serif",
            tone: "Authoritative, trustworthy, and emergency responsive",
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCurrentProject({
          projectId: data.projectId,
          name: data.name,
          notes: data.notes,
          provider: data.provider,
          model: data.model,
          files: data.files,
          downloadUrl: data.downloadUrl,
        });
      } else {
        setGenerationError(data.error || "Failed to generate website.");
      }
    } catch (err) {
      setGenerationError(
        err instanceof Error ? err.message : "Network error generating website."
      );
    } finally {
      setGenerating(false);
    }
  };

  // Helper when clicking a template
  const applyTemplate = (tpl: StarterTemplate) => {
    if (tpl.title.includes("Plumber")) {
      setServiceCategory("Plumbing & Drain Cleaning");
      setTargetLocation("Charlotte, North Carolina");
      setBusinessName("Carolina Pro Plumbing & Drain");
      setFocusKeywords("emergency plumber in Charlotte NC");
      setSecondaryKeywords("24/7 drain cleaning, water heater repair, leak detection, sewer pipe repair");
      setPhone("(704) 555-0199");
      setAdditionalInstructions(tpl.prompt);
    } else if (tpl.title.includes("Electrician")) {
      setServiceCategory("Licensed Electrical Services");
      setTargetLocation("San Jose, California");
      setBusinessName("Silicon Valley Bright Electric");
      setFocusKeywords("licensed electrician in San Jose CA");
      setSecondaryKeywords("residential electrical repair, EV charger installation, panel upgrades 200 amp, emergency electrical service");
      setPhone("(408) 555-0182");
      setAdditionalInstructions(tpl.prompt);
    } else if (tpl.title.includes("HVAC")) {
      setServiceCategory("HVAC Heating & AC Repair");
      setTargetLocation("Austin, Texas");
      setBusinessName("Lone Star Cool & Heat");
      setFocusKeywords("emergency AC repair Austin TX");
      setSecondaryKeywords("air conditioning installation, furnace tune-up, heat pump replacement, 24/7 HVAC repair Austin");
      setPhone("(512) 555-0144");
      setAdditionalInstructions(tpl.prompt);
    } else if (tpl.title.includes("Roofing")) {
      setServiceCategory("Roofing & Storm Restoration");
      setTargetLocation("Denver, Colorado");
      setBusinessName("Mile High Roofing & Restoration");
      setFocusKeywords("roofing contractor in Denver CO");
      setSecondaryKeywords("hail damage roof repair, residential roof replacement, free roof inspection, insurance claim roofing");
      setPhone("(303) 555-0177");
      setAdditionalInstructions(tpl.prompt);
    } else if (tpl.title.includes("Landscaping")) {
      setServiceCategory("Lawn Care & Landscaping");
      setTargetLocation("Orlando, Florida");
      setBusinessName("Palmetto Green Landscaping");
      setFocusKeywords("landscaping and lawn care Orlando FL");
      setSecondaryKeywords("sprinkler repair, sod installation, palm tree trimming, commercial landscape maintenance");
      setPhone("(407) 555-0133");
      setAdditionalInstructions(tpl.prompt);
    } else {
      setBusinessName(tpl.title);
      setAdditionalInstructions(tpl.prompt);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Navbar */}
      <Navbar
        onOpenKeys={() => setKeysModalOpen(true)}
        onOpenProjects={() => setRecentModalOpen(true)}
        activeProvider={activeProvider}
        hasKeyForActiveProvider={hasKeyForActiveProvider}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center py-6">
        {currentProject ? (
          /* Live Preview & Direct Download View */
          <LivePreview
            project={currentProject}
            onNewWebsite={() => setCurrentProject(null)}
            onProjectUpdated={(updated) => setCurrentProject(updated)}
          />
        ) : generating ? (
          /* Generation Loading State */
          <div className="max-w-xl mx-auto px-6 py-20 text-center space-y-8 animate-in fade-in duration-300">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 animate-spin opacity-40 blur-xl" />
              <div className="relative w-20 h-20 rounded-2xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-sky-400 shadow-2xl">
                <Sparkles className="w-10 h-10 animate-pulse text-sky-400" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Generating Local Service Website
              </h2>
              <p className="text-sm text-slate-400">
                Targeting <span className="text-sky-300 font-semibold">{targetLocation}</span> for{" "}
                <span className="text-emerald-300 font-semibold">{businessName}</span>
              </p>
            </div>

            {/* Stepper feedback */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 text-left space-y-3.5 shadow-xl">
              {[
                { label: `Creating Schema.org LocalBusiness markup for ${serviceCategory}`, step: 0 },
                { label: `Optimizing local SEO headings & keywords (${focusKeywords})`, step: 1 },
                { label: `Adding emergency click-to-call buttons & Free Quote form`, step: 2 },
                { label: `Compiling zero-build static bundle & ZIP download link`, step: 3 },
              ].map((item, idx) => {
                const isDone = generationStep > item.step;
                const isCurrent = generationStep === item.step;
                return (
                  <div key={idx} className="flex items-center space-x-3 text-xs sm:text-sm">
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="w-5 h-5 text-sky-400 animate-spin shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-slate-700 shrink-0" />
                    )}
                    <span
                      className={
                        isDone
                          ? "text-slate-300"
                          : isCurrent
                          ? "text-white font-medium"
                          : "text-slate-500"
                      }
                    >
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Local Home Service Website Builder Form */
          <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 space-y-8">
            {/* Hero Heading */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-300">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero-Build Static Website Builder for Local Trades & Contractors</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Build Local Contractor Websites <br />
                <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
                  Ranked for Any City & Download in 1-Click
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Generates high-converting, Schema.org LocalBusiness-tagged static websites with instant click-to-call mobile drawers, quote forms, and zero build tool dependencies.
              </p>

              {/* Instant Interactive Demo Site Button */}
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentProject(SAMPLE_DEMO_PROJECT)}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-sky-300 hover:text-white border border-sky-500/30 hover:border-sky-500 text-xs font-semibold shadow-lg transition transform hover:-translate-y-0.5"
                >
                  <Eye className="w-4 h-4 text-sky-400" />
                  <span>🚀 Explore Live Demo Website & Code Editor</span>
                </button>
              </div>
            </div>

            {/* API Key Alert Banner if not configured */}
            {!hasKeyForActiveProvider && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
                <div className="flex items-center space-x-3 text-amber-200">
                  <Key className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>
                    No API connected for{" "}
                    <strong className="capitalize text-amber-100">{activeProvider}</strong>. Add your key or custom endpoint to generate with this model.
                  </span>
                </div>
                <button
                  onClick={() => setKeysModalOpen(true)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg transition shrink-0"
                >
                  Connect API Engine
                </button>
              </div>
            )}

            {/* Main Builder Form Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-6 backdrop-blur-md">
              {/* Multi-Engine AI Selector */}
              <div className="space-y-2 pb-4 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                    Select AI Generation Engine:
                  </span>
                  <button
                    type="button"
                    onClick={() => setKeysModalOpen(true)}
                    className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 hover:underline"
                  >
                    <Key className="w-3 h-3" />
                    Manage Keys / Custom URL
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
                  {AI_PROVIDERS.map((provider) => {
                    const isSelected = activeProvider === provider.id;
                    const hasKey = configuredProviders.includes(provider.id);
                    return (
                      <button
                        key={provider.id}
                        type="button"
                        onClick={() => {
                          setActiveProvider(provider.id);
                          setActiveModel(provider.defaultModel);
                        }}
                        className={`p-2 rounded-xl text-xs font-medium transition flex flex-col items-center justify-center gap-1 border ${
                          isSelected
                            ? "bg-slate-800 text-sky-400 border-sky-500/60 ring-1 ring-sky-500/30 shadow-sm"
                            : "bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="truncate">{provider.label}</span>
                          {hasKey && (
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"
                              title="API Key Configured"
                            />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Service Category Pills */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Select Trade / Contractor Niche
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {COMMON_TRADES.map((trade) => {
                    const Icon = trade.icon;
                    const isSelected = serviceCategory === trade.id;
                    return (
                      <button
                        key={trade.id}
                        type="button"
                        onClick={() => {
                          setServiceCategory(trade.id);
                          setFocusKeywords(trade.defaultKeywords);
                          setSecondaryKeywords(trade.defaultSecondary);
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-start gap-2.5 transition ${
                          isSelected
                            ? "bg-sky-500/10 border-sky-500 text-sky-300 ring-1 ring-sky-500/40"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0 text-sky-400" />
                        <span className="truncate">{trade.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleGenerate} className="space-y-4">
                {/* Location & Business Name Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      Target Location (City, State / Region)
                    </label>
                    <input
                      type="text"
                      value={targetLocation}
                      onChange={(e) => setTargetLocation(e.target.value)}
                      placeholder="e.g. Charlotte, North Carolina or San Jose, CA"
                      required
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-sky-400" />
                      Website / Business Name
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Carolina Pro Plumbing & Drain"
                      required
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                    />
                  </div>
                </div>

                {/* Focus Keyword & Phone Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-amber-400" />
                      Focus SEO Keyword (Primary Target)
                    </label>
                    <input
                      type="text"
                      value={focusKeywords}
                      onChange={(e) => setFocusKeywords(e.target.value)}
                      placeholder="e.g. emergency plumber in Charlotte NC"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      Emergency / Contact Phone
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. (704) 555-0199"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Secondary Keywords */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-400" />
                    Secondary Keywords & Services (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={secondaryKeywords}
                    onChange={(e) => setSecondaryKeywords(e.target.value)}
                    placeholder="e.g. 24/7 drain cleaning, water heater repair, leak detection, sewer pipe repair"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition text-xs font-mono"
                  />
                </div>

                {/* Color Palette / Theme Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-purple-400" />
                    Website Visual Theme & Palette
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {COLOR_THEMES.map((theme) => {
                      const isSelected = selectedTheme === theme.id;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setSelectedTheme(theme.id)}
                          className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-2 transition ${
                            isSelected
                              ? "bg-slate-800 border-sky-500 text-white ring-1 ring-sky-500/40"
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${theme.dot} shrink-0`} />
                          <span className="truncate">{theme.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Additional Instructions */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    Additional Custom Instructions (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={additionalInstructions}
                    onChange={(e) => setAdditionalInstructions(e.target.value)}
                    placeholder="e.g. Include $50 off first service coupon, 100% satisfaction guarantee badge, and list surrounding service neighborhoods (Matthews, Huntersville, Concord)..."
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition text-xs leading-relaxed"
                  />
                </div>

                {generationError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl text-xs">
                    {generationError}
                  </div>
                )}

                {/* Generate Button */}
                <button
                  type="submit"
                  disabled={generating}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-bold text-base shadow-lg shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:transform-none flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Local Static Website 🚀</span>
                </button>
              </form>
            </div>

            {/* Quick Starter Templates */}
            {templates.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Quick Location-Specific Templates (Click to Auto-Fill):</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {templates.map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => applyTemplate(tpl)}
                      className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40 hover:border-emerald-500/40 hover:bg-slate-900/80 text-left transition group space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-semibold text-white group-hover:text-emerald-300 transition">
                          {tpl.title}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                          {tpl.badge || "Local"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {tpl.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <ApiKeyModal
        isOpen={keysModalOpen}
        onClose={() => setKeysModalOpen(false)}
        onKeysUpdated={refreshKeysStatus}
      />
      <RecentProjectsModal
        isOpen={recentModalOpen}
        onClose={() => setRecentModalOpen(false)}
        onSelectProject={(id) => {
          // fetch and open full project with all static files
          fetch(`/api/projects/${id}`)
            .then((r) => r.json())
            .then((d) => {
              if (d.success && d.project) {
                setCurrentProject(d.project);
              }
            })
            .catch((err) => console.error("Failed to load project:", err));
        }}
      />
    </div>
  );
}
