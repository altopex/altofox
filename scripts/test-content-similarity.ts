/**
 * Verification Script: Deterministic Content Similarity Checker
 *
 * Tests:
 * 1. 7-dimensional similarity check on all pairs of Chicago Plumbing pages:
 *    - Title similarity
 *    - H1 similarity
 *    - Heading similarity
 *    - Paragraph similarity
 *    - Sentence / phrase repetition (4-grams)
 *    - Meta description duplication
 *    - Overall page similarity
 * 2. Self-healing regeneration loop:
 *    - Injects a duplicate page (simulating accidental duplication)
 *    - Detects similarity exceeding threshold
 *    - Flags the page
 *    - Automatically regenerates using alternate content strategy
 *    - Re-evaluates similarity
 *    - Produces the Content Quality Audit Report
 */

import { createSiteBlueprint } from "../lib/blueprint/site-blueprint";
import {
  generateSiteContentFromBlueprint,
  generatePageContent,
  PageGenerationContext,
} from "../lib/generator/content-generators";
import {
  comparePages,
  auditSiteSimilarity,
  auditAndDifferentiateSitePages,
  extractPageTextFromJSON,
} from "../lib/quality/content-similarity-checker";

async function main() {
  console.log("==================================================================");
  console.log("TESTING CONTENT SIMILARITY CHECKER: CHICAGO PLUMBING");
  console.log("==================================================================\n");

  const blueprint = createSiteBlueprint({
    businessName: "Chicago Master Plumbing Pros",
    niche: "Plumbing",
    primaryCity: "Chicago",
    state: "Illinois",
    services: ["Water Heater Repair", "Drain Cleaning", "Leak Detection"],
    locations: ["Loop"],
  });

  const verifiedFacts = {
    businessName: "Chicago Master Plumbing Pros",
    trade: "Plumbing",
    city: "Chicago",
    state: "Illinois",
    phone: "(312) 555-0199",
    streetAddress: "123 N Michigan Ave",
    yearsInBusiness: "15+",
    licenseNumber: "IL-PLUMB-055-12345",
    emergency247: true,
    freeEstimates: true,
    insuredBonded: true,
  };

  console.log("Step 1: Generating baseline pages from Blueprint...");
  const siteContent = await generateSiteContentFromBlueprint(blueprint, verifiedFacts);

  // Filter down to the 5 requested pages
  // 1. Homepage, 2. Water Heater Repair, 3. Drain Cleaning, 4. Leak Detection, 5. Chicago Location
  const home = siteContent.pages.find((p) => p.slug === "index")!;
  const waterHeater = siteContent.pages.find((p) => p.slug === "water-heater-repair")!;
  const drainCleaning = siteContent.pages.find((p) => p.slug === "drain-cleaning")!;
  const leakDetection = siteContent.pages.find((p) => p.slug === "leak-detection")!;
  const serviceAreas = siteContent.pages.find((p) => p.slug === "service-areas")!;

  const testPages = [home, waterHeater, drainCleaning, leakDetection, serviceAreas];

  console.log(`Generated ${testPages.length} test pages:\n` + testPages.map((p) => ` - [${p.slug}] ${p.seo.title}`).join("\n"));

  console.log("\n==================================================================");
  console.log("STEP 2: PAIRWISE SIMILARITY MATRIX (7 METRICS)");
  console.log("==================================================================\n");

  for (let i = 0; i < testPages.length; i++) {
    for (let j = i + 1; j < testPages.length; j++) {
      const pageA = testPages[i];
      const pageB = testPages[j];
      const pair = comparePages(pageA, pageB, {
        brandTerms: ["Chicago Master Plumbing Pros", "(312) 555-0199"],
        similarityThreshold: 0.35,
      });

      console.log(`[PAIR] ${pair.pageA} <====> ${pair.pageB}:`);
      console.log(`  • Overall Similarity:     ${pair.similarityPercentage}%  (threshold: 35% -> ${pair.exceedsThreshold ? "FLAGGED" : "PASSED"})`);
      console.log(`  • Title Similarity:       ${Math.round(pair.titleSimilarity * 100)}%`);
      console.log(`  • H1 Similarity:          ${Math.round(pair.h1Similarity * 100)}%`);
      console.log(`  • Heading Similarity:     ${Math.round(pair.headingSimilarity * 100)}%`);
      console.log(`  • Paragraph Similarity:   ${Math.round(pair.paragraphSimilarity * 100)}%`);
      console.log(`  • Phrase Repetition:      ${Math.round(pair.phraseRepetition * 100)}% (Shared 4-grams: ${pair.sharedPhrases.length})`);
      console.log(`  • Meta Desc Similarity:   ${Math.round(pair.metaSimilarity * 100)}%`);
      if (pair.sharedPhrases.length > 0) {
        console.log(`  • Sample shared phrases:  "${pair.sharedPhrases.slice(0, 2).join('", "')}"`);
      }
      console.log("");
    }
  }

  console.log("==================================================================");
  console.log("STEP 3: SITE AUDIT REPORT (BASELINE PASS)");
  console.log("==================================================================\n");

  const baselineAudit = auditSiteSimilarity(testPages, { similarityThreshold: 0.35 });
  console.log(baselineAudit.summaryText);
  console.log(`\nAverage Pairwise Similarity: ${baselineAudit.averageSimilarityPercentage}%`);
  console.log(`Highest Similarity Pair:     ${baselineAudit.highestSimilarityPair?.pageA} <-> ${baselineAudit.highestSimilarityPair?.pageB} (${baselineAudit.highestSimilarityPair?.similarityPercentage}%)`);

  console.log("\n==================================================================");
  console.log("STEP 4: SIMULATING DUPLICATE COLLISION & SELF-HEALING REGENERATION");
  console.log("==================================================================");

  // Construct a near-duplicate clone of drain cleaning to deliberately trigger the threshold
  const clonedPage = JSON.parse(JSON.stringify(drainCleaning));
  clonedPage.slug = "clogged-drain-repair";
  clonedPage.seo.title = "Clogged Drain Repair in Chicago, Illinois | Chicago Master Plumbing Pros";
  // Keep body text 90% identical

  const pagesWithDuplicate = [...testPages, clonedPage];

  // Set up context map for regeneration
  const contexts = new Map<string, PageGenerationContext>();
  for (const page of testPages) {
    contexts.set(page.slug, {
      pageType: page.slug === "index" ? "home" : page.slug === "service-areas" ? "location" : "service",
      pagePurpose: `Page for ${page.slug}`,
      primaryKeyword: `${page.slug.replace(/-/g, " ")} chicago`,
      secondaryKeywords: ["chicago plumber", "emergency repair"],
      searchIntent: "transactional",
      service: { name: page.slug.replace(/-/g, " "), slug: page.slug },
      location: { city: "Chicago", state: "Illinois" },
      relatedServices: [{ name: "Water Heater Repair", slug: "water-heater-repair" }],
      relatedLocations: [{ name: "Chicago", slug: "chicago" }],
      internalLinkTargets: [{ label: "Home", href: "index.html", role: "hub" }],
      contentVariationSeed: { siteSeed: "CHI-PLUMB-101", pageSeed: `seed-${page.slug}` },
      businessFacts: verifiedFacts,
    });
  }

  // Add context for the cloned page with alternate keywords
  contexts.set(clonedPage.slug, {
    pageType: "service",
    pagePurpose: "Commercial hydro-jetting and main line root eradication",
    primaryKeyword: "sewer hydro jetting chicago",
    secondaryKeywords: ["commercial rooter", "heavy duty drain cleaning"],
    searchIntent: "transactional",
    service: { name: "Sewer Hydro Jetting", slug: clonedPage.slug },
    location: { city: "Chicago", state: "Illinois" },
    relatedServices: [{ name: "Water Heater Repair", slug: "water-heater-repair" }],
    relatedLocations: [{ name: "Chicago", slug: "chicago" }],
    internalLinkTargets: [{ label: "Home", href: "index.html", role: "hub" }],
    contentVariationSeed: { siteSeed: "CHI-PLUMB-101", pageSeed: "seed-clogged-drain" },
    businessFacts: verifiedFacts,
  });

  console.log(`\nInjected duplicate page: "${clonedPage.slug}" (Clone of "drain-cleaning").`);
  console.log("Initial clone similarity with drain-cleaning:");
  const preCheck = comparePages(drainCleaning, clonedPage);
  console.log(`  Similarity: ${preCheck.similarityPercentage}% (Exceeds threshold: ${preCheck.exceedsThreshold})\n`);

  console.log("Running auditAndDifferentiateSitePages (Self-healing regeneration loop)...");
  const remediationResult = await auditAndDifferentiateSitePages(
    pagesWithDuplicate,
    contexts,
    { similarityThreshold: 0.35, maxRetries: 3 }
  );

  console.log("\n==================================================================");
  console.log("FINAL REMEDIATION AUDIT REPORT");
  console.log("==================================================================\n");

  console.log(remediationResult.audit.summaryText);
  console.log("\nRegeneration History:");
  for (const hist of remediationResult.audit.regenerationHistory) {
    console.log(
      `  • Page: "${hist.pageSlug}" | Attempt #${hist.attempt} | Strategy: "${hist.strategyUsed}" | ` +
      `Similarity: ${hist.previousSimilarityPercentage}% -> ${hist.newSimilarityPercentage}% | ` +
      `Status: ${hist.resolved ? "RESOLVED (Under threshold)" : "STILL OVER THRESHOLD"}`
    );
  }

  console.log(`\nFinal Flagged Pages: ${remediationResult.audit.finalFlaggedPagesCount}`);
  if (remediationResult.audit.finalFlaggedPagesCount === 0) {
    console.log("✅ SUCCESS: All pages differentiated within similarity threshold!");
  } else {
    console.log("⚠️ Some pages remain flagged.");
  }
}

main().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
