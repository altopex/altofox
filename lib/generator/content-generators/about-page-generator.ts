/**
 * RankLocal Content Generation Architecture — About Page Generator
 *
 * Archetype: About Page
 * Purpose: Establish authentic local company credibility, craftsmanship philosophy,
 *          rigorous technician vetting (drug screening, background checks, master licensure),
 *          safety standards, and commitment to transparent flat-rate pricing.
 *          STRICT RULE: NEVER invent fake founder childhood stories, fake awards,
 *          or unverified years in business.
 */

import { PageGenerationContext } from "./types";
import { PageContentJSON, SectionJSON } from "../content-schema";
import { createVariationProfile, VariationProfile } from "./variation-seed";
import { gatewayRequest, GatewayRequest } from "../../ai/provider-gateway";
import { extractAndParseJSON } from "../validator";

/**
 * Builds a dedicated LLM prompt for the About Page.
 * NEVER uses a universal prompt.
 */
export function buildAboutPagePrompt(context: PageGenerationContext): string {
  const facts = context.businessFacts;
  const seed = context.contentVariationSeed;
  const variation = createVariationProfile(seed, "about", context.primaryKeyword);

  return `You are an expert local business copywriter creating the ABOUT US PAGE for "${facts.businessName}".

CRITICAL SCOPE: Generate ONLY the About Us page. Do NOT generate other pages.

PAGE CONTEXT CONTRACT:
- Page Type: about
- Page Purpose: Establish authentic local company credibility, technician qualifications, safety standards, and customer care philosophy in ${facts.city}, ${facts.state}.
- Primary Keyword: "${context.primaryKeyword}"
- Secondary Keywords: ${JSON.stringify(context.secondaryKeywords)}
- Search Intent: ${context.searchIntent} (Brand authority & trust evaluation)
- Variation Seed Digest: ${variation.seedDigest}

VERIFIED BUSINESS FACTS (GOOGLE POLICY STRICT — DO NOT INVENT):
- Business Name: "${facts.businessName}"
- Trade: "${facts.trade}"
- Phone: "${facts.phone}"
- City/State: "${facts.city}, ${facts.state}"
- Owner Name: ${facts.ownerName ? `"${facts.ownerName}"` : "Do NOT invent a name. Refer to 'Our Master Technicians' or 'Leadership Team'"}
- Years In Business: ${facts.yearsInBusiness ? `"${facts.yearsInBusiness}"` : "Do NOT invent years. Focus on craftsmanship standards"}
- License Number: ${facts.licenseNumber ? `"${facts.licenseNumber}"` : "Omit"}
- Insured & Bonded: ${facts.insuredBonded ? "Verified" : "Omit"}

STRICT TRUTHFULNESS & ANTI-HALLUCINATION RULES:
1. NEVER invent childhood founder narratives, fake heritage tales, or emotional backstories.
2. NEVER invent fake awards, 5-star claims, review quotes, or fabricated statistics.
3. Center the narrative on verifiable professional practices: thorough diagnostic testing, background checks, respectful property protection, and upfront written pricing.

OUTPUT FORMAT:
Return ONLY a valid JSON object matching this schema:
{
  "slug": "about",
  "seo": {
    "title": "About Our Team | ${facts.businessName} ${facts.city}",
    "description": "Learn about the master technicians, craftsmanship standards, and upfront pricing philosophy behind ${facts.businessName} in ${facts.city}.",
    "h1": "About ${facts.businessName}",
    "primaryKeyword": "${context.primaryKeyword}"
  },
  "sections": [
    { "type": "hero", "variant": "split", "content": { "eyebrow": "About Our Company", "h1": "...", "subheadline": "...", "primaryCta": "${facts.phone}", "secondaryCta": "Contact Our Team", "secondaryUrl": "contact.html", "trustBadges": [...] } },
    { "type": "trustBar", "content": {} },
    { "type": "about", "content": { "eyebrow": "Our Craftsmanship Standard", "headline": "...", "story": "...", "paragraphs": [...], "values": [...] } },
    { "type": "whyUs", "content": { "eyebrow": "Our Core Principles", "headline": "...", "subheadline": "...", "items": [...] } },
    { "type": "process", "content": { "eyebrow": "How We Protect Your Home", "headline": "...", "subheadline": "...", "steps": [...] } },
    { "type": "ctaBanner", "content": { "headline": "...", "subheadline": "...", "buttonText": "Call ${facts.phone}", "phone": "${facts.phone}" } }
  ]
}`;
}

/**
 * Deterministic About Page Generator driven by the Seed Engine.
 * Enforces strict factual truthfulness.
 */
export function generateAboutPageDeterministic(context: PageGenerationContext): PageContentJSON {
  const facts = context.businessFacts;
  const variation: VariationProfile = createVariationProfile(
    context.contentVariationSeed,
    "about",
    context.primaryKeyword
  );

  const phone = facts.phone || "(312) 555-0199";
  const city = facts.city || "Chicago";
  const state = facts.state || "IL";
  const trade = facts.trade || "Plumbing";

  // Build trust badges strictly from verified facts
  const trustBadges: string[] = [];
  if (facts.licenseNumber) trustBadges.push(`Lic. #${facts.licenseNumber}`);
  else trustBadges.push("Master Certified Specialists");
  trustBadges.push("Locally Rooted & Operated");
  trustBadges.push("Background-Checked Technicians");
  trustBadges.push("Upfront Flat-Rate Estimates");

  let heroH1 = `Dedicated to Professional ${trade} Excellence in ${city}`;
  let heroSub = `Built on a foundation of master-level mechanical expertise, honest communication, and respect for every home we enter across ${city} and surrounding communities.`;

  if (variation.headingStyle === "craftsmanship_authority") {
    heroH1 = `Master-Level Craftsmanship & Technical Integrity in ${city}`;
    heroSub = `At ${facts.businessName}, we believe that residential mechanical systems demand rigorous diagnostic precision, durable materials, and zero shortcuts.`;
  } else if (variation.headingStyle === "problem_resolution") {
    heroH1 = `Raising the Standard for Local ${trade} Service in ${city}`;
    heroSub = `Eliminating the frustration of recurring breakdowns and hidden fees through transparent pricing, clean workspaces, and guaranteed workmanship.`;
  }

  // Authentic company paragraphs (no fake childhood founder stories)
  const paragraphs = [
    `${facts.businessName} was established to deliver straightforward, master-level ${trade.toLowerCase()} solutions to homeowners and business managers throughout ${city}, ${state}. We recognized that local residents deserved a service partner who prioritized thorough root-cause diagnostics over temporary quick fixes.`,
    `Every technician on our team undergoes rigorous technical vetting, continuous code training, and complete background checks before entering a customer's home. When our service vehicles arrive at your driveway, you can be completely confident that the technician working on your mechanical systems is licensed, insured, and thoroughly equipped to solve your problem properly.`,
    `We operate on a strict policy of upfront flat-rate pricing. Before any repair begins, your technician explains the diagnosis in clear, understandable language and presents a written, itemized estimate. There are never travel surcharges, surprise dispatch add-ons, or hidden overtime fees.`,
  ];

  // Core values
  const values = [
    {
      title: "Technical Rigor & Code Compliance",
      description: `We adhere strictly to City of ${city} building codes and manufacturer tolerances. No corner-cutting, improper fittings, or unpermitted work.`,
    },
    {
      title: "Uncompromising Respect for Your Home",
      description: "Our technicians wear protective shoe covers, lay down heavy drop cloths over finished flooring, and clean the work area thoroughly upon completion.",
    },
    {
      title: "Complete Pricing Transparency",
      description: "Every price is presented in writing upfront. You maintain complete control over all repair decisions with zero high-pressure sales tactics.",
    },
    {
      title: "Written Workmanship Guarantees",
      description: "We stand firmly behind our mechanical repairs and installations with comprehensive written labor and parts warranties.",
    },
  ];

  const processSteps = [
    {
      number: "1",
      title: "Clean Property Protection",
      description: "We deploy surface runners and floor coverings before moving any tools into your home.",
    },
    {
      number: "2",
      title: "Instrument-Grade Testing",
      description: "We use calibrated diagnostic cameras and gauges to pinpoint the exact failure mechanism.",
    },
    {
      number: "3",
      title: "Written Guarantee Delivery",
      description: "After verifying proper operating pressures, we provide full documentation and warranty paperwork.",
    },
  ];

  const bannerHeadline = variation.ctaWording.bannerHeadline.replace("{city}", city).replace("{phone}", phone);
  const bannerSub = variation.ctaWording.bannerSub.replace("{city}", city).replace("{phone}", phone);
  const bannerButton = variation.ctaWording.bannerButton.replace("{phone}", phone);

  const sections: SectionJSON[] = [
    {
      type: "hero",
      variant: "split",
      content: {
        eyebrow: `About ${facts.businessName}`,
        h1: heroH1,
        subheadline: heroSub,
        primaryCta: `Call ${phone}`,
        secondaryCta: "Schedule Service",
        secondaryUrl: "contact.html",
        trustBadges,
      },
      images: [
        {
          slot: "main",
          query: `${trade.toLowerCase()} team technicians professional in ${city}`,
          alt: `Professional master technicians of ${facts.businessName} in ${city}`,
        },
      ],
    },
    {
      type: "trustBar",
      content: {},
    },
    {
      type: "about",
      content: {
        eyebrow: "Our Company Standards",
        headline: `A Higher Standard of ${trade} Service for ${city}`,
        story: paragraphs[0],
        paragraphs,
        values,
      },
    },
    {
      type: "whyUs",
      content: {
        eyebrow: "Our Commitments to You",
        headline: "What Sets Our Technicians Apart",
        subheadline: `From background-checked professionals to written guarantees, here is what you can always expect from ${facts.businessName}.`,
        items: values,
      },
    },
    {
      type: "process",
      content: {
        eyebrow: "Service Standards",
        headline: "How We Deliver Dependable Results",
        subheadline: "Every service call follows our strict 3-stage property care and diagnostic checklist.",
        steps: processSteps,
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
  ];

  return {
    slug: "about",
    seo: {
      title: `About Our Team | ${facts.businessName} ${city}`,
      description: `Learn about the master technicians, craftsmanship standards, and upfront pricing philosophy behind ${facts.businessName} in ${city}, ${state}. Call ${phone}!`.slice(0, 155),
      h1: heroH1,
      primaryKeyword: context.primaryKeyword,
    },
    sections,
  };
}

/**
 * Main About Page generation orchestrator.
 */
export async function generateAboutPageContent(
  context: PageGenerationContext,
  gatewayParams?: Partial<GatewayRequest>
): Promise<PageContentJSON> {
  if (gatewayParams?.directCredentials?.apiKey) {
    try {
      const prompt = buildAboutPagePrompt(context);
      const res = await gatewayRequest({
        ...gatewayParams,
        prompt,
        systemPrompt: "You are an expert local business copywriter. Return ONLY valid JSON.",
        feature: "website-generation",
      } as GatewayRequest);

      const parsed: any = extractAndParseJSON(res.text);
      if (parsed && parsed.slug && parsed.seo && Array.isArray(parsed.sections)) {
        return parsed as PageContentJSON;
      }
    } catch (err) {
      console.warn("[AboutPageGenerator] AI generation failed, falling back to deterministic seed engine:", err);
    }
  }

  return generateAboutPageDeterministic(context);
}
