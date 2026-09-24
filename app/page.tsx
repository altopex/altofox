"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { ApiKeyModal } from "@/components/ApiKeyModal";
import { RecentProjectsModal } from "@/components/RecentProjectsModal";
import { LivePreview, ProjectData } from "@/components/LivePreview";
import { ProviderType } from "@/lib/ai/types";
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
  Sliders,
  ChevronDown,
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
  { id: "Plumbing & Drain Cleaning", label: "Plumber", icon: Wrench },
  { id: "Licensed Electrical Services", label: "Electrician", icon: Zap },
  { id: "HVAC Heating & AC Repair", label: "HVAC / AC", icon: Flame },
  { id: "Roofing & Storm Restoration", label: "Roofing", icon: Home },
  { id: "Lawn Care & Landscaping", label: "Landscaping", icon: Trees },
  { id: "Pest Control & Extermination", label: "Pest Control", icon: Bug },
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

  // Local Home Service Form Fields
  const [serviceCategory, setServiceCategory] = useState("Plumbing & Drain Cleaning");
  const [targetLocation, setTargetLocation] = useState("Charlotte, North Carolina");
  const [businessName, setBusinessName] = useState("Carolina Pro Plumbing & Drain");
  const [focusKeywords, setFocusKeywords] = useState("emergency plumber in Charlotte NC");
  const [secondaryKeywords, setSecondaryKeywords] = useState("24/7 drain cleaning, water heater repair, leak detection, sewer pipe repair");
  const [phone, setPhone] = useState("(704) 555-0199");
  const [additionalInstructions, setAdditionalInstructions] = useState("");

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Active Project (if generated or loaded)
  const [currentProject, setCurrentProject] = useState<ProjectData | null>(null);

  // Check which providers have keys configured
  const refreshKeysStatus = async () => {
    try {
      const res = await fetch("/api/keys");
      const data = await res.json();
      if (data.success && Array.isArray(data.providers)) {
        const configured = data.providers
          .filter((p: { hasKey: boolean }) => p.hasKey)
          .map((p: { provider: string }) => p.provider);
        setConfiguredProviders(configured);

        // Auto select first configured provider if active doesn't have a key
        if (!configured.includes(activeProvider) && configured.length > 0) {
          const firstConfigured = configured[0] as ProviderType;
          setActiveProvider(firstConfigured);
          if (firstConfigured === "gemini") setActiveModel("gemini-1.5-pro");
          if (firstConfigured === "openai") setActiveModel("gpt-4o");
          if (firstConfigured === "custom") {
            const customRecord = data.providers.find((p: { provider: string }) => p.provider === "custom");
            if (customRecord?.defaultModel) setActiveModel(customRecord.defaultModel);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load key statuses:", err);
    }
  };

  // Load starter templates
  const loadTemplates = async () => {
    try {
      const res = await fetch("/api/templates");
      const data = await res.json();
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (err) {
      console.error("Failed to load templates:", err);
    }
  };

  useEffect(() => {
    refreshKeysStatus();
    loadTemplates();
  }, []);

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
          prompt: additionalInstructions.trim() || `Build a high-converting local home service website for ${businessName} in ${targetLocation}.`,
          provider: activeProvider,
          model: activeModel,
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
                <span>Local Home Service & Geo-Targeted Static Websites</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Build Local Contractor Websites <br />
                <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
                  Ranked for Any City & Download in 1-Click
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Connect ChatGPT, Gemini, or any Custom API model. Enter your target location, trade, and focus keywords to generate high-converting local static sites.
              </p>
            </div>

            {/* API Key Alert Banner if not configured */}
            {!hasKeyForActiveProvider && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
                <div className="flex items-center space-x-3 text-amber-200">
                  <Key className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>
                    No API connected for{" "}
                    <strong className="capitalize text-amber-100">{activeProvider}</strong>. Add your API key or custom endpoint to generate.
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
              {/* Engine Selector */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    AI Engine:
                  </span>
                  <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveProvider("gemini");
                        setActiveModel("gemini-1.5-pro");
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                        activeProvider === "gemini"
                          ? "bg-slate-800 text-sky-400 shadow-sm ring-1 ring-sky-500/30"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span>Gemini</span>
                      {configuredProviders.includes("gemini") && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveProvider("openai");
                        setActiveModel("gpt-4o");
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                        activeProvider === "openai"
                          ? "bg-slate-800 text-sky-400 shadow-sm ring-1 ring-sky-500/30"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span>ChatGPT (OpenAI)</span>
                      {configuredProviders.includes("openai") && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveProvider("custom");
                        setActiveModel("llama-3.3-70b");
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                        activeProvider === "custom"
                          ? "bg-slate-800 text-sky-400 shadow-sm ring-1 ring-sky-500/30"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span>Custom API</span>
                      {configuredProviders.includes("custom") && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setKeysModalOpen(true)}
                  className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 hover:underline"
                >
                  <Key className="w-3.5 h-3.5" />
                  Configure API / Base URL
                </button>
              </div>

              {/* Service Category Pills */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Select Trade / Service Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {COMMON_TRADES.map((trade) => {
                    const Icon = trade.icon;
                    const isSelected = serviceCategory === trade.id;
                    return (
                      <button
                        key={trade.id}
                        type="button"
                        onClick={() => {
                          setServiceCategory(trade.id);
                          if (trade.label === "Plumber") {
                            setFocusKeywords(`emergency plumber in ${targetLocation || "Charlotte NC"}`);
                          } else if (trade.label === "Electrician") {
                            setFocusKeywords(`licensed electrician in ${targetLocation || "San Jose CA"}`);
                          } else if (trade.label === "HVAC / AC") {
                            setFocusKeywords(`emergency AC repair in ${targetLocation || "Austin TX"}`);
                          } else if (trade.label === "Roofing") {
                            setFocusKeywords(`roofing contractor in ${targetLocation || "Denver CO"}`);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition ${
                          isSelected
                            ? "bg-sky-500/10 border-sky-500 text-sky-300 ring-1 ring-sky-500/40"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
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

                {/* Additional Instructions */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    Additional Instructions (Optional)
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
          // fetch and open project
          fetch(`/api/projects`)
            .then((r) => r.json())
            .then((d) => {
              const proj = d.projects?.find((p: { id: string }) => p.id === id);
              if (proj) {
                setCurrentProject({
                  projectId: proj.id,
                  name: proj.name,
                  provider: proj.provider,
                  model: proj.model,
                  files: [{ path: "index.html", content: "/* Loaded */" }],
                  downloadUrl: proj.downloadUrl,
                });
              }
            });
        }}
      />
    </div>
  );
}
