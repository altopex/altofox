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
      { type: "ctaBanner", variant: "gradient" },
      { type: "contactForm" },
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
      { type: "contactForm" },
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
      { type: "contactForm" },
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
      { type: "contactForm" },
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
      { type: "contactForm" },
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
