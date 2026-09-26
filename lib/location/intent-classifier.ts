import { SearchIntentCategory, IntentProfile } from "./types";

/**
 * Classifies search intent for a local service page
 */
export function classifySearchIntent(serviceName: string, queryOrKeywords = ""): IntentProfile {
  const combined = `${serviceName} ${queryOrKeywords}`.toLowerCase();

  if (
    combined.includes("emergency") ||
    combined.includes("burst") ||
    combined.includes("urgent") ||
    combined.includes("24/7") ||
    combined.includes("flood") ||
    combined.includes("overflow") ||
    combined.includes("no heat") ||
    combined.includes("no power")
  ) {
    return {
      category: "emergency",
      urgencyLevel: "high",
      primaryGoal: "Immediate containment, safety verification, and rapid professional dispatch",
      recommendedSections: [
        "immediate_actions",
        "emergency_dispatch",
        "common_emergencies",
        "technician_scope",
        "local_faq",
      ],
      sampleQuestions: [
        "What should I do immediately while waiting for the emergency technician?",
        "How fast can an emergency crew reach my neighborhood?",
        "Are emergency services available after hours and on weekends?",
      ],
      ctaEmphasis: "call_now",
    };
  }

  if (
    combined.includes("replace") ||
    combined.includes("replacement") ||
    combined.includes("new unit") ||
    combined.includes("upgrade")
  ) {
    return {
      category: "replacement",
      urgencyLevel: "medium",
      primaryGoal: "Evaluating repair vs replacement criteria, efficiency options, and professional installation",
      recommendedSections: [
        "replacement_indicators",
        "equipment_options",
        "installation_process",
        "efficiency_savings",
        "local_faq",
      ],
      sampleQuestions: [
        "How do I know if my system should be repaired or completely replaced?",
        "What energy-efficiency ratings or unit sizes are best for regional homes?",
        "Are municipal building permits required for replacement in this area?",
      ],
      ctaEmphasis: "schedule_estimate",
    };
  }

  if (
    combined.includes("maintenance") ||
    combined.includes("cleaning") ||
    combined.includes("tune up") ||
    combined.includes("tune-up") ||
    combined.includes("drain cleaning") ||
    combined.includes("flush") ||
    combined.includes("service check")
  ) {
    return {
      category: "maintenance",
      urgencyLevel: "standard",
      primaryGoal: "Preventive upkeep, system optimization, and avoiding costly catastrophic failures",
      recommendedSections: [
        "maintenance_benefits",
        "warning_signs",
        "inspection_checklist",
        "preventive_schedule",
        "local_faq",
      ],
      sampleQuestions: [
        "How often should routine maintenance be performed for local properties?",
        "What symptoms indicate a professional cleaning is overdue?",
        "What diagnostic equipment or methods are used during a service visit?",
      ],
      ctaEmphasis: "book_inspection",
    };
  }

  if (
    combined.includes("install") ||
    combined.includes("installation") ||
    combined.includes("setup") ||
    combined.includes("panel upgrade") ||
    combined.includes("wiring")
  ) {
    return {
      category: "installation",
      urgencyLevel: "standard",
      primaryGoal: "Professional code-compliant installation, sizing, and long-term durability",
      recommendedSections: [
        "installation_overview",
        "planning_and_sizing",
        "step_by_step_install",
        "warranty_and_codes",
        "local_faq",
      ],
      sampleQuestions: [
        "What preparation is needed prior to installation day?",
        "Do you handle all necessary local municipal inspections?",
        "What manufacturer warranties accompany new installations?",
      ],
      ctaEmphasis: "schedule_estimate",
    };
  }

  if (
    combined.includes("leak detection") ||
    combined.includes("camera inspection") ||
    combined.includes("audit") ||
    combined.includes("diagnostic") ||
    combined.includes("testing")
  ) {
    return {
      category: "diagnostic",
      urgencyLevel: "medium",
      primaryGoal: "Accurate non-destructive problem pinpointing without damaging property structures",
      recommendedSections: [
        "diagnostic_methods",
        "signs_of_hidden_issues",
        "inspection_workflow",
        "next_step_repairs",
        "local_faq",
      ],
      sampleQuestions: [
        "Can you pinpoint issues without tearing open drywall or digging up landscaping?",
        "What equipment is used to detect hidden leaks or faults?",
        "Will I receive a written diagnostic report with upfront repair pricing?",
      ],
      ctaEmphasis: "book_inspection",
    };
  }

  if (
    combined.includes("repair") ||
    combined.includes("fix") ||
    combined.includes("clog") ||
    combined.includes("troubleshoot")
  ) {
    return {
      category: "repair",
      urgencyLevel: "medium",
      primaryGoal: "Diagnosing malfunction cause, restoring proper operation, and flat-rate resolution",
      recommendedSections: [
        "common_malfunctions",
        "when_to_call",
        "troubleshooting_steps",
        "repair_process",
        "local_faq",
      ],
      sampleQuestions: [
        "What are the most common causes of this specific failure in local homes?",
        "Can a homeowner attempt safe troubleshooting before calling a pro?",
        "Do you provide a flat-rate estimate before commencing repairs?",
      ],
      ctaEmphasis: "call_now",
    };
  }

  return {
    category: "general",
    urgencyLevel: "standard",
    primaryGoal: "Comprehensive professional trade service, honest upfront pricing, and local coverage",
    recommendedSections: [
      "service_scope",
      "local_standards",
      "process_steps",
      "why_choose_local",
      "local_faq",
    ],
    sampleQuestions: [
      "What areas and neighborhoods do you service nearby?",
      "Are your technicians licensed and insured in this jurisdiction?",
      "How do your estimates and pricing policies work?",
    ],
    ctaEmphasis: "call_now",
  };
}

/**
 * Generates natural title tag variations matching search intent and avoiding robotic repetitive patterns
 */
export function generateVariedMetaTitle(
  service: string,
  city: string,
  state: string,
  businessName: string,
  intent: SearchIntentCategory,
  variationIndex = 0
): string {
  const variations: Record<SearchIntentCategory, string[]> = {
    emergency: [
      `Emergency ${service} in ${city}, ${state} | 24/7 ${businessName}`,
      `${service} in ${city} | Fast Emergency Dispatch | ${businessName}`,
      `24/7 ${service} in ${city}, ${state} - Call ${businessName}`,
      `Urgent ${service} in ${city} | Rapid Arrival | ${businessName}`,
    ],
    replacement: [
      `${service} in ${city}, ${state} | Upfront Estimates | ${businessName}`,
      `Trusted ${service} in ${city} | ${businessName}`,
      `${service} Experts in ${city}, ${state} | ${businessName}`,
      `Professional ${service} in ${city} | Full Warranty | ${businessName}`,
    ],
    repair: [
      `${service} in ${city}, ${state} | Licensed Techs | ${businessName}`,
      `Reliable ${service} in ${city} | Same-Day Service | ${businessName}`,
      `${service} in ${city}, ${state} - Prompt Flat-Rate Service`,
      `Local ${service} in ${city} | Upfront Pricing | ${businessName}`,
    ],
    maintenance: [
      `${service} in ${city}, ${state} | Thorough Inspection | ${businessName}`,
      `Preventive ${service} in ${city} | ${businessName}`,
      `${service} Specialists in ${city}, ${state} | ${businessName}`,
      `Professional ${service} in ${city} | Protect Your Home`,
    ],
    installation: [
      `${service} in ${city}, ${state} | Code-Compliant Install | ${businessName}`,
      `Expert ${service} in ${city} | Free Estimates | ${businessName}`,
      `Certified ${service} in ${city}, ${state} | ${businessName}`,
      `${service} in ${city} | Precision Workmanship | ${businessName}`,
    ],
    diagnostic: [
      `Accurate ${service} in ${city}, ${state} | Non-Invasive Diagnostics`,
      `${service} in ${city} | Precision Inspection | ${businessName}`,
      `Professional ${service} in ${city}, ${state} | ${businessName}`,
      `${service} in ${city} | Advanced Equipment & Clear Reports`,
    ],
    general: [
      `${service} in ${city}, ${state} | ${businessName}`,
      `Trusted ${service} in ${city} | Licensed & Insured`,
      `${service} Services in ${city}, ${state} | ${businessName}`,
      `Local ${service} in ${city} | Upfront Quotes | ${businessName}`,
    ],
  };

  const list = variations[intent] || variations.general;
  const chosen = list[variationIndex % list.length];
  // Ensure title fits under 60 chars where possible
  if (chosen.length <= 60) return chosen;
  return `${service} in ${city}, ${state} | ${businessName}`.slice(0, 60);
}

/**
 * Generates engaging, direct intro paragraph establishing service, location, need, and action
 * Strictly avoids robotic generic AI intros like "Are you looking for a reliable..."
 */
export function generateDirectIntroParagraph(
  service: string,
  city: string,
  state: string,
  county: string,
  intent: SearchIntentCategory,
  phone: string,
  assignedAngle: string,
  variationIndex = 0
): string {
  const v = Math.abs(variationIndex);

  switch (intent) {
    case "emergency": {
      const emergencyIntros = [
        `When unexpected plumbing or utility failures threaten your ${city} property, immediate action protects your structure from escalating damage. Our licensed technicians provide priority emergency dispatch throughout ${city} and across ${county} County, arriving fully equipped with diagnostic tools to isolate problems and restore safe operation. Call ${phone} for prompt local dispatch.`,
        `A sudden water line rupture, severe backup, or fixture failure in ${city} requires rapid on-site containment before structural materials absorb moisture. Our emergency dispatch team routes our nearest equipped service truck directly to your ${city} home to halt active leaks, evaluate safety, and provide upfront flat-rate resolution. Call ${phone} immediately for dispatch.`,
        `Plumbing emergencies rarely happen at convenient times. If your ${city}, ${state} residence is facing an uncontrolled water leak or primary drain stoppage, our 24/7 priority response crew arrives with non-destructive diagnostic tools to isolate the failure quickly and restore normal household function. Connect with us at ${phone} for fast emergency assistance.`,
        `Halting water damage and restoring sanitary conditions in ${city} demands fast, decisive action. We coordinate priority emergency service across ${county} County, isolating failed lines, depressurizing compromised zones, and executing code-compliant repairs with zero hidden overtime fees. Reach our emergency desk now at ${phone}.`,
      ];
      return emergencyIntros[v % emergencyIntros.length];
    }

    case "replacement": {
      const replacementIntros = [
        `Replacing an aging or inefficient system is one of the most critical investments you can make for your ${city} home. Whether your existing equipment has suffered recurring breakdowns or reached the end of its useful lifespan, we provide transparent sizing recommendations, local code compliance, and precision installation throughout ${city} and surrounding ${county} County communities.`,
        `When recurring repair bills begin outpacing the value of your equipment, upgrading to a modern, high-efficiency system delivers dependable comfort and lower monthly utility costs in ${city}. We conduct thorough capacity evaluations, assist with local municipal permitting, and deliver turnkey replacement backed by comprehensive warranties.`,
        `Choosing the right replacement equipment for your ${city}, ${state} residence requires careful consideration of household demand, regional water chemistry, and energy standards. Our licensed specialists walk you through clear equipment tiers, explain efficiency ratings, and execute seamless installations that safeguard your property.`,
        `Outdated utility systems in ${city} often operate far below their original efficiency specifications while posing unexpected breakdown risks. We provide straightforward equipment assessments, transparent written quotes with no surprise charges, and professional installation that complies strictly with ${county} County building codes.`,
      ];
      return replacementIntros[v % replacementIntros.length];
    }

    case "maintenance": {
      const maintenanceIntros = [
        `Regular, professional ${service.toLowerCase()} keeps residential and commercial systems running at peak efficiency while preventing unexpected disruptions across ${city}. Our comprehensive inspection and preventive maintenance protocols are designed for regional water and climate conditions, helping homeowners in ${county} County maximize equipment longevity and avoid costly emergency repairs.`,
        `Preventative care is the single most effective way to protect your mechanical and plumbing assets in ${city}, ${state}. Through precision cleaning, component calibration, and multi-point safety testing, our experienced technicians identify developing wear before it triggers inconvenient system shutdowns or water damage.`,
        `Over time, mineral sediment, friction, and everyday usage degrade the operating efficiency of home utility systems in ${city}. Our scheduled maintenance programs thoroughly inspect mechanical clearances, flush accumulated deposits, and verify safety controls across ${county} County to ensure dependable year-round performance.`,
      ];
      return maintenanceIntros[v % maintenanceIntros.length];
    }

    case "diagnostic": {
      const diagnosticIntros = [
        `Persistent utility symptoms—such as unexplained pressure drops, hidden moisture, or unusual noises—require accurate diagnostic evaluation before repairs begin. Serving homeowners and facility managers in ${city} and ${county} County, our certified specialists use non-destructive detection methods to identify the root cause without invasive property disruption.`,
        `Uncovering concealed leaks or electrical and mechanical faults in ${city} homes requires specialized diagnostic technology rather than guesswork. Using calibrated acoustic sensors, digital pressure profiling, and thermal imaging, our technicians pinpoint the exact location and scope of the problem to guide targeted, cost-effective repairs.`,
        `When unusual odors, rising water bills, or damp drywall appear in your ${city}, ${state} property, timely diagnosis prevents widespread structural degradation. We arrive with non-invasive diagnostic tools to inspect lines thoroughly, presenting you with a clear written evaluation and flat-rate repair options before any work starts.`,
      ];
      return diagnosticIntros[v % diagnosticIntros.length];
    }

    case "installation": {
      const installationIntros = [
        `A quality ${service.toLowerCase()} requires meticulous planning, proper sizing, and strict adherence to municipal building codes in ${city}, ${state}. From initial consultation through final safety verification, our experienced team ensures your new installation operates reliably, safely, and with full manufacturer warranty protection across ${county} County.`,
        `Proper installation is paramount to achieving the full operational lifespan and rated efficiency of new equipment in ${city}. Our licensed contractors coordinate all required local permits, prepare safe mechanical and utility connections, and perform comprehensive operational testing to verify code compliance throughout ${city}.`,
      ];
      return installationIntros[v % installationIntros.length];
    }

    case "repair":
    default: {
      const repairIntros = [
        `Homes throughout ${city}, ${state} experience demanding seasonal temperature shifts and regional soil movement that place ongoing stress on residential utility lines. Our certified technicians provide specialized ${service.toLowerCase()} tailored to local environmental factors in ${county} County, diagnosing wear patterns early and delivering resilient, code-compliant repairs that hold up year-round.`,
        `When you schedule ${service.toLowerCase()} in ${city}, ${state}, prompt arrival and thorough technical diagnosis make all the difference. Our mobile service units arrive fully equipped with diagnostic testing gear and premium OEM replacement parts, allowing us to evaluate the issue immediately and complete most repairs in a single visit without frustrating delays.`,
        `Navigating localized trade service in ${city} requires an organized team with dependable coverage across ${county} County. We coordinate direct dispatch from our regional staging points, keeping travel windows tight and providing honest, upfront flat-rate options so you know exactly what to expect before any repair work commences.`,
        `Protecting the safety and resale value of your ${city} property starts with hiring fully licensed, insured trade professionals. Our technicians strictly adhere to local municipal building codes and safety regulations across ${county} County, ensuring every ${service.toLowerCase()} is completed correctly, permitted where required, and backed by a comprehensive warranty.`,
        `From slab-on-grade foundations to historic residences, properties in ${city}, ${state} feature distinct architectural layouts that require specialized service techniques. We deliver careful, non-invasive ${service.toLowerCase()} designed to safeguard your home's structural foundation while restoring optimal flow, pressure, and mechanical safety.`,
        `Regional water supply characteristics and dissolved mineral levels in ${county} County directly impact the performance and lifespan of plumbing and heating equipment in ${city}. Our comprehensive ${service.toLowerCase()} targets mineral scale buildup, clears restricted flow paths, and restores clean, efficient operation to your home's mechanical systems.`,
        `Underground utility lines and sewer laterals in ${city} frequently contend with soil settling, shifting clay layers, and aggressive tree root intrusion. We utilize advanced fiber-optic diagnostic cameras and precise locating equipment during every ${service.toLowerCase()} to pinpoint underlying line restrictions accurately without unnecessary excavation.`,
        `Fluctuating municipal supply pressures across ${city} can subject interior pipes, valves, and appliances to damaging hydraulic shock. Our technicians specialize in precision pressure regulation and durable ${service.toLowerCase()} throughout ${county} County, protecting sensitive household fixtures from premature failure and high-pressure stress.`,
        `Lowering monthly utility expenditures while maintaining peak reliability is a top priority for property owners in ${city}, ${state}. We provide high-efficiency ${service.toLowerCase()} that eliminates wasteful leaks, restores heat-transfer efficiency, and aligns your home with local energy conservation standards and utility rebate programs.`,
        `Proactive maintenance and early mechanical diagnosis prevent small drips and pressure irregularities from escalating into catastrophic failures in ${city}. Our dedicated ${service.toLowerCase()} focuses on routine multi-point safety inspections and preventative care, extending equipment lifespan and ensuring uninterrupted comfort across ${county} County.`,
      ];
      return repairIntros[v % repairIntros.length];
    }
  }
}
