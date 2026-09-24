import {
  AIProviderConfig,
  GenerateOptions,
  GenerateResult,
  IAIProvider,
  ProviderType,
  TestConnectionResult,
} from "../types";

export class OpenAIProvider implements IAIProvider {
  readonly name: ProviderType = "openai";
  private apiKey: string;
  private baseUrl: string;

  constructor(config: AIProviderConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://api.openai.com/v1";
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const model = options.model || "gpt-4o";
    const messages = [];

    if (options.system) {
      messages.push({ role: "system", content: options.system });
    }

    for (const msg of options.messages) {
      messages.push({ role: msg.role, content: msg.content });
    }

    const payload: Record<string, unknown> = {
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 8192,
    };

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      let errorMsg = `OpenAI API error (${res.status}): ${res.statusText}`;
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
    const content = data.choices?.[0]?.message?.content || "";

    return {
      text: content,
      usage: {
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
        totalTokens: data.usage?.total_tokens,
      },
    };
  }

  async testConnection(model?: string): Promise<TestConnectionResult> {
    const start = Date.now();
    try {
      const testModel = model || "gpt-4o-mini";
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: testModel,
          messages: [{ role: "user", content: "Reply with the single word 'OK'" }],
          max_tokens: 5,
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

      // Try fetching available models
      let availableModels: string[] | undefined;
      try {
        const modelsRes = await fetch(`${this.baseUrl}/models`, {
          headers: { Authorization: `Bearer ${this.apiKey}` },
        });
        if (modelsRes.ok) {
          const modelsData = await modelsRes.json();
          availableModels = modelsData.data
            ?.map((m: { id: string }) => m.id)
            ?.filter((id: string) => id.includes("gpt") || id.includes("o1") || id.includes("o3"))
            ?.sort();
        }
      } catch {
        // Optional model fetch error ignored
      }

      return {
        success: true,
        message: `Successfully connected to OpenAI (${testModel})`,
        latencyMs,
        availableModels,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        message: `Network/connection error: ${msg}`,
      };
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.data || [])
        .map((m: { id: string }) => m.id)
        .filter((id: string) => id.startsWith("gpt") || id.startsWith("o1") || id.startsWith("o3"))
        .sort();
    } catch {
      return [];
    }
  }
}
