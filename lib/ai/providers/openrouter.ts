import { AIProviderConfig } from "../types";
import { BaseOpenAICompatibleProvider } from "./base-openai-compatible";
import { BRAND } from "@/config/brand";

export class OpenRouterProvider extends BaseOpenAICompatibleProvider {
  constructor(config: AIProviderConfig) {
    super(
      "openrouter",
      config,
      "https://openrouter.ai/api/v1",
      "google/gemini-3.8-flash",
      {
        "HTTP-Referer": BRAND.siteUrl,
        "X-Title": BRAND.name,
      }
    );
  }
}
