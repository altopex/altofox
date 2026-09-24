import { NichePack } from "./types";

export const generalLocalServiceNiche: NichePack = {
  id: "general-local-service",
  name: "General Local Service",
  schemaType: "HomeAndConstructionBusiness",
  emergencyService: false,
  commonServices: [
    "On-Site Consultation & Comprehensive System Diagnostic",
    "Professional Residential Service & Quality Installation",
    "Scheduled Preventative Maintenance & Safety Inspections",
    "Rapid Response Repairs & Troubleshooting",
    "Custom Upgrades, Retrofits & System Replacements",
    "Commercial Service Contracts & Facility Care",
    "Safety Evaluations & Building Code Compliance",
    "High-Efficiency & Eco-Friendly Modern Upgrades",
    "Same-Day Priority Dispatch & Scheduling",
    "Complete Parts & Labor Craftsmanship Warranty",
  ],
  customerPainPoints: [
    "Unreliable contractors who fail to show up during scheduled appointment windows",
    "Opaque estimates with hidden fees and unexpected charges on the final bill",
    "Substandard workmanship that breaks down shortly after the contractor leaves",
    "Unlicensed or uninsured workers putting the homeowner's property and liability at risk",
    "Frustrating communication, unanswered calls, and slow turnaround times",
    "Messy service workers leaving debris, dirt, and dust in customer homes",
  ],
  trustSignals: [
    "Licensed, Insured & Bonded Professional Contractors ($2M Liability)",
    "Guaranteed Upfront Flat-Rate Estimates — Zero Surprise Add-Ons",
    "100% Written Workmanship & Customer Satisfaction Guarantee",
    "Punctual, Uniformed & Background-Checked Service Technicians",
    "Decades of Dedicated Local Service to the Community",
    "Fully Outfitted Service Vehicles for Immediate On-Site Solutions",
    "Respect for Your Property with Shoe Covers & Complete Clean-Up",
    "Top-Rated Across Google, Yelp & Local Community Directories",
  ],
  faqTopics: [
    {
      question: "How quickly can you schedule service?",
      answerSummary: "We offer convenient same-day and next-day appointment options, as well as flexible scheduling to work around your busy routine.",
    },
    {
      question: "How do you determine your pricing?",
      answerSummary: "We provide transparent, upfront flat-rate pricing after evaluating your specific project scope so you know the exact cost before work begins.",
    },
    {
      question: "Are your technicians licensed and insured?",
      answerSummary: "Yes, every technician on our team holds verified professional credentials, is thoroughly background checked, and is backed by full liability insurance.",
    },
    {
      question: "Do you offer warranties on your work and materials?",
      answerSummary: "Yes, all our services include a comprehensive written craftsmanship warranty alongside full manufacturer warranties on installed parts and systems.",
    },
    {
      question: "What should I expect during the initial consultation?",
      answerSummary: "Our specialist arrives punctually, listens to your concerns, conducts a thorough on-site evaluation, and presents clear, itemized solutions.",
    },
    {
      question: "Do you handle both residential and commercial projects?",
      answerSummary: "Yes, our team is fully equipped and certified to handle residential homes, multi-family properties, and commercial facilities.",
    },
    {
      question: "Can I receive a free estimate?",
      answerSummary: "Yes, we provide free consultations and itemized written proposals for all major installations, renovations, and system replacements.",
    },
    {
      question: "What payment methods do you accept?",
      answerSummary: "We accept all major credit cards, debit cards, electronic bank transfers, and offer flexible financing plans for qualified customers.",
    },
    {
      question: "How do you protect my home during the service visit?",
      answerSummary: "We wear protective shoe covers, lay down clean drop cloths in work corridors, and perform a thorough cleanup before leaving your home.",
    },
    {
      question: "What should I do if I have follow-up questions after the job is completed?",
      answerSummary: "Our dedicated local customer support team is always just a quick phone call away to assist with maintenance tips, warranty questions, or adjustments.",
    },
  ],
  processSteps: [
    {
      step: 1,
      title: "Easy Scheduling & Consultation",
      description: "Contact our friendly local team online or by phone. We establish a prompt, convenient arrival window that fits your schedule.",
    },
    {
      step: 2,
      title: "On-Site Assessment & Upfront Estimate",
      description: "Our certified specialist evaluates your requirements, answers all questions, and provides a clear, guaranteed written proposal.",
    },
    {
      step: 3,
      title: "Masterful Execution & Code Compliance",
      description: "We complete the work using premium materials, industry best practices, and meticulous attention to detail.",
    },
    {
      step: 4,
      title: "Final Walkthrough & Workmanship Guarantee",
      description: "We inspect every detail with you, verify flawless operation, clean up the workspace, and provide your warranty documentation.",
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
  recommendedThemes: ["modern-pro", "bold-trade"],
  recommendedPages: ["Home", "About", "Services", "Contact", "FAQ", "Service Areas", "Reviews"],
  imageQueries: {
    hero: [
      "professional skilled craftsman working with tools in modern home",
      "friendly service technician inspecting equipment residential home",
      "certified contractor smiling with clipboard by service truck",
    ],
    services: [
      "technician diagnosing equipment with precision tools",
      "craftsman tools neatly organized workspace clean",
      "professional service technician in uniform on site",
      "specialist installing modern system residential home",
      "maintenance inspection checklist clip board",
      "commercial facility service repair technician",
    ],
    team: [
      "smiling service technician holding clipboard friendly greeting",
      "professional local service team standing by work van",
    ],
    work: [
      "clean completed residential home improvement project",
      "modern craftsmanship detail in clean bright room",
      "happy homeowner shaking hands with service technician",
    ],
  },
  keywordPatterns: [
    "{service} in {city}",
    "{service} near me",
    "best {niche} in {city}",
    "local {niche} company {city}",
    "{service} contractor {city} {state}",
    "affordable {niche} near me",
  ],
  toneNotes:
    "Professional, trustworthy, dependable, and community-rooted, emphasizing quality craftsmanship, transparent pricing, and complete customer peace of mind.",
  aliases: ["general", "local service", "home service", "contractor", "maintenance"],
};

export default generalLocalServiceNiche;
