import { AIProviderConfig, IAIProvider, ProviderType } from "./types";
import { OpenAIProvider } from "./providers/openai";
import { AnthropicProvider } from "./providers/anthropic";
import { GeminiProvider } from "./providers/gemini";
import { GroqProvider } from "./providers/groq";
import { DeepSeekProvider } from "./providers/deepseek";
import { OpenRouterProvider } from "./providers/openrouter";
import { CustomProvider } from "./providers/custom";

export function createAIProvider(
  type: ProviderType,
  config: AIProviderConfig
): IAIProvider {
  switch (type) {
    case "openai":
      return new OpenAIProvider(config);
    case "anthropic":
      return new AnthropicProvider(config);
    case "gemini":
      return new GeminiProvider(config);
    case "groq":
      return new GroqProvider(config);
    case "deepseek":
      return new DeepSeekProvider(config);
    case "openrouter":
      return new OpenRouterProvider(config);
    case "custom":
      return new CustomProvider(config);
    default:
      throw new Error(`Unsupported AI provider: ${type}`);
  }
}
