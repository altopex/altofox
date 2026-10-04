/**
 * RankLocal Content Generation Architecture — Seed Variation Engine
 *
 * Replaces vague "make the content unique" instructions with a deterministic,
 * multi-tier seed variation system: siteSeed -> pageSeed -> sectionSeed.
 *
 * Controls:
 * 1. Heading structure & formula selection
 * 2. Section ordering sequence
 * 3. Paragraph structure (symptom list vs technical diagnostic vs timeline vs narrative)
 * 4. CTA wording variants
 * 5. FAQ topic selection
 * 6. Trade-specific examples & failure mode specifics
 * 7. Supporting regional topics (freeze risks, building codes, water hardness)
 */

import { PageArchetype, ContentVariationSeedSpec } from "./types";

export interface VariationProfile {
  headingStyle: "action_benefit" | "diagnostic_urgency" | "craftsmanship_authority" | "problem_resolution";
  sectionSequence: string[];
  paragraphStructure: "symptom_checklist" | "technical_walkthrough" | "comparative_breakdown" | "narrative_problem_solution";
  ctaWording: {
    heroPrimary: string;
    heroSecondary: string;
    bannerHeadline: string;
    bannerSub: string;
    bannerButton: string;
  };
  faqSelection: Array<{ question: string; answer: string; technicalKey: string }>;
  tradeExamples: string[];
  supportingTopics: string[];
  seedDigest: string;
}

// ---------------------------------------------------------------------------
// Deterministic Hashing & PRNG
// ---------------------------------------------------------------------------

export function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export class SeededRNG {
  private state: number;

  constructor(seedString: string) {
    this.state = hashSeed(seedString);
  }

  /** Returns float in [0, 1) */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns integer in [min, max] inclusive */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Picks one element from array */
  pick<T>(items: T[]): T {
    if (!items || items.length === 0) throw new Error("Cannot pick from empty array");
    const index = Math.floor(this.next() * items.length);
    return items[index];
  }

  /** Shuffles array deterministically */
  shuffle<T>(items: T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /** Picks k unique items from array */
  sample<T>(items: T[], k: number): T[] {
    const shuffled = this.shuffle(items);
    return shuffled.slice(0, Math.min(k, shuffled.length));
  }
}

// ---------------------------------------------------------------------------
// Per-Archetype Section Sequences
// ---------------------------------------------------------------------------

const HOMEPAGE_SEQUENCES: string[][] = [
  // Sequence 1: Conversion-First (Emergency banner, hero, trust, services, whyUs, howItWorks, serviceAreas, faq, cta)
  ["emergencyBanner", "hero", "trustBar", "services", "whyUs", "process", "serviceAreas", "faq", "ctaBanner", "contactForm"],
  // Sequence 2: Credibility-First (Hero, trustBar, stats, services, process, whyUs, serviceAreas, faq, cta)
  ["hero", "trustBar", "stats", "services", "process", "whyUs", "serviceAreas", "faq", "ctaBanner", "contactForm"],
  // Sequence 3: Service-First (Hero, services, emergencyBanner, whyUs, trustBar, process, serviceAreas, faq, cta)
  ["hero", "services", "emergencyBanner", "whyUs", "trustBar", "process", "serviceAreas", "faq", "ctaBanner", "contactForm"],
];

const SERVICE_PAGE_SEQUENCES: string[][] = [
  // Sequence 1: Diagnostic / Problem Breakdown
  ["pageHero", "serviceOverview", "commonProblems", "process", "whyUs", "faq", "ctaBanner", "contactForm"],
  // Sequence 2: Equipment / Solution Focused
  ["pageHero", "serviceOverview", "process", "commonProblems", "trustBar", "faq", "ctaBanner", "contactForm"],
  // Sequence 3: Urgency / Prevention Focused
  ["emergencyBanner", "pageHero", "commonProblems", "serviceOverview", "process", "faq", "ctaBanner", "contactForm"],
];

const LOCATION_PAGE_SEQUENCES: string[][] = [
  // Sequence 1: Community Dispatch & Response
  ["pageHero", "localHighlights", "servicesOffered", "serviceAreas", "whyUs", "faq", "ctaBanner", "contactForm"],
  // Sequence 2: Infrastructure & Code Compliance
  ["pageHero", "servicesOffered", "localHighlights", "process", "whyUs", "faq", "ctaBanner", "contactForm"],
  // Sequence 3: Fast Response / Neighborhood Grid
  ["emergencyBanner", "pageHero", "localHighlights", "serviceAreas", "servicesOffered", "faq", "ctaBanner", "contactForm"],
];

const ABOUT_PAGE_SEQUENCES: string[][] = [
  ["pageHero", "companyStory", "masterQualifications", "valuesGrid", "stats", "ctaBanner"],
  ["pageHero", "masterQualifications", "companyStory", "trustBar", "valuesGrid", "ctaBanner"],
];

const CONTACT_PAGE_SEQUENCES: string[][] = [
  ["pageHero", "contactForm", "businessInfoHours", "serviceAreas", "emergencyBanner"],
  ["pageHero", "emergencyBanner", "contactForm", "businessInfoHours", "trustBar"],
];

const FAQ_PAGE_SEQUENCES: string[][] = [
  ["pageHero", "faqCategories", "faqAccordionFull", "whyUs", "ctaBanner"],
  ["pageHero", "faqAccordionFull", "trustBar", "faqCategories", "ctaBanner"],
];

const BLOG_PAGE_SEQUENCES: string[][] = [
  ["articleHeader", "articleBody", "technicalFaq", "authorBio", "relatedArticles", "ctaBanner"],
  ["articleHeader", "quickSummary", "articleBody", "authorBio", "technicalFaq", "ctaBanner"],
];

// ---------------------------------------------------------------------------
// CTA Pools
// ---------------------------------------------------------------------------

const CTA_POOLS = {
  hero: [
    {
      primary: "Call {phone} for Immediate Dispatch",
      secondary: "Request Upfront Flat-Rate Quote",
    },
    {
      primary: "Speak With an On-Call Master Technician",
      secondary: "Book Same-Day Diagnostic",
    },
    {
      primary: "Get 24/7 Priority Emergency Service",
      secondary: "Get a Free In-Home Estimate",
    },
    {
      primary: "Call {phone} — No Overtime Fees",
      secondary: "Schedule Certified Service Online",
    },
  ],
  banner: [
    {
      headline: "Need Immediate, Code-Compliant Repairs in {city}?",
      sub: "Our licensed master technicians dispatch with fully stocked trucks for same-day fixes.",
      button: "Call {phone} Now",
    },
    {
      headline: "Protect Your Home From Costly Secondary Water Damage",
      sub: "Transparent upfront pricing before any work begins. 100% written workmanship guarantee.",
      button: "Speak With a Technician",
    },
    {
      headline: "Don't Let a Minor Plumbing Issue Become a Catastrophic Flood",
      sub: "Trusted by homeowners and property managers across {city} with verified local expertise.",
      button: "Schedule Rapid Dispatch",
    },
  ],
};

// ---------------------------------------------------------------------------
// Curated Technical FAQ Pools for Niche (Plumbing & Trades)
// ---------------------------------------------------------------------------

const TECHNICAL_FAQS_BY_SERVICE: Record<string, Array<{ question: string; answer: string; technicalKey: string }>> = {
  "water-heater": [
    {
      question: "What are the common warning signs that a water heater is failing?",
      answer: "Key failure indicators include rusty or discolored hot water, rumbling popping noises caused by sediment accumulation at the tank base, moisture pooling around the burner assembly, and hot water running out noticeably faster than normal.",
      technicalKey: "sediment_anode_failure",
    },
    {
      question: "Should I repair my water heater or replace it with a tankless model?",
      answer: "If your storage tank unit is over 10–12 years old and exhibits tank corrosion or major element failure, replacement is typically more cost-effective. Modern tankless systems provide on-demand continuous hot water and eliminate standby energy loss.",
      technicalKey: "tank_vs_tankless_decision",
    },
    {
      question: "Why does municipal water hardness accelerate water heater wear in this area?",
      answer: "Local municipal water contains dissolved calcium and magnesium carbonates that precipitate onto immersion heating elements and tank floors when heated. Without periodic flushing, this mineral crust insulates heat transfer, overheating the tank bottom and causing premature tank rupture.",
      technicalKey: "mineral_sediment_buildup",
    },
    {
      question: "How long does a professional water heater diagnostic and repair take?",
      answer: "Most electrical component swaps, thermocouple replacements, or pressure relief valve fixes take 1 to 2 hours. Full system replacements with expansion tanks and code-compliant flue venting are completed within 3 to 4 hours on the same dispatch day.",
      technicalKey: "repair_timeline_scope",
    },
    {
      question: "What temperature should my residential water heater be set to?",
      answer: "We recommend setting your thermostat to 120°F (49°C). This temperature prevents dangerous scalding and slows down mineral scale accumulation while remaining sufficiently hot to inhibit Legionella bacteria growth.",
      technicalKey: "temperature_safety_setting",
    },
  ],
  "drain-cleaning": [
    {
      question: "What is the difference between traditional drain snaking and high-pressure hydro-jetting?",
      answer: "Drain snaking (augering) punches a hole through a localized clog to restore emergency flow, but leaves sludge, grease, and roots clinging to pipe walls. Hydro-jetting blasts 3,500–4,000 PSI water through specialized rotating nozzles to scrub the entire interior pipe circumference back to original diameter.",
      technicalKey: "snaking_vs_hydrojetting",
    },
    {
      question: "Can chemical drain cleaners damage older home drain stacks?",
      answer: "Yes. Caustic chemical drain cleaners generate intense exothermic heat that softens PVC connections and rapidly accelerates galvanic corrosion inside older cast-iron and galvanized steel drain stacks. Professional mechanical clearing is far safer for long-term pipe integrity.",
      technicalKey: "chemical_cleaner_hazard",
    },
    {
      question: "How do tree roots enter underground sewer laterals?",
      answer: "Vapor and warmth from warm drain water escape through tiny clay or cast-iron joint hairline fractures. Tree roots seek this moisture, enter through microscopic fissures, and expand into dense root masses that catch debris and cause catastrophic backups.",
      technicalKey: "tree_root_infiltration",
    },
    {
      question: "Why is a sewer camera inspection essential before hydro-jetting older pipes?",
      answer: "A high-resolution sewer camera verifies whether the pipe has suffered structural collapse, bellies, or severe wall thinning. Blasting hydro-jet pressure into an already broken or collapsed pipe can worsen damage, so camera inspection ensures safe pressure calibration.",
      technicalKey: "camera_inspection_necessity",
    },
  ],
  "leak-detection": [
    {
      question: "How do your technicians locate hidden leaks behind drywall without damaging walls?",
      answer: "We employ non-invasive diagnostic tools including acoustic listening discs, high-frequency electromagnetic ground microphones, and thermal imaging cameras that trace temperature differentials produced by escaping moisture behind drywall and under subfloors.",
      technicalKey: "acoustic_thermal_detection",
    },
    {
      question: "What are the common signs of a hidden foundation slab leak?",
      answer: "Warning signs include unexplained warm spots on ceramic tile or hardwood floors, the persistent sound of running water when all fixtures are turned off, sudden unexplained spikes on monthly water bills, and dampness along baseboard trim.",
      technicalKey: "slab_leak_indicators",
    },
    {
      question: "What causes pinhole leaks in copper supply piping?",
      answer: "Pinhole leaks frequently stem from chemical pitting corrosion caused by dissolved oxygen, chloramines, erratic water pH, or high municipal water velocity eroding the inner protective patina of copper piping over 15–20 years.",
      technicalKey: "copper_pinhole_pitting",
    },
    {
      question: "What immediate steps should a homeowner take if a major water leak is detected?",
      answer: "Immediately locate and shut off your property's main water shutoff valve (typically located near the water meter or basement front wall). Open the lowest cold water tap to relieve remaining pressure, switch off your water heater breaker, and call for emergency dispatch.",
      technicalKey: "emergency_shutoff_protocol",
    },
  ],
  "chicago-location": [
    {
      question: "What unique plumbing code challenges affect older Chicago homes and bungalows?",
      answer: "Chicago's historic brick bungalows and brownstones frequently feature original lead service lines, unvented S-traps, and aging cast-iron soil stacks. Our licensed master plumbers are intimately versed in City of Chicago Plumbing Code requirements and lead-abatement replacement standards.",
      technicalKey: "chicago_bungalow_code",
    },
    {
      question: "How can Chicago homeowners protect their pipes from extreme winter deep freezes?",
      answer: "During sub-zero polar vortex conditions, keep indoor thermostats at 65°F minimum, open sink cabinet doors on exterior walls to let ambient heat circulate around supply lines, and allow a pencil-thin trickle of cold water to flow from the faucet farthest from your main line.",
      technicalKey: "polar_vortex_pipe_freeze",
    },
    {
      question: "How quickly can your plumbers dispatch across Chicago neighborhoods?",
      answer: "With fully stocked service vehicles positioned across north, south, and central neighborhood hubs (including Lincoln Park, Logan Square, Loop, and Lakeview), our emergency arrival window averages under 45 minutes across Cook County.",
      technicalKey: "chicago_neighborhood_dispatch",
    },
    {
      question: "Do you handle city permit acquisition for water service repairs in Chicago?",
      answer: "Yes. All major excavation, street cut connections, water main taps, and sewer lateral replacements require Department of Water Management (DWM) permits. We pull and file all necessary city permits directly on your behalf.",
      technicalKey: "chicago_dwm_permits",
    },
  ],
};

// ---------------------------------------------------------------------------
// Master Profile Factory
// ---------------------------------------------------------------------------

export function createVariationProfile(
  seedSpec: ContentVariationSeedSpec,
  pageType: PageArchetype,
  primaryKeyword: string,
  serviceSlug?: string
): VariationProfile {
  const shift = seedSpec.strategyShift || 0;
  const compositeSeed = shift > 0
    ? `${seedSpec.siteSeed}:${seedSpec.pageSeed}:${seedSpec.sectionSeed || "default"}:shift${shift}`
    : `${seedSpec.siteSeed}:${seedSpec.pageSeed}:${seedSpec.sectionSeed || "default"}`;
  const rng = new SeededRNG(compositeSeed);

  // 1. Heading style selection
  const headingStyles: VariationProfile["headingStyle"][] = [
    "action_benefit",
    "diagnostic_urgency",
    "craftsmanship_authority",
    "problem_resolution",
  ];
  const headingBase = rng.nextInt(0, headingStyles.length - 1);
  const headingStyle = headingStyles[(headingBase + shift) % headingStyles.length];

  // 2. Section ordering sequence selection
  let sequencePool: string[][];
  switch (pageType) {
    case "home":
      sequencePool = HOMEPAGE_SEQUENCES;
      break;
    case "service":
    case "service_location":
      sequencePool = SERVICE_PAGE_SEQUENCES;
      break;
    case "location":
      sequencePool = LOCATION_PAGE_SEQUENCES;
      break;
    case "about":
      sequencePool = ABOUT_PAGE_SEQUENCES;
      break;
    case "contact":
      sequencePool = CONTACT_PAGE_SEQUENCES;
      break;
    case "faq":
      sequencePool = FAQ_PAGE_SEQUENCES;
      break;
    case "blog":
      sequencePool = BLOG_PAGE_SEQUENCES;
      break;
    default:
      sequencePool = HOMEPAGE_SEQUENCES;
  }
  const seqBase = rng.nextInt(0, sequencePool.length - 1);
  const sectionSequence = sequencePool[(seqBase + shift) % sequencePool.length];

  // 3. Paragraph structure formula
  const paragraphStructures: VariationProfile["paragraphStructure"][] = [
    "symptom_checklist",
    "technical_walkthrough",
    "comparative_breakdown",
    "narrative_problem_solution",
  ];
  const paraBase = rng.nextInt(0, paragraphStructures.length - 1);
  const paragraphStructure = paragraphStructures[(paraBase + shift) % paragraphStructures.length];

  // 4. CTA Wording variant
  const heroCtaPool = CTA_POOLS.hero;
  const bannerCtaPool = CTA_POOLS.banner;
  const heroCtaPair = heroCtaPool[(rng.nextInt(0, heroCtaPool.length - 1) + shift) % heroCtaPool.length];
  const bannerCtaTriple = bannerCtaPool[(rng.nextInt(0, bannerCtaPool.length - 1) + shift) % bannerCtaPool.length];

  const ctaWording = {
    heroPrimary: heroCtaPair.primary,
    heroSecondary: heroCtaPair.secondary,
    bannerHeadline: bannerCtaTriple.headline,
    bannerSub: bannerCtaTriple.sub,
    bannerButton: bannerCtaTriple.button,
  };

  // 5. FAQ Selection
  // Identify closest technical topic
  let relevantFaqPool: Array<{ question: string; answer: string; technicalKey: string }> = [];
  const cleanSlug = (serviceSlug || "").toLowerCase();

  if (cleanSlug.includes("water-heater") || cleanSlug.includes("heater")) {
    relevantFaqPool = TECHNICAL_FAQS_BY_SERVICE["water-heater"];
  } else if (cleanSlug.includes("drain") || cleanSlug.includes("jetting") || cleanSlug.includes("sewer")) {
    relevantFaqPool = TECHNICAL_FAQS_BY_SERVICE["drain-cleaning"];
  } else if (cleanSlug.includes("leak") || cleanSlug.includes("pipe")) {
    relevantFaqPool = TECHNICAL_FAQS_BY_SERVICE["leak-detection"];
  } else if (pageType === "location" || cleanSlug.includes("chicago")) {
    relevantFaqPool = TECHNICAL_FAQS_BY_SERVICE["chicago-location"];
  } else {
    // Merge selection
    relevantFaqPool = [
      ...TECHNICAL_FAQS_BY_SERVICE["water-heater"].slice(0, 2),
      ...TECHNICAL_FAQS_BY_SERVICE["drain-cleaning"].slice(0, 2),
      ...TECHNICAL_FAQS_BY_SERVICE["leak-detection"].slice(0, 2),
    ];
  }

  const faqSelection = rng.sample(relevantFaqPool, 4);

  // 6. Trade Examples & Supporting Topics
  const tradeExamples = [
    "Anode rod depletion exposing inner steel tank to galvanic rust",
    "Heavy calcium carbonate sediment crusting over lower immersion heating elements",
    "Hairline clay sewer lateral joint fractures infiltrated by mature tree roots",
    "Exothermic degradation of older cast iron pipe walls from repeated chemical cleaners",
    "Non-invasive acoustic frequency sensors detecting pressurized slab leaks under finished flooring",
    "Rapid sub-zero freeze expansion rupturing uninsulated exterior-wall copper supply risers",
  ];

  const supportingTopics = [
    "Annual water heater sediment flush routines and TPR valve safety testing",
    "High-definition optical sewer camera diagnostic reporting",
    "City of Chicago Department of Water Management building code compliance",
    "Preventative winter freeze protection protocols for multi-story residential plumbing stacks",
    "Upfront flat-rate pricing transparency with itemized written estimates",
  ];

  return {
    headingStyle,
    sectionSequence,
    paragraphStructure,
    ctaWording,
    faqSelection,
    tradeExamples: rng.sample(tradeExamples, 3),
    supportingTopics: rng.sample(supportingTopics, 3),
    seedDigest: compositeSeed,
  };
}
