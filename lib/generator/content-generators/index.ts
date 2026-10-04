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

import { PageGenerationContext, PageArchetype, VerifiedBusinessFacts } from "./types";
import { PageContentJSON, SiteContentJSON, SiteNavJSON } from "../content-schema";
import { generateHomepageContent } from "./homepage-generator";
import { generateServicePageContent } from "./service-page-generator";
import { generateLocationPageContent } from "./location-page-generator";
import { generateServiceLocationContent } from "./service-location-generator";
import { generateAboutPageContent } from "./about-page-generator";
import { generateContactPageContent } from "./contact-page-generator";
import { generateFaqPageContent } from "./faq-page-generator";
import { generateBlogPostContent } from "./blog-post-generator";
import { SiteBlueprint } from "../../blueprint/site-blueprint";
import { GatewayRequest } from "../../ai/provider-gateway";
import { auditAndDifferentiateSitePages } from "../../quality/content-similarity-checker";

/**
 * Dispatches page generation to the specific archetype generator.
 * NEVER routes to a single universal prompt.
 */
export async function generatePageContent(
  context: PageGenerationContext,
  gatewayParams?: Partial<GatewayRequest>
): Promise<PageContentJSON> {
  switch (context.pageType) {
    case "home":
      return generateHomepageContent(context, gatewayParams);
    case "service":
      return generateServicePageContent(context, gatewayParams);
    case "location":
      return generateLocationPageContent(context, gatewayParams);
    case "service_location":
      return generateServiceLocationContent(context, gatewayParams);
    case "about":
      return generateAboutPageContent(context, gatewayParams);
    case "contact":
      return generateContactPageContent(context, gatewayParams);
    case "faq":
      return generateFaqPageContent(context, gatewayParams);
    case "blog":
      return generateBlogPostContent(context, gatewayParams);
    default:
      console.warn(`[ContentGenerator] Unknown archetype "${context.pageType}", defaulting to service page.`);
      return generateServicePageContent(context, gatewayParams);
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

  for (const page of blueprint.pages) {
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
    const generatedPage = await generatePageContent(context, gatewayParams);
    // Ensure slug matches blueprint path
    generatedPage.slug = page.slug;
    generatedPages.push(generatedPage);
  }

  // Deterministic Content Similarity Checker & Self-Healing Remediation Pass
  const { pages: differentiatedPages, audit: similarityAudit } = await auditAndDifferentiateSitePages(
    generatedPages,
    contexts,
    {
      similarityThreshold: 0.35,
      maxRetries: 3,
      brandTerms: [verifiedFacts.businessName, verifiedFacts.phone, verifiedFacts.city],
    },
    gatewayParams
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
