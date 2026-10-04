/**
 * Verification of all 8 Archetype Generators & Blueprint Integration
 */

import {
  generatePageContent,
  generateSiteContentFromBlueprint,
  PageGenerationContext,
  VerifiedBusinessFacts,
} from "../lib/generator/content-generators";
import { createSiteBlueprint } from "../lib/blueprint/site-blueprint";

async function runArchetypeVerification() {
  console.log("==================================================================");
  console.log("VERIFYING ALL 8 PAGE ARCHETYPES...");
  console.log("==================================================================");

  const facts: VerifiedBusinessFacts = {
    businessName: "Chicago Master Plumbing Pros",
    trade: "Plumbing",
    city: "Chicago",
    state: "Illinois",
    phone: "(312) 555-0199",
    streetAddress: "123 N Michigan Ave",
    yearsInBusiness: "15+",
    licenseNumber: "IL-LIC-748291",
    emergency247: true,
    freeEstimates: true,
    insuredBonded: true,
  };

  const archetypes = [
    { type: "home", title: "Homepage", keyword: "Chicago Plumber" },
    { type: "service", title: "Water Heater Repair", keyword: "Water Heater Repair Chicago" },
    { type: "location", title: "Chicago Location Page", keyword: "Plumber in Chicago, IL" },
    { type: "service_location", title: "Water Heater Repair in Chicago", keyword: "Water Heater Repair in Chicago, IL" },
    { type: "about", title: "About Us", keyword: "About Chicago Master Plumbing Pros" },
    { type: "contact", title: "Contact Us", keyword: "Contact Chicago Plumber" },
    { type: "faq", title: "FAQ", keyword: "Chicago Plumbing FAQ" },
    { type: "blog", title: "Blog Post", keyword: "Why Is My Water Heater Rumbling?" },
  ] as const;

  for (const arch of archetypes) {
    const ctx: PageGenerationContext = {
      pageType: arch.type,
      pagePurpose: `Dedicated generator test for ${arch.title}`,
      primaryKeyword: arch.keyword,
      secondaryKeywords: [],
      searchIntent: "commercial",
      service: arch.type.includes("service") ? { name: "Water Heater Repair", slug: "water-heater-repair" } : undefined,
      location: { city: "Chicago", state: "Illinois", neighborhoods: ["Lincoln Park", "Loop"] },
      relatedServices: [{ name: "Drain Cleaning", slug: "drain-cleaning" }],
      relatedLocations: [{ name: "Naperville", slug: "naperville" }],
      internalLinkTargets: [{ label: "Home", href: "index.html", role: "hub" }],
      contentVariationSeed: { siteSeed: "CHI-PLUMBING-483921", pageSeed: `seed-${arch.type}` },
      businessFacts: facts,
    };

    const res = await generatePageContent(ctx);
    console.log(`✅ [ARCHETYPE: ${arch.type.padEnd(16)}] -> Slug: ${res.slug.padEnd(25)} | H1: ${res.seo.h1}`);
    if (!res.sections || res.sections.length === 0) {
      throw new Error(`Archetype ${arch.type} returned empty sections!`);
    }
  }

  console.log("\n==================================================================");
  console.log("VERIFYING BLUEPRINT -> SITE GENERATOR ORCHESTRATION...");
  console.log("==================================================================");

  const blueprint = createSiteBlueprint({
    businessName: "Chicago Master Plumbing Pros",
    niche: "Plumbing",
    primaryCity: "Chicago",
    state: "Illinois",
    services: ["Water Heater Repair", "Drain Cleaning", "Leak Detection"],
    locations: ["Lincoln Park", "Loop", "Evanston"],
    phone: "(312) 555-0199",
  });

  const fullSite = await generateSiteContentFromBlueprint(blueprint, facts);
  console.log(`✅ Generated full site: "${fullSite.site.businessName}"`);
  console.log(`✅ Total pages generated: ${fullSite.pages.length}`);
  fullSite.pages.forEach((p, idx) => {
    console.log(`   ${idx + 1}. [${p.slug}] - ${p.seo.title.slice(0, 60)}...`);
  });

  console.log("\nALL 8 ARCHETYPES AND BLUEPRINT INTEGRATION PASSED!");
}

runArchetypeVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
