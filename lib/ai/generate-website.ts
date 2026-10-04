import { BRAND } from "@/config/brand";
import { testProviderCapabilities } from "./ai-engine";
import { gatewayRequest } from "./provider-gateway";

export interface GenerateWebsiteParams {
  provider: "openai" | "gemini" | "openrouter" | "custom" | string;
  apiKey: string;
  model: string;
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  baseUrl?: string;
  organizationId?: string;
  providerName?: string;
  timeoutMs?: number;
}

export interface TestConnectionParams {
  provider: "openai" | "gemini" | "openrouter" | "custom" | string;
  apiKey: string;
  model?: string;
  baseUrl?: string;
  organizationId?: string;
  providerName?: string;
}

/**
 * Resolves standard OpenAI-compatible chat completions endpoint from custom baseUrl.
 * Correctly handles /v1, /chat/completions, and trailing slashes.
 */
export function resolveChatCompletionsEndpoint(baseUrl?: string): string {
  if (!baseUrl || !baseUrl.trim()) return "https://api.openai.com/v1/chat/completions";
  const url = baseUrl.trim().replace(/\/+$/, "");
  if (url.endsWith("/chat/completions")) {
    return url;
  }
  if (url.endsWith("/v1")) {
    return `${url}/chat/completions`;
  }
  if (url.includes("/v1/")) {
    return `${url}/chat/completions`;
  }
  return `${url}/chat/completions`;
}

/**
 * Re-export extractChoiceContent from centralized engine for backwards compatibility
 */
export { extractChoiceContent } from "./ai-engine";

/**
 * Single shared function for all AI providers to generate website content.
 * Standardizes OpenAI, Gemini, OpenRouter, and custom OpenAI-compatible formats.
 * Routes directly through the centralized RankLocal AI Engine.
 */
export async function generateWebsite(params: GenerateWebsiteParams): Promise<string> {
  const {
    provider,
    apiKey,
    model,
    prompt,
    systemPrompt,
    maxTokens = 16000,
    baseUrl,
    organizationId,
    providerName = provider.toUpperCase(),
    timeoutMs = 45000,
  } = params;

  if (!apiKey || !apiKey.trim()) {
    throw new Error(`API key is required for ${providerName}.`);
  }

  const response = await gatewayRequest({
    prompt,
    systemPrompt,
    model,
    maxTokens,
    timeoutMs,
    directCredentials: {
      provider,
      apiKey: apiKey.trim(),
      baseUrl,
      model,
      organizationId,
      providerName,
    },
  });

  return response.text;
}


/**
 * Tests connection with a probe request and verifies response parsing and capabilities.
 * Routes directly through the centralized RankLocal AI Engine.
 */
export async function testConnection(
  params: TestConnectionParams
): Promise<{ success: boolean; message: string; latencyMs?: number; capabilities?: any }> {
  try {
    const result = await testProviderCapabilities({
      apiType: params.provider === "gemini" ? "gemini" : params.provider === "openrouter" ? "openrouter" : "openai-compatible",
      apiKey: params.apiKey,
      model: params.model,
      baseUrl: params.baseUrl,
      organizationId: params.organizationId,
      name: params.providerName || params.provider.toUpperCase(),
    });

    return {
      success: result.success,
      message: result.message,
      latencyMs: result.latencyMs,
      capabilities: result.capabilities,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Connection probe failed.",
    };
  }
}

