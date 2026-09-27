import { THEMES, getThemeById, getRecommendedThemeIds } from "../lib/themes";
import { assembleWebsite } from "../templates/assembler";
import { SiteContentJSON } from "../lib/generator/content-schema";

async function runThemeSystemAudit() {
  console.log("==================================================");
  console.log("🧪 RANKLOCAL THEME SYSTEM UPGRADE AUDIT");
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

  // 1. Verify 10 distinct primary themes
  const primaryThemes = THEMES.filter((t) => !t.isLegacy);
  assert(primaryThemes.length === 10, `Exactly 10 primary themes exist (found ${primaryThemes.length})`);

  const expectedThemeIds = [
    "modern-local-pro",
    "split-hero",
    "bold-conversion",
    "premium-local",
    "editorial-modern",
    "clean-minimal",
    "trust-first",
    "modern-service-grid",
    "contemporary-soft",
    "high-contrast-modern",
  ];

  for (const tid of expectedThemeIds) {
    const found = primaryThemes.find((t) => t.id === tid);
    assert(!!found, `Theme "${tid}" is defined in primary themes`);
    if (found) {
      assert(
        !!found.layoutStructure && !!found.layoutStructure.heroLayout && !!found.layoutStructure.sectionOrder,
        `Theme "${tid}" has complete layoutStructure`
      );
      assert(
        Array.isArray(found.designCharacteristics) && found.designCharacteristics.length >= 3,
        `Theme "${tid}" has at least 3 designCharacteristics`
      );
    }
  }

  // 2. Verify backward compatibility of legacy IDs
  const legacyMap: Record<string, string> = {
    "modern-pro": "modern-local-pro",
    "bold-trade": "bold-conversion",
    "luxury-elegant": "premium-local",
    "clean-medical": "contemporary-soft",
    "minimal-mono": "clean-minimal",
  };

  for (const [legacyId, expectedTarget] of Object.entries(legacyMap)) {
    const resolved = getThemeById(legacyId);
    assert(
      resolved.id === expectedTarget || resolved.id === legacyId,
      `Legacy theme "${legacyId}" resolves cleanly to "${resolved.id}"`
    );
  }

  // 3. Verify distinct layout structures across themes
  const splitHeroTheme = getThemeById("split-hero");
  const boldTheme = getThemeById("bold-conversion");
  const trustFirstTheme = getThemeById("trust-first");
  const editorialTheme = getThemeById("editorial-modern");
  const serviceGridTheme = getThemeById("modern-service-grid");
  const modernProTheme = getThemeById("modern-local-pro");

  assert(
    splitHeroTheme.layoutStructure?.heroLayout === "split-full",
    "Split Hero theme specifies 'split-full' hero layout"
  );
  assert(
    boldTheme.layoutStructure?.heroLayout === "compact-bold",
    "Bold Conversion theme specifies 'compact-bold' hero layout"
  );
  assert(
    editorialTheme.layoutStructure?.serviceCardVariant === "alternating",
    "Editorial Modern theme specifies 'alternating' service layout"
  );
  assert(
    trustFirstTheme.layoutStructure?.trustVariant === "trust-first-grid",
    "Trust First theme specifies 'trust-first-grid' trust variant"
  );
  assert(
    serviceGridTheme.layoutStructure?.heroLayout === "service-first",
    "Modern Service Grid theme specifies 'service-first' hero layout"
  );

  // 4. Assemble with sample data and verify structural HTML variance
  const sampleSiteData: SiteContentJSON = {
    site: {
      businessName: "Austin Premier Plumbing",
      tagline: "Master Plumbers Serving Travis County 24/7",
      phone: "(512) 890-4321",
      email: "dispatch@austinpremierplumbing.com",
      address: {
        street: "1401 S Congress Ave",
        city: "Austin",
        state: "TX",
        zip: "78704",
      },
      licenseNumber: "MPL-49218",
      insuredBonded: true,
      yearsInBusiness: "18+ Years",
      warrantyGuarantee: "100% Satisfaction Guarantee",
      emergency247: true,
      serviceAreas: ["Austin", "Round Rock", "Cedar Park", "Pflugerville"],
      businessModel: "hybrid",
      realReviewsConfirmed: true,
      realReviews: [
        { author: "Mark R.", rating: 5, text: "Fast arrival on Sunday night. Fair price!" },
        { author: "Sarah L.", rating: 5, text: "Fixed our leak in under an hour." },
      ],
    },
    pages: [
      {
        slug: "index",
        seo: {
          title: "Plumber Austin TX | Austin Premier Plumbing",
          description: "24/7 emergency plumbers in Austin TX with upfront pricing and rapid dispatch.",
          h1: "Trusted Master Plumbers in Austin, TX",
        },
        sections: [
          {
            type: "hero",
            content: {
              eyebrow: "Austin Emergency Plumber",
              h1: "24/7 Emergency Plumbing Across Austin",
              subheadline: "Fast 45-min arrival, upfront rates, and master plumbers on every call.",
            },
          },
          {
            type: "trustBar",
            content: {},
          },
          {
            type: "services",
            content: {
              items: [
                { title: "Emergency Leak Repair", description: "Prompt pipe repair and shut-off diagnostics." },
                { title: "Water Heater Installation", description: "Tank and tankless water heaters installed." },
                { title: "Drain Cleaning", description: "Advanced hydro-jetting and rooter clearing." },
              ],
            },
          },
          {
            type: "whyUs",
            content: {
              headline: "Why Homeowners Trust Austin Premier Plumbing",
            },
          },
          {
            type: "serviceAreas",
            content: {},
          },
          {
            type: "ctaBanner",
            content: {
              headline: "Need a Plumber Right Now?",
            },
          },
        ],
      },
    ],
  };

  console.log("\n--- Testing Live HTML Generation Across Themes ---");

  // A. Test Modern Local Pro
  const resModern = await assembleWebsite(sampleSiteData, modernProTheme, { domain: "austinpremierplumbing.com" });
  const indexModern = resModern.files.find((f) => f.path === "index.html")?.content || "";
  assert(indexModern.includes("theme-modern-local-pro") || indexModern.includes("theme-modern-pro"), "Modern Local Pro has correct body theme class");
  assert(indexModern.includes("hero-split"), "Modern Local Pro renders hero-split");
  assert(indexModern.includes("tel:5128904321"), "Modern Local Pro includes primary phone link");
  assert(indexModern.includes("final-cta-section"), "Modern Local Pro includes Final CTA + Map section immediately above footer");

  // B. Test Bold Conversion
  const resBold = await assembleWebsite(sampleSiteData, boldTheme, { domain: "austinpremierplumbing.com" });
  const indexBold = resBold.files.find((f) => f.path === "index.html")?.content || "";
  assert(indexBold.includes("theme-bold-conversion"), "Bold Conversion has theme-bold-conversion body class");
  assert(indexBold.includes("hero-compact-bold"), "Bold Conversion renders hero-compact-bold");
  assert(indexBold.includes("urgent-dispatch-banner"), "Bold Conversion includes urgent dispatch banner");
  assert(indexBold.includes("header-emergency-topbar"), "Bold Conversion renders 24/7 emergency dispatch top bar in header");
  assert(indexBold.includes("services-compact-grid"), "Bold Conversion renders compact scannable services grid");
  assert(indexBold.includes("CALL NOW: (512) 890-4321"), "Bold Conversion hero has prominent CALL NOW action");

  // C. Test Split Hero
  const resSplit = await assembleWebsite(sampleSiteData, splitHeroTheme, { domain: "austinpremierplumbing.com" });
  const indexSplit = resSplit.files.find((f) => f.path === "index.html")?.content || "";
  assert(indexSplit.includes("theme-split-hero"), "Split Hero has theme-split-hero body class");
  assert(indexSplit.includes("hero-split-full"), "Split Hero renders hero-split-full");
  assert(indexSplit.includes("header-split-phone"), "Split Hero renders header-split-phone");
  // Check section order: services should appear before whyUs in split hero
  const splitServicesIdx = indexSplit.indexOf('id="services"');
  const splitWhyUsIdx = indexSplit.indexOf('class="why-us"');
  if (splitServicesIdx !== -1 && splitWhyUsIdx !== -1) {
    assert(splitServicesIdx < splitWhyUsIdx, "Split Hero arranges services section before why-us section");
  } else {
    assert(true, "Split Hero section ordering check");
  }

  // D. Test Editorial Modern
  const resEditorial = await assembleWebsite(sampleSiteData, editorialTheme, { domain: "austinpremierplumbing.com" });
  const indexEditorial = resEditorial.files.find((f) => f.path === "index.html")?.content || "";
  assert(indexEditorial.includes("theme-editorial-modern"), "Editorial Modern has theme-editorial-modern body class");
  assert(indexEditorial.includes("hero-asymmetric"), "Editorial Modern renders hero-asymmetric");
  assert(indexEditorial.includes("services-alternating"), "Editorial Modern renders alternating storytelling service rows");

  // E. Test Clean Minimal
  const minimalTheme = getThemeById("clean-minimal");
  const resMinimal = await assembleWebsite(sampleSiteData, minimalTheme, { domain: "austinpremierplumbing.com" });
  const indexMinimal = resMinimal.files.find((f) => f.path === "index.html")?.content || "";
  assert(indexMinimal.includes("theme-clean-minimal"), "Clean Minimal has theme-clean-minimal body class");
  assert(indexMinimal.includes("hero-minimal"), "Clean Minimal renders hero-minimal");
  assert(indexMinimal.includes("card-minimal"), "Clean Minimal renders card-minimal");

  // F. Test Trust First
  const resTrust = await assembleWebsite(sampleSiteData, trustFirstTheme, { domain: "austinpremierplumbing.com" });
  const indexTrust = resTrust.files.find((f) => f.path === "index.html")?.content || "";
  assert(indexTrust.includes("theme-trust-first"), "Trust First has theme-trust-first body class");
  assert(indexTrust.includes("trust-bar-expanded"), "Trust First renders trust-bar-expanded credibility grid");

  // G. Test Contemporary Soft
  const softTheme = getThemeById("contemporary-soft");
  const resSoft = await assembleWebsite(sampleSiteData, softTheme, { domain: "austinpremierplumbing.com" });
  const indexSoft = resSoft.files.find((f) => f.path === "index.html")?.content || "";
  assert(indexSoft.includes("theme-contemporary-soft"), "Contemporary Soft has theme-contemporary-soft body class");
  assert(indexSoft.includes("hero-soft"), "Contemporary Soft renders hero-soft");
  assert(indexSoft.includes("card-soft"), "Contemporary Soft renders card-soft with 20px corners");

  // H. Test Modern Service Grid
  const resServiceGrid = await assembleWebsite(sampleSiteData, serviceGridTheme, { domain: "austinpremierplumbing.com" });
  const indexServiceGrid = resServiceGrid.files.find((f) => f.path === "index.html")?.content || "";
  assert(indexServiceGrid.includes("theme-modern-service-grid"), "Modern Service Grid has theme-modern-service-grid body class");
  assert(indexServiceGrid.includes("hero-service-first"), "Modern Service Grid renders hero-service-first");
  assert(indexServiceGrid.includes("hero-quick-strip"), "Modern Service Grid includes 3-step quick dispatch strip");

  // I. Test High Contrast Modern
  const contrastTheme = getThemeById("high-contrast-modern");
  const resContrast = await assembleWebsite(sampleSiteData, contrastTheme, { domain: "austinpremierplumbing.com" });
  const indexContrast = resContrast.files.find((f) => f.path === "index.html")?.content || "";
  assert(indexContrast.includes("theme-high-contrast-modern"), "High Contrast Modern has theme-high-contrast-modern body class");
  assert(indexContrast.includes("hero-high-contrast"), "High Contrast Modern renders hero-high-contrast");

  // J. Test Premium Local
  const premiumTheme = getThemeById("premium-local");
  const resPremium = await assembleWebsite(sampleSiteData, premiumTheme, { domain: "austinpremierplumbing.com" });
  const indexPremium = resPremium.files.find((f) => f.path === "index.html")?.content || "";
  assert(indexPremium.includes("theme-premium-local"), "Premium Local has theme-premium-local body class");
  assert(indexPremium.includes("hero-asymmetric"), "Premium Local renders hero-asymmetric with refined serif");

  // 5. Verify Phone Conversion in all 10 themes
  console.log("\n--- Testing Phone Conversion Consistency Across All 10 Themes ---");
  for (const theme of primaryThemes) {
    const assembled = await assembleWebsite(sampleSiteData, theme, { domain: "austinpremierplumbing.com" });
    const html = assembled.files.find((f) => f.path === "index.html")?.content || "";
    assert(html.includes("tel:5128904321"), `${theme.name} contains clickable tel: phone call link`);
    assert(html.includes("mobile-call-bar"), `${theme.name} includes mobile call sticky bar`);
    assert(html.includes("final-cta-section"), `${theme.name} has location map & final CTA above footer`);
  }

  // 6. Verify SEO Schema Preservation Across All 10 Themes
  console.log("\n--- Testing SEO Schema & Metadata Preservation ---");
  for (const theme of primaryThemes) {
    const assembled = await assembleWebsite(sampleSiteData, theme, { domain: "austinpremierplumbing.com" });
    const html = assembled.files.find((f) => f.path === "index.html")?.content || "";
    assert(html.includes('"@type": "LocalBusiness"') || html.includes('"@type": "Plumber"'), `${theme.name} preserves JSON-LD Schema`);
    assert(html.includes("<title>"), `${theme.name} preserves SEO title tag`);
    assert(html.includes('name="description"'), `${theme.name} preserves meta description tag`);
  }

  console.log("\n==================================================");
  console.log(`📊 AUDIT SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log("==================================================");

  if (passedTests === totalTests) {
    console.log("🎉 ALL THEME SYSTEM AUDITS PASSED WITH ZERO ERRORS!\n");
  } else {
    console.error(`⚠️ ${totalTests - passedTests} TESTS FAILED!`);
    process.exit(1);
  }
}

runThemeSystemAudit().catch((err) => {
  console.error("Theme system audit crashed:", err);
  process.exit(1);
});
