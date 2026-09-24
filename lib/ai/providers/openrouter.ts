import { AIProviderConfig } from "../types";
import { BaseOpenAICompatibleProvider } from "./base-openai-compatible";

export class OpenRouterProvider extends BaseOpenAICompatibleProvider {
  constructor(config: AIProviderConfig) {
    super(
      "openrouter",
      config,
      "https://openrouter.ai/api/v1",
      "anthropic/claude-3.5-sonnet",
      {
        "HTTP-Referer": "https://altofox.app",
        "X-Title": "AltoFox",
      }
    );
  }
}
