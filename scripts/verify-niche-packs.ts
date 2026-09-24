import { NICHE_PACKS, FALLBACK_NICHE, getNicheById, findNicheByIndustry, generateKeywordsForNiche } from "../niches";
import { buildAIContentPrompt } from "../lib/generator/ai-content-prompt";
import { WebsiteFormData } from "../lib/generator/prompt";

console.log("==================================================================");
console.log("VERIFYING ALL 21 NICHE PACKS AND GENERATOR INTEGRATION");
console.log("==================================================================");

// 1. Verify Count
console.log(`\n--> 1. Checking Niche Pack Registry (${NICHE_PACKS.length} packs)...`);
if (NICHE_PACKS.length !== 21) {
  throw new Error(`Expected 21 niche packs (20 trades + 1 fallback), but found ${NICHE_PACKS.length}`);
}
console.log("✓ Exactly 21 packs registered (20 trades + 1 fallback).");

// 2. Validate Each Pack's Completeness
console.log("\n--> 2. Validating Each Pack Schema & Content...");
for (const pack of NICHE_PACKS) {
  if (!pack.id || typeof pack.id !== "string") throw new Error(`Pack missing id`);
  if (!pack.name || typeof pack.name !== "string") throw new Error(`Pack ${pack.id} missing name`);
  if (!pack.schemaType || typeof pack.schemaType !== "string") throw new Error(`Pack ${pack.id} missing schemaType`);
  if (typeof pack.emergencyService !== "boolean") throw new Error(`Pack ${pack.id} missing emergencyService boolean`);
  
  // commonServices: 8-12
  if (!Array.isArray(pack.commonServices) || pack.commonServices.length < 8) {
    throw new Error(`Pack ${pack.id} has ${pack.commonServices?.length} commonServices (expected >= 8)`);
  }

  // customerPainPoints
  if (!Array.isArray(pack.customerPainPoints) || pack.customerPainPoints.length < 4) {
    throw new Error(`Pack ${pack.id} has insufficient customerPainPoints`);
  }

  // trustSignals
  if (!Array.isArray(pack.trustSignals) || pack.trustSignals.length < 4) {
    throw new Error(`Pack ${pack.id} has insufficient trustSignals`);
  }

  // faqTopics: 10 common customer questions
  if (!Array.isArray(pack.faqTopics) || pack.faqTopics.length !== 10) {
    throw new Error(`Pack ${pack.id} has ${pack.faqTopics?.length} faqTopics (expected exactly 10)`);
  }

  // processSteps
  if (!Array.isArray(pack.processSteps) || pack.processSteps.length < 3) {
    throw new Error(`Pack ${pack.id} has insufficient processSteps`);
  }

  // recommendedSections & recommendedThemes
  if (!Array.isArray(pack.recommendedSections) || pack.recommendedSections.length < 4) {
    throw new Error(`Pack ${pack.id} has insufficient recommendedSections`);
  }
  if (!Array.isArray(pack.recommendedThemes) || pack.recommendedThemes.length < 1) {
    throw new Error(`Pack ${pack.id} has insufficient recommendedThemes`);
  }

  // imageQueries: hero, services, team, work
  if (!pack.imageQueries?.hero?.length || !pack.imageQueries?.services?.length || !pack.imageQueries?.team?.length || !pack.imageQueries?.work?.length) {
    throw new Error(`Pack ${pack.id} missing complete imageQueries (hero, services, team, work)`);
  }

  // keywordPatterns
  if (!Array.isArray(pack.keywordPatterns) || pack.keywordPatterns.length < 4) {
    throw new Error(`Pack ${pack.id} missing keywordPatterns`);
  }

  // toneNotes
  if (!pack.toneNotes || typeof pack.toneNotes !== "string") {
    throw new Error(`Pack ${pack.id} missing toneNotes`);
  }

  console.log(`  ✓ [${pack.id.padEnd(23)}] "${pack.name}" | Schema: ${pack.schemaType.padEnd(20)} | Emergency: ${pack.emergencyService ? "YES" : "NO "} | Services: ${pack.commonServices.length} | FAQs: ${pack.faqTopics.length}`);
}

// 3. Test Trade Detection / findNicheByIndustry
console.log("\n--> 3. Testing Trade Detection Heuristics...");
const tradeTests: Array<{ input: string; expectedId: string }> = [
  { input: "Plumber", expectedId: "plumber" },
  { input: "Emergency Drain Cleaning & Pipe Repair", expectedId: "plumber" },
  { input: "Electrician", expectedId: "electrician" },
  { input: "HVAC & Air Conditioning", expectedId: "hvac" },
  { input: "Roofing Contractor", expectedId: "roofing" },
  { input: "Tree Service & Tree Removal", expectedId: "tree-service" },
  { input: "Landscaping & Lawn Care", expectedId: "landscaping" },
  { input: "House Cleaning & Maid Service", expectedId: "house-cleaning" },
  { input: "Pest Control & Termite Exterminator", expectedId: "pest-control" },
  { input: "Pressure Washing & Roof Cleaning", expectedId: "pressure-washing" },
  { input: "Painting & Drywall", expectedId: "painting" },
  { input: "Handyman & Home Repair", expectedId: "handyman" },
  { input: "General Contractor & Home Remodeling", expectedId: "general-contractor" },
  { input: "Locksmith & Car Lockout", expectedId: "locksmith" },
  { input: "Garage Door Repair & Opener Service", expectedId: "garage-door" },
  { input: "Moving Company & Long Distance Relocation", expectedId: "moving-company" },
  { input: "Auto Repair & Brake Shop", expectedId: "auto-repair" },
  { input: "Towing & 24/7 Roadside Assistance", expectedId: "towing" },
  { input: "Pool Service & Pool Maintenance", expectedId: "pool-service" },
  { input: "Junk Removal & Estate Cleanout", expectedId: "junk-removal" },
  { input: "Carpet Cleaning & Upholstery Care", expectedId: "carpet-cleaning" },
  { input: "Custom Specialty Solar & Battery", expectedId: "general-local-service" }, // Fallback check
];

for (const t of tradeTests) {
  const resolved = findNicheByIndustry(t.input);
  if (resolved.id !== t.expectedId) {
    throw new Error(`Detection failed for "${t.input}": expected "${t.expectedId}", got "${resolved.id}"`);
  }
  console.log(`  ✓ "${t.input}" -> [${resolved.id}] (${resolved.name})`);
}

// 4. Test Keyword Generation for Niche
console.log("\n--> 4. Testing SEO Keyword Pattern Generator...");
const sampleLocksmith = getNicheById("locksmith");
const locksmithKeywords = generateKeywordsForNiche(
  sampleLocksmith,
  "Austin",
  "TX",
  ["Round Rock", "Cedar Park", "Pflugerville"]
);
console.log(`Generated ${locksmithKeywords.length} keywords for Locksmith in Austin, TX:`);
locksmithKeywords.slice(0, 6).forEach((kw) => console.log(`  - ${kw}`));
if (!locksmithKeywords.some((k) => k.toLowerCase().includes("austin"))) {
  throw new Error("Expected keywords to include Austin");
}

// 5. Test AI Content Prompt Injection
console.log("\n--> 5. Testing AI Prompt Injection for Electrician...");
const sampleFormData: WebsiteFormData = {
  businessName: "VoltCraft Electricians",
  businessType: "Electrician",
  city: "Denver",
  stateRegion: "CO",
  targetKeywords: "electrician denver co",
  phone: "(303) 555-0199",
};
const aiPrompt = buildAIContentPrompt(sampleFormData);
if (!aiPrompt.includes("SCHEMA TYPE: Electrician")) {
  throw new Error("AI Content prompt missing Electrician schema type");
}
if (!aiPrompt.includes("=== NICHE PACK / INDUSTRY INTELLIGENCE (ELECTRICIAN) ===")) {
  throw new Error("AI Content prompt missing Niche Pack intelligence block");
}
if (!aiPrompt.includes("KEY CUSTOMER PAIN POINTS TO SOLVE:")) {
  throw new Error("AI Content prompt missing customer pain points");
}
console.log("✓ AI prompt contains comprehensive Niche Pack intelligence for Electrician.");

console.log("\n==================================================================");
console.log("ALL 21 NICHE PACK VERIFICATION TESTS COMPLETED SUCCESSFULLY!");
console.log("==================================================================");
