import { generateWebsite, GenerateWebsiteParams } from "./generate-website";
import { createAIProvider } from "./factory";
import { ProviderType } from "./types";

export * from "./types";
export * from "./factory";
export * from "./generate-website";
export * from "./keys";

export interface ProviderGenerateOptions {
  model?: string;
  prompt: string;
  systemPrompt?: string;
  apiKey?: string;
  baseUrl?: string;
  maxTokens?: number;
  jsonMode?: boolean;
}

export function getProvider(providerType: ProviderType = "gemini") {
  return {
    async generate(options: ProviderGenerateOptions): Promise<{ text: string; content: string }> {
      const apiKey = options.apiKey || (providerType === "gemini" ? process.env.GEMINI_API_KEY : process.env.OPENAI_API_KEY) || "";
      const text = await generateWebsite({
        provider: providerType,
        apiKey: apiKey || "dummy-key-for-test",
        model: options.model || (providerType === "gemini" ? "gemini-1.5-pro" : "gpt-4o-mini"),
        prompt: options.prompt,
        systemPrompt: options.systemPrompt,
        maxTokens: options.maxTokens || 8192,
        baseUrl: options.baseUrl,
      });
      return { text, content: text };
    },
  };
}
