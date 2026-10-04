/**
 * Verification Script: Content Differentiation Analysis for Chicago Plumbing
 *
 * Generates the 5 requested pages:
 * 1. Homepage
 * 2. Water Heater Repair
 * 3. Drain Cleaning
 * 4. Leak Detection
 * 5. Chicago location page
 *
 * Compares them for repetitive wording, structural variation, and vocabulary differentiation.
 */

import {
  generateHomepageDeterministic,
  generateServicePageDeterministic,
  generateLocationPageDeterministic,
  PageGenerationContext,
  VerifiedBusinessFacts,
} from "../lib/generator/content-generators";
import { PageContentJSON } from "../lib/generator/content-schema";

const siteSeed = "CHI-PLUMBING-483921";

const verifiedFacts: VerifiedBusinessFacts = {
  businessName: "Chicago Master Plumbing Pros",
  trade: "Plumbing",
  city: "Chicago",
  state: "Illinois",
  phone: "(312) 555-0199",
  streetAddress: "123 N Michigan Ave",
  yearsInBusiness: "15+",
  licenseNumber: "IL-LIC-748291",
  emergency247: true,
  freeEstimates: true,
  insuredBonded: true,
  allowedClaims: [
    "Licensed & Insured Master Plumbers",
    "Upfront Flat-Rate Pricing",
    "24/7 Priority Emergency Dispatch",
  ],
};

const relatedServices = [
  { name: "Water Heater Repair", slug: "water-heater-repair" },
  { name: "Drain Cleaning", slug: "drain-cleaning" },
  { name: "Leak Detection", slug: "leak-detection" },
  { name: "Sewer Line Repair", slug: "sewer-line-repair" },
  { name: "Emergency Plumbing", slug: "emergency-plumbing" },
];

const relatedLocations = [
  { name: "Lincoln Park", slug: "lincoln-park", state: "IL" },
  { name: "Loop", slug: "loop", state: "IL" },
  { name: "Logan Square", slug: "logan-square", state: "IL" },
  { name: "Lakeview", slug: "lakeview", state: "IL" },
  { name: "Evanston", slug: "evanston", state: "IL" },
];

const internalLinkTargets = [
  { label: "Home", href: "index.html", role: "hub" as const },
  { label: "Water Heater Repair", href: "water-heater-repair.html", role: "service" as const },
  { label: "Drain Cleaning", href: "drain-cleaning.html", role: "service" as const },
  { label: "Leak Detection", href: "leak-detection.html", role: "service" as const },
  { label: "Chicago Location", href: "plumbing-chicago-il.html", role: "location" as const },
  { label: "Contact Us", href: "contact.html", role: "contact" as const },
];

// 1. Context for Homepage
const homeCtx: PageGenerationContext = {
  pageType: "home",
  pagePurpose: "Brand authority, multi-service overview, emergency triage, and regional dispatch grid.",
  primaryKeyword: "Chicago Plumber",
  secondaryKeywords: ["emergency plumber Chicago", "licensed plumbing Chicago", "Chicago plumbing contractor"],
  searchIntent: "commercial",
  relatedServices,
  relatedLocations,
  internalLinkTargets,
  contentVariationSeed: { siteSeed, pageSeed: `${siteSeed}-home`, sectionSeed: "home-sec" },
  businessFacts: verifiedFacts,
};

// 2. Context for Water Heater Repair
const waterHeaterCtx: PageGenerationContext = {
  pageType: "service",
  pagePurpose: "Deep technical authority on water heater diagnostics, sediment flushing, anode rods, and repairs.",
  primaryKeyword: "Water Heater Repair Chicago",
  secondaryKeywords: ["hot water tank repair Chicago", "tankless water heater repair Chicago", "gas water heater fix"],
  searchIntent: "transactional",
  service: {
    name: "Water Heater Repair",
    slug: "water-heater-repair",
    commonProblems: ["Mineral sediment build-up", "Thermocouple burnout", "TPR valve weepage"],
  },
  relatedServices,
  relatedLocations,
  internalLinkTargets,
  contentVariationSeed: { siteSeed, pageSeed: `${siteSeed}-water-heater`, sectionSeed: "wh-sec" },
  businessFacts: verifiedFacts,
};

// 3. Context for Drain Cleaning
const drainCleaningCtx: PageGenerationContext = {
  pageType: "service",
  pagePurpose: "Technical authority on hydro-jetting, sewer camera line inspection, and tree root clearing.",
  primaryKeyword: "Drain Cleaning Chicago",
  secondaryKeywords: ["hydro jetting Chicago", "sewer line clearing Chicago", "clogged drain plumber"],
  searchIntent: "transactional",
  service: {
    name: "Drain Cleaning",
    slug: "drain-cleaning",
    commonProblems: ["Tree root intrusion in clay joints", "Grease saponification", "Main sewer line blockages"],
  },
  relatedServices,
  relatedLocations,
  internalLinkTargets,
  contentVariationSeed: { siteSeed, pageSeed: `${siteSeed}-drain-cleaning`, sectionSeed: "dc-sec" },
  businessFacts: verifiedFacts,
};

// 4. Context for Leak Detection
const leakDetectionCtx: PageGenerationContext = {
  pageType: "service",
  pagePurpose: "Technical authority on non-invasive acoustic sensors, thermal imaging, and sub-slab leak detection.",
  primaryKeyword: "Leak Detection Chicago",
  secondaryKeywords: ["slab leak detection Chicago", "hidden pipe leak detection", "underground water leak locator"],
  searchIntent: "transactional",
  service: {
    name: "Leak Detection",
    slug: "leak-detection",
    commonProblems: ["Sub-slab copper supply line fractures", "Acoustic frequency detection", "Thermal moisture mapping"],
  },
  relatedServices,
  relatedLocations,
  internalLinkTargets,
  contentVariationSeed: { siteSeed, pageSeed: `${siteSeed}-leak-detection`, sectionSeed: "ld-sec" },
  businessFacts: verifiedFacts,
};

// 5. Context for Chicago Location Page
const locationCtx: PageGenerationContext = {
  pageType: "location",
  pagePurpose: "Geo-targeted community dispatch hub addressing Chicago bungalow infrastructure and sub-zero freezes.",
  primaryKeyword: "Plumber in Chicago, IL",
  secondaryKeywords: ["local Chicago plumbers", "Cook County plumbing services", "Chicago neighborhood plumber"],
  searchIntent: "local_navigational",
  location: {
    city: "Chicago",
    state: "Illinois",
    county: "Cook County",
    neighborhoods: ["Lincoln Park", "Loop", "Logan Square", "Lakeview", "West Loop"],
  },
  relatedServices,
  relatedLocations,
  internalLinkTargets,
  contentVariationSeed: { siteSeed, pageSeed: `${siteSeed}-loc-chicago`, sectionSeed: "loc-sec" },
  businessFacts: verifiedFacts,
};

// Generate all 5 test pages
console.log("==================================================================");
console.log("GENERATING 5 TEST PAGES FOR CHICAGO PLUMBING...");
console.log("==================================================================");

const homePage = generateHomepageDeterministic(homeCtx);
const waterHeaterPage = generateServicePageDeterministic(waterHeaterCtx);
const drainCleaningPage = generateServicePageDeterministic(drainCleaningCtx);
const leakDetectionPage = generateServicePageDeterministic(leakDetectionCtx);
const locationPage = generateLocationPageDeterministic(locationCtx);

const testPages: Array<{ name: string; page: PageContentJSON }> = [
  { name: "Homepage", page: homePage },
  { name: "Water Heater Repair", page: waterHeaterPage },
  { name: "Drain Cleaning", page: drainCleaningPage },
  { name: "Leak Detection", page: leakDetectionPage },
  { name: "Chicago Location Page", page: locationPage },
];

// Helper to extract all readable copy from a page
function extractPageText(page: PageContentJSON): {
  seoTitle: string;
  metaDesc: string;
  h1: string;
  headlines: string[];
  bodyParagraphs: string[];
  faqs: Array<{ q: string; a: string }>;
  allTokens: string[];
} {
  const headlines: string[] = [];
  const bodyParagraphs: string[] = [];
  const faqs: Array<{ q: string; a: string }> = [];

  headlines.push(page.seo.h1);

  for (const sec of page.sections || []) {
    const c = sec.content || {};
    if (c.h1) headlines.push(c.h1);
    if (c.headline) headlines.push(c.headline);
    if (c.eyebrow) headlines.push(c.eyebrow);
    if (c.subheadline) bodyParagraphs.push(c.subheadline);
    if (c.story) bodyParagraphs.push(c.story);
    if (Array.isArray(c.paragraphs)) bodyParagraphs.push(...c.paragraphs);
    if (c.text) bodyParagraphs.push(c.text);

    if (Array.isArray(c.items)) {
      for (const item of c.items) {
        if (item.title) headlines.push(item.title);
        if (item.description) bodyParagraphs.push(item.description);
        if (item.question && item.answer) {
          faqs.push({ q: item.question, a: item.answer });
          bodyParagraphs.push(item.answer);
        }
      }
    }
    if (Array.isArray(c.steps)) {
      for (const step of c.steps) {
        if (step.title) headlines.push(step.title);
        if (step.description) bodyParagraphs.push(step.description);
      }
    }
  }

  const rawFullText = [
    page.seo.title,
    page.seo.description,
    ...headlines,
    ...bodyParagraphs,
    ...faqs.map((f) => f.q + " " + f.a),
  ].join(" ");

  // Tokenize words (excluding common stop words like "and", "the", "in", "to")
  const stopWords = new Set([
    "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "of", "with", "by", "our", "is", "are", "be", "we", "your", "that", "this", "from", "as", "it"
  ]);

  const allTokens = rawFullText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  return {
    seoTitle: page.seo.title,
    metaDesc: page.seo.description,
    h1: page.seo.h1,
    headlines,
    bodyParagraphs,
    faqs,
    allTokens,
  };
}

const extracted = testPages.map((p) => ({
  name: p.name,
  page: p.page,
  text: extractPageText(p.page),
}));

// Print Summary Table of Pages
console.log("\nPAGE PROFILES & CORE HEADLINES:");
console.log("------------------------------------------------------------------");
extracted.forEach((p, idx) => {
  console.log(`\n[PAGE ${idx + 1}: ${p.name.toUpperCase()}]`);
  console.log(`- Slug: ${p.page.slug}`);
  console.log(`- SEO Title: ${p.text.seoTitle}`);
  console.log(`- Meta Desc: ${p.text.metaDesc}`);
  console.log(`- H1: ${p.text.h1}`);
  console.log(`- Sections count: ${p.page.sections?.length}`);
  console.log(`- Section sequence: ${(p.page.sections || []).map((s) => s.type).join(" -> ")}`);
  console.log(`- Sample FAQ: "${p.text.faqs[0]?.q || 'None'}"`);
});

// Calculate Pairwise Jaccard Similarity across word sets
function calculateJaccard(tokensA: string[], tokensB: string[]): number {
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let intersectionCount = 0;
  for (const token of setA) {
    if (setB.has(token)) intersectionCount++;
  }
  const unionCount = new Set([...setA, ...setB]).size;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

// Extract N-grams
function getNGrams(tokens: string[], n: number): Set<string> {
  const ngrams = new Set<string>();
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.add(tokens.slice(i, i + n).join(" "));
  }
  return ngrams;
}

console.log("\n==================================================================");
console.log("REPETITIVE WORDING & LINGUISTIC OVERLAP ANALYSIS:");
console.log("==================================================================");

let maxSimilarity = 0;
let highestPair = "";

for (let i = 0; i < extracted.length; i++) {
  for (let j = i + 1; j < extracted.length; j++) {
    const pageA = extracted[i];
    const pageB = extracted[j];

    const jaccard = calculateJaccard(pageA.text.allTokens, pageB.text.allTokens);
    if (jaccard > maxSimilarity) {
      maxSimilarity = jaccard;
      highestPair = `${pageA.name} vs ${pageB.name}`;
    }

    // Check 4-gram phrase overlaps (excluding brand name / phone / address)
    const ngramsA = getNGrams(pageA.text.allTokens, 4);
    const ngramsB = getNGrams(pageB.text.allTokens, 4);
    const sharedPhrases: string[] = [];

    for (const phrase of ngramsA) {
      if (ngramsB.has(phrase)) {
        // filter out pure brand references
        if (!phrase.includes("chicago master") && !phrase.includes("plumbing pros") && !phrase.includes("555 0199")) {
          sharedPhrases.push(phrase);
        }
      }
    }

    const similarityPct = (jaccard * 100).toFixed(1);
    console.log(`\n• ${pageA.name} <===> ${pageB.name}:`);
    console.log(`  - Vocabulary Jaccard Overlap: ${similarityPct}%`);
    console.log(`  - Shared 4-gram phrases (excluding brand): ${sharedPhrases.length} found`);
    if (sharedPhrases.length > 0) {
      console.log(`    Samples: ${sharedPhrases.slice(0, 3).map((s) => `"${s}"`).join(", ")}`);
    } else {
      console.log(`    (Zero repeated 4-word sentences outside brand identity!)`);
    }
  }
}

// Analysis of Distinct Service Diagnostics
console.log("\n==================================================================");
console.log("TECHNICAL SPECIFICITY & PROBLEM MECHANISM CHECK:");
console.log("==================================================================");
const whText = extracted.find((p) => p.name === "Water Heater Repair")?.text.allTokens.join(" ") || "";
const dcText = extracted.find((p) => p.name === "Drain Cleaning")?.text.allTokens.join(" ") || "";
const ldText = extracted.find((p) => p.name === "Leak Detection")?.text.allTokens.join(" ") || "";
const locText = extracted.find((p) => p.name === "Chicago Location Page")?.text.allTokens.join(" ") || "";

console.log("1. Water Heater Specificity:");
console.log("   - Mentions 'sediment':", whText.includes("sediment") ? "✅ YES" : "❌ NO");
console.log("   - Mentions 'anode':", whText.includes("anode") ? "✅ YES" : "❌ NO");
console.log("   - Mentions 'thermocouple' or 'element':", whText.includes("thermocouple") || whText.includes("element") ? "✅ YES" : "❌ NO");

console.log("\n2. Drain Cleaning Specificity:");
console.log("   - Mentions 'hydro' / 'jetting':", dcText.includes("hydro") || dcText.includes("jetting") ? "✅ YES" : "❌ NO");
console.log("   - Mentions 'camera' / 'fiber':", dcText.includes("camera") ? "✅ YES" : "❌ NO");
console.log("   - Mentions 'roots' / 'sewer':", dcText.includes("roots") || dcText.includes("sewer") ? "✅ YES" : "❌ NO");

console.log("\n3. Leak Detection Specificity:");
console.log("   - Mentions 'acoustic' / 'ultrasonic':", ldText.includes("acoustic") ? "✅ YES" : "❌ NO");
console.log("   - Mentions 'thermal' / 'infrared':", ldText.includes("thermal") ? "✅ YES" : "❌ NO");
console.log("   - Mentions 'slab' / 'sub-slab':", ldText.includes("slab") ? "✅ YES" : "❌ NO");

console.log("\n4. Chicago Location Page Specificity:");
console.log("   - Mentions 'bungalows' / 'greystones':", locText.includes("bungalow") || locText.includes("greystone") ? "✅ YES" : "❌ NO");
console.log("   - Mentions 'freeze' / 'winter':", locText.includes("freeze") || locText.includes("winter") ? "✅ YES" : "❌ NO");
console.log("   - Mentions 'department of water management' or 'cook county':", locText.includes("department") || locText.includes("cook") ? "✅ YES" : "❌ NO");
console.log("   - Mentions Chicago neighborhoods (Lincoln Park, Logan Square, Loop):", locText.includes("lincoln") || locText.includes("logan") ? "✅ YES" : "❌ NO");

console.log("\n==================================================================");
console.log(`MAX OVERLAP: ${highestPair} at ${(maxSimilarity * 100).toFixed(1)}%`);
if (maxSimilarity < 0.35) {
  console.log("RESULT: PASSED! High differentiation achieved across all 5 pages.");
} else {
  console.log("RESULT: WARNING: Overlap exceeds target threshold.");
}
console.log("==================================================================");
