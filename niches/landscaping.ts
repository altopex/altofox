import { NichePack } from "./types";

export const landscapingNiche: NichePack = {
  id: "landscaping",
  name: "Landscaping & Lawn Care",
  schemaType: "HomeAndConstructionBusiness",
  emergencyService: false,
  commonServices: [
    "Weekly & Bi-Weekly Lawn Mowing & Edging",
    "Custom Landscape Design & 3D Architectural Renderings",
    "Hardscaping (Paver Patios, Walkways & Retaining Walls)",
    "Sod Installation & Complete Lawn Renovation",
    "Mulch, Topsoil & River Rock Installation",
    "Sprinkler System Installation & Smart Irrigation Repair",
    "Outdoor Living Spaces, Fire Pits & Pergolas",
    "Spring & Fall Seasonal Yard Clean-Up & Leaf Removal",
    "Shrub, Bush & Ornamental Tree Pruning",
    "Weed Control & Organic Lawn Fertilization Programs",
    "Yard Drainage Systems & French Drain Installation",
    "Commercial Grounds & HOA Landscape Maintenance",
  ],
  customerPainPoints: [
    "Unreliable lawn mowing crews who miss scheduled days without notice",
    "Patchy, yellowing, weed-choked turf that looks unkempt and dead",
    "Poor yard grading and drainage causing standing water pools and mosquito breeding",
    "Overgrown, tangled flower beds and hedges choking out desirable plants",
    "Careless workers scalping lawns and damaging sprinkler heads with heavy mowers",
    "Lack of professional landscape design vision to create functional outdoor living space",
    "Extravagant water bills caused by cracked irrigation pipes or misaligned spray heads",
    "Muddy erosion along hillsides washing away mulch during heavy rains",
  ],
  trustSignals: [
    "Licensed Landscape Contractor & Certified Irrigation Backflow Technicians",
    "Fully Insured with $2M General Liability & Workers' Comp Coverage",
    "Reliable Same-Day Weekly Route Scheduling with Weather Tracking",
    "Commercial-Grade Mowers with Freshly Sharpened Blades for Clean Turf Cuts",
    "1-Year Written Guarantee on All Plantings & Hardscape Installations",
    "Free On-Site Design Consultations with 3D Visual Walkthroughs",
    "Transparent Flat Monthly Billing Options with Zero Contracts",
    "Eco-Friendly Organic Fertilization & Water-Conserving Drip Irrigation Options",
  ],
  faqTopics: [
    {
      question: "How often should my lawn be mowed?",
      answerSummary: "During peak growing season (spring and summer), weekly mowing is ideal to avoid cutting more than one-third of the grass blade at once, which keeps turf healthy and dense.",
    },
    {
      question: "How long does new sod take to take root?",
      answerSummary: "New sod typically establishes shallow roots within 10 to 14 days and deep roots within 3 to 4 weeks with proper daily irrigation scheduling.",
    },
    {
      question: "Can you fix standing water and drainage issues in my yard?",
      answerSummary: "Yes, we design and install French drains, catch basins, swales, and dry creek beds to channel storm runoff away from your home's foundation and lawn.",
    },
    {
      question: "What type of mulch is best for flower beds?",
      answerSummary: "Hardwood bark mulch, cedar mulch, and pine bark are excellent for moisture retention and weed suppression, breaking down organically over time to enrich your soil.",
    },
    {
      question: "Do you offer smart sprinkler controller upgrades?",
      answerSummary: "Yes, we install Wi-Fi enabled smart controllers (like Rachio or Hunter Hydrawise) that automatically adjust watering schedules based on local satellite weather forecasts.",
    },
    {
      question: "What hardscaping materials do you recommend for patios?",
      answerSummary: "Interlocking concrete pavers, natural flagstone, and porcelain pavers provide stunning durability, slip resistance, and easy maintenance compared to poured concrete.",
    },
    {
      question: "How do your seasonal clean-up services work?",
      answerSummary: "Our spring clean-up prepares garden beds, trims winter kill, and applies fresh mulch. In autumn, our leaf vacuuming and perennial cutback services protect your turf before frost.",
    },
    {
      question: "Do you provide customized 3D landscape design plans?",
      answerSummary: "Yes, our landscape designers create full-color 3D architectural mockups so you can visualize plants, patios, outdoor lighting, and fire features before installation begins.",
    },
    {
      question: "Are your lawn fertilization treatments pet and child safe?",
      answerSummary: "Yes, our organic-based fertilizers and targeted weed treatments are pet-safe once dry (typically 1 to 2 hours after application).",
    },
    {
      question: "Do I have to sign a long-term contract for weekly lawn care?",
      answerSummary: "No, we offer flexible month-to-month service agreements with convenient automated billing and no cancellation penalties.",
    },
  ],
  processSteps: [
    {
      step: 1,
      title: "On-Site Consultation & Yard Assessment",
      description: "We walk your grounds with you, assess soil condition, sunlight exposure, drainage, and discuss your lifestyle goals.",
    },
    {
      step: 2,
      title: "Custom 3D Design & Detailed Proposal",
      description: "You receive visual 3D design renderings and an itemized fixed-price proposal detailing plant species, materials, and schedules.",
    },
    {
      step: 3,
      title: "Master Installation & Hardscape Construction",
      description: "Our dedicated landscape crew executes soil preparation, grading, stone laying, and specimen planting with meticulous care.",
    },
    {
      step: 4,
      title: "Final Walkthrough & Seasonal Maintenance",
      description: "We inspect all irrigation zones and plants together, provide a care guide, and transition to our seamless ongoing lawn care plan.",
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
  recommendedThemes: ["fresh-natural", "modern-pro"],
  recommendedPages: ["Home", "About", "Services", "Contact", "FAQ", "Service Areas", "Gallery", "Reviews"],
  imageQueries: {
    hero: [
      "lush green manicured lawn residential luxury home",
      "modern paver patio and outdoor landscape design sunny day",
      "landscape design front yard flower beds green grass",
    ],
    services: [
      "commercial zero turn lawn mower cutting green lawn striping",
      "paver patio stone installation backyard landscape",
      "fresh sod grass roll installation lawn renovation",
      "sprinkler system watering lush green lawn sunset",
      "landscaper planting shrubs flower bed dark mulch",
      "retaining wall stone block construction hill",
    ],
    team: [
      "landscaping crew in uniform smiling in front of work truck",
      "landscape designer reviewing blueprints in backyard garden",
    ],
    work: [
      "completed luxury backyard paver patio with fire pit",
      "perfect striped manicured front lawn residential",
      "outdoor living lighting walkway landscape garden",
    ],
  },
  keywordPatterns: [
    "{service} in {city}",
    "{service} near me",
    "lawn care service {city}",
    "landscaping company {city}",
    "paver patio installation {city}",
    "sprinkler repair {city} {state}",
    "best landscaper {city}",
    "sod installation {city}",
  ],
  toneNotes:
    "Artistic, dependable, earthy, and pride-of-ownership focused, celebrating curb appeal, outdoor living spaces, and lush manicured grounds.",
  aliases: ["landscaping", "lawn care", "lawn mowing", "hardscaping", "irrigation", "sod installation"],
};

export default landscapingNiche;
