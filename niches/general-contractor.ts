import { NichePack } from "./types";

export const generalContractorNiche: NichePack = {
  id: "general-contractor",
  name: "General Contractor",
  schemaType: "GeneralContractor",
  emergencyService: false,
  commonServices: [
    "Full Kitchen Remodeling & Custom Cabinetry",
    "Master Bathroom Renovations & Walk-In Showers",
    "Home Additions & Second-Story Expansions",
    "Basement Finishing, Media Rooms & Wet Bars",
    "Custom Home Construction & Structural Framing",
    "Garage Conversions & Accessory Dwelling Units (ADU)",
    "Load-Bearing Wall Removal & Steel Beam Installation",
    "Whole-Home Interior & Exterior Renovations",
    "Covered Patios, Decks & Outdoor Living Pavilions",
    "Commercial Tenant Improvements & Build-Outs",
    "Architectural Drafting, 3D Renderings & City Permitting",
    "Historic Home Restorations & Seismic Retrofitting",
  ],
  customerPainPoints: [
    "Nightmarish contractors who go massively over budget and blow past agreed deadlines",
    "Poor sub-contractor supervision resulting in crooked framing, sloppy tile, or bad plumbing",
    "Unpermitted construction triggering city stop-work orders and resale disclosure nightmares",
    "Contractors who demand enormous cash deposits upfront and become unreachable for weeks",
    "Suffering in a dusty, disorganized construction zone with no dust barriers or daily cleanup",
    "Surprise change orders constantly inflating costs beyond the signed contract",
    "Lack of design vision leading to awkward room traffic flow and mismatched finishes",
    "Punch list items left unfinished for months after final payments are requested",
  ],
  trustSignals: [
    "Licensed General Contractor (Class A/B) & Insured ($2M General Liability & Workers' Comp)",
    "Guaranteed Fixed-Price Contracts with Detailed Milestone Payment Schedules",
    "Dedicated Full-Time On-Site Project Manager Assigned to Your Build",
    "Full In-House Architectural Permitting & City Code Inspection Management",
    "5-Year Comprehensive Structural & Workmanship Warranty",
    "Negative-Air HEPA Dust Containment Systems & Daily Clean Sweep Guarantee",
    "Transparent Online Customer Portal with Daily Photo Logs & Schedule Tracking",
    "Award-Winning Portfolio of Luxury Local Remodels & Stellar References",
  ],
  faqTopics: [
    {
      question: "How long does a typical kitchen or bathroom remodel take?",
      answerSummary: "A master bathroom remodel typically takes 3 to 4 weeks, while a full custom kitchen remodel averages 5 to 7 weeks from demolition to final punch list.",
    },
    {
      question: "Do you handle city building permits and inspections?",
      answerSummary: "Yes, we handle the entire permitting lifecycle: drafting architectural blueprints, submitting structural engineering calculations, pulling permits, and coordinating all city inspections.",
    },
    {
      question: "How do you prevent unexpected budget overruns?",
      answerSummary: "We operate on guaranteed fixed-price contracts based on detailed pre-construction scopes. Any changes you request during construction require written approval with exact costs before work proceeds.",
    },
    {
      question: "Can load-bearing walls be safely removed to create an open concept?",
      answerSummary: "Yes, our structural engineers calculate the roof and ceiling loads, size a recessed steel or engineered wood beam (LVL), and our framing crew installs temporary shoring walls during beam placement.",
    },
    {
      question: "Will I have a dedicated point of contact during construction?",
      answerSummary: "Yes, an experienced on-site Project Manager is assigned exclusively to oversee your remodel, coordinate trades, provide daily updates, and answer your questions directly.",
    },
    {
      question: "How do you protect the rest of my home from construction dust?",
      answerSummary: "We seal off work zones with heavy zippered plastic poly barriers, place protective floor runners over hardwood and tile, and run commercial HEPA air scrubbers to keep living spaces clean.",
    },
    {
      question: "Can we live in our home during the remodel?",
      answerSummary: "For kitchens and bathrooms, most clients comfortably live in their homes. We set up temporary cooking or sink stations when needed and maintain strict clean-up routines daily.",
    },
    {
      question: "What is an ADU and what are the requirements to build one?",
      answerSummary: "An Accessory Dwelling Unit (ADU or granny flat) is a secondary housing unit on your lot. We design detached or garage-conversion ADUs compliant with local setback and zoning codes.",
    },
    {
      question: "Do you provide 3D interior design renderings before construction?",
      answerSummary: "Yes, our interior design team creates photorealistic 3D renderings of your kitchen, bathroom, or addition so you can see cabinets, tile, countertops, and lighting before ordering.",
    },
    {
      question: "What warranty do you offer on new additions and remodels?",
      answerSummary: "We back all our construction with a 5-year structural craftsmanship warranty, in addition to full manufacturer warranties on all installed fixtures, cabinets, and appliances.",
    },
  ],
  processSteps: [
    {
      step: 1,
      title: "Discovery Consultation & Feasibility",
      description: "We meet at your home to discuss your lifestyle vision, assess structural viability, and establish realistic project budget ranges.",
    },
    {
      step: 2,
      title: "3D Design, Architectural Plans & Permitting",
      description: "Our architects draft detailed blueprints and 3D renderings, finalize finish selections, and obtain all necessary municipal building permits.",
    },
    {
      step: 3,
      title: "Precision Construction & Quality Milestones",
      description: "Your dedicated Project Manager oversees demolition, framing, MEP rough-ins, inspections, and master craftsmanship with daily photo logs.",
    },
    {
      step: 4,
      title: "Final Punch List & 5-Year Warranty Handover",
      description: "We complete an exhaustive 100-point walkthrough with you, polish every surface, and hand over your comprehensive 5-year warranty package.",
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
  recommendedThemes: ["luxury-elegant", "modern-pro", "bold-trade"],
  recommendedPages: ["Home", "About", "Services", "Contact", "FAQ", "Service Areas", "Gallery", "Reviews"],
  imageQueries: {
    hero: [
      "luxury modern kitchen remodel island quartz countertops",
      "general contractor reviewing architectural blueprints on residential job site",
      "luxury master bathroom walk in shower remodel",
    ],
    services: [
      "modern kitchen custom cabinetry remodel island",
      "master bathroom remodel freestanding tub glass shower",
      "home addition framing second story construction",
      "finished basement remodel home theater wet bar",
      "custom home outdoor covered patio living space",
      "accessory dwelling unit adu construction backyard",
    ],
    team: [
      "general contractor and interior designer reviewing plans",
      "construction project manager smiling on residential job site with clipboard",
    ],
    work: [
      "stunning open concept kitchen and living room remodel",
      "luxury spa master bathroom with marble tile and dual vanity",
      "modern architectural home addition exterior view",
    ],
  },
  keywordPatterns: [
    "{service} in {city}",
    "{service} near me",
    "general contractor {city}",
    "kitchen remodel {city}",
    "bathroom renovation {city}",
    "home remodeling contractor {city} {state}",
    "home additions {city}",
    "best custom home builder {city}",
  ],
  toneNotes:
    "Sophisticated, authoritative, visionary, and dependable, conveying architectural excellence, strict project timelines, and transparent fixed-price contracting.",
  aliases: ["general contractor", "remodeling", "home renovation", "kitchen remodel", "bathroom remodel", "home builder"],
};

export default generalContractorNiche;
