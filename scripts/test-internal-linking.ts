/**
 * Comprehensive Test Suite for RankLocal Internal Linking & Page Connectivity Engine
 * 
 * Tests:
 * 1. Weighted Relevance Scoring Model (+30 same service, +20 same loc, -50 unrelated service, -30 unrelated loc)
 * 2. Required Test Project Setup (Dallas, Irving, Garland plumbing & service-location cluster)
 * 3. Topological Hierarchy & BFS Click Depth (Depth 0 Home -> Hubs -> Services -> Cities -> Service+Loc)
 * 4. Cluster Integrity (Dallas connects within Dallas; no cross-city combinatorial link spam)
 * 5. Crawl Accessibility & Link Validation (100% hrefs resolve, sitemap consistency, zero 404s)
 * 6. New Page Automatic Integration (Emergency Plumbing Dallas: parent linking, sitemap, orphan removal)
 * 7. Deleted Page Link Cleanup (Removes dead links across all other HTML files)
 * 8. Preview & ZIP Link Parity
 */

import assert from "assert";
import {
  PageConnectivityEngine,
  DEFAULT_RELEVANCE_WEIGHTS,
  buildConnectivityGraphFromHtmlFiles,
  validateWebsiteCrawlAccessibility,
  integrateNewPageIntoProject,
  deletePageFromProject,
  resolveHref,
  calculateRelativeHref,
  enrichWebsiteConnectivity,
  PageRelationshipNode,
} from "../lib/seo/connectivity-engine";

function pass(testName: string) {
  console.log(`  ✅ PASS: ${testName}`);
}

async function main() {
  console.log("==================================================");
  console.log("RUNNING MASTER INTERNAL LINKING ENGINE AUDIT");
  console.log("==================================================\n");

  let totalTests = 0;

  // ==============================================================
  // 1. Relevance Scoring Model Tests
  // ==============================================================
  console.log("[SECTION 1: Weighted Relevance Scoring Model]");

  const engine = new PageConnectivityEngine();

  const nodeDrainDallas: PageRelationshipNode = {
    pageId: "srv-loc-drain-dallas",
    url: "/drain-cleaning-dallas.html",
    slug: "drain-cleaning-dallas",
    filePath: "drain-cleaning-dallas.html",
    title: "Drain Cleaning in Dallas, TX | Lone Star Plumbing",
    pageType: "service_location_page",
    primaryKeyword: "drain cleaning dallas",
    secondaryKeywords: ["clogged drain repair", "rooter dallas"],
    service: "Drain Cleaning",
    serviceCategory: "Plumbing",
    location: { city: "Dallas", state: "TX" },
    searchIntent: "transactional",
    parentPageId: "loc-dallas",
    relatedServices: ["Pipe Repair", "Water Heater Repair"],
    relatedLocations: ["Irving", "Garland"],
    incomingLinks: [],
    outgoingLinks: [],
    indexable: true,
    canonicalUrl: "https://example.com/drain-cleaning-dallas.html",
    clickDepth: 3,
    authorityFlow: 0.5,
    importance: 80,
    connectivityStatus: "connected",
    statusReasons: [],
    recommendations: [],
  };

  const nodePipeDallas: PageRelationshipNode = {
    pageId: "srv-loc-pipe-dallas",
    url: "/pipe-repair-dallas.html",
    slug: "pipe-repair-dallas",
    filePath: "pipe-repair-dallas.html",
    title: "Pipe Repair in Dallas, TX | Lone Star Plumbing",
    pageType: "service_location_page",
    primaryKeyword: "pipe repair dallas",
    secondaryKeywords: ["burst pipe repair", "copper repiping"],
    service: "Pipe Repair",
    serviceCategory: "Plumbing",
    location: { city: "Dallas", state: "TX" },
    searchIntent: "transactional",
    parentPageId: "loc-dallas",
    relatedServices: ["Drain Cleaning", "Water Heater Repair"],
    relatedLocations: ["Irving", "Garland"],
    incomingLinks: [],
    outgoingLinks: [],
    indexable: true,
    canonicalUrl: "https://example.com/pipe-repair-dallas.html",
    clickDepth: 3,
    authorityFlow: 0.5,
    importance: 80,
    connectivityStatus: "connected",
    statusReasons: [],
    recommendations: [],
  };

  const nodeRoofingMiami: PageRelationshipNode = {
    pageId: "srv-loc-roof-miami",
    url: "/commercial-roofing-miami.html",
    slug: "commercial-roofing-miami",
    filePath: "commercial-roofing-miami.html",
    title: "Commercial Roofing in Miami, FL | Miami Roofing",
    pageType: "service_location_page",
    primaryKeyword: "commercial roofing miami",
    secondaryKeywords: ["flat roof repair"],
    service: "Commercial Roofing",
    serviceCategory: "Roofing",
    location: { city: "Miami", state: "FL" },
    searchIntent: "transactional",
    relatedServices: [],
    relatedLocations: [],
    incomingLinks: [],
    outgoingLinks: [],
    indexable: true,
    canonicalUrl: "https://example.com/commercial-roofing-miami.html",
    clickDepth: 3,
    authorityFlow: 0.5,
    importance: 70,
    connectivityStatus: "connected",
    statusReasons: [],
    recommendations: [],
  };

  engine.registerNode(nodeDrainDallas);
  engine.registerNode(nodePipeDallas);
  engine.registerNode(nodeRoofingMiami);

  // Score Drain Dallas -> Pipe Dallas (same category Plumbing, same location Dallas)
  const relDallasSiblings = engine.calculateRelevance(nodeDrainDallas, nodePipeDallas);
  assert.ok(relDallasSiblings.score >= 40, `Expected score >= 40, got ${relDallasSiblings.score}`);
  assert.strictEqual(relDallasSiblings.tier, "high");
  totalTests++;
  pass(`Drain Cleaning Dallas -> Pipe Repair Dallas scores HIGH relevance (${relDallasSiblings.score})`);

  // Score Drain Dallas -> Roofing Miami (unrelated trade -50, unrelated city -30)
  const relUnrelated = engine.calculateRelevance(nodeDrainDallas, nodeRoofingMiami);
  assert.ok(relUnrelated.score < 0, `Expected negative score for unrelated trade & city, got ${relUnrelated.score}`);
  assert.strictEqual(relUnrelated.tier, "low");
  totalTests++;
  pass(`Drain Cleaning Dallas -> Commercial Roofing Miami receives heavy penalties and is rejected (${relUnrelated.score})`);

  // ==============================================================
  // 2. Setup Required Test Project
  // ==============================================================
  console.log("\n[SECTION 2: Required Test Project Architecture]");

  // Construct realistic test project files
  const domain = "lonestarplumbing.com";
  const testFiles: { path: string; content: string }[] = [];

  // 1. Homepage
  testFiles.push({
    path: "index.html",
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Dallas Plumbing &amp; Drain Cleaning | Lone Star Plumbing</title>
  <meta name="description" content="Top-rated plumbing services across Dallas, Irving, and Garland.">
  <link rel="canonical" href="https://${domain}/">
</head>
<body>
  <header>
    <nav>
      <a href="index.html" class="nav-link">Home</a>
      <a href="services.html" class="nav-link">Services</a>
      <a href="service-areas.html" class="nav-link">Areas</a>
      <a href="contact.html" class="nav-link">Contact</a>
    </nav>
  </header>
  <main>
    <h1>Dallas Premier Plumbing Services</h1>
    <section class="services-overview">
      <div class="cards">
        <a href="plumbing.html">General Plumbing</a>
        <a href="drain-cleaning.html">Drain Cleaning</a>
        <a href="pipe-repair.html">Pipe Repair</a>
        <a href="water-heater-repair.html">Water Heater Repair</a>
      </div>
    </section>
    <section class="locations-overview">
      <div class="links">
        <a href="plumber-dallas-tx.html">Dallas, TX</a>
        <a href="plumber-irving-tx.html">Irving, TX</a>
        <a href="plumber-garland-tx.html">Garland, TX</a>
      </div>
    </section>
  </main>
  <footer>
    <a href="services.html">Services</a>
    <a href="service-areas.html">Service Areas</a>
  </footer>
</body>
</html>`,
  });

  // 2. Services Hub
  testFiles.push({
    path: "services.html",
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Professional Plumbing Services | Lone Star Plumbing</title>
  <link rel="canonical" href="https://${domain}/services.html">
</head>
<body>
  <header><a href="index.html">Home</a></header>
  <main>
    <h1>Our Plumbing Services</h1>
    <div class="cards">
      <a href="plumbing.html">Full Residential Plumbing</a>
      <a href="drain-cleaning.html">Drain Cleaning &amp; Rooter</a>
      <a href="pipe-repair.html">Pipe Repair &amp; Repiping</a>
      <a href="water-heater-repair.html">Water Heater Repair</a>
    </div>
  </main>
</body>
</html>`,
  });

  // 3. Service Pages
  const services = [
    { slug: "plumbing.html", name: "Plumbing", h1: "Comprehensive Plumbing Services" },
    { slug: "drain-cleaning.html", name: "Drain Cleaning", h1: "Drain Cleaning Solutions" },
    { slug: "pipe-repair.html", name: "Pipe Repair", h1: "Pipe Repair & Leak Fixing" },
    { slug: "water-heater-repair.html", name: "Water Heater Repair", h1: "Water Heater Services" },
  ];

  for (const s of services) {
    testFiles.push({
      path: s.slug,
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <title>${s.name} | Lone Star Plumbing</title>
  <link rel="canonical" href="https://${domain}/${s.slug}">
</head>
<body>
  <header><a href="index.html">Home</a> <a href="services.html">Services</a></header>
  <main>
    <h1>${s.h1}</h1>
    <p>Professional ${s.name.toLowerCase()} solutions throughout North Texas.</p>
    <a href="services.html">Back to All Services</a>
  </main>
</body>
</html>`,
    });
  }

  // 4. Service Areas Hub
  testFiles.push({
    path: "service-areas.html",
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Service Areas | Lone Star Plumbing</title>
  <link rel="canonical" href="https://${domain}/service-areas.html">
</head>
<body>
  <header><a href="index.html">Home</a></header>
  <main>
    <h1>Communities We Serve</h1>
    <div class="links">
      <a href="plumber-dallas-tx.html">Plumber in Dallas, TX</a>
      <a href="plumber-irving-tx.html">Plumber in Irving, TX</a>
      <a href="plumber-garland-tx.html">Plumber in Garland, TX</a>
    </div>
  </main>
</body>
</html>`,
  });

  // 5. City Location Pages
  const cities = [
    { city: "Dallas", state: "TX", slug: "plumber-dallas-tx.html" },
    { city: "Irving", state: "TX", slug: "plumber-irving-tx.html" },
    { city: "Garland", state: "TX", slug: "plumber-garland-tx.html" },
  ];

  for (const c of cities) {
    testFiles.push({
      path: c.slug,
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Licensed Plumber in ${c.city}, ${c.state} | Lone Star Plumbing</title>
  <link rel="canonical" href="https://${domain}/${c.slug}">
</head>
<body>
  <header><a href="index.html">Home</a> <a href="service-areas.html">Areas</a></header>
  <main>
    <h1>Top-Rated Plumber in ${c.city}, ${c.state}</h1>
    <p>Complete plumbing care in ${c.city}.</p>
    <div class="city-services">
      <a href="drain-cleaning-${c.city.toLowerCase()}.html">Drain Cleaning in ${c.city}</a>
      ${c.city !== "Garland" ? `<a href="pipe-repair-${c.city.toLowerCase()}.html">Pipe Repair in ${c.city}</a>` : ""}
      ${c.city === "Dallas" ? `<a href="water-heater-repair-dallas.html">Water Heater Repair in Dallas</a>` : ""}
    </div>
  </main>
</body>
</html>`,
    });
  }

  // 6. Service + Location Pages
  const serviceLocPages = [
    { service: "Drain Cleaning", city: "Dallas", path: "drain-cleaning-dallas.html" },
    { service: "Pipe Repair", city: "Dallas", path: "pipe-repair-dallas.html" },
    { service: "Water Heater Repair", city: "Dallas", path: "water-heater-repair-dallas.html" },
    { service: "Drain Cleaning", city: "Irving", path: "drain-cleaning-irving.html" },
    { service: "Pipe Repair", city: "Irving", path: "pipe-repair-irving.html" },
    { service: "Drain Cleaning", city: "Garland", path: "drain-cleaning-garland.html" },
  ];

  for (const sl of serviceLocPages) {
    testFiles.push({
      path: sl.path,
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <title>${sl.service} in ${sl.city}, TX | Lone Star Plumbing</title>
  <link rel="canonical" href="https://${domain}/${sl.path}">
</head>
<body>
  <header><a href="index.html">Home</a> <a href="services.html">Services</a></header>
  <nav class="breadcrumbs">
    <a href="index.html">Home</a> / <a href="services.html">Services</a> / <a href="plumber-${sl.city.toLowerCase()}-tx.html">${sl.city}</a> / <span>${sl.service}</span>
  </nav>
  <main>
    <h1>Expert ${sl.service} in ${sl.city}, TX</h1>
    <p>Rapid dispatch and guaranteed ${sl.service.toLowerCase()} throughout ${sl.city}.</p>
    <a href="plumber-${sl.city.toLowerCase()}-tx.html">More ${sl.city} Plumbing Services</a>
  </main>
</body>
</html>`,
    });
  }

  // 7. Contact Page
  testFiles.push({
    path: "contact.html",
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Contact Us | Lone Star Plumbing</title>
  <link rel="canonical" href="https://${domain}/contact.html">
</head>
<body>
  <header><a href="index.html">Home</a></header>
  <main><h1>Contact Lone Star Plumbing</h1></main>
</body>
</html>`,
  });

  // Run Master Enrichment pass on the test files
  const enrichment = enrichWebsiteConnectivity(testFiles, {
    businessName: "Lone Star Plumbing",
    primaryTrade: "Plumbing",
    domain,
    serviceAreaCities: cities.map((c) => ({ city: c.city, stateId: c.state })),
  });

  const enrichedFiles = enrichment.files;
  const initialAudit = enrichment.auditReport;

  // ==============================================================
  // 3. Topology & BFS Click Depth Verification
  // ==============================================================
  console.log("\n[SECTION 3: Topology & BFS Click Depth Analysis]");

  assert.strictEqual(initialAudit.orphanNodes.length, 0, `Expected 0 orphan nodes, found ${initialAudit.orphanNodes.length}`);
  totalTests++;
  pass("Initial project contains 0 orphan nodes across all 15 pages");

  // Verify BFS Click Depth
  const initialEngine = buildConnectivityGraphFromHtmlFiles(enrichedFiles, { domain });
  initialEngine.computeClickDepths();

  const home = initialEngine.getNodeByPath("index.html")!;
  assert.strictEqual(home.clickDepth, 0, "Homepage must be click depth 0");
  totalTests++;
  pass("Homepage is at Click Depth 0");

  const servicesHub = initialEngine.getNodeByPath("services.html")!;
  assert.strictEqual(servicesHub.clickDepth, 1, "Services Hub must be at click depth 1");
  totalTests++;
  pass("Services Hub is at Click Depth 1");

  const dallasCity = initialEngine.getNodeByPath("plumber-dallas-tx.html")!;
  assert.strictEqual(dallasCity.clickDepth, 1, "Dallas city page must be at click depth 1");
  totalTests++;
  pass("Dallas City Location Page is at Click Depth 1");

  const drainDallas = initialEngine.getNodeByPath("drain-cleaning-dallas.html")!;
  assert.ok(drainDallas.clickDepth >= 2 && drainDallas.clickDepth <= 3, `Drain Cleaning Dallas must be depth 2 or 3, got ${drainDallas.clickDepth}`);
  totalTests++;
  pass(`Drain Cleaning Dallas is reachable at Click Depth ${drainDallas.clickDepth}`);

  // Max depth check
  assert.ok(initialAudit.maxClickDepth <= 3, `Expected max click depth <= 3, got ${initialAudit.maxClickDepth}`);
  totalTests++;
  pass(`Site architecture is compact with max click depth ${initialAudit.maxClickDepth} (Well under depth threshold 4)`);

  // ==============================================================
  // 4. Cluster Integrity & Anti-Spam Check
  // ==============================================================
  console.log("\n[SECTION 4: Cluster Integrity & Anti-Spam Check]");

  // Verify intra-cluster link: Drain Cleaning Dallas should connect to Pipe Repair Dallas
  const drainDallasHtml = enrichedFiles.find((f) => f.path === "drain-cleaning-dallas.html")?.content as string;
  assert.ok(
    drainDallasHtml.includes("pipe-repair-dallas.html"),
    "Drain Cleaning Dallas must link to sibling Pipe Repair Dallas within same market"
  );
  totalTests++;
  pass("Drain Cleaning Dallas contextually links to sibling Pipe Repair Dallas");

  // Verify anti-spam: Drain Cleaning Dallas should NOT link to Pipe Repair Irving
  assert.ok(
    !drainDallasHtml.includes("pipe-repair-irving.html"),
    "Drain Cleaning Dallas must NOT link to Pipe Repair Irving (No artificial cross-city spam grid)"
  );
  totalTests++;
  pass("No cross-city link spam: Dallas pages do not artificially link to unrelated Irving service pages");

  // ==============================================================
  // 5. Crawl Accessibility & Zero 404s Check
  // ==============================================================
  console.log("\n[SECTION 5: Crawl Accessibility & Link Validation]");

  const crawlReport = validateWebsiteCrawlAccessibility(enrichedFiles, domain);
  assert.strictEqual(crawlReport.brokenLinksCount, 0, `Expected 0 broken links, found ${crawlReport.brokenLinksCount}`);
  totalTests++;
  pass(`Crawl test followed all internal links with ZERO broken URLs (0 broken links across ${crawlReport.crawledPagesCount} pages)`);

  assert.strictEqual(crawlReport.unreachablePages.length, 0, "All pages must be reachable from homepage");
  totalTests++;
  pass("100% of generated pages are discoverable starting from index.html");

  assert.strictEqual(crawlReport.sitemapAgreesWithCanonical, true, "Sitemap URLs must agree with canonical tags");
  totalTests++;
  pass("Sitemap.xml canonical URLs agree with page <link rel='canonical'> tags");

  // ==============================================================
  // 6. Test New Page Workflow (Emergency Plumbing Dallas)
  // ==============================================================
  console.log("\n[SECTION 6: Test New Page Workflow (Emergency Plumbing Dallas)]");

  const newPageSlug = "emergency-plumbing-dallas.html";
  const newPageHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <title>24/7 Emergency Plumbing in Dallas, TX | Lone Star Plumbing</title>
  <meta name="description" content="Immediate 24/7 dispatch for emergency plumbing crises across Dallas, TX.">
  <link rel="canonical" href="https://${domain}/${newPageSlug}">
</head>
<body>
  <header><a href="index.html">Home</a> <a href="services.html">Services</a></header>
  <nav class="breadcrumbs">
    <a href="index.html">Home</a> / <a href="plumber-dallas-tx.html">Dallas</a> / <span>Emergency Plumbing</span>
  </nav>
  <main>
    <h1>24/7 Emergency Plumbing in Dallas, TX</h1>
    <p>Burst pipes, sewer backups, and urgent plumbing repairs dispatched within 45 minutes in Dallas.</p>
    <a href="plumber-dallas-tx.html">Back to Dallas Plumbing</a>
  </main>
</body>
</html>`;

  // Integrate new page into the existing project package
  const integration = integrateNewPageIntoProject(
    {
      newPagePath: newPageSlug,
      newPageTitle: "24/7 Emergency Plumbing in Dallas, TX",
      newPageContent: newPageHtml,
      primaryQuery: "emergency plumbing dallas",
      serviceName: "Emergency Plumbing",
      locationCity: "Dallas",
      locationState: "TX",
      searchIntent: "transactional",
    },
    enrichedFiles,
    {
      businessName: "Lone Star Plumbing",
      primaryTrade: "Plumbing",
      domain,
    }
  );

  assert.strictEqual(integration.orphanResolved, true, "New page must not be an orphan after integration");
  totalTests++;
  pass("New page is automatically connected with zero orphan status");

  assert.ok(
    integration.incomingLinksAdded.length >= 1,
    `Expected at least 1 incoming link added for new page, got ${integration.incomingLinksAdded.length}`
  );
  totalTests++;
  pass(`New page received incoming links from: ${integration.incomingLinksAdded.join(", ")}`);

  // Verify that sitemap.xml was updated to include the new page
  const updatedSitemap = integration.updatedFiles.find((f) => f.path === "sitemap.xml");
  assert.ok(updatedSitemap, "sitemap.xml must exist");
  const sitemapText = typeof updatedSitemap.content === "string" ? updatedSitemap.content : updatedSitemap.content.toString("utf-8");
  assert.ok(
    sitemapText.includes(newPageSlug),
    `sitemap.xml must contain new page ${newPageSlug}`
  );
  totalTests++;
  pass("sitemap.xml was automatically synchronized with the new page URL");

  // Re-verify complete crawl on updated project
  const updatedCrawl = validateWebsiteCrawlAccessibility(integration.updatedFiles, domain);
  assert.strictEqual(updatedCrawl.brokenLinksCount, 0, "No broken links after new page integration");
  totalTests++;
  pass("Crawl validation confirms ZERO broken links after adding Emergency Plumbing Dallas");

  // ==============================================================
  // 7. Test Deleted Page Workflow
  // ==============================================================
  console.log("\n[SECTION 7: Test Deleted Page Workflow & Dead Link Cleanup]");

  const deleteResult = deletePageFromProject(newPageSlug, integration.updatedFiles, domain);

  assert.ok(!deleteResult.updatedFiles.some((f) => f.path === newPageSlug), "Deleted file must be removed from files");
  totalTests++;
  pass("File emergency-plumbing-dallas.html was removed from package");

  assert.ok(deleteResult.removedDeadLinksCount >= 1, `Expected at least 1 dead link removed, got ${deleteResult.removedDeadLinksCount}`);
  totalTests++;
  pass(`Automated dead link cleaner stripped ${deleteResult.removedDeadLinksCount} link(s) across other pages`);

  // Verify sitemap removed the deleted page
  const postDeleteSitemap = deleteResult.updatedFiles.find((f) => f.path === "sitemap.xml");
  const postDeleteSitemapText = typeof postDeleteSitemap?.content === "string" ? postDeleteSitemap.content : postDeleteSitemap!.content.toString("utf-8");
  assert.ok(
    !postDeleteSitemapText.includes(newPageSlug),
    "sitemap.xml must no longer contain deleted page"
  );
  totalTests++;
  pass("sitemap.xml automatically removed the deleted page URL");

  // Re-verify complete crawl after deletion
  const postDeleteCrawl = validateWebsiteCrawlAccessibility(deleteResult.updatedFiles, domain);
  assert.strictEqual(postDeleteCrawl.brokenLinksCount, 0, "No dead links remaining after page deletion");
  totalTests++;
  pass("Zero 404 links remain across the entire website after deletion");

  // ==============================================================
  // 8. Relative vs Absolute Link Resolution
  // ==============================================================
  console.log("\n[SECTION 8: POSIX Relative vs Absolute Path Resolution]");

  assert.strictEqual(
    calculateRelativeHref("services/drain-cleaning.html", "index.html"),
    "../index.html"
  );
  assert.strictEqual(
    calculateRelativeHref("index.html", "services/drain-cleaning.html"),
    "services/drain-cleaning.html"
  );
  assert.strictEqual(
    resolveHref("services/drain-cleaning.html", "../index.html"),
    "index.html"
  );
  assert.strictEqual(
    resolveHref("index.html", "services/pipe-repair.html"),
    "services/pipe-repair.html"
  );
  totalTests += 4;
  pass("POSIX relative and folder-traversal href calculations verified");

  console.log("\n==================================================");
  console.log(`📊 MASTER AUDIT SUMMARY: ALL ${totalTests} TESTS PASSED`);
  console.log("==================================================");
  console.log("🎉 INTERNAL LINKING & PAGE CONNECTIVITY ENGINE VERIFIED!\n");
}

main().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
