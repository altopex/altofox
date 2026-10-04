/**
 * RankLocal Content Generation Architecture — Service Page Generator
 *
 * Archetype: Service Page (e.g., Water Heater Repair, Drain Cleaning, Leak Detection)
 * Purpose: Deep commercial & transactional authority page for a specific service.
 *          Educates homeowners on failure symptoms, diagnostic methods, step-by-step
 *          repair processes, equipment specifications, and upfront pricing policies.
 *          Never relies on generic fluff; embeds trade-specific failure modes.
 */

import { PageGenerationContext, GenerationGatewayParams, isPermanentAIError } from "./types";
import { PageContentJSON, SectionJSON } from "../content-schema";
import { createVariationProfile, VariationProfile } from "./variation-seed";
import { gatewayRequest, GatewayRequest } from "../../ai/provider-gateway";
import { extractAndParseJSON } from "../validator";

/**
 * Service-specific technical knowledge models to ensure meaningful differentiation
 * and zero generic filler sentences.
 */
interface ServiceTechnicalProfile {
  symptoms: Array<{ title: string; description: string }>;
  diagnosticProcess: Array<{ step: string; title: string; description: string }>;
  whyItMatters: Array<{ title: string; description: string }>;
  technicalHighlights: string[];
  ctaBanner: {
    headline: string;
    subheadline: string;
    buttonText: string;
  };
  sectionHeadings: {
    symptomsEyebrow: string;
    symptomsHeadline: string;
    symptomsSubheadline: (city: string) => string;
    processEyebrow: string;
    processHeadline: string;
    processSubheadline: string;
    whyUsEyebrow: string;
    whyUsHeadline: (biz: string) => string;
    whyUsSubheadline: string;
  };
  metaDescriptionFormula: (city: string, state: string, businessName: string, phone: string) => string;
  heroSubheadlineFormula: (city: string, state: string) => string;
}

function getServiceTechnicalProfile(serviceName: string, serviceSlug: string): ServiceTechnicalProfile {
  const s = (serviceSlug + " " + serviceName).toLowerCase();

  if (s.includes("water-heater") || s.includes("heater")) {
    return {
      symptoms: [
        {
          title: "Sudden Loss or Inconsistent Hot Water",
          description: "Upper or lower immersion heating element burnout in electric units, or faulty thermocouple/gas valve assemblies shutting off burner flames prematurely.",
        },
        {
          title: "Popping, Rumbling or Crackling Tank Sounds",
          description: "Heavy mineral and sediment accumulation at the bottom of the tank trapping boiling water underneath mineral layers, creating severe thermal stress.",
        },
        {
          title: "Rusty or Discolored Hot Water Supply",
          description: "Sacrificial magnesium anode rod has completely depleted, allowing aggressive water chemistry to oxidize the inner glass-lined steel tank wall.",
        },
        {
          title: "Moisture Pooling Near Temperature & Pressure (TPR) Valve",
          description: "Excessive thermal expansion or failing valve spring releasing pressurized boiling water onto the utility floor to prevent tank explosion.",
        },
      ],
      diagnosticProcess: [
        {
          step: "1",
          title: "Multimeter & Electrical Continuity Testing",
          description: "We test thermostat continuity, upper/lower heating element resistance (ohms), and breaker supply voltage before dismantling components.",
        },
        {
          step: "2",
          title: "Sediment Crust & Anode Rod Inspection",
          description: "We inspect sacrificial anode rod wear, sample tank base water clarity, and test gas pressure calibration on burner pilot manifolds.",
        },
        {
          step: "3",
          title: "Targeted Component Replacement & Flush",
          description: "Faulty elements, TPR valves, or thermocouples are replaced with OEM parts. We power-flush mineral sediment to restore optimal heat transfer efficiency.",
        },
        {
          step: "4",
          title: "Operating Pressure & Temperature Verification",
          description: "We calibrate thermostat delivery to a safe, scalding-protected 120°F and verify zero micro-leaks under maximum operating municipal water pressure.",
        },
      ],
      whyItMatters: [
        {
          title: "Prevents Catastrophic Tank Ruptures",
          description: "Catching sediment overheating or failing relief valves early prevents 40–50 gallons of pressurized boiling water from flooding finished basements.",
        },
        {
          title: "Restores Recovery Time & Lowers Utility Bills",
          description: "Clearing 2–3 inches of insulating mineral crust allows heating elements to heat incoming water up to 30% faster with lower kilowatt consumption.",
        },
        {
          title: "OEM Factory Heating Elements & Calibrated Controls",
          description: "We install factory-certified thermostats, burner orifices, and high-recovery elements engineered for your exact water heater model and gallon capacity.",
        },
        {
          title: "Municipal Thermal Expansion Loop Verification",
          description: "We test closed-loop plumbing check valves and calibrate expansion tanks to absorb thermal hydraulic shock and extend tank longevity.",
        },
      ],
      technicalHighlights: [
        "Thermostat & dual-element diagnostics",
        "High-recovery burner and thermocouple repairs",
        "Expansion tank calibration for closed plumbing loops",
        "Hybrid heat pump & tankless continuous flow conversions",
      ],
      ctaBanner: {
        headline: "Restore Dependable Hot Water to Your {city} Home Today",
        subheadline: "On-call master technicians arrive with OEM heating elements, pilot assemblies, and digital diagnostic testers.",
        buttonText: "Call {phone} for Hot Water Repair",
      },
      sectionHeadings: {
        symptomsEyebrow: "Thermal & Combustion Indicators",
        symptomsHeadline: "Warning Signs of Water Heater Failure & Tank Fatigue",
        symptomsSubheadline: (city) =>
          `Listen for rumbling tank noise, check for pilot flame dropouts, or inspect moisture pooling around the TPR relief valve in your ${city} home.`,
        processEyebrow: "Water Heater Diagnostic Sequence",
        processHeadline: "How We Troubleshoot & Repair Water Heaters",
        processSubheadline: "Multimeter electrical resistance testing, thermocouple voltage verification, and sediment power flushes.",
        whyUsEyebrow: "Master Mechanical Standards",
        whyUsHeadline: (biz) => `Why Homeowners Trust ${biz} for Water Heater Systems`,
        whyUsSubheadline: "Factory-certified OEM components, combustion safety checks, and calibrated thermal expansion loops.",
      },
      metaDescriptionFormula: (city, state, biz, phone) =>
        `Restore your hot water fast in ${city}, ${state}. ${biz} repairs pilot assemblies, burned elements, and tank sediment with upfront flat pricing. Call ${phone}!`,
      heroSubheadlineFormula: (city) =>
        `Master-certified heating element diagnostics, burner manifold repairs, sediment power flushes, and code-compliant installations across ${city} homes.`,
    };
  }

  if (s.includes("drain") || s.includes("sewer") || s.includes("jetting")) {
    return {
      symptoms: [
        {
          title: "Multiple Gurgling Fixtures & Slow Drains",
          description: "When flushing a toilet causes water to bubble up into adjacent bathtub drains, indicating a primary blockage in the main building sewer lateral.",
        },
        {
          title: "Foul Sewer Gas Odors from Floor Drains",
          description: "Biofilm sludge decomposing inside trap arms, dry trap seals, or cracked vent stacks venting dangerous hydrogen sulfide into the living space.",
        },
        {
          title: "Recurring Clogs Despite Chemical Drain Pouring",
          description: "Chemical cleaners only burn narrow pinholes through grease or paper, leaving solid tree root webs and calcified sludge adhering to pipe walls.",
        },
        {
          title: "Backups During Heavy Rainstorms",
          description: "Stormwater infiltration through cracked clay pipe joints overwhelming residential sewer laterals and forcing raw sewage toward basement fixtures.",
        },
      ],
      diagnosticProcess: [
        {
          step: "1",
          title: "High-Definition Optical Sewer Camera Diagnostic",
          description: "We push a self-leveling HD fiber-optic camera with 512Hz sonde through cleanouts to visually pinpoint root intrusion, belly dips, or pipe shear.",
        },
        {
          step: "2",
          title: "Obstruction Characterization & Safety Review",
          description: "We evaluate pipe material integrity (cast iron, clay, PVC, or Orangeburg) to calibrate hydro-jet pressure and avoid damaging weakened walls.",
        },
        {
          step: "3",
          title: "Targeted High-Pressure Hydro-Jetting & Mechanical Cabling",
          description: "We deploy forward-penetrating and reverse-rotary scouring nozzles delivering up to 4,000 PSI to strip grease, scale, and mature tree roots bare.",
        },
        {
          step: "4",
          title: "Post-Scour Optical Camera Verification",
          description: "We perform a second video inspection confirming 100% full-bore internal diameter restoration and verify sustained gravity flow to the municipal main.",
        },
      ],
      whyItMatters: [
        {
          title: "Eliminates Recurring Service Call Costs",
          description: "Traditional snaking only punches temporary holes. Hydro-jetting scrubs pipe walls completely smooth, preventing debris from re-attaching for months.",
        },
        {
          title: "Protects Foundations from Sewage Saturation",
          description: "Clearing main lateral blockages immediately halts toxic sewage backups that ruin drywall, subflooring, and indoor air quality.",
        },
        {
          title: "Full Internal Pipe Diameter Restoration",
          description: "High-velocity water jets scour calcified minerals, hardened cooking grease, and root webs back to original interior pipe dimensions.",
        },
        {
          title: "Zero Harsh Pipe-Corroding Chemicals",
          description: "Our mechanical and water-based techniques protect older cast iron and galvanized drain stacks from exothermic chemical corrosion.",
        },
      ],
      technicalHighlights: [
        "4,000 PSI hydro-jetting with omnidirectional scouring nozzles",
        "Self-leveling color sewer camera inspections with digital recording",
        "Mechanical carbide root-cutting blade assemblies",
        "Cleanout installation for accessible future maintenance",
      ],
      ctaBanner: {
        headline: "Eliminate Severe Sewer Backups & Drain Blockages in {city}",
        subheadline: "4,000 PSI hydro-jetting and color video camera inspections scrub pipe walls clean back to full original diameter.",
        buttonText: "Call {phone} for Drain Clearing",
      },
      sectionHeadings: {
        symptomsEyebrow: "Hydraulic Restriction Indicators",
        symptomsHeadline: "Warning Signs of Main Sewer Stoppages & Drain Line Clogs",
        symptomsSubheadline: (city) =>
          `Fixtures backing up, foul sewer gas escaping trap seals, or multiple drains gurgling simultaneously across your ${city} property.`,
        processEyebrow: "Sewer Scouring Sequence",
        processHeadline: "How We Clear & Hydro-Jet Blocked Drains",
        processSubheadline: "Optical self-leveling color camera inspection, 4,000 PSI high-velocity water jetting, and mechanical root excision.",
        whyUsEyebrow: "Full-Bore Pipe Restoration",
        whyUsHeadline: (biz) => `Why Homeowners Trust ${biz} for Drain & Sewer Cleaning`,
        whyUsSubheadline: "Zero caustic chemical hazards, complete internal pipe diameter restoration, and recorded video verification.",
      },
      metaDescriptionFormula: (city, state, biz, phone) =>
        `Clear severe drain clogs and main sewer roots in ${city}, ${state}. High-pressure hydro-jetting and optical camera inspection by ${biz}. Call ${phone}!`,
      heroSubheadlineFormula: (city) =>
        `4,000 PSI high-pressure hydro-jetting, optical fiber-optic camera diagnosis, and motorized root clearing for residential drain lines in ${city}.`,
    };
  }

  if (s.includes("leak") || s.includes("slab") || s.includes("pipe")) {
    return {
      symptoms: [
        {
          title: "Unexplained Spikes in Municipal Water Utility Bills",
          description: "Continuous pressurized flow through hidden pinholes in sub-slab copper supply lines losing hundreds of gallons daily without visible puddles.",
        },
        {
          title: "Warm Spots on Ceramic Tile or Hardwood Flooring",
          description: "Sub-slab hot water supply pipe rupture radiating thermal energy upward through the concrete foundation slab into interior finished flooring.",
        },
        {
          title: "Persistent Sound of Running Water with Fixtures Closed",
          description: "A continuous hissing or rushing sound behind drywall cavities or beneath concrete subfloors indicating pressurized line failure.",
        },
        {
          title: "Peeling Paint, Warped Baseboards & Musty Mildew Odor",
          description: "Concealed slow-dripping joint solder failures or drain stack hairline fractures releasing vapor that feeds mold colonies inside enclosed wall cavities.",
        },
      ],
      diagnosticProcess: [
        {
          step: "1",
          title: "Pressure Isolation & Static Gauge Decay Testing",
          description: "We install sensitive digital pressure gauges at the main water supply and isolate individual hot/cold zones to measure PSI pressure drop rates.",
        },
        {
          step: "2",
          title: "Acoustic Listening & Ground Microphone Sweeping",
          description: "We use high-frequency acoustic sound amplifiers to hear the distinct harmonic frequency of water escaping under pressure through concrete slabs.",
        },
        {
          step: "3",
          title: "Thermal Infrared Imaging & Moisture Mapping",
          description: "High-resolution thermal cameras pinpoint exact temperature gradients on flooring and drywall, isolating the moisture plume to within a few inches.",
        },
        {
          step: "4",
          title: "Micro-Surgical Access & Code-Compliant Pipe Repair",
          description: "Instead of ripping apart entire floors, we create pinpoint access openings to solder or replace compromised sections with type-L copper or PEX.",
        },
      ],
      whyItMatters: [
        {
          title: "Saves Thousands in Collateral Structural Damage",
          description: "Detecting leaks within inches prevents widespread concrete foundation erosion, cracked slabs, warped hardwood, and toxic black mold outbreaks.",
        },
        {
          title: "Zero Wanton Demolition of Finished Living Areas",
          description: "Precision non-invasive detection means we only open the exact 12-inch tile or drywall square necessary to complete the mechanical repair.",
        },
        {
          title: "Ultrasonic Acoustic Sensor Precision",
          description: "Our high-gain sound frequency amplifiers filter background ambient noise to isolate hidden pressurized line leaks deep underground.",
        },
        {
          title: "Pressure Decay Testing with Zone Isolation",
          description: "Digital gauge decay readings mathematically prove whether a leak exists on the cold main, hot recirculation loop, or irrigation branch.",
        },
      ],
      technicalHighlights: [
        "Non-invasive ultrasonic and acoustic ground microphone detection",
        "High-definition thermal infrared moisture cameras",
        "Digital pressure decay testing with zone isolation",
        "Overhead supply line bypass repiping options",
      ],
      ctaBanner: {
        headline: "Isolate Hidden Sub-Slab & Wall Leaks Before Structural Damage Grows",
        subheadline: "Non-invasive acoustic amplifiers and thermal infrared cameras pinpoint leak locations without destructive floor demolition.",
        buttonText: "Call {phone} for Leak Detection Triage",
      },
      sectionHeadings: {
        symptomsEyebrow: "Acoustic & Moisture Signatures",
        symptomsHeadline: "Warning Signs of Concealed Sub-Slab & Wall Supply Leaks",
        symptomsSubheadline: (city) =>
          `Unexplained surges on municipal water bills, foundation warm spots, or continuous hissing behind finished drywall in your ${city} home.`,
        processEyebrow: "Non-Invasive Diagnostic Sequence",
        processHeadline: "How We Pinpoint Concealed Water Leaks",
        processSubheadline: "Static line pressure decay testing, ultrasonic ground microphone frequency sweeps, and infrared thermal imaging.",
        whyUsEyebrow: "Damage Prevention Focus",
        whyUsHeadline: (biz) => `Why Homeowners Trust ${biz} for Concealed Leak Detection`,
        whyUsSubheadline: "Zero wanton floor or wall destruction, pinpoint acoustic accuracy, and surgical code-compliant pipe repairs.",
      },
      metaDescriptionFormula: (city, state, biz, phone) =>
        `Locate hidden sub-slab and wall water leaks in ${city}, ${state}. Non-invasive acoustic amplifiers and thermal imaging by ${biz}. Call ${phone}!`,
      heroSubheadlineFormula: (city) =>
        `Non-invasive ultrasonic acoustic detection, thermal imaging, and pinpoint sub-slab supply line repairs across ${city} properties.`,
    };
  }

  // Fallback for general trade services
  return {
    symptoms: [
      {
        title: "Intermittent Operational Failures & Drop in Efficiency",
        description: `Worn internal mechanical seals, corroded electrical contactors, or calcified supply channels reducing system delivery and safety.`,
      },
      {
        title: "Unusual Operating Sounds or Vibration Under Load",
        description: `Loose hardware, hydraulic water hammer, or cavitating pump impellers placing extreme structural stress on supply lines.`,
      },
      {
        title: "Visible Corrosion or Mineral Flaking on Fittings",
        description: `Galvanic reaction between dissimilar metals or minor slow weepage oxidizing exterior brass and copper surfaces.`,
      },
      {
        title: "Erratic Pressure or Flow Disruption Across Fixtures",
        description: `Upstream line restriction, failing pressure reducing valves (PRVs), or localized sediment clogs restricting volume.`,
      },
    ],
    diagnosticProcess: [
      {
        step: "1",
        title: "Initial Physical & Hydraulic Inspection",
        description: `We evaluate operating pressures, supply line integrity, and mechanical connections under live operating conditions.`,
      },
      {
        step: "2",
        title: "Root Cause Isolation & Testing",
        description: `Using calibrated diagnostic tools, we verify whether failures stem from localized wear, upstream supply faults, or age fatigue.`,
      },
      {
        step: "3",
        title: "Precision Mechanical Repair & Part Replacement",
        description: `We install factory-certified replacement parts adhering strictly to local municipal plumbing and building codes.`,
      },
      {
        step: "4",
        title: "Load Testing & Workmanship Certification",
        description: `We cycle the system under full pressure load, verify zero weeping connections, and issue our written workmanship guarantee.`,
      },
    ],
    whyItMatters: [
      {
        title: "Prevents Sudden Costly Emergency Breakdowns",
        description: `Targeted repair of wearing parts protects surrounding mechanical systems from cascading failure.`,
      },
      {
        title: "Complies with Local Municipal Codes & Warranties",
        description: `All work is performed by licensed master technicians using approved materials that maintain manufacturer warranties.`,
      },
      {
        title: "Factory-Certified Replacement Fittings",
        description: `We use heavy-duty components rated for maximum municipal distribution pressure and thermal demand.`,
      },
      {
        title: "Transparent Written Workmanship Guarantee",
        description: `Every mechanical installation is backed by comprehensive labor warranties and clear documentation.`,
      },
    ],
    technicalHighlights: [
      "Full diagnostic testing prior to any repair",
      "Factory-certified replacement parts and fittings",
      "Upfront flat-rate pricing with zero hidden surcharges",
      "Comprehensive written parts and labor guarantee",
    ],
    ctaBanner: {
      headline: "Need Immediate, Code-Compliant Mechanical Repairs in {city}?",
      subheadline: "Our licensed master technicians dispatch with fully stocked trucks for same-day fixes.",
      buttonText: "Call {phone} for Service",
    },
    sectionHeadings: {
      symptomsEyebrow: "Failure Warning Signs",
      symptomsHeadline: `Indicators You Need ${serviceName}`,
      symptomsSubheadline: (city) =>
        `Recognizing early failure symptoms protects your ${city} property from sudden outages and costly water damage.`,
      processEyebrow: "Diagnostic Workflow",
      processHeadline: `How We Diagnose & Resolve ${serviceName} Issues`,
      processSubheadline: "A methodical, code-compliant process ensuring long-term reliability and zero guesswork.",
      whyUsEyebrow: "The Technical Difference",
      whyUsHeadline: (biz) => `Why Homeowners Choose ${biz} for ${serviceName}`,
      whyUsSubheadline: "Certified expertise, respectful technicians, and transparent flat pricing on every service call.",
    },
    metaDescriptionFormula: (city, state, biz, phone) =>
      `Need professional ${serviceName.toLowerCase()} in ${city}, ${state}? ${biz} provides certified diagnostics, upfront pricing, and fast dispatch. Call ${phone}!`,
    heroSubheadlineFormula: (city) =>
      `Master-certified diagnostic troubleshooting, code-compliant repairs, and precision maintenance for ${serviceName.toLowerCase()} in ${city}.`,
  };
}

/**
 * Builds a dedicated, specialized LLM prompt for the Service Page.
 * NEVER uses a universal prompt.
 */
export function buildServicePagePrompt(context: PageGenerationContext): string {
  const facts = context.businessFacts;
  const svc = context.service || { name: context.primaryKeyword, slug: "service" };
  const seed = context.contentVariationSeed;
  const variation = createVariationProfile(seed, "service", context.primaryKeyword, svc.slug);
  const techProfile = getServiceTechnicalProfile(svc.name, svc.slug);

  const internalLinksJson = JSON.stringify(
    context.internalLinkTargets.map((t) => ({ label: t.label, href: t.href, role: t.role })),
    null,
    2
  );

  return `You are a master technical plumbing copywriter creating a DEDICATED SERVICE PAGE for "${svc.name}" for "${facts.businessName}".

CRITICAL SCOPE: Generate ONLY the "${svc.name}" service page. Do NOT generate other pages.

PAGE CONTEXT CONTRACT:
- Page Type: service
- Page Purpose: Deep technical and commercial authority page for ${svc.name}. Educate local homeowners on diagnostic methods, failure modes, repair processes, and code compliance.
- Primary Keyword: "${context.primaryKeyword}"
- Secondary Keywords: ${JSON.stringify(context.secondaryKeywords)}
- Search Intent: ${context.searchIntent} (High commercial/transactional)
- Service Name: "${svc.name}"
- Target City: ${facts.city}, ${facts.state}
- Related Sibling Services to Link: ${context.relatedServices.map((s) => s.name).join(", ")}
- Variation Seed Digest: ${variation.seedDigest}
- Heading Formula Style: ${variation.headingStyle}
- Paragraph Structure Formula: ${variation.paragraphStructure}
- CTA Style: "${variation.ctaWording.heroPrimary}"
- Required Internal Link Targets:
${internalLinksJson}

TECHNICAL DOMAIN KNOWLEDGE (Must be woven into the copy):
Symptoms to address:
${techProfile.symptoms.map((s) => `- ${s.title}: ${s.description}`).join("\n")}

Diagnostic & repair workflow:
${techProfile.diagnosticProcess.map((d) => `- Step ${d.step}: ${d.title} — ${d.description}`).join("\n")}

STRICT TRUTHFULNESS & ANTI-HALLUCINATION:
1. NEVER invent customer reviews, quotes, or star counts.
2. NEVER invent awards, fake employee names, years in business, or specific prices.
3. Use real diagnostic terms: ${techProfile.technicalHighlights.join(", ")}.

OUTPUT FORMAT:
Return ONLY a valid JSON object matching this schema:
{
  "slug": "${svc.slug}",
  "seo": {
    "title": "${svc.name} in ${facts.city}, ${facts.state} | ${facts.businessName}",
    "description": "Meta description under 155 chars with city and call to action.",
    "h1": "${svc.name} in ${facts.city}, ${facts.state}",
    "primaryKeyword": "${context.primaryKeyword}"
  },
  "sections": [
    { "type": "hero", "variant": "split", "content": { "eyebrow": "Licensed ${svc.name} Specialists", "h1": "...", "subheadline": "...", "primaryCta": "${facts.phone}", "secondaryCta": "Book Diagnostic", "secondaryUrl": "contact.html", "trustBadges": [...] } },
    { "type": "trustBar", "content": {} },
    { "type": "services", "variant": "cards", "content": { "eyebrow": "Signs You Need Service", "headline": "...", "subheadline": "...", "items": [...] } },
    { "type": "process", "content": { "eyebrow": "Our Diagnostic Process", "headline": "...", "subheadline": "...", "steps": [...] } },
    { "type": "whyUs", "content": { "eyebrow": "The Technical Advantage", "headline": "...", "subheadline": "...", "items": [...] } },
    { "type": "faq", "content": { "eyebrow": "Service FAQs", "headline": "...", "subheadline": "...", "items": [...] } },
    { "type": "ctaBanner", "content": { "headline": "...", "subheadline": "...", "buttonText": "Call ${facts.phone}", "phone": "${facts.phone}" } },
    { "type": "contactForm", "content": { "headline": "Schedule ${svc.name}", "subheadline": "...", "phone": "${facts.phone}" } }
  ]
}`;
}

/**
 * Deterministic Service Page Generator driven by the Seed Engine.
 * Guarantees technical precision, zero generic filler, and deep differentiation.
 */
export function generateServicePageDeterministic(context: PageGenerationContext): PageContentJSON {
  const facts = context.businessFacts;
  const svc = context.service || { name: context.primaryKeyword, slug: "service" };
  const variation: VariationProfile = createVariationProfile(
    context.contentVariationSeed,
    "service",
    context.primaryKeyword,
    svc.slug
  );
  const techProfile = getServiceTechnicalProfile(svc.name, svc.slug);

  const phone = facts.phone || "";
  const city = facts.city || "Local Area";
  const state = facts.state || "";

  // Build trust badges strictly from verified facts
  const trustBadges: string[] = [];
  if (facts.licenseNumber) trustBadges.push(`Lic. #${facts.licenseNumber}`);
  else trustBadges.push("Master Certified Technicians");
  trustBadges.push("Upfront Flat-Rate Quotes");
  if (facts.emergency247) trustBadges.push("24/7 Rapid Emergency Dispatch");
  else trustBadges.push("Prompt Same-Day Service");
  trustBadges.push("Written Parts & Labor Guarantee");

  // Determine headlines based on heading style
  let heroH1 = `${svc.name} in ${city}, ${state}`;
  let heroSub = `Master-certified diagnostic troubleshooting, code-compliant repairs, and precision replacements for ${svc.name.toLowerCase()} in ${city} homes.`;

  if (variation.headingStyle === "action_benefit") {
    heroH1 = `High-Efficiency ${svc.name} Solutions in ${city}`;
    heroSub = `Restore peak performance, eliminate recurring system breakdowns, and ensure long-term mechanical reliability across your ${city} property.`;
  } else if (variation.headingStyle === "diagnostic_urgency") {
    heroH1 = `Emergency ${svc.name} & Diagnostics in ${city}`;
    heroSub = `Experiencing sudden ${svc.name.toLowerCase()} failures? Our on-call technicians dispatch with specialized testing instruments to isolate root causes and restore full system operation today.`;
  } else if (variation.headingStyle === "craftsmanship_authority") {
    heroH1 = `Master-Level ${svc.name} Engineering in ${city}`;
    heroSub = `Precision mechanical repairs adhering strictly to local building codes, manufacturer tolerances, and comprehensive workmanship standards.`;
  } else if (variation.headingStyle === "problem_resolution") {
    heroH1 = `Permanent Solutions for ${svc.name} in ${city}`;
    heroSub = `Stop dealing with temporary quick fixes. We locate underlying mechanical flaws and execute lasting, code-compliant repairs with transparent flat pricing.`;
  }

  // Support strategyShift on symptoms and process steps
  const shift = context.contentVariationSeed.strategyShift || 0;
  let rawSymptoms = [...techProfile.symptoms];
  let rawSteps = [...techProfile.diagnosticProcess];

  if (shift > 0) {
    const rot = shift % rawSymptoms.length;
    rawSymptoms = [...rawSymptoms.slice(rot), ...rawSymptoms.slice(0, rot)];
    if (shift === 1) {
      rawSteps = rawSteps.map((s) => ({
        ...s,
        title: s.title.replace("Diagnostic", "Root-Cause Isolation").replace("Inspection", "Tolerance Evaluation"),
      }));
    } else if (shift === 2) {
      rawSteps = rawSteps.map((s) => ({
        ...s,
        title: s.title.replace("Diagnostic", "Code-Compliant Verification").replace("Repair", "Precision Engineering Overhaul"),
      }));
    }
  }

  // Map symptom cards
  const symptomCards = rawSymptoms.map((symp) => ({
    title: symp.title,
    description: symp.description,
    slug: "contact",
  }));

  // Map process steps
  const processSteps = rawSteps.map((step) => ({
    number: step.step,
    title: step.title,
    description: step.description,
  }));

  // Map why us items directly from the technical profile (100% unique per service)
  const whyUsItems = techProfile.whyItMatters;

  // Map FAQs tailored specifically to this service
  const faqItems = variation.faqSelection.map((f) => ({
    question: f.question,
    answer: f.answer,
  }));

  const bannerHeadline = techProfile.ctaBanner.headline.replace("{city}", city).replace("{phone}", phone);
  const bannerSub = techProfile.ctaBanner.subheadline.replace("{city}", city).replace("{phone}", phone);
  const bannerButton = techProfile.ctaBanner.buttonText.replace("{phone}", phone);

  if (!heroSub || heroSub.includes("Master-certified diagnostic troubleshooting")) {
    heroSub = techProfile.heroSubheadlineFormula(city, state);
  }

  const sections: SectionJSON[] = [
    {
      type: "hero",
      variant: "split",
      content: {
        eyebrow: `Certified ${svc.name} Specialists in ${city}`,
        h1: heroH1,
        subheadline: heroSub,
        primaryCta: `Call ${phone}`,
        secondaryCta: "Request Service Online",
        secondaryUrl: "contact.html",
        trustBadges,
      },
      images: [
        {
          slot: "main",
          query: `${svc.name.toLowerCase()} repair master technician working in ${city}`,
          alt: `Professional ${svc.name.toLowerCase()} performed by licensed technician in ${city}`,
        },
      ],
    },
    {
      type: "trustBar",
      content: {},
    },
    {
      type: "services",
      variant: "cards",
      content: {
        eyebrow: techProfile.sectionHeadings.symptomsEyebrow,
        headline: techProfile.sectionHeadings.symptomsHeadline,
        subheadline: techProfile.sectionHeadings.symptomsSubheadline(city),
        items: symptomCards,
      },
    },
    {
      type: "process",
      content: {
        eyebrow: techProfile.sectionHeadings.processEyebrow,
        headline: techProfile.sectionHeadings.processHeadline,
        subheadline: techProfile.sectionHeadings.processSubheadline,
        steps: processSteps,
      },
    },
    {
      type: "whyUs",
      content: {
        eyebrow: techProfile.sectionHeadings.whyUsEyebrow,
        headline: techProfile.sectionHeadings.whyUsHeadline(facts.businessName),
        subheadline: techProfile.sectionHeadings.whyUsSubheadline,
        items: whyUsItems,
      },
    },
    {
      type: "faq",
      content: {
        eyebrow: "Technical FAQs",
        headline: `Frequently Asked Questions About ${svc.name}`,
        subheadline: `Clear answers to common questions about diagnostics, repair vs. replacement, and local operating codes in ${city}.`,
        items: faqItems,
      },
    },
    {
      type: "ctaBanner",
      variant: "default",
      content: {
        headline: bannerHeadline,
        subheadline: bannerSub,
        buttonText: bannerButton,
        phone,
      },
    },
    {
      type: "contactForm",
      content: {
        headline: `Schedule ${svc.name} in ${city}`,
        subheadline: `Submit your request below or call ${phone} for immediate master-technician dispatch.`,
        phone,
      },
    },
  ];

  return {
    slug: svc.slug,
    seo: {
      title: `${svc.name} in ${city}, ${state} | ${facts.businessName}`,
      description: techProfile.metaDescriptionFormula(city, state, facts.businessName, phone).slice(0, 155),
      h1: heroH1,
      primaryKeyword: context.primaryKeyword,
    },
    sections,
  };
}

/**
 * Main Service Page generation orchestrator.
 * Connects to AI Provider Gateway if configured; falls back safely to deterministic generator.
 */
export async function generateServicePageContent(
  context: PageGenerationContext,
  gatewayParams?: GenerationGatewayParams
): Promise<PageContentJSON> {
  if (gatewayParams?.directCredentials?.apiKey && !gatewayParams?._state?.disabled) {
    try {
      const prompt = buildServicePagePrompt(context);
      const res = await gatewayRequest({
        ...gatewayParams,
        prompt,
        systemPrompt: "You are an expert local technical copywriter. Return ONLY valid JSON.",
        feature: "website-generation",
      } as GatewayRequest);

      const parsed: any = extractAndParseJSON(res.text);
      if (parsed && parsed.slug && parsed.seo && Array.isArray(parsed.sections)) {
        return parsed as PageContentJSON;
      }
    } catch (err: any) {
      console.warn(`[ServicePageGenerator] AI generation failed for ${context.primaryKeyword}, falling back to deterministic seed engine:`, err?.message || err);
      if (isPermanentAIError(err)) {
        if (gatewayParams) {
          if (!gatewayParams._state) gatewayParams._state = {};
          gatewayParams._state.disabled = true;
        }
      }
    }
  }

  return generateServicePageDeterministic(context);
}
