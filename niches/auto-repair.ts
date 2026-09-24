import { NichePack } from "./types";

export const autoRepairNiche: NichePack = {
  id: "auto-repair",
  name: "Auto Repair & Mechanic",
  schemaType: "AutoRepair",
  emergencyService: false,
  commonServices: [
    "Check Engine Light Diagnostics & Computer Scanning",
    "Brake Pad, Rotor & Caliper Replacement",
    "Oil Change, Filter & Multi-Point Vehicle Inspection",
    "Engine Diagnostics, Timing Belt & Head Gasket Repair",
    "Transmission Repair, Fluid Flush & Clutch Service",
    "Suspension, Shocks, Struts & 4-Wheel Alignment",
    "Auto Air Conditioning & Heating Climate Repair",
    "Car Battery Testing, Alternator & Starter Replacement",
    "Cooling System, Radiator & Water Pump Repair",
    "Tire Mounting, Balancing, Rotation & Flat Repair",
    "Pre-Purchase Used Vehicle Inspection with Full Report",
    "Muffler, Catalytic Converter & Exhaust System Repair",
  ],
  customerPainPoints: [
    "Fear of dishonest mechanics inventing unnecessary repairs to inflate bills",
    "Shockingly expensive final invoices with work completed without prior authorization",
    "Vehicles breaking down again days after paying for expensive garage visits",
    "Inconvenience of being stranded without a vehicle or having to pay for rideshares",
    "Confusion caused by aggressive technical jargon and pushy sales tactics",
    "Inexperienced lube technicians stripping oil pan drain plugs or using wrong fluids",
    "Cheap aftermarket parts failing prematurely and voiding vehicle warranties",
    "Squealing, grinding brakes creating anxiety over highway passenger safety",
  ],
  trustSignals: [
    "ASE-Certified Master Technicians (Automotive Service Excellence)",
    "Nationwide 24-Month / 24,000-Mile Parts & Labor Warranty",
    "Digital Vehicle Inspections (DVI) with Clear Photos & Videos Sent to Your Phone",
    "Upfront Itemized Estimates (Zero Work Performed Without Your Prior Approval)",
    "Free Local Customer Shuttle & Comfortable Waiting Lounge with High-Speed Wi-Fi",
    "State-of-the-Art Factory Diagnostic Scan Tools for All Domestic, Asian & European Vehicles",
    "Over 20+ Years Serving Local Motorists with Honesty & Integrity",
    "A+ BBB Accredited Facility with Over 800+ 5-Star Community Reviews",
  ],
  faqTopics: [
    {
      question: "What does it mean when my check engine light is flashing?",
      answerSummary: "A flashing check engine light indicates an active engine misfire that can rapidly damage your catalytic converter. You should pull over safely and avoid driving until diagnosed.",
    },
    {
      question: "How often should I have my car's oil changed?",
      answerSummary: "Most modern vehicles using full synthetic motor oil require changes every 5,000 to 7,500 miles, while conventional oil requires changes every 3,000 to 5,000 miles.",
    },
    {
      question: "What causes brakes to squeak or grind when stopping?",
      answerSummary: "Squeaking is typically caused by built-in metal wear indicators alerting you that pads are thin. Grinding means the friction material is completely gone and metal is rubbing metal, requiring immediate rotor replacement.",
    },
    {
      question: "What is a Digital Vehicle Inspection (DVI)?",
      answerSummary: "Our technicians inspect your vehicle bumper to bumper, taking high-resolution photos and videos of worn parts, and text or email an easy-to-read report directly to your smartphone.",
    },
    {
      question: "Do you honor aftermarket vehicle extended warranties?",
      answerSummary: "Yes, we work directly with most major third-party extended warranty companies, handling all claims processing and paperwork on your behalf.",
    },
    {
      question: "How long does a standard brake job take?",
      answerSummary: "Most front or rear brake pad and rotor replacements take roughly 1.5 to 2.5 hours, including caliper cleaning, hardware replacement, and fluid inspection.",
    },
    {
      question: "Can you diagnose hybrid and electric vehicles?",
      answerSummary: "Yes, our technicians are certified in hybrid and electric vehicle safety, high-voltage battery diagnostics, regenerative braking systems, and auxiliary electronics.",
    },
    {
      question: "What causes a car to pull to one side while driving?",
      answerSummary: "Uneven wheel alignment, unequal tire pressure, or worn suspension components (such as tie rods or ball joints) cause steering pull and accelerate tire tread wear.",
    },
    {
      question: "Do you offer loaner cars or customer shuttle service?",
      answerSummary: "Yes, we provide complimentary local shuttle service within a 5-mile radius and have loaner vehicles available for major multi-day repairs.",
    },
    {
      question: "Why is my car's air conditioning blowing warm air?",
      answerSummary: "Common reasons include refrigerant leaks from O-rings or condenser coils, a failed compressor clutch, or an electrical blend door actuator failure in the dashboard.",
    },
  ],
  processSteps: [
    {
      step: 1,
      title: "Easy Scheduling or Drop-Off",
      description: "Book online or bring your car to our clean shop. We listen carefully to your symptoms and review vehicle service history.",
    },
    {
      step: 2,
      title: "Digital Vehicle Inspection (DVI)",
      description: "Our ASE Master Technicians scan computer codes, inspect mechanical components, and text you a photo/video report with red/yellow/green priorities.",
    },
    {
      step: 3,
      title: "Transparent Approval & Fixed Estimate",
      description: "We review the report with you, answer questions clearly, and get your exact approval on prioritized repairs before starting work.",
    },
    {
      step: 4,
      title: "Precision Repair & 24/24 Warranty Handover",
      description: "We install OEM-quality parts, conduct a road test, and return your car clean, backed by our 24-month/24,000-mile nationwide warranty.",
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
  recommendedThemes: ["bold-trade", "modern-pro"],
  recommendedPages: ["Home", "About", "Services", "Contact", "FAQ", "Service Areas", "Reviews"],
  imageQueries: {
    hero: [
      "certified auto mechanic working under car on hydraulic lift",
      "mechanic holding wrench in modern automotive repair shop",
      "friendly service advisor and customer at auto repair desk",
    ],
    services: [
      "mechanic replacing car brake pad and rotor assembly",
      "computer diagnostic scan tool connected to car obd port",
      "technician working on engine bay car motor",
      "car oil change service technician under vehicle",
      "auto air conditioning repair refrigerant gauges",
      "laser wheel alignment machine on car tire",
    ],
    team: [
      "ase certified mechanic smiling in clean organized garage",
      "auto repair service team in uniform standing by shop bays",
    ],
    work: [
      "clean modern bright auto repair shop service bay",
      "installed brand new ceramic brake disc rotor and caliper",
      "spotless clean car engine bay after service repair",
    ],
  },
  keywordPatterns: [
    "{service} in {city}",
    "{service} near me",
    "auto repair {city}",
    "mechanic near me",
    "brake repair {city}",
    "check engine light {city} {state}",
    "best car repair shop {city}",
    "oil change {city}",
  ],
  toneNotes:
    "Honest, transparent, technically proficient, and communicative, eliminating the fear of predatory garage tactics with digital photo evidence.",
  aliases: ["auto repair", "mechanic", "car repair", "brakes", "oil change", "auto shop"],
};

export default autoRepairNiche;
