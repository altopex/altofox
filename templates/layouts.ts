import { SectionJSON } from "../lib/generator/content-schema";

export type PageLayoutType =
  | "home"
  | "about"
  | "services"
  | "single-service"
  | "service-area"
  | "contact"
  | "faq"
  | "gallery"
  | "custom";

export interface PageLayoutBlueprint {
  type: PageLayoutType;
  defaultSections: {
    type: string;
    variant?: string;
  }[];
}

export const PAGE_LAYOUTS: Record<PageLayoutType, PageLayoutBlueprint> = {
  home: {
    type: "home",
    defaultSections: [
      { type: "emergencyBanner" },
      { type: "hero", variant: "split" },
      { type: "trustBar" },
      { type: "services", variant: "cards" },
      { type: "stats" },
      { type: "whyUs" },
      { type: "process" },
      { type: "serviceAreas" },
      { type: "testimonials", variant: "grid" },
      { type: "faq" },
      { type: "ctaBanner", variant: "locationMap" },
    ],
  },
  about: {
    type: "about",
    defaultSections: [
      { type: "hero", variant: "split" },
      { type: "about", variant: "split" },
      { type: "stats" },
      { type: "whyUs" },
      { type: "testimonials", variant: "grid" },
      { type: "ctaBanner", variant: "gradient" },
    ],
  },
  services: {
    type: "services",
    defaultSections: [
      { type: "hero", variant: "centered" },
      { type: "services", variant: "cards" },
      { type: "process" },
      { type: "whyUs" },
      { type: "faq" },
      { type: "ctaBanner", variant: "photo" },
    ],
  },
  "single-service": {
    type: "single-service",
    defaultSections: [
      { type: "hero", variant: "split" },
      { type: "about", variant: "split" },
      { type: "process" },
      { type: "whyUs" },
      { type: "faq" },
      { type: "ctaBanner", variant: "gradient" },
    ],
  },
  "service-area": {
    type: "service-area",
    defaultSections: [
      { type: "hero", variant: "split" },
      { type: "about", variant: "split" },
      { type: "services", variant: "icons" },
      { type: "testimonials", variant: "grid" },
      { type: "serviceAreas" },
      { type: "ctaBanner", variant: "photo" },
    ],
  },
  contact: {
    type: "contact",
    defaultSections: [
      { type: "hero", variant: "centered" },
      { type: "contactForm" },
      { type: "serviceAreas" },
      { type: "faq" },
    ],
  },
  faq: {
    type: "faq",
    defaultSections: [
      { type: "hero", variant: "centered" },
      { type: "faq" },
      { type: "whyUs" },
      { type: "ctaBanner", variant: "gradient" },
    ],
  },
  gallery: {
    type: "gallery",
    defaultSections: [
      { type: "hero", variant: "centered" },
      { type: "gallery" },
      { type: "testimonials", variant: "slider" },
      { type: "ctaBanner", variant: "photo" },
    ],
  },
  custom: {
    type: "custom",
    defaultSections: [
      { type: "hero", variant: "split" },
      { type: "about", variant: "split" },
      { type: "ctaBanner", variant: "gradient" },
    ],
  },
};

/**
 * Detects the page layout type based on slug or filename
 */
export function detectPageLayoutType(slug: string): PageLayoutType {
  const s = slug.toLowerCase().replace(/\.html$/, "");
  if (s === "index" || s === "home") return "home";
  if (s === "about" || s === "about-us") return "about";
  if (s === "services" || s === "all-services") return "services";
  if (s === "contact" || s === "contact-us") return "contact";
  if (s === "faq" || s === "faqs") return "faq";
  if (s === "gallery" || s === "projects") return "gallery";
  if (s === "service-areas" || s === "locations" || s === "areas") return "service-area";
  if (s.includes("-in-") || s.startsWith("plumber-") || s.startsWith("arborist-") || s.startsWith("electrician-") || s.startsWith("hvac-") || s.startsWith("roofer-")) {
    return "service-area";
  }
  return "single-service";
}

// --------------------------------------------------------------------------
// 4-Tier Theme / Layout Family System
// Theme -> Layout Family -> Section Variant -> Component Variant
// --------------------------------------------------------------------------

import { Theme } from "../lib/themes";

export type LayoutFamilyId =
  | "conversion-direct"
  | "craftsmanship-editorial"
  | "speed-dispatch"
  | "modern-service-pro";

export interface LayoutFamilyDefinition {
  id: LayoutFamilyId;
  name: string;
  description: string;
  sectionOrder: string[];
  compatibleHeroVariants: ("split" | "compact-bold" | "asymmetric" | "service-first" | "split-full")[];
  compatibleServicesVariants: ("cards" | "compact-list" | "alternating" | "softGrid" | "icons")[];
  compatibleTrustVariants: ("guarantee-highlight" | "trust-first-grid" | "standard")[];
  compatibleProcessVariants: ("cards" | "timeline")[];
  compatibleReviewsVariants: ("grid" | "slider" | "featured-quote")[];
  compatibleFaqVariants: ("accordion" | "cards-grid")[];
  compatibleCtaVariants: ("locationMap" | "split-phone" | "gradient" | "photo")[];
  compatibleHeaderVariants: ("emergency-bar" | "bold-call" | "split-phone" | "standard" | "centered")[];
  compatibleFooterVariants: ("multi-column" | "simple-compact" | "editorial-contact")[];
  componentTokens: {
    badgeStyle: string;
    buttonStyle: string;
    cardStyle: string;
  };
}

export const LAYOUT_FAMILIES: Record<LayoutFamilyId, LayoutFamilyDefinition> = {
  "conversion-direct": {
    id: "conversion-direct",
    name: "Direct Conversion & Urgency",
    description: "Urgency-focused layout prioritizing immediate calls, emergency dispatch banners, guarantee highlights, and clear pricing reassurance.",
    sectionOrder: [
      "emergencyBanner",
      "hero",
      "trustBar",
      "services",
      "whyUs",
      "process",
      "serviceAreas",
      "testimonials",
      "faq",
      "ctaBanner",
    ],
    compatibleHeroVariants: ["split", "compact-bold"],
    compatibleServicesVariants: ["cards", "compact-list"],
    compatibleTrustVariants: ["guarantee-highlight", "standard"],
    compatibleProcessVariants: ["cards"],
    compatibleReviewsVariants: ["grid"],
    compatibleFaqVariants: ["accordion"],
    compatibleCtaVariants: ["locationMap", "split-phone"],
    compatibleHeaderVariants: ["emergency-bar", "bold-call"],
    compatibleFooterVariants: ["multi-column"],
    componentTokens: {
      badgeStyle: "badge-emergency",
      buttonStyle: "btn-pulsing",
      cardStyle: "card-bordered",
    },
  },

  "craftsmanship-editorial": {
    id: "craftsmanship-editorial",
    name: "Craftsmanship & Editorial Authority",
    description: "Story and credibility-driven layout showcasing trade mastery, connected process timeline, alternating service highlights, and prominent customer quotes.",
    sectionOrder: [
      "hero",
      "trustBar",
      "services",
      "process",
      "whyUs",
      "testimonials",
      "serviceAreas",
      "faq",
      "ctaBanner",
    ],
    compatibleHeroVariants: ["asymmetric", "split-full"],
    compatibleServicesVariants: ["alternating", "cards"],
    compatibleTrustVariants: ["trust-first-grid", "standard"],
    compatibleProcessVariants: ["timeline"],
    compatibleReviewsVariants: ["featured-quote", "slider"],
    compatibleFaqVariants: ["cards-grid"],
    compatibleCtaVariants: ["gradient", "photo", "split-phone"],
    compatibleHeaderVariants: ["split-phone", "standard"],
    compatibleFooterVariants: ["editorial-contact"],
    componentTokens: {
      badgeStyle: "badge-refined",
      buttonStyle: "btn-sharp",
      cardStyle: "card-elevated",
    },
  },

  "speed-dispatch": {
    id: "speed-dispatch",
    name: "Fast Local Dispatch & Triage",
    description: "Rapid service dispatch architecture featuring scannable compact service lists, direct call triage, clean trust signals, and rapid booking.",
    sectionOrder: [
      "emergencyBanner",
      "hero",
      "services",
      "trustBar",
      "process",
      "whyUs",
      "testimonials",
      "serviceAreas",
      "ctaBanner",
      "faq",
    ],
    compatibleHeroVariants: ["compact-bold", "service-first"],
    compatibleServicesVariants: ["compact-list", "cards"],
    compatibleTrustVariants: ["guarantee-highlight"],
    compatibleProcessVariants: ["cards", "timeline"],
    compatibleReviewsVariants: ["grid"],
    compatibleFaqVariants: ["accordion"],
    compatibleCtaVariants: ["split-phone", "locationMap"],
    compatibleHeaderVariants: ["emergency-bar", "bold-call"],
    compatibleFooterVariants: ["simple-compact"],
    componentTokens: {
      badgeStyle: "badge-emergency",
      buttonStyle: "btn-call-primary",
      cardStyle: "card-bordered",
    },
  },

  "modern-service-pro": {
    id: "modern-service-pro",
    name: "Modern Contemporary Pro",
    description: "Balanced contemporary architecture with soft visual grids, connected timeline, scannable Q&A, and comprehensive service overviews.",
    sectionOrder: [
      "hero",
      "services",
      "trustBar",
      "whyUs",
      "process",
      "serviceAreas",
      "testimonials",
      "faq",
      "ctaBanner",
    ],
    compatibleHeroVariants: ["service-first", "split"],
    compatibleServicesVariants: ["cards", "softGrid", "icons"],
    compatibleTrustVariants: ["standard", "trust-first-grid"],
    compatibleProcessVariants: ["timeline", "cards"],
    compatibleReviewsVariants: ["slider", "grid"],
    compatibleFaqVariants: ["cards-grid", "accordion"],
    compatibleCtaVariants: ["locationMap", "gradient"],
    compatibleHeaderVariants: ["standard", "centered"],
    compatibleFooterVariants: ["multi-column", "simple-compact"],
    componentTokens: {
      badgeStyle: "badge",
      buttonStyle: "btn-rounded",
      cardStyle: "card-soft",
    },
  },
};

/**
 * Compatible Layout Families for each Theme.
 * Every theme can harmoniously adopt 2–3 different layout families based on the site seed.
 */
export const THEME_COMPATIBLE_FAMILIES: Record<string, LayoutFamilyId[]> = {
  "pipe-and-wrench": ["conversion-direct", "craftsmanship-editorial", "speed-dispatch"],
  "forge": ["conversion-direct", "craftsmanship-editorial", "speed-dispatch"],
  "spark-and-wire": ["speed-dispatch", "conversion-direct", "modern-service-pro"],
  "cool-breeze": ["modern-service-pro", "conversion-direct", "craftsmanship-editorial"],
  "storm-shield": ["conversion-direct", "craftsmanship-editorial", "speed-dispatch"],
  "green-roots": ["craftsmanship-editorial", "modern-service-pro", "conversion-direct"],
  "clean-sweep": ["modern-service-pro", "conversion-direct", "craftsmanship-editorial"],
  "iron-grip": ["conversion-direct", "speed-dispatch", "craftsmanship-editorial"],
  "master-craft": ["craftsmanship-editorial", "modern-service-pro", "conversion-direct"],
  "secure-home": ["conversion-direct", "modern-service-pro", "craftsmanship-editorial"],
  "rapid-response": ["speed-dispatch", "conversion-direct", "modern-service-pro"],
};

export interface ResolvedLayoutStructure {
  themeId: string;
  themeName: string;
  layoutFamily: LayoutFamilyId;
  layoutFamilyName: string;
  headerVariant: "emergency-bar" | "bold-call" | "split-phone" | "standard" | "centered";
  heroVariant: "split" | "compact-bold" | "asymmetric" | "service-first" | "split-full";
  trustVariant: "guarantee-highlight" | "trust-first-grid" | "standard";
  servicesVariant: "cards" | "compact-list" | "alternating" | "softGrid" | "icons";
  processVariant: "cards" | "timeline";
  reviewsVariant: "grid" | "slider" | "featured-quote";
  faqVariant: "accordion" | "cards-grid";
  ctaVariant: "locationMap" | "split-phone" | "gradient" | "photo";
  footerVariant: "multi-column" | "simple-compact" | "editorial-contact";
  sectionOrder: string[];
  componentVariants: {
    badgeStyle: string;
    buttonStyle: string;
    cardStyle: string;
  };
}

/**
 * Deterministically computes a positive 31-bit integer hash from any string seed.
 */
export function hashSeedToInt(seed: string): number {
  if (!seed) return 0;
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) + hash) + seed.charCodeAt(i);
    hash = hash & 0x7fffffff;
  }
  return hash;
}

/**
 * Resolves the complete 4-tier layout structure deterministically from Theme + Site Seed.
 * Theme -> Layout Family -> Section Variant -> Component Variant
 */
export function resolveThemeLayoutStructure(
  theme: Theme,
  siteSeed: string,
  preferredFamily?: string
): ResolvedLayoutStructure {
  const seed = siteSeed || theme.id || "default-site-seed";

  // 1. Resolve compatible layout families for this theme
  const compatibleFamilyIds =
    THEME_COMPATIBLE_FAMILIES[theme.id] ||
    THEME_COMPATIBLE_FAMILIES["pipe-and-wrench"] ||
    ["conversion-direct", "craftsmanship-editorial", "speed-dispatch"];

  // 2. Select Layout Family
  let selectedFamilyId: LayoutFamilyId;
  if (preferredFamily && preferredFamily in LAYOUT_FAMILIES) {
    selectedFamilyId = preferredFamily as LayoutFamilyId;
  } else {
    const familyIndex = hashSeedToInt(seed) % compatibleFamilyIds.length;
    selectedFamilyId = compatibleFamilyIds[familyIndex];
  }

  const family = LAYOUT_FAMILIES[selectedFamilyId] || LAYOUT_FAMILIES["conversion-direct"];

  // 3. Select Section Variants deterministically within the chosen harmonious family
  const heroVariant =
    family.compatibleHeroVariants[
      hashSeedToInt(seed + ":hero") % family.compatibleHeroVariants.length
    ];
  const servicesVariant =
    family.compatibleServicesVariants[
      hashSeedToInt(seed + ":services") % family.compatibleServicesVariants.length
    ];
  const trustVariant =
    family.compatibleTrustVariants[
      hashSeedToInt(seed + ":trust") % family.compatibleTrustVariants.length
    ];
  const processVariant =
    family.compatibleProcessVariants[
      hashSeedToInt(seed + ":process") % family.compatibleProcessVariants.length
    ];
  const reviewsVariant =
    family.compatibleReviewsVariants[
      hashSeedToInt(seed + ":reviews") % family.compatibleReviewsVariants.length
    ];
  const faqVariant =
    family.compatibleFaqVariants[
      hashSeedToInt(seed + ":faq") % family.compatibleFaqVariants.length
    ];
  const ctaVariant =
    family.compatibleCtaVariants[
      hashSeedToInt(seed + ":cta") % family.compatibleCtaVariants.length
    ];
  const headerVariant =
    family.compatibleHeaderVariants[
      hashSeedToInt(seed + ":header") % family.compatibleHeaderVariants.length
    ];
  const footerVariant =
    family.compatibleFooterVariants[
      hashSeedToInt(seed + ":footer") % family.compatibleFooterVariants.length
    ];

  return {
    themeId: theme.id,
    themeName: theme.name,
    layoutFamily: selectedFamilyId,
    layoutFamilyName: family.name,
    headerVariant,
    heroVariant,
    trustVariant,
    servicesVariant,
    processVariant,
    reviewsVariant,
    faqVariant,
    ctaVariant,
    footerVariant,
    sectionOrder: [...family.sectionOrder],
    componentVariants: { ...family.componentTokens },
  };
}
