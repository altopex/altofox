/**
 * RankLocal Content Generation Architecture — Types & Contracts
 *
 * Enforces per-page context contract where every page archetype receives:
 * - pageType
 * - pagePurpose
 * - primaryKeyword
 * - secondaryKeywords
 * - searchIntent
 * - service (if applicable)
 * - location (if applicable)
 * - relatedServices
 * - relatedLocations
 * - internalLinkTargets
 * - contentVariationSeed (siteSeed, pageSeed, sectionSeed)
 * - verified business facts
 */

import { PageContentJSON, SectionJSON, PageSeoJSON } from "../content-schema";

export type PageArchetype =
  | "home"
  | "service"
  | "location"
  | "service_location"
  | "about"
  | "contact"
  | "faq"
  | "blog";

export type SearchIntent =
  | "commercial"
  | "transactional"
  | "emergency"
  | "informational"
  | "local_navigational";

export interface InternalLinkTarget {
  label: string;
  href: string;
  role: "service" | "location" | "contact" | "hub" | "faq" | "about" | "blog";
  anchorRecommendation?: string;
}

export interface ServiceContextDetails {
  name: string;
  slug: string;
  description?: string;
  commonProblems?: string[];
  equipmentTypes?: string[];
  diagnosticSteps?: string[];
}

export interface LocationContextDetails {
  city: string;
  state: string;
  county?: string;
  neighborhoods?: string[];
  landmarks?: string[];
  distanceOffset?: string;
}

export interface VerifiedBusinessFacts {
  businessName: string;
  trade: string;
  city: string;
  state: string;
  phone: string;
  streetAddress?: string;
  yearsInBusiness?: string;
  licenseNumber?: string;
  certifications?: string;
  warrantyGuarantee?: string;
  responseTime?: string;
  emergency247?: boolean;
  freeEstimates?: boolean;
  insuredBonded?: boolean;
  ownerName?: string;
  allowedClaims?: string[];
  businessHours?: string[];
  googleReviewUrl?: string;
}

export interface ContentVariationSeedSpec {
  siteSeed: string;
  pageSeed: string;
  sectionSeed?: string;
  strategyShift?: number;
  strategyName?: string;
}

export interface PageGenerationContext {
  pageType: PageArchetype;
  pagePurpose: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  searchIntent: SearchIntent;
  service?: ServiceContextDetails;
  location?: LocationContextDetails;
  relatedServices: Array<{ name: string; slug: string; href?: string }>;
  relatedLocations: Array<{ name: string; slug: string; state?: string; href?: string }>;
  internalLinkTargets: InternalLinkTarget[];
  contentVariationSeed: ContentVariationSeedSpec;
  businessFacts: VerifiedBusinessFacts;
  brandTone?: string;
  customInstructions?: string;
  themeId?: string;
}

export interface GeneratedPageResult {
  pageType: PageArchetype;
  slug: string;
  seo: PageSeoJSON;
  sections: SectionJSON[];
  variationProfileUsed: {
    headingStyle: string;
    sectionSequence: string[];
    ctaWordingVariant: string;
    seedDigest: string;
  };
}

export interface ContentGenerator {
  generate(context: PageGenerationContext): Promise<GeneratedPageResult>;
}
