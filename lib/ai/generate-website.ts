export interface GenerateWebsiteParams {
  provider: "openai" | "gemini" | "openrouter" | "custom" | string;
  apiKey: string;
  model: string;
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  baseUrl?: string;
}

export interface TestConnectionParams {
  provider: "openai" | "gemini" | "openrouter" | "custom" | string;
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

/**
 * Single shared function for all AI providers to generate website content.
 * Standardizes OpenAI, Gemini, and OpenRouter formats.
 */
export async function generateWebsite(params: GenerateWebsiteParams): Promise<string> {
  const { provider, apiKey, model, prompt, systemPrompt, maxTokens = 16000, baseUrl } = params;

  if (!apiKey || !apiKey.trim()) {
    throw new Error(`API key is required for ${provider.toUpperCase()}.`);
  }

  // 1. Google Gemini format
  if (provider === "gemini") {
    const rawModel = model || "gemini-1.5-pro";
    const cleanedModel = rawModel.replace(/^models\//, "");
    const base = (baseUrl || "https://generativelanguage.googleapis.com/v1beta").replace(/\/+$/, "");
    const url = `${base}/models/${cleanedModel}:generateContent`;

    const contents = [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ];

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: maxTokens,
      },
    };

    if (systemPrompt) {
      body.systemInstruction = {
        parts: [{ text: systemPrompt }],
      };
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey.trim(),
      },
      body: JSON.stringify(body),
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
      if (res.status === 400 && errorMsg.includes("API key")) {
        throw new Error("Invalid Gemini API key. Please check your key.");
      } else if (res.status === 429) {
        throw new Error("Gemini quota or rate limit exceeded. Please wait or check your Google AI account.");
      } else if (res.status === 404) {
        throw new Error(`Gemini model '${cleanedModel}' not found. Try 'gemini-1.5-pro' or 'gemini-1.5-flash'.`);
      }
      throw new Error(errorMsg);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    if (!candidate) {
      throw new Error("Gemini returned no response candidates. Prompt may have triggered safety filters.");
    }

    const text = candidate.content?.parts?.map((p: { text?: string }) => p.text || "").join("") || "";
    if (!text.trim()) {
      if (candidate.finishReason === "SAFETY") {
        throw new Error("Gemini generation was blocked by safety filters. Please adjust the prompt.");
      }
      throw new Error(`Gemini returned an empty response (Finish reason: ${candidate.finishReason || "unknown"}).`);
    }

    return text;
  }

  // 2. OpenAI & OpenRouter (Chat completions standard)
  let endpoint = "https://api.openai.com/v1/chat/completions";
  const defaultModel = provider === "openrouter" ? "anthropic/claude-3.5-sonnet" : "gpt-4o";
  const targetModel = model || defaultModel;
  const extraHeaders: Record<string, string> = {};

  if (provider === "openrouter") {
    endpoint = "https://openrouter.ai/api/v1/chat/completions";
    extraHeaders["HTTP-Referer"] = "https://altofox.app";
    extraHeaders["X-Title"] = "AltoFox Website Builder";
  } else if (provider === "custom" && baseUrl) {
    endpoint = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl.replace(/\/+$/, "")}/chat/completions`;
  }

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const payload = {
    model: targetModel,
    messages,
    temperature: 0.7,
    max_tokens: maxTokens,
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey.trim()}`,
      ...extraHeaders,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    let errorMsg = `${provider.toUpperCase()} API error (${res.status}): ${res.statusText}`;
    try {
      const parsed = JSON.parse(errText);
      if (parsed.error?.message) {
        errorMsg = parsed.error.message;
      }
    } catch {
      errorMsg = errText || errorMsg;
    }

    if (res.status === 401) {
      throw new Error(`Invalid ${provider.toUpperCase()} API key. Please check your credentials.`);
    } else if (res.status === 429) {
      throw new Error(`Rate limit or credit quota exceeded for ${provider.toUpperCase()}. Please check your balance.`);
    } else if (res.status === 404) {
      throw new Error(`Model '${targetModel}' not found on ${provider.toUpperCase()}. Please verify the model name.`);
    }
    throw new Error(errorMsg);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "";
  if (!content.trim()) {
    throw new Error(`${provider.toUpperCase()} returned an empty message.`);
  }

  return content;
}

/**
 * Tests connection with a lightweight probe request
 */
export async function testConnection(params: TestConnectionParams): Promise<{ success: boolean; message: string }> {
  try {
    const { provider, apiKey, model, baseUrl } = params;
    if (!apiKey || !apiKey.trim()) {
      return { success: false, message: "Please enter an API key to test." };
    }

    if (provider === "gemini") {
      const rawModel = model || "gemini-1.5-flash";
      const cleanedModel = rawModel.replace(/^models\//, "");
      const base = (baseUrl || "https://generativelanguage.googleapis.com/v1beta").replace(/\/+$/, "");
      const url = `${base}/models/${cleanedModel}:generateContent`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey.trim(),
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "ping" }] }],
          generationConfig: { maxOutputTokens: 2 },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        let msg = `HTTP ${res.status}: ${res.statusText}`;
        try {
          const parsed = JSON.parse(errText);
          if (parsed.error?.message) msg = parsed.error.message;
        } catch {
          // ignore
        }
        return { success: false, message: msg };
      }

      return { success: true, message: `Connected to Google Gemini (${cleanedModel})!` };
    }

    // OpenAI / OpenRouter
    let endpoint = "https://api.openai.com/v1/chat/completions";
    const testModel = model || (provider === "openrouter" ? "meta-llama/llama-3.1-8b-instruct:free" : "gpt-4o-mini");
    const extraHeaders: Record<string, string> = {};

    if (provider === "openrouter") {
      endpoint = "https://openrouter.ai/api/v1/chat/completions";
      extraHeaders["HTTP-Referer"] = "https://altofox.app";
      extraHeaders["X-Title"] = "AltoFox";
    } else if (provider === "custom" && baseUrl) {
      endpoint = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl.replace(/\/+$/, "")}/chat/completions`;
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
        ...extraHeaders,
      },
      body: JSON.stringify({
        model: testModel,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 2,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      let msg = `HTTP ${res.status}: ${res.statusText}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error?.message) msg = parsed.error.message;
      } catch {
        // ignore
      }
      return { success: false, message: msg };
    }

    return { success: true, message: `Connected to ${provider.toUpperCase()} (${testModel})!` };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Connection failed.",
    };
  }
}
