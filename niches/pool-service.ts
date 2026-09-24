import { NichePack } from "./types";

export const poolServiceNiche: NichePack = {
  id: "pool-service",
  name: "Pool Service & Maintenance",
  schemaType: "HomeAndConstructionBusiness",
  emergencyService: false,
  commonServices: [
    "Weekly Full-Service Pool Cleaning & Water Chemistry",
    "Green-to-Clean Swamp Pool Algae Eradication",
    "Pool Pump Repair & Variable-Speed Energy Upgrades",
    "Filter Cleaning & Media Replacement (DE, Cartridge & Sand)",
    "Saltwater Chlorination System Installation & Cell Cleaning",
    "Pool Gas Heater & Electric Heat Pump Repair",
    "Smart Pool Automation & Smartphone Controls",
    "Pool Tile Calcium & Scale Hydro-Blasting",
    "Precision Pool Leak Detection & Pressure Testing",
    "Seasonal Spring Pool Opening & Autumn Winterization",
    "Pool Plaster, Marcite & Pebble Resurfacing",
    "Commercial Pool & HOA Health Code Compliance",
  ],
  customerPainPoints: [
    "Pool turning swamp green right before a scheduled summer barbecue or family party",
    "Burning red eyes, itchy skin, and chemical odors from improperly balanced pH and chlorine",
    "Noisy, grinding pump motors or pumps failing to prime and overheating",
    "Unreliable pool route technicians who brush only half the pool and skip chemical testing logs",
    "Mysterious water loss draining hundreds of gallons per day from underground pipe leaks",
    "Massive electricity bills caused by outdated, noisy single-speed pool pumps",
    "Cloudy, dull water that never reaches that sparkling, crystal-clear resort quality",
    "Pool heaters failing right when the family wants to swim in spring and autumn",
  ],
  trustSignals: [
    "Certified Pool & Spa Operator (NSPF / PHTA CPO Certified)",
    "Licensed & Fully Insured Pool & Equipment Contractor ($2M Coverage)",
    "Digital Water Chemistry Reports Emailed After Every Visit (With Time-Stamped Photos)",
    "Consistent Assigned Route Technician on the Same Day Every Single Week",
    "100% Sparkle-Clear Water Quality Guarantee",
    "Energy-Star Partner Specializing in Variable-Speed Pumps (Save Up to 70% Energy)",
    "All Core Chemicals Included in Transparent Flat Monthly Rates",
    "Hundreds of 5-Star Reviews from Local Backyard Pool Owners",
  ],
  faqTopics: [
    {
      question: "What is included in your weekly pool maintenance service?",
      answerSummary: "Our weekly service includes water chemistry testing and balancing, skimming surface debris, vacuuming the pool floor, brushing walls and tile lines, emptying skimmer and pump baskets, and inspecting equipment operation.",
    },
    {
      question: "How long does it take to clean up a green pool?",
      answerSummary: "Our proven Green-to-Clean recovery process typically restores a swampy algae-filled pool to crystal-clear water within 48 to 72 hours through shock treatment, flocculants, and filter backwashing.",
    },
    {
      question: "Why should I upgrade to a variable-speed pool pump?",
      answerSummary: "Variable-speed pumps run at lower speeds throughout the day, filtering water more thoroughly while consuming up to 70-80% less electricity, typically paying for themselves in under two seasons.",
    },
    {
      question: "How do I know if my pool has a leak or if it is just normal evaporation?",
      answerSummary: "Perform the simple bucket test: float a bucket filled with pool water on your pool steps and mark both levels. If the pool water drops significantly faster than the water in the bucket, you have an active leak.",
    },
    {
      question: "Are saltwater pools completely chlorine-free?",
      answerSummary: "Salt pools actually use an electrolytic cell to convert dissolved pool salt into pure, gentle chlorine naturally, eliminating chemical odors and eye irritation while softening the water feel.",
    },
    {
      question: "How often should pool filter cartridges be cleaned or replaced?",
      answerSummary: "Cartridges should be chemically deep-cleaned every 3 to 6 months depending on bather load, and replaced every 2 to 3 years to maintain optimal water flow and filtration.",
    },
    {
      question: "Do you offer pool opening and winterization services?",
      answerSummary: "Yes, we remove safety covers, reinstall drain plugs, blow and antifreeze plumbing lines, test all equipment, and balance chemistry for spring openings and fall closures.",
    },
    {
      question: "How do you notify me that the weekly cleaning is done?",
      answerSummary: "Our technicians log chemistry readings (pH, free chlorine, alkalinity, stabilizer) into our app, snap a photo of your sparkling clean pool, and email you a digital service report instantly upon leaving.",
    },
    {
      question: "Can you remove white calcium buildup along the waterline tiles?",
      answerSummary: "Yes, we use specialized low-pressure glass bead and mineral blasting to safely erase stubborn white calcium scale from porcelain, ceramic, and glass tiles without scratching.",
    },
    {
      question: "Do you repair pool heaters and heat pumps?",
      answerSummary: "Yes, our certified technicians troubleshoot electrical ignition failures, heat exchangers, pressure switches, and gas valves on all major heater brands (Hayward, Pentair, Jandy).",
    },
  ],
  processSteps: [
    {
      step: 1,
      title: "Free On-Site Pool & Equipment Diagnostic",
      description: "We inspect your pool gallonage, circulation, pump motor, filter condition, and run a full 7-factor water lab test.",
    },
    {
      step: 2,
      title: "Custom Service Plan & Flat Monthly Rate",
      description: "You receive a clear monthly service agreement with all basic chemicals and routine basket clearing included.",
    },
    {
      step: 3,
      title: "Consistent Weekly Route Service",
      description: "Your assigned certified technician visits on your designated service day: skimming, brushing, vacuuming, and balancing chemistry.",
    },
    {
      step: 4,
      title: "Digital Report Sent to Your Phone",
      description: "You receive an automated email detailing chemical levels, tasks performed, and a time-stamped photo of your pristine, swim-ready pool.",
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
  recommendedThemes: ["fresh-natural", "clean-medical", "modern-pro"],
  recommendedPages: ["Home", "About", "Services", "Contact", "FAQ", "Service Areas", "Gallery", "Reviews"],
  imageQueries: {
    hero: [
      "crystal clear luxury swimming pool backyard patio sunny day",
      "pool service technician netting leaves water surface pole",
      "sparkling resort style swimming pool residential backyard",
    ],
    services: [
      "pool cleaning net pole skimming leaves sunny water",
      "pool water chemistry testing kit vials colored water",
      "pool pump filter equipment pad maintenance technician",
      "green to clean pool recovery algae removal before after",
      "saltwater pool chlorinator cell installation",
      "pool tile cleaning calcium removal hydro blasting",
    ],
    team: [
      "certified pool technician in uniform holding water test kit smiling",
      "pool maintenance crew with service truck and chemical equipment",
    ],
    work: [
      "sparkling blue swimming pool clean patio backyard lounge",
      "clean organized variable speed pool pump equipment pad",
      "luxury modern swimming pool with waterfall clean water",
    ],
  },
  keywordPatterns: [
    "{service} in {city}",
    "{service} near me",
    "pool service {city}",
    "pool cleaning company {city}",
    "weekly pool maintenance {city}",
    "green pool cleanup {city} {state}",
    "pool pump repair {city}",
    "best pool cleaner near me",
  ],
  toneNotes:
    "Refreshing, pristine, leisurely, and technically precise, turning backyard swimming pools into sparkling resort-style sanctuaries.",
  aliases: ["pool service", "pool cleaning", "pool maintenance", "swimming pool", "pool repair", "green pool"],
};

export default poolServiceNiche;
