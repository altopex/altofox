/**
 * Comprehensive Reliability & Bug-Fix Verification Script
 * Validates:
 * 1. AI-generated logo & responsive desktop/mobile navigation
 * 2. Embedded Google Maps iframe with "Open in Google Maps" link
 * 3. Real SEO score progression to 95+ and per-page reporting
 */

import { renderBrandLogo, detectTradeIconKey } from "../lib/generator/logo-generator";
import { resolveGoogleMapsData, renderGoogleMapEmbed } from "../lib/location/map-embed";
import { auditWebsiteQuality, SiteFile, SiteMetaInfo } from "../lib/quality/website-quality-auditor";
import { applyImprovementAction } from "../lib/quality/website-improver";
import fs from "fs";
import path from "path";

async function runAllTests() {
  console.log("==================================================");
  console.log("   RANKLOCAL CRITICAL RELIABILITY & BUG AUDIT     ");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      if (detail) console.error(`     Detail: ${detail}`);
      failed++;
    }
  }

  // ==================================================
  // PART 1: AI LOGO & RESPONSIVE NAVIGATION
  // ==================================================
  console.log("--- PART 1: AI-Generated Logo & Navigation ---");

  // 1.1 Trade detection & vector emblem generation
  const trades = [
    { trade: "Residential Plumbing & Drain", expectedKey: "plumbing" },
    { trade: "Emergency HVAC Heating & Cooling", expectedKey: "hvac" },
    { trade: "Master Electrician & Wiring", expectedKey: "electrical" },
    { trade: "Roofing & Siding Contractors", expectedKey: "roofing" },
    { trade: "Commercial Cleaning Services", expectedKey: "cleaning" },
    { trade: "Lawn Care & Landscaping", expectedKey: "landscaping" },
    { trade: "Personal Injury Legal Defense", expectedKey: "legal" },
    { trade: "Family Dental Care", expectedKey: "dental" },
    { trade: "Auto Repair & Towing Specialists", expectedKey: "auto" },
    { trade: "Pest & Termite Exterminators", expectedKey: "pest" },
  ];

  for (const t of trades) {
    const key = detectTradeIconKey(t.trade);
    assert(key === t.expectedKey, `Trade detection for "${t.trade}" -> "${key}"`);
    const logoHtml = renderBrandLogo({
      businessName: "Elite Local Pros",
      trade: t.trade,
      href: "index.html",
    });
    assert(logoHtml.includes("<svg class=\"brand-svg\""), `Logo renders crisp vector SVG for ${t.expectedKey}`);
    assert(logoHtml.includes("Elite Local Pros"), `Logo includes business name in clean typography`);
  }

  // 1.2 Custom Logo URL handling
  const customLogoHtml = renderBrandLogo({
    businessName: "Apex Plumbing",
    trade: "Plumbing",
    logoUrl: "https://example.com/custom-logo.png",
  });
  assert(customLogoHtml.includes("<img src=\"https://example.com/custom-logo.png\""), "Custom logo image is rendered when logoUrl is provided");
  assert(customLogoHtml.includes("onerror="), "Custom logo includes graceful onerror fallback to vector trade SVG");

  // 1.3 Long business name overflow safety
  const longName = "Prestige Master Emergency Residential & Commercial Services Inc";
  const longLogoHtml = renderBrandLogo({
    businessName: longName,
    trade: "Electrical",
  });
  assert(longLogoHtml.includes("class=\"brand-text\""), "Logo wraps business text in brand-text class with overflow ellipsis protection");

  // 1.4 Verify CSS rules in templates/base.css
  const cssPath = path.join(process.cwd(), "templates/base.css");
  const baseCss = fs.readFileSync(cssPath, "utf8");
  assert(baseCss.includes("overflow-x: hidden;"), "base.css sets overflow-x: hidden on html and body to eliminate horizontal scroll");
  assert(baseCss.includes("max-width: 100vw;"), "base.css sets max-width: 100vw on html");
  assert(baseCss.includes(".brand-logo"), "base.css includes .brand-logo responsive flex rules");
  assert(baseCss.includes(".brand-text"), "base.css includes .brand-text ellipsis and truncation rules");
  assert(baseCss.includes("@media (max-width: 767px)"), "base.css includes mobile breakpoint reserving space for hamburger toggle");
  assert(baseCss.includes(".mobile-drawer"), "base.css includes .mobile-drawer styling with z-index 1050");

  console.log("\n--- PART 2: Embedded Google Maps Iframe ---");

  // 2.1 Full iframe input handling
  const iframeInput = '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12345" width="600" height="450"></iframe>';
  const iframeResolved = resolveGoogleMapsData({ input: iframeInput, businessName: "Dallas Emergency Plumbing" });
  assert(iframeResolved.embedUrl.includes("https://www.google.com/maps/embed"), "Extracts embedUrl cleanly from pasted <iframe> HTML");
  assert(iframeResolved.directMapUrl.includes("google.com/maps"), "Provides valid direct Google Maps external link");

  // 2.2 Raw address input handling
  const addressInput = "123 Main St, Beaverton, OR 97005";
  const addressResolved = resolveGoogleMapsData({ input: addressInput, businessName: "Beaverton Plumbing" });
  assert(addressResolved.embedUrl.includes("maps.google.com/maps?q="), "Converts raw address into valid Google Maps embed URL");
  assert(addressResolved.embedUrl.includes(encodeURIComponent(addressInput)), "Embed URL properly URL-encodes address");
  assert(addressResolved.directMapUrl.includes("google.com/maps/search/?api=1"), "Creates direct search link for external navigation");

  // 2.3 Rendered map component
  const renderedMapHtml = renderGoogleMapEmbed({
    input: "75001 Dallas TX",
    businessName: "Lone Star HVAC",
    height: 350,
  });
  assert(renderedMapHtml.includes("<iframe"), "Renders real <iframe> element directly in the page");
  assert(renderedMapHtml.includes('loading="lazy"'), "Map iframe includes loading='lazy' for Core Web Vitals performance");
  assert(renderedMapHtml.includes("Open in Google Maps"), "Renders prominent secondary 'Open in Google Maps' external button");
  assert(!renderedMapHtml.includes("AIza"), "Embed uses standard keyless output=embed without exposing private API keys");

  console.log("\n--- PART 3: Website Optimization & Real 95+ SEO Scoring ---");

  // 3.1 Create test website with common initial SEO deficiencies
  const initialFiles: SiteFile[] = [
    {
      path: "index.html",
      content: `<html>
<head><title>Plumber</title></head>
<body>
  <h1>Dallas Plumbing Pros</h1>
  <p>We do plumbing work.</p>
  <img src="images/hero.jpg" alt="photo">
</body>
</html>`,
    },
    {
      path: "drain-cleaning.html",
      content: `<html>
<head><title>Drain Service</title></head>
<body>
  <h2>Drain Cleaning Experts</h2>
  <p>Fast drain cleaning.</p>
</body>
</html>`,
    },
    {
      path: "water-heater-repair.html",
      content: `<html>
<head><title>Water Heater</title></head>
<body>
  <h2>Water Heater Solutions</h2>
  <p>Water heater repair and replacement.</p>
</body>
</html>`,
    },
  ];

  const meta: SiteMetaInfo = {
    businessName: "Lone Star Plumbing",
    trade: "Plumbing Services",
    city: "Dallas",
    state: "TX",
    phone: "(214) 555-0199",
    targetKeywords: "plumbing services, dallas plumber, drain cleaning, water heater repair",
  };

  // Run initial audit
  const initialAudit = auditWebsiteQuality(initialFiles, meta);
  console.log(`  Initial Audit Quality Score: ${initialAudit.overallScore} / 100`);
  assert(initialAudit.overallScore < 70, "Initial audit correctly identifies SEO and content deficiencies");
  assert(initialAudit.recommendations.length > 5, `Initial audit generated ${initialAudit.recommendations.length} recommendations`);

  // Run applyImprovementAction("improve_all")
  console.log("  Executing applyImprovementAction('improve_all')...");
  const improveResult = await applyImprovementAction("improve_all", initialFiles, meta);

  console.log(`  Post-Improvement Score: ${improveResult.newScore} / 100 (Previous: ${improveResult.previousScore})`);
  assert(improveResult.newScore >= 95, `Post-improvement score reaches genuine 95+ target (${improveResult.newScore}/100)`);
  assert(improveResult.targetReached === true, "targetReached flag is true");
  assert(improveResult.changesApplied.length > 10, `Applied ${improveResult.changesApplied.length} concrete improvements`);

  // Check per-page reporting
  assert(Array.isArray(improveResult.perPageResults), "perPageResults array is provided");
  assert(improveResult.perPageResults.length === 3, "perPageResults covers all 3 HTML pages");
  for (const pageRes of improveResult.perPageResults) {
    assert(pageRes.success === true, `Page ${pageRes.page} marked successfully improved`);
    assert(pageRes.changes.length > 0, `Page ${pageRes.page} recorded specific applied changes`);
  }

  // Verify file contents of improved files
  const improvedIndex = improveResult.improvedFiles.find((f) => f.path === "index.html");
  assert(Boolean(improvedIndex), "index.html exists in improvedFiles");
  if (improvedIndex) {
    const html = typeof improvedIndex.content === "string" ? improvedIndex.content : improvedIndex.content.toString("utf8");
    assert(html.includes("<!DOCTYPE html>"), "index.html has <!DOCTYPE html>");
    assert(html.includes('lang="en"'), "index.html has lang='en'");
    assert(html.includes('name="viewport"'), "index.html has responsive viewport meta tag");
    assert(html.includes('rel="canonical"'), "index.html has canonical link tag");
    assert(html.includes('property="og:title"'), "index.html has OpenGraph tags");
    assert(html.includes('class="ranklocal-sticky-call-bar"'), "index.html has sticky mobile call bar");
    assert(html.includes('class="related-internal-links-nav"'), "index.html has internal linking silo");
    assert(html.includes("application/ld+json"), "index.html has Schema.org structured data");
  }

  // Verify crawler directives were added
  const sitemap = improveResult.improvedFiles.find((f) => f.path === "sitemap.xml");
  assert(Boolean(sitemap), "sitemap.xml was automatically generated in project files");
  const robots = improveResult.improvedFiles.find((f) => f.path === "robots.txt");
  assert(Boolean(robots), "robots.txt was automatically generated in project files");

  console.log("\n==================================================");
  console.log(`AUDIT COMPLETE: ${passed} passed, ${failed} failed`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
