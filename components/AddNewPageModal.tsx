"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  FilePlus,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Layers,
  Search,
  ShieldCheck,
} from "lucide-react";
import { SavedProject } from "@/lib/storage/project-types";
import {
  checkPageCannibalization,
  mapQueryToServiceAndLocation,
  generatePageSlug,
  generatePageTitle,
  detectSearchIntent,
  SearchIntentType,
  CannibalizationCheckResult,
} from "@/lib/seo/opportunity-engine";
import { normalizePageSlug } from "@/lib/generator/page-creator";

export interface AddNewPageInitialData {
  primaryQuery?: string;
  serviceName?: string;
  locationCity?: string;
  locationState?: string;
  searchIntent?: SearchIntentType;
  title?: string;
  slug?: string;
  relatedQueries?: string[];
  impressions?: number;
  position?: number;
}

interface AddNewPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: SavedProject;
  initialData?: AddNewPageInitialData | null;
  onPageCreated: (updatedProject: SavedProject, newPagePath: string) => void;
  onSelectExistingPage?: (pagePath: string) => void;
}

export function AddNewPageModal({
  isOpen,
  onClose,
  project,
  initialData,
  onPageCreated,
  onSelectExistingPage,
}: AddNewPageModalProps) {
  const [primaryQuery, setPrimaryQuery] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [locationState, setLocationState] = useState("");
  const [searchIntent, setSearchIntent] = useState<SearchIntentType>("transactional");
  const [pageTitle, setPageTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [relatedQueriesInput, setRelatedQueriesInput] = useState("");
  const [navPlacement, setNavPlacement] = useState<
    "contextual_only" | "main_nav" | "service_submenu" | "footer_only"
  >("contextual_only");

  const [overrideCannibalization, setOverrideCannibalization] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize or reset form state whenever modal opens or initialData changes
  useEffect(() => {
    if (!isOpen) return;

    if (initialData?.primaryQuery) {
      setPrimaryQuery(initialData.primaryQuery);
      const mapped = mapQueryToServiceAndLocation(
        initialData.primaryQuery,
        project.formData?.businessType,
        (project.serviceAreaCities || []).map((c) => c.city)
      );

      const resolvedService = initialData.serviceName || mapped.serviceName;
      const resolvedCity = initialData.locationCity || mapped.locationCity || project.formData?.city || "";
      const resolvedState = initialData.locationState || project.formData?.stateRegion || "";

      setServiceName(resolvedService);
      setLocationCity(resolvedCity);
      setLocationState(resolvedState);
      setSearchIntent(initialData.searchIntent || detectSearchIntent(initialData.primaryQuery));

      const derivedSlug = initialData.slug || generatePageSlug(resolvedService, resolvedCity);
      const derivedTitle = initialData.title || generatePageTitle(resolvedService, resolvedCity, project.formData?.businessName || project.name);

      setSlug(derivedSlug);
      setPageTitle(derivedTitle);

      if (initialData.relatedQueries && initialData.relatedQueries.length > 0) {
        setRelatedQueriesInput(initialData.relatedQueries.join(", "));
      } else {
        setRelatedQueriesInput("");
      }
    } else {
      // Clean default state
      const defaultCity = project.formData?.city || "";
      const defaultState = project.formData?.stateRegion || "";
      const defaultService = project.formData?.businessType || "";

      setPrimaryQuery("");
      setServiceName(defaultService);
      setLocationCity(defaultCity);
      setLocationState(defaultState);
      setSearchIntent("transactional");
      setSlug("");
      setPageTitle("");
      setRelatedQueriesInput("");
    }

    setOverrideCannibalization(false);
    setErrorMsg(null);
  }, [isOpen, initialData, project]);

  // Handle user typing primary query: auto-fill service, title, and slug if blank
  const handleQueryChange = (q: string) => {
    setPrimaryQuery(q);
    if (!initialData?.slug && q.length > 3) {
      const mapped = mapQueryToServiceAndLocation(
        q,
        project.formData?.businessType,
        (project.serviceAreaCities || []).map((c) => c.city)
      );
      const city = locationCity || mapped.locationCity || project.formData?.city || "";
      setServiceName(mapped.serviceName);
      setSearchIntent(detectSearchIntent(q));
      setSlug(generatePageSlug(mapped.serviceName, city));
      setPageTitle(generatePageTitle(mapped.serviceName, city, project.formData?.businessName || project.name));
    }
  };

  // Live Cannibalization Check
  const cannibalization: CannibalizationCheckResult = useMemo(() => {
    if (!primaryQuery && !slug && !serviceName) {
      return { hasRisk: false, severity: "none" };
    }

    const normSlug = slug ? normalizePageSlug(slug) : "";
    return checkPageCannibalization(
      {
        query: primaryQuery,
        serviceName,
        locationCity,
        slug: normSlug,
        title: pageTitle,
      },
      project.files || [],
      project.keywordMap || []
    );
  }, [primaryQuery, serviceName, locationCity, slug, pageTitle, project.files, project.keywordMap]);

  if (!isOpen) return null;

  const handleCreatePage = async (forceOverride = false) => {
    if (!primaryQuery.trim()) {
      setErrorMsg("Please provide a primary target query.");
      return;
    }
    if (!serviceName.trim()) {
      setErrorMsg("Please specify the service name.");
      return;
    }
    if (!slug.trim()) {
      setErrorMsg("Please provide a URL slug (e.g. emergency-plumber-dallas.html).");
      return;
    }

    if (cannibalization.hasRisk && !overrideCannibalization && !forceOverride) {
      setErrorMsg("Please address the keyword cannibalization warning before proceeding.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const relatedQueries = relatedQueriesInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    // Retrieve AI provider configuration from localStorage if available
    let storedProvider = "custom";
    let storedKey = "";
    let storedModel = "";
    let storedBaseUrl = "";
    try {
      const savedProvider = localStorage.getItem("altofox_ai_provider");
      if (savedProvider) storedProvider = savedProvider;
      const key = localStorage.getItem(`altofox_api_key_${storedProvider}`);
      if (key) storedKey = key;
      const model = localStorage.getItem(`altofox_model_${storedProvider}`);
      if (model) storedModel = model;
      const base = localStorage.getItem(`altofox_base_url_${storedProvider}`);
      if (base) storedBaseUrl = base;
    } catch {}

    try {
      const res = await fetch("/api/pages/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          project,
          force: overrideCannibalization || forceOverride,
          pageData: {
            primaryQuery: primaryQuery.trim(),
            serviceName: serviceName.trim(),
            locationCity: locationCity.trim() || undefined,
            locationState: locationState.trim() || undefined,
            searchIntent,
            title: pageTitle.trim() || generatePageTitle(serviceName, locationCity, project.name),
            slug: normalizePageSlug(slug),
            relatedQueries,
            navPlacement,
            customContentInstructions:
              project.customContentInstructions || project.formData?.customContentInstructions,
          },
          provider: storedProvider,
          apiKey: storedKey || undefined,
          model: storedModel || undefined,
          baseUrl: storedBaseUrl || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.cannibalizationWarning) {
          setErrorMsg(data.error || "A potential cannibalization conflict was detected.");
        } else {
          setErrorMsg(data.error || "Failed to create dedicated page.");
        }
        setIsSubmitting(false);
        return;
      }

      // Success! Pass updated project to parent
      onPageCreated(data.updatedProject, data.newPagePath);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Network error while creating page.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <FilePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center space-x-2">
                <span>Add Dedicated Page to Website</span>
                {initialData?.primaryQuery && (
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full">
                    GSC Opportunity
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Create a high-ranking dedicated landing page with automated internal linking and sitemap integration.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Cannibalization Warning Banner */}
          {cannibalization.hasRisk && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-amber-900 animate-in fade-in">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-amber-950 block">
                    Potential Keyword Cannibalization Detected
                  </span>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    {cannibalization.reason}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between gap-3">
                {cannibalization.conflictingPage && onSelectExistingPage ? (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectExistingPage(cannibalization.conflictingPage!);
                      onClose();
                    }}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition"
                  >
                    <span>Edit &amp; Improve Existing Page ({cannibalization.conflictingPage})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="text-[11px] text-amber-800">
                    Existing page: <code>{cannibalization.conflictingPage}</code>
                  </span>
                )}

                <label className="flex items-center space-x-2 cursor-pointer text-amber-900 font-semibold select-none">
                  <input
                    type="checkbox"
                    checked={overrideCannibalization}
                    onChange={(e) => setOverrideCannibalization(e.target.checked)}
                    className="rounded border-amber-400 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Create New Page Anyway</span>
                </label>
              </div>
            </div>
          )}

          {/* Row 1: Target Query */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Primary Target Query <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={primaryQuery}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="e.g. tankless water heater installation beaverton"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              The high-intent search query discovered from Google Search Console or market demand.
            </p>
          </div>

          {/* Row 2: Service & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block font-semibold text-slate-700 mb-1">
                Service Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="e.g. Tankless Water Heaters"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                City / Suburb
              </label>
              <input
                type="text"
                value={locationCity}
                onChange={(e) => setLocationCity(e.target.value)}
                placeholder="e.g. Beaverton"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                State
              </label>
              <input
                type="text"
                value={locationState}
                onChange={(e) => setLocationState(e.target.value)}
                placeholder="e.g. OR"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Row 3: Search Intent */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Search Intent Classification
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSearchIntent("transactional")}
                className={`py-2 px-3 text-center rounded-lg border text-xs font-semibold transition ${
                  searchIntent === "transactional"
                    ? "bg-indigo-50 border-indigo-600 text-indigo-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span>Transactional / Hire</span>
                <span className="block text-[10px] font-normal text-slate-500 mt-0.5">Emergency, repair, cost</span>
              </button>

              <button
                type="button"
                onClick={() => setSearchIntent("commercial")}
                className={`py-2 px-3 text-center rounded-lg border text-xs font-semibold transition ${
                  searchIntent === "commercial"
                    ? "bg-indigo-50 border-indigo-600 text-indigo-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span>Commercial Evaluation</span>
                <span className="block text-[10px] font-normal text-slate-500 mt-0.5">Best, reviews, ratings</span>
              </button>

              <button
                type="button"
                onClick={() => setSearchIntent("informational")}
                className={`py-2 px-3 text-center rounded-lg border text-xs font-semibold transition ${
                  searchIntent === "informational"
                    ? "bg-indigo-50 border-indigo-600 text-indigo-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span>Informational Guide</span>
                <span className="block text-[10px] font-normal text-slate-500 mt-0.5">How-to, causes, tips</span>
              </button>
            </div>
          </div>

          {/* Row 4: Page Title & Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Suggested Page Title (&lt;title&gt;) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
                placeholder="e.g. Tankless Water Heater Installation Beaverton - Fast Pros"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                URL / Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. tankless-water-heater-beaverton.html"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono text-[11px]"
              />
            </div>
          </div>

          {/* Row 5: Related Queries */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Related Queries / Keyword Variations (Optional, comma-separated)
            </label>
            <input
              type="text"
              value={relatedQueriesInput}
              onChange={(e) => setRelatedQueriesInput(e.target.value)}
              placeholder="e.g. tankless water heater repair, on-demand water heater cost, water heater replacement"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              These will be naturally covered inside the page headings, FAQs, and diagnostic sections.
            </p>
          </div>

          {/* Row 6: Navigation Placement */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <label className="block font-bold text-slate-800">
              Navigation &amp; Internal Linking Placement
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-start space-x-2.5 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer">
                <input
                  type="radio"
                  name="navPlacement"
                  value="contextual_only"
                  checked={navPlacement === "contextual_only"}
                  onChange={() => setNavPlacement("contextual_only")}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-semibold text-slate-800 block">Contextual Links Only</span>
                  <span className="text-[10px] text-slate-500">
                    Recommended for local niche &amp; long-tail pages. Linked from relevant service &amp; city pages.
                  </span>
                </div>
              </label>

              <label className="flex items-start space-x-2.5 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer">
                <input
                  type="radio"
                  name="navPlacement"
                  value="main_nav"
                  checked={navPlacement === "main_nav"}
                  onChange={() => setNavPlacement("main_nav")}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-semibold text-slate-800 block">Main Navigation Bar</span>
                  <span className="text-[10px] text-slate-500">
                    Appends link directly into the primary top navigation across existing pages.
                  </span>
                </div>
              </label>

              <label className="flex items-start space-x-2.5 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer">
                <input
                  type="radio"
                  name="navPlacement"
                  value="service_submenu"
                  checked={navPlacement === "service_submenu"}
                  onChange={() => setNavPlacement("service_submenu")}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-semibold text-slate-800 block">Services Dropdown Submenu</span>
                  <span className="text-[10px] text-slate-500">
                    Appends link inside the existing services dropdown list on all pages.
                  </span>
                </div>
              </label>

              <label className="flex items-start space-x-2.5 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer">
                <input
                  type="radio"
                  name="navPlacement"
                  value="footer_only"
                  checked={navPlacement === "footer_only"}
                  onChange={() => setNavPlacement("footer_only")}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-semibold text-slate-800 block">Footer Links Only</span>
                  <span className="text-[10px] text-slate-500">
                    Appends link inside the footer navigation list across all pages.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Updates sitemap.xml and builds incoming &amp; outgoing internal links</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 font-semibold transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleCreatePage(false)}
              disabled={isSubmitting || (cannibalization.hasRisk && !overrideCannibalization)}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold transition shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating Page...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Create Dedicated Page</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
