/**
 * RankLocal AI Provider Gateway
 *
 * THE single enforced entry point for every AI request in the application.
 *
 * Architecture:
 *   Feature (route handler)
 *     → providerGateway.request()
 *       → executeAIRequest()   [lib/ai/ai-engine.ts — provider dispatch, retries, fallback]
 *         → callProviderProfile()   [Gemini / Anthropic / OpenAI-compat]
 *
 * Rules enforced here:
 *  1. API keys NEVER leave the server — they are resolved server-side only.
 *  2. Fallback is always logged: "Primary provider failed; fallback provider used."
 *  3. Structured JSON requests are validated before returning.
 *  4. All errors are normalized into GatewayError with a typed reason code.
 *  5. No route handler may call a provider SDK directly.
 */

import { executeAIRequest, NormalizedAIRequest, NormalizedAIResponse } from "./ai-engine";
import { extractAndParseJSON } from "@/lib/generator/validator";

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export type GatewayErrorReason =
  | "invalid_api_key"          // 401 / 403 — bad key, permanent
  | "no_provider_configured"   // No key stored anywhere
  | "provider_unavailable"     // 5xx / network — temporary
  | "rate_limited"             // 429
  | "model_not_found"          // 404 model
  | "timeout"                  // AbortSignal timeout
  | "malformed_response"       // Provider returned unparseable text
  | "json_parse_failed"        // responseFormat=json but content wasn't JSON
  | "unknown";

export class GatewayError extends Error {
  constructor(
    message: string,
    public readonly reason: GatewayErrorReason,
    public readonly providerId?: string,
    public readonly providerName?: string,
    public readonly retriesAttempted?: number
  ) {
    super(message);
    this.name = "GatewayError";
  }
}

// ---------------------------------------------------------------------------
// Request / Response types (thin wrappers — do not duplicate NormalizedAI*)
// ---------------------------------------------------------------------------

export interface GatewayRequest {
  /** The user-facing prompt. */
  prompt: string;
  /** Optional system instruction. */
  systemPrompt?: string;
  /** Force a specific provider profile ID (server-side only). */
  providerId?: string;
  /** Direct server-side credentials (from a route handler that already resolved them). */
  directCredentials?: NormalizedAIRequest["directCredentials"];
  /** Model override (optional — falls back to profile default). */
  model?: string;
  /** "json" → validates that the response is parseable JSON before returning. */
  responseFormat?: "json" | "text";
  /** Milliseconds before aborting. Default 40 000. */
  timeoutMs?: number;
  /** Retry policy. Default maxRetries=1. */
  retryPolicy?: { maxRetries?: number; retryDelayMs?: number };
  /** Max output tokens. */
  maxTokens?: number;
  /** Semantic feature label for routing & telemetry. */
  feature?: NormalizedAIRequest["feature"];
}

export interface GatewayResponse {
  /** Raw text from the provider. */
  text: string;
  /** Parsed JSON (only set when responseFormat="json" succeeds). */
  parsedJson?: unknown;
  /** Which provider ID actually served the request. */
  providerId: string;
  providerName: string;
  model: string;
  durationMs: number;
  retriesAttempted: number;
  /** true when the primary provider failed and a fallback was used. */
  fallbackTriggered: boolean;
}

// ---------------------------------------------------------------------------
// Normalise error reason from raw error
// ---------------------------------------------------------------------------

function classifyError(err: unknown): GatewayErrorReason {
  if (err instanceof GatewayError) return err.reason;
  const msg = ((err as any)?.message || String(err)).toLowerCase();
  const name = ((err as any)?.name || "").toLowerCase();

  if (
    name === "timeouterror" ||
    name === "aborterror" ||
    msg.includes("timeout") ||
    msg.includes("timed out") ||
    msg.includes("aborterror") ||
    msg.includes("aborted") ||
    msg.includes("operation was aborted")
  ) {
    return "timeout";
  }

  if (
    msg.includes("401") ||
    msg.includes("unauthorized") ||
    msg.includes("invalid api key") ||
    msg.includes("invalid_api_key") ||
    msg.includes("api key not valid") ||
    msg.includes("api_key_invalid") ||
    msg.includes("api key invalid") ||
    msg.includes("incorrect api key") ||
    msg.includes("authentication failed")
  ) {
    return "invalid_api_key";
  }

  if (msg.includes("no ai provider") || msg.includes("not configured") || msg.includes("api key is required")) {
    return "no_provider_configured";
  }

  if (msg.includes("429") || msg.includes("rate limit") || msg.includes("quota")) {
    return "rate_limited";
  }

  if (msg.includes("model not found") || msg.includes("does not exist") || msg.includes("404")) {
    return "model_not_found";
  }

  if (
    msg.includes("502") ||
    msg.includes("503") ||
    msg.includes("504") ||
    msg.includes("unavailable") ||
    msg.includes("econnreset") ||
    msg.includes("fetch failed") ||
    msg.includes("network")
  ) {
    return "provider_unavailable";
  }

  if (
    msg.includes("malformed") ||
    msg.includes("empty candidate") ||
    msg.includes("no message content") ||
    msg.includes("empty response")
  ) {
    return "malformed_response";
  }

  if (msg.includes("json") && (msg.includes("parse") || msg.includes("syntaxerror"))) {
    return "json_parse_failed";
  }

  return "unknown";
}

// ---------------------------------------------------------------------------
// Core gateway function
// ---------------------------------------------------------------------------

/**
 * The only function that should be called to make an AI request anywhere in
 * the application. All route handlers must use this instead of calling
 * executeAIRequest / generateWebsite / createAIProvider directly.
 */
export async function gatewayRequest(req: GatewayRequest): Promise<GatewayResponse> {
  const engineRequest: NormalizedAIRequest = {
    prompt: req.prompt,
    systemPrompt: req.systemPrompt,
    providerId: req.providerId,
    directCredentials: req.directCredentials,
    model: req.model,
    responseFormat: req.responseFormat,
    timeoutMs: req.timeoutMs ?? 40000,
    retryPolicy: req.retryPolicy,
    maxTokens: req.maxTokens,
    feature: req.feature,
  };

  let engineResponse: NormalizedAIResponse;
  try {
    engineResponse = await executeAIRequest(engineRequest);
  } catch (err: unknown) {
    if (err instanceof GatewayError) throw err;
    const reason = classifyError(err);
    throw new GatewayError(
      (err as any)?.message || "AI request failed",
      reason
    );
  }

  // Mandatory fallback logging (requirement: exact string)
  if (engineResponse.fallbackTriggered) {
    console.warn("Primary provider failed; fallback provider used.");
    console.warn(
      `[AI Provider Gateway] Primary provider failed; fallback provider used. ` +
      `Serving from: ${engineResponse.providerName} (${engineResponse.model}).`
    );
  }

  // Structured JSON validation
  let parsedJson: unknown | undefined;
  if (req.responseFormat === "json") {
    try {
      parsedJson = extractAndParseJSON(engineResponse.text);
    } catch {
      // Try a plain parse as second attempt
      try {
        const cleaned = engineResponse.text
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/\s*```$/, "")
          .trim();
        parsedJson = JSON.parse(cleaned);
      } catch {
        throw new GatewayError(
          `Provider ${engineResponse.providerName} returned text that could not be parsed as JSON. Raw: ${engineResponse.text.slice(0, 200)}`,
          "json_parse_failed",
          engineResponse.providerId,
          engineResponse.providerName,
          engineResponse.retriesAttempted
        );
      }
    }
  }

  return {
    text: engineResponse.text,
    parsedJson,
    providerId: engineResponse.providerId,
    providerName: engineResponse.providerName,
    model: engineResponse.model,
    durationMs: engineResponse.durationMs,
    retriesAttempted: engineResponse.retriesAttempted,
    fallbackTriggered: engineResponse.fallbackTriggered,
  };
}

// ---------------------------------------------------------------------------
// Convenience wrappers (keep route handlers clean)
// ---------------------------------------------------------------------------

/** Text-only request. */
export async function gatewayText(
  prompt: string,
  options: Omit<GatewayRequest, "prompt" | "responseFormat">
): Promise<GatewayResponse> {
  return gatewayRequest({ ...options, prompt, responseFormat: "text" });
}

/** JSON-mode request — throws GatewayError("json_parse_failed") if unparseable. */
export async function gatewayJson(
  prompt: string,
  options: Omit<GatewayRequest, "prompt" | "responseFormat">
): Promise<GatewayResponse & { parsedJson: unknown }> {
  const response = await gatewayRequest({ ...options, prompt, responseFormat: "json" });
  return response as GatewayResponse & { parsedJson: unknown };
}

/** Returns a plain user-friendly message for a GatewayError reason. */
export function gatewayErrorMessage(err: GatewayError): string {
  switch (err.reason) {
    case "invalid_api_key":
      return `Invalid API key for ${err.providerName ?? "the configured provider"}. Please check your key in Settings.`;
    case "no_provider_configured":
      return "No AI provider is configured. Please add an API key in Settings.";
    case "rate_limited":
      return `Rate limit exceeded for ${err.providerName ?? "the configured provider"}. Please wait and try again.`;
    case "model_not_found":
      return `The selected model was not found on ${err.providerName ?? "the provider"}. Please verify the model name in Settings.`;
    case "timeout":
      return "The AI provider did not respond in time. Please try again.";
    case "provider_unavailable":
      return `${err.providerName ?? "The AI provider"} is temporarily unavailable. Please try again shortly.`;
    case "malformed_response":
      return `${err.providerName ?? "The AI provider"} returned an unreadable response. Please try again.`;
    case "json_parse_failed":
      return `${err.providerName ?? "The AI provider"} returned a response that could not be parsed. Please try again.`;
    default:
      return err.message || "An unexpected AI error occurred.";
  }
}
