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
}

export interface CustomThemeOverrides {
  primary?: string;
  accent?: string;
  background?: string;
}

export const THEMES: Theme[] = [
  {
    id: "modern-pro",
    name: "Modern Pro",
    description: "Clean, trustworthy, and conversion-focused blue tones with a modern corporate feel.",
    bestFor: ["Contractors", "HVAC", "Plumbers", "Electricians", "General Contractors"],
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
    heroStyle: "Split hero (text left, visual card right) with subtle gradient background",
    sectionStyle: "Card-based layout with clean 1px borders (#E2E8F0) and soft shadows",
    designNotes:
      "Clean, trustworthy corporate aesthetic. Use Plus Jakarta Sans for bold, confident headlines and Inter for ultra-legible body text. Implement a split hero with strong call-to-action buttons. Incorporate trust badges, star ratings, and clean 12px rounded cards with light blue accent highlights.",
  },
  {
    id: "bold-trade",
    name: "Bold Trade",
    description: "Dark navy with bright high-visibility orange/yellow accents, strong and confident.",
    bestFor: ["Roofing", "Auto Repair", "Towing", "Construction", "Mechanics"],
    colors: {
      primary: "#EA580C",
      secondary: "#0B132B",
      accent: "#FBBF24",
      background: "#F8FAFC",
      surface: "#FFFFFF",
      text: "#0F172A",
      muted: "#64748B",
    },
    fonts: {
      heading: "Montserrat",
      body: "Inter",
    },
    borderRadius: "6px",
    buttonStyle: "Sharp 6px corners, bold uppercase typography with heavy drop shadow",
    heroStyle: "Full-width high-impact dark navy hero (#0B132B) with oversized headline and large phone CTA",
    sectionStyle: "High-contrast panels with bold dark headers, industrial badge tags, and sharp edges",
    designNotes:
      "Heavy industrial strength aesthetic. Headings must be Montserrat 800 weight with uppercase accents. The hero must feature a dark navy background with large emergency phone number CTA in bright safety orange (#EA580C) or warning yellow (#FBBF24). Sharp 6px borders throughout with high contrast.",
  },
  {
    id: "clean-medical",
    name: "Clean Medical",
    description: "Pristine white, soft teal and mint, calm, hygienic, and reassuring.",
    bestFor: ["Dentists", "Clinics", "Therapists", "Home Care", "Chiropractors"],
    colors: {
      primary: "#0D9488",
      secondary: "#115E59",
      accent: "#2DD4BF",
      background: "#F0FDFA",
      surface: "#FFFFFF",
      text: "#134E4A",
      muted: "#64748B",
    },
    fonts: {
      heading: "Poppins",
      body: "Inter",
    },
    borderRadius: "16px",
    buttonStyle: "Soft rounded 16px pill buttons with gentle teal shadows and smooth hover transitions",
    heroStyle: "Calm, welcoming hero with generous whitespace, comforting doctor/patient trust highlights, and appointment booking CTA",
    sectionStyle: "Generous whitespace, floating cards with gentle multi-layer shadows and soft rounded 16px corners",
    designNotes:
      "Clinical excellence meets gentle human warmth. Poppins rounded geometric headlines paired with Inter. Ample breathing room, soft mint backgrounds (#F0FDFA), tranquil teal highlights (#0D9488), and gentle shadows. Everything should feel hygienic, peaceful, and competent.",
  },
  {
    id: "luxury-elegant",
    name: "Luxury Elegant",
    description: "Rich noir black, warm ivory, and champagne gold with a high-end editorial feel.",
    bestFor: ["Law Firms", "Real Estate", "Spas", "High-End Salons", "Attorneys"],
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
    borderRadius: "2px",
    buttonStyle: "Minimal 2px corners, refined gold borders, uppercase tracking-widest typography",
    heroStyle: "Editorial luxury hero with sophisticated serif typography, thin gold dividers, and bespoke consultation CTA",
    sectionStyle: "Thin architectural 1px borders, generous vertical spacing, and balanced asymmetrical columns",
    designNotes:
      "Prestige editorial aesthetic. Playfair Display serif for refined, high-status headlines; Lato for clean body copy. Generous whitespace, ivory canvas (#FAFAF9), thin 1px gold borders (#D97706), and sharp minimal corners (2px). Exudes luxury, authority, and meticulous craftsmanship.",
  },
  {
    id: "fresh-natural",
    name: "Fresh & Natural",
    description: "Botanical greens and earthy tones with an organic, eco-friendly feel.",
    bestFor: ["Landscaping", "Cleaning", "Pest Control", "Organic & Eco Businesses", "Lawn Care"],
    colors: {
      primary: "#15803D",
      secondary: "#166534",
      accent: "#84CC16",
      background: "#F7FEE7",
      surface: "#FFFFFF",
      text: "#14532D",
      muted: "#4D7C0F",
    },
    fonts: {
      heading: "DM Serif Display",
      body: "DM Sans",
    },
    borderRadius: "16px",
    buttonStyle: "Organic rounded buttons with leaf-green gradients and nature-inspired hover lift",
    heroStyle: "Warm outdoor-inspired hero with organic leaf accents, service guarantee badges, and instant estimate CTA",
    sectionStyle: "Soft rounded cards (16px), subtle wave section dividers, and natural botanical iconography",
    designNotes:
      "Eco-friendly, botanical, and grounded aesthetic. DM Serif Display headlines with DM Sans body copy. Natural forest greens (#15803D), lime accents (#84CC16), and subtle organic wave section dividers. Ideal for lawn care, green cleaning, and environmental services.",
  },
  {
    id: "warm-friendly",
    name: "Warm & Friendly",
    description: "Warm coral, butter cream, and sunny amber, approachable and cheerful.",
    bestFor: ["Restaurants", "Bakeries", "Daycare", "Pet Services", "Cafés"],
    colors: {
      primary: "#F43F5E",
      secondary: "#BE123C",
      accent: "#F59E0B",
      background: "#FFFBEB",
      surface: "#FFFFFF",
      text: "#451A03",
      muted: "#78716C",
    },
    fonts: {
      heading: "Nunito",
      body: "Nunito",
    },
    borderRadius: "20px",
    buttonStyle: "Pill-shaped (rounded-full) buttons with playful bounce hover and warm coral glow",
    heroStyle: "Delightful welcoming hero with friendly imagery, customer smile badges, and easy online order/booking CTA",
    sectionStyle: "Playful rounded cards (20px), warm cream backgrounds (#FFFBEB), and friendly icons",
    designNotes:
      "Inviting, joyful, and community-oriented. Nunito rounded typography across headings (800 weight) and body. Warm coral tones (#F43F5E), sunny golden accents (#F59E0B), warm cream canvas (#FFFBEB), and fully pill-shaped (rounded-full) buttons. Radiates hospitality and friendliness.",
  },
  {
    id: "minimal-mono",
    name: "Minimal Mono",
    description: "Stark black and white with one electric accent color, Swiss-inspired precision.",
    bestFor: ["Consultants", "Agencies", "Photographers", "Architects", "Designers"],
    colors: {
      primary: "#09090B",
      secondary: "#27272A",
      accent: "#4F46E5",
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
    buttonStyle: "Crisp 4px rectangular buttons with sharp contrast and solid monochrome hover",
    heroStyle: "High-impact typographic hero with oversized headline, ultra-clean negative space, and single sharp CTA",
    sectionStyle: "Minimalist grid with hairline borders (1px #E4E4E7), extensive white space, and bold mono numerals",
    designNotes:
      "Swiss-inspired, hyper-clean typography. Space Grotesk geometric headings with Inter body. Stark black-on-white palette (#09090B on #FFFFFF) punctuated by a single electric accent color (#4F46E5). Clean 1px hairline borders, generous negative space, and sharp 4px corners.",
  },
  {
    id: "vibrant-modern",
    name: "Vibrant Modern",
    description: "Electric purple and magenta gradients, dynamic, energetic, and high-style.",
    bestFor: ["Gyms", "Beauty Salons", "Fitness Studios", "Event Businesses", "Barbershops"],
    colors: {
      primary: "#7C3AED",
      secondary: "#4C1D95",
      accent: "#EC4899",
      background: "#FDF4FF",
      surface: "#FFFFFF",
      text: "#3B0764",
      muted: "#6B7280",
    },
    fonts: {
      heading: "Outfit",
      body: "Inter",
    },
    borderRadius: "16px",
    buttonStyle: "Gradient button (violet to hot pink) with subtle glow shadow and smooth scale hover",
    heroStyle: "Vibrant dynamic hero with gradient mesh background, glassmorphism badges, and energetic CTA",
    sectionStyle: "Glassmorphism cards with translucent borders (rgba(255,255,255,0.8)), soft colorful glows, and rounded 16px corners",
    designNotes:
      "High-energy, trend-setting modern aesthetic. Outfit headings with Inter body. Electric violet (#7C3AED) blending into hot pink (#EC4899), delicate lavender backdrop (#FDF4FF), glassmorphic card overlays, and subtle button glows. Perfect for fitness, beauty, nightlife, and lifestyle brands.",
  },
];

export function getThemeById(id: string): Theme {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

/**
 * Returns 2-3 recommended theme IDs based on the selected business industry.
 */
export function getRecommendedThemeIds(businessType: string): string[] {
  if (!businessType) return ["modern-pro", "bold-trade"];

  const normalized = businessType.toLowerCase();

  // Keyword mappings to themes
  if (
    normalized.includes("dentist") ||
    normalized.includes("doctor") ||
    normalized.includes("clinic") ||
    normalized.includes("health") ||
    normalized.includes("chiro") ||
    normalized.includes("therapy")
  ) {
    return ["clean-medical", "modern-pro", "luxury-elegant"];
  }

  if (
    normalized.includes("roof") ||
    normalized.includes("auto") ||
    normalized.includes("car") ||
    normalized.includes("mechanic") ||
    normalized.includes("towing") ||
    normalized.includes("construct")
  ) {
    return ["bold-trade", "modern-pro", "minimal-mono"];
  }

  if (
    normalized.includes("law") ||
    normalized.includes("attorney") ||
    normalized.includes("legal") ||
    normalized.includes("real estate") ||
    normalized.includes("spa")
  ) {
    return ["luxury-elegant", "minimal-mono", "modern-pro"];
  }

  if (
    normalized.includes("landscape") ||
    normalized.includes("lawn") ||
    normalized.includes("clean") ||
    normalized.includes("pest") ||
    normalized.includes("eco") ||
    normalized.includes("tree")
  ) {
    return ["fresh-natural", "modern-pro", "warm-friendly"];
  }

  if (
    normalized.includes("restaurant") ||
    normalized.includes("cafe") ||
    normalized.includes("café") ||
    normalized.includes("baker") ||
    normalized.includes("pet") ||
    normalized.includes("daycare")
  ) {
    return ["warm-friendly", "vibrant-modern", "modern-pro"];
  }

  if (
    normalized.includes("gym") ||
    normalized.includes("fitness") ||
    normalized.includes("salon") ||
    normalized.includes("barber") ||
    normalized.includes("beauty") ||
    normalized.includes("event")
  ) {
    return ["vibrant-modern", "warm-friendly", "modern-pro"];
  }

  if (
    normalized.includes("photo") ||
    normalized.includes("design") ||
    normalized.includes("consult") ||
    normalized.includes("account") ||
    normalized.includes("agency")
  ) {
    return ["minimal-mono", "modern-pro", "luxury-elegant"];
  }

  // Trades default: Plumber, Electrician, HVAC, etc.
  if (
    normalized.includes("plumb") ||
    normalized.includes("electr") ||
    normalized.includes("hvac") ||
    normalized.includes("contract")
  ) {
    return ["modern-pro", "bold-trade", "fresh-natural"];
  }

  return ["modern-pro", "bold-trade", "minimal-mono"];
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
