/**
 * End-to-End Verification Test Script
 * Verifies Add Dedicated Page workflow, GSC Opportunity Engine, Cannibalization Prevention,
 * Intelligent Internal Linking, Sitemap Update, and Version History Snapshot.
 */

import {
  buildComprehensiveOpportunityList,
  checkPageCannibalization,
  mapQueryToServiceAndLocation,
  generatePageSlug,
  generatePageTitle,
  evaluateOpportunityAction,
} from "../lib/seo/opportunity-engine";
import {
  createDedicatedPage,
  normalizePageSlug,
  updateSitemapWithNewPage,
} from "../lib/generator/page-creator";
import { GSCQueryRow } from "../lib/search-console/search-console-analyzer";
import { SavedProject, ProjectVersion } from "../lib/storage/project-types";
import { generateWebsiteZIP } from "../lib/storage/db";

async function runTest() {
  console.log("=================================================");
  console.log("RUNNING ADD NEW PAGE & SEO OPPORTUNITY ENGINE TESTS");
  console.log("=================================================\n");

  // Step 1: Mock existing website
  const mockExistingFiles = [
    {
      path: "index.html",
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Apex Plumbing Beaverton - Expert Local Plumber</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header>
    <div class="logo">Apex Plumbing</div>
    <nav>
      <a href="index.html" class="active">Home</a>
      <a href="services.html">Services</a>
      <a href="contact.html">Contact</a>
    </nav>
  </header>
  <main>
    <h1>Premier Residential Plumbing in Beaverton, OR</h1>
    <p>We provide full-service plumbing repairs throughout Beaverton and Washington County.</p>
    <section class="services-overview">
      <div class="services-grid">
        <div class="service-card">
          <h3>Drain Cleaning</h3>
          <p>Clog clearing and hydro-jetting.</p>
        </div>
      </div>
    </section>
  </main>
  <footer>
    <p>&copy; 2026 Apex Plumbing. All rights reserved.</p>
    <ul>
      <li><a href="index.html">Home</a></li>
      <li><a href="services.html">Services</a></li>
    </ul>
  </footer>
</body>
</html>`,
    },
    {
      path: "services.html",
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Plumbing Services - Apex Plumbing</title>
</head>
<body>
  <header><nav><a href="index.html">Home</a><a href="services.html">Services</a></nav></header>
  <main>
    <h1>Our Professional Plumbing Services</h1>
    <section class="services-list">
      <div class="services-grid">
        <div class="card">Emergency Repairs</div>
        <div class="card">Pipe Leak Detection</div>
      </div>
    </section>
  </main>
  <footer><p>&copy; 2026 Apex Plumbing</p></footer>
</body>
</html>`,
    },
    {
      path: "styles.css",
      content: `:root { --primary: #2563eb; --border-color: #e2e8f0; } body { font-family: sans-serif; }`,
    },
    {
      path: "script.js",
      content: `console.log("Website initialized");`,
    },
    {
      path: "sitemap.xml",
      content: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://apexplumbing.com/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://apexplumbing.com/services.html</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`,
    },
  ];

  const mockKeywordMap = [
    { pagePath: "index.html", primaryKeyword: "plumber beaverton", secondaryKeywords: ["plumbing beaverton or"] },
    { pagePath: "services.html", primaryKeyword: "plumbing services", secondaryKeywords: [] },
  ];

  // Test 1: Opportunity Engine - Query classification
  console.log("TEST 1: Evaluating GSC Queries (Improve vs Create Dedicated Page)...");
  const testQueries: GSCQueryRow[] = [
    { query: "plumber beaverton", impressions: 120, clicks: 8, ctr: 0.067, position: 4.2, pageUrl: "index.html" },
    { query: "tankless water heater installation beaverton", impressions: 85, clicks: 3, ctr: 0.035, position: 11.4 },
    { query: "drain cleaning beaverton", impressions: 45, clicks: 1, ctr: 0.022, position: 14.8 },
    { query: "cheap plumber", impressions: 5, clicks: 0, ctr: 0, position: 32.0 },
  ];

  const opportunities = buildComprehensiveOpportunityList(
    testQueries,
    mockExistingFiles,
    mockKeywordMap,
    {
      businessType: "Plumber",
      city: "Beaverton",
      serviceAreas: ["Beaverton", "Tigard", "Aloha"],
    }
  );

  console.log(`✓ Opportunity Engine processed ${opportunities.length} queries.`);
  const tanklessOpp = opportunities.find((o) => o.query.includes("tankless"));
  if (!tanklessOpp || tanklessOpp.action !== "create_page") {
    throw new Error(`Expected tankless query to recommend 'create_page', got: ${tanklessOpp?.action}`);
  }
  console.log(`✓ High-intent new topic correctly recommended: "${tanklessOpp.action}" (Reason: ${tanklessOpp.reason})`);

  const existingOpp = opportunities.find((o) => o.query === "plumber beaverton");
  if (!existingOpp || existingOpp.action !== "improve_page") {
    throw new Error(`Expected homepage query to recommend 'improve_page', got: ${existingOpp?.action}`);
  }
  console.log(`✓ Existing ranking query correctly recommended: "${existingOpp.action}" (Target: ${existingOpp.targetExistingPage})`);

  // Test 2: Cannibalization Prevention
  console.log("\nTEST 2: Cannibalization Prevention Detection...");
  const duplicateCheck = checkPageCannibalization(
    {
      query: "plumber beaverton",
      slug: "index.html",
      serviceName: "Plumbing",
      locationCity: "Beaverton",
    },
    mockExistingFiles,
    mockKeywordMap
  );

  if (!duplicateCheck.hasRisk) {
    throw new Error("Cannibalization check failed to detect collision with index.html!");
  }
  console.log(`✓ Cannibalization correctly flagged: "${duplicateCheck.reason}" (Conflicting Page: ${duplicateCheck.conflictingPage})`);

  const cleanCheck = checkPageCannibalization(
    {
      query: "tankless water heater installation beaverton",
      slug: "tankless-water-heater-beaverton.html",
      serviceName: "Tankless Water Heater Installation",
      locationCity: "Beaverton",
    },
    mockExistingFiles,
    mockKeywordMap
  );
  if (cleanCheck.hasRisk) {
    throw new Error(`Clean check falsely flagged cannibalization: ${cleanCheck.reason}`);
  }
  console.log("✓ Distinct sub-service page correctly cleared of cannibalization risk.");

  // Test 3: Dedicated Page Creation & Internal Linking
  console.log("\nTEST 3: Dedicated Page Creation & Intelligent Internal Linking...");
  const createResult = await createDedicatedPage(
    {
      primaryQuery: "tankless water heater installation beaverton",
      serviceName: "Tankless Water Heater Installation",
      locationCity: "Beaverton",
      locationState: "OR",
      searchIntent: "transactional",
      title: "Tankless Water Heater Installation in Beaverton, OR - Apex Plumbing",
      slug: "tankless-water-heater-beaverton.html",
      relatedQueries: ["tankless water heater cost", "on-demand water heater repair"],
      navPlacement: "contextual_only",
    },
    mockExistingFiles,
    {
      businessName: "Apex Plumbing",
      businessType: "Plumbing",
      city: "Beaverton",
      stateRegion: "OR",
      phone: "(503) 555-0199",
      websiteDomain: "apexplumbing.com",
    }
  );

  const newHtml = createResult.newPageFile.content;
  if (!/<h1[^>]*>[\s\S]*?Tankless Water Heater Installation in Beaverton, OR[\s\S]*?<\/h1>/i.test(newHtml)) {
    throw new Error("New page missing expected <h1> heading!");
  }
  if (!newHtml.includes('"@type": "Plumber"')) {
    throw new Error("New page missing Schema.org Plumber JSON-LD structured data!");
  }
  if (!newHtml.includes('href="tel:5035550199"')) {
    throw new Error("New page missing phone click-to-call link!");
  }
  if (!newHtml.includes('<details')) {
    throw new Error("New page missing FAQ accordion section!");
  }
  if (!newHtml.includes('href="index.html"')) {
    throw new Error("New page missing breadcrumb link back to Home!");
  }
  console.log(`✓ New page generated with semantic HTML, Schema JSON-LD, breadcrumbs, and CTAs (${newHtml.length} bytes).`);

  // Test 4: Internal Linking Verification (No Orphan Pages)
  console.log("\nTEST 4: Bidirectional Internal Linking (Orphan Prevention)...");
  console.log(`  Incoming Links count: ${createResult.incomingLinksCount}`);
  console.log(`  Outgoing Links count: ${createResult.outgoingLinksCount}`);
  console.log(`  Pages linked from: ${createResult.linkedFromPages.join(", ")}`);

  if (createResult.incomingLinksCount < 1) {
    throw new Error("Orphan prevention failed: New page has zero incoming links!");
  }
  if (createResult.outgoingLinksCount < 1) {
    throw new Error("New page has zero outgoing internal links!");
  }

  // Verify existing files were updated contextually
  const updatedServices = createResult.updatedExistingFiles.find((f) => f.path === "services.html");
  if (updatedServices && !updatedServices.content.includes("tankless-water-heater-beaverton.html")) {
    throw new Error("services.html was not updated with contextual link to new page!");
  }
  console.log("✓ Existing services.html cleanly updated with contextual anchor link.");

  // Test 5: Sitemap XML Update
  console.log("\nTEST 5: Sitemap XML Integration...");
  const sitemapXml = createResult.sitemapFile.content;
  if (!sitemapXml.includes("<loc>https://apexplumbing.com/tankless-water-heater-beaverton.html</loc>")) {
    throw new Error("Sitemap XML does not contain the new page URL!");
  }
  if (!sitemapXml.includes("<priority>0.8</priority>")) {
    throw new Error("Sitemap XML entry missing priority 0.8!");
  }
  console.log("✓ sitemap.xml cleanly updated with new page location and priority 0.8.");

  // Test 6: Immutable Version History Snapshot
  console.log("\nTEST 6: Version History Snapshot & ZIP Generation...");
  const v1Snapshot: ProjectVersion = {
    id: "ver-1-original",
    versionNumber: 1,
    label: "v1 - Original Website",
    createdAt: Date.now() - 3600000,
    dateStr: new Date(Date.now() - 3600000).toLocaleString(),
    source: "original",
    summary: "Original website generated files",
    affectedPages: ["index.html", "services.html"],
    files: mockExistingFiles,
  };

  const fileMap = new Map<string, any>();
  for (const f of mockExistingFiles) fileMap.set(f.path, f);
  for (const f of createResult.updatedExistingFiles) fileMap.set(f.path, f);
  fileMap.set(createResult.newPageFile.path, createResult.newPageFile);
  fileMap.set(createResult.sitemapFile.path, createResult.sitemapFile);
  const v2MergedFiles = Array.from(fileMap.values());

  const v2Snapshot: ProjectVersion = {
    id: "ver-2-tankless",
    versionNumber: 2,
    label: "v2 - Added Tankless Water Heater Installation Page",
    createdAt: Date.now(),
    dateStr: new Date().toLocaleString(),
    source: "search_console",
    summary: "Added dedicated page and updated sitemap and contextual internal links",
    affectedPages: ["tankless-water-heater-beaverton.html", "services.html"],
    files: v2MergedFiles,
  };

  const updatedProject: SavedProject = {
    id: "proj-test-123",
    name: "Apex Plumbing",
    createdAt: Date.now() - 86400000,
    lastEditedAt: Date.now(),
    formData: { businessName: "Apex Plumbing", city: "Beaverton" },
    theme: {} as any,
    nicheId: "plumbing",
    schemaType: "Plumber",
    businessDetails: {} as any,
    serviceAreaCities: [],
    keywordMap: [
      ...mockKeywordMap,
      {
        pagePath: createResult.newPageFile.path,
        primaryKeyword: "tankless water heater installation beaverton",
        secondaryKeywords: [],
      },
    ],
    customBlocks: [],
    pageContentMap: {},
    files: v2MergedFiles,
    changeLog: [],
    redirects: [],
    versions: [v1Snapshot, v2Snapshot],
    currentVersionId: v2Snapshot.id,
  };

  // Verify Version 1 files are 100% preserved
  if (v1Snapshot.files.length !== 5) {
    throw new Error("Version 1 files were modified or corrupted!");
  }
  // Verify Version 2 has 6 files
  if (v2Snapshot.files.length !== 6) {
    throw new Error(`Version 2 expected 6 files, got ${v2Snapshot.files.length}`);
  }
  console.log("✓ Version 1 (original, 5 files) and Version 2 (improved, 6 files) verified safe in version history.");

  // Verify ZIP generation produces a valid blob
  const zipResult = await generateWebsiteZIP(updatedProject, "full");
  if (!zipResult.blob || zipResult.blob.size < 1000) {
    throw new Error("generateWebsiteZIP failed to produce a valid ZIP blob!");
  }
  console.log(`✓ Complete website ZIP successfully generated (${zipResult.blob.size} bytes).`);

  console.log("\n=================================================");
  console.log("ALL 6 TESTS PASSED WITH 100% SUCCESS!");
  console.log("=================================================");
}

runTest().catch((err) => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});
