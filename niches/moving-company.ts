import { NichePack } from "./types";

export const movingCompanyNiche: NichePack = {
  id: "moving-company",
  name: "Moving Company",
  schemaType: "MovingCompany",
  emergencyService: false,
  commonServices: [
    "Local Residential Home & Apartment Moving",
    "Long-Distance & Interstate Direct Relocation",
    "Commercial Office & Business Corporate Moving",
    "Full-Service Professional Packing & Unpacking",
    "Heavy & Specialty Item Moving (Pianos, Safes, Gun Safes)",
    "Senior Downsizing & Assisted Living Relocation",
    "College Dorm & Student Moving Services",
    "Secure Short-Term & Long-Term Climate Storage",
    "Furniture Disassembly, Padding & Precision Reassembly",
    "Labor-Only Loading & Unloading (Rental Trucks & PODS)",
    "Complete Moving Supplies Delivery (Heavy Boxes, Tape, Bubble)",
    "White-Glove Antique & High-Value Fine Art Crating",
  ],
  customerPainPoints: [
    "Dishonest movers tacking on surprise fuel surcharges, stair fees, and heavy item extras at delivery",
    "Careless movers chipping drywall, scuffing hardwood floors, and dropping heirloom furniture",
    "Movers showing up hours late or cancelling on the exact day of real estate closing",
    "Items lost, stolen, or damaged during transit with zero insurance accountability",
    "Rude, untrained day-labor crews with no formal moving or packing experience",
    "Exhaustion, severe back pain, and stress from attempting DIY truck rentals",
    "Bulky furniture getting wedged or stuck in narrow stairwells and tight hallways",
    "Predatory hostage load tactics where unscrupulous movers demand cash before opening the truck",
  ],
  trustSignals: [
    "Federally Licensed (USDOT & FMCSA Registered) & State Moving Authority Compliant",
    "Fully Insured with Comprehensive Full-Value Cargo Protection Options",
    "Guaranteed Binding Flat-Rate Quotes or Transparent Fixed Hourly Rates (Zero Hidden Fees)",
    "100% Full-Time, Background-Checked, Uniformed & Trained Professional Movers",
    "Padded Floor Runners, Door Jamb Protectors & Quilted Blankets on Every Move",
    "Modern Fleet of Air-Ride Suspension Moving Trucks with Clean Equipment",
    "Zero-Surprise Guarantee (No Extra Charges for Stairs, Elevators, or Shrinkwrap)",
    "A+ Rating with the BBB & Hundreds of 5-Star Reviews from Local Families",
  ],
  faqTopics: [
    {
      question: "How do you calculate the cost of a local move?",
      answerSummary: "Local moves are priced transparently based on the crew size (number of movers and trucks) and total elapsed time, or as an upfront guaranteed binding flat rate based on an itemized inventory.",
    },
    {
      question: "Are my belongings insured during transit?",
      answerSummary: "Yes, standard basic carrier liability is included at no extra charge, and we offer comprehensive Full Value Protection (FVP) policies that repair, replace, or pay cash value for any damaged item.",
    },
    {
      question: "Do you provide moving boxes and packing supplies?",
      answerSummary: "Yes, we provide heavy-duty corrugated boxes, wardrobe boxes with hanging bars, bubble wrap, dish pack kits, and stretch film. We can deliver supplies in advance or pack everything for you.",
    },
    {
      question: "How do you protect my home's floors and walls during moving day?",
      answerSummary: "Our crew installs heavy neoprene floor runners over hardwood and tile, carpet shield plastic, padded door jamb protectors, and banister padding before moving a single piece of furniture.",
    },
    {
      question: "Can you move heavy pianos, safes, or pool tables?",
      answerSummary: "Yes, our specialized heavy-item team utilizes heavy-duty dollies, piano boards, custom hoisting straps, and ramps to move grand pianos and heavy gun safes safely.",
    },
    {
      question: "Will the movers disassemble and reassemble beds and tables?",
      answerSummary: "Yes! Disassembly of standard bed frames, dining tables, and large sectional sofas—and their complete reassembly in your new home—is included in our standard moving service.",
    },
    {
      question: "How far in advance should I schedule my move?",
      answerSummary: "We recommend booking 2 to 4 weeks in advance, especially for weekend moves or dates near the beginning or end of the month, though we often accommodate short-notice moves.",
    },
    {
      question: "Are your movers full-time employees or temporary day labor?",
      answerSummary: "All our movers are 100% full-time, background-checked, drug-tested employees trained extensively in safe lifting mechanics, packing, and white-glove customer care.",
    },
    {
      question: "What items can you not transport on the moving truck?",
      answerSummary: "Due to federal and safety regulations, we cannot transport hazardous materials such as propane tanks, gasoline, fireworks, firearms, chemicals, or perishable open foods.",
    },
    {
      question: "What happens if it rains or snows on my scheduled moving day?",
      answerSummary: "We move in all weather conditions! We lay down extra protective floor coverings and use waterproof shrink wrap and heavy quilted moving blankets to ensure everything stays dry.",
    },
  ],
  processSteps: [
    {
      step: 1,
      title: "Free In-Home or Virtual Inventory Quote",
      description: "We review your home inventory item by item and provide a guaranteed, binding flat-rate estimate with all supplies and services included.",
    },
    {
      step: 2,
      title: "Protective Home Prep & Pad Wrapping",
      description: "Our uniformed team protects floors and doorways, blankets and stretch-wraps all furniture, and packs fragile items with care.",
    },
    {
      step: 3,
      title: "Secure Air-Ride Transport with GPS Tracking",
      description: "We load the moving truck with balanced weight distribution and transport your goods directly to your new destination with real-time updates.",
    },
    {
      step: 4,
      title: "Room-by-Room Placement & Reassembly",
      description: "We place each piece of furniture and labeled box in its designated room, reassemble bed frames, and conduct a final walkthrough with you.",
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
  recommendedThemes: ["modern-pro", "bold-trade", "warm-friendly"],
  recommendedPages: ["Home", "About", "Services", "Contact", "FAQ", "Service Areas", "Reviews"],
  imageQueries: {
    hero: [
      "professional movers carrying sofa into modern home living room",
      "smiling movers loading boxes into clean moving truck",
      "moving company crew carrying furniture into new home",
    ],
    services: [
      "movers wrapping wooden furniture with padded moving blankets",
      "packing kitchen glassware fragile dishes boxes bubble wrap",
      "piano moving specialists moving grand piano straps",
      "commercial office moving computers desks crates",
      "secure climate controlled storage warehouse facility",
      "furniture assembly movers bedroom bed frame",
    ],
    team: [
      "friendly professional moving crew in uniform by clean moving truck",
      "professional mover carrying moving box smiling",
    ],
    work: [
      "neatly organized loaded commercial moving truck interior",
      "protected hallway with padded floor runners on moving day",
      "happy family smiling in new living room with unpacked furniture",
    ],
  },
  keywordPatterns: [
    "{service} in {city}",
    "{service} near me",
    "movers {city}",
    "local moving company {city}",
    "long distance movers {city}",
    "office movers {city} {state}",
    "best moving companies {city}",
    "affordable movers near me",
  ],
  toneNotes:
    "Stress-relieving, dependable, gentle, and transparent, taking the physical and mental anxiety out of relocation day with white-glove care.",
  aliases: ["moving company", "movers", "relocation", "local movers", "long distance movers", "packing service"],
};

export default movingCompanyNiche;
