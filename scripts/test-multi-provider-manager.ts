import assert from "node:assert";
import {
  saveProviderProfile,
  getProviderProfile,
  listProviderProfiles,
  updateProviderSettings,
  deleteProviderProfile,
  normalizeBaseUrl,
  resolveChatEndpoint,
} from "../lib/ai/provider-manager";
import {
  executeAIRequest,
  testProviderCapabilities,
} from "../lib/ai/ai-engine";
import { generateWebsite, testConnection } from "../lib/ai/generate-website";

async function runMultiProviderTestSuite() {
  console.log("==================================================================");
  console.log("   RANKLOCAL SMART MULTI-API PROVIDER MANAGER AUDIT SUITE");
  console.log("==================================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  async function test(name: string, fn: () => void | Promise<void>) {
    totalTests++;
    try {
      await fn();
      console.log(`  ✓ [PASS] ${name}`);
      passedTests++;
    } catch (err: any) {
      console.error(`  ✗ [FAIL] ${name}:`, err.message || err);
      throw err;
    }
  }

  // Set up in-process fetch interceptor for deterministic, sandbox-safe testing
  const originalFetch = globalThis.fetch;
  let simulatedStatus = 200;
  let simulatedResponseBody: any = {
    choices: [
      {
        message: {
          content: '{"status": "ok", "provider": "connected", "verified": true}',
        },
        finish_reason: "stop",
      },
    ],
  };
  let customFetchHandler: ((url: string, init?: RequestInit) => Promise<Response>) | null = null;
  let delayMs = 10;
  let lastCapturedHeaders: Record<string, string> = {};
  let lastCapturedBody: any = null;

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input.toString();

    // Check if a custom mock handler is installed
    if (customFetchHandler) {
      return customFetchHandler(url, init);
    }

    if (init?.headers) {
      lastCapturedHeaders = init.headers as Record<string, string>;
    }
    if (init?.body && typeof init.body === "string") {
      try {
        lastCapturedBody = JSON.parse(init.body);
      } catch {
        lastCapturedBody = init.body;
      }
    }

    if (delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }

    const bodyText =
      typeof simulatedResponseBody === "string"
        ? simulatedResponseBody
        : JSON.stringify(simulatedResponseBody);

    return new Response(bodyText, {
      status: simulatedStatus,
      statusText: simulatedStatus === 200 ? "OK" : "Error",
      headers: { "Content-Type": "application/json" },
    });
  };

  const mockBaseUrl = "https://mock-api.local/v1";

  try {
    // -------------------------------------------------------------
    // TEST SECTION 1: URL & BaseUrl Endpoint Normalization
    // -------------------------------------------------------------
    console.log("--- 1. Base URL & Chat Endpoint Normalization ---");

    await test("normalizeBaseUrl handles trailing slashes, prefixes, and defaults", () => {
      assert.strictEqual(normalizeBaseUrl("https://api.deepseek.com/v1/"), "https://api.deepseek.com/v1");
      assert.strictEqual(normalizeBaseUrl("https://api.groq.com/openai/v1///"), "https://api.groq.com/openai/v1");
      assert.strictEqual(normalizeBaseUrl("api.deepseek.com/v1"), "https://api.deepseek.com/v1");
      assert.strictEqual(normalizeBaseUrl(""), "https://api.openai.com/v1");
    });

    await test("resolveChatEndpoint correctly handles standard and custom paths", () => {
      assert.strictEqual(
        resolveChatEndpoint("https://api.deepseek.com/v1"),
        "https://api.deepseek.com/v1/chat/completions"
      );
      assert.strictEqual(
        resolveChatEndpoint("https://api.openai.com/v1/chat/completions"),
        "https://api.openai.com/v1/chat/completions"
      );
      assert.strictEqual(
        resolveChatEndpoint("http://localhost:11434/v1"),
        "http://localhost:11434/v1/chat/completions"
      );
    });

    // -------------------------------------------------------------
    // TEST SECTION 2: Profile Persistence, Masking, and Settings
    // -------------------------------------------------------------
    console.log("\n--- 2. Multi-Provider Registry & Settings ---");

    await test("saveProviderProfile creates and stores a new profile", async () => {
      const saved = await saveProviderProfile({
        id: "test-deepseek-1",
        name: "DeepSeek Production",
        apiType: "openai-compatible",
        baseUrl: mockBaseUrl,
        apiKey: "sk-deepseek-secret-12345678",
        model: "deepseek-chat",
        notes: "Primary fast reasoning model",
      });

      assert.strictEqual(saved.id, "test-deepseek-1");
      assert.strictEqual(saved.name, "DeepSeek Production");
      assert.strictEqual(saved.model, "deepseek-chat");
      assert.ok(saved.maskedKey.includes("••••"));
    });

    await test("listProviderProfiles safely masks sensitive API keys", async () => {
      const { profiles } = await listProviderProfiles();
      const target = profiles.find((p) => p.id === "test-deepseek-1");
      assert.ok(target, "Saved profile should be returned in list");
      assert.strictEqual((target as any).apiKey, undefined, "Raw apiKey must NEVER be in listProviderProfiles output");
      assert.strictEqual(target?.hasKey, true);
      assert.ok(target?.maskedKey.includes("••••"));
    });

    await test("updateProviderSettings updates active provider and fallback settings", async () => {
      const updated = await updateProviderSettings({
        activeProviderId: "test-deepseek-1",
        activeModel: "deepseek-chat",
        smartFallbackEnabled: true,
        fallbackProviderIds: ["gemini-default", "openai-default"],
      });

      assert.strictEqual(updated.activeProviderId, "test-deepseek-1");
      assert.strictEqual(updated.smartFallbackEnabled, true);
      assert.deepStrictEqual(updated.fallbackProviderIds, ["gemini-default", "openai-default"]);
    });

    // -------------------------------------------------------------
    // TEST SECTION 3: Live Connection Testing & Capability Detection
    // -------------------------------------------------------------
    console.log("\n--- 3. Connection Testing & Capability Detection ---");

    await test("testProviderCapabilities measures latency and detects JSON capability", async () => {
      simulatedStatus = 200;
      delayMs = 25;
      simulatedResponseBody = {
        choices: [
          {
            message: {
              content: '{"status": "ok", "provider": "connected", "verified": true}',
            },
          },
        ],
      };

      const result = await testProviderCapabilities({
        id: "test-deepseek-1",
        name: "DeepSeek Production",
        apiType: "openai-compatible",
        baseUrl: mockBaseUrl,
        apiKey: "sk-test-probe-key",
        model: "deepseek-chat",
      });

      assert.strictEqual(result.success, true);
      assert.ok(result.latencyMs >= 20, `Latency should be >= 20ms, got ${result.latencyMs}ms`);
      assert.strictEqual(result.capabilities.structuredJson, true);
      assert.strictEqual(result.capabilities.chatCompletion, true);
    });

    await test("testConnection detects 401 unauthorized gracefully", async () => {
      simulatedStatus = 401;
      simulatedResponseBody = { error: { message: "Invalid API key provided" } };

      const result = await testConnection({
        provider: "custom",
        apiKey: "sk-invalid-key",
        baseUrl: mockBaseUrl,
        model: "deepseek-chat",
      });

      assert.strictEqual(result.success, false);
      assert.ok(result.message.includes("401") || result.message.toLowerCase().includes("invalid"), result.message);
    });

    await test("testConnection detects 429 rate limit gracefully", async () => {
      simulatedStatus = 429;
      simulatedResponseBody = { error: { message: "Rate limit reached for requests per minute" } };

      const result = await testConnection({
        provider: "custom",
        apiKey: "sk-rate-limited-key",
        baseUrl: mockBaseUrl,
        model: "deepseek-chat",
      });

      assert.strictEqual(result.success, false);
      assert.ok(result.message.includes("429") || result.message.toLowerCase().includes("rate limit"), result.message);
    });

    // -------------------------------------------------------------
    // TEST SECTION 4: Central AI Engine Execution & Controlled Retries
    // -------------------------------------------------------------
    console.log("\n--- 4. Central AI Engine Execution & Resilience ---");

    await test("executeAIRequest executes successfully via active provider", async () => {
      simulatedStatus = 200;
      delayMs = 10;
      simulatedResponseBody = {
        choices: [
          {
            message: {
              content: "<h1>Welcome to Austin Pro Plumbing</h1><p>Emergency plumbing services.</p>",
            },
            finish_reason: "stop",
          },
        ],
      };

      const response = await executeAIRequest({
        prompt: "Generate hero copy for plumbing website",
        systemPrompt: "You are an expert local business copywriter.",
        providerId: "test-deepseek-1",
      });

      assert.strictEqual(response.providerId, "test-deepseek-1");
      assert.ok(response.text.includes("Austin Pro Plumbing"));
      assert.strictEqual(response.retriesAttempted, 0);
      assert.strictEqual(response.fallbackTriggered, false);
    });

    await test("executeAIRequest retries temporary 503 error and succeeds", async () => {
      let callCount = 0;

      customFetchHandler = async () => {
        callCount++;
        if (callCount === 1) {
          return new Response(JSON.stringify({ error: { message: "Service unavailable (503)" } }), {
            status: 503,
            statusText: "Service Unavailable",
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(
          JSON.stringify({
            choices: [{ message: { content: "Retry succeeded!" } }],
          }),
          {
            status: 200,
            statusText: "OK",
            headers: { "Content-Type": "application/json" },
          }
        );
      };

      const response = await executeAIRequest({
        prompt: "Test retry on temporary error",
        providerId: "test-deepseek-1",
        retryPolicy: { maxRetries: 2, retryDelayMs: 20 },
      });

      assert.strictEqual(response.text, "Retry succeeded!");
      assert.strictEqual(response.retriesAttempted, 1, "Should have succeeded on retry 1");

      customFetchHandler = null;
    });

    await test("executeAIRequest does NOT retry on permanent 401 Unauthorized", async () => {
      let permanentCalls = 0;

      customFetchHandler = async () => {
        permanentCalls++;
        return new Response(JSON.stringify({ error: { message: "Unauthorized (401)" } }), {
          status: 401,
          statusText: "Unauthorized",
          headers: { "Content-Type": "application/json" },
        });
      };

      await assert.rejects(
        async () => {
          await executeAIRequest({
            prompt: "Test non-retry on 401",
            providerId: "test-deepseek-1",
            retryPolicy: { maxRetries: 3, retryDelayMs: 20 },
          });
        },
        /401|unauthorized/i
      );

      assert.strictEqual(permanentCalls, 1, "401 must fail fast without wasteful retries");
      customFetchHandler = null;
    });

    // -------------------------------------------------------------
    // TEST SECTION 5: Smart Fallback System
    // -------------------------------------------------------------
    console.log("\n--- 5. Smart Multi-Provider Automated Fallback ---");

    await test("executeAIRequest falls back to secondary provider on persistent 500", async () => {
      // Create secondary provider profile
      await saveProviderProfile({
        id: "test-groq-secondary",
        name: "Groq Secondary",
        apiType: "openai-compatible",
        baseUrl: mockBaseUrl,
        apiKey: "sk-groq-fallback-key",
        model: "llama-3.3-70b-versatile",
      });

      await updateProviderSettings({
        activeProviderId: "test-deepseek-1",
        smartFallbackEnabled: true,
        fallbackProviderIds: ["test-groq-secondary"],
      });

      const callSequence: string[] = [];

      customFetchHandler = async (url, init) => {
        const auth = (init?.headers as Record<string, string>)?.["Authorization"] || "";
        if (auth.includes("sk-deepseek-secret") || auth.includes("sk-test-probe-key")) {
          callSequence.push("primary-failed");
          return new Response(JSON.stringify({ error: { message: "Bad Gateway 502" } }), {
            status: 502,
            statusText: "Bad Gateway",
            headers: { "Content-Type": "application/json" },
          });
        } else if (auth.includes("sk-groq-fallback-key")) {
          callSequence.push("fallback-succeeded");
          return new Response(
            JSON.stringify({
              choices: [{ message: { content: "Assembled via Groq Fallback!" } }],
            }),
            {
              status: 200,
              statusText: "OK",
              headers: { "Content-Type": "application/json" },
            }
          );
        }
        return new Response("Not found", { status: 404 });
      };

      const response = await executeAIRequest({
        prompt: "Generate content with fallback enabled",
        retryPolicy: { maxRetries: 1, retryDelayMs: 20 },
      });

      assert.strictEqual(response.text, "Assembled via Groq Fallback!");
      assert.strictEqual(response.fallbackTriggered, true);
      assert.strictEqual(response.providerId, "test-groq-secondary");
      assert.ok(callSequence.includes("primary-failed"));
      assert.ok(callSequence.includes("fallback-succeeded"));

      customFetchHandler = null;
    });

    // -------------------------------------------------------------
    // TEST SECTION 6: Backward Compatibility with generateWebsite
    // -------------------------------------------------------------
    console.log("\n--- 6. Backward Compatibility with Existing Callers ---");

    await test("generateWebsite routes through executeAIRequest with identical signature", async () => {
      simulatedStatus = 200;
      delayMs = 10;
      simulatedResponseBody = {
        choices: [
          {
            message: {
              content: '{"site": {"name": "Pro Roofers"}, "pages": []}',
            },
            finish_reason: "stop",
          },
        ],
      };

      const result = await generateWebsite({
        provider: "custom",
        apiKey: "sk-compat-key",
        baseUrl: mockBaseUrl,
        model: "deepseek-chat",
        prompt: "Return website JSON",
      });

      assert.ok(result.includes("Pro Roofers"));
    });

    // Clean up test provider profiles
    await deleteProviderProfile("test-deepseek-1");
    await deleteProviderProfile("test-groq-secondary");

    console.log("\n==================================================================");
    console.log(`   MULTI-PROVIDER AUDIT COMPLETE: ${passedTests}/${totalTests} TESTS PASSED (100%)`);
    console.log("==================================================================\n");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

runMultiProviderTestSuite().catch((err) => {
  console.error("FATAL ERROR in multi-provider test suite:", err);
  process.exit(1);
});
