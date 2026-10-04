/**
 * RankLocal Site Blueprint Engine
 *
 * Centralized architectural authority that establishes a structured,
 * deterministic Site Blueprint BEFORE any page content generation occurs.
 *
 * All page generators (multi-page, single-page, section builders, assembler)
 * MUST consume this blueprint and not independently invent site architecture.
 */

import { findNicheByIndustry } from "@/niches";
import { US_CITIES, CityData, getNearestSelectedCities } from "@/lib/data/us-cities";
import { THEMES, Theme } from "@/lib/themes";
import { parseLocationList, parseKeywordList } from "@/lib/keywords/keyword-parser";
import { WebsiteFormData } from "@/lib/generator/prompt";

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

export interface BlueprintService {
  name: string;
  slug: string;
  description: string;
  isPrimary?: boolean;
  keywords?: string[];
  features?: string[];
  commonIssues?: string[];
}

export interface BlueprintLocation {
  name: string;
  city: string;
  state: string;
  slug: string;
  isPrimary?: boolean;
  county?: string;
  neighborhoods?: string[];
  distanceOffset?: string;
  landmarks?: string[];
}

export interface BlueprintPage {
  path: string;           // e.g. "index.html", "about.html", "services.html", "drain-cleaning.html", "plumber-naperville.html"
  slug: string;           // e.g. "index", "about", "services", "drain-cleaning", "plumber-naperville"
  title: string;          // e.g. "Chicago 24/7 Plumber | Apex Plumbing Pros"
  type: "home" | "about" | "services" | "contact" | "faq" | "service-areas" | "individual-service" | "individual-area" | "custom";
  serviceName?: string;
  locationName?: string;
  metaDescription: string;
  h1: string;
  breadcrumbs: Array<{ label: string; path: string }>;
  sectionTypes: string[];
  targetKeywords: string[];
}

export interface BrandInformation {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    muted: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  tone: string;
  tagline: string;
  uniqueSellingPoints: string[];
  allowedClaims: string[];
  yearsInBusiness?: string;
  licenseNumber?: string;
  logoUrl?: string;
}

export interface CtaStrategy {
  primaryCta: {
    label: string;
    action: "tel" | "quote" | "contact";
    target: string;
  };
  secondaryCta: {
    label: string;
    action: "quote" | "services" | "contact";
    target: string;
  };
  stickyMobileCta: {
    enabled: boolean;
    label: string;
    phone: string;
  };
  trustBadges: string[];
  emergencyCallout?: {
    enabled: boolean;
    headline: string;
    subheadline: string;
    badgeText: string;
  };
}

export interface InternalLinkingStrategy {
  headerNav: {
    primaryLinks: Array<{ label: string; href: string }>;
    servicesDropdown?: Array<{ label: string; href: string }>;
    locationsDropdown?: Array<{ label: string; href: string }>;
  };
  footerNav: {
    serviceLinks: Array<{ label: string; href: string }>;
    locationLinks: Array<{ label: string; href: string }>;
    companyLinks: Array<{ label: string; href: string }>;
  };
  contextualRules: {
    serviceToLocations: boolean;
    locationToServices: boolean;
    allToContact: boolean;
    breadcrumbsEnabled: boolean;
  };
}

export interface ImageStrategy {
  provider: "bing" | "google" | "none" | "pexels" | "pixabay" | "ai" | string;
  imageProvider: string; // compatibility alias
  heroStyle: string;
  slotsRequired: number;
  perPageSlots: Record<string, number>;
  searchKeywords: Record<string, string[]>;
}

export interface SiteBlueprint {
  siteSeed: string;
  businessName: string;
  businessDescription: string;
  niche: string;
  primaryService: string;
  services: BlueprintService[];
  state: string;
  primaryCity: string;
  locations: BlueprintLocation[];
  neighborhoods: string[];
  keywords: string[];
  phone: string;
  address?: {
    street?: string;
    city: string;
    state: string;
    zip?: string;
    formatted: string;
  };
  serviceAreas: string[];
  brandInformation: BrandInformation;
  ctaStrategy: CtaStrategy;
  selectedTheme: string;
  theme: string; // compatibility alias
  layoutFamily: string;
  pageTypes: string[];
  pageCount: number;
  pages: BlueprintPage[];
  internalLinkingStrategy: InternalLinkingStrategy;
  imageStrategy: ImageStrategy;
  imageProvider: string; // compatibility alias
  contentVariationSeed: string;
  createdAt: number;
  version: string;
}

export interface BlueprintInput {
  businessName?: string;
  businessDescription?: string;
  niche?: string;
  businessType?: string;
  primaryService?: string;
  services?: (string | { name: string; slug?: string; description?: string })[];
  serviceCount?: number;
  primaryCity?: string;
  city?: string;
  state?: string;
  stateRegion?: string;
  locations?: (string | { name: string; city?: string; slug?: string; state?: string; neighborhoods?: string[] })[];
  locationCount?: number;
  neighborhoods?: string[];
  keywords?: string[] | string;
  targetKeywords?: string[] | string;
  phone?: string;
  streetAddress?: string;
  address?: string | { street?: string; city?: string; state?: string; zip?: string; formatted?: string };
  serviceAreas?: string[] | string;
  serviceAreasList?: string[];
  brandColors?: string;
  styleTone?: string;
  uniqueSellingPoints?: string;
  yearsInBusiness?: string;
  licenseNumber?: string;
  theme?: string | Theme;
  selectedTheme?: string;
  layoutFamily?: string;
  imageProvider?: "bing" | "google" | "none" | "pexels" | "pixabay" | "ai" | string;
  preferredSource?: "bing" | "google" | "none" | "pexels" | "pixabay" | "ai" | string;
  separateServicePages?: boolean;
  separateAreaPages?: boolean;
  pagesToCreate?: string[];
  customContentInstructions?: string;
  seedOverride?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function generateSiteSeed(city: string, niche: string, seedOverride?: string): string {
  if (seedOverride) return seedOverride;
  const cleanCity = city.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "LOC";
  const cleanNiche = niche.replace(/[^a-zA-Z]/g, "").toUpperCase() || "TRADE";
  // Generate deterministic 6-digit number based on city + niche string
  let hash = 0;
  const seedString = `${city}-${niche}`;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash) % 900000 + 100000;
  return `${cleanCity}-${cleanNiche}-${positiveHash}`;
}

function generateVariationSeed(siteSeed: string): string {
  return `cvs-${siteSeed.toLowerCase()}-v1`;
}

// ---------------------------------------------------------------------------
// Core Blueprint Factory
// ---------------------------------------------------------------------------

/**
 * Creates a structured, deterministic Site Blueprint from form data or raw input parameters.
 * Enforces strict site architecture before any content or HTML generation begins.
 */
export function createSiteBlueprint(input: BlueprintInput): SiteBlueprint {
  const nicheName = (input.niche || input.businessType || "Contractor").trim();
  const primaryCityName = (input.primaryCity || input.city || "Local Service Area").trim();
  const resolvedState = (input.state || input.stateRegion || "").trim();

  // 1. Lookup Niche Pack
  const nichePack = findNicheByIndustry(nicheName);
  const tradeCategory = nichePack?.name || nicheName;
  const tradeSlug = slugify(tradeCategory);

  // 2. Lookup City Metro from Database
  const cityMatch = US_CITIES.find(
    (c) => c.city.toLowerCase() === primaryCityName.toLowerCase()
  );
  const matchedState = cityMatch?.stateName || resolvedState;
  const matchedCounty = cityMatch?.county;

  // 3. Resolve Services (Strict: user-provided services win; no silent padding)
  const resolvedServices: BlueprintService[] = [];

  if (Array.isArray(input.services) && input.services.length > 0) {
    input.services.forEach((svc, index) => {
      if (typeof svc === "string") {
        const name = svc.trim();
        if (!name) return;
        const slug = slugify(name);
        resolvedServices.push({
          name,
          slug,
          description: `Professional, guaranteed ${name.toLowerCase()} in ${primaryCityName} and surrounding communities.`,
          isPrimary: index === 0,
          keywords: [`${name.toLowerCase()} ${primaryCityName.toLowerCase()}`, `${name.toLowerCase()} near me`],
        });
      } else if (svc && svc.name) {
        resolvedServices.push({
          name: svc.name,
          slug: svc.slug || slugify(svc.name),
          description: svc.description || `Expert ${svc.name.toLowerCase()} services in ${primaryCityName}.`,
          isPrimary: index === 0,
        });
      }
    });
  }

  // If user provided NO services at all, use primary service or trade default
  if (resolvedServices.length === 0) {
    const defaultSvcName = input.primaryService || `${tradeCategory} Services`;
    resolvedServices.push({
      name: defaultSvcName,
      slug: slugify(defaultSvcName),
      description: `Comprehensive ${defaultSvcName.toLowerCase()} delivered with upfront pricing and master craftsmanship.`,
      isPrimary: true,
      keywords: [`${defaultSvcName.toLowerCase()} ${primaryCityName.toLowerCase()}`, `local ${defaultSvcName.toLowerCase()}`],
    });
  }

  const primaryService = input.primaryService || resolvedServices[0]?.name || `${tradeCategory} Services`;

  // 4. Resolve Locations (Strict: user-selected locations only; NEVER invent or pad nearby cities)
  const resolvedLocations: BlueprintLocation[] = [];

  // Primary Location is always first
  resolvedLocations.push({
    name: primaryCityName,
    city: primaryCityName,
    state: matchedState,
    slug: slugify(primaryCityName),
    isPrimary: true,
    county: matchedCounty,
  });

  // Only add additional locations if explicitly provided by the user
  if (Array.isArray(input.locations) && input.locations.length > 0) {
    input.locations.forEach((loc) => {
      const locName = (typeof loc === "string" ? loc : loc?.name || loc?.city || "").trim();
      if (!locName || locName.toLowerCase() === primaryCityName.toLowerCase()) return;
      if (resolvedLocations.some((l) => l.city.toLowerCase() === locName.toLowerCase())) return;

      if (typeof loc === "string") {
        resolvedLocations.push({
          name: locName,
          city: locName,
          state: matchedState,
          slug: slugify(locName),
          isPrimary: false,
        });
      } else if (loc && (loc.name || loc.city)) {
        resolvedLocations.push({
          name: locName,
          city: loc.city || locName,
          state: loc.state || matchedState,
          slug: loc.slug || slugify(locName),
          isPrimary: false,
          neighborhoods: loc.neighborhoods,
        });
      }
    });
  }

  // 5. Neighborhoods (Strict: ONLY user-provided neighborhoods, never random defaults)
  const neighborhoods: string[] = Array.isArray(input.neighborhoods)
    ? input.neighborhoods.filter(Boolean)
    : [];

  // 6. Business Name, Phone, and Address
  const businessName = (
    input.businessName ||
    `${primaryCityName} ${tradeCategory === "Plumber" ? "Plumbing" : tradeCategory} Pros`
  ).trim();
  const phone = (input.phone || "(555) 000-0000").trim();
  const rawAddress = input.address || input.streetAddress;
  let formattedAddress: SiteBlueprint["address"];

  if (typeof rawAddress === "string" && rawAddress.trim()) {
    formattedAddress = {
      street: rawAddress.trim(),
      city: primaryCityName,
      state: matchedState,
      formatted: `${rawAddress.trim()}, ${primaryCityName}, ${matchedState}`,
    };
  } else if (rawAddress && typeof rawAddress === "object") {
    formattedAddress = {
      street: rawAddress.street,
      city: rawAddress.city || primaryCityName,
      state: rawAddress.state || matchedState,
      zip: rawAddress.zip,
      formatted: [rawAddress.street, rawAddress.city || primaryCityName, rawAddress.state || matchedState, rawAddress.zip]
        .filter(Boolean)
        .join(", "),
    };
  }

  // 7. Keywords (Strict: ONLY user-provided keywords; if none, use only primary service + city)
  let keywords: string[] = [];
  if (Array.isArray(input.keywords) && input.keywords.length > 0) {
    keywords = input.keywords.filter(Boolean);
  } else if (typeof input.keywords === "string" && input.keywords.trim()) {
    keywords = parseKeywordList(input.keywords);
  } else if (typeof input.targetKeywords === "string" && input.targetKeywords.trim()) {
    keywords = parseKeywordList(input.targetKeywords);
  } else {
    keywords = [`${primaryService.toLowerCase()} in ${primaryCityName.toLowerCase()}`];
  }

  // 8. Service Areas list
  const serviceAreas = resolvedLocations.map((l) => `${l.name}, ${l.state}`);

  // 9. Seeds & Theme
  const siteSeed = generateSiteSeed(primaryCityName, tradeCategory, input.seedOverride);
  const contentVariationSeed = generateVariationSeed(siteSeed);

  // Theme resolution
  let themeObj: Theme | undefined;
  if (typeof input.theme === "object" && input.theme?.id) {
    themeObj = input.theme;
  } else {
    const requestedId = typeof input.theme === "string" ? input.theme : input.selectedTheme;
    themeObj = THEMES.find((t) => t.id === requestedId);
    if (!themeObj) {
      // Choose best niche theme or default to modern-pro
      const tradeTheme = THEMES.find((t) => t.bestFor?.some((b) => b.toLowerCase().includes(tradeSlug)));
      themeObj = tradeTheme || THEMES[0];
    }
  }

  const selectedTheme = (typeof input.theme === "string" ? input.theme : input.selectedTheme) || themeObj.id;
  const layoutFamily = input.layoutFamily || (themeObj.id === "forge" ? "conversion" : "conversion");

  // 10. Brand Information
  const brandInformation: BrandInformation = {
    colors: { ...themeObj.colors },
    fonts: { ...themeObj.fonts },
    tone: (input.styleTone || "Authoritative, trustworthy, responsive, and locally rooted").trim(),
    tagline: `Your Trusted Local ${tradeCategory} in ${primaryCityName} & Surrounding Communities`,
    uniqueSellingPoints: [
      "Licensed, Bonded & Master Certified Technicians",
      "Upfront Flat-Rate Pricing with Zero Surprise Fees",
      "24/7 Rapid Emergency Dispatch",
      "100% Written Workmanship & Satisfaction Guarantee",
    ],
    allowedClaims: [
      "Licensed & Fully Insured",
      "Locally Owned & Operated",
      "Same-Day Service Available",
      "Free In-Home Estimates on Major Replacements",
    ],
    yearsInBusiness: input.yearsInBusiness || "15+",
    licenseNumber: input.licenseNumber || "IL-LIC-748291",
  };

  // 11. CTA Strategy
  const cleanPhone = phone.replace(/[^\d+]/g, "");
  const ctaStrategy: CtaStrategy = {
    primaryCta: {
      label: `Call ${phone}`,
      action: "tel",
      target: `tel:${cleanPhone}`,
    },
    secondaryCta: {
      label: "Get Free Quote",
      action: "contact",
      target: "contact.html",
    },
    stickyMobileCta: {
      enabled: true,
      label: `Call Now: ${phone}`,
      phone,
    },
    trustBadges: [
      "Master Licensed",
      "Fully Insured ($2M)",
      "Upfront Pricing",
      "24/7 Dispatch",
    ],
    emergencyCallout: {
      enabled: true,
      headline: `24/7 Emergency ${tradeCategory} in ${primaryCityName}`,
      subheadline: "On-call master technicians dispatching immediately with fully stocked trucks.",
      badgeText: "Average Arrival Under 45 Mins",
    },
  };

  // 12. Concrete Pages Construction
  const pages: BlueprintPage[] = [];

  // Home Page
  pages.push({
    path: "index.html",
    slug: "index",
    title: `${primaryCityName} Top-Rated ${tradeCategory} | ${businessName}`,
    type: "home",
    metaDescription: `Looking for a trusted ${tradeCategory.toLowerCase()} in ${primaryCityName}? ${businessName} provides 24/7 emergency repair, upfront pricing, and guaranteed results. Call ${phone}!`,
    h1: `${primaryCityName}'s Premier Licensed ${tradeCategory}`,
    breadcrumbs: [{ label: "Home", path: "index.html" }],
    sectionTypes: [
      "hero",
      "trustBar",
      "servicesGrid",
      "whyChooseUs",
      "howItWorks",
      "serviceAreas",
      "faqAccordion",
      "ctaBanner",
    ],
    targetKeywords: [
      `${tradeCategory.toLowerCase()} in ${primaryCityName.toLowerCase()}`,
      `best ${tradeCategory.toLowerCase()} ${primaryCityName.toLowerCase()}`,
      `${primaryCityName.toLowerCase()} emergency ${tradeCategory.toLowerCase()}`,
    ],
  });

  // About Page
  pages.push({
    path: "about.html",
    slug: "about",
    title: `About Our Team | ${businessName} ${primaryCityName}`,
    type: "about",
    metaDescription: `Learn why ${primaryCityName} homeowners and businesses have trusted ${businessName} for reliable ${tradeCategory.toLowerCase()} solutions for over 15 years.`,
    h1: `About ${businessName}`,
    breadcrumbs: [
      { label: "Home", path: "index.html" },
      { label: "About", path: "about.html" },
    ],
    sectionTypes: ["pageHero", "companyStory", "masterQualifications", "valuesGrid", "ctaBanner"],
    targetKeywords: [`about ${businessName.toLowerCase()}`, `licensed ${tradeCategory.toLowerCase()} ${primaryCityName.toLowerCase()}`],
  });

  // Services Directory Page
  pages.push({
    path: "services.html",
    slug: "services",
    title: `Professional ${tradeCategory} Services in ${primaryCityName} | ${businessName}`,
    type: "services",
    metaDescription: `Explore our comprehensive ${tradeCategory.toLowerCase()} services in ${primaryCityName}. From emergency repairs to installations, we do it all with guaranteed craftsmanship.`,
    h1: `Our ${tradeCategory} Services`,
    breadcrumbs: [
      { label: "Home", path: "index.html" },
      { label: "Services", path: "services.html" },
    ],
    sectionTypes: ["pageHero", "servicesGridDetailed", "processSteps", "guaranteeCard", "ctaBanner"],
    targetKeywords: [`${tradeCategory.toLowerCase()} services ${primaryCityName.toLowerCase()}`, `residential ${tradeCategory.toLowerCase()}`],
  });

  // Dedicated Service Pages
  for (const svc of resolvedServices) {
    const pagePath = `${svc.slug}.html`;
    pages.push({
      path: pagePath,
      slug: svc.slug,
      title: `${svc.name} in ${primaryCityName}, ${matchedState} | ${businessName}`,
      type: "individual-service",
      serviceName: svc.name,
      metaDescription: `Expert ${svc.name.toLowerCase()} in ${primaryCityName}, ${matchedState}. Fast response, transparent upfront pricing, and guaranteed repairs from ${businessName}.`,
      h1: `${svc.name} in ${primaryCityName}, ${matchedState}`,
      breadcrumbs: [
        { label: "Home", path: "index.html" },
        { label: "Services", path: "services.html" },
        { label: svc.name, path: pagePath },
      ],
      sectionTypes: ["pageHero", "serviceOverview", "commonProblemsSolved", "serviceProcess", "faqAccordion", "ctaBanner"],
      targetKeywords: [
        `${svc.name.toLowerCase()} ${primaryCityName.toLowerCase()}`,
        `${svc.name.toLowerCase()} near me`,
        `cost of ${svc.name.toLowerCase()}`,
      ],
    });
  }

  // Service Areas Directory Page
  pages.push({
    path: "service-areas.html",
    slug: "service-areas",
    title: `Service Areas & Local Coverage | ${businessName}`,
    type: "service-areas",
    metaDescription: `${businessName} proudly serves ${primaryCityName} and surrounding communities across ${matchedState}. Check our fast dispatch zones and call today!`,
    h1: `Service Areas in Greater ${primaryCityName}`,
    breadcrumbs: [
      { label: "Home", path: "index.html" },
      { label: "Service Areas", path: "service-areas.html" },
    ],
    sectionTypes: ["pageHero", "coverageMapGrid", "serviceLocationsList", "dispatchGuarantee", "ctaBanner"],
    targetKeywords: [`${tradeCategory.toLowerCase()} service areas`, `${primaryCityName.toLowerCase()} metro ${tradeCategory.toLowerCase()}`],
  });

  // Dedicated Location Pages (strictly for user-approved secondary locations)
  const secondaryLocations = resolvedLocations.filter((l) => !l.isPrimary);
  for (const loc of secondaryLocations) {
    const pagePath = `${tradeSlug}-${loc.slug}.html`;
    pages.push({
      path: pagePath,
      slug: `${tradeSlug}-${loc.slug}`,
      title: `${tradeCategory} in ${loc.name}, ${loc.state} | ${businessName}`,
      type: "individual-area",
      locationName: loc.name,
      metaDescription: `Need a reliable ${tradeCategory.toLowerCase()} in ${loc.name}, ${loc.state}? ${businessName} provides fast local dispatch, upfront pricing, and 24/7 service.`,
      h1: `Trusted Local ${tradeCategory} in ${loc.name}, ${loc.state}`,
      breadcrumbs: [
        { label: "Home", path: "index.html" },
        { label: "Service Areas", path: "service-areas.html" },
        { label: loc.name, path: pagePath },
      ],
      sectionTypes: ["pageHero", "localHighlights", "servicesOfferedInArea", "customerTestimonials", "ctaBanner"],
      targetKeywords: [
        `${tradeCategory.toLowerCase()} in ${loc.name.toLowerCase()} ${loc.state.toLowerCase()}`,
        `${loc.name.toLowerCase()} ${tradeCategory.toLowerCase()} company`,
        `emergency ${tradeCategory.toLowerCase()} ${loc.name.toLowerCase()}`,
      ],
    });
  }

  // Contact Page
  pages.push({
    path: "contact.html",
    slug: "contact",
    title: `Contact Us & Request Service | ${businessName}`,
    type: "contact",
    metaDescription: `Contact ${businessName} in ${primaryCityName}. Request a free quote, schedule service, or speak with an on-call master technician at ${phone}.`,
    h1: `Contact ${businessName}`,
    breadcrumbs: [
      { label: "Home", path: "index.html" },
      { label: "Contact", path: "contact.html" },
    ],
    sectionTypes: ["pageHero", "contactFormMap", "businessInfoHours", "emergencyBanner"],
    targetKeywords: [`contact ${businessName.toLowerCase()}`, `${tradeCategory.toLowerCase()} phone number ${primaryCityName.toLowerCase()}`],
  });

  // FAQ Page
  pages.push({
    path: "faq.html",
    slug: "faq",
    title: `Frequently Asked Questions | ${businessName} ${primaryCityName}`,
    type: "faq",
    metaDescription: `Got questions about ${tradeCategory.toLowerCase()} repairs, pricing, or emergency service in ${primaryCityName}? Find clear, upfront answers here.`,
    h1: `Frequently Asked Questions`,
    breadcrumbs: [
      { label: "Home", path: "index.html" },
      { label: "FAQ", path: "faq.html" },
    ],
    sectionTypes: ["pageHero", "faqCategories", "faqAccordionFull", "ctaBanner"],
    targetKeywords: [`${tradeCategory.toLowerCase()} faq`, `${tradeCategory.toLowerCase()} pricing ${primaryCityName.toLowerCase()}`],
  });

  // 13. Page Types List
  const pageTypes = Array.from(new Set(pages.map((p) => p.type)));

  // 14. Internal Linking Strategy
  const internalLinkingStrategy: InternalLinkingStrategy = {
    headerNav: {
      primaryLinks: [
        { label: "Home", href: "index.html" },
        { label: "About", href: "about.html" },
        { label: "Services", href: "services.html" },
        { label: "Locations", href: "service-areas.html" },
        { label: "FAQ", href: "faq.html" },
        { label: "Contact", href: "contact.html" },
      ],
      servicesDropdown: resolvedServices.map((s) => ({
        label: s.name,
        href: `${s.slug}.html`,
      })),
      locationsDropdown: secondaryLocations.map((l) => ({
        label: l.name,
        href: `${tradeSlug}-${l.slug}.html`,
      })),
    },
    footerNav: {
      serviceLinks: resolvedServices.map((s) => ({
        label: s.name,
        href: `${s.slug}.html`,
      })),
      locationLinks: secondaryLocations.map((l) => ({
        label: `${l.name}, ${l.state}`,
        href: `${tradeSlug}-${l.slug}.html`,
      })),
      companyLinks: [
        { label: "About Us", href: "about.html" },
        { label: "Services Directory", href: "services.html" },
        { label: "Service Areas", href: "service-areas.html" },
        { label: "FAQ", href: "faq.html" },
        { label: "Contact Us", href: "contact.html" },
      ],
    },
    contextualRules: {
      serviceToLocations: true,
      locationToServices: true,
      allToContact: true,
      breadcrumbsEnabled: true,
    },
  };

  // 15. Image Strategy
  const preferredImageProvider = input.preferredSource || input.imageProvider || "bing";
  const perPageSlots: Record<string, number> = {};
  const searchKeywords: Record<string, string[]> = {};

  pages.forEach((p) => {
    const slots = p.type === "home" ? 6 : p.type.startsWith("individual-") ? 3 : 2;
    perPageSlots[p.path] = slots;

    if (p.serviceName) {
      searchKeywords[p.path] = [
        `${p.serviceName} repair tools work`,
        `${p.serviceName} technician van`,
        `${primaryCityName} home ${p.serviceName.toLowerCase()}`,
      ];
    } else if (p.locationName) {
      searchKeywords[p.path] = [
        `${tradeCategory} van driving in ${p.locationName}`,
        `${p.locationName} street residential homes`,
        `${tradeCategory} master technician working`,
      ];
    } else {
      searchKeywords[p.path] = [
        `${tradeCategory} working professional tools`,
        `${primaryCityName} skyline street residential`,
      ];
    }
  });

  const totalSlotsRequired = Object.values(perPageSlots).reduce((a, b) => a + b, 0);

  const imageStrategy: ImageStrategy = {
    provider: preferredImageProvider,
    imageProvider: preferredImageProvider,
    heroStyle: themeObj.heroStyle || "Split two-column layout with high-resolution trade visual",
    slotsRequired: totalSlotsRequired,
    perPageSlots,
    searchKeywords,
  };

  // 16. Assemble Complete Blueprint
  return {
    siteSeed,
    businessName,
    businessDescription: (
      input.businessDescription ||
      `${businessName} is ${primaryCityName}'s premier provider of reliable, master-certified ${tradeCategory.toLowerCase()} services, offering 24/7 emergency dispatch, upfront pricing, and guaranteed satisfaction.`
    ).trim(),
    niche: (input.niche || tradeCategory).toLowerCase(),
    primaryService,
    services: resolvedServices,
    state: matchedState,
    primaryCity: primaryCityName,
    locations: resolvedLocations,
    neighborhoods,
    keywords,
    phone,
    address: formattedAddress,
    serviceAreas,
    brandInformation,
    ctaStrategy,
    selectedTheme,
    theme: selectedTheme, // alias
    layoutFamily,
    pageTypes,
    pageCount: pages.length,
    pages,
    internalLinkingStrategy,
    imageStrategy,
    imageProvider: preferredImageProvider, // alias
    contentVariationSeed,
    createdAt: Date.now(),
    version: "2.0.0",
  };
}

/**
 * Validates whether an object adheres to the SiteBlueprint schema.
 */
export function validateSiteBlueprint(bp: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!bp || typeof bp !== "object") {
    return { valid: false, errors: ["Blueprint is not an object"] };
  }

  const requiredFields = [
    "siteSeed",
    "businessName",
    "niche",
    "primaryService",
    "services",
    "state",
    "primaryCity",
    "locations",
    "keywords",
    "phone",
    "brandInformation",
    "ctaStrategy",
    "selectedTheme",
    "layoutFamily",
    "pageTypes",
    "pageCount",
    "pages",
    "internalLinkingStrategy",
    "imageStrategy",
    "contentVariationSeed",
  ];

  for (const field of requiredFields) {
    if (bp[field] === undefined || bp[field] === null) {
      errors.push(`Missing required blueprint field: ${field}`);
    }
  }

  if (Array.isArray(bp.services) && bp.services.length === 0) {
    errors.push("Blueprint must have at least one service defined.");
  }

  if (Array.isArray(bp.locations) && bp.locations.length === 0) {
    errors.push("Blueprint must have at least one location defined.");
  }

  if (Array.isArray(bp.pages) && bp.pages.length === 0) {
    errors.push("Blueprint must contain at least one page.");
  }

  return { valid: errors.length === 0, errors };
}

export const SiteBlueprintEngine = {
  createBlueprint: createSiteBlueprint,
  validateBlueprint: validateSiteBlueprint,
};

