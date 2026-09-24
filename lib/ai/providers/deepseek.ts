import { AIProviderConfig } from "../types";
import { BaseOpenAICompatibleProvider } from "./base-openai-compatible";

export class DeepSeekProvider extends BaseOpenAICompatibleProvider {
  constructor(config: AIProviderConfig) {
    super(
      "deepseek",
      config,
      "https://api.deepseek.com",
      "deepseek-chat"
    );
  }
}
