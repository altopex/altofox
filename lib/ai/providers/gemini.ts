import {
  AIProviderConfig,
  GenerateOptions,
  GenerateResult,
  IAIProvider,
  ProviderType,
  TestConnectionResult,
} from "../types";

export class GeminiProvider implements IAIProvider {
  readonly name: ProviderType = "gemini";
  private apiKey: string;
  private baseUrl: string;

  constructor(config: AIProviderConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://generativelanguage.googleapis.com/v1beta";
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const rawModel = options.model || "gemini-1.5-pro";
    const model = rawModel.startsWith("models/") ? rawModel.replace("models/", "") : rawModel;

    const contents = options.messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const payload: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 8192,
      },
    };

    if (options.system) {
      payload.systemInstruction = {
        parts: [{ text: options.system }],
      };
    }

    const url = `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      let errorMsg = `Gemini API error (${res.status}): ${res.statusText}`;
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
    const candidate = data.candidates?.[0];
    const text =
      candidate?.content?.parts
        ?.map((p: { text?: string }) => p.text || "")
        .join("") || "";

    return {
      text,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount,
        completionTokens: data.usageMetadata?.candidatesTokenCount,
        totalTokens: data.usageMetadata?.totalTokenCount,
      },
    };
  }

  async testConnection(model?: string): Promise<TestConnectionResult> {
    const start = Date.now();
    try {
      const testModel = model || "gemini-1.5-flash";
      const cleanedModel = testModel.startsWith("models/") ? testModel.replace("models/", "") : testModel;
      const url = `${this.baseUrl}/models/${cleanedModel}:generateContent?key=${this.apiKey}`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "Respond with the word OK." }] }],
          generationConfig: { maxOutputTokens: 5 },
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
        const modelsRes = await fetch(`${this.baseUrl}/models?key=${this.apiKey}`);
        if (modelsRes.ok) {
          const modelsData = await modelsRes.json();
          availableModels = (modelsData.models || [])
            .map((m: { name: string }) => m.name.replace("models/", ""))
            .filter((name: string) => name.includes("gemini"))
            .slice(0, 15);
        }
      } catch {
        // Optional
      }

      return {
        success: true,
        message: `Successfully connected to Google Gemini (${testModel})`,
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
      const res = await fetch(`${this.baseUrl}/models?key=${this.apiKey}`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.models || [])
        .map((m: { name: string }) => m.name.replace("models/", ""))
        .filter((name: string) => name.includes("gemini"));
    } catch {
      return [];
    }
  }
}
