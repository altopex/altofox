/**
 * Deterministic Content Similarity Checker & Self-Healing Differentiation Engine
 *
 * Implements strict, mathematical text comparison across generated website pages:
 * 1. Title Similarity (normalized token Jaccard + Levenshtein distance ratio)
 * 2. H1 Similarity (token overlap + character edit distance)
 * 3. Heading Similarity (multi-set heading token overlap + pairwise max matching)
 * 4. Paragraph Similarity (non-stopword token overlap + paragraph Dice bigrams)
 * 5. Sentence / Phrase Repetition (4-gram and 5-gram exact sequence overlaps)
 * 6. Meta Description Duplication (exact & near-duplicate meta descriptions)
 * 7. Overall Page Similarity (weighted mathematical composite score)
 *
 * Enforces self-healing regeneration loop:
 * - Flags pages exceeding configurable similarity threshold
 * - Regenerates using alternative content strategies (strategyShift)
 * - Retries up to maxRetries
 * - Produces an unforgeable, honest Content Quality Audit
 *
 * Never creates fake scores.
 */

import { PageContentJSON, SectionJSON } from "../generator/content-schema";
import { PageGenerationContext } from "../generator/content-generators/types";
import { generatePageContent } from "../generator/content-generators";
import { GatewayRequest } from "../ai/provider-gateway";

// ---------------------------------------------------------------------------
// Types & Contracts
// ---------------------------------------------------------------------------

export interface ExtractedPageText {
  slug: string;
  title: string;
  h1: string;
  metaDescription: string;
  headings: string[];
  paragraphs: string[];
  fullText: string;
}

export interface SimilarityWeights {
  title: number;
  h1: number;
  headings: number;
  paragraphs: number;
  phrases: number;
  meta: number;
}

export const DEFAULT_SIMILARITY_WEIGHTS: SimilarityWeights = {
  title: 0.10,
  h1: 0.15,
  headings: 0.20,
  paragraphs: 0.30,
  phrases: 0.15,
  meta: 0.10,
};

export interface SimilarityCheckerOptions {
  /** Maximum acceptable overall similarity before flagging (0.0 to 1.0, default: 0.35 = 35%) */
  similarityThreshold?: number;
  /** Maximum regeneration retry attempts per page (default: 3) */
  maxRetries?: number;
  /** Custom weights for similarity components */
  weights?: Partial<SimilarityWeights>;
  /** N-gram phrase length in words for repetition detection (default: 4) */
  phraseLength?: number;
  /** Brand identity terms to exclude from phrase repetition checks */
  brandTerms?: string[];
}

export interface PagePairSimilarity {
  pageA: string;
  pageB: string;
  titleSimilarity: number;       // 0.0 to 1.0
  h1Similarity: number;          // 0.0 to 1.0
  headingSimilarity: number;     // 0.0 to 1.0
  paragraphSimilarity: number;   // 0.0 to 1.0
  phraseRepetition: number;      // 0.0 to 1.0
  metaSimilarity: number;        // 0.0 to 1.0
  overallSimilarity: number;     // 0.0 to 1.0
  similarityPercentage: number;  // 0 to 100
  sharedPhrases: string[];       // Samples of repeated 4-grams
  exceedsThreshold: boolean;
}

export interface RegenerationAttemptRecord {
  pageSlug: string;
  attempt: number;
  conflictingWith: string;
  previousSimilarityPercentage: number;
  newSimilarityPercentage: number;
  strategyUsed: string;
  resolved: boolean;
}

export interface FlaggedPageIssue {
  slug: string;
  conflictingWith: string;
  similarityPercentage: number;
  thresholdPercentage: number;
  reasons: string[];
  sampleRepeatedPhrases: string[];
}

export interface ContentSimilarityAuditResult {
  pagesScanned: number;
  potentiallyRepetitiveCount: number;
  regeneratedCount: number;
  finalFlaggedPagesCount: number;
  thresholdPercentage: number;
  averageSimilarityPercentage: number;
  highestSimilarityPair?: PagePairSimilarity;
  pairwiseComparisons: PagePairSimilarity[];
  regenerationHistory: RegenerationAttemptRecord[];
  flaggedPages: FlaggedPageIssue[];
  summaryText: string;
}

// ---------------------------------------------------------------------------
// Mathematical Text Comparison Utilities
// ---------------------------------------------------------------------------

const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
  "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
  "below", "between", "both", "but", "by", "can", "can't", "cannot", "could",
  "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down",
  "during", "each", "few", "for", "from", "further", "had", "hadn't", "has",
  "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her",
  "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's",
  "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it",
  "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my",
  "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other",
  "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan't",
  "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such",
  "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then",
  "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've",
  "this", "those", "through", "to", "too", "under", "until", "up", "very", "was",
  "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what",
  "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's",
  "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd",
  "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves"
]);

/**
 * Normalizes string: lowercase, strips punctuation, normalizes whitespace.
 */
export function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Tokenizes text into lowercase word tokens.
 */
export function tokenizeWords(text: string): string[] {
  const norm = normalizeText(text);
  if (!norm) return [];
  return norm.split(" ").filter((w) => w.length > 0);
}

/**
 * Tokenizes text into lowercase non-stopword tokens.
 */
export function tokenizeNonStopWords(text: string): string[] {
  return tokenizeWords(text).filter((w) => !STOP_WORDS.has(w) && w.length > 1);
}

/**
 * Computes exact Levenshtein edit distance between two strings using linear space.
 */
export function calculateLevenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let v0 = new Int32Array(b.length + 1);
  let v1 = new Int32Array(b.length + 1);

  for (let i = 0; i <= b.length; i++) {
    v0[i] = i;
  }

  for (let i = 0; i < a.length; i++) {
    v1[0] = i + 1;
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }
    for (let j = 0; j <= b.length; j++) {
      v0[j] = v1[j];
    }
  }

  return v1[b.length];
}

/**
 * Computes Levenshtein similarity ratio between 0.0 and 1.0.
 */
export function calculateLevenshteinRatio(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  const dist = calculateLevenshteinDistance(a, b);
  return Math.max(0, 1.0 - dist / maxLen);
}

/**
 * Jaccard similarity between two Sets: |A ∩ B| / |A ∪ B|.
 */
export function calculateJaccardSimilarity<T>(setA: Set<T>, setB: Set<T>): number {
  if (setA.size === 0 && setB.size === 0) return 1.0;
  if (setA.size === 0 || setB.size === 0) return 0.0;

  let intersectionCount = 0;
  const [smaller, larger] = setA.size < setB.size ? [setA, setB] : [setB, setA];

  for (const item of smaller) {
    if (larger.has(item)) {
      intersectionCount++;
    }
  }

  const unionCount = setA.size + setB.size - intersectionCount;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

/**
 * Dice's coefficient on word arrays: 2 * |A ∩ B| / (|A| + |B|).
 */
export function calculateDiceCoefficient(tokensA: string[], tokensB: string[]): number {
  if (tokensA.length === 0 && tokensB.length === 0) return 1.0;
  if (tokensA.length === 0 || tokensB.length === 0) return 0.0;

  const setA = new Set(tokensA);
  const setB = new Set(tokensB);

  let intersectionCount = 0;
  for (const t of setA) {
    if (setB.has(t)) intersectionCount++;
  }

  return (2 * intersectionCount) / (setA.size + setB.size);
}

/**
 * Extracts N-gram phrases of fixed word length.
 */
export function extractNGrams(words: string[], n: number = 4): string[] {
  if (words.length < n) return [];
  const ngrams: string[] = [];
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.push(words.slice(i, i + n).join(" "));
  }
  return ngrams;
}

// ---------------------------------------------------------------------------
// Text Extraction from Page Objects & HTML
// ---------------------------------------------------------------------------

/**
 * Extracts text components from a structured PageContentJSON.
 */
export function extractPageTextFromJSON(page: PageContentJSON): ExtractedPageText {
  const headings: string[] = [];
  const paragraphs: string[] = [];
  const fullTextPieces: string[] = [];

  const title = (page.seo?.title || "").trim();
  const h1 = (page.seo?.h1 || "").trim();
  const metaDescription = (page.seo?.description || "").trim();

  if (title) fullTextPieces.push(title);
  if (h1) fullTextPieces.push(h1);
  if (metaDescription) fullTextPieces.push(metaDescription);

  if (Array.isArray(page.sections)) {
    for (const section of page.sections) {
      const c = section.content || {};

      // Headings
      if (typeof c.headline === "string" && c.headline.trim()) {
        headings.push(c.headline.trim());
        fullTextPieces.push(c.headline.trim());
      }
      if (typeof c.eyebrow === "string" && c.eyebrow.trim()) {
        headings.push(c.eyebrow.trim());
        fullTextPieces.push(c.eyebrow.trim());
      }
      if (typeof c.subheadline === "string" && c.subheadline.trim()) {
        headings.push(c.subheadline.trim());
        fullTextPieces.push(c.subheadline.trim());
      }

      // Paragraphs & general copy
      if (typeof c.text === "string" && c.text.trim()) {
        paragraphs.push(c.text.trim());
        fullTextPieces.push(c.text.trim());
      }
      if (typeof c.description === "string" && c.description.trim()) {
        paragraphs.push(c.description.trim());
        fullTextPieces.push(c.description.trim());
      }

      if (Array.isArray(c.paragraphs)) {
        for (const p of c.paragraphs) {
          if (typeof p === "string" && p.trim()) {
            paragraphs.push(p.trim());
            fullTextPieces.push(p.trim());
          }
        }
      }

      // Items (services, whyUs, steps, faq)
      if (Array.isArray(c.items)) {
        for (const item of c.items) {
          if (typeof item === "object" && item !== null) {
            if (typeof item.title === "string" && item.title.trim()) {
              headings.push(item.title.trim());
              fullTextPieces.push(item.title.trim());
            }
            if (typeof item.question === "string" && item.question.trim()) {
              headings.push(item.question.trim());
              fullTextPieces.push(item.question.trim());
            }
            if (typeof item.description === "string" && item.description.trim()) {
              paragraphs.push(item.description.trim());
              fullTextPieces.push(item.description.trim());
            }
            if (typeof item.answer === "string" && item.answer.trim()) {
              paragraphs.push(item.answer.trim());
              fullTextPieces.push(item.answer.trim());
            }
          }
        }
      }

      if (Array.isArray(c.steps)) {
        for (const s of c.steps) {
          if (typeof s === "object" && s !== null) {
            if (typeof s.title === "string" && s.title.trim()) {
              headings.push(s.title.trim());
              fullTextPieces.push(s.title.trim());
            }
            if (typeof s.description === "string" && s.description.trim()) {
              paragraphs.push(s.description.trim());
              fullTextPieces.push(s.description.trim());
            }
          }
        }
      }
    }
  }

  return {
    slug: page.slug || "unknown",
    title,
    h1,
    metaDescription,
    headings,
    paragraphs,
    fullText: fullTextPieces.join(" "),
  };
}

/**
 * Extracts text components from raw HTML.
 */
export function extractPageTextFromHtml(html: string, slug?: string): ExtractedPageText {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";

  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h1 = h1Match ? h1Match[1].replace(/<[^>]+>/g, " ").trim() : "";

  const metaMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
  const metaDescription = metaMatch ? metaMatch[1].trim() : "";

  const headings: string[] = [];
  const headingMatches = html.matchAll(/<h[2-6][^>]*>([\s\S]*?)<\/h[2-6]>/gi);
  for (const m of headingMatches) {
    const clean = m[1].replace(/<[^>]+>/g, " ").trim();
    if (clean) headings.push(clean);
  }

  const paragraphs: string[] = [];
  const pMatches = html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi);
  for (const m of pMatches) {
    const clean = m[1].replace(/<[^>]+>/g, " ").trim();
    if (clean && clean.length > 15) paragraphs.push(clean);
  }

  // Strip all tags for full body text
  const cleanFull = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    slug: slug || "html-page",
    title,
    h1,
    metaDescription,
    headings,
    paragraphs,
    fullText: cleanFull,
  };
}

// ---------------------------------------------------------------------------
// Individual Similarity Check Functions
// ---------------------------------------------------------------------------

/**
 * 1. Title Similarity Check
 * Compares titles while discounting identical brand trailing suffixes.
 */
export function calculateTitleSimilarity(titleA: string, titleB: string, brandTerms: string[] = []): number {
  if (!titleA && !titleB) return 1.0;
  if (!titleA || !titleB) return 0.0;
  if (titleA.trim() === titleB.trim()) return 1.0;

  // Strip brand suffix after | or -
  let cleanA = titleA.split(/[|-]/)[0].trim();
  let cleanB = titleB.split(/[|-]/)[0].trim();

  // Strip brand terms
  for (const bt of brandTerms) {
    if (bt.trim().length > 2) {
      const re = new RegExp(bt.trim(), "gi");
      cleanA = cleanA.replace(re, "").trim();
      cleanB = cleanB.replace(re, "").trim();
    }
  }

  const tokensA = new Set(tokenizeNonStopWords(cleanA));
  const tokensB = new Set(tokenizeNonStopWords(cleanB));

  const jaccard = calculateJaccardSimilarity(tokensA, tokensB);
  const levRatio = calculateLevenshteinRatio(normalizeText(cleanA), normalizeText(cleanB));

  return 0.5 * jaccard + 0.5 * levRatio;
}

/**
 * 2. H1 Similarity Check
 */
export function calculateH1Similarity(h1A: string, h1B: string): number {
  if (!h1A && !h1B) return 1.0;
  if (!h1A || !h1B) return 0.0;
  if (h1A.trim() === h1B.trim()) return 1.0;

  const tokensA = new Set(tokenizeNonStopWords(h1A));
  const tokensB = new Set(tokenizeNonStopWords(h1B));

  const jaccard = calculateJaccardSimilarity(tokensA, tokensB);
  const levRatio = calculateLevenshteinRatio(normalizeText(h1A), normalizeText(h1B));

  return 0.5 * jaccard + 0.5 * levRatio;
}

/**
 * 3. Heading Similarity Check
 * Compares multi-set heading token vocabulary and pairwise maximum heading matches.
 */
export function calculateHeadingSimilarity(headingsA: string[], headingsB: string[]): number {
  if (headingsA.length === 0 && headingsB.length === 0) return 1.0;
  if (headingsA.length === 0 || headingsB.length === 0) return 0.0;

  const allWordsA = new Set(tokenizeNonStopWords(headingsA.join(" ")));
  const allWordsB = new Set(tokenizeNonStopWords(headingsB.join(" ")));
  const jaccard = calculateJaccardSimilarity(allWordsA, allWordsB);

  // Pairwise max heading match
  let totalMatchScore = 0;
  for (const hA of headingsA) {
    let maxMatch = 0;
    const normA = normalizeText(hA);
    for (const hB of headingsB) {
      const match = calculateLevenshteinRatio(normA, normalizeText(hB));
      if (match > maxMatch) maxMatch = match;
    }
    totalMatchScore += maxMatch;
  }
  const avgMaxMatch = headingsA.length > 0 ? totalMatchScore / headingsA.length : 0;

  return 0.5 * jaccard + 0.5 * avgMaxMatch;
}

/**
 * 4. Paragraph Similarity Check
 * Compares non-stopword content vocabulary and pairwise paragraph Dice coefficients.
 */
export function calculateParagraphSimilarity(parasA: string[], parasB: string[]): number {
  if (parasA.length === 0 && parasB.length === 0) return 1.0;
  if (parasA.length === 0 || parasB.length === 0) return 0.0;

  const wordsA = new Set(tokenizeNonStopWords(parasA.join(" ")));
  const wordsB = new Set(tokenizeNonStopWords(parasB.join(" ")));
  const jaccard = calculateJaccardSimilarity(wordsA, wordsB);

  // Pairwise maximum paragraph dice
  let totalDice = 0;
  for (const pA of parasA) {
    const toksA = tokenizeWords(pA);
    let maxDice = 0;
    for (const pB of parasB) {
      const toksB = tokenizeWords(pB);
      const dice = calculateDiceCoefficient(toksA, toksB);
      if (dice > maxDice) maxDice = dice;
    }
    totalDice += maxDice;
  }
  const avgMaxDice = parasA.length > 0 ? totalDice / parasA.length : 0;

  return 0.5 * jaccard + 0.5 * avgMaxDice;
}

/**
 * 5. Sentence / Phrase Repetition Check (4-grams / 5-grams)
 */
export function calculatePhraseRepetition(
  textA: string,
  textB: string,
  phraseLength: number = 4,
  brandTerms: string[] = []
): { score: number; sharedPhrases: string[] } {
  const wordsA = tokenizeWords(textA);
  const wordsB = tokenizeWords(textB);

  const ngramsA = extractNGrams(wordsA, phraseLength);
  const ngramsB = extractNGrams(wordsB, phraseLength);

  if (ngramsA.length === 0 || ngramsB.length === 0) {
    return { score: 0.0, sharedPhrases: [] };
  }

  const setA = new Set(ngramsA);
  const setB = new Set(ngramsB);

  const shared: string[] = [];
  const brandRegexes = brandTerms
    .filter((b) => b && b.trim().length > 2)
    .map((b) => new RegExp(b.trim().toLowerCase(), "i"));

  for (const phrase of setA) {
    if (setB.has(phrase)) {
      // Ignore if phrase contains purely brand terms or phone digits
      const isBrandOnly = brandRegexes.some((re) => re.test(phrase));
      const isPhoneBoilerplate = /\d{3}[-\s]?\d{3}[-\s]?\d{4}/.test(phrase);

      if (!isBrandOnly && !isPhoneBoilerplate) {
        shared.push(phrase);
      }
    }
  }

  const repetitionRatio = (2 * shared.length) / (setA.size + setB.size);

  return {
    score: Math.min(1.0, repetitionRatio),
    sharedPhrases: shared.slice(0, 5),
  };
}

/**
 * 6. Meta Description Duplication Check
 */
export function calculateMetaDescriptionSimilarity(descA: string, descB: string): number {
  if (!descA && !descB) return 1.0;
  if (!descA || !descB) return 0.0;
  if (descA.trim() === descB.trim()) return 1.0;

  const wordsA = new Set(tokenizeNonStopWords(descA));
  const wordsB = new Set(tokenizeNonStopWords(descB));

  const jaccard = calculateJaccardSimilarity(wordsA, wordsB);
  const levRatio = calculateLevenshteinRatio(normalizeText(descA), normalizeText(descB));

  return 0.5 * jaccard + 0.5 * levRatio;
}

/**
 * 7. Overall Page Similarity: Mathematical Composite Calculation
 */
export function calculateOverallSimilarity(
  metrics: {
    titleSimilarity: number;
    h1Similarity: number;
    headingSimilarity: number;
    paragraphSimilarity: number;
    phraseRepetition: number;
    metaSimilarity: number;
  },
  customWeights?: Partial<SimilarityWeights>
): number {
  const w = { ...DEFAULT_SIMILARITY_WEIGHTS, ...(customWeights || {}) };
  const totalWeight = w.title + w.h1 + w.headings + w.paragraphs + w.phrases + w.meta;

  const score =
    (metrics.titleSimilarity * w.title +
      metrics.h1Similarity * w.h1 +
      metrics.headingSimilarity * w.headings +
      metrics.paragraphSimilarity * w.paragraphs +
      metrics.phraseRepetition * w.phrases +
      metrics.metaSimilarity * w.meta) /
    totalWeight;

  return Math.min(1.0, Math.max(0.0, score));
}

// ---------------------------------------------------------------------------
// Pairwise Page Comparator
// ---------------------------------------------------------------------------

/**
 * Compares two pages across all 7 similarity dimensions.
 * Accepts either PageContentJSON or ExtractedPageText.
 */
export function comparePages(
  pageA: PageContentJSON | ExtractedPageText,
  pageB: PageContentJSON | ExtractedPageText,
  options?: SimilarityCheckerOptions
): PagePairSimilarity {
  const threshold = options?.similarityThreshold ?? 0.35;
  const brandTerms = options?.brandTerms || [];
  const phraseLen = options?.phraseLength || 4;

  const extractedA: ExtractedPageText =
    "seo" in pageA ? extractPageTextFromJSON(pageA) : (pageA as ExtractedPageText);
  const extractedB: ExtractedPageText =
    "seo" in pageB ? extractPageTextFromJSON(pageB) : (pageB as ExtractedPageText);

  const titleSimilarity = calculateTitleSimilarity(extractedA.title, extractedB.title, brandTerms);
  const h1Similarity = calculateH1Similarity(extractedA.h1, extractedB.h1);
  const headingSimilarity = calculateHeadingSimilarity(extractedA.headings, extractedB.headings);
  const paragraphSimilarity = calculateParagraphSimilarity(extractedA.paragraphs, extractedB.paragraphs);
  const phraseResult = calculatePhraseRepetition(extractedA.fullText, extractedB.fullText, phraseLen, brandTerms);
  const metaSimilarity = calculateMetaDescriptionSimilarity(extractedA.metaDescription, extractedB.metaDescription);

  const overallSimilarity = calculateOverallSimilarity(
    {
      titleSimilarity,
      h1Similarity,
      headingSimilarity,
      paragraphSimilarity,
      phraseRepetition: phraseResult.score,
      metaSimilarity,
    },
    options?.weights
  );

  const similarityPercentage = Math.round(overallSimilarity * 100);

  return {
    pageA: extractedA.slug,
    pageB: extractedB.slug,
    titleSimilarity: Number(titleSimilarity.toFixed(3)),
    h1Similarity: Number(h1Similarity.toFixed(3)),
    headingSimilarity: Number(headingSimilarity.toFixed(3)),
    paragraphSimilarity: Number(paragraphSimilarity.toFixed(3)),
    phraseRepetition: Number(phraseResult.score.toFixed(3)),
    metaSimilarity: Number(metaSimilarity.toFixed(3)),
    overallSimilarity: Number(overallSimilarity.toFixed(3)),
    similarityPercentage,
    sharedPhrases: phraseResult.sharedPhrases,
    exceedsThreshold: overallSimilarity > threshold,
  };
}

// ---------------------------------------------------------------------------
// Site-Wide Content Similarity Audit
// ---------------------------------------------------------------------------

/**
 * Scans all generated pages in a site and performs full pairwise matrix analysis.
 */
export function auditSiteSimilarity(
  pages: (PageContentJSON | ExtractedPageText)[],
  options?: SimilarityCheckerOptions
): ContentSimilarityAuditResult {
  const threshold = options?.similarityThreshold ?? 0.35;
  const thresholdPct = Math.round(threshold * 100);

  const comparisons: PagePairSimilarity[] = [];
  const potentiallyRepetitiveSlugs = new Set<string>();
  const flaggedPages: FlaggedPageIssue[] = [];

  let highestPair: PagePairSimilarity | undefined;
  let totalScore = 0;
  let pairCount = 0;

  // Adaptive comparison strategy:
  // For small sites (<= 15 pages), run exhaustive all-pairs comparison.
  // For large sites (20-100+ pages), compare each page against its immediate archetype peers
  // and adjacent siblings to avoid O(N^2) CPU starvation (e.g. 4,950 pairs on 100 pages).
  const isLargeSite = pages.length > 15;
  const maxSiblingDistance = isLargeSite ? 4 : pages.length;

  for (let i = 0; i < pages.length; i++) {
    const pageA = pages[i];
    const slugA = ("seo" in pageA ? pageA.slug : pageA.slug) || "";

    for (let j = i + 1; j < pages.length; j++) {
      // In large sites, compare with adjacent siblings (within window) or same-silo pages
      if (isLargeSite && j - i > maxSiblingDistance) {
        // Also check if both are service or both are location pages to catch cross-silo duplication
        const pageB = pages[j];
        const slugB = ("seo" in pageB ? pageB.slug : pageB.slug) || "";
        const sameSilo =
          (slugA.includes("service") && slugB.includes("service")) ||
          (slugA.startsWith("plumber-") && slugB.startsWith("plumber-"));
        if (!sameSilo && j % 5 !== 0) {
          continue; // Sample every 5th page for cross-checking
        }
      }

      const pair = comparePages(pages[i], pages[j], options);
      comparisons.push(pair);
      totalScore += pair.overallSimilarity;
      pairCount++;

      if (!highestPair || pair.overallSimilarity > highestPair.overallSimilarity) {
        highestPair = pair;
      }

      if (pair.exceedsThreshold) {
        // Flag page B as the repetitive page
        potentiallyRepetitiveSlugs.add(pair.pageB);

        const reasons: string[] = [];
        if (pair.headingSimilarity > threshold) {
          reasons.push(`Heading similarity ${Math.round(pair.headingSimilarity * 100)}%`);
        }
        if (pair.paragraphSimilarity > threshold) {
          reasons.push(`Paragraph body similarity ${Math.round(pair.paragraphSimilarity * 100)}%`);
        }
        if (pair.phraseRepetition > 0.20) {
          reasons.push(`Phrase overlap ${Math.round(pair.phraseRepetition * 100)}%`);
        }
        if (pair.metaSimilarity > 0.70) {
          reasons.push(`Near-duplicate meta description`);
        }

        flaggedPages.push({
          slug: pair.pageB,
          conflictingWith: pair.pageA,
          similarityPercentage: pair.similarityPercentage,
          thresholdPercentage: thresholdPct,
          reasons: reasons.length > 0 ? reasons : [`Overall text overlap exceeds ${thresholdPct}%`],
          sampleRepeatedPhrases: pair.sharedPhrases,
        });
      }
    }
  }

  const avgSimilarity = pairCount > 0 ? Math.round((totalScore / pairCount) * 100) : 0;

  const summaryText = [
    "CONTENT QUALITY",
    "",
    `Pages scanned: ${pages.length}`,
    `Potentially repetitive: ${potentiallyRepetitiveSlugs.size}`,
    `Regenerated: 0`,
    `Final flagged pages: ${flaggedPages.length}`,
  ].join("\n");

  return {
    pagesScanned: pages.length,
    potentiallyRepetitiveCount: potentiallyRepetitiveSlugs.size,
    regeneratedCount: 0,
    finalFlaggedPagesCount: flaggedPages.length,
    thresholdPercentage: thresholdPct,
    averageSimilarityPercentage: avgSimilarity,
    highestSimilarityPair: highestPair,
    pairwiseComparisons: comparisons,
    regenerationHistory: [],
    flaggedPages,
    summaryText,
  };
}

// ---------------------------------------------------------------------------
// Self-Healing Regeneration Loop
// ---------------------------------------------------------------------------

/**
 * Master Content Quality Loop:
 * 1. Scans generated pages for pairwise similarity.
 * 2. If any page exceeds the configurable threshold, flags the page.
 * 3. Regenerates the page using a different content strategy (shifted seed, heading style, paragraph structure, CTA).
 * 4. Compares again against all pages.
 * 5. Retries only up to maxRetries.
 * 6. If still too similar, reports the issue honestly in the audit.
 */
export async function auditAndDifferentiateSitePages(
  pages: PageContentJSON[],
  contexts: Map<string, PageGenerationContext> | Record<string, PageGenerationContext>,
  options?: SimilarityCheckerOptions,
  gatewayParams?: Partial<GatewayRequest>
): Promise<{ pages: PageContentJSON[]; audit: ContentSimilarityAuditResult }> {
  const threshold = options?.similarityThreshold ?? 0.35;
  const thresholdPct = Math.round(threshold * 100);
  const maxRetries = options?.maxRetries ?? 3;

  const contextMap: Map<string, PageGenerationContext> =
    contexts instanceof Map
      ? contexts
      : new Map(Object.entries(contexts));

  const activePages = [...pages];
  const regenerationHistory: RegenerationAttemptRecord[] = [];
  const initiallyFlaggedSlugs = new Set<string>();

  // Strategy names mapped to shift indices
  const strategyNames = [
    "baseline",
    "problem_resolution",
    "craftsmanship_authority",
    "diagnostic_urgency",
    "local_infrastructure",
  ];

  // Pass 1: Identify initially repetitive pages
  const initialAudit = auditSiteSimilarity(activePages, options);
  for (const flagged of initialAudit.flaggedPages) {
    initiallyFlaggedSlugs.add(flagged.slug);
  }

  const potentiallyRepetitiveCount = initiallyFlaggedSlugs.size;
  let totalRegenerationsCount = 0;

  // Execute remediation loop on flagged pages
  for (const flaggedSlug of Array.from(initiallyFlaggedSlugs)) {
    const pageIndex = activePages.findIndex((p) => p.slug === flaggedSlug);
    if (pageIndex === -1) continue;

    const ctx = contextMap.get(flaggedSlug);
    if (!ctx) continue;

    let retryAttempt = 0;
    let resolved = false;

    while (retryAttempt < maxRetries && !resolved) {
      retryAttempt++;
      totalRegenerationsCount++;

      // Current maximum similarity before regeneration
      let currentMaxSim = 0;
      let conflictingSlug = "";
      for (let i = 0; i < activePages.length; i++) {
        if (i === pageIndex) continue;
        const pair = comparePages(activePages[i], activePages[pageIndex], options);
        if (pair.overallSimilarity > currentMaxSim) {
          currentMaxSim = pair.overallSimilarity;
          conflictingSlug = pair.pageA === flaggedSlug ? pair.pageB : pair.pageA;
        }
      }

      const strategyName = strategyNames[retryAttempt % strategyNames.length];
      console.log(
        `[ContentSimilarityChecker] Flagged "${flaggedSlug}" (Similarity: ${Math.round(currentMaxSim * 100)}% with "${conflictingSlug}"). Regenerating with Strategy #${retryAttempt} ("${strategyName}")...`
      );

      // Create shifted context
      const newContext: PageGenerationContext = {
        ...ctx,
        contentVariationSeed: {
          ...ctx.contentVariationSeed,
          strategyShift: retryAttempt,
          strategyName,
        },
      };

      // Regenerate page deterministically with shifted strategy to guarantee differentiation instantly
      const regeneratedPage = await generatePageContent(newContext);
      regeneratedPage.slug = flaggedSlug;
      activePages[pageIndex] = regeneratedPage;

      // Re-evaluate similarity against all other pages
      let newMaxSim = 0;
      for (let i = 0; i < activePages.length; i++) {
        if (i === pageIndex) continue;
        const pair = comparePages(activePages[i], regeneratedPage, options);
        if (pair.overallSimilarity > newMaxSim) {
          newMaxSim = pair.overallSimilarity;
        }
      }

      resolved = newMaxSim <= threshold;

      regenerationHistory.push({
        pageSlug: flaggedSlug,
        attempt: retryAttempt,
        conflictingWith: conflictingSlug,
        previousSimilarityPercentage: Math.round(currentMaxSim * 100),
        newSimilarityPercentage: Math.round(newMaxSim * 100),
        strategyUsed: strategyName,
        resolved,
      });

      console.log(
        `[ContentSimilarityChecker] "${flaggedSlug}" Retry #${retryAttempt} result: ${Math.round(newMaxSim * 100)}% similarity (${resolved ? "RESOLVED" : "STILL OVER THRESHOLD"}).`
      );
    }
  }

  // Final Audit Pass on remediated pages
  const finalAudit = auditSiteSimilarity(activePages, options);

  const summaryText = [
    "CONTENT QUALITY",
    "",
    `Pages scanned: ${activePages.length}`,
    `Potentially repetitive: ${potentiallyRepetitiveCount}`,
    `Regenerated: ${totalRegenerationsCount}`,
    `Final flagged pages: ${finalAudit.flaggedPages.length}`,
  ].join("\n");

  const fullAuditResult: ContentSimilarityAuditResult = {
    pagesScanned: activePages.length,
    potentiallyRepetitiveCount,
    regeneratedCount: totalRegenerationsCount,
    finalFlaggedPagesCount: finalAudit.flaggedPages.length,
    thresholdPercentage: thresholdPct,
    averageSimilarityPercentage: finalAudit.averageSimilarityPercentage,
    highestSimilarityPair: finalAudit.highestSimilarityPair,
    pairwiseComparisons: finalAudit.pairwiseComparisons,
    regenerationHistory,
    flaggedPages: finalAudit.flaggedPages,
    summaryText,
  };

  return {
    pages: activePages,
    audit: fullAuditResult,
  };
}
