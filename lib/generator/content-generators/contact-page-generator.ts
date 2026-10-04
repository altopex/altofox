/**
 * RankLocal Content Generation Architecture — Contact Page Generator
 *
 * Archetype: Contact Page
 * Purpose: Conversion-focused, frictionless contact hub providing click-to-call,
 *          emergency triage instructions, business hours, service area coverage,
 *          and an upfront estimate request form.
 */

import { PageGenerationContext } from "./types";
import { PageContentJSON, SectionJSON } from "../content-schema";
import { createVariationProfile, VariationProfile } from "./variation-seed";
import { gatewayRequest, GatewayRequest } from "../../ai/provider-gateway";
import { extractAndParseJSON } from "../validator";

/**
 * Builds a dedicated LLM prompt for the Contact Page.
 * NEVER uses a universal prompt.
 */
export function buildContactPagePrompt(context: PageGenerationContext): string {
  const facts = context.businessFacts;
  const seed = context.contentVariationSeed;
  const variation = createVariationProfile(seed, "contact", context.primaryKeyword);

  return `You are an expert conversion copywriter creating the CONTACT PAGE for "${facts.businessName}".

CRITICAL SCOPE: Generate ONLY the Contact page. Do NOT generate other pages.

PAGE CONTEXT CONTRACT:
- Page Type: contact
- Page Purpose: Facilitate immediate phone contact, online estimate scheduling, emergency dispatch triage, and service area verification in ${facts.city}, ${facts.state}.
- Primary Keyword: "${context.primaryKeyword}"
- Secondary Keywords: ${JSON.stringify(context.secondaryKeywords)}
- Search Intent: ${context.searchIntent} (Transactional / Direct contact)
- Variation Seed Digest: ${variation.seedDigest}

VERIFIED BUSINESS FACTS:
- Business Name: "${facts.businessName}"
- Phone: "${facts.phone}"
- City/State: "${facts.city}, ${facts.state}"
- Address: ${facts.streetAddress ? `"${facts.streetAddress}"` : "Service-area business (no storefront)"}
- 24/7 Emergency Dispatch: ${facts.emergency247 ? "Verified Active" : "Standard Hours"}

OUTPUT FORMAT:
Return ONLY a valid JSON object matching this schema:
{
  "slug": "contact",
  "seo": {
    "title": "Contact Us & Schedule Service | ${facts.businessName} ${facts.city}",
    "description": "Contact ${facts.businessName} in ${facts.city}. Call ${facts.phone} for immediate dispatch or schedule an upfront flat-rate estimate online.",
    "h1": "Contact ${facts.businessName}",
    "primaryKeyword": "${context.primaryKeyword}"
  },
  "sections": [
    { "type": "hero", "variant": "split", "content": { "eyebrow": "Get in Touch", "h1": "...", "subheadline": "...", "primaryCta": "${facts.phone}", "secondaryCta": "Submit Request Below", "secondaryUrl": "#contact-form", "trustBadges": [...] } },
    { "type": "contactForm", "content": { "headline": "Request Service or Quote", "subheadline": "...", "phone": "${facts.phone}" } },
    { "type": "whyUs", "content": { "eyebrow": "Why Contact Us", "headline": "...", "subheadline": "...", "items": [...] } },
    { "type": "serviceAreas", "content": { "eyebrow": "Service Coverage", "headline": "...", "subheadline": "...", "cities": [...] } },
    { "type": "ctaBanner", "content": { "headline": "...", "subheadline": "...", "buttonText": "Call ${facts.phone}", "phone": "${facts.phone}" } }
  ]
}`;
}

/**
 * Deterministic Contact Page Generator driven by the Seed Engine.
 */
export function generateContactPageDeterministic(context: PageGenerationContext): PageContentJSON {
  const facts = context.businessFacts;
  const variation: VariationProfile = createVariationProfile(
    context.contentVariationSeed,
    "contact",
    context.primaryKeyword
  );

  const phone = facts.phone || "(312) 555-0199";
  const city = facts.city || "Chicago";
  const state = facts.state || "IL";
  const trade = facts.trade || "Plumbing";

  const trustBadges: string[] = [
    "Prompt Same-Day Dispatch",
    "Upfront Flat-Rate Estimates",
    "Licensed & Insured Master Techs",
    "No Surprise Overtime Fees",
  ];

  const heroH1 = `Contact ${facts.businessName} in ${city}, ${state}`;
  const heroSub = `Speak directly with our local service coordinators for immediate emergency dispatch, or schedule an on-site diagnostic inspection at a time convenient for you.`;

  const whyUsItems = [
    {
      title: "Direct Phone Communication",
      description: `Call ${phone} to speak directly with an experienced local coordinator who understands ${trade.toLowerCase()} issues, not an outsourced answering service.`,
    },
    {
      title: "Fast Dispatch Windows",
      description: "We provide tight 2-hour arrival windows with advance courtesy calls so you never have to waste your entire day waiting.",
    },
    {
      title: "Upfront Written Pricing",
      description: "Our technicians provide an itemized flat-rate estimate before commencing work. What we quote is what you pay.",
    },
  ];

  const serviceAreaCities = context.relatedLocations.map((l) => l.name);
  if (serviceAreaCities.length === 0) {
    serviceAreaCities.push(city);
  }

  const bannerHeadline = variation.ctaWording.bannerHeadline.replace("{city}", city).replace("{phone}", phone);
  const bannerSub = variation.ctaWording.bannerSub.replace("{city}", city).replace("{phone}", phone);
  const bannerButton = variation.ctaWording.bannerButton.replace("{phone}", phone);

  const sections: SectionJSON[] = [
    {
      type: "hero",
      variant: "split",
      content: {
        eyebrow: "We Are Here to Help",
        h1: heroH1,
        subheadline: heroSub,
        primaryCta: `Call ${phone}`,
        secondaryCta: "Fill Out Online Form",
        secondaryUrl: "#contact-form",
        trustBadges,
      },
      images: [
        {
          slot: "main",
          query: `customer service dispatch ${trade.toLowerCase()} in ${city}`,
          alt: `Contact customer service for ${facts.businessName} in ${city}`,
        },
      ],
    },
    {
      type: "contactForm",
      content: {
        headline: "Request an Upfront Estimate or Service Call",
        subheadline: `Complete the form below and an on-call coordinator will reach out promptly to confirm your appointment window. For urgent emergencies, please call ${phone} immediately.`,
        phone,
      },
    },
    {
      type: "whyUs",
      content: {
        eyebrow: "Our Service Guarantee",
        headline: "What to Expect When You Contact Us",
        subheadline: "Prompt communication, verified technicians, and honest upfront estimates on every job.",
        items: whyUsItems,
      },
    },
    {
      type: "serviceAreas",
      content: {
        eyebrow: "Dispatch Territory",
        headline: `Areas We Serve in Greater ${city}`,
        subheadline: `Our service vehicles dispatch throughout the following communities and surrounding districts:`,
        cities: serviceAreaCities,
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
    slug: "contact",
    seo: {
      title: `Contact Us & Schedule Service | ${facts.businessName} ${city}`,
      description: `Contact ${facts.businessName} in ${city}, ${state}. Call ${phone} for immediate dispatch or schedule an upfront flat-rate estimate online.`.slice(0, 155),
      h1: heroH1,
      primaryKeyword: context.primaryKeyword,
    },
    sections,
  };
}

/**
 * Main Contact Page generation orchestrator.
 */
export async function generateContactPageContent(
  context: PageGenerationContext,
  gatewayParams?: Partial<GatewayRequest>
): Promise<PageContentJSON> {
  if (gatewayParams?.directCredentials?.apiKey) {
    try {
      const prompt = buildContactPagePrompt(context);
      const res = await gatewayRequest({
        ...gatewayParams,
        prompt,
        systemPrompt: "You are an expert conversion copywriter. Return ONLY valid JSON.",
        feature: "website-generation",
      } as GatewayRequest);

      const parsed: any = extractAndParseJSON(res.text);
      if (parsed && parsed.slug && parsed.seo && Array.isArray(parsed.sections)) {
        return parsed as PageContentJSON;
      }
    } catch (err) {
      console.warn("[ContactPageGenerator] AI generation failed, falling back to deterministic seed engine:", err);
    }
  }

  return generateContactPageDeterministic(context);
}
