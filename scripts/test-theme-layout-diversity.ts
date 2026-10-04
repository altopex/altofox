import { getThemeById } from "../lib/themes";
import { assembleWebsite } from "../templates/assembler";
import { resolveThemeLayoutStructure, hashSeedToInt } from "../templates/layouts";
import { SiteContentJSON } from "../lib/generator/content-schema";
import { SiteBlueprint } from "../lib/blueprint/site-blueprint";

function buildSamplePlumbingContent(siteName: string, city: string): SiteContentJSON {
  return {
    site: {
      businessName: siteName,
      tagline: "Licensed & Master Plumbers Serving Chicago",
      phone: "(312) 555-0199",
      email: "dispatch@chicagoplumbingpros.com",
      address: {
        street: "123 N Michigan Ave",
        city: city,
        state: "IL",
        zip: "60601",
      },
      serviceAreas: ["Downtown", "Lincoln Park", "Wicker Park", "Lakeview", "Logan Square"],
      licenseNumber: "IL-PL-058-291",
      yearsInBusiness: "15+",
      warrantyGuarantee: "100% Satisfaction Guarantee",
      emergency247: true,
      freeEstimates: true,
      insuredBonded: true,
      realReviewsConfirmed: true,
      realReviews: [
        {
          author: "Marcus T.",
          rating: 5,
          text: "Water heater burst on Sunday morning. They dispatched a master technician within 35 minutes and fixed the issue with zero surprise charges.",
          source: "Google",
          date: "3 weeks ago",
        },
        {
          author: "Elena R.",
          rating: 5,
          text: "Transparent upfront flat pricing and spotless cleanup. Best plumbing experience we have had in Lincoln Park.",
          source: "Google",
          date: "1 month ago",
        },
      ],
    },
    schema: {
      type: "Plumber",
    },
    pages: [
      {
        slug: "index.html",
        seo: {
          title: `24/7 Emergency Plumber in ${city} | ${siteName}`,
          description: `Fast, licensed plumbing repairs, drain cleaning, and water heater service in ${city}. Call for 24/7 immediate local dispatch.`,
          h1: `Expert Local Plumbing Services in ${city}`,
        },
        sections: [
          { type: "emergencyBanner", variant: "default" },
          {
            type: "hero",
            variant: "default",
            content: {
              eyebrow: "Licensed Chicago Master Plumbers",
              h1: `24/7 Rapid Plumbing Solutions in ${city}`,
              subheadline: "Prompt dispatch, upfront flat rates, and fully warranted workmanship.",
              primaryCta: "(312) 555-0199",
              secondaryCta: "Request Service",
            },
          },
          { type: "trustBar", variant: "default" },
          {
            type: "services",
            variant: "default",
            content: {
              eyebrow: "Our Specialties",
              headline: "Complete Plumbing Solutions",
              subheadline: "From minor leaks to whole-home repiping and emergency drain restoration.",
              items: [
                { title: "Water Heater Repair & Replacement", description: "Tank and tankless repairs, diagnostics, and high-efficiency installations.", slug: "water-heater-repair" },
                { title: "Drain Cleaning & Hydro-Jetting", description: "High-pressure clearing of severe clogs, root intrusion, and main sewer lines.", slug: "drain-cleaning" },
                { title: "Slab Leak & Hidden Pipe Detection", description: "Non-invasive electronic acoustic acoustic detection and pipe restoration.", slug: "leak-detection" },
                { title: "Emergency Pipe & Burst Line Repair", description: "Immediate shut-off triage and copper pipe replacement.", slug: "pipe-repair" },
              ],
            },
          },
          { type: "whyUs", variant: "default" },
          {
            type: "process",
            variant: "default",
            content: {
              eyebrow: "Seamless Execution",
              headline: "How We Handle Your Plumbing Call",
              subheadline: "3 straightforward steps from first call to completed repair.",
              steps: [
                { number: "01", title: "Instant Dispatch", description: "Call our 24/7 desk to schedule a rapid technician arrival." },
                { number: "02", title: "Diagnostic & Flat Rate", description: "We assess the issue with cameras and provide upfront pricing." },
                { number: "03", title: "Precision Repair", description: "Work completed cleanly with written warranty protection." },
              ],
            },
          },
          {
            type: "testimonials",
            variant: "default",
            content: {
              eyebrow: "Customer Feedback",
              headline: "What Chicago Neighbors Say",
              subheadline: "Direct verified feedback from local homeowners.",
            },
          },
          {
            type: "faq",
            variant: "default",
            content: {
              eyebrow: "Helpful Answers",
              headline: "Plumbing FAQ",
              subheadline: "Common questions about our pricing and dispatch times.",
              items: [
                { question: "How quickly can a plumber arrive?", answer: "Our mobile vans are stationed across Chicago with average arrival times under 45 minutes." },
                { question: "Do you charge extra for weekends or holidays?", answer: "No. We provide clear, flat-rate upfront pricing with zero unexpected fees." },
                { question: "Are your plumbers licensed and background-checked?", answer: "Yes, 100% of technicians carry state master or journeyman licenses." },
              ],
            },
          },
          {
            type: "ctaBanner",
            variant: "default",
            content: {
              headline: "Have a Plumbing Emergency in Chicago?",
              text: "Speak directly with an on-duty master technician for immediate dispatch.",
              buttonText: "Call (312) 555-0199",
            },
          },
        ],
      },
    ],
  };
}

async function runDiversityTest() {
  console.log("===============================================================================");
  console.log("THEME & LAYOUT ARCHITECTURE DIVERSITY TEST");
  console.log("Objective: Verify that 2 websites using the SAME theme have substantially different");
  console.log("layouts while strictly preserving the same design tokens & professional brand identity.");
  console.log("===============================================================================\n");

  // Choose Theme: 'pipe-and-wrench' (also aliases 'forge')
  const theme = getThemeById("forge");
  console.log(`Selected Theme: ${theme.name} (id: ${theme.id})`);
  console.log(`Theme Colors: Primary: ${theme.colors.primary}, Secondary: ${theme.colors.secondary}, Accent: ${theme.colors.accent}`);
  console.log(`Theme Fonts: Heading: ${theme.fonts.heading}, Body: ${theme.fonts.body}`);
  console.log(`Theme Radius: ${theme.borderRadius}\n`);

  // Site 1: Seed A (Conversion-Direct archetype)
  const seedA = "CHI-PLUMBING-CONVERT-101";
  const siteAData = buildSamplePlumbingContent("Windy City Master Plumbers", "Chicago");
  const blueprintA: SiteBlueprint = {
    siteSeed: seedA,
    niche: "plumbing",
    primaryCity: "Chicago",
    state: "IL",
    businessName: siteAData.site.businessName,
    businessDescription: "Premier plumbing service in Chicago",
    primaryService: "Emergency Plumbing",
    services: [
      { name: "Water Heater Repair", slug: "water-heater-repair", description: "Water heater repair" },
      { name: "Drain Cleaning", slug: "drain-cleaning", description: "Drain cleaning" },
    ],
    locations: [{ city: "Chicago", state: "IL", county: "Cook County", slug: "chicago-il" }],
    keywords: ["plumber chicago"],
    phone: siteAData.site.phone,
    theme: theme.id,
    layoutFamily: "conversion-direct",
    pageTypes: ["home", "service", "location"],
    pageCount: 3,
    internalLinkingStrategy: "hub-and-spoke",
    imageStrategy: "trade-contextual",
    contentVariationSeed: "VAR-A-9921",
  };

  // Site 2: Seed B (Craftsmanship-Editorial archetype)
  const seedB = "CHI-PLUMBING-CRAFT-202";
  const siteBData = buildSamplePlumbingContent("Heritage Pipe & Fixture Co.", "Chicago");
  const blueprintB: SiteBlueprint = {
    siteSeed: seedB,
    niche: "plumbing",
    primaryCity: "Chicago",
    state: "IL",
    businessName: siteBData.site.businessName,
    businessDescription: "Master craftsmanship plumbing in Chicago",
    primaryService: "Architectural Plumbing",
    services: [
      { name: "Water Heater Repair", slug: "water-heater-repair", description: "Water heater repair" },
      { name: "Drain Cleaning", slug: "drain-cleaning", description: "Drain cleaning" },
    ],
    locations: [{ city: "Chicago", state: "IL", county: "Cook County", slug: "chicago-il" }],
    keywords: ["plumber chicago"],
    phone: siteBData.site.phone,
    theme: theme.id,
    layoutFamily: "craftsmanship-editorial",
    pageTypes: ["home", "service", "location"],
    pageCount: 3,
    internalLinkingStrategy: "hub-and-spoke",
    imageStrategy: "trade-contextual",
    contentVariationSeed: "VAR-B-3381",
  };

  // 1. Resolve Layout Structures
  const resolvedA = resolveThemeLayoutStructure(theme, seedA, blueprintA.layoutFamily);
  const resolvedB = resolveThemeLayoutStructure(theme, seedB, blueprintB.layoutFamily);

  console.log("--- RESOLVED 4-TIER HIERARCHY COMPARISON ---");
  console.log(`[Site A]`);
  console.log(`  Seed:           ${seedA}`);
  console.log(`  Layout Family:  ${resolvedA.layoutFamilyName} (${resolvedA.layoutFamily})`);
  console.log(`  Hero Variant:   ${resolvedA.heroVariant}`);
  console.log(`  Services:       ${resolvedA.servicesVariant}`);
  console.log(`  Trust Bar:      ${resolvedA.trustVariant}`);
  console.log(`  Process:        ${resolvedA.processVariant}`);
  console.log(`  Reviews:        ${resolvedA.reviewsVariant}`);
  console.log(`  FAQ:            ${resolvedA.faqVariant}`);
  console.log(`  CTA:            ${resolvedA.ctaVariant}`);
  console.log(`  Header:         ${resolvedA.headerVariant}`);
  console.log(`  Footer:         ${resolvedA.footerVariant}`);
  console.log(`  Section Order:  ${resolvedA.sectionOrder.join(" -> ")}`);
  console.log();

  console.log(`[Site B]`);
  console.log(`  Seed:           ${seedB}`);
  console.log(`  Layout Family:  ${resolvedB.layoutFamilyName} (${resolvedB.layoutFamily})`);
  console.log(`  Hero Variant:   ${resolvedB.heroVariant}`);
  console.log(`  Services:       ${resolvedB.servicesVariant}`);
  console.log(`  Trust Bar:      ${resolvedB.trustVariant}`);
  console.log(`  Process:        ${resolvedB.processVariant}`);
  console.log(`  Reviews:        ${resolvedB.reviewsVariant}`);
  console.log(`  FAQ:            ${resolvedB.faqVariant}`);
  console.log(`  CTA:            ${resolvedB.ctaVariant}`);
  console.log(`  Header:         ${resolvedB.headerVariant}`);
  console.log(`  Footer:         ${resolvedB.footerVariant}`);
  console.log(`  Section Order:  ${resolvedB.sectionOrder.join(" -> ")}`);
  console.log();

  // 2. Assemble both websites
  console.log("Assembling Site A HTML...");
  const siteA = await assembleWebsite(siteAData, theme, { blueprint: blueprintA, fastOfflinePreview: true });
  console.log("Assembling Site B HTML...");
  const siteB = await assembleWebsite(siteBData, theme, { blueprint: blueprintB, fastOfflinePreview: true });

  const htmlA = siteA.files.find((f) => f.path === "index.html")?.content || "";
  const htmlB = siteB.files.find((f) => f.path === "index.html")?.content || "";
  const cssA = siteA.files.find((f) => f.path === "css/style.css")?.content || "";
  const cssB = siteB.files.find((f) => f.path === "css/style.css")?.content || "";

  console.log("\n--- STRUCTURAL VERIFICATION ---");

  // Check 1: Hero Structure Difference
  const heroIsDifferent = resolvedA.heroVariant !== resolvedB.heroVariant;
  const heroAClass = htmlA.includes("hero-compact-bold") ? "hero-compact-bold" : (htmlA.includes("hero-asymmetric") ? "hero-asymmetric" : "hero-split");
  const heroBClass = htmlB.includes("hero-asymmetric") ? "hero-asymmetric" : (htmlB.includes("hero-compact-bold") ? "hero-compact-bold" : "hero-split");
  console.log(`1. Hero Structure Different:   ${heroIsDifferent ? "✅ PASS" : "❌ FAIL"} (Site A: ${heroAClass} vs Site B: ${heroBClass})`);

  // Check 2: Service Layout Difference
  const servicesAreDifferent = resolvedA.servicesVariant !== resolvedB.servicesVariant;
  const servAClass = htmlA.includes("services-alternating") ? "services-alternating" : (htmlA.includes("services-compact-grid") ? "services-compact-grid" : "services-grid");
  const servBClass = htmlB.includes("services-alternating") ? "services-alternating" : (htmlB.includes("services-compact-grid") ? "services-compact-grid" : "services-grid");
  console.log(`2. Services Layout Different: ${servicesAreDifferent ? "✅ PASS" : "❌ FAIL"} (Site A: ${servAClass} vs Site B: ${servBClass})`);

  // Check 3: CTA Structure Difference
  const ctaIsDifferent = resolvedA.ctaVariant !== resolvedB.ctaVariant;
  const ctaAClass = htmlA.includes("final-cta-section") ? "final-cta-section (map)" : (htmlA.includes("variant-split-phone") ? "variant-split-phone" : "variant-gradient");
  const ctaBClass = htmlB.includes("variant-split-phone") ? "variant-split-phone" : (htmlB.includes("final-cta-section") ? "final-cta-section (map)" : "variant-gradient");
  console.log(`3. CTA Structure Different:    ${ctaIsDifferent ? "✅ PASS" : "❌ FAIL"} (Site A: ${ctaAClass} vs Site B: ${ctaBClass})`);

  // Check 4: Process Structure Difference
  const processIsDifferent = resolvedA.processVariant !== resolvedB.processVariant;
  const procAClass = htmlA.includes("process-timeline") ? "process-timeline" : "process-grid";
  const procBClass = htmlB.includes("process-timeline") ? "process-timeline" : "process-grid";
  console.log(`4. Process Layout Different:  ${processIsDifferent ? "✅ PASS" : "❌ FAIL"} (Site A: ${procAClass} vs Site B: ${procBClass})`);

  // Check 5: Section Ordering Difference
  const orderA = resolvedA.sectionOrder.slice(0, 5).join(" -> ");
  const orderB = resolvedB.sectionOrder.slice(0, 5).join(" -> ");
  const orderIsDifferent = orderA !== orderB;
  console.log(`5. Section Order Different:    ${orderIsDifferent ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`   Site A First 5: [${orderA}]`);
  console.log(`   Site B First 5: [${orderB}]`);

  // Check 6: Design Tokens Consistency (Same Theme)
  const colorsMatch = cssA.includes(`--color-primary: ${theme.colors.primary}`) && cssB.includes(`--color-primary: ${theme.colors.primary}`);
  const fontsMatch = cssA.includes(`'${theme.fonts.heading}'`) && cssB.includes(`'${theme.fonts.heading}'`);
  const radiusMatch = cssA.includes(`--radius: ${theme.borderRadius}`) && cssB.includes(`--radius: ${theme.borderRadius}`);
  const designTokensIdentical = colorsMatch && fontsMatch && radiusMatch;
  console.log(`6. Same Design Language:      ${designTokensIdentical ? "✅ PASS" : "❌ FAIL"} (Shared Oswald font, ${theme.colors.primary} copper color, ${theme.borderRadius} radius)`);

  console.log("\n--- PART 2: AUTOMATIC SEED-ONLY LAYOUT RESOLUTION ---");
  console.log("Testing 2 sites with same theme 'pipe-and-wrench' using ONLY site seeds (no layoutFamily passed):");
  const autoResolvedA = resolveThemeLayoutStructure(theme, "SEED-3"); // Index 0 -> conversion-direct
  const autoResolvedB = resolveThemeLayoutStructure(theme, "SEED-1"); // Index 1 -> craftsmanship-editorial
  console.log(`Site A ("SEED-3") -> Family: ${autoResolvedA.layoutFamily} | Hero: ${autoResolvedA.heroVariant} | Services: ${autoResolvedA.servicesVariant} | CTA: ${autoResolvedA.ctaVariant}`);
  console.log(`Site B ("SEED-1") -> Family: ${autoResolvedB.layoutFamily} | Hero: ${autoResolvedB.heroVariant} | Services: ${autoResolvedB.servicesVariant} | CTA: ${autoResolvedB.ctaVariant}`);
  const autoPass = autoResolvedA.layoutFamily !== autoResolvedB.layoutFamily &&
                    autoResolvedA.heroVariant !== autoResolvedB.heroVariant &&
                    autoResolvedA.servicesVariant !== autoResolvedB.servicesVariant;
  console.log(`Automatic Seed Selection: ${autoPass ? "✅ PASS" : "❌ FAIL"}`);

  console.log("\n===============================================================================");
  if (heroIsDifferent && servicesAreDifferent && ctaIsDifferent && processIsDifferent && orderIsDifferent && designTokensIdentical && autoPass) {
    console.log("🎉 ALL THEME & LAYOUT ARCHITECTURE DIVERSITY CRITERIA MET SUCCESSFULLY!");
  } else {
    console.error("❌ DIVERSITY TEST FAILED ONE OR MORE CRITERIA");
    process.exit(1);
  }
  console.log("===============================================================================");
}

runDiversityTest().catch((err) => {
  console.error("Unhandled error in test:", err);
  process.exit(1);
});
