import assert from "assert";
import {
  LocationEntity,
  ServiceEntity,
  RankLocalBusinessProfile,
  LocationEntitySchema,
  ServiceEntitySchema,
  RankLocalBusinessProfileSchema,
} from "../lib/entities/types";
import {
  formDataToBusinessProfile,
  businessProfileToFormData,
  createLocationEntity,
  createServiceEntity,
  parseCityState,
} from "../lib/entities/adapters";
import {
  calculateDistanceMiles,
  groupLocationsByCounty,
  findNearbyLocations,
  buildGeoSiloHierarchy,
} from "../lib/entities/geo-silo";
import {
  InternalLinkingGraph,
  buildGraphFromRegistry,
  GraphNode,
  GraphEdge,
} from "../lib/seo/linking-graph";
import {
  PageRegistry,
  buildRegistryFromBusinessProfile,
  resolveInternalLinks,
} from "../lib/registry/page-registry";
import {
  buildLocalizedPagePrompt,
  createJobsFromRegistry,
  PageQueueRunner,
} from "../lib/generator/queue/page-job";
import { WebsiteFormData } from "../lib/generator/prompt";

console.log("==================================================");
console.log("RUNNING RANK LOCAL - LOCAL SEO & GRAPH ENGINE AUDIT");
console.log("==================================================\n");

let passedChecks = 0;
function trackCheck(name: string, fn: () => void) {
  try {
    fn();
    passedChecks++;
    console.log(`  [PASS] ${name}`);
  } catch (err: any) {
    console.error(`  [FAIL] ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// ----------------------------------------------------
// 1. Structured Entities & Adapters
// ----------------------------------------------------
console.log("1. Structured Entities & Adapters Validation:");

trackCheck("parseCityState correctly parses comma and space formats", () => {
  const p1 = parseCityState("Beaverton, OR");
  assert.strictEqual(p1.city, "Beaverton");
  assert.strictEqual(p1.stateCode, "OR");

  const p2 = parseCityState("Seattle WA");
  assert.strictEqual(p2.city, "Seattle");
  assert.strictEqual(p2.stateCode, "WA");

  const p3 = parseCityState("Dallas", "TX");
  assert.strictEqual(p3.city, "Dallas");
  assert.strictEqual(p3.stateCode, "TX");
});

trackCheck("createLocationEntity and createServiceEntity create validated objects", () => {
  const loc = createLocationEntity("Portland, OR", {
    county: "Multnomah County",
    zipCodes: ["97201", "97205"],
    neighborhoods: ["Pearl District", "Hawthorne"],
    isPrimary: true,
  });

  const validLoc = LocationEntitySchema.parse(loc);
  assert.strictEqual(validLoc.city, "Portland");
  assert.strictEqual(validLoc.stateCode, "OR");
  assert.strictEqual(validLoc.isPrimaryLocation, true);

  const srv = createServiceEntity("Drain Cleaning & Hydro-Jetting", {
    category: "Plumbing",
    emergencyAvailable: true,
    commonProblems: ["Clogged main line", "Slow shower drain"],
  });

  const validSrv = ServiceEntitySchema.parse(srv);
  assert.strictEqual(validSrv.slug, "drain-cleaning-hydro-jetting");
  assert.strictEqual(validSrv.emergencyAvailable, true);
});

trackCheck("formDataToBusinessProfile converts legacy form data cleanly", () => {
  const mockFormData: WebsiteFormData = {
    businessName: "Cascade Premier Plumbing",
    businessType: "Plumbing",
    city: "Beaverton",
    stateRegion: "OR",
    phone: "(503) 555-0199",
    email: "service@cascadeplumbing.com",
    services: ["Water Heater Repair", "Drain Cleaning", "Repiping"],
    serviceAreas: "Portland, Tigard, Hillsboro, Lake Oswego",
    emergency247: true,
    licenseNumber: "CCB# 234567",
    targetKeywords: "plumber beaverton, emergency plumber",
  };

  const profile = formDataToBusinessProfile(mockFormData);
  const validated = RankLocalBusinessProfileSchema.parse(profile);

  assert.strictEqual(validated.businessName, "Cascade Premier Plumbing");
  assert.strictEqual(validated.locations.length, 5); // Beaverton + 4 service areas
  assert.strictEqual(validated.services.length, 3);
  assert.strictEqual(validated.locations[0].city, "Beaverton");
  assert.strictEqual(validated.locations[0].isPrimaryLocation, true);

  // Convert back and ensure compatibility
  const back = businessProfileToFormData(profile);
  assert.strictEqual(back.businessName, "Cascade Premier Plumbing");
  assert.strictEqual(back.city, "Beaverton");
  assert.strictEqual(back.services?.length, 3);
});

// ----------------------------------------------------
// 2. Geographic Silo & Proximity Matching
// ----------------------------------------------------
console.log("\n2. Geographic Silo & Proximity Engine:");

trackCheck("calculateDistanceMiles calculates correct distance between coordinates", () => {
  // Portland OR (45.5152, -122.6784) to Beaverton OR (45.4871, -122.8037) ~ 6.3 miles
  const dist = calculateDistanceMiles(45.5152, -122.6784, 45.4871, -122.8037);
  assert.ok(dist > 5 && dist < 8, `Distance was ${dist}`);
});

trackCheck("findNearbyLocations selects closest neighbor locations", () => {
  const beaverton = createLocationEntity("Beaverton, OR", {
    county: "Washington County",
    surroundingCities: ["Tigard", "Aloha", "Hillsboro"],
  });
  const tigard = createLocationEntity("Tigard, OR", { county: "Washington County" });
  const hillsboro = createLocationEntity("Hillsboro, OR", { county: "Washington County" });
  const bend = createLocationEntity("Bend, OR", { county: "Deschutes County" });

  const nearby = findNearbyLocations(beaverton, [beaverton, tigard, hillsboro, bend], 2);
  assert.strictEqual(nearby.length, 2);
  const cities = nearby.map((n) => n.city);
  assert.ok(cities.includes("Tigard"));
  assert.ok(cities.includes("Hillsboro"));
  assert.ok(!cities.includes("Bend")); // Far away in another county
});

trackCheck("buildGeoSiloHierarchy creates nested State -> County -> City hierarchy", () => {
  const locs = [
    createLocationEntity("Beaverton, OR", { county: "Washington County" }),
    createLocationEntity("Hillsboro, OR", { county: "Washington County" }),
    createLocationEntity("Portland, OR", { county: "Multnomah County" }),
    createLocationEntity("Gresham, OR", { county: "Multnomah County" }),
  ];

  const hierarchy = buildGeoSiloHierarchy(locs);
  assert.strictEqual(hierarchy.length, 1);
  assert.strictEqual(hierarchy[0].state, "OR");
  assert.strictEqual(hierarchy[0].counties.length, 2);

  const washCounty = hierarchy[0].counties.find((c) => c.countyName === "Washington County");
  assert.strictEqual(washCounty?.cities.length, 2);
});

// ----------------------------------------------------
// 3. Page Registry & Matrix Generation
// ----------------------------------------------------
console.log("\n3. Page Registry & Matrix Generation:");

trackCheck("buildRegistryFromBusinessProfile generates complete site architecture and matrix", () => {
  const profile: RankLocalBusinessProfile = {
    businessName: "Apex Heating & Air",
    phone: "(503) 555-0123",
    nicheTrade: "HVAC Contractor",
    schemaType: "HVACBusiness",
    headquarters: { city: "Portland", state: "Oregon", stateCode: "OR" },
    businessModel: "service-area",
    locations: [
      createLocationEntity("Portland, OR", { isPrimary: true }),
      createLocationEntity("Beaverton, OR"),
      createLocationEntity("Gresham, OR"),
    ],
    services: [
      createServiceEntity("AC Repair"),
      createServiceEntity("Furnace Installation"),
    ],
  };

  const registry = buildRegistryFromBusinessProfile(profile, {
    generateServiceLocationMatrix: true,
  });

  const allPages = registry.getAll();
  // 1 home + 3 standard + 1 services hub + 2 services + 1 areas hub + 3 locations + 6 matrix (3 locs x 2 svcs) = 17 pages
  assert.strictEqual(allPages.length, 17);

  const home = registry.getById("home");
  assert.ok(home);

  const matrixPage = registry.getById("matrix-ac-repair-beaverton-or");
  assert.ok(matrixPage);
  assert.strictEqual(matrixPage.pageType, "service_location");
  assert.strictEqual(matrixPage.parentPageId, "svc-ac-repair");
});

// ----------------------------------------------------
// 4. Internal Linking Graph Engine
// ----------------------------------------------------
console.log("\n4. Internal Linking Graph Engine:");

trackCheck("InternalLinkingGraph accurately calculates in-degree, out-degree, and orphans", () => {
  const graph = new InternalLinkingGraph();

  graph.addNode({ id: "home", slug: "home", title: "Home", pageType: "home", outputFilePath: "index.html" });
  graph.addNode({ id: "srv-plumbing", slug: "plumbing", title: "Plumbing", pageType: "service", outputFilePath: "services.html" });
  graph.addNode({ id: "loc-beaverton", slug: "beaverton", title: "Beaverton", pageType: "location", outputFilePath: "areas/beaverton.html" });
  graph.addNode({ id: "orphan-page", slug: "orphan", title: "Orphan Page", pageType: "service", outputFilePath: "orphan.html" });

  graph.addEdge({ sourceId: "home", targetId: "srv-plumbing", anchorText: "Plumbing Services", context: "header_nav" });
  graph.addEdge({ sourceId: "home", targetId: "loc-beaverton", anchorText: "Beaverton Area", context: "footer_nav" });
  graph.addEdge({ sourceId: "srv-plumbing", targetId: "loc-beaverton", anchorText: "Beaverton Plumbing", context: "content_body" });

  assert.strictEqual(graph.getInDegree("home"), 0);
  assert.strictEqual(graph.getOutDegree("home"), 2);
  assert.strictEqual(graph.getInDegree("loc-beaverton"), 2);
  assert.strictEqual(graph.getInDegree("orphan-page"), 0);

  const orphans = graph.getOrphanNodes();
  assert.strictEqual(orphans.length, 1);
  assert.strictEqual(orphans[0].id, "orphan-page");
});

trackCheck("calculateLinkEquity flows equity using PageRank dampening", () => {
  const graph = new InternalLinkingGraph();

  graph.addNode({ id: "home", slug: "home", title: "Home", pageType: "home", outputFilePath: "index.html" });
  graph.addNode({ id: "hub", slug: "hub", title: "Services", pageType: "services hub", outputFilePath: "services/index.html" });
  graph.addNode({ id: "p1", slug: "p1", title: "Page 1", pageType: "service", outputFilePath: "services/p1.html" });

  graph.addEdge({ sourceId: "home", targetId: "hub", anchorText: "Services", context: "header_nav" });
  graph.addEdge({ sourceId: "hub", targetId: "p1", anchorText: "Service 1", context: "silo_child" });
  graph.addEdge({ sourceId: "p1", targetId: "hub", anchorText: "Back to Hub", context: "silo_parent" });

  const equity = graph.calculateLinkEquity();
  assert.ok(equity.has("home"));
  assert.ok(equity.has("hub"));
  assert.ok(equity.has("p1"));

  // Hub receives incoming links from both home and p1, so it should have highest equity
  const hubScore = equity.get("hub") || 0;
  const homeScore = equity.get("home") || 0;
  assert.ok(hubScore > homeScore, `Hub score ${hubScore} should be higher than home score ${homeScore}`);
});

trackCheck("recommendLinksForPage generates contextual sibling and silo links", () => {
  const loc1 = createLocationEntity("Beaverton, OR", { county: "Washington County", surroundingCities: ["Tigard"] });
  const loc2 = createLocationEntity("Tigard, OR", { county: "Washington County" });

  const graph = new InternalLinkingGraph();
  graph.addNode({
    id: "loc-beaverton-or",
    slug: "beaverton-or",
    title: "Plumber in Beaverton",
    pageType: "location",
    outputFilePath: "areas/beaverton-or/index.html",
    locationId: loc1.id,
    parentPageId: "areas-hub",
  });
  graph.addNode({
    id: "loc-tigard-or",
    slug: "tigard-or",
    title: "Plumber in Tigard",
    pageType: "location",
    outputFilePath: "areas/tigard-or/index.html",
    locationId: loc2.id,
  });
  graph.addNode({
    id: "areas-hub",
    slug: "areas-hub",
    title: "Service Areas Hub",
    navLabel: "All Service Areas",
    pageType: "areas hub",
    outputFilePath: "service-areas/index.html",
  });

  const recs = graph.recommendLinksForPage("loc-beaverton-or", {
    allLocations: [loc1, loc2],
  });

  assert.ok(recs.length >= 2);
  const siloParentRec = recs.find((r) => r.context === "silo_parent");
  assert.ok(siloParentRec, "Should recommend linking to areas-hub");
  assert.strictEqual(siloParentRec?.targetNodeId, "areas-hub");

  const siblingRec = recs.find((r) => r.context === "sibling_geo");
  assert.ok(siblingRec, "Should recommend linking to nearby Tigard");
  assert.strictEqual(siblingRec?.targetNodeId, "loc-tigard-or");
});

trackCheck("extractLinksFromHtml accurately maps internal hyperlinks to graph edges", () => {
  const graph = new InternalLinkingGraph();
  graph.addNode({ id: "home", slug: "home", title: "Home", pageType: "home", outputFilePath: "index.html" });
  graph.addNode({ id: "about", slug: "about", title: "About", pageType: "about", outputFilePath: "about.html" });
  graph.addNode({ id: "svc-water-heater", slug: "water-heater", title: "Water Heater", pageType: "service", outputFilePath: "services/water-heater/index.html" });

  const sampleHtml = `
    <div>
      <p>Welcome to our company. Check our <a href="about.html">About Page</a>.</p>
      <p>We also fix <a href="services/water-heater/">Hot Water Heaters</a> with pride.</p>
      <p>Call us at <a href="tel:5551234567">(555) 123-4567</a> or visit <a href="https://google.com">Google</a>.</p>
    </div>
  `;

  const edges = graph.extractLinksFromHtml("home", sampleHtml);
  assert.strictEqual(edges.length, 2);
  assert.strictEqual(edges[0].targetId, "about");
  assert.strictEqual(edges[0].anchorText, "About Page");
  assert.strictEqual(edges[1].targetId, "svc-water-heater");
});

trackCheck("resolveInternalLinks converts token tags into valid relative links", () => {
  const registry = new PageRegistry();
  registry.register({ id: "home", pageType: "home", title: "Home", navLabel: "Home", outputFilePath: "index.html" });
  registry.register({ id: "loc-portland", pageType: "location", title: "Portland Plumbing", navLabel: "Portland", outputFilePath: "areas/portland/index.html" });

  const rawText = "We offer rapid dispatch in [[link:loc-portland|Portland Metro Area]] today.";
  const resolved = resolveInternalLinks(rawText, "index.html", registry, "web");

  assert.ok(resolved.includes('href="areas/portland/"'));
  assert.ok(resolved.includes("Portland Metro Area"));
});

// ----------------------------------------------------
// 5. Granular Prompt Builder & Anti-Doorway Verification
// ----------------------------------------------------
console.log("\n5. Localized Prompt Engine & Anti-Doorway Rules:");

trackCheck("buildLocalizedPagePrompt generates strict anti-doorway localized instructions", () => {
  const loc = createLocationEntity("Hillsboro, OR", {
    county: "Washington County",
    neighborhoods: ["Orenco Station", "Tanasbourne"],
    landmarks: ["Ron Tonkin Field", "Shute Park"],
    localContextNotes: "Clay-heavy soil causing seasonal foundation pressure and sewer line settling",
  });

  const srv = createServiceEntity("Main Sewer Line Repair", {
    category: "Plumbing",
    commonProblems: ["Tree root intrusion", "Collapsed clay pipes"],
  });

  const profile: RankLocalBusinessProfile = {
    businessName: "Cascade Sewer & Drain",
    phone: "(503) 555-7788",
    nicheTrade: "Plumber",
    schemaType: "Plumber",
    headquarters: { city: "Hillsboro", state: "Oregon", stateCode: "OR" },
    businessModel: "service-area",
    locations: [loc],
    services: [srv],
  };

  const job = {
    id: "job-1",
    pageId: "page-sewer-hillsboro",
    slug: "main-sewer-line-repair-hillsboro-or",
    outputFilePath: "services/sewer-repair/hillsboro/index.html",
    pageType: "service_location" as const,
    title: "Main Sewer Line Repair in Hillsboro, OR",
    service: srv,
    location: loc,
    targetKeywords: ["sewer repair hillsboro or"],
    status: "pending" as const,
    attempts: 0,
    maxAttempts: 3,
  };

  const prompt = buildLocalizedPagePrompt({
    businessProfile: profile,
    job,
  });

  assert.ok(prompt.systemPrompt.includes("CRITICAL ANTI-DOORWAY REQUIREMENTS"));
  assert.ok(prompt.systemPrompt.includes("ZERO BOILERPLATE DUPLICATION"));
  assert.ok(prompt.userPrompt.includes("Orenco Station, Tanasbourne"));
  assert.ok(prompt.userPrompt.includes("Ron Tonkin Field, Shute Park"));
  assert.ok(prompt.userPrompt.includes("Clay-heavy soil causing seasonal foundation pressure"));
  assert.ok(prompt.userPrompt.includes("Tree root intrusion, Collapsed clay pipes"));
});

// ----------------------------------------------------
// 6. Page Generation Queue Runner
// ----------------------------------------------------
console.log("\n6. Page Generation Queue Runner:");

trackCheck("PageQueueRunner processes jobs with progress tracking and retry logic", async () => {
  const profile: RankLocalBusinessProfile = {
    businessName: "Metro Electric",
    phone: "(503) 555-9988",
    nicheTrade: "Electrician",
    schemaType: "Electrician",
    headquarters: { city: "Portland", state: "Oregon", stateCode: "OR" },
    businessModel: "service-area",
    locations: [createLocationEntity("Portland, OR")],
    services: [createServiceEntity("Panel Upgrade"), createServiceEntity("EV Charger Installation")],
  };

  const registry = buildRegistryFromBusinessProfile(profile);
  const jobs = createJobsFromRegistry(registry, profile);

  assert.ok(jobs.length >= 4);

  const runner = new PageQueueRunner(jobs.slice(0, 3));
  let progressCount = 0;

  runner.onProgress((progress) => {
    progressCount++;
  });

  const completedJobs = await runner.runQueue(async (job) => {
    return {
      html: `<!DOCTYPE html><html><head><title>${job.title}</title></head><body><h1>${job.title}</h1></body></html>`,
      seo: { title: job.title, description: `Best ${job.title}`, h1: job.title },
    };
  });

  assert.strictEqual(completedJobs.length, 3);
  assert.ok(completedJobs.every((j) => j.status === "completed"));
  assert.ok(progressCount >= 3);
  assert.strictEqual(runner.getProgress().percent, 100);
});

console.log("\n==================================================");
console.log(`ALL AUDIT CHECKS PASSED: ${passedChecks}/${passedChecks}`);
console.log("==================================================");
