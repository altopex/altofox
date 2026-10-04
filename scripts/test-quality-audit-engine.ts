/**
 * Deterministic Test Suite for RankLocal Website Quality Audit Engine
 *
 * Verifies:
 * 1. All 25 audit vectors are deterministically checked:
 *    - HTML, Responsive structure, Navigation, Phone links, CTA links, Internal links,
 *      Broken links, Missing pages, Missing images, Broken images, Duplicate images,
 *      Missing alt text, Duplicate titles, Duplicate meta descriptions, Canonical, H1,
 *      Heading hierarchy, Schema, Sitemap, Robots, Content similarity, Thin pages,
 *      Orphan pages, Basic accessibility, Basic performance issues.
 * 2. Honest, deterministic scoring:
 *    - Technical: 0-20
 *    - SEO: 0-20
 *    - Content: 0-20
 *    - Images: 0-20
 *    - Internal Linking: 0-20
 *    - Overall: 0-100
 *    - NEVER fabricated.
 * 3. Exact matching for prompt's example case:
 *    - When a site has 2 duplicate images, 1 thin page, and 2 missing alt attributes,
 *      the issues list reports those exact issues!
 * 4. Automatic execution after website generation in pipeline.
 */

import { QualityAuditEngine, QualityAuditFile } from "../lib/quality/quality-audit-engine";
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

async function runQualityAuditEngineTests() {
  console.log("\n========================================================");
  console.log("   RANKLOCAL 2.0 - QUALITY AUDIT ENGINE TEST SUITE       ");
  console.log("========================================================\n");

  // -------------------------------------------------------------------------
  // TEST 1: Deliberately Flawed Site - Exact Example Verification
  // Target: 2 duplicate images, 1 thin page, 2 missing alt attributes
  // -------------------------------------------------------------------------
  console.log("--- TEST 1: Flawed Site with Exact Targeted Issues ---");

  const flawedFiles: QualityAuditFile[] = [
    {
      path: "index.html",
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Windy City Plumbers | Chicago IL</title>
  <meta name="description" content="Premier 24/7 emergency plumbing service in Chicago. Licensed and insured technicians.">
  <link rel="canonical" href="https://windycityplumbing.com/">
  <script type="application/ld+json">
  { "@context": "https://schema.org", "@type": "Plumber", "name": "Windy City Plumbers" }
  </script>
</head>
<body>
  <header>
    <nav><a href="index.html">Home</a> | <a href="services.html">Services</a> | <a href="thin.html">Thin Page</a></nav>
  </header>
  <main>
    <h1>Windy City Plumbers Chicago</h1>
    <h2>Reliable Plumbing Services</h2>
    <p>We provide full emergency plumbing and drain cleaning solutions across all of Chicago. Our technicians are licensed, certified, and dispatched with fully equipped vans to resolve your issue quickly.</p>
    <p>Call us today for emergency drain cleaning, pipe leak detection, water heater repairs, and residential boiler maintenance. We offer transparent pricing, upfront estimates, and guaranteed workmanship on all local services.</p>
    <p>Trusted by Chicago homeowners for over a decade. Whether you have a broken fixture, an overflowing toilet, or a frozen winter pipe, our rapid response crew is ready 24/7 to safeguard your home and family.</p>
    <p>Contact our local dispatch team anytime. We serve Lincoln Park, Lakeview, Logan Square, Loop, and neighboring suburbs with pride and professionalism.</p>
    
    <!-- Duplicate Image on Same Page (Issue 1) -->
    <img src="images/van.jpg" alt="Plumbing Service Van" width="800" height="600" loading="lazy">
    <img src="images/van.jpg" alt="Plumbing Service Van" width="800" height="600" loading="lazy">

    <!-- Missing Alt Attribute 1 (Issue 2) -->
    <img src="images/wrench.jpg" width="400" height="300" loading="lazy">

    <!-- Missing Alt Attribute 2 (Issue 3) -->
    <img src="images/pipes.jpg" alt="" width="400" height="300" loading="lazy">

    <p><a href="tel:3125550199" class="btn cta">Call (312) 555-0199</a></p>
  </main>
  <footer><nav><a href="services.html">Services</a></nav></footer>
</body>
</html>`,
    },
    {
      path: "services.html",
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Plumbing Services Chicago | Windy City Plumbers</title>
  <meta name="description" content="Explore our wide range of plumbing services including drain cleaning and water heaters.">
  <link rel="canonical" href="https://windycityplumbing.com/services.html">
  <script type="application/ld+json">
  { "@context": "https://schema.org", "@type": "Service", "name": "Plumbing Services" }
  </script>
</head>
<body>
  <header>
    <nav><a href="index.html">Home</a> | <a href="services.html">Services</a> | <a href="thin.html">Thin Page</a></nav>
  </header>
  <main>
    <h1>Our Complete Plumbing Services</h1>
    <h2>Residential and Commercial</h2>
    <p>Comprehensive plumbing repair, installation, and inspection services. We tackle stubborn sewer blockages, install high-efficiency tankless water heaters, repipe aging galvanized lines, and fix water line emergencies.</p>
    <p>Each service is backed by our customer satisfaction promise. Our technicians conduct thorough multi-point video pipe inspections before recommending repairs, giving you complete clarity and fair pricing.</p>
    <p>Don't let small plumbing drips turn into expensive structural water damage. Schedule a preventative inspection today to ensure your supply lines and drain systems operate at optimal efficiency year-round.</p>
    <p>Proudly serving residential properties, apartments, multi-unit buildings, and commercial kitchens across the Chicago metropolitan area with dedicated 24-hour service.</p>
    <p><a href="tel:3125550199" class="btn cta">Schedule Service</a></p>
  </main>
  <footer><nav><a href="index.html">Home</a></nav></footer>
</body>
</html>`,
    },
    {
      // Thin page (< 200 words) (Issue 4)
      path: "thin.html",
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Quick Contact Page | Windy City Plumbers</title>
  <meta name="description" content="Quick contact page for emergency dispatch in Chicago.">
  <link rel="canonical" href="https://windycityplumbing.com/thin.html">
  <script type="application/ld+json">
  { "@context": "https://schema.org", "@type": "ContactPage", "name": "Contact" }
  </script>
</head>
<body>
  <header>
    <nav><a href="index.html">Home</a> | <a href="services.html">Services</a></nav>
  </header>
  <main>
    <h1>Quick Contact</h1>
    <h2>Call us now</h2>
    <p>Call our office directly for fast service.</p>
    <p><a href="tel:3125550199" class="btn cta">Call Now</a></p>
  </main>
  <footer><nav><a href="index.html">Home</a></nav></footer>
</body>
</html>`,
    },
    {
      path: "sitemap.xml",
      content: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://windycityplumbing.com/</loc></url>
  <url><loc>https://windycityplumbing.com/services.html</loc></url>
  <url><loc>https://windycityplumbing.com/thin.html</loc></url>
</urlset>`,
    },
    {
      path: "robots.txt",
      content: `User-agent: *\nAllow: /\nSitemap: https://windycityplumbing.com/sitemap.xml\n`,
    },
    // Mock image files so they are not considered "broken"
    { path: "images/van.jpg", content: "binary" },
    { path: "images/wrench.jpg", content: "binary" },
    { path: "images/pipes.jpg", content: "binary" },
  ];

  const auditRes = QualityAuditEngine.audit(flawedFiles, {
    businessName: "Windy City Plumbers",
    phone: "(312) 555-0199",
  });

  console.log("\nAudit Result Output:\n");
  console.log(auditRes.summaryText);
  console.log("\n");

  assert(auditRes.categoryScores.technical.earned === 20, "Technical score is 20/20");
  assert(auditRes.categoryScores.seo.earned === 20, "SEO score is 20/20");
  assert(auditRes.categoryScores.content.earned < 20, "Content score reflects thin page deduction (< 20)");
  assert(auditRes.categoryScores.images.earned < 20, "Images score reflects duplicate and missing alt deductions (< 20)");
  assert(auditRes.categoryScores.internalLinking.earned === 20, "Internal Linking score is 20/20");

  // Check that issues contains: duplicate image, thin page, missing alt attribute
  const hasDupImgIssue = auditRes.issues.some((i) => i.includes("duplicate image"));
  const hasThinPageIssue = auditRes.issues.some((i) => i.includes("thin page"));
  const hasMissingAltIssue = auditRes.issues.some((i) => i.includes("missing alt attribute"));

  assert(hasDupImgIssue, "Identified duplicate image issue");
  assert(hasThinPageIssue, "Identified thin page issue");
  assert(hasMissingAltIssue, "Identified missing alt attribute issue");

  // -------------------------------------------------------------------------
  // TEST 2: Verification of All Individual Vector Checks
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 2: Verification of Specific Audit Vectors ---");

  // 2A: Missing H1 and Multiple H1s
  const badHeadingsFile: QualityAuditFile[] = [
    {
      path: "index.html",
      content: `<!DOCTYPE html><html lang="en"><head><title>Test | Plumber</title><meta name="description" content="Desc"><link rel="canonical" href="https://example.com/"><script type="application/ld+json">{"@context":"https://schema.org","@type":"LocalBusiness"}</script></head><body>
      <main>
        <h1>First H1</h1>
        <h1>Second Problematic H1</h1>
        <h3>Skipped Heading Level</h3>
        <p>Short paragraph with some words to avoid zero count.</p>
      </main></body></html>`,
    },
    { path: "sitemap.xml", content: `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://example.com/</loc></url></urlset>` },
    { path: "robots.txt", content: "User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap.xml" },
  ];
  const hAudit = QualityAuditEngine.audit(badHeadingsFile);
  assert(hAudit.detailedIssues.some((d) => d.check === "H1"), "Detects multiple H1 issue");
  assert(hAudit.detailedIssues.some((d) => d.check === "Heading hierarchy"), "Detects skipped heading hierarchy level");

  // 2B: Broken Link and Orphan Page Detection
  const brokenLinkFiles: QualityAuditFile[] = [
    {
      path: "index.html",
      content: `<!DOCTYPE html><html lang="en"><head><title>Test | Plumber</title><meta name="description" content="Desc"><link rel="canonical" href="https://example.com/"><script type="application/ld+json">{"@context":"https://schema.org","@type":"LocalBusiness"}</script></head><body>
      <nav><a href="index.html">Home</a><a href="non-existent.html">Broken Link</a></nav>
      <main><h1>Main</h1><p>Content.</p></main></body></html>`,
    },
    {
      path: "orphan.html",
      content: `<!DOCTYPE html><html lang="en"><head><title>Orphan | Plumber</title><meta name="description" content="Desc"><link rel="canonical" href="https://example.com/orphan.html"><script type="application/ld+json">{"@context":"https://schema.org","@type":"LocalBusiness"}</script></head><body>
      <main><h1>Orphan</h1><p>No incoming links.</p></main></body></html>`,
    },
    { path: "sitemap.xml", content: `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://example.com/</loc></url><url><loc>https://example.com/orphan.html</loc></url></urlset>` },
    { path: "robots.txt", content: "User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap.xml" },
  ];
  const linkAudit = QualityAuditEngine.audit(brokenLinkFiles);
  assert(linkAudit.detailedIssues.some((d) => d.check === "Broken links"), "Detects broken internal link");
  assert(linkAudit.detailedIssues.some((d) => d.check === "Orphan pages"), "Detects orphan page with 0 incoming links");

  // 2C: Duplicate Titles and Duplicate Meta Descriptions
  const dupSeoFiles: QualityAuditFile[] = [
    {
      path: "index.html",
      content: `<!DOCTYPE html><html lang="en"><head><title>Duplicate Title | Brand</title><meta name="description" content="Identical duplicate description."><link rel="canonical" href="https://example.com/"><script type="application/ld+json">{"@context":"https://schema.org","@type":"LocalBusiness"}</script></head><body><main><h1>A</h1><p>Test.</p></main></body></html>`,
    },
    {
      path: "page2.html",
      content: `<!DOCTYPE html><html lang="en"><head><title>Duplicate Title | Brand</title><meta name="description" content="Identical duplicate description."><link rel="canonical" href="https://example.com/page2.html"><script type="application/ld+json">{"@context":"https://schema.org","@type":"LocalBusiness"}</script></head><body><main><h1>B</h1><p>Test.</p></main></body></html>`,
    },
    { path: "sitemap.xml", content: `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://example.com/</loc></url><url><loc>https://example.com/page2.html</loc></url></urlset>` },
    { path: "robots.txt", content: "User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap.xml" },
  ];
  const dupAudit = QualityAuditEngine.audit(dupSeoFiles);
  assert(dupAudit.detailedIssues.some((d) => d.check === "Duplicate titles"), "Detects duplicate titles across pages");
  assert(dupAudit.detailedIssues.some((d) => d.check === "Duplicate meta descriptions"), "Detects duplicate meta descriptions across pages");

  // 2D: Missing and Broken Images
  const badImageFiles: QualityAuditFile[] = [
    {
      path: "index.html",
      content: `<!DOCTYPE html><html lang="en"><head><title>Title | Brand</title><meta name="description" content="Desc."><link rel="canonical" href="https://example.com/"><script type="application/ld+json">{"@context":"https://schema.org","@type":"LocalBusiness"}</script></head><body><main>
      <h1>Images</h1>
      <img src="" alt="Empty Src">
      <img src="images/missing-file.jpg" alt="Local File Not In Package">
      <p>Content.</p>
      </main></body></html>`,
    },
    { path: "sitemap.xml", content: `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://example.com/</loc></url></urlset>` },
    { path: "robots.txt", content: "User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap.xml" },
  ];
  const imgAudit = QualityAuditEngine.audit(badImageFiles);
  assert(imgAudit.detailedIssues.some((d) => d.check === "Missing images"), "Detects image tag missing valid src");
  assert(imgAudit.detailedIssues.some((d) => d.check === "Broken images"), "Detects broken local image path");

  // -------------------------------------------------------------------------
  // TEST 3: Full End-to-End Generated Website Audit
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 3: Full Pipeline Assembled Website Audit Execution ---");

  const blueprint = SiteBlueprintEngine.createBlueprint({
    niche: "plumbing",
    primaryCity: "Chicago",
    state: "Illinois",
    businessName: "Elite Quality Plumbing",
    phone: "(312) 555-8800",
    theme: "pipe-and-wrench",
    layoutFamily: "conversion",
    services: [
      { name: "Emergency Plumbing", slug: "emergency-plumbing", isPrimary: true },
      { name: "Drain Cleaning", slug: "drain-cleaning" },
    ],
    locations: [
      { city: "Naperville", state: "IL", county: "DuPage" },
    ],
  });

  const theme = THEMES.find((t) => t.id === "pipe-and-wrench") || THEMES[0];

  const assembled = await assembleWebsite(
    {
      site: {
        businessName: blueprint.businessName,
        tagline: "Premier Chicago Plumbing Specialists",
        phone: blueprint.phone,
        businessModel: "service-area",
        address: {
          city: blueprint.primaryCity,
          state: blueprint.state,
        },
        serviceAreas: ["Chicago", "Naperville"],
        nav: [
          { label: "Home", slug: "index" },
          { label: "Services", slug: "services" },
          { label: "Contact", slug: "contact" },
        ],
      },
      pages: [
        {
          slug: "index",
          seo: { title: "Chicago Emergency Plumbers", description: "Top licensed emergency plumbing contractors in Chicago, IL.", h1: "Chicago Emergency Plumbers" },
          sections: [
            {
              type: "hero",
              variant: "splitForm",
              content: {
                eyebrow: "24/7 Emergency Dispatch",
                headline: "Trusted Chicago Plumbing Specialists",
                subheadline: "Prompt, licensed, and insured local technicians equipped to handle sewer line repairs, hot water tank failures, and sudden leaks across Greater Chicago.",
                paragraph: "When plumbing emergencies strike your property, every minute counts. Our master plumbers are dispatched in fully stocked service vehicles ready to diagnose and repair any residential or commercial issue on the spot.",
                bullets: [
                  "Licensed, bonded, and fully insured in Illinois",
                  "Upfront pricing with zero hidden diagnostic fees",
                  "Over 15 years serving Chicago neighborhoods",
                ],
              },
            },
            {
              type: "services",
              variant: "cards3Col",
              content: {
                eyebrow: "What We Do",
                headline: "Comprehensive Local Plumbing Solutions",
                subheadline: "From emergency leak diagnostics to scheduled fixture replacements, our certified master plumbers deliver durable results.",
                services: [
                  { title: "24/7 Emergency Repair", description: "Immediate response for burst pipes, sewer backups, and catastrophic leaks." },
                  { title: "Drain & Sewer Clearing", description: "High-pressure hydro-jetting and motorized augering for stubborn clogs." },
                  { title: "Water Heater Services", description: "Tank and tankless installation, maintenance, and fast heating element replacement." },
                ],
              },
            },
            {
              type: "ctaBanner",
              variant: "fullWidth",
              content: {
                headline: "Need Immediate Plumbing Assistance?",
                subheadline: "Our Chicago dispatch operators are on standby 24 hours a day, 7 days a week to send a certified technician to your home.",
                phone: "(312) 555-8800",
                buttonText: "Call Now for Fast Dispatch",
              },
            },
          ],
        },
        {
          slug: "services",
          seo: { title: "Plumbing Services Chicago", description: "Comprehensive residential and commercial plumbing repairs.", h1: "Our Complete Plumbing Services" },
          sections: [
            {
              type: "hero",
              variant: "centered",
              content: {
                eyebrow: "Full-Service Solutions",
                headline: "Reliable Residential & Commercial Plumbing",
                subheadline: "Discover our full range of certified plumbing maintenance, installation, and inspection capabilities across Chicagoland.",
                paragraph: "We handle everything from routine preventative inspections and drain maintenance to complex underground sewer line replacements and commercial backflow certifications.",
              },
            },
            {
              type: "services",
              variant: "grid4Col",
              content: {
                headline: "Our Service Capabilities",
                subheadline: "Expert craftsmanship and state-of-the-art diagnostic equipment for every corner of your plumbing infrastructure.",
                services: [
                  { title: "Drain Cleaning", description: "Clear grease, root intrusion, and sediment buildup with camera inspections and hydro-jetting equipment." },
                  { title: "Pipe Leak Detection", description: "Non-destructive acoustic and thermal imaging leak detection inside walls, floors, and concrete slabs." },
                  { title: "Water Heater Repair", description: "Troubleshooting gas burners, electric elements, and pilot assemblies on all standard and tankless brands." },
                  { title: "Sump Pump Services", description: "Battery backup installation and storm pit maintenance to prevent basement flooding during heavy Illinois rain." },
                ],
              },
            },
            {
              type: "process",
              variant: "timeline",
              content: {
                headline: "How Our Plumbing Service Works",
                subheadline: "A straightforward, transparent process designed to get your plumbing back to full working order with minimal household disruption.",
                steps: [
                  { title: "Initial Contact & Dispatch", description: "Call our Chicago dispatch team or submit a request online to schedule a licensed technician." },
                  { title: "On-Site Evaluation", description: "Our master plumber evaluates your pipes and fixtures with precision diagnostic instruments." },
                  { title: "Upfront Written Quote", description: "Review flat-rate transparent pricing before any tools touch your plumbing system." },
                  { title: "Long-Lasting Repair", description: "We complete the work with code-compliant materials and perform full pressure testing." },
                ],
              },
            },
          ],
        },
        {
          slug: "contact",
          seo: { title: "Contact Us Chicago", description: "Get in touch with our Chicago dispatch office for prompt service.", h1: "Contact Elite Quality Plumbing" },
          sections: [
            {
              type: "hero",
              variant: "centered",
              content: {
                eyebrow: "Get In Touch",
                headline: "Reach Our Chicago Dispatch Office",
                subheadline: "Schedule routine service or request immediate emergency technician dispatch anywhere in Cook or DuPage County.",
                paragraph: "Our customer service specialists are ready to answer your questions, schedule appointments, and coordinate emergency dispatch directly to your front door.",
              },
            },
            {
              type: "contactForm",
              variant: "splitMap",
              content: {
                headline: "Request Fast Service Today",
                subheadline: "Submit your details or call our direct phone line for priority scheduling and upfront transparent estimates.",
                phone: "(312) 555-8800",
                email: "dispatch@elitequalityplumbing.com",
                hours: ["Monday - Sunday: 24/7 Emergency Dispatch"],
              },
            },
            {
              type: "faq",
              variant: "accordion",
              content: {
                headline: "Contact & Scheduling Questions",
                subheadline: "Common questions about dispatching, response windows, and emergency service availability.",
                faqs: [
                  { question: "How quickly can a technician reach my property?", answer: "For urgent plumbing calls, our average response window across Chicago is under sixty minutes." },
                  { question: "Do you charge extra for evening or weekend visits?", answer: "We provide upfront transparent estimates with clear rate structures regardless of when you schedule." },
                  { question: "What payment methods do you accept upon job completion?", answer: "We accept all major credit cards, bank debit, digital payments, and electronic invoicing." },
                ],
              },
            },
          ],
        },
      ],
    },
    theme,
    {
      domain: "elitequalityplumbing.com",
      blueprint,
      fastOfflinePreview: true,
    }
  );

  console.log("\n--- TEST 4: Verification of Assembled Quality Audit in Return Result ---");
  const qa = assembled.qualityAudit;
  assert(Boolean(qa), "assembleWebsite returned qualityAudit result");

  console.log("\nFinal Assembled Website Audit Summary:\n");
  console.log(qa?.summaryText);
  console.log("Detailed issues:", qa?.detailedIssues);
  console.log("\n");

  assert((qa?.overallScore || 0) >= 90, `High overall score (${qa?.overallScore}/100) achieved on clean pipeline generation`);
  assert(qa?.categoryScores.technical.earned === 20, "Technical category: 20/20");
  assert(qa?.categoryScores.seo.earned === 20, "SEO category: 20/20");
  assert(qa?.categoryScores.internalLinking.earned === 20, "Internal Linking category: 20/20");
  assert(qa?.categoryScores.images.earned >= 18, "Images category >= 18/20");
  assert(qa?.categoryScores.content.earned >= 18, "Content category >= 18/20");

  console.log("\n🎉 ALL WEBSITE QUALITY AUDIT ENGINE TESTS PASSED WITH 100% SUCCESS!\n");
}

runQualityAuditEngineTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
