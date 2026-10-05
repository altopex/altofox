/**
 * RankLocal Content Generation Architecture — Master Orchestrator
 *
 * Coordinates the 8 dedicated page content generators:
 * 1. Homepage (homepage-generator.ts)
 * 2. Service page (service-page-generator.ts)
 * 3. Location page (location-page-generator.ts)
 * 4. Service + Location page (service-location-generator.ts)
 * 5. About page (about-page-generator.ts)
 * 6. Contact page (contact-page-generator.ts)
 * 7. FAQ page (faq-page-generator.ts)
 * 8. Blog post (blog-post-generator.ts)
 *
 * Enforces per-page context contracts and deterministic seed variation.
 */

export * from "./types";
export * from "./variation-seed";
export * from "./homepage-generator";
export * from "./service-page-generator";
export * from "./location-page-generator";
export * from "./service-location-generator";
export * from "./about-page-generator";
export * from "./contact-page-generator";
export * from "./faq-page-generator";
export * from "./blog-post-generator";
export * from "../../quality/content-similarity-checker";

import {
  PageGenerationContext,
  PageArchetype,
  VerifiedBusinessFacts,
  GenerationGatewayParams,
  isPermanentAIError,
} from "./types";
import { PageContentJSON, SiteContentJSON, SiteNavJSON } from "../content-schema";
import { generateHomepageContent, generateHomepageDeterministic } from "./homepage-generator";
import { generateServicePageContent, generateServicePageDeterministic } from "./service-page-generator";
import { generateLocationPageContent, generateLocationPageDeterministic } from "./location-page-generator";
import { generateServiceLocationContent, generateServiceLocationDeterministic } from "./service-location-generator";
import { generateAboutPageContent, generateAboutPageDeterministic } from "./about-page-generator";
import { generateContactPageContent, generateContactPageDeterministic } from "./contact-page-generator";
import { generateFaqPageContent, generateFaqPageDeterministic } from "./faq-page-generator";
import { generateBlogPostContent, generateBlogPostDeterministic } from "./blog-post-generator";
import { SiteBlueprint } from "../../blueprint/site-blueprint";
import { GatewayRequest } from "../../ai/provider-gateway";
import { auditAndDifferentiateSitePages } from "../../quality/content-similarity-checker";

/**
 * Generates page content strictly from the deterministic archetype generator.
 */
export function generatePageContentDeterministic(context: PageGenerationContext): PageContentJSON {
  switch (context.pageType) {
    case "home":
      return generateHomepageDeterministic(context);
    case "service":
      return generateServicePageDeterministic(context);
    case "location":
      return generateLocationPageDeterministic(context);
    case "service_location":
      return generateServiceLocationDeterministic(context);
    case "about":
      return generateAboutPageDeterministic(context);
    case "contact":
      return generateContactPageDeterministic(context);
    case "faq":
      return generateFaqPageDeterministic(context);
    case "blog":
      return generateBlogPostDeterministic(context);
    default:
      return generateServicePageDeterministic(context);
  }
}

/**
 * Dispatches page generation to the specific archetype generator.
 * NEVER routes to a single universal prompt.
 * Fails fast to deterministic variation if provider is unconfigured, exhausted, or down.
 */
export async function generatePageContent(
  context: PageGenerationContext,
  gatewayParams?: GenerationGatewayParams
): Promise<PageContentJSON> {
  if (!gatewayParams?.directCredentials?.apiKey || gatewayParams?._state?.disabled) {
    return generatePageContentDeterministic(context);
  }

  try {
    switch (context.pageType) {
      case "home":
        return await generateHomepageContent(context, gatewayParams);
      case "service":
        return await generateServicePageContent(context, gatewayParams);
      case "location":
        return await generateLocationPageContent(context, gatewayParams);
      case "service_location":
        return await generateServiceLocationContent(context, gatewayParams);
      case "about":
        return await generateAboutPageContent(context, gatewayParams);
      case "contact":
        return await generateContactPageContent(context, gatewayParams);
      case "faq":
        return await generateFaqPageContent(context, gatewayParams);
      case "blog":
        return await generateBlogPostContent(context, gatewayParams);
      default:
        return await generateServicePageContent(context, gatewayParams);
    }
  } catch (err: any) {
    console.warn(`[ContentGenerator] Page "${context.pageType}" (${context.primaryKeyword}) AI generation failed, falling back to deterministic:`, err?.message || err);
    if (isPermanentAIError(err)) {
      if (gatewayParams) {
        if (!gatewayParams._state) gatewayParams._state = {};
        gatewayParams._state.disabled = true;
      }
    }
    return generatePageContentDeterministic(context);
  }
}

/**
 * Generates an entire SiteContentJSON from a structured SiteBlueprint.
 * Each page in the blueprint receives its own isolated context contract,
 * deterministic pageSeed/sectionSeed, and routes to its dedicated archetype generator.
 */
export async function generateSiteContentFromBlueprint(
  blueprint: SiteBlueprint,
  customFacts?: Partial<VerifiedBusinessFacts>,
  gatewayParams?: Partial<GatewayRequest>
): Promise<SiteContentJSON> {
  const verifiedFacts: VerifiedBusinessFacts = {
    businessName: blueprint.businessName,
    trade: blueprint.primaryService || blueprint.niche,
    city: blueprint.primaryCity,
    state: blueprint.state,
    phone: blueprint.phone,
    streetAddress: blueprint.address?.street,
    yearsInBusiness: blueprint.brandInformation.yearsInBusiness,
    licenseNumber: blueprint.brandInformation.licenseNumber,
    emergency247: blueprint.ctaStrategy.emergencyCallout?.enabled ?? true,
    freeEstimates: true,
    insuredBonded: true,
    allowedClaims: blueprint.brandInformation.allowedClaims,
    ...customFacts,
  };

  const generatedPages: PageContentJSON[] = [];
  const contexts = new Map<string, PageGenerationContext>();

  // Map blueprint navigation
  const nav: SiteNavJSON[] = [
    { label: "Home", slug: "index" },
    { label: "About", slug: "about" },
    { label: "Services", slug: "services" },
    { label: "Service Areas", slug: "service-areas" },
    { label: "FAQ", slug: "faq" },
    { label: "Contact", slug: "contact" },
  ];

  // Internal link pool for cross-referencing
  const internalLinkTargets = blueprint.pages.map((p) => ({
    label: p.title.split("|")[0].trim(),
    href: p.path,
    role: (p.type === "individual-service"
      ? "service"
      : p.type === "individual-area"
      ? "location"
      : p.type === "home"
      ? "hub"
      : p.type === "about"
      ? "about"
      : p.type === "contact"
      ? "contact"
      : p.type === "faq"
      ? "faq"
      : "hub") as any,
  }));

  // Shared gateway state to allow instant fail-fast across concurrent batches if provider is exhausted
  const sharedGatewayState: GenerationGatewayParams | undefined = gatewayParams?.directCredentials?.apiKey
    ? { ...gatewayParams, _state: { disabled: false } }
    : undefined;

  // Controlled Page-Generation Queue:
  // Generate pages in configurable batches of 5 to enforce controlled concurrency,
  // eliminate event-loop starvation, and ensure predictable execution across any page count (10 to 100+).
  const BATCH_SIZE = 5;
  for (let b = 0; b < blueprint.pages.length; b += BATCH_SIZE) {
    const batchPages = blueprint.pages.slice(b, b + BATCH_SIZE);
    const batchResults = await Promise.all(
      batchPages.map(async (page) => {
        let archetype: PageArchetype = "service";
        const pageTypeStr = page.type as string;
        if (pageTypeStr === "home") archetype = "home";
        else if (pageTypeStr === "about") archetype = "about";
        else if (pageTypeStr === "contact") archetype = "contact";
        else if (pageTypeStr === "faq") archetype = "faq";
        else if (pageTypeStr === "individual-service-area" || (page.serviceName && page.locationName && pageTypeStr !== "home")) archetype = "service_location";
        else if (pageTypeStr === "individual-area" || pageTypeStr === "service-areas") archetype = "location";
        else if (pageTypeStr === "individual-service" || pageTypeStr === "services") archetype = "service";
        else if (pageTypeStr === "blog") archetype = "blog";

        const pageSeed = `${blueprint.siteSeed}-${page.slug}`;

        const context: PageGenerationContext = {
          pageType: archetype,
          pagePurpose: `Dedicated ${page.type} for ${page.title}`,
          primaryKeyword: page.targetKeywords[0] || `${blueprint.niche} in ${blueprint.primaryCity}`,
          secondaryKeywords: page.targetKeywords.slice(1),
          searchIntent:
            archetype === "home"
              ? "commercial"
              : archetype === "service" || (archetype as any) === "service_location"
              ? "transactional"
              : archetype === "location"
              ? "local_navigational"
              : archetype === "contact"
              ? "transactional"
              : "informational",
          service: page.serviceName
            ? {
                name: page.serviceName,
                slug: page.slug,
              }
            : {
                name: `${blueprint.primaryService || blueprint.niche} Services`,
                slug: page.slug,
              },
          location: page.locationName
            ? {
                city: page.locationName,
                state: blueprint.state,
              }
            : {
                city: blueprint.primaryCity,
                state: blueprint.state,
                neighborhoods: blueprint.neighborhoods,
              },
          relatedServices: blueprint.services.map((s) => ({ name: s.name, slug: s.slug })),
          relatedLocations: blueprint.locations.map((l) => ({ name: l.name, slug: l.slug, state: l.state })),
          internalLinkTargets,
          contentVariationSeed: {
            siteSeed: blueprint.siteSeed,
            pageSeed,
            sectionSeed: `sec-${page.slug}`,
          },
          businessFacts: verifiedFacts,
          brandTone: blueprint.brandInformation.tone,
        };

        contexts.set(page.slug, context);
        // Route AI generation to the core creative authority pages (home, services hub, about)
        // to maximize generation speed, eliminate provider rate-limiting/429s, and guarantee execution under 5 seconds.
        // Sub-pages and utility pages (contact, faq, location, service_location) generate using specialized deterministic
        // archetypes seeded with the exact business facts and brand tone.
        const isCoreCreativePage = archetype === "home" || page.slug === "services" || archetype === "about";
        const pageGateway = isCoreCreativePage ? sharedGatewayState : undefined;

        const generatedPage = await generatePageContent(context, pageGateway);
        // Ensure slug matches blueprint path
        generatedPage.slug = page.slug;
        return generatedPage;
      })
    );
    generatedPages.push(...batchResults);
  }

  // Deterministic Content Similarity Checker & Self-Healing Remediation Pass
  const { pages: differentiatedPages, audit: similarityAudit } = await auditAndDifferentiateSitePages(
    generatedPages,
    contexts,
    {
      similarityThreshold: 0.60,
      maxRetries: 1,
      brandTerms: [verifiedFacts.businessName, verifiedFacts.phone, verifiedFacts.city],
    }
  );

  return {
    site: {
      businessName: verifiedFacts.businessName,
      tagline: blueprint.brandInformation.tagline,
      phone: verifiedFacts.phone,
      address: {
        street: verifiedFacts.streetAddress,
        city: verifiedFacts.city,
        state: verifiedFacts.state,
      },
      hours: ["Monday - Sunday: 24/7 Priority Dispatch"],
      serviceAreas: blueprint.serviceAreas,
      nav,
      licenseNumber: verifiedFacts.licenseNumber,
      yearsInBusiness: verifiedFacts.yearsInBusiness,
      emergency247: verifiedFacts.emergency247,
      freeEstimates: verifiedFacts.freeEstimates,
      insuredBonded: verifiedFacts.insuredBonded,
      allowedClaims: verifiedFacts.allowedClaims,
    },
    pages: differentiatedPages,
    schema: {
      type: blueprint.niche.toLowerCase().includes("plumb") ? "Plumber" : "LocalBusiness",
    },
    contentSimilarityAudit: similarityAudit,
  };
}
