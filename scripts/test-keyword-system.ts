import {
  parseKeywordList,
  normalizeKeyword,
  formatKeywordsForStorage,
  validateKeywordList,
} from "../lib/keywords/keyword-parser";
import { findNicheByIndustry, generateKeywordsForNiche } from "../niches";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` - ${detail}` : ""}`);
    failedCount++;
  }
}

function assertEquals<T>(actual: T, expected: T, testName: string) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  assert(
    actualStr === expectedStr,
    testName,
    `Expected ${expectedStr}, but got ${actualStr}`
  );
}

console.log("\n=======================================================");
console.log("  RankLocal Canonical Keyword System Test Suite");
console.log("=======================================================\n");

// TEST CASE 1: Standard comma-separated input with spaces
console.log("--- 1. Comma-separated input ---");
const input1 = "plumber near me, emergency plumber, water heater repair, drain cleaning, sewer line repair";
const res1 = parseKeywordList(input1);
assertEquals(res1.length, 5, "Case 1: Exactly 5 keywords parsed");
assertEquals(res1, [
  "plumber near me",
  "emergency plumber",
  "water heater repair",
  "drain cleaning",
  "sewer line repair",
], "Case 1: Keyword content matches exactly");

// TEST CASE 2: Comma-separated without spaces
console.log("\n--- 2. Comma-separated without spaces ---");
const input2 = "plumber,electrician,roofer";
const res2 = parseKeywordList(input2);
assertEquals(res2, ["plumber", "electrician", "roofer"], "Case 2: Split on commas without space");

// TEST CASE 3: Newline-separated keywords
console.log("\n--- 3. Newline-separated keywords ---");
const input3 = "plumber near me\nemergency plumber\r\nwater heater repair";
const res3 = parseKeywordList(input3);
assertEquals(res3, [
  "plumber near me",
  "emergency plumber",
  "water heater repair",
], "Case 3: Split on newlines (both LF and CRLF)");

// TEST CASE 4: Mixed commas and newlines
console.log("\n--- 4. Mixed commas and newlines ---");
const input4 = "plumber near me, emergency plumber\nwater heater repair, drain cleaning";
const res4 = parseKeywordList(input4);
assertEquals(res4, [
  "plumber near me",
  "emergency plumber",
  "water heater repair",
  "drain cleaning",
], "Case 4: Mixed comma and newline input");

// TEST CASE 5: Multi-word phrase with spaces must NOT split on spaces
console.log("\n--- 5. Space preservation (Never split on spaces) ---");
const input5 = "emergency plumber near me";
const res5 = parseKeywordList(input5);
assertEquals(res5.length, 1, "Case 5: Multi-word phrase is exactly 1 keyword");
assertEquals(res5[0], "emergency plumber near me", "Case 5: Phrase intact");

// TEST CASE 6: Repeated commas & empty whitespace tokens
console.log("\n--- 6. Repeated commas & whitespace-only tokens ---");
const input6 = "keyword1,,keyword2,   ,keyword3, ,,,";
const res6 = parseKeywordList(input6);
assertEquals(res6, ["keyword1", "keyword2", "keyword3"], "Case 6: Empty tokens stripped cleanly");

// TEST CASE 7: Case-insensitive deduplication
console.log("\n--- 7. Case-insensitive deduplication ---");
const input7 = "Plumber near me, plumber near me, PLUMBER NEAR ME, drain cleaning";
const res7 = parseKeywordList(input7);
assertEquals(res7, ["Plumber near me", "drain cleaning"], "Case 7: Deduplication preserves first casing");

// TEST CASE 8: Whitespace normalization within and around keywords
console.log("\n--- 8. Whitespace normalization ---");
const input8 = "   emergency    plumber   near   me   ,   drain    cleaning   ";
const res8 = parseKeywordList(input8);
assertEquals(res8, ["emergency plumber near me", "drain cleaning"], "Case 8: Inner and outer whitespace collapsed");

// TEST CASE 9: Array input containing comma-separated strings
console.log("\n--- 9. Array input with mixed tokens ---");
const input9 = ["plumber, electrician", "hvac\nroofing", "drain cleaning"];
const res9 = parseKeywordList(input9);
assertEquals(res9, [
  "plumber",
  "electrician",
  "hvac",
  "roofing",
  "drain cleaning",
], "Case 9: Nested array elements parsed and flattened");

// TEST CASE 10: formatKeywordsForStorage
console.log("\n--- 10. formatKeywordsForStorage ---");
const formatted = formatKeywordsForStorage([
  "plumber near me",
  "emergency plumber, drain cleaning",
]);
assertEquals(formatted, "plumber near me, emergency plumber, drain cleaning", "Case 10: Formatted cleanly for storage/prompts");

// TEST CASE 11: validateKeywordList
console.log("\n--- 11. validateKeywordList ---");
const emptyVal = validateKeywordList("");
assert(!emptyVal.valid, "Case 11a: Empty string fails validation");

const whitespaceVal = validateKeywordList("   ,  , \n  ");
assert(!whitespaceVal.valid, "Case 11b: Whitespace-only string fails validation");

const validVal = validateKeywordList("plumber, drain cleaning");
assert(validVal.valid && validVal.keywords.length === 2, "Case 11c: Valid list passes validation");

// TEST CASE 12: Legacy Project State Normalization
console.log("\n--- 12. Legacy Project State Normalization ---");
const legacyFormData = {
  businessName: "Lone Star Plumbing",
  targetKeywords: "plumber near me, emergency plumber, water heater repair",
  keywords: undefined as unknown,
};
const parsedLegacy = parseKeywordList(legacyFormData.keywords || legacyFormData.targetKeywords);
assertEquals(parsedLegacy, [
  "plumber near me",
  "emergency plumber",
  "water heater repair",
], "Case 12: Legacy comma-separated string loaded into clean string[]");

// TEST CASE 13: Suggestion Flow: Non-merging & selective add
console.log("\n--- 13. Niche Suggestion Flow ---");
const plumbingPack = findNicheByIndustry("Plumber");
const generatedSuggestions = generateKeywordsForNiche(
  plumbingPack,
  "Dallas",
  "TX",
  ["Fort Worth", "Plano"]
);
const parsedSuggestions = parseKeywordList(generatedSuggestions);
assert(parsedSuggestions.length > 5, "Case 13a: Generated realistic suggestions from niche pack");

// User starts with 2 keywords
let userKeywords = ["emergency plumber Dallas TX", "drain cleaning Dallas"];
const userKeywordsLower = new Set(userKeywords.map((k) => k.toLowerCase()));

// Suggestions are filtered to exclude already selected keywords
const availableSuggestions = parsedSuggestions.filter((s) => !userKeywordsLower.has(s.toLowerCase()));

// Crucial: Suggestions do NOT auto-merge into userKeywords!
assert(userKeywords.length === 2, "Case 13b: User keywords unaffected before selection");

// User selects exactly 2 suggestions
const selectedSuggestions = [availableSuggestions[0], availableSuggestions[1]];
userKeywords = parseKeywordList([...userKeywords, ...selectedSuggestions]);
assertEquals(userKeywords.length, 4, "Case 13c: Only the 2 selected suggestions were added to user keywords");

console.log("\n=======================================================");
console.log(`  Results: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log("=======================================================\n");

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
