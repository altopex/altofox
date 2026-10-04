import { generateWebsite, GenerateWebsiteParams } from "./generate-website";
import { createAIProvider } from "./factory";
import { ProviderType } from "./types";

export * from "./types";
export * from "./factory";
export * from "./generate-website";
export * from "./keys";
export * from "./provider-manager";
export * from "./ai-engine";
export * from "./provider-gateway";

export interface ProviderGenerateOptions {
  model?: string;
  prompt: string;
  systemPrompt?: string;
  apiKey?: string;
  baseUrl?: string;
  organizationId?: string;
  providerName?: string;
  maxTokens?: number;
  jsonMode?: boolean;
}

export function getProvider(providerType: ProviderType = "gemini") {
  return {
    async generate(options: ProviderGenerateOptions): Promise<{ text: string; content: string }> {
      const apiKey = options.apiKey || "";
      const text = await generateWebsite({
        provider: providerType,
        apiKey,
        model: options.model || (providerType === "gemini" ? "gemini-1.5-pro" : providerType === "custom" ? "llama3" : "gpt-4o-mini"),
        prompt: options.prompt,
        systemPrompt: options.systemPrompt,
        maxTokens: options.maxTokens || 8192,
        baseUrl: options.baseUrl,
        organizationId: options.organizationId,
        providerName: options.providerName,
      });
      return { text, content: text };
    },
  };
}
