import { NichePack } from "./types";

export const pestControlNiche: NichePack = {
  id: "pest-control",
  name: "Pest Control & Extermination",
  schemaType: "HomeAndConstructionBusiness",
  emergencyService: true,
  commonServices: [
    "Emergency Wasp, Hornet & Yellow Jacket Removal",
    "Termite Inspection, Baiting & Liquid Barrier Defense",
    "Rodent (Mice & Rat) Exclusion, Trapping & Sanitization",
    "Bed Bug Heat Treatment & Guaranteed Eradication",
    "German & American Cockroach Clean-Out",
    "Yard Mosquito Fogging & Larvicide Defense Barrier",
    "Ant Control (Carpenter, Fire, Sugar & Odorous Ants)",
    "Spider & Venomous Pest Exclusion (Brown Recluse, Black Widow)",
    "Flea & Tick Home Interior & Yard Eradication",
    "Humane Wildlife Removal & Relocation (Raccoons, Squirrels)",
    "Quarterly Exterior Perimeter Pest Shield",
    "Commercial Pest Control & Health Code Compliance",
  ],
  customerPainPoints: [
    "Creepy crawlers, roaches, and rodents invading living spaces and kitchens",
    "Subterranean termites silently devouring structural wood and framing undetected",
    "Rats and mice chewing through electrical wiring, creating severe fire risks",
    "Terrifying wasp or hornet nests menacing children and pets in the yard",
    "Bed bug bites causing sleepless nights, severe anxiety, and social embarrassment",
    "Pests returning within weeks because store-bought sprays only kill visible bugs",
    "Legitimate fears of toxic, foul-smelling chemicals harming pets or toddlers",
    "Pest companies locking homeowners into rigid, expensive multi-year contracts",
  ],
  trustSignals: [
    "State-Licensed Structural Pest Control Applicators",
    "Eco-Friendly, Pet-Safe & Family-Friendly Botanical Solutions",
    "100% Pest-Free Money-Back Re-Treatment Guarantee",
    "Comprehensive Free On-Site Termite & Rodent Inspections",
    "Fully Insured & Bonded Pest Control Specialists ($2M Coverage)",
    "Discreet Unmarked Service Trucks Available Upon Request",
    "Advanced Thermal Imaging & Moisture Detection for Hidden Infestations",
    "Over 15+ Years Serving Local Homes and Commercial Kitchens",
  ],
  faqTopics: [
    {
      question: "Are your pest control treatments safe for dogs and cats?",
      answerSummary: "Yes, our primary interior and exterior formulas are EPA-registered, botanical-derived, and specifically engineered to target insect biology without posing danger to pets once dry.",
    },
    {
      question: "How long does it take to get rid of a bed bug infestation?",
      answerSummary: "Our single-day whole-home heat treatment eradicates all stages of bed bugs (including eggs) in just 6 to 8 hours without requiring you to throw out expensive mattresses or furniture.",
    },
    {
      question: "How do you keep rodents from coming back into my attic?",
      answerSummary: "We perform full structural exclusion: sealing every exterior gap, pipe opening, and roofline penetration with copper mesh and galvanized steel so rodents cannot re-enter.",
    },
    {
      question: "What are the early warning signs of termites?",
      answerSummary: "Look for mud tubes along foundation walls, discarded insect wings on windowsills in spring, hollow-sounding wood, and peeling paint that resembles water damage.",
    },
    {
      question: "How often should my home receive perimeter pest treatments?",
      answerSummary: "A quarterly exterior barrier treatment (every 90 days) establishes an unbroken protective shield that prevents bugs from ever crossing your threshold.",
    },
    {
      question: "Do I have to leave the house during a standard pest treatment?",
      answerSummary: "For standard general pest prevention, you do not need to leave. For specialized flea or heavy cockroach clean-outs, we may recommend leaving for 2 to 3 hours until sprays dry completely.",
    },
    {
      question: "What should I do if pests return between scheduled quarterly visits?",
      answerSummary: "Call us right away! Under our Pest-Free Guarantee, we dispatch a technician to perform targeted re-treatments at zero extra charge to you.",
    },
    {
      question: "Can mosquito yard treatments withstand summer rainstorms?",
      answerSummary: "Yes, our micro-encapsulated yard barrier bonds to the underside of plant foliage and withstands normal rainfall for 21 to 30 days.",
    },
    {
      question: "How do you humanely remove wildlife like raccoons or squirrels?",
      answerSummary: "We use humane one-way exclusion doors and live catch-and-release traps, followed by comprehensive attic sanitization and entry-point reinforcement.",
    },
    {
      question: "Do you offer free pest inspections?",
      answerSummary: "Yes, we provide free comprehensive residential inspections for termites, rodents, and severe infestations with a written quote and action plan.",
    },
  ],
  processSteps: [
    {
      step: 1,
      title: "Detailed Inspection & Entry-Point Mapping",
      description: "Our certified exterminator conducts a thorough interior and exterior inspection, locating nesting harborage, moisture sources, and entry holes.",
    },
    {
      step: 2,
      title: "Targeted Precision Eradication",
      description: "We apply family-safe, targeted micro-encapsulated treatments to cracks, voids, and nesting zones to eliminate active infestations at the root.",
    },
    {
      step: 3,
      title: "Exclusion Sealing & Yard Barrier Defense",
      description: "We seal critical entry points around pipes and vents, sweep down spiderwebs, and lay down a 10-foot perimeter barrier around your foundation.",
    },
    {
      step: 4,
      title: "Free Re-Treatment & Year-Round Guarantee",
      description: "We monitor results. If pests dare to reappear between scheduled visits, we return immediately to re-treat your property free of charge.",
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
  recommendedThemes: ["fresh-natural", "bold-trade"],
  recommendedPages: ["Home", "About", "Services", "Contact", "FAQ", "Service Areas", "Reviews"],
  imageQueries: {
    hero: [
      "pest control technician spraying perimeter of residential house",
      "certified exterminator inspecting home exterior with flashlight",
      "pest control technician in protective gear service truck",
    ],
    services: [
      "termite inspection wood beam flashlight",
      "rodent exclusion sealing hole attic roofline",
      "wasp hornet nest removal protective suit",
      "mosquito yard barrier fogging spray backyard",
      "cockroach pest control bait gel kitchen",
      "bed bug heat treatment equipment residential bedroom",
    ],
    team: [
      "pest control technician in clean uniform smiling",
      "licensed exterminator with pest inspection equipment by service vehicle",
    ],
    work: [
      "sealed clean foundation pest exclusion screen",
      "termite bait station green grass lawn",
      "pest free clean modern patio backyard sunny day",
    ],
  },
  keywordPatterns: [
    "{service} in {city}",
    "{service} near me",
    "emergency pest control {city}",
    "exterminator {city}",
    "termite inspection {city}",
    "rodent removal {city} {state}",
    "best pest control company {city}",
    "mosquito control service {city}",
  ],
  toneNotes:
    "Decisive, protective, reassuring, and science-backed, emphasizing total nest eradication, non-toxic family safety, and free re-treatment guarantees.",
  aliases: ["pest control", "exterminator", "termite control", "rodent control", "bed bug removal", "mosquito control"],
};

export default pestControlNiche;
