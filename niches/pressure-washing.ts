import { NichePack } from "./types";

export const pressureWashingNiche: NichePack = {
  id: "pressure-washing",
  name: "Pressure Washing & Exterior Cleaning",
  schemaType: "HomeAndConstructionBusiness",
  emergencyService: false,
  commonServices: [
    "Concrete Driveway & Sidewalk Pressure Washing",
    "Soft Wash House Washing (Vinyl, Stucco, Hardie & Brick)",
    "Non-Pressure Roof Cleaning & Dark Algae Streak Removal",
    "Deck, Fence & Wood Restoration & Sealing",
    "Patio, Paver & Natural Stone Deep Cleaning & Polymeric Sanding",
    "Gutter Face Cleaning & Downspout Brightening",
    "Commercial Storefront, Sidewalk & Dumpster Pad Cleaning",
    "Driveway Motor Oil Stain & Rust Removal",
    "Pool Deck, Coping & Screen Enclosure Cleaning",
    "Graffiti Removal & Exterior Surface Restoration",
    "HOA Violation Urgent Cleaning Blitz",
    "Solar Panel Efficiency Cleaning",
  ],
  customerPainPoints: [
    "Ugly black mold, green mildew, and algae streaks destroying home curb appeal",
    "Amateur high-pressure blasters etching concrete, denting vinyl siding, or killing flowers",
    "Threatening HOA violation letters giving tight deadlines to clean dirty siding or roofs",
    "Extremely slippery green slime on walkways creating dangerous fall hazards for family and guests",
    "Deeply embedded automotive oil and fluid stains that garden hoses cannot budge",
    "Fears of water forced behind vinyl siding or under roof shingles causing interior rot",
    "Wasted weekends and frustration trying to use underpowered consumer pressure washers",
    "Black streaks on asphalt shingles lowering property appraised value before a home sale",
  ],
  trustSignals: [
    "Licensed & Fully Insured ($1M Exterior Cleaning Liability Coverage)",
    "Dedicated Low-Pressure Soft-Wash Equipment (Zero Damage Guarantee)",
    "Eco-Friendly, Plant-Safe & Pet-Safe Biodegradable Solutions",
    "100% Curb Appeal Satisfaction Guarantee",
    "Commercial 8-GPM Hot Water Units & Rotary Surface Cleaners (No Wand Streaks)",
    "Landscape Pre-Rinse & Plant Protection Guarantee",
    "Fast Instant Quotes via Satellite Property Imagery",
    "Hundreds of 5-Star Reviews Across Local Neighborhood Forums",
  ],
  faqTopics: [
    {
      question: "What is the difference between pressure washing and soft washing?",
      answerSummary: "Pressure washing uses high PSI for hard surfaces like concrete. Soft washing uses low pressure combined with specialized biodegradable detergents to clean siding, roofs, and painted surfaces safely without damage.",
    },
    {
      question: "Will pressure washing damage my flowers and lawn?",
      answerSummary: "No. We thoroughly saturate all adjacent plants and grass with fresh water before, during, and after cleaning, and apply protective plant-wash neutralizers so your landscaping stays lush and green.",
    },
    {
      question: "What causes the dark black streaks on asphalt roof shingles?",
      answerSummary: "The streaks are Gloeocapsa Magma, an aggressive algae that feeds on the limestone filler in shingles. Our gentle soft-wash chemical treatment kills the algae at the root without stripping granules.",
    },
    {
      question: "How do you avoid leaving zebra stripes or wand lines on concrete driveways?",
      answerSummary: "We use commercial 20-inch rotary surface cleaners that hover evenly over concrete with dual rotating nozzles, delivering an immaculate, uniform finish without wand lines.",
    },
    {
      question: "Can you completely remove old oil stains from my driveway?",
      answerSummary: "We use professional-grade degreasers and 200°F hot water extraction to lift oil. While very old, weathered stains may leave a faint shadow, we achieve dramatic 85-95% visual improvement.",
    },
    {
      question: "How often should a house exterior be washed?",
      answerSummary: "In most humid climates, an annual house wash keeps mold, mildew, and airborne grime from embedding into siding and preserves exterior paint warranties.",
    },
    {
      question: "Do you need access to an exterior water spigot?",
      answerSummary: "Yes, we connect to a standard exterior water faucet. If you are on a low-yield well or have limited water, we can bring our own dedicated buffer water tanks.",
    },
    {
      question: "Do I need to be home while you wash the exterior?",
      answerSummary: "No, as long as all windows and doors are shut tight, gates unlocked, and pets inside, our professional team can complete the work and leave your property sparkling.",
    },
    {
      question: "Can pressure washing help resolve an HOA notice?",
      answerSummary: "Yes! We specialize in fast-turnaround HOA compliance cleanings, providing prompt before-and-after photos you can submit immediately to your HOA committee.",
    },
    {
      question: "Do you clean gutters and gutter exteriors?",
      answerSummary: "Yes, we remove internal debris from gutters and downspouts, and use specialized gutter brightening detergents to remove electrostatic black streaks ('tiger stripes') from the outside faces.",
    },
  ],
  processSteps: [
    {
      step: 1,
      title: "Property Walkthrough & Plant Pre-Wetting",
      description: "We inspect all surfaces, tape off outdoor electrical outlets, and thoroughly pre-soak sensitive garden beds and shrubbery with fresh water.",
    },
    {
      step: 2,
      title: "Biodegradable Detergent Application",
      description: "We apply eco-friendly algaecides and surfactants using gentle soft-wash pressure, allowing the formula to dwell and neutralize mold spores at the root.",
    },
    {
      step: 3,
      title: "Balanced Surface Cleaning & Low-Pressure Rinse",
      description: "We utilize rotary surface cleaners for driveways and wide low-pressure fan rinses for siding and eaves, washing away years of dirt and grime.",
    },
    {
      step: 4,
      title: "Final Landscape Rinse & Inspection",
      description: "We perform a comprehensive post-rinse of all plants and windows, walk the property with you, and verify flawless curb appeal.",
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
  recommendedThemes: ["bold-trade", "fresh-natural", "modern-pro"],
  recommendedPages: ["Home", "About", "Services", "Contact", "FAQ", "Service Areas", "Gallery", "Reviews"],
  imageQueries: {
    hero: [
      "pressure washing concrete driveway clean line before after",
      "technician power washing stone patio with surface cleaner",
      "soft wash house washing clean vinyl siding home",
    ],
    services: [
      "pressure washing concrete surface cleaner driveway",
      "soft wash house washing exterior wall siding",
      "roof cleaning black algae removal soft washing",
      "wood deck pressure washing restoration",
      "commercial pressure washing retail storefront",
      "paver patio cleaning and pressure washing stone",
    ],
    team: [
      "pressure washing technician in boots smiling with wand",
      "exterior cleaning company truck and commercial trailer setup",
    ],
    work: [
      "before after clean bright concrete driveway pressure washed",
      "gleaming clean vinyl siding residential home sunny",
      "restored golden wooden deck patio backyard",
    ],
  },
  keywordPatterns: [
    "{service} in {city}",
    "{service} near me",
    "pressure washing {city}",
    "power washing company {city}",
    "house washing {city}",
    "roof cleaning {city} {state}",
    "driveway cleaning {city}",
    "best exterior cleaning {city}",
  ],
  toneNotes:
    "Transformational, visual, energetic, and property-protective, highlighting striking before-and-after contrasts, curb appeal, and soft-wash safety.",
  aliases: ["pressure washing", "power washing", "soft washing", "roof cleaning", "driveway cleaning", "exterior cleaning"],
};

export default pressureWashingNiche;
