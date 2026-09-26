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
  protected organizationId?: string;
  protected providerName: string;
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
    this.organizationId = config.organizationId;
    this.providerName = config.providerName || (name === "custom" ? "Custom AI" : name.toUpperCase());
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
      ...(this.organizationId ? { "OpenAI-Organization": this.organizationId } : {}),
      ...this.extraHeaders,
    };

    let res: Response;
    try {
      res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(120000),
      });
    } catch (netErr: any) {
      if (netErr.name === "AbortError" || netErr.name === "TimeoutError") {
        throw new Error(`Request to ${this.providerName} timed out after 120s.`);
      }
      throw new Error(`Could not connect to API endpoint (${endpoint}): ${netErr.message || "Network error"}`);
    }

    if (!res.ok) {
      const errText = await res.text();
      let errorMsg = `${this.providerName} API error (${res.status}): ${res.statusText}`;
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

      const lower = errorMsg.toLowerCase();
      if (res.status === 401) {
        throw new Error(`Invalid ${this.providerName} API key (401 Unauthorized). Please check credentials.`);
      } else if (res.status === 402 || lower.includes("quota") || lower.includes("credit") || lower.includes("billing")) {
        throw new Error(`Insufficient credits or quota exceeded for ${this.providerName} (402).`);
      } else if (res.status === 404) {
        if (lower.includes("model")) {
          throw new Error(`Model '${model}' not found on ${this.providerName} (404).`);
        }
        throw new Error(`API endpoint not found (404) at ${endpoint}.`);
      } else if (res.status === 429) {
        throw new Error(`Rate limit exceeded for ${this.providerName} (429).`);
      } else if (res.status >= 500) {
        throw new Error(`Provider unavailable (HTTP ${res.status}: ${res.statusText}).`);
      }

      throw new Error(errorMsg);
    }

    let data: any;
    try {
      data = await res.json();
    } catch {
      throw new Error(`Malformed response from ${this.providerName}: Response is not valid JSON.`);
    }

    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error(`Malformed response from ${this.providerName}: Empty message content.`);
    }

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
        ...(this.organizationId ? { "OpenAI-Organization": this.organizationId } : {}),
        ...this.extraHeaders,
      };

      let res: Response;
      try {
        res = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify({
            model: testModel,
            messages: [{ role: "user", content: "Reply with the single word 'OK'" }],
            max_tokens: 5,
          }),
          signal: AbortSignal.timeout(15000),
        });
      } catch (netErr: any) {
        if (netErr.name === "AbortError" || netErr.name === "TimeoutError") {
          return { success: false, message: "Connection timed out after 15s. Endpoint did not respond." };
        }
        return { success: false, message: `Could not connect to ${endpoint}: ${netErr.message || "Network error"}` };
      }

      const latencyMs = Date.now() - start;

      if (!res.ok) {
        const errText = await res.text();
        let errorMsg = `HTTP ${res.status}: ${res.statusText}`;
        try {
          const parsed = JSON.parse(errText);
          if (parsed.error?.message) errorMsg = parsed.error.message;
          else if (parsed.message) errorMsg = parsed.message;
        } catch {}

        const lower = errorMsg.toLowerCase();
        if (res.status === 401) {
          return { success: false, message: `Invalid API key (401 Unauthorized). Please check credentials.` };
        } else if (res.status === 402 || lower.includes("quota") || lower.includes("credit")) {
          return { success: false, message: `Insufficient credits or quota exceeded (402).` };
        } else if (res.status === 404) {
          if (lower.includes("model")) {
            return { success: false, message: `Model '${testModel}' not found on provider (404).` };
          }
          return { success: false, message: `API endpoint not found (404) at ${endpoint}.` };
        } else if (res.status === 429) {
          return { success: false, message: `Rate limit exceeded (429).` };
        } else if (res.status >= 500) {
          return { success: false, message: `Provider unavailable (HTTP ${res.status}: ${res.statusText}).` };
        }

        return { success: false, message: errorMsg };
      }

      let data: any;
      try {
        data = await res.json();
      } catch {
        return { success: false, message: "Malformed response: Provider did not return valid JSON." };
      }

      const content = data.choices?.[0]?.message?.content;
      if (typeof content !== "string" || !content.trim()) {
        return { success: false, message: "Malformed response: Provider returned empty choices/content." };
      }

      // Try fetching models if endpoint exists
      let availableModels: string[] | undefined;
      try {
        const modelsEndpoint = this.baseUrl.replace(/\/chat\/completions$/, "") + "/models";
        const modelsRes = await fetch(modelsEndpoint, { headers, signal: AbortSignal.timeout(5000) });
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
        message: `Successfully connected to ${this.providerName} (${testModel}) in ${latencyMs}ms`,
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
        ...(this.organizationId ? { "OpenAI-Organization": this.organizationId } : {}),
        ...this.extraHeaders,
      };
      const res = await fetch(modelsEndpoint, { headers, signal: AbortSignal.timeout(6000) });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.data || []).map((m: { id: string }) => m.id);
    } catch {
      return [];
    }
  }
}
