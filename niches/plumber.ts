import { NichePack } from "./types";

export const plumberNiche: NichePack = {
  id: "plumber",
  name: "Plumber",
  schemaType: "Plumber",
  emergencyService: true,
  commonServices: [
    "24/7 Emergency Plumbing Repair",
    "Hydro-Jetting & Drain Cleaning",
    "Water Heater Repair & Replacement",
    "Tankless Water Heater Installation",
    "Sewer Line Camera Inspection & Repair",
    "Slab Leak Detection & Foundation Repair",
    "Burst & Leaking Pipe Repair",
    "Garbage Disposal Repair & Installation",
    "Faucet, Sink & Toilet Installation",
    "Whole-Home Repiping (PEX & Copper)",
    "Water Filtration & Water Softener Systems",
    "Backflow Testing & Prevention",
  ],
  customerPainPoints: [
    "Sudden flooding and catastrophic water damage to floors and drywall",
    "Unexplained spikes in monthly water bills from hidden leaks",
    "Sewage backing up into tubs, showers, and ground-level fixtures",
    "Total loss of hot water during cold mornings and family routines",
    "Recurring drain clogs that chemical store cleaners fail to dissolve",
    "Hidden slab leaks eroding soil beneath the home's foundation",
    "Dangerously low water pressure throughout the entire household",
    "Unlicensed handymen doing substandard work that violates local plumbing codes",
  ],
  trustSignals: [
    "Licensed Master Plumber & Fully Insured ($2M Liability)",
    "Upfront Flat-Rate Pricing — No Hidden Fees or Overtime Surprises",
    "45-Minute Rapid Emergency Arrival Window",
    "100% Written Satisfaction & Workmanship Guarantee",
    "Over 20+ Years Serving Local Homeowners & Businesses",
    "High-Tech Video Camera Inspection & Non-Invasive Leak Detection",
    "Background-Checked & Drug-Tested Master Technicians",
    "Fully Stocked 'Warehouse on Wheels' Service Trucks for Same-Day Fixes",
  ],
  faqTopics: [
    {
      question: "How quickly can your plumbers arrive in an emergency?",
      answerSummary: "Our on-call emergency plumbers dispatch immediately with an average arrival time under 45 minutes for urgent water leaks, burst pipes, and sewer backups.",
    },
    {
      question: "How do you charge for plumbing repairs?",
      answerSummary: "We provide transparent, upfront flat-rate pricing before any work starts. You will never see surprise hourly overages or unexpected fees.",
    },
    {
      question: "What are the signs of a hidden water leak or slab leak?",
      answerSummary: "Watch for warm spots on floors, unexplained spikes in your water bill, sounds of running water when taps are off, and damp baseboards.",
    },
    {
      question: "Is hydro-jetting safe for older pipes?",
      answerSummary: "Yes, we perform a video camera inspection first to assess the condition of your pipes and calibrate water pressure safely for root and sludge clearing.",
    },
    {
      question: "Should I repair or replace my water heater?",
      answerSummary: "If your water heater is over 10 years old, leaking from the tank, or requiring frequent repairs, upgrading to a high-efficiency or tankless system is generally most cost-effective.",
    },
    {
      question: "Do you offer warranties on your plumbing work?",
      answerSummary: "Yes, all our repairs and installations come with comprehensive labor warranties alongside full manufacturer warranties on installed equipment.",
    },
    {
      question: "What causes recurring clogged drains?",
      answerSummary: "Common causes include tree root intrusion into sewer lines, grease buildup, mineral scaling, or damaged bellied piping that requires professional hydro-jetting or line repair.",
    },
    {
      question: "Are your plumbers licensed and background checked?",
      answerSummary: "Every technician on our team is a state-licensed master or journeyman plumber, background checked, drug tested, and continually trained.",
    },
    {
      question: "Can you install water softeners and filtration systems?",
      answerSummary: "Yes, we test local water hardness and install whole-home water softeners and carbon filtration units to protect your appliances and plumbing fixtures.",
    },
    {
      question: "What should I do while waiting for the emergency plumber to arrive?",
      answerSummary: "Immediately locate and shut off your home's main water supply valve, turn off electricity to flooded areas, and avoid using any sinks or toilets.",
    },
  ],
  processSteps: [
    {
      step: 1,
      title: "Immediate Call or Online Dispatch",
      description: "Contact our 24/7 dispatch desk. We assess your plumbing situation and deploy a certified technician right away.",
    },
    {
      step: 2,
      title: "On-Site Diagnostic & Camera Inspection",
      description: "Our plumber arrives punctually, inspects the issue with advanced leak detectors or camera probes, and explains the root cause.",
    },
    {
      step: 3,
      title: "Upfront Flat-Rate Estimate",
      description: "You receive an exact, written price with all repair options before any work begins. No surprises, ever.",
    },
    {
      step: 4,
      title: "Clean Repair & Workmanship Guarantee",
      description: "We complete the repair using commercial-grade parts, thoroughly test system pressure, clean up completely, and back our work with a guarantee.",
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
      "licensed plumber fixing kitchen sink with wrench",
      "emergency plumber repairing copper pipes",
      "professional plumbing contractor with tools",
    ],
    services: [
      "drain cleaning hydro jetting machine",
      "water heater replacement installation",
      "copper pipe plumbing repair",
      "sewer camera inspection pipeline",
      "slab leak detection equipment",
      "modern bathroom plumbing fixtures",
    ],
    team: [
      "friendly licensed plumber smiling in uniform",
      "plumbing technicians team with service van",
    ],
    work: [
      "clean newly installed tankless water heater",
      "completed bathroom copper plumbing repair",
      "kitchen sink disposal installation",
    ],
  },
  keywordPatterns: [
    "{service} in {city}",
    "{service} near me",
    "emergency {service} {city}",
    "best plumber {city}",
    "licensed plumber {city} {state}",
    "24 hour plumber {city}",
    "affordable plumbing company {city}",
    "water heater repair {city}",
  ],
  toneNotes:
    "Reassuring, urgent, and focused on fast arrival, damage prevention, upfront flat pricing, and master-level licensing.",
  aliases: ["plumber", "plumbing", "drain cleaning", "rooter", "pipe repair", "water heater"],
};

export default plumberNiche;
