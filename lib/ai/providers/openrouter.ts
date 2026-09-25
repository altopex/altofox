import { AIProviderConfig } from "../types";
import { BaseOpenAICompatibleProvider } from "./base-openai-compatible";
import { BRAND } from "@/config/brand";

export class OpenRouterProvider extends BaseOpenAICompatibleProvider {
  constructor(config: AIProviderConfig) {
    super(
      "openrouter",
      config,
      "https://openrouter.ai/api/v1",
      "anthropic/claude-3.5-sonnet",
      {
        "HTTP-Referer": BRAND.siteUrl,
        "X-Title": BRAND.name,
      }
    );
  }
}
