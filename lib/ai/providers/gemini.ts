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
    const rawModel = options.model || "gemini-3.8-flash";
    let model = rawModel.startsWith("models/") ? rawModel.replace("models/", "") : rawModel;
    if (model === "gemini-2.0-flash-exp") model = "gemini-3.8-flash";
    if (model === "gemini-2.0-pro-exp") model = "gemini-3.8-pro";
    if (model === "gemini-2.0-flash-thinking-exp") model = "gemini-3.8-flash";

    const contents = options.messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const payload: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 14000,
      },
    };

    if (options.system) {
      payload.systemInstruction = {
        parts: [{ text: options.system }],
      };
    }

    const url = `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`;
    let res = await fetch(url, {
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

      // Auto-recover from deprecated or unsupported model strings
      if (
        res.status === 404 ||
        errorMsg.includes("not found for API version") ||
        errorMsg.includes("not supported for generateContent")
      ) {
        const fallbackModel =
          model !== "gemini-3.8-flash" && model !== "gemini-2.0-flash"
            ? "gemini-3.8-flash"
            : model === "gemini-3.8-flash"
            ? "gemini-2.0-flash"
            : "gemini-1.5-flash";
        console.warn(`[GeminiProvider] Model "${model}" failed with 404/unsupported. Auto-recovering with "${fallbackModel}"...`);
        const fallbackUrl = `${this.baseUrl}/models/${fallbackModel}:generateContent?key=${this.apiKey}`;
        res = await fetch(fallbackUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error(errorMsg);
        }
      } else {
        throw new Error(errorMsg);
      }
    }

    let data: any;
    try {
      data = await res.json();
    } catch {
      throw new Error("Malformed response from Gemini: Server did not return valid JSON.");
    }
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
      const testModel = model || "gemini-3.8-flash";
      let cleanedModel = testModel.startsWith("models/") ? testModel.replace("models/", "") : testModel;
      if (cleanedModel === "gemini-2.0-flash-exp") cleanedModel = "gemini-3.8-flash";
      if (cleanedModel === "gemini-2.0-pro-exp") cleanedModel = "gemini-3.8-pro";

      const url = `${this.baseUrl}/models/${cleanedModel}:generateContent?key=${this.apiKey}`;

      let res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "Respond with the word OK." }] }],
          generationConfig: { maxOutputTokens: 200 },
        }),
      });

      const latencyMs = Date.now() - start;

      if (!res.ok) {
        const errText = await res.text();
        let errorMsg = `HTTP ${res.status}: ${res.statusText}`;
        try {
          const parsed = JSON.parse(errText);
          if (parsed.error?.message) errorMsg = parsed.error.message;
        } catch {}

        // If the model was 404/unsupported, test fallback model
        if (
          res.status === 404 ||
          errorMsg.includes("not found for API version") ||
          errorMsg.includes("not supported for generateContent")
        ) {
          const fallbackModel =
            cleanedModel !== "gemini-3.8-flash" && cleanedModel !== "gemini-2.0-flash"
              ? "gemini-3.8-flash"
              : cleanedModel === "gemini-3.8-flash"
              ? "gemini-2.0-flash"
              : "gemini-1.5-flash";
          const retryRes = await fetch(`${this.baseUrl}/models/${fallbackModel}:generateContent?key=${this.apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: "Respond with the word OK." }] }],
              generationConfig: { maxOutputTokens: 200 },
            }),
          });
          if (retryRes.ok) {
            cleanedModel = fallbackModel;
            res = retryRes;
          } else {
            return { success: false, message: errorMsg };
          }
        } else {
          return { success: false, message: errorMsg };
        }
      }

      // Fetch live available models for Gemini
      let availableModels: string[] | undefined;
      try {
        const modelsRes = await fetch(`${this.baseUrl}/models?key=${this.apiKey}`);
        if (modelsRes.ok) {
          const modelsData = await modelsRes.json();
          availableModels = (modelsData.models || [])
            .filter((m: any) => {
              const methods: string[] = m.supportedGenerationMethods || [];
              return methods.includes("generateContent") && String(m.name).includes("gemini");
            })
            .map((m: { name: string }) => m.name.replace("models/", ""))
            .filter((name: string) => !name.endsWith("-exp"));

          if (availableModels && availableModels.length > 0) {
            if (!availableModels.includes("gemini-3.8-flash")) availableModels.unshift("gemini-3.8-flash");
          }
        }
      } catch {
        // Optional
      }

      return {
        success: true,
        message: `Successfully connected to Google Gemini (${cleanedModel})`,
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
      if (!res.ok) return ["gemini-3.8-flash", "gemini-3.8-pro", "gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash", "gemini-1.5-pro"];
      const data = await res.json();
      const list = (data.models || [])
        .filter((m: any) => {
          const methods: string[] = m.supportedGenerationMethods || [];
          return methods.includes("generateContent") && String(m.name).includes("gemini");
        })
        .map((m: { name: string }) => m.name.replace("models/", ""))
        .filter((name: string) => !name.endsWith("-exp"));

      if (!list.includes("gemini-3.8-flash")) list.unshift("gemini-3.8-flash");
      return list;
    } catch {
      return ["gemini-3.8-flash", "gemini-3.8-pro", "gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash", "gemini-1.5-pro"];
    }
  }
}
