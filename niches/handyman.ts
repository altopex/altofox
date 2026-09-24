import { NichePack } from "./types";

export const handymanNiche: NichePack = {
  id: "handyman",
  name: "Handyman Services",
  schemaType: "HomeAndConstructionBusiness",
  emergencyService: false,
  commonServices: [
    "Drywall Patching, Hole Repair & Texture Blending",
    "Interior & Exterior Door Hanging, Weatherstripping & Alignment",
    "Ceiling Fan, Chandelier & Light Fixture Replacement",
    "TV Wall Mounting & In-Wall Wire Concealment",
    "Kitchen Faucet, Garbage Disposal & Sink Repair",
    "Toilet Repair, Flapper & Fill Valve Replacement",
    "Fence Board, Gate Latch & Hinge Repairs",
    "Deck Board Replacement & Railing Reinforcement",
    "Furniture Assembly (IKEA, Wayfair & Custom)",
    "Kitchen Cabinet Hardware & Soft-Close Hinge Upgrades",
    "Bathtub, Shower & Backsplash Silicone Re-Caulking",
    "Senior Safety Grab Bar & Handrail Installation",
  ],
  customerPainPoints: [
    "Growing list of lingering home repairs with zero free time or specialized tools to fix them",
    "Unreliable handymen who give vague time windows and fail to show up",
    "Unskilled amateurs botching drywall patches, leaving unsightly lumpy textures",
    "Contractors refusing to quote small or mid-size home repair projects",
    "Astronomical hourly rates where slow workers pad the bill",
    "Uninsured workers causing property damage or risking personal injury in your home",
    "TV mounts falling from walls due to missing studs and improper anchor hardware",
    "Dust and plaster mess left behind on floors and furniture for homeowners to scrub",
  ],
  trustSignals: [
    "Multi-Skilled Master Craftsmen with 10+ Years Residential Experience",
    "Fully Insured with General Liability & Workers' Comp Coverage",
    "Clear, Upfront Flat-Rate Pricing by the Job (No Drawn-Out Hourly Games)",
    "100% Workmanship Guarantee on Every Single Task",
    "Punctual Arrival in Fully Outfitted Tool Vans Carrying Fasteners & Hardware",
    "Shoe Covers Worn & Drop Cloths Laid Down (Zero Mess Guarantee)",
    "'No Job Too Small' Friendly Neighborhood Policy",
    "Hundreds of 5-Star Reviews Across Google, Nextdoor & Yelp",
  ],
  faqTopics: [
    {
      question: "Do you charge by the hour or by the project?",
      answerSummary: "We quote upfront flat rates by the task whenever possible. You know the exact cost before work begins, regardless of how long the repair takes.",
    },
    {
      question: "What types of small home repair jobs do you handle?",
      answerSummary: "We tackle drywall holes, door adjustments, TV mounting, light fixture swaps, faucet replacements, caulking, fence repairs, and general to-do lists.",
    },
    {
      question: "Can I bundle multiple small repairs into a single half-day visit?",
      answerSummary: "Yes! Many homeowners create a 'honey-do' punch list. We can book a dedicated 4-hour or 8-hour block of craftsman time to knock out your entire list in one visit.",
    },
    {
      question: "Can you mount a TV onto brick, stone, or metal studs?",
      answerSummary: "Yes, our technicians carry specialized masonry tapcons and toggle bolts to safely anchor TVs of all screen sizes onto brick, stone, tile, and metal studs.",
    },
    {
      question: "Do you supply the materials or do I need to purchase them?",
      answerSummary: "We supply standard fasteners, drywall compound, shims, and caulking. For fixtures like faucets, light fixtures, or ceiling fans, you can purchase your preferred style or we can supply them.",
    },
    {
      question: "How do you match existing drywall texture?",
      answerSummary: "Our craftsmen are skilled in blending knockdown, orange peel, and smooth drywall finishes so repaired patches blend seamlessly into surrounding walls.",
    },
    {
      question: "Are your handymen background checked and insured?",
      answerSummary: "Yes, every craftsman undergoes comprehensive criminal background checks and our company carries full general liability and workers' compensation insurance.",
    },
    {
      question: "Can you install senior accessibility features like bathroom grab bars?",
      answerSummary: "Yes, we securely anchor ADA-compliant grab bars directly into wall studs in showers and restrooms, and install handrails and threshold ramps.",
    },
    {
      question: "What if a repair fails or needs adjustment after you leave?",
      answerSummary: "All our work is covered by our 1-year craftsmanship guarantee. If a door sticks or a hinge loosens, we return promptly to adjust it at zero charge.",
    },
    {
      question: "How soon can I get an appointment?",
      answerSummary: "We typically have technician availability within 24 to 48 hours, and often have same-day openings for urgent minor repairs.",
    },
  ],
  processSteps: [
    {
      step: 1,
      title: "Send Your To-Do List & Photos",
      description: "Submit your list of tasks and photos online or over the phone. We review your scope and provide a fast, clear estimate.",
    },
    {
      step: 2,
      title: "Punctual Craftsman Arrival",
      description: "Our uniformed technician arrives on time in a fully stocked service vehicle with shoe covers and protective drop cloths ready.",
    },
    {
      step: 3,
      title: "Efficient, Expert Execution",
      description: "We work systematically through your punch list using professional tools, precision levels, and commercial-grade fasteners.",
    },
    {
      step: 4,
      title: "Walkthrough & Task Sign-Off",
      description: "We inspect each completed item together, clean up all work areas thoroughly, and ensure you are 100% delighted before closing out.",
    },
  ],
  recommendedSections: [
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
  recommendedThemes: ["bold-trade", "modern-pro", "warm-friendly"],
  recommendedPages: ["Home", "About", "Services", "Contact", "FAQ", "Service Areas", "Reviews"],
  imageQueries: {
    hero: [
      "handyman with toolbelt fixing interior door in modern home",
      "friendly skilled craftsman holding cordless drill smiling",
      "handyman professional home repair living room",
    ],
    services: [
      "drywall patch repair with spatula compound wall",
      "tv wall mount installation level living room",
      "carpenter installing door lock deadbolt",
      "ceiling fan installation ladder ceiling",
      "furniture assembly tools parts living room floor",
      "caulking bathtub joint silicone sealant gun",
    ],
    team: [
      "handyman in uniform with tool bag smiling inside home",
      "professional handyman service technician with tool kit",
    ],
    work: [
      "flawlessly patched and painted drywall repair",
      "neatly mounted flat screen tv with hidden wires over fireplace",
      "repaired wooden fence gate swinging latch",
    ],
  },
  keywordPatterns: [
    "{service} in {city}",
    "{service} near me",
    "handyman service {city}",
    "local handyman near me",
    "home repair contractor {city}",
    "best handyman {city} {state}",
    "tv mounting service {city}",
    "drywall repair {city}",
  ],
  toneNotes:
    "Practical, resourceful, friendly, and dependable, tackling to-do lists efficiently with skilled craftsmanship and zero hidden fees.",
  aliases: ["handyman", "home repair", "to-do list", "drywall repair", "tv mounting", "punch list"],
};

export default handymanNiche;
