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
    description: "GPT-6 Astra, GPT-6 Sol, GPT-4o, and reasoning models",
    defaultModel: "gpt-6-astra",
    popularModels: [
      { id: "gpt-6-astra", label: "GPT-6 Astra (Recommended)", description: "Frontier flagship model for advanced reasoning & coding" },
      { id: "gpt-6-sol", label: "GPT-6 Sol", description: "High-performance coding and agentic workflows" },
      { id: "gpt-6-luna", label: "GPT-6 Luna", description: "Cost-sensitive, high-volume generation" },
      { id: "gpt-4o", label: "GPT-4o", description: "High-intelligence flagship model" },
      { id: "gpt-4o-mini", label: "GPT-4o Mini", description: "Fast, affordable, great for static sites" },
      { id: "o3-mini", label: "o3-mini", description: "High-speed reasoning model" },
      { id: "o1", label: "o1", description: "Deep reasoning & architecture" },
    ],
    placeholderKey: "sk-proj-...",
    docsUrl: "https://platform.openai.com/api-keys",
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic (Claude)",
    description: "Claude Sonnet 5.5, Claude Opus 5.5, Claude Fable 5.1, Claude 3.7",
    defaultModel: "claude-sonnet-5-5",
    popularModels: [
      { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5 (Recommended)", description: "30% faster frontier professional coding and HTML synthesis" },
      { id: "claude-opus-5-5", label: "Claude Opus 5.5", description: "1M-token frontier deep reasoning & architecture" },
      { id: "claude-fable-5-1", label: "Claude Fable 5.1", description: "Demanding reasoning and long-running autonomous agents" },
      { id: "claude-3-7-sonnet-20250219", label: "Claude 3.7 Sonnet (Hybrid Reasoning)", description: "State-of-the-art coding, design tokens, and HTML generation" },
      { id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet", description: "Production workhorse" },
      { id: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku", description: "Ultra-fast generation" },
    ],
    placeholderKey: "sk-ant-...",
    docsUrl: "https://console.anthropic.com/settings/keys",
  },
  gemini: {
    id: "gemini",
    name: "Google Gemini",
    description: "Gemini 3.8 Flash, 3.8 Flash Cyber, 3.8 Pro & 2.0 Flash",
    defaultModel: "gemini-3.8-flash",
    popularModels: [
      { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash (Recommended)", description: "Flagship workhorse for software engineering and agentic workflows" },
      { id: "gemini-3.8-flash-cyber", label: "Gemini 3.8 Flash Cyber", description: "Specialized for vulnerability defense, security auditing, and code hardening" },
      { id: "gemini-3.8-pro", label: "Gemini 3.8 Pro", description: "Frontier multimodal reasoning with extended thinking" },
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", description: "Advanced hybrid reasoning & next-generation architecture" },
      { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", description: "Sub-second latency and high-volume generation" },
      { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash", description: "Lightning-fast high-volume generation" },
      { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro", description: "2M context window, high reasoning capacity" },
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
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile (Recommended)", description: "Near-instant generation" },
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
    description: "DeepSeek V4.1-Flash, DeepSeek Chat (V3), and DeepSeek Reasoner (R1)",
    defaultBaseUrl: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-v4.1-flash",
    popularModels: [
      { id: "deepseek-v4.1-flash", label: "DeepSeek V4.1-Flash (Recommended)", description: "Multimodal mixture-of-experts model with Causal Encoder-Decoder architecture" },
      { id: "deepseek-chat", label: "DeepSeek-V3", description: "Highly capable coding model" },
      { id: "deepseek-reasoner", label: "DeepSeek-R1", description: "Deep reasoning model" },
    ],
    placeholderKey: "sk-...",
    docsUrl: "https://platform.deepseek.com/api_keys",
  },
  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    description: "Access 100+ models (Gemini 3.8, GPT-6, Claude Sonnet 5.5, DeepSeek)",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "google/gemini-3.8-flash",
    popularModels: [
      { id: "google/gemini-3.8-flash", label: "Gemini 3.8 Flash via OpenRouter (Recommended)" },
      { id: "openai/gpt-6-astra", label: "GPT-6 Astra via OpenRouter" },
      { id: "anthropic/claude-sonnet-5.5", label: "Claude Sonnet 5.5 via OpenRouter" },
      { id: "deepseek/deepseek-v4.1-flash", label: "DeepSeek V4.1-Flash via OpenRouter" },
      { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet via OpenRouter" },
      { id: "openai/gpt-4o", label: "GPT-4o via OpenRouter" },
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
