import {
  AIProviderConfig,
  GenerateOptions,
  GenerateResult,
  IAIProvider,
  ProviderType,
  TestConnectionResult,
} from "../types";

export class AnthropicProvider implements IAIProvider {
  readonly name: ProviderType = "anthropic";
  private apiKey: string;
  private baseUrl: string;

  constructor(config: AIProviderConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://api.anthropic.com/v1";
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const model = options.model || "claude-3-5-sonnet-20241022";

    // Anthropic requires alternating user/assistant messages, and system as top-level parameter
    const messages = options.messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    if (messages.length === 0) {
      throw new Error("Anthropic messages array cannot be empty");
    }

    const payload: Record<string, unknown> = {
      model,
      max_tokens: options.maxTokens ?? 8192,
      messages,
      temperature: options.temperature ?? 0.7,
    };

    if (options.system) {
      payload.system = options.system;
    }

    const res = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      let errorMsg = `Anthropic API error (${res.status}): ${res.statusText}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error?.message) {
          errorMsg = parsed.error.message;
        }
      } catch {
        errorMsg = errText || errorMsg;
      }
      throw new Error(errorMsg);
    }

    const data = await res.json();
    const content =
      data.content
        ?.map((part: { type: string; text?: string }) => (part.type === "text" ? part.text : ""))
        .join("") || "";

    return {
      text: content,
      usage: {
        promptTokens: data.usage?.input_tokens,
        completionTokens: data.usage?.output_tokens,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      },
    };
  }

  async testConnection(model?: string): Promise<TestConnectionResult> {
    const start = Date.now();
    try {
      const testModel = model || "claude-3-5-haiku-20241022";
      const res = await fetch(`${this.baseUrl}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: testModel,
          max_tokens: 10,
          messages: [{ role: "user", content: "Reply with the single word 'OK'" }],
        }),
      });

      const latencyMs = Date.now() - start;

      if (!res.ok) {
        const errText = await res.text();
        try {
          const parsed = JSON.parse(errText);
          return {
            success: false,
            message: parsed.error?.message || `HTTP ${res.status}: ${res.statusText}`,
          };
        } catch {
          return {
            success: false,
            message: `Connection failed (${res.status}): ${res.statusText}`,
          };
        }
      }

      return {
        success: true,
        message: `Successfully connected to Anthropic (${testModel})`,
        latencyMs,
        availableModels: [
          "claude-3-5-sonnet-20241022",
          "claude-3-5-haiku-20241022",
          "claude-3-opus-20240229",
        ],
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        message: `Network/connection error: ${msg}`,
      };
    }
  }
}
