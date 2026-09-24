import { NichePack } from "./types";

export const houseCleaningNiche: NichePack = {
  id: "house-cleaning",
  name: "House Cleaning & Maid Service",
  schemaType: "HomeAndConstructionBusiness",
  emergencyService: false,
  commonServices: [
    "Recurring Maid Service (Weekly, Bi-Weekly, Monthly)",
    "Deep House Cleaning Service (Top-to-Bottom Blitz)",
    "Move-In & Move-Out Turnover Cleaning",
    "Post-Construction & Remodel Dust Cleaning",
    "Apartment & Condo Deep Cleaning",
    "Kitchen Detail Cleaning (Oven, Fridge & Cabinets)",
    "Bathroom Sanitization & Grout Deep Scrub",
    "Interior Window & Glass Polishing",
    "Airbnb & Vacation Rental Rapid Turnover",
    "Eco-Friendly Non-Toxic Green Cleaning",
    "Spring & Holiday Seasonal Deep Cleaning",
    "Small Office & Commercial Janitorial Service",
  ],
  customerPainPoints: [
    "Overwhelmed by demanding work and family schedules with zero time to clean",
    "Rushed cleaners who cut corners, skip baseboards, and leave dust behind",
    "Anxiety having unvetted strangers in the home around valuables and children",
    "Pungent, toxic chemical fumes causing headaches and triggering pet allergies",
    "Inconsistent turnover where a new, unfamiliar cleaner shows up every visit",
    "Scratches and damage to delicate hardwood, marble countertops, or antiques",
    "Bait-and-switch pricing with surprise add-on charges for basic cleaning tasks",
    "Unreliable no-shows and difficult last-minute rescheduling policies",
  ],
  trustSignals: [
    "100% Background-Checked, Drug-Tested & W-2 Vetted Cleaners",
    "Fully Bonded & Insured ($1M General Liability Protection)",
    "24-Hour Free Re-Clean Guarantee If You Are Not Completely Thrilled",
    "Consistent Assigned Cleaning Teams (Same Cleaners Every Visit)",
    "Hospital-Grade HEPA Filter Vacuums & Microfiber Color-Coded Cloths",
    "Pet-Safe, Plant-Based & Non-Toxic Cleaning Supplies Included at No Extra Charge",
    "Easy Online Booking, Flexible Rescheduling & Cardless Billing",
    "Over 500+ Verified 5-Star Reviews from Local Busy Families",
  ],
  faqTopics: [
    {
      question: "Do I need to be home while you clean?",
      answerSummary: "No, most of our clients provide a door code, lockbox key, or leave a key with the front desk. Our bonded, insured team locks up securely upon completion.",
    },
    {
      question: "What is included in a deep cleaning compared to a recurring clean?",
      answerSummary: "A deep clean includes hand-washing baseboards, doors, door frames, deep interior oven and microwave scrubbing, sanitizing inside window sills, and heavy bathroom scale removal.",
    },
    {
      question: "Do you bring your own cleaning supplies and equipment?",
      answerSummary: "Yes, our team brings all professional-grade, eco-friendly supplies, hospital-grade HEPA vacuums, and clean microfiber cloths. If you prefer specific specialty products for your surfaces, we are happy to use yours.",
    },
    {
      question: "Are your cleaning products safe for dogs, cats, and toddlers?",
      answerSummary: "Yes, our core cleaning solutions are plant-derived, non-toxic, and free from harsh bleaches and synthetic fragrances, making them safe for your entire family.",
    },
    {
      question: "What if something is accidentally damaged during a cleaning?",
      answerSummary: "While our technicians take exceptional care, we are fully bonded and insured. If an accident occurs, we report it immediately and cover full repair or replacement costs.",
    },
    {
      question: "Will I have the same cleaning team every time?",
      answerSummary: "Yes, we assign dedicated cleaners to recurring accounts so they become intimately familiar with your home's preferences, pet routines, and special care instructions.",
    },
    {
      question: "What is your 24-hour satisfaction guarantee?",
      answerSummary: "If any spot on our 50-point checklist does not meet your high standards, contact us within 24 hours and we will return promptly to re-clean the area free of charge.",
    },
    {
      question: "How do you handle homes with pets?",
      answerSummary: "We love pets! Just let us know your pets' names and whether they should remain in a designated room while doors are open for vacuuming.",
    },
    {
      question: "Can I add interior oven or refrigerator cleaning to my service?",
      answerSummary: "Yes, interior appliances, inside cabinets, and interior windows can be seamlessly added to any booking with a single click or phone call.",
    },
    {
      question: "How do tipping and payments work?",
      answerSummary: "We accept all major credit cards securely online after each cleaning. Tipping is completely optional, appreciated, and goes 100% directly to your cleaners.",
    },
  ],
  processSteps: [
    {
      step: 1,
      title: "Easy 60-Second Online Quote",
      description: "Select your home size, desired frequency, and any add-ons. Receive immediate upfront flat-rate pricing with zero hidden fees.",
    },
    {
      step: 2,
      title: "Vetted Cleaning Team Arrival",
      description: "Your background-checked, uniformed cleaning specialists arrive on time with commercial HEPA vacuums and fresh eco-friendly supplies.",
    },
    {
      step: 3,
      title: "50-Point Checklist Deep Clean",
      description: "We work methodically from top to bottom, dusting crown molding, hand-wiping baseboards, polishing fixtures, and vacuuming all floors.",
    },
    {
      step: 4,
      title: "Quality Inspection & Re-Clean Guarantee",
      description: "The team lead conducts a final quality review. Your payment processes smoothly, backed by our 24-hour free re-clean guarantee.",
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
  recommendedThemes: ["clean-medical", "warm-friendly", "modern-pro"],
  recommendedPages: ["Home", "About", "Services", "Contact", "FAQ", "Service Areas", "Reviews"],
  imageQueries: {
    hero: [
      "professional house cleaner smiling in spotless modern living room",
      "clean bright modern kitchen living room house cleaning",
      "maid service technician with eco friendly cleaning supplies",
    ],
    services: [
      "cleaning marble kitchen counter with spray bottle shine",
      "bathroom tile and glass shower cleaning scrubber",
      "vacuuming clean hardwood floor sunny bedroom",
      "dusting modern living room shelves microfiber cloth",
      "move out cleaning empty apartment kitchen",
      "eco friendly green cleaning bottles bucket supplies",
    ],
    team: [
      "two friendly house cleaners in clean uniform smiling",
      "professional maid service team in front of home",
    ],
    work: [
      "spotless modern white kitchen after deep cleaning",
      "gleaming clean bathroom with folded fluffy white towels",
      "immaculate clean hardwood floors sunny open living room",
    ],
  },
  keywordPatterns: [
    "{service} in {city}",
    "{service} near me",
    "house cleaning service {city}",
    "maid service {city}",
    "deep cleaning service {city}",
    "move out cleaning {city} {state}",
    "best house cleaners {city}",
    "affordable maid service {city}",
  ],
  toneNotes:
    "Warm, meticulous, trustworthy, and lifestyle-enriching, focusing on returning free time, family wellness, and creating pristine sanctuaries.",
  aliases: ["house cleaning", "maid service", "cleaning service", "deep cleaning", "move out cleaning"],
};

export default houseCleaningNiche;
