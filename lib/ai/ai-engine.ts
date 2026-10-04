/**
 * RankLocal Centralized AI Engine (Standard Internal AI Interface)
 * 
 * Every AI feature in RankLocal (Website Generator, Blog Engine, SEO Optimizer,
 * Location Engine, Content Improver, etc.) calls this single normalized engine.
 * 
 * Flow:
 * Feature Request -> RankLocal AI Engine -> Provider Adapter -> Selected Provider/Model
 * 
 * Features:
 * - Provider-agnostic normalized interface
 * - Capability-aware parameter adaptation
 * - Controlled per-request timeouts
 * - Controlled smart retries with exponential backoff
 * - Multi-provider smart fallback for temporary outages
 * - Full telemetry (provider, model, latency, retries, fallback status)
 */

import {
  SavedProviderProfile,
  ProviderManagerSettings,
  getProviderProfile,
  initializeOrMigrateProviders,
  saveProviderProfile,
  resolveChatEndpoint,
  normalizeBaseUrl,
} from "./provider-manager";
import { BRAND } from "@/config/brand";
import { normalizeModelForProvider, fetchLiveProviderModels } from "./provider-models";

/**
 * Extracts assistant message content from various OpenAI-compatible and proxy formats.
 */
export function extractChoiceContent(data: any): { content: string; finishReason?: string } {
  let finishReason = data?.choices?.[0]?.finish_reason || data?.choices?.[0]?.finishReason;
  let content = "";

  const choice = data?.choices?.[0];
  if (choice) {
    if (typeof choice.message?.content === "string") {
      content = choice.message.content;
    } else if (Array.isArray(choice.message?.content)) {
      content = choice.message.content
        .map((part: any) => (typeof part === "string" ? part : part?.text || ""))
        .join("");
    } else if (typeof choice.text === "string") {
      content = choice.text;
    } else if (choice.message && typeof choice.message === "object") {
      content = choice.message.text || "";
    }
  } else if (Array.isArray(data?.candidates)) {
    const cand = data.candidates[0];
    finishReason = cand?.finishReason;
    content = cand?.content?.parts?.map((p: any) => p?.text || "").join("") || "";
  } else if (Array.isArray(data?.content)) {
    content = data.content.map((p: any) => (typeof p === "string" ? p : p?.text || "")).join("");
  } else if (typeof data?.content === "string") {
    content = data.content;
  }

  return { content, finishReason };
}

export interface NormalizedAIRequest {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "json" | "text";
  timeoutMs?: number;
  retryPolicy?: {
    maxRetries?: number;
    retryDelayMs?: number;
  };
  providerId?: string;
  projectId?: string;
  feature?:
    | "website-generation"
    | "blog"
    | "seo"
    | "location-page"
    | "repair"
    | "quality-review"
    | "general";
  generationId?: string;
  // Direct credentials pass-through when called from stateless client requests
  directCredentials?: {
    provider?: string;
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    organizationId?: string;
    providerName?: string;
  };
}

export interface NormalizedAIResponse {
  text: string;
  content: string; // alias for text
  providerId: string;
  providerName: string;
  model: string;
  durationMs: number;
  retriesAttempted: number;
  fallbackTriggered: boolean;
  parsedJson?: any;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface CapabilityTestResult {
  success: boolean;
  providerId: string;
  providerName: string;
  model: string;
  latencyMs: number;
  capabilities: {
    chatCompletion: boolean;
    structuredJson: boolean;
    systemInstructions: boolean;
  };
  availableModels?: string[];
  message: string;
  error?: string;
}

/**
 * Checks whether an error represents a temporary failure eligible for smart retry or fallback.
 */
export function isTemporaryFailure(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || String(err)).toLowerCase();
  const status = err.status || err.statusCode;

  // Permanent configuration & billing errors: NEVER trigger blind retry or fallback loops
  if (
    status === 401 ||
    status === 402 ||
    status === 403 ||
    msg.includes("401") ||
    msg.includes("402") ||
    msg.includes("unauthorized") ||
    msg.includes("invalid api key") ||
    msg.includes("quota exceeded") ||
    msg.includes("insufficient_quota") ||
    msg.includes("credit_balance_exhausted") ||
    msg.includes("no credits remaining") ||
    msg.includes("insufficient credits") ||
    msg.includes("billing") ||
    msg.includes("credit balance") ||
    msg.includes("model not found") ||
    msg.includes("unknown model")
  ) {
    return false;
  }

  // Temporary network/server issues: ELIGIBLE for retry & fallback
  if (
    err.name === "AbortError" ||
    err.name === "TimeoutError" ||
    msg.includes("timeout") ||
    msg.includes("timed out") ||
    msg.includes("rate limit") ||
    msg.includes("429") ||
    msg.includes("500") ||
    msg.includes("502") ||
    msg.includes("503") ||
    msg.includes("504") ||
    msg.includes("econnreset") ||
    msg.includes("etimedout") ||
    msg.includes("network error") ||
    msg.includes("fetch failed")
  ) {
    return true;
  }

  return false;
}

/**
 * Executes an AI call directly against a specific provider profile with capability adaptation.
 */
async function callProviderProfile(
  profile: SavedProviderProfile,
  request: NormalizedAIRequest,
  targetModel: string,
  timeoutMs: number
): Promise<{ text: string; usage?: any }> {
  const apiKey = (request.directCredentials?.apiKey || profile.apiKey || "").trim();
  if (!apiKey) {
    throw new Error(`API key is required for provider "${profile.name}".`);
  }

  // Capability Adaptation:
  // If provider does not support separate system instructions, prepend cleanly to user prompt
  let finalPrompt = request.prompt;
  let finalSystemPrompt = request.systemPrompt;

  if (profile.capabilities && !profile.capabilities.systemInstructions && finalSystemPrompt) {
    finalPrompt = `[SYSTEM INSTRUCTIONS]\n${finalSystemPrompt}\n\n[USER REQUEST]\n${finalPrompt}`;
    finalSystemPrompt = undefined;
  }

  // 1. Google Gemini Provider
  if (profile.apiType === "gemini") {
    const rawModel = targetModel || "gemini-3.8-flash";
    const cleanedModel = normalizeModelForProvider("gemini", rawModel);
    const base = normalizeBaseUrl(profile.baseUrl || "https://generativelanguage.googleapis.com/v1beta");
    const url = `${base}/models/${cleanedModel}:generateContent`;

    const body: Record<string, unknown> = {
      contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens ?? 14000,
      },
    };

    if (finalSystemPrompt) {
      body.systemInstruction = {
        parts: [{ text: finalSystemPrompt }],
      };
    }

    let res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) {
      const errText = await res.text();
      let errorMsg = `Gemini API error (${res.status}): ${res.statusText}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error?.message) errorMsg = parsed.error.message;
      } catch {}

      // If requested model was deprecated or not supported in v1beta, auto-retry with gemini-2.0-flash or gemini-1.5-flash
      if (
        res.status === 404 ||
        errorMsg.includes("not found for API version") ||
        errorMsg.includes("not supported for generateContent")
      ) {
        const fallbackTarget =
          cleanedModel !== "gemini-3.8-flash" && cleanedModel !== "gemini-2.0-flash"
            ? "gemini-3.8-flash"
            : cleanedModel === "gemini-3.8-flash"
            ? "gemini-2.0-flash"
            : "gemini-1.5-flash";
        console.warn(`[Gemini Provider] Model "${cleanedModel}" returned 404/unsupported in v1beta. Auto-retrying with fallback model "${fallbackTarget}"...`);
        const fallbackUrl = `${base}/models/${fallbackTarget}:generateContent`;
        res = await fetch(fallbackUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(timeoutMs),
        });

        if (!res.ok) {
          const fbErrText = await res.text();
          try {
            const parsed = JSON.parse(fbErrText);
            if (parsed.error?.message) errorMsg = parsed.error.message;
          } catch {}
          throw new Error(errorMsg);
        }
      } else {
        throw new Error(errorMsg);
      }
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;
    if (!text || typeof text !== "string") {
      throw new Error("Gemini returned an empty candidate response.");
    }
    return { text, usage: data.usageMetadata };
  }

  // 2. Anthropic Claude Provider
  if (profile.apiType === "anthropic" || (profile.baseUrl && profile.baseUrl.includes("anthropic.com"))) {
    const rawModel = targetModel || "claude-sonnet-5-5";
    const base = normalizeBaseUrl(profile.baseUrl || "https://api.anthropic.com/v1");
    const url = base.endsWith("/messages") ? base : `${base}/messages`;

    const anthropicMaxTokens = Math.min(request.maxTokens ?? 4000, 8192);

    const body: Record<string, unknown> = {
      model: rawModel,
      messages: [{ role: "user", content: finalPrompt }],
      max_tokens: anthropicMaxTokens,
      temperature: request.temperature ?? 0.7,
    };

    if (finalSystemPrompt) {
      body.system = finalSystemPrompt;
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) {
      const errText = await res.text();
      let errorMsg = `Anthropic API error (${res.status}): ${res.statusText}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error?.message) errorMsg = parsed.error.message;
        else if (parsed.message) errorMsg = parsed.message;
      } catch {}

      if (res.status === 401) {
        throw new Error(`Invalid API key (401 Unauthorized) for Anthropic. Please check your key.`);
      } else if (res.status === 400 && errorMsg.toLowerCase().includes("credit")) {
        throw new Error(`Insufficient credits for Anthropic. Please check your balance.`);
      } else if (res.status === 429) {
        throw new Error(`Rate limit exceeded for Anthropic (429). Please wait before testing again.`);
      }
      throw new Error(errorMsg);
    }

    const data = await res.json();
    const { content } = extractChoiceContent(data);
    if (!content || typeof content !== "string") {
      throw new Error("Anthropic returned an empty response.");
    }
    return { text: content, usage: data.usage };
  }

  // 3. OpenAI, OpenRouter, DeepSeek, & Custom OpenAI-Compatible
  let endpoint = resolveChatEndpoint(profile.baseUrl || "https://api.openai.com/v1");
  const extraHeaders: Record<string, string> = {};

  if (profile.apiType === "openrouter" || endpoint.includes("openrouter.ai")) {
    endpoint = "https://openrouter.ai/api/v1/chat/completions";
    extraHeaders["HTTP-Referer"] = BRAND.siteUrl;
    extraHeaders["X-Title"] = `${BRAND.name} Website Builder`;
  }

  if (profile.organizationId || request.directCredentials?.organizationId) {
    extraHeaders["OpenAI-Organization"] = (profile.organizationId || request.directCredentials?.organizationId)!.trim();
  }

  const messages: Array<{ role: string; content: string }> = [];
  if (finalSystemPrompt) {
    messages.push({ role: "system", content: finalSystemPrompt });
  }
  messages.push({ role: "user", content: finalPrompt });

  const requestedMaxTokens = request.maxTokens ?? 4000;
  const maxTokensClamped = profile.capabilities?.maxTokens
    ? Math.min(requestedMaxTokens, profile.capabilities.maxTokens)
    : Math.min(requestedMaxTokens, 8192);

  const payload: Record<string, any> = {
    model: targetModel,
    messages,
    temperature: request.temperature ?? 0.7,
    max_tokens: maxTokensClamped,
  };

  // Structured output parameter adaptation
  if (request.responseFormat === "json" && profile.capabilities?.structuredJson) {
    // Only send response_format if provider supports it without throwing
    if (profile.apiType !== "openrouter" || targetModel.includes("gpt") || targetModel.includes("deepseek")) {
      payload.response_format = { type: "json_object" };
    }
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    const errText = await res.text();
    let errorMsg = `${profile.name} API error (${res.status}): ${res.statusText}`;
    try {
      const parsed = JSON.parse(errText);
      if (parsed.error?.message) errorMsg = parsed.error.message;
      else if (parsed.message) errorMsg = parsed.message;
    } catch {}

    const lowerErr = errorMsg.toLowerCase();
    if (res.status === 401) {
      throw new Error(`Invalid API key (401 Unauthorized) for ${profile.name}. Please check your key.`);
    } else if (res.status === 402 || lowerErr.includes("quota") || lowerErr.includes("credit") || lowerErr.includes("billing")) {
      throw new Error(`Insufficient credits or quota exceeded for ${profile.name} (402). Please check your balance.`);
    } else if (res.status === 404) {
      if (lowerErr.includes("model") || lowerErr.includes("does not exist")) {
        throw new Error(`Model '${targetModel}' not found on ${profile.name} (404). Please verify the model identifier.`);
      }
      throw new Error(`Endpoint not found (404) at ${endpoint}. Please verify your Base URL.`);
    } else if (res.status === 429) {
      throw new Error(`Rate limit exceeded for ${profile.name} (429). Please wait before testing again.`);
    } else if (res.status >= 500) {
      throw new Error(`Provider unavailable (HTTP ${res.status}: ${res.statusText}). Server returned error.`);
    }

    throw new Error(errorMsg);
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Malformed response from ${profile.name}: Response is not valid JSON.`);
  }

  const { content } = extractChoiceContent(data);
  if (typeof content !== "string" || !content.trim()) {
    throw new Error(`Malformed response from ${profile.name}: Response contained no message content.`);
  }

  return { text: content, usage: data.usage };
}

/**
 * Main Centralized AI Execution Function
 * Used by Website Generator, Blog Engine, SEO, and Quality Refinements.
 */
export async function executeAIRequest(request: NormalizedAIRequest): Promise<NormalizedAIResponse> {
  const startTime = Date.now();
  const { profiles, settings } = await initializeOrMigrateProviders();

  // 1. Resolve Target Provider Profile
  let targetProfile: SavedProviderProfile | undefined;

  // Direct credentials override (stateless client mode)
  if (request.directCredentials?.apiKey) {
    const direct = request.directCredentials;
    const directProvider = (direct.provider || "gemini").toLowerCase();
    targetProfile = {
      id: `direct-${directProvider}`,
      name: direct.providerName || directProvider.toUpperCase(),
      apiType: directProvider === "gemini" ? "gemini" : directProvider === "anthropic" ? "anthropic" : directProvider === "openrouter" ? "openrouter" : "openai-compatible",
      baseUrl: direct.baseUrl,
      apiKey: direct.apiKey!,
      maskedKey: "••••••••",
      model: direct.model || (directProvider === "gemini" ? "gemini-1.5-pro" : directProvider === "anthropic" ? "claude-3-5-sonnet-20241022" : "gpt-4o"),
      enabled: true,
      status: "connected",
      capabilities: {
        chatCompletion: true,
        structuredJson: directProvider !== "anthropic",
        systemInstructions: true,
        maxTokens: directProvider === "anthropic" ? 8192 : 16000,
      },
    };
  } else if (request.providerId) {
    const pid = request.providerId;
    targetProfile = profiles.find(
      (p) =>
        p.id === pid ||
        (p as any).presetId === pid ||
        (p as any).apiType === pid ||
        p.id?.toLowerCase().includes(pid.toLowerCase())
    );
  } else if (request.feature && settings.featureProviders?.[request.feature as keyof typeof settings.featureProviders]) {
    const feat = settings.featureProviders[request.feature as keyof typeof settings.featureProviders];
    if (feat?.providerId) {
      const fpid = feat.providerId;
      targetProfile = profiles.find(
        (p) =>
          p.id === fpid ||
          (p as any).presetId === fpid ||
          (p as any).apiType === fpid ||
          p.id?.toLowerCase().includes(fpid.toLowerCase())
      );
    }
  }

  // Fallback to active global provider
  if (!targetProfile) {
    targetProfile = profiles.find((p) => p.id === settings.activeProviderId && p.apiKey && p.enabled);
  }

  // Fallback to first available enabled provider with key
  if (!targetProfile) {
    targetProfile = profiles.find((p) => p.apiKey && p.enabled);
  }

  if (!targetProfile) {
    throw new Error("No AI provider is connected or configured. Please add an API key in Settings.");
  }

  const targetModel = request.model || settings.activeModel || targetProfile.model;
  const timeoutMs = request.timeoutMs ?? 40000;
  const maxRetries = request.retryPolicy?.maxRetries ?? 1;
  const retryDelayMs = request.retryPolicy?.retryDelayMs ?? 1000;

  let retriesAttempted = 0;
  let lastError: any = null;

  // 2. Primary Provider Execution with Controlled Retries
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        retriesAttempted++;
        console.log(`[RankLocal AI Engine] Retry attempt ${attempt}/${maxRetries} for ${targetProfile.name}...`);
        await new Promise((r) => setTimeout(r, retryDelayMs * attempt));
      }

      const result = await callProviderProfile(targetProfile, request, targetModel, timeoutMs);
      const durationMs = Date.now() - startTime;

      // Update provider last success
      targetProfile.lastSuccessAt = Date.now();
      targetProfile.status = "connected";

      return {
        text: result.text,
        content: result.text,
        providerId: targetProfile.id,
        providerName: targetProfile.name,
        model: targetModel,
        durationMs,
        retriesAttempted,
        fallbackTriggered: false,
        usage: result.usage,
      };
    } catch (err: any) {
      lastError = err;
      console.warn(`[RankLocal AI Engine] ${targetProfile.name} attempt ${attempt + 1} failed:`, err?.message || err);

      // If permanent error, do not retry
      if (!isTemporaryFailure(err)) {
        targetProfile.status = "failed";
        targetProfile.lastError = err?.message || String(err);
        throw err;
      }
    }
  }

  // 3. Smart Fallback Execution (if primary exhausted temporary retries)
  if (settings.smartFallbackEnabled) {
    const fallbackIds = settings.fallbackProviderIds || [];
    const availableFallbacks = fallbackIds
      .map((id) =>
        profiles.find(
          (p) =>
            p.id === id &&
            p.id !== targetProfile!.id &&
            p.apiKey &&
            p.enabled &&
            p.apiKey !== targetProfile!.apiKey &&
            p.model !== "default"
        )
      )
      .filter(Boolean) as SavedProviderProfile[];

    for (const fallbackProfile of availableFallbacks) {
      console.warn("Primary provider failed; fallback provider used.");
      console.log(`[RankLocal AI Engine] Smart Fallback: Switching from ${targetProfile.name} to ${fallbackProfile.name}...`);
      try {
        const fallbackModel = fallbackProfile.model;
        const result = await callProviderProfile(fallbackProfile, request, fallbackModel, Math.min(timeoutMs, 30000));
        const durationMs = Date.now() - startTime;

        fallbackProfile.lastSuccessAt = Date.now();
        fallbackProfile.status = "connected";

        return {
          text: result.text,
          content: result.text,
          providerId: fallbackProfile.id,
          providerName: fallbackProfile.name,
          model: fallbackModel,
          durationMs,
          retriesAttempted,
          fallbackTriggered: true,
          usage: result.usage,
        };
      } catch (fallbackErr: any) {
        console.warn(`[RankLocal AI Engine] Fallback provider ${fallbackProfile.name} also failed:`, fallbackErr?.message || fallbackErr);
      }
    }
  }

  // All retries and fallbacks exhausted
  targetProfile.status = "failed";
  targetProfile.lastError = lastError?.message || "Provider request failed after retries.";
  throw new Error(`AI generation failed on ${targetProfile.name}: ${lastError?.message || "Request timed out or endpoint unavailable."}`);
}

/**
 * Performs a lightweight, comprehensive connection test with latency measurement & capability detection.
 */
export async function testProviderCapabilities(
  profileOrParams: Partial<SavedProviderProfile> & { apiKey: string; model?: string }
): Promise<CapabilityTestResult> {
  const start = Date.now();
  const name = profileOrParams.name || "AI Provider";
  const model = profileOrParams.model || "default";

  try {
    if (!profileOrParams.apiKey || !profileOrParams.apiKey.trim()) {
      return {
        success: false,
        providerId: profileOrParams.id || "test",
        providerName: name,
        model,
        latencyMs: 0,
        capabilities: { chatCompletion: false, structuredJson: false, systemInstructions: false },
        message: "API Key is required to test connection.",
      };
    }

    const testProfile: SavedProviderProfile = {
      id: profileOrParams.id || "test-profile",
      name,
      apiType: profileOrParams.apiType || "openai-compatible",
      baseUrl: profileOrParams.baseUrl,
      apiKey: profileOrParams.apiKey.trim(),
      maskedKey: "••••••••",
      model: profileOrParams.model || "default",
      organizationId: profileOrParams.organizationId,
      enabled: true,
      status: "untested",
      capabilities: { chatCompletion: true, structuredJson: true, systemInstructions: true },
    };

    // Small representative probe with JSON format requirement
    const probeRequest: NormalizedAIRequest = {
      prompt: 'Respond ONLY with JSON: {"status": "ok", "provider": "connected", "verified": true}',
      systemPrompt: "You are a health check diagnostic assistant. Respond only with the requested valid JSON.",
      responseFormat: "json",
      maxTokens: 60,
      timeoutMs: 15000,
    };

    const response = await callProviderProfile(testProfile, probeRequest, testProfile.model, 15000);
    const latencyMs = Date.now() - start;

    // Detect capabilities
    let structuredJsonDetected = false;
    try {
      const clean = response.text.replace(/```(?:json)?\s*/gi, "").replace(/\s*```/g, "").trim();
      const parsed = JSON.parse(clean);
      if (parsed && typeof parsed === "object") {
        structuredJsonDetected = true;
      }
    } catch {}

    const detectedCapabilities = {
      chatCompletion: true,
      structuredJson: structuredJsonDetected,
      systemInstructions: true,
    };

    // Query live available models from provider API
    const rawType = String((profileOrParams as any).presetId || profileOrParams.apiType || testProfile.name || "").toLowerCase();
    const resolvedProviderType =
      rawType.includes("gemini")
        ? "gemini"
        : rawType.includes("openrouter")
        ? "openrouter"
        : rawType.includes("anthropic") || rawType.includes("claude")
        ? "anthropic"
        : rawType.includes("deepseek")
        ? "deepseek"
        : rawType.includes("groq")
        ? "groq"
        : "openai";

    const liveModels = await fetchLiveProviderModels(
      resolvedProviderType,
      testProfile.apiKey,
      testProfile.baseUrl
    ).catch(() => []);

    // If profile has an ID, update its record
    if (profileOrParams.id) {
      await saveProviderProfile({
        ...profileOrParams,
        id: profileOrParams.id,
        name,
        model: testProfile.model,
        availableModels: liveModels.length > 0 ? liveModels : undefined,
        status: "connected",
        lastTestedAt: Date.now(),
        lastSuccessAt: Date.now(),
        latencyMs,
        capabilities: detectedCapabilities,
      });
    }

    return {
      success: true,
      providerId: testProfile.id,
      providerName: name,
      model: testProfile.model,
      availableModels: liveModels.length > 0 ? liveModels : undefined,
      latencyMs,
      capabilities: detectedCapabilities,
      message: structuredJsonDetected
        ? `Connected to ${name} (${testProfile.model}) in ${latencyMs}ms! Structured JSON verified.`
        : `Connected to ${name} (${testProfile.model}) in ${latencyMs}ms!`,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    const causeMsg = err?.cause?.message || err?.cause?.code || "";
    const errorMsg = causeMsg ? `${err?.message || "Connection failed"}: ${causeMsg}` : (err?.message || "Connection failed");

    if (profileOrParams.id) {
      await saveProviderProfile({
        ...profileOrParams,
        id: profileOrParams.id,
        name,
        model: profileOrParams.model || "default",
        status: "failed",
        lastTestedAt: Date.now(),
        lastError: errorMsg,
        latencyMs,
      });
    }

    return {
      success: false,
      providerId: profileOrParams.id || "test",
      providerName: name,
      model,
      latencyMs,
      capabilities: { chatCompletion: false, structuredJson: false, systemInstructions: false },
      message: errorMsg,
      error: errorMsg,
    };
  }
}
