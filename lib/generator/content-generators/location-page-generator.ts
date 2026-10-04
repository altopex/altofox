/**
 * RankLocal Content Generation Architecture — Location Page Generator
 *
 * Archetype: Location Page (e.g., Chicago location page or secondary service area cities)
 * Purpose: Deep local authority landing page establishing local proximity, neighborhood
 *          dispatch zones, regional climate factors (freeze-thaw cycles, lakefront wind chill),
 *          local housing architecture (bungalows, greystones, vintage stacks), and municipal
 *          code compliance.
 *          NEVER simply swaps city names; embeds authentic local plumbing knowledge.
 */

import { PageGenerationContext } from "./types";
import { PageContentJSON, SectionJSON } from "../content-schema";
import { createVariationProfile, VariationProfile } from "./variation-seed";
import { gatewayRequest, GatewayRequest } from "../../ai/provider-gateway";
import { extractAndParseJSON } from "../validator";

/**
 * Builds a dedicated, specialized LLM prompt for the Location Page.
 * NEVER uses a universal prompt.
 */
export function buildLocationPagePrompt(context: PageGenerationContext): string {
  const facts = context.businessFacts;
  const loc = context.location || {
    city: facts.city,
    state: facts.state,
    neighborhoods: ["Lincoln Park", "Loop", "Logan Square", "Lakeview", "West Loop"],
  };
  const seed = context.contentVariationSeed;
  const variation = createVariationProfile(seed, "location", context.primaryKeyword);

  const internalLinksJson = JSON.stringify(
    context.internalLinkTargets.map((t) => ({ label: t.label, href: t.href, role: t.role })),
    null,
    2
  );

  return `You are a master local SEO copywriter creating a DEDICATED LOCATION LANDING PAGE for "${loc.city}, ${loc.state}" for "${facts.businessName}".

CRITICAL SCOPE: Generate ONLY the "${loc.city}" location landing page. Do NOT generate other pages.

PAGE CONTEXT CONTRACT:
- Page Type: location
- Page Purpose: Establish authentic local proximity, rapid dispatch zones across ${loc.city} neighborhoods, and explain how the team addresses local architectural infrastructure (vintage bungalows, multi-story greystones) and local winter climate conditions.
- Primary Keyword: "${context.primaryKeyword}"
- Secondary Keywords: ${JSON.stringify(context.secondaryKeywords)}
- Search Intent: ${context.searchIntent} (High local navigational & transactional)
- Target City: ${loc.city}, ${loc.state}
- County: ${loc.county || "Cook County"}
- Neighborhoods: ${(loc.neighborhoods || []).join(", ") || "Metro area"}
- Sibling Service Areas to Link: ${context.relatedLocations.map((l) => l.name).join(", ")}
- Services Provided in Area: ${context.relatedServices.map((s) => s.name).join(", ")}
- Variation Seed Digest: ${variation.seedDigest}
- Desired Heading Style: ${variation.headingStyle}
- CTA Theme: "${variation.ctaWording.heroPrimary}"
- Required Internal Link Targets:
${internalLinksJson}

LOCAL COMMUNITY & INFRASTRUCTURE TOPICS TO WEAVE IN:
- Local Housing Stock: Historic brick bungalows, two-flats, and greystones with aging cast-iron soil stacks.
- Winter Weather Protection: Sub-zero freeze-thaw cycles, exterior wall pipe insulation, and emergency burst pipe response.
- Municipal Compliance: City of ${loc.city} Department of Water Management code compliance and licensed permit acquisition.
- Neighborhood Dispatch: Average dispatch window under 45 minutes across primary neighborhood hubs.

STRICT TRUTHFULNESS & ANTI-HALLUCINATION:
1. NEVER invent fake customer reviews, ratings, or quotes.
2. NEVER invent fake business addresses or unverified storefronts.
3. Keep claims grounded in verified facts: Phone ${facts.phone}, 24/7 emergency dispatch if verified, upfront flat-rate estimates.

OUTPUT FORMAT:
Return ONLY a valid JSON object matching this schema:
{
  "slug": "plumbing-${loc.city.toLowerCase().replace(/[^a-z0-9]+/g, "-")}",
  "seo": {
    "title": "${context.primaryKeyword} in ${loc.city}, ${loc.state} | ${facts.businessName}",
    "description": "Meta description under 155 chars with city and call to action.",
    "h1": "Trusted Local ${facts.trade} in ${loc.city}, ${loc.state}",
    "primaryKeyword": "${context.primaryKeyword}"
  },
  "sections": [
    { "type": "hero", "variant": "split", "content": { "eyebrow": "Local ${loc.city} Dispatch Fleet", "h1": "...", "subheadline": "...", "primaryCta": "${facts.phone}", "secondaryCta": "Check Service Area", "secondaryUrl": "contact.html", "trustBadges": [...] } },
    { "type": "trustBar", "content": {} },
    { "type": "whyUs", "content": { "eyebrow": "Community Expertise", "headline": "...", "subheadline": "...", "items": [...] } },
    { "type": "services", "variant": "cards", "content": { "eyebrow": "Local Capabilities", "headline": "...", "subheadline": "...", "items": [...] } },
    { "type": "process", "content": { "eyebrow": "Rapid Dispatch Workflow", "headline": "...", "subheadline": "...", "steps": [...] } },
    { "type": "serviceAreas", "content": { "eyebrow": "Neighborhood Coverage", "headline": "...", "subheadline": "...", "cities": [...] } },
    { "type": "faq", "content": { "eyebrow": "Local FAQs", "headline": "...", "subheadline": "...", "items": [...] } },
    { "type": "ctaBanner", "content": { "headline": "...", "subheadline": "...", "buttonText": "Call ${facts.phone}", "phone": "${facts.phone}" } },
    { "type": "contactForm", "content": { "headline": "Request Service in ${loc.city}", "subheadline": "...", "phone": "${facts.phone}" } }
  ]
}`;
}

/**
 * Deterministic Location Page Generator driven by the Seed Engine.
 * Tailors content to regional climate, architecture, and neighborhood dispatch.
 */
export function generateLocationPageDeterministic(context: PageGenerationContext): PageContentJSON {
  const facts = context.businessFacts;
  const loc = context.location || {
    city: facts.city || "Chicago",
    state: facts.state || "IL",
    neighborhoods: ["Lincoln Park", "Loop", "Logan Square", "Lakeview", "West Loop"],
    county: "Cook County",
  };
  const variation: VariationProfile = createVariationProfile(
    context.contentVariationSeed,
    "location",
    context.primaryKeyword
  );

  const phone = facts.phone || "(312) 555-0199";
  const city = loc.city;
  const state = loc.state;
  const trade = facts.trade || "Plumbing";
  const neighborhoods = loc.neighborhoods && loc.neighborhoods.length > 0
    ? loc.neighborhoods
    : ["Downtown", "North Side", "West Side", "South Side"];

  // Trust badges
  const trustBadges: string[] = [];
  if (facts.licenseNumber) trustBadges.push(`Lic. #${facts.licenseNumber}`);
  else trustBadges.push("Locally Licensed Master Technicians");
  trustBadges.push(`${city} Neighborhood Dispatch`);
  if (facts.emergency247) trustBadges.push("24/7 Priority Emergency Coverage");
  else trustBadges.push("Same-Day Dispatch Windows");
  trustBadges.push("Upfront Written Pricing");

  const isDirectoryHub =
    context.pagePurpose?.toLowerCase().includes("directory") ||
    context.primaryKeyword?.toLowerCase().includes("service area") ||
    context.primaryKeyword?.toLowerCase().includes("service-area") ||
    (context.service?.name && context.service.name.toLowerCase().includes("service area")) ||
    city.toLowerCase() === "service-areas";

  let heroH1 = `${trade} Services in ${city}, ${state}`;
  let heroSub = `Rapid local dispatch across ${city} neighborhoods. Our licensed master technicians resolve urgent leaks, drain clogs, and water heater breakdowns with upfront flat rates.`;

  if (isDirectoryHub) {
    heroH1 = `Service Areas & Regional Dispatch Network in Greater ${city}`;
    heroSub = `Explore our comprehensive multi-zone dispatch network across ${city} and surrounding municipal districts. Review neighborhood coverage, arrival windows, and licensed master credentials.`;
  } else if (variation.headingStyle === "action_benefit") {
    heroH1 = `Reliable Local ${trade} Solutions for ${city} Homeowners`;
    heroSub = `Protect your ${city} property from costly plumbing failures with master-certified workmanship, upfront flat rates, and verified warranties.`;
  } else if (variation.headingStyle === "diagnostic_urgency") {
    heroH1 = `Emergency ${trade} Dispatch in ${city}, ${state}`;
    heroSub = `Plumbing breakdown in ${city}? Our mobile response units are stationed throughout local neighborhood corridors for immediate on-site diagnostic triage.`;
  } else if (variation.headingStyle === "craftsmanship_authority") {
    heroH1 = `${city}'s Dedicated Master ${trade} Craftsmen`;
    heroSub = `Specialized mechanical plumbing services for historic brick bungalows, greystones, and modern residential developments across ${city}.`;
  } else if (variation.headingStyle === "problem_resolution") {
    heroH1 = `Precision ${trade} Repairs for ${city} Properties`;
    heroSub = `Permanent, code-compliant solutions for aging cast-iron soil stacks, frozen supply lines, and stubborn sewer lateral blockages in ${city}.`;
  }

  // Localized community reasons whyUs
  let whyUsItems = isDirectoryHub
    ? [
        {
          title: "Multi-Zone Fleet Distribution",
          description: `Our service units are strategically staged across multiple municipal hubs, ensuring rapid arrival windows and minimal response delays throughout ${city}.`,
        },
        {
          title: "Standardized Regional Flat-Rate Pricing",
          description: `Homeowners across all serviced municipalities receive identical transparent flat-rate pricing with zero additional distance or fuel surcharges.`,
        },
        {
          title: "Multi-Jurisdiction Code Compliance",
          description: `Our master technicians maintain full licensing and permitting credentials across Cook County and all neighboring regional building departments.`,
        },
        {
          title: "24/7 Coordinated Central Dispatch",
          description: `Our round-the-clock emergency operations triage incoming calls to deploy the closest available certified specialist immediately.`,
        },
      ]
    : [
        {
          title: `Intimate Familiarity with ${city} Housing Stock`,
          description: `From historic Chicago brick bungalows with cast-iron stacks to modern high-rise condos, our master technicians know the exact piping configurations and local code standards required for lasting repairs.`,
        },
        {
          title: "Sub-Zero Freeze & Thaw Protection",
          description: `During severe winter weather, our technicians provide emergency pipe thawing, burst line repairs, and exterior wall supply line insulation to safeguard your home against flooding.`,
        },
        {
          title: "Department of Water Management Code Compliance",
          description: `All sewer connections, main shutoff replacements, and backflow installations strictly comply with City of ${city} codes and municipal permitting requirements.`,
        },
        {
          title: "Stationed Across Local Neighborhood Hubs",
          description: `Our mobile response fleet is distributed across ${neighborhoods.slice(0, 3).join(", ")}, allowing us to maintain rapid response times when emergencies arise.`,
        },
      ];

  const shift = context.contentVariationSeed.strategyShift || 0;
  if (shift > 0) {
    const rot = shift % whyUsItems.length;
    whyUsItems = [...whyUsItems.slice(rot), ...whyUsItems.slice(0, rot)];
  }

  // Localized service offerings
  const localServiceItems = context.relatedServices.slice(0, 4).map((svc) => ({
    title: `${svc.name} in ${city}`,
    description: `Complete diagnostic testing, parts replacement, and emergency service for ${svc.name.toLowerCase()} tailored to ${city} building conditions.`,
    slug: svc.slug,
  }));

  if (localServiceItems.length === 0) {
    localServiceItems.push(
      { title: `Water Heater Repair in ${city}`, description: "Sediment flush routines, element replacement, and code-compliant installations.", slug: "water-heater-repair" },
      { title: `Drain Cleaning in ${city}`, description: "4,000 PSI hydro-jetting and optical sewer camera inspections.", slug: "drain-cleaning" },
      { title: `Leak Detection in ${city}`, description: "Non-invasive acoustic and thermal imaging locating hidden supply leaks.", slug: "leak-detection" }
    );
  }

  // Local dispatch process
  const processSteps = [
    {
      number: "1",
      title: `Call ${phone} for ${city} Dispatch`,
      description: `Our service coordinators log your diagnostic symptoms and immediately alert the closest mobile technician in your neighborhood corridor.`,
    },
    {
      number: "2",
      title: "On-Site Physical & Code Diagnostic",
      description: `Your technician arrives in a fully equipped service vehicle, inspects the mechanical failure, and issues a written flat-rate quote.`,
    },
    {
      number: "3",
      title: "Code-Compliant Repair & Cleanup",
      description: `We complete repairs using premium OEM parts, verify pressure and flow, and leave your living space clean and spotless.`,
    },
  ];

  // Local FAQs (using Chicago location pool if in Chicago, or variation pool)
  const faqItems = variation.faqSelection.map((f) => ({
    question: f.question,
    answer: f.answer,
  }));

  const bannerHeadline = `Fast ${trade} Dispatch Across All ${city} Neighborhoods`;
  const bannerSub = `Stationed across local community corridors with ${city} code-compliant master technicians for immediate resolution.`;
  const bannerButton = `Call ${phone} for ${city} Dispatch`;

  const cleanSlug = `plumbing-${city.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${state.toLowerCase()}`;

  const sections: SectionJSON[] = [
    {
      type: "hero",
      variant: "split",
      content: {
        eyebrow: `Stationed Across ${city} & Surrounding Communities`,
        h1: heroH1,
        subheadline: heroSub,
        primaryCta: `Call ${phone}`,
        secondaryCta: "Check Dispatch Times",
        secondaryUrl: "contact.html",
        trustBadges,
      },
      images: [
        {
          slot: "main",
          query: `${trade.toLowerCase()} repair master technician working in ${city}`,
          alt: `Licensed ${trade.toLowerCase()} technician providing prompt service in ${city}`,
        },
      ],
    },
    {
      type: "trustBar",
      content: {},
    },
    {
      type: "whyUs",
      content: {
        eyebrow: "Local Neighborhood Proximity",
        headline: `Why ${city} Property Owners Rely on Our Team`,
        subheadline: `True local presence, specialized knowledge of ${city} architectural plumbing, and upfront pricing.`,
        items: whyUsItems,
      },
    },
    {
      type: "services",
      variant: "cards",
      content: {
        eyebrow: "Our Services in This Area",
        headline: `Complete ${trade} Capabilities for ${city} Homes`,
        subheadline: `Every repair is backed by manufacturer warranties and our comprehensive written workmanship guarantee.`,
        items: localServiceItems,
      },
    },
    {
      type: "process",
      content: {
        eyebrow: "Local Response Workflow",
        headline: `How Our ${city} Dispatch Process Works`,
        subheadline: `Structured for fast arrival, accurate diagnostics, and zero hidden surcharges.`,
        steps: processSteps,
      },
    },
    {
      type: "serviceAreas",
      content: {
        eyebrow: "Neighborhoods & Corridors Served",
        headline: `Active Dispatch Zones Across ${city}`,
        subheadline: `Our service units regularly operate across the following local neighborhoods and adjacent districts:`,
        cities: neighborhoods,
      },
    },
    {
      type: "faq",
      content: {
        eyebrow: "Local Area FAQs",
        headline: `Frequently Asked Questions from ${city} Residents`,
        subheadline: `Clear details regarding local building codes, winter freeze preparations, and emergency dispatch windows.`,
        items: faqItems,
      },
    },
    {
      type: "ctaBanner",
      variant: "locationMap",
      content: {
        headline: bannerHeadline,
        subheadline: bannerSub,
        buttonText: bannerButton,
        phone,
      },
    },
    {
      type: "contactForm",
      content: {
        headline: `Contact Our ${city} Plumbing Team`,
        subheadline: `Speak with an on-call master technician at ${phone} or submit an online request.`,
        phone,
      },
    },
  ];

  return {
    slug: cleanSlug,
    seo: {
      title: `${trade} in ${city}, ${state} | ${facts.businessName}`,
      description: `Rapid local ${trade.toLowerCase()} dispatch across ${city}, ${state}. From vintage bungalow stacks to freeze emergency bursts, get upfront flat-rate repairs from local master technicians. Call ${phone}!`.slice(0, 155),
      h1: heroH1,
      primaryKeyword: context.primaryKeyword,
    },
    sections,
  };
}

/**
 * Main Location Page generation orchestrator.
 * Connects to AI Provider Gateway if configured; falls back safely to deterministic generator.
 */
export async function generateLocationPageContent(
  context: PageGenerationContext,
  gatewayParams?: Partial<GatewayRequest>
): Promise<PageContentJSON> {
  if (gatewayParams?.directCredentials?.apiKey) {
    try {
      const prompt = buildLocationPagePrompt(context);
      const res = await gatewayRequest({
        ...gatewayParams,
        prompt,
        systemPrompt: "You are an expert local SEO copywriter. Return ONLY valid JSON.",
        feature: "location-page",
      } as GatewayRequest);

      const parsed: any = extractAndParseJSON(res.text);
      if (parsed && parsed.slug && parsed.seo && Array.isArray(parsed.sections)) {
        return parsed as PageContentJSON;
      }
    } catch (err) {
      console.warn(`[LocationPageGenerator] AI generation failed for ${context.primaryKeyword}, falling back to deterministic seed engine:`, err);
    }
  }

  return generateLocationPageDeterministic(context);
}
