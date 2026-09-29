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
  sectionOrder: string[];
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
  nicheKeywords?: string[];       // SEO-targeting keywords for this niche
  tradeSeoPrefix?: string;        // e.g. "Licensed Plumber" for meta/heading prefix
  isLegacy?: boolean;
}

export interface CustomThemeOverrides {
  primary?: string;
  accent?: string;
  background?: string;
}

export const THEMES: Theme[] = [

  // ============================================================
  // 1. PIPE & WRENCH  —  Plumbing  (deep navy + copper)
  // ============================================================
  {
    id: "pipe-and-wrench",
    name: "Pipe & Wrench",
    description: "Purpose-built for plumbing companies. Deep navy authority meets copper accent for pipe, drain, and water heater specialists.",
    bestFor: ["Plumbers", "Drain Cleaning", "Water Heater Repair", "Sewer Services", "Leak Detection"],
    nicheKeywords: ["plumber near me", "emergency plumber", "drain cleaning", "water heater repair", "pipe repair"],
    tradeSeoPrefix: "Licensed Plumber",
    colors: {
      primary: "#B45309",      // Warm copper — plumbing pipes
      secondary: "#0C2340",    // Deep navy authority
      accent: "#0EA5E9",       // Water blue
      background: "#F8F9FC",
      surface: "#FFFFFF",
      text: "#0C1F35",
      muted: "#5A7080",
    },
    fonts: {
      heading: "Oswald",       // Industrial, confident, strong
      body: "Source Sans 3",
    },
    borderRadius: "6px",
    buttonStyle: "Sharp 6px industrial corners with copper gradient hover and wrench icon",
    heroStyle: "Bold two-column with large service headline, copper CTA bar, and water-drop trust badge",
    sectionStyle: "Structured card grid with 2px copper-left border accent and navy headers",
    designNotes: "Copper + Navy = trust + craftsmanship for plumbers. Oswald gives authority, Source Sans reads clearly on any device. The palette instantly communicates pipes, water, and professionalism.",
    layoutStructure: {
      headerVariant: "emergency-bar",
      heroLayout: "split",
      sectionOrder: ["emergencyBanner", "hero", "trustBar", "services", "whyUs", "process", "testimonials", "serviceAreas", "faq", "ctaBanner"],
      serviceCardVariant: "cards",
      trustVariant: "guarantee-highlight",
      footerVariant: "multi-column",
    },
    designCharacteristics: [
      "Copper + Navy industrial palette",
      "Oswald bold condensed headings",
      "Emergency dispatch top bar",
      "Service cards with pipe-icon accents",
      "Water-blue CTA highlights",
    ],
  },

  // ============================================================
  // 2. SPARK & WIRE  —  Electrical  (electric yellow + dark slate)
  // ============================================================
  {
    id: "spark-and-wire",
    name: "Spark & Wire",
    description: "High-voltage design for electricians. Electric yellow against dark slate creates instant recognition for wiring, panel, and circuit specialists.",
    bestFor: ["Electricians", "Panel Upgrades", "EV Charger Installation", "Commercial Electrical", "Lighting Services"],
    nicheKeywords: ["electrician near me", "electrical panel upgrade", "ev charger installation", "emergency electrician", "licensed electrician"],
    tradeSeoPrefix: "Licensed Electrician",
    colors: {
      primary: "#D97706",      // Amber/electric yellow — warning, energy
      secondary: "#1E293B",    // Dark slate — electrical boxes
      accent: "#FBBF24",       // Bright yellow highlight
      background: "#0F172A",   // Dark mode — circuit board feel
      surface: "#1E293B",
      text: "#F1F5F9",
      muted: "#94A3B8",
    },
    fonts: {
      heading: "Rajdhani",     // Technical, angular, modern
      body: "Inter",
    },
    borderRadius: "4px",
    buttonStyle: "Sharp 4px corners with electric yellow fill, black text, and spark-glow hover effect",
    heroStyle: "Dark full-bleed hero with electric yellow headline, circuit-board subtle background, prominent phone callout",
    sectionStyle: "Dark card surfaces with amber border accents and yellow-highlighted service icons",
    designNotes: "Dark mode electrical theme. The only dark-background theme in the set — instantly recognizable as an electrician site. Rajdhani is angular and technical. Yellow pops against dark slate.",
    layoutStructure: {
      headerVariant: "bold-call",
      heroLayout: "compact-bold",
      sectionOrder: ["emergencyBanner", "hero", "services", "trustBar", "whyUs", "process", "serviceAreas", "testimonials", "ctaBanner"],
      serviceCardVariant: "compact-list",
      trustVariant: "guarantee-highlight",
      footerVariant: "multi-column",
    },
    designCharacteristics: [
      "Dark mode circuit-board aesthetic",
      "Electric amber/yellow accent palette",
      "Rajdhani angular technical headings",
      "High-contrast card surfaces",
      "Glowing CTA hover effect",
    ],
  },

  // ============================================================
  // 3. COOL BREEZE  —  HVAC  (sky blue + arctic white + steel)
  // ============================================================
  {
    id: "cool-breeze",
    name: "Cool Breeze",
    description: "Clean and refreshing HVAC theme. Sky blue and steel grey project cool air, comfort, and energy-efficiency for AC, heating, and ventilation businesses.",
    bestFor: ["HVAC", "Air Conditioning Repair", "Heating Services", "Furnace Repair", "Duct Cleaning"],
    nicheKeywords: ["hvac near me", "ac repair", "furnace repair", "air conditioning installation", "heating and cooling"],
    tradeSeoPrefix: "HVAC Specialist",
    colors: {
      primary: "#0284C7",      // Sky blue — cool, air
      secondary: "#0C4A6E",    // Deep ocean — reliability
      accent: "#38BDF8",       // Ice blue highlight
      background: "#F0F9FF",   // Arctic white-blue tint
      surface: "#FFFFFF",
      text: "#0C2A40",
      muted: "#4A7FA0",
    },
    fonts: {
      heading: "Nunito",       // Rounded, friendly, approachable comfort
      body: "Inter",
    },
    borderRadius: "16px",
    buttonStyle: "Rounded 16px soft buttons with sky blue gradient and cool-air icon",
    heroStyle: "Light airy hero with wave-pattern background, blue gradient CTA zone, and comfort badge",
    sectionStyle: "Rounded 16px cards on arctic-white background with soft sky blue shadows",
    designNotes: "All about comfort, air, and coolness. Rounded cards feel soft like air — not sharp and industrial. Sky blue with arctic white background is unique and immediately signals HVAC.",
    layoutStructure: {
      headerVariant: "standard",
      heroLayout: "split",
      sectionOrder: ["hero", "trustBar", "services", "whyUs", "process", "testimonials", "serviceAreas", "faq", "ctaBanner"],
      serviceCardVariant: "softGrid",
      trustVariant: "standard",
      footerVariant: "multi-column",
    },
    designCharacteristics: [
      "Arctic sky blue palette",
      "Rounded 16px soft card corners",
      "Nunito friendly approachable headings",
      "Wave/air background pattern",
      "Comfort-focused messaging",
    ],
  },

  // ============================================================
  // 4. STORM SHIELD  —  Roofing  (storm grey + red urgency + charcoal)
  // ============================================================
  {
    id: "storm-shield",
    name: "Storm Shield",
    description: "Built for roofers. Storm-grey durability meets urgent red for storm damage, leak repair, and re-roofing specialists. Communicates strength and protection.",
    bestFor: ["Roofing", "Storm Damage Repair", "Gutters", "Siding", "Roof Replacement"],
    nicheKeywords: ["roofer near me", "roof repair", "storm damage roof", "roof replacement", "emergency roofing"],
    tradeSeoPrefix: "Certified Roofing Contractor",
    colors: {
      primary: "#DC2626",      // Urgent red — storm, damage, action
      secondary: "#374151",    // Storm grey — strength, slate
      accent: "#F59E0B",       // Warning amber — caution tape
      background: "#F9FAFB",
      surface: "#FFFFFF",
      text: "#111827",
      muted: "#6B7280",
    },
    fonts: {
      heading: "Bebas Neue",   // Bold, strong, all-caps — roofing authority
      body: "Roboto",
    },
    borderRadius: "2px",       // Sharp — like shingles, metal, angular roofing
    buttonStyle: "Sharp 2px corner buttons with bold red fill and white uppercase text",
    heroStyle: "Full-width bold header with red emergency urgency bar and immediate damage repair CTA",
    sectionStyle: "Structured sharp-corner panels with grey dividers and red accent highlights",
    designNotes: "Roofing is about URGENCY and STRENGTH. Sharp 2px radius (not round), bold Bebas Neue headings, storm grey + red = immediately communicates roofing. No other trade uses this combo.",
    layoutStructure: {
      headerVariant: "emergency-bar",
      heroLayout: "split-full",
      sectionOrder: ["emergencyBanner", "hero", "services", "trustBar", "whyUs", "process", "testimonials", "serviceAreas", "ctaBanner"],
      serviceCardVariant: "cards",
      trustVariant: "guarantee-highlight",
      footerVariant: "multi-column",
    },
    designCharacteristics: [
      "Storm grey + urgent red palette",
      "Sharp 2px corners (shingle-like)",
      "Bebas Neue bold uppercase headings",
      "Storm damage urgency messaging",
      "Red emergency action CTAs",
    ],
  },

  // ============================================================
  // 5. GREEN ROOTS  —  Landscaping & Tree Service  (earth green + soil brown)
  // ============================================================
  {
    id: "green-roots",
    name: "Green Roots",
    description: "Organic and earthy theme for landscaping, lawn care, and tree services. Rich botanical greens and warm soil tones communicate outdoor expertise.",
    bestFor: ["Landscaping", "Lawn Care", "Tree Service", "Tree Removal", "Irrigation", "Garden Design"],
    nicheKeywords: ["landscaper near me", "lawn care service", "tree removal", "tree trimming", "lawn maintenance"],
    tradeSeoPrefix: "Professional Landscaper",
    colors: {
      primary: "#16A34A",      // Vibrant botanical green
      secondary: "#14532D",    // Deep forest — expertise
      accent: "#84CC16",       // Lime green — fresh growth
      background: "#F0FDF4",   // Lightest mint/nature tint
      surface: "#FFFFFF",
      text: "#14532D",
      muted: "#4D7C0F",
    },
    fonts: {
      heading: "DM Serif Display",   // Organic, editorial, nature
      body: "DM Sans",
    },
    borderRadius: "20px",      // Very round — organic, natural, leaves
    buttonStyle: "Organic 20px pill buttons with botanical green and leaf accent hover",
    heroStyle: "Warm outdoor-inspired hero with green gradient overlay, leaf motif, and seasonal service highlights",
    sectionStyle: "Rounded 20px cards on mint background with soil-brown borders and nature icons",
    designNotes: "The most organic-feeling theme. DM Serif headlines feel like outdoor magazine editorial. Very rounded corners feel natural. Bright green + forest green is instantly landscaping — no confusion with any other trade.",
    layoutStructure: {
      headerVariant: "centered",
      heroLayout: "soft",
      sectionOrder: ["hero", "services", "whyUs", "process", "testimonials", "serviceAreas", "ctaBanner"],
      serviceCardVariant: "softGrid",
      trustVariant: "standard",
      footerVariant: "multi-column",
    },
    designCharacteristics: [
      "Botanical green + forest palette",
      "Organic 20px rounded corners",
      "DM Serif Display editorial headings",
      "Nature-inspired background tint",
      "Seasonal service highlights",
    ],
  },

  // ============================================================
  // 6. CLEAN SWEEP  —  Cleaning Services  (fresh white + teal + sparkle blue)
  // ============================================================
  {
    id: "clean-sweep",
    name: "Clean Sweep",
    description: "Bright, hygienic, and sparkling. Purpose-built for house cleaning, commercial cleaning, and maid services. Fresh teal signals cleanliness and trust.",
    bestFor: ["House Cleaning", "Commercial Cleaning", "Maid Services", "Carpet Cleaning", "Window Cleaning", "Pressure Washing"],
    nicheKeywords: ["house cleaning near me", "maid service", "commercial cleaning", "carpet cleaning service", "cleaning company"],
    tradeSeoPrefix: "Professional Cleaning Service",
    colors: {
      primary: "#0D9488",      // Teal — sterile, fresh, clean
      secondary: "#134E4A",    // Deep teal — authority
      accent: "#2DD4BF",       // Bright sparkle teal
      background: "#F0FDFA",   // Ultra-clean mint white
      surface: "#FFFFFF",
      text: "#134E4A",
      muted: "#5EACA0",
    },
    fonts: {
      heading: "Quicksand",    // Round, friendly, clean, approachable
      body: "Inter",
    },
    borderRadius: "24px",      // Maximum roundness — clean, bubbly, approachable
    buttonStyle: "Pill (24px) buttons with sparkle teal and soft shadow bounce hover",
    heroStyle: "Gleaming white hero with teal gradient accent, sparkle stars motif, and before/after promise badge",
    sectionStyle: "Bubbly 24px rounded service cards on ultra-clean mint background with sparkle accent dots",
    designNotes: "The cleanest-looking theme. White + teal + ultra-round cards = looks freshly sanitized. Quicksand headings are uniquely friendly. Max border radius makes it look like soap bubbles — perfect for cleaning. No other trade uses Quicksand or this teal+white+round combo.",
    layoutStructure: {
      headerVariant: "centered",
      heroLayout: "soft",
      sectionOrder: ["hero", "trustBar", "services", "whyUs", "testimonials", "serviceAreas", "faq", "ctaBanner"],
      serviceCardVariant: "softGrid",
      trustVariant: "trust-first-grid",
      footerVariant: "multi-column",
    },
    designCharacteristics: [
      "Sparkle teal + ultra-white palette",
      "Maximum 24px rounded corners",
      "Quicksand friendly headings",
      "Hygienic, gleaming feel",
      "Satisfaction guarantee badge",
    ],
  },

  // ============================================================
  // 7. IRON GRIP  —  Auto Repair & Mechanic  (gunmetal + red + chrome)
  // ============================================================
  {
    id: "iron-grip",
    name: "Iron Grip",
    description: "Tough mechanic shop aesthetic. Gunmetal grey, bold red, and chrome accents for auto repair, tires, brakes, and transmission specialists.",
    bestFor: ["Auto Repair", "Mechanic", "Tires & Brakes", "Transmission", "Oil Change", "Body Shop"],
    nicheKeywords: ["auto repair near me", "mechanic near me", "oil change service", "brake repair", "tire shop"],
    tradeSeoPrefix: "Certified Auto Mechanic",
    colors: {
      primary: "#E11D48",      // Bold red — brake calipers, speed
      secondary: "#1F2937",    // Gunmetal grey — engine, metal
      accent: "#9CA3AF",       // Chrome silver
      background: "#111827",   // Garage floor — dark
      surface: "#1F2937",
      text: "#F9FAFB",
      muted: "#9CA3AF",
    },
    fonts: {
      heading: "Barlow Condensed",  // Automotive, bold, fast
      body: "Roboto",
    },
    borderRadius: "4px",       // Industrial sharp
    buttonStyle: "Sharp 4px red buttons with bold white text and wrench/gear icon",
    heroStyle: "Dark garage-floor hero with chrome headline text, red emergency CTA strip, and service icons",
    sectionStyle: "Dark card surfaces with red left-border accents and chrome-silver icon highlights",
    designNotes: "Second dark-mode theme (different from electrician dark). Gunmetal + red = garage, muscle, authority. Barlow Condensed is automotive-bold. No round edges — everything is sharp like car parts. Completely different from all other themes.",
    layoutStructure: {
      headerVariant: "emergency-bar",
      heroLayout: "compact-bold",
      sectionOrder: ["emergencyBanner", "hero", "services", "trustBar", "whyUs", "process", "testimonials", "serviceAreas", "ctaBanner"],
      serviceCardVariant: "compact-list",
      trustVariant: "guarantee-highlight",
      footerVariant: "multi-column",
    },
    designCharacteristics: [
      "Gunmetal + bold red automotive palette",
      "Dark mode garage aesthetic",
      "Barlow Condensed race-bold headings",
      "Chrome accent details",
      "Industrial sharp 4px corners",
    ],
  },

  // ============================================================
  // 8. MASTER CRAFT  —  Remodeling, Custom Builders, Premium Trades
  // ============================================================
  {
    id: "master-craft",
    name: "Master Craft",
    description: "Premium editorial aesthetic for high-end remodelers, custom builders, and luxury contractors. Rich walnut tones and champagne gold signal craftsmanship.",
    bestFor: ["Remodeling", "Custom Home Builders", "Kitchen & Bath", "Interior Design", "Cabinet Makers", "Tile & Flooring"],
    nicheKeywords: ["home remodeling near me", "kitchen remodel", "bathroom renovation", "custom home builder", "interior remodel"],
    tradeSeoPrefix: "Master Contractor",
    colors: {
      primary: "#92400E",      // Rich walnut brown — wood, craft
      secondary: "#1C1917",    // Charcoal black — authority
      accent: "#D97706",       // Champagne gold — luxury finish
      background: "#FAFAF9",   // Warm ivory — premium paper
      surface: "#FFFFFF",
      text: "#1C1917",
      muted: "#78716C",
    },
    fonts: {
      heading: "Playfair Display",  // Serif luxury — craft, heritage
      body: "Lato",
    },
    borderRadius: "4px",       // Architectural precision
    buttonStyle: "Refined 4px corners with walnut fill, gold hover border, and subtle uppercase tracking",
    heroStyle: "Editorial asymmetric hero with large serif headline, project showcase right, and gold CTA accent",
    sectionStyle: "Generous whitespace with thin 1px walnut hairline borders and champagne gold accents",
    designNotes: "Only serif-headline theme. Playfair Display + Lato pairing is editorial luxury. Warm walnut + champagne gold = woodworking, cabinetry, premium remodeling. Completely different from all trades — looks like an architecture magazine.",
    layoutStructure: {
      headerVariant: "centered",
      heroLayout: "asymmetric",
      sectionOrder: ["hero", "trustBar", "whyUs", "services", "testimonials", "process", "serviceAreas", "ctaBanner"],
      serviceCardVariant: "alternating",
      trustVariant: "standard",
      footerVariant: "editorial-contact",
    },
    designCharacteristics: [
      "Walnut brown + champagne gold palette",
      "Playfair Display luxury serif headings",
      "Editorial asymmetric layout",
      "Warm ivory paper background",
      "Generous architectural whitespace",
    ],
  },

  // ============================================================
  // 9. SECURE HOME  —  Pest Control, Security, Foundation, Inspection
  // ============================================================
  {
    id: "secure-home",
    name: "Secure Home",
    description: "Trust-first design for pest control, home inspection, security, and foundation repair. Reassuring deep blue and confident green signal protection and safety.",
    bestFor: ["Pest Control", "Home Inspection", "Foundation Repair", "Security Systems", "Waterproofing", "Mold Remediation"],
    nicheKeywords: ["pest control near me", "home inspection", "foundation repair", "exterminator", "mold removal"],
    tradeSeoPrefix: "Certified Home Protection Specialist",
    colors: {
      primary: "#1D4ED8",      // Deep confidence blue — protection, authority
      secondary: "#1E3A5F",    // Navy — serious, reliable
      accent: "#059669",       // Emerald green — safe, protected, go
      background: "#EFF6FF",   // Light blue reassurance tint
      surface: "#FFFFFF",
      text: "#1E3A5F",
      muted: "#4B6A8A",
    },
    fonts: {
      heading: "Poppins",      // Rounded, trustworthy, clean
      body: "Inter",
    },
    borderRadius: "14px",
    buttonStyle: "Rounded 14px with shield icon, confident blue fill, and emerald guarantee hover",
    heroStyle: "Credibility-first hero with guarantee badge, license proof, BBB trust signal, and blue protection gradient",
    sectionStyle: "14px rounded cards with emerald check-mark lists and credential/badge highlights",
    designNotes: "Purpose-built to reassure risk-averse customers. Poppins + blue + emerald = professional yet approachable. Trust signals appear above the fold. Different from HVAC (which also uses blue) because of the darker navy + emerald guarantee combo and credential-first layout.",
    layoutStructure: {
      headerVariant: "standard",
      heroLayout: "split",
      sectionOrder: ["hero", "trustBar", "whyUs", "services", "process", "testimonials", "serviceAreas", "faq", "ctaBanner"],
      serviceCardVariant: "cards",
      trustVariant: "trust-first-grid",
      footerVariant: "multi-column",
    },
    designCharacteristics: [
      "Confidence blue + emerald green palette",
      "Trust-first credential display",
      "Poppins rounded reassuring headings",
      "Shield + guarantee badge CTAs",
      "FAQ section for doubt removal",
    ],
  },

  // ============================================================
  // 10. RAPID RESPONSE  —  Emergency Services (Locksmith, Towing, Water Damage)
  // ============================================================
  {
    id: "rapid-response",
    name: "Rapid Response",
    description: "Maximum-urgency design for 24/7 emergency services. Safety orange and deep black create immediate call-to-action pressure for locksmith, towing, and water damage.",
    bestFor: ["Locksmith", "Towing", "Water Damage Restoration", "24/7 Emergency Trades", "Roadside Assistance", "Flood Cleanup"],
    nicheKeywords: ["locksmith near me", "towing near me", "emergency locksmith", "24 hour towing", "water damage restoration"],
    tradeSeoPrefix: "24/7 Emergency Response",
    colors: {
      primary: "#EA580C",      // Safety orange — emergency, urgency
      secondary: "#0B132B",    // Near-black — serious, night response
      accent: "#FBBF24",       // Flashing amber — hazard lights
      background: "#F8FAFC",
      surface: "#FFFFFF",
      text: "#0B1320",
      muted: "#475569",
    },
    fonts: {
      heading: "Montserrat",   // Bold confidence — emergency dispatch boards
      body: "Inter",
    },
    borderRadius: "6px",
    buttonStyle: "Sharp 6px safety-orange buttons with white text, 24/7 badge, and pulsing glow animation",
    heroStyle: "High-urgency hero with blinking 24/7 availability indicator, large phone number above fold, and orange dispatch banner",
    sectionStyle: "High-contrast panels with orange emergency callout cards and fast-scan service checklist",
    designNotes: "Pure urgency. Orange + near-black = hazard cones, tow trucks, police lights. Montserrat bold headings read fast. The emphasis is on CALL NOW — phone number is the hero. Visitors came from a panic search. This theme gets them to call in 3 seconds.",
    layoutStructure: {
      headerVariant: "emergency-bar",
      heroLayout: "compact-bold",
      sectionOrder: ["emergencyBanner", "hero", "trustBar", "services", "whyUs", "process", "serviceAreas", "testimonials", "ctaBanner"],
      serviceCardVariant: "compact-list",
      trustVariant: "guarantee-highlight",
      footerVariant: "multi-column",
    },
    designCharacteristics: [
      "Safety orange + night-black emergency palette",
      "Blinking 24/7 availability badge",
      "Phone number displayed above the fold",
      "Montserrat bold dispatch headings",
      "Pulsing call-now animation",
    ],
  },

  // ============================================================
  // BACKWARD COMPATIBILITY ALIASES — preserves existing project IDs
  // ============================================================
  {
    id: "modern-local-pro",
    name: "Secure Home",
    description: "Legacy alias → maps to secure-home theme.",
    bestFor: ["Plumbers", "Electricians", "HVAC", "Contractors"],
    nicheKeywords: [],
    colors: {
      primary: "#1D4ED8",
      secondary: "#1E3A5F",
      accent: "#059669",
      background: "#EFF6FF",
      surface: "#FFFFFF",
      text: "#1E3A5F",
      muted: "#4B6A8A",
    },
    fonts: { heading: "Poppins", body: "Inter" },
    borderRadius: "14px",
    buttonStyle: "Rounded 14px shield button",
    heroStyle: "Split hero with trust signals",
    sectionStyle: "Card-based layout",
    designNotes: "Legacy alias for secure-home",
    isLegacy: true,
  },
  {
    id: "split-hero",
    name: "Rapid Response",
    description: "Legacy alias → maps to rapid-response theme.",
    bestFor: ["Roofing", "Auto Repair", "Towing", "Construction"],
    nicheKeywords: [],
    colors: {
      primary: "#EA580C",
      secondary: "#0B132B",
      accent: "#FBBF24",
      background: "#F8FAFC",
      surface: "#FFFFFF",
      text: "#0B1320",
      muted: "#475569",
    },
    fonts: { heading: "Montserrat", body: "Inter" },
    borderRadius: "6px",
    buttonStyle: "Sharp 6px safety-orange buttons",
    heroStyle: "High-urgency compact hero",
    sectionStyle: "High-contrast panels",
    designNotes: "Legacy alias for rapid-response",
    isLegacy: true,
  },
  {
    id: "bold-conversion",
    name: "Iron Grip",
    description: "Legacy alias → maps to iron-grip theme.",
    bestFor: ["Emergency Plumbing", "Towing", "Locksmith", "Water Damage"],
    nicheKeywords: [],
    colors: {
      primary: "#E11D48",
      secondary: "#1F2937",
      accent: "#9CA3AF",
      background: "#111827",
      surface: "#1F2937",
      text: "#F9FAFB",
      muted: "#9CA3AF",
    },
    fonts: { heading: "Barlow Condensed", body: "Roboto" },
    borderRadius: "4px",
    buttonStyle: "Sharp 4px red buttons",
    heroStyle: "Dark garage-floor hero",
    sectionStyle: "Dark card surfaces with red accents",
    designNotes: "Legacy alias for iron-grip",
    isLegacy: true,
  },
  {
    id: "premium-local",
    name: "Master Craft",
    description: "Legacy alias → maps to master-craft theme.",
    bestFor: ["Luxury Remodeling", "Custom Builders"],
    nicheKeywords: [],
    colors: {
      primary: "#92400E",
      secondary: "#1C1917",
      accent: "#D97706",
      background: "#FAFAF9",
      surface: "#FFFFFF",
      text: "#1C1917",
      muted: "#78716C",
    },
    fonts: { heading: "Playfair Display", body: "Lato" },
    borderRadius: "4px",
    buttonStyle: "Refined 4px with gold hover",
    heroStyle: "Editorial asymmetric hero",
    sectionStyle: "Generous whitespace with hairline borders",
    designNotes: "Legacy alias for master-craft",
    isLegacy: true,
  },
  {
    id: "editorial-modern",
    name: "Green Roots",
    description: "Legacy alias → maps to green-roots theme.",
    bestFor: ["Landscaping", "Lawn Care", "Tree Service"],
    nicheKeywords: [],
    colors: {
      primary: "#16A34A",
      secondary: "#14532D",
      accent: "#84CC16",
      background: "#F0FDF4",
      surface: "#FFFFFF",
      text: "#14532D",
      muted: "#4D7C0F",
    },
    fonts: { heading: "DM Serif Display", body: "DM Sans" },
    borderRadius: "20px",
    buttonStyle: "Organic 20px pill buttons",
    heroStyle: "Warm outdoor-inspired hero",
    sectionStyle: "Rounded cards on mint background",
    designNotes: "Legacy alias for green-roots",
    isLegacy: true,
  },
  {
    id: "clean-minimal",
    name: "Cool Breeze",
    description: "Legacy alias → maps to cool-breeze theme.",
    bestFor: ["HVAC", "Engineering", "Inspection"],
    nicheKeywords: [],
    colors: {
      primary: "#0284C7",
      secondary: "#0C4A6E",
      accent: "#38BDF8",
      background: "#F0F9FF",
      surface: "#FFFFFF",
      text: "#0C2A40",
      muted: "#4A7FA0",
    },
    fonts: { heading: "Nunito", body: "Inter" },
    borderRadius: "16px",
    buttonStyle: "Rounded 16px sky blue buttons",
    heroStyle: "Airy hero with blue gradient",
    sectionStyle: "Rounded cards on arctic background",
    designNotes: "Legacy alias for cool-breeze",
    isLegacy: true,
  },
  {
    id: "trust-first",
    name: "Secure Home",
    description: "Legacy alias → maps to secure-home theme.",
    bestFor: ["Pest Control", "Home Inspection", "Foundation"],
    nicheKeywords: [],
    colors: {
      primary: "#1D4ED8",
      secondary: "#1E3A5F",
      accent: "#059669",
      background: "#EFF6FF",
      surface: "#FFFFFF",
      text: "#1E3A5F",
      muted: "#4B6A8A",
    },
    fonts: { heading: "Poppins", body: "Inter" },
    borderRadius: "14px",
    buttonStyle: "Rounded 14px shield button",
    heroStyle: "Credibility-first hero",
    sectionStyle: "Trust-signal cards",
    designNotes: "Legacy alias for secure-home",
    isLegacy: true,
  },
  {
    id: "modern-service-grid",
    name: "Pipe & Wrench",
    description: "Legacy alias → maps to pipe-and-wrench theme.",
    bestFor: ["Multi-Trade", "Plumbers", "HVAC"],
    nicheKeywords: [],
    colors: {
      primary: "#B45309",
      secondary: "#0C2340",
      accent: "#0EA5E9",
      background: "#F8F9FC",
      surface: "#FFFFFF",
      text: "#0C1F35",
      muted: "#5A7080",
    },
    fonts: { heading: "Oswald", body: "Source Sans 3" },
    borderRadius: "6px",
    buttonStyle: "Sharp 6px industrial copper buttons",
    heroStyle: "Bold two-column with copper CTA",
    sectionStyle: "Grid with copper border accents",
    designNotes: "Legacy alias for pipe-and-wrench",
    isLegacy: true,
  },
  {
    id: "contemporary-soft",
    name: "Clean Sweep",
    description: "Legacy alias → maps to clean-sweep theme.",
    bestFor: ["Cleaning", "Home Care", "Landscaping"],
    nicheKeywords: [],
    colors: {
      primary: "#0D9488",
      secondary: "#134E4A",
      accent: "#2DD4BF",
      background: "#F0FDFA",
      surface: "#FFFFFF",
      text: "#134E4A",
      muted: "#5EACA0",
    },
    fonts: { heading: "Quicksand", body: "Inter" },
    borderRadius: "24px",
    buttonStyle: "Pill 24px sparkle teal buttons",
    heroStyle: "Gleaming white hero",
    sectionStyle: "Bubbly rounded cards on mint",
    designNotes: "Legacy alias for clean-sweep",
    isLegacy: true,
  },
  {
    id: "high-contrast-modern",
    name: "Storm Shield",
    description: "Legacy alias → maps to storm-shield theme.",
    bestFor: ["Roofing", "Heavy Contractors", "Demolition"],
    nicheKeywords: [],
    colors: {
      primary: "#DC2626",
      secondary: "#374151",
      accent: "#F59E0B",
      background: "#F9FAFB",
      surface: "#FFFFFF",
      text: "#111827",
      muted: "#6B7280",
    },
    fonts: { heading: "Bebas Neue", body: "Roboto" },
    borderRadius: "2px",
    buttonStyle: "Sharp 2px red buttons",
    heroStyle: "Bold urgency header",
    sectionStyle: "Structured sharp-corner panels",
    designNotes: "Legacy alias for storm-shield",
    isLegacy: true,
  },

  // Old simple aliases
  {
    id: "modern-pro",
    name: "Modern Local Pro",
    description: "Legacy alias",
    bestFor: ["Contractors"],
    colors: { primary: "#1D4ED8", secondary: "#0F172A", accent: "#0EA5E9", background: "#F8FAFC", surface: "#FFFFFF", text: "#0F172A", muted: "#64748B" },
    fonts: { heading: "Plus Jakarta Sans", body: "Inter" },
    borderRadius: "12px", buttonStyle: "", heroStyle: "", sectionStyle: "", designNotes: "Legacy alias", isLegacy: true,
  },
  {
    id: "bold-trade",
    name: "Bold Trade",
    description: "Legacy alias",
    bestFor: ["Roofing"],
    colors: { primary: "#EA580C", secondary: "#0B132B", accent: "#FBBF24", background: "#F8FAFC", surface: "#FFFFFF", text: "#0F172A", muted: "#64748B" },
    fonts: { heading: "Montserrat", body: "Inter" },
    borderRadius: "6px", buttonStyle: "", heroStyle: "", sectionStyle: "", designNotes: "Legacy alias", isLegacy: true,
  },
  {
    id: "clean-medical",
    name: "Clean Medical",
    description: "Legacy alias",
    bestFor: ["Cleaning"],
    colors: { primary: "#0D9488", secondary: "#115E59", accent: "#2DD4BF", background: "#F0FDFA", surface: "#FFFFFF", text: "#134E4A", muted: "#64748B" },
    fonts: { heading: "Poppins", body: "Inter" },
    borderRadius: "16px", buttonStyle: "", heroStyle: "", sectionStyle: "", designNotes: "Legacy alias", isLegacy: true,
  },
  {
    id: "luxury-elegant",
    name: "Luxury Elegant",
    description: "Legacy alias",
    bestFor: ["Law Firms"],
    colors: { primary: "#1C1917", secondary: "#292524", accent: "#D97706", background: "#FAFAF9", surface: "#FFFFFF", text: "#1C1917", muted: "#78716C" },
    fonts: { heading: "Playfair Display", body: "Lato" },
    borderRadius: "2px", buttonStyle: "", heroStyle: "", sectionStyle: "", designNotes: "Legacy alias", isLegacy: true,
  },
  {
    id: "fresh-natural",
    name: "Fresh & Natural",
    description: "Legacy alias",
    bestFor: ["Landscaping"],
    colors: { primary: "#15803D", secondary: "#166534", accent: "#84CC16", background: "#F7FEE7", surface: "#FFFFFF", text: "#14532D", muted: "#4D7C0F" },
    fonts: { heading: "DM Serif Display", body: "DM Sans" },
    borderRadius: "16px", buttonStyle: "", heroStyle: "", sectionStyle: "", designNotes: "Legacy alias", isLegacy: true,
  },
  {
    id: "warm-friendly",
    name: "Warm & Friendly",
    description: "Legacy alias",
    bestFor: ["Pet Services"],
    colors: { primary: "#F43F5E", secondary: "#BE123C", accent: "#F59E0B", background: "#FFFBEB", surface: "#FFFFFF", text: "#451A03", muted: "#78716C" },
    fonts: { heading: "Nunito", body: "Nunito" },
    borderRadius: "20px", buttonStyle: "", heroStyle: "", sectionStyle: "", designNotes: "Legacy alias", isLegacy: true,
  },
  {
    id: "minimal-mono",
    name: "Minimal Mono",
    description: "Legacy alias",
    bestFor: ["Consultants"],
    colors: { primary: "#09090B", secondary: "#27272A", accent: "#4F46E5", background: "#FFFFFF", surface: "#F4F4F5", text: "#09090B", muted: "#71717A" },
    fonts: { heading: "Space Grotesk", body: "Inter" },
    borderRadius: "4px", buttonStyle: "", heroStyle: "", sectionStyle: "", designNotes: "Legacy alias", isLegacy: true,
  },
  {
    id: "vibrant-modern",
    name: "Vibrant Modern",
    description: "Legacy alias",
    bestFor: ["Gyms"],
    colors: { primary: "#7C3AED", secondary: "#4C1D95", accent: "#EC4899", background: "#FDF4FF", surface: "#FFFFFF", text: "#3B0764", muted: "#6B7280" },
    fonts: { heading: "Outfit", body: "Inter" },
    borderRadius: "16px", buttonStyle: "", heroStyle: "", sectionStyle: "", designNotes: "Legacy alias", isLegacy: true,
  },
];

// -------------------------------------------------------
// Alias resolution map — all old IDs point to new themes
// -------------------------------------------------------
const THEME_ALIASES: Record<string, string> = {
  "modern-local-pro":    "secure-home",
  "split-hero":          "rapid-response",
  "bold-conversion":     "iron-grip",
  "premium-local":       "master-craft",
  "editorial-modern":    "green-roots",
  "clean-minimal":       "cool-breeze",
  "trust-first":         "secure-home",
  "modern-service-grid": "pipe-and-wrench",
  "contemporary-soft":   "clean-sweep",
  "high-contrast-modern":"storm-shield",
  "modern-pro":          "secure-home",
  "bold-trade":          "rapid-response",
  "clean-medical":       "clean-sweep",
  "luxury-elegant":      "master-craft",
  "fresh-natural":       "green-roots",
  "warm-friendly":       "clean-sweep",
  "minimal-mono":        "cool-breeze",
  "vibrant-modern":      "iron-grip",
};

export function getThemeById(id: string): Theme {
  // Direct match on non-legacy themes first
  const direct = THEMES.find((t) => t.id === id && !t.isLegacy);
  if (direct) return direct;

  // Alias lookup
  const targetId = THEME_ALIASES[id] || id;
  const mapped = THEMES.find((t) => t.id === targetId && !t.isLegacy);
  if (mapped) return mapped;

  // Fallback to any direct match including legacy
  const fallback = THEMES.find((t) => t.id === id);
  if (fallback) return fallback;

  return THEMES[0]; // pipe-and-wrench default
}

/**
 * Returns 2–3 recommended non-legacy theme IDs based on business type.
 * Each trade gets its own best-fit theme as #1 recommendation.
 */
export function getRecommendedThemeIds(businessType: string): string[] {
  if (!businessType) return ["pipe-and-wrench", "rapid-response", "secure-home"];

  const n = businessType.toLowerCase();

  // 🔧 Plumbing
  if (n.includes("plumb") || n.includes("drain") || n.includes("pipe") || n.includes("sewer") || n.includes("water heater"))
    return ["pipe-and-wrench", "rapid-response", "secure-home"];

  // ⚡ Electrical
  if (n.includes("electr") || n.includes("wiring") || n.includes("panel") || n.includes("ev charger") || n.includes("lighting"))
    return ["spark-and-wire", "secure-home", "rapid-response"];

  // ❄️ HVAC / AC / Heating
  if (n.includes("hvac") || n.includes("air condition") || n.includes("heating") || n.includes("furnace") || n.includes("duct") || n.includes("cooling"))
    return ["cool-breeze", "secure-home", "rapid-response"];

  // 🏠 Roofing / Gutters / Siding
  if (n.includes("roof") || n.includes("gutter") || n.includes("siding") || n.includes("shingle"))
    return ["storm-shield", "rapid-response", "iron-grip"];

  // 🌳 Landscaping / Tree / Lawn
  if (n.includes("landscape") || n.includes("lawn") || n.includes("tree") || n.includes("garden") || n.includes("irrigation") || n.includes("mow"))
    return ["green-roots", "clean-sweep", "cool-breeze"];

  // ✨ Cleaning / Maid / Carpet / Window
  if (n.includes("clean") || n.includes("maid") || n.includes("carpet") || n.includes("window wash") || n.includes("pressure wash") || n.includes("janitorial"))
    return ["clean-sweep", "green-roots", "cool-breeze"];

  // 🔩 Auto / Mechanic / Tires / Body
  if (n.includes("auto") || n.includes("mechanic") || n.includes("car") || n.includes("tire") || n.includes("brake") || n.includes("transmission") || n.includes("oil change"))
    return ["iron-grip", "rapid-response", "storm-shield"];

  // 🏗️ Remodeling / Custom Build / Kitchen / Bath / Cabinets / Flooring
  if (n.includes("remodel") || n.includes("kitchen") || n.includes("bath") || n.includes("cabinet") || n.includes("tile") || n.includes("flooring") || n.includes("custom build") || n.includes("interior"))
    return ["master-craft", "green-roots", "secure-home"];

  // 🛡️ Pest Control / Inspection / Foundation / Security / Mold
  if (n.includes("pest") || n.includes("inspect") || n.includes("foundation") || n.includes("mold") || n.includes("security") || n.includes("waterproof"))
    return ["secure-home", "cool-breeze", "pipe-and-wrench"];

  // 🚨 Emergency / Locksmith / Towing / Water Damage / 24/7
  if (n.includes("locksmith") || n.includes("towing") || n.includes("water damage") || n.includes("emergency") || n.includes("24/7") || n.includes("roadside") || n.includes("flood"))
    return ["rapid-response", "iron-grip", "storm-shield"];

  // Default — general contractor
  return ["pipe-and-wrench", "rapid-response", "secure-home"];
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
