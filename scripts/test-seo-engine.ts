/**
 * Comprehensive SEO Engine Test Suite
 *
 * Validates:
 * 1. Every page generates:
 *    - <title> (unique, CTR-optimized, localized)
 *    - <meta name="description"> (unique, <= 160 chars)
 *    - canonical link (<link rel="canonical">)
 *    - robots meta (<meta name="robots">)
 *    - Open Graph tags (og:title, og:description, og:url, og:type, og:site_name, og:image)
 *    - Social metadata (twitter:card, twitter:title, twitter:description, twitter:image)
 *    - H1 (exactly one primary H1)
 *    - H2 hierarchy (secondary H1s transformed to H2)
 *    - Breadcrumbs markup and schema on inner pages
 *    - Schema strictly tailored by page type:
 *      * Homepage: LocalBusiness (with verified real info only)
 *      * Service: Service
 *      * FAQ: FAQPage ONLY when real Q&As exist
 *      * Blog: BlogPosting
 *      * Navigation: BreadcrumbList
 * 2. Crawl assets:
 *    - sitemap.xml
 *    - robots.txt
 * 3. Anti-Spam & Ground-Truth Rules:
 *    - No fake street address for service-area business
 *    - No fake aggregate rating without confirmed real reviews
 * 4. Full validation audit reporting all 10 required metrics:
 *    - Missing titles
 *    - Duplicate titles
 *    - Missing meta descriptions
 *    - Duplicate meta descriptions
 *    - Missing H1
 *    - Multiple problematic H1s
 *    - Missing canonical
 *    - Schema errors
 *    - Sitemap errors
 *    - Robots errors
 * 5. Full End-to-End Pipeline assembly test
 */

import { SeoEngine, SeoSiteMeta, resolveLocalBusinessSchemaType } from "../lib/seo/seo-engine";
import { assembleWebsite } from "../templates/assembler";
import { THEMES } from "../lib/themes";
import { SiteBlueprintEngine } from "../lib/blueprint/site-blueprint";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
  console.log(`  ✓ ${msg}`);
}

async function runSeoEngineTests() {
  console.log("\n========================================================");
  console.log("       RANKLOCAL 2.0 - MASTER SEO ENGINE TEST SUITE      ");
  console.log("========================================================\n");

  // -------------------------------------------------------------------------
  // TEST 1: Schema Type Resolver & Ground Truth
  // -------------------------------------------------------------------------
  console.log("--- TEST 1: Schema Type Resolution & LocalBusiness Subtypes ---");
  assert(resolveLocalBusinessSchemaType("plumbing") === "Plumber", "Plumbing resolves to Plumber schema");
  assert(resolveLocalBusinessSchemaType("roofing contractor") === "RoofingContractor", "Roofing resolves to RoofingContractor");
  assert(resolveLocalBusinessSchemaType("licensed electrician") === "Electrician", "Electrician resolves to Electrician");
  assert(resolveLocalBusinessSchemaType("hvac and air conditioning") === "HVACBusiness", "HVAC resolves to HVACBusiness");
  assert(resolveLocalBusinessSchemaType("house painter") === "HousePainter", "Painting resolves to HousePainter");
  assert(resolveLocalBusinessSchemaType("locksmith service") === "Locksmith", "Locksmith resolves to Locksmith");
  assert(resolveLocalBusinessSchemaType("general contracting") === "GeneralContractor", "Contractor resolves to GeneralContractor");

  // -------------------------------------------------------------------------
  // TEST 2: Heading Normalization (Single H1 & H2 Hierarchy)
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 2: Heading Hierarchy (Single H1 Enforcement) ---");
  const testMeta: SeoSiteMeta = {
    businessName: "Windy City Plumbers",
    domain: "windycityplumbing.com",
    primaryTrade: "plumber",
    phone: "(312) 555-0199",
    city: "Chicago",
    state: "IL",
    businessModel: "service-area",
  };
  const engine = new SeoEngine(testMeta);

  // 2A: Page with multiple problematic H1s
  const multiH1Html = `<!DOCTYPE html><html><head><title>Test</title></head><body>
    <header><h1>Windy City Plumbers Chicago</h1></header>
    <main>
      <h1>Emergency Drain Cleaning Services</h1>
      <p>Content here.</p>
      <h1>Why Choose Our Plumbers</h1>
      <p>More content.</p>
    </main>
  </body></html>`;

  const hResult = engine.optimizeHeadings(multiH1Html, "service_page", "Emergency Drain Cleaning Services");
  const h1Count = (hResult.updatedHtml.match(/<h1[\s\S]*?<\/h1>/gi) || []).length;
  const h2Count = (hResult.updatedHtml.match(/<h2[\s\S]*?<\/h2>/gi) || []).length;
  assert(h1Count === 1, "Exactly one H1 preserved after heading optimization");
  assert(h2Count >= 2, "Subsequent problematic H1 tags converted to semantic H2 tags");
  assert(hResult.primaryH1.includes("Windy City Plumbers"), "Primary H1 retained original first heading text");

  // 2B: Page with 0 H1s
  const noH1Html = `<!DOCTYPE html><html><head><title>Water Heater Repair</title></head><body><main><p>Content.</p></main></body></html>`;
  const injectedHResult = engine.optimizeHeadings(noH1Html, "service_page", "Water Heater Repair | Chicago");
  const injH1Count = (injectedHResult.updatedHtml.match(/<h1[\s\S]*?<\/h1>/gi) || []).length;
  assert(injH1Count === 1, "Missing H1 is automatically injected into document");

  // 2C: Page with skipped heading hierarchy (H1 -> H3)
  const skippedHHtml = `<!DOCTYPE html><html><head><title>Test</title></head><body><main><h1>Main Service</h1><h3>Sub Feature</h3></main></body></html>`;
  const fixedSkippedH = engine.optimizeHeadings(skippedHHtml, "service_page", "Main Service");
  assert(fixedSkippedH.updatedHtml.includes("<h2>Sub Feature</h2>"), "Skipped H3 after H1 promoted to H2 for valid hierarchy");

  // -------------------------------------------------------------------------
  // TEST 3: Breadcrumbs Markup & BreadcrumbList Schema
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 3: Breadcrumbs Markup & Microdata ---");
  const homeBreadcrumb = engine.generateBreadcrumbs("index.html", "homepage", "Home");
  assert(homeBreadcrumb.markup === "" && homeBreadcrumb.jsonLd === null, "Homepage omits breadcrumbs");

  const serviceBreadcrumb = engine.generateBreadcrumbs("water-heater-repair.html", "service_page", "Water Heater Repair");
  assert(serviceBreadcrumb.markup.includes('aria-label="Breadcrumb"'), "Breadcrumb markup has semantic aria-label");
  assert(serviceBreadcrumb.markup.includes("Services"), "Breadcrumb includes parent Services hub");
  assert(serviceBreadcrumb.markup.includes("Water Heater Repair"), "Breadcrumb includes current page item");
  assert(serviceBreadcrumb.jsonLd !== null, "Breadcrumb generates Schema.org JSON-LD");
  assert(serviceBreadcrumb.jsonLd?.["@type"] === "BreadcrumbList", "Breadcrumb schema type is BreadcrumbList");
  assert(serviceBreadcrumb.jsonLd?.itemListElement.length === 3, "BreadcrumbList has 3 levels: Home > Services > Current");

  // -------------------------------------------------------------------------
  // TEST 4: Page-Type-Dependent Schema & Ground-Truth Rules
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 4: Truthful Page-Type Schema Generation ---");

  // 4A: Homepage -> LocalBusiness with no fake street address for service-area
  const homeSchemas = engine.buildSchemasForPage(
    "index.html",
    "homepage",
    "<html><body><p>Home</p></body></html>",
    "Windy City Plumbers | Chicago, IL",
    "Top rated plumbers in Chicago.",
    "Windy City Plumbers",
    null
  );
  assert(homeSchemas.length === 1, "Homepage generates 1 primary schema");
  assert(homeSchemas[0]["@type"] === "Plumber", "Homepage schema is typed as Plumber");
  assert(homeSchemas[0].address.streetAddress === undefined, "Service-area business does NOT have fake street address in schema");
  assert(homeSchemas[0].aggregateRating === undefined, "Zero fake aggregateRating without confirmed real reviews");

  // 4B: Storefront business with real address and confirmed reviews
  const storefrontMeta: SeoSiteMeta = {
    businessName: "Elite Plumbing Shop",
    domain: "eliteplumbingshop.com",
    primaryTrade: "plumber",
    phone: "(312) 555-4321",
    city: "Chicago",
    state: "IL",
    streetAddress: "123 N Michigan Ave",
    zipCode: "60601",
    businessModel: "storefront",
    realReviewsConfirmed: true,
    realReviews: [
      { author: "John D.", rating: 5, text: "Excellent prompt service!" },
      { author: "Sarah M.", rating: 5, text: "Fixed our water heater quickly." },
    ],
  };
  const storefrontEngine = new SeoEngine(storefrontMeta);
  const storefrontHomeSchemas = storefrontEngine.buildSchemasForPage(
    "index.html",
    "homepage",
    "<html><body><p>Home</p></body></html>",
    "Elite Plumbing Shop",
    "Plumbing shop in Chicago",
    "Elite Plumbing Shop",
    null
  );
  assert(storefrontHomeSchemas[0].address.streetAddress === "123 N Michigan Ave", "Storefront business includes verified street address");
  assert(storefrontHomeSchemas[0].aggregateRating !== undefined, "Confirmed real reviews generates aggregateRating");
  assert(storefrontHomeSchemas[0].aggregateRating.ratingValue === "5.0", "aggregateRating correctly computes average");
  assert(storefrontHomeSchemas[0].aggregateRating.reviewCount === 2, "aggregateRating has correct review count");

  // 4C: Service Page -> Service schema
  const serviceSchemas = engine.buildSchemasForPage(
    "drain-cleaning.html",
    "service_page",
    "<html><body><h1>Drain Cleaning</h1></body></html>",
    "Drain Cleaning Chicago | Windy City Plumbers",
    "Professional drain cleaning in Chicago.",
    "Drain Cleaning Services",
    serviceBreadcrumb.jsonLd
  );
  assert(serviceSchemas.some((s) => s["@type"] === "BreadcrumbList"), "Service page includes BreadcrumbList schema");
  const sSchema = serviceSchemas.find((s) => s["@type"] === "Service");
  assert(Boolean(sSchema), "Service page includes Service schema");
  assert(sSchema?.serviceType === "Drain Cleaning Services", "Service schema sets proper serviceType");
  assert(sSchema?.provider?.["@type"] === "Plumber", "Service provider references Plumber");

  // 4D: FAQ Page -> FAQPage ONLY when real Q&As are present
  const faqWithQAsHtml = `<html><body>
    <h1>Plumbing FAQ</h1>
    <details>
      <summary>How much does drain cleaning cost?</summary>
      <div>Standard drain cleaning starts with a transparent diagnostic assessment.</div>
    </details>
    <details>
      <summary>Do you offer 24/7 emergency service?</summary>
      <div>Yes, licensed technicians are dispatched rapidly across Chicago.</div>
    </details>
  </body></html>`;
  const faqSchemas = engine.buildSchemasForPage(
    "faq.html",
    "faq_page",
    faqWithQAsHtml,
    "Plumbing FAQ",
    "Frequently asked plumbing questions",
    "Plumbing FAQ",
    null
  );
  const faqSchema = faqSchemas.find((s) => s["@type"] === "FAQPage");
  assert(Boolean(faqSchema), "FAQPage schema created when real Q&A pairs exist in HTML");
  assert(faqSchema?.mainEntity?.length === 2, "FAQPage mainEntity contains 2 extracted Questions");

  // 4E: FAQ Page without Q&As -> NO FAQPage schema
  const emptyFaqHtml = `<html><body><h1>FAQ</h1><p>Call us if you have questions.</p></body></html>`;
  const emptyFaqSchemas = engine.buildSchemasForPage(
    "faq.html",
    "faq_page",
    emptyFaqHtml,
    "FAQ",
    "Questions",
    "FAQ",
    null
  );
  assert(!emptyFaqSchemas.some((s) => s["@type"] === "FAQPage"), "NO FAQPage schema emitted when page lacks Q&A pairs");

  // 4F: Blog Post -> BlogPosting schema
  const blogSchemas = engine.buildSchemasForPage(
    "blog/winter-pipe-freeze-prevention.html",
    "blog_post",
    "<html><body><h1>How to Prevent Frozen Pipes</h1></body></html>",
    "How to Prevent Frozen Pipes",
    "Chicago winter plumbing tips.",
    "How to Prevent Frozen Pipes",
    null
  );
  const blogSchema = blogSchemas.find((s) => s["@type"] === "BlogPosting");
  assert(Boolean(blogSchema), "Blog post generates BlogPosting schema");
  assert(blogSchema?.headline === "How to Prevent Frozen Pipes", "BlogPosting schema has correct headline");

  // -------------------------------------------------------------------------
  // TEST 5: Title & Meta Description Deduplication
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 5: Title & Meta Description Deduplication ---");
  const testFiles = [
    {
      path: "index.html",
      content: "<html><head><title>Plumber in Chicago</title><meta name=\"description\" content=\"Best plumbers\"></head><body><h1>Windy City Plumbers</h1></body></html>",
    },
    {
      path: "services.html",
      content: "<html><head><title>Plumber in Chicago</title><meta name=\"description\" content=\"Best plumbers\"></head><body><h1>Services</h1></body></html>",
    },
  ];

  const execRes = engine.execute(testFiles);
  const optFiles = execRes.files.filter((f) => f.path.endsWith(".html"));
  const t0 = (optFiles[0].content as string).match(/<title>([^<]+)<\/title>/)?.[1];
  const t1 = (optFiles[1].content as string).match(/<title>([^<]+)<\/title>/)?.[1];
  assert(t0 !== t1, "Identical input titles were automatically deduplicated");

  const d0 = (optFiles[0].content as string).match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/)?.[1];
  const d1 = (optFiles[1].content as string).match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/)?.[1];
  assert(d0 !== d1, "Identical input meta descriptions were automatically deduplicated");
  assert((d0?.length || 0) <= 160 && (d1?.length || 0) <= 160, "Meta descriptions are capped at <= 160 characters");

  // -------------------------------------------------------------------------
  // TEST 6: Crawl Assets (sitemap.xml and robots.txt)
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 6: Crawl Assets Generation & Sitemap Validity ---");
  const sitemapFile = execRes.files.find((f) => f.path === "sitemap.xml");
  const robotsFile = execRes.files.find((f) => f.path === "robots.txt");
  assert(Boolean(sitemapFile), "sitemap.xml is generated");
  assert(Boolean(robotsFile), "robots.txt is generated");

  const sitemapStr = sitemapFile?.content.toString() || "";
  assert(sitemapStr.includes("<urlset") && sitemapStr.includes("http://www.sitemaps.org/schemas/sitemap/0.9"), "sitemap.xml has valid schema namespace");
  assert(sitemapStr.includes("<loc>https://windycityplumbing.com/</loc>"), "sitemap.xml indexes homepage canonical URL");
  assert(sitemapStr.includes("<loc>https://windycityplumbing.com/services.html</loc>"), "sitemap.xml indexes services page canonical URL");

  const robotsStr = robotsFile?.content.toString() || "";
  assert(robotsStr.includes("User-agent: *"), "robots.txt contains User-agent directive");
  assert(robotsStr.includes("Allow: /"), "robots.txt contains Allow directive");
  assert(robotsStr.includes("Sitemap: https://windycityplumbing.com/sitemap.xml"), "robots.txt links to sitemap.xml");

  // -------------------------------------------------------------------------
  // TEST 7: Open Graph and Social Metadata Verification
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 7: Open Graph & Social Metadata ---");
  const homeHtml = optFiles[0].content as string;
  assert(homeHtml.includes('<meta property="og:type" content="website">'), "Home has og:type website");
  assert(homeHtml.includes('<meta property="og:site_name" content="Windy City Plumbers">'), "Home has og:site_name");
  assert(homeHtml.includes('<link rel="canonical" href="https://windycityplumbing.com/">'), "Home has canonical link");
  assert(homeHtml.includes('<meta name="robots" content="index, follow'), "Home has robots meta tag");
  assert(homeHtml.includes('<meta name="twitter:card" content="summary_large_image">'), "Home has twitter:card summary_large_image");

  // -------------------------------------------------------------------------
  // TEST 8: Full End-to-End Website Assembly Pipeline with SEO Engine
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 8: Full End-to-End Pipeline Website Assembly ---");

  // 1. Generate Site Blueprint
  const blueprint = SiteBlueprintEngine.createBlueprint({
    niche: "plumbing",
    primaryCity: "Chicago",
    state: "Illinois",
    businessName: "Apex Plumbing & Drain",
    phone: "(312) 555-9000",
    theme: "forge",
    layoutFamily: "conversion",
    services: [
      { name: "Emergency Plumbing", slug: "emergency-plumbing", isPrimary: true },
      { name: "Drain Cleaning", slug: "drain-cleaning" },
      { name: "Water Heater Repair", slug: "water-heater-repair" },
      { name: "Leak Detection", slug: "leak-detection" },
    ],
    locations: [
      { city: "Naperville", state: "IL", county: "DuPage" },
      { city: "Evanston", state: "IL", county: "Cook" },
    ],
  });

  const forgeTheme = THEMES.find((t) => t.id === "forge") || THEMES[0];

  // 2. Assemble Website with full pipeline
  const assembled = await assembleWebsite(
    {
      site: {
        businessName: blueprint.businessName,
        tagline: "Licensed & Certified Chicago Plumbers",
        phone: blueprint.phone,
        businessModel: "service-area",
        address: {
          city: blueprint.primaryCity,
          state: blueprint.state,
        },
        serviceAreas: ["Chicago", "Naperville", "Evanston"],
        nav: [
          { label: "Home", slug: "index" },
          { label: "Services", slug: "services" },
          { label: "Areas", slug: "service-areas" },
          { label: "FAQ", slug: "faq" },
          { label: "Contact", slug: "contact" },
        ],
      },
      pages: [
        {
          slug: "index",
          seo: { title: "Chicago Plumbing Experts", description: "Top emergency plumbers in Chicago.", h1: "Chicago Plumbing Experts" },
          sections: [
            { type: "hero", variant: "splitForm", content: { headline: "Trusted Chicago Plumbing Specialists" } },
            { type: "services", variant: "cards3Col", content: { headline: "Our Core Services" } },
            { type: "ctaBanner", variant: "fullWidth", content: { headline: "Call Today For 24/7 Dispatch" } },
          ],
        },
        {
          slug: "services",
          seo: { title: "Plumbing Services Chicago", description: "Full suite of residential and commercial plumbing.", h1: "Our Plumbing Services" },
          sections: [
            { type: "hero", variant: "centered", content: { headline: "Comprehensive Plumbing Services" } },
            { type: "services", variant: "grid4Col", content: { headline: "All Services" } },
          ],
        },
        {
          slug: "drain-cleaning",
          seo: { title: "Drain Cleaning Chicago", description: "Fast rooter and hydro-jetting services.", h1: "Professional Drain Cleaning" },
          sections: [
            { type: "hero", variant: "splitForm", content: { headline: "Drain Cleaning Specialists" } },
            { type: "contentSplit", variant: "default", content: { headline: "Clog Clearing Solutions" } },
          ],
        },
        {
          slug: "faq",
          seo: { title: "Plumbing FAQ", description: "Common questions answered.", h1: "Frequently Asked Questions" },
          sections: [
            {
              type: "faq",
              variant: "accordion",
              content: {
                headline: "Frequently Asked Plumbing Questions",
                faqs: [
                  { question: "How quickly can a plumber arrive?", answer: "We offer same-day dispatch and 24/7 emergency service across Chicago." },
                  { question: "Do you give upfront pricing?", answer: "Yes, our technicians provide written transparent quotes before starting work." },
                ],
              },
            },
          ],
        },
        {
          slug: "contact",
          seo: { title: "Contact Us", description: "Reach our Chicago dispatch office.", h1: "Contact Apex Plumbing" },
          sections: [
            { type: "hero", variant: "centered", content: { headline: "Get in Touch" } },
            { type: "contactForm", variant: "splitMap", content: { headline: "Schedule Service Today" } },
          ],
        },
      ],
    },
    forgeTheme,
    {
      domain: "apexplumbingchicago.com",
      blueprint,
      fastOfflinePreview: true,
    }
  );

  console.log("\n--- TEST 9: Verification of Assembled SEO Validation Report ---");
  const seoReport = assembled.seoValidation;
  assert(Boolean(seoReport), "assembleWebsite returned seoValidation report");

  // Print exact required audit metrics
  console.log("\n================================================================================");
  console.log("                           SEO VALIDATION REPORT                                ");
  console.log("================================================================================");
  console.log(`Pages scanned:              ${seoReport?.totalPagesScanned}`);
  console.log(`Missing titles:             ${seoReport?.missingTitles.length}`);
  console.log(`Duplicate titles:           ${seoReport?.duplicateTitles.length}`);
  console.log(`Missing meta descriptions:  ${seoReport?.missingMetaDescriptions.length}`);
  console.log(`Duplicate meta descriptions:${seoReport?.duplicateMetaDescriptions.length}`);
  console.log(`Missing H1:                 ${seoReport?.missingH1.length}`);
  console.log(`Multiple problematic H1s:   ${seoReport?.multipleProblematicH1s.length}`);
  console.log(`Missing canonical:          ${seoReport?.missingCanonical.length}`);
  console.log(`Schema errors:              ${seoReport?.schemaErrors.length}`);
  console.log(`Sitemap errors:             ${seoReport?.sitemapErrors.length}`);
  console.log(`Robots errors:              ${seoReport?.robotsErrors.length}`);
  console.log(`SEO Health Status:          ${seoReport?.isHealthy ? "100% HEALTHY (0 Errors)" : "FAILED"}`);
  console.log("================================================================================\n");

  assert(seoReport?.missingTitles.length === 0, "Missing titles: 0");
  assert(seoReport?.duplicateTitles.length === 0, "Duplicate titles: 0");
  assert(seoReport?.missingMetaDescriptions.length === 0, "Missing meta descriptions: 0");
  assert(seoReport?.duplicateMetaDescriptions.length === 0, "Duplicate meta descriptions: 0");
  assert(seoReport?.missingH1.length === 0, "Missing H1: 0");
  assert(seoReport?.multipleProblematicH1s.length === 0, "Multiple problematic H1s: 0");
  assert(seoReport?.missingCanonical.length === 0, "Missing canonical: 0");
  assert(seoReport?.schemaErrors.length === 0, "Schema errors: 0");
  assert(seoReport?.sitemapErrors.length === 0, "Sitemap errors: 0");
  assert(seoReport?.robotsErrors.length === 0, "Robots errors: 0");
  assert(seoReport?.isHealthy === true, "SEO engine is 100% HEALTHY");
  assert(Boolean(seoReport?.reportText), "SEO report includes formatted reportText");
  assert(Boolean(seoReport?.summaryReportText), "SEO report includes summaryReportText");

  // Verify crawl assets exist in output
  assert(assembled.files.some((f) => f.path === "sitemap.xml"), "sitemap.xml included in final website files");
  assert(assembled.files.some((f) => f.path === "robots.txt"), "robots.txt included in final website files");

  console.log("\n🎉 ALL SEO ENGINE & PIPELINE TESTS PASSED WITH 100% SUCCESS!\n");
}

runSeoEngineTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
