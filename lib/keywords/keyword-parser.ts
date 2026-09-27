/**
 * Canonical Keyword Parser & Normalizer Engine (RankLocal / Altofox)
 *
 * Rules:
 * 1. Split ONLY on comma (`,`) and line breaks (`\n`, `\r`).
 * 2. NEVER split on spaces. Multi-word phrases like "emergency plumber near me" must remain a single keyword.
 * 3. Normalize whitespace (trim outer, collapse multiple internal whitespace).
 * 4. Filter empty/whitespace-only tokens (e.g. from repeated commas `k1,,k2`).
 * 5. Case-insensitive deduplication while preserving original preferred casing.
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
        // Each array item might itself be a comma or newline-separated string
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
 * Splits string strictly on commas and newlines
 */
function splitOnCommasAndNewlines(text: string): string[] {
  // Normalize \r\n and \r to \n
  const normalizedText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  // Split on commas OR newlines
  return normalizedText.split(/[,\n]/);
}

/**
 * Formats an array of keywords for storage or display
 */
export function formatKeywordsForStorage(keywords: string[]): string {
  const parsed = parseKeywordList(keywords);
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
