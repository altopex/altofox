import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import JSZip from "jszip";
import {
  buildLocationContentStrategy,
  auditLocationPageQuality,
  auditBulkLocationPages,
  calculateLocationPageSimilarity,
} from "../lib/location/quality-engine";
import { classifySearchIntent } from "../lib/location/intent-classifier";
import { renderLocationPage, buildLocationPageSchema, LocationPageContext } from "../templates/sections/locationPage";
import { THEMES } from "../lib/themes";
import { SiteInfoJSON } from "../lib/generator/content-schema";
import { assembleWebsite } from "../templates/assembler";
import { auditWebsiteQuality } from "../lib/quality/website-quality-auditor";
import { applyImprovementAction } from "../lib/quality/website-improver";

async function runLocationQualityTestSuite() {
  console.log("=================================================================");
  console.log("STARTING LOCATION PAGE QUALITY ENGINE COMPREHENSIVE TEST SUITE");
  console.log("=================================================================\n");

  const businessInfo: SiteInfoJSON = {
    businessName: "Lone Star Premier Trades",
    phone: "(214) 555-0199",
    email: "service@lonestarpremiertrades.com",
    licenseNumber: "TX-MPL-44921",
    yearsInBusiness: "18",
    businessModel: "service-area",
    address: {
      street: "",
      city: "Dallas",
      state: "TX",
      zip: "75201",
    },
  };

  const theme = THEMES[0];

  // -----------------------------------------------------------------
  // TEST 1: 10 DIFFERENT LOCATIONS FOR THE SAME SERVICE
  // Verify genuine differences, unique angles, and similarity < 65%
  // -----------------------------------------------------------------
  console.log("[TEST 1] Testing 10 Different Locations for Plumbing Service...");
  const testCities = [
    { city: "Dallas", stateId: "TX", county: "Dallas", population: 1300000, distanceOffset: "Central Hub", localNotes: "High summer water demand and seasonal soil shifting." },
    { city: "Fort Worth", stateId: "TX", county: "Tarrant", population: 950000, distanceOffset: "30 miles west", localNotes: "Historic homes with galvanized iron and cast iron supply lines." },
    { city: "Arlington", stateId: "TX", county: "Tarrant", population: 395000, distanceOffset: "20 miles west", localNotes: "Expanding residential subdivisions and heavy municipal water pressure." },
    { city: "Plano", stateId: "TX", county: "Collin", population: 285000, distanceOffset: "18 miles north", localNotes: "Hard water scaling and slab foundation expansion." },
    { city: "Garland", stateId: "TX", county: "Dallas", population: 240000, distanceOffset: "15 miles northeast", localNotes: "Mature tree roots impacting older clay sewer lines." },
    { city: "Irving", stateId: "TX", county: "Dallas", population: 255000, distanceOffset: "12 miles northwest", localNotes: "Rapid multi-family commercial growth and utility load." },
    { city: "Frisco", stateId: "TX", county: "Collin", population: 210000, distanceOffset: "25 miles north", localNotes: "New construction modern PEX plumbing and PRV calibration." },
    { city: "McKinney", stateId: "TX", county: "Collin", population: 200000, distanceOffset: "32 miles north", localNotes: "Historic downtown architectural conservation standards." },
    { city: "Carrollton", stateId: "TX", county: "Denton", population: 135000, distanceOffset: "14 miles northwest", localNotes: "Clay soil movement causing supply line stress cracks." },
    { city: "Denton", stateId: "TX", county: "Denton", population: 145000, distanceOffset: "38 miles northwest", localNotes: "Severe winter freeze susceptibility and university rental wear." },
  ];

  const generatedLocations: Array<{
    city: string;
    stateId: string;
    slug: string;
    html: string;
    context: LocationPageContext;
  }> = [];

  for (let i = 0; i < testCities.length; i++) {
    const c = testCities[i];
    const strategy = buildLocationContentStrategy({
      serviceName: "Plumbing Service",
      cityData: c,
      businessInfo,
      angleIndex: i,
      allSelectedCities: testCities.map((tc) => ({ city: tc.city, stateId: tc.stateId })),
    });

    const locCtx: LocationPageContext = {
      city: c.city,
      stateId: c.stateId,
      stateName: c.stateId,
      county: c.county,
      population: c.population,
      distanceOffset: c.distanceOffset,
      localNotes: c.localNotes,
      angleUsed: strategy.assignedAngle,
      h1: strategy.h1,
      metaTitle: strategy.metaTitle,
      metaDescription: strategy.metaDescription,
      introParagraph: strategy.introParagraph,
      angleSectionHeadline: strategy.regionalClimateHeadline,
      angleSectionContent: strategy.regionalClimateContent,
      commonProblemsTitle: strategy.commonProblemsTitle,
      commonProblems: strategy.commonProblems,
      whenToCall: strategy.whenToCall,
      customerPrepSteps: strategy.customerPrepSteps,
      serviceScopeTitle: strategy.serviceScopeTitle,
      servicesIncluded: strategy.servicesOfferedInCity,
      processSteps: strategy.serviceScope,
      faqs: strategy.faqs,
    };

    const slug = `plumbing-${c.city.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${c.stateId.toLowerCase()}.html`;
    const locBodyHtml = renderLocationPage(locCtx, businessInfo, theme, testCities);
    const schemaHtml = buildLocationPageSchema(locCtx, businessInfo, "example.com", slug);

    const fullPageHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${locCtx.metaTitle}</title>
  <meta name="description" content="${locCtx.metaDescription}">
  <link rel="canonical" href="https://example.com/${slug}">
  ${schemaHtml}
</head>
<body class="theme-modern-pro">
  <main>
    ${locBodyHtml}
  </main>
</body>
</html>`;

    generatedLocations.push({
      city: c.city,
      stateId: c.stateId,
      slug,
      html: fullPageHtml,
      context: locCtx,
    });
  }

  // Cross-compare pairwise similarity across all 10 cities
  let maxPairwiseSimilarity = 0;
  let highestPair = "";

  for (let i = 0; i < generatedLocations.length; i++) {
    for (let j = i + 1; j < generatedLocations.length; j++) {
      const sim = calculateLocationPageSimilarity(generatedLocations[i].html, generatedLocations[j].html);
      if (sim > maxPairwiseSimilarity) {
        maxPairwiseSimilarity = sim;
        highestPair = `${generatedLocations[i].city} vs ${generatedLocations[j].city}`;
      }
    }
  }

  console.log(`[TEST 1] Highest pairwise text similarity across 10 cities: ${(maxPairwiseSimilarity * 100).toFixed(1)}% (${highestPair})`);
  assert.ok(
    maxPairwiseSimilarity < 0.65,
    `Similarity across locations must be under 65% to prevent doorway duplication. Got ${(maxPairwiseSimilarity * 100).toFixed(1)}%`
  );

  // Bulk audit all 10 pages
  const bulkAudit = auditBulkLocationPages(
    generatedLocations.map((l) => ({
      slug: l.slug,
      html: l.html,
      city: l.city,
      stateId: l.stateId,
      service: "Plumbing Service",
      context: l.context,
    }))
  );

  console.log(`[TEST 1] Bulk audit results: ${bulkAudit.readyCount} Ready / ${bulkAudit.totalPages} Total. Average Score: ${bulkAudit.averageScore}/100`);
  assert.strictEqual(bulkAudit.tooSimilarCount, 0, "Zero pages should be flagged as too_similar");
  assert.ok(bulkAudit.averageScore >= 80, `Average score must be >= 80, got ${bulkAudit.averageScore}`);
  console.log("✓ TEST 1 PASSED: 10 location pages are genuinely differentiated with unique angles and high quality!");

  // -----------------------------------------------------------------
  // TEST 2: 5 DIFFERENT SERVICES IN THE SAME LOCATION (DALLAS, TX)
  // Verify each page satisfies its own specific search intent
  // -----------------------------------------------------------------
  console.log("\n[TEST 2] Testing 5 Different Services in Dallas, TX for Distinct Search Intent...");
  const testServices = [
    { service: "Emergency Plumbing", expectedIntent: "emergency" },
    { service: "Water Heater Replacement", expectedIntent: "replacement" },
    { service: "Drain Cleaning", expectedIntent: "maintenance" },
    { service: "Gas Line Repair", expectedIntent: "repair" },
    { service: "Slab Leak Detection", expectedIntent: "diagnostic" },
  ];

  const dallasCityData = testCities[0];
  const serviceIntents: Record<string, string> = {};

  for (const item of testServices) {
    const intentProfile = classifySearchIntent(item.service);
    serviceIntents[item.service] = intentProfile.category;
    assert.strictEqual(
      intentProfile.category,
      item.expectedIntent,
      `Service "${item.service}" should classify as intent "${item.expectedIntent}". Got "${intentProfile.category}".`
    );

    const strat = buildLocationContentStrategy({
      serviceName: item.service,
      cityData: dallasCityData,
      businessInfo,
      angleIndex: 0,
      allSelectedCities: testCities,
    });

    // Verify intent-specific content
    assert.ok(strat.h1.includes(item.service), "H1 must include specific service name");
    assert.ok(strat.commonProblems.length >= 2, "Must contain authentic trade problems");
    assert.ok(strat.customerPrepSteps.length >= 2, "Must contain actionable homeowner steps");
    assert.ok(strat.faqs.length >= 3, "Must contain intent-specific FAQs");

    // Emergency should have priority actions
    if (item.expectedIntent === "emergency") {
      assert.ok(
        strat.introParagraph.toLowerCase().includes("immediate") || strat.introParagraph.toLowerCase().includes("priority"),
        "Emergency intro must emphasize immediate priority response"
      );
      assert.strictEqual(strat.intentProfile.ctaEmphasis, "call_now");
    }

    // Replacement should discuss efficiency, lifespan, or sizing
    if (item.expectedIntent === "replacement") {
      assert.ok(
        strat.introParagraph.toLowerCase().includes("replacing") || strat.introParagraph.toLowerCase().includes("investment"),
        "Replacement intro must emphasize replacement criteria"
      );
    }
  }

  console.log("✓ TEST 2 PASSED: 5 services in the same city each satisfy their own search intent!");

  // -----------------------------------------------------------------
  // TEST 3: FULL LIFECYCLE: ASSEMBLE -> AUDIT -> IMPROVE -> ZIP -> AUDIT
  // -----------------------------------------------------------------
  console.log("\n[TEST 3] Testing Full Website Lifecycle with Location Pages...");
  const sampleSiteContent = {
    schema: { type: "Plumbing" },
    site: {
      ...businessInfo,
      trade: "Plumbing",
      themeId: "modern-pro",
      serviceAreas: ["Emergency Plumbing", "Water Heater Replacement", "Drain Cleaning", "Leak Detection"],
    },
    pages: [
      {
        pageType: "home",
        slug: "index",
        seo: {
          title: "Lone Star Premier Trades | Top Plumbing in Dallas, TX",
          description: "Dallas plumbing experts providing 24/7 emergency service, water heater repair, and upfront pricing.",
          h1: "Trusted Local Plumbing Experts in Dallas, TX",
        },
        sections: [
          {
            type: "hero",
            content: {
              headline: "Top-Rated Plumbing Specialists Serving Dallas, TX",
              subheadline: "Prompt dispatch, upfront flat-rate pricing, and guaranteed local workmanship.",
              primaryCta: "Call (214) 555-0199",
              secondaryCta: "Book Service",
            },
          },
        ],
      },
    ],
  };

  const assembleOptions = {
    domain: "lonestarpremiertrades.com",
    serviceAreaCities: testCities.slice(0, 5), // Include top 5 location pages
  };

  console.log("1. Assembling website with 5 location pages...");
  const assembled = await assembleWebsite(sampleSiteContent as any, theme, assembleOptions);
  assert.ok(assembled.files.length >= 6, "Must assemble homepage, service-areas hub, and location pages");

  // Verify location pages in assembled files
  const locHtmlFiles = assembled.files.filter((f) => f.path.startsWith("plumbing-"));
  assert.strictEqual(locHtmlFiles.length, 5, "5 location pages must be assembled in the website");

  // Verify no API keys or credentials leaked into any file
  for (const f of assembled.files) {
    if (typeof f.content === "string") {
      assert.ok(!f.content.includes("AIzaSy"), `API key leaked in ${f.path}`);
      assert.ok(!f.content.includes("sk-"), `API key leaked in ${f.path}`);
    }
  }

  console.log("2. Running initial Quality Audit...");
  const initialAudit = auditWebsiteQuality(
    assembled.files.map((f) => ({
      path: f.path,
      content: typeof f.content === "string" ? f.content : f.content.toString("utf8"),
    })),
    {
      businessName: businessInfo.businessName,
      phone: businessInfo.phone,
      city: businessInfo.address?.city,
      state: businessInfo.address?.state,
      trade: "Plumbing",
      targetScore: 95,
    }
  );

  console.log(`Initial Website Quality Score: ${initialAudit.overallScore}/100`);

  console.log("3. Applying Targeted Improvement Action (improve_all)...");
  const improvementResult = await applyImprovementAction(
    "improve_all",
    assembled.files.map((f) => ({
      path: f.path,
      content: typeof f.content === "string" ? f.content : f.content.toString("utf8"),
    })),
    {
      businessName: businessInfo.businessName,
      phone: businessInfo.phone,
      city: businessInfo.address?.city,
      state: businessInfo.address?.state,
      trade: "Plumbing",
      targetScore: 95,
    }
  );

  console.log(`Improved Website Quality Score: ${improvementResult.newScore}/100 (Gain: +${improvementResult.newScore - improvementResult.previousScore} pts)`);
  assert.ok(improvementResult.newScore >= initialAudit.overallScore, "Improved score must be >= initial score");

  console.log("4. Building ZIP Archive from improved files...");
  const zip = new JSZip();
  for (const f of improvementResult.improvedFiles) {
    zip.file(f.path, f.content);
  }
  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
  assert.ok(zipBuffer.length > 5000, "ZIP buffer must be valid and non-empty");

  console.log("5. Extracting and validating ZIP archive contents...");
  const extractedZip = await JSZip.loadAsync(zipBuffer);
  const extractedFileNames = Object.keys(extractedZip.files);
  assert.ok(extractedFileNames.includes("index.html"), "ZIP must contain index.html");
  assert.ok(extractedFileNames.includes("service-areas.html"), "ZIP must contain service-areas.html");

  for (const c of testCities.slice(0, 5)) {
    const locSlug = `plumbing-${c.city.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${c.stateId.toLowerCase()}.html`;
    assert.ok(extractedFileNames.includes(locSlug), `ZIP must contain ${locSlug}`);

    const extractedContent = await extractedZip.file(locSlug)!.async("string");
    assert.ok(extractedContent.includes(c.city), `Location page ${locSlug} must mention its target city ${c.city}`);
    assert.ok(extractedContent.includes("tel:"), `Location page ${locSlug} must contain working tel: links`);
    assert.ok(extractedContent.includes("application/ld+json"), `Location page ${locSlug} must contain Schema.org JSON-LD`);
    assert.ok(extractedContent.includes("<link rel=\"canonical\""), `Location page ${locSlug} must contain canonical tag`);
  }

  console.log("✓ TEST 3 PASSED: Full lifecycle (Assemble -> Audit -> Improve -> ZIP -> Extract -> Validate) completed with 100% integrity!");

  console.log("\n=================================================================");
  console.log("ALL LOCATION QUALITY ENGINE TESTS COMPLETED SUCCESSFULLY!");
  console.log("=================================================================");
}

runLocationQualityTestSuite().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
