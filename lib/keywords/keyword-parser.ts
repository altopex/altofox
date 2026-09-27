/**
 * Canonical Keyword & Location Parser Engine (RankLocal / Altofox)
 *
 * Rules:
 * 1. Split strictly on comma (`,`), line breaks (`\n`, `\r`), and semicolons (`;`).
 * 2. NEVER split on spaces. Multi-word phrases like "emergency plumber near me" or
 *    "Logan Township" must remain a single independent item.
 * 3. Normalize whitespace (trim outer leading/trailing spaces, collapse consecutive internal spaces).
 * 4. Filter empty/whitespace-only tokens (e.g. from repeated commas `k1,,k2`).
 * 5. Case-insensitive deduplication while preserving original preferred casing.
 * 6. Supports strings, string arrays, mixed comma/newline strings, and nested arrays.
 */

/**
 * Normalizes a single keyword string:
 * - Trims leading and trailing whitespace
 * - Collapses consecutive spaces/tabs into a single space
 */
export function normalizeKeyword(kw: string): string {
  return kw.trim().replace(/\s+/g, " ");
}

/**
 * Normalizes a single location / service area name:
 * - Trims leading and trailing whitespace
 * - Collapses consecutive spaces/tabs into a single space
 * - Strips any leading emoji pins if present (e.g. "📍 Dallas" -> "Dallas")
 */
export function normalizeLocationName(loc: string): string {
  return loc
    .trim()
    .replace(/^[📍\s]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Splits string strictly on commas, newlines, or semicolons
 */
function splitOnCommasAndNewlines(text: string): string[] {
  // Normalize \r\n and \r to \n
  const normalizedText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  // Split on commas, newlines, or semicolons
  return normalizedText.split(/[,\n;]/);
}

/**
 * Parses and normalizes keywords from any input:
 * - Single string with commas, newlines, or mixed
 * - Array of strings (which may themselves contain commas or newlines)
 * - Empty / null / undefined values
 */
export function parseKeywordList(input: unknown): string[] {
  if (!input) return [];

  let rawList: string[] = [];

  if (Array.isArray(input)) {
    for (const item of input) {
      if (typeof item === "string") {
        rawList.push(...splitOnCommasAndNewlines(item));
      }
    }
  } else if (typeof input === "string") {
    rawList = splitOnCommasAndNewlines(input);
  }

  const result: string[] = [];
  const seenLower = new Set<string>();

  for (const raw of rawList) {
    const cleaned = normalizeKeyword(raw);
    if (!cleaned) continue;

    const lower = cleaned.toLowerCase();
    if (!seenLower.has(lower)) {
      seenLower.add(lower);
      result.push(cleaned);
    }
  }

  return result;
}

/**
 * Parses and normalizes locations / service areas from any input:
 * - Comma-separated string ("Hollidaysburg, Duncansville, Bellwood, Juniata, Logan Township, Tipton")
 * - Newline-separated string
 * - Mixed commas and newlines
 * - Array of strings (which may themselves contain commas or newlines)
 * - Array of objects with city/name/title properties
 * - Preserves internal spaces ("Logan Township")
 * - Case-insensitive deduplication while preserving original casing
 */
export function parseLocationList(input: unknown): string[] {
  if (!input) return [];

  let rawList: string[] = [];

  if (Array.isArray(input)) {
    for (const item of input) {
      if (typeof item === "string") {
        rawList.push(...splitOnCommasAndNewlines(item));
      } else if (item && typeof item === "object") {
        const val = (item as any).city || (item as any).name || (item as any).title;
        if (typeof val === "string") {
          rawList.push(...splitOnCommasAndNewlines(val));
        }
      }
    }
  } else if (typeof input === "string") {
    rawList = splitOnCommasAndNewlines(input);
  }

  const result: string[] = [];
  const seenLower = new Set<string>();

  for (const raw of rawList) {
    const cleaned = normalizeLocationName(raw);
    if (!cleaned) continue;

    const lower = cleaned.toLowerCase();
    if (!seenLower.has(lower)) {
      seenLower.add(lower);
      result.push(cleaned);
    }
  }

  return result;
}

/**
 * General tag / service parser with identical robust delimiter parsing
 */
export function parseTagList(input: unknown): string[] {
  return parseLocationList(input);
}

/**
 * Formats an array of keywords for storage or display
 */
export function formatKeywordsForStorage(keywords: string[]): string {
  const parsed = parseKeywordList(keywords);
  return parsed.join(", ");
}

/**
 * Formats an array of locations for storage or display
 */
export function formatLocationsForStorage(locations: string[]): string {
  const parsed = parseLocationList(locations);
  return parsed.join(", ");
}

/**
 * Validates keyword list before generation
 */
export function validateKeywordList(keywords: unknown): {
  valid: boolean;
  keywords: string[];
  error?: string;
} {
  const parsed = parseKeywordList(keywords);
  if (parsed.length === 0) {
    return {
      valid: false,
      keywords: [],
      error: "At least one target keyword is required. Add keywords or select from suggestions.",
    };
  }
  return {
    valid: true,
    keywords: parsed,
  };
}
