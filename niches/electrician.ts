import { NichePack } from "./types";

export const electricianNiche: NichePack = {
  id: "electrician",
  name: "Electrician",
  schemaType: "Electrician",
  emergencyService: true,
  commonServices: [
    "24/7 Emergency Electrical Repair",
    "Electrical Panel Upgrades (200 Amp)",
    "EV Charger Installation (Level 2)",
    "Whole-Home Backup Generator Installation",
    "Indoor & Recessed LED Lighting Installation",
    "Outdoor Landscape & Security Lighting",
    "Ceiling Fan Installation & Repair",
    "Whole-Home Rewiring & Knob-and-Tube Replacement",
    "GFCI & AFCI Outlet Installation",
    "Whole-House Surge Protection Systems",
    "Circuit Breaker Repair & Diagnostic",
    "Comprehensive Electrical Safety Inspections",
  ],
  customerPainPoints: [
    "Electrical fire hazards from sparking outlets, burning smells, or humming panels",
    "Frequent circuit breaker trips shutting down appliances and home offices",
    "Flickering or dimming lights whenever major appliances cycle on",
    "Outdated 100-amp electrical panels unable to handle modern power demands",
    "Lack of reliable 240V charging for new electric vehicles",
    "Dangerous ungrounded two-prong outlets throughout older homes",
    "Power outages spoiling food and disabling medical equipment",
    "Unpermitted or DIY wiring from previous owners violating building safety codes",
  ],
  trustSignals: [
    "Licensed Master Electrician & Fully Insured ($2M Liability)",
    "Strict Compliance with Current National Electrical Code (NEC)",
    "Upfront Transparent Flat-Rate Pricing — No Hidden Fees",
    "Lifetime Workmanship Warranty on All Electrical Installations",
    "Background-Checked & Drug-Screened Journeymen Electricians",
    "24/7 Rapid Emergency Response for Hazardous Conditions",
    "A+ Rating with the BBB & Hundreds of 5-Star Reviews",
    "Fully Permitted Work with Guaranteed Municipal Code Passing",
  ],
  faqTopics: [
    {
      question: "When should I upgrade my home's electrical panel?",
      answerSummary: "If your panel is over 25 years old, uses fuses, feels warm to the touch, or you are adding heavy loads like EV chargers, heat pumps, or hot tubs, upgrading to a 200-amp panel is recommended.",
    },
    {
      question: "What causes a circuit breaker to trip repeatedly?",
      answerSummary: "Breakers trip due to overloaded circuits, short circuits, or ground faults. Repeated tripping requires professional diagnosis to prevent wire overheating and fire hazards.",
    },
    {
      question: "How long does a Level 2 EV charger installation take?",
      answerSummary: "Most residential EV charger installations take between 2 to 4 hours, including dedicated 240V circuit running, conduit installation, and load calculation.",
    },
    {
      question: "Why are my lights flickering?",
      answerSummary: "Flickering can indicate loose wiring connections, grid voltage fluctuations, or an overloaded circuit. Loose connections in switch boxes or panels pose serious fire risks and should be checked immediately.",
    },
    {
      question: "What is the difference between GFCI and AFCI breakers?",
      answerSummary: "GFCI protects people from electrical shock near water (kitchens, baths, outdoors), while AFCI detects dangerous electrical arcing behind walls that could trigger house fires.",
    },
    {
      question: "Do you pull permits for electrical work?",
      answerSummary: "Yes, we handle all municipal permitting and coordinate final city inspections to guarantee your installation is 100% legal, safe, and code-compliant.",
    },
    {
      question: "Can you install a whole-house surge protector?",
      answerSummary: "Yes, we install commercial-grade whole-home surge protection at the main service panel to protect expensive smart appliances, computers, and HVAC systems from power spikes.",
    },
    {
      question: "What should I do if an outlet sparks or smells like burning plastic?",
      answerSummary: "Immediately switch off the breaker controlling that circuit, unplug any connected cords, and call our emergency dispatch line right away.",
    },
    {
      question: "How much power do I need for a whole-home standby generator?",
      answerSummary: "Depending on your home's square footage and whether you wish to power essential circuits or the entire HVAC and appliance load, systems typically range from 14kW to 26kW.",
    },
    {
      question: "Are your electricians licensed and insured?",
      answerSummary: "Yes, all our electricians hold state master or journeyman licenses and carry comprehensive general liability and workers' compensation coverage.",
    },
  ],
  processSteps: [
    {
      step: 1,
      title: "Consultation & Rapid Dispatch",
      description: "Call or book online. We assess your electrical requirements and dispatch a licensed technician with a fully equipped service vehicle.",
    },
    {
      step: 2,
      title: "Comprehensive Diagnostic & Code Review",
      description: "We inspect your wiring, test voltage and panel load with precision multimeters, and identify safety concerns.",
    },
    {
      step: 3,
      title: "Guaranteed Upfront Pricing",
      description: "You receive clear, itemized pricing and installation options before any work begins. You choose the solution that fits your budget.",
    },
    {
      step: 4,
      title: "Expert Code-Compliant Installation & Safety Check",
      description: "Our master electricians complete the work to strict NEC standards, perform full safety verifications, and leave the workspace spotless.",
    },
  ],
  recommendedSections: [
    "emergencyBanner",
    "hero",
    "trustBar",
    "services",
    "stats",
    "whyUs",
    "process",
    "serviceAreas",
    "testimonials",
    "faq",
    "ctaBanner",
    "contactForm",
  ],
  recommendedThemes: ["bold-trade", "modern-pro"],
  recommendedPages: ["Home", "About", "Services", "Contact", "FAQ", "Service Areas", "Reviews"],
  imageQueries: {
    hero: [
      "electrician working on circuit breaker panel with multimeter",
      "certified electrician wiring modern home electrical system",
      "master electrician testing home panel voltage",
    ],
    services: [
      "electrical panel 200 amp upgrade installation",
      "ev car charger wallbox installation garage",
      "recessed led ceiling lighting living room",
      "backup generator installation outside home",
      "electrician replacing outlet gfci",
      "commercial electrical wiring conduits",
    ],
    team: [
      "master electrician in uniform smiling holding tools",
      "electrical contractor crew by company service truck",
    ],
    work: [
      "clean labeled electrical breaker box wiring",
      "modern luxury recessed lighting living room",
      "installed tesla ev home charger in garage",
    ],
  },
  keywordPatterns: [
    "{service} in {city}",
    "{service} near me",
    "emergency electrician {city}",
    "licensed electrician {city}",
    "panel upgrade electrician {city}",
    "best electrical contractor {city} {state}",
    "ev charger installation {city}",
    "24 hour electrician {city}",
  ],
  toneNotes:
    "Safety-first, authoritative, reassuring, and meticulous, emphasizing National Electrical Code compliance and fire hazard prevention.",
  aliases: ["electrician", "electrical", "wiring", "panel upgrade", "lighting repair", "ev charger"],
};

export default electricianNiche;
