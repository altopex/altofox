import { NichePack } from "./types";

export const treeServiceNiche: NichePack = {
  id: "tree-service",
  name: "Tree Service & Arborist",
  schemaType: "HomeAndConstructionBusiness",
  emergencyService: true,
  commonServices: [
    "24/7 Emergency Fallen Tree Removal",
    "Hazardous & Large Tree Felling",
    "Crane-Assisted Precision Tree Removal",
    "Crown Thinning, Elevating & Tree Trimming",
    "Deadwooding & Structural Pruning",
    "Stump Grinding & Root Ball Removal",
    "Tree Health Diagnostics, Oak Wilt & Pest Treatment",
    "Cabling & Bracing Structural Support",
    "Storm Damage Clearing & Debris Hauling",
    "Lot Clearing & Land Preparation",
    "Deep Root Fertilization & Soil Aeration",
    "Commercial Grounds Tree Maintenance",
  ],
  customerPainPoints: [
    "Massive dead tree limbs hanging precariously over rooflines, bedrooms, or power lines",
    "Storm-felled trees crushing fences, smashing driveways, or blocking road access",
    "Diseased or hollowed tree trunks on the verge of sudden, catastrophic collapse",
    "Aggressive surface roots cracking concrete foundations, sidewalks, and sewer lines",
    "Overgrown canopies blocking sunlight from lawns and scraping against house siding",
    "Fear of unqualified tree cutters dropping heavy trunks onto roofs and destroying property",
    "Unsightly tree stumps attracting termites, carpenter ants, and creating tripping hazards",
    "Uninsured fly-by-night tree services leaving homeowners liable for worker accidents",
  ],
  trustSignals: [
    "ISA Certified Arborists on Staff (International Society of Arboriculture)",
    "Fully Insured with $2M General Liability & Workers' Compensation",
    "Heavy-Duty Fleet of 50-Ton Cranes, Bucket Trucks & Commercial Chippers",
    "24/7 Emergency Storm Response Crews with Rapid Dispatch",
    "100% Zero Property Damage Guarantee",
    "Upfront Written Estimates with Guaranteed Fixed Pricing",
    "Complete Rake & Clean-Up Guarantee (No Wood Chips or Debris Left Behind)",
    "Over 20+ Years Caring for Local Urban Forests & Residential Properties",
  ],
  faqTopics: [
    {
      question: "How do I know if a tree needs to be removed or just trimmed?",
      answerSummary: "Our certified arborists examine trunk integrity, root stability, signs of rot or fungal growth, and structural lean. If more than 50% of the tree is damaged or poses hazard to structures, removal is typically safest.",
    },
    {
      question: "Are you fully insured for large tree removals?",
      answerSummary: "Yes, we carry $2,000,000 in general liability insurance and full workers' compensation coverage to protect your home and our crew completely.",
    },
    {
      question: "How do you remove large trees without damaging my lawn or roof?",
      answerSummary: "We utilize specialized rigging systems, ground-protection mats, bucket trucks, and 50-ton cranes to dismantle trees section by section and lower limbs with pinpoint precision.",
    },
    {
      question: "What is the best time of year to trim trees?",
      answerSummary: "Late winter and early spring dormancy are ideal for most species, especially oaks to prevent oak wilt disease. However, dead, diseased, or hazardous branches can and should be pruned any time.",
    },
    {
      question: "How deep do you grind tree stumps?",
      answerSummary: "We grind stumps 6 to 12 inches below grade, pulverizing the main root flare so you can smoothly plant grass, install pavers, or plant a new tree in its place.",
    },
    {
      question: "Can an infected or sick tree be saved?",
      answerSummary: "Often yes. If caught early, fungal infections, insect infestations (like borers), and nutritional deficiencies can be treated with trunk injections and deep-root fertilization.",
    },
    {
      question: "Will you remove all the wood and branches after the job?",
      answerSummary: "Yes, we chip all brush on site, haul away heavy logs, and thoroughly rake and blow the yard clean. Upon request, we can also cut logs into firewood for you.",
    },
    {
      question: "What should I do if a tree falls on my house or power lines?",
      answerSummary: "Evacuate the area immediately, stay at least 30 feet away from downed lines, call your local utility company, and contact our 24/7 emergency storm dispatch line.",
    },
    {
      question: "Do you offer free estimates for tree work?",
      answerSummary: "Yes, an ISA Certified Arborist will visit your property, evaluate your trees, and provide a detailed written proposal at no cost.",
    },
    {
      question: "Does homeowner's insurance cover fallen tree removal?",
      answerSummary: "If a tree falls on an insured structure like your house, garage, or fence due to a storm, insurance typically covers removal and structural repairs.",
    },
  ],
  processSteps: [
    {
      step: 1,
      title: "On-Site Arborist Evaluation",
      description: "An ISA Certified Arborist visits your property to evaluate tree health, drop zones, target hazards, and safety rigging needs.",
    },
    {
      step: 2,
      title: "Clear Safety Plan & Upfront Quote",
      description: "You receive a fixed, itemized proposal detailing the exact cuts, equipment used, and debris haul-away terms.",
    },
    {
      step: 3,
      title: "Rigged Felling & Precision Pruning",
      description: "Our skilled tree climbers and crane operators systematically dismantle limbs using ropes and pulleys, avoiding lawns and structures.",
    },
    {
      step: 4,
      title: "Full Yard Clean-Up & Chipping",
      description: "We chip all branches, grind stumps upon request, rake up every twig, and leave your property immaculate.",
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
    "gallery",
    "serviceAreas",
    "testimonials",
    "faq",
    "ctaBanner",
    "contactForm",
  ],
  recommendedThemes: ["fresh-natural", "bold-trade"],
  recommendedPages: ["Home", "About", "Services", "Contact", "FAQ", "Service Areas", "Gallery", "Reviews"],
  imageQueries: {
    hero: [
      "certified arborist climbing tall tree with chainsaw safety gear",
      "crane assisted tree removal residential backyard",
      "tree service crew trimming high branches in bucket truck",
    ],
    services: [
      "precision tree trimming worker bucket truck",
      "heavy commercial stump grinder machine yard",
      "crane lifting large tree trunk over residential house",
      "emergency storm tree removal fallen branch",
      "certified arborist inspecting tree trunk disease",
      "wood chipper blowing mulch tree service",
    ],
    team: [
      "arborist team in helmets and safety harnesses smiling",
      "tree care specialist holding chainsaw by service truck",
    ],
    work: [
      "beautifully pruned mature oak tree green lawn",
      "clean yard after hazardous tree removal crane",
      "cleared backyard after stump grinding and grass seeding",
    ],
  },
  keywordPatterns: [
    "{service} in {city}",
    "{service} near me",
    "emergency tree removal {city}",
    "tree trimming {city}",
    "stump grinding {city}",
    "certified arborist {city} {state}",
    "best tree service {city}",
    "crane tree removal {city}",
  ],
  toneNotes:
    "Safety-obsessed, environmental, authoritative, and fast-acting, highlighting ISA arborist credentials, heavy crane rigging safety, and spotless yard cleanups.",
  aliases: ["tree service", "arborist", "tree removal", "tree trimming", "stump grinding", "tree care"],
};

export default treeServiceNiche;
