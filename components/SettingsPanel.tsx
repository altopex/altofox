"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Image as ImageIcon,
} from "lucide-react";
import { ProviderType } from "@/lib/ai/types";

export interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "models" | "images" | "preferences";
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
    id: "openai",
    name: "OpenAI (ChatGPT)",
    badgeName: "OpenAI",
    icon: (
      <div className="w-8 h-8 rounded-[8px] bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
        OA
      </div>
    ),
    defaultModel: "gpt-4o",
    popularModels: [
      { id: "gpt-4o", label: "GPT-4o (Recommended - Best Quality)" },
      { id: "gpt-4o-mini", label: "GPT-4o Mini (Affordable & Fast)" },
      { id: "gpt-4-turbo", label: "GPT-4 Turbo" },
      { id: "o3-mini", label: "o3-mini (High Reasoning)" },
    ],
    placeholderKey: "sk-proj-...",
    docsUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    badgeName: "Gemini",
    icon: (
      <div className="w-8 h-8 rounded-[8px] bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
        <Sparkles className="w-4 h-4" />
      </div>
    ),
    defaultModel: "gemini-1.5-pro",
    popularModels: [
      { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro (Recommended)" },
      { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash (Ultra Fast)" },
      { id: "gemini-2.0-flash-exp", label: "Gemini 2.0 Flash" },
      { id: "gemini-2.0-pro-exp", label: "Gemini 2.0 Pro" },
    ],
    placeholderKey: "AIzaSy...",
    docsUrl: "https://aistudio.google.com/app/apikey",
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
    defaultModel: "anthropic/claude-3.5-sonnet",
    popularModels: [
      { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet (Top Quality)" },
      { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B (Meta)" },
      { id: "deepseek/deepseek-chat", label: "DeepSeek-V3" },
      { id: "openai/gpt-4o", label: "GPT-4o (OpenAI via OpenRouter)" },
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
  const [activeTab, setActiveTab] = useState<"models" | "images" | "preferences">(initialTab);

  // Default AI Provider & Model
  const [defaultProvider, setDefaultProvider] = useState<ProviderType>("gemini");
  const [defaultModel, setDefaultModel] = useState<string>("gemini-1.5-pro");

  // Provider states
  const [savedKeys, setSavedKeys] = useState<Record<string, string>>({});
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [isEditingKey, setIsEditingKey] = useState<Record<string, boolean>>({});
  const [selectedModels, setSelectedModels] = useState<Record<string, string>>({});
  const [customModelInputs, setCustomModelInputs] = useState<Record<string, string>>({});
  const [providerStatuses, setProviderStatuses] = useState<
    Record<string, "connected" | "not_connected" | "error">
  >({});
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, { success: boolean; message: string }>
  >({});

  // Image Sources states
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

  const [preferredImageSource, setPreferredImageSource] = useState<"pexels" | "pixabay">("pexels");
  const [testingImageSource, setTestingImageSource] = useState<"pexels" | "pixabay" | null>(null);
  const [imageTestResults, setImageTestResults] = useState<
    Record<"pexels" | "pixabay", { success: boolean; message: string } | null>
  >({ pexels: null, pixabay: null });

  // Preferences states
  const [prefCountry, setPrefCountry] = useState("United States");
  const [prefTheme, setPrefTheme] = useState("modern-indigo");
  const [prefLanguage, setPrefLanguage] = useState("English");
  const [prefQualityReview, setPrefQualityReview] = useState(true);
  const [prefSavedMessage, setPrefSavedMessage] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

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

    setSavedKeys(keys);
    setKeyInputs(keys);
    setSelectedModels(models);
    setCustomModelInputs(customs);
    setProviderStatuses(statuses);

    // Active default provider & model
    const storedActiveProvider =
      (localStorage.getItem("altofox_active_provider") as ProviderType) || "gemini";
    const storedActiveModel =
      localStorage.getItem("altofox_active_model") ||
      keys[storedActiveProvider]
        ? localStorage.getItem(`altofox_model_${storedActiveProvider}`) || "gemini-1.5-pro"
        : "gemini-1.5-pro";

    setDefaultProvider(storedActiveProvider);
    setDefaultModel(storedActiveModel);

    // Load image keys & settings
    const pexelsKey = localStorage.getItem("altofox_pexels_key") || "";
    setSavedPexelsKey(pexelsKey);
    setPexelsKeyInput(pexelsKey);
    setPexelsStatus(pexelsKey ? "connected" : "not_connected");

    const pixabayKey = localStorage.getItem("altofox_pixabay_key") || "";
    setSavedPixabayKey(pixabayKey);
    setPixabayKeyInput(pixabayKey);
    setPixabayStatus(pixabayKey ? "connected" : "not_connected");

    const prefSource =
      (localStorage.getItem("altofox_image_preferred_source") as "pexels" | "pixabay") || "pexels";
    setPreferredImageSource(prefSource);

    // Load preferences
    setPrefCountry(localStorage.getItem("altofox_pref_country") || "United States");
    setPrefTheme(localStorage.getItem("altofox_pref_theme") || "modern-indigo");
    setPrefLanguage(localStorage.getItem("altofox_pref_language") || "English");
    setPrefQualityReview(localStorage.getItem("altofox_pref_quality_review") !== "false");
  }, []);

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
    return PROVIDERS.filter((p) => !!savedKeys[p.id]);
  }, [savedKeys]);

  // Save Default AI for generating
  const handleDefaultAIChange = (providerId: ProviderType) => {
    setDefaultProvider(providerId);
    const chosenModel =
      selectedModels[providerId] === "__custom__"
        ? customModelInputs[providerId] || PROVIDERS.find((p) => p.id === providerId)?.defaultModel || ""
        : selectedModels[providerId] || PROVIDERS.find((p) => p.id === providerId)?.defaultModel || "";

    setDefaultModel(chosenModel);

    localStorage.setItem("altofox_active_provider", providerId);
    localStorage.setItem("altofox_active_model", chosenModel);
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

  // Save Provider Key & Model
  const handleSaveProvider = (providerId: ProviderType) => {
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
    localStorage.setItem(`altofox_model_${providerId}`, effectiveModel);

    // If no default provider was set or no key was connected, make this default
    const currentActive = localStorage.getItem("altofox_active_provider");
    const currentHasKey = currentActive && localStorage.getItem(`altofox_key_${currentActive}`);
    if (!currentHasKey) {
      localStorage.setItem("altofox_active_provider", providerId);
      localStorage.setItem("altofox_active_model", effectiveModel);
      setDefaultProvider(providerId);
      setDefaultModel(effectiveModel);
    } else if (currentActive === providerId) {
      localStorage.setItem("altofox_active_model", effectiveModel);
      setDefaultModel(effectiveModel);
    }

    setSavedKeys((prev) => ({ ...prev, [providerId]: rawKey }));
    setIsEditingKey((prev) => ({ ...prev, [providerId]: false }));
    setProviderStatuses((prev) => ({ ...prev, [providerId]: "connected" }));
    setTestResults((prev) => ({
      ...prev,
      [providerId]: { success: true, message: "Saved to browser successfully!" },
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

  // Test Image Source API Key
  const handleTestImageKey = async (source: "pexels" | "pixabay") => {
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
  const handleSaveImageKey = (source: "pexels" | "pixabay") => {
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
  const handleRemoveImageKey = (source: "pexels" | "pixabay") => {
    if (source === "pexels") {
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
  const handlePreferredImageSourceChange = (pref: "pexels" | "pixabay") => {
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
    // Clear all localStorage keys belonging to AltoFox
    const keysToRemove = [
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
      "altofox_image_preferred_source",
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
            </div>
          </div>

          {/* Panel Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
            {/* ================= TAB 1: AI MODELS ================= */}
            {activeTab === "models" && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* Default AI for generating Selector */}
                <div className="bg-[#EEF2FF]/60 border border-[#C7D2FE] rounded-[12px] p-3.5 space-y-2">
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
                        {connectedProviders.map((p) => {
                          const model =
                            selectedModels[p.id] === "__custom__"
                              ? customModelInputs[p.id] || p.defaultModel
                              : selectedModels[p.id] || p.defaultModel;
                          return (
                            <option key={p.id} value={p.id}>
                              {p.name} ({model})
                            </option>
                          );
                        })}
                      </select>
                      <p className="text-[11px] text-[#64748B]">
                        This model will build your static website when you click &quot;Generate Website&quot;.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-[#64748B]">
                      No AI model connected yet. Add your API key to one of the providers below to get started.
                    </p>
                  )}
                </div>

                {/* Local Storage Privacy Note */}
                <div className="flex items-center space-x-2 text-[11px] text-[#64748B] bg-slate-50 p-2.5 rounded-[10px] border border-[#E2E8F0]">
                  <Lock className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                  <span>
                    Your keys are stored only in this browser (localStorage). They are never saved to our servers.
                  </span>
                </div>

                {/* Provider Cards List */}
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

                          {/* Status Badge */}
                          <div>
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
                            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                              Model
                            </label>
                            <select
                              value={selectedModelVal}
                              onChange={(e) =>
                                setSelectedModels((prev) => ({ ...prev, [provider.id]: e.target.value }))
                              }
                              className="input-base text-xs"
                            >
                              {provider.popularModels.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.label}
                                </option>
                              ))}
                              <option value="__custom__">Custom model name...</option>
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
                                  placeholder="e.g. mistralai/mistral-large-2411"
                                  className="input-base text-xs font-mono"
                                />
                                <span className="text-[10px] text-[#64748B] mt-0.5 block">
                                  Enter the exact model ID supported by {provider.name}.
                                </span>
                              </div>
                            )}
                          </div>

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

                          {/* Action Buttons: Test, Save, Remove */}
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
                    Connect free API keys from <strong>Pexels</strong> and <strong>Pixabay</strong> to automatically search and embed real, license-free commercial photography for hero banners, service cards, about sections, and project galleries.
                  </p>
                </div>

                {/* Local Storage Privacy Note */}
                <div className="flex items-center space-x-2 text-[11px] text-[#64748B] bg-slate-50 p-2.5 rounded-[10px] border border-[#E2E8F0]">
                  <Lock className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                  <span>
                    Your image API keys are stored only in this browser (localStorage). They are never sent to external servers other than the official image providers.
                  </span>
                </div>

                {/* Preferred Source Selector Card */}
                <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-3.5 sm:p-4 space-y-2.5">
                  <label className="block text-xs font-bold text-[#0F172A]">
                    Preferred Image Source
                  </label>
                  <p className="text-[11px] text-[#64748B]">
                    AltoFox queries your preferred provider first. If no matching photos are returned, it automatically searches the second source.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
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
                        High aesthetic quality, modern residential & interior photography (Recommended).
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
                        Huge variety of tools, contractor gear, outdoor landscapes, and equipment.
                      </span>
                    </button>
                  </div>
                </div>

                {/* 1. PEXELS CARD */}
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

                      {savedPixabayKey && (
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
          </div>
        </div>
      </div>
    </div>
  );
}
