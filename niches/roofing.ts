import { NichePack } from "./types";

export const roofingNiche: NichePack = {
  id: "roofing",
  name: "Roofing Contractor",
  schemaType: "RoofingContractor",
  emergencyService: true,
  commonServices: [
    "Emergency Roof Tarping & Storm Damage Response",
    "Complete Roof Replacement (Architectural Shingles)",
    "Standing Seam Metal Roof Installation",
    "Tile & Slate Roof Repair & Restoration",
    "Commercial Flat & Low-Slope Membrane Roofing (TPO/EPDM)",
    "Roof Leak Detection & Chimney Flashing Repair",
    "Hail & Wind Storm Damage Insurance Claims Assistance",
    "Seamless Gutter Installation, Guards & Downspouts",
    "Skylight Installation & Leak Repair",
    "Ridge Vent & Attic Ventilation Balancing",
    "Comprehensive 21-Point Drone & Attic Roof Inspections",
    "Fascia & Soffit Wood Rot Replacement",
  ],
  customerPainPoints: [
    "Active roof leaks dripping water into ceilings and ruining drywall during rainstorms",
    "Devastating hail and high wind storms knocking off shingles and exposing underlayment",
    "Overwhelming, stressful negotiations with insurance companies trying to underpay claims",
    "Out-of-town 'storm chaser' contractors who take deposits and disappear without finishing",
    "Rotten roof decking and attic mold festering from poor ventilation",
    "Missing, curling, or cracked shingles dramatically devaluing property curb appeal",
    "Premature roof failure costing tens of thousands due to improper amateur nailing",
    "Clogged, overflowing gutters rotting fascia boards and flooding foundation perimeters",
  ],
  trustSignals: [
    "GAF Master Elite / Owens Corning Platinum Preferred Contractor",
    "Licensed, Bonded & Insured Roofing Contractor ($2M Coverage)",
    "50-Year Non-Prorated Manufacturer Material & Labor Warranties",
    "Dedicated In-House Insurance Adjuster & Claims Advocacy Team",
    "Zero Upfront Money Down Until Job Is 100% Completed & Inspected",
    "High-Resolution Drone Photographic Roof Damage Inspections",
    "Over 25+ Years of Local Community Roofing Experience",
    "Magnetic Sweep Clean-Up Guarantee (Zero Nails Left on Driveway or Lawn)",
  ],
  faqTopics: [
    {
      question: "How do I know if my roof needs a full replacement or just a minor repair?",
      answerSummary: "If your roof is under 15 years old and damage is isolated to a few shingles or flashing, a repair is usually sufficient. If it is 20+ years old, widespread granule loss is evident, or hail damaged more than 25-30% of the slopes, replacement is best.",
    },
    {
      question: "Will my homeowner's insurance cover roof damage from a storm?",
      answerSummary: "Yes, sudden storm damage from hail, high winds, and falling branches is generally covered. We provide comprehensive photo documentation and meet your adjuster on-site to ensure full coverage.",
    },
    {
      question: "How long does a complete roof replacement take?",
      answerSummary: "Most residential roofs are fully torn off, re-decked, underlaid, shingled, and cleaned up in a single day by our experienced, certified installation crews.",
    },
    {
      question: "What is the lifespan of an architectural asphalt shingle roof?",
      answerSummary: "Architectural shingles typically last 25 to 30 years, whereas premium designer shingles and metal roofing can last 40 to 50+ years.",
    },
    {
      question: "How do you protect my landscaping and property during roof replacement?",
      answerSummary: "We drape protective tarps over your siding, landscaping, and air conditioning units. After the build, we run powerful rolling magnets across your yard and driveway to collect every loose nail.",
    },
    {
      question: "What is an ice and water shield and is it required?",
      answerSummary: "An ice and water shield is a self-adhering waterproof barrier installed along eaves, valleys, and around chimneys to prevent water infiltration from wind-driven rain and ice dams.",
    },
    {
      question: "Do you offer emergency roof tarping after a severe storm?",
      answerSummary: "Yes, our emergency tarping crews deploy 24/7 immediately following severe wind and hail storms to seal leaks and prevent water damage to your home's interior.",
    },
    {
      question: "Can you install seamless gutters along with my new roof?",
      answerSummary: "Yes, we fabricate and install custom seamless 5-inch and 6-inch aluminum gutters and leaf guards on-site to match your new roof and exterior trim.",
    },
    {
      question: "What financing options do you provide for roof replacements?",
      answerSummary: "We offer zero-down financing options, deferred interest plans for 12 months, and low monthly payment plans to accommodate your family budget.",
    },
    {
      question: "Are your roofers certified by shingle manufacturers?",
      answerSummary: "Yes, our crews are factory-certified by leading manufacturers like GAF, Owens Corning, and CertainTeed, allowing us to provide exclusive extended warranty coverage.",
    },
  ],
  processSteps: [
    {
      step: 1,
      title: "Free Drone & Attic Roof Inspection",
      description: "We perform a thorough 21-point exterior and attic roof inspection using HD drone cameras, documenting every dent, cracked shingle, and flashing flaw.",
    },
    {
      step: 2,
      title: "Transparent Estimate & Insurance Support",
      description: "We provide an itemized written estimate and assist with filing your insurance claim, meeting with your adjuster directly on the roof.",
    },
    {
      step: 3,
      title: "1-Day Expert Tear-Off & Shingle Installation",
      description: "Our certified crew tears off old materials, inspects and repairs decking, applies synthetic underlayment, and installs your new roofing system.",
    },
    {
      step: 4,
      title: "Magnet Sweep & 50-Year Warranty Handover",
      description: "We perform multiple magnetic sweeps for stray nails, conduct a final quality inspection with you, and issue your 50-year warranty certificate.",
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
      "roofing contractors installing architectural shingles on sunny roof",
      "beautiful residential home with brand new asphalt shingle roof",
      "roofing team on roof replacement project",
    ],
    services: [
      "roof replacement architectural shingles work",
      "metal standing seam roof residential installation",
      "emergency roof tarping storm damage",
      "seamless aluminum gutter installation downspout",
      "roof leak inspection flashing chimney",
      "commercial flat roof tpo installation",
    ],
    team: [
      "roofing company owner and inspector in safety gear on roof",
      "experienced roofing installation crew portrait",
    ],
    work: [
      "stunning completed architectural shingle roof aerial drone",
      "modern standing seam dark metal roof home",
      "clean residential roof replacement front yard",
    ],
  },
  keywordPatterns: [
    "{service} in {city}",
    "{service} near me",
    "roof repair {city}",
    "roof replacement {city}",
    "emergency roof tarping {city}",
    "storm damage roof repair {city}",
    "best roofing company {city} {state}",
    "metal roofing contractor {city}",
  ],
  toneNotes:
    "Authoritative, protective, resilient, and honest, emphasizing storm defense, insurance advocacy, and lifetime warranty protection.",
  aliases: ["roofing", "roofer", "roof repair", "roof replacement", "shingles", "metal roof"],
};

export default roofingNiche;
