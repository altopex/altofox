/**
 * RankLocal 2.0: Internal Linking System Verification Test Suite
 *
 * Verifies:
 * 1. Complete URL map creation before link generation
 * 2. Target existence verification (NEVER links to nonexistent pages)
 * 3. Link graph construction BEFORE inserting links
 * 4. All 8 relationship types:
 *    - Homepage → Services
 *    - Homepage → Locations
 *    - Service → Related Services
 *    - Service → Locations
 *    - Location → Services
 *    - Location → Related Locations
 *    - Blog → Services
 *    - Blog → Locations
 * 5. Elimination and resolution of orphan pages
 * 6. Detection and diversification of excessive repeated anchor text
 * 7. HTML link insertion with accurate relative URL resolution
 * 8. Zero broken internal links
 * 9. Full internal-link audit reporting:
 *    - Total pages
 *    - Internal links
 *    - Broken links
 *    - Orphan pages
 */

import {
  InternalLinkEngine,
  InternalLinkAuditReport,
} from "../lib/seo/internal-link-engine";
import { executeGenerationPipeline } from "../lib/pipeline/pipeline-executor";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runInternalLinkingTests() {
  console.log("===============================================================================");
  console.log("   RANKLOCAL 2.0: INTERNAL LINKING SYSTEM ARCHITECTURE VERIFICATION TEST");
  console.log("===============================================================================\n");

  // =========================================================================
  // TEST 1: URL Map Creation & Target Existence Verification
  // =========================================================================
  console.log("--- TEST 1: URL Map Creation & Target Existence Verification ---");
  const engine = new InternalLinkEngine({
    businessName: "Windy City Plumbing",
    primaryTrade: "Plumber",
    domain: "windycityplumbing.com",
    serviceAreaCities: [
      { city: "Chicago", stateId: "IL" },
      { city: "Evanston", stateId: "IL" },
      { city: "Naperville", stateId: "IL" },
      { city: "Aurora", stateId: "IL" },
    ],
  });

  const mockFiles = [
    {
      path: "index.html",
      content: `<!DOCTYPE html><html><head><title>Windy City Plumbing | Chicago, IL</title></head><body><main><h1>Expert Chicago Plumber</h1><p>Welcome to our plumbing company.</p></main></body></html>`,
    },
    {
      path: "services.html",
      content: `<!DOCTYPE html><html><head><title>Plumbing Services | Windy City Plumbing</title></head><body><main><h1>All Plumbing Services</h1><p>Full suite of plumbing solutions.</p></main></body></html>`,
    },
    {
      path: "water-heater-repair.html",
      content: `<!DOCTYPE html><html><head><title>Water Heater Repair | Windy City Plumbing</title></head><body><main><h1>Water Heater Repair</h1><p>Emergency hot water heater diagnostics and maintenance.</p></main></body></html>`,
    },
    {
      path: "drain-cleaning.html",
      content: `<!DOCTYPE html><html><head><title>Drain Cleaning | Windy City Plumbing</title></head><body><main><h1>Drain Cleaning</h1><p>Clearing clogged drains and sewer pipes.</p></main></body></html>`,
    },
    {
      path: "leak-detection.html",
      content: `<!DOCTYPE html><html><head><title>Leak Detection | Windy City Plumbing</title></head><body><main><h1>Leak Detection</h1><p>Non-invasive pipe leak detection.</p></main></body></html>`,
    },
    {
      path: "service-areas.html",
      content: `<!DOCTYPE html><html><head><title>Service Areas | Windy City Plumbing</title></head><body><main><h1>Service Areas</h1><p>Coverage across Chicagoland.</p></main></body></html>`,
    },
    {
      path: "plumber-evanston.html",
      content: `<!DOCTYPE html><html><head><title>Plumber in Evanston | Windy City Plumbing</title></head><body><main><h1>Evanston Plumber</h1><p>Licensed plumbing services in Evanston, IL.</p></main></body></html>`,
    },
    {
      path: "plumber-naperville.html",
      content: `<!DOCTYPE html><html><head><title>Plumber in Naperville | Windy City Plumbing</title></head><body><main><h1>Naperville Plumber</h1><p>Licensed plumbing services in Naperville, IL.</p></main></body></html>`,
    },
    {
      path: "plumber-aurora.html",
      content: `<!DOCTYPE html><html><head><title>Plumber in Aurora | Windy City Plumbing</title></head><body><main><h1>Aurora Plumber</h1><p>Licensed plumbing services in Aurora, IL.</p></main></body></html>`,
    },
    {
      path: "blog.html",
      content: `<!DOCTYPE html><html><head><title>Plumbing Tips & Guides | Windy City Plumbing</title></head><body><main><h1>Homeowner Guides</h1><p>Tips for maintenance.</p></main></body></html>`,
    },
    {
      path: "blog/how-to-prevent-pipe-leaks.html",
      content: `<!DOCTYPE html><html><head><title>How to Prevent Pipe Leaks | Windy City Plumbing</title></head><body><main><h1>How to Prevent Pipe Leaks</h1><p>Protect your home from water damage with leak detection.</p></main></body></html>`,
    },
  ];

  const urlMap = engine.createUrlMap(mockFiles);
  assert(urlMap.size === mockFiles.length, "URL map contains all 11 pages");
  assert(engine.verifyTargetExists("index.html"), "index.html exists in URL map");
  assert(engine.verifyTargetExists("water-heater-repair.html"), "water-heater-repair.html exists in URL map");
  assert(engine.verifyTargetExists("blog/how-to-prevent-pipe-leaks.html"), "Nested blog post exists in URL map");
  assert(!engine.verifyTargetExists("non-existent-page.html"), "Non-existent page correctly rejected");
  assert(!engine.verifyTargetExists("random-service.html"), "Random service correctly rejected");

  const targetCheck = engine.verifyEveryTargetExists();
  assert(targetCheck.allExist, "verifyEveryTargetExists confirms all mapped targets exist");
  assert(targetCheck.validTargets.length === mockFiles.length, `All ${mockFiles.length} targets verified`);

  const mixedCheck = engine.verifyEveryTargetExists(["index.html", "fake-page.html"]);
  assert(!mixedCheck.allExist, "verifyEveryTargetExists catches missing targets");
  assert(mixedCheck.missingTargets.includes("fake-page.html"), "fake-page.html identified as missing");

  // Rule: Never plan links to non-existent pages
  const badEdgePlanned = engine.planEdge({
    sourceFilePath: "index.html",
    targetFilePath: "ghost-page.html",
    relationshipType: "homepage_to_services",
    anchorText: "Ghost Service",
    priority: 1,
  });
  assert(badEdgePlanned === false, "Rule verified: Linking to non-existent target is rejected");

  // =========================================================================
  // TEST 2: Graph Construction BEFORE Link Insertion
  // =========================================================================
  console.log("\n--- TEST 2: Internal Link Graph Construction BEFORE Link Insertion ---");
  engine.generateLinks(); // Step 3: Generate links (build link graph)

  const preValidation = engine.validateLinks(); // Step 4: Validate links
  assert(preValidation.valid, "validateLinks confirms zero broken links planned in link graph");

  let totalPlannedEdges = 0;
  for (const edges of engine.plannedEdges.values()) {
    totalPlannedEdges += edges.length;
  }
  assert(totalPlannedEdges > 0, `Graph constructed with ${totalPlannedEdges} planned edges before HTML modification`);

  const homeEdges = engine.plannedEdges.get("index.html") || [];
  assert(homeEdges.length > 0, "Homepage has planned outgoing edges");

  // =========================================================================
  // TEST 3: All 8 Relationship Types
  // =========================================================================
  console.log("\n--- TEST 3: Verification of All 8 Relationship Types ---");
  const relBreakdown: Record<string, number> = {};
  for (const edges of engine.plannedEdges.values()) {
    for (const e of edges) {
      relBreakdown[e.relationshipType] = (relBreakdown[e.relationshipType] || 0) + 1;
    }
  }

  // 1. Homepage → Services
  assert((relBreakdown["homepage_to_services"] || 0) > 0, `1. Homepage → Services verified (${relBreakdown["homepage_to_services"]} edges)`);

  // 2. Homepage → Locations
  assert((relBreakdown["homepage_to_locations"] || 0) > 0, `2. Homepage → Locations verified (${relBreakdown["homepage_to_locations"]} edges)`);

  // 3. Service → Related Services
  assert((relBreakdown["service_to_related_services"] || 0) > 0, `3. Service → Related Services verified (${relBreakdown["service_to_related_services"]} edges)`);

  // 4. Service → Locations
  assert((relBreakdown["service_to_locations"] || 0) > 0, `4. Service → Locations verified (${relBreakdown["service_to_locations"]} edges)`);

  // 5. Location → Services
  assert((relBreakdown["location_to_services"] || 0) > 0, `5. Location → Services verified (${relBreakdown["location_to_services"]} edges)`);

  // 6. Location → Related Locations
  assert((relBreakdown["location_to_related_locations"] || 0) > 0, `6. Location → Related Locations verified (${relBreakdown["location_to_related_locations"]} edges)`);

  // 7. Blog → Services
  assert((relBreakdown["blog_to_services"] || 0) > 0, `7. Blog → Services verified (${relBreakdown["blog_to_services"]} edges)`);

  // 8. Blog → Locations
  assert((relBreakdown["blog_to_locations"] || 0) > 0, `8. Blog → Locations verified (${relBreakdown["blog_to_locations"]} edges)`);

  // =========================================================================
  // TEST 4: Orphan Detection and Elimination
  // =========================================================================
  console.log("\n--- TEST 4: Orphan Detection & Elimination ---");
  // Introduce a brand new isolated page in files
  const isolatedFiles = [
    ...mockFiles,
    {
      path: "emergency-plumbing.html",
      content: `<!DOCTYPE html><html><head><title>Emergency Plumbing | Windy City Plumbing</title></head><body><main><h1>Emergency 24/7 Plumbing</h1><p>Fast emergency repairs.</p></main></body></html>`,
    },
  ];

  const orphanEngine = new InternalLinkEngine({
    businessName: "Windy City Plumbing",
    primaryTrade: "Plumber",
    domain: "windycityplumbing.com",
  });
  orphanEngine.createUrlMap(isolatedFiles);
  orphanEngine.buildLinkGraph();

  // Test detect & resolve
  const resolvedOrphans = orphanEngine.detectAndResolveOrphans();
  console.log(`Resolved orphan pages count: ${resolvedOrphans.length}`);

  // Every page (except homepage) must have at least 1 incoming planned edge
  for (const [path, node] of orphanEngine.urlMap.entries()) {
    if (path === "index.html") continue;
    const incoming = orphanEngine.incomingPlannedEdges.get(path) || [];
    assert(incoming.length >= 1, `Page "${path}" has ${incoming.length} incoming edge(s) (zero orphans)`);
  }

  // =========================================================================
  // TEST 5: Detection of Excessive Repeated Anchor Text
  // =========================================================================
  console.log("\n--- TEST 5: Anchor Text Diversification & Anti-Repetition ---");
  const anchorWarnings = orphanEngine.detectAndDiversifyRepeatedAnchors(0.35);
  console.log(`Detected & diversified repeated anchor warnings: ${anchorWarnings.length}`);

  // Test anchor variants generator
  const sampleTarget = orphanEngine.urlMap.get("water-heater-repair.html")!;
  const variants = orphanEngine.generateAnchorVariants(sampleTarget, "service_to_related_services");
  assert(variants.length >= 4, `Target has ${variants.length} diversified anchor variants: ${variants.join(", ")}`);
  assert(new Set(variants).size === variants.length, "All generated anchor variants are unique");

  // =========================================================================
  // TEST 6: Execution Pipeline & HTML Link Insertion
  // =========================================================================
  console.log("\n--- TEST 6: HTML Link Insertion with Relative Path Resolution ---");
  const executionResult = orphanEngine.execute(isolatedFiles);
  const updatedFiles = executionResult.files;
  const auditReport = executionResult.auditReport;

  // Verify nested blog post relative link
  const updatedBlogFile = updatedFiles.find((f) => f.path === "blog/how-to-prevent-pipe-leaks.html")!;
  const blogHtml = updatedBlogFile.content.toString();
  assert(blogHtml.includes('href="../'), "Nested blog post properly resolved upward relative paths (../)");

  // Verify homepage updated HTML has links
  const updatedHome = updatedFiles.find((f) => f.path === "index.html")!;
  const homeHtml = updatedHome.content.toString();
  assert(homeHtml.includes("services.html") || homeHtml.includes("water-heater-repair.html"), "Homepage contains injected links");

  // =========================================================================
  // TEST 7: Link Validation & Audit Report Metrics
  // =========================================================================
  console.log("\n--- TEST 7: Link Validation & Internal-Link Audit Report Metrics ---");
  assert(auditReport.totalPages === isolatedFiles.length, `Total pages match (${auditReport.totalPages})`);
  assert(auditReport.internalLinks > 0, `Total internal links count: ${auditReport.internalLinks}`);
  assert(auditReport.brokenLinks === 0, `Rule verified: Broken links count is 0 (got ${auditReport.brokenLinks})`);
  assert(auditReport.isHealthy === true, "Audit report confirms graph isHealthy");
  assert(Boolean(auditReport.reportText), "Audit report contains formatted reportText");
  assert(auditReport.reportText.includes("Total pages:"), "reportText includes Total pages");
  assert(auditReport.reportText.includes("Internal links:"), "reportText includes Internal links");
  assert(auditReport.reportText.includes("Broken links:"), "reportText includes Broken links");
  assert(auditReport.reportText.includes("Orphan pages:"), "reportText includes Orphan pages");
  assert(Boolean(auditReport.summaryReportText), "Audit report contains summaryReportText");

  // =========================================================================
  // TEST 8: End-to-End Pipeline Integration with Real Site Generation
  // =========================================================================
  console.log("\n--- TEST 8: Full Website Generation Pipeline with Internal Linking ---");
  const fullResult = await executeGenerationPipeline({
    businessName: "Midwest Premier Plumbing",
    businessType: "Plumbing",
    city: "Chicago",
    targetLocation: "Chicago, IL",
    formData: {
      businessName: "Midwest Premier Plumbing",
      businessType: "Plumbing",
      city: "Chicago",
      stateRegion: "IL",
      phone: "(312) 555-0199",
      email: "contact@midwestpremierplumbing.com",
      streetAddress: "200 E Randolph St",
      services: [
        "Water Heater Repair",
        "Drain Cleaning",
        "Leak Detection",
        "Emergency Plumbing",
        "Pipe Replacement",
        "Sewer Line Inspection",
      ],
      serviceAreas: "Chicago, Evanston, Naperville, Aurora, Joliet",
      serviceAreaCities: [
        { city: "Chicago", stateId: "IL" },
        { city: "Evanston", stateId: "IL" },
        { city: "Naperville", stateId: "IL" },
        { city: "Aurora", stateId: "IL" },
        { city: "Joliet", stateId: "IL" },
      ],
      hasBlog: true,
      keywords: "plumber Chicago, drain cleaning, water heater repair",
      theme: { id: "forge" },
      preferredSource: "none",
    },
    demo: true,
  });

  assert(fullResult.success === true, "Website generation pipeline completed successfully");
  assert(Boolean(fullResult.files), "Files generated");

  const generatedHtmlFiles = fullResult.files?.filter((f) => f.path.endsWith(".html")) || [];
  console.log(`Generated ${generatedHtmlFiles.length} HTML pages.`);
  assert(generatedHtmlFiles.length >= 10, `Generated at least 10 pages (got ${generatedHtmlFiles.length})`);

  // Run InternalLinkEngine audit on the generated files
  const siteLinkEngine = new InternalLinkEngine({
    businessName: "Midwest Premier Plumbing",
    primaryTrade: "Plumbing",
    domain: "midwestpremierplumbing.com",
    serviceAreaCities: [
      { city: "Chicago", stateId: "IL" },
      { city: "Evanston", stateId: "IL" },
      { city: "Naperville", stateId: "IL" },
      { city: "Aurora", stateId: "IL" },
      { city: "Joliet", stateId: "IL" },
    ],
  });

  const fullSiteAudit = siteLinkEngine.runInternalLinkAudit(fullResult.files!);

  console.log("\n--- FULL WEBSITE GENERATION INTERNAL-LINK AUDIT ---");
  console.log(`Total pages:    ${fullSiteAudit.totalPages}`);
  console.log(`Internal links: ${fullSiteAudit.internalLinks}`);
  console.log(`Broken links:   ${fullSiteAudit.brokenLinks}`);
  console.log(`Orphan pages:   ${fullSiteAudit.orphanPages}`);

  assert(fullSiteAudit.totalPages >= 10, "Total pages >= 10 verified");
  assert(fullSiteAudit.internalLinks > 20, "Rich internal link network (>20 links) verified");
  assert(fullSiteAudit.brokenLinks === 0, "Zero broken links verified");
  assert(fullSiteAudit.orphanPages === 0, "Zero orphan pages verified");
  assert(fullSiteAudit.isHealthy === true, "Full site internal link health verified");

  console.log("\n===============================================================================");
  console.log("   ALL INTERNAL LINKING TESTS PASSED SUCCESSFULLY!");
  console.log("===============================================================================\n");
}

runInternalLinkingTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
