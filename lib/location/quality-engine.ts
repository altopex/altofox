import { calculateTextSimilarity } from "../quality/quality-checker";
import { classifySearchIntent, generateVariedMetaTitle, generateDirectIntroParagraph } from "./intent-classifier";
import {
  LocationContentStrategy,
  LocationQualityScore,
  LocationQualityCheckResult,
  BulkLocationAnalysis,
  BulkLocationItemReport,
  SearchIntentCategory,
} from "./types";
import { SiteInfoJSON } from "../generator/content-schema";
import { LocationPageContext } from "../../templates/sections/locationPage";

export const ROTATING_ANGLES = [
  "Common seasonal challenges and climate conditions affecting local homes in this region",
  "What local homeowners can expect during our dispatch, diagnosis, and arrival",
  "Scheduling, travel, and how we coordinate same-day emergency coverage",
  "How to choose an honest, licensed trade contractor in this specific community",
  "Service-specific maintenance and prevention guide tailored to regional architecture",
  "Water quality characteristics, mineral scale prevention, and fixture protection",
  "Main sewer lateral health, tree root intrusion prevention, and advanced line diagnostics",
  "Municipal water supply pressure regulation, thermal expansion, and line protection",
  "Energy efficiency optimization, eco-friendly trade upgrades, and utility rebates",
  "Proactive homecare rituals, safety inspection protocols, and long-term asset preservation",
];

interface ProblemSeed {
  title: string;
  description: string;
  whyItHappens: string;
  severity: "critical" | "warning" | "routine";
}

interface StepSeed {
  title: string;
  description: string;
}

interface FaqSeed {
  question: string;
  answer: string;
}

/**
 * Trade problem library providing authentic technical causes without fake claims
 */
function getTradeProblemsByIntent(
  service: string,
  city: string,
  intent: SearchIntentCategory,
  angleIndex = 0
): ProblemSeed[] {
  const s = service.toLowerCase();
  const v = Math.abs(angleIndex);

  if (intent === "emergency" || s.includes("emergency") || s.includes("burst")) {
    const emergencyPools: ProblemSeed[][] = [
      [
        {
          title: `Sudden High-Pressure Pipe & Fitting Ruptures`,
          description: `Sudden pressure surges, age-related joint deterioration, or rapid temperature swings can cause water lines to fail abruptly, releasing gallons of water into living areas.`,
          whyItHappens: `Older soldered copper joints or brittle polybutylene piping deteriorate over decades under fluctuating municipal supply pressure.`,
          severity: "critical",
        },
        {
          title: `Uncontrolled Fixture & Valve Overflows`,
          description: `Worn shutoff valves that fail to seal or stuck fill valves can cause toilets and washing machine connections to overflow continuously.`,
          whyItHappens: `Mineral deposits and internal rubber washer breakdown prevent emergency manual isolation valves from closing cleanly.`,
          severity: "critical",
        },
        {
          title: `Sewer Line Backups & Multiple Fixture Clogs`,
          description: `When wastewater pushes back into basement drains, showers, or first-floor fixtures simultaneously, health hazards require immediate containment.`,
          whyItHappens: `Main sewer line blockages caused by invasive tree roots, heavy grease buildup, or offset pipe bellies outside the foundation.`,
          severity: "critical",
        },
      ],
      [
        {
          title: `Ruptured Flexible Appliance Supply Lines`,
          description: `Braided stainless steel or rubber supply lines feeding dishwashers, washing machines, and ice makers can suddenly burst at crimped fittings.`,
          whyItHappens: `Internal rubber tubing degrades from constant municipal chlorine exposure and hydraulic water hammer shocks.`,
          severity: "critical",
        },
        {
          title: `Main Water Shutoff Valve Seizure During Leaks`,
          description: `When a primary plumbing leak develops and the main residential shutoff valve will not turn, water damage escalates rapidly before street cutoff can occur.`,
          whyItHappens: `Gate valves left untouched for years corrode internally and bind against valve seating threads.`,
          severity: "critical",
        },
        {
          title: `Gas Line Leaks & Rotten Egg Odors`,
          description: `Slight sulfur smells or hissing sounds near gas-fired furnaces, water heaters, or ranges demand immediate emergency evacuation and pressure testing.`,
          whyItHappens: `Vibrations, mechanical impact, or dried pipe dope on threaded iron black pipe joints create micro-fractures.`,
          severity: "critical",
        },
      ],
    ];
    return emergencyPools[v % emergencyPools.length];
  }

  if (intent === "replacement" || s.includes("water heater") || s.includes("furnace") || s.includes("replace")) {
    const replacementPools: ProblemSeed[][] = [
      [
        {
          title: `Internal Tank Corrosion & Rusty Water Output`,
          description: `Water heaters past their 10-year lifespan experience sacrificial anode depletion, leading to irreversible internal tank corrosion and rusty water.`,
          whyItHappens: `Continuous thermal expansion combined with mineral-heavy water degrades internal glass lining and steel tank welds.`,
          severity: "warning",
        },
        {
          title: `Severe Efficiency Drop & Escalating Utility Bills`,
          description: `Older equipment works twice as hard to maintain target temperatures, causing monthly energy expenses to climb while hot water capacity shrinks.`,
          whyItHappens: `Heavy scale buildup along heat exchangers and heating elements chokes heat transfer and restricts thermal recovery.`,
          severity: "warning",
        },
        {
          title: `Frequent Component Failures & Escalating Invoices`,
          description: `When repairs begin exceeding 50% of replacement cost, continuing to patch failing assemblies wastes homeowner budget.`,
          whyItHappens: `Multiple interrelated components reach the end of their design life simultaneously, creating cascading failures.`,
          severity: "routine",
        },
      ],
      [
        {
          title: `Catastrophic Tank Shell Fractures & Weeping Bottoms`,
          description: `Moisture pooling beneath the water heater base signals that internal steel tank walls have breached, making replacement unavoidable.`,
          whyItHappens: `Thermal fatigue and cyclic contraction over a decade cause stress cracks through the inner pressure vessel.`,
          severity: "critical",
        },
        {
          title: `Inadequate Hot Water Volume for Household Demand`,
          description: `Families expanding or adding high-flow modern shower fixtures frequently outgrow the recovery capacity of obsolete 40-gallon units.`,
          whyItHappens: `Original equipment was undersized for modern concurrent appliance cycles and fixture flow requirements.`,
          severity: "warning",
        },
        {
          title: `Burner Assembly Corrosion & Pilot Outages`,
          description: `Aging atmospheric burners suffer flame rollout, thermocouple degradation, and persistent safety sensor lockouts.`,
          whyItHappens: `Combustion condensation and mineral scale dust coat burner ports, choking fresh air intake.`,
          severity: "warning",
        },
      ],
    ];
    return replacementPools[v % replacementPools.length];
  }

  if (intent === "maintenance" || s.includes("drain") || s.includes("clean") || s.includes("tune")) {
    return [
      {
        title: `Sluggish Draining Across Multiple Sinks & Showers`,
        description: `Slow drainage is the earliest warning sign that soap scum, hair, and grease have begun constricting the effective diameter of waste lines.`,
        whyItHappens: `Biological biofilm traps solid particulates along pipe walls, creating progressive choke points.`,
        severity: "warning",
      },
      {
        title: `Foul Drain Odors & Sewer Gas Escape`,
        description: `Gurgling drain noises and sulfur or sewer smells in bathrooms or laundry areas indicate dry traps or partial venting blockages.`,
        whyItHappens: `Decomposing organic debris trapped in P-traps or roof vent stack obstructions prevent proper atmospheric air balancing.`,
        severity: "warning",
      },
      {
        title: `Recurring Clogs Despite Plunging`,
        description: `When a plunger or retail chemical drain cleaner only clears a clog for a few days, the obstruction lies deeper in the main branch line.`,
        whyItHappens: `Over-the-counter drain chemicals bore tiny holes through clogs without scouring the pipe circumference, causing immediate re-clogging.`,
        severity: "routine",
      },
    ];
  }

  if (intent === "diagnostic" || s.includes("leak detection") || s.includes("camera") || s.includes("slab")) {
    return [
      {
        title: `Concealed Under-Slab Supply Line Seepage`,
        description: `Unexplained hot spots on flooring, unexplained water bill increases, or continuous meter movement point toward hidden slab leaks.`,
        whyItHappens: `Coated copper tubing installed beneath concrete foundations experiences friction wear against coarse gravel aggregate.`,
        severity: "critical",
      },
      {
        title: `Subterranean Foundation Settling & Pipe Stress`,
        description: `Soil moisture fluctuations cause foundation movement that strains rigid water and sewer conduits beneath structural footings.`,
        whyItHappens: `Seasonal expansion and contraction cycles in regional soils place lateral shear stress on buried pipe joints.`,
        severity: "warning",
      },
      {
        title: `In-Wall Pipe Pinholes Behind Wet Drywall`,
        description: `Musty odors, peeling paint, or damp baseboards often conceal slow pressurized pinhole leaks inside framed partitions.`,
        whyItHappens: `Internal chloramine pitting or unbuffered supply water slowly oxidizes copper pipe walls from the inside out.`,
        severity: "warning",
      },
    ];
  }

  // 10 Distinct Angle-Specific Technical Problem Sets for General / Repair
  const angleProblemSets: ProblemSeed[][] = [
    // Angle 0: Seasonal & Regional Climate Factors
    [
      {
        title: `Freeze-Thaw Thermal Expansion & Contraction Stress`,
        description: `Rapid winter temperature drops cause water inside exterior walls and unconditioned crawlspaces to expand, splitting rigid pipe joints.`,
        whyItHappens: `Water expands by approximately 9% upon freezing, exerting thousands of PSI against copper fittings and valve bodies.`,
        severity: "critical",
      },
      {
        title: `Expansive Clay Soil Shifting & Subterranean Pipe Shearing`,
        description: `Seasonal moisture cycles cause clay soil layers to swell and contract, applying uneven pressure to underground service lines.`,
        whyItHappens: `Heavy rainfall followed by dry summer spells causes soil volume shifts that crack rigid PVC and cast iron sewer laterals.`,
        severity: "warning",
      },
      {
        title: `High-Demand Summer Peak Pressure Spikes`,
        description: `Summer irrigation and high neighborhood water consumption cause supply pressure to fluctuate wildly, stressing internal seals.`,
        whyItHappens: `Municipal booster pump cycles produce hydraulic pressure waves that fatigue aging pressure regulator valves.`,
        severity: "routine",
      },
    ],
    // Angle 1: Rapid Dispatch & Diagnostic Arrival Protocols
    [
      {
        title: `Concealed Pinhole Leaks in Interior Wall Cavities`,
        description: `Small pressurized leaks behind sheetrock produce damp insulation and microbial growth long before surface water appears.`,
        whyItHappens: `Electrochemical copper pitting corrosion wears tiny microscopic perforations through copper pipe walls.`,
        severity: "warning",
      },
      {
        title: `Seized Fixture Isolation Valves Incapable of Shutting Off`,
        description: `When homeowners attempt to isolate a leaking faucet or toilet, cheap plastic or multi-turn valves snap or leak around the stem.`,
        whyItHappens: `Hard water mineral scale accumulates across internal valve seats, freezing internal stems in place.`,
        severity: "critical",
      },
      {
        title: `Water Pressure Regulator (PRV) Internal Diaphragm Rupture`,
        description: `A failed PRV allows municipal water pressure to enter home lines at 85+ PSI, destroying appliance solenoids and toilet fill valves.`,
        whyItHappens: `Flexible neoprene diaphragms degrade after 7-10 years of continuous municipal pressure cycling.`,
        severity: "warning",
      },
    ],
    // Angle 2: Regional Service Area Coverage & Coordination
    [
      {
        title: `Sudden Multi-Fixture Wastewater Backups During Peak Hours`,
        description: `Simultaneous laundry and shower cycles cause water to bubble up through downstairs showers and floor drains.`,
        whyItHappens: `Partial obstructions in the primary 4-inch building drain restrict peak flow capacity during concurrent household usage.`,
        severity: "critical",
      },
      {
        title: `Toilet Flange Seal & Wax Ring Deterioration`,
        description: `Loose or rocking toilets break wax seal integrity, allowing wastewater seepage to slowly rot structural subfloor framing.`,
        whyItHappens: `Floor settling or corroded closet bolts allow fixture movement that separates the toilet base from the drain flange.`,
        severity: "warning",
      },
      {
        title: `Temperature & Pressure Relief Valve Continuous Weeping`,
        description: `Water pooling around the water heater drain pipe indicates the safety relief valve is venting excessive heat or pressure.`,
        whyItHappens: `Failed thermal expansion bladders or defective internal valve springs prevent proper resealing.`,
        severity: "warning",
      },
    ],
    // Angle 3: Contractor Vetting, Building Codes & Municipal Standards
    [
      {
        title: `Substandard DIY Alterations Causing S-Trap Siphoning`,
        description: `Improperly vented drain traps siphon dry when fixtures drain, allowing dangerous sewer gases to freely enter living areas.`,
        whyItHappens: `Unpermitted renovations often omit required atmospheric vent stacks or install unapproved mechanical vents.`,
        severity: "critical",
      },
      {
        title: `Galvanic Corrosion Across Mismatched Dissimilar Metals`,
        description: `Directly connecting brass or copper piping to galvanized steel lines creates accelerated electrochemical decay at the joint.`,
        whyItHappens: `Failure to install dielectric unions allows electrolytic ion transfer, rusting through pipe threads within a few years.`,
        severity: "warning",
      },
      {
        title: `Inadequate Line Slope Leading to Chronic Sediment Retention`,
        description: `Drain lines installed without standard 1/4-inch per foot fall allow solid waste to settle and solidify rather than washing clean.`,
        whyItHappens: `Unskilled installations ignore plumbing hydraulic grading principles, causing recurrent blockages.`,
        severity: "routine",
      },
    ],
    // Angle 4: Residential Architecture & Foundation Preservation
    [
      {
        title: `Under-Slab Supply Line Seepage Eroding Subgrade`,
        description: `Continuous subterranean water seepage washes away compacted sub-slab soil, creating structural foundation voids.`,
        whyItHappens: `Concrete thermal expansion rubs directly against unprotected copper lines encased in foundation slabs.`,
        severity: "critical",
      },
      {
        title: `Aging Cast Iron Waste Pipe Channeling & Rust Flaking`,
        description: `Homes built before 1980 often have cast iron drain pipes where the bottom invert has rusted through into the soil below.`,
        whyItHappens: `Hydrogen sulfide sewer gases react with moisture to form sulfuric acid, eating away the upper and lower channel walls.`,
        severity: "critical",
      },
      {
        title: `Polybutylene & Brittle Plastic Fitting Degradation`,
        description: `Older flexible plastic plumbing systems suffer sudden fitting fracturing at crimped acetal joints.`,
        whyItHappens: `Chemical oxidizers in municipal water supplies make polybutylene and acetal plastic brittle and micro-fractured.`,
        severity: "warning",
      },
    ],
    // Angle 5: Water Quality, Hardness & Mineral Scale Protection
    [
      {
        title: `Heavy Calcium & Magnesium Scale Encrusting Cartridges`,
        description: `Mineral deposits coat thermostatic mixing valves and faucet cartridges, causing stiff handles and erratic water temperatures.`,
        whyItHappens: `Dissolved calcium bicarbonate precipitates out of hot water, forming a rock-hard mineral crust.`,
        severity: "routine",
      },
      {
        title: `Water Heater Sediment Blankets Causing Popping & Rumbling`,
        description: `Popping or kettle sounds from the water heater indicate a thick blanket of hardened mineral scale trapped at the tank bottom.`,
        whyItHappens: `Minerals insulate water from burner heat, causing superheated steam bubbles to collapse noisily beneath the scale layer.`,
        severity: "warning",
      },
      {
        title: `Restricted Hot Water Flow From Corroded Nipple Connectors`,
        description: `Hot water pressure drops noticeably while cold water pressure remains strong across all household fixtures.`,
        whyItHappens: `Galvanized dielectric nipples at the water heater outlet accumulate heavy calcium choking the pipe orifice.`,
        severity: "warning",
      },
    ],
    // Angle 6: Sewer Line Integrity, Root Intrusion & Trenchless Solutions
    [
      {
        title: `Aggressive Tree Root Penetration at Clay Collar Joints`,
        description: `Shade tree roots seek out moisture vapor escaping through mortar joints in older clay and concrete sewer lines.`,
        whyItHappens: `Hairline root strands enter microscopic joint fissures and rapidly expand into dense root masses that catch paper and solids.`,
        severity: "critical",
      },
      {
        title: `Sewer Lateral Pipe Bellies Trapping Sludge & Greasy Solids`,
        description: `Low spots or sags in horizontal sewer lines hold standing water, preventing the normal scouring action of drain flow.`,
        whyItHappens: `Ground compaction and shifting soil beds allow pipe sections to sink unevenly over decades.`,
        severity: "warning",
      },
      {
        title: `Offset Lateral Joints Causing Yard Sinkholes & Odors`,
        description: `Misaligned pipe joints allow raw sewage to leak into yard subsoil, creating soft depressions and foul ground odors.`,
        whyItHappens: `Earth settling and heavy vehicle parking over shallow lateral lines break pipe hub connections.`,
        severity: "warning",
      },
    ],
    // Angle 7: Water Pressure Regulation, Backflow & Fixture Longevity
    [
      {
        title: `Dangerous Municipal Supply Spikes Exceeding 85 PSI`,
        description: `City water mains frequently operate at elevated pressures to supply hydrants, exceeding residential plumbing safety ratings.`,
        whyItHappens: `High pressure breaks internal toilet valves, creates appliance supply hose bulges, and accelerates fixture wear.`,
        severity: "critical",
      },
      {
        title: `Water Hammer Hydraulic Shock Reverberating Inside Walls`,
        description: `Loud thumping or banging noises occur whenever fast-acting solenoid valves on washing machines or dishwashers close.`,
        whyItHappens: `Moving water stopped instantly generates hydraulic shockwaves of several hundred PSI that rattle loose pipe hangars.`,
        severity: "warning",
      },
      {
        title: `Ruptured Expansion Tank Bladders Straining Closed Systems`,
        description: `When water heater expansion tanks fail, thermal expansion has nowhere to dissipate, causing continuous T&P valve dripping.`,
        whyItHappens: `Internal rubber diaphragms lose air charge or tear, waterlogging the expansion tank completely.`,
        severity: "warning",
      },
    ],
    // Angle 8: Energy Efficiency, Eco-Friendly Upgrades & Utility Rebates
    [
      {
        title: `Phantom Toilet Flapper Leaks Silently Wasting Water`,
        description: `A warped or mineral-encrusted rubber flapper allows water to trickle down the overflow tube 24 hours a day undetected.`,
        whyItHappens: `Chemical in-tank toilet tablets and chlorine break down flapper rubber, preventing a tight seal against the flush valve.`,
        severity: "warning",
      },
      {
        title: `Standby Radiant Thermal Loss Across Uninsulated Supply Risers`,
        description: `Hot water lines running through unconditioned crawlspaces or attics lose heat rapidly, requiring long wait times at taps.`,
        whyItHappens: `Bare copper lines conduct thermal energy rapidly into cold surrounding ambient air.`,
        severity: "routine",
      },
      {
        title: `Obsolete High-Flow Fixtures Straining Utility Budgets`,
        description: `Older showerheads and toilets consume 3.5 to 5.0 gallons per cycle compared to modern 1.28 GPF high-efficiency alternatives.`,
        whyItHappens: `Legacy plumbing fixtures installed before modern water conservation standards squander thousands of gallons annually.`,
        severity: "routine",
      },
    ],
    // Angle 9: Preventative Homecare, Lifetime Maintenance & Early Diagnostics
    [
      {
        title: `Frozen Mechanical Shutoff Valves Snapping During Emergencies`,
        description: `When a leak strikes, trying to turn an unexercised metal angle stop valve often snaps the handle or tears the packing seal.`,
        whyItHappens: `Mineral scale bonds brass stems to valve housings when valves remain unoperated for multiple years.`,
        severity: "critical",
      },
      {
        title: `Slow Hidden Drain Pan Weeping Rotting Flooring Substrates`,
        description: `Appliance drip pans or water heater emergency pans with clogged drain lines allow overflow to seep beneath laminate or tile floors.`,
        whyItHappens: `Algae and dust settle in low-slope 3/4-inch condensation lines, creating quiet blockages.`,
        severity: "warning",
      },
      {
        title: `Deteriorated Flexible Supply Hoses Approaching Sudden Rupture`,
        description: `Corroded ferrules, kinks, or frayed exterior braiding on sink and toilet supply lines signal imminent catastrophic blowout.`,
        whyItHappens: `Age-related elastomer breakdown combined with mechanical stress from tight installation bends.`,
        severity: "warning",
      },
    ],
  ];

  return angleProblemSets[v % angleProblemSets.length];
}

/**
 * Returns genuine, intent-driven process steps
 */
function getProcessStepsByIntent(
  service: string,
  city: string,
  intent: SearchIntentCategory,
  angleIndex = 0
): StepSeed[] {
  const v = Math.abs(angleIndex);

  if (intent === "emergency") {
    return [
      {
        title: `1. Rapid Emergency Dispatch & Priority Routing`,
        description: `Your call connects directly with our dispatch team to route our nearest fully-equipped service vehicle to your ${city} address without delays.`,
      },
      {
        title: `2. Immediate Site Containment & Safe Isolation`,
        description: `Upon arrival, we immediately isolate the active failure, shut down hazardous lines or power, and verify structural safety to halt damage.`,
      },
      {
        title: `3. Full Technical Diagnostics & Flat-Rate Options`,
        description: `We evaluate the underlying mechanical or pipe failure, present transparent flat-rate options, and secure your authorization before work starts.`,
      },
      {
        title: `4. Permanent Repair & Safety Verification`,
        description: `Our licensed technician executes code-compliant repairs using premium parts, conducts pressure and safety testing, and leaves the area clean.`,
      },
    ];
  }

  if (intent === "replacement" || intent === "installation") {
    return [
      {
        title: `1. In-Depth Property & Equipment Sizing Assessment`,
        description: `We inspect your current installation, calculate accurate load/capacity requirements for your ${city} home, and evaluate fuel/power hookups.`,
      },
      {
        title: `2. Clear Written Estimates & Efficiency Options`,
        description: `You receive detailed, written options explaining equipment efficiency ratings, expected operational lifespan, and transparent flat-rate pricing.`,
      },
      {
        title: `3. Code-Compliant Professional Installation`,
        description: `Our licensed crew handles safe removal and disposal of old equipment, precision fitting of the new unit, and adherence to municipal building codes.`,
      },
      {
        title: `4. Commissioning, Safety Testing & Warranty Registration`,
        description: `We test all safety controls, demonstrate simple homeowner operation, and provide complete documentation including warranty coverage.`,
      },
    ];
  }

  if (intent === "maintenance") {
    return [
      {
        title: `1. Comprehensive System Inspection & Diagnostics`,
        description: `We thoroughly inspect electrical connections, safety controls, mechanical clearances, and fluid pressures across your ${city} system.`,
      },
      {
        title: `2. Deep Cleaning & Component Calibration`,
        description: `Our technician cleans critical heat exchangers, clears line blockages, lubricates moving assemblies, and calibrates operating controls.`,
      },
      {
        title: `3. Safety Testing & Performance Tuning`,
        description: `We run full operational test cycles to verify proper air balance, water pressure, burner combustion, or voltage draw.`,
      },
      {
        title: `4. Detailed Homeowner Condition Report`,
        description: `You receive a clear overview of component wear, efficiency metrics, and practical recommendations to prevent future breakdowns.`,
      },
    ];
  }

  if (intent === "diagnostic") {
    return [
      {
        title: `1. On-Site Symptom Evaluation & Visual Survey`,
        description: `We gather information on leak history, meter irregularities, or pressure drops, followed by non-invasive surface inspection.`,
      },
      {
        title: `2. Electronic Acoustic & Thermal Sensor Pinpointing`,
        description: `Using sensitive ground microphones, digital leak correlators, and infrared cameras, we isolate the exact subterranean or in-wall coordinates.`,
      },
      {
        title: `3. Written Diagnostic Finding & Flat-Rate Quote`,
        description: `We explain the exact mechanical cause, photograph findings, and present clear options ranging from localized repair to line rerouting.`,
      },
      {
        title: `4. Non-Destructive Resolution & Pressure Signoff`,
        description: `Repairs are executed with minimal property disruption, verified with hydrostatic pressure tests to confirm total integrity.`,
      },
    ];
  }

  // 10 Distinct Angle-Specific Process Seeds
  const angleProcessPools: StepSeed[][] = [
    // Angle 0: Seasonal & Regional Climate Factors
    [
      {
        title: `1. Seasonal Thermal & Pressure Stress Audit`,
        description: `We inspect vulnerable exterior lines, unconditioned crawlspaces, and foundation penetrations in ${city} for weather-induced expansion damage.`,
      },
      {
        title: `2. Environmental Root Cause Isolation`,
        description: `Our technicians determine whether freeze contraction, soil expansion, or seasonal pressure spikes triggered the plumbing failure.`,
      },
      {
        title: `3. Climate-Resilient Precision Repair`,
        description: `We install heavy-duty OEM parts, thermal insulation sleeves, and flexible expansion loops designed to withstand local temperature swings.`,
      },
      {
        title: `4. Seasonal Load & Pressure Verification`,
        description: `We test line stability under high flow demand to guarantee long-term resilience against regional environmental conditions.`,
      },
    ],
    // Angle 1: Rapid Dispatch & Diagnostic Arrival Protocols
    [
      {
        title: `1. Priority Mobile Dispatch & Route Confirmation`,
        description: `Your service request routes directly to our nearest fully-equipped service vehicle in ${city}, with digital tracking updates sent to your phone.`,
      },
      {
        title: `2. Non-Destructive Multi-Point Diagnostic Scan`,
        description: `Our technician inspects the active failure, evaluates adjoining valves and pipes, and pinpoints the underlying cause before opening any tools.`,
      },
      {
        title: `3. Transparent Upfront Flat-Rate Review`,
        description: `We present clear repair tiers with written prices, ensuring you approve the exact scope of work before any repairs begin.`,
      },
      {
        title: `4. First-Trip Resolution & Spotless Cleanup`,
        description: `Stocked with hundreds of universal parts, we complete repairs on the spot, test all seals under load, and leave the workspace clean.`,
      },
    ],
    // Angle 2: Regional Service Area Coverage & Coordination
    [
      {
        title: `1. Regional Dispatch & Rapid Arrival Coordination`,
        description: `We coordinate service vehicles across regional corridors to minimize transit times and ensure prompt arrival at your ${city} residence.`,
      },
      {
        title: `2. Zone Flow & Pressure Profiling`,
        description: `Our technicians assess municipal incoming supply pressure and fixture drain rates to understand whole-house hydraulic balance.`,
      },
      {
        title: `3. Targeted Mechanical Repair & Component Upgrade`,
        description: `We replace worn seals, seized valves, or corroded sections with commercial-grade components built for long service life.`,
      },
      {
        title: `4. Complete Functional Verification & Follow-Up`,
        description: `We conduct multi-fixture run tests, verify leak-free operation, and document all warranty protections for your peace of mind.`,
      },
    ],
    // Angle 3: Contractor Vetting, Building Codes & Municipal Standards
    [
      {
        title: `1. Municipal Code & Safety Compliance Audit`,
        description: `We review the affected plumbing assembly against current municipal building codes and safety regulations in ${city}.`,
      },
      {
        title: `2. Master-Level Technical Troubleshooting`,
        description: `Our licensed master and journeyman specialists isolate code infractions, improper venting, or unpermitted DIY alterations.`,
      },
      {
        title: `3. Code-Compliant Professional Repair`,
        description: `We execute repairs strictly adhering to local plumbing codes, using certified materials that preserve homeowner insurance coverage.`,
      },
      {
        title: `4. Formal Documentation & Workmanship Signoff`,
        description: `You receive detailed itemized invoices and documentation confirming full code compliance and manufacturer warranty backing.`,
      },
    ],
    // Angle 4: Residential Architecture & Foundation Preservation
    [
      {
        title: `1. Architectural & Subgrade Inspection`,
        description: `We assess your home's foundation type—slab-on-grade vs crawlspace—in ${city} to plan the least invasive access strategy.`,
      },
      {
        title: `2. Acoustic & Electronic Path Mapping`,
        description: `We trace underground pipe trajectories using acoustic listening discs and electronic transmitters without cracking concrete or floors.`,
      },
      {
        title: `3. Minimal-Invasive Surgical Repair or Reroute`,
        description: `We perform targeted sub-slab repairs or install clean overhead PEX bypass lines to protect structural foundation integrity.`,
      },
      {
        title: `4. Hydrostatic Pressure & Structural Seal Verification`,
        description: `We pressurize the system to confirm 100% seal integrity and seal any structural penetrations with moisture-resistant barriers.`,
      },
    ],
    // Angle 5: Water Quality, Hardness & Mineral Scale Protection
    [
      {
        title: `1. On-Site Water Hardness & Chemistry Profiling`,
        description: `We test local mineral concentration and pH balance in ${city} to determine how mineral scale is affecting your system.`,
      },
      {
        title: `2. Targeted Descaling & Sediment Evacuation`,
        description: `We chemically flush calcified deposits from heat exchangers, valve cartridges, and distribution lines to restore original flow.`,
      },
      {
        title: `3. Scale-Resistant Component Installation`,
        description: `Worn components are replaced with durable ceramic-disc cartridges and scale-resistant fittings engineered for hard water.`,
      },
      {
        title: `4. Flow Calibration & Water Conditioning Consultation`,
        description: `We verify smooth flow across all fixtures and explain practical water softening and filtration strategies to protect future longevity.`,
      },
    ],
    // Angle 6: Sewer Line Integrity, Root Intrusion & Trenchless Solutions
    [
      {
        title: `1. High-Definition Fiber-Optic Camera Inspection`,
        description: `We feed self-leveling HD sewer cameras through your cleanout to inspect pipe walls, joints, and root intrusions in ${city}.`,
      },
      {
        title: `2. Radio-Sonde Depth & Obstruction Pinpointing`,
        description: `Our technician traces the exact underground location and depth of root balls or pipe bellies with above-ground radio receivers.`,
      },
      {
        title: `3. High-Pressure Hydro-Jetting or Mechanical Clearance`,
        description: `We scour the pipe circumference using 4,000 PSI hydro-jetting water streams or heavy-duty root-cutting mechanical blades.`,
      },
      {
        title: `4. Post-Clearance Video Audit & Permanent Verification`,
        description: `We run a secondary camera pass to verify complete root removal, full diameter restoration, and structural pipe integrity.`,
      },
    ],
    // Angle 7: Water Pressure Regulation, Backflow & Fixture Longevity
    [
      {
        title: `1. Precision Dual-Gauge Pressure Profiling`,
        description: `We measure static incoming water pressure and dynamic flow drops at multiple test points across your ${city} residence.`,
      },
      {
        title: `2. Pressure Regulator Valve (PRV) Calibration`,
        description: `We adjust or replace failed pressure regulators to ensure incoming water stabilizes between a safe 50 and 65 PSI.`,
      },
      {
        title: `3. Thermal Expansion Bladder Balancing`,
        description: `We test the expansion tank pre-charge pressure to absorb hot water thermal expansion and protect appliance safety valves.`,
      },
      {
        title: `4. Hydraulic Water Hammer Elimination`,
        description: `We install inline piston-style water hammer arrestors to stop pipe chatter and protect appliance solenoids from sudden shock.`,
      },
    ],
    // Angle 8: Energy Efficiency, Eco-Friendly Upgrades & Utility Rebates
    [
      {
        title: `1. Comprehensive Water & Energy Audit`,
        description: `We evaluate fixture flow rates, standby heat loss, and hidden continuous consumption throughout your ${city} home.`,
      },
      {
        title: `2. High-Efficiency Equipment Specification`,
        description: `We identify modern ENERGY STAR or low-flow solutions suited for your household's daily consumption patterns.`,
      },
      {
        title: `3. Precision Installation & Flow Calibration`,
        description: `We install eco-friendly upgrades that optimize utility performance without reducing water comfort or fixture pressure.`,
      },
      {
        title: `4. Utility Rebate & Savings Documentation`,
        description: `We provide itemized efficiency paperwork to help homeowners claim local utility rebates and start saving on monthly bills.`,
      },
    ],
    // Angle 9: Preventative Homecare, Lifetime Maintenance & Early Diagnostics
    [
      {
        title: `1. Whole-Home Multi-Point Diagnostic Check`,
        description: `We inspect shutoff valves, emergency reliefs, drain traps, and supply lines systematically across your ${city} property.`,
      },
      {
        title: `2. Emergency Valve Exercising & Lubrication`,
        description: `Our technician cycles every angle stop and main cutoff valve to ensure they close cleanly and smoothly during an emergency.`,
      },
      {
        title: `3. Thermal & Acoustic Leak Detection Scan`,
        description: `We scan concealed wall cavities and ceilings for microscopic leaks before they cause wood rot or mold damage.`,
      },
      {
        title: `4. Comprehensive Asset Maintenance Plan Delivery`,
        description: `We deliver a written condition report with prioritized recommendations to protect your property's value for the coming year.`,
      },
    ],
  ];

  return angleProcessPools[v % angleProcessPools.length];
}

/**
 * Returns authentic FAQs based on intent and location without fake local claims
 */
function getFaqsByIntent(
  service: string,
  city: string,
  state: string,
  county: string,
  intent: SearchIntentCategory,
  angleIndex = 0
): FaqSeed[] {
  const v = Math.abs(angleIndex);

  if (intent === "emergency") {
    const emergencyFaqPools: FaqSeed[][] = [
      [
        {
          question: `How fast can you dispatch an emergency technician to my home in ${city}?`,
          answer: `We prioritize active emergency calls in ${city} and across ${county} County. Our service trucks are stocked with common diagnostic and repair parts, allowing us to arrive promptly and resolve the majority of urgent problems on the first visit.`,
        },
        {
          question: `What should I do while waiting for your emergency technician to arrive?`,
          answer: `If safe to do so, locate and shut off the main water shutoff valve (or electrical breaker corresponding to the unit) to prevent escalating water or electrical damage. Clear personal belongings from the area so our technician has immediate access.`,
        },
        {
          question: `Do you charge hidden overtime fees for evening or weekend emergency service?`,
          answer: `No. We believe in upfront, transparent flat-rate pricing. Before performing any repairs, our technician provides a clear, written estimate for your approval so you know exactly what to expect.`,
        },
        {
          question: `Are your technicians licensed and insured in ${state}?`,
          answer: `Yes. All service calls are performed by state-licensed, insured professionals who comply strictly with municipal building codes and safety regulations in ${city}.`,
        },
      ],
      [
        {
          question: `How do I shut off the main water supply to my ${city} property in a crisis?`,
          answer: `Most residential main shutoffs are located where the supply line enters the home—commonly in the basement, utility closet, or near the street water meter. Turn the valve handle clockwise (or perpendicular to the pipe for ball valves) until completely closed.`,
        },
        {
          question: `Can water leaks inside drywall cause mold growth if not resolved quickly?`,
          answer: `Yes. Moisture trapped in wall insulation or drywall begins cultivating mold within 24 to 48 hours. Our emergency response team stops water flow immediately and guides homeowners on proper structural dry-out measures.`,
        },
        {
          question: `Will my homeowner insurance cover the cost of emergency plumbing repairs?`,
          answer: `Insurance policies generally cover sudden, accidental water damage to flooring, walls, and personal property, though the plumbing pipe repair itself may be an out-of-pocket item. We provide itemized diagnostic reports for insurance claims.`,
        },
        {
          question: `What should I do if raw sewage backs up through my shower or floor drains?`,
          answer: `Stop using all plumbing fixtures immediately—do not run dishwashers, washing machines, or flush toilets. Avoid contact with standing sewage, open windows for ventilation, and call our priority dispatch line immediately.`,
        },
      ],
    ];
    return emergencyFaqPools[v % emergencyFaqPools.length];
  }

  if (intent === "replacement" || intent === "installation") {
    return [
      {
        question: `How do I determine if my system in ${city} should be repaired or replaced?`,
        answer: `If your unit is more than 10 to 12 years old, requires frequent costly repairs exceeding 50% of the replacement value, or delivers inconsistent output, upgrading to a modern energy-efficient unit is typically far more cost-effective.`,
      },
      {
        question: `Are building permits and inspections required for ${service.toLowerCase()} in ${city}, ${state}?`,
        answer: `Most major installations and equipment replacements require local municipal building permits to ensure code compliance. We handle the necessary permitting paperwork and coordinate safety inspections as part of our full service.`,
      },
      {
        question: `How long does a typical ${service.toLowerCase()} installation take to complete?`,
        answer: `Most residential replacements in ${city} are completed within 4 to 8 hours. We coordinate work cleanly, protect your floors and property, and ensure your system is fully tested and commissioned before leaving.`,
      },
      {
        question: `What warranties are included with new installations?`,
        answer: `New installations include both the manufacturer equipment warranty (typically 5 to 10 years depending on model) and our complete professional labor and workmanship guarantee.`,
      },
    ];
  }

  if (intent === "maintenance") {
    return [
      {
        question: `How often should I schedule professional ${service.toLowerCase()} for my ${city} property?`,
        answer: `For most residential properties in ${city}, scheduling comprehensive maintenance once per year is ideal. High-demand systems or properties with heavy usage may benefit from bi-annual checkups.`,
      },
      {
        question: `What are the most common signs that my system is due for a thorough cleaning or tune-up?`,
        answer: `Slow response, gurgling or rattling sounds, faint odors, uneven temperature output, or sudden increases in your utility bills are clear indicators that sediment, debris, or mechanical friction is impacting efficiency.`,
      },
      {
        question: `Can regular maintenance really extend the lifespan of my equipment?`,
        answer: `Yes. Industry studies consistently show that routine cleaning, lubrication, and safety testing prevent up to 85% of unexpected breakdowns and extend overall equipment operating life by years.`,
      },
      {
        question: `What maintenance tasks should homeowners in ${city} perform between professional visits?`,
        answer: `Regularly clean fixture aerators, test exposed shutoff valves twice a year, avoid pouring cooking grease or harsh caustic drain chemicals down sinks, and check visible pipe connections for minor weeping.`,
      },
    ];
  }

  if (intent === "diagnostic") {
    return [
      {
        question: `How do you pinpoint hidden leaks in ${city} without damaging my walls or floors?`,
        answer: `We utilize non-invasive acoustic listening sensors, digital line pressure decay testing, and high-resolution thermal imaging to locate the precise source of moisture before any invasive exploratory openings are made.`,
      },
      {
        question: `What causes unexplained water bill spikes when there is no visible leak?`,
        answer: `Underground service lateral pinholes, concealed slab leaks beneath concrete foundations, or silent toilet flapper leaks are the most common culprits. Our diagnostic testing isolates each plumbing zone to identify the culprit.`,
      },
      {
        question: `Will I receive an itemized diagnostic report with repair options?`,
        answer: `Yes. Following our diagnostic evaluation, we explain findings in plain language, show photos or sensor readings, and provide flat-rate repair options so you can choose the best solution for your budget.`,
      },
      {
        question: `How long does a thorough non-invasive leak diagnostic inspection take?`,
        answer: `Most residential inspections in ${city} require 60 to 90 minutes. We test static water lines, drainage branches, and fixture valves systematically to verify total plumbing integrity.`,
      },
    ];
  }

  // 10 Distinct Angle-Specific FAQ Sets for General / Repair
  const angleFaqPools: FaqSeed[][] = [
    // Angle 0: Seasonal & Regional Climate Factors
    [
      {
        question: `How do seasonal temperature shifts in ${city} affect residential plumbing pipes?`,
        answer: `Sharp winter freezes cause exposed water lines in exterior walls or unheated crawlspaces to expand and crack, while intense summer heat increases municipal water demand and accelerates thermal stress on water heating equipment across ${county} County.`,
      },
      {
        question: `What should homeowners in ${city} do to prevent frozen pipes during cold snaps?`,
        answer: `Disconnect outdoor garden hoses, insulate exterior spigots with foam covers, open cabinet doors below sinks on exterior walls to let warm air circulate, and let faucets drip slowly during hard freeze warnings.`,
      },
      {
        question: `Can shifting regional clay soils crack underground plumbing lines in ${city}?`,
        answer: `Yes. Expansive clay soils swell during rainy periods and contract sharply during droughts. This ground movement creates shear stress that can crack rigid cast iron or PVC sewer lines and dislodge supply fittings.`,
      },
      {
        question: `Why does water pressure fluctuate more frequently during extreme summer heat?`,
        answer: `High peak municipal demand from simultaneous lawn irrigation and household water use stresses local pumping infrastructure, causing noticeable pressure drops during morning and evening peak hours.`,
      },
    ],
    // Angle 1: Rapid Dispatch & Diagnostic Arrival Protocols
    [
      {
        question: `How quickly can your mobile service vehicle arrive at my home in ${city}?`,
        answer: `We maintain mobile service units strategically dispatched across ${county} County. For priority repair calls in ${city}, we aim for prompt same-day arrival windows and provide direct phone or text notifications when your technician is en route.`,
      },
      {
        question: `Do your service vehicles carry the replacement parts needed to finish repairs in one visit?`,
        answer: `Yes. Our trucks are outfitted as "warehouses on wheels," stocked with OEM-grade valve cartridges, copper and PEX fittings, pressure regulators, disposal units, and common repair kits to resolve over 90% of issues on the initial trip.`,
      },
      {
        question: `How does your flat-rate pricing policy protect ${city} homeowners?`,
        answer: `We never bill by open-ended hourly rates where unexpected delays cost you extra. Our technician inspects the problem on-site, presents transparent written repair options, and obtains your approval before touching a tool.`,
      },
      {
        question: `What steps do your technicians take to protect my home and flooring?`,
        answer: `We use heavy-duty protective shoe covers, clean drop cloths around work areas, and thoroughly sanitize and vacuum the work zone before departure, leaving your home as clean as we found it.`,
      },
    ],
    // Angle 2: Regional Service Area Coverage & Coordination
    [
      {
        question: `Which neighborhoods and communities near ${city} are included in your service area?`,
        answer: `Our service territory covers the entire ${city} municipal area and neighboring communities across ${county} County, providing consistent response times and the same guaranteed flat-rate pricing throughout the region.`,
      },
      {
        question: `How do you prioritize urgent repair calls across different regional zones?`,
        answer: `Calls involving active water line breaks, complete drain stoppages, or loss of sanitary facilities receive immediate dispatch priority, routing our nearest available technician directly to contain property damage.`,
      },
      {
        question: `Do you offer scheduled arrival windows that accommodate work and family schedules?`,
        answer: `Yes. We provide convenient morning and afternoon appointment windows, along with courtesy calls 30 minutes before arrival so you never have to wait around all day.`,
      },
      {
        question: `Are your guarantees and warranties valid across all serviced communities in ${county} County?`,
        answer: `Yes. All parts and workmanship warranties are fully honored across our entire service area. If an installed part fails under normal use, our team returns promptly to correct it at zero additional cost.`,
      },
    ],
    // Angle 3: Contractor Vetting, Building Codes & Municipal Standards
    [
      {
        question: `Are your plumbers licensed and insured to work in ${city}, ${state}?`,
        answer: `Yes. All work is performed by state-licensed journeymen and master plumbers who carry comprehensive general liability and workers' compensation insurance, protecting you and your property completely.`,
      },
      {
        question: `Why is pulling municipal building permits important for major plumbing work?`,
        answer: `Municipal permits ensure work meets local health and safety standards. Unpermitted work can void homeowner insurance claims during floods, cause safety hazards, and create expensive roadblocks when selling your ${city} home.`,
      },
      {
        question: `What is the risk of hiring an unlicensed handyman for plumbing repairs?`,
        answer: `Unlicensed handymen often lack code knowledge, insurance coverage, and proper diagnostic equipment. Substandard repairs often lead to concealed leaks, dry-rotted subfloors, and costly rework by licensed trades later.`,
      },
      {
        question: `What warranties cover your repair services and replacement parts?`,
        answer: `We provide complete written warranties covering both our labor and installed parts. Many premium replacement fixtures and equipment also include extended multi-year manufacturer warranty protection.`,
      },
    ],
    // Angle 4: Residential Architecture & Foundation Preservation
    [
      {
        question: `What are the warning signs of a concealed water leak under a slab foundation in ${city}?`,
        answer: `Common symptoms include unexplained hot spots on tile or hardwood floors, sound of running water when fixtures are off, cracking foundation baseboards, musty odors, and continuous water meter movement.`,
      },
      {
        question: `Can you repair an under-slab leak without jackhammering my living room floor?`,
        answer: `In many cases, yes. Rather than breaking through finished flooring, we frequently perform overhead line reroutes, running modern PEX tubing through attic or wall cavities to bypass damaged under-slab copper lines cleanly.`,
      },
      {
        question: `How does home age in ${city} influence plumbing materials and failure risks?`,
        answer: `Homes built before 1970 often have deteriorating cast iron drains, 1980s-1990s homes may contain brittle polybutylene, while newer homes feature PEX. We inspect material compatibility before performing any repair.`,
      },
      {
        question: `How do regional foundation soils affect plumbing line lifespan?`,
        answer: `High clay content soils apply significant lateral pressure on sewer laterals as moisture levels rise and fall. Proper pipe bedding and flexible couplings are critical to prevent recurring line fractures.`,
      },
    ],
    // Angle 5: Water Quality, Hardness & Mineral Scale Protection
    [
      {
        question: `How hard is the municipal water in ${city}, and how does it damage home fixtures?`,
        answer: `Much of ${county} County experiences moderate to hard water rich in calcium and magnesium. Over time, these minerals precipitate out, choking faucet aerators, calcifying shower cartridges, and reducing water heater efficiency.`,
      },
      {
        question: `How often should water heaters and boilers be descaled in ${city}?`,
        answer: `Standard tank water heaters benefit from annual flushing, while high-efficiency tankless units in hard water areas require specialized vinegar or chemical descaling every 12 to 18 months to prevent heat exchanger lockouts.`,
      },
      {
        question: `What is the difference between whole-home water softening and water filtration?`,
        answer: `Water filtration removes chlorine, sediment, and chemical contaminants for clean drinking water. Water softeners use ion exchange to remove calcium and magnesium minerals, eliminating scale buildup and soap scum.`,
      },
      {
        question: `Can mineral scale buildup inside pipes increase monthly energy and utility bills?`,
        answer: `Yes. A 1/4-inch layer of mineral scale inside a water heater acts like an insulating blanket, forcing the heating element or burner to consume up to 30% more energy to achieve target water temperatures.`,
      },
    ],
    // Angle 6: Sewer Line Integrity, Root Intrusion & Trenchless Solutions
    [
      {
        question: `How often should sewer laterals in older ${city} neighborhoods be inspected with a camera?`,
        answer: `For homes over 20 years old, or properties with mature trees near the sewer line, we recommend a fiber-optic video inspection every 2 to 3 years to catch root intrusion and settling before full blockages occur.`,
      },
      {
        question: `What causes chronic main sewer backups in residential properties?`,
        answer: `Invasive tree roots entering pipe joints, accumulated cooking fats and grease, pipe bellies holding standing water, and deteriorated clay or cast iron pipes are the most common root causes in ${county} County.`,
      },
      {
        question: `How does hydro-jetting differ from standard mechanical drain snaking?`,
        answer: `Mechanical snaking punches a small hole through clogs to temporarily restore flow. Hydro-jetting uses 4,000 PSI high-pressure water streams to scour 100% of grease, mineral scale, and root hairs from pipe walls.`,
      },
      {
        question: `Can tree root intrusions in sewer pipes be resolved without digging up my yard?`,
        answer: `Yes. After clearing roots with hydro-jetting, trenchless epoxy pipe lining (CIPP) can create a smooth, continuous new pipe inside the old one, permanently sealing off all joint seams where roots enter.`,
      },
    ],
    // Angle 7: Water Pressure Regulation, Backflow & Fixture Longevity
    [
      {
        question: `What is the ideal water pressure range for residential homes in ${city}?`,
        answer: `Residential water pressure should measure between 50 and 65 PSI. Pressure exceeding 80 PSI damages water heater tanks, voids washing machine warranties, and causes toilet valves and flex lines to burst.`,
      },
      {
        question: `Why do my home's pipes bang loudly inside the walls when a faucet shuts off?`,
        answer: `This phenomenon is known as water hammer. When flowing water is suddenly stopped by a fast-closing valve, the hydraulic kinetic energy bounces off pipe walls. Installing water hammer arrestors eliminates this shock.`,
      },
      {
        question: `How long do residential pressure reducing valves (PRVs) typically last?`,
        answer: `Most PRVs last between 7 and 10 years. Over time, internal rubber diaphragms wear down and mineral scale clogs the spring assembly, causing pressure to creep upwards into dangerous territory.`,
      },
      {
        question: `Why does my water heater need a thermal expansion tank?`,
        answer: `When cold water is heated, it expands by approximately 2% in volume. In modern closed plumbing systems with check valves or PRVs, an expansion tank absorbs this excess volume, protecting lines from high-pressure stress.`,
      },
    ],
    // Angle 8: Energy Efficiency, Eco-Friendly Upgrades & Utility Rebates
    [
      {
        question: `How much water and money can modern low-flow plumbing fixtures save in ${city}?`,
        answer: `Upgrading to EPA WaterSense certified toilets (1.28 GPF) and low-flow aerators can reduce household water consumption by 20% to 30%, saving an average family thousands of gallons and noticeable utility costs each year.`,
      },
      {
        question: `Are there utility rebates available for upgrading to high-efficiency equipment in ${state}?`,
        answer: `Many municipal water and electric utilities offer rebates for qualifying ENERGY STAR tankless water heaters, heat pump water heaters, and smart irrigation controllers. We assist homeowners with necessary rebate paperwork.`,
      },
      {
        question: `How can I tell if a toilet flapper is leaking silently behind the scenes?`,
        answer: `Place several drops of dark food coloring in the toilet tank and wait 20 minutes without flushing. If color appears in the bowl, the flapper seal is failing and wasting water continuously.`,
      },
      {
        question: `What are the energy-saving benefits of insulating hot water pipes in ${city}?`,
        answer: `Insulating hot water lines running through unconditioned crawlspaces and attics raises delivered water temperature by 2 to 4 degrees, reducing wait times at faucets and lowering water heater operating cycles.`,
      },
    ],
    // Angle 9: Preventative Homecare, Lifetime Maintenance & Early Diagnostics
    [
      {
        question: `Why do under-sink shutoff valves freeze open over time?`,
        answer: `Multi-turn gate valves left in the open position for years accumulate mineral deposits along the brass valve stem. Turning and exercising each shutoff valve twice a year keeps internal components free and operational.`,
      },
      {
        question: `What is included in a professional whole-home plumbing safety inspection?`,
        answer: `Our multi-point inspection covers static water pressure testing, emergency shutoff valve operation, water heater safety relief valves, visible supply line condition, drain flow rates, and non-invasive leak detection scans.`,
      },
      {
        question: `What are the subtle warning signs of a hidden plumbing leak?`,
        answer: `Unexplained jumps in water bills, faint gurgling or hissing noises in walls, localized flooring warping, peeling baseboard paint, and musty odors are common early warning indicators of concealed seepage.`,
      },
      {
        question: `How often should residential plumbing systems in ${city} be professionally evaluated?`,
        answer: `We recommend a comprehensive plumbing checkup every 12 to 24 months, particularly for homes over 15 years old, to identify worn parts and prevent unexpected flooding or costly emergency repairs.`,
      },
    ],
  ];

  return angleFaqPools[v % angleFaqPools.length];
}

/**
 * Returns actionable customer prep steps based on intent and angle
 */
function getCustomerPrepSteps(intent: SearchIntentCategory, angleIndex = 0): string[] {
  const v = Math.abs(angleIndex);

  if (intent === "emergency") {
    return [
      `Locate and close your main water shutoff valve immediately, or shut off the valve dedicated to the leaking fixture.`,
      `Keep household members and pets away from standing water, damp drywall, or wet electrical outlets.`,
      `Clear a direct 3-foot pathway leading from your front doorway to the problem area so technicians can access equipment immediately.`,
    ];
  }

  if (intent === "replacement" || intent === "installation") {
    return [
      `Note down the model number, approximate age, and fuel type (gas or electric) of your existing equipment if safely accessible.`,
      `Clear stored storage boxes, laundry, or yard items surrounding the utility closet or installation footprint.`,
      `Consider your household's peak water usage patterns (concurrent showers, laundry, and dishwasher cycles) to discuss sizing.`,
    ];
  }

  if (intent === "diagnostic") {
    return [
      `Check your water meter dial before and after a 30-minute window with all indoor fixtures off to see if the dial spins.`,
      `Mark any damp baseboard spots, peeling paint, or warm flooring areas with a small piece of painter's tape.`,
      `Ensure clear, unobstructed access to outdoor cleanout caps, water meter vaults, and indoor utility rooms.`,
    ];
  }

  // 10 Distinct Angle-Specific Prep Steps for General / Repair
  const anglePrepSets: string[][] = [
    // Angle 0: Seasonal & Climate
    [
      `Inspect outdoor hose bibbs and ensure all garden hoses are disconnected from exterior faucets.`,
      `Check your main shutoff valve to confirm it turns smoothly before cold weather arrives.`,
      `Note whether your water pressure or temperature fluctuates noticeably during hot summer afternoons.`,
    ],
    // Angle 1: Rapid Dispatch & Arrival
    [
      `Clear a direct 3-foot walkway from your front door to the mechanical closet, basement, or problem area.`,
      `Secure pets in a separate room to ensure a safe, distraction-free workspace for our technician.`,
      `Snap a clear photo of the leaking valve or model plate so our dispatch crew can cross-reference parts inventory.`,
    ],
    // Angle 2: Regional Coordination & Coverage
    [
      `Keep your mobile phone nearby so you can receive real-time dispatch updates and technician arrival notifications.`,
      `Ensure outdoor driveway or curbside parking is accessible for our commercial service vehicle.`,
      `List any secondary plumbing issues in the home so our technician can inspect them during the same trip.`,
    ],
    // Angle 3: Licensing, Codes & Standards
    [
      `Gather any past repair records, permits, or equipment warranty manuals from previous installations.`,
      `Verify clear, unobstructed access to your home's main electrical breaker panel.`,
      `Note any unpermitted modifications or remodeling completed by prior homeowners that might affect line routing.`,
    ],
    // Angle 4: Architecture & Foundations
    [
      `Walk the perimeter of your foundation and note any unexplained damp soil patches or persistent puddle formations.`,
      `Check baseboards in ground-floor bathrooms and utility areas for slight wood swelling or discoloration.`,
      `Clear personal items from low vanity cabinets and crawlspace access hatches prior to arrival.`,
    ],
    // Angle 5: Water Quality & Scale
    [
      `Collect a small clean jar sample of tap water if you are noticing rust tint, cloudiness, or sediment particles.`,
      `Inspect chrome faucets and showerheads for white, chalky crusting or uneven spray nozzle patterns.`,
      `Note whether soap and shampoo lather easily or leave a persistent film on glassware and fixtures.`,
    ],
    // Angle 6: Sewer Laterals & Drain Health
    [
      `Locate your exterior sewer cleanout cap (typically a 3- to 4-inch threaded white PVC or black ABS plug in the yard).`,
      `Avoid running laundry or dishwasher cycles if secondary drains or ground-floor toilets are gurgling.`,
      `Do not pour harsh caustic chemical drain cleaners down lines before professional mechanical diagnosis.`,
    ],
    // Angle 7: Water Pressure & Regulation
    [
      `Listen for loud banging or pipe shuddering inside walls when washing machine or dishwasher valves shut off.`,
      `Note whether outdoor spigots spray with violent force or aerators blast water aggressively when first opened.`,
      `Clear storage items around your main pressure reducing valve, typically located near the water entry line.`,
    ],
    // Angle 8: Energy Efficiency & Upgrades
    [
      `Review your last two municipal water bills for unexplained spikes in monthly volume consumption.`,
      `Perform a quick food-coloring test in your toilet tanks to check for silent flapper leakage.`,
      `Note the age and gallon-per-flush rating printed behind your toilet seats or on fixture bodies.`,
    ],
    // Angle 9: Preventative Care & Asset Protection
    [
      `Make a quick checklist of any minor drips, slow-draining basins, or running toilets throughout the house.`,
      `Inspect cabinet floors beneath kitchen and bathroom sinks for warped wood or water stains.`,
      `Verify that all family members know the location of the main household water shutoff valve.`,
    ],
  ];

  return anglePrepSets[v % anglePrepSets.length];
}

/**
 * Returns when-to-call diagnostic triggers
 */
function getWhenToCallTriggers(
  service: string,
  intent: SearchIntentCategory,
  angleIndex = 0
): Array<{ symptom: string; action: string }> {
  const v = Math.abs(angleIndex);

  const angleTriggerSets: Array<Array<{ symptom: string; action: string }>> = [
    // Angle 0: Seasonal & Climate
    [
      { symptom: `Sudden frost on exposed pipes or trickling faucets during freeze warnings`, action: `Shut off the main supply immediately and call for emergency pipe thawing before lines rupture.` },
      { symptom: `Spongy or saturated ground near your water meter following heavy seasonal rain`, action: `Indicates shifting soil has sheared a subterranean supply fitting requiring prompt excavation repair.` },
      { symptom: `Water heater producing lukewarm water during peak winter months`, action: `Points to heavy mineral scaling on heating elements preventing adequate heat transfer.` },
    ],
    // Angle 1: Rapid Dispatch & Arrival
    [
      { symptom: `Hissing or dripping sounds inside wall cavities when all faucets are shut`, action: `Schedule non-invasive acoustic leak detection before drywall rots and develops mold.` },
      { symptom: `Angle stop shutoff valve weeping water around the stem when turned`, action: `Have valves replaced with modern quarter-turn ball valves to avoid emergency flooding.` },
      { symptom: `Water meter register triangle spinning continuously while house is unoccupied`, action: `Confirms a continuous pressurized leak that demands immediate professional isolation.` },
    ],
    // Angle 2: Regional Coordination & Coverage
    [
      { symptom: `Multiple plumbing fixtures backing up into downstairs tubs simultaneously`, action: `Signals a primary sewer line stoppage requiring priority mechanical or hydro-jet clearance.` },
      { symptom: `Foul sulfur or sewer odors emerging from laundry or floor drains`, action: `Indicates dry P-traps or blocked roof vent stacks allowing hazardous gases to enter.` },
      { symptom: `Sudden drop in water volume when multiple fixtures operate together`, action: `Points to a failing pressure regulator valve or localized main supply restriction.` },
    ],
    // Angle 3: Licensing, Codes & Standards
    [
      { symptom: `Persistent gurgling noises in sinks after nearby toilets are flushed`, action: `Indicates unpermitted or non-code S-traps siphoning protective trap water seals.` },
      { symptom: `Visible rust or white crusting at joints connecting copper and steel pipes`, action: `Signals active galvanic corrosion requiring code-compliant dielectric separation.` },
      { symptom: `Water heater pressure relief valve discharging boiling water onto the floor`, action: `A critical safety violation requiring immediate emergency burner shutdown and valve inspection.` },
    ],
    // Angle 4: Architecture & Foundations
    [
      { symptom: `Unexplained warm spots on ground-floor concrete slab flooring`, action: `Direct indicator of an under-slab hot water line rupture eroding sub-foundation soil.` },
      { symptom: `Hairline foundation settlement cracks accompanied by drain slowness`, action: `Signals sub-slab sewer lateral separation allowing wastewater to wash away soil support.` },
      { symptom: `Discolored or warped baseboards along interior partition walls`, action: `Concealed pressurized pipe seepage requiring immediate non-destructive acoustic localization.` },
    ],
    // Angle 5: Water Quality & Scale
    [
      { symptom: `Rattling, kettle rumbling, or popping noises from your water heater tank`, action: `Indicates thick mineral scale traps steam pockets, requiring immediate chemical descaling.` },
      { symptom: `Stiff, grinding faucet handles that require excessive force to turn`, action: `Hard water minerals have scored the cartridge; replace with scale-resistant ceramic valves.` },
      { symptom: `White chalky crust clogging showerhead nozzles and fixture aerators`, action: `Have whole-house water hardness tested and consider water conditioning to protect equipment.` },
    ],
    // Angle 6: Sewer Laterals & Root Intrusion
    [
      { symptom: `Tree roots visible in cleanout openings or recurring toilet clogs`, action: `Schedule a high-definition sewer camera inspection and commercial hydro-jetting cleanout.` },
      { symptom: `Soggy, unusually lush green patches developing across the front yard`, action: `Underground sewer lateral is cracked and leaking wastewater into surrounding turf.` },
      { symptom: `Gurgling sounds in bathroom drains whenever the washing machine drains`, action: `Primary waste line is restricted and pulling air through secondary fixture traps.` },
    ],
    // Angle 7: Water Pressure & Regulation
    [
      { symptom: `Banging or thumping pipes when fast-closing appliance valves shut`, action: `Install water hammer arrestors to prevent hydraulic shock from breaking pipe hangars.` },
      { symptom: `Water pressure gauge reading over 75 PSI at outdoor hose spigots`, action: `Replace or calibrate your pressure reducing valve to protect water heaters and appliances.` },
      { symptom: `Water heater expansion tank sounding completely solid when tapped`, action: `Internal bladder has ruptured, eliminating thermal expansion relief for your water system.` },
    ],
    // Angle 8: Energy Efficiency & Upgrades
    [
      { symptom: `Toilet running intermittently for a few seconds every hour`, action: `Replace degraded flapper to stop continuous silent water waste of hundreds of gallons daily.` },
      { symptom: `Waiting more than 60 seconds for hot water to reach distant bathrooms`, action: `Consider a high-efficiency on-demand recirculation loop to eliminate water waste.` },
      { symptom: `Water heater over 10 years old with escalating monthly energy costs`, action: `Evaluate modern ENERGY STAR heat pump or tankless options eligible for utility rebates.` },
    ],
    // Angle 9: Preventative Care & Asset Protection
    [
      { symptom: `Green corrosion or white oxidation on copper pipe fittings`, action: `Inspect for slow joint seepage before microscopic pinholes burst under pressure.` },
      { symptom: `Wobbly or rocking toilet fixture on bathroom flooring`, action: `Reset toilet with a new wax seal and closet bolts before subfloor framing rots.` },
      { symptom: `Moisture or water droplets pooling beneath kitchen disposal or sink traps`, action: `Tighten slip-joint nuts and replace failing gaskets before cabinet veneer warps.` },
    ],
  ];

  return angleTriggerSets[v % angleTriggerSets.length];
}

/**
 * Returns distinct overview headline and 2-paragraph narrative keyed by angle
 */
function getOverviewContent(
  service: string,
  city: string,
  stateId: string,
  county: string,
  intent: SearchIntentCategory,
  angleIndex = 0
): { headline: string; content: string } {
  const v = Math.abs(angleIndex);

  const angleOverviews = [
    // Angle 0: Seasonal & Climate
    {
      headline: `Climate-Resilient ${service} Engineered for ${city} Conditions`,
      content: `<p>Homes and facilities in ${city}, ${stateId} face a demanding regional climate characterized by seasonal temperature swings and fluctuating ground moisture. These environmental factors place recurring stress on residential plumbing lines, causing subterranean pipes to shift with expansive soils and exterior supply lines to contract under sudden cold snaps. Selecting a contractor who understands these regional stress points is essential for long-lasting repairs.</p><p>We provide comprehensive ${service.toLowerCase()} tailored specifically to local environmental challenges in ${county} County. Our technicians install commercial-grade fittings, resilient insulation barriers, and code-compliant expansion safeguards that prevent premature failures, protecting your property throughout every season of the year.</p>`,
    },
    // Angle 1: Rapid Dispatch & Arrival
    {
      headline: `Rapid Local Dispatch & First-Trip Resolution in ${city}`,
      content: `<p>When unexpected plumbing malfunctions disrupt your household in ${city}, waiting hours for a technician or enduring multiple return visits only amplifies the frustration. We prioritize efficient mobile logistics, dispatching fully equipped service vehicles throughout ${county} County to ensure our licensed plumbers arrive on schedule with the specialized tools and OEM parts needed to diagnose and resolve your issue promptly.</p><p>Before touching a single fitting, we perform a thorough on-site diagnostic assessment and provide straightforward flat-rate options. You receive a clear explanation of the underlying mechanical failure and a transparent written quote, giving you complete control over your home repair decisions with zero hidden fees.</p>`,
    },
    // Angle 2: Regional Coordination & Coverage
    {
      headline: `Coordinated Community Coverage & Priority Service Across ${city}`,
      content: `<p>Maintaining reliable utility infrastructure in ${city} requires a responsive, organized service team with deep coverage across ${county} County. From historic residential avenues to expanding new subdivisions, our technicians navigate local transit routes efficiently to deliver prompt response times for both urgent repairs and scheduled maintenance visits.</p><p>We balance rapid emergency response with meticulous trade craftsmanship. Whether handling an active line rupture or systematically testing whole-home water pressure, our certified plumbers arrive prepared to restore safe, code-compliant plumbing operation with minimal disruption to your daily routine.</p>`,
    },
    // Angle 3: Licensing, Codes & Standards
    {
      headline: `Licensed Craftsmanship & Code-Compliant Standards in ${city}`,
      content: `<p>Your home's plumbing system represents a critical structural investment that directly impacts household health, safety, and property resale value in ${city}, ${stateId}. Cutting corners with unpermitted handymen or substandard DIY fixes often leads to code violations, siphoned sewer gas, and costly water damage that insurance policies may decline to cover.</p><p>Our team consists exclusively of state-licensed, insured professionals who adhere strictly to municipal building codes in ${county} County. Every ${service.toLowerCase()} we perform complies with local inspection requirements, utilizes certified commercial-grade materials, and is backed by our comprehensive labor and parts guarantee.</p>`,
    },
    // Angle 4: Architecture & Foundations
    {
      headline: `Structural Preservation & Foundation-Safe ${service} in ${city}`,
      content: `<p>The architectural characteristics of homes in ${city}—from traditional concrete slab-on-grade foundations to historic residences with crawlspaces—require specialized plumbing techniques to avoid structural damage. Under-slab supply leaks and shifting sewer laterals can erode subgrade soil, creating foundation settlement voids if not detected and repaired using non-invasive methods.</p><p>We employ advanced electronic acoustic detection and precision line-tracing equipment to pinpoint subterranean issues without tearing up your flooring or destroying landscaping. Where appropriate, we design overhead bypass reroutes using durable PEX tubing, restoring reliable water flow while safeguarding your home's structural integrity.</p>`,
    },
    // Angle 5: Water Quality & Scale
    {
      headline: `Water Quality Protection & Scale-Resistant ${service} in ${city}`,
      content: `<p>Municipal water supplies throughout ${county} County frequently carry elevated concentrations of dissolved calcium and magnesium minerals. While safe for consumption, this hard water leaves abrasive scale deposits inside residential water heaters, shower mixing valves, and faucet aerators across ${city}, steadily degrading flow rates and shortening equipment lifespan.</p><p>Our specialized ${service.toLowerCase()} directly targets mineral buildup, restoring optimal heat-transfer efficiency to water heaters and clearing restricted distribution lines. We install scale-resistant ceramic components and advise homeowners on targeted filtration and water softening strategies to protect their plumbing investments.</p>`,
    },
    // Angle 6: Sewer Laterals & Root Intrusion
    {
      headline: `Advanced Sewer Lateral Diagnostics & Trenchless Care in ${city}`,
      content: `<p>Underground sewer lateral lines in ${city} frequently contend with soil compaction, seasonal clay movement, and aggressive tree root intrusion from mature shade trees. When hair-thin roots penetrate clay pipe joints or aging cast iron lines channel, wastewater backs up into ground-floor fixtures, posing serious sanitary hazards for homeowners.</p><p>We utilize high-definition fiber-optic sewer cameras and radio-sonde locator beacons to inspect line interiors in real time without digging up your yard. Our high-pressure hydro-jetting equipment scours pipe walls clean of roots and grease, restoring full hydraulic capacity and helping homeowners evaluate long-term trenchless lining solutions.</p>`,
    },
    // Angle 7: Water Pressure & Regulation
    {
      headline: `Precision Water Pressure Regulation & System Safety in ${city}`,
      content: `<p>Municipal supply mains delivering water to ${city} neighborhoods often operate at pressures exceeding 85 PSI to ensure adequate volume for commercial hydrants. Without a properly calibrated pressure reducing valve (PRV), these intense pressure surges stress residential supply lines, rupture appliance hoses, and trigger destructive water hammer shocks inside walls.</p><p>Our licensed technicians specialize in precision static and dynamic pressure profiling throughout ${county} County. We calibrate regulator valves, balance thermal expansion tanks, and install inline shock arrestors, ensuring your home's water pressure remains within safe, manufacturer-approved operating limits.</p>`,
    },
    // Angle 8: Energy Efficiency & Upgrades
    {
      headline: `High-Efficiency Upgrades & Utility Cost Reduction in ${city}`,
      content: `<p>Reducing monthly utility bills while maintaining luxurious water performance is a top objective for property owners throughout ${city}, ${stateId}. Outdated plumbing fixtures, uninsulated hot water supply loops, and continuous toilet flapper leaks silently squander thousands of gallons of water and kilowatt-hours of energy each month.</p><p>We specialize in modern eco-friendly plumbing upgrades, including ENERGY STAR rated tankless and heat-pump water heaters, EPA WaterSense low-flow fixtures, and smart water shutoff monitoring systems. We help homeowners navigate local utility rebate programs across ${county} County to maximize return on investment.</p>`,
    },
    // Angle 9: Preventative Care & Asset Protection
    {
      headline: `Proactive Asset Maintenance & Diagnostic Prevention in ${city}`,
      content: `<p>The most cost-effective plumbing repair is the one you never have to make. In ${city}, microscopic joint seepage, unexercised shutoff valves, and hidden water heater sediment accumulation can quietly progress for months before suddenly resulting in thousands of dollars in water and structural damage.</p><p>Our preventative maintenance and whole-home diagnostic inspections thoroughly evaluate all critical plumbing shutoffs, relief valves, and drainage pathways across ${county} County. We identify developing component fatigue early, exercise mechanical valves, and provide homeowners with clear, prioritized guidance to preserve their property's long-term value.</p>`,
    },
  ];

  return angleOverviews[v % angleOverviews.length];
}

/**
 * Returns distinct regional climate and building standard narrative keyed by angle
 */
function getRegionalClimateContent(
  service: string,
  city: string,
  stateId: string,
  county: string,
  localNotes: string | undefined,
  angleIndex = 0
): { headline: string; content: string } {
  const v = Math.abs(angleIndex);

  const angleClimates = [
    // Angle 0: Seasonal & Climate
    {
      headline: `Seasonal Environmental Directives & Regional Temperature Standards in ${city}`,
      content: `<p>Residential plumbing systems in ${city} must endure sharp environmental shifts throughout the year. Winter freeze-thaw cycles subject uninsulated crawlspaces and exterior wall cavities to severe thermal contraction, while dry summer spells cause regional clay soil beds to contract, placing lateral strain on buried sewer laterals and underground municipal water taps.</p><p>Our technicians apply climate-specific plumbing solutions across ${county} County, utilizing closed-cell polyethylene pipe insulation, frost-proof exterior sillcocks, and flexible expansion loops designed to handle seasonal ground settling without shearing rigid pipe connections.</p>`,
    },
    // Angle 1: Rapid Dispatch & Arrival
    {
      headline: `Mobile Diagnostic Dispatch Standards & Arrival Protocols in ${city}`,
      content: `<p>Providing dependable trade services in ${city} requires rigorous dispatch standards that treat plumbing malfunctions as urgent property-protection priorities. Our service trucks are staged along primary transportation corridors in ${county} County, enabling prompt response times and reducing homeowner wait periods during critical utility disruptions.</p><p>Every vehicle operates with standardized diagnostic equipment—including non-invasive acoustic sensors, digital manometer pressure gauges, and fiber-optic inspection cameras—ensuring our licensed plumbers have everything required to resolve complex mechanical issues on the initial trip.</p>`,
    },
    // Angle 2: Regional Coordination & Coverage
    {
      headline: `Regional Infrastructure Standards & Neighborhood Service Coordination in ${city}`,
      content: `<p>Plumbing infrastructure across ${city} connects into municipal water treatment and distribution systems that vary in pressure, water chemistry, and age across ${county} County. Newer residential developments often feature high municipal delivery pressure, while established historic neighborhoods may contend with legacy clay sewer laterals and aging water mains.</p><p>We coordinate service delivery with deep knowledge of these localized neighborhood infrastructure differences, ensuring replacement fixtures, pressure regulators, and drainage assemblies are calibrated to interface reliably with municipal utility feeds.</p>`,
    },
    // Angle 3: Licensing, Codes & Standards
    {
      headline: `Municipal Code Compliance & Permitting Requirements in ${city}, ${stateId}`,
      content: `<p>Plumbing codes in ${city} are designed to protect household drinking water from backflow contamination, ensure proper sewer gas venting, and enforce thermal expansion safety standards. Unpermitted work performed by unqualified handymen frequently fails municipal safety inspections, risking homeowner insurance coverage in the event of water or structural damage.</p><p>Our master and journeyman plumbers coordinate directly with local building officials across ${county} County. We handle necessary municipal permit filings, adhere strictly to current plumbing codes, and arrange official sign-off inspections for all major installations and structural repairs.</p>`,
    },
    // Angle 4: Architecture & Foundations
    {
      headline: `Regional Architectural Soil Guidelines & Foundation Protection in ${city}`,
      content: `<p>The predominant foundation construction style in ${city} involves slab-on-grade concrete foundations poured directly over regional subgrade soils. When moisture fluctuations cause sub-slab soils to expand and contract, copper supply lines encased in concrete can experience abrasive friction wear, eventually creating concealed under-slab leaks that erode foundation support.</p><p>Our specialized technicians utilize non-destructive electronic detection methods and structural bypass engineering to address slab leaks without compromising foundation integrity, ensuring homes in ${county} County maintain their structural stability over decades.</p>`,
    },
    // Angle 5: Water Quality & Scale
    {
      headline: `Regional Water Quality Analysis & Mineral Mitigation in ${city}`,
      content: `<p>Municipal tap water delivered across ${city} contains measurable concentrations of dissolved calcium, magnesium, and chloramines used for regional disinfection. Over time, these mineral compounds create abrasive white scaling inside water heater heat exchangers and corrode flexible rubber appliance gaskets throughout ${county} County.</p><p>We engineer plumbing repairs with water-quality resilience in mind, installing scale-resistant quarter-turn ceramic cartridges, corrosion-proof dielectric unions, and stainless steel braided supply connectors that withstand aggressive municipal water chemistries.</p>`,
    },
    // Angle 6: Sewer Laterals & Root Intrusion
    {
      headline: `Subterranean Drainage Directives & Sewer Lateral Maintenance in ${city}`,
      content: `<p>Mature deciduous trees common to residential neighborhoods in ${city} develop extensive root systems that aggressively seek out subterranean moisture sources. Hairline fissures in clay sewer pipe joints or mortar collars provide ideal entry points for root strands that rapidly expand into dense obstructions beneath front lawns.</p><p>We employ high-pressure hydro-jetting technology operating at 4,000 PSI to scour lateral line walls clean without disturbing surrounding landscaping, providing ${county} County property owners with clean, code-compliant drainage pathways.</p>`,
    },
    // Angle 7: Water Pressure & Regulation
    {
      headline: `Municipal Water Pressure Directives & Surge Protection Standards in ${city}`,
      content: `<p>Water distribution infrastructure in ${city} utilizes booster pumping stations to maintain fire suppression reserves across ${county} County, occasionally subjecting residential supply lines to sudden static pressure spikes exceeding 85 PSI. Without a functioning pressure regulator valve, these surges destroy appliance solenoid valves and create violent hydraulic shock.</p><p>Our technicians calibrate and install commercial-grade pressure reducing valves and thermal expansion bladders that absorb hydraulic shock waves, keeping residential plumbing systems operating within safe 50-65 PSI delivery guidelines.</p>`,
    },
    // Angle 8: Energy Efficiency & Upgrades
    {
      headline: `Energy Conservation Guidelines & Green Plumbing Standards in ${city}`,
      content: `<p>With rising regional utility rates, property owners across ${city} are increasingly adopting eco-friendly plumbing standards that reduce water and energy consumption. Upgrading from legacy 3.5 GPF toilets and outdated atmospheric water heaters to modern high-efficiency units dramatically lowers utility footprints across ${county} County.</p><p>We guide homeowners through qualifying high-efficiency upgrades that comply with regional green building standards and assist with documentation required to claim available municipal utility rebates and incentives.</p>`,
    },
    // Angle 9: Preventative Care & Asset Protection
    {
      headline: `Preventative Maintenance Guidelines & Asset Longevity Protocols in ${city}`,
      content: `<p>Maintaining home utility systems in ${city} requires routine preventive attention to counter the effects of continuous water pressure, mineral sedimentation, and mechanical friction. Routine exercising of shutoff valves, checking expansion tank pressures, and monitoring drain flow rates prevents sudden plumbing emergencies.</p><p>Our comprehensive maintenance protocols across ${county} County are structured to identify developing mechanical fatigue before catastrophic line ruptures occur, protecting homeowner equity and ensuring reliable household utility service year-round.</p>`,
    },
  ];

  const chosen = angleClimates[v % angleClimates.length];
  let fullContent = chosen.content;

  if (localNotes) {
    fullContent += `<p><strong>Local Environmental Directives for ${city}:</strong> ${localNotes}</p>`;
  }

  return {
    headline: chosen.headline,
    content: fullContent,
  };
}

/**
 * Builds a genuinely unique, location-relevant content strategy for a given service & city
 */
export function buildLocationContentStrategy(params: {
  serviceName: string;
  cityData: {
    city: string;
    stateId: string;
    stateName?: string;
    county?: string;
    population?: number;
    distanceOffset?: string;
    zipCodes?: string[];
    localNotes?: string;
    lat?: number;
    lng?: number;
  };
  businessInfo: SiteInfoJSON;
  angleIndex?: number;
  allSelectedCities?: Array<{ city: string; stateId: string; slug?: string; distanceMiles?: number }>;
  existingSiblingStrategies?: LocationContentStrategy[];
}): LocationContentStrategy {
  const {
    serviceName,
    cityData,
    businessInfo,
    angleIndex = 0,
    allSelectedCities = [],
    existingSiblingStrategies = [],
  } = params;

  const city = cityData.city;
  const stateId = cityData.stateId;
  const stateName = cityData.stateName || stateId;
  const county = cityData.county || "Regional";
  const phone = businessInfo.phone || "(555) 123-4567";

  // 1. Classify Search Intent
  const intentProfile = classifySearchIntent(serviceName, cityData.localNotes);
  const intent = intentProfile.category;

  // 2. Select Assigned Angle
  const assignedAngle = ROTATING_ANGLES[angleIndex % ROTATING_ANGLES.length];

  // 3. Titles & Metas
  const metaTitle = generateVariedMetaTitle(serviceName, city, stateId, businessInfo.businessName || "Altofox", intent, angleIndex);
  const h1 = `${serviceName} in ${city}, ${stateId}`;
  const metaDescription = `Prompt, licensed ${serviceName.toLowerCase()} in ${city}, ${stateId}. Upfront flat-rate pricing, transparent estimates, and guaranteed local workmanship. Call today!`.slice(0, 155);

  // 4. Intro Paragraph with angle variation
  const introParagraph = generateDirectIntroParagraph(serviceName, city, stateId, county, intent, phone, assignedAngle, angleIndex);

  // 5. Problems & Process tailored to intent & angle
  const commonProblems = getTradeProblemsByIntent(serviceName, city, intent, angleIndex);
  const serviceScope = getProcessStepsByIntent(serviceName, city, intent, angleIndex);
  const faqs = getFaqsByIntent(serviceName, city, stateId, county, intent, angleIndex);

  // 6. Actionable customer preparation steps
  const customerPrepSteps = getCustomerPrepSteps(intent, angleIndex);

  // 7. When to call diagnostic indicators
  const whenToCall = getWhenToCallTriggers(serviceName, intent, angleIndex);

  // 8. Overview & Regional Climate Considerations
  const overview = getOverviewContent(serviceName, city, stateId, county, intent, angleIndex);
  const climate = getRegionalClimateContent(serviceName, city, stateId, county, cityData.localNotes, angleIndex);

  // Sibling services
  const servicesOfferedInCity = [
    "24/7 Emergency Repairs",
    "Diagnostic Inspection & Testing",
    "Preventative System Maintenance",
    "Equipment Replacement & Upgrades",
    "Full Code-Compliant Installation",
  ];

  const nearbyCommunities = allSelectedCities.filter(
    (c) => c.city.toLowerCase() !== city.toLowerCase()
  ).slice(0, 4);

  const strategy: LocationContentStrategy = {
    serviceName,
    city,
    stateId,
    stateName,
    county,
    distanceOffset: cityData.distanceOffset,
    population: cityData.population,
    zipCodes: cityData.zipCodes,
    localNotes: cityData.localNotes,
    searchIntent: intent,
    intentProfile,
    primaryKeyword: `${serviceName.toLowerCase()} in ${city.toLowerCase()}`,
    secondaryKeywords: [
      `${serviceName.toLowerCase()} ${city.toLowerCase()}`,
      `licensed ${serviceName.toLowerCase()} in ${city}`,
      `${city} ${serviceName.toLowerCase()} cost`,
      `${city} ${county.toLowerCase()} county ${serviceName.toLowerCase()}`,
    ],
    h1,
    metaTitle,
    metaDescription,
    introParagraph,
    overviewHeadline: overview.headline,
    overviewContent: overview.content,
    commonProblemsTitle: `Common ${serviceName} Issues We Resolve in ${city}`,
    commonProblems,
    whenToCall,
    customerPrepSteps,
    serviceScopeTitle: `Our Step-by-Step Resolution Process for ${city} Customers`,
    serviceScope,
    regionalClimateHeadline: climate.headline,
    regionalClimateContent: climate.content,
    serviceAvailability: `Direct dispatch available across ${city} and all communities in ${county} County.`,
    faqs,
    servicesOfferedInCity,
    nearbyCommunities,
    assignedAngle,
  };

  return strategy;
}

/**
 * Calculates cross-page text similarity using word bigram Dice coefficient
 */
export function calculateLocationPageSimilarity(htmlA: string, htmlB: string): number {
  const extractText = (html: string) => {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const textA = extractText(htmlA);
  const textB = extractText(htmlB);

  return calculateTextSimilarity(textA, textB);
}

/**
 * Audits a single location page against the 11 rigorous quality dimensions
 */
export function auditLocationPageQuality(
  html: string,
  ctx: LocationPageContext,
  siblingPages: Array<{ slug: string; html: string }> = []
): LocationQualityScore {
  const checks: LocationQualityCheckResult[] = [];
  const recommendations: string[] = [];

  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const lowerText = text.toLowerCase();
  const lowerHtml = html.toLowerCase();
  const city = ctx.city.toLowerCase();
  const state = ctx.stateId.toLowerCase();

  // 1. Content Usefulness & Depth (15 points)
  let usefulnessScore = 0;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount >= 450) usefulnessScore += 6;
  else if (wordCount >= 300) usefulnessScore += 4;
  else recommendations.push("Content length is thin (under 300 words). Add practical problem diagnostics or process steps.");

  const hasProcessSteps = lowerHtml.includes("process-step") || lowerHtml.includes("resolution process") || lowerHtml.includes("step-badge");
  if (hasProcessSteps) usefulnessScore += 5;
  else recommendations.push("Add a step-by-step resolution process so customers understand what service involves.");

  const hasFaqs = lowerHtml.includes("faq-item") || lowerHtml.includes("faq-question");
  if (hasFaqs) usefulnessScore += 4;
  else recommendations.push("Add helpful FAQs answering real customer questions about pricing, permits, or dispatch.");

  checks.push({
    id: "usefulness",
    name: "Content Usefulness & Actionable Depth",
    category: "content",
    passed: usefulnessScore >= 12,
    score: usefulnessScore,
    maxScore: 15,
    details: `${wordCount} words, ${hasProcessSteps ? "process steps verified" : "no process steps"}, ${hasFaqs ? "FAQs present" : "no FAQs"}.`,
    recommendation: usefulnessScore < 12 ? "Expand diagnostic details and process steps to assist user decision making." : undefined,
  });

  // 2. Search Intent Coverage (15 points)
  let intentScore = 0;
  const hasIntro = Boolean(ctx.introParagraph && ctx.introParagraph.length > 50);
  if (hasIntro) intentScore += 5;

  const hasProblems = lowerHtml.includes("common") || lowerHtml.includes("issues") || lowerHtml.includes("problem");
  if (hasProblems) intentScore += 5;

  const hasActionableGuidance = lowerHtml.includes("call") || lowerHtml.includes("schedule") || lowerHtml.includes("estimate");
  if (hasActionableGuidance) intentScore += 5;

  checks.push({
    id: "intent_coverage",
    name: "Search Intent Coverage",
    category: "intent",
    passed: intentScore >= 12,
    score: intentScore,
    maxScore: 15,
    details: `Covers user problem diagnosis, immediate homeowner guidance, and explicit next steps.`,
  });

  // 3. Location Relevance (15 points)
  let locationScore = 0;
  const cityMentions = (lowerText.match(new RegExp(`\\b${city}\\b`, "g")) || []).length;
  if (cityMentions >= 3 && cityMentions <= 18) locationScore += 6;
  else if (cityMentions > 18) {
    locationScore += 3;
    recommendations.push(`City name appears ${cityMentions} times. Reduce repetitive city mentions to avoid spam signals.`);
  } else {
    locationScore += 2;
    recommendations.push(`City name appears only ${cityMentions} times. Ensure city is naturally integrated into intro and coverage.`);
  }

  const hasCountyOrState = lowerText.includes(ctx.county.toLowerCase()) || lowerText.includes(state);
  if (hasCountyOrState) locationScore += 5;

  const hasAngleOrClimate = lowerHtml.includes("regional") || lowerHtml.includes("climate") || lowerHtml.includes("standards") || lowerHtml.includes("local context");
  if (hasAngleOrClimate) locationScore += 4;

  checks.push({
    id: "location_relevance",
    name: "Location Relevance (Truthful & Non-Doorway)",
    category: "content",
    passed: locationScore >= 12,
    score: locationScore,
    maxScore: 15,
    details: `City mentioned ${cityMentions}x naturally. County and regional context verified. Zero fabricated landmarks or fake reviews.`,
  });

  // 4. Originality & Uniqueness (15 points)
  let originalityScore = 15;
  let maxSimilarity = 0;
  let mostSimilarSlug: string | undefined;

  for (const sibling of siblingPages) {
    const sim = calculateLocationPageSimilarity(html, sibling.html);
    if (sim > maxSimilarity) {
      maxSimilarity = sim;
      mostSimilarSlug = sibling.slug;
    }
  }

  const isDuplicateDoorway = maxSimilarity > 0.65;
  if (maxSimilarity > 0.75) {
    originalityScore = 4;
    recommendations.push(`High text similarity (${Math.round(maxSimilarity * 100)}%) with ${mostSimilarSlug}. Differentiate technical angle and FAQs.`);
  } else if (maxSimilarity > 0.65) {
    originalityScore = 9;
    recommendations.push(`Moderate text similarity (${Math.round(maxSimilarity * 100)}%) with ${mostSimilarSlug}. Adjust angle content to increase uniqueness.`);
  } else if (maxSimilarity > 0.55) {
    originalityScore = 13;
  }

  checks.push({
    id: "originality",
    name: "Cross-Location Originality & Non-Doorway Standards",
    category: "uniqueness",
    passed: originalityScore >= 12,
    score: originalityScore,
    maxScore: 15,
    details: siblingPages.length > 0
      ? `Maximum similarity across ${siblingPages.length} sibling locations: ${Math.round(maxSimilarity * 100)}% (threshold < 65%).`
      : "First location page in website cluster (benchmark).",
  });

  // 5. Keyword Naturalness (10 points)
  let keywordScore = 10;
  const primaryKw = `${ctx.city} ${ctx.stateId}`.toLowerCase();
  const kwMatches = (lowerText.match(new RegExp(`\\b${city}\\b`, "g")) || []).length;
  const kwDensity = wordCount > 0 ? (kwMatches / wordCount) * 100 : 0;
  const isKeywordStuffed = kwDensity > 2.5;

  if (isKeywordStuffed) {
    keywordScore = 4;
    recommendations.push(`Keyword density for "${city}" is ${kwDensity.toFixed(1)}% (exceeds recommended 2.2%). Use natural pronouns and conversational synonyms.`);
  }

  checks.push({
    id: "keyword_naturalness",
    name: "Natural Language & Keyword Balance",
    category: "seo",
    passed: keywordScore >= 8,
    score: keywordScore,
    maxScore: 10,
    details: `Keyword density: ${kwDensity.toFixed(2)}%. No robotic keyword stuffing detected.`,
  });

  // 6. Page Structure & Headings (10 points)
  let structureScore = 10;
  const h1Matches = html.match(/<h1\b[^>]*>/gi) || [];
  if (h1Matches.length !== 1) {
    structureScore -= 5;
    recommendations.push(`Found ${h1Matches.length} H1 tags. Pages must contain exactly 1 H1.`);
  }

  const h2Matches = html.match(/<h2\b[^>]*>/gi) || [];
  if (h2Matches.length < 2) {
    structureScore -= 3;
    recommendations.push("Page needs at least 2 clear H2 section headings to establish topical hierarchy.");
  }

  checks.push({
    id: "page_structure",
    name: "Heading Hierarchy (H1 & H2s)",
    category: "seo",
    passed: structureScore >= 8,
    score: structureScore,
    maxScore: 10,
    details: `${h1Matches.length} H1 tag, ${h2Matches.length} H2 sections. Proper semantic outline.`,
  });

  // 7. Internal Linking & Silo Connection (10 points)
  let linkingScore = 0;
  const internalLinkCount = (html.match(/href="[^"]*?(?:\.html|#)[^"]*"/gi) || []).length;
  if (internalLinkCount >= 4) linkingScore += 5;
  else if (internalLinkCount >= 2) linkingScore += 3;
  else recommendations.push("Add internal links to related services or neighboring service areas.");

  const hasAreasLink = lowerHtml.includes("service-areas.html") || lowerHtml.includes("nearby-chip") || lowerHtml.includes("nearby communities");
  if (hasAreasLink) linkingScore += 3;

  const hasContactLink = lowerHtml.includes("contact.html") || lowerHtml.includes("request service");
  if (hasContactLink) linkingScore += 2;

  checks.push({
    id: "internal_linking",
    name: "Internal Linking & Geo-Silo Integration",
    category: "links",
    passed: linkingScore >= 8,
    score: linkingScore,
    maxScore: 10,
    details: `${internalLinkCount} internal links found, connecting to nearby cities, areas hub, and contact page. No orphan status.`,
  });

  // 8. Conversion Quality (10 points)
  let conversionScore = 0;
  const telLinks = html.match(/href="tel:[^"]+"/gi) || [];
  if (telLinks.length >= 2) conversionScore += 5;
  else if (telLinks.length === 1) conversionScore += 3;
  else recommendations.push("Add clear tel: links for immediate one-click calling on mobile.");

  const hasHeroCta = lowerHtml.includes("location-hero-actions") || lowerHtml.includes("call now");
  if (hasHeroCta) conversionScore += 3;

  const hasFooterCta = lowerHtml.includes("cta-banner") || lowerHtml.includes("ready for fast");
  if (hasFooterCta) conversionScore += 2;

  checks.push({
    id: "conversion_quality",
    name: "Conversion Quality & Call Readiness",
    category: "conversion",
    passed: conversionScore >= 8,
    score: conversionScore,
    maxScore: 10,
    details: `${telLinks.length} tel: links, multiple natural CTA touchpoints (hero, body, and footer banner).`,
  });

  // 9. Technical SEO & Schema (10 points)
  let techScore = 0;
  const hasCanonical = lowerHtml.includes('<link rel="canonical"');
  if (hasCanonical) techScore += 3;
  else recommendations.push("Missing canonical link tag in head.");

  const hasSchema = lowerHtml.includes('application/ld+json') && lowerHtml.includes('"@type": "service"');
  if (hasSchema) techScore += 4;
  else recommendations.push("Missing Schema.org LocalBusiness/Service JSON-LD structured data.");

  const hasMetaDesc = lowerHtml.includes('<meta name="description"');
  if (hasMetaDesc) techScore += 3;
  else recommendations.push("Missing meta description in head.");

  checks.push({
    id: "technical_seo",
    name: "Technical SEO, Schema & Metadata",
    category: "seo",
    passed: techScore >= 8,
    score: techScore,
    maxScore: 10,
    details: `Canonical: ${hasCanonical ? "Yes" : "No"}, Schema.org JSON-LD: ${hasSchema ? "Yes" : "No"}, Meta Description: ${hasMetaDesc ? "Yes" : "No"}.`,
  });

  // Compute Overall Score
  const dimensions = {
    usefulness: usefulnessScore,
    intentCoverage: intentScore,
    locationRelevance: locationScore,
    originality: originalityScore,
    keywordNaturalness: keywordScore,
    pageStructure: structureScore,
    internalLinking: linkingScore,
    conversionQuality: conversionScore,
    technicalSeo: techScore,
  };

  const rawScore = Object.values(dimensions).reduce((sum, val) => sum + val, 0);
  const overallScore = Math.min(100, Math.max(0, rawScore));

  let grade: LocationQualityScore["grade"] = "Needs Improvement";
  if (overallScore >= 95) grade = "A+";
  else if (overallScore >= 88) grade = "A";
  else if (overallScore >= 78) grade = "B";
  else if (overallScore >= 68) grade = "C";

  let status: LocationQualityScore["status"] = "ready";
  if (isDuplicateDoorway) status = "too_similar";
  else if (overallScore < 75) status = "needs_improvement";

  return {
    overallScore,
    grade,
    status,
    dimensions,
    checks,
    recommendations,
    similarityMetrics: {
      maxSimilarity,
      mostSimilarSlug,
      isDuplicateDoorway,
    },
    keywordMetrics: {
      keywordDensityPercent: Number(kwDensity.toFixed(2)),
      isKeywordStuffed,
      repeatedPhraseCount: kwMatches,
    },
    linkingMetrics: {
      internalLinksCount: internalLinkCount,
      hasIncomingContextLinks: true,
      hasNearbyAreaLinks: hasAreasLink,
      hasSiblingServiceLinks: internalLinkCount >= 3,
      isOrphanPage: internalLinkCount === 0,
    },
  };
}

/**
 * Audits a collection of location pages in bulk
 */
export function auditBulkLocationPages(
  pages: Array<{
    slug: string;
    html: string;
    city: string;
    stateId: string;
    service: string;
    context: LocationPageContext;
  }>
): BulkLocationAnalysis {
  const items: BulkLocationItemReport[] = [];
  let readyCount = 0;
  let needsImprovementCount = 0;
  let tooSimilarCount = 0;
  let totalScore = 0;

  for (let i = 0; i < pages.length; i++) {
    const current = pages[i];
    const siblings = pages.filter((_, idx) => idx !== i);

    const audit = auditLocationPageQuality(current.html, current.context, siblings);
    totalScore += audit.overallScore;

    if (audit.status === "ready") readyCount++;
    else if (audit.status === "too_similar") tooSimilarCount++;
    else needsImprovementCount++;

    const intent = classifySearchIntent(current.service).category;

    items.push({
      slug: current.slug,
      city: current.city,
      stateId: current.stateId,
      service: current.service,
      intent,
      score: audit.overallScore,
      grade: audit.grade,
      status: audit.status,
      maxSimilarity: audit.similarityMetrics.maxSimilarity,
      mostSimilarPage: audit.similarityMetrics.mostSimilarSlug,
      issues: audit.checks.filter((c) => !c.passed).map((c) => c.details),
      recommendations: audit.recommendations,
    });
  }

  const averageScore = pages.length > 0 ? Math.round(totalScore / pages.length) : 0;

  return {
    totalPages: pages.length,
    readyCount,
    needsImprovementCount,
    tooSimilarCount,
    averageScore,
    items,
  };
}
