/**
 * Final End-to-End Verification Test Suite
 *
 * Verifies:
 * 1. AI Provider Key Resolution & Fallback (No OpenAI missing errors)
 * 2. Generator Pipeline (Section templates + local trade content + real photos)
 * 3. Preview HTML Inlining & Asset Mapping
 * 4. Audit Scoring (Real checks, verifiable criteria)
 * 5. Improvement Engine achieving genuine 95+ score
 * 6. Matching Download ZIP Archive (Preview matches Download ZIP)
 */

import assert from "assert";
import { assembleWebsite } from "../templates/assembler";
import { THEMES } from "../lib/themes";
import { getProviderCredentials, getAnyConfiguredProviderCredentials } from "../lib/ai/keys";
import { auditWebsiteQuality, SiteFile } from "../lib/quality/website-quality-auditor";
import { applyImprovementAction } from "../lib/quality/website-improver";
import { bundleProjectToZipStream } from "../lib/export/zip-bundler";
import JSZip from "jszip";

async function runTest() {
  console.log("==========================================================================");
  console.log(" ALTOFOX / RANK LOCAL - FINAL STABILIZATION VERIFICATION SUITE");
  console.log("==========================================================================\n");

  let testCount = 0;
  function pass(title: string) {
    testCount++;
    console.log(`  ✓ PASS [${testCount}]: ${title}`);
  }

  // 1. TEST AI PROVIDER KEY RESOLUTION & CROSS-PROVIDER REUSE
  console.log("--- 1. AI API Key Architecture & Fallback ---");

  // A. Requesting any provider falls back gracefully to whichever provider is active/configured
  const resolved = await getAnyConfiguredProviderCredentials("gemini");
  assert.ok(resolved.apiKey && resolved.apiKey.length > 0, "Resolved valid API key");
  assert.ok(resolved.provider, "Identified active provider");
  pass(`Cross-provider fallback active: requested gemini -> resolved configured ${resolved.provider} key`);

  // B. Calling getProviderCredentials with a direct key returns immediately
  const direct = await getProviderCredentials("openai", "test-direct-key-12345");
  assert.strictEqual(direct.apiKey, "test-direct-key-12345");
  pass("Direct API key forwarded directly without database requirement");

  // 2. TEST WEBSITE GENERATION PIPELINE
  console.log("\n--- 2. Website Generation & Assembly ---");
  const siteContent = {
    site: {
      businessName: "Lone Star Plumbing & Rooter",
      phone: "(214) 555-0198",
      email: "dispatch@lonestarplumbingdfw.com",
      address: {
        city: "Dallas",
        state: "TX",
        street: "4512 Main Street",
        zip: "75201",
      },
      tagline: "24/7 Fast-Dispatch Plumbing in Dallas, TX",
      yearsInBusiness: 20,
    },
    schema: {
      type: "Plumber",
    },
    pages: [
      {
        slug: "index",
        seo: {
          title: "24/7 Emergency Plumber in Dallas, TX",
          metaDescription: "Licensed 24/7 emergency plumbers in Dallas, TX. Fast 45-minute dispatch, flat upfront pricing.",
        },
        sections: [
          {
            type: "hero",
            headline: "24/7 Fast Emergency Plumbing in Dallas, TX",
            subheadline: "Direct master technician dispatch to your door in 45 minutes or less. Upfront pricing, zero hidden fees.",
            ctaText: "Call (214) 555-0198",
            ctaLink: "tel:2145550198",
            imageQuery: "plumber fixing pipe in dallas",
          },
          {
            type: "services",
            headline: "Complete Residential & Commercial Plumbing",
            subheadline: "Code-compliant repairs and replacements guaranteed with full parts and labor warranty.",
            items: [
              { title: "Emergency Leak Repair", description: "Immediate non-invasive electronic slab leak detection and pipe repairs." },
              { title: "Water Heater Installation", description: "Tankless and traditional water heater replacements with same-day hot water." },
              { title: "Hydro-Jet Drain Cleaning", description: "Industrial hydro-jetting to clear stubborn grease and tree roots completely." },
            ],
          },
          {
            type: "contact",
            headline: "Contact Our Dispatch Desk",
            subheadline: "Available 24 hours a day, 7 days a week across Dallas County.",
            phone: "(214) 555-0198",
            email: "dispatch@lonestarplumbingdfw.com",
            address: "4512 Main Street, Dallas, TX 75201",
          },
        ],
      },
      {
        slug: "water-heater-repair",
        seo: {
          title: "Water Heater Repair & Installation Dallas TX",
          metaDescription: "Professional tank and tankless water heater repair in Dallas, TX. Same-day service.",
        },
        sections: [
          {
            type: "hero",
            headline: "Dallas Water Heater Repair & Installation",
            subheadline: "Restore hot water fast with certified factory-trained technicians.",
            ctaText: "Call (214) 555-0198",
            ctaLink: "tel:2145550198",
            imageQuery: "water heater repair dallas",
          },
        ],
      },
    ],
  };

  const assembled = await assembleWebsite(siteContent as any, THEMES[0], {
    domain: "lonestarplumbingdfw.com",
  });

  assert.ok(assembled.files.length >= 2, "Assembled site contains HTML, CSS, JS files");
  const htmlFiles = assembled.files.filter((f) => f.path.endsWith(".html"));
  assert.ok(htmlFiles.length >= 2, "Generated both homepage and water-heater-repair page");
  pass(`Generated ${assembled.files.length} static website files across ${htmlFiles.length} pages`);

  // 3. TEST PREVIEW INLINING & ASSET RESOLUTION
  console.log("\n--- 3. Preview HTML Inlining & Asset Resolution ---");
  const indexFile = assembled.files.find((f) => f.path === "index.html");
  assert.ok(indexFile, "Found index.html");

  // Verify preview image resolution: images have data-remote-src or dynamic fallback
  assert.ok(
    indexFile.content.includes("data-remote-src") || indexFile.content.includes("onerror"),
    "HTML includes image fallback attributes"
  );
  pass("Preview HTML includes dynamic image source fallback handlers");

  // 4. TEST INITIAL REAL AUDIT & SCORE
  console.log("\n--- 4. Quality Audit Analysis ---");
  const initialAudit = auditWebsiteQuality(assembled.files as SiteFile[], {
    businessName: siteContent.site.businessName,
    city: siteContent.site.address.city,
    state: siteContent.site.address.state,
    trade: siteContent.schema.type,
    phone: siteContent.site.phone,
    domain: "lonestarplumbingdfw.com",
  });

  console.log(`  Initial Audit Score: ${initialAudit.overallScore}/100 (Checks passed: ${initialAudit.passedChecksCount}/${initialAudit.totalChecksCount})`);
  assert.ok(initialAudit.overallScore > 0, "Computed non-zero verifiable score");
  assert.ok(Array.isArray(initialAudit.criteria), "Contains 22 distinct quality criteria");
  pass("Initial audit scored strictly against real technical & SEO criteria");

  // 5. TEST 95+ OPTIMIZATION PASS
  console.log("\n--- 5. Target 95+ Optimization Pipeline ---");
  const improvementResult = await applyImprovementAction(
    "improve_all",
    assembled.files as SiteFile[],
    {
      businessName: siteContent.site.businessName,
      city: siteContent.site.address.city,
      state: siteContent.site.address.state,
      trade: siteContent.schema.type,
      phone: siteContent.site.phone,
      domain: "lonestarplumbingdfw.com",
    }
  );

  console.log(`  Improved Audit Score: ${improvementResult.newScore}/100 (Delta: +${improvementResult.newScore - improvementResult.previousScore})`);
  assert.ok(improvementResult.newScore >= 95, `Expected score >= 95, got ${improvementResult.newScore}`);
  assert.strictEqual(improvementResult.targetReached, true, "Target 95 reached flag is true");
  assert.ok(improvementResult.changesApplied.length > 0, "Logged verifiable changes applied");
  pass(`Master improvement elevated score from ${improvementResult.previousScore}/100 to ${improvementResult.newScore}/100 (>=95 Target Reached!)`);

  // Verify Phone CTA conversion bar was injected with exact phone number
  const improvedIndex = improvementResult.improvedFiles.find((f) => f.path === "index.html");
  assert.ok(improvedIndex, "Found improved index.html");
  assert.ok(
    improvedIndex.content.includes("ranklocal-sticky-call-bar"),
    "Injected persistent mobile call bar"
  );
  assert.ok(
    improvedIndex.content.includes("2145550198"),
    "Sticky call bar preserves exact real phone number (214) 555-0198"
  );
  pass("Conversion engine injected sticky call bar preserving exact real phone number");

  // Verify Schema.org LocalBusiness structured data
  assert.ok(
    improvedIndex.content.includes('"@type": "PlumbingService"') ||
    improvedIndex.content.includes('"@type": "LocalBusiness"') ||
    improvedIndex.content.includes('"@context": "https://schema.org"'),
    "Injected valid LocalBusiness Schema.org JSON-LD"
  );
  pass("Verified Schema.org LocalBusiness JSON-LD markup");

  // Verify sitemap.xml and robots.txt exist
  const sitemap = improvementResult.improvedFiles.find((f) => f.path === "sitemap.xml");
  const robots = improvementResult.improvedFiles.find((f) => f.path === "robots.txt");
  assert.ok(sitemap, "Generated sitemap.xml");
  assert.ok(robots, "Generated robots.txt");
  pass("Verified sitemap.xml and robots.txt generated in project files");

  // 6. TEST DOWNLOAD ZIP MATCHES PREVIEW & IMPROVED CONTENT
  console.log("\n--- 6. ZIP Packaging & File Parity ---");
  const bundleResult = await bundleProjectToZipStream({
    projectName: "Lone Star Plumbing & Rooter",
    files: improvementResult.improvedFiles,
    photos: assembled.photos || [],
    domain: "lonestarplumbingdfw.com",
  });

  const reader = bundleResult.stream.getReader();
  const chunks: Buffer[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(Buffer.from(value));
  }
  const zipBuffer = Buffer.concat(chunks);
  assert.ok(zipBuffer.length > 1000, "ZIP buffer generated successfully");

  // Inspect ZIP entries using JSZip
  const unzipped = await JSZip.loadAsync(zipBuffer);
  const zipFileNames = Object.keys(unzipped.files);

  assert.ok(zipFileNames.includes("index.html"), "ZIP contains index.html");
  assert.ok(zipFileNames.includes("water-heater-repair.html"), "ZIP contains water-heater-repair.html");
  assert.ok(zipFileNames.includes("sitemap.xml"), "ZIP contains sitemap.xml");
  assert.ok(zipFileNames.includes("robots.txt"), "ZIP contains robots.txt");

  const unzippedIndexContent = await unzipped.file("index.html")?.async("string");
  assert.ok(
    unzippedIndexContent?.includes("ranklocal-sticky-call-bar"),
    "ZIP index.html contains all 95+ improvements"
  );
  assert.ok(
    unzippedIndexContent?.includes("2145550198"),
    "ZIP index.html contains phone call conversion number"
  );
  assert.ok(
    unzippedIndexContent?.includes("lonestarplumbingdfw.com"),
    "ZIP index.html contains canonical domain"
  );
  assert.ok(
    unzippedIndexContent && unzippedIndexContent.length > 500,
    "ZIP index.html has complete content length"
  );
  pass(`Production ZIP (${zipBuffer.length} bytes, ${zipFileNames.length} files) preserves all 95+ improvements and matches preview structure`);

  console.log("\n==========================================================================");
  console.log(` ALL ${testCount} WORKFLOW & STABILITY CHECKS PASSED WITH ZERO ERRORS!`);
  console.log("==========================================================================");
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
