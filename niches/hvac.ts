import { NichePack } from "./types";

export const hvacNiche: NichePack = {
  id: "hvac",
  name: "HVAC & Air Conditioning",
  schemaType: "HVACBusiness",
  emergencyService: true,
  commonServices: [
    "24/7 Emergency AC Repair",
    "Central Air Conditioning Installation & Replacement",
    "Furnace Repair & Heating Diagnostics",
    "Heat Pump Installation & Service",
    "Ductless Mini-Split Systems",
    "Ductwork Cleaning, Sealing & Repair",
    "Comprehensive Seasonal HVAC Tune-Up & Maintenance",
    "Smart Thermostat Installation & Zoning",
    "Whole-Home Air Purifiers & Dehumidifiers",
    "Refrigerant Leak Detection & Freon Recharge",
    "Commercial Rooftop HVAC Maintenance",
    "Emergency Winter Heating Dispatch",
  ],
  customerPainPoints: [
    "Complete AC breakdown during blistering summer heatwaves",
    "Furnace blowing cold air or failing completely during freezing nights",
    "Skyrocketing electric and gas utility bills due to aging, inefficient equipment",
    "Uneven temperatures where upstairs rooms remain sweltering while downstairs is freezing",
    "Loud squealing, grinding, or rattling noises coming from indoor or outdoor units",
    "Musty odors or burning dust smells when turning on heat or AC",
    "Excessive dust, allergens, and humidity causing respiratory discomfort",
    "Unscrupulous technicians pushing costly full system replacements for simple minor repairs",
  ],
  trustSignals: [
    "NATE & EPA Universal Certified HVAC Specialists",
    "Licensed, Bonded & Insured Mechanical Contractor",
    "10-Year Parts & Labor Warranties on New Installations",
    "Guaranteed Same-Day Emergency Service & 24/7 Dispatch",
    "Upfront Flat-Rate Pricing — Never Any Overtime Fees",
    "Authorized Carrier, Trane & Lennox Dealer",
    "A+ BBB Rating with Over 1,000+ Verified 5-Star Reviews",
    "100% Satisfaction or Your Money Back Guarantee",
  ],
  faqTopics: [
    {
      question: "How long does a modern HVAC system typically last?",
      answerSummary: "Central AC units and heat pumps usually last 12 to 15 years with regular annual maintenance, while gas furnaces can last 15 to 20 years.",
    },
    {
      question: "Why is my AC running constantly but not cooling the house?",
      answerSummary: "Common reasons include dirty air filters restricting airflow, frozen evaporator coils, low refrigerant levels from a leak, or an undersized cooling unit.",
    },
    {
      question: "How often should I have my HVAC system serviced?",
      answerSummary: "We strongly recommend servicing your cooling system in the spring and your heating system in the fall to maintain energy efficiency and prevent emergency breakdowns.",
    },
    {
      question: "What SEER2 rating should I choose for a new air conditioner?",
      answerSummary: "Modern regional standards mandate minimum ratings between 14.3 to 15.2 SEER2, but high-efficiency units rated 16 to 20+ SEER2 yield substantial energy savings in hot climates.",
    },
    {
      question: "What are the advantages of a ductless mini-split system?",
      answerSummary: "Ductless mini-splits offer independent room-by-room temperature control, hyper-efficient inverter technology, and easy installation without ductwork.",
    },
    {
      question: "How do I know if my AC has a refrigerant leak?",
      answerSummary: "Signs include hissing sounds near the outdoor condenser, ice buildup on copper lines, warm air blowing from vents, and longer cooling cycles.",
    },
    {
      question: "Can upgrading to a smart thermostat lower my power bills?",
      answerSummary: "Yes, programmable and smart thermostats like ecobee or Nest automatically optimize temperatures when you are asleep or away, saving up to 12-15% annually on cooling and heating.",
    },
    {
      question: "What is included in your seasonal HVAC tune-up?",
      answerSummary: "Our 24-point tune-up includes cleaning condenser coils, checking refrigerant pressures, inspecting electrical connections, lubricating motors, testing safety controls, and calibrating thermostats.",
    },
    {
      question: "Do you offer emergency heating repair during freezing weather?",
      answerSummary: "Yes, our emergency technicians are dispatched around the clock 24/7/365 to restore heat safely for vulnerable families and elderly residents.",
    },
    {
      question: "Do you offer financing options for new HVAC installations?",
      answerSummary: "Yes, we partner with top lenders to offer flexible monthly financing plans, including 0% APR promotional options for qualified homeowners.",
    },
  ],
  processSteps: [
    {
      step: 1,
      title: "24/7 Scheduling & Priority Dispatch",
      description: "Contact our friendly team. We log your symptoms and immediately assign an on-call certified technician to your home.",
    },
    {
      step: 2,
      title: "Comprehensive 24-Point Diagnostic",
      description: "We test airflow, electrical components, compressor pressures, and safety switches to pinpoint the exact failure.",
    },
    {
      step: 3,
      title: "Clear, Written Upfront Options",
      description: "We walk you through repair vs. replace scenarios with fixed flat-rate pricing before turning a single wrench.",
    },
    {
      step: 4,
      title: "Rapid Repair & Efficiency Validation",
      description: "We install factory-authorized parts, confirm temperature splits across your registers, and ensure whisper-quiet comfort.",
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
  recommendedThemes: ["modern-pro", "bold-trade"],
  recommendedPages: ["Home", "About", "Services", "Contact", "FAQ", "Service Areas", "Reviews"],
  imageQueries: {
    hero: [
      "hvac technician servicing outdoor air conditioning unit",
      "certified ac repair technician with gauges",
      "modern residential outdoor condenser unit in garden",
    ],
    services: [
      "air conditioning compressor unit installation",
      "hvac technician inspecting gas furnace",
      "ductless mini split wall unit modern bedroom",
      "smart digital thermostat display on wall",
      "duct cleaning technician vacuum hose",
      "commercial rooftop hvac unit maintenance",
    ],
    team: [
      "hvac technicians smiling by company service van",
      "certified ac technician holding manifold pressure gauge",
    ],
    work: [
      "brand new high efficiency outdoor ac condenser",
      "clean furnace and air filtration installation basement",
      "modern clean ductwork installation attic",
    ],
  },
  keywordPatterns: [
    "{service} in {city}",
    "{service} near me",
    "emergency ac repair {city}",
    "ac installation {city}",
    "heating repair {city} {state}",
    "best hvac company {city}",
    "furnace repair {city}",
    "24 hour ac repair {city}",
  ],
  toneNotes:
    "Comfort-focused, urgent, and dependable, highlighting energy efficiency, manufacturer warranties, and same-day climate relief.",
  aliases: ["hvac", "air conditioning", "heating and cooling", "ac repair", "furnace repair", "heat pump"],
};

export default hvacNiche;
