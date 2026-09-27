import assert from "node:assert";
import http from "node:http";
import { testConnection, generateWebsite, resolveChatCompletionsEndpoint, extractChoiceContent } from "../lib/ai/generate-website";
import {
  extractAndParseJSON,
  repairTruncatedJson,
  sanitizePlaceholderTokens,
  sanitizeDeep,
  ContentSanitizationContext,
} from "../lib/generator/validator";
import {
  ImageDeduplicationTracker,
  generateDynamicImageQuery,
  resolveValidatedPageImage,
  determineImageIntent,
  evaluateImageRelevance,
} from "../lib/photos/image-provider";
import { createImagePlan, resolveImagePlanWithValidation } from "../lib/photos/image-bundler";
import { assembleWebsite } from "../templates/assembler";
import { THEMES } from "../lib/themes";
import { buildDefaultTradeContentJSON } from "../lib/generator/ai-content-prompt";
import { WebsiteFormData } from "../lib/generator/prompt";

async function main() {
  console.log("==================================================");
  console.log("TEST SUITE: AI RESPONSE QUALITY & IMAGE DEDUPLICATION");
  console.log("==================================================");

  let passed = 0;
  function pass(desc: string) {
    console.log(`  ✅ PASS: ${desc}`);
    passed++;
  }

  // ==============================================================
  // PART 1: Custom AI Endpoint & Structured Connection Testing
  // ==============================================================
  console.log("\n[SECTION 1: Custom AI & Endpoint Testing]");

  // 1.1 Base URL normalization
  assert.strictEqual(
    resolveChatCompletionsEndpoint("http://localhost:11434"),
    "http://localhost:11434/chat/completions"
  );
  assert.strictEqual(
    resolveChatCompletionsEndpoint("http://localhost:11434/v1"),
    "http://localhost:11434/v1/chat/completions"
  );
  assert.strictEqual(
    resolveChatCompletionsEndpoint("https://api.groq.com/openai/v1/chat/completions/"),
    "https://api.groq.com/openai/v1/chat/completions"
  );
  pass("Base URL normalization handles /v1, /chat/completions, and trailing slashes");

  // 1.2 Content extraction from diverse proxy formats
  const standardChoice = {
    choices: [{ message: { content: "Standard text" }, finish_reason: "stop" }],
  };
  assert.strictEqual(extractChoiceContent(standardChoice).content, "Standard text");

  const chunkedContentChoice = {
    choices: [{ message: { content: [{ type: "text", text: "Chunk 1 " }, { text: "Chunk 2" }] } }],
  };
  assert.strictEqual(extractChoiceContent(chunkedContentChoice).content, "Chunk 1 Chunk 2");

  const legacyTextChoice = {
    choices: [{ text: "Legacy text output", finish_reason: "length" }],
  };
  const legacyExtracted = extractChoiceContent(legacyTextChoice);
  assert.strictEqual(legacyExtracted.content, "Legacy text output");
  assert.strictEqual(legacyExtracted.finishReason, "length");
  pass("Content extraction successfully handles strings, part arrays, legacy texts, and token limits");

  // 1.3 Mock HTTP Server for Structured JSON Probe Verification
  let receivedRequestBody: any = null;
  const mockServer = http.createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        receivedRequestBody = JSON.parse(body);
      } catch {}
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          choices: [
            {
              message: {
                content: '```json\n{"status": "ok", "provider": "connected", "verified": true}\n```',
              },
              finish_reason: "stop",
            },
          ],
        })
      );
    });
  });

  await new Promise<void>((resolve) => mockServer.listen(0, "127.0.0.1", () => resolve()));
  const port = (mockServer.address() as any).port;
  const mockBaseUrl = `http://127.0.0.1:${port}/v1`;

  const connResult = await testConnection({
    provider: "custom",
    apiKey: "test-key-abc",
    baseUrl: mockBaseUrl,
    model: "llama-3-8b",
  });

  assert.strictEqual(connResult.success, true);
  assert.ok(connResult.message.includes("Structured JSON verified"));
  assert.ok(connResult.latencyMs !== undefined && connResult.latencyMs >= 0);
  assert.ok(receivedRequestBody.messages[0].content.includes("Respond ONLY with JSON"));
  pass("testConnection verifies structured JSON output, latency, and model availability");

  mockServer.close();

  // ==============================================================
  // PART 2: Robust JSON Extraction & Repair
  // ==============================================================
  console.log("\n[SECTION 2: Robust JSON Extraction & Repair]");

  // 2.1 Markdown code fence stripping
  const markdownWrapped = '```json\n{"site": {"businessName": "Precision Plumbing"}}\n```';
  const parsedMd = extractAndParseJSON(markdownWrapped) as any;
  assert.strictEqual(parsedMd.site.businessName, "Precision Plumbing");
  pass("Extracts JSON inside markdown ```json ``` code fences");

  // 2.2 Conversational preamble and epilogue text stripping
  const conversational = `Certainly! Here is the JSON structure you requested:
{
  "site": {
    "businessName": "Acme Air Conditioning",
    "phone": "(814) 555-0199"
  }
}
Hope this helps! Let me know if you need anything else.`;
  const parsedConv = extractAndParseJSON(conversational) as any;
  assert.strictEqual(parsedConv.site.businessName, "Acme Air Conditioning");
  assert.strictEqual(parsedConv.site.phone, "(814) 555-0199");
  pass("Strips conversational preambles and postscripts outside JSON braces");

  // 2.3 Trailing commas repair
  const trailingCommaJson = '{"items": ["item1", "item2",], "options": {"enabled": true,},}';
  const parsedTrailing = extractAndParseJSON(trailingCommaJson) as any;
  assert.strictEqual(parsedTrailing.items.length, 2);
  assert.strictEqual(parsedTrailing.options.enabled, true);
  pass("Auto-repairs trailing commas before closing braces and brackets");

  // 2.4 Truncated JSON repair (unclosed quotes and braces from token limit exhaustion)
  const truncatedJson = `{"site": {"businessName": "Titan Roofing"}, "pages": [{"slug": "index", "seo": {"title": "Titan Roofing in Altoona`;
  const repaired = repairTruncatedJson(truncatedJson);
  const parsedTruncated = JSON.parse(repaired);
  assert.strictEqual(parsedTruncated.site.businessName, "Titan Roofing");
  assert.ok(parsedTruncated.pages[0].seo.title.includes("Titan Roofing"));
  pass("Auto-repairs truncated JSON by closing open quotes and nested LIFO brackets/braces");

  // ==============================================================
  // PART 3: Anti-Hallucination & Content Quality Sanitization
  // ==============================================================
  console.log("\n[SECTION 3: Anti-Hallucination & Quality Sanitization]");

  const sanitizationCtx: ContentSanitizationContext = {
    businessName: "Evergreen Tree Care",
    phone: "(814) 942-8888",
    streetAddress: "123 Forestry Way",
    city: "Altoona",
    state: "PA",
    zip: "16601",
    email: "info@evergreentree.com",
    licenseNumber: "PA-TREE-99",
    certifications: "ISA Certified Arborist",
  };

  const leakedText = "Call us at [Insert Phone] or visit [Business Name] in [City]. Lorem ipsum dolor sit amet. TODO: update warranty. [object Object]";
  const sanitized = sanitizePlaceholderTokens(leakedText, sanitizationCtx);

  assert.ok(sanitized.includes("(814) 942-8888"), "Must replace [Insert Phone] with real phone");
  assert.ok(sanitized.includes("Evergreen Tree Care"), "Must replace [Business Name] with real name");
  assert.ok(sanitized.includes("Altoona"), "Must replace [City] with real city");
  assert.ok(!sanitized.includes("Lorem ipsum"), "Must strip Lorem ipsum");
  assert.ok(!sanitized.includes("TODO"), "Must strip TODO tokens");
  assert.ok(!sanitized.includes("[object Object]"), "Must strip [object Object]");
  pass("Sanitizes placeholder tokens and strips developer leftover artifacts");

  // Deep sanitization of nested structures
  const nestedObj = {
    hero: {
      headline: "Welcome to [Your Business Name]",
      subheadline: "Call [Phone Number] today",
      tags: ["[City, State]", "24/7 Available"],
    },
  };
  const deepSanitized = sanitizeDeep(nestedObj, sanitizationCtx);
  assert.strictEqual(deepSanitized.hero.headline, "Welcome to Evergreen Tree Care");
  assert.strictEqual(deepSanitized.hero.subheadline, "Call (814) 942-8888 today");
  assert.strictEqual(deepSanitized.hero.tags[0], "Altoona, PA");
  pass("Deep-sanitizes nested JSON trees recursively");

  // ==============================================================
  // PART 4: Subject-Specific Image System & Query Differentiation
  // ==============================================================
  console.log("\n[SECTION 4: Subject-Specific Image Queries]");

  const heroQuery = generateDynamicImageQuery({
    niche: "Plumber",
    sectionType: "hero",
    city: "Altoona",
  }).query;
  const drainQuery = generateDynamicImageQuery({
    niche: "Plumber",
    sectionType: "services",
    serviceName: "Drain Cleaning",
    city: "Altoona",
  }).query;
  const heaterQuery = generateDynamicImageQuery({
    niche: "Plumber",
    sectionType: "services",
    serviceName: "Water Heater Repair",
    city: "Altoona",
  }).query;
  const leakQuery = generateDynamicImageQuery({
    niche: "Plumber",
    sectionType: "services",
    serviceName: "Leak Detection",
    city: "Altoona",
  }).query;
  const aboutQuery = generateDynamicImageQuery({
    niche: "Plumber",
    sectionType: "about",
    city: "Altoona",
  }).query;
  const galleryQuery = generateDynamicImageQuery({
    niche: "Plumber",
    sectionType: "gallery",
    city: "Altoona",
  }).query;

  assert.notStrictEqual(heroQuery, drainQuery, "Hero and Drain Cleaning queries must differ");
  assert.notStrictEqual(drainQuery, heaterQuery, "Drain Cleaning and Water Heater queries must differ");
  assert.notStrictEqual(heaterQuery, leakQuery, "Water Heater and Leak Detection queries must differ");
  assert.notStrictEqual(aboutQuery, galleryQuery, "About and Gallery queries must differ");

  assert.ok(drainQuery.toLowerCase().includes("drain"), "Drain query must include drain subject");
  assert.ok(heaterQuery.toLowerCase().includes("heater"), "Heater query must include heater subject");
  assert.ok(leakQuery.toLowerCase().includes("leak"), "Leak query must include leak subject");
  pass("Dynamic image queries are subject-specific for hero, drain cleaning, water heater, leak detection, about, gallery");

  // 4.2 Explicit Image Intent Extraction
  const drainIntent = determineImageIntent({
    trade: "Plumber",
    slot: "service",
    serviceName: "Drain Cleaning",
    city: "Altoona",
  });
  assert.strictEqual(drainIntent.subject, "Drain Cleaning");
  assert.strictEqual(drainIntent.purpose, "service");
  assert.ok(drainIntent.searchKeywords.includes("drain"));

  const innerServiceHeroIntent = determineImageIntent({
    trade: "Plumber",
    slot: "hero",
    pageTitle: "Water Heater Repair",
    pageType: "service",
    city: "Altoona",
  });
  assert.strictEqual(innerServiceHeroIntent.subject, "Water Heater Repair");
  assert.strictEqual(innerServiceHeroIntent.purpose, "hero");
  assert.ok(innerServiceHeroIntent.searchKeywords.includes("heater"));
  pass("determineImageIntent correctly extracts subject, purpose, keywords, and alt per slot");

  // 4.3 Image Relevance Scoring (Valid != Relevant)
  const relevantHeaterCandidate = {
    url: "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c",
    alt: "Technician installing residential water heater tank",
    source: "Unsplash",
  };
  const heaterScore = evaluateImageRelevance(relevantHeaterCandidate, innerServiceHeroIntent);
  assert.strictEqual(heaterScore.isRelevant, true);
  assert.ok(heaterScore.score >= 70, `Expected heater score >= 70, got ${heaterScore.score}`);

  const irrelevantHeaterCandidate = {
    url: "https://images.unsplash.com/photo-1558904541-efa8c4a08931",
    alt: "Lawn mowing and landscaping garden",
    source: "Unsplash",
  };
  const irrelevantScore = evaluateImageRelevance(irrelevantHeaterCandidate, innerServiceHeroIntent);
  assert.strictEqual(irrelevantScore.isRelevant, false);
  assert.ok(irrelevantScore.score < 50, `Expected irrelevant score < 50, got ${irrelevantScore.score}`);

  const genericPortraitCandidate = {
    url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef",
    alt: "Smiling person portrait headshot without tools",
    source: "Unsplash",
  };
  const drainCleaningIntent = determineImageIntent({
    trade: "Plumber",
    slot: "service",
    serviceName: "Drain Cleaning",
    city: "Altoona",
  });
  const portraitScore = evaluateImageRelevance(genericPortraitCandidate, drainCleaningIntent);
  assert.strictEqual(portraitScore.isRelevant, false);
  pass("evaluateImageRelevance enforces Valid != Relevant and rejects mismatched topics and pure portraits");

  // ==============================================================
  // PART 5: Image Deduplication Tracker & Cross-Page Deduplication
  // ==============================================================
  console.log("\n[SECTION 5: Image Deduplication Tracker & Cross-Page]");

  const tracker = new ImageDeduplicationTracker();

  // Test tracker API
  const testUrlA = "https://images.unsplash.com/photo-1581578731548-c64695cc6952";
  const testUrlB = "https://images.unsplash.com/photo-1585704032915-c3400ca199e7";

  assert.strictEqual(tracker.isUrlUsed(testUrlA), false);
  tracker.registerUsedUrl(testUrlA, "hero", "hero slot");
  assert.strictEqual(tracker.isUrlUsed(testUrlA), true);
  assert.strictEqual(tracker.isUrlUsed(testUrlB), false);
  pass("ImageDeduplicationTracker accurately registers and detects used URLs");

  // Test Cross-Page Hero Deduplication across distinct service & location pages
  const crossPageTracker = new ImageDeduplicationTracker();
  const pageConfigs = [
    { pageSlug: "index", pageTitle: "Home", slot: "hero" as const, pageType: "home", trade: "Plumber", city: "Austin" },
    { pageSlug: "drain-cleaning", pageTitle: "Drain Cleaning", slot: "hero" as const, pageType: "service", serviceName: "Drain Cleaning", trade: "Plumber", city: "Austin" },
    { pageSlug: "water-heater-repair", pageTitle: "Water Heater Repair", slot: "hero" as const, pageType: "service", serviceName: "Water Heater Repair", trade: "Plumber", city: "Austin" },
    { pageSlug: "pipe-repair", pageTitle: "Pipe Repair", slot: "hero" as const, pageType: "service", serviceName: "Pipe Repair", trade: "Plumber", city: "Austin" },
    { pageSlug: "plumber-austin", pageTitle: "Austin Plumber", slot: "hero" as const, pageType: "location", trade: "Plumber", city: "Austin" },
    { pageSlug: "plumber-round-rock", pageTitle: "Round Rock Plumber", slot: "hero" as const, pageType: "location", trade: "Plumber", city: "Round Rock" },
  ];

  const resolvedHeros = await Promise.all(
    pageConfigs.map((cfg) =>
      resolveValidatedPageImage(cfg, {
        deduplicationTracker: crossPageTracker,
        validateNetwork: false,
      })
    )
  );

  const heroUrls = resolvedHeros.map((r) => r.url);
  const uniqueHeroUrls = new Set(heroUrls);
  assert.strictEqual(
    uniqueHeroUrls.size,
    heroUrls.length,
    `All ${heroUrls.length} pages must have distinct hero images (got ${uniqueHeroUrls.size} unique)`
  );

  // Verify metadata records were logged
  const usageRecords = crossPageTracker.getUsageRecords();
  assert.strictEqual(usageRecords.length, pageConfigs.length);
  assert.ok(usageRecords.some((r) => r.subject?.includes("Drain")));
  assert.ok(usageRecords.some((r) => r.subject?.includes("Heater")));
  pass("Cross-page deduplication ensures 6 distinct subject-specific hero images across index, service, and location pages");

  // ==============================================================
  // PART 6: End-to-End Multi-Section Plan Resolution Deduplication
  // ==============================================================
  console.log("\n[SECTION 6: End-to-End Image Plan Deduplication]");

  const testPages = [
    {
      slug: "index",
      title: "Apex Plumbing | Best Plumbers in Altoona",
      sections: [
        { type: "hero", content: { headline: "Top Plumber" } },
        {
          type: "services",
          content: {
            headline: "Our Services",
            services: [
              { title: "Drain Cleaning", description: "Unclog any drain" },
              { title: "Water Heater Repair", description: "Fix all water heaters" },
              { title: "Pipe Burst Repair", description: "Emergency burst pipes" },
            ],
          },
        },
        { type: "about", content: { headline: "About Our Plumbers" } },
        { type: "gallery", content: { headline: "Our Work" } },
      ],
    },
  ];

  const plan = createImagePlan(testPages, "Plumber", "Altoona", "Apex Plumbing");
  assert.ok(plan.length >= 5, `Must have at least 5 slots (got ${plan.length})`);

  // Verify slot service names were properly extracted
  const serviceSlots = plan.filter((s) => s.slot === "service");
  assert.ok(serviceSlots.some((s) => s.serviceName === "Drain Cleaning"), "Must have Drain Cleaning slot");
  assert.ok(serviceSlots.some((s) => s.serviceName === "Water Heater Repair"), "Must have Water Heater Repair slot");
  pass("createImagePlan extracts specific service names from section content for index.html");

  const resolvedPlan = await resolveImagePlanWithValidation(plan, "Plumber", "Altoona");
  const usedResolvedUrls = new Set<string>();
  let duplicateCount = 0;

  for (const slot of resolvedPlan) {
    const photoUrl = slot.remoteUrl || slot.fallbackUrl;
    if (photoUrl) {
      if (usedResolvedUrls.has(photoUrl)) {
        duplicateCount++;
      } else {
        usedResolvedUrls.add(photoUrl);
      }
    }
  }

  assert.strictEqual(duplicateCount, 0, `There must be 0 duplicate URLs across slots (found ${duplicateCount})`);
  assert.strictEqual(usedResolvedUrls.size, resolvedPlan.length, "Every slot must have a unique photo URL");
  pass(`Full Image Plan resolved ${resolvedPlan.length} distinct slots with ZERO duplicate URLs!`);

  // ==============================================================
  // PART 7: Full Assembly Verification
  // ==============================================================
  console.log("\n[SECTION 7: Full Website Assembly Verification]");

  const formData: WebsiteFormData = {
    businessName: "Apex Plumbing Pros",
    businessType: "Plumber",
    city: "Altoona",
    stateRegion: "PA",
    phone: "(814) 555-0199",
    targetKeywords: "plumber altoona, drain cleaning altoona, water heater repair",
    keywords: ["plumber altoona", "drain cleaning altoona", "water heater repair"],
    services: [
      { title: "Drain Cleaning", description: "Fast rooter service" },
      { title: "Water Heater Repair", description: "Tankless and tank heaters" },
    ],
    googleMaps: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12345!2d-78.4!3d40.5!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDMwJzAwLjAiTiA3OMKwMjQnMDAuMCJX!5e0!3m2!1sen!2sus!4v1234567890",
  };

  const defaultContent = buildDefaultTradeContentJSON(formData, ["Home", "About", "Services", "Contact"]);
  const assembled = await assembleWebsite(defaultContent, THEMES[0], {
    domain: "apexplumbingpros.com",
    mapEmbed: formData.googleMaps,
  });

  const indexHtml = assembled.files.find((f) => f.path === "index.html");
  assert.ok(indexHtml, "index.html must exist");
  assert.ok(indexHtml.content.toString().includes("Apex Plumbing Pros"), "Must include business name");
  assert.ok(indexHtml.content.toString().includes("(814) 555-0199"), "Must include phone number");
  assert.ok(indexHtml.content.toString().includes("<iframe"), "Must embed Google Maps iframe");

  // Check image tag deduplication in index.html
  const imgMatches = [...indexHtml.content.toString().matchAll(/<img[^>]+src="([^">]+)"/g)].map((m) => m[1]);
  // Filter out any inline SVGs or icons
  const photoUrls = imgMatches.filter((src) => src.startsWith("http") || src.startsWith("images/"));
  const uniquePhotoUrls = new Set(photoUrls);

  console.log(`[Assembly] Detected ${photoUrls.length} photos on homepage (${uniquePhotoUrls.size} unique).`);
  assert.strictEqual(
    uniquePhotoUrls.size,
    photoUrls.length,
    "Homepage image tags must have zero duplicate image URLs!"
  );
  pass("Assembled homepage renders zero duplicate photos across Hero, Services, About, and Gallery");

  console.log("\n==================================================");
  console.log(`ALL ${passed} VERIFICATION AUDIT TESTS PASSED!`);
  console.log("==================================================");
}

main().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
