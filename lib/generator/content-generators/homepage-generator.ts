/**
 * RankLocal Content Generation Architecture — Homepage Generator
 *
 * Archetype: Homepage
 * Purpose: Conversion-focused local hub, establishes core brand authority,
 *          triages emergency vs planned service, showcases primary service
 *          offerings with deep internal links, establishes verified trust factors,
 *          presents regional dispatch coverage, and offers clear multi-touchpoint CTAs.
 */

import { PageGenerationContext, GenerationGatewayParams, isPermanentAIError } from "./types";
import { PageContentJSON, SectionJSON } from "../content-schema";
import { createVariationProfile, VariationProfile } from "./variation-seed";
import { gatewayRequest, GatewayRequest } from "../../ai/provider-gateway";
import { extractAndParseJSON } from "../validator";

/**
 * Builds a dedicated, specialized LLM prompt for the Homepage.
 * NEVER uses a universal prompt.
 */
export function buildHomepagePrompt(context: PageGenerationContext): string {
  const facts = context.businessFacts;
  const seed = context.contentVariationSeed;
  const variation = createVariationProfile(seed, "home", context.primaryKeyword);

  const internalLinksJson = JSON.stringify(
    context.internalLinkTargets.map((t) => ({ label: t.label, href: t.href, role: t.role })),
    null,
    2
  );

  return `You are a master local-conversion copywriter creating the HOMEPAGE for "${facts.businessName}".

CRITICAL SCOPE: You are generating ONLY the Homepage. Do NOT generate other pages.

PAGE CONTEXT CONTRACT:
- Page Type: homepage
- Page Purpose: ${context.pagePurpose || "Establish immediate brand trust, showcase core service capabilities, triage emergency dispatch vs scheduled maintenance, and direct local homeowners to specialized service and location pages."}
- Primary Keyword: "${context.primaryKeyword}"
- Secondary Keywords: ${JSON.stringify(context.secondaryKeywords)}
- Search Intent: ${context.searchIntent} (High commercial/transactional & local authority)
- Target City: ${facts.city}, ${facts.state}
- Related Services to Highlight: ${context.relatedServices.map((s) => s.name).join(", ")}
- Service Areas Covered: ${context.relatedLocations.map((l) => l.name).join(", ")}
- Variation Seed Digest: ${variation.seedDigest}
- Desired Heading Style: ${variation.headingStyle}
- Desired Paragraph Structure: ${variation.paragraphStructure}
- CTA Wording Theme: "${variation.ctaWording.heroPrimary}" / "${variation.ctaWording.bannerHeadline}"
- Required Internal Link Targets:
${internalLinksJson}

VERIFIED BUSINESS FACTS (Google Policy Strict - DO NOT INVENT CLAIMS):
- Business Name: "${facts.businessName}"
- Trade: "${facts.trade}"
- Phone: "${facts.phone}"
- City/State: "${facts.city}, ${facts.state}"
- License Number: ${facts.licenseNumber ? `"${facts.licenseNumber}"` : "Omit (not verified)"}
- Years In Business: ${facts.yearsInBusiness ? `"${facts.yearsInBusiness}"` : "Omit (not verified)"}
- Certifications: ${facts.certifications ? `"${facts.certifications}"` : "Omit (not verified)"}
- 24/7 Emergency Dispatch: ${facts.emergency247 ? "Verified Yes" : "Standard Business Hours"}
- Free Estimates: ${facts.freeEstimates ? "Verified Yes on Replacements" : "Standard Upfront Flat-Rate Estimates"}
- Insured & Bonded: ${facts.insuredBonded ? "Verified Yes" : "Standard Professional Coverage"}

STRICT TRUTHFULNESS & ANTI-HALLUCINATION RULES:
1. NEVER invent customer reviews, quotes, ratings, stars, or testimonials. The application handles reviews separately.
2. NEVER invent awards, fake employee names, years in business, or specific prices.
3. Every sentence must be grounded in realistic trade diagnostics for ${facts.trade} in ${facts.city}.
4. Mention supporting topics naturally: ${variation.supportingTopics.join("; ")}.

OUTPUT FORMAT:
Return ONLY a valid JSON object matching this schema:
{
  "slug": "index",
  "seo": {
    "title": "${context.primaryKeyword} in ${facts.city}, ${facts.state} | ${facts.businessName}",
    "description": "Meta description under 155 chars with city and call to action.",
    "h1": "Compelling H1 combining primary keyword and city",
    "primaryKeyword": "${context.primaryKeyword}"
  },
  "sections": [
    { "type": "emergencyBanner", "content": { "text": "..." } },
    { "type": "hero", "variant": "split", "content": { "eyebrow": "...", "h1": "...", "subheadline": "...", "primaryCta": "${facts.phone}", "secondaryCta": "Get Free Quote", "secondaryUrl": "contact.html", "trustBadges": [...] } },
    { "type": "trustBar", "content": {} },
    { "type": "services", "variant": "cards", "content": { "eyebrow": "Our Core Capabilities", "headline": "...", "subheadline": "...", "items": [{ "title": "...", "description": "...", "slug": "..." }] } },
    { "type": "whyUs", "content": { "eyebrow": "Why Homeowners Choose Us", "headline": "...", "subheadline": "...", "items": [{ "title": "...", "description": "..." }] } },
    { "type": "process", "content": { "eyebrow": "Our Process", "headline": "...", "subheadline": "...", "steps": [{ "number": "1", "title": "...", "description": "..." }] } },
    { "type": "serviceAreas", "content": { "eyebrow": "Local Coverage", "headline": "...", "subheadline": "...", "cities": [...] } },
    { "type": "faq", "content": { "eyebrow": "Common Questions", "headline": "...", "subheadline": "...", "items": [{ "question": "...", "answer": "..." }] } },
    { "type": "ctaBanner", "variant": "locationMap", "content": { "headline": "...", "subheadline": "...", "buttonText": "Call ${facts.phone}", "phone": "${facts.phone}" } }
  ]
}`;
}

/**
 * Deterministic Homepage Generator driven by the Seed Engine.
 * Guarantees zero hallucinations, instant response, and deterministic variation.
 */
export function generateHomepageDeterministic(context: PageGenerationContext): PageContentJSON {
  const facts = context.businessFacts;
  const variation: VariationProfile = createVariationProfile(
    context.contentVariationSeed,
    "home",
    context.primaryKeyword
  );

  const phone = facts.phone || "";
  const city = facts.city || "Local Area";
  const state = facts.state || "";
  const trade = facts.trade || "Plumbing";

  // Build trust badges strictly from verified facts
  const trustBadges: string[] = [];
  if (facts.licenseNumber) trustBadges.push(`Lic. #${facts.licenseNumber}`);
  else trustBadges.push("Licensed Master Technicians");
  if (facts.yearsInBusiness) trustBadges.push(`${facts.yearsInBusiness} Local Experience`);
  if (facts.insuredBonded !== false) trustBadges.push("Fully Bonded & Insured");
  if (facts.emergency247) trustBadges.push("24/7 Priority Emergency Dispatch");
  else trustBadges.push("Prompt Same-Day Scheduling");
  trustBadges.push("Upfront Flat-Rate Pricing");

  // Determine headlines based on variation heading style
  let heroH1 = `${context.primaryKeyword} in ${city}${state ? `, ${state}` : ""}`;
  let heroSub = `Rapid-response, master-certified ${trade.toLowerCase()} services across ${city} and surrounding communities. Upfront pricing with guaranteed workmanship.`;
  let servicesHeadline = `Comprehensive ${trade} Solutions for ${city} Homeowners`;
  let whyUsHeadline = `Why Greater ${city} Trusts ${facts.businessName}`;

  if (variation.headingStyle === "diagnostic_urgency") {
    heroH1 = `Emergency & Precision ${trade} Services in ${city}`;
    heroSub = `Experiencing a plumbing breakdown? Our on-call master technicians dispatch with fully equipped mobile units to diagnose and resolve urgent issues on the spot.`;
    servicesHeadline = `Precision Diagnostics & Heavy-Duty ${trade} Repairs`;
    whyUsHeadline = `Fast Dispatch, Advanced Diagnostics, Zero Guesswork`;
  } else if (variation.headingStyle === "craftsmanship_authority") {
    heroH1 = `${city} Master ${trade} Craftsmen & Infrastructure Specialists`;
    heroSub = `Engineered solutions for residential stacks, modern hydronics, and historic architectural code compliance across ${city}.`;
    servicesHeadline = `Master-Level Mechanical & ${trade} Installations`;
    whyUsHeadline = `True Code-Compliant Craftsmanship Backed by Written Warranties`;
  } else if (variation.headingStyle === "problem_resolution") {
    heroH1 = `Permanent Solutions for Complex ${trade} Problems in ${city}`;
    heroSub = `From stubborn sewer blockages to erratic water heater performance, we locate root causes with non-invasive technology and restore your systems properly.`;
    servicesHeadline = `Targeted Repairs That Eliminate Recurring Breakdowns`;
    whyUsHeadline = `Permanent Repairs, Upfront Pricing, Respect for Your Home`;
  }

  // Format CTA wording using variation
  const primaryCta = variation.ctaWording.heroPrimary.replace("{phone}", phone);
  const secondaryCta = variation.ctaWording.heroSecondary;
  const bannerHeadline = variation.ctaWording.bannerHeadline.replace("{city}", city).replace("{phone}", phone);
  const bannerSub = variation.ctaWording.bannerSub.replace("{city}", city).replace("{phone}", phone);
  const bannerButton = variation.ctaWording.bannerButton.replace("{phone}", phone);

  // Map services to cards
  const serviceItems = context.relatedServices.slice(0, 6).map((svc) => ({
    title: svc.name,
    description: `Complete diagnostic evaluation, code-compliant repair, and replacement for ${svc.name.toLowerCase()} in ${city} homes.`,
    slug: svc.slug,
  }));

  if (serviceItems.length === 0) {
    serviceItems.push(
      { title: "Water Heater Repair", description: "Thermostat calibrations, heating element replacement, and high-efficiency tankless upgrades.", slug: "water-heater-repair" },
      { title: "Drain Cleaning", description: "High-pressure hydro-jetting and motorized cabling for severe blockages and root intrusion.", slug: "drain-cleaning" },
      { title: "Leak Detection", description: "Non-invasive acoustic and thermal imaging locating concealed pressurized line leaks.", slug: "leak-detection" }
    );
  }

  // Map service areas
  const serviceAreaCities = context.relatedLocations.map((l) => l.name);
  if (serviceAreaCities.length === 0) {
    serviceAreaCities.push(city);
  }

  // Build section list
  const sections: SectionJSON[] = [
    {
      type: "emergencyBanner",
      content: {
        text: `24/7 Priority Emergency ${trade} Dispatch Available Throughout Greater ${city} — Call ${phone}`,
      },
    },
    {
      type: "hero",
      variant: "split",
      content: {
        eyebrow: `${city} Licensed & Insured Specialists`,
        h1: heroH1,
        subheadline: heroSub,
        primaryCta,
        secondaryCta,
        secondaryUrl: "contact.html",
        trustBadges,
      },
      images: [
        {
          slot: "main",
          query: `${trade.toLowerCase()} repair master technician working in ${city}`,
          alt: `Licensed ${trade.toLowerCase()} technician providing professional service in ${city}`,
        },
      ],
    },
    {
      type: "trustBar",
      content: {},
    },
    {
      type: "services",
      variant: "cards",
      content: {
        eyebrow: "Our Core Capabilities",
        headline: servicesHeadline,
        subheadline: `Every repair is executed with high-grade replacement parts, precision testing equipment, and transparent flat rates.`,
        items: serviceItems,
      },
    },
    {
      type: "whyUs",
      content: {
        eyebrow: "The Difference We Bring",
        headline: whyUsHeadline,
        subheadline: `We protect your property with clean floor coverings, clear upfront pricing, and master-certified diagnostics.`,
        items: [
          {
            title: "Master-Certified Technicians",
            description: "No unsupervised apprentices or subcontractors. Every truck is dispatched with seasoned specialists who understand local municipal codes.",
          },
          {
            title: "Transparent Flat-Rate Quotes",
            description: "You receive an exact written quote explaining every line item before any wrench turns. No travel surcharges or surprise overtime fees.",
          },
          {
            title: "Fully Stocked Mobile Units",
            description: "Our service vehicles carry hundreds of factory-certified fittings, valves, pumps, and diagnostic scanners to complete 90%+ of jobs on the first trip.",
          },
          {
            title: "Written Workmanship Guarantees",
            description: "All labor and installed mechanical components are backed by our written warranty so you can have complete peace of mind.",
          },
        ],
      },
    },
    {
      type: "process",
      content: {
        eyebrow: "How It Works",
        headline: "Simple, Stress-Free Service Delivery",
        subheadline: "From your initial call to final quality inspection, our process is built for clarity and speed.",
        steps: [
          {
            number: "1",
            title: "Contact & Rapid Triage",
            description: `Call ${phone} to speak with an on-call coordinator who gathers diagnostic details and schedules your priority arrival window.`,
          },
          {
            number: "2",
            title: "On-Site Evaluation & Written Estimate",
            description: "Your master technician performs a physical and camera diagnostic, identifies root causes, and delivers upfront pricing options.",
          },
          {
            number: "3",
            title: "Precision Repair & Verification",
            description: "We perform code-compliant repairs, test flow and pressure under normal load, and leave the work area clean and sanitized.",
          },
        ],
      },
    },
    {
      type: "serviceAreas",
      content: {
        eyebrow: "Local Coverage",
        headline: `Serving ${city} & Surrounding Communities`,
        subheadline: `Our mobile response fleet is strategically positioned across local neighborhood hubs for rapid response times.`,
        cities: serviceAreaCities,
      },
    },
    {
      type: "faq",
      content: {
        eyebrow: "Frequently Asked Questions",
        headline: "Clear Answers for Local Homeowners",
        subheadline: `Common questions regarding pricing transparency, dispatch windows, and emergency protocols in ${city}.`,
        items: variation.faqSelection.map((f) => ({
          question: f.question,
          answer: f.answer,
        })),
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
        headline: `Request ${trade} Service in ${city}`,
        subheadline: `Fill out the form below or call ${phone} for immediate assistance.`,
        phone,
      },
    },
  ];

  return {
    slug: "index",
    seo: {
      title: `${context.primaryKeyword} in ${city}, ${state} | ${facts.businessName}`,
      description: `Need reliable ${trade.toLowerCase()} in ${city}, ${state}? ${facts.businessName} provides upfront flat-rate pricing, certified master technicians, and fast dispatch. Call ${phone}!`.slice(0, 155),
      h1: heroH1,
      primaryKeyword: context.primaryKeyword,
    },
    sections,
  };
}

/**
 * Main Homepage generation orchestrator.
 * Connects to AI Provider Gateway if configured; falls back safely to deterministic generator.
 */
export async function generateHomepageContent(
  context: PageGenerationContext,
  gatewayParams?: GenerationGatewayParams
): Promise<PageContentJSON> {
  if (gatewayParams?.directCredentials?.apiKey && !gatewayParams?._state?.disabled) {
    try {
      const prompt = buildHomepagePrompt(context);
      const res = await gatewayRequest({
        ...gatewayParams,
        prompt,
        systemPrompt: "You are an expert local business copywriter and SEO engineer. Return ONLY valid JSON.",
        feature: "website-generation",
      } as GatewayRequest);

      const parsed: any = extractAndParseJSON(res.text);
      if (parsed && parsed.slug && parsed.seo && Array.isArray(parsed.sections)) {
        return parsed as PageContentJSON;
      }
    } catch (err: any) {
      console.warn("[HomepageGenerator] AI generation failed, falling back to deterministic seed engine:", err?.message || err);
      if (isPermanentAIError(err)) {
        if (gatewayParams) {
          if (!gatewayParams._state) gatewayParams._state = {};
          gatewayParams._state.disabled = true;
        }
      }
    }
  }

  return generateHomepageDeterministic(context);
}
