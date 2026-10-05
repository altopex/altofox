"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { BRAND } from "@/config/brand";
import nextDynamic from "next/dynamic";
import { TopBar } from "@/components/TopBar";
import { ToastContainer, ToastMessage } from "@/components/Toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { ProjectData } from "@/components/LivePreview";

const SettingsPanel = nextDynamic(
  () => import("@/components/SettingsPanel").then((mod) => mod.SettingsPanel),
  { ssr: false }
);

const LivePreview = nextDynamic(
  () => import("@/components/LivePreview").then((mod) => mod.LivePreview),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center p-12 space-y-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500 font-medium">Preparing Live Website Preview…</span>
      </div>
    ),
  }
);
import { ProviderType, PROVIDER_PRESETS } from "@/lib/ai/types";
import {
  GenerationStageName,
  GenerationFailureStage,
  GENERATION_STAGES,
  STAGE_CONFIG,
  PipelineState,
} from "@/lib/pipeline/generation-pipeline";
import {
  THEMES,
  getThemeById,
  getRecommendedThemeIds,
  resolveThemeColors,
  CustomThemeOverrides,
  Theme,
} from "@/lib/themes";
import { ThemeMiniPreview } from "@/components/ThemeMiniPreview";
import { ThemePreviewModal } from "@/components/ThemePreviewModal";
import {
  findNicheByIndustry,
  generateKeywordsForNiche,
  NichePack,
} from "@/niches";
import {
  parseKeywordList,
  formatKeywordsForStorage,
  validateKeywordList,
  parseLocationList,
  parseTagList,
  formatLocationsForStorage,
} from "@/lib/keywords/keyword-parser";
import {
  Sparkles,
  Key,
  Loader2,
  Building2,
  MapPin,
  FileText,
  Palette,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
  Lightbulb,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ShieldCheck,
  Check,
  Globe,
  Phone,
  Mail,
  Clock,
  Layers,
  Star,
  Image as ImageIcon,
  DollarSign,
  BookOpen,
  FolderKanban,
  FileEdit,
  Search,
  Eye,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Zap,
  Lock,
} from "lucide-react";
import type { SelectedServiceCity } from "@/components/ServiceAreaPicker";
import type { KeywordMapEntry } from "@/components/KeywordMapModal";

const ServiceAreaPicker = nextDynamic(
  () => import("@/components/ServiceAreaPicker").then((mod) => mod.ServiceAreaPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center p-12 space-y-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500 font-medium">Loading Interactive Service Areas & Map…</span>
      </div>
    ),
  }
);

const ProjectsDashboard = nextDynamic(
  () => import("@/components/ProjectsDashboard").then((mod) => mod.ProjectsDashboard),
  { ssr: false }
);

const WebsiteManager = nextDynamic(
  () => import("@/components/WebsiteManager").then((mod) => mod.WebsiteManager),
  { ssr: false }
);

const KeywordMapModal = nextDynamic(
  () => import("@/components/KeywordMapModal").then((mod) => mod.KeywordMapModal),
  { ssr: false }
);

const FindReplaceModal = nextDynamic(
  () => import("@/components/FindReplaceModal").then((mod) => mod.FindReplaceModal),
  { ssr: false }
);

const BlogManager = nextDynamic(
  () => import("@/components/BlogManager").then((mod) => mod.BlogManager),
  { ssr: false }
);

const ThemesGallery = nextDynamic(
  () => import("@/components/ThemesGallery").then((mod) => mod.ThemesGallery),
  { ssr: false }
);

const InternalLinkingDashboard = nextDynamic(
  () => import("@/components/InternalLinkingDashboard").then((mod) => mod.InternalLinkingDashboard),
  { ssr: false }
);

const RecommendationFixPanel = nextDynamic(
  () => import("@/components/editor/RecommendationFixPanel").then((mod) => mod.RecommendationFixPanel),
  { ssr: false }
);

import { auditPageSEO, suggestKeywordsForPage } from "@/lib/seo/on-page-scorer";
import { analyzeHtmlRecommendations, BuilderRecommendation } from "@/lib/recommendations/recommendation-engine";
import { applyRecommendationFix, applyAllRecommendations } from "@/lib/recommendations/fix-applier";
import { SavedProject, ProjectKeywordItem } from "@/lib/storage/project-types";
import {
  saveProjectToDB,
  getAllProjectsFromDB,
  getProjectByIdFromDB,
  deleteProjectFromDB,
  duplicateProjectInDB,
} from "@/lib/storage/db";
import { ensureProjectVersions } from "@/lib/storage/project-versions";
import { AppShell, NavTab } from "@/components/navigation/AppShell";
import { useAuth } from "@/lib/auth/AuthContext";
import { normalizeModelForProvider } from "@/lib/ai/provider-models";
import { GenerationDecisionModal } from "@/components/GenerationDecisionModal";

const LoginCard = nextDynamic(
  () => import("@/components/auth/LoginCard").then((mod) => mod.LoginCard),
  { ssr: false }
);

const TeamDashboard = nextDynamic(
  () => import("@/components/dashboard/TeamDashboard").then((mod) => mod.TeamDashboard),
  { ssr: false }
);

const TeamManagement = nextDynamic(
  () => import("@/components/team/TeamManagement").then((mod) => mod.TeamManagement),
  { ssr: false }
);

const ChatGenerator = nextDynamic(
  () => import("@/components/chat-generator/ChatGenerator").then((mod) => mod.ChatGenerator),
  { ssr: false }
);

const ActivityFeed = nextDynamic(
  () => import("@/components/activity/ActivityFeed").then((mod) => mod.ActivityFeed),
  { ssr: false }
);

const ImportLocalDataModal = nextDynamic(
  () => import("@/components/migration/ImportLocalDataModal").then((mod) => mod.ImportLocalDataModal),
  { ssr: false }
);

// Popular Local Business Types (Featuring 20 Trade Niche Packs)
const POPULAR_INDUSTRIES = [
  "Plumber",
  "Electrician",
  "HVAC",
  "Roofing",
  "Tree Service",
  "Landscaping & Lawn Care",
  "House Cleaning",
  "Pest Control",
  "Pressure Washing",
  "Painting",
  "Handyman",
  "General Contractor",
  "Locksmith",
  "Garage Door Repair",
  "Moving Company",
  "Auto Repair",
  "Towing",
  "Pool Service",
  "Junk Removal",
  "Carpet Cleaning",
  "Dentist & Orthodontics",
  "Restaurant & Cafe",
  "Hair Salon & Barbershop",
  "Law Firm & Attorney",
  "Real Estate Agency",
  "Other (Custom)",
];

// Available Pages in Step 3
interface PageOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  defaultIncluded: boolean;
  required?: boolean;
}

const AVAILABLE_PAGES: PageOption[] = [
  {
    id: "Home",
    name: "Home",
    description: "Main landing page with hero, services overview, and call-to-action.",
    icon: <Building2 className="w-4 h-4 text-[#4F46E5]" />,
    defaultIncluded: true,
    required: true,
  },
  {
    id: "About",
    name: "About Us",
    description: "Company story, licensed credentials, values, and trust badges.",
    icon: <FileText className="w-4 h-4 text-[#4F46E5]" />,
    defaultIncluded: true,
  },
  {
    id: "Services",
    name: "Services",
    description: "Detailed service descriptions, pricing notes, and process steps.",
    icon: <Layers className="w-4 h-4 text-[#4F46E5]" />,
    defaultIncluded: true,
  },
  {
    id: "Contact",
    name: "Contact",
    description: "Interactive quote request form, Google Map, and full NAP info.",
    icon: <Phone className="w-4 h-4 text-[#4F46E5]" />,
    defaultIncluded: true,
  },
  {
    id: "FAQ",
    name: "FAQ",
    description: "Interactive accordion answering common customer questions.",
    icon: <Lightbulb className="w-4 h-4 text-[#4F46E5]" />,
    defaultIncluded: true,
  },
  {
    id: "Service Areas",
    name: "Service Areas",
    description: "Dedicated regional coverage details for local neighborhood SEO.",
    icon: <MapPin className="w-4 h-4 text-[#4F46E5]" />,
    defaultIncluded: true,
  },
  {
    id: "Reviews",
    name: "Reviews",
    description: "Customer testimonials, 5-star badges, and feedback quotes.",
    icon: <Star className="w-4 h-4 text-[#4F46E5]" />,
    defaultIncluded: false,
  },
  {
    id: "Gallery",
    name: "Gallery",
    description: "Project showcase grid and recent completed work photos.",
    icon: <ImageIcon className="w-4 h-4 text-[#4F46E5]" />,
    defaultIncluded: false,
  },
  {
    id: "Pricing",
    name: "Pricing & Estimates",
    description: "Upfront pricing tiers, coupons, and estimate breakdown.",
    icon: <DollarSign className="w-4 h-4 text-[#4F46E5]" />,
    defaultIncluded: false,
  },
  {
    id: "Blog",
    name: "Blog / Tips",
    description: "Helpful homeowner maintenance articles for content marketing.",
    icon: <BookOpen className="w-4 h-4 text-[#4F46E5]" />,
    defaultIncluded: false,
  },
];

// Local Business Example template
const EXAMPLE_DATA = {
  businessName: "Lone Star Plumbing & Rooter",
  businessType: "Plumber",
  businessDescription:
    "Family-owned residential and commercial plumbing company providing 24/7 fast-dispatch repairs, drain clearing, and water heater installation across Dallas-Fort Worth.",
  services: [
    "24/7 Emergency Plumbing",
    "Hydro-Jetting Drain Cleaning",
    "Water Heater Repair & Install",
    "Slab Leak Detection",
    "Sewer Camera Inspection",
  ],
  streetAddress: "4512 Main Street",
  city: "Dallas",
  stateRegion: "TX",
  zipPostalCode: "75201",
  country: "USA",
  serviceAreas: ["Plano", "Frisco", "McKinney", "Irving", "Richardson"],
  phone: "(214) 555-0198",
  email: "dispatch@lonestarplumbingdfw.com",
  businessHours: "Monday - Sunday: 24/7 Emergency Dispatch",
  websiteDomain: "www.lonestarplumbingdfw.com",
  keywords: [
    "emergency plumber in Dallas TX",
    "24/7 drain cleaning Dallas",
    "water heater repair Dallas TX",
    "slab leak detection",
    "licensed plumbers near me",
  ],
  pages: ["Home", "About", "Services", "Contact", "FAQ", "Service Areas"],
  selectedThemeId: "pipe-and-wrench",
  logoUrl: "",
  yearsInBusiness: "20+",
  uniqueSellingPoints: "45-min arrival, upfront flat rates, licensed master technicians",
  separateServicePages: true,
  separateAreaPages: true,
  layoutStyle: "Conversion",
  imageProvider: "Bing",
  blogPostsCount: 3,
  googleMaps: "https://maps.google.com/?q=Dallas+TX",
  socialLinks: "Facebook: facebook.com/lonestarplumbing",
};

export default function DashboardPage() {
  const { user, profile, isOwner, isApproved, loading: authLoading } = useAuth();
  const [navTab, setNavTab] = useState<NavTab>("dashboard");
  const [isImportLocalModalOpen, setIsImportLocalModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginModalReason, setLoginModalReason] = useState<string | null>(null);

  // Navigation & View Mode State ("builder" | "dashboard" | "manager")
  const [viewMode, setViewMode] = useState<"builder" | "dashboard" | "manager">("builder");
  const [savedProjectsList, setSavedProjectsList] = useState<SavedProject[]>([]);
  const [activeSavedProject, setActiveSavedProject] = useState<SavedProject | null>(null);

  // Wizard Step State (1: Business, 2: Location/SEO, 3: Service Areas, 4: Pages, 5: Theme, 6: Generate)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [maxCompletedStep, setMaxCompletedStep] = useState<number>(1);

  // Advanced Tools Modals
  const [keywordMapOpen, setKeywordMapOpen] = useState(false);
  const [findReplaceOpen, setFindReplaceOpen] = useState(false);
  const [blogManagerOpen, setBlogManagerOpen] = useState(false);
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);

  // Service Areas State (Step 3)
  const [serviceAreaCities, setServiceAreaCities] = useState<SelectedServiceCity[]>([]);
  const [createSeparateServiceLocationPages, setCreateSeparateServiceLocationPages] = useState(true);
  const [confirmedServesAreas, setConfirmedServesAreas] = useState(false);

  // Settings Panel State
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"models" | "images" | "preferences" | "cloudflare" | "hosting">("models");
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  // Sub-tabs for AI / Generator and Optimization hubs
  const [generatorSubTab, setGeneratorSubTab] = useState<"builder" | "chat" | "themes">("builder");
  const [optimizationSubTab, setOptimizationSubTab] = useState<"checker" | "linking" | "activity">("checker");
  const [selectedOptProjectId, setSelectedOptProjectId] = useState<string>("");

  const handleOpenSettings = (
    tab: "models" | "images" | "preferences" | "cloudflare" | "hosting" = "models",
    message: string | null = null
  ) => {
    setSettingsTab(tab);
    setSettingsMessage(message);
    setSettingsOpen(true);
  };

  // Active Provider & Model
  const [activeProvider, setActiveProvider] = useState<ProviderType>("gemini");
  const [activeModel, setActiveModel] = useState<string>("gemini-3.8-flash");
  const [availableModelsForActiveProvider, setAvailableModelsForActiveProvider] = useState<string[]>([]);
  const [hasKey, setHasKey] = useState(false);

  // Form Fields State
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("Plumber");
  const [customBusinessType, setCustomBusinessType] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [services, setServices] = useState<string[]>([
    "24/7 Emergency Repairs",
    "Drain Cleaning & Rooter",
    "Water Heater Installation",
  ]);
  const [serviceInput, setServiceInput] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [yearsInBusiness, setYearsInBusiness] = useState("");
  const [uniqueSellingPoints, setUniqueSellingPoints] = useState("");
  const [customContentInstructions, setCustomContentInstructions] = useState("");

  // Step 2 Fields
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [zipPostalCode, setZipPostalCode] = useState("");
  const [country, setCountry] = useState("USA");
  const [serviceAreas, setServiceAreas] = useState<string[]>([]);
  const [areaInput, setAreaInput] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [businessHours, setBusinessHours] = useState("Monday - Sunday: 24/7 Emergency Dispatch");
  const [websiteDomain, setWebsiteDomain] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [googleMaps, setGoogleMaps] = useState("");
  const [socialLinks, setSocialLinks] = useState("");
  const [showCollapsibleSeo, setShowCollapsibleSeo] = useState(false);

  // Step 3 Fields
  const [selectedPages, setSelectedPages] = useState<string[]>([
    "Home",
    "About",
    "Services",
    "Contact",
    "FAQ",
    "Service Areas",
  ]);
  const [separateServicePages, setSeparateServicePages] = useState(true);
  const [separateAreaPages, setSeparateAreaPages] = useState(true);

  // Step 7 Theme Fields
  const [selectedThemeId, setSelectedThemeId] = useState<string>("pipe-and-wrench");
  const [customThemeColors, setCustomThemeColors] = useState<CustomThemeOverrides>({});
  const [previewModalTheme, setPreviewModalTheme] = useState<Theme | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Step 8 Generation Settings Fields
  const [layoutStyle, setLayoutStyle] = useState<string>("Conversion");
  const [imageProvider, setImageProvider] = useState<string>("Bing");
  const [blogPostsCount, setBlogPostsCount] = useState<number>(3);
  const [isEditBlueprintOpen, setIsEditBlueprintOpen] = useState<boolean>(false);

  // Deterministic Targeting Lock & Pipeline Activity State
  const [targetingLocked, setTargetingLocked] = useState(true);
  const [generationLogs, setGenerationLogs] = useState<
    Array<{ id: string; time: string; message: string; type?: "info" | "warn" | "error" | "success" }>
  >([]);
  const [retryCount, setRetryCount] = useState(0);
  const lockedSnapshotRef = useRef<any>(null);

  const addGenLog = useCallback(
    (message: string, type: "info" | "warn" | "error" | "success" = "info") => {
      const time = new Date().toLocaleTimeString("en-US", { hour12: false });
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setGenerationLogs((prev) => [...prev, { id, time, message, type }]);
    },
    []
  );

  // Step Validation Errors
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  // Generation & Results State
  const [generating, setGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState<
    "IDLE" | GenerationStageName | GenerationFailureStage | "FAILED" | "PREVIEW_READY"
  >("IDLE");
  const [activePipeline, setActivePipeline] = useState<PipelineState | null>(null);
  const [generationError, setGenerationError] = useState<{
    message: string;
    canFallback: boolean;
    failedStage?: GenerationFailureStage | string;
  } | null>(null);
  const [generationProgressText, setGenerationProgressText] = useState("Planning your pages…");
  const [generationPercent, setGenerationPercent] = useState(10);
  const [isGenerationTakingLong, setIsGenerationTakingLong] = useState(false);
  const [generationElapsedSeconds, setGenerationElapsedSeconds] = useState(0);
  const [currentProject, setCurrentProject] = useState<ProjectData | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const generationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastFormDataRef = useRef<any>(null);

  // Post-Generation Storage Decision State (Default: Ephemeral Preview & Download; Explicit Choice to Save)
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [pendingGeneratedSite, setPendingGeneratedSite] = useState<any>(null);
  const [isSavingDecisionProject, setIsSavingDecisionProject] = useState(false);
  const [isCurrentProjectSaved, setIsCurrentProjectSaved] = useState(false);

  // Image Key States
  const [hasImageKey, setHasImageKey] = useState(false);
  const [imageKeySource, setImageKeySource] = useState<string>("");
  const [dismissImageNotice, setDismissImageNotice] = useState(false);

  // Quality Review State
  const [qualityReviewEnabled, setQualityReviewEnabled] = useState(true);

  // Toasts Notification State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Check Local Storage API Key & Wizard Cache
  const checkKeyStatus = useCallback(() => {
    const storedProvider = (localStorage.getItem("altofox_active_provider") as ProviderType) || "gemini";
    const localKey = localStorage.getItem(`altofox_key_${storedProvider}`);

    if (localKey && localKey.trim()) {
      setActiveProvider(storedProvider);
      setHasKey(true);
      const storedModel =
        localStorage.getItem("altofox_active_model") ||
        localStorage.getItem(`altofox_model_${storedProvider}`);
      if (storedModel) {
        setActiveModel(normalizeModelForProvider(storedProvider, storedModel));
      }
    } else {
    // Check if any other provider has a saved key in local storage
      const allProviders: ProviderType[] = ["openai", "gemini", "deepseek", "anthropic", "groq", "openrouter", "custom"];
      const fallback = allProviders.find((p) => {
        const k = localStorage.getItem(`altofox_key_${p}`);
        return !!(k && k.trim());
      });

      if (fallback) {
        localStorage.setItem("altofox_active_provider", fallback);
        setActiveProvider(fallback);
        setHasKey(true);
        const m =
          localStorage.getItem("altofox_active_model") ||
          localStorage.getItem(`altofox_model_${fallback}`);
        if (m) {
          setActiveModel(normalizeModelForProvider(fallback, m));
        }
      } else {
        setActiveProvider(storedProvider);
        setHasKey(false);
      }
    }

    // Also asynchronously verify server-stored keys so server-configured models work seamlessly
    fetch("/api/keys")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success) {
          const serverProviders = Array.isArray(data.providers) ? data.providers : [];
          const serverProfiles = Array.isArray(data.profiles) ? data.profiles : [];
          const activeServerKey = serverProviders.find((p: any) => p.hasKey) || serverProfiles.find((p: any) => p.hasKey);

          if (activeServerKey) {
            setHasKey(true);
            const activeId = data.settings?.activeProviderId;
            const activeProf = serverProfiles.find((p: any) => p.id === activeId && p.hasKey);
            if (activeProf?.presetId) {
              const pType = activeProf.presetId as ProviderType;
              setActiveProvider(pType);
              const localExplicitModel = localStorage.getItem("altofox_active_model") || localStorage.getItem(`altofox_model_${pType}`);
              if (!localExplicitModel && activeProf.model) {
                setActiveModel(normalizeModelForProvider(pType, activeProf.model));
              }
            } else if (activeServerKey.provider) {
              const pType = activeServerKey.provider as ProviderType;
              setActiveProvider(pType);
              const localExplicitModel = localStorage.getItem("altofox_active_model") || localStorage.getItem(`altofox_model_${pType}`);
              if (!localExplicitModel && activeServerKey.defaultModel) {
                setActiveModel(normalizeModelForProvider(pType, activeServerKey.defaultModel));
              }
            }
          }
        }
      })
      .catch(() => {});
    // Check Image API Keys
    const pexels = localStorage.getItem("altofox_pexels_key");
    const pixabay = localStorage.getItem("altofox_pixabay_key");
    const google = localStorage.getItem("altofox_google_search_key");
    const hasImg = !!((pexels && pexels.trim()) || (pixabay && pixabay.trim()) || (google && google.trim()));
    setHasImageKey(hasImg);
    const activeSources: string[] = [];
    if (google) activeSources.push("Google");
    if (pexels) activeSources.push("Pexels");
    if (pixabay) activeSources.push("Pixabay");
    setImageKeySource(activeSources.join(" & ") || "");
  }, []);

  // Fetch live available models for active provider whenever provider or key changes
  useEffect(() => {
    if (hasKey && activeProvider) {
      const localKey = localStorage.getItem(`altofox_key_${activeProvider}`);
      const keyParam = localKey ? `&apiKey=${encodeURIComponent(localKey)}` : "";
      fetch(`/api/keys/models?provider=${activeProvider}${keyParam}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.success && Array.isArray(data.models) && data.models.length > 0) {
            setAvailableModelsForActiveProvider(data.models);
          }
        })
        .catch(() => {});
    }
  }, [activeProvider, hasKey]);

  // Apply user preferences (default country, theme, quality review)
  const applyPreferences = useCallback(() => {
    const prefCountry = localStorage.getItem("altofox_pref_country");
    if (prefCountry) {
      setCountry((prev) => (!prev || prev === "USA" ? prefCountry : prev));
    }
    const prefTheme = localStorage.getItem("altofox_pref_theme");
    if (prefTheme) {
      setSelectedThemeId((prev) => (!prev || prev === "modern-indigo" ? prefTheme : prev));
    }
    const prefReview = localStorage.getItem("altofox_pref_quality_review");
    if (prefReview !== null) {
      setQualityReviewEnabled(prefReview !== "false");
    } else {
      setQualityReviewEnabled(true);
    }
  }, []);

  // Load cached form progress on first mount
  useEffect(() => {
    checkKeyStatus();
    applyPreferences();

    try {
      const cached = localStorage.getItem("altofox_builder_state");
      if (cached) {
        const data = JSON.parse(cached);
        if (data.businessName) setBusinessName(data.businessName);
        if (data.businessType) setBusinessType(data.businessType);
        if (data.customBusinessType) setCustomBusinessType(data.customBusinessType);
        if (data.businessDescription) setBusinessDescription(data.businessDescription);
        if (data.services) {
          const loadedServices = parseTagList(data.services);
          if (loadedServices.length > 0) setServices(loadedServices);
        }
        if (data.logoUrl) setLogoUrl(data.logoUrl);
        if (data.yearsInBusiness) setYearsInBusiness(data.yearsInBusiness);
        if (data.uniqueSellingPoints) setUniqueSellingPoints(data.uniqueSellingPoints);
        if (data.customContentInstructions) setCustomContentInstructions(data.customContentInstructions);

        if (data.streetAddress) setStreetAddress(data.streetAddress);
        if (data.city) setCity(data.city);
        if (data.stateRegion) setStateRegion(data.stateRegion);
        if (data.zipPostalCode) setZipPostalCode(data.zipPostalCode);
        if (data.country) setCountry(data.country);
        if (data.serviceAreas || data.locations || data.serviceAreasList) {
          const loadedAreas = parseLocationList(data.serviceAreas || data.locations || data.serviceAreasList);
          if (loadedAreas.length > 0) setServiceAreas(loadedAreas);
        }
        if (data.phone) setPhone(data.phone);
        if (data.email) setEmail(data.email);
        if (data.businessHours) setBusinessHours(data.businessHours);
        if (data.keywords || data.targetKeywords) {
          const loadedKeywords = parseKeywordList(data.keywords || data.targetKeywords);
          if (loadedKeywords.length > 0) setKeywords(loadedKeywords);
        }
        if (data.googleMaps) setGoogleMaps(data.googleMaps);
        if (data.socialLinks) setSocialLinks(data.socialLinks);

        if (Array.isArray(data.selectedPages)) setSelectedPages(data.selectedPages);
        if (typeof data.separateServicePages === "boolean") setSeparateServicePages(data.separateServicePages);
        if (typeof data.separateAreaPages === "boolean") setSeparateAreaPages(data.separateAreaPages);
        if (data.selectedThemeId) setSelectedThemeId(data.selectedThemeId);
        if (data.customThemeColors && typeof data.customThemeColors === "object") {
          setCustomThemeColors(data.customThemeColors);
        }
        if (Array.isArray(data.serviceAreaCities)) setServiceAreaCities(data.serviceAreaCities);
        if (typeof data.createSeparateServiceLocationPages === "boolean") {
          setCreateSeparateServiceLocationPages(data.createSeparateServiceLocationPages);
        }
        if (typeof data.confirmedServesAreas === "boolean") {
          setConfirmedServesAreas(data.confirmedServesAreas);
        }
        if (typeof data.maxCompletedStep === "number") setMaxCompletedStep(data.maxCompletedStep);
      }
    } catch {
      // Ignore cache parse errors
    }
  }, [checkKeyStatus, applyPreferences]);

  // Load permanent projects from IndexedDB
  const loadAllSavedProjects = useCallback(async () => {
    try {
      const list = await getAllProjectsFromDB();
      setSavedProjectsList(list);
    } catch (err) {
      console.warn("Could not load projects from IndexedDB:", err);
    }
  }, []);

  useEffect(() => {
    loadAllSavedProjects();
  }, [loadAllSavedProjects]);

  // Auto-save form progress to localStorage (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const state = {
          businessName,
          businessType,
          customBusinessType,
          businessDescription,
          services,
          logoUrl,
          yearsInBusiness,
          uniqueSellingPoints,
          customContentInstructions,
          streetAddress,
          city,
          stateRegion,
          zipPostalCode,
          country,
          serviceAreas,
          phone,
          email,
          businessHours,
          websiteDomain,
          keywords,
          googleMaps,
          socialLinks,
          selectedPages,
          separateServicePages,
          separateAreaPages,
          serviceAreaCities,
          createSeparateServiceLocationPages,
          confirmedServesAreas,
          selectedThemeId,
          customThemeColors,
          maxCompletedStep,
        };
        localStorage.setItem("altofox_builder_state", JSON.stringify(state));
      } catch (err) {
        console.warn("[Dashboard] Could not auto-save builder state:", err);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [
    businessName,
    businessType,
    customBusinessType,
    businessDescription,
    services,
    logoUrl,
    yearsInBusiness,
    uniqueSellingPoints,
    customContentInstructions,
    streetAddress,
    city,
    stateRegion,
    zipPostalCode,
    country,
    serviceAreas,
    phone,
    email,
    businessHours,
    websiteDomain,
    keywords,
    googleMaps,
    socialLinks,
    selectedPages,
    separateServicePages,
    separateAreaPages,
    serviceAreaCities,
    createSeparateServiceLocationPages,
    confirmedServesAreas,
    selectedThemeId,
    customThemeColors,
    maxCompletedStep,
  ]);

  // Start Over Confirmation
  const handleStartOver = () => {
    if (window.confirm("Are you sure you want to start over? All fields will be cleared.")) {
      localStorage.removeItem("altofox_builder_state");
      setBusinessName("");
      setBusinessType("Plumber");
      setCustomBusinessType("");
      setBusinessDescription("");
      setYearsInBusiness("");
      setUniqueSellingPoints("");
      setCustomContentInstructions("");
      setServices(["Emergency Repairs", "Drain Cleaning", "Water Heater Repair"]);
      setStreetAddress("");
      setCity("");
      setStateRegion("");
      setZipPostalCode("");
      setCountry("USA");
      setServiceAreas([]);
      setPhone("");
      setEmail("");
      setBusinessHours("Monday - Sunday: 24/7 Emergency Dispatch");
      setWebsiteDomain("");
      setKeywords([]);
      setGoogleMaps("");
      setSocialLinks("");
      setSelectedPages(["Home", "About", "Services", "Contact", "FAQ", "Service Areas"]);
      setSelectedThemeId("pipe-and-wrench");
      setLayoutStyle("Conversion");
      setImageProvider("Bing");
      setBlogPostsCount(3);
      setSeparateServicePages(true);
      setSeparateAreaPages(true);
      setCustomThemeColors({});
      setCurrentStep(1);
      setMaxCompletedStep(1);
      setStepErrors({});
      addToast({
        type: "info",
        title: "Started Over",
        message: "All fields have been reset to blank.",
      });
    }
  };

  // Quick fill with local business example
  const handleFillExample = () => {
    setBusinessName(EXAMPLE_DATA.businessName);
    setBusinessType(EXAMPLE_DATA.businessType);
    setBusinessDescription(EXAMPLE_DATA.businessDescription);
    setServices(EXAMPLE_DATA.services);
    setStreetAddress(EXAMPLE_DATA.streetAddress);
    setCity(EXAMPLE_DATA.city);
    setStateRegion(EXAMPLE_DATA.stateRegion);
    setZipPostalCode(EXAMPLE_DATA.zipPostalCode);
    setCountry(EXAMPLE_DATA.country);
    setServiceAreas(EXAMPLE_DATA.serviceAreas);
    setPhone(EXAMPLE_DATA.phone);
    setEmail(EXAMPLE_DATA.email);
    setBusinessHours(EXAMPLE_DATA.businessHours);
    setWebsiteDomain(EXAMPLE_DATA.websiteDomain);
    setKeywords(EXAMPLE_DATA.keywords);
    setSelectedPages(EXAMPLE_DATA.pages);
    setSelectedThemeId(EXAMPLE_DATA.selectedThemeId);
    setLayoutStyle(EXAMPLE_DATA.layoutStyle || "Conversion");
    setImageProvider(EXAMPLE_DATA.imageProvider || "Bing");
    setBlogPostsCount(EXAMPLE_DATA.blogPostsCount ?? 3);
    setSeparateServicePages(true);
    setSeparateAreaPages(true);
    setCustomThemeColors({});
    setYearsInBusiness(EXAMPLE_DATA.yearsInBusiness);
    setUniqueSellingPoints(EXAMPLE_DATA.uniqueSellingPoints);
    setCustomContentInstructions("Emphasize 24/7 priority emergency response, upfront transparent pricing, and 20+ years of family-owned master craftsmanship. Friendly, dependable tone.");
    setGoogleMaps(EXAMPLE_DATA.googleMaps);
    setSocialLinks(EXAMPLE_DATA.socialLinks);
    setMaxCompletedStep(9);
    setStepErrors({});
    addToast({
      type: "success",
      title: "Example Loaded",
      message: "Pre-filled with Dallas plumbing business specifications.",
    });
  };

  // Add / Remove Chips for Services
  const handleAddService = (inputOverride?: unknown) => {
    const raw = typeof inputOverride === "string" ? inputOverride : serviceInput;
    if (!raw || !raw.trim()) return;

    const parsed = parseTagList(raw);
    if (parsed.length === 0) return;

    const merged = parseTagList([...services, ...parsed]);
    setServices(merged);
    setServiceInput("");
  };

  const handleRemoveService = (item: string) => {
    setServices(services.filter((s) => s.toLowerCase() !== item.toLowerCase()));
  };

  const handlePasteServices = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData("text");
    if (!pastedText) return;

    if (pastedText.includes(",") || pastedText.includes("\n") || pastedText.includes("\r") || pastedText.includes(";")) {
      e.preventDefault();
      const parsed = parseTagList(pastedText);
      if (parsed.length === 0) return;

      const merged = parseTagList([...services, ...parsed]);
      const addedCount = merged.length - services.length;
      setServices(merged);
      setServiceInput("");

      addToast({
        type: "info",
        title: "Services Parsed",
        message: `Recognized and added ${addedCount} service${addedCount === 1 ? "" : "s"} from pasted text.`,
      });
    }
  };

  // Add / Remove Chips for Service Areas
  const handleAddArea = (inputOverride?: unknown) => {
    const raw = typeof inputOverride === "string" ? inputOverride : areaInput;
    if (!raw || !raw.trim()) return;

    const parsed = parseLocationList(raw);
    if (parsed.length === 0) return;

    const merged = parseLocationList([...serviceAreas, ...parsed]);
    setServiceAreas(merged);
    setAreaInput("");
  };

  const handleRemoveArea = (item: string) => {
    setServiceAreas(serviceAreas.filter((a) => a.toLowerCase() !== item.toLowerCase()));
  };

  const handlePasteAreas = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData("text");
    if (!pastedText) return;

    if (pastedText.includes(",") || pastedText.includes("\n") || pastedText.includes("\r") || pastedText.includes(";")) {
      e.preventDefault();
      const parsed = parseLocationList(pastedText);
      if (parsed.length === 0) return;

      const merged = parseLocationList([...serviceAreas, ...parsed]);
      const addedCount = merged.length - serviceAreas.length;
      setServiceAreas(merged);
      setAreaInput("");

      addToast({
        type: "info",
        title: "Locations Parsed",
        message: `Recognized and added ${addedCount} location${addedCount === 1 ? "" : "s"} from pasted text.`,
      });
    }
  };

  // Add / Remove Chips for Keywords
  const handleAddKeyword = (inputOverride?: string) => {
    const raw = typeof inputOverride === "string" ? inputOverride : keywordInput;
    if (!raw || !raw.trim()) return;

    const parsed = parseKeywordList(raw);
    if (parsed.length === 0) return;

    const merged = parseKeywordList([...keywords, ...parsed]);
    setKeywords(merged);
    setKeywordInput("");

    // If any added keywords were in suggestions, clean them up
    const addedSet = new Set(parsed.map((k) => k.toLowerCase()));
    setSuggestedKeywords((prev) => prev.filter((s) => !addedSet.has(s.toLowerCase())));
    setSelectedSuggestions((prev) => prev.filter((s) => !addedSet.has(s.toLowerCase())));

    if (stepErrors.keywords) {
      setStepErrors((prev) => ({ ...prev, keywords: "" }));
    }
  };

  // Intercept paste on keyword input to instantly parse comma/newline-separated lists
  const handlePasteKeywords = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData("text");
    if (!pastedText) return;

    if (pastedText.includes(",") || pastedText.includes("\n") || pastedText.includes("\r")) {
      e.preventDefault();
      const parsed = parseKeywordList(pastedText);
      if (parsed.length === 0) return;

      const merged = parseKeywordList([...keywords, ...parsed]);
      const addedCount = merged.length - keywords.length;
      setKeywords(merged);
      setKeywordInput("");

      const addedSet = new Set(parsed.map((k) => k.toLowerCase()));
      setSuggestedKeywords((prev) => prev.filter((s) => !addedSet.has(s.toLowerCase())));
      setSelectedSuggestions((prev) => prev.filter((s) => !addedSet.has(s.toLowerCase())));

      if (stepErrors.keywords) {
        setStepErrors((prev) => ({ ...prev, keywords: "" }));
      }

      addToast({
        type: "info",
        title: "Keywords Parsed",
        message: `Recognized and added ${addedCount} keyword${addedCount === 1 ? "" : "s"} from pasted text.`,
      });
    }
  };

  const handleRemoveKeyword = (item: string) => {
    setKeywords(keywords.filter((k) => k.toLowerCase() !== item.toLowerCase()));
  };

  // Effective Business Type String
  const effectiveIndustry =
    businessType === "Other (Custom)" ? customBusinessType.trim() || "Local Business" : businessType;

  // Active Niche Pack
  const currentNichePack: NichePack = useMemo(() => {
    return findNicheByIndustry(effectiveIndustry);
  }, [effectiveIndustry]);

  // Suggested services from active Niche Pack that are not yet added
  const suggestedServices = useMemo(() => {
    return currentNichePack.commonServices.filter(
      (s) => !services.some((existing) => existing.toLowerCase() === s.toLowerCase())
    );
  }, [currentNichePack, services]);

  // Handle selecting or changing business type
  const handleSelectBusinessType = (newType: string) => {
    setBusinessType(newType);
    if (stepErrors.businessType) {
      setStepErrors((prev) => ({ ...prev, businessType: "" }));
    }

    const pack = findNicheByIndustry(newType === "Other (Custom)" ? customBusinessType : newType);

    // Pre-select recommended theme from the niche pack
    if (pack.recommendedThemes && pack.recommendedThemes.length > 0) {
      setSelectedThemeId(pack.recommendedThemes[0]);
    }

    // Auto-update hours if emergency trade
    if (pack.emergencyService) {
      setBusinessHours("Monday - Sunday: 24/7 Emergency Dispatch");
    }

    addToast({
      type: "info",
      title: `${pack.name} Pack Active`,
      message: `Loaded trade pack: recommended "${pack.recommendedThemes[0]}" theme & ${pack.commonServices.length} service suggestions.`,
    });
  };

  // Auto-Suggest SEO Keywords using active Niche Pack patterns and user location
  // NOTE: Does NOT auto-merge into selected keywords; allows user to review and pick
  const handleSuggestKeywords = () => {
    const generated = generateKeywordsForNiche(
      currentNichePack,
      city.trim() || "Dallas",
      stateRegion.trim() || "TX",
      serviceAreas
    );
    const parsedGen = parseKeywordList(generated);
    const currentLower = new Set(keywords.map((k) => k.toLowerCase()));
    const available = parsedGen.filter((k) => !currentLower.has(k.toLowerCase()));

    if (available.length === 0) {
      addToast({
        type: "info",
        title: "Keywords Already Present",
        message: "All suggested keywords for this niche are already in your target keyword list.",
      });
      return;
    }

    setSuggestedKeywords(available);
    setSelectedSuggestions([]); // User explicitly selects or chooses Select All
    addToast({
      type: "info",
      title: `${currentNichePack.name} Keyword Suggestions`,
      message: `Found ${available.length} relevant keyword suggestions. Select the ones you want below.`,
    });
  };

  const handleToggleSuggestion = (sug: string) => {
    setSelectedSuggestions((prev) =>
      prev.includes(sug) ? prev.filter((k) => k !== sug) : [...prev, sug]
    );
  };

  const handleToggleAllSuggestions = () => {
    if (selectedSuggestions.length === suggestedKeywords.length) {
      setSelectedSuggestions([]);
    } else {
      setSelectedSuggestions([...suggestedKeywords]);
    }
  };

  const handleAddSelectedSuggestions = () => {
    if (selectedSuggestions.length === 0) return;
    const merged = parseKeywordList([...keywords, ...selectedSuggestions]);
    const count = selectedSuggestions.length;
    setKeywords(merged);

    const addedSet = new Set(selectedSuggestions.map((s) => s.toLowerCase()));
    setSuggestedKeywords((prev) => prev.filter((s) => !addedSet.has(s.toLowerCase())));
    setSelectedSuggestions([]);

    if (stepErrors.keywords) {
      setStepErrors((prev) => ({ ...prev, keywords: "" }));
    }

    addToast({
      type: "success",
      title: "Keywords Added",
      message: `Added ${count} suggested keyword${count === 1 ? "" : "s"} to your target keywords.`,
    });
  };

  const handleAddSingleSuggestion = (sug: string) => {
    const merged = parseKeywordList([...keywords, sug]);
    setKeywords(merged);
    setSuggestedKeywords((prev) => prev.filter((s) => s.toLowerCase() !== sug.toLowerCase()));
    setSelectedSuggestions((prev) => prev.filter((s) => s.toLowerCase() !== sug.toLowerCase()));

    if (stepErrors.keywords) {
      setStepErrors((prev) => ({ ...prev, keywords: "" }));
    }
  };

  const handleDismissSuggestions = () => {
    setSuggestedKeywords([]);
    setSelectedSuggestions([]);
  };

  // Toggle Page Selection
  const togglePage = (pageId: string) => {
    if (pageId === "Home") return; // Home is required
    if (selectedPages.includes(pageId)) {
      if (selectedPages.length <= 1) return;
      setSelectedPages(selectedPages.filter((p) => p !== pageId));
    } else {
      setSelectedPages([...selectedPages, pageId]);
    }
  };

  // Selected Theme Details & Recommendations
  const recommendedThemeIds = useMemo(() => {
    if (currentNichePack.recommendedThemes && currentNichePack.recommendedThemes.length > 0) {
      return currentNichePack.recommendedThemes;
    }
    return getRecommendedThemeIds(effectiveIndustry);
  }, [currentNichePack, effectiveIndustry]);

  const activeTheme = useMemo(() => {
    return getThemeById(selectedThemeId);
  }, [selectedThemeId]);

  const activeColors = useMemo(() => {
    return resolveThemeColors(activeTheme, customThemeColors);
  }, [activeTheme, customThemeColors]);

  const hasCustomColors = useMemo(() => {
    return (
      (!!customThemeColors.primary &&
        customThemeColors.primary.toLowerCase() !== activeTheme.colors.primary.toLowerCase()) ||
      (!!customThemeColors.accent &&
        customThemeColors.accent.toLowerCase() !== activeTheme.colors.accent.toLowerCase()) ||
      (!!customThemeColors.background &&
        customThemeColors.background.toLowerCase() !== activeTheme.colors.background.toLowerCase())
    );
  }, [customThemeColors, activeTheme]);

  // Dynamic Blueprint Metrics
  const computedLocationCount = useMemo(() => {
    return serviceAreas.length > 0 ? serviceAreas.length : serviceAreaCities.length;
  }, [serviceAreas.length, serviceAreaCities.length]);

  const computedPageCount = useMemo(() => {
    let count = 4; // Home, About, Contact, FAQ
    if (selectedPages.includes("Services")) count += 1;
    if (separateServicePages && services.length > 0) count += services.length;
    if (selectedPages.includes("Service Areas") || serviceAreas.length > 0 || serviceAreaCities.length > 0) count += 1;
    if (separateAreaPages && computedLocationCount > 0) count += computedLocationCount;
    if (blogPostsCount > 0) count += (1 + blogPostsCount); // 1 blog hub + N articles
    return count;
  }, [selectedPages, separateServicePages, services.length, separateAreaPages, computedLocationCount, blogPostsCount, serviceAreas.length, serviceAreaCities.length]);

  const themeDisplayName = useMemo(() => {
    if (selectedThemeId === "pipe-and-wrench" || selectedThemeId === "forge" || activeTheme.id === "pipe-and-wrench") {
      return "Forge";
    }
    if (selectedThemeId === "spark-and-wire" || activeTheme.id === "spark-and-wire") {
      return "Apex";
    }
    if (selectedThemeId === "cool-breeze" || activeTheme.id === "cool-breeze") {
      return "Breeze";
    }
    if (selectedThemeId === "storm-shield" || activeTheme.id === "storm-shield") {
      return "Shield";
    }
    if (selectedThemeId === "green-roots" || activeTheme.id === "green-roots") {
      return "Roots";
    }
    if (selectedThemeId === "clean-sweep" || activeTheme.id === "clean-sweep") {
      return "Radiance";
    }
    if (selectedThemeId === "iron-grip" || activeTheme.id === "iron-grip") {
      return "Iron";
    }
    if (selectedThemeId === "master-craft" || activeTheme.id === "master-craft") {
      return "Craft";
    }
    if (selectedThemeId === "secure-home" || activeTheme.id === "secure-home") {
      return "Modern Pro";
    }
    if (selectedThemeId === "rapid-response" || activeTheme.id === "rapid-response") {
      return "Velocity";
    }
    return activeTheme.name;
  }, [selectedThemeId, activeTheme]);

  // STEP 1 VALIDATION: Business
  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!businessName.trim()) {
      errors.businessName = "Business name is required.";
    }
    if (!phone.trim()) {
      errors.phone = "Phone number is required for customer calls.";
    }
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // STEP 2 VALIDATION: Niche
  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {};
    if (businessType === "Other (Custom)" && !customBusinessType.trim()) {
      errors.businessType = "Please specify your industry.";
    }
    if (!businessDescription.trim()) {
      errors.businessDescription = "A short business description is required.";
    }
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // STEP 3 VALIDATION: Services
  const validateStep3 = (): boolean => {
    // Auto-commit any pending service input so user doesn't lose it
    let currentServices = [...services];
    if (serviceInput.trim()) {
      const pendingServices = parseTagList(serviceInput);
      if (pendingServices.length > 0) {
        currentServices = parseTagList([...currentServices, ...pendingServices]);
        setServices(currentServices);
        setServiceInput("");
      }
    }

    const errors: Record<string, string> = {};
    if (currentServices.length === 0) {
      errors.services = "Please add at least one service offered.";
    }
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // STEP 4 VALIDATION: Locations
  const validateStep4 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!city.trim()) {
      errors.city = "City is required for localized SEO.";
    }
    if (!stateRegion.trim()) {
      errors.stateRegion = "State or region is required.";
    }

    // Auto-commit any pending area input so user doesn't lose it
    if (areaInput.trim()) {
      const pendingAreas = parseLocationList(areaInput);
      if (pendingAreas.length > 0) {
        setServiceAreas((prev) => parseLocationList([...prev, ...pendingAreas]));
        setAreaInput("");
      }
    }

    if (serviceAreaCities.length > 0 && !confirmedServesAreas) {
      errors.confirmedServesAreas = "Please confirm that your business genuinely serves all selected service areas.";
    }

    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // STEP 5 VALIDATION: Keywords
  const validateStep5 = (): boolean => {
    const errors: Record<string, string> = {};
    // Auto-commit any pending keyword input so user doesn't lose it
    let effectiveKeywords = [...keywords];
    if (keywordInput.trim()) {
      const pending = parseKeywordList(keywordInput);
      if (pending.length > 0) {
        effectiveKeywords = parseKeywordList([...effectiveKeywords, ...pending]);
        setKeywords(effectiveKeywords);
        setKeywordInput("");
      }
    }

    const kwValidation = validateKeywordList(effectiveKeywords);
    if (!kwValidation.valid) {
      errors.keywords = kwValidation.error || "At least one target keyword is required. Add keywords or select from suggestions.";
    }
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Wizard Navigation
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!validateStep1()) {
        addToast({
          type: "error",
          title: "Incomplete Fields",
          message: "Please enter your business name and phone number.",
        });
        return;
      }
    } else if (currentStep === 2) {
      if (!validateStep2()) {
        addToast({
          type: "error",
          title: "Incomplete Fields",
          message: "Please specify your industry and business description.",
        });
        return;
      }
    } else if (currentStep === 3) {
      if (!validateStep3()) {
        addToast({
          type: "error",
          title: "Incomplete Fields",
          message: "Please add at least one service offered.",
        });
        return;
      }
    } else if (currentStep === 4) {
      if (!validateStep4()) {
        addToast({
          type: "error",
          title: "Incomplete Fields",
          message: "Please specify your primary city and state.",
        });
        return;
      }
    } else if (currentStep === 5) {
      if (!validateStep5()) {
        addToast({
          type: "error",
          title: "Incomplete Fields",
          message: "Please add at least one target keyword.",
        });
        return;
      }
    }

    const next = Math.min(currentStep + 1, 9);
    setCurrentStep(next);
    if (next > maxCompletedStep) setMaxCompletedStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleJumpToStep = (stepNumber: number) => {
    if (stepNumber <= maxCompletedStep || stepNumber === currentStep) {
      setCurrentStep(stepNumber);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Persists a generated website to database & IndexedDB ONLY when user chooses to save
  const handlePersistProjectToDashboard = useCallback(
    async (data: any, usedFormData: any) => {
      try {
        setIsSavingDecisionProject(true);

        const initialKeywordMap: ProjectKeywordItem[] = (data.files || [])
          .filter((f: any) => f.path.endsWith(".html"))
          .map((f: any) => {
            const sug = suggestKeywordsForPage(f.path, businessType, city, stateRegion, services);
            const audit = auditPageSEO(f.content, f.path, sug.primary, sug.secondaries);
            return {
              pagePath: f.path,
              primaryKeyword: sug.primary,
              secondaryKeywords: sug.secondaries,
              seoScore: audit.totalScore,
            };
          });

        const resolvedId = data.projectId && !data.projectId.startsWith("temp-")
          ? data.projectId
          : `proj-${Date.now()}`;

        const newSavedProject: SavedProject = {
          id: resolvedId,
          name: businessName || "Local Business Website",
          createdAt: Date.now(),
          lastEditedAt: Date.now(),
          customContentInstructions: customContentInstructions.trim(),
          formData: usedFormData,
          theme: activeTheme,
          nicheId: currentNichePack.id,
          schemaType: currentNichePack.schemaType,
          businessDetails: {
            businessName,
            phone,
            email,
            streetAddress,
            city,
            stateRegion,
            zipPostalCode,
            businessHours,
            websiteDomain,
            socialLinks,
          },
          serviceAreaCities,
          keywordMap: initialKeywordMap,
          customBlocks: [],
          mustIncludeText: "",
          pageContentMap: {},
          blogPosts: [],
          files: data.files.map((f: any) => ({
            path: f.path,
            content: f.content,
            mimeType: f.mimeType || undefined,
          })),
          changeLog: [
            {
              id: `log-${Date.now()}`,
              timestamp: Date.now(),
              dateStr: new Date().toLocaleDateString(),
              summary: "Initial website generation (Saved for Future Optimization)",
              affectedPages: data.files.map((f: any) => f.path),
            },
          ],
          redirects: [],
        };

        // A. Call server-side save API to persist structured project into SQLite
        try {
          await fetch("/api/projects/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId: resolvedId,
              name: newSavedProject.name,
              businessName,
              domain: websiteDomain,
              theme: activeTheme,
              themeName: activeTheme.name,
              niche: businessType,
              services,
              keywords: parseKeywordList(keywords),
              city,
              state: stateRegion,
              provider: data.provider,
              model: data.model,
              qualityReport: data.qualityReport,
              customContentInstructions: customContentInstructions.trim(),
              files: data.files,
            }),
          });
        } catch (srvErr) {
          console.warn("Server-side save warning:", srvErr);
        }

        // B. Save to local IndexedDB & Supabase store
        const finalSavedProject = ensureProjectVersions(newSavedProject);
        await saveProjectToDB(finalSavedProject);
        setActiveSavedProject(finalSavedProject);
        setIsCurrentProjectSaved(true);
        setCurrentProject((prev) => (prev ? { ...prev, projectId: resolvedId } : null));
        await loadAllSavedProjects();

        addToast({
          type: "success",
          title: "Website Saved for Optimization",
          message: `"${newSavedProject.name}" has been permanently saved to your dashboard library for future SEO and content updates.`,
        });
      } catch (err: any) {
        console.error("Failed to persist project:", err);
        addToast({
          type: "error",
          title: "Save Failed",
          message: err?.message || "Could not save project to database.",
        });
      } finally {
        setIsSavingDecisionProject(false);
      }
    },
    [
      businessName,
      businessType,
      city,
      stateRegion,
      services,
      customContentInstructions,
      activeTheme,
      currentNichePack,
      phone,
      email,
      streetAddress,
      zipPostalCode,
      businessHours,
      websiteDomain,
      socialLinks,
      serviceAreaCities,
      keywords,
      loadAllSavedProjects,
      addToast,
    ]
  );

  // Process & Store Generated Website
  const handleProcessGeneratedSite = useCallback(
    async (data: any, usedFormData: any) => {
      if (generationTimerRef.current) {
        clearInterval(generationTimerRef.current);
        generationTimerRef.current = null;
      }

      if (data.success && Array.isArray(data.files)) {
        const projData = {
          projectId: data.projectId,
          name: data.name,
          notes: data.notes,
          provider: data.provider,
          model: data.model,
          themeName: activeTheme.name,
          websiteDomain: websiteDomain.trim(),
          files: data.files,
          photos: data.photos,
          qualityReport: data.qualityReport,
          customContentInstructions: customContentInstructions.trim(),
        };
        setCurrentProject(projData);
        setIsCurrentProjectSaved(Boolean(data.isSaved));
        setPendingGeneratedSite({ data, usedFormData, projData });

        // If backend already persisted (explicit saveToDb), sync to dashboard
        if (data.isSaved) {
          try {
            await handlePersistProjectToDashboard(data, usedFormData);
          } catch (e) {
            console.warn("Could not sync saved project:", e);
          }
        } else {
          // Default: Open the decision modal (Save for future optimization vs Download only)
          setIsDecisionModalOpen(true);
        }

        addToast({
          type: "success",
          title: data.qualityReport?.overallScore
            ? `Website Ready (Quality Score: ${data.qualityReport.overallScore}/100)`
            : data.qualityReviewApplied
            ? "Website Created & Quality Reviewed!"
            : "Website Created!",
          message: `Generated ${data.files.filter((f: { path: string }) => f.path.endsWith(".html")).length} static HTML pages ready for inspection.`,
        });
        return true;
      } else {
        addToast({
          type: "error",
          title: "Generation Incomplete",
          message: data.error || "The AI model encountered an issue. Please verify your API key or model name.",
        });
        return false;
      }
    },
    [
      activeTheme,
      websiteDomain,
      customContentInstructions,
      handlePersistProjectToDashboard,
      addToast,
    ]
  );


  // Handle post-generation decision choice
  const handleConfirmSaveDecision = useCallback(
    async (choice: "download-only" | "save-future") => {
      setIsDecisionModalOpen(false);

      if (choice === "download-only") {
        setIsCurrentProjectSaved(false);
        addToast({
          type: "info",
          title: "Session Active (Download Only)",
          message: "Website ready to preview & download. (Unsaved session — not permanently stored in database)",
        });
        return;
      }

      if (pendingGeneratedSite) {
        await handlePersistProjectToDashboard(
          pendingGeneratedSite.data,
          pendingGeneratedSite.usedFormData
        );
      }
    },
    [pendingGeneratedSite, handlePersistProjectToDashboard, addToast]
  );

  // Quick download from decision modal
  const handleDownloadFromDecisionModal = useCallback(async () => {
    if (!currentProject || !currentProject.files) return;
    try {
      const JSZipModule = await import("jszip");
      const JSZip = (JSZipModule as any).default?.default || (JSZipModule as any).default || JSZipModule;
      const zip = new JSZip();

      for (const file of currentProject.files) {
        if (!file?.path) continue;
        zip.file(file.path, file.content || "");
      }

      zip.file(
        "README.md",
        `# ${currentProject.name || "Website"}\n\nGenerated with ${BRAND.name} Static Website Builder.\n\n## How to Open\nDouble-click index.html to preview in any browser.\n`
      );

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeBiz = (currentProject.name || "website").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      a.download = `${safeBiz}-website.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addToast({
        type: "success",
        title: "Download Started",
        message: `Saved ${currentProject.files.length} website files to ${a.download}.`,
      });
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Download Error",
        message: err?.message || "Failed to download ZIP.",
      });
    }
  }, [currentProject, addToast]);

  // Discard generated website entirely without saving any data to DB
  const handleDiscardWebsite = useCallback(async () => {
    const projId = currentProject?.projectId || pendingGeneratedSite?.data?.projectId;
    if (projId) {
      try {
        await fetch(`/api/projects/${projId}`, { method: "DELETE" });
      } catch (err) {
        console.warn("[Dashboard] Error deleting project during discard:", err);
      }
      try {
        deleteProjectFromDB(projId);
      } catch {}
    }

    setCurrentProject(null);
    setPendingGeneratedSite(null);
    setIsCurrentProjectSaved(false);
    setIsDecisionModalOpen(false);
    setCurrentStep(1);

    addToast({
      type: "info",
      title: "Website Discarded",
      message: "Generated website discarded. No website data was saved to your database.",
    });
  }, [currentProject, pendingGeneratedSite, addToast]);

  // Cancel in-flight generation
  const handleCancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (generationTimerRef.current) {
      clearInterval(generationTimerRef.current);
      generationTimerRef.current = null;
    }
    setGenerating(false);
    setGenerationStage("IDLE");
    setGenerationError(null);
    setIsGenerationTakingLong(false);
    addToast({
      type: "info",
      title: "Generation Stopped",
      message: "Website generation cancelled. All your entered business details were safely preserved.",
    });
  }, [addToast]);

  // Instant Safe Template Generation fallback (0s generation)
  const handleInstantSafeGeneration = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (generationTimerRef.current) {
      clearInterval(generationTimerRef.current);
      generationTimerRef.current = null;
    }

    setGenerating(true);
    setGenerationStage("BUILDING_PAGES");
    setGenerationError(null);
    setIsGenerationTakingLong(false);
    setGenerationPercent(85);
    setGenerationProgressText("Assembling instant high-converting trade website from curated templates…");

    const pexelsKey = localStorage.getItem("altofox_pexels_key") || undefined;
    const pixabayKey = localStorage.getItem("altofox_pixabay_key") || undefined;
    const googleKey = localStorage.getItem("altofox_google_search_key") || undefined;
    const googleCx = localStorage.getItem("altofox_google_search_cx") || undefined;
    const preferredSource =
      (localStorage.getItem("altofox_image_preferred_source") as "bing" | "pexels" | "pixabay" | "google") || "bing";

    const targetFormData = lastFormDataRef.current || {
      businessName: businessName.trim() || "Local Service Co",
      businessType: effectiveIndustry,
      nicheId: currentNichePack.id,
      city: city.trim() || "Local Area",
      targetKeywords: formatKeywordsForStorage(keywords),
      keywords: parseKeywordList(keywords),
    };

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          demo: true,
          formData: targetFormData,
          pexelsKey,
          pixabayKey,
          googleKey,
          googleCx,
          preferredSource,
        }),
      });

      const resText = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(resText);
      } catch {
        const cleanSnippet = resText.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 250);
        throw new Error(
          cleanSnippet
            ? `Server response error (${res.status}): ${cleanSnippet}`
            : `Server returned HTTP ${res.status} ${res.statusText || "without JSON content"}`
        );
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Instant assembly failed");
      }
      setGenerationStage("READY");
      await handleProcessGeneratedSite(data, targetFormData);
    } catch (err: any) {
      setGenerationStage("FAILED_RENDER");
      setGenerationError({
        message: err?.message || "Failed to assemble instant templates.",
        canFallback: false,
        failedStage: "FAILED_RENDER",
      });
      addToast({
        type: "error",
        title: "Instant Assembly Error",
        message: err?.message || "Failed to assemble instant templates.",
      });
    } finally {
      setGenerating(false);
      setIsGenerationTakingLong(false);
    }
  }, [
    businessName,
    effectiveIndustry,
    currentNichePack,
    city,
    keywords,
    handleProcessGeneratedSite,
    addToast,
  ]);

  // Execute Website Generation
  const handleGenerateWebsite = async () => {
    // Guard against double-click / duplicate submissions
    if (generating) return;

    // Check website plan limits
    const userPlan = profile?.plan || "starter";
    const isUnlimited = isOwner || userPlan === "unlimited";
    const websiteLimit = isUnlimited ? 999999 : (profile?.website_limit ?? (userPlan === "agency" ? 30 : 5));

    if (!isUnlimited && savedProjectsList.length >= websiteLimit) {
      addToast({
        type: "error",
        title: "Website Limit Reached",
        message: `You have reached your ${userPlan.toUpperCase()} plan limit of ${websiteLimit} websites. Please upgrade to generate more sites.`,
      });
      setIsLimitModalOpen(true);
      return;
    }

    const localKey = localStorage.getItem(`altofox_key_${activeProvider}`);
    if (!hasKey && !localKey) {
      handleOpenSettings("models", "Connect an AI model to generate your website.");
      addToast({
        type: "warning",
        title: "AI Model Required",
        message: "Connect an AI model to generate your website.",
      });
      return;
    }

    const pexelsKey = localStorage.getItem("altofox_pexels_key") || undefined;
    const pixabayKey = localStorage.getItem("altofox_pixabay_key") || undefined;
    const googleKey = localStorage.getItem("altofox_google_search_key") || undefined;
    const googleCx = localStorage.getItem("altofox_google_search_cx") || undefined;
    const preferredSource =
      (localStorage.getItem("altofox_image_preferred_source") as "bing" | "pexels" | "pixabay" | "google") || "bing";

    const prefReview =
      (typeof window !== "undefined"
        ? localStorage.getItem("altofox_pref_quality_review")
        : null) === "true"; // Opt-in only to keep baseline generation fast

    const savedLanguage =
      (typeof window !== "undefined" ? localStorage.getItem("altofox_pref_language") : null) || "English";

    const formData = {
      businessName: businessName.trim(),
      businessType: effectiveIndustry,
      nicheId: currentNichePack.id,
      schemaType: currentNichePack.schemaType,
      businessDescription: businessDescription.trim(),
      servicesOffered: services.join(", "),
      services: parseTagList(services),
      streetAddress: streetAddress.trim(),
      city: city.trim(),
      stateRegion: stateRegion.trim(),
      zipPostalCode: zipPostalCode.trim(),
      country: country.trim(),
      serviceAreas: formatLocationsForStorage(serviceAreas),
      serviceAreasList: parseLocationList(serviceAreas),
      locations: parseLocationList(serviceAreas),
      serviceAreaCities: serviceAreaCities.map((c) => ({
        city: c.city,
        stateId: c.stateId,
        county: c.county,
        lat: c.lat,
        lng: c.lng,
        population: c.population,
        distanceOffset: c.distanceOffset,
        localNotes: c.localNotes,
      })),
      phone: phone.trim(),
      email: email.trim(),
      businessHours: businessHours.trim(),
      websiteDomain: websiteDomain.trim(),
      targetKeywords: formatKeywordsForStorage(keywords),
      keywords: parseKeywordList(keywords),
      pagesToCreate: selectedPages,
      separateServicePages: separateServicePages,
      separateAreaPages: separateAreaPages,
      yearsInBusiness: yearsInBusiness.trim(),
      uniqueSellingPoints: uniqueSellingPoints.trim(),
      brandColors: `Primary: ${activeColors.primary}, Accent: ${activeColors.accent}, Background: ${activeColors.background}`,
      styleTone: `${activeTheme.name} - ${activeTheme.description}`,
      theme: {
        id: activeTheme.id,
        name: activeTheme.name,
        description: activeTheme.description,
        colors: activeColors,
        fonts: activeTheme.fonts,
        borderRadius: activeTheme.borderRadius,
        buttonStyle: activeTheme.buttonStyle,
        heroStyle: activeTheme.heroStyle,
        sectionStyle: activeTheme.sectionStyle,
        designNotes: activeTheme.designNotes,
      },
      googleMaps: googleMaps.trim(),
      socialLinks: socialLinks.trim(),
      logoUrl: logoUrl.trim(),
      layoutStyle,
      imageProvider,
      blogPostsCount,
      language: savedLanguage,
      qualityReview: prefReview,
      customContentInstructions: customContentInstructions.trim(),
      extraInstructions: [
        uniqueSellingPoints ? `Unique Selling Points: ${uniqueSellingPoints}` : "",
        yearsInBusiness ? `Years in business: ${yearsInBusiness}` : "",
        separateServicePages ? "Create individual service landing pages for each main service." : "",
        separateAreaPages ? "Create individual city landing pages for key service areas." : "",
      ]
        .filter(Boolean)
        .join(". "),
    };

    // 1. Lock immutable targeting snapshot (User Data Always Wins)
    const targetingSnapshot = Object.freeze({
      businessName: businessName.trim(),
      businessType: effectiveIndustry,
      nicheId: currentNichePack.id,
      services: parseTagList(services),
      primaryService: services[0] || effectiveIndustry,
      secondaryServices: services.slice(1),
      primaryCity: city.trim(),
      primaryState: stateRegion.trim(),
      serviceAreasList: parseLocationList(serviceAreas),
      serviceAreaCities: serviceAreaCities.map((c) => ({
        city: c.city,
        stateId: c.stateId,
      })),
      keywords: parseKeywordList(keywords),
      primaryKeyword: keywords[0] || "",
      secondaryKeywords: keywords.slice(1),
      timestamp: Date.now(),
    });
    lockedSnapshotRef.current = targetingSnapshot;

    lastFormDataRef.current = formData;
    try {
      localStorage.setItem("altofox_staged_form_data", JSON.stringify(formData));
    } catch {}

    const formatNow = () => new Date().toLocaleTimeString("en-US", { hour12: false });
    const additionalLocCount = serviceAreas.length + serviceAreaCities.length;
    setGenerationLogs([
      { id: "log-1", time: formatNow(), message: `Targeting snapshot locked: ${city.trim() || "Yardley"}, ${stateRegion.trim() || "PA"}` },
      { id: "log-2", time: formatNow(), message: `Primary Service: ${services[0] || effectiveIndustry} (${services.length} total services)` },
      { id: "log-3", time: formatNow(), message: `Locations: ${city.trim() || "Yardley"} (${additionalLocCount === 0 ? "Single-City Site — 0 additional locations" : `${additionalLocCount} additional cities`})` },
      { id: "log-4", time: formatNow(), message: `Keywords: ${keywords.length} approved target queries` },
      { id: "log-5", time: formatNow(), message: `Connecting to ${activeProvider.toUpperCase()} (${activeModel})...` },
    ]);

    setGenerating(true);
    setGenerationStage("QUEUED");
    setGenerationError(null);
    setActivePipeline(null);
    setIsGenerationTakingLong(false);
    setGenerationElapsedSeconds(0);
    setGenerationPercent(STAGE_CONFIG.QUEUED.defaultPercent);
    setGenerationProgressText(STAGE_CONFIG.QUEUED.description);

    if (generationTimerRef.current) clearInterval(generationTimerRef.current);
    const startTime = Date.now();

    generationTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setGenerationElapsedSeconds(elapsed);

      if (elapsed >= 45) {
        setIsGenerationTakingLong(true);
      }
    }, 1000);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setGenerationStage("RESEARCHING");
      setGenerationPercent(STAGE_CONFIG.RESEARCHING.defaultPercent);
      setGenerationProgressText(`Analyzing niche and connecting to ${activeProvider.toUpperCase()} (${activeModel})…`);
      addGenLog(`Provider connection established: ${activeProvider.toUpperCase()} (${activeModel})`, "info");

      // Allow UI to paint stage transition
      await new Promise((r) => setTimeout(r, 200));

      setGenerationStage("GENERATING_CONTENT");
      setGenerationPercent(STAGE_CONFIG.GENERATING_CONTENT.defaultPercent);
      setGenerationProgressText(`Generating high-converting local trade copy with ${activeProvider.toUpperCase()}…`);
      addGenLog("Generating multi-page content with deterministic seed variation...", "info");

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortController.signal,
        body: JSON.stringify({
          provider: activeProvider,
          model: activeModel,
          apiKey: localKey || undefined,
          baseUrl:
            (typeof window !== "undefined"
              ? localStorage.getItem(`altofox_base_url_${activeProvider}`) ||
                localStorage.getItem(`ranklocal_base_url_${activeProvider}`) ||
                localStorage.getItem("altofox_base_url_custom") ||
                localStorage.getItem("ranklocal_base_url_custom")
              : undefined) || undefined,
          organizationId:
            (typeof window !== "undefined"
              ? localStorage.getItem(`altofox_org_id_${activeProvider}`) ||
                localStorage.getItem(`ranklocal_org_id_${activeProvider}`) ||
                localStorage.getItem("altofox_org_id_custom") ||
                localStorage.getItem("ranklocal_org_id_custom")
              : undefined) || undefined,
          providerName:
            (typeof window !== "undefined"
              ? localStorage.getItem(`altofox_provider_name_${activeProvider}`) ||
                localStorage.getItem(`ranklocal_provider_name_${activeProvider}`) ||
                localStorage.getItem("altofox_provider_name_custom") ||
                localStorage.getItem("ranklocal_provider_name_custom")
              : undefined) || undefined,
          pexelsKey,
          pixabayKey,
          googleKey,
          googleCx,
          preferredSource,
          qualityReview: prefReview,
          formData,
        }),
      });

      const resText = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(resText);
      } catch {
        const cleanSnippet = resText.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 250);
        throw new Error(
          cleanSnippet
            ? `Server response error (${res.status}): ${cleanSnippet}`
            : `Server returned HTTP ${res.status} ${res.statusText || "without JSON content"}`
        );
      }

      if (!res.ok || !data.success) {
        const failedStage: GenerationFailureStage = data.failedStage || "FAILED_PROVIDER";
        addGenLog(`Generation halted at stage ${failedStage}: ${data.error || "Provider error"}`, "error");
        setGenerationStage(failedStage);
        setGenerationError({
          message: data.error || `Server returned HTTP ${res.status}: ${res.statusText}`,
          canFallback: Boolean(data.canFallbackToTemplates),
          failedStage,
        });
        if (data.pipeline) {
          setActivePipeline(data.pipeline);
        }
        setGenerating(false);
        addToast({
          type: "error",
          title: `Generation Error: ${failedStage.replace("FAILED_", "")}`,
          message: data.error || "Generation could not be completed.",
        });
        return;
      }

      if (data.pipeline) {
        setActivePipeline(data.pipeline);
      }

      setGenerationStage("PACKAGING");
      setGenerationPercent(STAGE_CONFIG.PACKAGING.defaultPercent);
      setGenerationProgressText("Packaging zero-build static pages and assets…");
      addGenLog(`Packaging ${data.files?.length || 0} static HTML pages, CSS, and metadata...`, "info");

      await new Promise((r) => setTimeout(r, 150));

      setGenerationStage("READY");
      setGenerationPercent(100);
      setGenerationProgressText("Website generation complete! Preparing preview…");
      addGenLog(`Website generated successfully! Quality score: ${data.qualityReport?.overallScore || 90}/100`, "success");

      const success = await handleProcessGeneratedSite(data, formData);
      if (success) {
        setGenerationStage("READY");
      } else {
        setGenerationStage("FAILED_RENDER");
      }
    } catch (err: any) {
      const isAborted = abortController.signal.aborted || err?.name === "AbortError";
      const errMsg = isAborted
        ? "Generation was cancelled. Your entered business and targeting data are safely preserved."
        : (err instanceof Error ? err.message : "Network error generating website. Please check your internet connection.");

      addGenLog(isAborted ? "Generation stopped by user. Targeting snapshot preserved." : `Pipeline error: ${errMsg}`, isAborted ? "info" : "error");

      setGenerationStage(isAborted ? "IDLE" : "FAILED_PROVIDER");
      setGenerationError(isAborted ? null : {
        message: errMsg,
        canFallback: true,
        failedStage: "FAILED_PROVIDER",
      });
      addToast({
        type: isAborted ? "info" : "error",
        title: isAborted ? "Generation Stopped" : "Generation Error",
        message: errMsg,
      });
    } finally {
      if (generationTimerRef.current) {
        clearInterval(generationTimerRef.current);
        generationTimerRef.current = null;
      }
      abortControllerRef.current = null;
      setGenerating(false);
      setIsGenerationTakingLong(false);
    }
  };

  const stepsList = [
    { number: 1, label: "Business" },
    { number: 2, label: "Niche" },
    { number: 3, label: "Services" },
    { number: 4, label: "Locations" },
    { number: 5, label: "Keywords" },
    { number: 6, label: "Brand" },
    { number: 7, label: "Theme" },
    { number: 8, label: "Generation Settings" },
    { number: 9, label: "Site Blueprint" },
  ];



  const handleClearAllData = useCallback(() => {
    // Clear React state
    setBusinessName("");
    setBusinessType("Plumber");
    setCustomBusinessType("");
    setBusinessDescription("");
    setServices(["24/7 Emergency Repairs", "Drain Cleaning & Rooter"]);
    setCity("");
    setStateRegion("");
    setZipPostalCode("");
    setCountry("United States");
    setPhone("");
    setEmail("");
    setKeywords([]);
    setSelectedPages(["Home", "About", "Services", "Contact", "FAQ", "Service Areas"]);
    setSelectedThemeId("modern-indigo");
    setDismissImageNotice(false);
    setCurrentStep(1);
    setMaxCompletedStep(1);
    // Also clear the persisted cache so the reset survives page reload
    try {
      localStorage.removeItem("altofox_builder_state");
      localStorage.removeItem("altofox_staged_form_data");
    } catch {
      // localStorage not available (SSR guard)
    }
    addToast({
      type: "info",
      title: "Form Reset",
      message: "All builder form fields have been cleared.",
    });
  }, [addToast]);

  const renderModals = () => (
    <>
      {/* Edit Blueprint Step Selector Modal */}
      {isEditBlueprintOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FileEdit className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Edit Website Blueprint</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditBlueprintOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Select which section of your blueprint you want to edit:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto pr-1">
              {[
                { step: 1, title: "1. Business", desc: businessName || "Company name & contact" },
                { step: 2, title: "2. Niche", desc: `${effectiveIndustry} (${currentNichePack.name})` },
                { step: 3, title: "3. Services", desc: `${services.length} services configured` },
                { step: 4, title: "4. Locations", desc: `${computedLocationCount} locations in ${city || "local area"}` },
                { step: 5, title: "5. Keywords", desc: `${keywords.length} target keywords` },
                { step: 6, title: "6. Brand", desc: `${yearsInBusiness || "Trust signals"}, USP, colors` },
                { step: 7, title: "7. Theme", desc: `Theme: ${themeDisplayName}` },
                { step: 8, title: "8. Generation Settings", desc: `${layoutStyle} layout, ${imageProvider}, ${blogPostsCount} blog posts` },
              ].map((item) => (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => {
                    setCurrentStep(item.step);
                    setIsEditBlueprintOpen(false);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="p-3 text-left rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition cursor-pointer flex flex-col justify-between group"
                >
                  <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition">
                    {item.title}
                  </span>
                  <span className="text-[11px] text-slate-500 truncate mt-0.5">
                    {item.desc}
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsEditBlueprintOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post-Generation Storage Decision Modal (Download Only vs Save for Future Optimization) */}
      <GenerationDecisionModal
        isOpen={isDecisionModalOpen}
        businessName={businessName || currentProject?.name || "Local Business Website"}
        pageCount={currentProject?.files?.filter((f) => f.path.endsWith(".html")).length || 6}
        themeName={activeTheme.name}
        isSaving={isSavingDecisionProject}
        onPreview={() => {
          setIsDecisionModalOpen(false);
        }}
        onDownload={handleDownloadFromDecisionModal}
        onConfirm={handleConfirmSaveDecision}
        onDiscard={handleDiscardWebsite}
        onClose={() => setIsDecisionModalOpen(false)}
      />

      {/* Theme Live Preview Modal */}
      <ThemePreviewModal
        theme={previewModalTheme}
        isOpen={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false);
          setPreviewModalTheme(null);
        }}
        onSelectTheme={(themeId) => setSelectedThemeId(themeId)}
        isSelected={previewModalTheme?.id === selectedThemeId}
      />

      {/* Keyword Map & Optimization Modal */}
      {currentProject && (
        <KeywordMapModal
          isOpen={keywordMapOpen}
          onClose={() => setKeywordMapOpen(false)}
          files={currentProject.files}
          businessType={businessType}
          city={city}
          state={stateRegion}
          services={services}
          keywordMap={
            activeSavedProject?.keywordMap ||
            currentProject.files
              .filter((f) => f.path.endsWith(".html"))
              .map((f) => {
                const sug = suggestKeywordsForPage(f.path, businessType, city, stateRegion, services);
                const audit = auditPageSEO(f.content, f.path, sug.primary, sug.secondaries);
                return {
                  pagePath: f.path,
                  primaryKeyword: sug.primary,
                  secondaryKeywords: sug.secondaries,
                  seoScore: audit.totalScore,
                };
              })
          }
          onUpdateKeywordMap={(updated) => {
            if (activeSavedProject) {
              const updatedProject: SavedProject = {
                ...activeSavedProject,
                keywordMap: updated,
              };
              saveProjectToDB(updatedProject);
              setActiveSavedProject(updatedProject);
            }
          }}
          onApplyOptimizedHtml={(pagePath, newHtml) => {
            const updatedFiles = currentProject.files.map((f) =>
              f.path.toLowerCase() === pagePath.toLowerCase() ? { ...f, content: newHtml } : f
            );
            setCurrentProject({ ...currentProject, files: updatedFiles });
            if (activeSavedProject) {
              const updatedProject: SavedProject = {
                ...activeSavedProject,
                files: updatedFiles.map((f) => ({
                  path: f.path,
                  content: f.content,
                  mimeType: f.mimeType || undefined,
                })),
                changeLog: [
                  ...activeSavedProject.changeLog,
                  {
                    id: `log-${Date.now()}`,
                    timestamp: Date.now(),
                    dateStr: new Date().toLocaleDateString(),
                    summary: `Optimized on-page SEO for ${pagePath}`,
                    affectedPages: [pagePath],
                  },
                ],
              };
              saveProjectToDB(updatedProject);
              setActiveSavedProject(updatedProject);
            }
            addToast({
              type: "success",
              title: "Page Optimized",
              message: `Saved optimized HTML for ${pagePath}.`,
            });
          }}
        />
      )}

      {/* Find & Replace & Business Details Modal */}
      {currentProject && (
        <FindReplaceModal
          isOpen={findReplaceOpen}
          onClose={() => setFindReplaceOpen(false)}
          files={currentProject.files}
          onUpdateFiles={(newFiles, logSummary) => {
            setCurrentProject({ ...currentProject, files: newFiles });
            if (activeSavedProject) {
              const updatedProject: SavedProject = {
                ...activeSavedProject,
                files: newFiles.map((f) => ({
                  path: f.path,
                  content: f.content,
                  mimeType: (f as any).mimeType || undefined,
                })),
                changeLog: [
                  ...activeSavedProject.changeLog,
                  {
                    id: `log-${Date.now()}`,
                    timestamp: Date.now(),
                    dateStr: new Date().toLocaleDateString(),
                    summary: logSummary,
                    affectedPages: newFiles.map((f) => f.path),
                  },
                ],
              };
              saveProjectToDB(updatedProject);
              setActiveSavedProject(updatedProject);
            }
            addToast({
              type: "success",
              title: "Site Updated",
              message: logSummary,
            });
          }}
          businessDetails={
            activeSavedProject?.businessDetails || {
              businessName,
              phone,
              email,
              streetAddress,
              city,
              stateRegion,
              zipPostalCode,
              businessHours,
              websiteDomain,
            }
          }
          onUpdateBusinessDetails={(details) => {
            if (activeSavedProject) {
              const updatedProject: SavedProject = {
                ...activeSavedProject,
                businessDetails: details,
              };
              saveProjectToDB(updatedProject);
              setActiveSavedProject(updatedProject);
            }
          }}
          customBlocks={activeSavedProject?.customBlocks || []}
          onUpdateCustomBlocks={(blocks) => {
            if (activeSavedProject) {
              const updatedProject: SavedProject = {
                ...activeSavedProject,
                customBlocks: blocks,
              };
              saveProjectToDB(updatedProject);
              setActiveSavedProject(updatedProject);
            }
          }}
          mustIncludeText=""
          onUpdateMustIncludeText={() => {}}
          canUndo={false}
          onUndo={() => {}}
        />
      )}

      {/* Blog Manager Modal */}
      {blogManagerOpen && currentProject && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[20px] max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative">
            <button
              type="button"
              onClick={() => setBlogManagerOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <BlogManager
              businessType={businessType}
              city={city}
              state={stateRegion}
              services={services}
              businessInfo={{
                businessName,
                address: { city, state: stateRegion, street: streetAddress, zip: zipPostalCode },
                phone,
                email,
              } as any}
              theme={activeTheme}
              domain={websiteDomain || "example.com"}
              existingPosts={[]}
              onAddBlogPost={(newFile) => {
                const updatedFiles = [...currentProject.files, newFile];
                setCurrentProject({ ...currentProject, files: updatedFiles });
                if (activeSavedProject) {
                  const updatedProject: SavedProject = {
                    ...activeSavedProject,
                    files: updatedFiles.map((f) => ({
                      path: f.path,
                      content: f.content,
                      mimeType: (f as any).mimeType || undefined,
                    })),
                  };
                  saveProjectToDB(updatedProject);
                  setActiveSavedProject(updatedProject);
                }
                addToast({
                  type: "success",
                  title: "Blog Post Created",
                  message: `Added ${newFile.path} to your website!`,
                });
              }}
              onUpdateBlogIndex={(indexFile) => {
                const updatedFiles = currentProject.files.map((f) =>
                  f.path === indexFile.path ? indexFile : f
                );
                if (!updatedFiles.some((f) => f.path === indexFile.path)) {
                  updatedFiles.push(indexFile);
                }
                setCurrentProject({ ...currentProject, files: updatedFiles });
                if (activeSavedProject) {
                  const updatedProject: SavedProject = {
                    ...activeSavedProject,
                    files: updatedFiles.map((f) => ({
                      path: f.path,
                      content: f.content,
                      mimeType: (f as any).mimeType || undefined,
                    })),
                  };
                  saveProjectToDB(updatedProject);
                  setActiveSavedProject(updatedProject);
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Website Plan Limit Reached Modal */}
      {isLimitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm">
              <Layers className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Website Limit Reached
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                You have created <span className="font-bold text-slate-900 dark:text-white">{savedProjectsList.length}</span> of{" "}
                <span className="font-bold text-slate-900 dark:text-white">
                  {profile?.role === "owner" ? "Unlimited" : (profile?.website_limit ?? (profile?.plan === "agency" ? 30 : 5))}
                </span>{" "}
                websites allowed on your <strong className="capitalize">{profile?.plan || "Starter"}</strong> plan.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
              Upgrade to the <strong>Agency Plan (up to 30 websites)</strong> or contact your workspace owner to expand your quota.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsLimitModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
              >
                Close
              </button>
              <Link
                href="/pricing"
                onClick={() => setIsLimitModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white transition shadow-md shadow-indigo-600/25 flex items-center justify-center gap-1.5"
              >
                <span>Upgrade Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const renderBuilderWorkspace = () => (
    <div className="flex-1 flex flex-col w-full min-h-0">
      {user && viewMode === "builder" && !currentProject && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 pb-0 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              loadAllSavedProjects();
              setViewMode("dashboard");
            }}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition flex items-center space-x-1"
          >
            <span>← Back to Projects Dashboard</span>
          </button>
        </div>
      )}

      {currentProject ? (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
              <ErrorBoundary fallbackTitle="Live Preview Encountered an Issue">
                <LivePreview
                  project={currentProject}
                  isSaved={isCurrentProjectSaved}
                  onSaveForFuture={
                    !isCurrentProjectSaved && pendingGeneratedSite
                      ? () => handlePersistProjectToDashboard(pendingGeneratedSite.data, pendingGeneratedSite.usedFormData)
                      : undefined
                  }
                  onDiscard={handleDiscardWebsite}
                  onNewWebsite={() => {
                    setCurrentProject(null);
                    setCurrentStep(1);
                  }}
                  onGenerateAgain={handleGenerateWebsite}
                  onTryAnotherTheme={() => {
                    setCurrentProject(null);
                    setCurrentStep(5);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  onUpdateProject={(updatedProj) => {
                    setCurrentProject(updatedProj);
                    if (isCurrentProjectSaved) {
                      try {
                        saveProjectToDB({
                          id: updatedProj.projectId,
                          name: updatedProj.name,
                          provider: updatedProj.provider as any,
                          model: updatedProj.model,
                          prompt: `Theme: ${updatedProj.themeName || "Default"}`,
                          createdAt: Date.now(),
                          lastEditedAt: Date.now(),
                          files: updatedProj.files,
                        } as any);
                      } catch {}
                    }
                  }}
                  onOpenManager={() => {
                    if (!user) {
                      setLoginModalReason("Sign in to your team account to access the Website Manager and Dashboard.");
                      setLoginModalOpen(true);
                      return;
                    }
                    if (activeSavedProject) {
                      setViewMode("manager");
                      setNavTab("projects");
                    } else {
                      loadAllSavedProjects().then(() => {
                        setViewMode("dashboard");
                        setNavTab("projects");
                      });
                    }
                  }}
                  onOpenKeywordMap={() => setKeywordMapOpen(true)}
                  onOpenFindReplace={() => setFindReplaceOpen(true)}
                  onOpenBlogManager={() => setBlogManagerOpen(true)}
                />
              </ErrorBoundary>
            </div>
          ) : (
            <main className="flex-1 flex flex-col justify-start py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
              {generating || generationStage.startsWith("FAILED") ? (
                /* VIEW 2: CENTRALIZED GENERATION PIPELINE */
                <div className="max-w-2xl mx-auto w-full my-auto py-12 px-4">
                  {generationStage.startsWith("FAILED") && generationError ? (
                    /* HONEST FAILURE & RECOVERY SCREEN */
                    <div className="bg-white border border-rose-200 rounded-[16px] p-8 sm:p-10 shadow-lg text-center space-y-6 animate-in fade-in duration-300">
                      <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
                        <AlertCircle className="w-8 h-8" />
                      </div>

                      <div>
                        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 mb-2 uppercase tracking-wide">
                          Stage Failed: {generationError.failedStage || generationStage}
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-1.5">
                          Generation Halted at {String(generationError.failedStage || generationStage).replace("FAILED_", "").replace(/_/g, " ")}
                        </h2>
                        <div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-xl text-left my-3">
                          <p className="text-xs font-semibold text-rose-800 mb-0.5">Stage Error Details:</p>
                          <p className="text-xs text-rose-700 font-mono break-words leading-relaxed">
                            {generationError.message}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          All entered business details, SEO keywords, and service area settings were preserved. You can retry with your active AI provider or immediately assemble using curated trade templates.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setRetryCount((prev) => prev + 1);
                            addGenLog(`Initiating pipeline retry (Attempt #${retryCount + 1})...`, "info");
                            handleGenerateWebsite();
                          }}
                          className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Retry Pipeline {retryCount > 0 ? `(Attempt #${retryCount + 1})` : ""}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenSettings("models", "Verify or update your AI API key")}
                          className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                        >
                          <Key className="w-3.5 h-3.5 text-amber-300" />
                          <span>Check AI Settings</span>
                        </button>
                        {generationError.canFallback && (
                          <button
                            type="button"
                            onClick={handleInstantSafeGeneration}
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                          >
                            <Zap className="w-3.5 h-3.5 text-amber-200" />
                            <span>Assemble with Curated Templates (&lt; 1s)</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setGenerationStage("IDLE");
                            setGenerationError(null);
                          }}
                          className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium transition"
                        >
                          Return to Form
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ACTIVE GENERATION PIPELINE SCREEN */
                    <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-8 sm:p-10 shadow-lg text-center space-y-6">
                      <div className="w-16 h-16 rounded-full bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center mx-auto shadow-sm">
                        <Loader2 className="w-8 h-8 animate-spin" />
                      </div>

                      <div>
                        <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 mb-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                          <span>Pipeline Stage: {generationStage}</span>
                        </div>
                        <h2 className="text-xl font-bold text-[#0F172A] mb-1.5">
                          Building Your Static Website
                        </h2>
                        <p className="text-sm font-medium text-[#4F46E5] min-h-[24px] transition-all">
                          {generationProgressText}
                        </p>
                        <p className="text-xs text-[#64748B] mt-1">
                          Zero-build static HTML, CSS, JavaScript, and Schema.org markup.
                          {generationElapsedSeconds > 0 && (
                            <span className="font-semibold text-slate-500 ml-1.5">
                              ({generationElapsedSeconds}s elapsed)
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Stage Machine Pipeline Indicators (Canonical 14 Stages) */}
                      <div className="py-2 px-1 border-y border-slate-100 overflow-x-auto no-scrollbar">
                        <div className="flex items-center justify-between min-w-[580px] gap-1 text-[10px] font-medium">
                          {[
                            { id: "QUEUED", label: "Queue" },
                            { id: "RESEARCHING", label: "Research" },
                            { id: "BLUEPRINT_READY", label: "Blueprint" },
                            { id: "CONTENT_PLANNING", label: "Plan" },
                            { id: "GENERATING_CONTENT", label: "Copy" },
                            { id: "COLLECTING_IMAGES", label: "Images" },
                            { id: "BUILDING_PAGES", label: "Build" },
                            { id: "GENERATING_INTERNAL_LINKS", label: "Links" },
                            { id: "GENERATING_SEO", label: "SEO" },
                            { id: "RUNNING_AUDIT", label: "Audit" },
                            { id: "AUTO_FIXING", label: "Fix" },
                            { id: "FINAL_VALIDATION", label: "Validate" },
                            { id: "PACKAGING", label: "Package" },
                            { id: "READY", label: "Ready" },
                          ].map((stg, idx) => {
                            const stagesOrder = GENERATION_STAGES;
                            const currentIdx = stagesOrder.indexOf(generationStage as GenerationStageName);
                            const isPast = currentIdx > idx;
                            const isCurrent = currentIdx === idx;
                            return (
                              <div
                                key={stg.id}
                                className={`flex flex-col items-center space-y-1 flex-1 ${
                                  isCurrent
                                    ? "text-indigo-600 font-bold"
                                    : isPast
                                    ? "text-emerald-600"
                                    : "text-slate-400"
                                }`}
                              >
                                <div
                                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                                    isCurrent
                                      ? "bg-indigo-600 ring-4 ring-indigo-100 animate-pulse scale-110"
                                      : isPast
                                      ? "bg-emerald-500"
                                      : "bg-slate-200"
                                  }`}
                                />
                                <span className="truncate max-w-[42px]">{stg.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Animated Progress Bar */}
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-[#4F46E5] h-full rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${generationPercent}%` }}
                        />
                      </div>

                      {/* Active AI Processing Banner */}
                      {isGenerationTakingLong && (
                        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-left space-y-2 animate-in fade-in duration-200">
                          <div className="flex items-center space-x-2 text-indigo-900 font-bold text-xs">
                            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 animate-pulse" />
                            <span>AI generation in progress ({generationElapsedSeconds}s elapsed)</span>
                          </div>
                          <p className="text-[11px] text-indigo-800 leading-relaxed">
                            The AI provider is generating detailed content for your website pages. All entered targeting details and business facts are safely preserved.
                          </p>
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={handleCancelGeneration}
                              className="px-2.5 py-1 text-xs font-semibold rounded bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition"
                            >
                              Cancel Generation
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Live Activity Log */}
                      {generationLogs.length > 0 && (
                        <div className="text-left p-3.5 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] max-h-36 overflow-y-auto space-y-1 border border-slate-800 shadow-inner">
                          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5 flex items-center justify-between pb-1 border-b border-slate-800">
                            <span>Live Pipeline Activity</span>
                            <span className="text-emerald-400 font-sans flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              <span>Active</span>
                            </span>
                          </div>
                          {generationLogs.map((log) => (
                            <div key={log.id} className="flex items-start space-x-2 leading-relaxed">
                              <span className="text-slate-500 shrink-0 select-none">[{log.time}]</span>
                              <span
                                className={
                                  log.type === "warn"
                                    ? "text-amber-300"
                                    : log.type === "error"
                                    ? "text-rose-400 font-bold"
                                    : log.type === "success"
                                    ? "text-emerald-300 font-semibold"
                                    : "text-slate-300"
                                }
                              >
                                {log.message}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleCancelGeneration}
                          className="text-xs font-semibold text-[#64748B] hover:text-[#EF4444] px-3 py-1.5 rounded-lg transition"
                        >
                          Cancel Generation
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
          /* VIEW 3: STEP-BY-STEP WIZARD */
          <div className="max-w-[720px] mx-auto w-full space-y-6">
            {/* Quick Actions Bar (Start over & Fill example) */}
            <div className="flex items-center justify-between text-xs text-[#64748B] px-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium">{BRAND.name} Static Builder</span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleFillExample}
                  className="inline-flex items-center space-x-1 text-[#4F46E5] hover:text-[#4338CA] font-semibold hover:underline"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Fill with Dallas Plumbing Example</span>
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={handleStartOver}
                  className="text-[#94A3B8] hover:text-[#EF4444] transition"
                >
                  Start Over
                </button>
              </div>
            </div>

            {/* Horizontal Step Progress Bar */}
            <div className="bg-white border border-[#E2E8F0] rounded-[14px] p-3 sm:p-4 shadow-sm overflow-x-auto no-scrollbar">
              {/* Desktop Progress Stepper */}
              <div className="hidden lg:flex items-center justify-between min-w-[820px] gap-1">
                {stepsList.map((step, idx) => {
                  const isCurrent = currentStep === step.number;
                  const isCompleted = step.number < currentStep || step.number <= maxCompletedStep;
                  const isClickable = step.number <= maxCompletedStep;

                  return (
                    <React.Fragment key={step.number}>
                      <button
                        type="button"
                        onClick={() => handleJumpToStep(step.number)}
                        disabled={!isClickable}
                        className={`flex items-center space-x-1.5 transition text-left shrink-0 ${
                          isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                        }`}
                        title={`Go to Step ${step.number}: ${step.label}`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition shrink-0 ${
                            isCurrent
                              ? "bg-[#4F46E5] text-white ring-4 ring-[#EEF2FF]"
                              : isCompleted && step.number < currentStep
                              ? "bg-[#10B981] text-white"
                              : "bg-slate-100 text-[#64748B] border border-slate-200"
                          }`}
                        >
                          {isCompleted && step.number < currentStep ? (
                            <Check className="w-3 h-3 stroke-[3]" />
                          ) : (
                            step.number
                          )}
                        </div>
                        <span
                          className={`text-xs font-semibold whitespace-nowrap ${
                            isCurrent
                              ? "text-[#4F46E5]"
                              : isCompleted
                              ? "text-[#0F172A]"
                              : "text-[#94A3B8]"
                          }`}
                        >
                          {step.label}
                        </span>
                      </button>

                      {idx < stepsList.length - 1 && (
                        <div
                          className={`flex-1 min-w-[12px] h-0.5 mx-1.5 rounded transition-colors ${
                            step.number < currentStep ? "bg-[#10B981]" : "bg-[#E2E8F0]"
                          }`}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Mobile / Tablet Progress Stepper */}
              <div className="flex lg:hidden items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#4F46E5]">
                    Step {currentStep} of {stepsList.length}
                  </span>
                  <h4 className="text-sm font-bold text-[#0F172A]">
                    {stepsList[currentStep - 1]?.label}
                  </h4>
                </div>
                <div className="flex items-center space-x-1">
                  {stepsList.map((step) => (
                    <button
                      key={step.number}
                      type="button"
                      onClick={() => handleJumpToStep(step.number)}
                      disabled={step.number > maxCompletedStep}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        currentStep === step.number
                          ? "w-6 bg-[#4F46E5]"
                          : step.number < currentStep
                          ? "w-2.5 bg-[#10B981]"
                          : "w-2.5 bg-slate-200"
                      }`}
                      title={`Step ${step.number}: ${step.label}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Wizard Card Content */}
            <div className="bg-white border border-[#E2E8F0] rounded-[16px] shadow-sm overflow-hidden p-6 sm:p-8 space-y-6">
              {/* STEP 1: BUSINESS */}
              {currentStep === 1 && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  {!hasKey && (
                    <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[12px] p-3.5 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 text-[#92400E]">
                        <Key className="w-4 h-4 shrink-0 text-[#F59E0B]" />
                        <span>Connect an AI model anytime to start building →</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSettingsOpen(true)}
                        className="font-bold text-[#92400E] underline hover:text-black shrink-0 ml-3 cursor-pointer"
                      >
                        Connect Key
                      </button>
                    </div>
                  )}

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#4F46E5] bg-[#EEF2FF] px-2.5 py-0.5 rounded-full border border-[#C7D2FE]">
                      Step 1 of 8
                    </span>
                    <h2 className="text-lg font-bold text-[#0F172A] mt-2">Business Information</h2>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Core contact details used across your site headers, footers, phone CTAs, and LocalBusiness schema.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Business Name */}
                    <div>
                      <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                        Business / Website Name <span className="text-[#EF4444]">*</span>
                      </label>
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => {
                          setBusinessName(e.target.value);
                          if (stepErrors.businessName) {
                            setStepErrors((prev) => ({ ...prev, businessName: "" }));
                          }
                        }}
                        placeholder="e.g. Lone Star Plumbing & Rooter"
                        className="input-base"
                      />
                      {stepErrors.businessName ? (
                        <p className="text-xs text-[#EF4444] mt-1 font-medium">
                          {stepErrors.businessName}
                        </p>
                      ) : (
                        <p className="text-[11px] text-[#64748B] mt-1">
                          Appears in your site header, footer, page titles, and LocalBusiness schema markup.
                        </p>
                      )}
                    </div>

                    {/* Phone & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                          Phone Number <span className="text-[#EF4444]">*</span>
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value);
                            if (stepErrors.phone) setStepErrors((prev) => ({ ...prev, phone: "" }));
                          }}
                          placeholder="(214) 555-0198"
                          className="input-base"
                        />
                        {stepErrors.phone ? (
                          <p className="text-xs text-[#EF4444] mt-1 font-medium">{stepErrors.phone}</p>
                        ) : (
                          <p className="text-[11px] text-[#64748B] mt-1">
                            Used for high-priority &quot;Call Now&quot; buttons and mobile tap-to-call.
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="dispatch@lonestarplumbingdfw.com"
                          className="input-base"
                        />
                        <p className="text-[11px] text-[#64748B] mt-1">
                          Receives quote inquiries and contact form submissions.
                        </p>
                      </div>
                    </div>

                    {/* Website Domain */}
                    <div>
                      <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                        Website Domain
                      </label>
                      <input
                        type="text"
                        value={websiteDomain}
                        onChange={(e) => setWebsiteDomain(e.target.value)}
                        placeholder="www.lonestarplumbingdfw.com"
                        className="input-base"
                      />
                      <p className="text-[11px] text-[#64748B] mt-1">
                        Used to configure canonical URLs, Open Graph meta tags, and sitemap.xml.
                      </p>
                    </div>

                    {/* Street Address & Zip Code */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                          Street Address <span className="text-[#64748B] font-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={streetAddress}
                          onChange={(e) => setStreetAddress(e.target.value)}
                          placeholder="e.g. 4512 Main Street"
                          className="input-base"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                          ZIP / Postal Code <span className="text-[#64748B] font-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={zipPostalCode}
                          onChange={(e) => setZipPostalCode(e.target.value)}
                          placeholder="75201"
                          className="input-base"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: NICHE */}
              {currentStep === 2 && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#4F46E5] bg-[#EEF2FF] px-2.5 py-0.5 rounded-full border border-[#C7D2FE]">
                      Step 2 of 8
                    </span>
                    <h2 className="text-lg font-bold text-[#0F172A] mt-2">Niche &amp; Trade Industry</h2>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Select your exact industry to activate specialized copywriting, conversion hooks, and Schema.org types.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Industry / Business Type */}
                    <div>
                      <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                        Business Type / Industry <span className="text-[#EF4444]">*</span>
                      </label>
                      <select
                        value={businessType}
                        onChange={(e) => handleSelectBusinessType(e.target.value)}
                        className="input-base cursor-pointer"
                      >
                        {POPULAR_INDUSTRIES.map((ind) => (
                          <option key={ind} value={ind}>
                            {ind}
                          </option>
                        ))}
                      </select>

                      {businessType === "Other (Custom)" && (
                        <input
                          type="text"
                          value={customBusinessType}
                          onChange={(e) => setCustomBusinessType(e.target.value)}
                          placeholder="Specify your business category (e.g. Solar Panel Installer)"
                          className="input-base mt-2"
                        />
                      )}

                      {/* Active Niche Pack Indicator Badge */}
                      <div className="mt-2.5 flex items-center justify-between text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-3.5 py-2">
                        <span className="text-[#64748B] flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                          <span>Active Niche Pack: <strong className="text-[#0F172A]">{currentNichePack.name}</strong> ({currentNichePack.schemaType})</span>
                        </span>
                        {currentNichePack.emergencyService ? (
                          <span className="text-[10px] font-bold text-[#DC2626] bg-[#FEF2F2] px-2 py-0.5 rounded border border-[#FECACA]">
                            ⚡ 24/7 Emergency Trade
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-[#4F46E5] bg-[#EEF2FF] px-2 py-0.5 rounded border border-[#C7D2FE]">
                            {currentNichePack.commonServices.length} Trade Services Loaded
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Short Description */}
                    <div>
                      <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                        Short Business Description <span className="text-[#EF4444]">*</span>
                      </label>
                      <textarea
                        rows={4}
                        value={businessDescription}
                        onChange={(e) => {
                          setBusinessDescription(e.target.value);
                          if (stepErrors.businessDescription) {
                            setStepErrors((prev) => ({ ...prev, businessDescription: "" }));
                          }
                        }}
                        placeholder="e.g. Family-owned residential and commercial plumbing company providing 24/7 fast-dispatch repairs, drain clearing, and water heater installation across Dallas-Fort Worth."
                        className="w-full p-3 border border-[#E2E8F0] rounded-[10px] text-sm text-[#0F172A] focus:outline-none focus:border-[#4F46E5] focus:ring-3 focus:ring-[#4F46E5]/15"
                      />
                      {stepErrors.businessDescription ? (
                        <p className="text-xs text-[#EF4444] mt-1 font-medium">
                          {stepErrors.businessDescription}
                        </p>
                      ) : (
                        <p className="text-[11px] text-[#64748B] mt-1">
                          Used to generate persuasive hero headlines, value statements, about sections, and meta descriptions.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: SERVICES */}
              {currentStep === 3 && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#4F46E5] bg-[#EEF2FF] px-2.5 py-0.5 rounded-full border border-[#C7D2FE]">
                      Step 3 of 8
                    </span>
                    <h2 className="text-lg font-bold text-[#0F172A] mt-2">Services Offered</h2>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Specify the core services your company provides. These form your services navigation, service cards, and dedicated SEO landing pages.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Add Service Input */}
                    <div>
                      <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                        Add Services (Type and press Enter, comma, or click Add)
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={serviceInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val.includes(",") || val.includes("\n") || val.includes(";")) {
                              handleAddService(val);
                            } else {
                              setServiceInput(val);
                            }
                          }}
                          onPaste={handlePasteServices}
                          onBlur={() => {
                            if (serviceInput.trim()) {
                              handleAddService();
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === ",") {
                              e.preventDefault();
                              handleAddService();
                            }
                          }}
                          placeholder="e.g. Drain Cleaning, Water Heater Repair (comma separated)"
                          className="input-base flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddService()}
                          className="px-4 py-2 rounded-[10px] bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition cursor-pointer"
                        >
                          + Add
                        </button>
                      </div>

                      {/* Selected Services Chips */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700">
                            Configured Services ({services.length})
                          </span>
                          {services.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setServices([])}
                              className="text-[11px] text-slate-400 hover:text-red-500 transition cursor-pointer"
                            >
                              Clear all
                            </button>
                          )}
                        </div>

                        {services.length === 0 ? (
                          <div className="p-3 border border-dashed border-slate-200 rounded-xl bg-slate-50/60 text-center text-xs text-slate-400">
                            No services added yet. Type services above or select from recommended trade services below.
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl max-h-48 overflow-y-auto">
                            {services.map((srv) => (
                              <span
                                key={srv}
                                className="inline-flex items-center space-x-1.5 bg-white text-[#4F46E5] border border-[#C7D2FE] shadow-2xs px-2.5 py-1 rounded-full text-xs font-medium"
                              >
                                <span>{srv}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveService(srv)}
                                  className="hover:text-red-600 rounded-full cursor-pointer p-0.5"
                                  aria-label={`Remove ${srv}`}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        {stepErrors.services && (
                          <p className="text-xs text-[#EF4444] font-medium mt-1">
                            {stepErrors.services}
                          </p>
                        )}
                      </div>

                      {/* Suggested Services from Niche Pack */}
                      {suggestedServices.length > 0 && (
                        <div className="mt-3 p-3 rounded-[12px] bg-slate-50 border border-slate-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-[#475569] flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
                              Recommended for {currentNichePack.name} (click to add)
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const toAdd = suggestedServices.slice(0, 5);
                                setServices((prev) => [...prev, ...toAdd]);
                                addToast({
                                  type: "success",
                                  title: "Services Added",
                                  message: `Added ${toAdd.length} services from ${currentNichePack.name} pack.`,
                                });
                              }}
                              className="text-[11px] font-semibold text-[#4F46E5] hover:text-[#4338CA] hover:underline cursor-pointer"
                            >
                              + Add Top 5
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {suggestedServices.map((srv) => (
                              <button
                                key={srv}
                                type="button"
                                onClick={() => {
                                  setServices((prev) => [...prev, srv]);
                                }}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white hover:bg-[#EEF2FF] hover:text-[#4F46E5] border border-slate-200 hover:border-[#C7D2FE] text-[#334155] transition shadow-2xs group cursor-pointer"
                                title={`Add "${srv}" to your services`}
                              >
                                <Plus className="w-3 h-3 text-[#94A3B8] group-hover:text-[#4F46E5]" />
                                <span>{srv}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Dedicated Service Landing Pages Toggle */}
                    <div className="pt-2 border-t border-[#E2E8F0]">
                      <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-slate-100/70 transition">
                        <input
                          type="checkbox"
                          checked={separateServicePages}
                          onChange={(e) => setSeparateServicePages(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded text-[#4F46E5] focus:ring-[#4F46E5] cursor-pointer"
                        />
                        <div>
                          <span className="text-xs font-bold text-[#0F172A] block">
                            Create a separate landing page for each main service (Recommended)
                          </span>
                          <p className="text-[11px] text-[#64748B] mt-0.5">
                            Each service receives its own URL (e.g. <code className="text-indigo-600 bg-indigo-50 px-1 rounded">/services/emergency-plumbing.html</code>) with Service Schema and internal linking to rank for high-intent search queries.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: LOCATIONS */}
              {currentStep === 4 && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#4F46E5] bg-[#EEF2FF] px-2.5 py-0.5 rounded-full border border-[#C7D2FE]">
                      Step 4 of 8
                    </span>
                    <h2 className="text-lg font-bold text-[#0F172A] mt-2">Locations &amp; Service Coverage</h2>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Define your primary headquarters city and neighboring service areas for local map pack and neighborhood SEO dominance.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Primary City, State & Country */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                          Primary City <span className="text-[#EF4444]">*</span>
                        </label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => {
                            setCity(e.target.value);
                            if (stepErrors.city) setStepErrors((prev) => ({ ...prev, city: "" }));
                          }}
                          placeholder="Dallas"
                          className="input-base"
                        />
                        {stepErrors.city && (
                          <p className="text-xs text-[#EF4444] mt-1 font-medium">{stepErrors.city}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                          State / Region <span className="text-[#EF4444]">*</span>
                        </label>
                        <input
                          type="text"
                          value={stateRegion}
                          onChange={(e) => {
                            setStateRegion(e.target.value);
                            if (stepErrors.stateRegion)
                              setStepErrors((prev) => ({ ...prev, stateRegion: "" }));
                          }}
                          placeholder="TX"
                          className="input-base"
                        />
                        {stepErrors.stateRegion && (
                          <p className="text-xs text-[#EF4444] mt-1 font-medium">{stepErrors.stateRegion}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                          Country
                        </label>
                        <input
                          type="text"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          placeholder="USA"
                          className="input-base"
                        />
                      </div>
                    </div>

                    {/* Additional Service Areas Input & Chips */}
                    <div>
                      <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                        Nearby Cities &amp; Suburbs (Type or paste comma-separated areas)
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={areaInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val.includes(",") || val.includes("\n") || val.includes(";")) {
                              handleAddArea(val);
                            } else {
                              setAreaInput(val);
                            }
                          }}
                          onPaste={handlePasteAreas}
                          onBlur={() => {
                            if (areaInput.trim()) {
                              handleAddArea();
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === ",") {
                              e.preventDefault();
                              handleAddArea();
                            }
                          }}
                          placeholder="e.g. Plano, Frisco, McKinney, Irving, Richardson"
                          className="input-base flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddArea()}
                          className="px-4 py-2 rounded-[10px] bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition cursor-pointer"
                        >
                          + Add
                        </button>
                      </div>

                      {serviceAreas.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl mb-3">
                          {serviceAreas.map((area) => (
                            <span
                              key={area}
                              className="inline-flex items-center space-x-1.5 bg-white text-[#0F172A] border border-slate-200 shadow-2xs px-2.5 py-1 rounded-full text-xs font-medium"
                            >
                              <span>{area}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveArea(area)}
                                className="hover:text-red-600 rounded-full cursor-pointer p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Interactive Radius & City Coverage Picker */}
                    <div className="pt-2 border-t border-[#E2E8F0]">
                      <ServiceAreaPicker
                        businessCity={city}
                        businessState={stateRegion}
                        businessName={businessName}
                        mainService={services[0] || businessType}
                        servicesList={services}
                        selectedCities={serviceAreaCities}
                        onSelectedCitiesChange={setServiceAreaCities}
                        createSeparateServiceLocationPages={separateAreaPages}
                        onCreateSeparateServiceLocationPagesChange={setSeparateAreaPages}
                        confirmedServesAreas={confirmedServesAreas}
                        onConfirmedServesAreasChange={setConfirmedServesAreas}
                      />
                      {stepErrors.confirmedServesAreas && (
                        <p className="text-xs text-[#EF4444] mt-2 font-medium">
                          {stepErrors.confirmedServesAreas}
                        </p>
                      )}
                    </div>

                    {/* Dedicated Location Pages Toggle */}
                    <div className="pt-2 border-t border-[#E2E8F0]">
                      <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-slate-100/70 transition">
                        <input
                          type="checkbox"
                          checked={separateAreaPages}
                          onChange={(e) => setSeparateAreaPages(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded text-[#4F46E5] focus:ring-[#4F46E5] cursor-pointer"
                        />
                        <div>
                          <span className="text-xs font-bold text-[#0F172A] block">
                            Create a dedicated page for each service area (Recommended)
                          </span>
                          <p className="text-[11px] text-[#64748B] mt-0.5">
                            Ranks individual neighboring cities and suburbs on Google Local Pack with dedicated URLs (e.g. <code className="text-indigo-600 bg-indigo-50 px-1 rounded">/areas/plano.html</code>) and localized content.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: KEYWORDS */}
              {currentStep === 5 && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#4F46E5] bg-[#EEF2FF] px-2.5 py-0.5 rounded-full border border-[#C7D2FE]">
                      Step 5 of 8
                    </span>
                    <h2 className="text-lg font-bold text-[#0F172A] mt-2">Target SEO Keywords</h2>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Target keywords and high-intent local search queries your customers use to find your services.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <label className="text-xs font-semibold text-[#0F172A]">
                          Keywords &amp; Search Queries <span className="text-[#EF4444]">*</span>
                        </label>
                        <span className="text-[10px] font-medium text-[#4F46E5] bg-[#EEF2FF] px-2 py-0.5 rounded-full border border-[#C7D2FE]">
                          {currentNichePack.name} Patterns
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleSuggestKeywords}
                        className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] hover:underline cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Suggest {currentNichePack.name} Keywords</span>
                      </button>
                    </div>

                    {/* Keyword Input with Paste Interceptor */}
                    <div className="space-y-1">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={keywordInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val.includes(",") || val.includes("\n") || val.includes(";")) {
                              handleAddKeyword(val);
                            } else {
                              setKeywordInput(val);
                            }
                          }}
                          onPaste={handlePasteKeywords}
                          onBlur={() => {
                            if (keywordInput.trim()) {
                              handleAddKeyword();
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === ",") {
                              e.preventDefault();
                              handleAddKeyword();
                            }
                          }}
                          placeholder="e.g. emergency plumber in Dallas TX, 24/7 drain cleaning, water heater repair"
                          className="input-base flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddKeyword()}
                          className="px-4 py-2 rounded-[10px] bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition shadow-2xs cursor-pointer"
                        >
                          + Add
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Paste comma-separated or newline-separated keywords. Long-tail phrases like &ldquo;emergency plumber near me&rdquo; stay intact.
                      </p>
                    </div>

                    {/* Selected Keywords Section */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">
                          Selected Target Keywords ({keywords.length})
                        </span>
                        {keywords.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setKeywords([])}
                            className="text-[11px] text-slate-400 hover:text-red-500 transition cursor-pointer"
                          >
                            Clear all
                          </button>
                        )}
                      </div>

                      {keywords.length === 0 ? (
                        <div className="p-3 border border-dashed border-slate-200 rounded-xl bg-slate-50/60 text-center text-xs text-slate-400">
                          No keywords added yet. Paste comma-separated keywords above or click &ldquo;Suggest {currentNichePack.name} Keywords&rdquo;.
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50/70 border border-slate-200/80 rounded-xl max-h-48 overflow-y-auto">
                          {keywords.map((kw) => (
                            <span
                              key={kw}
                              className="inline-flex items-center space-x-1.5 bg-white text-indigo-700 border border-indigo-200 shadow-2xs px-2.5 py-1 rounded-full text-xs font-medium group hover:border-indigo-300 transition"
                            >
                              <span>{kw}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveKeyword(kw)}
                                className="text-slate-400 hover:text-red-600 rounded-full transition cursor-pointer p-0.5"
                                title={`Remove "${kw}"`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      {stepErrors.keywords && (
                        <p className="text-xs text-[#EF4444] font-medium">
                          {stepErrors.keywords}
                        </p>
                      )}
                    </div>

                    {/* Suggested Keywords Section */}
                    {suggestedKeywords.length > 0 && (
                      <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            <span className="text-xs font-bold text-slate-900">
                              Suggested Keywords ({suggestedKeywords.length})
                            </span>
                            <span className="text-[10px] text-slate-500 font-normal">
                              ({selectedSuggestions.length} selected)
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs">
                            <button
                              type="button"
                              onClick={handleToggleAllSuggestions}
                              className="px-2 py-0.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100/70 rounded transition cursor-pointer"
                            >
                              {selectedSuggestions.length === suggestedKeywords.length
                                ? "Deselect All"
                                : "Select All"}
                            </button>
                            <button
                              type="button"
                              onClick={handleAddSelectedSuggestions}
                              disabled={selectedSuggestions.length === 0}
                              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-2xs transition cursor-pointer"
                            >
                              + Add Selected ({selectedSuggestions.length})
                            </button>
                            <button
                              type="button"
                              onClick={handleDismissSuggestions}
                              className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition cursor-pointer"
                              title="Dismiss suggestions"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                          {suggestedKeywords.map((sug) => {
                            const isChecked = selectedSuggestions.includes(sug);
                            return (
                              <div
                                key={sug}
                                onClick={() => handleToggleSuggestion(sug)}
                                className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition select-none ${
                                  isChecked
                                    ? "bg-indigo-600 text-white border border-indigo-600 shadow-2xs"
                                    : "bg-white text-slate-700 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleSuggestion(sug)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-3 h-3 text-indigo-600 rounded border-slate-300 focus:ring-0 cursor-pointer"
                                />
                                <span>{sug}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddSingleSuggestion(sug);
                                  }}
                                  className={`ml-1 text-[10px] font-bold px-1 rounded transition cursor-pointer ${
                                    isChecked
                                      ? "text-indigo-100 hover:text-white"
                                      : "text-indigo-600 hover:bg-indigo-100"
                                  }`}
                                  title={`Add "${sug}" immediately`}
                                >
                                  + Add
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 6: BRAND */}
              {currentStep === 6 && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#4F46E5] bg-[#EEF2FF] px-2.5 py-0.5 rounded-full border border-[#C7D2FE]">
                      Step 6 of 8
                    </span>
                    <h2 className="text-lg font-bold text-[#0F172A] mt-2">Brand Identity &amp; Trust Signals</h2>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Configure your value propositions, business hours, brand colors, and custom voice instructions.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Differentiators: USP & Years in Business */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                          Unique Selling Points (USP)
                        </label>
                        <input
                          type="text"
                          value={uniqueSellingPoints}
                          onChange={(e) => setUniqueSellingPoints(e.target.value)}
                          placeholder="e.g. 45-min arrival, upfront pricing, licensed master plumbers"
                          className="input-base"
                        />
                        <p className="text-[11px] text-[#64748B] mt-1">
                          Highlighted in trust badges, hero bullets, and conversion banners.
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                          Years in Business
                        </label>
                        <input
                          type="text"
                          value={yearsInBusiness}
                          onChange={(e) => setYearsInBusiness(e.target.value)}
                          placeholder="e.g. 20+ Years"
                          className="input-base"
                        />
                        <p className="text-[11px] text-[#64748B] mt-1">
                          Builds instant local credibility on the homepage and about page.
                        </p>
                      </div>
                    </div>

                    {/* Business Hours */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-[#0F172A]">
                          Business Hours &amp; Availability
                        </label>
                        {currentNichePack.emergencyService && (
                          <span className="text-[10px] font-semibold text-[#DC2626]">
                            ⚡ 24/7 Trade
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={businessHours}
                        onChange={(e) => setBusinessHours(e.target.value)}
                        placeholder="e.g. Monday - Sunday: 24/7 Emergency Dispatch"
                        className="input-base"
                      />
                    </div>

                    {/* Custom Content Instructions */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-[#0F172A]">
                          Custom Content Instructions <span className="text-[#64748B] font-normal">(Optional)</span>
                        </label>
                        <span className="text-[11px] text-[#64748B]">Tone, brand voice, special phrasing</span>
                      </div>
                      <textarea
                        rows={3}
                        value={customContentInstructions}
                        onChange={(e) => setCustomContentInstructions(e.target.value)}
                        placeholder="Tell RankLocal how you want this website's content to feel, what to emphasize, or anything specific you want included. RankLocal will combine your instructions with its SEO and content-quality system."
                        className="w-full p-3 border border-[#E2E8F0] rounded-[10px] text-sm text-[#0F172A] focus:outline-none focus:border-[#4F46E5] focus:ring-3 focus:ring-[#4F46E5]/15"
                      />
                    </div>

                    {/* Brand Colors Override */}
                    <div className="p-4 rounded-[12px] border border-[#E2E8F0] bg-slate-50/70 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Palette className="w-4 h-4 text-[#4F46E5]" />
                          <h4 className="text-xs font-bold text-[#0F172A]">Brand Colors</h4>
                        </div>
                        {hasCustomColors && (
                          <button
                            type="button"
                            onClick={() => setCustomThemeColors({})}
                            className="text-[11px] font-semibold text-[#4F46E5] hover:underline flex items-center space-x-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reset to theme colors</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Primary Color Picker */}
                        <div className="p-2.5 rounded-[10px] border border-[#E2E8F0] bg-white space-y-1">
                          <label className="block text-[11px] font-bold text-[#0F172A]">
                            Primary Color
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={activeColors.primary}
                              onChange={(e) =>
                                setCustomThemeColors((prev) => ({ ...prev, primary: e.target.value }))
                              }
                              className="w-8 h-8 rounded-[6px] border border-[#CBD5E1] cursor-pointer p-0.5 bg-white shrink-0"
                            />
                            <input
                              type="text"
                              value={activeColors.primary}
                              onChange={(e) =>
                                setCustomThemeColors((prev) => ({ ...prev, primary: e.target.value }))
                              }
                              className="input-base text-xs font-mono h-8 uppercase"
                            />
                          </div>
                        </div>

                        {/* Accent Color Picker */}
                        <div className="p-2.5 rounded-[10px] border border-[#E2E8F0] bg-white space-y-1">
                          <label className="block text-[11px] font-bold text-[#0F172A]">
                            Accent Color
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={activeColors.accent}
                              onChange={(e) =>
                                setCustomThemeColors((prev) => ({ ...prev, accent: e.target.value }))
                              }
                              className="w-8 h-8 rounded-[6px] border border-[#CBD5E1] cursor-pointer p-0.5 bg-white shrink-0"
                            />
                            <input
                              type="text"
                              value={activeColors.accent}
                              onChange={(e) =>
                                setCustomThemeColors((prev) => ({ ...prev, accent: e.target.value }))
                              }
                              className="input-base text-xs font-mono h-8 uppercase"
                            />
                          </div>
                        </div>

                        {/* Background Color Picker */}
                        <div className="p-2.5 rounded-[10px] border border-[#E2E8F0] bg-white space-y-1">
                          <label className="block text-[11px] font-bold text-[#0F172A]">
                            Background Color
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={activeColors.background}
                              onChange={(e) =>
                                setCustomThemeColors((prev) => ({ ...prev, background: e.target.value }))
                              }
                              className="w-8 h-8 rounded-[6px] border border-[#CBD5E1] cursor-pointer p-0.5 bg-white shrink-0"
                            />
                            <input
                              type="text"
                              value={activeColors.background}
                              onChange={(e) =>
                                setCustomThemeColors((prev) => ({ ...prev, background: e.target.value }))
                              }
                              className="input-base text-xs font-mono h-8 uppercase"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Collapsible Advanced Brand Media (Logo, Socials, Google Maps) */}
                    <div className="border border-[#E2E8F0] rounded-[10px] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setShowCollapsibleSeo(!showCollapsibleSeo)}
                        className="w-full p-3 bg-slate-50 flex items-center justify-between text-xs font-semibold text-[#0F172A] hover:bg-slate-100 transition cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
                          <span>Logo, Social Profiles &amp; Google Maps (Optional)</span>
                        </div>
                        {showCollapsibleSeo ? (
                          <ChevronUp className="w-4 h-4 text-[#64748B]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#64748B]" />
                        )}
                      </button>
                      {showCollapsibleSeo && (
                        <div className="p-4 space-y-3 bg-white">
                          <div>
                            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                              Logo Image URL
                            </label>
                            <input
                              type="url"
                              value={logoUrl}
                              onChange={(e) => setLogoUrl(e.target.value)}
                              placeholder="https://example.com/logo.png"
                              className="input-base"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                              Google Maps Link or Embed URL
                            </label>
                            <input
                              type="text"
                              value={googleMaps}
                              onChange={(e) => setGoogleMaps(e.target.value)}
                              placeholder="https://maps.google.com/?q=Dallas+TX"
                              className="input-base"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                              Social Media Profiles (Facebook, Yelp, Instagram)
                            </label>
                            <input
                              type="text"
                              value={socialLinks}
                              onChange={(e) => setSocialLinks(e.target.value)}
                              placeholder="Facebook: facebook.com/mybiz, Yelp: yelp.com/biz/mybiz"
                              className="input-base"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 7: THEME */}
              {currentStep === 7 && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#4F46E5] bg-[#EEF2FF] px-2.5 py-0.5 rounded-full border border-[#C7D2FE]">
                        Step 7 of 8
                      </span>
                      <h2 className="text-lg font-bold text-[#0F172A] mt-2">Website Theme Archetype</h2>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        Select a visual style calibrated for your business and industry.
                      </p>
                    </div>
                    {hasCustomColors && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] self-start sm:self-auto">
                        <span>● Custom colors active</span>
                      </span>
                    )}
                  </div>

                  {/* Theme Gallery Cards: 3 columns desktop, 2 tablet, 1 mobile */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {THEMES.filter((t) => !t.isLegacy).map((theme) => {
                      const isSelected = selectedThemeId === theme.id;
                      const isRecommended = recommendedThemeIds.includes(theme.id);
                      const previewColors = isSelected ? activeColors : theme.colors;

                      return (
                        <div
                          key={theme.id}
                          onClick={() => setSelectedThemeId(theme.id)}
                          className={`rounded-[16px] border p-4 text-left cursor-pointer transition-all flex flex-col justify-between relative group ${
                            isSelected
                              ? "border-[#4F46E5] bg-white ring-2 ring-[#4F46E5] shadow-md transform -translate-y-0.5"
                              : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1] hover:shadow-xs"
                          }`}
                        >
                          {/* Badges Bar (Recommended & Selected) */}
                          <div className="flex items-center justify-between gap-1 mb-2.5 min-h-[22px]">
                            {isRecommended ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]">
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>Recommended for {currentNichePack.name}</span>
                              </span>
                            ) : (
                              <span />
                            )}

                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center transition shrink-0 ${
                                isSelected
                                  ? "bg-[#4F46E5] border-[#4F46E5] text-white"
                                  : "border-slate-300 bg-white group-hover:border-slate-400"
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>

                          {/* Mini HTML/CSS Visual Mock Preview */}
                          <div className="mb-3">
                            <ThemeMiniPreview theme={theme} colors={previewColors} />
                          </div>

                          {/* Theme Name & Description */}
                          <div className="space-y-2 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between gap-1">
                                <h3 className="text-sm font-bold text-[#0F172A]">{theme.name}</h3>
                                {isSelected && hasCustomColors && (
                                  <span className="text-[10px] font-semibold text-[#10B981] bg-[#ECFDF5] px-1.5 py-0.5 rounded border border-[#A7F3D0]">
                                    Customized
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#64748B] leading-relaxed mt-0.5">
                                {theme.description}
                              </p>
                            </div>

                            {/* Key Design Characteristics */}
                            {theme.designCharacteristics && theme.designCharacteristics.length > 0 && (
                              <div className="pt-2 border-t border-slate-100 space-y-1">
                                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                                  Key Features:
                                </span>
                                <ul className="text-[11px] text-slate-600 space-y-0.5">
                                  {theme.designCharacteristics.slice(0, 3).map((char, i) => (
                                    <li key={i} className="flex items-center gap-1.5 truncate">
                                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                      <span className="truncate">{char}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <div className="pt-2 border-t border-slate-100 space-y-1.5">
                              {/* Typography Pair */}
                              <div className="text-[10px] font-mono text-[#64748B] truncate">
                                <span className="font-semibold text-[#0F172A]">{theme.fonts.heading}</span> + {theme.fonts.body}
                              </div>

                              {/* Best For Tags */}
                              <div className="flex flex-wrap items-center gap-1">
                                <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
                                  Best for:
                                </span>
                                {theme.bestFor.slice(0, 3).map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-[10px] px-1.5 py-0.5 rounded-[5px] bg-slate-100 text-[#475569] font-medium border border-slate-200"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Preview & Select Buttons */}
                            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 mt-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewModalTheme(theme);
                                  setIsPreviewModalOpen(true);
                                }}
                                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/50 text-slate-700 hover:text-indigo-600 text-xs font-semibold transition"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Preview</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedThemeId(theme.id);
                                }}
                                className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                  isSelected
                                    ? "bg-emerald-600 text-white shadow-2xs"
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs"
                                }`}
                              >
                                {isSelected ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    <span>Selected</span>
                                  </>
                                ) : (
                                  <span>Select Theme</span>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Below the Grid: Optional Customize Colors Section */}
                  <div className="p-4 sm:p-5 rounded-[14px] border border-[#E2E8F0] bg-white shadow-xs space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-1.5">
                          <Palette className="w-4 h-4 text-[#4F46E5]" />
                          <span>Customize colors for {activeTheme.name}</span>
                        </h3>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          Override the theme defaults with your exact brand hex values.
                        </p>
                      </div>

                      {hasCustomColors && (
                        <button
                          type="button"
                          onClick={() => setCustomThemeColors({})}
                          className="text-xs font-semibold text-[#4F46E5] hover:underline flex items-center space-x-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset to theme colors</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      {/* Primary Color Picker */}
                      <div className="p-3 rounded-[10px] border border-[#E2E8F0] bg-slate-50/60 space-y-1.5">
                        <label className="block text-xs font-bold text-[#0F172A]">
                          Primary Color
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={activeColors.primary}
                            onChange={(e) =>
                              setCustomThemeColors((prev) => ({ ...prev, primary: e.target.value }))
                            }
                            className="w-9 h-9 rounded-[8px] border border-[#CBD5E1] cursor-pointer p-0.5 bg-white shrink-0"
                            title="Choose Primary Color"
                          />
                          <input
                            type="text"
                            value={activeColors.primary}
                            onChange={(e) =>
                              setCustomThemeColors((prev) => ({ ...prev, primary: e.target.value }))
                            }
                            className="input-base text-xs font-mono h-9 uppercase"
                            placeholder="#1D4ED8"
                          />
                        </div>
                        <span className="text-[10px] text-[#64748B] block">Buttons, hero &amp; key brand elements</span>
                      </div>

                      {/* Accent Color Picker */}
                      <div className="p-3 rounded-[10px] border border-[#E2E8F0] bg-slate-50/60 space-y-1.5">
                        <label className="block text-xs font-bold text-[#0F172A]">
                          Accent Color
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={activeColors.accent}
                            onChange={(e) =>
                              setCustomThemeColors((prev) => ({ ...prev, accent: e.target.value }))
                            }
                            className="w-9 h-9 rounded-[8px] border border-[#CBD5E1] cursor-pointer p-0.5 bg-white shrink-0"
                            title="Choose Accent Color"
                          />
                          <input
                            type="text"
                            value={activeColors.accent}
                            onChange={(e) =>
                              setCustomThemeColors((prev) => ({ ...prev, accent: e.target.value }))
                            }
                            className="input-base text-xs font-mono h-9 uppercase"
                            placeholder="#0EA5E9"
                          />
                        </div>
                        <span className="text-[10px] text-[#64748B] block">Badges, stars &amp; highlights</span>
                      </div>

                      {/* Background Color Picker */}
                      <div className="p-3 rounded-[10px] border border-[#E2E8F0] bg-slate-50/60 space-y-1.5">
                        <label className="block text-xs font-bold text-[#0F172A]">
                          Background Color
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={activeColors.background}
                            onChange={(e) =>
                              setCustomThemeColors((prev) => ({ ...prev, background: e.target.value }))
                            }
                            className="w-9 h-9 rounded-[8px] border border-[#CBD5E1] cursor-pointer p-0.5 bg-white shrink-0"
                            title="Choose Background Color"
                          />
                          <input
                            type="text"
                            value={activeColors.background}
                            onChange={(e) =>
                              setCustomThemeColors((prev) => ({ ...prev, background: e.target.value }))
                            }
                            className="input-base text-xs font-mono h-9 uppercase"
                            placeholder="#F8FAFC"
                          />
                        </div>
                        <span className="text-[10px] text-[#64748B] block">Page canvas &amp; section backgrounds</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 8: GENERATION SETTINGS */}
              {currentStep === 8 && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#4F46E5] bg-[#EEF2FF] px-2.5 py-0.5 rounded-full border border-[#C7D2FE]">
                      Step 8 of 8
                    </span>
                    <h2 className="text-lg font-bold text-[#0F172A] mt-2">Generation Settings &amp; Architecture</h2>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Configure conversion layout architecture, image source, blog post depth, and core pages before compiling the blueprint.
                    </p>
                  </div>

                  <div className="space-y-5">
                    {/* Layout Style Selector */}
                    <div>
                      <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2">
                        Layout Archetype
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          {
                            id: "Conversion",
                            name: "Conversion Focus (Recommended)",
                            desc: "High-contrast emergency call banner, sticky mobile CTA, 5-star badges, and instant quote forms.",
                            tag: "High Calls",
                          },
                          {
                            id: "Authority",
                            name: "Authority & Proof",
                            desc: "Deep trust blocks, licenses, insurance verification, case studies, and detailed guarantees.",
                            tag: "Trust Heavy",
                          },
                          {
                            id: "Speed Dispatch",
                            name: "Speed Dispatch",
                            desc: "Rapid emergency booking, arrival countdowns, direct SMS/phone triggers for trades.",
                            tag: "24/7 Mobile",
                          },
                          {
                            id: "Clean Minimal",
                            name: "Clean Minimal",
                            desc: "Modern generous whitespace, elegant editorial typography, and structured service cards.",
                            tag: "Modern",
                          },
                        ].map((layout) => {
                          const isSelected = layoutStyle === layout.id;
                          return (
                            <div
                              key={layout.id}
                              onClick={() => setLayoutStyle(layout.id)}
                              className={`p-3.5 rounded-[12px] border text-left cursor-pointer transition flex flex-col justify-between ${
                                isSelected
                                  ? "border-[#4F46E5] bg-[#EEF2FF]/40 ring-1 ring-[#4F46E5]"
                                  : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]"
                              }`}
                            >
                              <div className="flex items-start justify-between mb-1.5">
                                <span className="text-xs font-bold text-[#0F172A]">{layout.name}</span>
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                    isSelected
                                      ? "bg-[#4F46E5] text-white"
                                      : "bg-slate-100 text-[#475569]"
                                  }`}
                                >
                                  {layout.tag}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#64748B] leading-relaxed">
                                {layout.desc}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Image Provider Selector */}
                    <div>
                      <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2">
                        Image Provider
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        {[
                          {
                            id: "Bing",
                            name: "Bing Images",
                            badge: "Recommended",
                            desc: "High-relevance contractor and service imagery from Bing Search API.",
                          },
                          {
                            id: "Pexels",
                            name: "Pexels",
                            badge: "Stock",
                            desc: "Free high-resolution commercial stock photography library.",
                          },
                          {
                            id: "Pixabay",
                            name: "Pixabay",
                            badge: "Stock",
                            desc: "Royalty-free trade and equipment photography catalog.",
                          },
                          {
                            id: "Curated Trade Library",
                            name: "Curated Library",
                            badge: "Built-in",
                            desc: "Pre-vetted trade contractor photography bundled with RankLocal.",
                          },
                        ].map((provider) => {
                          const isSelected = imageProvider === provider.id;
                          return (
                            <div
                              key={provider.id}
                              onClick={() => setImageProvider(provider.id)}
                              className={`p-3 rounded-[12px] border text-left cursor-pointer transition ${
                                isSelected
                                  ? "border-[#4F46E5] bg-[#EEF2FF]/40 ring-1 ring-[#4F46E5]"
                                  : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-[#0F172A]">{provider.name}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-[#4F46E5] stroke-[3]" />}
                              </div>
                              <p className="text-[11px] text-[#64748B] leading-tight">
                                {provider.desc}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Blog Posts Count */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                          Blog Posts &amp; Topical Authority
                        </label>
                        <span className="text-[11px] text-[#4F46E5] font-semibold">
                          Builds Google local topical relevance
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          {
                            count: 3,
                            label: "3 Blog Posts (Recommended)",
                            desc: "Standard topical cluster addressing common homeowner questions & emergency guides.",
                          },
                          {
                            count: 5,
                            label: "5 Blog Posts (Expanded)",
                            desc: "Aggressive SEO cluster for highly competitive local search metros.",
                          },
                          {
                            count: 0,
                            label: "0 Posts (No Blog)",
                            desc: "Core business pages only without article content marketing.",
                          },
                        ].map((b) => {
                          const isSelected = blogPostsCount === b.count;
                          return (
                            <div
                              key={b.count}
                              onClick={() => setBlogPostsCount(b.count)}
                              className={`p-3 rounded-[12px] border text-left cursor-pointer transition ${
                                isSelected
                                  ? "border-[#4F46E5] bg-[#EEF2FF]/40 ring-1 ring-[#4F46E5]"
                                  : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-[#0F172A]">{b.label}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-[#4F46E5] stroke-[3]" />}
                              </div>
                              <p className="text-[11px] text-[#64748B] leading-tight">
                                {b.desc}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Core Pages Checklist */}
                    <div>
                      <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2">
                        Core Website Pages Included
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {AVAILABLE_PAGES.slice(0, 6).map((page) => {
                          const isSelected = selectedPages.includes(page.id);
                          return (
                            <div
                              key={page.id}
                              onClick={() => togglePage(page.id)}
                              className={`p-2.5 rounded-[10px] border flex items-center justify-between cursor-pointer transition ${
                                isSelected
                                  ? "border-[#4F46E5] bg-[#EEF2FF]/30 text-[#0F172A]"
                                  : "border-[#E2E8F0] bg-slate-50 text-[#64748B]"
                              }`}
                            >
                              <div className="flex items-center space-x-2 truncate">
                                <span className="p-1 rounded bg-white border border-slate-200">
                                  {page.icon}
                                </span>
                                <span className="text-xs font-semibold truncate">{page.name}</span>
                              </div>
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-1 ${
                                  isSelected
                                    ? "bg-[#4F46E5] border-[#4F46E5] text-white"
                                    : "border-slate-300 bg-white"
                                }`}
                              >
                                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Connected AI Model Notification & Interactive Model Selector */}
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[#64748B] flex items-center gap-1.5">
                            <span>Connected Provider:</span>
                            {hasKey ? (
                              <span className="inline-flex items-center gap-1 font-bold text-[#0F172A]">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                {activeProvider.toUpperCase()}
                              </span>
                            ) : (
                              <span className="text-amber-600 font-semibold">No AI model connected</span>
                            )}
                          </div>
                          {hasKey && (
                            <p className="text-[11px] text-[#64748B] mt-0.5">
                              Generating with: <strong className="text-[#0F172A] font-mono">{activeModel}</strong>
                            </p>
                          )}
                        </div>
                      </div>

                      {hasKey ? (
                        <div className="flex items-center gap-2">
                          {/* Live Model Selector Dropdown */}
                          <select
                            value={activeModel}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "__custom__") {
                                const customName = window.prompt("Enter any custom model ID supported by " + activeProvider + ":", activeModel);
                                if (customName && customName.trim()) {
                                  const normalized = normalizeModelForProvider(activeProvider, customName.trim());
                                  setActiveModel(normalized);
                                  localStorage.setItem(`altofox_model_${activeProvider}`, normalized);
                                  localStorage.setItem(`ranklocal_model_${activeProvider}`, normalized);
                                  localStorage.setItem("altofox_active_model", normalized);
                                  localStorage.setItem("ranklocal_active_model", normalized);
                                  addToast({
                                    type: "success",
                                    title: "Model Switched",
                                    message: `Now using custom model: ${normalized}`,
                                  });
                                }
                                return;
                              }
                              const normalized = normalizeModelForProvider(activeProvider, val);
                              setActiveModel(normalized);
                              localStorage.setItem(`altofox_model_${activeProvider}`, normalized);
                              localStorage.setItem(`ranklocal_model_${activeProvider}`, normalized);
                              localStorage.setItem("altofox_active_model", normalized);
                              localStorage.setItem("ranklocal_active_model", normalized);
                              addToast({
                                type: "success",
                                title: "Model Switched",
                                message: `Now using ${normalized} for website generation`,
                              });
                            }}
                            className="bg-white border border-[#CBD5E1] text-[#0F172A] text-xs rounded-[8px] px-2.5 py-1.5 font-medium shadow-xs focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5] cursor-pointer"
                          >
                            <optgroup label="Popular Models">
                              {(PROVIDER_PRESETS[activeProvider]?.popularModels || []).map((m: any) => (
                                <option key={m.id} value={m.id}>
                                  {m.label || m.id}
                                </option>
                              ))}
                            </optgroup>
                            {availableModelsForActiveProvider.length > 0 && (
                              <optgroup label={`All Discovered API Models (${availableModelsForActiveProvider.length})`}>
                                {availableModelsForActiveProvider
                                  .filter((m) => !(PROVIDER_PRESETS[activeProvider]?.popularModels || []).some((pop: any) => pop.id === m))
                                  .map((m) => (
                                    <option key={m} value={m}>
                                      {m}
                                    </option>
                                  ))}
                              </optgroup>
                            )}
                            {activeModel &&
                              !(PROVIDER_PRESETS[activeProvider]?.popularModels || []).some((pop: any) => pop.id === activeModel) &&
                              !availableModelsForActiveProvider.includes(activeModel) && (
                                <optgroup label="Custom Active Model">
                                  <option value={activeModel}>{activeModel}</option>
                                </optgroup>
                              )}
                            <optgroup label="Custom Option">
                              <option value="__custom__">+ Enter any custom model name...</option>
                            </optgroup>
                          </select>

                          <button
                            type="button"
                            onClick={() => handleOpenSettings("models")}
                            className="font-semibold text-xs text-[#4F46E5] hover:underline cursor-pointer px-1 py-1 shrink-0"
                          >
                            Settings
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenSettings("models")}
                          className="font-bold text-[#4F46E5] hover:underline cursor-pointer"
                        >
                          Connect API Key
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 9: SITE BLUEPRINT */}
              {currentStep === 9 && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* Blueprint Header with Top Action Buttons */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
                    <div>
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]">
                        <FileText className="w-3.5 h-3.5" />
                        <span>SITE BLUEPRINT</span>
                      </span>
                      <h2 className="text-xl font-bold text-[#0F172A] mt-2">
                        Architectural Site Blueprint
                      </h2>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        Pre-generation URL map, structural hierarchy, and verified internal-linking connectivity graph.
                      </p>
                    </div>

                    {/* Top Buttons: EDIT BLUEPRINT and GENERATE WEBSITE */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsEditBlueprintOpen(true)}
                        className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-[10px] border border-[#CBD5E1] bg-white hover:bg-slate-50 text-xs font-bold text-[#0F172A] transition shadow-xs cursor-pointer"
                      >
                        <FileEdit className="w-3.5 h-3.5 text-[#4F46E5]" />
                        <span>EDIT BLUEPRINT</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleGenerateWebsite}
                        className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-[10px] bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>GENERATE WEBSITE</span>
                      </button>
                    </div>
                  </div>

                  {/* High-Contrast Metrics Summary Grid (Exact prompt specification) */}
                  <div>
                    <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2.5">
                      Blueprint Metrics Summary
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
                      {/* Metric 1: Pages */}
                      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] p-3 text-center space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                          Pages
                        </span>
                        <div className="text-xl font-extrabold text-[#0F172A]">
                          {computedPageCount}
                        </div>
                        <span className="text-[10px] text-[#10B981] font-semibold flex items-center justify-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> Verified
                        </span>
                      </div>

                      {/* Metric 2: Services */}
                      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] p-3 text-center space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                          Services
                        </span>
                        <div className="text-xl font-extrabold text-[#0F172A]">
                          {services.length}
                        </div>
                        <span className="text-[10px] text-[#4F46E5] font-semibold">
                          Dedicated Pages
                        </span>
                      </div>

                      {/* Metric 3: Locations */}
                      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] p-3 text-center space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                          Locations
                        </span>
                        <div className="text-xl font-extrabold text-[#0F172A]">
                          {computedLocationCount}
                        </div>
                        <span className="text-[10px] text-[#4F46E5] font-semibold">
                          City Hubs
                        </span>
                      </div>

                      {/* Metric 4: Blog Posts */}
                      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] p-3 text-center space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                          Blog posts
                        </span>
                        <div className="text-xl font-extrabold text-[#0F172A]">
                          {blogPostsCount}
                        </div>
                        <span className="text-[10px] text-[#64748B] font-semibold">
                          Topical Cluster
                        </span>
                      </div>

                      {/* Metric 5: Theme */}
                      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] p-3 text-center space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                          Theme
                        </span>
                        <div className="text-sm font-extrabold text-[#0F172A] truncate" title={themeDisplayName}>
                          {themeDisplayName}
                        </div>
                        <div className="flex items-center justify-center space-x-1">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: activeColors.primary }}
                          />
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: activeColors.accent }}
                          />
                        </div>
                      </div>

                      {/* Metric 6: Layout */}
                      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] p-3 text-center space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                          Layout
                        </span>
                        <div className="text-sm font-extrabold text-[#0F172A] truncate" title={layoutStyle}>
                          {layoutStyle}
                        </div>
                        <span className="text-[10px] text-[#10B981] font-semibold">
                          High-Converting
                        </span>
                      </div>

                      {/* Metric 7: Image Provider */}
                      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] p-3 text-center space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                          Image Provider
                        </span>
                        <div className="text-sm font-extrabold text-[#0F172A] truncate" title={imageProvider}>
                          {imageProvider}
                        </div>
                        <span className="text-[10px] text-[#64748B] font-semibold">
                          Trade Images
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pre-Generation Internal-Link Graph & Relationship Map */}
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[14px] p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4 text-[#4F46E5]" />
                        <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                          Internal-Link Graph Matrix
                        </h4>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" /> Graph Built Before Insertion
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      {/* Homepage Relationships */}
                      <div className="p-3 bg-white border border-[#E2E8F0] rounded-[10px] space-y-1.5">
                        <div className="font-bold text-[#0F172A] flex items-center justify-between">
                          <span>Homepage</span>
                          <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">Hub</span>
                        </div>
                        <ul className="text-[11px] text-[#64748B] space-y-1">
                          <li className="flex items-center gap-1">
                            <ArrowRight className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span>→ Services ({services.length} links)</span>
                          </li>
                          <li className="flex items-center gap-1">
                            <ArrowRight className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span>→ Locations ({computedLocationCount} links)</span>
                          </li>
                        </ul>
                      </div>

                      {/* Service Relationships */}
                      <div className="p-3 bg-white border border-[#E2E8F0] rounded-[10px] space-y-1.5">
                        <div className="font-bold text-[#0F172A] flex items-center justify-between">
                          <span>Service Pages</span>
                          <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">Silov</span>
                        </div>
                        <ul className="text-[11px] text-[#64748B] space-y-1">
                          <li className="flex items-center gap-1">
                            <ArrowRight className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span>→ Related Services</span>
                          </li>
                          <li className="flex items-center gap-1">
                            <ArrowRight className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span>→ Locations served</span>
                          </li>
                        </ul>
                      </div>

                      {/* Location Relationships */}
                      <div className="p-3 bg-white border border-[#E2E8F0] rounded-[10px] space-y-1.5">
                        <div className="font-bold text-[#0F172A] flex items-center justify-between">
                          <span>Location Pages</span>
                          <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">Local</span>
                        </div>
                        <ul className="text-[11px] text-[#64748B] space-y-1">
                          <li className="flex items-center gap-1">
                            <ArrowRight className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span>→ Core Services</span>
                          </li>
                          <li className="flex items-center gap-1">
                            <ArrowRight className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span>→ Related Locations</span>
                          </li>
                        </ul>
                      </div>

                      {/* Blog Relationships */}
                      <div className="p-3 bg-white border border-[#E2E8F0] rounded-[10px] space-y-1.5">
                        <div className="font-bold text-[#0F172A] flex items-center justify-between">
                          <span>Blog Posts</span>
                          <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">Cluster</span>
                        </div>
                        <ul className="text-[11px] text-[#64748B] space-y-1">
                          <li className="flex items-center gap-1">
                            <ArrowRight className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span>→ Featured Services</span>
                          </li>
                          <li className="flex items-center gap-1">
                            <ArrowRight className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span>→ Service Locations</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Architectural URL Map & Target Pages Table */}
                  <div className="border border-[#E2E8F0] rounded-[14px] overflow-hidden">
                    <div className="p-3.5 bg-slate-50 border-b border-[#E2E8F0] flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Layers className="w-4 h-4 text-[#4F46E5]" />
                        <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                          Verified Target URL Map ({computedPageCount} Static Routes)
                        </h4>
                      </div>
                      <span className="text-[11px] font-semibold text-[#10B981] flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>All Target URLs Exist (Zero Broken Links)</span>
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto text-xs">
                      {/* Core Page: Home */}
                      <div className="p-2.5 px-4 flex items-center justify-between hover:bg-slate-50">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-indigo-600 font-bold">index.html</span>
                          <span className="text-slate-400">/</span>
                          <span className="text-[#0F172A] font-medium">{businessName || "Homepage"}</span>
                        </div>
                        <div className="flex items-center space-x-3 text-[11px]">
                          <span className="text-[#64748B] font-mono">LocalBusiness Schema</span>
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">Canonical Target</span>
                        </div>
                      </div>

                      {/* Core Hubs */}
                      {selectedPages.includes("About") && (
                        <div className="p-2.5 px-4 flex items-center justify-between hover:bg-slate-50">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-indigo-600 font-bold">about.html</span>
                            <span className="text-slate-400">/</span>
                            <span className="text-[#0F172A] font-medium">About Us</span>
                          </div>
                          <div className="flex items-center space-x-3 text-[11px]">
                            <span className="text-[#64748B] font-mono">BreadcrumbList Schema</span>
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">Canonical Target</span>
                          </div>
                        </div>
                      )}

                      {selectedPages.includes("Services") && (
                        <div className="p-2.5 px-4 flex items-center justify-between hover:bg-slate-50">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-indigo-600 font-bold">services.html</span>
                            <span className="text-slate-400">/</span>
                            <span className="text-[#0F172A] font-medium">Services Directory Hub</span>
                          </div>
                          <div className="flex items-center space-x-3 text-[11px]">
                            <span className="text-[#64748B] font-mono">Service Hub Schema</span>
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">Canonical Target</span>
                          </div>
                        </div>
                      )}

                      {/* Dedicated Service Landing Pages */}
                      {separateServicePages &&
                        services.map((srv) => {
                          const slug = srv.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                          return (
                            <div key={srv} className="p-2.5 px-4 flex items-center justify-between hover:bg-slate-50">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono text-indigo-600 font-bold">services/{slug}.html</span>
                                <span className="text-slate-400">/</span>
                                <span className="text-[#0F172A] font-medium">{srv}</span>
                              </div>
                              <div className="flex items-center space-x-3 text-[11px]">
                                <span className="text-[#64748B] font-mono">Service Schema</span>
                                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">Canonical Target</span>
                              </div>
                            </div>
                          );
                        })}

                      {/* Dedicated Location Landing Pages */}
                      {separateAreaPages && (serviceAreas.length > 0 || serviceAreaCities.length > 0) ? (
                        (serviceAreas.length > 0 ? serviceAreas : serviceAreaCities.map((c) => c.city)).map((area) => {
                          const slug = area.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                          return (
                            <div key={area} className="p-2.5 px-4 flex items-center justify-between hover:bg-slate-50">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono text-indigo-600 font-bold">areas/{slug}.html</span>
                                <span className="text-slate-400">/</span>
                                <span className="text-[#0F172A] font-medium">{area} Local Coverage</span>
                              </div>
                              <div className="flex items-center space-x-3 text-[11px]">
                                <span className="text-[#64748B] font-mono">LocalBusiness Area Schema</span>
                                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">Canonical Target</span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-2.5 px-4 flex items-center justify-between bg-slate-50 text-[11px] text-slate-500 italic">
                          <span>Single-Location Target: No additional /areas/ landing pages. Coverage focused on {city || "Primary City"}.</span>
                          <span className="text-indigo-600 font-semibold font-mono">1 Central Location</span>
                        </div>
                      )}

                      {/* Blog Hub & Posts */}
                      {blogPostsCount > 0 && (
                        <div className="p-2.5 px-4 flex items-center justify-between hover:bg-slate-50">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-indigo-600 font-bold">blog.html</span>
                            <span className="text-slate-400">/</span>
                            <span className="text-[#0F172A] font-medium">Blog &amp; Knowledge Hub ({blogPostsCount} articles)</span>
                          </div>
                          <div className="flex items-center space-x-3 text-[11px]">
                            <span className="text-[#64748B] font-mono">BlogPosting Schema</span>
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">Canonical Target</span>
                          </div>
                        </div>
                      )}

                      {/* Contact & FAQ */}
                      <div className="p-2.5 px-4 flex items-center justify-between hover:bg-slate-50">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-indigo-600 font-bold">contact.html</span>
                          <span className="text-slate-400">/</span>
                          <span className="text-[#0F172A] font-medium">Contact &amp; Dispatch</span>
                        </div>
                        <div className="flex items-center space-x-3 text-[11px]">
                          <span className="text-[#64748B] font-mono">ContactPoint Schema</span>
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">Canonical Target</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* DETERMINISTIC TARGETING CONFIRMATION & LOCK CARD */}
                  <div className="rounded-[14px] border-2 border-indigo-500/30 bg-white p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center space-x-2">
                        <Lock className="w-4 h-4 text-indigo-600" />
                        <h3 className="text-sm font-bold text-slate-900">
                          Deterministic Targeting Confirmation &amp; Lock
                        </h3>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" /> User Targeting Rules Active
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Business & Industry */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Business &amp; Trade
                        </span>
                        <p className="font-bold text-slate-900 text-sm">{businessName || "Unnamed Business"}</p>
                        <p className="text-slate-600">
                          Industry: <strong className="text-slate-900">{effectiveIndustry}</strong>
                        </p>
                        {phone && <p className="text-slate-600">Phone: <strong className="text-slate-900">{phone}</strong></p>}
                      </div>

                      {/* Primary & Additional Locations */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Target Locations (Strict)
                        </span>
                        <div className="flex items-center space-x-1.5">
                          <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="font-bold text-slate-900">
                            Primary: {city || "Local City"}, {stateRegion || "US"}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          Additional Cities:{" "}
                          <strong className="text-slate-800">
                            {serviceAreas.length + serviceAreaCities.length > 0
                              ? [...serviceAreas, ...serviceAreaCities.map((c) => c.city)].join(", ")
                              : "None (0 additional locations — Single-City Site)"}
                          </strong>
                        </p>
                      </div>

                      {/* Primary & Secondary Services */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Offered Services
                        </span>
                        <p className="text-slate-600">
                          Primary Service: <strong className="text-slate-900">{services[0] || effectiveIndustry}</strong>
                        </p>
                        <p className="text-slate-600 text-[11px]">
                          Secondary Services:{" "}
                          <strong className="text-slate-800">
                            {services.length > 1 ? services.slice(1).join(", ") : "None"}
                          </strong>
                        </p>
                      </div>

                      {/* Target SEO Keywords */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          SEO Keywords
                        </span>
                        <p className="text-slate-600">
                          Primary Keyword: <strong className="text-slate-900">{keywords[0] || "None specified"}</strong>
                        </p>
                        <p className="text-slate-600 text-[11px]">
                          Secondary Keywords:{" "}
                          <strong className="text-slate-800">
                            {keywords.length > 1 ? keywords.slice(1).join(", ") : "None"}
                          </strong>
                        </p>
                      </div>
                    </div>

                    {/* Lock Checkbox */}
                    <div className="pt-1">
                      <label className="flex items-start space-x-2.5 p-3 rounded-xl bg-indigo-50/50 border border-indigo-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={targetingLocked}
                          onChange={(e) => setTargetingLocked(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">
                            Lock Targeting Snapshot (User Data Always Wins)
                          </span>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            Only the explicit business, location, service, and keyword information above will be used in website generation. The system will NOT invent or automatically inject any nearby cities, neighborhoods, or unapproved keywords.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Primary Bottom Generation Action Callout */}
                  <div className="p-5 rounded-[14px] bg-gradient-to-r from-indigo-50 via-slate-50 to-emerald-50 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-[#0F172A] flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[#4F46E5]" />
                        <span>Ready to build {businessName || "your local website"}?</span>
                      </h4>
                      <p className="text-xs text-[#64748B]">
                        Click Generate Website to initiate the complete 14-stage static assembly pipeline with automatic quality &amp; SEO audit.
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsEditBlueprintOpen(true)}
                        className="px-4 py-2.5 rounded-[10px] border border-[#CBD5E1] bg-white hover:bg-slate-50 text-xs font-bold text-[#0F172A] transition shadow-xs cursor-pointer"
                      >
                        EDIT BLUEPRINT
                      </button>

                      <button
                        type="button"
                        onClick={handleGenerateWebsite}
                        className="inline-flex items-center space-x-2 px-6 py-3 rounded-[12px] bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-bold shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>GENERATE WEBSITE</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Wizard Bottom Navigation Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
                {currentStep > 1 && currentStep < 9 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-[10px] border border-[#CBD5E1] bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A] transition cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                ) : currentStep === 9 ? (
                  <button
                    type="button"
                    onClick={() => setIsEditBlueprintOpen(true)}
                    className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-[10px] border border-[#CBD5E1] bg-white hover:bg-slate-50 text-xs font-bold text-[#0F172A] transition shadow-xs cursor-pointer"
                  >
                    <FileEdit className="w-3.5 h-3.5 text-[#4F46E5]" />
                    <span>EDIT BLUEPRINT</span>
                  </button>
                ) : (
                  <div />
                )}

                {currentStep < 8 && (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-[10px] bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold shadow-sm transition cursor-pointer"
                  >
                    <span>Next: {stepsList[currentStep]?.label}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {currentStep === 8 && (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="inline-flex items-center space-x-1.5 px-6 py-2.5 rounded-[10px] bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                  >
                    <span>Review Site Blueprint</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {currentStep === 9 && (
                  <button
                    type="button"
                    onClick={handleGenerateWebsite}
                    className="inline-flex items-center space-x-2 px-6 py-3 rounded-[12px] bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-bold shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>GENERATE WEBSITE</span>
                  </button>
                )}
              </div>
            </div>
          </div>
              )}
            </main>
      )}
    </div>
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white font-sans">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center animate-pulse mb-4 shadow-lg shadow-indigo-500/30">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <p className="text-sm font-medium text-slate-400">Loading {BRAND.name} workspace…</p>
      </div>
    );
  }

  // Protected Dashboard Guard: Only redirect when definitively unauthenticated
  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/login?redirect=/dashboard";
    }
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white font-sans">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center animate-pulse mb-4 shadow-lg shadow-indigo-500/30">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <p className="text-sm font-medium text-slate-400">Redirecting to sign in…</p>
      </div>
    );
  }

  if (!isApproved) {
    if (typeof window !== "undefined") {
      window.location.href = "/pending";
    }
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white font-sans">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center animate-pulse mb-4 shadow-lg shadow-indigo-500/30">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <p className="text-sm font-medium text-slate-400">Redirecting to account status…</p>
      </div>
    );
  }

  return (
    <AppShell
      currentTab={navTab}
      projectsCount={savedProjectsList.length}
      hasActiveProject={Boolean(currentProject || activeSavedProject)}
      onShowNotice={(msg) => {
        addToast({
          type: "info",
          title: "Feature Notice",
          message: msg,
        });
      }}
      onNavigate={(tab) => {
        if (tab === "settings") {
          handleOpenSettings("hosting");
        } else if (tab === "settings-ai") {
          handleOpenSettings("models");
        } else if (tab === "publishing" || tab === "domains") {
          if (activeSavedProject) {
            setNavTab("websites");
            setViewMode("manager");
          } else {
            handleOpenSettings("hosting");
          }
        } else if (tab === "chat-generator") {
          setNavTab("generator");
          setGeneratorSubTab("chat");
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else if (tab === "new-website") {
          setNavTab("generator");
          setGeneratorSubTab("builder");
          setViewMode("builder");
          setCurrentProject(null);
          setCurrentStep(1);
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else if (tab === "themes") {
          setNavTab("generator");
          setGeneratorSubTab("themes");
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else if (tab === "generator") {
          setNavTab("generator");
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else if (tab === "preview") {
          if (activeSavedProject) {
            setNavTab("websites");
            setViewMode("manager");
          } else if (savedProjectsList.length > 0) {
            setActiveSavedProject(savedProjectsList[0]);
            setNavTab("websites");
            setViewMode("manager");
          } else {
            setNavTab("generator");
            setGeneratorSubTab("builder");
            setViewMode("builder");
            setCurrentProject(null);
            setCurrentStep(1);
          }
        } else if (tab === "optimization") {
          setNavTab("optimization");
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else if (tab === "linking" || tab === "checker") {
          setNavTab("optimization");
          setOptimizationSubTab(tab === "linking" ? "linking" : "checker");
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else if (tab === "activity") {
          setNavTab("optimization");
          setOptimizationSubTab("activity");
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else if (tab === "projects" || tab === "websites") {
          setNavTab("websites");
          if (!activeSavedProject) {
            setViewMode("dashboard");
            loadAllSavedProjects();
          }
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          setNavTab(tab);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }}
      activeProjectId={activeSavedProject?.id}
      onSelectProject={(projId) => {
        const found = savedProjectsList.find((p) => p.id === projId);
        if (found) {
          setActiveSavedProject(found);
          setViewMode("manager");
          setNavTab("websites");
        }
      }}
    >
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Settings Slide-In Panel */}
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
          setSettingsMessage(null);
        }}
        initialTab={settingsTab}
        initialMessage={settingsMessage}
        onSettingsUpdated={() => {
          checkKeyStatus();
          applyPreferences();
        }}
        onClearAllData={handleClearAllData}
      />

      {/* Import Legacy Local Data Modal */}
      <ImportLocalDataModal
        isOpen={isImportLocalModalOpen}
        onClose={() => setIsImportLocalModalOpen(false)}
        onImportComplete={loadAllSavedProjects}
      />

      {/* TAB 1: TEAM DASHBOARD */}
      {navTab === "dashboard" && (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <TeamDashboard
            projects={savedProjectsList}
            onNewProject={() => {
              setNavTab("generator");
              setGeneratorSubTab("builder");
              setViewMode("builder");
              setCurrentProject(null);
              setCurrentStep(1);
            }}
            onOpenProject={async (projId) => {
              let found: SavedProject | null | undefined = savedProjectsList.find((p) => p.id === projId);
              if (!found) {
                found = await getProjectByIdFromDB(projId);
              }
              if (found) {
                setActiveSavedProject(found);
                setViewMode("manager");
                setNavTab("websites");
              }
            }}
            onOpenImportLocal={() => setIsImportLocalModalOpen(true)}
            onNavigateToProjects={() => {
              setNavTab("websites");
              setViewMode("dashboard");
            }}
          />
        </div>
      )}

      {/* TAB 2: TEAM MANAGEMENT (ADMIN) */}
      {navTab === "team" && (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <TeamManagement />
        </div>
      )}

      {/* TAB 3: WEBSITES WORKSPACE & DASHBOARD */}
      {(navTab === "websites" || navTab === "projects") && (
        <div className="flex-1 flex flex-col w-full min-h-0">
          {viewMode === "dashboard" ? (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
              <ErrorBoundary fallbackTitle="Projects Dashboard Encountered an Issue">
                <ProjectsDashboard
                  projects={savedProjectsList}
                  onOpenProject={(proj) => {
                    setActiveSavedProject(proj);
                    setViewMode("manager");
                  }}
                  onPreviewProject={(proj) => {
                    const projData: ProjectData = {
                      projectId: proj.id,
                      name: proj.name,
                      notes: proj.formData?.notes,
                      provider: "anthropic",
                      model: "claude-3-5-sonnet",
                      themeName: proj.theme?.name || "Clean Modern",
                      websiteDomain: proj.formData?.websiteDomain || `${proj.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.com`,
                      files: proj.files,
                      photos: [],
                    };
                    setCurrentProject(projData);
                    setActiveSavedProject(proj);
                    setViewMode("builder");
                  }}
                  onNewWebsite={() => {
                    setNavTab("generator");
                    setGeneratorSubTab("builder");
                    setViewMode("builder");
                    setCurrentProject(null);
                    setCurrentStep(1);
                  }}
                  onDuplicateProject={async (id) => {
                    try {
                      await duplicateProjectInDB(id);
                      await loadAllSavedProjects();
                      addToast({
                        type: "success",
                        title: "Project Duplicated",
                        message: "A copy of your project has been created.",
                      });
                    } catch (err) {
                      addToast({ type: "error", title: "Duplicate Failed", message: String(err) });
                    }
                  }}
                  onDeleteProject={async (id) => {
                    try {
                      await deleteProjectFromDB(id);
                      await loadAllSavedProjects();
                      addToast({
                        type: "info",
                        title: "Project Deleted",
                        message: "Project was removed from storage.",
                      });
                    } catch (err) {
                      addToast({ type: "error", title: "Delete Failed", message: String(err) });
                    }
                  }}
                  onProjectImported={async (importedProj) => {
                    await saveProjectToDB(importedProj);
                    await loadAllSavedProjects();
                    setActiveSavedProject(importedProj);
                    setViewMode("manager");
                    addToast({
                      type: "success",
                      title: "Project Imported",
                      message: `Imported "${importedProj.name}" successfully.`,
                    });
                  }}
                />
              </ErrorBoundary>
            </div>
          ) : viewMode === "manager" && activeSavedProject ? (
            <ErrorBoundary
              fallbackTitle="Project Manager Encountered an Issue"
              onReset={() => {
                loadAllSavedProjects();
                setViewMode("dashboard");
              }}
            >
              <WebsiteManager
                project={activeSavedProject}
                onBackToDashboard={() => {
                  loadAllSavedProjects();
                  setViewMode("dashboard");
                }}
                onProjectUpdated={async (updated) => {
                  setActiveSavedProject(updated);
                  await saveProjectToDB(updated);
                  if (currentProject && currentProject.projectId === updated.id) {
                    setCurrentProject((prev) => (prev ? { ...prev, files: updated.files } : null));
                  }
                }}
              />
            </ErrorBoundary>
          ) : (
            renderBuilderWorkspace()
          )}
        </div>
      )}

      {/* TAB 4: AI / GENERATOR WORKSPACE */}
      {(navTab === "generator" || navTab === "chat-generator" || navTab === "themes") && (
        <div className="flex-1 flex flex-col w-full min-h-0">
          {/* Sub-tab Pill Navigation Header */}
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center space-x-1 sm:space-x-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setGeneratorSubTab("builder");
                  if (navTab !== "generator") setNavTab("generator");
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  generatorSubTab === "builder" && navTab === "generator"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Website Builder</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setGeneratorSubTab("chat");
                  if (navTab !== "generator") setNavTab("generator");
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  generatorSubTab === "chat" || navTab === "chat-generator"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Chat Generator</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setGeneratorSubTab("themes");
                  if (navTab !== "generator") setNavTab("generator");
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  generatorSubTab === "themes" || navTab === "themes"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Theme Library</span>
              </button>
            </div>
            <span className="hidden sm:inline text-xs text-slate-400">
              {generatorSubTab === "builder" ? "Multi-step local SEO wizard" : generatorSubTab === "chat" ? "Prompt-to-site generator" : "15 custom crafted themes"}
            </span>
          </div>

          {generatorSubTab === "chat" || navTab === "chat-generator" ? (
            <ErrorBoundary fallbackTitle="Chat Generator Encountered an Issue">
              <ChatGenerator onOpenSettings={() => handleOpenSettings("models")} />
            </ErrorBoundary>
          ) : generatorSubTab === "themes" || navTab === "themes" ? (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
              <ErrorBoundary fallbackTitle="Themes Gallery Encountered an Issue">
                <ThemesGallery
                  selectedThemeId={selectedThemeId}
                  onSelectAndBuild={(themeId) => {
                    setSelectedThemeId(themeId);
                    setGeneratorSubTab("builder");
                    setNavTab("generator");
                    setViewMode("builder");
                    setCurrentProject(null);
                    setCurrentStep(1);
                    addToast({
                      type: "success",
                      title: "Theme Selected",
                      message: `Configuring website with "${getThemeById(themeId).name}". Enter business details below to generate.`,
                    });
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              </ErrorBoundary>
            </div>
          ) : (
            renderBuilderWorkspace()
          )}
        </div>
      )}

      {/* TAB 5: OPTIMIZATION WORKSPACE */}
      {(navTab === "optimization" || navTab === "activity") && (
        <div className="flex-1 flex flex-col w-full min-h-0">
          {/* Sub-tab Pill Navigation Header with Project Selector */}
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-1 sm:space-x-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setOptimizationSubTab("checker");
                  if (navTab !== "optimization") setNavTab("optimization");
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  optimizationSubTab === "checker" && navTab === "optimization"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Quality &amp; SEO Recommendations</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setOptimizationSubTab("linking");
                  if (navTab !== "optimization") setNavTab("optimization");
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  optimizationSubTab === "linking" && navTab === "optimization"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                <span>Internal Linking Topology</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setOptimizationSubTab("activity");
                  if (navTab !== "optimization") setNavTab("optimization");
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  optimizationSubTab === "activity" || navTab === "activity"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Team Activity Feed</span>
              </button>
            </div>

            {/* Target Project Selector (for Linking & Recommendations) */}
            {savedProjectsList.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Target Website:</span>
                <select
                  value={selectedOptProjectId || activeSavedProject?.id || savedProjectsList[0]?.id || ""}
                  onChange={(e) => setSelectedOptProjectId(e.target.value)}
                  className="input-base text-xs py-1.5 px-2.5 max-w-[220px]"
                >
                  {savedProjectsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const target = savedProjectsList.find(
                      (p) => p.id === (selectedOptProjectId || activeSavedProject?.id || savedProjectsList[0]?.id)
                    );
                    if (target) {
                      setActiveSavedProject(target);
                      setViewMode("manager");
                      setNavTab("websites");
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                  title="Open full Website Workspace"
                >
                  Open Workspace &rarr;
                </button>
              </div>
            )}
          </div>

          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {optimizationSubTab === "activity" || navTab === "activity" ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
                <ActivityFeed maxItems={100} />
              </div>
            ) : savedProjectsList.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-4 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    No websites generated yet
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Generate or save a website first to inspect internal link topology and apply 1-click SEO optimizations.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNavTab("generator");
                    setGeneratorSubTab("builder");
                    setViewMode("builder");
                    setCurrentProject(null);
                    setCurrentStep(1);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Your First Website</span>
                </button>
              </div>
            ) : (() => {
              const optProject =
                savedProjectsList.find(
                  (p) => p.id === (selectedOptProjectId || activeSavedProject?.id || savedProjectsList[0]?.id)
                ) || savedProjectsList[0];

              if (optimizationSubTab === "linking") {
                return (
                  <ErrorBoundary fallbackTitle="Internal Linking Dashboard Encountered an Issue">
                    <InternalLinkingDashboard
                      project={optProject}
                      onProjectUpdated={async (updated) => {
                        setActiveSavedProject(updated);
                        await saveProjectToDB(updated);
                        await loadAllSavedProjects();
                      }}
                      onSelectPage={() => {
                        setActiveSavedProject(optProject);
                        setViewMode("manager");
                        setNavTab("websites");
                      }}
                    />
                  </ErrorBoundary>
                );
              }

              // Default: checker / recommendations
              const htmlFiles = optProject.files?.filter((f) => f.path.endsWith(".html")) || [];
              const homeFile = htmlFiles.find((f) => f.path === "index.html") || htmlFiles[0];

              return (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 border border-indigo-100 dark:border-indigo-900/40 p-5 rounded-2xl">
                    <div>
                      <h3 className="text-sm font-bold text-indigo-950 dark:text-indigo-200">
                        {optProject.name} — Optimization Hub
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        {htmlFiles.length} pages generated • Instant on-page fixes and connectivity audits
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSavedProject(optProject);
                        setViewMode("manager");
                        setNavTab("websites");
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-xs shrink-0"
                    >
                      <span>Open in Website Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {homeFile && (() => {
                    const homeRecs = analyzeHtmlRecommendations(homeFile.content, {
                      pagePath: homeFile.path,
                      trade: optProject.nicheId || optProject.formData?.niche,
                      city: optProject.formData?.mainCity || optProject.serviceAreaCities?.[0]?.city,
                      businessName: optProject.name,
                    });

                    return (
                      <ErrorBoundary fallbackTitle="Recommendation Panel Encountered an Issue">
                        <RecommendationFixPanel
                          recommendations={homeRecs}
                          onApplyFix={async (rec) => {
                            const result = applyRecommendationFix(homeFile.content, rec);
                            if (result.success && result.updatedHtml) {
                              const updatedFiles = optProject.files.map((f) =>
                                f.path === homeFile.path ? { ...f, content: result.updatedHtml, lastModified: Date.now() } : f
                              );
                              const updatedProj = { ...optProject, files: updatedFiles, lastEditedAt: Date.now() };
                              setActiveSavedProject(updatedProj);
                              await saveProjectToDB(updatedProj);
                              await loadAllSavedProjects();
                              addToast({
                                type: "success",
                                title: "Fix Applied",
                                message: `Applied automated fix for: ${rec.title}`,
                              });
                            }
                          }}
                          onApplyAll={async () => {
                            const result = applyAllRecommendations(homeFile.content, homeRecs);
                            if (result.appliedCount > 0 && result.updatedHtml) {
                              const updatedFiles = optProject.files.map((f) =>
                                f.path === homeFile.path ? { ...f, content: result.updatedHtml, lastModified: Date.now() } : f
                              );
                              const updatedProj = { ...optProject, files: updatedFiles, lastEditedAt: Date.now() };
                              setActiveSavedProject(updatedProj);
                              await saveProjectToDB(updatedProj);
                              await loadAllSavedProjects();
                              addToast({
                                type: "success",
                                title: "All Fixes Applied",
                                message: `Successfully applied ${result.appliedCount} automated SEO recommendations.`,
                              });
                            }
                          }}
                        />
                      </ErrorBoundary>
                    );
                  })()}
                </div>
              );
            })()}
          </div>
        </div>
      )}

            {/* Advanced Modals */}
      <ErrorBoundary fallbackTitle="Modal Encountered an Issue">
        {renderModals()}
      </ErrorBoundary>
    
    </AppShell>
  );
}
