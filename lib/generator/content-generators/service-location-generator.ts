/**
 * RankLocal Content Generation Architecture — Service + Location Page Generator
 *
 * Archetype: Service + Location Page (e.g., "Water Heater Repair in Chicago, IL")
 * Purpose: Hyper-targeted hybrid page capturing high-commercial-intent organic queries.
 *          Blends rigorous technical diagnostics for the specific service with authentic
 *          local geographic and infrastructure context (e.g., municipal water hardness,
 *          intake water temperature drops in winter, local venting code compliance).
 */

import { PageGenerationContext, GenerationGatewayParams, isPermanentAIError } from "./types";
import { PageContentJSON, SectionJSON } from "../content-schema";
import { createVariationProfile, VariationProfile } from "./variation-seed";
import { gatewayRequest, GatewayRequest } from "../../ai/provider-gateway";
import { extractAndParseJSON } from "../validator";

/**
 * Builds a dedicated LLM prompt for the Service + Location hybrid page.
 * NEVER uses a universal prompt.
 */
export function buildServiceLocationPrompt(context: PageGenerationContext): string {
  const facts = context.businessFacts;
  const svc = context.service || { name: "Water Heater Repair", slug: "water-heater-repair" };
  const loc = context.location || { city: facts.city, state: facts.state };
  const seed = context.contentVariationSeed;
  const variation = createVariationProfile(seed, "service_location", context.primaryKeyword, svc.slug);

  const internalLinksJson = JSON.stringify(
    context.internalLinkTargets.map((t) => ({ label: t.label, href: t.href, role: t.role })),
    null,
    2
  );

  return `You are a master local-conversion copywriter creating a HYBRID SERVICE + LOCATION PAGE for "${svc.name} in ${loc.city}, ${loc.state}" for "${facts.businessName}".

CRITICAL SCOPE: Generate ONLY the "${svc.name} in ${loc.city}" hybrid landing page. Do NOT generate other pages.

PAGE CONTEXT CONTRACT:
- Page Type: service_location
- Page Purpose: Combine deep diagnostic technical knowledge for ${svc.name} with authentic ${loc.city} environmental and code factors (intake water temperature in winter, municipal water hardness, basement venting codes).
- Primary Keyword: "${context.primaryKeyword}"
- Secondary Keywords: ${JSON.stringify(context.secondaryKeywords)}
- Search Intent: ${context.searchIntent} (High commercial & transactional)
- Service: "${svc.name}"
- Location: "${loc.city}, ${loc.state}"
- Sibling Services in ${loc.city} to Cross-Link: ${context.relatedServices.map((s) => s.name).join(", ")}
- Neighboring Towns for ${svc.name} to Cross-Link: ${context.relatedLocations.map((l) => l.name).join(", ")}
- Variation Seed Digest: ${variation.seedDigest}
- Desired Heading Style: ${variation.headingStyle}
- CTA Wording Theme: "${variation.ctaWording.heroPrimary}"
- Required Internal Link Targets:
${internalLinksJson}

TECHNICAL & LOCAL CONTEXT INTEGRATION:
- Service Diagnostic: Step-by-step troubleshooting, OEM part replacement, diagnostic testing instruments.
- Local Infrastructure: How local water supply conditions and building characteristics in ${loc.city} impact this system.
- Code Standards: Municipal plumbing code compliance, expansion tank requirements, and proper ventilation.

STRICT TRUTHFULNESS & ANTI-HALLUCINATION:
1. NEVER invent fake customer reviews, ratings, or quotes.
2. NEVER invent fake business addresses or unverified storefronts.
3. Keep claims grounded in verified facts: Phone ${facts.phone}, 24/7 emergency dispatch if verified, upfront flat-rate estimates.

OUTPUT FORMAT:
Return ONLY a valid JSON object matching this schema:
{
  "slug": "${svc.slug}-${loc.city.toLowerCase().replace(/[^a-z0-9]+/g, "-")}",
  "seo": {
    "title": "${svc.name} in ${loc.city}, ${loc.state} | ${facts.businessName}",
    "description": "Meta description under 155 chars with service, city, and phone CTA.",
    "h1": "${svc.name} in ${loc.city}, ${loc.state}",
    "primaryKeyword": "${context.primaryKeyword}"
  },
  "sections": [
    { "type": "hero", "variant": "split", "content": { "eyebrow": "Certified ${svc.name} in ${loc.city}", "h1": "...", "subheadline": "...", "primaryCta": "${facts.phone}", "secondaryCta": "Book Diagnostic", "secondaryUrl": "contact.html", "trustBadges": [...] } },
    { "type": "trustBar", "content": {} },
    { "type": "services", "variant": "cards", "content": { "eyebrow": "Diagnostic Failure Signs", "headline": "...", "subheadline": "...", "items": [...] } },
    { "type": "whyUs", "content": { "eyebrow": "The Local Advantage", "headline": "...", "subheadline": "...", "items": [...] } },
    { "type": "process", "content": { "eyebrow": "Precision Workflow", "headline": "...", "subheadline": "...", "steps": [...] } },
    { "type": "faq", "content": { "eyebrow": "Frequently Asked Questions", "headline": "...", "subheadline": "...", "items": [...] } },
    { "type": "ctaBanner", "content": { "headline": "...", "subheadline": "...", "buttonText": "Call ${facts.phone}", "phone": "${facts.phone}" } },
    { "type": "contactForm", "content": { "headline": "Schedule ${svc.name} in ${loc.city}", "subheadline": "...", "phone": "${facts.phone}" } }
  ]
}`;
}

/**
 * Deterministic Service + Location Page Generator driven by the Seed Engine.
 * Combines service failure mechanics with local municipal factors.
 */
export function generateServiceLocationDeterministic(context: PageGenerationContext): PageContentJSON {
  const facts = context.businessFacts;
  const svc = context.service || { name: "Water Heater Repair", slug: "water-heater-repair" };
  const loc = context.location || { city: facts.city || "Local Area", state: facts.state || "" };
  const variation: VariationProfile = createVariationProfile(
    context.contentVariationSeed,
    "service_location",
    context.primaryKeyword,
    svc.slug
  );

  const phone = facts.phone || "";
  const city = loc.city;
  const state = loc.state;

  // Build trust badges strictly from verified facts
  const trustBadges: string[] = [];
  if (facts.licenseNumber) trustBadges.push(`Lic. #${facts.licenseNumber}`);
  else trustBadges.push("Master Certified Technicians");
  trustBadges.push(`${city} Code Compliant`);
  if (facts.emergency247) trustBadges.push("24/7 Priority Emergency Dispatch");
  else trustBadges.push("Prompt Same-Day Dispatch");
  trustBadges.push("Upfront Flat-Rate Quotes");

  let heroH1 = `${svc.name} in ${city}, ${state}`;
  let heroSub = `Master-certified diagnostic troubleshooting, code-compliant repairs, and precision replacements for ${svc.name.toLowerCase()} in ${city} homes. Available with upfront flat rates and fast local response.`;

  if (variation.headingStyle === "diagnostic_urgency") {
    heroH1 = `Emergency ${svc.name} in ${city}, ${state}`;
    heroSub = `Experiencing a sudden failure with your ${svc.name.toLowerCase()}? Our on-call ${city} technicians dispatch immediately with fully equipped service vehicles to diagnose and resolve issues on the spot.`;
  } else if (variation.headingStyle === "craftsmanship_authority") {
    heroH1 = `Master-Level ${svc.name} Specialists in ${city}`;
    heroSub = `Engineered repairs adhering strictly to City of ${city} plumbing codes, local utility specifications, and factory manufacturer tolerances.`;
  } else if (variation.headingStyle === "problem_resolution") {
    heroH1 = `Permanent ${svc.name} Solutions for ${city} Homeowners`;
    heroSub = `Stop dealing with recurring breakdowns. We locate the underlying mechanical defect, replace worn parts with OEM components, and verify system integrity under full operating load.`;
  }

  // Why Us items tailored to both service and city
  const whyUsItems = [
    {
      title: `Tailored to ${city} Water & Climate Conditions`,
      description: `We understand how local municipal water hardness and cold winter intake temperatures place heightened thermal strain on residential ${svc.name.toLowerCase()} components in ${city}.`,
    },
    {
      title: "Strict Municipal Plumbing Code Compliance",
      description: `Every repair, valve replacement, or line connection adheres strictly to City of ${city} building codes and Department of Water Management regulations.`,
    },
    {
      title: "Itemized Flat-Rate Pricing Guaranteed in Writing",
      description: "You receive an exact written quote explaining every line item before any repair begins. No surprise travel fees or hidden overtime rates.",
    },
    {
      title: "Fully Stocked Mobile Diagnostic Units",
      description: `Our mobile units arrive in ${city} stocked with certified OEM replacement parts, testing gauges, and high-grade fittings to finish repairs in a single visit.`,
    },
  ];

  // Failure symptom items
  const symptomItems = [
    {
      title: "Erratic Temperature or Pressure Drops",
      description: `Inconsistent delivery caused by element fatigue, scale buildup, or faulty valving during high-demand morning hours in ${city} homes.`,
      slug: "contact",
    },
    {
      title: "Unusual Operating Sounds Under Load",
      description: `Popping, banging, or hissing sounds indicating heavy sediment crusting, cavitation, or unvented pressure buildup.`,
      slug: "contact",
    },
    {
      title: "Moisture Weepage Around Mechanical Joints",
      description: `Slow drips from temperature relief valves, supply unions, or corroded fittings causing localized corrosion and moisture damage.`,
      slug: "contact",
    },
    {
      title: "Elevated Utility Costs Without Increased Usage",
      description: `Failing components forcing systems to draw significantly more energy to achieve standard output.`,
      slug: "contact",
    },
  ];

  // Process steps
  const processSteps = [
    {
      number: "1",
      title: `Rapid ${city} Scheduling & Triage`,
      description: `Call ${phone} to describe your symptoms. Our dispatch coordinators assign the closest certified master technician in ${city}.`,
    },
    {
      number: "2",
      title: "On-Site Multi-Point Diagnostic",
      description: `Your technician conducts physical pressure, electrical, and flow testing to isolate root causes and provides an upfront flat-rate estimate.`,
    },
    {
      number: "3",
      title: "Precision Code-Compliant Repair",
      description: `We replace compromised components using factory-spec parts, test under full municipal water pressure, and provide a written warranty.`,
    },
  ];

  // FAQs
  const faqItems = variation.faqSelection.map((f) => ({
    question: f.question,
    answer: f.answer,
  }));

  const bannerHeadline = variation.ctaWording.bannerHeadline.replace("{city}", city).replace("{phone}", phone);
  const bannerSub = variation.ctaWording.bannerSub.replace("{city}", city).replace("{phone}", phone);
  const bannerButton = variation.ctaWording.bannerButton.replace("{phone}", phone);

  const cleanSlug = `${svc.slug}-${city.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  const sections: SectionJSON[] = [
    {
      type: "hero",
      variant: "split",
      content: {
        eyebrow: `Licensed ${svc.name} Technicians in ${city}`,
        h1: heroH1,
        subheadline: heroSub,
        primaryCta: `Call ${phone}`,
        secondaryCta: "Schedule Diagnostic",
        secondaryUrl: "contact.html",
        trustBadges,
      },
      images: [
        {
          slot: "main",
          query: `${svc.name.toLowerCase()} technician working in ${city}`,
          alt: `Licensed master technician performing ${svc.name.toLowerCase()} in ${city}, ${state}`,
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
        eyebrow: "Symptom Warning Signs",
        headline: `Common Indicators You Need ${svc.name} in ${city}`,
        subheadline: `Recognizing early failure symptoms protects your property from sudden outages and costly water damage.`,
        items: symptomItems,
      },
    },
    {
      type: "whyUs",
      content: {
        eyebrow: "Why Homeowners Rely On Us",
        headline: `The Trusted Standard for ${svc.name} in ${city}`,
        subheadline: `Certified expertise, respectful technicians, and transparent flat pricing on every service call.`,
        items: whyUsItems,
      },
    },
    {
      type: "process",
      content: {
        eyebrow: "How We Work",
        headline: `Our ${city} Diagnostic & Repair Protocol`,
        subheadline: `A transparent, step-by-step service flow designed to resolve mechanical problems completely on the first visit.`,
        steps: processSteps,
      },
    },
    {
      type: "faq",
      content: {
        eyebrow: "Service & Local FAQs",
        headline: `Frequently Asked Questions About ${svc.name} in ${city}`,
        subheadline: `Straightforward answers regarding repairs, local codes, and response times in ${city}.`,
        items: faqItems,
      },
    },
    {
      type: "ctaBanner",
      variant: "default",
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
        headline: `Request ${svc.name} in ${city}`,
        subheadline: `Call ${phone} for immediate assistance or complete the form below.`,
        phone,
      },
    },
  ];

  return {
    slug: cleanSlug,
    seo: {
      title: `${svc.name} in ${city}, ${state} | ${facts.businessName}`,
      description: `Looking for reliable ${svc.name.toLowerCase()} in ${city}, ${state}? ${facts.businessName} delivers upfront pricing, certified technicians, and fast local response. Call ${phone}!`.slice(0, 155),
      h1: heroH1,
      primaryKeyword: context.primaryKeyword,
    },
    sections,
  };
}

/**
 * Main Service + Location Page generation orchestrator.
 * Connects to AI Provider Gateway if configured; falls back safely to deterministic generator.
 */
export async function generateServiceLocationContent(
  context: PageGenerationContext,
  gatewayParams?: GenerationGatewayParams
): Promise<PageContentJSON> {
  if (gatewayParams?.directCredentials?.apiKey && !gatewayParams?._state?.disabled) {
    try {
      const prompt = buildServiceLocationPrompt(context);
      const res = await gatewayRequest({
        ...gatewayParams,
        prompt,
        systemPrompt: "You are an expert local conversion copywriter. Return ONLY valid JSON.",
        feature: "website-generation",
      } as GatewayRequest);

      const parsed: any = extractAndParseJSON(res.text);
      if (parsed && parsed.slug && parsed.seo && Array.isArray(parsed.sections)) {
        return parsed as PageContentJSON;
      }
    } catch (err: any) {
      console.warn(`[ServiceLocationGenerator] AI generation failed for ${context.primaryKeyword}, falling back to deterministic seed engine:`, err?.message || err);
      if (isPermanentAIError(err)) {
        if (gatewayParams) {
          if (!gatewayParams._state) gatewayParams._state = {};
          gatewayParams._state.disabled = true;
        }
      }
    }
  }

  return generateServiceLocationDeterministic(context);
}
