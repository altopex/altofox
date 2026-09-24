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
} from "lucide-react";
import { ProviderType } from "@/lib/ai/types";

interface StoredKey {
  provider: ProviderType;
  hasKey: boolean;
  maskedKey: string;
  baseUrl?: string | null;
  defaultModel?: string | null;
}

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

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeysUpdated?: () => void;
}

export function ApiKeyModal({ isOpen, onClose, onKeysUpdated }: ApiKeyModalProps) {
  const [providers, setProviders] = useState<StoredKey[]>([]);
  const [presets, setPresets] = useState<Record<string, ProviderPreset>>({});
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>("gemini");
  const [keyInput, setKeyInput] = useState("");
  const [baseUrlInput, setBaseUrlInput] = useState("");
  const [modelInput, setModelInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Load configured keys and presets
  const loadKeys = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/keys");
      const data = await res.json();
      if (data.success) {
        setProviders(data.providers);
        setPresets(data.presets);
      }
    } catch (err) {
      console.error("Failed to load keys:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadKeys();
      setTestResult(null);
      setStatusMessage(null);
      setKeyInput("");
    }
  }, [isOpen]);

  const currentPreset = presets[selectedProvider];
  const currentStored = providers.find((p) => p.provider === selectedProvider);

  // Update input states when provider changes
  useEffect(() => {
    if (currentStored) {
      setBaseUrlInput(currentStored.baseUrl || currentPreset?.defaultBaseUrl || "");
      setModelInput(currentStored.defaultModel || currentPreset?.defaultModel || "");
    } else if (currentPreset) {
      setBaseUrlInput(currentPreset.defaultBaseUrl || "");
      setModelInput(currentPreset.defaultModel || "");
    }
    setKeyInput("");
    setTestResult(null);
    setStatusMessage(null);
  }, [selectedProvider, currentStored, currentPreset]);

  if (!isOpen) return null;

  const handleTestKey = async () => {
    setTesting(true);
    setTestResult(null);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/keys/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: keyInput || undefined,
          baseUrl: baseUrlInput.trim() || undefined,
          model: modelInput.trim() || undefined,
        }),
      });
      const data = await res.json();
      setTestResult({
        success: data.success,
        message:
          data.message ||
          (data.success
            ? `Connection successful! (${data.latencyMs ?? 0}ms)`
            : "Connection failed."),
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : "Test request failed",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim() && !currentStored?.hasKey) {
      setStatusMessage({ type: "error", text: "Please enter an API key." });
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: keyInput.trim() || (currentStored?.hasKey ? undefined : ""),
          baseUrl: baseUrlInput.trim() || undefined,
          defaultModel: modelInput.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setStatusMessage({
          type: "success",
          text: `${currentPreset?.name || selectedProvider} configuration saved successfully!`,
        });
        setKeyInput("");
        await loadKeys();
        onKeysUpdated?.();
      } else {
        setStatusMessage({
          type: "error",
          text: data.error || "Failed to save key.",
        });
      }
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save configuration.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKey = async () => {
    if (!confirm(`Are you sure you want to remove the key for ${currentPreset?.name}?`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/keys?provider=${selectedProvider}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          type: "success",
          text: `Removed API key for ${currentPreset?.name}`,
        });
        setTestResult(null);
        await loadKeys();
        onKeysUpdated?.();
      }
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: "Failed to delete key.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Connect AI Engine</h2>
              <p className="text-xs text-slate-400">
                Connect Gemini, ChatGPT, Claude, Groq, or any Custom API model
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Provider Tabs */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Select AI Engine
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(
                [
                  { id: "gemini", label: "Google Gemini", badge: "Free Tier" },
                  { id: "openai", label: "ChatGPT (OpenAI)", badge: "GPT-4o" },
                  { id: "custom", label: "Custom API", badge: "Any Model / URL" },
                  { id: "anthropic", label: "Claude", badge: "Sonnet 3.5" },
                  { id: "groq", label: "Groq", badge: "Ultra Fast" },
                ] as const
              ).map((tab) => {
                const stored = providers.find((p) => p.provider === tab.id);
                const isSelected = selectedProvider === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setSelectedProvider(tab.id);
                    }}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? "border-sky-500 bg-sky-500/10 text-white ring-1 ring-sky-500"
                        : "border-slate-800 bg-slate-800/40 text-slate-300 hover:border-slate-700 hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-xs sm:text-sm font-medium truncate">{tab.label}</span>
                      {stored?.hasKey && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-950 shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 truncate">{tab.badge}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Provider Form */}
          {currentPreset && (
            <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-white">{currentPreset.name}</h3>
                    {currentStored?.hasKey ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Connected
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        Not Connected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{currentPreset.description}</p>
                </div>

                {currentPreset.docsUrl && (
                  <a
                    href={currentPreset.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 hover:underline shrink-0"
                  >
                    API Docs <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {currentStored?.hasKey && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-slate-400">Current Key:</span>
                    <span className="font-mono text-slate-200">{currentStored.maskedKey}</span>
                  </div>
                  <button
                    onClick={handleDeleteKey}
                    className="text-red-400 hover:text-red-300 flex items-center gap-1 hover:underline text-xs shrink-0 ml-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              )}

              {/* Form Input */}
              <form onSubmit={handleSaveKey} className="space-y-3">
                {/* Custom Base URL (shown for Custom provider or optional for others) */}
                {(selectedProvider === "custom" || currentPreset.requiresBaseUrl) && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-sky-400" />
                      API Base URL
                    </label>
                    <input
                      type="text"
                      value={baseUrlInput}
                      onChange={(e) => setBaseUrlInput(e.target.value)}
                      placeholder="https://api.openai.com/v1 or http://localhost:11434/v1"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Any OpenAI-compatible endpoint (OpenRouter, Ollama, LM Studio, Together, vLLM, DeepSeek).
                    </p>
                  </div>
                )}

                {/* Model Name */}
                {(selectedProvider === "custom" || currentPreset.popularModels.length > 0) && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Model Identifier / Name
                    </label>
                    <input
                      type="text"
                      value={modelInput}
                      onChange={(e) => setModelInput(e.target.value)}
                      placeholder="e.g. gpt-4o, llama-3.3-70b-versatile, qwen2.5-coder:32b"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                    />
                  </div>
                )}

                {/* API Key */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    {currentStored?.hasKey ? "Update API Key" : "Enter API Key"}
                  </label>
                  <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder={currentPreset.placeholderKey}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Your key is encrypted with AES-256-GCM and stored only in your local database.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading || (!keyInput.trim() && !currentStored?.hasKey)}
                    className="flex-1 px-4 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:hover:bg-sky-500 text-white font-medium text-sm rounded-lg transition flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Key className="w-4 h-4" />
                    )}
                    Save Configuration
                  </button>

                  <button
                    type="button"
                    onClick={handleTestKey}
                    disabled={testing || (!keyInput.trim() && !currentStored?.hasKey)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {testing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    Test Connection
                  </button>
                </div>
              </form>

              {/* Test Result Feedback */}
              {testResult && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                    testResult.success
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                      : "bg-red-500/10 border-red-500/20 text-red-300"
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

              {/* Status Message */}
              {statusMessage && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                    statusMessage.type === "success"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                      : "bg-red-500/10 border-red-500/20 text-red-300"
                  }`}
                >
                  {statusMessage.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
