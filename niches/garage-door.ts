import { NichePack } from "./types";

export const garageDoorNiche: NichePack = {
  id: "garage-door",
  name: "Garage Door Repair & Installation",
  schemaType: "HomeAndConstructionBusiness",
  emergencyService: true,
  commonServices: [
    "24/7 Emergency Torsion & Extension Spring Replacement",
    "Snapped Steel Cable & Heavy-Duty Roller Replacement",
    "Smart Garage Door Opener Installation (LiftMaster & Genie)",
    "Off-Track & Crooked Garage Door Realignment",
    "New Garage Door Installation & Custom Carriage House Doors",
    "Bent Track Straightening & Replacement",
    "Keyless Entry Keypad & Remote Control Programming",
    "Safety Sensor Realignment & Diagnostic",
    "Weather Stripping & Heavy Bottom Rubber Seal Replacement",
    "25-Point Comprehensive Safety Inspection & Lube Tune-Up",
    "Commercial Roll-Up & Overhead Sectional Door Repair",
    "Ultra-Quiet Belt-Drive Opener Conversions",
  ],
  customerPainPoints: [
    "Vehicles trapped inside the garage on a Monday morning due to a snapped torsion spring",
    "Terrifying loud gunshot bang when high-tension garage door springs snap suddenly",
    "Heavy garage door hanging crooked off its tracks, threatening to drop and crush property",
    "Garage door refusing to close all the way, leaving the entire home and valuables vulnerable to theft",
    "Horrendous squealing, grinding, and rattling sounds every time the door operates",
    "Shady technicians price gouging desperate homeowners with low-grade replacement springs",
    "Extreme physical danger of DIY garage spring repairs resulting in severe injury",
    "Old openers lacking rolling-code encryption that tech-savvy burglars can easily hack",
  ],
  trustSignals: [
    "Licensed, Bonded & Insured Garage Door Specialists ($2M Coverage)",
    "Commercial High-Cycle Springs (Rated for 30,000+ Cycles vs Standard 10,000)",
    "Guaranteed 2-Hour Emergency Response Windows & Same-Day Repair",
    "Fully Stocked Mobile Service Trucks (99% of Repairs Completed on First Visit)",
    "Lifetime Warranty Available on Heavy Hardware, Springs & Rollers",
    "Upfront Written Estimates with Zero Hidden Fuel or Trip Surcharges",
    "Certified Master Technicians (100% In-House, Zero Subcontractors)",
    "Authorized LiftMaster, Clopay & Amarr Premier Dealer",
  ],
  faqTopics: [
    {
      question: "Can I replace a broken garage door spring myself?",
      answerSummary: "No. Garage door torsion springs are under extreme mechanical tension and can cause severe injury or death if handled without specialized winding bars and professional training.",
    },
    {
      question: "Why should I replace both garage door springs if only one broke?",
      answerSummary: "Garage door springs are installed in pairs and experience the identical number of open/close cycles. When one snaps, the second spring is almost always on the verge of failing within weeks.",
    },
    {
      question: "What is the lifespan of replacement garage door springs?",
      answerSummary: "Standard builder-grade springs last roughly 10,000 cycles (5-7 years). We install commercial high-cycle oil-tempered springs rated for 30,000+ cycles (15-20+ years of daily use).",
    },
    {
      question: "Why does my garage door start closing, stop, and reverse back up?",
      answerSummary: "This is usually caused by misaligned, dirty, or blocked photo-eye safety sensors near the bottom of the tracks, or an obstruction in the track itself.",
    },
    {
      question: "What is the difference between a chain-drive and belt-drive opener?",
      answerSummary: "Chain-drive openers are economical and durable but loud. Belt-drive openers use steel-reinforced rubber belts that operate almost silently, ideal for garages located beneath bedrooms.",
    },
    {
      question: "Can you install a smart opener that connects to my smartphone?",
      answerSummary: "Yes, we install LiftMaster myQ smart openers that let you open, close, and monitor your garage door from anywhere, receive real-time alerts, and grant delivery access.",
    },
    {
      question: "How long does it take to install a brand new garage door?",
      answerSummary: "A standard two-car residential garage door installation typically takes our professional crew between 3 to 5 hours, including haul-away of the old door and complete safety calibration.",
    },
    {
      question: "What causes a garage door to jump off its track?",
      answerSummary: "Common causes include snapped cables, a vehicle bumping into the door track, worn-out rollers popping loose, or high-speed obstructions jamming the door mid-travel.",
    },
    {
      question: "Do you offer emergency service on weekends and holidays?",
      answerSummary: "Yes, our on-call technicians provide 24/7/365 emergency dispatch with fully stocked trucks ready to free trapped vehicles and restore security immediately.",
    },
    {
      question: "How often should a garage door receive preventative maintenance?",
      answerSummary: "We recommend an annual 25-point tune-up to lubricate bearings, adjust spring tension, tighten hinge bolts, test reverse safety mechanisms, and inspect cables for fraying.",
    },
  ],
  processSteps: [
    {
      step: 1,
      title: "Immediate Call & Same-Day Dispatch",
      description: "Contact our dispatch center. We log your door symptoms and assign an emergency mobile technician equipped with replacement springs and parts.",
    },
    {
      step: 2,
      title: "Comprehensive 25-Point Safety Inspection",
      description: "We inspect spring balance, cable tension, track alignment, roller wear, and opener motor force to diagnose all safety hazards.",
    },
    {
      step: 3,
      title: "Upfront Fixed Quote & Part Options",
      description: "You receive an exact, written estimate with standard vs. high-cycle hardware options. You decide the best fit for your home.",
    },
    {
      step: 4,
      title: "Precision Repair, Balance & Lubrication",
      description: "We install heavy-duty parts, balance door weight to finger-tip lightness, calibrate safety reverse sensors, and test complete operation.",
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
  recommendedThemes: ["bold-trade", "modern-pro"],
  recommendedPages: ["Home", "About", "Services", "Contact", "FAQ", "Service Areas", "Gallery", "Reviews"],
  imageQueries: {
    hero: [
      "garage door technician replacing torsion spring on ladder",
      "modern luxury carriage house garage doors on residential home",
      "garage door repair specialist working on overhead track",
    ],
    services: [
      "garage door high tension spring replacement repair",
      "smart wifi garage door opener installation ceiling",
      "garage door off track repair technician wrench",
      "garage door nylon roller replacement smooth quiet",
      "modern black glass residential garage door installation",
      "commercial steel roll up door repair warehouse",
    ],
    team: [
      "garage door repair technician smiling holding wrench by van",
      "overhead door specialist team with company service truck",
    ],
    work: [
      "installed modern architectural dark bronze garage doors",
      "clean heavy duty dual torsion spring replacement installed",
      "quiet belt drive garage opener motor mounted ceiling",
    ],
  },
  keywordPatterns: [
    "{service} in {city}",
    "{service} near me",
    "emergency garage door repair {city}",
    "garage door spring repair {city}",
    "garage door opener installation {city}",
    "new garage doors {city} {state}",
    "overhead door repair {city}",
    "best garage door company {city}",
  ],
  toneNotes:
    "Urgent, safety-conscious, reliable, and reassuring, emphasizing the danger of high-tension springs, same-day relief, and lifetime warranty hardware.",
  aliases: ["garage door", "overhead door", "garage door repair", "garage spring", "garage opener", "garage door installation"],
};

export default garageDoorNiche;
