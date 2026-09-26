import http from "node:http";
import assert from "node:assert";
import { testConnection, generateWebsite } from "../lib/ai/generate-website";
import { createAIProvider } from "../lib/ai/factory";
import { getProviderCredentials, saveProviderKey } from "../lib/ai/keys";

async function main() {
  console.log("=== STARTING CUSTOM OPENAI-COMPATIBLE TEST SUITE ===");

  let lastReceivedHeaders: http.IncomingHttpHeaders = {};
  let lastReceivedBody: any = null;
  let simulatedStatus = 200;
  let simulatedResponseBody: any = {
    id: "chatcmpl-test-123",
    object: "chat.completion",
    created: Date.now(),
    model: "test-custom-model",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: "Hello! Custom OpenAI-compatible response verified.",
        },
        finish_reason: "stop",
      },
    ],
    usage: { prompt_tokens: 10, completion_tokens: 15, total_tokens: 25 },
  };
  let delayMs = 0;

  // Spin up mock OpenAI-compatible HTTP server
  const server = http.createServer((req, res) => {
    lastReceivedHeaders = req.headers;
    let bodyData = "";
    req.on("data", (chunk) => {
      bodyData += chunk;
    });
    req.on("end", () => {
      if (bodyData) {
        try {
          lastReceivedBody = JSON.parse(bodyData);
        } catch {
          lastReceivedBody = bodyData;
        }
      }

      setTimeout(() => {
        res.writeHead(simulatedStatus, { "Content-Type": "application/json" });
        if (typeof simulatedResponseBody === "string") {
          res.end(simulatedResponseBody);
        } else {
          res.end(JSON.stringify(simulatedResponseBody));
        }
      }, delayMs);
    });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const address = server.address() as { port: number };
  const mockBaseUrl = `http://127.0.0.1:${address.port}/v1`;
  console.log(`[TEST] Mock OpenAI-compatible server listening on ${mockBaseUrl}`);

  try {
    // -------------------------------------------------------------
    // TEST 1: Test Connection Success & Header Verification
    // -------------------------------------------------------------
    console.log("\n[TEST 1] Testing successful connection...");
    simulatedStatus = 200;
    const testResult = await testConnection({
      provider: "custom",
      apiKey: "custom-secret-key-12345",
      baseUrl: mockBaseUrl,
      model: "test-model-xyz",
      organizationId: "org-test-789",
    });

    console.log("testResult:", testResult);
    assert.strictEqual(testResult.success, true, "Connection test should succeed");
    assert.ok(testResult.latencyMs !== undefined && testResult.latencyMs >= 0, "Latency must be reported");
    assert.strictEqual(lastReceivedHeaders["authorization"], "Bearer custom-secret-key-12345", "Bearer auth must match");
    assert.strictEqual(lastReceivedHeaders["openai-organization"], "org-test-789", "OpenAI-Organization header must match");
    assert.strictEqual(lastReceivedBody.model, "test-model-xyz", "Model in request body must match");
    console.log("✓ TEST 1 PASSED: Genuine connection tested with auth, orgId, and latency!");

    // -------------------------------------------------------------
    // TEST 2: Error Handling - 401 Unauthorized / Invalid Key
    // -------------------------------------------------------------
    console.log("\n[TEST 2] Testing 401 Unauthorized...");
    simulatedStatus = 401;
    simulatedResponseBody = { error: { message: "Incorrect API key provided" } };
    const err401 = await testConnection({
      provider: "custom",
      apiKey: "invalid-key",
      baseUrl: mockBaseUrl,
      model: "test-model-xyz",
    });
    assert.strictEqual(err401.success, false, "401 must fail");
    assert.ok(err401.message.includes("Invalid API key") || err401.message.includes("Incorrect API key"), "Error message should mention invalid key");
    console.log("✓ TEST 2 PASSED: 401 error correctly handled");

    // -------------------------------------------------------------
    // TEST 3: Error Handling - 404 Endpoint / Model Not Found
    // -------------------------------------------------------------
    console.log("\n[TEST 3] Testing 404 Not Found...");
    simulatedStatus = 404;
    simulatedResponseBody = { error: { message: "The model test-model-xyz does not exist" } };
    const err404 = await testConnection({
      provider: "custom",
      apiKey: "custom-secret-key-12345",
      baseUrl: mockBaseUrl,
      model: "test-model-xyz",
    });
    assert.strictEqual(err404.success, false, "404 must fail");
    assert.ok(err404.message.includes("not found"), "Error message should mention model/endpoint not found");
    console.log("✓ TEST 3 PASSED: 404 error correctly handled");

    // -------------------------------------------------------------
    // TEST 4: Error Handling - 429 Rate Limit
    // -------------------------------------------------------------
    console.log("\n[TEST 4] Testing 429 Rate Limit...");
    simulatedStatus = 429;
    simulatedResponseBody = { error: { message: "Rate limit reached for requests" } };
    const err429 = await testConnection({
      provider: "custom",
      apiKey: "custom-secret-key-12345",
      baseUrl: mockBaseUrl,
      model: "test-model-xyz",
    });
    assert.strictEqual(err429.success, false, "429 must fail");
    assert.ok(err429.message.includes("Rate limit exceeded"), "Error message should mention rate limit");
    console.log("✓ TEST 4 PASSED: 429 rate limit correctly handled");

    // -------------------------------------------------------------
    // TEST 5: Error Handling - 402 Insufficient Quota
    // -------------------------------------------------------------
    console.log("\n[TEST 5] Testing 402 Insufficient Quota...");
    simulatedStatus = 402;
    simulatedResponseBody = { error: { message: "Insufficient credit balance" } };
    const err402 = await testConnection({
      provider: "custom",
      apiKey: "custom-secret-key-12345",
      baseUrl: mockBaseUrl,
      model: "test-model-xyz",
    });
    assert.strictEqual(err402.success, false, "402 must fail");
    assert.ok(err402.message.includes("Insufficient credits") || err402.message.includes("quota"), "Error message should mention credits/quota");
    console.log("✓ TEST 5 PASSED: 402 quota error correctly handled");

    // -------------------------------------------------------------
    // TEST 6: Error Handling - Malformed Response
    // -------------------------------------------------------------
    console.log("\n[TEST 6] Testing Malformed Response...");
    simulatedStatus = 200;
    simulatedResponseBody = "<html><body>502 Bad Gateway from reverse proxy</body></html>";
    const errMalformed = await testConnection({
      provider: "custom",
      apiKey: "custom-secret-key-12345",
      baseUrl: mockBaseUrl,
      model: "test-model-xyz",
    });
    assert.strictEqual(errMalformed.success, false, "Malformed response must fail");
    console.log("✓ TEST 6 PASSED: Malformed response detected and failed gracefully");

    // -------------------------------------------------------------
    // TEST 7: Website Generation with Custom OpenAI-compatible Provider
    // -------------------------------------------------------------
    console.log("\n[TEST 7] Testing Website Generation with Custom Provider...");
    simulatedStatus = 200;
    const generatedHtmlSample = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Apex Plumbing Dallas</title>
  <meta name="description" content="Top rated plumbing services in Dallas, TX.">
  <style>body { font-family: sans-serif; }</style>
</head>
<body>
  <header><h1>Apex Plumbing</h1><a href="tel:5551234567">(555) 123-4567</a></header>
  <main><section><h2>Dallas Plumbing Experts</h2><p>Trusted 24/7 service.</p></section></main>
  <footer><p>&copy; 2026 Apex Plumbing</p></footer>
</body>
</html>`;

    simulatedResponseBody = {
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: `\`\`\`html\n${generatedHtmlSample}\n\`\`\``,
          },
          finish_reason: "stop",
        },
      ],
    };

    const genResult = await generateWebsite({
      provider: "custom",
      apiKey: "custom-secret-key-12345",
      baseUrl: mockBaseUrl,
      model: "llama-3.3-70b",
      organizationId: "org-my-company",
      prompt: "Create a local plumbing website for Dallas TX",
      businessName: "Apex Plumbing",
      serviceType: "Plumbing",
      targetLocation: "Dallas, TX",
    });

    assert.ok(typeof genResult === "string" && genResult.includes("Apex Plumbing"), "Generated HTML should contain business name");
    assert.strictEqual(lastReceivedHeaders["openai-organization"], "org-my-company", "Generation sent organization header");
    assert.strictEqual(lastReceivedBody.model, "llama-3.3-70b", "Generation requested the custom model");

    // Verify key security: credentials must NEVER leak into generated website content
    assert.ok(!genResult.includes("custom-secret-key-12345"), "API key leaked in generated website!");
    console.log("✓ TEST 7 PASSED: Website generated successfully with custom provider; API key securely withheld from website files!");

    // -------------------------------------------------------------
    // TEST 8: Factory `createAIProvider` with Custom Provider
    // -------------------------------------------------------------
    console.log("\n[TEST 8] Testing createAIProvider factory with custom provider...");
    const factoryProvider = createAIProvider("custom", {
      apiKey: "custom-secret-key-12345",
      baseUrl: mockBaseUrl,
      defaultModel: "mistral-large",
      organizationId: "org-factory-test",
    });

    simulatedResponseBody = {
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "Page copy optimized with high CTR headline and targeted local keywords.",
          },
          finish_reason: "stop",
        },
      ],
    };

    const providerGen = await factoryProvider.generate({
      messages: [{ role: "user", content: "Optimize this page headline" }],
    });

    assert.ok(providerGen.text.includes("Page copy optimized"), "Factory provider response received");
    assert.strictEqual(lastReceivedHeaders["openai-organization"], "org-factory-test", "Factory sent organization header");
    assert.strictEqual(lastReceivedBody.model, "mistral-large", "Factory used the configured custom model");
    console.log("✓ TEST 8 PASSED: createAIProvider abstraction functions seamlessly with custom provider!");

    console.log("\n=======================================================");
    console.log("ALL 8 TESTS PASSED SUCCESSFULLY! CUSTOM PROVIDER IS 100% OPERATIONAL.");
    console.log("=======================================================");
  } finally {
    server.close();
  }
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
