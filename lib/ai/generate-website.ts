import { BRAND } from "@/config/brand";

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

/**
 * Single shared function for all AI providers to generate website content.
 * Standardizes OpenAI, Gemini, OpenRouter, and custom OpenAI-compatible formats.
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
  } = params;

  if (!apiKey || !apiKey.trim()) {
    throw new Error(`API key is required for ${providerName}.`);
  }

  // 1. Google Gemini format
  if (provider === "gemini") {
    const rawModel = model || "gemini-1.5-pro";
    const cleanedModel = rawModel.replace(/^models\//, "");
    const base = (baseUrl || "https://generativelanguage.googleapis.com/v1beta").replace(/\/+$/, "");
    const url = `${base}/models/${cleanedModel}:generateContent`;

    const contents = [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ];

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: maxTokens,
      },
    };

    if (systemPrompt) {
      body.systemInstruction = {
        parts: [{ text: systemPrompt }],
      };
    }

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey.trim(),
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(120000),
      });
    } catch (fetchErr: any) {
      if (fetchErr.name === "AbortError" || fetchErr.name === "TimeoutError") {
        throw new Error("Request to Gemini API timed out after 120 seconds.");
      }
      throw new Error(`Could not connect to Gemini API endpoint: ${fetchErr.message || "Network error"}`);
    }

    if (!res.ok) {
      const errText = await res.text();
      let errorMsg = `Gemini API error (${res.status}): ${res.statusText}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error?.message) {
          errorMsg = parsed.error.message;
        }
      } catch {
        errorMsg = errText || errorMsg;
      }
      if (res.status === 400 && errorMsg.includes("API key")) {
        throw new Error("Invalid Gemini API key (401/400). Please check your key.");
      } else if (res.status === 429) {
        throw new Error("Gemini quota or rate limit exceeded (429). Please check your account limits.");
      } else if (res.status === 404) {
        throw new Error(`Gemini model '${cleanedModel}' not found (404).`);
      }
      throw new Error(errorMsg);
    }

    let data: any;
    try {
      data = await res.json();
    } catch {
      throw new Error("Malformed response: Gemini returned invalid JSON.");
    }

    const candidate = data.candidates?.[0];
    if (!candidate) {
      throw new Error("Gemini returned no response candidates. Prompt may have triggered safety filters.");
    }

    const text = candidate.content?.parts?.map((p: { text?: string }) => p.text || "").join("") || "";
    if (!text.trim()) {
      if (candidate.finishReason === "SAFETY") {
        throw new Error("Gemini generation was blocked by safety filters. Please adjust the prompt.");
      }
      throw new Error(`Gemini returned an empty response (Finish reason: ${candidate.finishReason || "unknown"}).`);
    }

    return text;
  }

  // 2. OpenAI, OpenRouter, and Custom OpenAI-compatible endpoints
  let endpoint = "https://api.openai.com/v1/chat/completions";
  const defaultModel = provider === "openrouter" ? "anthropic/claude-3.5-sonnet" : "gpt-4o";
  const targetModel = model || defaultModel;
  const extraHeaders: Record<string, string> = {};

  if (provider === "openrouter") {
    endpoint = "https://openrouter.ai/api/v1/chat/completions";
    extraHeaders["HTTP-Referer"] = BRAND.siteUrl;
    extraHeaders["X-Title"] = `${BRAND.name} Website Builder`;
  } else if (baseUrl && (provider === "custom" || provider === "openai" || provider.includes("custom"))) {
    endpoint = resolveChatCompletionsEndpoint(baseUrl);
  }

  if (organizationId && organizationId.trim()) {
    extraHeaders["OpenAI-Organization"] = organizationId.trim();
  }

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const payload = {
    model: targetModel,
    messages,
    temperature: 0.7,
    max_tokens: maxTokens,
  };

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
        ...extraHeaders,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(120000),
    });
  } catch (fetchErr: any) {
    if (fetchErr.name === "AbortError" || fetchErr.name === "TimeoutError") {
      throw new Error(`Request to ${providerName} timed out after 120 seconds.`);
    }
    throw new Error(
      `Could not connect to API endpoint (${endpoint}): ${fetchErr.message || "Network error. Please verify the URL."}`
    );
  }

  if (!res.ok) {
    const errText = await res.text();
    let errorMsg = `${providerName} API error (${res.status}): ${res.statusText}`;
    try {
      const parsed = JSON.parse(errText);
      if (parsed.error?.message) {
        errorMsg = parsed.error.message;
      } else if (parsed.message) {
        errorMsg = parsed.message;
      }
    } catch {
      errorMsg = errText || errorMsg;
    }

    const lowerErr = errorMsg.toLowerCase();
    if (res.status === 401) {
      throw new Error(`Invalid ${providerName} API key (401 Unauthorized). Please check your API credentials.`);
    } else if (res.status === 402 || lowerErr.includes("quota") || lowerErr.includes("credit") || lowerErr.includes("billing")) {
      throw new Error(`Insufficient credits or quota exceeded for ${providerName} (402). Please check your account balance.`);
    } else if (res.status === 404) {
      if (lowerErr.includes("model")) {
        throw new Error(`Model '${targetModel}' not found on ${providerName} (404). Please verify the model identifier.`);
      }
      throw new Error(`Endpoint not found (404) at ${endpoint}. Please verify your Base URL.`);
    } else if (res.status === 429) {
      throw new Error(`Rate limit or credit quota exceeded for ${providerName} (429). Please wait or check your balance.`);
    } else if (res.status >= 500) {
      throw new Error(`Provider unavailable (HTTP ${res.status}: ${res.statusText}). Server is temporarily down.`);
    }

    throw new Error(errorMsg);
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Malformed response from ${providerName}: Response is not valid JSON.`);
  }

  const { content, finishReason } = extractChoiceContent(data);
  if (typeof content !== "string" || !content.trim()) {
    throw new Error(`Malformed response from ${providerName}: Expected valid content in choices[0].message.content.`);
  }

  if (finishReason === "length") {
    console.warn(`[generateWebsite] Warning: Model response reached token limit (${maxTokens}). Output may be truncated.`);
  }

  return content;
}

/**
 * Tests connection with a probe request and verifies response parsing.
 * Never reports success without receiving and parsing a valid response.
 */
export async function testConnection(
  params: TestConnectionParams
): Promise<{ success: boolean; message: string; latencyMs?: number }> {
  const start = Date.now();
  try {
    const {
      provider,
      apiKey,
      model,
      baseUrl,
      organizationId,
      providerName = provider === "custom" ? "Custom AI" : provider.toUpperCase(),
    } = params;

    if (!apiKey || !apiKey.trim()) {
      return { success: false, message: "Please enter an API key to test." };
    }

    if (provider === "custom" && !baseUrl) {
      return { success: false, message: "Please enter an API Base URL for the custom provider." };
    }

    if (provider === "gemini") {
      const rawModel = model || "gemini-1.5-flash";
      const cleanedModel = rawModel.replace(/^models\//, "");
      const base = (baseUrl || "https://generativelanguage.googleapis.com/v1beta").replace(/\/+$/, "");
      const url = `${base}/models/${cleanedModel}:generateContent`;

      let res: Response;
      try {
        res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey.trim(),
          },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: 'Respond ONLY with JSON: {"status": "ok", "provider": "connected"}' }] }],
            generationConfig: { maxOutputTokens: 60 },
          }),
          signal: AbortSignal.timeout(15000),
        });
      } catch (netErr: any) {
        if (netErr.name === "AbortError" || netErr.name === "TimeoutError") {
          return { success: false, message: "Connection timed out after 15s. Endpoint did not respond." };
        }
        return { success: false, message: `Could not reach endpoint: ${netErr.message || "Network error"}` };
      }

      const latencyMs = Date.now() - start;

      if (!res.ok) {
        const errText = await res.text();
        let msg = `HTTP ${res.status}: ${res.statusText}`;
        try {
          const parsed = JSON.parse(errText);
          if (parsed.error?.message) msg = parsed.error.message;
        } catch {}
        if (res.status === 400 && msg.toLowerCase().includes("api key")) {
          return { success: false, message: "Invalid API key (400). Please check your Gemini key." };
        } else if (res.status === 404) {
          return { success: false, message: `Model '${cleanedModel}' not found on Gemini (404).` };
        } else if (res.status === 429) {
          return { success: false, message: "Rate limit exceeded on Gemini (429)." };
        }
        return { success: false, message: msg };
      }

      let data: any;
      try {
        data = await res.json();
      } catch {
        return { success: false, message: "Malformed response: Provider did not return valid JSON." };
      }

      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!reply || typeof reply !== "string") {
        return { success: false, message: "Malformed response: Candidate response was empty." };
      }

      let structuredJsonVerified = false;
      try {
        const cleaned = reply.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
        const parsed = JSON.parse(cleaned);
        if (typeof parsed === "object" && parsed !== null) {
          structuredJsonVerified = true;
        }
      } catch {}

      return {
        success: true,
        message: structuredJsonVerified
          ? `Successfully connected to Google Gemini (${cleanedModel}) in ${latencyMs}ms! Structured JSON verified.`
          : `Successfully connected to Google Gemini (${cleanedModel}) in ${latencyMs}ms!`,
        latencyMs,
      };
    }

    // OpenAI, OpenRouter, and Custom OpenAI-compatible
    let endpoint = "https://api.openai.com/v1/chat/completions";
    const testModel =
      model?.trim() ||
      (provider === "openrouter"
        ? "meta-llama/llama-3.1-8b-instruct:free"
        : provider === "custom"
        ? "llama3"
        : "gpt-4o-mini");

    const extraHeaders: Record<string, string> = {};

    if (provider === "openrouter") {
      endpoint = "https://openrouter.ai/api/v1/chat/completions";
      extraHeaders["HTTP-Referer"] = BRAND.siteUrl;
      extraHeaders["X-Title"] = BRAND.name;
    } else if (baseUrl && (provider === "custom" || provider === "openai" || provider.includes("custom"))) {
      endpoint = resolveChatCompletionsEndpoint(baseUrl);
    }

    if (organizationId && organizationId.trim()) {
      extraHeaders["OpenAI-Organization"] = organizationId.trim();
    }

    let res: Response;
    try {
      res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey.trim()}`,
          ...extraHeaders,
        },
        body: JSON.stringify({
          model: testModel,
          messages: [{ role: "user", content: 'Respond ONLY with JSON: {"status": "ok", "provider": "connected"}' }],
          max_tokens: 60,
        }),
        signal: AbortSignal.timeout(15000),
      });
    } catch (netErr: any) {
      if (netErr.name === "AbortError" || netErr.name === "TimeoutError") {
        return { success: false, message: "Connection timed out after 15s. The endpoint did not respond." };
      }
      return {
        success: false,
        message: `Could not connect to API endpoint (${endpoint}): ${netErr.message || "Network connection failed."}`,
      };
    }

    const latencyMs = Date.now() - start;

    if (!res.ok) {
      const errText = await res.text();
      let msg = `HTTP ${res.status}: ${res.statusText}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error?.message) msg = parsed.error.message;
        else if (parsed.message) msg = parsed.message;
      } catch {}

      const lowerMsg = msg.toLowerCase();
      if (res.status === 401) {
        return { success: false, message: `Invalid API key (401 Unauthorized). Please check your key.` };
      } else if (res.status === 402 || lowerMsg.includes("quota") || lowerMsg.includes("credit") || lowerMsg.includes("billing")) {
        return { success: false, message: `Insufficient credits or quota exceeded (402). Please check your balance.` };
      } else if (res.status === 404) {
        if (lowerMsg.includes("model")) {
          return { success: false, message: `Model '${testModel}' not found on provider (404). Please verify model name.` };
        }
        return { success: false, message: `API endpoint not found (404) at ${endpoint}. Please verify Base URL.` };
      } else if (res.status === 429) {
        return { success: false, message: `Rate limit exceeded (429). Please wait before testing again.` };
      } else if (res.status >= 500) {
        return { success: false, message: `Provider unavailable (HTTP ${res.status}: ${res.statusText}). Server returned error.` };
      }
      return { success: false, message: msg };
    }

    let data: any;
    try {
      data = await res.json();
    } catch {
      return { success: false, message: "Malformed response: Provider did not return valid JSON." };
    }

    const { content } = extractChoiceContent(data);
    if (typeof content !== "string" || !content.trim()) {
      return { success: false, message: "Malformed response: Response contained no valid message content in choices[0]." };
    }

    let structuredJsonVerified = false;
    try {
      const cleaned = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      const parsed = JSON.parse(cleaned);
      if (typeof parsed === "object" && parsed !== null) {
        structuredJsonVerified = true;
      }
    } catch {}

    return {
      success: true,
      message: structuredJsonVerified
        ? `Successfully connected to ${providerName} (${testModel}) in ${latencyMs}ms! Structured JSON verified.`
        : `Successfully connected to ${providerName} (${testModel}) in ${latencyMs}ms!`,
      latencyMs,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Connection failed.",
    };
  }
}
