import {
  AIProviderConfig,
  GenerateOptions,
  GenerateResult,
  IAIProvider,
  ProviderType,
  TestConnectionResult,
} from "../types";

export class BaseOpenAICompatibleProvider implements IAIProvider {
  readonly name: ProviderType;
  protected apiKey: string;
  protected baseUrl: string;
  protected defaultModel: string;
  protected extraHeaders?: Record<string, string>;

  constructor(
    name: ProviderType,
    config: AIProviderConfig,
    defaultBaseUrl: string,
    defaultModel: string,
    extraHeaders?: Record<string, string>
  ) {
    this.name = name;
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl || defaultBaseUrl).replace(/\/+$/, "");
    this.defaultModel = config.defaultModel || defaultModel;
    this.extraHeaders = extraHeaders;
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const model = options.model || this.defaultModel;
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

    const endpoint = this.baseUrl.endsWith("/chat/completions")
      ? this.baseUrl
      : `${this.baseUrl}/chat/completions`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
      ...this.extraHeaders,
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      let errorMsg = `${this.name.toUpperCase()} API error (${res.status}): ${res.statusText}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error?.message) {
          errorMsg = parsed.error.message;
        } else if (parsed.message) {
          errorMsg = parsed.message;
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
      const testModel = model || this.defaultModel;
      const endpoint = this.baseUrl.endsWith("/chat/completions")
        ? this.baseUrl
        : `${this.baseUrl}/chat/completions`;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...this.extraHeaders,
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers,
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
            message:
              parsed.error?.message ||
              parsed.message ||
              `HTTP ${res.status}: ${res.statusText}`,
          };
        } catch {
          return {
            success: false,
            message: `Connection failed (${res.status}): ${res.statusText}`,
          };
        }
      }

      // Try fetching models if endpoint exists
      let availableModels: string[] | undefined;
      try {
        const modelsEndpoint = this.baseUrl.replace(/\/chat\/completions$/, "") + "/models";
        const modelsRes = await fetch(modelsEndpoint, { headers });
        if (modelsRes.ok) {
          const modelsData = await modelsRes.json();
          availableModels = (modelsData.data || [])
            .map((m: { id: string }) => m.id)
            .slice(0, 20);
        }
      } catch {
        // Optional
      }

      return {
        success: true,
        message: `Successfully connected to ${this.name} (${testModel})`,
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
      const modelsEndpoint = this.baseUrl.replace(/\/chat\/completions$/, "") + "/models";
      const headers: Record<string, string> = {
        Authorization: `Bearer ${this.apiKey}`,
        ...this.extraHeaders,
      };
      const res = await fetch(modelsEndpoint, { headers });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.data || []).map((m: { id: string }) => m.id);
    } catch {
      return [];
    }
  }
}
