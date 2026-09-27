export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
}

export interface ThemeFonts {
  heading: string;
  body: string;
}

export interface ThemeLayoutStructure {
  headerVariant: "standard" | "centered" | "split-phone" | "minimal" | "emergency-bar" | "bold-call";
  heroLayout: "split" | "split-full" | "compact-bold" | "asymmetric" | "minimal" | "service-first" | "soft" | "high-contrast";
  sectionOrder: string[]; // Order of homepage sections
  serviceCardVariant: "cards" | "icons" | "alternating" | "compact-list" | "softGrid";
  trustVariant?: "standard" | "trust-first-grid" | "guarantee-highlight";
  footerVariant?: "multi-column" | "simple-compact" | "editorial-contact";
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  bestFor: string[];
  colors: ThemeColors;
  fonts: ThemeFonts;
  borderRadius: string;
  buttonStyle: string;
  heroStyle: string;
  sectionStyle: string;
  designNotes: string;
  layoutStructure?: ThemeLayoutStructure;
  designCharacteristics?: string[];
  isLegacy?: boolean;
}

export interface CustomThemeOverrides {
  primary?: string;
  accent?: string;
  background?: string;
}

export const THEMES: Theme[] = [
  // 1. MODERN LOCAL PRO
  {
    id: "modern-local-pro",
    name: "Modern Local Pro",
    description: "Balanced card grid, prominent hero with right photo, clear typography, and strong phone call conversions.",
    bestFor: ["Plumbers", "Electricians", "HVAC", "Contractors", "General Trades"],
    colors: {
      primary: "#1D4ED8",
      secondary: "#0F172A",
      accent: "#0EA5E9",
      background: "#F8FAFC",
      surface: "#FFFFFF",
      text: "#0F172A",
      muted: "#64748B",
    },
    fonts: {
      heading: "Plus Jakarta Sans",
      body: "Inter",
    },
    borderRadius: "12px",
    buttonStyle: "Rounded 12px with subtle drop shadow and smooth hover lift",
    heroStyle: "Two-column split hero with high-visibility phone CTA and service photo right",
    sectionStyle: "Clean 12px rounded cards with 1px border (#E2E8F0) and soft shadows",
    designNotes:
      "Modern, corporate, trustworthy trade aesthetic. Balanced layout with strong contrast and clear call hierarchy. Features 12px rounded cards, floating trust badge, and prominent tel: click-to-call actions.",
    layoutStructure: {
      headerVariant: "standard",
      heroLayout: "split",
      sectionOrder: ["emergencyBanner", "hero", "trustBar", "services", "whyUs", "testimonials", "serviceAreas", "ctaBanner"],
      serviceCardVariant: "cards",
      trustVariant: "standard",
      footerVariant: "multi-column",
    },
    designCharacteristics: [
      "Two-column split hero layout",
      "Clean 12px rounded cards",
      "Prominent phone CTA with trust badge",
      "Verified customer rating card",
      "Comprehensive service grid",
    ],
  },

  // 2. SPLIT HERO
  {
    id: "split-hero",
    name: "Split Hero",
    description: "Large two-column hero with full-height imagery on right, structured conversion flow with services right after hero.",
    bestFor: ["Roofing", "Solar", "Remodeling", "Garage Doors", "Painting"],
    colors: {
      primary: "#2563EB",
      secondary: "#0B132B",
      accent: "#38BDF8",
      background: "#F8FAFC",
      surface: "#FFFFFF",
      text: "#0F172A",
      muted: "#64748B",
    },
    fonts: {
      heading: "Montserrat",
      body: "Inter",
    },
    borderRadius: "8px",
    buttonStyle: "Crisp 8px corners with heavy drop shadow and bold typography",
    heroStyle: "Full-height two-column hero with text left and edge-to-edge service photo right",
    sectionStyle: "Structured sequential panels: Services → Benefits → Process → Reviews → Areas → Final CTA",
    designNotes:
      "High-impact visual layout where services appear immediately beneath the hero, followed by step-by-step process and reviews. Full-height hero image provides maximum visual authority.",
    layoutStructure: {
      headerVariant: "split-phone",
      heroLayout: "split-full",
      sectionOrder: ["hero", "services", "whyUs", "process", "testimonials", "serviceAreas", "ctaBanner"],
      serviceCardVariant: "cards",
      trustVariant: "guarantee-highlight",
      footerVariant: "multi-column",
    },
    designCharacteristics: [
      "Full-height hero image right",
      "Services placed directly below hero",
      "Sequential step-by-step process timeline",
      "Split-phone header with bold dispatch number",
      "Structured high-conversion flow",
    ],
  },

  // 3. BOLD CONVERSION
  {
    id: "bold-conversion",
    name: "Bold Conversion",
    description: "High-visibility emergency dispatch styling with prominent CALL NOW buttons and large scannable service cards.",
    bestFor: ["Emergency Plumbing", "Towing", "Locksmith", "Water Damage", "24/7 HVAC"],
    colors: {
      primary: "#EA580C",
      secondary: "#0B132B",
      accent: "#F59E0B",
      background: "#F8FAFC",
      surface: "#FFFFFF",
      text: "#0F172A",
      muted: "#475569",
    },
    fonts: {
      heading: "Montserrat",
      body: "Inter",
    },
    borderRadius: "6px",
    buttonStyle: "Sharp 6px buttons with high-contrast safety orange and pulsing call icon",
    heroStyle: "Compact high-impact hero with immediate 24/7 dispatch call banner and zero delay",
    sectionStyle: "High-contrast industrial cards with large scannable service action triggers",
    designNotes:
      "Engineered for urgent local searches where phone call speed is paramount. High visibility emergency top bar, industrial navy backdrops, and safety orange emergency CTA triggers.",
    layoutStructure: {
      headerVariant: "emergency-bar",
      heroLayout: "compact-bold",
      sectionOrder: ["emergencyBanner", "hero", "trustBar", "services", "whyUs", "process", "serviceAreas", "ctaBanner"],
      serviceCardVariant: "compact-list",
      trustVariant: "guarantee-highlight",
      footerVariant: "multi-column",
    },
    designCharacteristics: [
      "High-visibility 24/7 emergency top bar",
      "Compact high-impact hero with instant call trigger",
      "Large scannable service cards with direct call buttons",
      "Heavy industrial 6px borders & typography",
      "Multi-stage urgent phone CTAs",
    ],
  },

  // 4. PREMIUM LOCAL
  {
    id: "premium-local",
    name: "Premium Local",
    description: "High-end editorial aesthetic with refined serif typography, generous whitespace, and champagne gold accents.",
    bestFor: ["Luxury Remodeling", "Custom Builders", "Architectural Landscaping", "High-End Trades", "Interior Design"],
    colors: {
      primary: "#1C1917",
      secondary: "#292524",
      accent: "#D97706",
      background: "#FAFAF9",
      surface: "#FFFFFF",
      text: "#1C1917",
      muted: "#78716C",
    },
    fonts: {
      heading: "Playfair Display",
      body: "Lato",
    },
    borderRadius: "4px",
    buttonStyle: "Refined 4px corners, thin gold borders, and elegant uppercase tracking",
    heroStyle: "Editorial asymmetric hero with refined serif headlines and framed project photography",
    sectionStyle: "Generous vertical whitespace, thin 1px gold hairline borders, and understated cards",
    designNotes:
      "Exudes prestige, authority, and meticulous craft. Playfair Display headlines paired with Lato for high-end local contractors. Ivory backdrop and champagne gold details.",
    layoutStructure: {
      headerVariant: "centered",
      heroLayout: "asymmetric",
      sectionOrder: ["hero", "trustBar", "whyUs", "services", "testimonials", "serviceAreas", "ctaBanner"],
      serviceCardVariant: "cards",
      trustVariant: "standard",
      footerVariant: "multi-column",
    },
    designCharacteristics: [
      "Refined Playfair Display serif typography",
      "Generous whitespace & breathing room",
      "Thin 1px champagne gold borders",
      "Centered logo & balanced navigation",
      "Subtle luxury drop shadows",
    ],
  },

  // 5. EDITORIAL MODERN
  {
    id: "editorial-modern",
    name: "Editorial Modern",
    description: "Magazine-inspired layout with asymmetric sections, alternating image/text storytelling, and narrative trust flow.",
    bestFor: ["Landscaping", "Kitchen & Bath", "Custom Cabinetry", "Masonry", "Exterior Design"],
    colors: {
      primary: "#0F172A",
      secondary: "#1E293B",
      accent: "#4F46E5",
      background: "#F8FAFC",
      surface: "#FFFFFF",
      text: "#0F172A",
      muted: "#64748B",
    },
    fonts: {
      heading: "DM Serif Display",
      body: "Plus Jakarta Sans",
    },
    borderRadius: "10px",
    buttonStyle: "Sleek 10px rounded buttons with refined indigo contrast",
    heroStyle: "Editorial storytelling hero with offset photo frame and large headline typography",
    sectionStyle: "Alternating photo/text service features that walk clients through craft and expertise",
    designNotes:
      "Visual magazine aesthetic designed for visual craftsmanship trades. Alternating editorial layout breaks the standard repetitive box feel with rich narrative flow.",
    layoutStructure: {
      headerVariant: "minimal",
      heroLayout: "asymmetric",
      sectionOrder: ["hero", "services", "whyUs", "testimonials", "process", "serviceAreas", "ctaBanner"],
      serviceCardVariant: "alternating",
      trustVariant: "standard",
      footerVariant: "editorial-contact",
    },
    designCharacteristics: [
      "Magazine-style editorial layout",
      "Alternating image/text service storytelling",
      "Artistic typography pairing (DM Serif + Plus Jakarta)",
      "Asymmetric section rhythm & offset cards",
      "Narrative client trust highlights",
    ],
  },

  // 6. CLEAN MINIMAL
  {
    id: "clean-minimal",
    name: "Clean Minimal",
    description: "Stark Swiss-inspired precision with generous negative space, minimal navigation, and crisp hairline grid borders.",
    bestFor: ["Engineering", "Inspection Services", "Architects", "Commercial Trades", "HVAC Efficiency"],
    colors: {
      primary: "#09090B",
      secondary: "#18181B",
      accent: "#2563EB",
      background: "#FFFFFF",
      surface: "#F4F4F5",
      text: "#09090B",
      muted: "#71717A",
    },
    fonts: {
      heading: "Space Grotesk",
      body: "Inter",
    },
    borderRadius: "4px",
    buttonStyle: "Crisp 4px rectangular button with sharp contrast and solid monochrome hover",
    heroStyle: "Typographic hero with oversized headline, clean negative space, and single direct CTA",
    sectionStyle: "Minimalist grid with 1px hairline borders, spacious white backdrop, and zero clutter",
    designNotes:
      "Swiss-inspired, hyper-clean typography. Space Grotesk geometric headings with Inter body. Stark black-on-white palette punctuated by electric blue, with zero extraneous ornamentation.",
    layoutStructure: {
      headerVariant: "minimal",
      heroLayout: "minimal",
      sectionOrder: ["hero", "services", "whyUs", "process", "serviceAreas", "ctaBanner"],
      serviceCardVariant: "icons",
      trustVariant: "standard",
      footerVariant: "simple-compact",
    },
    designCharacteristics: [
      "Generous negative space & zero clutter",
      "Minimal Swiss-style navigation",
      "Crisp 1px hairline borders",
      "Space Grotesk high-precision typography",
      "Large photo blocks without distracting decoration",
    ],
  },

  // 7. TRUST FIRST
  {
    id: "trust-first",
    name: "Trust First",
    description: "Credibility-centered layout prioritizing licenses, verified reviews, warranties, and buyer reassurance before services.",
    bestFor: ["Pest Control", "Foundation Repair", "Water Heaters", "Electrical Services", "Roof Leak Repair"],
    colors: {
      primary: "#0369A1",
      secondary: "#0C4A6E",
      accent: "#059669",
      background: "#F0F9FF",
      surface: "#FFFFFF",
      text: "#0F172A",
      muted: "#475569",
    },
    fonts: {
      heading: "Poppins",
      body: "Inter",
    },
    borderRadius: "12px",
    buttonStyle: "Rounded 12px button with peace-of-mind guarantee shield and confident call action",
    heroStyle: "Credibility hero with upfront licensing, warranty badges, and verified review stars",
    sectionStyle: "Trust signals first: Credentials → Why Choose Us → Services → Guarantees → FAQ",
    designNotes:
      "Optimized for risk-averse homeowners who need reassurance. Puts verified facts, licenses, and customer ratings front and center, with a dedicated FAQ section to dissolve doubts.",
    layoutStructure: {
      headerVariant: "standard",
      heroLayout: "split",
      sectionOrder: ["hero", "trustBar", "whyUs", "services", "process", "testimonials", "serviceAreas", "faq", "ctaBanner"],
      serviceCardVariant: "cards",
      trustVariant: "trust-first-grid",
      footerVariant: "multi-column",
    },
    designCharacteristics: [
      "Immediate trust & license proof above the fold",
      "Extensive guarantee badges & warranty reassurance",
      "Step-by-step transparent process",
      "Dedicated FAQ section addressing customer doubts",
      "Emerald assurance highlights & verified reviews",
    ],
  },

  // 8. MODERN SERVICE GRID
  {
    id: "modern-service-grid",
    name: "Modern Service Grid",
    description: "Service-first layout with a compact hero and prominent interactive cards linking directly to dedicated service pages.",
    bestFor: ["Multi-Trade Companies", "Full-Service Plumbers", "HVAC Specialists", "Handyman Services", "Appliance Repair"],
    colors: {
      primary: "#0284C7",
      secondary: "#0F172A",
      accent: "#F97316",
      background: "#F8FAFC",
      surface: "#FFFFFF",
      text: "#0F172A",
      muted: "#64748B",
    },
    fonts: {
      heading: "Plus Jakarta Sans",
      body: "Inter",
    },
    borderRadius: "10px",
    buttonStyle: "10px rounded buttons with bright dispatch accent badge and quick response icons",
    heroStyle: "Streamlined hero that fast-tracks visitors straight to the primary services showcase",
    sectionStyle: "Prominent interactive service cards with direct inner-page links and quick dispatch triggers",
    designNotes:
      "For businesses offering multiple distinct services. Reduces scrolling friction so visitors find their exact repair need instantly and can call directly from any card.",
    layoutStructure: {
      headerVariant: "standard",
      heroLayout: "service-first",
      sectionOrder: ["hero", "services", "trustBar", "whyUs", "serviceAreas", "testimonials", "ctaBanner"],
      serviceCardVariant: "cards",
      trustVariant: "standard",
      footerVariant: "multi-column",
    },
    designCharacteristics: [
      "Compact hero leading straight to services",
      "Interactive service cards with subpage links",
      "3-step quick dispatch indicator",
      "High-efficiency browsing for multi-trade businesses",
      "Direct Call for Service action on every card",
    ],
  },

  // 9. CONTEMPORARY SOFT
  {
    id: "contemporary-soft",
    name: "Contemporary Soft",
    description: "Friendly and approachable design with 20px rounded cards, pill-shaped buttons, and calming soft backgrounds.",
    bestFor: ["Home Care", "Cleaning Services", "Landscaping & Lawn", "Pool Maintenance", "Pet Care"],
    colors: {
      primary: "#0D9488",
      secondary: "#134E4A",
      accent: "#14B8A6",
      background: "#F0FDFA",
      surface: "#FFFFFF",
      text: "#134E4A",
      muted: "#64748B",
    },
    fonts: {
      heading: "Poppins",
      body: "Inter",
    },
    borderRadius: "20px",
    buttonStyle: "Pill-shaped (rounded-full) button with gentle mint shadows and smooth hover bounce",
    heroStyle: "Welcoming soft hero with friendly imagery, reassuring badges, and clear phone CTA",
    sectionStyle: "20px extra-rounded cards, soft mint background tints, and gentle multi-layer shadows",
    designNotes:
      "Approachable, warm, and highly trustworthy. Soft 20px radii, pill buttons, and tranquil mint/teal hues create an inviting, pressure-free customer experience.",
    layoutStructure: {
      headerVariant: "centered",
      heroLayout: "soft",
      sectionOrder: ["hero", "trustBar", "services", "whyUs", "testimonials", "process", "serviceAreas", "ctaBanner"],
      serviceCardVariant: "softGrid",
      trustVariant: "standard",
      footerVariant: "multi-column",
    },
    designCharacteristics: [
      "20px extra-rounded cards & containers",
      "Pill-shaped (rounded-full) action buttons",
      "Soft soothing mint/teal surfaces",
      "Warm and welcoming typography (Poppins)",
      "Gentle multi-layer shadows",
    ],
  },

  // 10. HIGH CONTRAST MODERN
  {
    id: "high-contrast-modern",
    name: "High Contrast Modern",
    description: "Pure white canvas with bold dark surfaces, 2px crisp defined borders, and high-visibility phone callouts.",
    bestFor: ["Heavy Contractors", "Demolition", "Excavation", "Commercial Roofing", "Paving"],
    colors: {
      primary: "#0F172A",
      secondary: "#020617",
      accent: "#EA580C",
      background: "#FFFFFF",
      surface: "#F8FAFC",
      text: "#020617",
      muted: "#475569",
    },
    fonts: {
      heading: "Outfit",
      body: "Inter",
    },
    borderRadius: "8px",
    buttonStyle: "8px buttons with 2px crisp dark border and safety amber emergency callout",
    heroStyle: "High-contrast split hero with dark accent surface cards and prominent call banner",
    sectionStyle: "Crisp light canvas punctuated by deep black surface cards and defined 2px borders",
    designNotes:
      "Modern high-contrast aesthetic. Pure white canvas, pitch black headings (Outfit), crisp 2px defined borders, and vibrant safety orange call triggers.",
    layoutStructure: {
      headerVariant: "bold-call",
      heroLayout: "high-contrast",
      sectionOrder: ["emergencyBanner", "hero", "services", "trustBar", "whyUs", "serviceAreas", "testimonials", "ctaBanner"],
      serviceCardVariant: "cards",
      trustVariant: "guarantee-highlight",
      footerVariant: "multi-column",
    },
    designCharacteristics: [
      "Pure white canvas with dark contrast surfaces",
      "Crisp 2px defined borders throughout",
      "Vibrant high-contrast CTA buttons",
      "Fast-scan Outfit bold typography",
      "High-visibility emergency phone callout",
    ],
  },

  // --------------------------------------------------------------------------
  // BACKWARD COMPATIBILITY ALIASES (Preserves historical project IDs and tests)
  // --------------------------------------------------------------------------
  {
    id: "modern-pro",
    name: "Modern Local Pro",
    description: "Clean, trustworthy corporate aesthetic (legacy alias).",
    bestFor: ["Contractors", "HVAC", "Plumbers", "Electricians"],
    colors: {
      primary: "#1D4ED8",
      secondary: "#0F172A",
      accent: "#0EA5E9",
      background: "#F8FAFC",
      surface: "#FFFFFF",
      text: "#0F172A",
      muted: "#64748B",
    },
    fonts: { heading: "Plus Jakarta Sans", body: "Inter" },
    borderRadius: "12px",
    buttonStyle: "Rounded 12px with subtle drop shadow",
    heroStyle: "Split hero with right photo",
    sectionStyle: "Card-based layout",
    designNotes: "Legacy alias for modern-local-pro",
    isLegacy: true,
  },
  {
    id: "bold-trade",
    name: "Bold Conversion",
    description: "Heavy industrial strength aesthetic (legacy alias).",
    bestFor: ["Roofing", "Auto Repair", "Towing", "Construction"],
    colors: {
      primary: "#EA580C",
      secondary: "#0B132B",
      accent: "#FBBF24",
      background: "#F8FAFC",
      surface: "#FFFFFF",
      text: "#0F172A",
      muted: "#64748B",
    },
    fonts: { heading: "Montserrat", body: "Inter" },
    borderRadius: "6px",
    buttonStyle: "Sharp 6px corners",
    heroStyle: "Full-width dark navy hero",
    sectionStyle: "High-contrast panels",
    designNotes: "Legacy alias for bold-conversion",
    isLegacy: true,
  },
  {
    id: "clean-medical",
    name: "Clean Medical",
    description: "Pristine white, soft teal and mint (legacy alias).",
    bestFor: ["Dentists", "Clinics", "Therapists", "Home Care"],
    colors: {
      primary: "#0D9488",
      secondary: "#115E59",
      accent: "#2DD4BF",
      background: "#F0FDFA",
      surface: "#FFFFFF",
      text: "#134E4A",
      muted: "#64748B",
    },
    fonts: { heading: "Poppins", body: "Inter" },
    borderRadius: "16px",
    buttonStyle: "Soft rounded 16px pill buttons",
    heroStyle: "Calm, welcoming hero",
    sectionStyle: "Generous whitespace, floating cards",
    designNotes: "Legacy alias for contemporary-soft",
    isLegacy: true,
  },
  {
    id: "luxury-elegant",
    name: "Luxury Elegant",
    description: "Rich noir black, warm ivory, and champagne gold (legacy alias).",
    bestFor: ["Law Firms", "Real Estate", "Spas", "High-End Salons"],
    colors: {
      primary: "#1C1917",
      secondary: "#292524",
      accent: "#D97706",
      background: "#FAFAF9",
      surface: "#FFFFFF",
      text: "#1C1917",
      muted: "#78716C",
    },
    fonts: { heading: "Playfair Display", body: "Lato" },
    borderRadius: "2px",
    buttonStyle: "Minimal 2px corners",
    heroStyle: "Editorial luxury hero",
    sectionStyle: "Thin architectural borders",
    designNotes: "Legacy alias for premium-local",
    isLegacy: true,
  },
  {
    id: "fresh-natural",
    name: "Fresh & Natural",
    description: "Botanical greens and earthy tones (legacy alias).",
    bestFor: ["Landscaping", "Cleaning", "Pest Control"],
    colors: {
      primary: "#15803D",
      secondary: "#166534",
      accent: "#84CC16",
      background: "#F7FEE7",
      surface: "#FFFFFF",
      text: "#14532D",
      muted: "#4D7C0F",
    },
    fonts: { heading: "DM Serif Display", body: "DM Sans" },
    borderRadius: "16px",
    buttonStyle: "Organic rounded buttons",
    heroStyle: "Warm outdoor-inspired hero",
    sectionStyle: "Soft rounded cards",
    designNotes: "Legacy alias for modern-local-pro",
    isLegacy: true,
  },
  {
    id: "warm-friendly",
    name: "Warm & Friendly",
    description: "Warm coral and sunny amber (legacy alias).",
    bestFor: ["Daycare", "Pet Services", "Cafés"],
    colors: {
      primary: "#F43F5E",
      secondary: "#BE123C",
      accent: "#F59E0B",
      background: "#FFFBEB",
      surface: "#FFFFFF",
      text: "#451A03",
      muted: "#78716C",
    },
    fonts: { heading: "Nunito", body: "Nunito" },
    borderRadius: "20px",
    buttonStyle: "Pill-shaped buttons",
    heroStyle: "Delightful welcoming hero",
    sectionStyle: "Playful rounded cards",
    designNotes: "Legacy alias for contemporary-soft",
    isLegacy: true,
  },
  {
    id: "minimal-mono",
    name: "Minimal Mono",
    description: "Stark black and white with electric accent (legacy alias).",
    bestFor: ["Consultants", "Agencies", "Photographers"],
    colors: {
      primary: "#09090B",
      secondary: "#27272A",
      accent: "#4F46E5",
      background: "#FFFFFF",
      surface: "#F4F4F5",
      text: "#09090B",
      muted: "#71717A",
    },
    fonts: { heading: "Space Grotesk", body: "Inter" },
    borderRadius: "4px",
    buttonStyle: "Crisp 4px rectangular buttons",
    heroStyle: "Typographic hero",
    sectionStyle: "Minimalist grid",
    designNotes: "Legacy alias for clean-minimal",
    isLegacy: true,
  },
  {
    id: "vibrant-modern",
    name: "Vibrant Modern",
    description: "Electric purple and magenta gradients (legacy alias).",
    bestFor: ["Gyms", "Beauty Salons", "Fitness Studios"],
    colors: {
      primary: "#7C3AED",
      secondary: "#4C1D95",
      accent: "#EC4899",
      background: "#FDF4FF",
      surface: "#FFFFFF",
      text: "#3B0764",
      muted: "#6B7280",
    },
    fonts: { heading: "Outfit", body: "Inter" },
    borderRadius: "16px",
    buttonStyle: "Gradient button",
    heroStyle: "Vibrant dynamic hero",
    sectionStyle: "Glassmorphism cards",
    designNotes: "Legacy alias for high-contrast-modern",
    isLegacy: true,
  },
];

const THEME_ALIASES: Record<string, string> = {
  "modern-pro": "modern-local-pro",
  "bold-trade": "bold-conversion",
  "luxury-elegant": "premium-local",
  "clean-medical": "contemporary-soft",
  "fresh-natural": "modern-local-pro",
  "warm-friendly": "contemporary-soft",
  "minimal-mono": "clean-minimal",
  "vibrant-modern": "high-contrast-modern",
};

export function getThemeById(id: string): Theme {
  const direct = THEMES.find((t) => t.id === id);
  if (direct && !direct.isLegacy) return direct;

  const targetId = THEME_ALIASES[id] || id;
  const mapped = THEMES.find((t) => t.id === targetId);
  if (mapped) return mapped;

  if (direct) return direct;
  return THEMES[0];
}

/**
 * Returns 2-3 recommended theme IDs based on the selected business industry.
 */
export function getRecommendedThemeIds(businessType: string): string[] {
  if (!businessType) return ["modern-local-pro", "split-hero", "bold-conversion"];

  const normalized = businessType.toLowerCase();

  // Urgent Emergency Trades: Plumbers, Towing, Locksmith, Water Damage
  if (
    normalized.includes("urgent") ||
    normalized.includes("emergency") ||
    normalized.includes("towing") ||
    normalized.includes("locksmith") ||
    normalized.includes("water damage") ||
    normalized.includes("drain")
  ) {
    return ["bold-conversion", "split-hero", "modern-local-pro"];
  }

  // Roofing, Auto, Demolition, Construction, Heavy Trades
  if (
    normalized.includes("roof") ||
    normalized.includes("auto") ||
    normalized.includes("car") ||
    normalized.includes("mechanic") ||
    normalized.includes("construct") ||
    normalized.includes("paving") ||
    normalized.includes("demolition")
  ) {
    return ["bold-conversion", "split-hero", "high-contrast-modern"];
  }

  // High-End & Editorial: Remodeling, Custom Builders, Interior Design, Architecture, Legal
  if (
    normalized.includes("remodel") ||
    normalized.includes("custom") ||
    normalized.includes("interior") ||
    normalized.includes("architect") ||
    normalized.includes("law") ||
    normalized.includes("attorney") ||
    normalized.includes("real estate") ||
    normalized.includes("spa")
  ) {
    return ["premium-local", "editorial-modern", "clean-minimal"];
  }

  // Visual Craftsmanship: Landscaping, Cabinets, Masonry, Painting
  if (
    normalized.includes("landscape") ||
    normalized.includes("lawn") ||
    normalized.includes("cabinet") ||
    normalized.includes("paint") ||
    normalized.includes("masonry") ||
    normalized.includes("tree")
  ) {
    return ["editorial-modern", "modern-local-pro", "split-hero"];
  }

  // Reassurance & Health: Pest Control, Foundation, Clinics, Dentists, Home Care
  if (
    normalized.includes("pest") ||
    normalized.includes("foundation") ||
    normalized.includes("clinic") ||
    normalized.includes("dentist") ||
    normalized.includes("doctor") ||
    normalized.includes("care") ||
    normalized.includes("clean")
  ) {
    return ["trust-first", "contemporary-soft", "modern-local-pro"];
  }

  // Multi-Service Trades: Handyman, HVAC, Multi-Trade Electrical & Plumbing
  if (
    normalized.includes("handyman") ||
    normalized.includes("multi") ||
    normalized.includes("hvac") ||
    normalized.includes("appliance")
  ) {
    return ["modern-service-grid", "modern-local-pro", "split-hero"];
  }

  // Standard Trades default: Plumber, Electrician, General Contractor
  if (
    normalized.includes("plumb") ||
    normalized.includes("electr") ||
    normalized.includes("contract")
  ) {
    return ["modern-local-pro", "split-hero", "bold-conversion"];
  }

  return ["modern-local-pro", "split-hero", "bold-conversion"];
}

/**
 * Resolves theme colors factoring in optional user custom color overrides
 */
export function resolveThemeColors(
  theme: Theme,
  overrides?: CustomThemeOverrides
): ThemeColors {
  return {
    ...theme.colors,
    primary: overrides?.primary?.trim() || theme.colors.primary,
    accent: overrides?.accent?.trim() || theme.colors.accent,
    background: overrides?.background?.trim() || theme.colors.background,
  };
}
