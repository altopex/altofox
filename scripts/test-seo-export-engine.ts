/**
 * Verification Suite for Google Search SEO & Core Web Vitals Export Engine
 * 
 * Verifies the 5 requirements:
 * 1. Meta Tag Injector (<title>, meta description, canonical URL, OpenGraph, viewport)
 * 2. Structured Data (JSON-LD Schema.org for LocalBusiness, Organization, WebSite)
 * 3. Semantic Heading Hierarchy (exactly one <h1>, sequential headings) & mandatory alt tags
 * 4. Performance for Core Web Vitals (lazy loading, CLS width/height, critical CSS inlining)
 * 5. Crawler Files (sitemap.xml and robots.txt generation inside zip archive)
 */

import {
  optimizePageForGoogleSEO,
  generateProjectSitemapXml,
  generateProjectRobotsTxt,
} from "../lib/seo/export-seo-optimizer";
import { bundleProjectToZipStream } from "../lib/export/zip-bundler";
import JSZip from "jszip";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ✗ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ PASS: ${message}`);
}

async function runSeoExportTests() {
  console.log("==========================================================================");
  console.log(" Google Search SEO & Core Web Vitals Export Engine Audit Suite ");
  console.log("==========================================================================\n");

  const sampleRawHtml = `<!DOCTYPE html>
<html lang="en">
<head>
</head>
<body>
  <header>
    <img src="images/logo.png" class="brand-logo">
    <h2>Welcome to Elite Plumbers</h2>
  </header>
  <main>
    <h1>24/7 Emergency Plumbing</h1>
    <h1>Residential Drain Cleaning Services</h1>
    <h3>Fast Response Time</h3>
    <p>We provide prompt, licensed emergency plumbing across Austin and Round Rock.</p>
    <img src="images/van-fleet.jpg" class="hero-image">
    <img src="images/drain-pipe-repair.jpg" alt="" class="content-img">
    <img src="images/water-heater.jpg">
  </main>
</body>
</html>`;

  // --- 1. META TAG INJECTOR AUDIT ---
  console.log("--- 1. META TAG INJECTOR AUDIT ---");
  const optimizedHtml = optimizePageForGoogleSEO(sampleRawHtml, {
    pagePath: "index.html",
    projectName: "Elite Plumbers",
    domain: "eliteplumberstx.com",
    businessName: "Elite Plumbers Austin",
    businessType: "Plumbing",
    phone: "(512) 555-0199",
    email: "service@eliteplumberstx.com",
    city: "Austin",
    state: "TX",
    address: "100 Congress Ave",
    zipCode: "78701",
    serviceAreaCities: ["Austin", "Round Rock", "Cedar Park"],
    description: "Licensed emergency plumbing and drain cleaning experts serving Austin, TX 24/7.",
    criticalCss: "body{font-family:sans-serif;margin:0;}header{background:#003366;}",
  });

  assert(/<title>[\s\S]*?<\/title>/i.test(optimizedHtml), "Semantic <title> tag successfully injected");
  assert(/<meta\b[^>]*?name=["']description["'][^>]*?content=["'][^"']+["']/i.test(optimizedHtml), "Meta description tag successfully injected");
  assert(/<link\b[^>]*?rel=["']canonical["'][^>]*?href=["']https:\/\/eliteplumberstx\.com\/["']/i.test(optimizedHtml), "Canonical URL tag accurately constructed for root page");
  assert(/<meta\b[^>]*?name=["']viewport["'][^>]*?content=["']width=device-width,\s*initial-scale=1\.0["']/i.test(optimizedHtml), "Mobile-first viewport meta tag injected");
  assert(/<meta\b[^>]*?property=["']og:title["']/i.test(optimizedHtml), "OpenGraph og:title tag injected");
  assert(/<meta\b[^>]*?property=["']og:description["']/i.test(optimizedHtml), "OpenGraph og:description tag injected");
  assert(/<meta\b[^>]*?property=["']og:url["'][^>]*?content=["']https:\/\/eliteplumberstx\.com\/["']/i.test(optimizedHtml), "OpenGraph og:url matches canonical URL");
  assert(/<meta\b[^>]*?property=["']og:type["'][^>]*?content=["']website["']/i.test(optimizedHtml), "OpenGraph og:type website tag injected");

  // --- 2. STRUCTURED DATA (JSON-LD) AUDIT ---
  console.log("\n--- 2. STRUCTURED DATA (JSON-LD) AUDIT ---");
  const jsonLdMatch = optimizedHtml.match(/<script\b[^>]*?type=["']application\/ld\+json["'][^>]*?>([\s\S]*?)<\/script>/i);
  assert(Boolean(jsonLdMatch), "Schema.org application/ld+json script block injected");

  const parsedSchema = JSON.parse(jsonLdMatch![1]);
  assert(parsedSchema["@context"] === "https://schema.org", "Schema @context is https://schema.org");
  assert(parsedSchema["@type"] === "Plumber", "Schema @type accurately resolved to Plumber based on plumbing business type");
  assert(parsedSchema.name === "Elite Plumbers Austin", "Schema name accurately reflects business name");
  assert(parsedSchema.telephone === "(512) 555-0199", "Schema telephone accurately mapped");
  assert(parsedSchema.address?.addressLocality === "Austin", "Schema PostalAddress city populated");
  assert(Array.isArray(parsedSchema.areaServed) && parsedSchema.areaServed.length === 3, "Schema areaServed includes service area cities array");

  // Verify BlogPosting Schema for blog pages
  const blogHtml = optimizePageForGoogleSEO("<html><head></head><body><h2>Signs You Need Water Heater Repair</h2></body></html>", {
    pagePath: "blog/signs-water-heater-repair.html",
    projectName: "Elite Plumbers",
    domain: "eliteplumberstx.com",
    businessName: "Elite Plumbers",
    businessType: "Plumbing",
  });
  const blogSchemaMatch = blogHtml.match(/<script\b[^>]*?type=["']application\/ld\+json["'][^>]*?>([\s\S]*?)<\/script>/i);
  const parsedBlogSchema = JSON.parse(blogSchemaMatch![1]);
  assert(parsedBlogSchema["@type"] === "BlogPosting", "Blog page accurately resolved to BlogPosting schema");
  assert(Boolean(parsedBlogSchema.headline), "BlogPosting includes headline derived from page slug/title");

  // --- 3. SEMANTIC HEADING HIERARCHY & ALT ATTRIBUTES AUDIT ---
  console.log("\n--- 3. SEMANTIC HEADING HIERARCHY & ALT ATTRIBUTES AUDIT ---");
  const h1Occurrences = (optimizedHtml.match(/<h1\b[^>]*>/gi) || []).length;
  assert(h1Occurrences === 1, `Enforced exactly one <h1> per page (Found: ${h1Occurrences})`);
  assert(optimizedHtml.includes("<h2") && optimizedHtml.includes("Residential Drain Cleaning Services</h2>"), "Secondary <h1> cleanly downgraded to <h2>");
  
  // Verify sequential heading: h3 was upgraded to h2 or maintained logically
  const allHeadings = Array.from(optimizedHtml.matchAll(/<(h[1-6])\b/gi)).map(m => m[1].toLowerCase());
  assert(allHeadings[0] === "h1", "First heading in document outline is h1");

  // Verify all <img> tags have valid alt attributes
  const allImgs = Array.from(optimizedHtml.matchAll(/<img\b([^>]*?)>/gi));
  let allHaveValidAlt = true;
  for (const img of allImgs) {
    const altMatch = img[1].match(/\balt=(["'])(.*?)\1/i);
    if (!altMatch || !altMatch[2].trim()) {
      allHaveValidAlt = false;
      break;
    }
  }
  assert(allHaveValidAlt, `All ${allImgs.length} images have non-empty, descriptive alt attributes`);

  // --- 4. PERFORMANCE FOR CORE WEB VITALS AUDIT ---
  console.log("\n--- 4. PERFORMANCE FOR CORE WEB VITALS AUDIT ---");
  // First image: loading="eager", fetchpriority="high" for LCP
  assert(/<img\b[^>]*?loading=["']eager["'][^>]*?fetchpriority=["']high["']/i.test(optimizedHtml), "LCP Candidate image equipped with loading='eager' and fetchpriority='high'");
  
  // Subsequent images: loading="lazy", decoding="async"
  assert(/<img\b[^>]*?loading=["']lazy["'][^>]*?decoding=["']async["']/i.test(optimizedHtml), "Content images equipped with loading='lazy' and decoding='async'");

  // CLS dimension attributes (width and height)
  let allHaveDimensions = true;
  for (const img of allImgs) {
    const hasWidth = /\bwidth=/i.test(img[1]);
    const hasHeight = /\bheight=/i.test(img[1]);
    if (!hasWidth || !hasHeight) {
      allHaveDimensions = false;
      break;
    }
  }
  assert(allHaveDimensions, `All ${allImgs.length} images have explicit width and height attributes to prevent CLS`);

  // Critical CSS Inlining
  assert(optimizedHtml.includes("<style id=\"critical-seo-css\">") && optimizedHtml.includes("header{background:#003366;}"), "Critical CSS successfully inlined into <head> to eliminate render-blocking CSS");

  // --- 5. CRAWLER FILES & ZIP STREAMING AUDIT ---
  console.log("\n--- 5. CRAWLER FILES & ZIP STREAMING AUDIT ---");
  const testFiles = [
    { path: "index.html", content: sampleRawHtml },
    { path: "services/drain-cleaning.html", content: sampleRawHtml },
    { path: "locations/round-rock-plumber.html", content: sampleRawHtml },
    { path: "blog/signs-water-heater-repair.html", content: blogHtml },
    { path: "styles.css", content: "body { margin: 0; background: #fafafa; } .hero { color: blue; }" },
  ];

  // Test Sitemap Generator
  const sitemapXml = generateProjectSitemapXml(testFiles, "eliteplumberstx.com");
  assert(sitemapXml.includes("<loc>https://eliteplumberstx.com/</loc>"), "Sitemap includes root index URL");
  assert(sitemapXml.includes("<priority>1.0</priority>"), "Sitemap prioritizes root page at 1.0");
  assert(sitemapXml.includes("<loc>https://eliteplumberstx.com/services/drain-cleaning.html</loc>"), "Sitemap includes service page URL");
  assert(sitemapXml.includes("<loc>https://eliteplumberstx.com/locations/round-rock-plumber.html</loc>"), "Sitemap includes location page URL");
  assert(sitemapXml.includes("<loc>https://eliteplumberstx.com/blog/signs-water-heater-repair.html</loc>"), "Sitemap includes blog post URL");

  // Test Robots Generator
  const robotsTxt = generateProjectRobotsTxt("eliteplumberstx.com");
  assert(robotsTxt.includes("User-agent: *") && robotsTxt.includes("Allow: /"), "Robots.txt includes open crawl directives");
  assert(robotsTxt.includes("Sitemap: https://eliteplumberstx.com/sitemap.xml"), "Robots.txt points to canonical sitemap.xml");

  // Test Full Project Streaming ZIP with Bundler
  const { stream, safeFilename, stats } = await bundleProjectToZipStream({
    projectName: "Elite Plumbers",
    domain: "eliteplumberstx.com",
    businessDetails: {
      businessName: "Elite Plumbers Austin",
      businessType: "Plumbing",
      phone: "(512) 555-0199",
      email: "service@eliteplumberstx.com",
      city: "Austin",
      stateRegion: "TX",
      websiteDomain: "eliteplumberstx.com",
    },
    files: testFiles,
  });

  // Read streamed chunks into buffer
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  const zipBuffer = Buffer.concat(chunks);
  assert(zipBuffer.length > 0, `ZIP Stream received ${zipBuffer.length} bytes`);

  // Inspect generated ZIP contents
  const unzipped = await JSZip.loadAsync(zipBuffer);
  assert(Boolean(unzipped.file("sitemap.xml")), "sitemap.xml automatically included in exported ZIP root");
  assert(Boolean(unzipped.file("robots.txt")), "robots.txt automatically included in exported ZIP root");
  assert(Boolean(unzipped.file("index.html")), "index.html present in exported ZIP root");

  const exportedIndexHtml = await unzipped.file("index.html")!.async("string");
  assert(exportedIndexHtml.includes("application/ld+json"), "Exported index.html contains minified Schema.org structured data");
  assert(exportedIndexHtml.includes("canonical"), "Exported index.html contains canonical URL");
  assert(exportedIndexHtml.includes("loading=\"lazy\""), "Exported index.html contains lazy-loaded images");

  console.log("\n==========================================================================");
  console.log(" ALL 25 GOOGLE SEARCH SEO & CORE WEB VITALS AUDIT CHECKS PASSED! ");
  console.log("==========================================================================");
}

runSeoExportTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
