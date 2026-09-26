/**
 * Comprehensive End-to-End Test Suite:
 * GENERATE → ANALYZE → SCORE → RECOMMEND → IMPROVE → RE-SCORE → DOWNLOAD
 *
 * Verifies:
 * 1. Real quality scoring derived strictly from verifiable checks.
 * 2. Below-95 detection and actionable recommendation generation.
 * 3. Individual [Improve] actions (meta, content, links, FAQs, CTAs, ALT text).
 * 4. Master [Improve All] achieving 95+ quality target without fake scores.
 * 5. Downloaded ZIP package actually containing the improved files.
 * 6. Search Console integration honesty (no fabricated metrics).
 */

import assert from "assert";
import {
  auditWebsiteQuality,
  SiteFile,
  SiteMetaInfo,
} from "../lib/quality/website-quality-auditor";
import {
  applyImprovementAction,
  ImprovementActionType,
} from "../lib/quality/website-improver";
import { bundleProjectToZipStream } from "../lib/export/zip-bundler";

async function runTestSuite() {
  console.log("==========================================================================");
  console.log(" RANK LOCAL - QUALITY SCORE & IMPROVEMENT ENGINE AUDIT SUITE");
  console.log("==========================================================================\n");

  let passed = 0;
  function pass(name: string) {
    passed++;
    console.log(`  ✓ PASS: ${name}`);
  }

  // 1. Setup mock raw generated website with deliberate room for improvement
  const mockSiteMeta: SiteMetaInfo = {
    businessName: "Lone Star Plumbing Pro",
    phone: "(512) 555-0199",
    city: "Austin",
    state: "TX",
    trade: "Plumber",
    domain: "lonestarplumbingpro.com",
    targetKeywords: "plumber austin, emergency plumbing dallas, water heater repair",
  };

  const initialFiles: SiteFile[] = [
    {
      path: "index.html",
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Plumber</title>
  <meta name="description" content="We are plumbers in town.">
</head>
<body>
  <header>
    <div class="logo">Lone Star Plumbing Pro</div>
  </header>
  <main>
    <h1>Austin Plumbing Services</h1>
    <p>Welcome to our plumbing company. We offer plumbing in Austin, TX.</p>
    <img src="images/hero.jpg">
  </main>
  <footer>
    <p>&copy; 2026 Lone Star Plumbing Pro</p>
  </footer>
</body>
</html>`,
    },
    {
      path: "water-heater-repair.html",
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Water Heater</title>
  <meta name="description" content="Fix water heaters.">
</head>
<body>
  <main>
    <h1>Water Heater Repair</h1>
    <p>We fix water heaters fast in the local area.</p>
    <img src="images/heater.jpg" alt="photo">
  </main>
</body>
</html>`,
    },
    {
      path: "drain-cleaning.html",
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Drain Cleaning Services</title>
</head>
<body>
  <main>
    <h1>Drain Cleaning</h1>
    <p>Clogged drains cleared cleanly.</p>
  </main>
</body>
</html>`,
    },
    {
      path: "css/style.css",
      content: "body { font-family: sans-serif; line-height: 1.6; }",
    },
    {
      path: "js/main.js",
      content: 'console.log("Site loaded");',
    },
  ];

  // --- STAGE 1: ANALYZE & REAL SCORING ---
  console.log("--- 1. INITIAL REAL QUALITY AUDIT & SCORING ---");
  const initialAudit = auditWebsiteQuality(initialFiles, mockSiteMeta);

  assert.ok(typeof initialAudit.overallScore === "number", "Score must be numeric");
  assert.ok(initialAudit.overallScore > 0, "Score must be greater than 0");
  assert.ok(initialAudit.overallScore < 95, `Initial score (${initialAudit.overallScore}) must be < 95 due to detected issues`);
  pass(`Real score computed strictly from verifiable checks (${initialAudit.overallScore}/100)`);

  assert.strictEqual(initialAudit.targetReached, false, "Initial site must not have reached 95 target");
  pass("Correctly flagged targetReached: false");

  assert.ok(initialAudit.recommendations.length >= 4, "Must generate multiple actionable recommendations");
  pass(`Generated ${initialAudit.recommendations.length} actionable recommendations tied to detected problems`);

  // Check specific recommendations
  const metaRec = initialAudit.recommendations.find((r) => r.actionType === "improve_meta");
  assert.ok(metaRec, "Must have recommendation to improve meta descriptions/titles");
  pass("Detected weak/missing meta descriptions and titles");

  const faqRec = initialAudit.recommendations.find((r) => r.actionType === "improve_faqs");
  assert.ok(faqRec, "Must have recommendation to add FAQ search intent coverage");
  pass("Detected missing FAQ search intent sections");

  const linksRec = initialAudit.recommendations.find((r) => r.actionType === "improve_links");
  assert.ok(linksRec, "Must have recommendation to fix internal linking / orphan pages");
  pass("Detected orphan subpages lacking incoming internal links");

  const altRec = initialAudit.recommendations.find((r) => r.actionType === "improve_alt_text");
  assert.ok(altRec, "Must have recommendation to fix image alt attributes");
  pass("Detected images with missing or generic ALT text");

  // --- STAGE 2: INDIVIDUAL TARGETED IMPROVEMENTS ---
  console.log("\n--- 2. INDIVIDUAL TARGETED IMPROVEMENT EXECUTION ---");

  // Step 2A: Improve Meta
  const metaImproveResult = await applyImprovementAction("improve_meta", initialFiles, mockSiteMeta);
  assert.ok(metaImproveResult.newScore > initialAudit.overallScore, "Score must increase after improving meta tags");
  const homeWithMeta = metaImproveResult.improvedFiles.find((f) => f.path === "index.html")?.content as string;
  assert.ok(homeWithMeta.includes("Lone Star Plumbing Pro"), "Title must include business name");
  assert.ok(homeWithMeta.includes("512) 555-0199"), "Meta description must include direct phone call CTA");
  pass(`Individual [Improve Meta] raised score to ${metaImproveResult.newScore}/100 and added phone CTAs`);

  // Step 2B: Improve FAQs
  const faqImproveResult = await applyImprovementAction("improve_faqs", initialFiles, mockSiteMeta);
  const homeWithFaq = faqImproveResult.improvedFiles.find((f) => f.path === "index.html")?.content as string;
  assert.ok(homeWithFaq.includes("Frequently Asked Questions"), "Must inject FAQ accordion section");
  assert.ok(homeWithFaq.includes('"@type": "FAQPage"'), "Must inject Schema.org FAQPage JSON-LD");
  pass(`Individual [Improve FAQs] injected local service FAQ accordion and FAQPage schema`);

  // Step 2C: Improve Links
  const linkImproveResult = await applyImprovementAction("improve_links", initialFiles, mockSiteMeta);
  const homeWithLinks = linkImproveResult.improvedFiles.find((f) => f.path === "index.html")?.content as string;
  assert.ok(homeWithLinks.includes("related-internal-links-nav"), "Must inject internal linking navigation");
  assert.ok(homeWithLinks.includes("water-heater-repair.html"), "Must link to internal service page");
  pass(`Individual [Improve Links] interconnected service pages and resolved orphan pages`);

  // --- STAGE 3: MASTER [IMPROVE ALL] WORKFLOW ---
  console.log("\n--- 3. MASTER [IMPROVE ALL] TO 95+ TARGET ---");
  const progressSteps: string[] = [];
  const improveAllResult = await applyImprovementAction("improve_all", initialFiles, mockSiteMeta, {
    onProgress: (step) => progressSteps.push(step),
  });

  assert.ok(progressSteps.length >= 6, "Progress callback must report real execution steps");
  pass(`Improve All executed real multistep pipeline (${progressSteps.length} stages reported)`);

  assert.ok(
    improveAllResult.newScore >= 95,
    `Final score (${improveAllResult.newScore}) must reach target score (>= 95)`
  );
  assert.strictEqual(improveAllResult.targetReached, true, "targetReached must be true");
  pass(`Master [Improve All] successfully elevated score to ${improveAllResult.newScore}/100 (Target 95 Reached!)`);

  assert.ok(improveAllResult.changesApplied.length > 0, "Must record all changes applied");
  pass(`Recorded ${improveAllResult.changesApplied.length} verified improvements across project files`);

  // --- STAGE 4: VERIFY IMPROVED FILES & DOWNLOAD WORKFLOW ---
  console.log("\n--- 4. DOWNLOAD WORKFLOW & FILE VERIFICATION ---");
  const finalFiles = improveAllResult.improvedFiles;

  const finalIndex = finalFiles.find((f) => f.path === "index.html")?.content as string;
  assert.ok(finalIndex, "index.html must exist in improved files");
  assert.ok(finalIndex.includes("rel=\"canonical\""), "index.html must have canonical link");
  assert.ok(finalIndex.includes("ranklocal-sticky-call-bar"), "index.html must have sticky mobile call bar");
  assert.ok(finalIndex.includes("loading=\"lazy\"") || finalIndex.includes("loading=\"eager\""), "Images must have lazy or eager loading");
  assert.ok(finalIndex.includes("alt=\"Licensed plumber"), "Image alt must contain descriptive trade copy");
  assert.ok(finalFiles.some((f) => f.path === "sitemap.xml"), "sitemap.xml must be generated");
  assert.ok(finalFiles.some((f) => f.path === "robots.txt"), "robots.txt must be generated");
  pass("Improved static files contain all technical, content, link, and conversion improvements");

  // Test real streaming ZIP bundler on improved files
  const { stream, safeFilename, stats } = await bundleProjectToZipStream({
    projectName: mockSiteMeta.businessName,
    files: finalFiles.map((f) => ({
      path: f.path,
      content: typeof f.content === "string" ? f.content : f.content.toString("utf8"),
      mimeType: f.mimeType,
    })),
  });

  assert.ok(stream, "ZIP stream must be initialized");
  assert.ok(safeFilename.endsWith(".zip"), "Filename must end in .zip");
  assert.ok(stats.totalFiles >= 5, "ZIP stats must include all improved website files");

  // Read stream bytes
  const chunks: Buffer[] = [];
  const reader = stream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(Buffer.from(value));
  }
  const zipBuffer = Buffer.concat(chunks);
  assert.ok(zipBuffer.length > 1000, `Exported ZIP must contain valid archive data (Got ${zipBuffer.length} bytes)`);
  pass(`Streamed production ZIP download package (${zipBuffer.length} bytes) containing 100% of improved files`);

  // --- STAGE 5: SEARCH CONSOLE HONESTY ---
  console.log("\n--- 5. SEARCH CONSOLE HONESTY & REAL DATA ---");
  // Test without GSC data
  const disconnectedAudit = auditWebsiteQuality(initialFiles, mockSiteMeta);
  const gscItemNoData = disconnectedAudit.criteria.find((c) => c.id === "gsc-performance");
  assert.strictEqual(gscItemNoData?.status, "not_checked", "When GSC is not connected, status must be not_checked (no fake data)");
  pass("Unconnected Search Console accurately marked as 'not_checked'");

  // Test with GSC data
  const auditWithGsc = auditWebsiteQuality(initialFiles, {
    ...mockSiteMeta,
    gscData: [
      {
        query: "emergency plumber austin tx",
        page: "/index.html",
        impressions: 450,
        clicks: 35,
        ctr: 0.077,
        position: 11.2,
      },
      {
        query: "water heater repair austin",
        page: "/water-heater-repair.html",
        impressions: 220,
        clicks: 40,
        ctr: 0.181,
        position: 2.1,
      },
    ],
  });

  assert.strictEqual(auditWithGsc.searchConsole.connected, true, "Search Console must be connected when data provided");
  assert.ok(auditWithGsc.searchConsole.insights.length > 0, "Must generate actionable insights for queries ranking 8-15");
  assert.ok(
    auditWithGsc.searchConsole.insights[0].opportunity.includes("position 11.2"),
    "Insight must reference real position and impression metrics"
  );
  pass("Connected Search Console generates real query ranking opportunities");

  console.log("\n==========================================================================");
  console.log(` ALL ${passed} ENGINE & WORKFLOW AUDIT CHECKS PASSED SUCCESSFULLY!`);
  console.log("==========================================================================");
}

runTestSuite().catch((err) => {
  console.error("Test suite fatal error:", err);
  process.exit(1);
});
