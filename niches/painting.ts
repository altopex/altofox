import { NichePack } from "./types";

export const paintingNiche: NichePack = {
  id: "painting",
  name: "Painting Contractor",
  schemaType: "HousePainter",
  emergencyService: false,
  commonServices: [
    "Interior Residential Wall & Ceiling Painting",
    "Exterior Home Painting & Weatherproof Sealing",
    "Kitchen Cabinet Factory-Finish Spray Painting",
    "Trim, Baseboard, Crown Molding & Door Painting",
    "Drywall Patching, Hole Repair & Texture Matching",
    "Deck, Fence & Porch Staining & Waterproofing",
    "Wallpaper Removal & Wall Smoothing",
    "Durable Epoxy Garage Floor Flake Coating",
    "Free In-Home Color Consultation & Digital Renderings",
    "Popcorn Ceiling Removal & Smooth Skimming",
    "Stucco Repair, Priming & Elastomeric Coating",
    "Light Commercial Office & Retail Painting",
  ],
  customerPainPoints: [
    "Messy painters dripping paint on hardwood floors, carpeting, and furniture",
    "Peeling, blistering paint after just one or two years due to skipped scraping and priming",
    "Wobbly, uneven cut lines along ceilings, baseboards, and window trim",
    "Lingering, nauseating chemical fumes causing headaches for children and pets",
    "Painters disappearing midday and stretching a 3-day job into three agonizing weeks",
    "Surprise invoices with hidden upcharges for standard spackling, masking, or second coats",
    "Low-grade contractor paint applied that scuffs immediately and cannot be wiped clean",
    "Overwhelming confusion trying to choose paint colors that look good in varying natural light",
  ],
  trustSignals: [
    "Licensed, Bonded & Insured Professional Painting Contractor ($2M Coverage)",
    "3-Year Written No-Peel & No-Chip Craftsmanship Warranty",
    "80% Prep, 20% Paint Philosophy (Sanding, Caulking, Scraping & Priming)",
    "Premium Low-VOC & Zero-VOC Paints (Sherwin-Williams & Benjamin Moore Exclusively)",
    "Free In-Home Architectural Color Consultation with Large Color Swatches",
    "Clean-Jobsite Guarantee (All Floors Drop-Clothed & Daily Clean-Up)",
    "Dedicated Full-Time Professional Painters (Zero Casual Day Labor)",
    "Over 1,000+ Completed Homes with 5-Star Reputation",
  ],
  faqTopics: [
    {
      question: "How long does it take to paint the interior of an average house?",
      answerSummary: "A standard 2,000-square-foot home typically takes 3 to 4 days, including all surface prep, two full coats of paint, trim detailing, and final cleanup.",
    },
    {
      question: "What brand and grade of paint do you use?",
      answerSummary: "We use premium Sherwin-Williams (Duration, Emerald) and Benjamin Moore (Regal Select, Aura) paints, known for rich color depth, durability, and scrubbability.",
    },
    {
      question: "Do I need to move all my heavy furniture before the painters arrive?",
      answerSummary: "No, our crew carefully moves large furniture to the center of each room, covers everything securely with clean plastic sheeting, and returns items to their original spots when finished.",
    },
    {
      question: "Can dark-stained kitchen cabinets really be painted white without peeling?",
      answerSummary: "Yes! We follow a 5-step factory finish process: degreasing, mechanical sanding, bonding shellac primer, and two sprayed coats of hard-curing urethane enamel that resists chipping.",
    },
    {
      question: "What exterior painting preparation do you include?",
      answerSummary: "Our exterior prep includes power washing to remove chalking, scraping loose paint, sanding rough edges, priming exposed wood, caulking all window/door seams, and masking glass.",
    },
    {
      question: "Are your paints safe for my children and indoor pets?",
      answerSummary: "Yes, we exclusively apply low-VOC and zero-VOC interior paints that emit virtually zero odor and cure quickly without harmful fumes.",
    },
    {
      question: "How do you ensure crisp, razor-sharp paint lines along trims and ceilings?",
      answerSummary: "Our master painters use specialized automotive-grade masking tapes and freehand sash brushes with steady, trained hands to deliver immaculate, razor-sharp cut lines.",
    },
    {
      question: "Do you repair holes, cracks, and drywall dents before painting?",
      answerSummary: "Yes, all standard nail holes, settlement cracks, and minor drywall imperfections are patched, sanded flush, and primed before the first coat of paint is applied.",
    },
    {
      question: "Can you help me choose the right colors for my home?",
      answerSummary: "Yes, our color consultants bring large sample boards to your home, assess natural and artificial lighting, and provide personalized palette recommendations.",
    },
    {
      question: "What warranty do you offer on exterior paint jobs?",
      answerSummary: "We provide a comprehensive 3-year written warranty covering peeling, blistering, and flaking, backed by manufacturer material warranties of up to 25 years or lifetime.",
    },
  ],
  processSteps: [
    {
      step: 1,
      title: "In-Home Color Consultation & Detailed Estimate",
      description: "We meet at your home, review room lighting, discuss finish sheens (matte, satin, semi-gloss), and provide an itemized written quote.",
    },
    {
      step: 2,
      title: "Meticulous Masking & Surface Preparation",
      description: "We cover all floors, mask baseboards, patch holes, caulk trim seams, and sand surfaces smooth so the paint adheres flawlessly.",
    },
    {
      step: 3,
      title: "Premium Two-Coat Application",
      description: "Our craftsmen apply two even, rich coats of premium Sherwin-Williams or Benjamin Moore paint with precision rollers and detail brushes.",
    },
    {
      step: 4,
      title: "Final Walkthrough & Touch-Up Kit Handover",
      description: "We inspect every wall together under bright lights, perform any touch-ups, clean up thoroughly, and leave labeled touch-up paint cans.",
    },
  ],
  recommendedSections: [
    "hero",
    "trustBar",
    "services",
    "stats",
    "whyUs",
    "process",
    "gallery",
    "serviceAreas",
    "testimonials",
    "faq",
    "ctaBanner",
    "contactForm",
  ],
  recommendedThemes: ["vibrant-modern", "modern-pro", "luxury-elegant"],
  recommendedPages: ["Home", "About", "Services", "Contact", "FAQ", "Service Areas", "Gallery", "Reviews"],
  imageQueries: {
    hero: [
      "professional painter rolling wall modern bright room",
      "painter with roller tray in clean white uniform",
      "modern painted living room interior design home",
    ],
    services: [
      "interior wall painting roller fresh paint",
      "exterior house painting ladders scaffolding",
      "kitchen cabinet spray painting factory finish",
      "drywall repair patching spatula compound",
      "epoxy garage floor coating color flakes",
      "deck staining brush wood waterproofing",
    ],
    team: [
      "professional painter in clean whites holding brush smiling",
      "painting crew team standing by service van",
    ],
    work: [
      "flawless painted modern living room high ceilings",
      "beautiful freshly painted exterior home curb appeal",
      "white painted kitchen cabinets with modern brass hardware",
    ],
  },
  keywordPatterns: [
    "{service} in {city}",
    "{service} near me",
    "house painter {city}",
    "interior painting {city}",
    "exterior painters {city}",
    "cabinet painting {city} {state}",
    "best painting company {city}",
    "local painter near me",
  ],
  toneNotes:
    "Artistic, perfectionist, clean, and transformative, focusing on meticulous prep work, flawless crisp lines, and designer-grade color harmony.",
  aliases: ["painting", "painter", "house painting", "interior painting", "exterior painting", "cabinet painting"],
};

export default paintingNiche;
