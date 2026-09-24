"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { ApiKeyModal } from "@/components/ApiKeyModal";
import { RecentProjectsModal } from "@/components/RecentProjectsModal";
import { LivePreview, ProjectData } from "@/components/LivePreview";
import { ProviderType } from "@/lib/ai/types";
import {
  Sparkles,
  Key,
  Loader2,
  MapPin,
  Search,
  Phone,
  Tag,
  Building2,
  FileText,
  Palette,
  Globe,
  Mail,
  Clock,
  CheckSquare,
  FileSpreadsheet,
} from "lucide-react";

const DEFAULT_PAGES = [
  "Home",
  "About",
  "Services",
  "Contact",
  "FAQ",
  "Service Areas",
];

const LOCAL_BUSINESS_EXAMPLE = {
  businessName: "Lone Star Plumbing & Rooter",
  businessType: "Emergency Plumbing & Drain Cleaning",
  businessDescription: "Family-owned residential and commercial plumbing company providing 24/7 fast-dispatch repairs, drain clearing, and water heater installation across Dallas-Fort Worth.",
  servicesOffered: "24/7 Emergency Plumbing, Hydro-Jetting Drain Cleaning, Tankless Water Heater Repair, Slab Leak Detection, Sewer Line Camera Inspection, Fixture Installation",
  streetAddress: "4512 Main Street",
  city: "Dallas",
  stateRegion: "TX",
  zipPostalCode: "75201",
  country: "USA",
  serviceAreas: "Dallas, Plano, Frisco, McKinney, Irving, Richardson, Garland, Carrollton",
  phone: "(214) 555-0198",
  email: "dispatch@lonestarplumbingdfw.com",
  businessHours: "Monday - Sunday: 24/7 Emergency Dispatch Available",
  websiteDomain: "www.lonestarplumbingdfw.com",
  targetKeywords: "emergency plumber in Dallas TX, 24/7 drain cleaning Dallas, water heater repair Dallas TX, slab leak detection",
  pagesToCreate: ["Home", "About", "Services", "Contact", "FAQ", "Service Areas"],
  brandColors: "Deep Navy Blue (#0a2540) and Safety Gold/Amber (#f59e0b)",
  styleTone: "Authoritative, trustworthy, professional, and conversion-focused",
  googleMaps: "https://maps.google.com/?q=Dallas+TX",
  socialLinks: "Facebook: facebook.com/lonestarplumbing, Yelp: yelp.com/biz/lone-star-plumbing",
  logoUrl: "",
  extraInstructions: "Include top 24/7 emergency dispatch call bar with direct link, 45-minute response guarantee badge, '$50 OFF Any First Service' coupon, and working quote form.",
};

const SUGGESTED_MODELS: Record<string, string[]> = {
  gemini: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash-exp"],
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
  openrouter: [
    "anthropic/claude-3.5-sonnet",
    "meta-llama/llama-3.3-70b-instruct",
    "openai/gpt-4o",
    "deepseek/deepseek-chat",
  ],
  custom: ["llama3", "qwen2.5-coder", "mistral"],
};

export default function HomePage() {
  // Navigation & Modals
  const [keysModalOpen, setKeysModalOpen] = useState(false);
  const [recentModalOpen, setRecentModalOpen] = useState(false);

  // Active Provider & Model
  const [activeProvider, setActiveProvider] = useState<ProviderType>("gemini");
  const [activeModel, setActiveModel] = useState<string>("gemini-1.5-pro");
  const [hasKey, setHasKey] = useState(false);

  // Form Fields
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [servicesOffered, setServicesOffered] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [zipPostalCode, setZipPostalCode] = useState("");
  const [country, setCountry] = useState("USA");
  const [serviceAreas, setServiceAreas] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [businessHours, setBusinessHours] = useState("");
  const [websiteDomain, setWebsiteDomain] = useState("");
  const [targetKeywords, setTargetKeywords] = useState("");
  const [selectedPages, setSelectedPages] = useState<string[]>(DEFAULT_PAGES);
  const [customPageInput, setCustomPageInput] = useState("");
  const [brandColors, setBrandColors] = useState("Trust Navy Blue & Amber Gold");
  const [styleTone, setStyleTone] = useState("Authoritative, trustworthy, and modern");
  const [googleMaps, setGoogleMaps] = useState("");
  const [socialLinks, setSocialLinks] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [extraInstructions, setExtraInstructions] = useState("");

  // Generation State
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Active Generated Project
  const [currentProject, setCurrentProject] = useState<ProjectData | null>(null);

  // Check key in localStorage
  const checkKeyStatus = useCallback(() => {
    const localKey = localStorage.getItem(`altofox_key_${activeProvider}`);
    if (localKey && localKey.trim()) {
      setHasKey(true);
      return;
    }

    // Check server env fallback
    fetch("/api/keys")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.providers)) {
          const providerRecord = d.providers.find((p: { provider: string; hasKey: boolean }) => p.provider === activeProvider);
          setHasKey(!!providerRecord?.hasKey);
        }
      })
      .catch(() => {});
  }, [activeProvider]);

  useEffect(() => {
    checkKeyStatus();
    const storedModel = localStorage.getItem(`altofox_model_${activeProvider}`);
    if (storedModel) {
      setActiveModel(storedModel);
    } else {
      const defaults = SUGGESTED_MODELS[activeProvider];
      if (defaults && defaults[0]) setActiveModel(defaults[0]);
    }
  }, [activeProvider, checkKeyStatus]);

  // Load Example Template
  const handleLoadExample = () => {
    setBusinessName(LOCAL_BUSINESS_EXAMPLE.businessName);
    setBusinessType(LOCAL_BUSINESS_EXAMPLE.businessType);
    setBusinessDescription(LOCAL_BUSINESS_EXAMPLE.businessDescription);
    setServicesOffered(LOCAL_BUSINESS_EXAMPLE.servicesOffered);
    setStreetAddress(LOCAL_BUSINESS_EXAMPLE.streetAddress);
    setCity(LOCAL_BUSINESS_EXAMPLE.city);
    setStateRegion(LOCAL_BUSINESS_EXAMPLE.stateRegion);
    setZipPostalCode(LOCAL_BUSINESS_EXAMPLE.zipPostalCode);
    setCountry(LOCAL_BUSINESS_EXAMPLE.country);
    setServiceAreas(LOCAL_BUSINESS_EXAMPLE.serviceAreas);
    setPhone(LOCAL_BUSINESS_EXAMPLE.phone);
    setEmail(LOCAL_BUSINESS_EXAMPLE.email);
    setBusinessHours(LOCAL_BUSINESS_EXAMPLE.businessHours);
    setWebsiteDomain(LOCAL_BUSINESS_EXAMPLE.websiteDomain);
    setTargetKeywords(LOCAL_BUSINESS_EXAMPLE.targetKeywords);
    setSelectedPages(LOCAL_BUSINESS_EXAMPLE.pagesToCreate);
    setBrandColors(LOCAL_BUSINESS_EXAMPLE.brandColors);
    setStyleTone(LOCAL_BUSINESS_EXAMPLE.styleTone);
    setGoogleMaps(LOCAL_BUSINESS_EXAMPLE.googleMaps);
    setSocialLinks(LOCAL_BUSINESS_EXAMPLE.socialLinks);
    setExtraInstructions(LOCAL_BUSINESS_EXAMPLE.extraInstructions);
    setGenerationError(null);
  };

  // Toggle Page Checkbox
  const togglePage = (page: string) => {
    if (selectedPages.includes(page)) {
      if (selectedPages.length === 1) return; // Keep at least one page
      setSelectedPages(selectedPages.filter((p) => p !== page));
    } else {
      setSelectedPages([...selectedPages, page]);
    }
  };

  const handleAddCustomPage = () => {
    const trimmed = customPageInput.trim();
    if (trimmed && !selectedPages.includes(trimmed)) {
      setSelectedPages([...selectedPages, trimmed]);
      setCustomPageInput("");
    }
  };

  // Handle Generate
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (generating) return;

    // Validate Required Fields
    if (!businessName.trim()) {
      setGenerationError("Please enter your Business / Website Name.");
      return;
    }
    if (!businessType.trim()) {
      setGenerationError("Please enter your Business Type / Industry.");
      return;
    }
    if (!city.trim()) {
      setGenerationError("Please enter your City (required for local website generation).");
      return;
    }
    if (!targetKeywords.trim()) {
      setGenerationError("Please provide at least one target SEO keyword.");
      return;
    }

    const localKey = localStorage.getItem(`altofox_key_${activeProvider}`);
    if (!hasKey && !localKey) {
      setKeysModalOpen(true);
      return;
    }

    setGenerating(true);
    setGenerationError(null);

    const formData = {
      businessName: businessName.trim(),
      businessType: businessType.trim(),
      businessDescription: businessDescription.trim(),
      servicesOffered: servicesOffered.trim(),
      streetAddress: streetAddress.trim(),
      city: city.trim(),
      stateRegion: stateRegion.trim(),
      zipPostalCode: zipPostalCode.trim(),
      country: country.trim(),
      serviceAreas: serviceAreas.trim(),
      phone: phone.trim(),
      email: email.trim(),
      businessHours: businessHours.trim(),
      websiteDomain: websiteDomain.trim(),
      targetKeywords: targetKeywords.trim(),
      pagesToCreate: selectedPages,
      brandColors: brandColors.trim(),
      styleTone: styleTone.trim(),
      googleMaps: googleMaps.trim(),
      socialLinks: socialLinks.trim(),
      logoUrl: logoUrl.trim(),
      extraInstructions: extraInstructions.trim(),
    };

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: activeProvider,
          model: activeModel,
          apiKey: localKey || undefined,
          formData,
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.files)) {
        setCurrentProject({
          projectId: data.projectId,
          name: data.name,
          notes: data.notes,
          provider: data.provider,
          model: data.model,
          files: data.files,
        });
      } else {
        setGenerationError(data.error || "Failed to generate website. Please check your API key or model name.");
      }
    } catch (err) {
      setGenerationError(
        err instanceof Error ? err.message : "Network error generating website."
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Navbar */}
      <Navbar
        onOpenKeys={() => setKeysModalOpen(true)}
        onOpenProjects={() => setRecentModalOpen(true)}
        activeProvider={activeProvider}
        hasKeyForActiveProvider={hasKey}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center py-6">
        {currentProject ? (
          /* Live Preview & Direct Download View */
          <LivePreview
            project={currentProject}
            onNewWebsite={() => setCurrentProject(null)}
          />
        ) : (
          /* Website Builder Form */
          <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Static Website Builder
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
                Connect your AI API key, fill in your business details, and generate a ready-to-run static website with 1-click ZIP download.
              </p>
            </div>

            {/* Quick Actions Row: AI Provider Picker + Load Example Button */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    AI Provider:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(
                      [
                        { id: "gemini", label: "Google Gemini" },
                        { id: "openai", label: "OpenAI" },
                        { id: "openrouter", label: "OpenRouter" },
                        { id: "custom", label: "Custom API" },
                      ] as const
                    ).map((p) => {
                      const isSelected = activeProvider === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setActiveProvider(p.id);
                            const defaults = SUGGESTED_MODELS[p.id];
                            if (defaults && defaults[0]) setActiveModel(defaults[0]);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                            isSelected
                              ? "bg-sky-500/10 border-sky-500 text-sky-300 ring-1 ring-sky-500/40"
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setKeysModalOpen(true)}
                    className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>{hasKey ? "Key Connected ✓" : "Enter API Key"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLoadExample}
                    className="text-xs text-amber-300 hover:text-white flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg transition font-medium"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                    <span>Local Business Example</span>
                  </button>
                </div>
              </div>

              {/* Model Name Input (User can type any model) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-slate-400 whitespace-nowrap font-medium">Model:</span>
                  <input
                    type="text"
                    value={activeModel}
                    onChange={(e) => setActiveModel(e.target.value)}
                    placeholder="Enter any model name (e.g. gemini-1.5-pro, gpt-4o)"
                    className="flex-1 max-w-sm px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-slate-500 text-[11px]">Suggested:</span>
                  {(SUGGESTED_MODELS[activeProvider] || []).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setActiveModel(m)}
                      className={`text-[11px] px-2 py-0.5 rounded border font-mono transition ${
                        activeModel === m
                          ? "bg-sky-500/20 text-sky-300 border-sky-500/50"
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Form Card */}
            <form onSubmit={handleGenerate} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl space-y-5">
              {/* Section 1: Business Identity */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 border-b border-slate-800 pb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> 1. Business Identity
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-300">
                      Business / Website Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Lone Star Plumbing & Rooter"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-300">
                      Business Type / Industry <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      placeholder="e.g. Emergency Plumbing & Drain Cleaning"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Business Description
                  </label>
                  <textarea
                    rows={2}
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                    placeholder="Short description of what the business does, company history, or mission statement..."
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Services Offered (List / comma-separated)
                  </label>
                  <input
                    type="text"
                    value={servicesOffered}
                    onChange={(e) => setServicesOffered(e.target.value)}
                    placeholder="e.g. 24/7 Emergency Repairs, Drain Cleaning, Water Heater Replacement, Leak Detection"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Section 2: Location & Address */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 border-b border-slate-800 pb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> 2. Location & Service Areas
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-xs font-medium text-slate-300">Street Address</label>
                    <input
                      type="text"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      placeholder="e.g. 4512 Main Street"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-300">
                      City <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Dallas"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-300">State / Region</label>
                    <input
                      type="text"
                      value={stateRegion}
                      onChange={(e) => setStateRegion(e.target.value)}
                      placeholder="e.g. TX"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-300">ZIP / Postal Code</label>
                    <input
                      type="text"
                      value={zipPostalCode}
                      onChange={(e) => setZipPostalCode(e.target.value)}
                      placeholder="e.g. 75201"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-300">Country</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g. USA"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Service Areas (Nearby cities or neighborhoods served)
                  </label>
                  <input
                    type="text"
                    value={serviceAreas}
                    onChange={(e) => setServiceAreas(e.target.value)}
                    placeholder="e.g. Dallas, Plano, Frisco, McKinney, Irving, Richardson, Garland"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Section 3: Contact & SEO */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> 3. Contact & Local SEO
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-300">Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. (214) 555-0198"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-300">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. info@example.com"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-300">Business Hours</label>
                    <input
                      type="text"
                      value={businessHours}
                      onChange={(e) => setBusinessHours(e.target.value)}
                      placeholder="e.g. Mon-Sun: 24/7"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-300">Website Domain</label>
                    <input
                      type="text"
                      value={websiteDomain}
                      onChange={(e) => setWebsiteDomain(e.target.value)}
                      placeholder="e.g. www.example.com"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-300">
                      Target Keywords (Comma-separated) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={targetKeywords}
                      onChange={(e) => setTargetKeywords(e.target.value)}
                      placeholder="e.g. emergency plumber in Dallas, 24/7 drain cleaning Dallas TX"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Pages to Create Checkboxes */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 border-b border-slate-800 pb-1 flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5" /> 4. Pages to Create
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {DEFAULT_PAGES.map((page) => {
                    const isChecked = selectedPages.includes(page);
                    return (
                      <button
                        key={page}
                        type="button"
                        onClick={() => togglePage(page)}
                        className={`p-2 rounded-lg border text-xs font-medium flex items-center justify-between transition ${
                          isChecked
                            ? "bg-purple-500/10 border-purple-500 text-purple-300"
                            : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        <span>{page}</span>
                        <span>{isChecked ? "✓" : ""}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Page Input */}
                <div className="flex items-center gap-2 pt-1 max-w-sm">
                  <input
                    type="text"
                    value={customPageInput}
                    onChange={(e) => setCustomPageInput(e.target.value)}
                    placeholder="+ Add custom page (e.g. Pricing, Gallery)"
                    className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomPage}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg border border-slate-700"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Section 5: Brand Styling & Optional Extras */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 border-b border-slate-800 pb-1 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" /> 5. Brand Styling & Extras
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-300">Brand Colors</label>
                    <input
                      type="text"
                      value={brandColors}
                      onChange={(e) => setBrandColors(e.target.value)}
                      placeholder="e.g. Deep Navy Blue (#0a2540) and Amber Gold"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-300">Style & Tone</label>
                    <input
                      type="text"
                      value={styleTone}
                      onChange={(e) => setStyleTone(e.target.value)}
                      placeholder="e.g. Authoritative, trustworthy, modern"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-300">Logo Image URL (Optional)</label>
                    <input
                      type="text"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-300">Google Maps Link/Embed (Optional)</label>
                    <input
                      type="text"
                      value={googleMaps}
                      onChange={(e) => setGoogleMaps(e.target.value)}
                      placeholder="Google Maps URL or embed"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-300">Social Media Links (Optional)</label>
                    <input
                      type="text"
                      value={socialLinks}
                      onChange={(e) => setSocialLinks(e.target.value)}
                      placeholder="Facebook, Instagram, Yelp links"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-300">Extra Instructions (Free text)</label>
                  <textarea
                    rows={2}
                    value={extraInstructions}
                    onChange={(e) => setExtraInstructions(e.target.value)}
                    placeholder="e.g. Include a $50 off coupon banner, 100% satisfaction guarantee badge, and emergency dispatch hours..."
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Error Banner */}
              {generationError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-xs">
                  {generationError}
                </div>
              )}

              {/* Submit Button with Loading State */}
              <button
                type="submit"
                disabled={generating}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:transform-none flex items-center justify-center space-x-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating your website…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Website</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Modals */}
      <ApiKeyModal
        isOpen={keysModalOpen}
        onClose={() => setKeysModalOpen(false)}
        onKeysUpdated={checkKeyStatus}
      />
      <RecentProjectsModal
        isOpen={recentModalOpen}
        onClose={() => setRecentModalOpen(false)}
        onSelectProject={(id) => {
          fetch(`/api/projects/${id}`)
            .then((r) => r.json())
            .then((d) => {
              if (d.success && d.project) {
                setCurrentProject(d.project);
              }
            })
            .catch(() => {});
        }}
      />
    </div>
  );
}
