"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { BRAND } from "@/config/brand";
import {
  X,
  Sparkles,
  Cpu,
  Globe,
  Check,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  ExternalLink,
  ShieldCheck,
  Trash2,
  Sliders,
  Edit2,
  Lock,
  Palette,
  Languages,
  Server,
  Image as ImageIcon,
  Plus,
  Zap,
  CheckSquare,
  Layers,
  Cloud,
} from "lucide-react";
import { ProviderType } from "@/lib/ai/types";
import { normalizeModelForProvider } from "@/lib/ai/provider-models";

export interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "models" | "images" | "preferences" | "cloudflare" | "hosting";
  initialMessage?: string | null;
  onSettingsUpdated: () => void;
  onClearAllData?: () => void;
}

interface ProviderConfig {
  id: ProviderType;
  name: string;
  badgeName: string;
  icon: React.ReactNode;
  defaultModel: string;
  popularModels: { id: string; label: string }[];
  placeholderKey: string;
  docsUrl: string;
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: "gemini",
    name: "Google Gemini",
    badgeName: "Gemini",
    icon: (
      <div className="w-8 h-8 rounded-[8px] bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
        <Sparkles className="w-4 h-4" />
      </div>
    ),
    defaultModel: "gemini-3.8-flash",
    popularModels: [
      { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash (Recommended - Workhorse)" },
      { id: "gemini-3.8-flash-cyber", label: "Gemini 3.8 Flash Cyber (Defense & Audit)" },
      { id: "gemini-3.8-pro", label: "Gemini 3.8 Pro (Frontier Multimodal & Thinking)" },
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
      { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash (Fast)" },
      { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro (2M Context)" },
    ],
    placeholderKey: "AIzaSy...",
    docsUrl: "https://aistudio.google.com/app/apikey",
  },
  {
    id: "openai",
    name: "OpenAI (ChatGPT)",
    badgeName: "OpenAI",
    icon: (
      <div className="w-8 h-8 rounded-[8px] bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
        OA
      </div>
    ),
    defaultModel: "gpt-6-astra",
    popularModels: [
      { id: "gpt-6-astra", label: "GPT-6 Astra (Recommended - Frontier Reasoning)" },
      { id: "gpt-6-sol", label: "GPT-6 Sol (Agentic & Fast)" },
      { id: "gpt-6-luna", label: "GPT-6 Luna (High Volume)" },
      { id: "gpt-4o", label: "GPT-4o (Flagship Omnimodal)" },
      { id: "gpt-4o-mini", label: "GPT-4o Mini (Affordable)" },
      { id: "o3-mini", label: "o3-mini (High Reasoning)" },
      { id: "o1", label: "o1 (Deep Reasoning)" },
    ],
    placeholderKey: "sk-proj-...",
    docsUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "anthropic",
    name: "Anthropic (Claude)",
    badgeName: "Claude",
    icon: (
      <div className="w-8 h-8 rounded-[8px] bg-amber-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
        CL
      </div>
    ),
    defaultModel: "claude-sonnet-5-5",
    popularModels: [
      { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5 (Recommended - 30% Faster)" },
      { id: "claude-opus-5-5", label: "Claude Opus 5.5 (1M Context)" },
      { id: "claude-fable-5-1", label: "Claude Fable 5.1 (Autonomous Agents)" },
      { id: "claude-3-7-sonnet-20250219", label: "Claude 3.7 Sonnet (Hybrid Reasoning)" },
      { id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
      { id: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku" },
    ],
    placeholderKey: "sk-ant-...",
    docsUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    badgeName: "DeepSeek",
    icon: (
      <div className="w-8 h-8 rounded-[8px] bg-blue-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
        DS
      </div>
    ),
    defaultModel: "deepseek-v4.1-flash",
    popularModels: [
      { id: "deepseek-v4.1-flash", label: "DeepSeek V4.1-Flash (Recommended - MoE)" },
      { id: "deepseek-chat", label: "DeepSeek-V3" },
      { id: "deepseek-reasoner", label: "DeepSeek-R1" },
    ],
    placeholderKey: "sk-...",
    docsUrl: "https://platform.deepseek.com/api_keys",
  },
  {
    id: "groq",
    name: "Groq",
    badgeName: "Groq",
    icon: (
      <div className="w-8 h-8 rounded-[8px] bg-orange-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
        <Zap className="w-4 h-4" />
      </div>
    ),
    defaultModel: "llama-3.3-70b-versatile",
    popularModels: [
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile" },
      { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant" },
      { id: "deepseek-r1-distill-llama-70b", label: "DeepSeek-R1 70B (Groq)" },
      { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B" },
    ],
    placeholderKey: "gsk_...",
    docsUrl: "https://console.groq.com/keys",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    badgeName: "OpenRouter",
    icon: (
      <div className="w-8 h-8 rounded-[8px] bg-purple-600 text-white flex items-center justify-center shadow-xs">
        <Globe className="w-4 h-4" />
      </div>
    ),
    defaultModel: "google/gemini-3.8-flash",
    popularModels: [
      { id: "google/gemini-3.8-flash", label: "Gemini 3.8 Flash via OpenRouter (Recommended)" },
      { id: "openai/gpt-6-astra", label: "GPT-6 Astra via OpenRouter" },
      { id: "anthropic/claude-sonnet-5.5", label: "Claude Sonnet 5.5 via OpenRouter" },
      { id: "deepseek/deepseek-v4.1-flash", label: "DeepSeek V4.1-Flash via OpenRouter" },
      { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
      { id: "openai/gpt-4o", label: "GPT-4o via OpenRouter" },
    ],
    placeholderKey: "sk-or-v1-...",
    docsUrl: "https://openrouter.ai/keys",
  },
];

const COUNTRY_OPTIONS = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "Germany",
  "France",
  "Spain",
  "Netherlands",
  "Italy",
  "Mexico",
  "Brazil",
  "India",
  "Japan",
  "Other",
];

import { THEMES } from "@/lib/themes";

const THEME_OPTIONS = THEMES.map((t) => ({
  id: t.id,
  name: t.name,
  color: t.colors.primary,
}));

const LANGUAGE_OPTIONS = [
  "English",
  "Spanish (Español)",
  "French (Français)",
  "German (Deutsch)",
  "Italian (Italiano)",
  "Portuguese (Português)",
  "Dutch (Nederlands)",
  "Japanese (日本語)",
];

// Helper to mask key showing only last 4 characters: "sk-•••••••a8F2"
function maskApiKey(key: string): string {
  if (!key) return "";
  const trimmed = key.trim();
  if (trimmed.length <= 6) return "••••••••";
  const prefix = trimmed.startsWith("sk-") ? "sk-" : trimmed.startsWith("AIza") ? "AIza" : "";
  const suffix = trimmed.slice(-4);
  return prefix ? `${prefix}••••••••${suffix}` : `••••••••${suffix}`;
}

export function SettingsPanel({
  isOpen,
  onClose,
  initialTab = "models",
  initialMessage = null,
  onSettingsUpdated,
  onClearAllData,
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<"models" | "images" | "preferences" | "cloudflare" | "hosting">(
    initialTab === "hosting" ? "hosting" : initialTab
  );

  // Default AI Provider & Model
  const [defaultProvider, setDefaultProvider] = useState<ProviderType>("gemini");
  const [defaultModel, setDefaultModel] = useState<string>("gemini-3.8-flash");

  // Provider states
  const [savedKeys, setSavedKeys] = useState<Record<string, string>>({});
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [isEditingKey, setIsEditingKey] = useState<Record<string, boolean>>({});
  const [selectedModels, setSelectedModels] = useState<Record<string, string>>({});
  const [customModelInputs, setCustomModelInputs] = useState<Record<string, string>>({});
  const [liveProviderModels, setLiveProviderModels] = useState<Record<string, string[]>>({});
  const [isFetchingModels, setIsFetchingModels] = useState<Record<string, boolean>>({});
  const [providerStatuses, setProviderStatuses] = useState<
    Record<string, "connected" | "not_connected" | "error">
  >({});
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, { success: boolean; message: string }>
  >({});

  // Provider capabilities & latency states
  const [providerLatencies, setProviderLatencies] = useState<Record<string, number>>({});
  const [providerCapabilities, setProviderCapabilities] = useState<
    Record<string, { chatCompletion?: boolean; structuredJson?: boolean; systemInstructions?: boolean }>
  >({});
  const [smartFallback, setSmartFallback] = useState<boolean>(true);

  // Custom OpenAI-compatible Provider states
  const [providerTypeMode, setProviderTypeMode] = useState<"existing" | "custom">("existing");
  const [customPreset, setCustomPreset] = useState<string>("custom");
  const [customProviderName, setCustomProviderName] = useState<string>("My Custom AI");
  const [customBaseUrl, setCustomBaseUrl] = useState<string>("https://example.com/v1");
  const [customApiKey, setCustomApiKey] = useState<string>("");
  const [customModelName, setCustomModelName] = useState<string>("model-name");
  const [customOrgId, setCustomOrgId] = useState<string>("");
  const [showCustomKey, setShowCustomKey] = useState<boolean>(false);
  const [isEditingCustomKey, setIsEditingCustomKey] = useState<boolean>(false);
  const [customTestResult, setCustomTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);
  const [isTestingCustom, setIsTestingCustom] = useState<boolean>(false);

  // Image Sources states
  const [savedGoogleKey, setSavedGoogleKey] = useState("");
  const [googleKeyInput, setGoogleKeyInput] = useState("");
  const [savedGoogleCx, setSavedGoogleCx] = useState("");
  const [googleCxInput, setGoogleCxInput] = useState("");
  const [showGoogleKey, setShowGoogleKey] = useState(false);
  const [isEditingGoogleKey, setIsEditingGoogleKey] = useState(false);
  const [googleStatus, setGoogleStatus] = useState<"connected" | "not_connected" | "error">("not_connected");

  const [savedPexelsKey, setSavedPexelsKey] = useState("");
  const [pexelsKeyInput, setPexelsKeyInput] = useState("");
  const [showPexelsKey, setShowPexelsKey] = useState(false);
  const [isEditingPexelsKey, setIsEditingPexelsKey] = useState(false);
  const [pexelsStatus, setPexelsStatus] = useState<"connected" | "not_connected" | "error">("not_connected");

  const [savedPixabayKey, setSavedPixabayKey] = useState("");
  const [pixabayKeyInput, setPixabayKeyInput] = useState("");
  const [showPixabayKey, setShowPixabayKey] = useState(false);
  const [isEditingPixabayKey, setIsEditingPixabayKey] = useState(false);
  const [pixabayStatus, setPixabayStatus] = useState<"connected" | "not_connected" | "error">("not_connected");

  const [preferredImageSource, setPreferredImageSource] = useState<"bing" | "pexels" | "pixabay" | "google">("bing");
  const [testingImageSource, setTestingImageSource] = useState<"bing" | "pexels" | "pixabay" | "google" | null>(null);
  const [imageTestResults, setImageTestResults] = useState<
    Record<"bing" | "pexels" | "pixabay" | "google", { success: boolean; message: string } | null>
  >({ bing: null, pexels: null, pixabay: null, google: null });

  // Preferences states
  const [prefCountry, setPrefCountry] = useState("United States");
  const [prefTheme, setPrefTheme] = useState("modern-indigo");
  const [prefLanguage, setPrefLanguage] = useState("English");
  const [prefQualityReview, setPrefQualityReview] = useState(true);
  const [prefSavedMessage, setPrefSavedMessage] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Multi-Hosting Provider States
  const [selectedHostingProvider, setSelectedHostingProvider] = useState<"cloudflare" | "vercel" | "netlify" | "github">("cloudflare");
  const [hostingStatuses, setHostingStatuses] = useState<Record<string, { connected: boolean; maskedToken?: string; accountName?: string }>>({});

  // Cloudflare Connection States
  const [cfTokenInput, setCfTokenInput] = useState("");
  const [cfAccountInput, setCfAccountInput] = useState("");
  const [cfAccountNameInput, setCfAccountNameInput] = useState("");
  const [showCfToken, setShowCfToken] = useState(false);
  const [cfMaskedToken, setCfMaskedToken] = useState("");
  const [cfConnected, setCfConnected] = useState(false);
  const [cfAccountName, setCfAccountName] = useState("");
  const [cfStatusError, setCfStatusError] = useState<string | null>(null);
  const [cfIsTesting, setCfIsTesting] = useState(false);
  const [cfTestResult, setCfTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [cfIsSaving, setCfIsSaving] = useState(false);
  const [cfSaveMessage, setCfSaveMessage] = useState<string | null>(null);

  // Vercel Form State
  const [vercelTokenInput, setVercelTokenInput] = useState("");
  const [vercelTeamIdInput, setVercelTeamIdInput] = useState("");
  const [showVercelToken, setShowVercelToken] = useState(false);
  const [vercelIsTesting, setVercelIsTesting] = useState(false);
  const [vercelTestResult, setVercelTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [vercelIsSaving, setVercelIsSaving] = useState(false);
  const [vercelSaveMessage, setVercelSaveMessage] = useState<string | null>(null);

  // Netlify Form State
  const [netlifyTokenInput, setNetlifyTokenInput] = useState("");
  const [showNetlifyToken, setShowNetlifyToken] = useState(false);
  const [netlifyIsTesting, setNetlifyIsTesting] = useState(false);
  const [netlifyTestResult, setNetlifyTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [netlifyIsSaving, setNetlifyIsSaving] = useState(false);
  const [netlifySaveMessage, setNetlifySaveMessage] = useState<string | null>(null);

  // GitHub Form State
  const [githubTokenInput, setGithubTokenInput] = useState("");
  const [githubOwnerInput, setGithubOwnerInput] = useState("");
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [githubIsTesting, setGithubIsTesting] = useState(false);
  const [githubTestResult, setGithubTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [githubIsSaving, setGithubIsSaving] = useState(false);
  const [githubSaveMessage, setGithubSaveMessage] = useState<string | null>(null);

  // Status check for all hosting providers
  const loadHostingStatuses = useCallback(async () => {
    try {
      const res = await fetch("/api/hosting/status");
      const data = await res.json();
      if (data.success && data.providers) {
        setHostingStatuses(data.providers);
        if (data.providers.cloudflare?.connected) {
          setCfConnected(true);
          setCfMaskedToken(data.providers.cloudflare.maskedToken || "");
          setCfAccountName(data.providers.cloudflare.accountName || "Connected Cloudflare Account");
        } else {
          setCfConnected(false);
        }
      }
    } catch {
      // Fallback
    }
  }, []);

  // Cloudflare Status check fallback
  const loadCloudflareStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/cloudflare/status");
      const data = await res.json();
      if (data.connected) {
        setCfConnected(true);
        setCfMaskedToken(data.maskedToken || "");
        setCfAccountName(data.accountName || "Connected Cloudflare Account");
        setCfAccountInput(data.accountId || "");
        setCfAccountNameInput(data.accountName || "");
        setCfStatusError(null);
      } else {
        setCfConnected(false);
        setCfStatusError(data.error || null);
      }
    } catch {
      setCfConnected(false);
    }
  }, []);

  // Load all settings from localStorage
  const loadAllSettings = useCallback(() => {
    if (typeof window === "undefined") return;

    // Load keys & models per provider
    const keys: Record<string, string> = {};
    const models: Record<string, string> = {};
    const customs: Record<string, string> = {};
    const statuses: Record<string, "connected" | "not_connected" | "error"> = {};

    for (const p of PROVIDERS) {
      const storedKey = localStorage.getItem(`altofox_key_${p.id}`) || "";
      keys[p.id] = storedKey;

      const storedModel = localStorage.getItem(`altofox_model_${p.id}`) || p.defaultModel;
      const isPreset = p.popularModels.some((m) => m.id === storedModel);
      if (isPreset) {
        models[p.id] = storedModel;
        customs[p.id] = "";
      } else {
        models[p.id] = "__custom__";
        customs[p.id] = storedModel;
      }

      statuses[p.id] = storedKey ? "connected" : "not_connected";
    }

    // Load custom provider settings
    const storedCustomKey =
      localStorage.getItem("altofox_key_custom") || localStorage.getItem("ranklocal_key_custom") || "";
    const storedCustomBaseUrl =
      localStorage.getItem("altofox_base_url_custom") ||
      localStorage.getItem("ranklocal_base_url_custom") ||
      "https://example.com/v1";
    const storedCustomModel =
      localStorage.getItem("altofox_model_custom") ||
      localStorage.getItem("ranklocal_model_custom") ||
      "model-name";
    const storedCustomOrg =
      localStorage.getItem("altofox_org_id_custom") || localStorage.getItem("ranklocal_org_id_custom") || "";
    const storedCustomName =
      localStorage.getItem("altofox_provider_name_custom") ||
      localStorage.getItem("ranklocal_provider_name_custom") ||
      "My Custom AI";

    setCustomApiKey(storedCustomKey);
    setCustomBaseUrl(storedCustomBaseUrl);
    setCustomModelName(storedCustomModel);
    setCustomOrgId(storedCustomOrg);
    setCustomProviderName(storedCustomName);
    setIsEditingCustomKey(!storedCustomKey);

    if (storedCustomKey) {
      keys["custom"] = storedCustomKey;
      statuses["custom"] = "connected";
    }

    setSavedKeys(keys);
    setKeyInputs(keys);
    setSelectedModels(models);
    setCustomModelInputs(customs);
    setProviderStatuses(statuses);

    // Active default provider & model
    const storedActiveProvider =
      (localStorage.getItem("altofox_active_provider") as ProviderType) ||
      (localStorage.getItem("ranklocal_active_provider") as ProviderType) ||
      (storedCustomKey ? "custom" : "gemini");

    if (storedActiveProvider === "custom") {
      setProviderTypeMode("custom");
    }

    const rawActiveModel =
      localStorage.getItem("altofox_active_model") ||
      localStorage.getItem("ranklocal_active_model") ||
      (storedActiveProvider === "custom"
        ? storedCustomModel
        : keys[storedActiveProvider]
        ? localStorage.getItem(`altofox_model_${storedActiveProvider}`) || "gemini-3.8-flash"
        : "gemini-3.8-flash");

    const storedActiveModel = normalizeModelForProvider(storedActiveProvider, rawActiveModel);

    setDefaultProvider(storedActiveProvider);
    setDefaultModel(storedActiveModel);

    // Load image keys & settings
    const googleKey = localStorage.getItem("altofox_google_search_key") || "";
    const googleCx = localStorage.getItem("altofox_google_search_cx") || "";
    setSavedGoogleKey(googleKey);
    setGoogleKeyInput(googleKey);
    setSavedGoogleCx(googleCx);
    setGoogleCxInput(googleCx);
    setGoogleStatus(googleKey && googleCx ? "connected" : "not_connected");

    const pexelsKey = localStorage.getItem("altofox_pexels_key") || "";
    setSavedPexelsKey(pexelsKey);
    setPexelsKeyInput(pexelsKey);
    setPexelsStatus(pexelsKey ? "connected" : "not_connected");

    const pixabayKey = localStorage.getItem("altofox_pixabay_key") || "";
    setSavedPixabayKey(pixabayKey);
    setPixabayKeyInput(pixabayKey);
    setPixabayStatus(pixabayKey ? "connected" : "not_connected");

    const prefSource =
      (localStorage.getItem("altofox_image_preferred_source") as "bing" | "pexels" | "pixabay" | "google") || "bing";
    setPreferredImageSource(prefSource);

    // Load preferences
    setPrefCountry(localStorage.getItem("altofox_pref_country") || "United States");
    setPrefTheme(localStorage.getItem("altofox_pref_theme") || "modern-indigo");
    setPrefLanguage(localStorage.getItem("altofox_pref_language") || "English");
    setPrefQualityReview(localStorage.getItem("altofox_pref_quality_review") !== "false");

    const storedFallback = localStorage.getItem("altofox_smart_fallback");
    if (storedFallback !== null) {
      setSmartFallback(storedFallback === "true");
    }

    // Fetch server profiles to sync tested latencies and capabilities
    fetch("/api/keys")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.profiles)) {
          const latencies: Record<string, number> = {};
          const caps: Record<string, any> = {};
          const serverLiveModels: Record<string, string[]> = {};
          for (const prof of data.profiles) {
            const key =
              prof.presetId ||
              (prof.id.includes("gemini")
                ? "gemini"
                : prof.id.includes("openai")
                ? "openai"
                : prof.id.includes("anthropic")
                ? "anthropic"
                : prof.id.includes("deepseek")
                ? "deepseek"
                : prof.id.includes("groq")
                ? "groq"
                : prof.id.includes("openrouter")
                ? "openrouter"
                : "custom");
            if (prof.latencyMs) latencies[key] = prof.latencyMs;
            if (prof.capabilities) caps[key] = prof.capabilities;
            if (prof.availableModels && Array.isArray(prof.availableModels) && prof.availableModels.length > 0) {
              serverLiveModels[key] = prof.availableModels;
            }
          }
          setProviderLatencies((prev) => ({ ...prev, ...latencies }));
          setProviderCapabilities((prev) => ({ ...prev, ...caps }));
          setLiveProviderModels((prev) => ({ ...prev, ...serverLiveModels }));
          if (data.settings?.smartFallbackEnabled !== undefined) {
            setSmartFallback(data.settings.smartFallbackEnabled);
          }
        }
      })
      .catch(() => {});

    // Load Cloudflare & hosting status from server
    loadCloudflareStatus();
    loadHostingStatuses();
  }, [loadCloudflareStatus, loadHostingStatuses]);

  const handleTestCloudflare = async () => {
    setCfIsTesting(true);
    setCfTestResult(null);
    try {
      const payload: any = {};
      if (cfTokenInput.trim()) payload.apiToken = cfTokenInput.trim();
      if (cfAccountInput.trim()) payload.accountId = cfAccountInput.trim();

      const res = await fetch("/api/cloudflare/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.valid) {
        setCfTestResult({
          success: true,
          message: `Connection verified! Account: ${data.accountName || "Active"}`,
        });
      } else {
        setCfTestResult({
          success: false,
          message: data.error || "Connection test failed. Please verify token & account ID.",
        });
      }
    } catch (err: any) {
      setCfTestResult({
        success: false,
        message: err.message || "Network error testing Cloudflare connection.",
      });
    } finally {
      setCfIsTesting(false);
    }
  };

  const handleSaveCloudflare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cfTokenInput.trim() || !cfAccountInput.trim()) {
      setCfSaveMessage("Please enter both API Token and Account ID.");
      return;
    }

    setCfIsSaving(true);
    setCfSaveMessage(null);
    try {
      const res = await fetch("/api/cloudflare/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiToken: cfTokenInput.trim(),
          accountId: cfAccountInput.trim(),
          accountName: cfAccountNameInput.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCfConnected(true);
        setCfMaskedToken(data.maskedToken);
        setCfAccountName(data.accountName);
        setCfTokenInput("");
        setCfSaveMessage("Cloudflare credentials verified and securely saved!");
        onSettingsUpdated();
        setTimeout(() => setCfSaveMessage(null), 4000);
      } else {
        setCfSaveMessage(data.error || "Failed to save credentials.");
      }
    } catch (err: any) {
      setCfSaveMessage(err.message || "Network error saving credentials.");
    } finally {
      setCfIsSaving(false);
    }
  };

  const handleTestHostingProvider = async (provider: "vercel" | "netlify" | "github") => {
    const creds: any = { provider };
    if (provider === "vercel") {
      creds.apiToken = vercelTokenInput.trim();
      if (vercelTeamIdInput.trim()) creds.teamId = vercelTeamIdInput.trim();
      setVercelIsTesting(true);
      setVercelTestResult(null);
    } else if (provider === "netlify") {
      creds.apiToken = netlifyTokenInput.trim();
      setNetlifyIsTesting(true);
      setNetlifyTestResult(null);
    } else if (provider === "github") {
      creds.apiToken = githubTokenInput.trim();
      if (githubOwnerInput.trim()) creds.owner = githubOwnerInput.trim();
      setGithubIsTesting(true);
      setGithubTestResult(null);
    }

    try {
      const res = await fetch("/api/hosting/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creds),
      });
      const data = await res.json();
      const result = {
        success: Boolean(data.success),
        message: data.success ? (data.message || `Connected to ${provider}!`) : (data.error || "Connection failed."),
      };
      if (provider === "vercel") setVercelTestResult(result);
      if (provider === "netlify") setNetlifyTestResult(result);
      if (provider === "github") setGithubTestResult(result);
    } catch (err: any) {
      const result = { success: false, message: err.message || "Network error." };
      if (provider === "vercel") setVercelTestResult(result);
      if (provider === "netlify") setNetlifyTestResult(result);
      if (provider === "github") setGithubTestResult(result);
    } finally {
      if (provider === "vercel") setVercelIsTesting(false);
      if (provider === "netlify") setNetlifyIsTesting(false);
      if (provider === "github") setGithubIsTesting(false);
    }
  };

  const handleSaveHostingProvider = async (provider: "vercel" | "netlify" | "github", e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const creds: any = { provider };
    if (provider === "vercel") {
      if (!vercelTokenInput.trim()) {
        setVercelSaveMessage("Please enter your Vercel API token.");
        return;
      }
      creds.apiToken = vercelTokenInput.trim();
      if (vercelTeamIdInput.trim()) creds.teamId = vercelTeamIdInput.trim();
      setVercelIsSaving(true);
      setVercelSaveMessage(null);
    } else if (provider === "netlify") {
      if (!netlifyTokenInput.trim()) {
        setNetlifySaveMessage("Please enter your Netlify personal access token.");
        return;
      }
      creds.apiToken = netlifyTokenInput.trim();
      setNetlifyIsSaving(true);
      setNetlifySaveMessage(null);
    } else if (provider === "github") {
      if (!githubTokenInput.trim()) {
        setGithubSaveMessage("Please enter your GitHub personal access token.");
        return;
      }
      creds.apiToken = githubTokenInput.trim();
      if (githubOwnerInput.trim()) creds.owner = githubOwnerInput.trim();
      setGithubIsSaving(true);
      setGithubSaveMessage(null);
    }

    try {
      const res = await fetch("/api/hosting/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creds),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (provider === "vercel") {
          setVercelSaveMessage(`Vercel connected successfully! (${data.accountName || "Active"})`);
          setVercelTokenInput("");
        } else if (provider === "netlify") {
          setNetlifySaveMessage(`Netlify connected successfully! (${data.accountName || "Active"})`);
          setNetlifyTokenInput("");
        } else if (provider === "github") {
          setGithubSaveMessage(`GitHub connected successfully! (${data.accountName || "Active"})`);
          setGithubTokenInput("");
        }
        await loadHostingStatuses();
        onSettingsUpdated();
      } else {
        const errMsg = data.error || `Failed to save ${provider} credentials.`;
        if (provider === "vercel") setVercelSaveMessage(errMsg);
        if (provider === "netlify") setNetlifySaveMessage(errMsg);
        if (provider === "github") setGithubSaveMessage(errMsg);
      }
    } catch (err: any) {
      const errMsg = err.message || "Network error saving credentials.";
      if (provider === "vercel") setVercelSaveMessage(errMsg);
      if (provider === "netlify") setNetlifySaveMessage(errMsg);
      if (provider === "github") setGithubSaveMessage(errMsg);
    } finally {
      if (provider === "vercel") setVercelIsSaving(false);
      if (provider === "netlify") setNetlifyIsSaving(false);
      if (provider === "github") setGithubIsSaving(false);
    }
  };

  const handleToggleSmartFallback = async (enabled: boolean) => {
    setSmartFallback(enabled);
    localStorage.setItem("altofox_smart_fallback", String(enabled));
    try {
      await fetch("/api/keys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: { smartFallbackEnabled: enabled },
        }),
      });
    } catch (e) {
      console.warn("Failed to sync smart fallback setting:", e);
    }
  };

  const handleSelectCustomPreset = (presetKey: string) => {
    setCustomPreset(presetKey);
    const presets: Record<string, { name: string; baseUrl: string; model: string }> = {
      deepseek: {
        name: "DeepSeek",
        baseUrl: "https://api.deepseek.com/v1",
        model: "deepseek-chat",
      },
      groq: {
        name: "Groq",
        baseUrl: "https://api.groq.com/openai/v1",
        model: "llama-3.3-70b-versatile",
      },
      ollama: {
        name: "Ollama (Local)",
        baseUrl: "http://localhost:11434/v1",
        model: "llama3",
      },
      together: {
        name: "Together AI",
        baseUrl: "https://api.together.xyz/v1",
        model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
      },
      custom: {
        name: "My Custom AI",
        baseUrl: "https://example.com/v1",
        model: "model-name",
      },
    };
    const p = presets[presetKey];
    if (p) {
      setCustomProviderName(p.name);
      setCustomBaseUrl(p.baseUrl);
      setCustomModelName(p.model);
    }
  };

  // Sync initial tab when panel opens
  useEffect(() => {
    if (isOpen) {
      if (initialTab) setActiveTab(initialTab);
      loadAllSettings();
    }
  }, [isOpen, initialTab, loadAllSettings]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Connected providers list for Default AI dropdown
  const connectedProviders = useMemo(() => {
    const list: Array<{ id: ProviderType; name: string; defaultModel: string }> = PROVIDERS.filter(
      (p) => !!savedKeys[p.id]
    ).map((p) => ({
      id: p.id,
      name: p.name,
      defaultModel:
        selectedModels[p.id] === "__custom__"
          ? customModelInputs[p.id] || p.defaultModel
          : selectedModels[p.id] || p.defaultModel,
    }));

    if (savedKeys["custom"]) {
      list.push({
        id: "custom",
        name: customProviderName || "Custom OpenAI-compatible",
        defaultModel: customModelName || "custom-model",
      });
    }

    return list;
  }, [savedKeys, selectedModels, customModelInputs, customProviderName, customModelName]);

  // Save Default AI for generating
  const handleDefaultAIChange = (providerId: ProviderType) => {
    setDefaultProvider(providerId);
    let chosenModel = "";
    if (providerId === "custom") {
      chosenModel = customModelName || "custom-model";
    } else {
      chosenModel =
        selectedModels[providerId] === "__custom__"
          ? customModelInputs[providerId] || PROVIDERS.find((p) => p.id === providerId)?.defaultModel || ""
          : selectedModels[providerId] || PROVIDERS.find((p) => p.id === providerId)?.defaultModel || "";
    }

    setDefaultModel(chosenModel);

    localStorage.setItem("altofox_active_provider", providerId);
    localStorage.setItem("ranklocal_active_provider", providerId);
    localStorage.setItem("altofox_active_model", chosenModel);
    localStorage.setItem("ranklocal_active_model", chosenModel);
    onSettingsUpdated();
  };

  // Test Connection for a provider
  const handleTestConnection = async (providerId: ProviderType) => {
    const keyToTest = keyInputs[providerId]?.trim() || savedKeys[providerId];
    if (!keyToTest) {
      setTestResults((prev) => ({
        ...prev,
        [providerId]: { success: false, message: "Please enter an API key first." },
      }));
      setProviderStatuses((prev) => ({ ...prev, [providerId]: "error" }));
      return;
    }

    const modelToTest =
      selectedModels[providerId] === "__custom__"
        ? customModelInputs[providerId]?.trim() || "gpt-4o"
        : selectedModels[providerId];

    setTestingProvider(providerId);
    setTestResults((prev) => {
      const copy = { ...prev };
      delete copy[providerId];
      return copy;
    });

    try {
      const res = await fetch("/api/keys/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: providerId,
          apiKey: keyToTest,
          model: modelToTest,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setTestResults((prev) => ({
          ...prev,
          [providerId]: {
            success: true,
            message: data.message || "Connected successfully! Key is valid.",
          },
        }));
        setProviderStatuses((prev) => ({ ...prev, [providerId]: "connected" }));
        if (data.latencyMs !== undefined) {
          setProviderLatencies((prev) => ({ ...prev, [providerId]: data.latencyMs }));
        }
        if (data.capabilities) {
          setProviderCapabilities((prev) => ({ ...prev, [providerId]: data.capabilities }));
        }
        if (data.availableModels && Array.isArray(data.availableModels) && data.availableModels.length > 0) {
          setLiveProviderModels((prev) => ({ ...prev, [providerId]: data.availableModels }));
        }
      } else {
        setTestResults((prev) => ({
          ...prev,
          [providerId]: {
            success: false,
            message: data.message || "Connection failed. Please check key or permissions.",
          },
        }));
        setProviderStatuses((prev) => ({ ...prev, [providerId]: "error" }));
      }
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        [providerId]: {
          success: false,
          message: err instanceof Error ? err.message : "Network error testing connection.",
        },
      }));
      setProviderStatuses((prev) => ({ ...prev, [providerId]: "error" }));
    } finally {
      setTestingProvider(null);
    }
  };

  // Fetch Live Models from Provider API
  const handleFetchLiveModels = async (providerId: ProviderType) => {
    const rawKey = keyInputs[providerId]?.trim() || savedKeys[providerId];
    if (!rawKey) return;
    setIsFetchingModels((prev) => ({ ...prev, [providerId]: true }));
    try {
      const res = await fetch(`/api/keys/models?provider=${providerId}&apiKey=${encodeURIComponent(rawKey)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.models) && data.models.length > 0) {
        setLiveProviderModels((prev) => ({ ...prev, [providerId]: data.models }));
      }
    } catch (e) {
      console.warn("Failed to fetch live models for", providerId, e);
    } finally {
      setIsFetchingModels((prev) => ({ ...prev, [providerId]: false }));
    }
  };

  // Save Provider Key & Model
  const handleSaveProvider = async (providerId: ProviderType) => {
    const rawKey = keyInputs[providerId]?.trim() || savedKeys[providerId];
    if (!rawKey) {
      setTestResults((prev) => ({
        ...prev,
        [providerId]: { success: false, message: "Please enter an API key before saving." },
      }));
      return;
    }

    const effectiveModel =
      selectedModels[providerId] === "__custom__"
        ? customModelInputs[providerId]?.trim() || PROVIDERS.find((p) => p.id === providerId)?.defaultModel || ""
        : selectedModels[providerId] || PROVIDERS.find((p) => p.id === providerId)?.defaultModel || "";

    // Save to localStorage
    localStorage.setItem(`altofox_key_${providerId}`, rawKey);
    localStorage.setItem(`ranklocal_key_${providerId}`, rawKey);
    localStorage.setItem(`altofox_model_${providerId}`, effectiveModel);
    localStorage.setItem(`ranklocal_model_${providerId}`, effectiveModel);

    // Sync to backend DB so server generation has credentials and chosen model
    try {
      await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: providerId,
          apiKey: rawKey,
          defaultModel: effectiveModel,
        }),
      });
    } catch (e) {
      console.warn("Failed to sync key to server DB:", e);
    }

    // If no default provider was set or no key was connected, make this default
    const currentActive = localStorage.getItem("altofox_active_provider");
    const currentHasKey = currentActive && localStorage.getItem(`altofox_key_${currentActive}`);
    if (!currentHasKey) {
      localStorage.setItem("altofox_active_provider", providerId);
      localStorage.setItem("ranklocal_active_provider", providerId);
      localStorage.setItem("altofox_active_model", effectiveModel);
      localStorage.setItem("ranklocal_active_model", effectiveModel);
      setDefaultProvider(providerId);
      setDefaultModel(effectiveModel);
    } else if (currentActive === providerId) {
      localStorage.setItem("altofox_active_model", effectiveModel);
      localStorage.setItem("ranklocal_active_model", effectiveModel);
      setDefaultModel(effectiveModel);
    }

    setSavedKeys((prev) => ({ ...prev, [providerId]: rawKey }));
    setIsEditingKey((prev) => ({ ...prev, [providerId]: false }));
    setProviderStatuses((prev) => ({ ...prev, [providerId]: "connected" }));
    setTestResults((prev) => ({
      ...prev,
      [providerId]: { success: true, message: "Saved and synchronized successfully!" },
    }));

    onSettingsUpdated();
  };

  // Remove Provider Key
  const handleRemoveProvider = (providerId: ProviderType) => {
    localStorage.removeItem(`altofox_key_${providerId}`);
    localStorage.removeItem(`altofox_model_${providerId}`);

    setSavedKeys((prev) => {
      const copy = { ...prev };
      delete copy[providerId];
      return copy;
    });
    setKeyInputs((prev) => ({ ...prev, [providerId]: "" }));
    setIsEditingKey((prev) => ({ ...prev, [providerId]: false }));
    setProviderStatuses((prev) => ({ ...prev, [providerId]: "not_connected" }));
    setTestResults((prev) => {
      const copy = { ...prev };
      delete copy[providerId];
      return copy;
    });

    // If removing the active provider, re-evaluate default provider
    const remaining = PROVIDERS.filter((p) => p.id !== providerId && localStorage.getItem(`altofox_key_${p.id}`));
    if (defaultProvider === providerId) {
      if (remaining.length > 0) {
        const nextProvider = remaining[0].id;
        const nextModel = localStorage.getItem(`altofox_model_${nextProvider}`) || remaining[0].defaultModel;
        localStorage.setItem("altofox_active_provider", nextProvider);
        localStorage.setItem("altofox_active_model", nextModel);
        setDefaultProvider(nextProvider);
        setDefaultModel(nextModel);
      } else {
        localStorage.removeItem("altofox_active_provider");
        localStorage.removeItem("altofox_active_model");
      }
    }

    onSettingsUpdated();
  };

  // Test Custom OpenAI-compatible Connection
  const handleTestCustomConnection = async () => {
    const keyToTest = customApiKey.trim() || savedKeys["custom"];
    if (!keyToTest) {
      setCustomTestResult({ success: false, message: "Please enter an API key first." });
      return;
    }
    if (!customBaseUrl.trim()) {
      setCustomTestResult({ success: false, message: "Please enter an API Base URL." });
      return;
    }
    if (!customModelName.trim()) {
      setCustomTestResult({ success: false, message: "Please enter a Model name." });
      return;
    }

    setIsTestingCustom(true);
    setCustomTestResult(null);

    try {
      const res = await fetch("/api/keys/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "custom",
          apiKey: keyToTest,
          baseUrl: customBaseUrl.trim(),
          model: customModelName.trim(),
          organizationId: customOrgId.trim() || undefined,
          providerName: customProviderName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCustomTestResult({
          success: true,
          message: data.message || "Connected successfully! Key and model are valid.",
          latencyMs: data.latencyMs,
        });
        setProviderStatuses((prev) => ({ ...prev, custom: "connected" }));
        if (data.latencyMs !== undefined) {
          setProviderLatencies((prev) => ({ ...prev, custom: data.latencyMs }));
        }
        if (data.capabilities) {
          setProviderCapabilities((prev) => ({ ...prev, custom: data.capabilities }));
        }
      } else {
        setCustomTestResult({
          success: false,
          message: data.message || "Connection failed. Please verify endpoint, key, or model.",
          latencyMs: data.latencyMs,
        });
        setProviderStatuses((prev) => ({ ...prev, custom: "error" }));
      }
    } catch (err) {
      setCustomTestResult({
        success: false,
        message: err instanceof Error ? err.message : "Network error testing connection.",
      });
      setProviderStatuses((prev) => ({ ...prev, custom: "error" }));
    } finally {
      setIsTestingCustom(false);
    }
  };

  // Save Custom OpenAI-compatible Provider
  const handleSaveCustomProvider = async () => {
    const rawKey = customApiKey.trim() || savedKeys["custom"];
    if (!rawKey) {
      setCustomTestResult({ success: false, message: "Please enter an API key before saving." });
      return;
    }
    if (!customBaseUrl.trim()) {
      setCustomTestResult({ success: false, message: "Please enter an API Base URL before saving." });
      return;
    }
    if (!customModelName.trim()) {
      setCustomTestResult({ success: false, message: "Please enter a Model name before saving." });
      return;
    }

    const trimmedBaseUrl = customBaseUrl.trim();
    const trimmedModel = customModelName.trim();
    const trimmedOrgId = customOrgId.trim();
    const trimmedName = customProviderName.trim() || "My Custom AI";

    localStorage.setItem("altofox_key_custom", rawKey);
    localStorage.setItem("ranklocal_key_custom", rawKey);
    localStorage.setItem("altofox_base_url_custom", trimmedBaseUrl);
    localStorage.setItem("ranklocal_base_url_custom", trimmedBaseUrl);
    localStorage.setItem("altofox_model_custom", trimmedModel);
    localStorage.setItem("ranklocal_model_custom", trimmedModel);
    localStorage.setItem("altofox_org_id_custom", trimmedOrgId);
    localStorage.setItem("ranklocal_org_id_custom", trimmedOrgId);
    localStorage.setItem("altofox_provider_name_custom", trimmedName);
    localStorage.setItem("ranklocal_provider_name_custom", trimmedName);

    try {
      await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "custom",
          apiKey: rawKey,
          baseUrl: trimmedBaseUrl,
          defaultModel: trimmedModel,
          organizationId: trimmedOrgId || undefined,
          providerName: trimmedName,
        }),
      });
    } catch (e) {
      console.warn("Failed to sync custom key to server DB:", e);
    }

    // Set as active default provider
    localStorage.setItem("altofox_active_provider", "custom");
    localStorage.setItem("ranklocal_active_provider", "custom");
    localStorage.setItem("altofox_active_model", trimmedModel);
    localStorage.setItem("ranklocal_active_model", trimmedModel);

    setDefaultProvider("custom");
    setDefaultModel(trimmedModel);
    setSavedKeys((prev) => ({ ...prev, custom: rawKey }));
    setIsEditingCustomKey(false);
    setProviderStatuses((prev) => ({ ...prev, custom: "connected" }));
    setCustomTestResult({
      success: true,
      message: "Custom provider saved and set as default AI!",
    });

    onSettingsUpdated();
  };

  // Remove Custom Provider Key
  const handleRemoveCustomProvider = async () => {
    localStorage.removeItem("altofox_key_custom");
    localStorage.removeItem("ranklocal_key_custom");
    localStorage.removeItem("altofox_base_url_custom");
    localStorage.removeItem("ranklocal_base_url_custom");
    localStorage.removeItem("altofox_model_custom");
    localStorage.removeItem("ranklocal_model_custom");
    localStorage.removeItem("altofox_org_id_custom");
    localStorage.removeItem("ranklocal_org_id_custom");
    localStorage.removeItem("altofox_provider_name_custom");
    localStorage.removeItem("ranklocal_provider_name_custom");

    try {
      await fetch("/api/keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "custom" }),
      });
    } catch (e) {
      console.warn("Failed to delete custom key from server DB:", e);
    }

    setSavedKeys((prev) => {
      const copy = { ...prev };
      delete copy["custom"];
      return copy;
    });
    setCustomApiKey("");
    setIsEditingCustomKey(true);
    setProviderStatuses((prev) => ({ ...prev, custom: "not_connected" }));
    setCustomTestResult(null);

    if (defaultProvider === "custom") {
      const remaining = PROVIDERS.filter((p) => localStorage.getItem(`altofox_key_${p.id}`));
      if (remaining.length > 0) {
        const nextProvider = remaining[0].id;
        const nextModel = localStorage.getItem(`altofox_model_${nextProvider}`) || remaining[0].defaultModel;
        localStorage.setItem("altofox_active_provider", nextProvider);
        localStorage.setItem("ranklocal_active_provider", nextProvider);
        localStorage.setItem("altofox_active_model", nextModel);
        localStorage.setItem("ranklocal_active_model", nextModel);
        setDefaultProvider(nextProvider);
        setDefaultModel(nextModel);
      } else {
        localStorage.removeItem("altofox_active_provider");
        localStorage.removeItem("ranklocal_active_provider");
        localStorage.removeItem("altofox_active_model");
        localStorage.removeItem("ranklocal_active_model");
        setDefaultProvider("gemini");
        setDefaultModel("gemini-1.5-pro");
      }
    }

    onSettingsUpdated();
  };

  // Test Image Source API Key
  const handleTestImageKey = async (source: "bing" | "pexels" | "pixabay" | "google") => {
    if (source === "bing") {
      setTestingImageSource("bing");
      setImageTestResults((prev) => ({ ...prev, bing: null }));
      try {
        const res = await fetch("/api/images/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source: "bing" }),
        });
        const data = await res.json();
        setImageTestResults((prev) => ({
          ...prev,
          bing: { success: data.success, message: data.message || "Bing Free Image CDN is active and ready." },
        }));
      } catch (err) {
        setImageTestResults((prev) => ({
          ...prev,
          bing: {
            success: false,
            message: err instanceof Error ? err.message : "Network error testing Bing CDN.",
          },
        }));
      } finally {
        setTestingImageSource(null);
      }
      return;
    }

    if (source === "google") {
      const rawKey = googleKeyInput.trim() || savedGoogleKey;
      const rawCx = googleCxInput.trim() || savedGoogleCx;
      if (!rawKey || !rawCx) {
        setImageTestResults((prev) => ({
          ...prev,
          google: { success: false, message: "Please enter both Google API Key and Search Engine ID (CX)." },
        }));
        setGoogleStatus("error");
        return;
      }
      setTestingImageSource("google");
      setImageTestResults((prev) => ({ ...prev, google: null }));
      try {
        const res = await fetch("/api/images/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source: "google", apiKey: rawKey, cx: rawCx }),
        });
        const data = await res.json();
        if (data.success) {
          setImageTestResults((prev) => ({
            ...prev,
            google: { success: true, message: data.message || "Connected to Google Image Search API!" },
          }));
          setGoogleStatus("connected");
        } else {
          setImageTestResults((prev) => ({
            ...prev,
            google: { success: false, message: data.message || "Google test failed." },
          }));
          setGoogleStatus("error");
        }
      } catch (err) {
        setImageTestResults((prev) => ({
          ...prev,
          google: { success: false, message: err instanceof Error ? err.message : "Network error testing Google API." },
        }));
        setGoogleStatus("error");
      } finally {
        setTestingImageSource(null);
      }
      return;
    }

    const rawKey =
      source === "pexels"
        ? pexelsKeyInput.trim() || savedPexelsKey
        : pixabayKeyInput.trim() || savedPixabayKey;
    if (!rawKey) {
      setImageTestResults((prev) => ({
        ...prev,
        [source]: { success: false, message: "Please enter an API key first." },
      }));
      if (source === "pexels") setPexelsStatus("error");
      else setPixabayStatus("error");
      return;
    }

    setTestingImageSource(source);
    setImageTestResults((prev) => ({ ...prev, [source]: null }));

    try {
      const res = await fetch("/api/images/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, apiKey: rawKey }),
      });
      const data = await res.json();
      if (data.success) {
        setImageTestResults((prev) => ({
          ...prev,
          [source]: { success: true, message: data.message || "Key validated successfully!" },
        }));
        if (source === "pexels") setPexelsStatus("connected");
        else setPixabayStatus("connected");
      } else {
        setImageTestResults((prev) => ({
          ...prev,
          [source]: {
            success: false,
            message: data.message || "Connection failed. Please check your key.",
          },
        }));
        if (source === "pexels") setPexelsStatus("error");
        else setPixabayStatus("error");
      }
    } catch (err) {
      setImageTestResults((prev) => ({
        ...prev,
        [source]: {
          success: false,
          message: err instanceof Error ? err.message : "Network error testing key.",
        },
      }));
      if (source === "pexels") setPexelsStatus("error");
      else setPixabayStatus("error");
    } finally {
      setTestingImageSource(null);
    }
  };

  // Save Image Key
  const handleSaveImageKey = (source: "pexels" | "pixabay" | "google") => {
    if (source === "google") {
      const key = googleKeyInput.trim() || savedGoogleKey;
      const cx = googleCxInput.trim() || savedGoogleCx;
      if (!key || !cx) {
        setImageTestResults((prev) => ({
          ...prev,
          google: { success: false, message: "Please enter both Google API Key and Search Engine ID (CX) before saving." },
        }));
        return;
      }
      localStorage.setItem("altofox_google_search_key", key);
      localStorage.setItem("altofox_google_search_cx", cx);
      setSavedGoogleKey(key);
      setSavedGoogleCx(cx);
      setGoogleStatus("connected");
      setIsEditingGoogleKey(false);
      setImageTestResults((prev) => ({
        ...prev,
        google: { success: true, message: "Google Image credentials saved in localStorage." },
      }));
      onSettingsUpdated();
      return;
    }

    const key =
      source === "pexels"
        ? pexelsKeyInput.trim() || savedPexelsKey
        : pixabayKeyInput.trim() || savedPixabayKey;
    if (!key) {
      setImageTestResults((prev) => ({
        ...prev,
        [source]: { success: false, message: "Please enter an API key before saving." },
      }));
      return;
    }

    if (source === "pexels") {
      localStorage.setItem("altofox_pexels_key", key);
      setSavedPexelsKey(key);
      setPexelsStatus("connected");
      setIsEditingPexelsKey(false);
    } else {
      localStorage.setItem("altofox_pixabay_key", key);
      setSavedPixabayKey(key);
      setPixabayStatus("connected");
      setIsEditingPixabayKey(false);
    }

    setImageTestResults((prev) => ({
      ...prev,
      [source]: { success: true, message: "API key saved in localStorage." },
    }));

    onSettingsUpdated();
  };

  // Remove Image Key
  const handleRemoveImageKey = (source: "pexels" | "pixabay" | "google") => {
    if (source === "google") {
      localStorage.removeItem("altofox_google_search_key");
      localStorage.removeItem("altofox_google_search_cx");
      setSavedGoogleKey("");
      setGoogleKeyInput("");
      setSavedGoogleCx("");
      setGoogleCxInput("");
      setGoogleStatus("not_connected");
      setIsEditingGoogleKey(false);
    } else if (source === "pexels") {
      localStorage.removeItem("altofox_pexels_key");
      setSavedPexelsKey("");
      setPexelsKeyInput("");
      setPexelsStatus("not_connected");
      setIsEditingPexelsKey(false);
    } else {
      localStorage.removeItem("altofox_pixabay_key");
      setSavedPixabayKey("");
      setPixabayKeyInput("");
      setPixabayStatus("not_connected");
      setIsEditingPixabayKey(false);
    }

    setImageTestResults((prev) => ({
      ...prev,
      [source]: { success: true, message: "API key removed from localStorage." },
    }));

    onSettingsUpdated();
  };

  // Preferred Source Change
  const handlePreferredImageSourceChange = (pref: "bing" | "pexels" | "pixabay" | "google") => {
    setPreferredImageSource(pref);
    localStorage.setItem("altofox_image_preferred_source", pref);
    onSettingsUpdated();
  };

  // Save Preferences
  const handleSavePreferences = () => {
    localStorage.setItem("altofox_pref_country", prefCountry);
    localStorage.setItem("altofox_pref_theme", prefTheme);
    localStorage.setItem("altofox_pref_language", prefLanguage);
    localStorage.setItem("altofox_pref_quality_review", String(prefQualityReview));

    setPrefSavedMessage(true);
    setTimeout(() => setPrefSavedMessage(false), 2500);

    onSettingsUpdated();
  };

  // Clear All Saved Data
  const handleClearAllData = () => {
    // Clear all localStorage keys belonging to RankLocal and legacy AltoFox
    const keysToRemove = [
      "ranklocal_builder_state",
      "ranklocal_active_provider",
      "ranklocal_active_model",
      "ranklocal_pref_country",
      "ranklocal_pref_theme",
      "ranklocal_pref_language",
      "ranklocal_pref_quality_review",
      "ranklocal_key_gemini",
      "ranklocal_key_openai",
      "ranklocal_key_openrouter",
      "ranklocal_key_custom",
      "ranklocal_model_gemini",
      "ranklocal_model_openai",
      "ranklocal_model_openrouter",
      "ranklocal_model_custom",
      "ranklocal_pexels_key",
      "ranklocal_pixabay_key",
      "ranklocal_google_search_key",
      "ranklocal_google_search_cx",
      "ranklocal_image_preferred_source",
      "ranklocal_dark_mode",
      // Legacy AltoFox keys
      "altofox_builder_state",
      "altofox_active_provider",
      "altofox_active_model",
      "altofox_pref_country",
      "altofox_pref_theme",
      "altofox_pref_language",
      "altofox_pref_quality_review",
      "altofox_key_gemini",
      "altofox_key_openai",
      "altofox_key_openrouter",
      "altofox_key_custom",
      "altofox_model_gemini",
      "altofox_model_openai",
      "altofox_model_openrouter",
      "altofox_model_custom",
      "altofox_pexels_key",
      "altofox_pixabay_key",
      "altofox_google_search_key",
      "altofox_google_search_cx",
      "altofox_image_preferred_source",
      "altofox_dark_mode",
    ];

    keysToRemove.forEach((k) => localStorage.removeItem(k));

    setShowClearConfirm(false);
    loadAllSettings();
    onClearAllData?.();
    onSettingsUpdated();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dark Overlay Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-In Panel from Right */}
      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div className="w-screen sm:w-[480px] max-w-full bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300 border-l border-[#E2E8F0]">
          {/* Panel Header */}
          <div className="p-4 sm:p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-slate-50/60">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#4F46E5]" />
                <span>Settings</span>
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Configure your AI models, API keys, and website defaults
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-[8px] text-[#64748B] hover:text-[#0F172A] hover:bg-slate-200/60 transition"
              aria-label="Close settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Initial Alert Message if triggered by builder action */}
          {initialMessage && (
            <div className="mx-4 sm:mx-5 mt-4 p-3 rounded-[10px] bg-amber-50 border border-amber-200 flex items-start space-x-2.5 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{initialMessage}</div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="px-4 sm:px-5 pt-3 pb-0 border-b border-[#E2E8F0] bg-white">
            <div className="flex space-x-1">
              <button
                type="button"
                onClick={() => setActiveTab("models")}
                className={`flex-1 py-2.5 px-2.5 text-xs sm:text-sm font-semibold rounded-t-[8px] flex items-center justify-center space-x-1.5 border-b-2 transition ${
                  activeTab === "models"
                    ? "border-[#4F46E5] text-[#4F46E5] bg-[#EEF2FF]/40"
                    : "border-transparent text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50"
                }`}
              >
                <Cpu className="w-4 h-4" />
                <span>AI Models</span>
                {connectedProviders.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("images")}
                className={`flex-1 py-2.5 px-2.5 text-xs sm:text-sm font-semibold rounded-t-[8px] flex items-center justify-center space-x-1.5 border-b-2 transition ${
                  activeTab === "images"
                    ? "border-[#4F46E5] text-[#4F46E5] bg-[#EEF2FF]/40"
                    : "border-transparent text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50"
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Image Sources</span>
                {(pexelsStatus === "connected" || pixabayStatus === "connected") && (
                  <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("preferences")}
                className={`flex-1 py-2.5 px-2.5 text-xs sm:text-sm font-semibold rounded-t-[8px] flex items-center justify-center space-x-1.5 border-b-2 transition ${
                  activeTab === "preferences"
                    ? "border-[#4F46E5] text-[#4F46E5] bg-[#EEF2FF]/40"
                    : "border-transparent text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50"
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>Preferences</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("hosting")}
                className={`flex-1 py-2.5 px-2.5 text-xs sm:text-sm font-semibold rounded-t-[8px] flex items-center justify-center space-x-1.5 border-b-2 transition ${
                  activeTab === "hosting" || activeTab === "cloudflare"
                    ? "border-[#4F46E5] text-[#4F46E5] bg-[#EEF2FF]/40"
                    : "border-transparent text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50"
                }`}
              >
                <Cloud className="w-4 h-4 text-indigo-600" />
                <span>Hosting</span>
                {(cfConnected || Object.values(hostingStatuses).some((s) => s.connected)) && (
                  <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                )}
              </button>
            </div>
          </div>

          {/* Panel Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
            {/* ================= TAB 1: AI MODELS ================= */}
            {activeTab === "models" && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* Default AI for generating Selector & Smart Fallback */}
                <div className="bg-[#EEF2FF]/60 border border-[#C7D2FE] rounded-[12px] p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
                      <span>Default AI for generating:</span>
                    </span>
                    {connectedProviders.length > 0 ? (
                      <span className="text-[10px] font-semibold text-[#10B981] bg-[#ECFDF5] px-2 py-0.5 rounded-full border border-[#A7F3D0]">
                        ● Active
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        ● None connected
                      </span>
                    )}
                  </div>

                  {connectedProviders.length > 0 ? (
                    <div className="space-y-1">
                      <select
                        value={defaultProvider}
                        onChange={(e) => handleDefaultAIChange(e.target.value as ProviderType)}
                        className="input-base text-xs font-semibold"
                      >
                        {connectedProviders.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.defaultModel})
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-[#64748B]">
                        This model builds and optimizes your static website during generation and SEO audits.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-[#64748B]">
                      No AI model connected yet. Add your API key to one of the providers below to get started.
                    </p>
                  )}

                  {/* Smart Fallback Toggle */}
                  <div className="pt-2 border-t border-[#C7D2FE]/70 flex items-center justify-between">
                    <div className="space-y-0.5 pr-2">
                      <div className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span>Smart Multi-Provider Fallback</span>
                      </div>
                      <p className="text-[10px] text-[#64748B]">
                        Automatically failover to secondary connected providers if your primary model hits rate limits, timeouts, or temporary outages.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleSmartFallback(!smartFallback)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        smartFallback ? "bg-[#4F46E5]" : "bg-slate-300"
                      }`}
                      aria-label="Toggle Smart Fallback"
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          smartFallback ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Local Storage Privacy Note */}
                <div className="flex items-center space-x-2 text-[11px] text-[#64748B] bg-slate-50 p-2.5 rounded-[10px] border border-[#E2E8F0]">
                  <Lock className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                  <span>
                    Your keys are stored only in this browser (localStorage). They are never saved to external servers.
                  </span>
                </div>

                {/* Provider Type Toggle: Existing vs Custom OpenAI-compatible */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#0F172A]">
                    Provider Type
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-[10px] border border-[#E2E8F0]">
                    <button
                      type="button"
                      onClick={() => setProviderTypeMode("existing")}
                      className={`py-2 px-3 text-xs font-semibold rounded-[8px] transition flex items-center justify-center space-x-1.5 ${
                        providerTypeMode === "existing"
                          ? "bg-white text-[#0F172A] shadow-xs"
                          : "text-[#64748B] hover:text-[#0F172A]"
                      }`}
                    >
                      <Cpu className="w-3.5 h-3.5" />
                      <span>Existing Providers</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProviderTypeMode("custom")}
                      className={`py-2 px-3 text-xs font-semibold rounded-[8px] transition flex items-center justify-center space-x-1.5 ${
                        providerTypeMode === "custom"
                          ? "bg-white text-[#4F46E5] shadow-xs"
                          : "text-[#64748B] hover:text-[#0F172A]"
                      }`}
                    >
                      <Server className="w-3.5 h-3.5" />
                      <span>Custom OpenAI-compatible</span>
                      {savedKeys["custom"] && (
                        <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                      )}
                    </button>
                  </div>
                </div>

                {providerTypeMode === "existing" ? (
                  /* Provider Cards List */
                  <div className="space-y-4">
                    {PROVIDERS.map((provider) => {
                      const isConnected = !!savedKeys[provider.id];
                      const status = providerStatuses[provider.id] || (isConnected ? "connected" : "not_connected");
                      const isEditing = isEditingKey[provider.id];
                      const rawKey = keyInputs[provider.id] || "";
                      const isTesting = testingProvider === provider.id;
                      const testResult = testResults[provider.id];
                      const selectedModelVal = selectedModels[provider.id] || provider.defaultModel;
                      const isCustomModel = selectedModelVal === "__custom__";

                      return (
                        <div
                          key={provider.id}
                          className={`rounded-[12px] border transition overflow-hidden ${
                            isConnected
                              ? "bg-white border-[#CBD5E1] shadow-xs"
                              : "bg-white border-[#E2E8F0]"
                          }`}
                        >
                          {/* Provider Header */}
                          <div className="p-3.5 sm:p-4 bg-slate-50/70 border-b border-[#E2E8F0] flex items-center justify-between">
                            <div className="flex items-center space-x-2.5">
                              {provider.icon}
                              <div>
                                <h3 className="text-xs sm:text-sm font-bold text-[#0F172A]">
                                  {provider.name}
                                </h3>
                                <a
                                  href={provider.docsUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] text-[#4F46E5] hover:underline inline-flex items-center space-x-1"
                                >
                                  <span>Where do I get an API key?</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              </div>
                            </div>

                            {/* Badges: Active, Latency, Status */}
                            <div className="flex items-center space-x-1.5">
                              {defaultProvider === provider.id && isConnected && (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]">
                                  <span>★ Active</span>
                                </span>
                              )}
                              {providerLatencies[provider.id] !== undefined && status === "connected" && (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                  <span>⚡ {providerLatencies[provider.id]}ms</span>
                                </span>
                              )}
                              {status === "connected" && (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                                  <span>Connected</span>
                                </span>
                              )}
                              {status === "not_connected" && (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                  <span>Not connected</span>
                                </span>
                              )}
                              {status === "error" && (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  <span>Error</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Provider Body */}
                          <div className="p-3.5 sm:p-4 space-y-3">
                            {/* API Key Field */}
                            <div>
                              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                                API Key
                              </label>

                              {isConnected && !isEditing ? (
                                <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-[#E2E8F0] rounded-[10px]">
                                  <span className="font-mono text-xs text-[#0F172A]">
                                    {maskApiKey(savedKeys[provider.id])}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsEditingKey((prev) => ({ ...prev, [provider.id]: true }));
                                      setKeyInputs((prev) => ({ ...prev, [provider.id]: savedKeys[provider.id] }));
                                    }}
                                    className="text-xs font-semibold text-[#4F46E5] hover:underline flex items-center space-x-1"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                    <span>Change</span>
                                  </button>
                                </div>
                              ) : (
                                <div className="relative">
                                  <input
                                    type={showKeys[provider.id] ? "text" : "password"}
                                    value={rawKey}
                                    onChange={(e) =>
                                      setKeyInputs((prev) => ({ ...prev, [provider.id]: e.target.value }))
                                    }
                                    placeholder={provider.placeholderKey}
                                    className="input-base pr-10 font-mono text-xs"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowKeys((prev) => ({ ...prev, [provider.id]: !prev[provider.id] }))
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A]"
                                    aria-label="Toggle password visibility"
                                  >
                                    {showKeys[provider.id] ? (
                                      <EyeOff className="w-4 h-4" />
                                    ) : (
                                      <Eye className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Model Field */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-semibold text-[#0F172A]">
                                  Model
                                </label>
                                {isConnected && (
                                  <button
                                    type="button"
                                    onClick={() => handleFetchLiveModels(provider.id)}
                                    disabled={isFetchingModels[provider.id]}
                                    className="text-[11px] text-[#4F46E5] hover:underline inline-flex items-center space-x-1 disabled:opacity-50"
                                  >
                                    {isFetchingModels[provider.id] ? (
                                      <>
                                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                        <span>Fetching live models...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Sparkles className="w-2.5 h-2.5" />
                                        <span>Discover live models</span>
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                              <select
                                value={selectedModelVal}
                                onChange={(e) =>
                                  setSelectedModels((prev) => ({ ...prev, [provider.id]: e.target.value }))
                                }
                                className="input-base text-xs"
                              >
                                <optgroup label="Recommended Models">
                                  {provider.popularModels.map((m) => (
                                    <option key={m.id} value={m.id}>
                                      {m.label}
                                    </option>
                                  ))}
                                </optgroup>
                                {liveProviderModels[provider.id] && liveProviderModels[provider.id].length > 0 && (
                                  <optgroup label={`Discovered Live API Models (${liveProviderModels[provider.id].length})`}>
                                    {liveProviderModels[provider.id]
                                      .filter((m) => !provider.popularModels.some((pop) => pop.id === m))
                                      .map((m) => (
                                        <option key={m} value={m}>
                                          {m}
                                        </option>
                                      ))}
                                  </optgroup>
                                )}
                                {selectedModelVal &&
                                  selectedModelVal !== "__custom__" &&
                                  !provider.popularModels.some((pop) => pop.id === selectedModelVal) &&
                                  (!liveProviderModels[provider.id] || !liveProviderModels[provider.id].includes(selectedModelVal)) && (
                                    <optgroup label="Active Custom Model">
                                      <option value={selectedModelVal}>{selectedModelVal}</option>
                                    </optgroup>
                                  )}
                                <optgroup label="Custom">
                                  <option value="__custom__">Custom model name...</option>
                                </optgroup>
                              </select>

                              {/* Custom Model Input if Selected */}
                              {isCustomModel && (
                                <div className="mt-2">
                                  <input
                                    type="text"
                                    value={customModelInputs[provider.id] || ""}
                                    onChange={(e) =>
                                      setCustomModelInputs((prev) => ({
                                        ...prev,
                                        [provider.id]: e.target.value,
                                      }))
                                    }
                                    placeholder={provider.defaultModel}
                                    className="input-base text-xs font-mono"
                                  />
                                  <span className="text-[10px] text-[#64748B] mt-0.5 block">
                                    Enter any valid model ID supported by {provider.name} (e.g. {provider.defaultModel}).
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Capabilities Pill Badges */}
                            {providerCapabilities[provider.id] && (
                              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                <span className="text-[10px] text-[#64748B] font-semibold">Capabilities:</span>
                                {providerCapabilities[provider.id].chatCompletion && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Chat ✓
                                  </span>
                                )}
                                {providerCapabilities[provider.id].structuredJson && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                    Structured JSON ✓
                                  </span>
                                )}
                                {providerCapabilities[provider.id].systemInstructions && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                    System Instructions ✓
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Inline Test Result Message */}
                            {testResult && (
                              <div
                                className={`p-2.5 rounded-[8px] text-xs flex items-start space-x-2 ${
                                  testResult.success
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                    : "bg-rose-50 text-rose-800 border border-rose-200"
                                }`}
                              >
                                {testResult.success ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                )}
                                <span className="flex-1 break-words">{testResult.message}</span>
                              </div>
                            )}

                            {/* Action Buttons: Test, Save, Use as Active, Remove */}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleTestConnection(provider.id)}
                                disabled={isTesting}
                                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-[8px] border border-[#CBD5E1] bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A] transition disabled:opacity-50"
                              >
                                {isTesting ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Testing...</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
                                    <span>Test connection</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSaveProvider(provider.id)}
                                className="inline-flex items-center space-x-1 px-3.5 py-1.5 rounded-[8px] bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold transition shadow-2xs"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Save</span>
                              </button>

                              {isConnected && defaultProvider !== provider.id && (
                                <button
                                  type="button"
                                  onClick={() => handleDefaultAIChange(provider.id)}
                                  className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-[8px] bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-xs font-semibold transition"
                                >
                                  <Check className="w-3.5 h-3.5 text-[#4F46E5]" />
                                  <span>Use as Active</span>
                                </button>
                              )}

                              {isConnected && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveProvider(provider.id)}
                                  className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-[8px] text-xs font-semibold text-rose-600 hover:bg-rose-50 transition ml-auto"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Remove</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Custom OpenAI-Compatible Card */
                  <div className="rounded-[12px] border bg-white border-[#CBD5E1] shadow-xs overflow-hidden">
                    {/* Header */}
                    <div className="p-3.5 sm:p-4 bg-slate-50/70 border-b border-[#E2E8F0] flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-[8px] bg-slate-800 text-white flex items-center justify-center shadow-xs">
                          <Server className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs sm:text-sm font-bold text-[#0F172A]">
                            Custom OpenAI-compatible
                          </h3>
                          <p className="text-[11px] text-[#64748B]">
                            Connect DeepSeek, Groq, Ollama, Together AI, or any custom endpoint
                          </p>
                        </div>
                      </div>

                      {/* Status & Latency Badges */}
                      <div className="flex items-center space-x-1.5">
                        {defaultProvider === "custom" && savedKeys["custom"] && (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]">
                            <span>★ Active</span>
                          </span>
                        )}
                        {providerLatencies["custom"] !== undefined && (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <span>⚡ {providerLatencies["custom"]}ms</span>
                          </span>
                        )}
                        {savedKeys["custom"] ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                            <span>Connected</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            <span>Not connected</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-3.5 sm:p-4 space-y-3.5">
                      {/* Quick Presets */}
                      <div className="space-y-1.5 pb-1">
                        <label className="block text-xs font-semibold text-[#0F172A]">
                          Quick Fill Preset
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { id: "deepseek", label: "DeepSeek" },
                            { id: "groq", label: "Groq" },
                            { id: "ollama", label: "Ollama (Local)" },
                            { id: "together", label: "Together AI" },
                            { id: "custom", label: "Custom" },
                          ].map((tmpl) => (
                            <button
                              key={tmpl.id}
                              type="button"
                              onClick={() => handleSelectCustomPreset(tmpl.id)}
                              className={`px-2.5 py-1 text-[11px] font-semibold rounded-[6px] transition border ${
                                customPreset === tmpl.id
                                  ? "bg-[#EEF2FF] text-[#4F46E5] border-[#C7D2FE]"
                                  : "bg-white text-slate-600 border-[#E2E8F0] hover:bg-slate-50"
                              }`}
                            >
                              {tmpl.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Provider Name */}
                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                          Provider Name
                        </label>
                        <input
                          type="text"
                          value={customProviderName}
                          onChange={(e) => setCustomProviderName(e.target.value)}
                          placeholder="My Custom AI"
                          className="input-base text-xs"
                        />
                        <span className="text-[10px] text-[#64748B] mt-0.5 block">
                          Display name for your custom provider (e.g. My Custom AI, Local Ollama, Together AI).
                        </span>
                      </div>

                      {/* API Base URL */}
                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                          API Base URL
                        </label>
                        <input
                          type="text"
                          value={customBaseUrl}
                          onChange={(e) => setCustomBaseUrl(e.target.value)}
                          placeholder="https://example.com/v1"
                          className="input-base text-xs font-mono"
                        />
                        <span className="text-[10px] text-[#64748B] mt-0.5 block">
                          Root URL for the OpenAI-compatible endpoint (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded">https://example.com/v1</code> or <code className="bg-slate-100 px-1 py-0.5 rounded">http://localhost:11434/v1</code>).
                        </span>
                      </div>

                      {/* API Key */}
                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                          API Key
                        </label>
                        {savedKeys["custom"] && !isEditingCustomKey ? (
                          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-[#E2E8F0] rounded-[10px]">
                            <span className="font-mono text-xs text-[#0F172A]">
                              {maskApiKey(savedKeys["custom"])}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setIsEditingCustomKey(true);
                                setCustomApiKey(savedKeys["custom"]);
                              }}
                              className="text-xs font-semibold text-[#4F46E5] hover:underline flex items-center space-x-1"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Change</span>
                            </button>
                          </div>
                        ) : (
                          <div className="relative">
                            <input
                              type={showCustomKey ? "text" : "password"}
                              value={customApiKey}
                              onChange={(e) => setCustomApiKey(e.target.value)}
                              placeholder="sk-... or your secret token"
                              className="input-base pr-10 font-mono text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCustomKey(!showCustomKey)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A]"
                              aria-label="Toggle password visibility"
                            >
                              {showCustomKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        )}
                        <span className="text-[10px] text-[#64748B] mt-0.5 block">
                          Authorization token passed via <code className="bg-slate-100 px-1 py-0.5 rounded">Bearer</code> header. Never exposed in generated code or downloads.
                        </span>
                      </div>

                      {/* Model Name */}
                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                          Model Name
                        </label>
                        <input
                          type="text"
                          value={customModelName}
                          onChange={(e) => setCustomModelName(e.target.value)}
                          placeholder="model-name"
                          className="input-base text-xs font-mono"
                        />
                        <span className="text-[10px] text-[#64748B] mt-0.5 block">
                          Model identifier expected by your endpoint (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded">llama-3.3-70b</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">mistral-large-latest</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">custom-model-v1</code>).
                        </span>
                      </div>

                      {/* Organization ID (Optional) */}
                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                          Organization ID <span className="text-[#64748B] font-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={customOrgId}
                          onChange={(e) => setCustomOrgId(e.target.value)}
                          placeholder="org-... (only if required by provider)"
                          className="input-base text-xs font-mono"
                        />
                        <span className="text-[10px] text-[#64748B] mt-0.5 block">
                          Included in the <code className="bg-slate-100 px-1 py-0.5 rounded">OpenAI-Organization</code> header if specified.
                        </span>
                      </div>

                      {/* Capabilities Badges */}
                      {providerCapabilities["custom"] && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="text-[10px] text-[#64748B] font-semibold">Capabilities:</span>
                          {providerCapabilities["custom"].chatCompletion && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Chat ✓
                            </span>
                          )}
                          {providerCapabilities["custom"].structuredJson && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              Structured JSON ✓
                            </span>
                          )}
                          {providerCapabilities["custom"].systemInstructions && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              System Instructions ✓
                            </span>
                          )}
                        </div>
                      )}

                      {/* Inline Test Result Message */}
                      {customTestResult && (
                        <div
                          className={`p-2.5 rounded-[8px] text-xs flex items-start space-x-2 ${
                            customTestResult.success
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-rose-50 text-rose-800 border border-rose-200"
                          }`}
                        >
                          {customTestResult.success ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 break-words">
                            <span>{customTestResult.message}</span>
                            {customTestResult.latencyMs !== undefined && (
                              <span className="ml-1.5 font-mono text-[11px] opacity-75">
                                ({customTestResult.latencyMs}ms)
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons: Test, Save, Use as Active, Remove */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleTestCustomConnection}
                          disabled={isTestingCustom}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-[8px] border border-[#CBD5E1] bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A] transition disabled:opacity-50"
                        >
                          {isTestingCustom ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Testing...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
                              <span>Test connection</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={handleSaveCustomProvider}
                          className="inline-flex items-center space-x-1 px-3.5 py-1.5 rounded-[8px] bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold transition shadow-2xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Provider</span>
                        </button>

                        {savedKeys["custom"] && defaultProvider !== "custom" && (
                          <button
                            type="button"
                            onClick={() => handleDefaultAIChange("custom")}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-[8px] bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-xs font-semibold transition"
                          >
                            <Check className="w-3.5 h-3.5 text-[#4F46E5]" />
                            <span>Use as Active</span>
                          </button>
                        )}

                        {savedKeys["custom"] && (
                          <button
                            type="button"
                            onClick={handleRemoveCustomProvider}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-[8px] text-xs font-semibold text-rose-600 hover:bg-rose-50 transition ml-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================= TAB 2: IMAGE SOURCES ================= */}
            {activeTab === "images" && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* Intro Card */}
                <div className="bg-[#EEF2FF]/60 border border-[#C7D2FE] rounded-[12px] p-3.5 space-y-1.5">
                  <div className="flex items-center space-x-2 text-xs font-bold text-[#0F172A]">
                    <ImageIcon className="w-4 h-4 text-[#4F46E5]" />
                    <span>Free Royalty-Free Stock Photos</span>
                  </div>
                  <p className="text-[11px] text-[#64748B] leading-relaxed">
                    {BRAND.name} supports multiple image sources: the built-in <strong>Bing Free Image CDN</strong> (zero API keys required, dynamic keywords) as well as free API keys from <strong>Pexels</strong> and <strong>Pixabay</strong> to automatically search and embed real, license-free commercial photography.
                  </p>
                </div>

                {/* Local Storage Privacy Note */}
                <div className="flex items-center space-x-2 text-[11px] text-[#64748B] bg-slate-50 p-2.5 rounded-[10px] border border-[#E2E8F0]">
                  <Lock className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                  <span>
                    Your optional image API keys are stored only in this browser (localStorage). They are never sent to external servers other than the official image providers.
                  </span>
                </div>

                {/* Preferred Source Selector Card */}
                <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-3.5 sm:p-4 space-y-2.5">
                  <label className="block text-xs font-bold text-[#0F172A]">
                    Preferred Image Source
                  </label>
                  <p className="text-[11px] text-[#64748B]">
                    {BRAND.name} queries your preferred provider first. If no matching photos are returned, it automatically cascades to alternative sources.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handlePreferredImageSourceChange("bing")}
                      className={`p-3 rounded-[10px] border text-left transition flex flex-col justify-between ${
                        preferredImageSource === "bing"
                          ? "bg-[#EEF2FF] border-[#4F46E5] ring-2 ring-[#4F46E5]/20"
                          : "bg-white border-[#E2E8F0] hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-xs font-bold text-[#0F172A]">Bing Free (Default)</span>
                        {preferredImageSource === "bing" && (
                          <Check className="w-3.5 h-3.5 text-[#4F46E5]" />
                        )}
                      </div>
                      <span className="text-[10px] text-[#64748B]">
                        Zero API key needed. Instant dynamic keywords (e.g. water damage, plumber in CA).
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePreferredImageSourceChange("google")}
                      className={`p-3 rounded-[10px] border text-left transition flex flex-col justify-between ${
                        preferredImageSource === "google"
                          ? "bg-[#EEF2FF] border-[#4F46E5] ring-2 ring-[#4F46E5]/20"
                          : "bg-white border-[#E2E8F0] hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-xs font-bold text-[#0F172A]">Google Search (Optional)</span>
                        {preferredImageSource === "google" && (
                          <Check className="w-3.5 h-3.5 text-[#4F46E5]" />
                        )}
                      </div>
                      <span className="text-[10px] text-[#64748B]">
                        Custom Search JSON API with exact local search queries.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePreferredImageSourceChange("pexels")}
                      className={`p-3 rounded-[10px] border text-left transition flex flex-col justify-between ${
                        preferredImageSource === "pexels"
                          ? "bg-[#EEF2FF] border-[#4F46E5] ring-2 ring-[#4F46E5]/20"
                          : "bg-white border-[#E2E8F0] hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-xs font-bold text-[#0F172A]">Pexels first</span>
                        {preferredImageSource === "pexels" && (
                          <Check className="w-3.5 h-3.5 text-[#4F46E5]" />
                        )}
                      </div>
                      <span className="text-[10px] text-[#64748B]">
                        High aesthetic quality, modern residential &amp; interior photography.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePreferredImageSourceChange("pixabay")}
                      className={`p-3 rounded-[10px] border text-left transition flex flex-col justify-between ${
                        preferredImageSource === "pixabay"
                          ? "bg-[#EEF2FF] border-[#4F46E5] ring-2 ring-[#4F46E5]/20"
                          : "bg-white border-[#E2E8F0] hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-xs font-bold text-[#0F172A]">Pixabay first</span>
                        {preferredImageSource === "pixabay" && (
                          <Check className="w-3.5 h-3.5 text-[#4F46E5]" />
                        )}
                      </div>
                      <span className="text-[10px] text-[#64748B]">
                        Contractor tools, work trucks, equipment, and outdoor landscapes.
                      </span>
                    </button>
                  </div>
                </div>

                {/* 1. BING FREE IMAGE CDN CARD */}
                <div className="rounded-[12px] border bg-white border-[#CBD5E1] shadow-xs overflow-hidden">
                  {/* Card Header */}
                  <div className="p-3.5 sm:p-4 bg-slate-50/70 border-b border-[#E2E8F0] flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-[8px] bg-[#008373] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        BG
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-xs sm:text-sm font-bold text-[#0F172A]">
                            Bing Free Image Search (CDN)
                          </h3>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            No API Key Needed
                          </span>
                        </div>
                        <span className="text-[11px] text-[#64748B]">
                          High-speed CDN delivering instant keyword-tailored photography
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                        <span>Ready &amp; Active</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-3.5 sm:p-4 space-y-3">
                    <p className="text-xs text-[#475569] leading-relaxed">
                      Bing Free Image CDN dynamically generates photos matching your website&apos;s specific trade and location keywords (e.g. <code className="px-1 py-0.5 bg-slate-100 rounded text-[11px] text-slate-800">water damage</code>, <code className="px-1 py-0.5 bg-slate-100 rounded text-[11px] text-slate-800">plumber in CA</code>) with custom responsive dimensions.
                    </p>

                    <div className="bg-slate-50 border border-slate-200 rounded-[10px] p-3 space-y-2">
                      <div className="text-[11px] font-semibold text-slate-700 flex items-center justify-between">
                        <span>Sample Dynamic CDN Queries:</span>
                        <span className="text-[10px] text-slate-500 font-normal">Free royalty-free thumbnails</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <a
                          href="https://tse1.mm.bing.net/th?q=water+damage&w=575&h=274"
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-2 rounded-md bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 hover:text-indigo-600 transition group"
                        >
                          <span className="truncate mr-2">q=water+damage &amp; w=575&amp;h=274</span>
                          <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                        </a>
                        <a
                          href="https://tse1.mm.bing.net/th?q=plumber+in+CA&w=575&h=274"
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-2 rounded-md bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 hover:text-indigo-600 transition group"
                        >
                          <span className="truncate mr-2">q=plumber+in+CA &amp; w=575&amp;h=274</span>
                          <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                        </a>
                      </div>
                    </div>

                    {/* Test Result Message */}
                    {imageTestResults.bing && (
                      <div
                        className={`p-2.5 rounded-[8px] text-xs flex items-start space-x-2 ${
                          imageTestResults.bing.success
                            ? "bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {imageTestResults.bing.success ? (
                          <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        )}
                        <span>{imageTestResults.bing.message}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        type="button"
                        disabled={testingImageSource === "bing"}
                        onClick={() => handleTestImageKey("bing")}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-[8px] border border-[#CBD5E1] bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A] transition disabled:opacity-50"
                      >
                        {testingImageSource === "bing" ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Testing CDN…</span>
                          </>
                        ) : (
                          <span>Test CDN connection</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. PEXELS CARD */}
                <div
                  className={`rounded-[12px] border transition overflow-hidden ${
                    savedPexelsKey
                      ? "bg-white border-[#CBD5E1] shadow-xs"
                      : "bg-white border-[#E2E8F0]"
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-3.5 sm:p-4 bg-slate-50/70 border-b border-[#E2E8F0] flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-[8px] bg-[#05A081] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        PX
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-[#0F172A]">
                          Pexels
                        </h3>
                        <a
                          href="https://www.pexels.com/api/"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-[#4F46E5] hover:underline inline-flex items-center space-x-1"
                        >
                          <span>Get free API key (pexels.com/api)</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {pexelsStatus === "connected" && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                          <span>Connected</span>
                        </span>
                      )}
                      {pexelsStatus === "not_connected" && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          <span>Not connected</span>
                        </span>
                      )}
                      {pexelsStatus === "error" && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span>Error</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-3.5 sm:p-4 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                        Pexels API Key
                      </label>

                      {savedPexelsKey && !isEditingPexelsKey ? (
                        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-[#E2E8F0] rounded-[10px]">
                          <span className="font-mono text-xs text-[#0F172A]">
                            {maskApiKey(savedPexelsKey)}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingPexelsKey(true);
                              setPexelsKeyInput(savedPexelsKey);
                            }}
                            className="text-xs font-semibold text-[#4F46E5] hover:underline flex items-center space-x-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Change</span>
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type={showPexelsKey ? "text" : "password"}
                            value={pexelsKeyInput}
                            onChange={(e) => setPexelsKeyInput(e.target.value)}
                            placeholder="Enter your Pexels API key..."
                            className="input-base pr-10 font-mono text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPexelsKey((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A]"
                            aria-label="Toggle password visibility"
                          >
                            {showPexelsKey ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Test result message */}
                    {imageTestResults.pexels && (
                      <div
                        className={`p-2.5 rounded-[8px] text-xs flex items-start space-x-2 ${
                          imageTestResults.pexels.success
                            ? "bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {imageTestResults.pexels.success ? (
                          <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        )}
                        <span>{imageTestResults.pexels.message}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        type="button"
                        disabled={testingImageSource === "pexels"}
                        onClick={() => handleTestImageKey("pexels")}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-[8px] border border-[#CBD5E1] bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A] transition disabled:opacity-50"
                      >
                        {testingImageSource === "pexels" ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Testing…</span>
                          </>
                        ) : (
                          <span>Test connection</span>
                        )}
                      </button>

                      {(!savedPexelsKey || isEditingPexelsKey) && (
                        <button
                          type="button"
                          onClick={() => handleSaveImageKey("pexels")}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-[8px] bg-[#4F46E5] hover:bg-[#4338CA] text-xs font-semibold text-white shadow-xs transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Key</span>
                        </button>
                      )}

                      {savedPexelsKey && (
                        <button
                          type="button"
                          onClick={() => handleRemoveImageKey("pexels")}
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-[8px] text-xs font-semibold text-rose-600 hover:bg-rose-50 transition ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. PIXABAY CARD */}
                <div
                  className={`rounded-[12px] border transition overflow-hidden ${
                    savedPixabayKey
                      ? "bg-white border-[#CBD5E1] shadow-xs"
                      : "bg-white border-[#E2E8F0]"
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-3.5 sm:p-4 bg-slate-50/70 border-b border-[#E2E8F0] flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-[8px] bg-[#0288D1] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        PB
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-[#0F172A]">
                          Pixabay
                        </h3>
                        <a
                          href="https://pixabay.com/api/docs/"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-[#4F46E5] hover:underline inline-flex items-center space-x-1"
                        >
                          <span>Get free API key (pixabay.com/api/docs)</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {pixabayStatus === "connected" && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                          <span>Connected</span>
                        </span>
                      )}
                      {pixabayStatus === "not_connected" && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          <span>Not connected</span>
                        </span>
                      )}
                      {pixabayStatus === "error" && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span>Error</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-3.5 sm:p-4 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                        Pixabay API Key
                      </label>

                      {savedPixabayKey && !isEditingPixabayKey ? (
                        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-[#E2E8F0] rounded-[10px]">
                          <span className="font-mono text-xs text-[#0F172A]">
                            {maskApiKey(savedPixabayKey)}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingPixabayKey(true);
                              setPixabayKeyInput(savedPixabayKey);
                            }}
                            className="text-xs font-semibold text-[#4F46E5] hover:underline flex items-center space-x-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Change</span>
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type={showPixabayKey ? "text" : "password"}
                            value={pixabayKeyInput}
                            onChange={(e) => setPixabayKeyInput(e.target.value)}
                            placeholder="Enter your Pixabay API key..."
                            className="input-base pr-10 font-mono text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPixabayKey((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A]"
                            aria-label="Toggle password visibility"
                          >
                            {showPixabayKey ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Test result message */}
                    {imageTestResults.pixabay && (
                      <div
                        className={`p-2.5 rounded-[8px] text-xs flex items-start space-x-2 ${
                          imageTestResults.pixabay.success
                            ? "bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {imageTestResults.pixabay.success ? (
                          <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        )}
                        <span>{imageTestResults.pixabay.message}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        type="button"
                        disabled={testingImageSource === "pixabay"}
                        onClick={() => handleTestImageKey("pixabay")}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-[8px] border border-[#CBD5E1] bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A] transition disabled:opacity-50"
                      >
                        {testingImageSource === "pixabay" ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Testing…</span>
                          </>
                        ) : (
                          <span>Test connection</span>
                        )}
                      </button>

                      {(!savedPixabayKey || isEditingPixabayKey) && (
                        <button
                          type="button"
                          onClick={() => handleSaveImageKey("pixabay")}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-[8px] bg-[#4F46E5] hover:bg-[#4338CA] text-xs font-semibold text-white shadow-xs transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Key</span>
                        </button>
                      )}

                      {(savedPixabayKey) && (
                        <button
                          type="button"
                          onClick={() => handleRemoveImageKey("pixabay")}
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-[8px] text-xs font-semibold text-rose-600 hover:bg-rose-50 transition ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. GOOGLE IMAGE SEARCH CARD (OPTIONAL) */}
                <div
                  className={`rounded-[12px] border transition overflow-hidden ${
                    savedGoogleKey && savedGoogleCx
                      ? "bg-white border-[#CBD5E1] shadow-xs"
                      : "bg-white border-[#E2E8F0]"
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-3.5 sm:p-4 bg-slate-50/70 border-b border-[#E2E8F0] flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-[8px] bg-[#4285F4] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        G
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-xs sm:text-sm font-bold text-[#0F172A]">
                            Google Image Search (Optional)
                          </h3>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                            Custom Search JSON API
                          </span>
                        </div>
                        <span className="text-[11px] text-[#64748B]">
                          Enables precise, localized query image search (e.g., &quot;emergency leak detection Houston Texas&quot;).
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {googleStatus === "connected" && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                          <span>Connected</span>
                        </span>
                      )}
                      {googleStatus === "not_connected" && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          <span>Not connected</span>
                        </span>
                      )}
                      {googleStatus === "error" && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span>Error</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-3.5 sm:p-4 space-y-3">
                    <p className="text-[11px] text-[#64748B]">
                      Requires a Google Custom Search API key and Programmable Search Engine CX ID. Bing Free CDN remains active as the primary default.
                    </p>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-[#0F172A]">
                          Google Cloud API Key
                        </label>
                        <a
                          href="https://console.cloud.google.com/apis/credentials"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-[#4F46E5] hover:underline inline-flex items-center space-x-1"
                        >
                          <span>Get API key</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>

                      {savedGoogleKey && !isEditingGoogleKey ? (
                        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-[#E2E8F0] rounded-[10px]">
                          <span className="font-mono text-xs text-[#0F172A]">
                            {maskApiKey(savedGoogleKey)}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingGoogleKey(true);
                              setGoogleKeyInput(savedGoogleKey);
                            }}
                            className="text-xs font-semibold text-[#4F46E5] hover:underline flex items-center space-x-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Change</span>
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type={showGoogleKey ? "text" : "password"}
                            value={googleKeyInput}
                            onChange={(e) => setGoogleKeyInput(e.target.value)}
                            placeholder="AIzaSy..."
                            className="input-base pr-10 font-mono text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setShowGoogleKey((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A]"
                            aria-label="Toggle password visibility"
                          >
                            {showGoogleKey ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-[#0F172A]">
                          Search Engine ID (CX)
                        </label>
                        <a
                          href="https://programmablesearchengine.google.com/controlpanel/all"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-[#4F46E5] hover:underline inline-flex items-center space-x-1"
                        >
                          <span>Create Search Engine (CX)</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                      <input
                        type="text"
                        value={googleCxInput}
                        onChange={(e) => setGoogleCxInput(e.target.value)}
                        placeholder="e.g. 0123456789abcdef0:xyz123"
                        className="input-base font-mono text-xs"
                      />
                    </div>

                    {/* Test result message */}
                    {imageTestResults.google && (
                      <div
                        className={`p-2.5 rounded-[8px] text-xs flex items-start space-x-2 ${
                          imageTestResults.google.success
                            ? "bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {imageTestResults.google.success ? (
                          <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        )}
                        <span>{imageTestResults.google.message}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        type="button"
                        disabled={testingImageSource === "google"}
                        onClick={() => handleTestImageKey("google")}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-[8px] border border-[#CBD5E1] bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A] transition disabled:opacity-50"
                      >
                        {testingImageSource === "google" ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Testing…</span>
                          </>
                        ) : (
                          <span>Test connection</span>
                        )}
                      </button>

                      {(!savedGoogleKey || !savedGoogleCx || isEditingGoogleKey) && (
                        <button
                          type="button"
                          onClick={() => handleSaveImageKey("google")}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-[8px] bg-[#4F46E5] hover:bg-[#4338CA] text-xs font-semibold text-white shadow-xs transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Credentials</span>
                        </button>
                      )}

                      {(savedGoogleKey || savedGoogleCx) && (
                        <button
                          type="button"
                          onClick={() => handleRemoveImageKey("google")}
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-[8px] text-xs font-semibold text-rose-600 hover:bg-rose-50 transition ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB 3: PREFERENCES ================= */}
            {activeTab === "preferences" && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Default Country */}
                <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-4 space-y-2">
                  <label className="block text-xs font-bold text-[#0F172A]">
                    Default Country
                  </label>
                  <p className="text-[11px] text-[#64748B]">
                    Used to prefill address fields in the builder for your local region.
                  </p>
                  <select
                    value={prefCountry}
                    onChange={(e) => setPrefCountry(e.target.value)}
                    className="input-base text-xs font-medium"
                  >
                    {COUNTRY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Default Theme */}
                <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-4 space-y-2">
                  <label className="block text-xs font-bold text-[#0F172A]">
                    Default Theme
                  </label>
                  <p className="text-[11px] text-[#64748B]">
                    Default palette selected when opening a new website project.
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {THEME_OPTIONS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setPrefTheme(t.id)}
                        className={`p-2.5 rounded-[10px] border text-left flex items-center space-x-2 transition ${
                          prefTheme === t.id
                            ? "border-[#4F46E5] bg-[#EEF2FF]/40 ring-1 ring-[#4F46E5]"
                            : "border-[#E2E8F0] hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-black/10 shrink-0 inline-block shadow-2xs"
                          style={{ backgroundColor: t.color }}
                        />
                        <span className="text-xs font-semibold text-[#0F172A] truncate">
                          {t.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language of Generated Website */}
                <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-4 space-y-2">
                  <label className="block text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                    <Languages className="w-4 h-4 text-[#4F46E5]" />
                    <span>Language of Generated Website</span>
                  </label>
                  <p className="text-[11px] text-[#64748B]">
                    The AI will write all headlines, copy, navigation, and SEO meta tags in this language.
                  </p>
                  <select
                    value={prefLanguage}
                    onChange={(e) => setPrefLanguage(e.target.value)}
                    className="input-base text-xs font-medium"
                  >
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quality Review (Second AI Pass) Toggle */}
                <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5 cursor-pointer">
                        <Sparkles className="w-4 h-4 text-[#4F46E5]" />
                        <span>Quality Review (Second AI Pass)</span>
                      </label>
                      <p className="text-[11px] text-[#64748B] mt-0.5 leading-relaxed">
                        Sends generated copy back to the AI model for a second pass to remove duplicate sentences across pages, eliminate generic filler, verify target keywords, and audit for any invented facts.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                      <input
                        type="checkbox"
                        checked={prefQualityReview}
                        onChange={(e) => setPrefQualityReview(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4F46E5]" />
                    </label>
                  </div>
                  <div className="text-[10px] text-[#475569] bg-slate-50 border border-slate-200/80 rounded-[8px] px-2.5 py-1.5 flex items-center justify-between">
                    <span>Audits for 100% unique copy, no clichés, no invented claims</span>
                    <span className={`font-bold ${prefQualityReview ? "text-[#10B981]" : "text-[#94A3B8]"}`}>
                      {prefQualityReview ? "● Enabled (Default)" : "Disabled"}
                    </span>
                  </div>
                </div>

                {/* Save Preferences Button */}
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={handleSavePreferences}
                    className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-[10px] bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold transition shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Preferences</span>
                  </button>

                  {prefSavedMessage && (
                    <span className="text-xs text-[#10B981] font-semibold animate-in fade-in">
                      ✓ Preferences saved!
                    </span>
                  )}
                </div>

                {/* Danger Zone: Clear All Saved Data */}
                <div className="pt-4 border-t border-[#E2E8F0]">
                  <div className="bg-rose-50/60 border border-rose-200 rounded-[12px] p-4 space-y-3">
                    <div>
                      <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                        <Trash2 className="w-4 h-4 text-rose-600" />
                        <span>Reset &amp; Clear Data</span>
                      </h4>
                      <p className="text-[11px] text-rose-800 mt-0.5">
                        Erase all cached website drafts, saved API keys, and builder preferences from this browser.
                      </p>
                    </div>

                    {!showClearConfirm ? (
                      <button
                        type="button"
                        onClick={() => setShowClearConfirm(true)}
                        className="px-3 py-1.5 rounded-[8px] border border-rose-300 bg-white hover:bg-rose-100 text-rose-700 text-xs font-semibold transition"
                      >
                        Clear all saved data
                      </button>
                    ) : (
                      <div className="p-3 bg-white border border-rose-300 rounded-[10px] space-y-2">
                        <p className="text-xs font-bold text-rose-900">
                          Are you sure? This cannot be undone.
                        </p>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={handleClearAllData}
                            className="px-3 py-1.5 rounded-[8px] bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition"
                          >
                            Yes, Clear Everything
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowClearConfirm(false)}
                            className="px-3 py-1.5 rounded-[8px] border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A] transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB 4: HOSTING & CLOUD DEPLOYMENTS ================= */}
            {(activeTab === "cloudflare" || activeTab === "hosting") && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* Hosting Provider Selector Pills */}
                <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl">
                  {[
                    { id: "cloudflare", label: "Cloudflare Pages", icon: Cloud, color: "text-orange-500", connected: cfConnected || hostingStatuses.cloudflare?.connected },
                    { id: "vercel", label: "Vercel", icon: Server, color: "text-slate-900", connected: hostingStatuses.vercel?.connected },
                    { id: "netlify", label: "Netlify", icon: Zap, color: "text-teal-600", connected: hostingStatuses.netlify?.connected },
                    { id: "github", label: "GitHub Pages", icon: Globe, color: "text-purple-600", connected: hostingStatuses.github?.connected },
                  ].map((p) => {
                    const IconComp = p.icon;
                    const isSelected = selectedHostingProvider === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedHostingProvider(p.id as any)}
                        className={`flex-1 min-w-[120px] py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                          isSelected
                            ? "bg-white text-slate-900 shadow-xs"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                        }`}
                      >
                        <IconComp className={`w-3.5 h-3.5 ${p.color}`} />
                        <span>{p.label}</span>
                        {p.connected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* PROVIDER 1: CLOUDFLARE PAGES */}
                {selectedHostingProvider === "cloudflare" && (
                  <div className="space-y-4">
                    <div
                      className={`p-4 rounded-xl border ${
                        cfConnected || hostingStatuses.cloudflare?.connected
                          ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                          : "bg-orange-50/60 border-orange-200 text-slate-800"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            cfConnected || hostingStatuses.cloudflare?.connected
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-orange-100 text-orange-600"
                          }`}
                        >
                          <Cloud className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider">
                              {cfConnected || hostingStatuses.cloudflare?.connected ? "Cloudflare Pages Connected" : "Connect Cloudflare Pages"}
                            </h4>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                cfConnected || hostingStatuses.cloudflare?.connected
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {cfConnected || hostingStatuses.cloudflare?.connected ? "Active" : "Not Connected"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                            Publish static websites directly to Cloudflare Pages edge hosting with instant SSL, 330+ global CDN nodes, and custom domain mapping.
                          </p>
                          {(cfConnected || hostingStatuses.cloudflare?.connected) && (
                            <div className="mt-2 text-[11px] font-mono bg-white/80 border border-emerald-200 rounded-[8px] px-2.5 py-1 text-emerald-900 inline-block">
                              Token: {cfMaskedToken || hostingStatuses.cloudflare?.maskedToken || "••••••••"} {cfAccountName ? `• ${cfAccountName}` : ""}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleSaveCloudflare} className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 space-y-4 shadow-xs">
                      <div>
                        <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                          Cloudflare API Credentials
                        </h3>
                        <p className="text-[11px] text-[#64748B] mt-0.5">
                          Credentials are encrypted using AES-256-GCM server-side and never exposed to the browser.
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-[#0F172A]">
                            Cloudflare API Token <span className="text-rose-500">*</span>
                          </label>
                          <a
                            href="https://dash.cloudflare.com/profile/api-tokens"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-[#4F46E5] hover:text-[#4338CA] flex items-center gap-1 font-medium"
                          >
                            <span>Create Token</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="relative">
                          <input
                            type={showCfToken ? "text" : "password"}
                            value={cfTokenInput}
                            onChange={(e) => setCfTokenInput(e.target.value)}
                            placeholder={cfMaskedToken || "Paste your Cloudflare API token here"}
                            className="input-base pr-10 text-xs font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCfToken(!showCfToken)}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                            title={showCfToken ? "Hide token" : "Show token"}
                          >
                            {showCfToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-[10px] text-[#64748B]">
                          Requires permissions: <code className="bg-slate-100 px-1 rounded">Account &gt; Cloudflare Pages &gt; Edit</code>
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#0F172A]">
                          Cloudflare Account ID <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={cfAccountInput}
                          onChange={(e) => setCfAccountInput(e.target.value)}
                          placeholder="32-character hex Account ID"
                          className="input-base text-xs font-mono"
                        />
                        <p className="text-[10px] text-[#64748B]">
                          Located in your Cloudflare dashboard sidebar under &quot;Account ID&quot;.
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#0F172A]">
                          Account Name / Identifier <span className="text-[10px] font-normal text-slate-400">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={cfAccountNameInput}
                          onChange={(e) => setCfAccountNameInput(e.target.value)}
                          placeholder="e.g. My Agency Cloudflare"
                          className="input-base text-xs"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#E2E8F0]">
                        <button
                          type="button"
                          onClick={handleTestCloudflare}
                          disabled={cfIsTesting}
                          className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition disabled:opacity-50"
                        >
                          {cfIsTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />}
                          <span>{cfIsTesting ? "Testing…" : "Test Connection"}</span>
                        </button>

                        <button
                          type="submit"
                          disabled={cfIsSaving}
                          className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
                        >
                          {cfIsSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          <span>{cfIsSaving ? "Saving…" : "Save Cloudflare Credentials"}</span>
                        </button>
                      </div>

                      {cfTestResult && (
                        <div
                          className={`p-3 rounded-lg border text-xs ${
                            cfTestResult.success
                              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                              : "bg-rose-50 border-rose-200 text-rose-800"
                          }`}
                        >
                          {cfTestResult.message}
                        </div>
                      )}

                      {cfSaveMessage && (
                        <div className="p-3 rounded-lg border bg-indigo-50 border-indigo-200 text-indigo-900 text-xs">
                          {cfSaveMessage}
                        </div>
                      )}
                    </form>
                  </div>
                )}

                {/* PROVIDER 2: VERCEL */}
                {selectedHostingProvider === "vercel" && (
                  <div className="space-y-4">
                    <div
                      className={`p-4 rounded-xl border ${
                        hostingStatuses.vercel?.connected
                          ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                          : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0 font-bold">
                          ▲
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider">
                              {hostingStatuses.vercel?.connected ? "Vercel Connected" : "Connect Vercel"}
                            </h4>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                hostingStatuses.vercel?.connected
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {hostingStatuses.vercel?.connected ? "Active" : "Not Connected"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                            Publish static websites to Vercel global edge network with instant atomic deployments and automatic preview URLs.
                          </p>
                          {hostingStatuses.vercel?.connected && (
                            <div className="mt-2 text-[11px] font-mono bg-white/80 border border-emerald-200 rounded-[8px] px-2.5 py-1 text-emerald-900 inline-block">
                              Token: {hostingStatuses.vercel?.maskedToken || "••••••••"} {hostingStatuses.vercel?.accountName ? `• ${hostingStatuses.vercel.accountName}` : ""}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <form onSubmit={(e) => handleSaveHostingProvider("vercel", e)} className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 space-y-4 shadow-xs">
                      <div>
                        <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                          Vercel API Credentials
                        </h3>
                        <p className="text-[11px] text-[#64748B] mt-0.5">
                          Personal access tokens are encrypted with AES-256 and never shared with clients.
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-[#0F172A]">
                            Vercel Personal Access Token <span className="text-rose-500">*</span>
                          </label>
                          <a
                            href="https://vercel.com/account/tokens"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-[#4F46E5] hover:text-[#4338CA] flex items-center gap-1 font-medium"
                          >
                            <span>Create Token</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="relative">
                          <input
                            type={showVercelToken ? "text" : "password"}
                            value={vercelTokenInput}
                            onChange={(e) => setVercelTokenInput(e.target.value)}
                            placeholder={hostingStatuses.vercel?.maskedToken || "Paste Vercel Access Token"}
                            className="input-base pr-10 text-xs font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowVercelToken(!showVercelToken)}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                          >
                            {showVercelToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#0F172A]">
                          Team ID <span className="text-[10px] font-normal text-slate-400">(Optional for personal accounts)</span>
                        </label>
                        <input
                          type="text"
                          value={vercelTeamIdInput}
                          onChange={(e) => setVercelTeamIdInput(e.target.value)}
                          placeholder="team_..."
                          className="input-base text-xs font-mono"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#E2E8F0]">
                        <button
                          type="button"
                          onClick={() => handleTestHostingProvider("vercel")}
                          disabled={vercelIsTesting}
                          className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition disabled:opacity-50"
                        >
                          {vercelIsTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />}
                          <span>{vercelIsTesting ? "Testing…" : "Test Connection"}</span>
                        </button>

                        <button
                          type="submit"
                          disabled={vercelIsSaving}
                          className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-lg bg-black hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
                        >
                          {vercelIsSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          <span>{vercelIsSaving ? "Saving…" : "Save Vercel Credentials"}</span>
                        </button>
                      </div>

                      {vercelTestResult && (
                        <div className={`p-3 rounded-lg border text-xs ${vercelTestResult.success ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"}`}>
                          {vercelTestResult.message}
                        </div>
                      )}

                      {vercelSaveMessage && (
                        <div className="p-3 rounded-lg border bg-indigo-50 border-indigo-200 text-indigo-900 text-xs">
                          {vercelSaveMessage}
                        </div>
                      )}
                    </form>
                  </div>
                )}

                {/* PROVIDER 3: NETLIFY */}
                {selectedHostingProvider === "netlify" && (
                  <div className="space-y-4">
                    <div
                      className={`p-4 rounded-xl border ${
                        hostingStatuses.netlify?.connected
                          ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                          : "bg-teal-50/50 border-teal-200 text-slate-800"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                          <Zap className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider">
                              {hostingStatuses.netlify?.connected ? "Netlify Connected" : "Connect Netlify"}
                            </h4>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                hostingStatuses.netlify?.connected
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {hostingStatuses.netlify?.connected ? "Active" : "Not Connected"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                            Publish static websites to Netlify Edge CDN with atomic deployments and instant rollback capabilities.
                          </p>
                          {hostingStatuses.netlify?.connected && (
                            <div className="mt-2 text-[11px] font-mono bg-white/80 border border-emerald-200 rounded-[8px] px-2.5 py-1 text-emerald-900 inline-block">
                              Token: {hostingStatuses.netlify?.maskedToken || "••••••••"} {hostingStatuses.netlify?.accountName ? `• ${hostingStatuses.netlify.accountName}` : ""}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <form onSubmit={(e) => handleSaveHostingProvider("netlify", e)} className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 space-y-4 shadow-xs">
                      <div>
                        <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                          Netlify Access Token
                        </h3>
                        <p className="text-[11px] text-[#64748B] mt-0.5">
                          Create a personal access token in Netlify &gt; User Settings &gt; Applications.
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-[#0F172A]">
                            Personal Access Token <span className="text-rose-500">*</span>
                          </label>
                          <a
                            href="https://app.netlify.com/user/applications#personal-access-tokens"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-[#4F46E5] hover:text-[#4338CA] flex items-center gap-1 font-medium"
                          >
                            <span>Create Token</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="relative">
                          <input
                            type={showNetlifyToken ? "text" : "password"}
                            value={netlifyTokenInput}
                            onChange={(e) => setNetlifyTokenInput(e.target.value)}
                            placeholder={hostingStatuses.netlify?.maskedToken || "Paste Netlify Personal Access Token"}
                            className="input-base pr-10 text-xs font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNetlifyToken(!showNetlifyToken)}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                          >
                            {showNetlifyToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#E2E8F0]">
                        <button
                          type="button"
                          onClick={() => handleTestHostingProvider("netlify")}
                          disabled={netlifyIsTesting}
                          className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition disabled:opacity-50"
                        >
                          {netlifyIsTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />}
                          <span>{netlifyIsTesting ? "Testing…" : "Test Connection"}</span>
                        </button>

                        <button
                          type="submit"
                          disabled={netlifyIsSaving}
                          className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
                        >
                          {netlifyIsSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          <span>{netlifyIsSaving ? "Saving…" : "Save Netlify Credentials"}</span>
                        </button>
                      </div>

                      {netlifyTestResult && (
                        <div className={`p-3 rounded-lg border text-xs ${netlifyTestResult.success ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"}`}>
                          {netlifyTestResult.message}
                        </div>
                      )}

                      {netlifySaveMessage && (
                        <div className="p-3 rounded-lg border bg-indigo-50 border-indigo-200 text-indigo-900 text-xs">
                          {netlifySaveMessage}
                        </div>
                      )}
                    </form>
                  </div>
                )}

                {/* PROVIDER 4: GITHUB PAGES */}
                {selectedHostingProvider === "github" && (
                  <div className="space-y-4">
                    <div
                      className={`p-4 rounded-xl border ${
                        hostingStatuses.github?.connected
                          ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                          : "bg-purple-50/50 border-purple-200 text-slate-800"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                          <Globe className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider">
                              {hostingStatuses.github?.connected ? "GitHub Pages Connected" : "Connect GitHub Pages"}
                            </h4>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                hostingStatuses.github?.connected
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {hostingStatuses.github?.connected ? "Active" : "Not Connected"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                            Publish static websites to a dedicated GitHub repository with automatic GitHub Pages deployment and git version history.
                          </p>
                          {hostingStatuses.github?.connected && (
                            <div className="mt-2 text-[11px] font-mono bg-white/80 border border-emerald-200 rounded-[8px] px-2.5 py-1 text-emerald-900 inline-block">
                              Token: {hostingStatuses.github?.maskedToken || "••••••••"} {hostingStatuses.github?.accountName ? `• @${hostingStatuses.github.accountName}` : ""}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <form onSubmit={(e) => handleSaveHostingProvider("github", e)} className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 space-y-4 shadow-xs">
                      <div>
                        <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                          GitHub API Token &amp; Organization
                        </h3>
                        <p className="text-[11px] text-[#64748B] mt-0.5">
                          Requires a Personal Access Token with <code className="bg-slate-100 px-1 rounded">repo</code> scope.
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-[#0F172A]">
                            GitHub Personal Access Token <span className="text-rose-500">*</span>
                          </label>
                          <a
                            href="https://github.com/settings/tokens/new?scopes=repo"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-[#4F46E5] hover:text-[#4338CA] flex items-center gap-1 font-medium"
                          >
                            <span>Generate Token (repo scope)</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="relative">
                          <input
                            type={showGithubToken ? "text" : "password"}
                            value={githubTokenInput}
                            onChange={(e) => setGithubTokenInput(e.target.value)}
                            placeholder={hostingStatuses.github?.maskedToken || "ghp_..."}
                            className="input-base pr-10 text-xs font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowGithubToken(!showGithubToken)}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                          >
                            {showGithubToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#0F172A]">
                          GitHub Username or Organization <span className="text-[10px] font-normal text-slate-400">(Optional - auto-detected from token)</span>
                        </label>
                        <input
                          type="text"
                          value={githubOwnerInput}
                          onChange={(e) => setGithubOwnerInput(e.target.value)}
                          placeholder="e.g. your-github-org"
                          className="input-base text-xs font-mono"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#E2E8F0]">
                        <button
                          type="button"
                          onClick={() => handleTestHostingProvider("github")}
                          disabled={githubIsTesting}
                          className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition disabled:opacity-50"
                        >
                          {githubIsTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />}
                          <span>{githubIsTesting ? "Testing…" : "Test Connection"}</span>
                        </button>

                        <button
                          type="submit"
                          disabled={githubIsSaving}
                          className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
                        >
                          {githubIsSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          <span>{githubIsSaving ? "Saving…" : "Save GitHub Credentials"}</span>
                        </button>
                      </div>

                      {githubTestResult && (
                        <div className={`p-3 rounded-lg border text-xs ${githubTestResult.success ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"}`}>
                          {githubTestResult.message}
                        </div>
                      )}

                      {githubSaveMessage && (
                        <div className="p-3 rounded-lg border bg-indigo-50 border-indigo-200 text-indigo-900 text-xs">
                          {githubSaveMessage}
                        </div>
                      )}
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
