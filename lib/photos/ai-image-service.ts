/**
 * AI Image Generation Service (RankLocal)
 * 
 * Generates trade-specific, localized commercial photography using either:
 * 1. Configured OpenAI DALL-E credentials (uses existing OpenAI key without extra setup)
 * 2. High-speed, zero-config photorealistic AI generation (Flux engine, zero keys required)
 * 
 * Strict safety rules:
 * 1. Never blocks website generation if AI generation fails or key is missing.
 * 2. Uses realistic, trade-specific, non-hallucinatory commercial contractor prompts.
 * 3. Enforces timeout limits so generation never hangs.
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
  seed?: number | string;
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

/**
 * Builds a zero-configuration photorealistic AI generation URL.
 * Requires no external API keys or paid accounts, producing trade-accurate images instantly.
 */
export function buildZeroConfigAiImageUrl(
  options: GenerateImageOptions,
  seed?: number | string
): string {
  const prompt = buildCommercialImagePrompt(options);
  const cleanPrompt = encodeURIComponent(
    prompt
      .replace(/[^\w\s,.-]/g, " ")
      .trim()
      .replace(/\s+/g, " ")
  );
  const width = options.width || (options.slot === "hero" ? 1200 : 800);
  const height = options.height || (options.slot === "hero" ? 675 : 533);
  const resolvedSeed = seed || options.seed || Math.floor(Math.random() * 999999);

  return `https://image.pollinations.ai/prompt/${cleanPrompt}?width=${width}&height=${height}&nologo=true&model=flux&seed=${resolvedSeed}`;
}

export interface AiImageCredentials {
  apiKey?: string;
  baseUrl?: string;
  provider?: string;
  model?: string;
}

/**
 * Attempts AI image generation using configured AI provider (OpenAI DALL-E or custom endpoint)
 * and falls back seamlessly to the built-in zero-config photorealistic AI engine.
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

  const prompt = buildCommercialImagePrompt(options);

  // 1. If an OpenAI or compatible key is available, attempt DALL-E generation
  if (apiKey) {
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

      if (res.ok) {
        const data = await res.json();
        const candidateUrl = data?.data?.[0]?.url;

        if (candidateUrl) {
          const validation = await validateImageUrl(candidateUrl, 3000);
          if (validation.valid) {
            return {
              url: candidateUrl,
              source: "AI-Generated",
              prompt,
              revisedPrompt: data?.data?.[0]?.revised_prompt,
            };
          }
        }
      }
    } catch (err: any) {
      console.warn(`[AiImage] Dedicated API generation skipped: ${err?.message || "Timeout"}`);
    }
  }

  // 2. Zero-config photorealistic AI fallback (Flux engine)
  // Generates unique, 100% relevant commercial photography without requiring extra API keys
  try {
    const zeroConfigUrl = buildZeroConfigAiImageUrl(options);
    return {
      url: zeroConfigUrl,
      source: "AI-Generated",
      prompt,
    };
  } catch (err: any) {
    console.warn(`[AiImage] Zero-config AI generation fallback failed: ${err?.message}`);
    return null;
  }
}
