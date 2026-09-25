"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { SettingsPanel } from "@/components/SettingsPanel";
import { LivePreview, ProjectData } from "@/components/LivePreview";
import { ToastContainer, ToastMessage } from "@/components/Toast";
import { ProviderType } from "@/lib/ai/types";
import {
  THEMES,
  getThemeById,
  getRecommendedThemeIds,
  resolveThemeColors,
  CustomThemeOverrides,
  Theme,
} from "@/lib/themes";
import { ThemeMiniPreview } from "@/components/ThemeMiniPreview";
import {
  findNicheByIndustry,
  generateKeywordsForNiche,
  NichePack,
} from "@/niches";
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
} from "lucide-react";
import { ServiceAreaPicker, SelectedServiceCity } from "@/components/ServiceAreaPicker";
import { ProjectsDashboard } from "@/components/ProjectsDashboard";
import { WebsiteManager } from "@/components/WebsiteManager";
import { KeywordMapModal, KeywordMapEntry } from "@/components/KeywordMapModal";
import { FindReplaceModal } from "@/components/FindReplaceModal";
import { BlogManager } from "@/components/BlogManager";
import { auditPageSEO, suggestKeywordsForPage } from "@/lib/seo/on-page-scorer";
import { SavedProject, ProjectKeywordItem } from "@/lib/storage/project-types";
import {
  saveProjectToDB,
  getAllProjectsFromDB,
  getProjectByIdFromDB,
  deleteProjectFromDB,
  duplicateProjectInDB,
} from "@/lib/storage/db";
import { useAuth } from "@/lib/auth/AuthContext";
import { LoginCard } from "@/components/auth/LoginCard";
import { AppShell, NavTab } from "@/components/navigation/AppShell";
import { TeamDashboard } from "@/components/dashboard/TeamDashboard";
import { TeamManagement } from "@/components/team/TeamManagement";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { ImportLocalDataModal } from "@/components/migration/ImportLocalDataModal";

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
  serviceAreas: ["Dallas", "Plano", "Frisco", "McKinney", "Irving", "Richardson"],
  phone: "(214) 555-0198",
  email: "dispatch@lonestarplumbingdfw.com",
  businessHours: "Monday - Sunday: 24/7 Emergency Dispatch",
  websiteDomain: "www.lonestarplumbingdfw.com",
  keywords: [
    "emergency plumber in Dallas TX",
    "24/7 drain cleaning Dallas",
    "water heater repair Dallas TX",
    "slab leak detection",
  ],
  pages: ["Home", "About", "Services", "Contact", "FAQ", "Service Areas"],
  selectedThemeId: "modern-pro",
  logoUrl: "",
  yearsInBusiness: "20+",
  uniqueSellingPoints: "45-min arrival, upfront flat rates, licensed master technicians",
  separateServicePages: false,
  separateAreaPages: false,
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
  const [settingsTab, setSettingsTab] = useState<"models" | "images" | "preferences">("models");
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  const handleOpenSettings = (
    tab: "models" | "images" | "preferences" = "models",
    message: string | null = null
  ) => {
    setSettingsTab(tab);
    setSettingsMessage(message);
    setSettingsOpen(true);
  };

  // Active Provider & Model
  const [activeProvider, setActiveProvider] = useState<ProviderType>("gemini");
  const [activeModel, setActiveModel] = useState<string>("gemini-1.5-pro");
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
  const [separateServicePages, setSeparateServicePages] = useState(false);
  const [separateAreaPages, setSeparateAreaPages] = useState(false);

  // Step 4 Theme Fields
  const [selectedThemeId, setSelectedThemeId] = useState<string>("modern-pro");
  const [customThemeColors, setCustomThemeColors] = useState<CustomThemeOverrides>({});

  // Step Validation Errors
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  // Generation & Results State
  const [generating, setGenerating] = useState(false);
  const [generationProgressText, setGenerationProgressText] = useState("Planning your pages…");
  const [generationPercent, setGenerationPercent] = useState(10);
  const [currentProject, setCurrentProject] = useState<ProjectData | null>(null);

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
      const storedModel = localStorage.getItem(`altofox_model_${storedProvider}`);
      if (storedModel) setActiveModel(storedModel);
    } else {
      // Check if any other provider has a saved key
      const otherProviders: ProviderType[] = ["openai", "gemini", "openrouter"];
      const fallback = otherProviders.find((p) => {
        const k = localStorage.getItem(`altofox_key_${p}`);
        return !!(k && k.trim());
      });

      if (fallback) {
        localStorage.setItem("altofox_active_provider", fallback);
        setActiveProvider(fallback);
        setHasKey(true);
        const m = localStorage.getItem(`altofox_model_${fallback}`);
        if (m) setActiveModel(m);
      } else {
        setActiveProvider(storedProvider);
        setHasKey(false);
      }
    }

    // Check Image API Keys
    const pexels = localStorage.getItem("altofox_pexels_key");
    const pixabay = localStorage.getItem("altofox_pixabay_key");
    const hasImg = !!((pexels && pexels.trim()) || (pixabay && pixabay.trim()));
    setHasImageKey(hasImg);
    if (pexels && pixabay) setImageKeySource("Pexels & Pixabay");
    else if (pexels) setImageKeySource("Pexels");
    else if (pixabay) setImageKeySource("Pixabay");
    else setImageKeySource("");
  }, []);

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
        if (Array.isArray(data.services)) setServices(data.services);
        if (data.logoUrl) setLogoUrl(data.logoUrl);
        if (data.yearsInBusiness) setYearsInBusiness(data.yearsInBusiness);
        if (data.uniqueSellingPoints) setUniqueSellingPoints(data.uniqueSellingPoints);

        if (data.streetAddress) setStreetAddress(data.streetAddress);
        if (data.city) setCity(data.city);
        if (data.stateRegion) setStateRegion(data.stateRegion);
        if (data.zipPostalCode) setZipPostalCode(data.zipPostalCode);
        if (data.country) setCountry(data.country);
        if (Array.isArray(data.serviceAreas)) setServiceAreas(data.serviceAreas);
        if (data.phone) setPhone(data.phone);
        if (data.email) setEmail(data.email);
        if (data.businessHours) setBusinessHours(data.businessHours);
        if (data.websiteDomain) setWebsiteDomain(data.websiteDomain);
        if (Array.isArray(data.keywords)) setKeywords(data.keywords);
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

  // Auto-save form progress to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      const state = {
        businessName,
        businessType,
        customBusinessType,
        businessDescription,
        services,
        logoUrl,
        yearsInBusiness,
        uniqueSellingPoints,
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
    }, 400);

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
      setSelectedThemeId("modern-pro");
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
    setCustomThemeColors({});
    setYearsInBusiness(EXAMPLE_DATA.yearsInBusiness);
    setUniqueSellingPoints(EXAMPLE_DATA.uniqueSellingPoints);
    setGoogleMaps(EXAMPLE_DATA.googleMaps);
    setSocialLinks(EXAMPLE_DATA.socialLinks);
    setMaxCompletedStep(5);
    setStepErrors({});
    addToast({
      type: "success",
      title: "Example Loaded",
      message: "Pre-filled with Dallas plumbing business specifications.",
    });
  };

  // Add / Remove Chips for Services
  const handleAddService = () => {
    const trimmed = serviceInput.trim();
    if (trimmed && !services.includes(trimmed)) {
      setServices([...services, trimmed]);
      setServiceInput("");
    }
  };

  const handleRemoveService = (item: string) => {
    setServices(services.filter((s) => s !== item));
  };

  // Add / Remove Chips for Service Areas
  const handleAddArea = () => {
    const trimmed = areaInput.trim();
    if (trimmed && !serviceAreas.includes(trimmed)) {
      setServiceAreas([...serviceAreas, trimmed]);
      setAreaInput("");
    }
  };

  const handleRemoveArea = (item: string) => {
    setServiceAreas(serviceAreas.filter((a) => a !== item));
  };

  // Add / Remove Chips for Keywords
  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (item: string) => {
    setKeywords(keywords.filter((k) => k !== item));
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
  const handleSuggestKeywords = () => {
    const generated = generateKeywordsForNiche(
      currentNichePack,
      city.trim() || "Dallas",
      stateRegion.trim() || "TX",
      serviceAreas
    );
    const merged = Array.from(new Set([...keywords, ...generated]));
    setKeywords(merged);
    addToast({
      type: "success",
      title: `${currentNichePack.name} SEO Keywords Generated`,
      message: `Added ${generated.length} high-intent local SEO keywords using ${currentNichePack.name} patterns.`,
    });
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

  // Validate Step 1
  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!businessName.trim()) {
      errors.businessName = "Business name is required.";
    }
    if (businessType === "Other (Custom)" && !customBusinessType.trim()) {
      errors.businessType = "Please specify your industry.";
    }
    if (!businessDescription.trim()) {
      errors.businessDescription = "A short business description is required.";
    }
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate Step 2
  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!city.trim()) {
      errors.city = "City is required for localized SEO.";
    }
    if (!stateRegion.trim()) {
      errors.stateRegion = "State or region is required.";
    }
    if (!phone.trim()) {
      errors.phone = "Phone number is required for customer calls.";
    }
    if (keywords.length === 0 && !keywordInput.trim()) {
      errors.keywords = "At least one target keyword is required. Click 'Suggest Keywords' for help.";
    }
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate Step 3 (Service Areas)
  const validateStep3 = (): boolean => {
    const errors: Record<string, string> = {};
    if (serviceAreaCities.length > 0 && !confirmedServesAreas) {
      errors.confirmedServesAreas = "Please confirm that your business genuinely serves all selected service areas.";
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
          message: "Please fill in the required business details.",
        });
        return;
      }
    } else if (currentStep === 2) {
      if (!validateStep2()) {
        addToast({
          type: "error",
          title: "Incomplete Fields",
          message: "Please enter your city, phone, and at least one keyword.",
        });
        return;
      }
    } else if (currentStep === 3) {
      if (!validateStep3()) {
        addToast({
          type: "warning",
          title: "Confirmation Required",
          message: "Please confirm that your business genuinely serves the selected service areas.",
        });
        return;
      }
    }

    const next = Math.min(currentStep + 1, 6);
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

  // Execute Website Generation
  const handleGenerateWebsite = async () => {
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
    const preferredSource =
      (localStorage.getItem("altofox_image_preferred_source") as "bing" | "pexels" | "pixabay") || "bing";

    setGenerating(true);
    setGenerationPercent(15);
    setGenerationProgressText("Planning site structure and pages…");

    const prefReview =
      (typeof window !== "undefined"
        ? localStorage.getItem("altofox_pref_quality_review")
        : null) !== "false";

    // Dynamic rotating status text including photo resolution and Quality Review
    const statusSequence = prefReview
      ? [
          { text: "Writing high-converting local copy (Pass 1)…", pct: 22, delay: 1800 },
          { text: "Finding the perfect photos… (3 of 12 photos)", pct: 38, delay: 3800 },
          { text: "Finding the perfect photos… (8 of 12 photos)", pct: 48, delay: 5500 },
          { text: "Finding the perfect photos… (12 of 12 photos)", pct: 58, delay: 7200 },
          { text: "Quality Review (Pass 2): auditing uniqueness, SEO & eliminating clichés…", pct: 72, delay: 9000 },
          { text: "Embedding LocalBusiness JSON-LD schema & meta tags…", pct: 85, delay: 11500 },
          { text: "Designing responsive styles with brand palette…", pct: 92, delay: 13500 },
          { text: "Connecting relative page navigation and scripts…", pct: 96, delay: 15500 },
          { text: "Finalizing static website package…", pct: 98, delay: 17500 },
        ]
      : [
          { text: "Writing high-converting local copy…", pct: 28, delay: 1800 },
          { text: "Finding the perfect photos… (3 of 12 photos)", pct: 45, delay: 3800 },
          { text: "Finding the perfect photos… (8 of 12 photos)", pct: 58, delay: 6000 },
          { text: "Finding the perfect photos… (12 of 12 photos)", pct: 70, delay: 8200 },
          { text: "Embedding LocalBusiness JSON-LD schema & meta tags…", pct: 82, delay: 10500 },
          { text: "Designing responsive styles with brand palette…", pct: 90, delay: 13000 },
          { text: "Connecting relative page navigation and scripts…", pct: 95, delay: 15500 },
          { text: "Finalizing static website package…", pct: 98, delay: 18000 },
        ];

    const timers: NodeJS.Timeout[] = statusSequence.map((item) =>
      setTimeout(() => {
        setGenerationProgressText(item.text);
        setGenerationPercent(item.pct);
      }, item.delay)
    );

    const savedLanguage =
      (typeof window !== "undefined" ? localStorage.getItem("altofox_pref_language") : null) || "English";

    const formData = {
      businessName: businessName.trim(),
      businessType: effectiveIndustry,
      nicheId: currentNichePack.id,
      schemaType: currentNichePack.schemaType,
      businessDescription: businessDescription.trim(),
      servicesOffered: services.join(", "),
      services: services,
      streetAddress: streetAddress.trim(),
      city: city.trim(),
      stateRegion: stateRegion.trim(),
      zipPostalCode: zipPostalCode.trim(),
      country: country.trim(),
      serviceAreas: serviceAreas.join(", "),
      serviceAreasList: serviceAreas,
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
      targetKeywords: keywords.join(", "),
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
      language: savedLanguage,
      qualityReview: prefReview,
      extraInstructions: [
        uniqueSellingPoints ? `Unique Selling Points: ${uniqueSellingPoints}` : "",
        yearsInBusiness ? `Years in business: ${yearsInBusiness}` : "",
        separateServicePages ? "Create individual service landing pages for each main service." : "",
        separateAreaPages ? "Create individual city landing pages for key service areas." : "",
      ]
        .filter(Boolean)
        .join(". "),
    };

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: activeProvider,
          model: activeModel,
          apiKey: localKey || undefined,
          pexelsKey,
          pixabayKey,
          preferredSource,
          qualityReview: prefReview,
          formData,
        }),
      });

      const data = await res.json();
      timers.forEach(clearTimeout);

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
        };
        setCurrentProject(projData);

        // Auto-save permanent project into IndexedDB
        try {
          const initialKeywordMap: ProjectKeywordItem[] = data.files
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

          const newSavedProject: SavedProject = {
            id: data.projectId || `proj-${Date.now()}`,
            name: businessName || "Local Business Website",
            createdAt: Date.now(),
            lastEditedAt: Date.now(),
            formData,
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
                summary: "Initial website generation",
                affectedPages: data.files.map((f: any) => f.path),
              },
            ],
            redirects: [],
          };

          await saveProjectToDB(newSavedProject);
          setActiveSavedProject(newSavedProject);
          await loadAllSavedProjects();
        } catch (dbErr) {
          console.warn("Could not save project to IndexedDB:", dbErr);
        }

        addToast({
          type: "success",
          title: data.qualityReport?.overallScore
            ? `Website Ready (Quality Score: ${data.qualityReport.overallScore}/100)`
            : data.qualityReviewApplied
            ? "Website Created & Quality Reviewed!"
            : "Website Created!",
          message: data.qualityReviewApplied
            ? `Generated ${data.files.filter((f: { path: string }) => f.path.endsWith(".html")).length} static HTML pages audited for 100% unique copy and SEO.`
            : `Generated ${data.files.filter((f: { path: string }) => f.path.endsWith(".html")).length} static HTML pages ready to inspect and download.`,
        });
      } else {
        addToast({
          type: "error",
          title: "Generation Failed",
          message: data.error || "The AI model encountered an issue. Please verify your API key or model name.",
        });
      }
    } catch (err) {
      timers.forEach(clearTimeout);
      addToast({
        type: "error",
        title: "Connection Error",
        message: err instanceof Error ? err.message : "Network error generating website. Please check your internet connection.",
      });
    } finally {
      setGenerating(false);
    }
  };

  const stepsList = [
    { number: 1, label: "Business Info" },
    { number: 2, label: "Location & SEO" },
    { number: 3, label: "Service Areas" },
    { number: 4, label: "Pages" },
    { number: 5, label: "Theme" },
    { number: 6, label: "Generate" },
  ];


  const handleClearAllData = useCallback(() => {
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
    addToast({
      type: "info",
      title: "Data Reset",
      message: "All saved builder form data, API keys, and preferences were cleared.",
    });
  }, [addToast]);

  const renderModals = () => (
    <>
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
              <LivePreview
                project={currentProject}
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
            </div>
          ) : (
            <main className="flex-1 flex flex-col justify-start py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
              {generating ? (
                /* VIEW 2: GENERATING SCREEN */
                <div className="max-w-xl mx-auto w-full my-auto py-16 px-4">
            <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-8 sm:p-10 shadow-lg text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center mx-auto shadow-sm">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#0F172A] mb-1.5">
                  Building Your Static Website
                </h2>
                <p className="text-sm font-medium text-[#4F46E5] min-h-[24px] transition-all">
                  {generationProgressText}
                </p>
                <p className="text-xs text-[#64748B] mt-1">
                  Writing zero-build static HTML, CSS, JavaScript, and Schema.org markup.
                </p>
              </div>

              {/* Animated Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-[#4F46E5] h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${generationPercent}%` }}
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setGenerating(false)}
                  className="text-xs font-semibold text-[#64748B] hover:text-[#EF4444] px-3 py-1.5 rounded-lg transition"
                >
                  Cancel Generation
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* VIEW 3: STEP-BY-STEP WIZARD */
          <div className="max-w-[720px] mx-auto w-full space-y-6">
            {/* Quick Actions Bar (Start over & Fill example) */}
            <div className="flex items-center justify-between text-xs text-[#64748B] px-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium">AltoFox Static Builder</span>
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
            <div className="bg-white border border-[#E2E8F0] rounded-[14px] p-3 sm:p-4 shadow-sm">
              {/* Desktop Progress Stepper */}
              <div className="hidden sm:flex items-center justify-between">
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
                        className={`flex items-center space-x-2.5 transition text-left ${
                          isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                            isCurrent
                              ? "bg-[#4F46E5] text-white ring-4 ring-[#EEF2FF]"
                              : isCompleted && step.number < currentStep
                              ? "bg-[#10B981] text-white"
                              : "bg-slate-100 text-[#64748B] border border-slate-200"
                          }`}
                        >
                          {isCompleted && step.number < currentStep ? (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          ) : (
                            step.number
                          )}
                        </div>
                        <span
                          className={`text-xs font-semibold ${
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
                          className={`flex-1 h-0.5 mx-2 rounded transition-colors ${
                            step.number < currentStep ? "bg-[#10B981]" : "bg-[#E2E8F0]"
                          }`}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Mobile Progress Stepper */}
              <div className="flex sm:hidden items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#4F46E5]">
                    Step {currentStep} of 5
                  </span>
                  <h4 className="text-sm font-bold text-[#0F172A]">
                    {stepsList[currentStep - 1]?.label}
                  </h4>
                </div>
                <div className="flex items-center space-x-1">
                  {stepsList.map((step) => (
                    <div
                      key={step.number}
                      className={`h-1.5 rounded-full transition-all ${
                        currentStep === step.number
                          ? "w-6 bg-[#4F46E5]"
                          : step.number < currentStep
                          ? "w-2.5 bg-[#10B981]"
                          : "w-2.5 bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Wizard Card Content */}
            <div className="bg-white border border-[#E2E8F0] rounded-[16px] shadow-sm overflow-hidden p-6 sm:p-8 space-y-6">
              {/* STEP 1: BUSINESS INFO */}
              {currentStep === 1 && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  {/* API Key Missing Reminder Banner */}
                  {!hasKey && (
                    <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[12px] p-3.5 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 text-[#92400E]">
                        <Key className="w-4 h-4 shrink-0 text-[#F59E0B]" />
                        <span>Connect an AI model anytime to start building →</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSettingsOpen(true)}
                        className="font-bold text-[#92400E] underline hover:text-black shrink-0 ml-3"
                      >
                        Connect Key
                      </button>
                    </div>
                  )}

                  <div>
                    <h2 className="text-lg font-bold text-[#0F172A]">Tell us about your business</h2>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      We will use these details to generate persuasive, industry-specific content.
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
                        placeholder="e.g. Apex Pro Plumbing & Rooter"
                        className="input-base"
                      />
                      {stepErrors.businessName ? (
                        <p className="text-xs text-[#EF4444] mt-1 font-medium">
                          {stepErrors.businessName}
                        </p>
                      ) : (
                        <p className="text-[11px] text-[#64748B] mt-1">
                          Appears in your site header, footer, and LocalBusiness schema.
                        </p>
                      )}
                    </div>

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
                      <div className="mt-2 flex items-center justify-between text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-3 py-1.5">
                        <span className="text-[#64748B] flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                          <span>Niche Pack: <strong className="text-[#0F172A]">{currentNichePack.name}</strong> ({currentNichePack.schemaType})</span>
                        </span>
                        {currentNichePack.emergencyService ? (
                          <span className="text-[10px] font-bold text-[#DC2626] bg-[#FEF2F2] px-2 py-0.5 rounded border border-[#FECACA]">
                            ⚡ 24/7 Emergency Trade
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-[#4F46E5] bg-[#EEF2FF] px-2 py-0.5 rounded border border-[#C7D2FE]">
                            {currentNichePack.commonServices.length} Trade Services
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
                        rows={3}
                        value={businessDescription}
                        onChange={(e) => {
                          setBusinessDescription(e.target.value);
                          if (stepErrors.businessDescription) {
                            setStepErrors((prev) => ({ ...prev, businessDescription: "" }));
                          }
                        }}
                        placeholder="e.g. Family-owned plumbing company providing 24/7 emergency dispatch, drain cleaning, and water heater repairs."
                        className="w-full p-3 border border-[#E2E8F0] rounded-[10px] text-sm text-[#0F172A] focus:outline-none focus:border-[#4F46E5] focus:ring-3 focus:ring-[#4F46E5]/15"
                      />
                      {stepErrors.businessDescription ? (
                        <p className="text-xs text-[#EF4444] mt-1 font-medium">
                          {stepErrors.businessDescription}
                        </p>
                      ) : (
                        <p className="text-[11px] text-[#64748B] mt-1">
                          Used to write the homepage hero and about sections.
                        </p>
                      )}
                    </div>

                    {/* Services Offered (Chips / Tag input) */}
                    <div>
                      <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                        Services Offered (Type and press Enter or Add)
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={serviceInput}
                          onChange={(e) => setServiceInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddService();
                            }
                          }}
                          placeholder="e.g. Slab Leak Detection"
                          className="input-base flex-1"
                        />
                        <button
                          type="button"
                          onClick={handleAddService}
                          className="px-3.5 py-2 rounded-[10px] bg-slate-100 hover:bg-slate-200 text-[#0F172A] font-semibold text-xs transition"
                        >
                          + Add
                        </button>
                      </div>

                      {/* Chip tags list */}
                      <div className="flex flex-wrap gap-1.5">
                        {services.map((srv) => (
                          <span
                            key={srv}
                            className="inline-flex items-center space-x-1.5 bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE] px-2.5 py-1 rounded-full text-xs font-medium"
                          >
                            <span>{srv}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveService(srv)}
                              className="hover:text-red-600 rounded-full"
                              aria-label={`Remove ${srv}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>

                      {/* Suggested Services from Niche Pack */}
                      {suggestedServices.length > 0 && (
                        <div className="mt-3 p-3 rounded-[12px] bg-slate-50 border border-slate-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-[#475569] flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
                              Suggested for {currentNichePack.name} (click to add)
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
                              className="text-[11px] font-semibold text-[#4F46E5] hover:text-[#4338CA] hover:underline"
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

                    {/* Optional Details (Years in business & USP) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                          Years in Business (Optional)
                        </label>
                        <input
                          type="text"
                          value={yearsInBusiness}
                          onChange={(e) => setYearsInBusiness(e.target.value)}
                          placeholder="e.g. 20+ Years"
                          className="input-base"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                          Logo Image URL (Optional)
                        </label>
                        <input
                          type="url"
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          placeholder="https://example.com/logo.png"
                          className="input-base"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                        Unique Selling Points (Optional)
                      </label>
                      <input
                        type="text"
                        value={uniqueSellingPoints}
                        onChange={(e) => setUniqueSellingPoints(e.target.value)}
                        placeholder="e.g. 45-min arrival, upfront pricing, licensed master plumbers"
                        className="input-base"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: LOCATION & SEO */}
              {currentStep === 2 && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div>
                    <h2 className="text-lg font-bold text-[#0F172A]">Location &amp; Local SEO</h2>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Crucial details to help your website rank on Google Maps and localized searches.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Address & City */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                          Street Address (Optional)
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
                          City <span className="text-[#EF4444]">*</span>
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
                    </div>

                    {/* State, ZIP & Country */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                          ZIP / Postal Code
                        </label>
                        <input
                          type="text"
                          value={zipPostalCode}
                          onChange={(e) => setZipPostalCode(e.target.value)}
                          placeholder="75201"
                          className="input-base"
                        />
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

                    {/* Service Areas (Chips) */}
                    <div>
                      <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                        Service Areas (Nearby cities &amp; suburbs)
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={areaInput}
                          onChange={(e) => setAreaInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddArea();
                            }
                          }}
                          placeholder="e.g. Plano, Frisco, McKinney"
                          className="input-base flex-1"
                        />
                        <button
                          type="button"
                          onClick={handleAddArea}
                          className="px-3.5 py-2 rounded-[10px] bg-slate-100 hover:bg-slate-200 text-[#0F172A] font-semibold text-xs transition"
                        >
                          + Add
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {serviceAreas.map((area) => (
                          <span
                            key={area}
                            className="inline-flex items-center space-x-1.5 bg-slate-100 text-[#0F172A] border border-slate-200 px-2.5 py-1 rounded-full text-xs font-medium"
                          >
                            <span>{area}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveArea(area)}
                              className="hover:text-red-600 rounded-full"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
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
                        {stepErrors.phone && (
                          <p className="text-xs text-[#EF4444] mt-1 font-medium">{stepErrors.phone}</p>
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
                          placeholder="dispatch@example.com"
                          className="input-base"
                        />
                      </div>
                    </div>

                    {/* Business Hours & Website Domain */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-semibold text-[#0F172A]">
                            Business Hours
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
                          placeholder="e.g. Mon-Sun: 24/7 Emergency Service"
                          className="input-base"
                        />
                      </div>
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
                      </div>
                    </div>

                    {/* Target Keywords (with Niche Pack Suggest button) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center space-x-2">
                          <label className="text-xs font-semibold text-[#0F172A]">
                            Target Keywords for Local SEO <span className="text-[#EF4444]">*</span>
                          </label>
                          <span className="text-[10px] font-medium text-[#4F46E5] bg-[#EEF2FF] px-2 py-0.5 rounded-full border border-[#C7D2FE]">
                            {currentNichePack.name} Patterns
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleSuggestKeywords}
                          className="inline-flex items-center space-x-1 text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] hover:underline cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Suggest {currentNichePack.name} Keywords</span>
                        </button>
                      </div>

                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={keywordInput}
                          onChange={(e) => setKeywordInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddKeyword();
                            }
                          }}
                          placeholder="e.g. emergency plumber Dallas TX"
                          className="input-base flex-1"
                        />
                        <button
                          type="button"
                          onClick={handleAddKeyword}
                          className="px-3.5 py-2 rounded-[10px] bg-slate-100 hover:bg-slate-200 text-[#0F172A] font-semibold text-xs transition"
                        >
                          + Add
                        </button>
                      </div>

                      {/* Keywords list */}
                      <div className="flex flex-wrap gap-1.5">
                        {keywords.map((kw) => (
                          <span
                            key={kw}
                            className="inline-flex items-center space-x-1.5 bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE] px-2.5 py-1 rounded-full text-xs font-medium"
                          >
                            <span>{kw}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveKeyword(kw)}
                              className="hover:text-red-600 rounded-full"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      {stepErrors.keywords && (
                        <p className="text-xs text-[#EF4444] mt-1 font-medium">
                          {stepErrors.keywords}
                        </p>
                      )}
                    </div>

                    {/* Collapsible Maps & Social Links */}
                    <div className="border border-[#E2E8F0] rounded-[10px] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setShowCollapsibleSeo(!showCollapsibleSeo)}
                        className="w-full p-3 bg-slate-50 flex items-center justify-between text-xs font-semibold text-[#0F172A] hover:bg-slate-100 transition"
                      >
                        <span>Google Maps &amp; Social Links (Optional)</span>
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
                              placeholder="Facebook: fb.com/mybiz, Yelp: yelp.com/biz/mybiz"
                              className="input-base"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: SERVICE AREAS & RADIUS COVERAGE */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <ServiceAreaPicker
                    businessCity={city}
                    businessState={stateRegion}
                    businessName={businessName}
                    mainService={services[0] || businessType}
                    servicesList={services}
                    selectedCities={serviceAreaCities}
                    onSelectedCitiesChange={setServiceAreaCities}
                    createSeparateServiceLocationPages={createSeparateServiceLocationPages}
                    onCreateSeparateServiceLocationPagesChange={setCreateSeparateServiceLocationPages}
                    confirmedServesAreas={confirmedServesAreas}
                    onConfirmedServesAreasChange={setConfirmedServesAreas}
                  />
                </div>
              )}

              {/* STEP 4: PAGES SELECTION */}
              {currentStep === 4 && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div>
                    <h2 className="text-lg font-bold text-[#0F172A]">Choose your website pages</h2>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Select which pages you want included. Every page shares consistent navigation and relative links.
                    </p>
                  </div>

                  {/* Live Count Badge */}
                  <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#EEF2FF] border border-[#C7D2FE] text-xs font-semibold text-[#4F46E5]">
                    <Layers className="w-4 h-4" />
                    <span>Your website will have {selectedPages.length} pages</span>
                  </div>

                  {/* Visual Page Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {AVAILABLE_PAGES.map((page) => {
                      const isSelected = selectedPages.includes(page.id);
                      return (
                        <div
                          key={page.id}
                          onClick={() => togglePage(page.id)}
                          className={`p-3.5 rounded-[12px] border text-left transition cursor-pointer flex items-start space-x-3 ${
                            isSelected
                              ? "border-[#4F46E5] bg-[#EEF2FF]/40 ring-1 ring-[#4F46E5]"
                              : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]"
                          }`}
                        >
                          <div className="mt-0.5 p-1.5 rounded-[8px] bg-white border border-[#E2E8F0] shadow-xs">
                            {page.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-[#0F172A]">{page.name}</span>
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                  isSelected
                                    ? "bg-[#4F46E5] border-[#4F46E5] text-white"
                                    : "border-slate-300 bg-white"
                                }`}
                              >
                                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </div>
                            </div>
                            <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
                              {page.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* SEO Multi-Page Toggles */}
                  <div className="pt-2 border-t border-[#E2E8F0] space-y-3">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={separateServicePages}
                        onChange={(e) => setSeparateServicePages(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded text-[#4F46E5] focus:ring-[#4F46E5]"
                      />
                      <div>
                        <span className="text-xs font-bold text-[#0F172A]">
                          Create a separate landing page for each main service
                        </span>
                        <p className="text-[11px] text-[#64748B]">
                          Tip: Dedicated service pages make it significantly easier to rank for specific terms like &quot;Water Heater Repair Dallas&quot;.
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={separateAreaPages}
                        onChange={(e) => setSeparateAreaPages(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded text-[#4F46E5] focus:ring-[#4F46E5]"
                      />
                      <div>
                        <span className="text-xs font-bold text-[#0F172A]">
                          Create a dedicated page for each service area
                        </span>
                        <p className="text-[11px] text-[#64748B]">
                          Tip: Ranks individual neighboring cities and suburbs on Google Local Pack.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* STEP 5: THEME SELECTION */}
              {currentStep === 5 && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-bold text-[#0F172A]">Choose your website theme</h2>
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
                    {THEMES.map((theme) => {
                      const isSelected = selectedThemeId === theme.id;
                      const isRecommended = recommendedThemeIds.includes(theme.id);
                      const previewColors = isSelected ? activeColors : theme.colors;

                      return (
                        <div
                          key={theme.id}
                          onClick={() => setSelectedThemeId(theme.id)}
                          className={`rounded-[14px] border p-3.5 text-left cursor-pointer transition-all flex flex-col justify-between relative group ${
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
                          <div className="space-y-1.5 flex-1 flex flex-col justify-between">
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

              {/* STEP 6: REVIEW & GENERATE */}
              {currentStep === 6 && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div>
                    <h2 className="text-lg font-bold text-[#0F172A]">Review your website plan</h2>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Verify everything looks great before triggering AI static site generation.
                    </p>
                  </div>

                  {/* Review Summary Card */}
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[14px] p-5 space-y-4">
                    {/* Business Info Item */}
                    <div className="flex items-start justify-between pb-3 border-b border-[#E2E8F0]">
                      <div>
                        <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
                          Business Info
                        </span>
                        <h4 className="text-sm font-bold text-[#0F172A] mt-0.5">
                          {businessName || "Unnamed Business"}
                        </h4>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          {effectiveIndustry} • Niche Pack: <strong className="text-[#0F172A]">{currentNichePack.name}</strong> ({currentNichePack.schemaType}) • {services.length} services
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="text-xs font-semibold text-[#4F46E5] hover:underline"
                      >
                        Edit
                      </button>
                    </div>

                    {/* Location & SEO Item */}
                    <div className="flex items-start justify-between pb-3 border-b border-[#E2E8F0]">
                      <div>
                        <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
                          Location &amp; SEO
                        </span>
                        <h4 className="text-sm font-bold text-[#0F172A] mt-0.5">
                          {city}, {stateRegion}
                        </h4>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          Phone: {phone || "None"} • {keywords.length} target keywords
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="text-xs font-semibold text-[#4F46E5] hover:underline"
                      >
                        Edit
                      </button>
                    </div>

                    {/* Service Areas Item */}
                    <div className="flex items-start justify-between pb-3 border-b border-[#E2E8F0]">
                      <div>
                        <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
                          Service Areas &amp; Location Pages
                        </span>
                        <h4 className="text-sm font-bold text-[#0F172A] mt-0.5">
                          {serviceAreaCities.length > 0
                            ? `${serviceAreaCities.length} Selected Coverage Cities`
                            : "Standard Regional Coverage"}
                        </h4>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          {serviceAreaCities.length > 0
                            ? `Includes service-areas.html directory hub + ${createSeparateServiceLocationPages ? "dedicated landing pages per city" : "radius coverage list"}`
                            : "No extra location landing pages selected"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="text-xs font-semibold text-[#4F46E5] hover:underline"
                      >
                        Edit
                      </button>
                    </div>

                    {/* Pages Item */}
                    <div className="flex items-start justify-between pb-3 border-b border-[#E2E8F0]">
                      <div>
                        <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
                          Pages to Generate ({selectedPages.length})
                        </span>
                        <p className="text-xs text-[#0F172A] font-medium mt-0.5">
                          {selectedPages.join(", ")}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(4)}
                        className="text-xs font-semibold text-[#4F46E5] hover:underline"
                      >
                        Edit
                      </button>
                    </div>

                    {/* Theme Item */}
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
                          Theme &amp; Style
                        </span>
                        <div className="flex items-center space-x-2 mt-1">
                          <span
                            className="w-3.5 h-3.5 rounded-full inline-block shadow-2xs border border-black/10"
                            style={{ backgroundColor: activeColors.primary }}
                            title="Primary Color"
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full inline-block shadow-2xs border border-black/10"
                            style={{ backgroundColor: activeColors.accent }}
                            title="Accent Color"
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full inline-block shadow-2xs border border-black/10"
                            style={{ backgroundColor: activeColors.background }}
                            title="Background Color"
                          />
                          <span className="text-xs font-bold text-[#0F172A]">{activeTheme.name}</span>
                          {hasCustomColors && (
                            <span className="text-[10px] font-medium text-[#10B981] bg-[#ECFDF5] px-1.5 py-0.5 rounded border border-[#A7F3D0]">
                              Custom Colors
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#64748B] mt-0.5 font-mono">
                          Heading: {activeTheme.fonts.heading} • Body: {activeTheme.fonts.body}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(5)}
                        className="text-xs font-semibold text-[#4F46E5] hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  {/* Connected AI Model Notification */}
                  <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-3.5 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-[#4F46E5]" />
                      <span className="text-[#64748B]">
                        Model:{" "}
                        {hasKey ? (
                          <>
                            <strong className="text-[#0F172A]">{activeModel}</strong> ({activeProvider})
                          </>
                        ) : (
                          <span className="text-amber-600 font-semibold">No AI model connected</span>
                        )}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenSettings("models")}
                      className="font-bold text-[#4F46E5] hover:underline"
                    >
                      Change
                    </button>
                  </div>

                  {/* Quality Review Setting Row */}
                  <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-3.5 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-[#4F46E5]" />
                      <span className="text-[#64748B]">
                        Quality Review:{" "}
                        {qualityReviewEnabled ? (
                          <strong className="text-[#10B981]">On (Two-pass uniqueness &amp; SEO audit)</strong>
                        ) : (
                          <span className="text-[#64748B] font-medium">Off (Single generation pass)</span>
                        )}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenSettings("preferences")}
                      className="font-bold text-[#4F46E5] hover:underline"
                    >
                      Change
                    </button>
                  </div>

                  {/* Stock Photo Source Status / Notice */}
                  {!hasImageKey && !dismissImageNotice ? (
                    <div className="bg-amber-50/80 border border-amber-200 rounded-[12px] p-3.5 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                      <div className="flex items-start sm:items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-amber-900">
                            Add a free Pexels or Pixabay key in Settings to include real photos
                          </p>
                          <p className="text-amber-700 text-[11px] mt-0.5">
                            Without an API key, we will automatically use our curated trade photography library.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => setDismissImageNotice(true)}
                          className="px-2.5 py-1.5 rounded-[8px] border border-amber-300 bg-white/90 hover:bg-white text-amber-800 font-medium text-[11px] transition shadow-2xs"
                        >
                          Continue with curated photos
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenSettings("images")}
                          className="px-2.5 py-1.5 rounded-[8px] bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] transition shadow-2xs"
                        >
                          Configure in Settings
                        </button>
                      </div>
                    </div>
                  ) : hasImageKey ? (
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-[12px] p-3.5 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <span className="text-emerald-950 font-medium">
                          Real stock photos enabled{" "}
                          <span className="text-emerald-700 font-normal">
                            ({imageKeySource || "Pexels/Pixabay"})
                          </span>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenSettings("images")}
                        className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                      >
                        Change
                      </button>
                    </div>
                  ) : null}

                  {/* Big Primary Generation Button */}
                  <button
                    type="button"
                    onClick={handleGenerateWebsite}
                    className="w-full inline-flex items-center justify-center space-x-2 py-4 px-6 rounded-[12px] bg-[#4F46E5] hover:bg-[#4338CA] text-white text-base font-bold shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>✨ Generate My Website</span>
                  </button>
                </div>
              )}

              {/* Wizard Bottom Navigation Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-[10px] border border-[#CBD5E1] bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A] transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                ) : (
                  <div />
                )}

                {currentStep < 6 && (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-[10px] bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold shadow-sm transition"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
        <p className="text-sm font-medium text-slate-400">Loading AltoFox workspace…</p>
      </div>
    );
  }

  // Protected Dashboard Guard
  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/login?redirect=/dashboard";
    }
    return null;
  }

  if (!isApproved) {
    if (typeof window !== "undefined") {
      window.location.href = "/pending";
    }
    return null;
  }

  return (
    <AppShell
      currentTab={navTab}
      projectsCount={savedProjectsList.length}
      onNavigate={(tab) => {
        if (tab === "settings") {
          handleOpenSettings("models");
        } else {
          setNavTab(tab);
        }
      }}
      activeProjectId={activeSavedProject?.id}
      onSelectProject={(projId) => {
        const found = savedProjectsList.find((p) => p.id === projId);
        if (found) {
          setActiveSavedProject(found);
          setViewMode("manager");
          setNavTab("projects");
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
            onNewProject={() => {
              setNavTab("projects");
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
                setNavTab("projects");
              }
            }}
            onOpenImportLocal={() => setIsImportLocalModalOpen(true)}
            onNavigateToProjects={() => {
              setNavTab("projects");
              setViewMode("dashboard");
            }}
          />
        </div>
      )}

      {/* TAB 2: TEAM MANAGEMENT */}
      {navTab === "team" && (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <TeamManagement />
        </div>
      )}

      {/* TAB 3: ACTIVITY FEED */}
      {navTab === "activity" && (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
            <ActivityFeed maxItems={100} />
          </div>
        </div>
      )}

      {/* TAB 4: PROJECTS / BUILDER WORKSPACE */}
      {navTab === "projects" && (
        <div className="flex-1 flex flex-col w-full min-h-0">
          {viewMode === "dashboard" ? (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
              <ProjectsDashboard
                projects={savedProjectsList}
                onOpenProject={(proj) => {
                  setActiveSavedProject(proj);
                  setViewMode("manager");
                }}
                onNewWebsite={() => {
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
            </div>
          ) : viewMode === "manager" && activeSavedProject ? (
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
          ) : (
            renderBuilderWorkspace()
          
          )}
        </div>
      )}

            {/* Advanced Modals */}
      {renderModals()}
    
    </AppShell>
  );
}
