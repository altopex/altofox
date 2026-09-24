import { AIProviderConfig } from "../types";
import { BaseOpenAICompatibleProvider } from "./base-openai-compatible";

export class CustomProvider extends BaseOpenAICompatibleProvider {
  constructor(config: AIProviderConfig) {
    const baseUrl = config.baseUrl || "http://localhost:11434/v1";
    super(
      "custom",
      config,
      baseUrl,
      config.defaultModel || "llama3"
    );
  }
}
