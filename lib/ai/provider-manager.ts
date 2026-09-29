/**
 * RankLocal Smart Multi-API Provider Manager
 * 
 * Centralized registry and manager for multiple AI API providers, models,
 * capabilities, active selections, and smart fallback configurations.
 * 
 * Supports:
 * - Multiple saved OpenAI-compatible providers (DeepSeek, Qwen, Mistral, Groq, Ollama, etc.)
 * - OpenRouter, Gemini, Anthropic, Custom endpoints
 * - Connection testing with latency measurement & capability detection
 * - Active provider selection (global & project-level)
 * - Safe API key storage and masking
 * - Zero breaking changes: auto-migrates existing settings seamlessly
 */

import { ProviderType, PROVIDER_PRESETS } from "./types";
import { encryptApiKey, decryptApiKey, maskApiKey } from "./encryption";

async function getDb() {
  if (typeof window === "undefined") {
    try {
      const dbModule = await import("../db");
      return dbModule.db;
    } catch {
      return null;
    }
  }
  return null;
}

export type ProviderApiType =
  | "openai-compatible"
  | "openrouter"
  | "gemini"
  | "anthropic"
  | "custom";

export interface ProviderCapabilities {
  chatCompletion: boolean;
  structuredJson: boolean;
  systemInstructions: boolean;
  streaming?: boolean;
  vision?: boolean;
  maxTokens?: number;
}

export interface SavedProviderProfile {
  id: string;
  name: string;
  apiType: ProviderApiType;
  baseUrl?: string;
  apiKey: string;
  maskedKey: string;
  model: string;
  availableModels?: string[];
  organizationId?: string;
  notes?: string;
  enabled: boolean;
  status: "connected" | "failed" | "untested" | "rate_limited";
  lastTestedAt?: number;
  lastSuccessAt?: number;
  lastError?: string;
  latencyMs?: number;
  capabilities: ProviderCapabilities;
  isPreset?: boolean;
  presetId?: ProviderType;
}

export interface ProviderManagerSettings {
  activeProviderId: string;
  activeModel?: string;
  smartFallbackEnabled: boolean;
  fallbackProviderIds: string[];
  smartRoutingEnabled: boolean;
  featureProviders?: {
    websiteGeneration?: { providerId: string; model?: string };
    blogGeneration?: { providerId: string; model?: string };
    seoOptimization?: { providerId: string; model?: string };
    locationEngine?: { providerId: string; model?: string };
  };
}

const DEFAULT_CAPABILITIES: ProviderCapabilities = {
  chatCompletion: true,
  structuredJson: true,
  systemInstructions: true,
  streaming: false,
  vision: false,
  maxTokens: 8192,
};

/**
 * Default preset providers available out-of-the-box
 */
export const PRESET_PROVIDERS_TEMPLATE: Omit<SavedProviderProfile, "apiKey" | "maskedKey">[] = [
  {
    id: "gemini-default",
    name: "Google Gemini",
    apiType: "gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    model: "gemini-1.5-pro",
    availableModels: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash-exp"],
    enabled: true,
    status: "untested",
    capabilities: { ...DEFAULT_CAPABILITIES, structuredJson: true, maxTokens: 16000 },
    isPreset: true,
    presetId: "gemini",
  },
  {
    id: "openai-default",
    name: "OpenAI",
    apiType: "openai-compatible",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o",
    availableModels: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "o3-mini"],
    enabled: true,
    status: "untested",
    capabilities: { ...DEFAULT_CAPABILITIES, structuredJson: true, maxTokens: 16000 },
    isPreset: true,
    presetId: "openai",
  },
  {
    id: "anthropic-default",
    name: "Anthropic Claude",
    apiType: "anthropic",
    baseUrl: "https://api.anthropic.com/v1",
    model: "claude-3-5-sonnet-20241022",
    availableModels: ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"],
    enabled: true,
    status: "untested",
    capabilities: { ...DEFAULT_CAPABILITIES, structuredJson: false, maxTokens: 8192 },
    isPreset: true,
    presetId: "anthropic",
  },
  {
    id: "openrouter-default",
    name: "OpenRouter",
    apiType: "openrouter",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "anthropic/claude-3.5-sonnet",
    availableModels: [
      "anthropic/claude-3.5-sonnet",
      "deepseek/deepseek-chat",
      "meta-llama/llama-3.3-70b-instruct",
      "openai/gpt-4o",
    ],
    enabled: true,
    status: "untested",
    capabilities: { ...DEFAULT_CAPABILITIES, structuredJson: true, maxTokens: 16000 },
    isPreset: true,
    presetId: "openrouter",
  },
  {
    id: "deepseek-default",
    name: "DeepSeek",
    apiType: "openai-compatible",
    baseUrl: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
    availableModels: ["deepseek-chat", "deepseek-reasoner"],
    enabled: true,
    status: "untested",
    capabilities: { ...DEFAULT_CAPABILITIES, structuredJson: true, maxTokens: 16000 },
    isPreset: true,
    presetId: "deepseek",
  },
  {
    id: "groq-default",
    name: "Groq",
    apiType: "openai-compatible",
    baseUrl: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
    availableModels: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
    enabled: true,
    status: "untested",
    capabilities: { ...DEFAULT_CAPABILITIES, structuredJson: true, maxTokens: 8192 },
    isPreset: true,
    presetId: "groq",
  },
];

/**
 * Normalizes any provider base URL to ensure valid protocol and standard endpoints
 */
export function normalizeBaseUrl(url?: string): string {
  if (!url || !url.trim()) return "https://api.openai.com/v1";
  let trimmed = url.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }
  return trimmed;
}

/**
 * Resolves standard OpenAI chat completions endpoint from base URL
 */
export function resolveChatEndpoint(baseUrl: string): string {
  const norm = normalizeBaseUrl(baseUrl);
  if (norm.endsWith("/chat/completions")) return norm;
  return `${norm}/chat/completions`;
}

/**
 * Safe in-memory store for server runtime (backed by SQLite/DB or env)
 */
let inMemoryProfiles: Map<string, SavedProviderProfile> = new Map();
let inMemorySettings: ProviderManagerSettings = {
  activeProviderId: "gemini-default",
  smartFallbackEnabled: true,
  fallbackProviderIds: ["openai-default", "openrouter-default", "deepseek-default"],
  smartRoutingEnabled: false,
};

/**
 * Migrates existing single-key configurations from database or environment into provider profiles.
 */
export async function initializeOrMigrateProviders(): Promise<{
  profiles: SavedProviderProfile[];
  settings: ProviderManagerSettings;
}> {
  // If already populated in memory, return
  if (inMemoryProfiles.size > 0) {
    return {
      profiles: Array.from(inMemoryProfiles.values()),
      settings: inMemorySettings,
    };
  }

  // 1. Populate defaults
  for (const tmpl of PRESET_PROVIDERS_TEMPLATE) {
    inMemoryProfiles.set(tmpl.id, {
      ...tmpl,
      apiKey: "",
      maskedKey: "",
    });
  }

  // 2. Load keys from DB ApiKey records if present
  try {
    const database = await getDb();
    const records = database ? await database.apiKey.findMany() : [];
    for (const rec of records) {
      const decrypted = decryptApiKey({
        encryptedKey: rec.encryptedKey,
        iv: rec.iv,
        tag: rec.tag,
      });

      if (decrypted && decrypted.trim()) {
        const pType = rec.provider as ProviderType;
        const profileId = rec.provider === "custom" ? "custom-default" : `${rec.provider}-default`;
        const existing = inMemoryProfiles.get(profileId);

        if (existing) {
          existing.apiKey = decrypted.trim();
          existing.maskedKey = maskApiKey(decrypted.trim());
          if (rec.baseUrl) existing.baseUrl = rec.baseUrl;
          if (rec.defaultModel) existing.model = rec.defaultModel;
          if (rec.organizationId) existing.organizationId = rec.organizationId;
          if (rec.providerName) existing.name = rec.providerName;
          existing.status = "connected";
        } else {
          // Custom or additional provider
          inMemoryProfiles.set(profileId, {
            id: profileId,
            name: rec.providerName || rec.provider.toUpperCase(),
            apiType: rec.provider === "gemini" ? "gemini" : rec.provider === "anthropic" ? "anthropic" : "openai-compatible",
            baseUrl: rec.baseUrl || "https://api.openai.com/v1",
            apiKey: decrypted.trim(),
            maskedKey: maskApiKey(decrypted.trim()),
            model: rec.defaultModel || "gpt-4o",
            organizationId: rec.organizationId || undefined,
            enabled: true,
            status: "connected",
            capabilities: { ...DEFAULT_CAPABILITIES },
          });
        }
      }
    }
  } catch (err) {
    console.warn("[ProviderManager] DB read skipped, checking env vars:", err);
  }

  // 3. Fallback to Environment Variables
  const envKeys: Record<string, string | undefined> = {
    "gemini-default": process.env.GEMINI_API_KEY,
    "openai-default": process.env.OPENAI_API_KEY,
    "openrouter-default": process.env.OPENROUTER_API_KEY,
    "deepseek-default": process.env.DEEPSEEK_API_KEY,
    "groq-default": process.env.GROQ_API_KEY,
  };

  for (const [id, key] of Object.entries(envKeys)) {
    const prof = inMemoryProfiles.get(id);
    if (prof && !prof.apiKey && key && key.trim()) {
      prof.apiKey = key.trim();
      prof.maskedKey = maskApiKey(key.trim());
      prof.status = "connected";
    }
  }

  // Check Custom AI env
  if (process.env.CUSTOM_AI_API_KEY) {
    inMemoryProfiles.set("custom-env", {
      id: "custom-env",
      name: process.env.CUSTOM_AI_PROVIDER_NAME || "Custom AI",
      apiType: "openai-compatible",
      baseUrl: process.env.CUSTOM_AI_BASE_URL || "https://api.openai.com/v1",
      apiKey: process.env.CUSTOM_AI_API_KEY.trim(),
      maskedKey: maskApiKey(process.env.CUSTOM_AI_API_KEY.trim()),
      model: process.env.CUSTOM_AI_MODEL || "llama3",
      organizationId: process.env.CUSTOM_AI_ORG_ID,
      enabled: true,
      status: "connected",
      capabilities: { ...DEFAULT_CAPABILITIES },
    });
  }

  // 4. Select active provider
  const connectedProfiles = Array.from(inMemoryProfiles.values()).filter((p) => p.apiKey && p.enabled);
  if (connectedProfiles.length > 0) {
    inMemorySettings.activeProviderId = connectedProfiles[0].id;
    inMemorySettings.activeModel = connectedProfiles[0].model;
    inMemorySettings.fallbackProviderIds = connectedProfiles.slice(1).map((p) => p.id);
  }

  return {
    profiles: Array.from(inMemoryProfiles.values()),
    settings: inMemorySettings,
  };
}

/**
 * Gets a saved provider profile by ID
 */
export async function getProviderProfile(id: string): Promise<SavedProviderProfile | undefined> {
  await initializeOrMigrateProviders();
  return inMemoryProfiles.get(id);
}

/**
 * Lists all configured provider profiles with sensitive API keys safely masked
 */
export async function listProviderProfiles(): Promise<{
  profiles: Array<Omit<SavedProviderProfile, "apiKey"> & { hasKey: boolean }>;
  settings: ProviderManagerSettings;
}> {
  const { profiles, settings } = await initializeOrMigrateProviders();

  const safeProfiles = profiles.map((p) => {
    const { apiKey, ...safe } = p;
    return {
      ...safe,
      hasKey: Boolean(apiKey && apiKey.trim().length > 0),
      maskedKey: p.maskedKey || (apiKey ? maskApiKey(apiKey) : ""),
    };
  });

  return { profiles: safeProfiles, settings };
}

/**
 * Saves or updates a provider profile. Encrypts and persists to SQLite/DB when available.
 */
export async function saveProviderProfile(profile: Partial<SavedProviderProfile> & { name: string; model: string }): Promise<SavedProviderProfile> {
  await initializeOrMigrateProviders();

  const id = profile.id || `custom-${Date.now()}`;
  const existing = inMemoryProfiles.get(id);

  const rawKey = profile.apiKey?.trim() || existing?.apiKey || "";
  const masked = maskApiKey(rawKey);

  const updated: SavedProviderProfile = {
    id,
    name: profile.name.trim(),
    apiType: profile.apiType || existing?.apiType || "openai-compatible",
    baseUrl: profile.baseUrl?.trim() || existing?.baseUrl,
    apiKey: rawKey,
    maskedKey: masked,
    model: profile.model.trim(),
    availableModels: profile.availableModels || existing?.availableModels || [profile.model.trim()],
    organizationId: profile.organizationId?.trim() || existing?.organizationId,
    notes: profile.notes?.trim() || existing?.notes,
    enabled: profile.enabled !== undefined ? profile.enabled : true,
    status: profile.status || existing?.status || (rawKey ? "connected" : "untested"),
    lastTestedAt: profile.lastTestedAt || existing?.lastTestedAt,
    lastSuccessAt: profile.lastSuccessAt || existing?.lastSuccessAt,
    lastError: profile.lastError,
    latencyMs: profile.latencyMs || existing?.latencyMs,
    capabilities: profile.capabilities || existing?.capabilities || { ...DEFAULT_CAPABILITIES },
    isPreset: existing?.isPreset,
    presetId: existing?.presetId,
  };

  inMemoryProfiles.set(id, updated);

  // Persist encrypted record into database
  if (rawKey && !rawKey.includes("••••")) {
    try {
      const database = await getDb();
      if (database) {
        const encrypted = encryptApiKey(rawKey);
        await database.apiKey.upsert({
          where: { provider: id },
          create: {
            provider: id,
            encryptedKey: encrypted.encryptedKey,
            iv: encrypted.iv,
            tag: encrypted.tag,
            baseUrl: updated.baseUrl,
            defaultModel: updated.model,
            organizationId: updated.organizationId,
            providerName: updated.name,
          },
          update: {
            encryptedKey: encrypted.encryptedKey,
            iv: encrypted.iv,
            tag: encrypted.tag,
            baseUrl: updated.baseUrl,
            defaultModel: updated.model,
            organizationId: updated.organizationId,
            providerName: updated.name,
          },
        });
      }
    } catch (dbErr) {
      console.warn("[ProviderManager] DB persistence skipped (in-memory mode):", dbErr);
    }
  }

  return updated;
}

/**
 * Deletes a provider profile
 */
export async function deleteProviderProfile(id: string): Promise<boolean> {
  await initializeOrMigrateProviders();
  inMemoryProfiles.delete(id);

  try {
    const database = await getDb();
    if (database) {
      await database.apiKey.delete({
        where: { provider: id },
      });
    }
  } catch {}

  // If deleted profile was active, switch to next available
  if (inMemorySettings.activeProviderId === id) {
    const remaining = Array.from(inMemoryProfiles.values()).filter((p) => p.apiKey && p.enabled);
    if (remaining.length > 0) {
      inMemorySettings.activeProviderId = remaining[0].id;
      inMemorySettings.activeModel = remaining[0].model;
    }
  }

  return true;
}

/**
 * Updates manager settings (active provider, smart fallback toggle, priority list)
 */
export async function updateProviderSettings(settings: Partial<ProviderManagerSettings>): Promise<ProviderManagerSettings> {
  await initializeOrMigrateProviders();

  if (settings.activeProviderId && inMemoryProfiles.has(settings.activeProviderId)) {
    inMemorySettings.activeProviderId = settings.activeProviderId;
    const prof = inMemoryProfiles.get(settings.activeProviderId);
    if (prof) {
      inMemorySettings.activeModel = settings.activeModel || prof.model;
    }
  }

  if (settings.smartFallbackEnabled !== undefined) {
    inMemorySettings.smartFallbackEnabled = settings.smartFallbackEnabled;
  }

  if (Array.isArray(settings.fallbackProviderIds)) {
    inMemorySettings.fallbackProviderIds = settings.fallbackProviderIds.filter((id) => inMemoryProfiles.has(id));
  }

  if (settings.smartRoutingEnabled !== undefined) {
    inMemorySettings.smartRoutingEnabled = settings.smartRoutingEnabled;
  }

  if (settings.featureProviders) {
    inMemorySettings.featureProviders = {
      ...inMemorySettings.featureProviders,
      ...settings.featureProviders,
    };
  }

  return inMemorySettings;
}
