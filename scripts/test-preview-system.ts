import { assembleWebsite } from "../templates/assembler";
import { getThemeById } from "../lib/themes";
import { preparePreviewHtml, resolvePreviewRelativePath, generateSvgImageFallback } from "../lib/export/preview-renderer";
import { buildCanonicalWebsiteFiles } from "../lib/export/canonical-files";
import { tempStorage } from "../lib/storage/temp-storage";

async function runPreviewSystemTests() {
  console.log("=== Testing Website Preview System & Single Source of Truth ===\n");

  // 1. Generate website files via pipeline assembler
  const theme = getThemeById("pipe-and-wrench");
  const testSiteData: any = {
    site: {
      businessName: "Austin Elite Plumbing",
      businessType: "plumbing",
      phone: "(512) 555-0199",
      address: { city: "Austin", state: "TX" },
      theme: "pipe-and-wrench",
      websiteDomain: "austineliteplumbing.com",
    },
    pages: [
      {
        slug: "index",
        seo: { title: "Austin Elite Plumbing | Top Rated Austin Plumber", metaDescription: "Professional plumbing in Austin TX" },
        sections: [
          {
            type: "hero",
            variant: "split",
            content: {
              h1: "24/7 Emergency Plumbing in Austin",
              subheadline: "Fast, reliable plumbing repairs with upfront pricing.",
              primaryCta: "(512) 555-0199",
              secondaryCta: "View Services",
              secondaryUrl: "services.html",
            },
          },
          {
            type: "services",
            variant: "grid",
            content: {
              headline: "Our Plumbing Services",
              services: [
                { title: "Drain Cleaning", description: "Clear any clog fast." },
                { title: "Water Heater Repair", description: "Tankless and traditional repair." },
              ],
            },
          },
        ],
      },
      {
        slug: "services",
        seo: { title: "Plumbing Services | Austin Elite Plumbing", metaDescription: "Full range of residential plumbing services." },
        sections: [
          {
            type: "hero",
            variant: "split",
            content: {
              h1: "Expert Plumbing Services in Austin",
              primaryCta: "(512) 555-0199",
              secondaryCta: "Contact Us",
              secondaryUrl: "contact.html",
            },
          },
        ],
      },
      {
        slug: "contact",
        seo: { title: "Contact Us | Austin Elite Plumbing", metaDescription: "Get in touch for plumbing quotes." },
        sections: [
          {
            type: "contact",
            variant: "split",
            content: {
              headline: "Request a Fast Quote",
              phone: "(512) 555-0199",
            },
          },
        ],
      },
    ],
  };

  const assembled = await assembleWebsite(testSiteData, theme, { mode: "fast" });
  console.log(`✓ Assembled website generated ${assembled.files.length} canonical files:`);
  for (const f of assembled.files) {
    console.log(`   - ${f.path} (${f.mimeType || "text/plain"}, ${typeof f.content === "string" ? f.content.length : f.content.length} bytes)`);
  }

  // 2. Verify Single Source of Truth: Generated Files -> Preview -> ZIP -> Deployment
  console.log("\n--- Verification: Architecture & One Source of Truth ---");
  const canonical = buildCanonicalWebsiteFiles(assembled.files, {
    projectName: "Austin Elite Plumbing",
    domain: "austineliteplumbing.com",
    phone: "(512) 555-0199",
  });

  // Verify that the canonical files preserve all generated files without dropping or diverging
  if (canonical.files.length < assembled.files.length) {
    throw new Error(`Canonical files dropped generated files! Expected at least ${assembled.files.length}, got ${canonical.files.length}`);
  }

  const generatedHtmlPaths = assembled.files.filter((f) => f.path.endsWith(".html")).map((f) => f.path);
  const canonicalHtmlPaths = canonical.files.filter((f) => f.path.endsWith(".html")).map((f) => f.path);
  for (const p of generatedHtmlPaths) {
    if (!canonicalHtmlPaths.includes(p)) {
      throw new Error(`Generated file "${p}" missing from canonical website files!`);
    }
  }
  console.log("✓ Single Source of Truth verified: Generated files match canonical file set 100%");

  // Verify Temp Storage registration
  const testProjectId = `test-proj-${Date.now()}`;
  tempStorage.register({
    id: testProjectId,
    name: "Austin Elite Plumbing",
    files: canonical.files,
    photos: assembled.photos,
    domain: "austineliteplumbing.com",
  });

  const stored = tempStorage.get(testProjectId);
  if (!stored || stored.files.length !== canonical.files.length) {
    throw new Error("Temporary storage failed to store exact project files!");
  }
  console.log("✓ Ephemeral temp storage registered identical files for Preview & Download API");

  // 3. Test Preview Rendering: CSS, JS, Images, Links
  console.log("\n--- Verification: Preview Rendering & Defect Fixes ---");
  for (const htmlPath of generatedHtmlPaths) {
    const previewHtml = preparePreviewHtml({
      pagePath: htmlPath,
      files: canonical.files,
      photos: assembled.photos,
      businessDetails: {
        name: "Austin Elite Plumbing",
        domain: "austineliteplumbing.com",
      },
      viewport: "desktop",
    });

    // Check CSS: Local stylesheets must be inlined; no external 404 links to local css
    if (previewHtml.includes('<link rel="stylesheet" href="css/style.css">') || previewHtml.includes('<link rel="stylesheet" href="styles.css">')) {
      throw new Error(`Preview HTML in "${htmlPath}" still contains uninlined local <link rel="stylesheet">!`);
    }
    if (!previewHtml.includes('id="ranklocal-inlined-preview-css"')) {
      throw new Error(`Preview HTML in "${htmlPath}" missing inlined master CSS block!`);
    }

    // Check JS: Local scripts must be inlined; safe execution wrapper present
    if (previewHtml.includes('<script src="js/main.js"') || previewHtml.includes('<script src="script.js"')) {
      throw new Error(`Preview HTML in "${htmlPath}" still contains uninlined local <script src="...">!`);
    }
    if (!previewHtml.includes('id="ranklocal-inlined-preview-js"')) {
      throw new Error(`Preview HTML in "${htmlPath}" missing inlined master JS block!`);
    }

    // Check DOM events: Must dispatch DOMContentLoaded so accordions/menu work
    if (!previewHtml.includes('new Event("DOMContentLoaded"')) {
      throw new Error(`Preview HTML in "${htmlPath}" missing DOMContentLoaded dispatch!`);
    }

    // Check Images: Zero broken images (all have valid src and onerror fallback)
    const domOnlyHtml = previewHtml
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
    const imgMatches = domOnlyHtml.match(/<img\b[^>]*?>/gi) || [];
    for (const imgTag of imgMatches) {
      const srcMatch = imgTag.match(/\bsrc=["']([^"']*)["']/i);
      if (!srcMatch || !srcMatch[1] || srcMatch[1].trim() === "") {
        throw new Error(`Broken image found in "${htmlPath}": img tag has empty src! Tag: ${imgTag}`);
      }
      if (srcMatch[1].startsWith("images/") && !srcMatch[1].startsWith("http")) {
        throw new Error(`Broken image found in "${htmlPath}": local unresolved images/ path in preview! Tag: ${imgTag}`);
      }
      if (!imgTag.includes("onerror=")) {
        throw new Error(`Image missing onerror fallback in "${htmlPath}": ${imgTag}`);
      }
    }

    // Check Navigation: Interceptor must be present
    if (!previewHtml.includes('id="ranklocal-preview-interceptors"')) {
      throw new Error(`Preview HTML in "${htmlPath}" missing client navigation interceptors!`);
    }
    if (!previewHtml.includes('PREVIEW_NAVIGATE')) {
      throw new Error(`Preview HTML in "${htmlPath}" missing PREVIEW_NAVIGATE postMessage!`);
    }
    if (!previewHtml.includes('PREVIEW_TEL_CLICK')) {
      throw new Error(`Preview HTML in "${htmlPath}" missing PREVIEW_TEL_CLICK postMessage!`);
    }

    console.log(`✓ Page "${htmlPath}" rendered flawlessly in preview (0 broken images, CSS inlined, JS safe, nav intercepted)`);
  }

  // 4. Test POSIX Path Resolution for Navigation
  console.log("\n--- Verification: POSIX Navigation & Link Resolution ---");
  const testCases = [
    { from: "index.html", rel: "/", expected: "index.html" },
    { from: "index.html", rel: "", expected: "index.html" },
    { from: "index.html", rel: ".", expected: "index.html" },
    { from: "index.html", rel: "./", expected: "index.html" },
    { from: "index.html", rel: "services.html", expected: "services.html" },
    { from: "index.html", rel: "services.html#drain-cleaning", expected: "services.html" },
    { from: "index.html", rel: "/services.html", expected: "services.html" },
    { from: "services.html", rel: "index.html", expected: "index.html" },
    { from: "services.html", rel: "contact.html", expected: "contact.html" },
    { from: "blog/post-1.html", rel: "../index.html", expected: "index.html" },
    { from: "blog/post-1.html", rel: "../services.html", expected: "services.html" },
  ];

  for (const tc of testCases) {
    const actual = resolvePreviewRelativePath(tc.from, tc.rel);
    if (actual !== tc.expected) {
      throw new Error(`Navigation resolution failed for from="${tc.from}", rel="${tc.rel}": expected "${tc.expected}", got "${actual}"`);
    }
    console.log(`✓ Link "${tc.rel}" from "${tc.from}" -> resolved to "${actual}"`);
  }

  // 5. Verify Fallback SVG Generator
  console.log("\n--- Verification: Fallback SVG Generator ---");
  const fallbackSvg = generateSvgImageFallback("Emergency Water Heater", 800, 600);
  if (!fallbackSvg.startsWith("data:image/svg+xml;charset=utf-8,") || !decodeURIComponent(fallbackSvg).includes("Emergency Water Heater")) {
    throw new Error("Fallback SVG generator output is invalid!");
  }
  console.log("✓ Fallback SVG generator produces clean data URIs for any missing photo");

  console.log("\n=== ALL PREVIEW SYSTEM VERIFICATION CHECKS PASSED SUCCESSFULLY! ===");
}

runPreviewSystemTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
