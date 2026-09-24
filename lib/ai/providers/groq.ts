import { AIProviderConfig } from "../types";
import { BaseOpenAICompatibleProvider } from "./base-openai-compatible";

export class GroqProvider extends BaseOpenAICompatibleProvider {
  constructor(config: AIProviderConfig) {
    super(
      "groq",
      config,
      "https://api.groq.com/openai/v1",
      "llama-3.3-70b-versatile"
    );
  }
}
