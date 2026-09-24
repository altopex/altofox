"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Key,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Trash2,
  Sparkles,
} from "lucide-react";
import { ProviderType } from "@/lib/ai/types";

interface ProviderPreset {
  id: ProviderType;
  name: string;
  description: string;
  defaultModel: string;
  defaultBaseUrl?: string;
  popularModels: { id: string; label: string; description?: string }[];
  placeholderKey: string;
  docsUrl: string;
  requiresBaseUrl?: boolean;
}

const PROVIDER_PRESETS_MAP: Record<string, ProviderPreset> = {
  gemini: {
    id: "gemini",
    name: "Google Gemini",
    description: "Gemini 1.5 Pro, 1.5 Flash & 2.0 with fast generation and generous limits",
    defaultModel: "gemini-1.5-pro",
    popularModels: [
      { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro (Recommended)" },
      { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash (Ultra Fast)" },
      { id: "gemini-2.0-flash-exp", label: "Gemini 2.0 Flash" },
    ],
    placeholderKey: "AIzaSy...",
    docsUrl: "https://aistudio.google.com/app/apikey",
  },
  openai: {
    id: "openai",
    name: "OpenAI (ChatGPT)",
    description: "GPT-4o and GPT-4o Mini flagship reasoning models",
    defaultModel: "gpt-4o",
    popularModels: [
      { id: "gpt-4o", label: "GPT-4o (Recommended)" },
      { id: "gpt-4o-mini", label: "GPT-4o Mini (Affordable & Fast)" },
      { id: "gpt-4-turbo", label: "GPT-4 Turbo" },
    ],
    placeholderKey: "sk-proj-...",
    docsUrl: "https://platform.openai.com/api-keys",
  },
  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    description: "Access 100+ AI models including Claude 3.5 Sonnet, Llama 3.3, and DeepSeek",
    defaultModel: "anthropic/claude-3.5-sonnet",
    popularModels: [
      { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
      { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B" },
      { id: "openai/gpt-4o", label: "GPT-4o" },
      { id: "deepseek/deepseek-chat", label: "DeepSeek-V3" },
    ],
    placeholderKey: "sk-or-v1-...",
    docsUrl: "https://openrouter.ai/keys",
  },
  custom: {
    id: "custom",
    name: "Custom (Local / Ollama)",
    description: "Connect Ollama, LM Studio, vLLM, or any OpenAI-compatible API endpoint",
    defaultBaseUrl: "http://localhost:11434/v1",
    defaultModel: "llama3",
    popularModels: [
      { id: "llama3", label: "Llama 3 (Ollama)" },
      { id: "qwen2.5-coder", label: "Qwen 2.5 Coder" },
      { id: "mistral", label: "Mistral" },
    ],
    requiresBaseUrl: true,
    placeholderKey: "ollama (or API key)",
    docsUrl: "https://github.com/ollama/ollama",
  },
};

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeysUpdated?: () => void;
}

export function ApiKeyModal({ isOpen, onClose, onKeysUpdated }: ApiKeyModalProps) {
  const [selectedProvider, setSelectedProvider] = useState<string>("gemini");
  const [keyInput, setKeyInput] = useState("");
  const [baseUrlInput, setBaseUrlInput] = useState("");
  const [modelInput, setModelInput] = useState("");
  const [savedKeys, setSavedKeys] = useState<Record<string, string>>({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Load keys from localStorage on open or provider change
  useEffect(() => {
    if (isOpen) {
      const keys: Record<string, string> = {};
      const providers = ["gemini", "openai", "openrouter", "custom"];
      for (const p of providers) {
        const stored = localStorage.getItem(`altofox_key_${p}`);
        if (stored) keys[p] = stored;
      }
      setSavedKeys(keys);

      const currentStoredKey = keys[selectedProvider] || "";
      setKeyInput(currentStoredKey);

      const preset = PROVIDER_PRESETS_MAP[selectedProvider];
      const storedModel = localStorage.getItem(`altofox_model_${selectedProvider}`);
      setModelInput(storedModel || preset?.defaultModel || "");

      const storedBaseUrl = localStorage.getItem(`altofox_base_url_${selectedProvider}`);
      setBaseUrlInput(storedBaseUrl || preset?.defaultBaseUrl || "");

      setTestResult(null);
      setStatusMessage(null);
    }
  }, [isOpen, selectedProvider]);

  if (!isOpen) return null;

  const currentPreset = PROVIDER_PRESETS_MAP[selectedProvider] || PROVIDER_PRESETS_MAP.gemini;
  const currentSavedKey = savedKeys[selectedProvider] || "";

  // Test Connection
  const handleTestKey = async () => {
    const keyToTest = keyInput.trim() || currentSavedKey;
    if (!keyToTest) {
      setTestResult({
        success: false,
        message: "Please enter an API key to test.",
      });
      return;
    }

    setTesting(true);
    setTestResult(null);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/keys/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: keyToTest,
          baseUrl: baseUrlInput.trim() || undefined,
          model: modelInput.trim() || currentPreset.defaultModel,
        }),
      });
      const data = await res.json();
      setTestResult({
        success: data.success,
        message: data.message || (data.success ? "Connected successfully!" : "Connection failed."),
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : "Test request failed.",
      });
    } finally {
      setTesting(false);
    }
  };

  // Save Key to localStorage
  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = keyInput.trim();
    if (!cleanKey && !currentSavedKey) {
      setStatusMessage({ type: "error", text: "Please enter an API key." });
      return;
    }

    const keyToPersist = cleanKey || currentSavedKey;
    localStorage.setItem(`altofox_key_${selectedProvider}`, keyToPersist);
    if (modelInput.trim()) {
      localStorage.setItem(`altofox_model_${selectedProvider}`, modelInput.trim());
    }
    if (baseUrlInput.trim()) {
      localStorage.setItem(`altofox_base_url_${selectedProvider}`, baseUrlInput.trim());
    }

    // Set as active provider and model
    localStorage.setItem("altofox_active_provider", selectedProvider);
    localStorage.setItem("altofox_active_model", modelInput.trim() || currentPreset.defaultModel);

    setSavedKeys((prev) => ({ ...prev, [selectedProvider]: keyToPersist }));

    // Non-blocking server sync
    fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: selectedProvider,
        apiKey: keyToPersist,
        baseUrl: baseUrlInput.trim() || undefined,
        defaultModel: modelInput.trim() || undefined,
      }),
    }).catch(() => {});

    setStatusMessage({
      type: "success",
      text: `${currentPreset.name} settings saved successfully!`,
    });
    onKeysUpdated?.();
  };

  // Clear Key
  const handleClearKey = () => {
    localStorage.removeItem(`altofox_key_${selectedProvider}`);
    localStorage.removeItem(`altofox_model_${selectedProvider}`);
    localStorage.removeItem(`altofox_base_url_${selectedProvider}`);

    setSavedKeys((prev) => {
      const copy = { ...prev };
      delete copy[selectedProvider];
      return copy;
    });
    setKeyInput("");
    setTestResult(null);

    fetch(`/api/keys?provider=${selectedProvider}`, { method: "DELETE" }).catch(() => {});

    setStatusMessage({
      type: "success",
      text: `Cleared API key for ${currentPreset.name}.`,
    });
    onKeysUpdated?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-[#E2E8F0] rounded-[16px] max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">AI Model &amp; Settings</h2>
              <p className="text-xs text-[#64748B]">Choose your AI provider and paste your API key</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Provider Tabs */}
          <div>
            <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-2">
              Select AI Provider
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.values(PROVIDER_PRESETS_MAP).map((preset) => {
                const isSelected = selectedProvider === preset.id;
                const isConfigured = !!savedKeys[preset.id];
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedProvider(preset.id);
                      setTestResult(null);
                      setStatusMessage(null);
                    }}
                    className={`relative p-3 rounded-[10px] border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? "border-[#4F46E5] bg-[#EEF2FF]/60 text-[#4F46E5] ring-2 ring-[#4F46E5]/10"
                        : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1] text-[#0F172A]"
                    }`}
                  >
                    <div className="font-semibold text-xs leading-tight mb-1">{preset.name}</div>
                    <div className="flex items-center space-x-1">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isConfigured ? "bg-[#10B981]" : "bg-[#CBD5E1]"
                        }`}
                      />
                      <span className="text-[10px] text-[#64748B]">
                        {isConfigured ? "Connected" : "No key"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Provider description banner */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] p-3 flex items-start justify-between text-xs">
            <div>
              <span className="font-semibold text-[#0F172A]">{currentPreset.name}</span>
              <p className="text-[#64748B] mt-0.5">{currentPreset.description}</p>
            </div>
            <a
              href={currentPreset.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-[#4F46E5] font-semibold hover:underline shrink-0 ml-3"
            >
              <span>Get Key</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <form onSubmit={handleSaveKey} className="space-y-4">
            {/* API Key Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#0F172A]">
                  API Key <span className="text-[#EF4444]">*</span>
                </label>
                {currentSavedKey && (
                  <button
                    type="button"
                    onClick={handleClearKey}
                    className="text-[11px] text-[#EF4444] hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear saved key</span>
                  </button>
                )}
              </div>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder={currentPreset.placeholderKey}
                className="input-base"
              />
              <p className="text-[11px] text-[#64748B] mt-1.5 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Saved securely in your browser&apos;s local storage. Never shared.</span>
              </p>
            </div>

            {/* Base URL (if custom) */}
            {currentPreset.requiresBaseUrl && (
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  Base URL (OpenAI-compatible)
                </label>
                <input
                  type="text"
                  value={baseUrlInput}
                  onChange={(e) => setBaseUrlInput(e.target.value)}
                  placeholder="http://localhost:11434/v1"
                  className="input-base"
                />
              </div>
            )}

            {/* Model Name Input & Suggestions */}
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                Model Name
              </label>
              <input
                type="text"
                value={modelInput}
                onChange={(e) => setModelInput(e.target.value)}
                placeholder={currentPreset.defaultModel}
                className="input-base mb-2 font-mono text-xs"
              />
              <div className="flex flex-wrap gap-1.5">
                {currentPreset.popularModels.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setModelInput(m.id)}
                    className={`text-[11px] px-2.5 py-1 rounded-[6px] border transition ${
                      modelInput === m.id
                        ? "bg-[#EEF2FF] border-[#4F46E5] text-[#4F46E5] font-semibold"
                        : "bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1]"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Test Connection Result Box */}
            {testResult && (
              <div
                className={`p-3 rounded-[10px] border text-xs flex items-start space-x-2 ${
                  testResult.success
                    ? "bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]"
                    : "bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-[#10B981] mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#EF4444] mt-0.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            {/* Status Message */}
            {statusMessage && (
              <div
                className={`p-3 rounded-[10px] border text-xs flex items-start space-x-2 ${
                  statusMessage.type === "success"
                    ? "bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]"
                    : "bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]"
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#10B981] mt-0.5" />
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleTestKey}
                disabled={testing}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-[10px] border border-[#CBD5E1] bg-white hover:bg-slate-50 text-[#0F172A] text-xs font-semibold shadow-sm transition disabled:opacity-50"
              >
                {testing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Testing…</span>
                  </>
                ) : (
                  <span>Test Connection</span>
                )}
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-[10px] border border-[#E2E8F0] hover:bg-slate-50 text-xs font-semibold text-[#64748B] transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-[10px] bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold shadow-sm transition"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
