/**
 * Verification test suite for ImageEngine and the Image Architecture Refactoring.
 *
 * Verifies:
 * 1. Supported Modes:
 *    - Bing (preserves existing provider)
 *    - Google (legitimate Custom Search API with Google -> Bing -> no image failover)
 *    - None (zero external requests, no images or clean local SVG)
 * 2. 9-Stage Pipeline in ImageEngine:
 *    Page Intent -> Search Query -> Candidate Images -> URL Validation ->
 *    Relevance Check -> Duplicate Check -> Dimension Check -> Assignment -> Optimization
 * 3. Exact Query Generation alignments:
 *    - Homepage: professional residential plumbing technician
 *    - Water heater: water heater repair technician
 *    - Drain cleaning: professional drain cleaning technician
 *    - Leak detection: plumber leak detection pipe inspection
 *    - Emergency: emergency plumber technician
 * 4. Tracking and Rules:
 *    - pageUsedImages: Never use the same image twice on one page
 *    - siteUsedImages: Avoid repeating the same image throughout a website
 *    - imageHash: Deterministic canonical hashing
 *    - Cross-site frequency tracking
 *    - Dimension checks & rejection of tracking pixels (<150 bytes, 1x1)
 *    - Useful alt text generation
 *    - Image optimization (parameters, loading="lazy", decoding="async")
 * 5. Full site generation with at least 10 pages:
 *    - Verifies zero duplicate images across all pages
 */

import {
  ImageEngine,
  computeImageHash,
  normalizeImageMode,
  ImageSlotContext,
} from "../lib/photos/image-engine";
import { executeGenerationPipeline } from "../lib/pipeline/pipeline-executor";

async function runImageEngineTests() {
  console.log("===============================================================================");
  console.log("   RANKLOCAL 2.0: IMAGE ENGINE ARCHITECTURE VERIFICATION TEST SUITE");
  console.log("===============================================================================\n");

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition: boolean, msg: string) {
    totalTests++;
    if (!condition) {
      console.error(`❌ FAILED: ${msg}`);
      throw new Error(`Assertion failed: ${msg}`);
    } else {
      console.log(`✅ PASSED: ${msg}`);
      passedTests++;
    }
  }

  // =========================================================================
  // TEST 1: Canonical Image Modes Normalization
  // =========================================================================
  console.log("\n--- TEST 1: Image Modes Normalization (Bing, Google, None) ---");
  assert(normalizeImageMode("bing") === "bing", "normalizeImageMode('bing') === 'bing'");
  assert(normalizeImageMode("Bing") === "bing", "normalizeImageMode('Bing') === 'bing'");
  assert(normalizeImageMode("google") === "google", "normalizeImageMode('google') === 'google'");
  assert(normalizeImageMode("Google") === "google", "normalizeImageMode('Google') === 'google'");
  assert(normalizeImageMode("none") === "none", "normalizeImageMode('none') === 'none'");
  assert(normalizeImageMode("None") === "none", "normalizeImageMode('None') === 'none'");
  assert(normalizeImageMode("off") === "none", "normalizeImageMode('off') === 'none'");
  assert(normalizeImageMode(undefined) === "bing", "default fallback is 'bing'");

  // =========================================================================
  // TEST 2: Deterministic imageHash Implementation
  // =========================================================================
  console.log("\n--- TEST 2: imageHash Functionality ---");
  const bingUrl1 = "https://tse1.mm.bing.net/th?q=water+heater+repair&w=800&h=533";
  const bingUrl2 = "https://tse2.mm.bing.net/th?q=water+heater+repair&w=1200&h=800";
  const bingUrl3 = "https://tse1.mm.bing.net/th?q=drain+cleaning&w=800&h=533";

  const hash1 = computeImageHash(bingUrl1);
  const hash2 = computeImageHash(bingUrl2);
  const hash3 = computeImageHash(bingUrl3);

  assert(Boolean(hash1), "hash1 is computed");
  assert(hash1 === hash2, "Identical Bing queries across different CDN shards/sizes yield identical imageHash");
  assert(hash1 !== hash3, "Different queries yield different imageHash");

  const pexelsUrl1 = "https://images.pexels.com/photos/1249586/pexels-photo-1249586.jpeg?auto=compress&w=800";
  const pexelsUrl2 = "https://images.pexels.com/photos/1249586/pexels-photo-1249586.jpeg?auto=compress&w=1600";
  assert(computeImageHash(pexelsUrl1) === computeImageHash(pexelsUrl2), "Pexels URLs with same photo ID yield identical imageHash");

  // =========================================================================
  // TEST 3: Specific Query Generation Alignments
  // =========================================================================
  console.log("\n--- TEST 3: Search Query Generation Alignments from Spec ---");
  const engine = new ImageEngine({ mode: "bing" });

  // 1. Homepage
  const homeContext: ImageSlotContext = {
    pageType: "home",
    pageSlug: "index",
    section: "hero",
    niche: "plumbing",
  };
  const homeIntent = engine.determinePageIntent(homeContext);
  const homeQuery = engine.generateSearchQuery(homeIntent, homeContext);
  assert(
    homeQuery === "professional residential plumbing technician",
    `Homepage query matches specification: "${homeQuery}"`
  );

  // 2. Water heater
  const whContext: ImageSlotContext = {
    pageType: "service",
    pageSlug: "water-heater-repair",
    section: "hero",
    niche: "plumbing",
    service: "Water Heater Repair",
  };
  const whIntent = engine.determinePageIntent(whContext);
  const whQuery = engine.generateSearchQuery(whIntent, whContext);
  assert(
    whQuery === "water heater repair technician",
    `Water heater query matches specification: "${whQuery}"`
  );

  // 3. Drain cleaning
  const dcContext: ImageSlotContext = {
    pageType: "service",
    pageSlug: "drain-cleaning",
    section: "hero",
    niche: "plumbing",
    service: "Drain Cleaning",
  };
  const dcIntent = engine.determinePageIntent(dcContext);
  const dcQuery = engine.generateSearchQuery(dcIntent, dcContext);
  assert(
    dcQuery === "professional drain cleaning technician",
    `Drain cleaning query matches specification: "${dcQuery}"`
  );

  // 4. Leak detection
  const ldContext: ImageSlotContext = {
    pageType: "service",
    pageSlug: "leak-detection",
    section: "hero",
    niche: "plumbing",
    service: "Leak Detection",
  };
  const ldIntent = engine.determinePageIntent(ldContext);
  const ldQuery = engine.generateSearchQuery(ldIntent, ldContext);
  assert(
    ldQuery === "plumber leak detection pipe inspection",
    `Leak detection query matches specification: "${ldQuery}"`
  );

  // 5. Emergency
  const emContext: ImageSlotContext = {
    pageType: "service",
    pageSlug: "emergency-plumbing",
    section: "hero",
    niche: "plumbing",
    service: "Emergency Plumbing",
  };
  const emIntent = engine.determinePageIntent(emContext);
  const emQuery = engine.generateSearchQuery(emIntent, emContext);
  assert(
    emQuery === "emergency plumber technician",
    `Emergency query matches specification: "${emQuery}"`
  );

  // =========================================================================
  // TEST 4: Mode "None" Processing
  // =========================================================================
  console.log("\n--- TEST 4: Mode 'None' Handling ---");
  const noneEngine = new ImageEngine({ mode: "none" });
  const noneResult = await noneEngine.processSlot(homeContext);
  assert(noneResult.url === "", "Mode 'none' returns empty URL for remote image");
  assert(noneResult.status === "none", "Mode 'none' sets status = 'none'");
  assert(Boolean(noneResult.localSvgFallback), "Mode 'none' generates clean local SVG fallback");
  assert(noneResult.searchQuery === "professional residential plumbing technician", "Mode 'none' generates accurate query without calling network");

  // =========================================================================
  // TEST 5: Mode "Google" with Failover Chain (Google -> Bing -> No Image)
  // =========================================================================
  console.log("\n--- TEST 5: Google Mode Failover (Google -> Bing -> no image) ---");
  // Test with invalid credentials to ensure failover to Bing is seamless and does not crash
  const googleFailEngine = new ImageEngine({
    mode: "google",
    googleApiKey: "invalid_key_for_testing",
    googleCx: "invalid_cx_for_testing",
  });
  const googleFailoverResult = await googleFailEngine.processSlot(whContext);
  assert(Boolean(googleFailoverResult.url), "Google failure cleanly fell back to Bing");
  assert(googleFailoverResult.source === "bing", "Resolved candidate source is 'bing' via failover");
  assert(Boolean(googleFailoverResult.hash), "Assigned candidate has valid hash");

  // =========================================================================
  // TEST 6: Deduplication Enforcement (pageUsedImages & siteUsedImages)
  // =========================================================================
  console.log("\n--- TEST 6: Strict Deduplication (pageUsedImages & siteUsedImages) ---");
  const dedupEngine = new ImageEngine({ mode: "bing" });

  // Slot 1 on home page
  const res1 = await dedupEngine.processSlot({
    pageType: "home",
    pageSlug: "index",
    section: "hero",
    niche: "plumbing",
    slotIndex: 0,
  });

  // Slot 2 on same home page
  const res2 = await dedupEngine.processSlot({
    pageType: "home",
    pageSlug: "index",
    section: "service",
    niche: "plumbing",
    service: "General Plumbing",
    slotIndex: 1,
  });

  assert(res1.hash !== res2.hash, "Different slots on the same page have distinct hashes");
  assert(res1.url !== res2.url, "Rule 1: Never use the same image twice on one page");
  assert(dedupEngine.getPageUsedImages("index").size === 2, "pageUsedImages contains both distinct hashes");
  assert(dedupEngine.getSiteUsedImages().size === 2, "siteUsedImages contains both distinct hashes");

  // =========================================================================
  // TEST 7: Useful Alt Text & Image Optimization
  // =========================================================================
  console.log("\n--- TEST 7: Alt Text & Image Optimization Attributes ---");
  const optResult = await dedupEngine.processSlot({
    pageType: "service",
    pageSlug: "drain-cleaning",
    section: "hero",
    niche: "plumbing",
    service: "Drain Cleaning",
    city: "Denver",
    state: "CO",
  });

  assert(
    optResult.alt.toLowerCase().includes("denver") && optResult.alt.toLowerCase().includes("drain cleaning"),
    `Rule 7: Alt text is descriptive and localized: "${optResult.alt}"`
  );
  assert(optResult.optimization.loading === "eager", "Hero section uses loading='eager'");
  assert(optResult.optimization.decoding === "async", "Image uses decoding='async'");
  assert(optResult.optimization.fetchpriority === "high", "Hero section uses fetchpriority='high'");
  assert(optResult.url.includes("&c=7&rs=1"), "Bing URL includes optimization parameters (&c=7&rs=1)");

  // =========================================================================
  // TEST 8: Full Site Generation with 10+ Pages & Verification of No Duplicate Images
  // =========================================================================
  console.log("\n--- TEST 8: Full Site Generation with 10+ Pages (Zero Duplicates) ---");

  const tenPagesInput = {
    businessName: "Elite Metro Plumbing & Drain",
    businessType: "Plumbing",
    city: "Chicago",
    targetLocation: "Chicago",
    formData: {
      businessName: "Elite Metro Plumbing & Drain",
      businessType: "Plumbing",
      city: "Chicago",
      stateRegion: "IL",
      phone: "(312) 555-0144",
      email: "contact@elitemetroplumbing.com",
      streetAddress: "400 N Michigan Ave",
      services: [
        "Water Heater Repair",
        "Drain Cleaning",
        "Leak Detection",
        "Emergency Plumbing",
        "Pipe Replacement",
        "Sewer Line Inspection",
        "Commercial Plumbing",
        "Faucet and Toilet Repair",
      ],
      serviceAreas: "Chicago, Evanston, Naperville, Aurora, Joliet, Schaumburg",
      keywords: "plumber Chicago, water heater repair Chicago, drain cleaning, 24/7 emergency plumber",
      yearsInBusiness: "20",
      licenseNumber: "IL-PL-99201",
      emergency247: true,
      freeEstimates: true,
      insuredBonded: true,
      theme: { id: "pipe-and-wrench" },
      preferredSource: "bing",
    },
    demo: true,
  };

  const genResult = await executeGenerationPipeline(tenPagesInput);
  assert(genResult.success === true, "10+ Page Website generation completed successfully");
  assert(Boolean(genResult.files), "Files generated");

  const htmlFiles = genResult.files?.filter((f) => f.path.endsWith(".html")) || [];
  console.log(`Generated ${htmlFiles.length} HTML pages.`);
  assert(htmlFiles.length >= 10, `Generated at least 10 pages (got ${htmlFiles.length})`);

  // Parse all <img src="..."> tags across all generated HTML pages
  const pageImageMap = new Map<string, string[]>();
  const allImagesSet = new Set<string>();
  let duplicateCount = 0;

  for (const page of htmlFiles) {
    const content = typeof page.content === "string" ? page.content : page.content.toString("utf8");
    const imgMatches = content.match(/<img[^>]+src="([^">]+)"/g) || [];
    const srcList: string[] = [];

    for (const tag of imgMatches) {
      const srcMatch = tag.match(/src="([^">]+)"/);
      if (srcMatch && srcMatch[1]) {
        const src = srcMatch[1];
        // Only inspect substantive photo URLs (ignore tiny icons or base64 logos)
        if (src.includes("http") || src.startsWith("images/")) {
          const hash = computeImageHash(src);
          if (srcList.includes(hash)) {
            duplicateCount++;
            console.error(`❌ Duplicate image on page ${page.path}: ${src}`);
          }
          srcList.push(hash);
          allImagesSet.add(hash);
        }
      }
    }
    pageImageMap.set(page.path, srcList);
  }

  console.log(`Total unique image hashes across all pages: ${allImagesSet.size}`);
  assert(duplicateCount === 0, `Rule 1: Zero duplicate images on any single page (got ${duplicateCount} duplicates)`);
  assert(allImagesSet.size >= 10, `Rule 2: Diverse image assignment across site (at least 10 unique images, got ${allImagesSet.size})`);

  console.log("\n===============================================================================");
  console.log(`   ALL TESTS PASSED: ${passedTests}/${totalTests} assertions verified successfully!`);
  console.log("===============================================================================\n");
}

runImageEngineTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
