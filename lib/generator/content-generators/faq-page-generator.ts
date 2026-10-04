/**
 * RankLocal Content Generation Architecture — FAQ Page Generator
 *
 * Archetype: FAQ Page
 * Purpose: Comprehensive authority FAQ hub addressing diagnostics, pricing policies,
 *          emergency triage, code compliance, and maintenance routines.
 */

import { PageGenerationContext } from "./types";
import { PageContentJSON, SectionJSON } from "../content-schema";
import { createVariationProfile, VariationProfile } from "./variation-seed";
import { gatewayRequest, GatewayRequest } from "../../ai/provider-gateway";
import { extractAndParseJSON } from "../validator";

/**
 * Builds a dedicated LLM prompt for the FAQ Page.
 * NEVER uses a universal prompt.
 */
export function buildFaqPagePrompt(context: PageGenerationContext): string {
  const facts = context.businessFacts;
  const seed = context.contentVariationSeed;
  const variation = createVariationProfile(seed, "faq", context.primaryKeyword);

  return `You are an expert technical trade copywriter creating the COMPREHENSIVE FAQ PAGE for "${facts.businessName}".

CRITICAL SCOPE: Generate ONLY the FAQ page. Do NOT generate other pages.

PAGE CONTEXT CONTRACT:
- Page Type: faq
- Page Purpose: Answer critical homeowner questions regarding diagnostic procedures, upfront pricing policies, emergency dispatch, and local building codes in ${facts.city}, ${facts.state}.
- Primary Keyword: "${context.primaryKeyword}"
- Secondary Keywords: ${JSON.stringify(context.secondaryKeywords)}
- Search Intent: ${context.searchIntent} (Informational / Authority)
- Variation Seed Digest: ${variation.seedDigest}

TOPICS TO COVER:
1. Technical diagnostics (how leaks are found without tearing walls, hydro-jetting vs snaking, water heater failure signs).
2. Pricing transparency (how upfront flat-rate quotes work, zero hidden trip fees).
3. Emergency response (what to do during sudden pipe ruptures, shutoff valve location).
4. Local municipal code compliance and permits in ${facts.city}.

STRICT TRUTHFULNESS & ANTI-HALLUCINATION:
1. NEVER invent fake review quotes or unverified statistics.
2. Rely strictly on verified business facts for ${facts.businessName}.

OUTPUT FORMAT:
Return ONLY a valid JSON object matching this schema:
{
  "slug": "faq",
  "seo": {
    "title": "Frequently Asked Questions | ${facts.businessName} ${facts.city}",
    "description": "Clear answers to common questions about plumbing diagnostics, upfront flat-rate pricing, and emergency repairs in ${facts.city}.",
    "h1": "Frequently Asked Questions",
    "primaryKeyword": "${context.primaryKeyword}"
  },
  "sections": [
    { "type": "hero", "variant": "split", "content": { "eyebrow": "Homeowner Resource Center", "h1": "...", "subheadline": "...", "primaryCta": "${facts.phone}", "secondaryCta": "Schedule Service", "secondaryUrl": "contact.html", "trustBadges": [...] } },
    { "type": "trustBar", "content": {} },
    { "type": "faq", "content": { "eyebrow": "All Questions Answered", "headline": "...", "subheadline": "...", "items": [...] } },
    { "type": "whyUs", "content": { "eyebrow": "Our Guarantee", "headline": "...", "subheadline": "...", "items": [...] } },
    { "type": "ctaBanner", "content": { "headline": "...", "subheadline": "...", "buttonText": "Call ${facts.phone}", "phone": "${facts.phone}" } }
  ]
}`;
}

/**
 * Deterministic FAQ Page Generator driven by the Seed Engine.
 */
export function generateFaqPageDeterministic(context: PageGenerationContext): PageContentJSON {
  const facts = context.businessFacts;
  const variation: VariationProfile = createVariationProfile(
    context.contentVariationSeed,
    "faq",
    context.primaryKeyword
  );

  const phone = facts.phone || "";
  const city = facts.city || "Local Area";
  const state = facts.state || "";
  const trade = facts.trade || "Plumbing";

  const trustBadges: string[] = [
    "100% Upfront Pricing",
    "No Surprise Overtime",
    "Licensed Master Technicians",
    "Written Workmanship Warranty",
  ];

  const heroH1 = `Frequently Asked Questions About ${trade} in ${city}`;
  const heroSub = `Transparent answers to common homeowner questions regarding diagnostics, repair timelines, pricing policies, and code compliance across ${city}.`;

  // Comprehensive multi-category FAQs
  const faqItems = [
    {
      question: "How does your upfront flat-rate pricing work?",
      answer: "Before any wrench turns or repair begins, your master technician conducts an on-site physical evaluation and provides an exact written estimate detailing all labor and parts. The price quoted is the price you pay—there are never surprise travel surcharges or overtime add-ons.",
    },
    {
      question: "What immediate steps should I take if a pipe bursts in my home?",
      answer: "First, immediately shut off your property's main water shutoff valve (typically located near the water meter or front basement foundation wall). Next, open a lower cold faucet to drain remaining line pressure, shut off your water heater electrical breaker or gas valve, and call our emergency dispatch team at " + phone + ".",
    },
    {
      question: "Why do you recommend hydro-jetting over standard drain snaking for stubborn clogs?",
      answer: "Traditional mechanical snaking merely punches a narrow hole through an obstruction to restore temporary flow, leaving grease, scale, and root fragments clinging to pipe walls. Hydro-jetting utilizes up to 4,000 PSI omnidirectional water nozzles to scrub the entire interior pipe circumference clean back to its original diameter.",
    },
    {
      question: "How do your technicians locate hidden leaks without tearing down finished drywall?",
      answer: "We utilize non-invasive acoustic amplifiers, digital moisture sensors, and thermal imaging cameras that trace temperature differentials produced by escaping moisture behind walls or beneath concrete slab foundations, pinpointing the leak to within inches before any access opening is made.",
    },
    {
      question: "What warning signs indicate my water heater is failing?",
      answer: "Common warning indicators include rumbling or popping sounds caused by mineral scale boiling at the tank base, rusty or discolored hot water indicating anode rod depletion, moisture weeping around the temperature and pressure relief valve, and hot water running out noticeably faster than normal.",
    },
    {
      question: "Do you pull necessary municipal permits for plumbing repairs in " + city + "?",
      answer: "Yes. All major water service upgrades, sewer lateral replacements, and backflow preventer installations require municipal permits. Our licensed master technicians handle all permitting documentation and coordinate official city inspections on your behalf.",
    },
  ];

  const whyUsItems = [
    {
      title: "Written Estimates Before Work Begins",
      description: "You receive an exact price before we start. No guesswork, no open-ended hourly billing surprises.",
    },
    {
      title: "Master-Certified Technicians on Every Truck",
      description: `Every vehicle is staffed by fully licensed, background-checked specialists who understand ${city} municipal plumbing codes.`,
    },
    {
      title: "Guaranteed Workmanship",
      description: "All replacement parts and labor are backed by our written warranty so you can proceed with total confidence.",
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
        eyebrow: "Answers & Advice",
        h1: heroH1,
        subheadline: heroSub,
        primaryCta: `Call ${phone}`,
        secondaryCta: "Ask a Question",
        secondaryUrl: "contact.html",
        trustBadges,
      },
      images: [
        {
          slot: "main",
          query: `plumber explaining repair estimate to homeowner in ${city}`,
          alt: `Master technician answering homeowner questions in ${city}`,
        },
      ],
    },
    {
      type: "trustBar",
      content: {},
    },
    {
      type: "faq",
      content: {
        eyebrow: "Knowledge Base",
        headline: "Common Questions from Local Property Owners",
        subheadline: `Clear, straightforward answers about mechanical diagnostics, pricing transparency, and emergency protocols in ${city}.`,
        items: faqItems,
      },
    },
    {
      type: "whyUs",
      content: {
        eyebrow: "The Value of Transparency",
        headline: "Why Homeowners Rely On Our Advice",
        subheadline: "We believe educated homeowners make the best decisions for their properties.",
        items: whyUsItems,
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
    slug: "faq",
    seo: {
      title: `Frequently Asked Questions | ${facts.businessName} ${city}`,
      description: `Clear answers to common questions about plumbing diagnostics, upfront flat-rate pricing, and emergency repairs in ${city}, ${state}. Call ${phone}!`.slice(0, 155),
      h1: heroH1,
      primaryKeyword: context.primaryKeyword,
    },
    sections,
  };
}

/**
 * Main FAQ Page generation orchestrator.
 */
export async function generateFaqPageContent(
  context: PageGenerationContext,
  gatewayParams?: Partial<GatewayRequest>
): Promise<PageContentJSON> {
  if (gatewayParams?.directCredentials?.apiKey) {
    try {
      const prompt = buildFaqPagePrompt(context);
      const res = await gatewayRequest({
        ...gatewayParams,
        prompt,
        systemPrompt: "You are an expert technical trade copywriter. Return ONLY valid JSON.",
        feature: "website-generation",
      } as GatewayRequest);

      const parsed: any = extractAndParseJSON(res.text);
      if (parsed && parsed.slug && parsed.seo && Array.isArray(parsed.sections)) {
        return parsed as PageContentJSON;
      }
    } catch (err) {
      console.warn("[FaqPageGenerator] AI generation failed, falling back to deterministic seed engine:", err);
    }
  }

  return generateFaqPageDeterministic(context);
}
