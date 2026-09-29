import {
  buildChatGeneratorUserPrompt,
  parseChatGeneratorResponse,
} from "../lib/chat-generator/generator-prompt";

async function runTests() {
  console.log("==================================================");
  console.log("TESTING CHAT GENERATOR SYSTEM");
  console.log("==================================================\n");

  const testPrompts = [
    {
      type: "Plumbing (Single-Page Landing Page)",
      prompt: "Create a simple landing page for a plumber in Dallas offering emergency leak repair.",
      themeId: "modern-pro",
      outputType: "single" as const,
    },
    {
      type: "Roofing (Single-Page Landing Page)",
      prompt: "Create a modern landing page for a roofing company in Austin with free drone inspections.",
      themeId: "classic-trust",
      outputType: "single" as const,
    },
    {
      type: "Restaurant (Multi-Page Mini-Site)",
      prompt: "Build a multi-page mini-site for a family-owned Italian restaurant in Chicago with menu, about, and reservations.",
      themeId: "warm-artisan",
      outputType: "multi" as const,
    },
  ];

  for (let i = 0; i < testPrompts.length; i++) {
    const test = testPrompts[i];
    console.log(`--- Test ${i + 1}: ${test.type} ---`);

    // 1. Build prompt
    const userPrompt = buildChatGeneratorUserPrompt({
      prompt: test.prompt,
      themeId: test.themeId,
      outputType: test.outputType,
    });

    if (!userPrompt || !userPrompt.includes(test.prompt)) {
      throw new Error(`Failed to build prompt for test ${i + 1}`);
    }
    console.log(`✓ User prompt constructed (${userPrompt.length} chars)`);

    // 2. Test response parser with representative AI outputs
    let mockAiResponse = "";
    if (test.outputType === "single") {
      mockAiResponse = JSON.stringify({
        title: `${test.type.split(" ")[0]} Website`,
        description: `High-converting static landing page for ${test.type}`,
        files: [
          {
            path: "index.html",
            content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${test.prompt}</title>
  <style>
    body { font-family: sans-serif; margin: 0; background: #f8fafc; }
    .hero { padding: 60px 20px; text-align: center; }
    .cta-btn { background: #1d4ed8; color: #fff; padding: 12px 24px; border-radius: 12px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="hero">
    <h1>${test.prompt}</h1>
    <a href="tel:5551234567" class="cta-btn">Call Now: (555) 123-4567</a>
  </div>
</body>
</html>`,
          },
        ],
      });
    } else {
      mockAiResponse = `\`\`\`json
{
  "title": "${test.type.split(" ")[0]} Mini-Site",
  "description": "Multi-page static website with shared CSS",
  "files": [
    {
      "path": "index.html",
      "content": "<!DOCTYPE html><html><head><link rel=\\"stylesheet\\" href=\\"styles.css\\"><title>Home</title></head><body><h1>Welcome</h1></body></html>"
    },
    {
      "path": "services.html",
      "content": "<!DOCTYPE html><html><head><link rel=\\"stylesheet\\" href=\\"styles.css\\"><title>Services</title></head><body><h1>Our Services</h1></body></html>"
    },
    {
      "path": "contact.html",
      "content": "<!DOCTYPE html><html><head><link rel=\\"stylesheet\\" href=\\"styles.css\\"><title>Contact</title></head><body><h1>Contact Us</h1></body></html>"
    },
    {
      "path": "styles.css",
      "content": "body { font-family: serif; background: #fffbeb; } h1 { color: #9a3412; }"
    }
  ]
}
\`\`\``;
    }

    const parsed = parseChatGeneratorResponse(mockAiResponse, test.prompt.slice(0, 30));

    if (!parsed || !parsed.files || parsed.files.length === 0) {
      throw new Error(`Parsing returned 0 files for test ${i + 1}`);
    }

    console.log(`✓ Parsed successfully: "${parsed.title}" (${parsed.files.length} files: ${parsed.files.map((f) => f.path).join(", ")})`);

    // Verify HTML integrity
    const htmlFile = parsed.files.find((f) => f.path.endsWith(".html"));
    if (!htmlFile || (!htmlFile.content.includes("<!DOCTYPE") && !htmlFile.content.includes("<html"))) {
      throw new Error(`Invalid HTML content for test ${i + 1}`);
    }
    console.log(`✓ HTML integrity verified (DOCTYPE and structure present)`);
    console.log("");
  }

  // 3. Test raw HTML fallback
  console.log("--- Test 4: Raw HTML Fallback ---");
  const rawHtmlInput = `<!DOCTYPE html><html><head><title>Raw HTML</title></head><body><h1>Emergency Plumber</h1></body></html>`;
  const rawParsed = parseChatGeneratorResponse(rawHtmlInput, "Fallback Plumbing");
  if (rawParsed.files.length === 1 && rawParsed.files[0].path === "index.html") {
    console.log("✓ Raw HTML fallback successfully handled into index.html");
  } else {
    throw new Error("Raw HTML fallback test failed");
  }

  console.log("\n==================================================");
  console.log("ALL CHAT GENERATOR TESTS PASSED SUCCESSFULLY!");
  console.log("==================================================");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
