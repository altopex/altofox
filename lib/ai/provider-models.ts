import { ProviderType } from "./types";

export interface ModelOption {
  id: string;
  label: string;
  description?: string;
  isRecommended?: boolean;
}

/**
 * Modern curated model presets for all supported providers.
 */
export const CURATED_PROVIDER_MODELS: Record<ProviderType, ModelOption[]> = {
  gemini: [
    {
      id: "gemini-3.8-flash",
      label: "Gemini 3.8 Flash (Recommended)",
      description: "Flagship workhorse for software engineering and agentic workflows",
      isRecommended: true,
    },
    {
      id: "gemini-3.8-flash-cyber",
      label: "Gemini 3.8 Flash Cyber",
      description: "Specialized for vulnerability detection, security auditing, and code hardening",
    },
    {
      id: "gemini-3.8-pro",
      label: "Gemini 3.8 Pro",
      description: "Frontier multimodal reasoning with extended thinking capabilities",
    },
    {
      id: "gemini-2.5-flash",
      label: "Gemini 2.5 Flash",
      description: "Advanced hybrid reasoning & next-generation architecture",
    },
    {
      id: "gemini-2.0-flash",
      label: "Gemini 2.0 Flash",
      description: "Sub-second latency and high-volume generation",
    },
    {
      id: "gemini-1.5-flash",
      label: "Gemini 1.5 Flash",
      description: "High-throughput, fast and reliable generation",
    },
    {
      id: "gemini-1.5-pro",
      label: "Gemini 1.5 Pro",
      description: "Deep reasoning with 2M token context window",
    },
  ],
  openai: [
    {
      id: "gpt-6-astra",
      label: "GPT-6 Astra (Recommended)",
      description: "Frontier flagship model for advanced reasoning, coding, and architecture",
      isRecommended: true,
    },
    {
      id: "gpt-6-sol",
      label: "GPT-6 Sol",
      description: "High-performance coding and agentic workflows",
    },
    {
      id: "gpt-6-luna",
      label: "GPT-6 Luna",
      description: "Cost-sensitive, high-volume AI generation",
    },
    {
      id: "gpt-4o",
      label: "GPT-4o",
      description: "High-intelligence flagship model with excellent structured output",
    },
    {
      id: "gpt-4o-mini",
      label: "GPT-4o Mini",
      description: "Affordable, rapid generation tailored for multi-page static sites",
    },
    {
      id: "o3-mini",
      label: "o3-mini",
      description: "High-speed reasoning model with deep logic",
    },
    {
      id: "o1",
      label: "o1",
      description: "Full reasoning & deep problem solving",
    },
  ],
  anthropic: [
    {
      id: "claude-sonnet-5-5",
      label: "Claude Sonnet 5.5 (Recommended)",
      description: "30% faster frontier professional coding, HTML synthesis, and copy",
      isRecommended: true,
    },
    {
      id: "claude-opus-5-5",
      label: "Claude Opus 5.5",
      description: "1M-token frontier deep reasoning & complex system architecture",
    },
    {
      id: "claude-fable-5-1",
      label: "Claude Fable 5.1",
      description: "Demanding reasoning and long-running autonomous agents",
    },
    {
      id: "claude-3-7-sonnet-20250219",
      label: "Claude 3.7 Sonnet (Hybrid Reasoning)",
      description: "State-of-the-art coding, design tokens, and HTML generation",
    },
    {
      id: "claude-3-5-sonnet-20241022",
      label: "Claude 3.5 Sonnet",
      description: "Production workhorse",
    },
    {
      id: "claude-3-5-haiku-20241022",
      label: "Claude 3.5 Haiku",
      description: "Sub-second generation and responsive copy",
    },
  ],
  deepseek: [
    {
      id: "deepseek-v4.1-flash",
      label: "DeepSeek V4.1-Flash (Recommended)",
      description: "Multimodal mixture-of-experts model with Causal Encoder-Decoder architecture",
      isRecommended: true,
    },
    {
      id: "deepseek-chat",
      label: "DeepSeek-V3",
      description: "671B MoE model delivering outstanding code & web generation",
    },
    {
      id: "deepseek-reasoner",
      label: "DeepSeek-R1",
      description: "Open-weight reasoning and chain-of-thought model",
    },
  ],
  groq: [
    {
      id: "llama-3.3-70b-versatile",
      label: "Llama 3.3 70B Versatile (Recommended)",
      description: "Top-tier open model running near-instant on Groq LPUs (300+ tok/s)",
      isRecommended: true,
    },
    {
      id: "llama-3.1-8b-instant",
      label: "Llama 3.1 8B Instant",
      description: "Sub-second responses for lightning-fast prototyping",
    },
    {
      id: "deepseek-r1-distill-llama-70b",
      label: "DeepSeek-R1 70B (Groq)",
      description: "Reasoning model running at Groq hardware speed",
    },
    {
      id: "mixtral-8x7b-32768",
      label: "Mixtral 8x7B",
      description: "Balanced open model",
    },
  ],
  openrouter: [
    {
      id: "google/gemini-3.8-flash",
      label: "Gemini 3.8 Flash via OpenRouter (Recommended)",
      description: "Flagship agentic and coding performance",
      isRecommended: true,
    },
    {
      id: "openai/gpt-6-astra",
      label: "GPT-6 Astra via OpenRouter",
      description: "Frontier reasoning and professional synthesis",
    },
    {
      id: "anthropic/claude-sonnet-5.5",
      label: "Claude Sonnet 5.5 via OpenRouter",
      description: "Fast frontier coding and design",
    },
    {
      id: "deepseek/deepseek-v4.1-flash",
      label: "DeepSeek V4.1-Flash via OpenRouter",
      description: "Next-gen multimodal MoE",
    },
    {
      id: "anthropic/claude-3.5-sonnet",
      label: "Claude 3.5 Sonnet via OpenRouter",
      description: "Top-tier web design & code quality",
    },
    {
      id: "openai/gpt-4o",
      label: "GPT-4o via OpenRouter",
      description: "OpenAI flagship",
    },
  ],
  custom: [
    { id: "llama3.3", label: "Llama 3.3" },
    { id: "qwen2.5-coder", label: "Qwen 2.5 Coder" },
    { id: "mistral-large", label: "Mistral Large" },
  ],
};

/**
 * Normalizes model names across providers.
 * Automatically resolves deprecated experimental aliases like `gemini-2.0-flash-exp` to active GA names.
 */
export function normalizeModelForProvider(provider: string, model: string): string {
  if (!model || model === "default" || model.trim() === "") {
    if (provider.includes("gemini")) return "gemini-3.8-flash";
    if (provider.includes("openai")) return "gpt-6-astra";
    if (provider.includes("anthropic")) return "claude-sonnet-5-5";
    if (provider.includes("deepseek")) return "deepseek-v4.1-flash";
    if (provider.includes("groq")) return "llama-3.3-70b-versatile";
    if (provider.includes("openrouter")) return "google/gemini-3.8-flash";
    return "default";
  }

  const raw = model.trim();

  if (provider.includes("gemini")) {
    const cleaned = raw.replace(/^models\//, "");
    // Deprecated experimental aliases remapping
    if (cleaned === "gemini-2.0-flash-exp") {
      return "gemini-3.8-flash";
    }
    if (cleaned === "gemini-2.0-pro-exp") {
      return "gemini-3.8-pro";
    }
    if (cleaned === "gemini-2.0-flash-thinking-exp") {
      return "gemini-3.8-flash";
    }
    return cleaned;
  }

  return raw;
}

/**
 * Dynamically queries the provider's remote API to discover all live models available
 * to the user's specific API key.
 */
export async function fetchLiveProviderModels(
  provider: ProviderType | string,
  apiKey: string,
  baseUrl?: string
): Promise<string[]> {
  if (!apiKey || !apiKey.trim()) return [];

  const cleanKey = apiKey.trim();

  // 1. Google Gemini Live Model Discovery
  if (provider === "gemini") {
    try {
      const base = baseUrl ? baseUrl.replace(/\/+$/, "") : "https://generativelanguage.googleapis.com/v1beta";
      const url = `${base}/models?key=${cleanKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) return [];

      const data = await res.json();
      const rawList: any[] = data.models || [];

      // Filter for models supporting generateContent and containing "gemini"
      const models = rawList
        .filter((m) => {
          const name: string = m.name || "";
          const methods: string[] = m.supportedGenerationMethods || [];
          return name.includes("gemini") && methods.includes("generateContent");
        })
        .map((m) => String(m.name).replace(/^models\//, ""));

      // Priority sort: gemini-3.8, gemini-2.5, gemini-2.0, gemini-1.5
      const priorityOrder = [
        "gemini-3.8-flash",
        "gemini-3.8-flash-cyber",
        "gemini-3.8-pro",
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
      ];

      const sorted = [...models].sort((a, b) => {
        const idxA = priorityOrder.indexOf(a);
        const idxB = priorityOrder.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
      });

      // Ensure recommended models are always present
      if (!sorted.includes("gemini-3.8-flash")) sorted.unshift("gemini-3.8-flash");
      if (!sorted.includes("gemini-2.0-flash")) sorted.push("gemini-2.0-flash");
      if (!sorted.includes("gemini-1.5-flash")) sorted.push("gemini-1.5-flash");

      return Array.from(new Set(sorted));
    } catch (err) {
      console.warn("[Provider Models] Failed to query live Gemini models:", err);
      return [];
    }
  }

  // 2. OpenAI Live Model Discovery
  if (provider === "openai") {
    try {
      const base = baseUrl ? baseUrl.replace(/\/+$/, "") : "https://api.openai.com/v1";
      const url = `${base}/models`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${cleanKey}` },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return [];

      const data = await res.json();
      const rawList: any[] = data.data || [];

      const chatModels = rawList
        .map((m) => String(m.id))
        .filter((id) => {
          const lower = id.toLowerCase();
          return (
            (lower.startsWith("gpt-") || lower.startsWith("o1") || lower.startsWith("o3") || lower.startsWith("chatgpt")) &&
            !lower.includes("realtime") &&
            !lower.includes("audio") &&
            !lower.includes("embedding") &&
            !lower.includes("dall-e") &&
            !lower.includes("tts") &&
            !lower.includes("whisper")
          );
        });

      const priorityOrder = ["gpt-4o", "gpt-4o-mini", "gpt-4.5-preview", "o3-mini", "o1", "gpt-4-turbo"];
      const sorted = Array.from(new Set(chatModels)).sort((a, b) => {
        const idxA = priorityOrder.indexOf(a);
        const idxB = priorityOrder.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
      });

      return sorted.slice(0, 20);
    } catch (err) {
      console.warn("[Provider Models] Failed to query live OpenAI models:", err);
      return [];
    }
  }

  // 3. OpenRouter Live Model Discovery
  if (provider === "openrouter") {
    try {
      const url = "https://openrouter.ai/api/v1/models";
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${cleanKey}` },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return [];

      const data = await res.json();
      const rawList: any[] = data.data || [];
      const ids = rawList.map((m) => String(m.id)).filter(Boolean);
      return ids.slice(0, 30);
    } catch (err) {
      console.warn("[Provider Models] Failed to query live OpenRouter models:", err);
      return [];
    }
  }

  // 4. Groq Live Model Discovery
  if (provider === "groq") {
    try {
      const base = baseUrl ? baseUrl.replace(/\/+$/, "") : "https://api.groq.com/openai/v1";
      const url = `${base}/models`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${cleanKey}` },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return [];

      const data = await res.json();
      const rawList: any[] = data.data || [];
      return rawList.map((m) => String(m.id)).filter(Boolean);
    } catch (err) {
      console.warn("[Provider Models] Failed to query live Groq models:", err);
      return [];
    }
  }

  // 5. DeepSeek Live Model Discovery
  if (provider === "deepseek") {
    try {
      const base = baseUrl ? baseUrl.replace(/\/+$/, "") : "https://api.deepseek.com";
      const url = `${base}/models`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${cleanKey}` },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return [];

      const data = await res.json();
      const rawList: any[] = data.data || [];
      return rawList.map((m) => String(m.id)).filter(Boolean);
    } catch (err) {
      console.warn("[Provider Models] Failed to query live DeepSeek models:", err);
      return ["deepseek-chat", "deepseek-reasoner"];
    }
  }

  return [];
}
