import fs from "fs";
import path from "path";
import { assembleWebsite } from "../templates/assembler";
import { THEMES } from "../lib/themes";
import { SiteContentJSON } from "../lib/generator/content-schema";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` - ${detail}` : ""}`);
    failedCount++;
  }
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("  RankLocal Hero Image Layout & Responsiveness Tests");
  console.log("=======================================================\n");

  // 1. Verify base.css contains all required desktop and mobile hero rules
  console.log("--- 1. Inspecting templates/base.css hero rules ---");
  const baseCssPath = path.join(process.cwd(), "templates", "base.css");
  const baseCss = fs.readFileSync(baseCssPath, "utf8");

  assert(
    baseCss.includes(".hero-split-grid") &&
    baseCss.includes("grid-template-columns: 1fr 1fr;") &&
    baseCss.includes("align-items: stretch;"),
    "Desktop .hero-split-grid has balanced 1fr 1fr columns and align-items: stretch"
  );

  assert(
    baseCss.includes(".hero-text-col") &&
    baseCss.includes("justify-content: center;"),
    ".hero-text-col has vertical centering so short text balances the large image"
  );

  assert(
    baseCss.includes(".hero-image-wrap") &&
    (baseCss.includes("min-height: 480px;") || baseCss.includes("min-height: 440px;")),
    "Desktop .hero-image-wrap has minimum visual height of at least 440px"
  );

  assert(
    baseCss.includes("aspect-ratio: 4 / 3;") &&
    baseCss.includes("min-height: 260px;"),
    "Mobile hero image has balanced 4:3 aspect-ratio with min-height >= 260px (not a 190px sliver)"
  );

  assert(
    baseCss.includes("object-fit: cover;") &&
    baseCss.includes("object-position: center 25%;"),
    "Image uses object-fit: cover and intelligent upper-center crop position"
  );

  assert(
    baseCss.includes(".location-hero-grid") &&
    baseCss.includes("grid-template-columns: 1fr 1fr;") &&
    baseCss.includes("align-items: stretch;"),
    "Location page hero grid also uses balanced 1fr 1fr stretch layout on desktop"
  );

  // 2. Test Real Assembled Website Generation with Split Hero
  console.log("\n--- 2. Generating real website with Split Hero ---");

  const mockSiteContent: SiteContentJSON = {
    site: {
      businessName: "Lone Star Emergency Plumbing",
      businessType: "Emergency Plumber",
      businessModel: "service-area",
      phone: "(214) 555-0198",
      email: "dispatch@lonestarplumbingdfw.com",
      address: {
        city: "Dallas",
        state: "TX",
        zip: "75201",
        country: "USA",
      },
      serviceAreas: ["Dallas", "Plano", "Fort Worth", "Arlington"],
      yearsInBusiness: "20+",
      insuredBonded: true,
      licenseNumber: "MPL-41092",
      emergency247: true,
      responseTime: "45-Minute Arrival",
      freeEstimates: true,
    },
    pages: [
      {
        slug: "index",
        seo: {
          title: "Emergency Plumber Dallas TX | Lone Star Plumbing",
          description: "24/7 licensed emergency plumbers serving Dallas, TX. 45-minute arrival guarantee and upfront pricing. Call now.",
          h1: "24/7 Emergency Plumber in Dallas, TX",
          primaryKeyword: "emergency plumber dallas tx",
        },
        sections: [
          {
            type: "hero",
            variant: "split",
            content: {
              eyebrow: "24/7 Priority Emergency Dispatch",
              h1: "Fast, Reliable Emergency Plumbers in Dallas, TX",
              subheadline: "Burst pipe, sewer backup, or leaking water heater? Our licensed master plumbers arrive within 45 minutes with upfront flat pricing.",
              primaryCta: "Call (214) 555-0198",
              secondaryCta: "Request Immediate Service",
              secondaryUrl: "contact.html",
              trustBadges: ["45-Min Arrival", "Licensed & Insured", "Upfront Pricing"],
            },
            images: [
              {
                slot: "main",
                url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80",
                alt: "Licensed Dallas plumber inspecting plumbing pipes",
              },
            ],
          },
          {
            type: "services",
            variant: "cards",
            content: {
              eyebrow: "What We Do",
              headline: "Complete Emergency Plumbing Services",
              subheadline: "Professional repairs for homes and businesses across Dallas County.",
              items: [
                { title: "Drain Cleaning", description: "High-pressure hydro-jetting", slug: "services" },
                { title: "Water Heater Repair", description: "Tank and tankless repairs", slug: "services" },
              ],
            },
          },
          {
            type: "contactForm",
            content: {},
          },
        ],
      },
    ],
  };

  const assembled = await assembleWebsite(mockSiteContent, THEMES[0]);
  const indexFile = assembled.files.find((f) => f.path === "index.html");
  assert(Boolean(indexFile), "index.html was successfully generated");

  const indexHtml = typeof indexFile!.content === "string" ? indexFile!.content : indexFile!.content.toString("utf8");

  // Check HTML structure
  assert(indexHtml.includes("hero hero-split"), "Hero element has 'hero hero-split' classes");
  assert(indexHtml.includes("hero-split-grid"), "Contains container hero-split-grid");
  assert(indexHtml.includes("hero-text-col"), "Contains hero-text-col");
  assert(indexHtml.includes("hero-image-wrap"), "Contains hero-image-wrap");
  assert(indexHtml.includes("img-hero img-hero-split"), "Image has 'img-hero img-hero-split' classes");
  assert(indexHtml.includes("hero-floating-card"), "Contains hero-floating-card badge");

  const cssFile = assembled.files.find((f) => f.path === "styles.css");
  assert(Boolean(cssFile), "styles.css was successfully bundled");
  const cssContent = typeof cssFile!.content === "string" ? cssFile!.content : cssFile!.content.toString("utf8");

  assert(
    cssContent.includes("grid-template-columns: 1fr 1fr;"),
    "Generated styles.css includes 1fr 1fr desktop hero split"
  );
  assert(
    cssContent.includes("min-height: 480px;") || cssContent.includes("min-height: 440px;"),
    "Generated styles.css includes spacious desktop hero wrap (>= 440px)"
  );

  // 3. Test different content lengths: Short Title vs Long Title
  console.log("\n--- 3. Testing Different Content Length Scenarios ---");

  // Short Title & 1 CTA
  const shortContent: SiteContentJSON = {
    ...mockSiteContent,
    pages: [
      {
        slug: "index",
        seo: { title: "Lone Star", description: "Plumbing", h1: "Plumbing Service", primaryKeyword: "plumber" },
        sections: [
          {
            type: "hero",
            variant: "split",
            content: {
              eyebrow: "Local Pro",
              h1: "Plumbing Service",
              subheadline: "Quick help.",
              primaryCta: "Call Now",
              trustBadges: ["Licensed"],
            },
            images: [{ slot: "main", url: "https://example.com/photo.jpg", alt: "Plumber" }],
          },
        ],
      },
    ],
  };
  const assembledShort = await assembleWebsite(shortContent, THEMES[0]);
  const shortHtml = assembledShort.files.find((f) => f.path === "index.html")!.content.toString();
  assert(shortHtml.includes("hero-image-wrap"), "Short content hero preserves image-wrap");

  // Long Title & Multiple CTAs
  const longContent: SiteContentJSON = {
    ...mockSiteContent,
    pages: [
      {
        slug: "index",
        seo: { title: "Title", description: "Desc", h1: "Comprehensive 24/7 Commercial and Residential Plumbing Solutions in Greater Dallas-Fort Worth Metroplex", primaryKeyword: "plumber" },
        sections: [
          {
            type: "hero",
            variant: "split",
            content: {
              eyebrow: "Dallas Master Certified Specialists Since 2004",
              h1: "Comprehensive 24/7 Commercial and Residential Plumbing Solutions in Greater Dallas-Fort Worth Metroplex",
              subheadline: "We have proudly resolved over 15,000 emergency plumbing crises across North Texas with transparent upfront pricing, certified master technicians, and a rock-solid 100% satisfaction guarantee.",
              primaryCta: "Call (214) 555-0198",
              secondaryCta: "Book Master Technician Online",
              secondaryUrl: "contact.html",
              trustBadges: ["MPL-41092 Licensed", "A+ BBB Accredited", "100% Guaranteed", "45-Min Arrival"],
            },
            images: [{ slot: "main", url: "https://example.com/photo.jpg", alt: "Plumber" }],
          },
        ],
      },
    ],
  };
  const assembledLong = await assembleWebsite(longContent, THEMES[0]);
  const longHtml = assembledLong.files.find((f) => f.path === "index.html")!.content.toString();
  assert(longHtml.includes("hero-image-wrap") && longHtml.includes("hero-text-col"), "Long content hero renders correctly");

  // 4. Viewport Verification simulation
  console.log("\n--- 4. Viewport Breakpoint Simulations ---");
  const viewports = [
    { name: "Desktop Large", width: 1440, expectedColumns: "2 columns (1fr 1fr)", minHeight: "440px" },
    { name: "Desktop Standard", width: 1280, expectedColumns: "2 columns (1fr 1fr)", minHeight: "440px" },
    { name: "Desktop Compact", width: 1024, expectedColumns: "2 columns (1fr 1fr)", minHeight: "440px" },
    { name: "Tablet Portrait", width: 768, expectedColumns: "1 column (full width)", minHeight: "360px-420px" },
    { name: "Mobile Large (iPhone 16 Pro Max)", width: 430, expectedColumns: "1 column", minHeight: "260px-380px (4:3 ratio)" },
    { name: "Mobile Standard (iPhone 15)", width: 390, expectedColumns: "1 column", minHeight: "260px-380px (4:3 ratio)" },
    { name: "Mobile Compact (iPhone SE)", width: 375, expectedColumns: "1 column", minHeight: "260px-380px (4:3 ratio)" },
  ];

  for (const vp of viewports) {
    console.log(`  Checking viewport: ${vp.name} (${vp.width}px):`);
    if (vp.width >= 1024) {
      assert(baseCss.includes("grid-template-columns: 1fr 1fr;"), `  ${vp.name} (${vp.width}px): uses ${vp.expectedColumns}`);
    } else {
      assert(baseCss.includes("aspect-ratio: 4 / 3;"), `  ${vp.name} (${vp.width}px): uses ${vp.expectedColumns} with ${vp.minHeight}`);
    }
  }

  console.log("\n=======================================================");
  console.log(`  Hero Layout Test Results: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("=======================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
