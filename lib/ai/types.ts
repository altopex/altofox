export type ProviderType =
  | "openai"
  | "anthropic"
  | "gemini"
  | "groq"
  | "deepseek"
  | "openrouter"
  | "custom";

export interface AIProviderConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  organizationId?: string;
  providerName?: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GenerateOptions {
  system?: string;
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GenerateResult {
  text: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
  latencyMs?: number;
  availableModels?: string[];
}

export interface IAIProvider {
  readonly name: ProviderType;
  generate(options: GenerateOptions): Promise<GenerateResult>;
  testConnection(model?: string): Promise<TestConnectionResult>;
  listModels?(): Promise<string[]>;
}

export interface ProviderPreset {
  id: ProviderType;
  name: string;
  description: string;
  defaultBaseUrl?: string;
  defaultModel: string;
  popularModels: { id: string; label: string; description?: string }[];
  requiresBaseUrl?: boolean;
  placeholderKey: string;
  docsUrl: string;
}

export const PROVIDER_PRESETS: Record<ProviderType, ProviderPreset> = {
  openai: {
    id: "openai",
    name: "OpenAI",
    description: "GPT-4o, GPT-4o-mini, o3-mini, o1, and ChatGPT models",
    defaultModel: "gpt-4o",
    popularModels: [
      { id: "gpt-4o", label: "GPT-4o (Recommended - Best Quality)", description: "High-intelligence flagship model" },
      { id: "gpt-4o-mini", label: "GPT-4o Mini", description: "Fast, affordable, great for static sites" },
      { id: "gpt-4.5-preview", label: "GPT-4.5 Preview", description: "Next-gen frontier reasoning & nuance" },
      { id: "o3-mini", label: "o3-mini", description: "High-speed reasoning model" },
      { id: "o1", label: "o1", description: "Deep reasoning & architecture" },
      { id: "gpt-4-turbo", label: "GPT-4 Turbo", description: "Reliable production model" },
    ],
    placeholderKey: "sk-proj-...",
    docsUrl: "https://platform.openai.com/api-keys",
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic (Claude)",
    description: "Claude 3.7 Sonnet, Claude 3.5 Sonnet, Claude 3.5 Haiku",
    defaultModel: "claude-3-5-sonnet-20241022",
    popularModels: [
      { id: "claude-3-7-sonnet-20250219", label: "Claude 3.7 Sonnet (Hybrid Reasoning)", description: "State-of-the-art coding, design tokens, and HTML generation" },
      { id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet (Recommended)", description: "Exceptional coding & design capabilities" },
      { id: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku", description: "Ultra-fast generation" },
      { id: "claude-3-opus-20240229", label: "Claude 3 Opus", description: "High reasoning capacity" },
    ],
    placeholderKey: "sk-ant-...",
    docsUrl: "https://console.anthropic.com/settings/keys",
  },
  gemini: {
    id: "gemini",
    name: "Google Gemini",
    description: "Gemini 2.0 Flash, 2.0 Flash-Lite, 1.5 Pro & 1.5 Flash",
    defaultModel: "gemini-2.0-flash",
    popularModels: [
      { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash (Recommended - Ultra Fast)", description: "Next-generation production model with sub-second latency" },
      { id: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash-Lite", description: "Lightweight, lowest-cost generation" },
      { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash", description: "Lightning-fast high-volume generation" },
      { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro", description: "2M context window, high reasoning capacity" },
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", description: "Next-gen hybrid reasoning & coding" },
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", description: "Advanced frontier reasoning" },
    ],
    placeholderKey: "AIzaSy...",
    docsUrl: "https://aistudio.google.com/app/apikey",
  },
  groq: {
    id: "groq",
    name: "Groq",
    description: "Llama 3.3 70B, Llama 3.1 8B, and DeepSeek R1 at ultra-high inference speeds",
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
    popularModels: [
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile", description: "Near-instant generation" },
      { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant", description: "Sub-second responses" },
      { id: "deepseek-r1-distill-llama-70b", label: "DeepSeek-R1 70B (Groq)", description: "Fast reasoning on Groq LPU" },
      { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B", description: "Balanced open model" },
    ],
    placeholderKey: "gsk_...",
    docsUrl: "https://console.groq.com/keys",
  },
  deepseek: {
    id: "deepseek",
    name: "DeepSeek",
    description: "DeepSeek Chat (V3) and DeepSeek Reasoner (R1)",
    defaultBaseUrl: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-chat",
    popularModels: [
      { id: "deepseek-chat", label: "DeepSeek-V3", description: "Highly capable coding model" },
      { id: "deepseek-reasoner", label: "DeepSeek-R1", description: "Deep reasoning model" },
    ],
    placeholderKey: "sk-...",
    docsUrl: "https://platform.deepseek.com/api_keys",
  },
  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    description: "Access 100+ models (Claude, GPT-4, Llama, Mistral, Qwen)",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "anthropic/claude-3.5-sonnet",
    popularModels: [
      { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet via OpenRouter" },
      { id: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash via OpenRouter" },
      { id: "openai/gpt-4o", label: "GPT-4o via OpenRouter" },
      { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B Instruct" },
      { id: "deepseek/deepseek-chat", label: "DeepSeek-V3 via OpenRouter" },
      { id: "deepseek/deepseek-r1", label: "DeepSeek-R1 via OpenRouter" },
    ],
    placeholderKey: "sk-or-v1-...",
    docsUrl: "https://openrouter.ai/keys",
  },
  custom: {
    id: "custom",
    name: "Custom (OpenAI-compatible)",
    description: "Ollama, LM Studio, vLLM, Together, LocalAI, etc.",
    defaultBaseUrl: "http://localhost:11434/v1",
    defaultModel: "llama3",
    popularModels: [
      { id: "llama3.3", label: "Llama 3.3 (Local / Ollama)" },
      { id: "qwen2.5-coder", label: "Qwen 2.5 Coder (Local)" },
      { id: "mistral-large", label: "Mistral Large (Local)" },
    ],
    requiresBaseUrl: true,
    placeholderKey: "ollama (or your key)",
    docsUrl: "https://github.com/ollama/ollama",
  },
};
