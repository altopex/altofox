/**
 * AI Image Generation Fallback Service (RankLocal)
 * 
 * When external stock image searches fail or are blocked, this service generates
 * trade-specific, localized commercial photography using the existing configured AI credentials.
 * 
 * Strict safety rules:
 * 1. Never blocks website generation if AI image fails or key is missing.
 * 2. Uses realistic, trade-specific, non-hallucinatory prompts.
 * 3. Enforces timeout limits so generation does not hang.
 */

import { getProviderCredentials } from "../ai/keys";
import { validateImageUrl } from "./image-validator";

export interface GenerateImageOptions {
  trade: string;
  service?: string;
  location?: string;
  slot?: "hero" | "service" | "about" | "gallery" | "avatar" | "trust";
  width?: number;
  height?: number;
}

export interface GeneratedImageResult {
  url: string;
  source: "AI-Generated";
  prompt: string;
  revisedPrompt?: string;
}

/**
 * Builds a natural, realistic commercial photography prompt
 */
export function buildCommercialImagePrompt(options: GenerateImageOptions): string {
  const trade = (options.trade || "contractor").trim();
  const service = (options.service || trade).trim();
  const location = (options.location || "").trim();
  const slot = options.slot || "service";

  const framing =
    slot === "hero"
      ? "Wide horizontal architectural shot, eye-level framing, natural daylight"
      : slot === "about"
      ? "Professional craftsman with clean uniform and toolbelt, approachable, authentic"
      : "Close-up action shot of service tools and clean workmanship";

  const locContext = location ? ` for a residential property in ${location}` : "";

  return `Commercial photography of professional ${trade} work, specifically ${service}${locContext}. ${framing}, realistic lighting, modern clean equipment, natural textures, 4k commercial photography, no text, no logos, no watermarks.`;
}

export interface AiImageCredentials {
  apiKey?: string;
  baseUrl?: string;
  provider?: string;
  model?: string;
}

/**
 * Attempts AI image generation using configured AI provider (OpenAI DALL-E or custom OpenAI-compatible endpoint)
 */
export async function tryGenerateAiImage(
  options: GenerateImageOptions,
  credentialsOrKey?: string | AiImageCredentials,
  timeoutMs: number = 8000
): Promise<GeneratedImageResult | null> {
  let apiKey = typeof credentialsOrKey === "string" ? credentialsOrKey.trim() : credentialsOrKey?.apiKey?.trim();
  let baseUrl = typeof credentialsOrKey === "object" ? credentialsOrKey?.baseUrl?.trim() : undefined;

  if (!apiKey) {
    try {
      // Check custom provider first, then openai
      const customCreds = await getProviderCredentials("custom");
      if (customCreds?.apiKey) {
        apiKey = customCreds.apiKey;
        baseUrl = customCreds.baseUrl || baseUrl;
      } else {
        const openaiCreds = await getProviderCredentials("openai");
        if (openaiCreds?.apiKey) {
          apiKey = openaiCreds.apiKey;
        }
      }
    } catch {
      // Key lookup optional
    }
  }

  if (!apiKey && process.env.OPENAI_API_KEY) {
    apiKey = process.env.OPENAI_API_KEY.trim();
  }

  if (!apiKey) {
    return null; // AI image generation key not present; skip to local fallback
  }

  const prompt = buildCommercialImagePrompt(options);

  // Compute endpoint: custom base URL if provided, otherwise standard OpenAI
  let endpoint = "https://api.openai.com/v1/images/generations";
  if (baseUrl) {
    endpoint = baseUrl.endsWith("/images/generations")
      ? baseUrl
      : `${baseUrl.replace(/\/+$/, "")}/images/generations`;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-2", // Fast, reliable generation with low latency
        prompt,
        n: 1,
        size: options.slot === "hero" ? "1024x1024" : "512x512",
        response_format: "url",
      }),
    });

    clearTimeout(timer);

    if (!res.ok) {
      console.warn(`[AiImage] OpenAI returned status ${res.status}`);
      return null;
    }

    const data = await res.json();
    const candidateUrl = data?.data?.[0]?.url;

    if (!candidateUrl) {
      return null;
    }

    // Validate generated image URL
    const validation = await validateImageUrl(candidateUrl, 3000);
    if (!validation.valid) {
      return null;
    }

    return {
      url: candidateUrl,
      source: "AI-Generated",
      prompt,
      revisedPrompt: data?.data?.[0]?.revised_prompt,
    };
  } catch (err: any) {
    console.warn(`[AiImage] Image generation skipped: ${err?.message || "Timeout"}`);
    return null;
  }
}
