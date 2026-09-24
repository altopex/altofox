/**
 * Niche Packs Central Registry & Helper Functions
 * Provides 20 trade-specific packs plus a comprehensive fallback pack.
 */

import { NichePack } from "./types";
import { plumberNiche } from "./plumber";
import { electricianNiche } from "./electrician";
import { hvacNiche } from "./hvac";
import { roofingNiche } from "./roofing";
import { treeServiceNiche } from "./tree-service";
import { landscapingNiche } from "./landscaping";
import { houseCleaningNiche } from "./house-cleaning";
import { pestControlNiche } from "./pest-control";
import { pressureWashingNiche } from "./pressure-washing";
import { paintingNiche } from "./painting";
import { handymanNiche } from "./handyman";
import { generalContractorNiche } from "./general-contractor";
import { locksmithNiche } from "./locksmith";
import { garageDoorNiche } from "./garage-door";
import { movingCompanyNiche } from "./moving-company";
import { autoRepairNiche } from "./auto-repair";
import { towingNiche } from "./towing";
import { poolServiceNiche } from "./pool-service";
import { junkRemovalNiche } from "./junk-removal";
import { carpetCleaningNiche } from "./carpet-cleaning";
import { generalLocalServiceNiche } from "./general-local-service";

export * from "./types";
export {
  plumberNiche,
  electricianNiche,
  hvacNiche,
  roofingNiche,
  treeServiceNiche,
  landscapingNiche,
  houseCleaningNiche,
  pestControlNiche,
  pressureWashingNiche,
  paintingNiche,
  handymanNiche,
  generalContractorNiche,
  locksmithNiche,
  garageDoorNiche,
  movingCompanyNiche,
  autoRepairNiche,
  towingNiche,
  poolServiceNiche,
  junkRemovalNiche,
  carpetCleaningNiche,
  generalLocalServiceNiche,
};

export const FALLBACK_NICHE: NichePack = generalLocalServiceNiche;

export const NICHE_PACKS: NichePack[] = [
  plumberNiche,
  electricianNiche,
  hvacNiche,
  roofingNiche,
  treeServiceNiche,
  landscapingNiche,
  houseCleaningNiche,
  pestControlNiche,
  pressureWashingNiche,
  paintingNiche,
  handymanNiche,
  generalContractorNiche,
  locksmithNiche,
  garageDoorNiche,
  movingCompanyNiche,
  autoRepairNiche,
  towingNiche,
  poolServiceNiche,
  junkRemovalNiche,
  carpetCleaningNiche,
  generalLocalServiceNiche,
];

/**
 * Retrieves a niche pack by exact id
 */
export function getNicheById(id: string): NichePack {
  const normalized = (id || "").toLowerCase().trim();
  const found = NICHE_PACKS.find((p) => p.id === normalized);
  return found || FALLBACK_NICHE;
}

/**
 * Finds the closest matching niche pack by industry string or user input
 */
export function findNicheByIndustry(industryOrType: string): NichePack {
  if (!industryOrType) return FALLBACK_NICHE;
  const input = industryOrType.toLowerCase().trim();

  // 1. Direct ID match
  const directId = NICHE_PACKS.find((p) => p.id === input);
  if (directId) return directId;

  // 2. Direct Name match
  const directName = NICHE_PACKS.find((p) => p.name.toLowerCase() === input);
  if (directName) return directName;

  // 3. Aliases matching
  for (const pack of NICHE_PACKS) {
    if (pack.aliases && pack.aliases.some((alias) => input.includes(alias.toLowerCase()))) {
      return pack;
    }
  }

  // 4. Keyword heuristics
  if (input.includes("plumb") || input.includes("drain") || input.includes("rooter") || input.includes("pipe") || input.includes("water heater")) {
    return plumberNiche;
  }
  if (input.includes("electr") || input.includes("wire") || input.includes("lighting") || input.includes("panel")) {
    return electricianNiche;
  }
  if (input.includes("hvac") || input.includes("air cond") || input.includes("furnace") || input.includes("heating") || input.includes("cool")) {
    return hvacNiche;
  }
  if (input.includes("roof") || input.includes("shingle") || input.includes("gutter")) {
    return roofingNiche;
  }
  if (input.includes("tree") || input.includes("arbor") || input.includes("stump") || input.includes("felling")) {
    return treeServiceNiche;
  }
  if (input.includes("landscap") || input.includes("lawn") || input.includes("mow") || input.includes("sod") || input.includes("hardscape") || input.includes("irrigation")) {
    return landscapingNiche;
  }
  if (input.includes("house clean") || input.includes("maid") || input.includes("janitor") || input.includes("clean")) {
    if (input.includes("carpet")) return carpetCleaningNiche;
    if (input.includes("pressure") || input.includes("power wash")) return pressureWashingNiche;
    return houseCleaningNiche;
  }
  if (input.includes("pest") || input.includes("exterminat") || input.includes("termite") || input.includes("bug") || input.includes("rodent")) {
    return pestControlNiche;
  }
  if (input.includes("pressure") || input.includes("power wash") || input.includes("soft wash") || input.includes("roof clean")) {
    return pressureWashingNiche;
  }
  if (input.includes("paint") || input.includes("stain") || input.includes("cabinet paint")) {
    return paintingNiche;
  }
  if (input.includes("handyman") || input.includes("home repair") || input.includes("punch list")) {
    return handymanNiche;
  }
  if (input.includes("contractor") || input.includes("remodel") || input.includes("renovat") || input.includes("builder") || input.includes("kitchen remodel")) {
    return generalContractorNiche;
  }
  if (input.includes("locksmith") || input.includes("lockout") || input.includes("rekey") || input.includes("key")) {
    return locksmithNiche;
  }
  if (input.includes("garage door") || input.includes("overhead door") || input.includes("garage spring")) {
    return garageDoorNiche;
  }
  if (input.includes("mov") || input.includes("relocat") || input.includes("hauling furniture")) {
    return movingCompanyNiche;
  }
  if (input.includes("auto") || input.includes("mechanic") || input.includes("car repair") || input.includes("brakes")) {
    if (input.includes("tow")) return towingNiche;
    return autoRepairNiche;
  }
  if (input.includes("tow") || input.includes("roadside") || input.includes("wrecker") || input.includes("jump start")) {
    return towingNiche;
  }
  if (input.includes("pool") || input.includes("spa clean")) {
    return poolServiceNiche;
  }
  if (input.includes("junk") || input.includes("trash haul") || input.includes("debris removal") || input.includes("cleanout")) {
    return junkRemovalNiche;
  }
  if (input.includes("carpet") || input.includes("rug clean") || input.includes("upholstery")) {
    return carpetCleaningNiche;
  }

  return FALLBACK_NICHE;
}

/**
 * Generates rich, localized SEO keywords for a niche pack given a city and service areas
 */
export function generateKeywordsForNiche(
  niche: NichePack,
  city: string,
  state: string = "",
  serviceAreas: string[] = []
): string[] {
  const targetCity = city.trim() || "Dallas";
  const targetState = state.trim() || "";
  const keywordsSet = new Set<string>();

  // 1. Generate from primary services
  const coreServices = niche.commonServices.slice(0, 5);
  for (const s of coreServices) {
    keywordsSet.add(`${s.toLowerCase()} in ${targetCity}`);
    keywordsSet.add(`${s.toLowerCase()} ${targetCity} ${targetState}`.trim());
    keywordsSet.add(`${s.toLowerCase()} near me`);
  }

  // 2. Generate from keywordPatterns
  for (const pattern of niche.keywordPatterns) {
    const kw = pattern
      .replace(/{service}/g, coreServices[0].toLowerCase())
      .replace(/{niche}/g, niche.name.toLowerCase())
      .replace(/{city}/g, targetCity)
      .replace(/{state}/g, targetState)
      .replace(/\s+/g, " ")
      .trim();
    keywordsSet.add(kw);
  }

  // 3. If service areas are specified, add top service area keywords
  if (serviceAreas && serviceAreas.length > 0) {
    for (const area of serviceAreas.slice(0, 3)) {
      const trimmedArea = area.trim();
      if (trimmedArea && trimmedArea.toLowerCase() !== targetCity.toLowerCase()) {
        keywordsSet.add(`${niche.name.toLowerCase()} in ${trimmedArea}`);
        keywordsSet.add(`${coreServices[0].toLowerCase()} ${trimmedArea}`);
      }
    }
  }

  return Array.from(keywordsSet);
}
