import { NichePack } from "./types";

export const locksmithNiche: NichePack = {
  id: "locksmith",
  name: "Locksmith Service",
  schemaType: "Locksmith",
  emergencyService: true,
  commonServices: [
    "24/7 Emergency Home & Apartment Lockout Service",
    "24/7 Emergency Automotive Car Lockout Service",
    "Smart Lock, Keypad & Keyless Deadbolt Installation",
    "Residential Lock Rekeying & Cylinder Replacement",
    "High-Security Deadbolt Installation (Medeco, Mul-T-Lock)",
    "Car Key Replacement & Transponder Chip Key Programming",
    "Broken Key Extraction from Locks & Car Ignitions",
    "Commercial Master Key System Design & Implementation",
    "Commercial Panic Bar & Emergency Exit Hardware",
    "Home & Commercial Safe Opening, Combination Changes & Sales",
    "Mailbox & File Cabinet Lock Replacement",
    "Electronic Access Control & Keycard Systems",
  ],
  customerPainPoints: [
    "Stranded outside home or vehicle in the middle of the night or during extreme weather",
    "Predatory bait-and-switch locksmiths quoting $15 on phone then demanding $300+ on site",
    "Lost or stolen car keys with transponder chips leaving drivers completely immobilized",
    "Vulnerability following a home burglary, lost keys, or a difficult tenant move-out",
    "Unskilled locksmiths drilling out expensive locks and damaging doors unnecessarily",
    "Keys jammed, bent, or broken off flush inside deadbolts or automotive ignitions",
    "Smart lock batteries dying or electronic keypads malfunctioning in the rain",
    "Previous tenants or contractors still possessing physical copies of house keys",
  ],
  trustSignals: [
    "Licensed, Bonded & Certified Professional Locksmith (ALOA Certified)",
    "Guaranteed Upfront Flat Quotes Before Dispatch (Zero Price Gouging)",
    "Rapid 15 to 30 Minute Mobile Emergency Arrival Window",
    "Non-Destructive Entry Specialists (Lock Picking & Decoding First)",
    "State-of-the-Art Mobile Key-Cutting & Computer Transponder Programming Vans",
    "100% Background-Checked, Uniformed & ID-Badged Security Technicians",
    "Fully Insured for High-Security Residential & Commercial Properties",
    "Over 10,000+ Verified Successful Lockouts with 5-Star Reviews",
  ],
  faqTopics: [
    {
      question: "Can you unlock my house or car without damaging the lock?",
      answerSummary: "Yes, our certified locksmiths specialize in non-destructive entry using precision lock picks, air wedges, and bypass tools to open doors safely without drilling 95% of the time.",
    },
    {
      question: "How fast can an emergency locksmith reach me?",
      answerSummary: "Our mobile locksmith units are stationed across the metro area, enabling an average emergency arrival time between 15 to 30 minutes.",
    },
    {
      question: "What is the difference between rekeying and replacing locks?",
      answerSummary: "Rekeying alters the internal pins of your existing lock so old keys no longer work and a new key is issued. It is much more affordable than replacing the entire lock hardware.",
    },
    {
      question: "Can you make a replacement car key if I lost the original?",
      answerSummary: "Yes, our mobile vans are equipped with computerized laser key cutters and OBD-II transponder programming computers to create new chip keys, fobs, and push-to-start remotes on the spot.",
    },
    {
      question: "Do you require proof of ownership before unlocking a home or car?",
      answerSummary: "Yes, for your protection and security, our technician will verify your government-issued ID matching the address, lease agreement, or vehicle registration before granting entry.",
    },
    {
      question: "Can you install smart Wi-Fi door locks like Schlage Encode or Yale?",
      answerSummary: "Yes, we install and calibrate all major smart lock brands, ensuring proper door latch alignment so the motorized deadbolt never jams or drains batteries prematurely.",
    },
    {
      question: "What should I do if my key snaps off inside the lock?",
      answerSummary: "Do not attempt to glue or force the broken piece deeper. Call our mobile technician, who uses specialized broken-key extractors to remove the fragment cleanly without damaging the lock.",
    },
    {
      question: "Can you set up all the exterior doors in my house to work with one single key?",
      answerSummary: "Yes! As long as your deadbolts and door knobs share the same keyway brand (such as Kwikset or Schlage), we can rekey all locks to operate with one convenient master key.",
    },
    {
      question: "Can you open a safe if I forgot the combination?",
      answerSummary: "Yes, our certified safe technicians employ manipulation techniques, dial decoders, and precision endoscopic drilling to open safes and reset digital or dial combinations.",
    },
    {
      question: "Do you offer emergency commercial locksmith services for businesses?",
      answerSummary: "Yes, we repair storefront panic bars, door closers, electric strikes, and rekey commercial office suites 24 hours a day.",
    },
  ],
  processSteps: [
    {
      step: 1,
      title: "Immediate Call & Flat-Rate Quote",
      description: "Call our 24/7 emergency dispatch line. You receive an upfront, guaranteed flat price quote before our mobile technician heads your way.",
    },
    {
      step: 2,
      title: "Rapid Mobile Arrival & ID Verification",
      description: "Our uniformed technician arrives in a marked security van within 15-30 minutes and quickly verifies ownership credentials.",
    },
    {
      step: 3,
      title: "Non-Destructive Entry / Precision Repair",
      description: "Using professional picking tools or laser key cutters, we unlock your door or cut fresh transponder keys without damaging hardware.",
    },
    {
      step: 4,
      title: "Security Check & Immediate Testing",
      description: "We test smooth lock rotation and key alignment, lubricate the mechanism, and verify your security before departure.",
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
      "professional locksmith picking residential deadbolt front door",
      "mobile locksmith service technician van cutting keys",
      "locksmith technician holding lock picking tools smiling",
    ],
    services: [
      "smart digital door lock keypad installation front door",
      "locksmith rekeying deadbolt brass cylinder pins",
      "car lockout emergency locksmith wedge vehicle door",
      "automotive key cutting machine programming transponder key",
      "commercial high security door lock panic bar",
      "safe unlocking locksmith dial manipulation",
    ],
    team: [
      "professional locksmith in uniform holding tools smiling by van",
      "licensed locksmith technician portrait in mobile workshop",
    ],
    work: [
      "installed modern matte black keypad smart lock",
      "precision cut automotive laser car keys with remote fob",
      "commercial stainless steel exit device panic bar installed",
    ],
  },
  keywordPatterns: [
    "{service} in {city}",
    "{service} near me",
    "emergency locksmith {city}",
    "24 hour locksmith {city}",
    "car lockout service {city}",
    "rekey locks {city} {state}",
    "mobile locksmith {city}",
    "best locksmith near me",
  ],
  toneNotes:
    "Urgent, calm, reassuring, and security-focused, emphasizing rapid 20-minute arrival, non-destructive entry, and transparent pricing.",
  aliases: ["locksmith", "lockout", "rekey", "car key replacement", "deadbolt", "smart lock"],
};

export default locksmithNiche;
