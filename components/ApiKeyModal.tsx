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
  Server,
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
    description: "Gemini 1.5 Pro, 1.5 Flash, 2.0 Flash with generous free tier",
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
    description: "GPT-4o, GPT-4o Mini, and ChatGPT flagship models",
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
    description: "Access 100+ AI models (Claude, Llama 3.3, Mistral, Qwen, DeepSeek)",
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
    name: "Custom API (Ollama / Local)",
    description: "Connect Ollama, LM Studio, vLLM, or any OpenAI-compatible Base URL",
    defaultBaseUrl: "http://localhost:11434/v1",
    defaultModel: "llama3",
    popularModels: [
      { id: "llama3", label: "Llama 3 (Ollama)" },
      { id: "qwen2.5-coder", label: "Qwen 2.5 Coder" },
      { id: "mistral", label: "Mistral" },
    ],
    requiresBaseUrl: true,
    placeholderKey: "ollama (or your key)",
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

  // Load keys from localStorage on open
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

  // Test Connection Probe
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

  // Save Key to localStorage & Server
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

    setSavedKeys((prev) => ({ ...prev, [selectedProvider]: keyToPersist }));

    // Optional server-side sync (non-blocking)
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
      text: `${currentPreset.name} API key saved in browser localStorage!`,
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

    // Optional server delete
    fetch(`/api/keys?provider=${selectedProvider}`, { method: "DELETE" }).catch(() => {});

    setStatusMessage({
      type: "success",
      text: `Cleared API key for ${currentPreset.name}.`,
    });
    onKeysUpdated?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Connect AI Provider Key</h2>
              <p className="text-xs text-slate-400">Stored safely in your browser (localStorage)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Provider Select Tabs */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Select AI Engine
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { id: "gemini", label: "Google Gemini", badge: "Recommended" },
                  { id: "openai", label: "OpenAI (ChatGPT)", badge: "GPT-4o" },
                  { id: "openrouter", label: "OpenRouter", badge: "100+ Models" },
                  { id: "custom", label: "Custom / Local", badge: "Ollama / Base URL" },
                ] as const
              ).map((tab) => {
                const hasKey = !!savedKeys[tab.id];
                const isSelected = selectedProvider === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setSelectedProvider(tab.id);
                      setTestResult(null);
                      setStatusMessage(null);
                    }}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition ${
                      isSelected
                        ? "border-sky-500 bg-sky-500/10 text-white ring-1 ring-sky-500/40"
                        : "border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-xs font-semibold truncate">{tab.label}</span>
                      {hasKey && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400" title="Key Saved" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">{tab.badge}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Provider Details */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-white text-sm">{currentPreset.name}</h3>
                  {currentSavedKey ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Saved in localStorage
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      Not Saved
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{currentPreset.description}</p>
              </div>

              {currentPreset.docsUrl && (
                <a
                  href={currentPreset.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-sky-400 hover:underline shrink-0"
                >
                  Get Key <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Saved Key Status & Clear Button */}
            {currentSavedKey && (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-slate-400">Key:</span>
                  <span className="font-mono text-slate-200">
                    {currentSavedKey.slice(0, 4)}••••••••{currentSavedKey.slice(-4)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClearKey}
                  className="text-red-400 hover:text-red-300 flex items-center gap-1 text-xs hover:underline shrink-0 ml-2"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear key
                </button>
              </div>
            )}

            <form onSubmit={handleSaveKey} className="space-y-3">
              {/* API Key Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder={currentPreset.placeholderKey}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-xs"
                />
              </div>

              {/* Model Name Input (user can type any model) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Model Name (Type any model or click a default)
                  </label>
                </div>
                <input
                  type="text"
                  value={modelInput}
                  onChange={(e) => setModelInput(e.target.value)}
                  placeholder={currentPreset.defaultModel}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-xs"
                />
                {/* Popular model suggestion chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {currentPreset.popularModels.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setModelInput(m.id)}
                      className={`text-[11px] px-2 py-0.5 rounded-md border font-mono transition ${
                        modelInput === m.id
                          ? "bg-sky-500/20 text-sky-300 border-sky-500/50"
                          : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                      }`}
                    >
                      {m.id}
                    </button>
                  ))}
                </div>
              </div>

              {/* Base URL (for Custom or OpenRouter proxy) */}
              {(selectedProvider === "custom" || currentPreset.requiresBaseUrl) && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-sky-400" />
                    OpenAI-Compatible Base URL
                  </label>
                  <input
                    type="text"
                    value={baseUrlInput}
                    onChange={(e) => setBaseUrlInput(e.target.value)}
                    placeholder="http://localhost:11434/v1"
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-xs"
                  />
                </div>
              )}

              {/* Action Buttons: Test Connection & Save */}
              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={handleTestKey}
                  disabled={testing}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {testing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Testing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                      <span>Test Connection</span>
                    </>
                  )}
                </button>

                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition shadow-lg shadow-sky-500/20"
                >
                  Save Key
                </button>
              </div>
            </form>

            {/* Test Connection Result Feedback */}
            {testResult && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                  testResult.success
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-red-500/10 border-red-500/30 text-red-300"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            {statusMessage && (
              <div
                className={`p-3 rounded-lg border text-xs ${
                  statusMessage.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-red-500/10 border-red-500/30 text-red-300"
                }`}
              >
                {statusMessage.text}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
