/**
 * RankLocal Content Generation Architecture — Blog Post Generator
 *
 * Archetype: Blog Post
 * Purpose: High-authority, E-E-A-T structured informational guide for homeowners.
 *          Explains root mechanical causes behind common trade symptoms,
 *          safe homeowner diagnostic checks, and clear thresholds for when
 *          a licensed professional must be dispatched to prevent catastrophic failure.
 */

import { PageGenerationContext, GenerationGatewayParams, isPermanentAIError } from "./types";
import { PageContentJSON, SectionJSON } from "../content-schema";
import { createVariationProfile, VariationProfile } from "./variation-seed";
import { gatewayRequest, GatewayRequest } from "../../ai/provider-gateway";
import { extractAndParseJSON } from "../validator";

/**
 * Builds a dedicated LLM prompt for the Blog Post.
 * NEVER uses a universal prompt.
 */
export function buildBlogPostPrompt(context: PageGenerationContext): string {
  const facts = context.businessFacts;
  const seed = context.contentVariationSeed;
  const variation = createVariationProfile(seed, "blog", context.primaryKeyword);

  return `You are a master technical writer producing an authoritative, E-E-A-T local home services BLOG POST for "${facts.businessName}".

CRITICAL SCOPE: Generate ONLY the Blog Post. Do NOT generate other pages.

PAGE CONTEXT CONTRACT:
- Page Type: blog
- Page Purpose: High-authority homeowner diagnostic guide explaining common symptoms, mechanical causes, safe checks, and when to call a licensed master technician in ${facts.city}, ${facts.state}.
- Primary Keyword: "${context.primaryKeyword}"
- Secondary Keywords: ${JSON.stringify(context.secondaryKeywords)}
- Search Intent: ${context.searchIntent} (Informational / How-to Guide)
- Target City: ${facts.city}, ${facts.state}
- Variation Seed Digest: ${variation.seedDigest}

STRUCTURE REQUIREMENTS:
1. Practical diagnostic breakdown (symptoms, what's happening mechanically).
2. Safe homeowner checks (checking shutoff valve, visual inspections).
3. Red flags requiring immediate professional shutdown.
4. Call to action to schedule diagnostic inspection with ${facts.businessName} at ${facts.phone}.

OUTPUT FORMAT:
Return ONLY a valid JSON object matching this schema:
{
  "slug": "blog-${context.primaryKeyword.toLowerCase().replace(/[^a-z0-9]+/g, "-")}",
  "seo": {
    "title": "${context.primaryKeyword}: Homeowner Guide | ${facts.businessName}",
    "description": "Comprehensive diagnostic guide explaining causes, safety checks, and professional repair solutions in ${facts.city}.",
    "h1": "${context.primaryKeyword}: Expert Diagnostic Guide",
    "primaryKeyword": "${context.primaryKeyword}"
  },
  "sections": [
    { "type": "hero", "variant": "split", "content": { "eyebrow": "Homeowner Technical Guide", "h1": "...", "subheadline": "...", "primaryCta": "${facts.phone}", "secondaryCta": "Book Diagnostic Inspection", "secondaryUrl": "contact.html", "trustBadges": [...] } },
    { "type": "whyUs", "content": { "eyebrow": "Root Cause Analysis", "headline": "...", "subheadline": "...", "items": [...] } },
    { "type": "process", "content": { "eyebrow": "Diagnostic Checklist", "headline": "...", "subheadline": "...", "steps": [...] } },
    { "type": "faq", "content": { "eyebrow": "Troubleshooting FAQs", "headline": "...", "subheadline": "...", "items": [...] } },
    { "type": "ctaBanner", "content": { "headline": "...", "subheadline": "...", "buttonText": "Call ${facts.phone}", "phone": "${facts.phone}" } }
  ]
}`;
}

/**
 * Deterministic Blog Post Generator driven by the Seed Engine.
 */
export function generateBlogPostDeterministic(context: PageGenerationContext): PageContentJSON {
  const facts = context.businessFacts;
  const variation: VariationProfile = createVariationProfile(
    context.contentVariationSeed,
    "blog",
    context.primaryKeyword
  );

  const phone = facts.phone || "";
  const city = facts.city || "Local Area";
  const state = facts.state || "";
  const trade = facts.trade || "Plumbing";

  const trustBadges: string[] = [
    "Expert Diagnostic Advice",
    "Safety First Guidelines",
    "Licensed Master Technicians",
    "No-Obligation Upfront Estimates",
  ];

  const heroH1 = `${context.primaryKeyword}: Homeowner Troubleshooting Guide for ${city}`;
  const heroSub = `Learn what causes this common mechanical issue, which warning signs warrant immediate attention, and how our licensed master technicians restore system safety.`;

  const whyUsItems = [
    {
      title: "Understanding the Underlying Mechanical Mechanism",
      description: `Most recurring ${trade.toLowerCase()} issues stem from progressive component wear, mineral accumulation, or erratic water pressure that strains mechanical seals over time.`,
    },
    {
      title: "Safe Homeowner Observations vs. DIY Hazards",
      description: `Homeowners can safely check main shutoffs and visual valve points, but attempting to dismantle pressurized or high-voltage components without specialized tools risks flooding or personal injury.`,
    },
    {
      title: "When to Shut Off Water & Call a Professional",
      description: `If you notice moisture pooling around electrical controls, water heater relief valves continuously discharging, or sewer gas escaping from drain traps, shut off the main supply and call ${phone} immediately.`,
    },
  ];

  const processSteps = [
    {
      number: "1",
      title: "Step 1: Visual Inspection & Odor Check",
      description: "Carefully inspect visible fittings for white calcified crusting, green oxidation, or musty sewer odors without touching live wiring.",
    },
    {
      number: "2",
      title: "Step 2: Isolate the Supply Valve",
      description: "If active dripping or hissing is detected, turn the local fixture valve clockwise to isolate the problem line and prevent water migration.",
    },
    {
      number: "3",
      title: "Step 3: Professional Diagnostic & Repair",
      description: `Contact ${facts.businessName} at ${phone} to dispatch a certified master technician equipped with precision testing tools.`,
    },
  ];

  const faqItems = [
    {
      question: "Is this issue considered an emergency that requires immediate dispatch?",
      answer: "If water is actively leaking onto finished floors, flowing toward electrical panels, or backing up into multiple plumbing fixtures simultaneously, it is a priority emergency requiring immediate main water shutoff and emergency technician dispatch.",
    },
    {
      question: "Can chemical solutions solve this problem permanently?",
      answer: "No. Over-the-counter chemical solutions often contain aggressive acids or caustic bases that accelerate internal corrosion of copper and cast-iron piping while only providing a brief, partial opening.",
    },
  ];

  const bannerHeadline = variation.ctaWording.bannerHeadline.replace("{city}", city).replace("{phone}", phone);
  const bannerSub = variation.ctaWording.bannerSub.replace("{city}", city).replace("{phone}", phone);
  const bannerButton = variation.ctaWording.bannerButton.replace("{phone}", phone);

  const cleanSlug = `blog-${context.primaryKeyword.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  const sections: SectionJSON[] = [
    {
      type: "hero",
      variant: "split",
      content: {
        eyebrow: "Homeowner Educational Guide",
        h1: heroH1,
        subheadline: heroSub,
        primaryCta: `Call ${phone}`,
        secondaryCta: "Schedule Diagnostic Call",
        secondaryUrl: "contact.html",
        trustBadges,
      },
      images: [
        {
          slot: "main",
          query: `${trade.toLowerCase()} diagnostic inspection tools in ${city}`,
          alt: `Master technician performing technical diagnostic in ${city}`,
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
        eyebrow: "Technical Analysis",
        headline: "What Local Homeowners Need to Know",
        subheadline: "Clear insights to help you recognize early warning signs and avoid costly property damage.",
        items: whyUsItems,
      },
    },
    {
      type: "process",
      content: {
        eyebrow: "Homeowner Action Guide",
        headline: "Recommended Diagnostic & Safety Steps",
        subheadline: "Follow this sequence to assess the problem safely without risking further damage.",
        steps: processSteps,
      },
    },
    {
      type: "faq",
      content: {
        eyebrow: "Troubleshooting FAQs",
        headline: "Common Homeowner Questions",
        subheadline: "Quick answers to help you determine the severity of your situation.",
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
  ];

  return {
    slug: cleanSlug,
    seo: {
      title: `${context.primaryKeyword}: Diagnostic Guide | ${facts.businessName}`,
      description: `Learn the root causes and professional repair solutions for ${context.primaryKeyword.toLowerCase()} in ${city}, ${state}. Contact ${facts.businessName} at ${phone}!`.slice(0, 155),
      h1: heroH1,
      primaryKeyword: context.primaryKeyword,
    },
    sections,
  };
}

/**
 * Main Blog Post generation orchestrator.
 */
export async function generateBlogPostContent(
  context: PageGenerationContext,
  gatewayParams?: GenerationGatewayParams
): Promise<PageContentJSON> {
  if (gatewayParams?.directCredentials?.apiKey && !gatewayParams?._state?.disabled) {
    try {
      const prompt = buildBlogPostPrompt(context);
      const res = await gatewayRequest({
        ...gatewayParams,
        prompt,
        systemPrompt: "You are an expert technical trade copywriter. Return ONLY valid JSON.",
        feature: "blog",
      } as GatewayRequest);

      const parsed: any = extractAndParseJSON(res.text);
      if (parsed && parsed.slug && parsed.seo && Array.isArray(parsed.sections)) {
        return parsed as PageContentJSON;
      }
    } catch (err: any) {
      console.warn("[BlogPostGenerator] AI generation failed, falling back to deterministic seed engine:", err?.message || err);
      if (isPermanentAIError(err)) {
        if (gatewayParams) {
          if (!gatewayParams._state) gatewayParams._state = {};
          gatewayParams._state.disabled = true;
        }
      }
    }
  }

  return generateBlogPostDeterministic(context);
}
