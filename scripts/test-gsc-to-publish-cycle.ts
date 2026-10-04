/**
 * End-to-End Verification Test: Google Search Console Continuous Growth Engine
 * 
 * Verifies the complete 12-stage lifecycle:
 * Google Search Console
 *         ↓
 * Search Queries
 *         ↓
 * Impressions
 *         ↓
 * Clicks
 *         ↓
 * CTR
 *         ↓
 * Average Position
 *         ↓
 * Keyword Opportunities
 *         ↓
 * AI Recommendations
 *         ↓
 * User Approval
 *         ↓
 * New Page
 *         ↓
 * Audit
 *         ↓
 * Publish
 */

import { parseGscCsv, getExpectedCtrForPosition, GSCQueryRow } from "../lib/search-console/search-console-analyzer";
import { buildComprehensiveOpportunityList, GSCOpportunityRecommendation } from "../lib/seo/opportunity-engine";
import { createDedicatedPage } from "../lib/generator/page-creator";
import { QualityAuditEngine } from "../lib/quality/quality-audit-engine";
import { generateProductionWebsiteZip } from "../lib/export/zip-production-builder";
import { stripSensitiveTokens } from "../lib/publishing/token-sanitizer";

async function runGscContinuousOptimizationTest() {
  console.log("================================================================================");
  console.log("   RANKLOCAL 2.0: GOOGLE SEARCH CONSOLE CONTINUOUS OPTIMIZATION PIPELINE TEST   ");
  console.log("================================================================================\n");

  let totalAssertions = 0;
  let passedAssertions = 0;

  function assert(condition: boolean, stepNumber: number, title: string, details?: string) {
    totalAssertions++;
    if (condition) {
      passedAssertions++;
      console.log(`  [PASS] Step ${stepNumber}: ${title}${details ? ` -> ${details}` : ""}`);
    } else {
      console.error(`  [FAIL] Step ${stepNumber}: ${title}${details ? ` -> ${details}` : ""}`);
      process.exit(1);
    }
  }

  // Baseline Website Files
  const initialFiles = [
    {
      path: "index.html",
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Apex Heating & Cooling | Dallas HVAC Specialists</title>
  <meta name="description" content="Apex Heating & Cooling offers elite AC repair and heating services in Dallas, TX. Call (214) 555-0199.">
  <link rel="canonical" href="https://apexheatingdallas.com/">
  <link rel="stylesheet" href="styles.css">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"HVACBusiness","name":"Apex Heating & Cooling","telephone":"(214) 555-0199"}</script>
</head>
<body>
  <header><nav><a href="index.html">Home</a><a href="services.html">Services</a><a href="contact.html">Contact</a></nav></header>
  <main>
    <h1>Dallas Premier Heating & Cooling Services</h1>
    <p>We provide full-scale HVAC repairs, seasonal maintenance, and new system installations across Dallas and surrounding neighborhoods.</p>
    <a href="tel:2145550199">Call (214) 555-0199</a>
  </main>
  <footer><p>&copy; 2026 Apex Heating & Cooling. <a href="contact.html">Contact</a></p></footer>
</body>
</html>`,
    },
    {
      path: "services.html",
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HVAC Services in Dallas, TX | Apex Heating & Cooling</title>
  <meta name="description" content="Explore residential and commercial heating and cooling services provided by Apex Heating & Cooling in Dallas.">
  <link rel="canonical" href="https://apexheatingdallas.com/services.html">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header><nav><a href="index.html">Home</a><a href="services.html">Services</a><a href="contact.html">Contact</a></nav></header>
  <main>
    <h1>Comprehensive HVAC Solutions in Dallas</h1>
    <p>From prompt diagnostics to complete replacements, our licensed technicians ensure your system runs at peak energy efficiency.</p>
    <a href="tel:2145550199">Call (214) 555-0199</a>
  </main>
  <footer><p>&copy; 2026 Apex Heating & Cooling.</p></footer>
</body>
</html>`,
    },
    {
      path: "contact.html",
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contact Us | Apex Heating & Cooling Dallas</title>
  <meta name="description" content="Contact Apex Heating & Cooling for emergency Dallas HVAC dispatch and free replacement estimates.">
  <link rel="canonical" href="https://apexheatingdallas.com/contact.html">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header><nav><a href="index.html">Home</a><a href="services.html">Services</a><a href="contact.html">Contact</a></nav></header>
  <main>
    <h1>Contact Our Dallas HVAC Dispatch</h1>
    <p>Available 24/7 for emergency repairs and scheduled consultations.</p>
    <a href="tel:2145550199">Call (214) 555-0199</a>
  </main>
  <footer><p>&copy; 2026 Apex Heating & Cooling.</p></footer>
</body>
</html>`,
    },
    {
      path: "styles.css",
      content: `body { font-family: sans-serif; margin: 0; padding: 0; color: #333; } nav a { margin-right: 15px; }`,
    },
    {
      path: "robots.txt",
      content: `User-agent: *\nAllow: /\nSitemap: https://apexheatingdallas.com/sitemap.xml\n`,
    },
    {
      path: "sitemap.xml",
      content: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://apexheatingdallas.com/</loc><priority>1.0</priority></url>
  <url><loc>https://apexheatingdallas.com/services.html</loc><priority>0.8</priority></url>
  <url><loc>https://apexheatingdallas.com/contact.html</loc><priority>0.8</priority></url>
</urlset>`,
    },
  ];

  // ---------------------------------------------------------------------------
  // STEP 1: Google Search Console (Data Source Ingestion)
  // ---------------------------------------------------------------------------
  console.log("--> Stage 1: Google Search Console (GSC Data Source Ingestion)");
  const gscCsvExport = `Top queries,Clicks,Impressions,CTR,Position
emergency ac repair plano tx,42,850,4.94%,7.2
ductless mini split installation dallas,18,620,2.90%,8.4
heat pump repair fort worth,2,110,1.82%,14.1
ac tune up specials dallas,95,1200,7.92%,2.1
furnace replacement plano,8,340,2.35%,9.8`;

  assert(gscCsvExport.length > 50, 1, "Google Search Console performance export ready", `${gscCsvExport.split('\n').length - 1} query rows`);

  // ---------------------------------------------------------------------------
  // STEP 2: Search Queries
  // ---------------------------------------------------------------------------
  console.log("\n--> Stage 2: Search Queries Extraction");
  const parsed = parseGscCsv(gscCsvExport);
  assert(parsed.queries.length === 5, 2, "Search Queries parsed from GSC export", `${parsed.queries.length} queries loaded`);
  const emergencyQuery = parsed.queries.find((q) => q.query.includes("emergency ac repair plano"));
  assert(!!emergencyQuery, 2, "Identified high-intent search query", `"${emergencyQuery?.query}"`);

  // ---------------------------------------------------------------------------
  // STEP 3: Impressions
  // ---------------------------------------------------------------------------
  console.log("\n--> Stage 3: Impressions Metric Evaluation");
  assert((emergencyQuery?.impressions || 0) === 850, 3, "Impressions captured accurately", `${emergencyQuery?.impressions} impressions`);
  assert(parsed.queries.every((q) => q.impressions > 0), 3, "All search queries have deterministic impression counts");

  // ---------------------------------------------------------------------------
  // STEP 4: Clicks
  // ---------------------------------------------------------------------------
  console.log("\n--> Stage 4: Clicks Metric Evaluation");
  assert((emergencyQuery?.clicks || 0) === 42, 4, "Clicks captured accurately", `${emergencyQuery?.clicks} clicks`);
  assert(parsed.queries.reduce((acc, q) => acc + q.clicks, 0) === 165, 4, "Total clicks verified (165 total clicks)");

  // ---------------------------------------------------------------------------
  // STEP 5: CTR (Click-Through Rate)
  // ---------------------------------------------------------------------------
  console.log("\n--> Stage 5: CTR (Click-Through Rate) Evaluation");
  const computedCtr = Number(((emergencyQuery?.clicks || 0) / (emergencyQuery?.impressions || 1)).toFixed(4));
  assert(Math.abs(computedCtr - 0.0494) < 0.001, 5, "CTR calculated deterministically", `${(computedCtr * 100).toFixed(2)}% CTR`);

  // ---------------------------------------------------------------------------
  // STEP 6: Average Position
  // ---------------------------------------------------------------------------
  console.log("\n--> Stage 6: Average Position Analysis");
  assert(emergencyQuery?.position === 7.2, 6, "Average Position captured accurately", `Position ${emergencyQuery?.position}`);
  const expectedCtr = getExpectedCtrForPosition(emergencyQuery?.position || 10);
  assert(expectedCtr > 0, 6, "Position benchmarked against CTR curves", `Expected CTR: ${(expectedCtr * 100).toFixed(1)}%`);

  // ---------------------------------------------------------------------------
  // STEP 7: Keyword Opportunities
  // ---------------------------------------------------------------------------
  console.log("\n--> Stage 7: Keyword Opportunities Engine");
  const keywordMap = [
    { pagePath: "index.html", primaryKeyword: "Dallas HVAC Services" },
    { pagePath: "services.html", primaryKeyword: "HVAC Services Dallas" },
  ];
  const opportunities = buildComprehensiveOpportunityList(
    parsed.queries,
    initialFiles,
    keywordMap,
    {
      businessType: "HVAC Contractor",
      city: "Dallas",
      serviceAreas: ["Dallas", "Plano", "Fort Worth"],
    }
  );

  assert(opportunities.length > 0, 7, "Keyword Opportunities surfaced", `${opportunities.length} opportunities mapped`);
  const topOpp = opportunities.find((o) => o.query.includes("emergency ac repair plano"));
  assert(!!topOpp, 7, "Top Keyword Opportunity matches target query", `Query: "${topOpp?.query}"`);

  // ---------------------------------------------------------------------------
  // STEP 8: AI Recommendations
  // ---------------------------------------------------------------------------
  console.log("\n--> Stage 8: AI Recommendations Synthesis");
  assert(topOpp?.action === "create_page", 8, "AI Recommendation generated", `Action: ${topOpp?.action}`);
  assert(topOpp?.suggestedSlug === "emergency-ac-repair-plano.html", 8, "Recommended Slug generated", `${topOpp?.suggestedSlug}`);
  assert(topOpp?.suggestedTitle.includes("Plano"), 8, "Recommended Title generated", `"${topOpp?.suggestedTitle}"`);
  assert(topOpp?.cannibalization.hasRisk === false, 8, "Zero Keyword Cannibalization verified", "No conflict with existing pages");

  // ---------------------------------------------------------------------------
  // STEP 9: User Approval
  // ---------------------------------------------------------------------------
  console.log("\n--> Stage 9: User Approval Simulation");
  const approvedPayload = {
    primaryQuery: topOpp!.query,
    serviceName: "Emergency AC Repair",
    locationCity: "Plano",
    locationState: "TX",
    title: topOpp!.suggestedTitle,
    slug: topOpp!.suggestedSlug,
    searchIntent: topOpp!.searchIntent,
    relatedQueries: ["24/7 air conditioning repair", "emergency HVAC service Plano", "same day AC repair"],
    navPlacement: "service_submenu" as const,
  };
  assert(!!approvedPayload.slug && !!approvedPayload.primaryQuery, 9, "User Approval validated", `Approved page: ${approvedPayload.slug}`);

  // ---------------------------------------------------------------------------
  // STEP 10: New Page Generation
  // ---------------------------------------------------------------------------
  console.log("\n--> Stage 10: New Page Generation & Intelligent Cross-Linking");
  const pageResult = await createDedicatedPage(
    approvedPayload,
    initialFiles,
    {
      businessName: "Apex Heating & Cooling",
      city: "Dallas",
      stateRegion: "TX",
      phone: "(214) 555-0199",
      websiteDomain: "apexheatingdallas.com",
      businessType: "HVAC Contractor",
    }
  );

  assert(pageResult.newPageFile.path === "emergency-ac-repair-plano.html", 10, "New Page file created", pageResult.newPageFile.path);
  assert(pageResult.newPageFile.content.includes("<!DOCTYPE html>"), 10, "Valid HTML structure generated");
  assert(pageResult.newPageFile.content.includes('<link rel="canonical"'), 10, "Canonical link generated");
  assert(pageResult.newPageFile.content.includes("Emergency AC Repair in Plano, TX"), 10, "H1 hierarchy generated");
  assert(pageResult.newPageFile.content.includes("application/ld+json"), 10, "Schema JSON-LD generated");
  assert(pageResult.incomingLinksCount > 0, 10, "Contextual inlinks injected into existing pages", `${pageResult.incomingLinksCount} pages linked`);
  assert(pageResult.sitemapFile.content.includes("emergency-ac-repair-plano.html"), 10, "sitemap.xml updated with new URL");

  // Merge files into updated website
  const updatedFilesMap = new Map<string, { path: string; content: string }>();
  for (const f of initialFiles) updatedFilesMap.set(f.path, f);
  for (const f of pageResult.updatedExistingFiles) updatedFilesMap.set(f.path, f);
  updatedFilesMap.set(pageResult.newPageFile.path, pageResult.newPageFile);
  updatedFilesMap.set(pageResult.sitemapFile.path, pageResult.sitemapFile);
  const updatedFiles = Array.from(updatedFilesMap.values());

  // ---------------------------------------------------------------------------
  // STEP 11: Audit (Deterministic Website Quality Audit Engine)
  // ---------------------------------------------------------------------------
  console.log("\n--> Stage 11: Website Quality Audit Engine (Deterministic Evaluation)");
  const audit = QualityAuditEngine.audit(updatedFiles, {
    businessName: "Apex Heating & Cooling",
    city: "Dallas",
    state: "TX",
    phone: "(214) 555-0199",
    domain: "apexheatingdallas.com",
  });

  console.log(`  Deterministic Score: ${audit.overallScore}/100`);
  console.log(`    Technical: ${audit.categoryScores.technical.earned}/20`);
  console.log(`    SEO: ${audit.categoryScores.seo.earned}/20`);
  console.log(`    Content: ${audit.categoryScores.content.earned}/20`);
  console.log(`    Images: ${audit.categoryScores.images.earned}/20`);
  console.log(`    Internal Linking: ${audit.categoryScores.internalLinking.earned}/20`);

  assert(audit.overallScore >= 90, 11, "Quality Audit Score >= 90/100", `Score: ${audit.overallScore}/100`);
  assert(audit.categoryScores.technical.earned >= 18, 11, "Technical Score >= 18/20", `${audit.categoryScores.technical.earned}/20`);
  assert(audit.categoryScores.seo.earned >= 18, 11, "SEO Score >= 18/20", `${audit.categoryScores.seo.earned}/20`);
  assert(audit.categoryScores.internalLinking.earned === 20, 11, "Internal Linking Score is 20/20", "Zero broken links, zero orphan pages");

  // ---------------------------------------------------------------------------
  // STEP 12: Publish (ZIP Production Build & Deployment Pipeline)
  // ---------------------------------------------------------------------------
  console.log("\n--> Stage 12: Publish Readiness (ZIP & Deployment Pipeline)");
  const zipResult = await generateProductionWebsiteZip({
    projectName: "Apex Heating & Cooling",
    files: updatedFiles,
    domain: "apexheatingdallas.com",
  });

  assert(zipResult.zipBuffer.length > 0, 12, "Production ZIP successfully built", `${zipResult.zipBuffer.length} bytes`);
  assert(zipResult.auditReport.score >= 90, 12, "Pre-ZIP Security & Quality Audit Passed", `Pre-Audit Score: ${zipResult.auditReport.score}/100`);
  assert(zipResult.auditReport.securityScan.passed === true, 12, "Zero security risks or leaked secrets in production ZIP");

  // Verify Deployment Token Sanitizer
  const sanitizedOutput = stripSensitiveTokens(
    `Deploying site with secret AIzaSyTestKey123456 and token sk-live9988776655 to Cloudflare`
  );
  assert(!sanitizedOutput.includes("AIzaSyTestKey123456"), 12, "Deployment secrets stripped cleanly", sanitizedOutput);

  console.log("\n================================================================================");
  console.log(`   ALL 12 STAGES VERIFIED CLEANLY: ${passedAssertions}/${totalAssertions} ASSERTIONS PASSED!`);
  console.log("================================================================================\n");
}

runGscContinuousOptimizationTest().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
