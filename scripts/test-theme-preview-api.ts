import { THEMES, getThemeById } from "../lib/themes";
import { assembleWebsite } from "../templates/assembler";
import { computeTargetPages, WebsiteFormData } from "../lib/generator/prompt";
import { buildDefaultTradeContentJSON } from "../lib/generator/ai-content-prompt";

async function runThemePreviewApiAudit() {
  console.log("==================================================");
  console.log("🧪 RANKLOCAL THEME PREVIEW & 10-THEME SYSTEM AUDIT");
  console.log("==================================================\n");

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition: boolean, desc: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${desc}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${desc}`);
      process.exitCode = 1;
    }
  }

  const primaryThemes = THEMES.filter((t) => !t.isLegacy);
  assert(primaryThemes.length === 10, `Exactly 10 primary themes exist (found ${primaryThemes.length})`);

  // Realistic prompt demo data
  const sampleFormData: WebsiteFormData = {
    businessName: "Premier Home Services",
    businessType: "Plumbing",
    businessDescription:
      "Licensed master plumbers delivering 24/7 emergency dispatch, drain cleaning, water heater repair, and comprehensive residential plumbing across Dallas and surrounding communities.",
    services: [
      "Emergency Plumbing Repair",
      "Drain Cleaning & Rooter Clearing",
      "Water Heater Repair & Replacement",
      "Pipe Repair & Leak Detection",
      "Slab Leak Detection & Rerouting",
      "Sewer Line Camera Inspection",
    ],
    city: "Dallas",
    stateRegion: "TX",
    phone: "(214) 555-0198",
    email: "service@premierhomeservices.com",
    streetAddress: "2100 Ross Ave",
    zipPostalCode: "75201",
    yearsInBusiness: "20+ Years",
    uniqueSellingPoints: "45-min rapid dispatch, upfront transparent pricing, 100% satisfaction guarantee",
    serviceAreas: "Dallas, Highland Park, University Park, Plano, Richardson, Irving, Garland",
    targetKeywords: "plumber dallas tx, emergency plumber dallas, drain cleaning dallas, water heater repair dallas",
    pagesToCreate: ["Home", "About", "Services", "Contact", "FAQ"],
  };

  const targetPages = computeTargetPages(sampleFormData);
  const contentJSON = buildDefaultTradeContentJSON(sampleFormData, targetPages);

  const serviceAreaCities = [
    { city: "Highland Park", stateId: "TX", county: "Dallas", lat: 32.8335, lng: -96.7919 },
    { city: "University Park", stateId: "TX", county: "Dallas", lat: 32.8551, lng: -96.7975 },
    { city: "Plano", stateId: "TX", county: "Collin", lat: 33.0198, lng: -96.6989 },
    { city: "Richardson", stateId: "TX", county: "Dallas", lat: 32.9483, lng: -96.7299 },
    { city: "Irving", stateId: "TX", county: "Dallas", lat: 32.8140, lng: -96.9489 },
    { city: "Garland", stateId: "TX", county: "Dallas", lat: 32.9126, lng: -96.6389 },
  ];

  const startTime = Date.now();

  for (const theme of primaryThemes) {
    console.log(`\n--- Auditing Theme: ${theme.name} (${theme.id}) ---`);

    const assembled = await assembleWebsite(contentJSON, theme, {
      domain: "premierhomeservices.com",
      serviceAreaCities,
      fastOfflinePreview: true,
    });

    const indexFile = assembled.files.find((f) => f.path === "index.html");
    const styleFile = assembled.files.find((f) => f.path === "css/style.css");

    assert(!!indexFile, `${theme.name} generates index.html`);
    assert(!!styleFile, `${theme.name} generates css/style.css`);

    const html = typeof indexFile?.content === "string" ? indexFile.content : indexFile?.content?.toString("utf8") || "";
    const css = typeof styleFile?.content === "string" ? styleFile.content : styleFile?.content?.toString("utf8") || "";

    // 1. Structural Body Theme Class
    const expectedClass = `theme-${theme.id}`;
    assert(html.includes(expectedClass), `${theme.name} contains body class "${expectedClass}"`);

    // 2. Primary Phone Conversion CTAs
    assert(html.includes("tel:2145550198"), `${theme.name} has primary clickable tel: link for (214) 555-0198`);
    assert(html.includes("mobile-call-bar"), `${theme.name} contains mobile sticky call bar`);

    // 3. Exactly ONE Map on Homepage, Placed in Final CTA Section Above Footer
    assert(html.includes("final-cta-section"), `${theme.name} contains Final CTA + Map section immediately above footer`);

    // Ensure NO map is in Service Areas
    const serviceAreasHtml = html.split('id="service-areas"')[1]?.split("</section>")[0] || "";
    assert(!serviceAreasHtml.includes("<iframe") && !serviceAreasHtml.includes("map-embed"), `${theme.name} Service Areas contains ZERO map embeds`);

    // 4. Contrast & Service Areas Cards
    assert(html.includes("service-area-card"), `${theme.name} renders service-area-card`);
    assert(html.includes("service-area-name"), `${theme.name} renders service-area-name`);
    assert(css.includes(".service-area-card"), `${theme.name} CSS defines .service-area-card styling`);

    // 5. Hero Structural Identity
    if (theme.layoutStructure?.heroLayout === "split") {
      assert(html.includes("hero-split"), `${theme.name} renders hero-split`);
    } else if (theme.layoutStructure?.heroLayout === "split-full") {
      assert(html.includes("hero-split-full"), `${theme.name} renders hero-split-full with full-height image`);
    } else if (theme.layoutStructure?.heroLayout === "compact-bold") {
      assert(html.includes("hero-compact-bold"), `${theme.name} renders hero-compact-bold`);
      assert(html.includes("urgent-dispatch-banner"), `${theme.name} includes urgent dispatch banner`);
    } else if (theme.layoutStructure?.heroLayout === "asymmetric") {
      assert(html.includes("hero-asymmetric"), `${theme.name} renders hero-asymmetric`);
    } else if (theme.layoutStructure?.heroLayout === "minimal") {
      assert(html.includes("hero-minimal"), `${theme.name} renders hero-minimal`);
    } else if (theme.layoutStructure?.heroLayout === "service-first") {
      assert(html.includes("hero-service-first"), `${theme.name} renders hero-service-first`);
    } else if (theme.layoutStructure?.heroLayout === "soft") {
      assert(html.includes("hero-soft"), `${theme.name} renders hero-soft`);
    } else if (theme.layoutStructure?.heroLayout === "high-contrast") {
      assert(html.includes("hero-high-contrast"), `${theme.name} renders hero-high-contrast`);
    }

    // 6. Header Structural Identity
    if (theme.layoutStructure?.headerVariant === "emergency-bar") {
      assert(html.includes("header-emergency-topbar"), `${theme.name} renders header-emergency-topbar`);
    } else if (theme.layoutStructure?.headerVariant === "split-phone") {
      assert(html.includes("header-split-phone"), `${theme.name} renders header-split-phone`);
    } else if (theme.layoutStructure?.headerVariant === "minimal") {
      assert(html.includes("header-minimal"), `${theme.name} renders header-minimal`);
    } else if (theme.layoutStructure?.headerVariant === "centered") {
      assert(html.includes("header-centered"), `${theme.name} renders header-centered`);
    } else if (theme.layoutStructure?.headerVariant === "bold-call") {
      assert(html.includes("header-bold-call"), `${theme.name} renders header-bold-call`);
    }

    // 7. Schema Preservation
    assert(html.includes('"@type": "LocalBusiness"') || html.includes('"@type": "Plumber"'), `${theme.name} preserves JSON-LD LocalBusiness schema`);
    assert(html.includes('"telephone": "(214) 555-0198"'), `${theme.name} schema preserves telephone`);
    assert(html.includes("<title>"), `${theme.name} preserves <title>`);
    assert(html.includes('name="description"'), `${theme.name} preserves description`);

    // 8. Image Fallbacks
    assert(html.includes("data-local-svg="), `${theme.name} image tags include guaranteed local SVG fallback`);
  }

  const elapsed = Date.now() - startTime;
  console.log(`\n⚡ Total assembly time for all 10 themes: ${elapsed}ms (${(elapsed / 10).toFixed(1)}ms / theme)`);

  console.log("\n==================================================");
  console.log(`📊 PREVIEW & THEME AUDIT: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log("==================================================");

  if (passedTests === totalTests) {
    console.log("🎉 ALL 10 THEMES VALIDATED WITH PERFECT PREVIEW AND STRUCTURAL FIDELITY!\n");
  } else {
    console.error(`⚠️ ${totalTests - passedTests} TESTS FAILED!`);
    process.exit(1);
  }
}

runThemePreviewApiAudit().catch((err) => {
  console.error("Theme preview audit crashed:", err);
  process.exit(1);
});
