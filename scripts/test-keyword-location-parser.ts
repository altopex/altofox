import assert from "assert";
import {
  parseKeywordList,
  parseLocationList,
  parseTagList,
  normalizeKeyword,
  normalizeLocationName,
  formatKeywordsForStorage,
  formatLocationsForStorage,
  validateKeywordList,
} from "../lib/keywords/keyword-parser";
import { normalizeProjectData } from "../lib/storage/db";
import { computeTargetPages } from "../lib/generator/prompt";

console.log("\n🧪 Running Keyword & Location Parser Test Suite...\n");

// TEST 1: User's exact prompt for Locations
console.log("TEST 1: Locations parsing from comma-separated string...");
const locationInput = "Hollidaysburg, Duncansville, Bellwood, Juniata, Logan Township, Tipton";
const parsedLocations = parseLocationList(locationInput);
console.log("  Input:", locationInput);
console.log("  Parsed tags:", parsedLocations);
assert.strictEqual(parsedLocations.length, 6, "Must yield exactly 6 locations");
assert.deepStrictEqual(parsedLocations, [
  "Hollidaysburg",
  "Duncansville",
  "Bellwood",
  "Juniata",
  "Logan Township",
  "Tipton",
]);
assert.strictEqual(parsedLocations[4], "Logan Township", "Multi-word location 'Logan Township' must NOT be split on space");
console.log("  ✅ TEST 1 PASSED");

// TEST 2: User's exact prompt for Keywords
console.log("\nTEST 2: Keywords parsing from comma-separated string...");
const keywordInput = "plumber near me, emergency plumber, water heater repair, drain cleaning, sewer line repair";
const parsedKeywords = parseKeywordList(keywordInput);
console.log("  Input:", keywordInput);
console.log("  Parsed tags:", parsedKeywords);
assert.strictEqual(parsedKeywords.length, 5, "Must yield exactly 5 keywords");
assert.deepStrictEqual(parsedKeywords, [
  "plumber near me",
  "emergency plumber",
  "water heater repair",
  "drain cleaning",
  "sewer line repair",
]);
assert.strictEqual(parsedKeywords[0], "plumber near me", "Multi-word keyword 'plumber near me' must NOT be split on space");
console.log("  ✅ TEST 2 PASSED");

// TEST 3: Newline and mixed delimiters (\n, \r\n, ;, ,)
console.log("\nTEST 3: Handling newlines and mixed delimiters...");
const mixedLocations = "Hollidaysburg\nDuncansville\r\nBellwood, Juniata; Logan Township\nTipton";
const parsedMixed = parseLocationList(mixedLocations);
assert.deepStrictEqual(parsedMixed, [
  "Hollidaysburg",
  "Duncansville",
  "Bellwood",
  "Juniata",
  "Logan Township",
  "Tipton",
]);
console.log("  ✅ TEST 3 PASSED");

// TEST 4: Cleanup & Deduplication (extra whitespace, consecutive commas, case-insensitive dupes)
console.log("\nTEST 4: Cleanup, whitespace collapse, empty filter, and case-insensitive deduplication...");
const messyInput = "  emergency   plumber  , , EMERGENCY PLUMBER, drain  cleaning , emergency plumber  , ";
const parsedMessy = parseKeywordList(messyInput);
assert.strictEqual(parsedMessy.length, 2, "Should deduplicate case-insensitively and ignore empty commas");
assert.strictEqual(parsedMessy[0], "emergency plumber", "Should collapse internal spaces and trim");
assert.strictEqual(parsedMessy[1], "drain cleaning", "Should trim correctly");
console.log("  ✅ TEST 4 PASSED");

// TEST 5: Storage format roundtripping
console.log("\nTEST 5: Storage formatting roundtripping...");
const storageLocationsStr = formatLocationsForStorage(parsedLocations);
assert.strictEqual(storageLocationsStr, "Hollidaysburg, Duncansville, Bellwood, Juniata, Logan Township, Tipton");
const reParsed = parseLocationList(storageLocationsStr);
assert.deepStrictEqual(reParsed, parsedLocations);
console.log("  ✅ TEST 5 PASSED");

// TEST 6: Legacy project normalization
console.log("\nTEST 6: Legacy project backward compatibility normalization...");
const mockLegacyProject: any = {
  id: "legacy-proj-1",
  name: "Legacy Plumbing Co",
  formData: {
    serviceAreas: "Hollidaysburg, Duncansville, Bellwood, Logan Township",
    keywords: "plumber near me, emergency plumber, drain cleaning",
    services: "Emergency Repairs, Drain Cleaning, Water Heater",
  },
};
const normalizedProject = normalizeProjectData(mockLegacyProject);
assert(Array.isArray(normalizedProject.formData.serviceAreasList), "serviceAreasList must be an array");
assert(Array.isArray(normalizedProject.formData.locations), "locations must be an array");
assert.deepStrictEqual(normalizedProject.formData.serviceAreasList, [
  "Hollidaysburg",
  "Duncansville",
  "Bellwood",
  "Logan Township",
]);
assert(Array.isArray(normalizedProject.formData.keywords), "keywords must be an array");
assert.deepStrictEqual(normalizedProject.formData.keywords, [
  "plumber near me",
  "emergency plumber",
  "drain cleaning",
]);
assert(Array.isArray(normalizedProject.formData.services), "services must be an array");
assert.deepStrictEqual(normalizedProject.formData.services, [
  "Emergency Repairs",
  "Drain Cleaning",
  "Water Heater",
]);
console.log("  ✅ TEST 6 PASSED");

// TEST 7: Page planning logic (Entering 6 locations should NOT generate 6 pages unless separateAreaPages toggle is ON)
console.log("\nTEST 7: Page creation logic with multiple locations...");
const baseData: any = {
  businessName: "Blair County Plumbing",
  businessType: "Plumber",
  city: "Hollidaysburg",
  stateRegion: "PA",
  serviceAreasList: parsedLocations,
  serviceAreas: formatLocationsForStorage(parsedLocations),
  separateAreaPages: false, // Default toggle is OFF
  pagesToCreate: ["Home", "About", "Services", "Contact", "Service Areas"],
};

// When separateAreaPages is FALSE:
const pagesWithoutSeparate = computeTargetPages(baseData);
const areaPagesWithout = pagesWithoutSeparate.filter((p) => p.type === "individual-area");
assert.strictEqual(
  areaPagesWithout.length,
  0,
  "Should NOT generate individual area pages when separateAreaPages is false"
);
console.log(`  Pages created without separateAreaPages toggle: ${pagesWithoutSeparate.length} (0 individual area pages)`);

// When separateAreaPages is TRUE:
const pagesWithSeparate = computeTargetPages({ ...baseData, separateAreaPages: true });
const areaPagesWith = pagesWithSeparate.filter((p) => p.type === "individual-area");
assert.strictEqual(
  areaPagesWith.length,
  6,
  "Should generate exactly 6 individual area pages when separateAreaPages is true"
);
console.log(`  Pages created with separateAreaPages toggle: ${pagesWithSeparate.length} (6 individual area pages)`);
console.log("  ✅ TEST 7 PASSED");

console.log("\n🎉 ALL 7 KEYWORD & LOCATION PARSER TESTS PASSED SUCCESSFULLY!\n");
