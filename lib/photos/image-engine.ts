import crypto from "crypto";
import { searchGoogleImages, GoogleImageItem } from "./google-image-service";
import { generateTradeSvgDataUri } from "./trade-svg-fallback";
import { detectTradeCategory, resolvePhoto, extractPhotoId } from "./photo-service";
import { validateImageUrl } from "./image-validator";

export type SupportedImageMode = "bing" | "google" | "none";

export interface ImageEngineOptions {
  mode?: SupportedImageMode | string;
  googleApiKey?: string;
  googleCx?: string;
  validateNetwork?: boolean;
  timeoutMs?: number;
  fastOfflinePreview?: boolean;
}

export interface ImageSlotContext {
  pageType: "home" | "service" | "location" | "service_location" | "about" | "contact" | "faq" | "blog" | string;
  pageSlug: string;
  section: "hero" | "service" | "about" | "gallery" | "avatar" | "trust" | "cta" | string;
  niche: string;
  service?: string;
  location?: { city?: string; state?: string; stateCode?: string };
  city?: string;
  state?: string;
  slotIndex?: number;
  targetKeywords?: string[];
  customAlt?: string;
  width?: number;
  height?: number;
  pageTitle?: string;
}

export interface PageIntentResult {
  intentKey: string;
  pageType: string;
  niche: string;
  service?: string;
  city?: string;
  state?: string;
  section: string;
  subject: string;
  tradeNoun: string;
  searchIntentDescription: string;
}

export interface ImageCandidate {
  url: string;
  source: "google" | "bing" | "curated" | "local_fallback" | "none";
  width?: number;
  height?: number;
  alt?: string;
  title?: string;
  hash: string;
  relevanceScore?: number;
}

export interface ResolvedEngineImage {
  url: string;
  hash: string;
  alt: string;
  width: number;
  height: number;
  source: "google" | "bing" | "curated" | "local_fallback" | "none";
  fallbackUrl?: string;
  allFallbacks: string[];
  localSvgFallback: string;
  localPath: string;
  status: "assigned" | "fallback_assigned" | "none";
  intent: PageIntentResult;
  searchQuery: string;
  optimization: {
    loading: "lazy" | "eager";
    decoding: "async";
    fetchpriority?: "high" | "low" | "auto";
    optimizedUrl: string;
  };
}

/**
 * Normalizes input image mode into canonical supported values: "bing" | "google" | "none".
 */
export function normalizeImageMode(mode?: string): SupportedImageMode {
  if (!mode) return "bing";
  const m = mode.trim().toLowerCase();
  if (m === "none" || m === "off" || m === "disabled") return "none";
  if (m === "google") return "google";
  return "bing";
}

/**
 * Computes deterministic, canonical image hash to identify identical images
 * across query param variants, CDN shards, or redirects.
 */
export function computeImageHash(url: string): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();

  // 1. Data URIs
  if (lower.startsWith("data:")) {
    const hash = crypto.createHash("md5").update(trimmed).digest("hex").slice(0, 16);
    return `data-${hash}`;
  }

  // 2. Local relative paths
  if (lower.startsWith("images/") || lower.startsWith("/images/")) {
    const cleanPath = lower.replace(/^\/?images\//, "").replace(/\.[^.]+$/, "");
    return `local-${cleanPath}`;
  }

  // 3. Bing dynamic thumbnails (canonicalized by search query 'q' or 'id')
  if (lower.includes("bing.net") || lower.includes("bing.com")) {
    try {
      const parsed = new URL(trimmed);
      const id = parsed.searchParams.get("id");
      if (id) return `bing-id-${id.toLowerCase()}`;
      const q = parsed.searchParams.get("q");
      if (q) {
        const cleanQ = q.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        return `bing-q-${cleanQ}`;
      }
    } catch (_) {}
  }

  // 4. Stock photography IDs (Pexels, Pixabay, Unsplash)
  const photoId = extractPhotoId(trimmed);
  if (photoId) {
    return `stock-${photoId}`;
  }

  // 5. Remote HTTP/HTTPS URLs (canonicalize hostname + pathname)
  try {
    const parsed = new URL(trimmed);
    const canonical = `${parsed.hostname.toLowerCase()}${parsed.pathname.toLowerCase()}`;
    const hash = crypto.createHash("md5").update(canonical).digest("hex").slice(0, 16);
    return `url-${hash}`;
  } catch (_) {
    const hash = crypto.createHash("md5").update(lower).digest("hex").slice(0, 16);
    return `raw-${hash}`;
  }
}

/**
 * Normalizes query string for Bing thumbnail CDN
 */
export function normalizeBingQuery(query: string): string {
  return (query || "local service")
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .trim()
    .replace(/\s+/g, "+");
}

/**
 * Builds a Bing dynamic thumbnail image URL with center crop and sharp resampling.
 */
export function buildBingThumbnailUrl(
  query: string,
  width: number = 800,
  height: number = 533,
  shardIndex: number = 1
): string {
  const hostIndex = (Math.abs(shardIndex) % 4) + 1; // tse1 to tse4
  const cleanQ = normalizeBingQuery(query) || "home+service";
  return `https://tse${hostIndex}.mm.bing.net/th?q=${cleanQ}&w=${width}&h=${height}&c=7&rs=1`;
}

/**
 * Maps industry/niche text into a clean trade noun and category.
 */
function resolveTradeNoun(niche: string): { tradeNoun: string; tradeCategory: string } {
  const t = (niche || "local service").toLowerCase().trim();
  const tradeCategory = detectTradeCategory(niche);

  if (t.includes("plumb") || t.includes("drain") || t.includes("pipe") || t.includes("sewer") || t.includes("water heater")) {
    return { tradeNoun: "plumber", tradeCategory: "plumbing" };
  }
  if (t.includes("electr") || t.includes("wiring") || t.includes("panel") || t.includes("breaker") || t.includes("lighting")) {
    return { tradeNoun: "electrician", tradeCategory: "electrical" };
  }
  if (t.includes("hvac") || t.includes("air cond") || t.includes("furnace") || t.includes("heating") || t.includes("cooling")) {
    return { tradeNoun: "hvac technician", tradeCategory: "hvac" };
  }
  if (t.includes("roof") || t.includes("shingle") || t.includes("gutter") || t.includes("siding")) {
    return { tradeNoun: "roofing contractor", tradeCategory: "roofing" };
  }
  if (t.includes("tree") || t.includes("arbor") || t.includes("stump") || t.includes("pruning")) {
    return { tradeNoun: "arborist tree specialist", tradeCategory: "tree_service" };
  }
  if (t.includes("landscap") || t.includes("lawn") || t.includes("garden") || t.includes("mow")) {
    return { tradeNoun: "landscaper", tradeCategory: "landscaping" };
  }
  if (t.includes("paint")) {
    return { tradeNoun: "house painter", tradeCategory: "painting" };
  }
  if (t.includes("clean") || t.includes("maid") || t.includes("janitor")) {
    return { tradeNoun: "cleaning professional", tradeCategory: "cleaning" };
  }
  if (t.includes("pest") || t.includes("exterminat")) {
    return { tradeNoun: "pest control technician", tradeCategory: "pest_control" };
  }
  if (t.includes("auto") || t.includes("mechanic") || t.includes("car repair")) {
    return { tradeNoun: "auto mechanic", tradeCategory: "auto_repair" };
  }
  if (t.includes("garage") || t.includes("door")) {
    return { tradeNoun: "garage door technician", tradeCategory: "garage_doors" };
  }
  if (t.includes("carpet") || t.includes("floor")) {
    return { tradeNoun: "flooring contractor", tradeCategory: "flooring" };
  }

  const cleanCustom = t.replace(/[^a-z\s]/g, "").trim().slice(0, 24);
  return {
    tradeNoun: cleanCustom || "contractor",
    tradeCategory: tradeCategory || "general_contractor",
  };
}

/**
 * ImageEngine
 *
 * Implements the complete 9-stage image acquisition and deduplication pipeline:
 * Page Intent → Search Query → Candidate Images → URL Validation →
 * Relevance Check → Duplicate Check → Dimension Check → Assignment → Optimization
 */
export class ImageEngine {
  public mode: SupportedImageMode;
  public pageUsedImages: Map<string, Set<string>> = new Map();
  public siteUsedImages: Set<string> = new Set();
  public static globalCrossSiteRegistry: Map<string, number> = new Map();

  private options: ImageEngineOptions;
  private validationCache: Map<string, boolean> = new Map();

  constructor(options: ImageEngineOptions = {}) {
    this.options = options;
    this.mode = normalizeImageMode(options.mode);
  }

  /**
   * Returns canonical hash for any URL.
   */
  public imageHash(url: string): string {
    return computeImageHash(url);
  }

  /**
   * Helper to inspect images used on a given page.
   */
  public getPageUsedImages(pageSlug: string): Set<string> {
    const slug = (pageSlug || "index").toLowerCase().replace(/\.html$/, "");
    if (!this.pageUsedImages.has(slug)) {
      this.pageUsedImages.set(slug, new Set());
    }
    return this.pageUsedImages.get(slug)!;
  }

  /**
   * Helper to inspect images used across the whole site.
   */
  public getSiteUsedImages(): Set<string> {
    return this.siteUsedImages;
  }

  // =========================================================================
  // STAGE 1: Page Intent
  // =========================================================================
  public determinePageIntent(context: ImageSlotContext): PageIntentResult {
    const pageType = (context.pageType || "service").toLowerCase();
    const section = (context.section || "hero").toLowerCase();
    const { tradeNoun, tradeCategory } = resolveTradeNoun(context.niche);
    const city = context.city || context.location?.city || "";
    const state = context.state || context.location?.state || context.location?.stateCode || "";
    const serviceRaw = (context.service || "").trim();

    let subject = "";
    let searchIntentDescription = "";

    const sLower = serviceRaw.toLowerCase();

    // Contextual subject differentiation based on service keywords & page type
    if (sLower.includes("water heater") || sLower.includes("tankless")) {
      subject = "water heater repair technician";
      searchIntentDescription = "Residential water heater diagnostics and repair";
    } else if (sLower.includes("drain") || sLower.includes("sewer") || sLower.includes("clog") || sLower.includes("rooter")) {
      subject = "professional drain cleaning technician";
      searchIntentDescription = "Hydro jetting and sewer drain snake inspection";
    } else if (sLower.includes("leak") || sLower.includes("pipe inspection") || sLower.includes("burst")) {
      subject = "plumber leak detection pipe inspection";
      searchIntentDescription = "Electronic acoustic pipe leak detection and repair";
    } else if (sLower.includes("emergency") || sLower.includes("24/7") || sLower.includes("urgent")) {
      subject = `emergency ${tradeNoun} technician`;
      searchIntentDescription = "Rapid response emergency service dispatch";
    } else if (sLower.includes("panel") || sLower.includes("breaker") || sLower.includes("wiring")) {
      subject = "certified electrician panel upgrade";
      searchIntentDescription = "200A electrical service breaker panel inspection";
    } else if (sLower.includes("ev charger") || sLower.includes("charging")) {
      subject = "electrician ev charger installation";
      searchIntentDescription = "Level 2 home electric vehicle charging station";
    } else if (sLower.includes("generator") || sLower.includes("backup")) {
      subject = "backup generator installation technician";
      searchIntentDescription = "Whole home standby generator system setup";
    } else if (pageType === "home" || context.pageSlug === "index" || context.pageSlug === "home") {
      subject = `professional residential ${tradeCategory} technician`;
      searchIntentDescription = `Licensed ${tradeCategory} contractor providing home trade services`;
    } else if (pageType === "location" || pageType === "service_location") {
      subject = `${tradeNoun} technician servicing ${city || "local area"}`;
      searchIntentDescription = `Local ${tradeCategory} contractor working in ${city || "metro region"}`;
    } else if (pageType === "about" || section === "about") {
      subject = `licensed ${tradeNoun} company team in uniform`;
      searchIntentDescription = `Experienced craftsmen and professional service team`;
    } else if (pageType === "contact") {
      subject = `friendly ${tradeNoun} dispatch customer service representative`;
      searchIntentDescription = `Local service dispatch and booking team`;
    } else if (serviceRaw) {
      subject = `${serviceRaw.toLowerCase()} technician`;
      searchIntentDescription = `Professional ${serviceRaw} residential service`;
    } else {
      subject = `residential ${tradeNoun} technician`;
      searchIntentDescription = `Licensed home ${tradeCategory} specialist`;
    }

    const intentKey = `${pageType}:${section}:${subject.replace(/\s+/g, "-")}:${city}`;

    return {
      intentKey,
      pageType,
      niche: tradeCategory,
      service: serviceRaw || undefined,
      city: city || undefined,
      state: state || undefined,
      section,
      subject,
      tradeNoun,
      searchIntentDescription,
    };
  }

  // =========================================================================
  // STAGE 2: Search Query
  // =========================================================================
  public generateSearchQuery(intent: PageIntentResult, context: ImageSlotContext): string {
    const slotIdx = context.slotIndex || 0;
    const sLower = (intent.service || "").toLowerCase();

    // Exact query alignments requested by specification
    if (intent.pageType === "home" && intent.section === "hero") {
      return `professional residential ${intent.niche} technician`;
    }
    if (sLower.includes("water heater") || sLower.includes("tankless")) {
      if (slotIdx === 0) return "water heater repair technician";
      if (slotIdx === 1) return "tankless water heater installation residential";
      return "water heater maintenance diagnostic tools";
    }
    if (sLower.includes("drain") || sLower.includes("sewer") || sLower.includes("clog")) {
      if (slotIdx === 0) return "professional drain cleaning technician";
      if (slotIdx === 1) return "drain snake camera pipe inspection";
      return "hydro jetting drain cleaning equipment";
    }
    if (sLower.includes("leak") || sLower.includes("pipe")) {
      if (slotIdx === 0) return "plumber leak detection pipe inspection";
      if (slotIdx === 1) return "underground water pipe leak detection";
      return "electronic acoustic pipe leak specialist";
    }
    if (sLower.includes("emergency") || sLower.includes("urgent")) {
      if (slotIdx === 0) return `emergency ${intent.tradeNoun} technician`;
      return `emergency service van ${intent.tradeNoun} tools`;
    }

    if (intent.pageType === "location" || intent.pageType === "service_location") {
      const locStr = [intent.city, intent.state].filter(Boolean).join(" ");
      if (locStr) {
        if (slotIdx === 0) return `${intent.tradeNoun} technician servicing ${locStr}`;
        return `residential ${intent.tradeNoun} contractor ${locStr}`;
      }
    }

    if (intent.section === "about") {
      if (slotIdx === 0) return `licensed ${intent.tradeNoun} team working on residential home`;
      return `${intent.tradeNoun} specialist tools and diagnostic inspection`;
    }

    if (intent.section === "gallery") {
      const galleryThemes = [
        `completed ${intent.service || intent.niche} installation project`,
        `clean ${intent.niche} craftsmanship result residential`,
        `modern ${intent.niche} system replacement jobsite`,
        `precision ${intent.niche} repair restoration work`,
      ];
      return galleryThemes[slotIdx % galleryThemes.length];
    }

    if (intent.service) {
      if (slotIdx === 0) return `${intent.service.toLowerCase()} technician`;
      return `${intent.service.toLowerCase()} residential specialist`;
    }

    // Default fallback variant
    const variants = [
      `professional residential ${intent.niche} technician`,
      `${intent.tradeNoun} specialist maintenance service`,
      `licensed ${intent.tradeNoun} contractor on site`,
      `expert ${intent.tradeNoun} diagnostic inspection`,
    ];
    return variants[slotIdx % variants.length];
  }

  // =========================================================================
  // STAGE 3: Candidate Images
  // =========================================================================
  public async fetchCandidateImages(
    query: string,
    intent: PageIntentResult,
    context: ImageSlotContext
  ): Promise<ImageCandidate[]> {
    if (this.mode === "none") {
      return [];
    }

    const candidates: ImageCandidate[] = [];
    const width = context.width || (context.section === "hero" ? 1920 : 800);
    const height = context.height || (context.section === "hero" ? 1080 : 533);
    const slotIdx = context.slotIndex || 0;

    // --- MODE: GOOGLE ---
    if (this.mode === "google") {
      const googleKey = (
        this.options.googleApiKey ||
        process.env.GOOGLE_SEARCH_API_KEY ||
        process.env.GOOGLE_CUSTOM_SEARCH_KEY ||
        ""
      ).trim();
      const googleCx = (
        this.options.googleCx ||
        process.env.GOOGLE_SEARCH_ENGINE_ID ||
        process.env.GOOGLE_CUSTOM_SEARCH_CX ||
        ""
      ).trim();

      let googleSuccess = false;

      if (googleKey && googleCx) {
        try {
          const results = await searchGoogleImages(query, googleKey, googleCx, {
            num: 6,
            timeoutMs: this.options.timeoutMs || 3500,
          });

          if (results && results.length > 0) {
            googleSuccess = true;
            for (const item of results) {
              const hash = this.imageHash(item.url);
              candidates.push({
                url: item.url,
                source: "google",
                width: item.width || width,
                height: item.height || height,
                alt: item.alt || item.title || query,
                title: item.title,
                hash,
              });
            }
          }
        } catch (gErr: any) {
          console.warn(`[ImageEngine] Google search error: ${gErr?.message || gErr}`);
        }
      }

      // If Google returned 0 candidates or failed: Fallback to Bing!
      if (!googleSuccess || candidates.length === 0) {
        console.log(`[ImageEngine] Google search yielded 0 candidates for "${query}". Falling back to Bing.`);
        const bingCandidates = this.buildBingCandidates(query, width, height, slotIdx);
        candidates.push(...bingCandidates);
      }

      return candidates;
    }

    // --- MODE: BING ---
    const bingCandidates = this.buildBingCandidates(query, width, height, slotIdx);
    candidates.push(...bingCandidates);

    // Supplementary curated trade stock candidates to provide rich variation
    const stockHero = resolvePhoto(
      intent.niche,
      context.section === "hero" ? "hero" : "service",
      query,
      slotIdx,
      new Set(this.siteUsedImages)
    );
    if (stockHero && stockHero.url) {
      candidates.push({
        url: stockHero.url,
        source: "curated",
        width,
        height,
        alt: stockHero.alt,
        hash: this.imageHash(stockHero.url),
      });
    }

    return candidates;
  }

  private buildBingCandidates(
    query: string,
    width: number,
    height: number,
    slotIdx: number
  ): ImageCandidate[] {
    const candidates: ImageCandidate[] = [];
    const baseBingUrl = buildBingThumbnailUrl(query, width, height, slotIdx + 1);
    candidates.push({
      url: baseBingUrl,
      source: "bing",
      width,
      height,
      alt: query,
      hash: this.imageHash(baseBingUrl),
    });

    // Provide 3 semantic variants with trade-anchored modifiers
    const queryVariants = [
      `${query} residential repair`,
      `${query} diagnostic tools`,
      `${query} workmanship quality`,
    ];

    for (let i = 0; i < queryVariants.length; i++) {
      const vUrl = buildBingThumbnailUrl(queryVariants[i], width, height, slotIdx + i + 2);
      candidates.push({
        url: vUrl,
        source: "bing",
        width,
        height,
        alt: queryVariants[i],
        hash: this.imageHash(vUrl),
      });
    }

    return candidates;
  }

  // =========================================================================
  // STAGE 4: URL Validation
  // =========================================================================
  public async validateCandidateUrl(candidate: ImageCandidate, timeoutMs = 1500): Promise<boolean> {
    if (!candidate.url || typeof candidate.url !== "string") return false;
    if (candidate.url.startsWith("data:") || candidate.url.startsWith("images/")) return true;

    // Check fast cache
    if (this.validationCache.has(candidate.url)) {
      return this.validationCache.get(candidate.url)!;
    }

    if (!this.options.validateNetwork) {
      this.validationCache.set(candidate.url, true);
      return true;
    }

    try {
      const res = await validateImageUrl(candidate.url, timeoutMs);
      const isValid = res.valid;
      this.validationCache.set(candidate.url, isValid);
      return isValid;
    } catch (_) {
      this.validationCache.set(candidate.url, false);
      return false;
    }
  }

  // =========================================================================
  // STAGE 5: Relevance Check
  // =========================================================================
  public checkRelevance(candidate: ImageCandidate, intent: PageIntentResult): { isRelevant: boolean; score: number } {
    const corpus = `${candidate.alt || ""} ${candidate.title || ""} ${candidate.url || ""}`.toLowerCase();
    const tradeNoun = intent.tradeNoun.toLowerCase();
    const serviceToken = (intent.service || "").toLowerCase();

    let score = 40;

    if (corpus.includes(tradeNoun) || corpus.includes(intent.niche.toLowerCase())) {
      score += 35;
    }
    if (serviceToken && corpus.includes(serviceToken)) {
      score += 25;
    }

    // Negative topic check (avoid wrong trades)
    const negativePairs: Record<string, string[]> = {
      plumbing: ["roofing", "shingles", "lawn", "mower", "circuit breaker", "hvac"],
      electrical: ["sink drain", "toilet repair", "lawn mower", "roof shingles"],
      roofing: ["sink drain", "toilet", "circuit breaker", "lawn mower"],
    };

    const negs = negativePairs[intent.niche.toLowerCase()] || [];
    for (const neg of negs) {
      if (corpus.includes(neg)) {
        score -= 40;
      }
    }

    const finalScore = Math.min(100, Math.max(0, score));
    return {
      isRelevant: finalScore >= 35,
      score: finalScore,
    };
  }

  // =========================================================================
  // STAGE 6: Duplicate Check
  // =========================================================================
  public isDuplicate(
    candidate: ImageCandidate,
    pageSlug: string
  ): { isDuplicate: boolean; reason?: string } {
    const hash = candidate.hash || this.imageHash(candidate.url);
    const cleanSlug = (pageSlug || "index").toLowerCase().replace(/\.html$/, "");

    // Rule 1: Never use the same image twice on one page
    const pageSet = this.getPageUsedImages(cleanSlug);
    if (pageSet.has(hash)) {
      return { isDuplicate: true, reason: `Image hash "${hash}" already used on page "${cleanSlug}"` };
    }

    // Rule 2: Avoid repeating the same image throughout a website
    if (this.siteUsedImages.has(hash)) {
      return { isDuplicate: true, reason: `Image hash "${hash}" already used elsewhere on this website` };
    }

    return { isDuplicate: false };
  }

  // =========================================================================
  // STAGE 7: Dimension Check
  // =========================================================================
  public checkDimensions(candidate: ImageCandidate, section: string): { valid: boolean; reason?: string } {
    const w = candidate.width;
    const h = candidate.height;

    // If candidate provides metadata dimensions, enforce minimum usability thresholds
    if (w !== undefined && h !== undefined) {
      if (w <= 1 || h <= 1) {
        return { valid: false, reason: "Tracking pixel or empty 1x1 image" };
      }

      if (section === "hero") {
        if (w < 400 || h < 250) {
          return { valid: false, reason: `Hero dimension too small (${w}x${h})` };
        }
      } else if (section === "avatar") {
        if (w < 40 || h < 40) {
          return { valid: false, reason: `Avatar dimension too small (${w}x${h})` };
        }
      } else {
        if (w < 150 || h < 100) {
          return { valid: false, reason: `Card dimension too small (${w}x${h})` };
        }
      }

      const ratio = w / h;
      if (ratio < 0.25 || ratio > 4.0) {
        return { valid: false, reason: `Unusable aspect ratio (${ratio.toFixed(2)})` };
      }
    }

    return { valid: true };
  }

  // =========================================================================
  // STAGE 8 & 9: Assignment & Optimization
  // =========================================================================
  public assignImage(
    candidate: ImageCandidate | null,
    intent: PageIntentResult,
    context: ImageSlotContext,
    query: string
  ): ResolvedEngineImage {
    const pageSlug = (context.pageSlug || "index").toLowerCase().replace(/\.html$/, "");
    const width = context.width || (context.section === "hero" ? 1920 : 800);
    const height = context.height || (context.section === "hero" ? 1080 : 533);
    const isHero = context.section === "hero";

    // Rule 7: Generate useful alt text (Descriptive, localized, non-spammy)
    const locSnippet = [intent.city, intent.state].filter(Boolean).join(", ");
    let altText = context.customAlt || "";
    if (!altText) {
      if (intent.service) {
        altText = locSnippet
          ? `Licensed ${intent.tradeNoun} specialist performing ${intent.service} in ${locSnippet}`
          : `Professional ${intent.service} performed by licensed ${intent.tradeNoun}`;
      } else if (isHero) {
        altText = locSnippet
          ? `Professional residential ${intent.niche} services in ${locSnippet}`
          : `Experienced ${intent.niche} contractor for residential homes`;
      } else if (context.section === "about") {
        altText = `Certified and licensed ${intent.tradeNoun} team ready for dispatch`;
      } else {
        altText = `Professional ${intent.niche} workmanship and installation`;
      }
    }

    // SVG Local Fallback
    const localSvgFallback = generateTradeSvgDataUri({
      trade: intent.niche,
      slot: context.section === "hero" ? "hero" : "service",
      title: altText,
      location: locSnippet,
      width,
      height,
    });

    const cleanSubjectSlug = (intent.service || intent.subject)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 36)
      .replace(/-+$/, "");
    const localPath = `images/${intent.niche}-${context.section}-${cleanSubjectSlug}-${context.slotIndex || 1}.jpg`;

    // Case: Mode is "none" or all remote candidates failed
    if (!candidate || this.mode === "none") {
      const emptyHash = `none-${intent.intentKey}`;
      this.getPageUsedImages(pageSlug).add(emptyHash);
      this.siteUsedImages.add(emptyHash);

      return {
        url: this.mode === "none" ? "" : localSvgFallback,
        hash: emptyHash,
        alt: altText,
        width,
        height,
        source: "local_fallback",
        allFallbacks: [localSvgFallback],
        localSvgFallback,
        localPath,
        status: this.mode === "none" ? "none" : "fallback_assigned",
        intent,
        searchQuery: query,
        optimization: {
          loading: isHero ? "eager" : "lazy",
          decoding: "async",
          fetchpriority: isHero ? "high" : "auto",
          optimizedUrl: this.mode === "none" ? "" : localSvgFallback,
        },
      };
    }

    // Register assigned hash
    const hash = candidate.hash || this.imageHash(candidate.url);
    this.getPageUsedImages(pageSlug).add(hash);
    this.siteUsedImages.add(hash);

    // Rule 3: Cross-site frequency tracking
    const currentGlobalCount = ImageEngine.globalCrossSiteRegistry.get(hash) || 0;
    ImageEngine.globalCrossSiteRegistry.set(hash, currentGlobalCount + 1);

    // Rule 8: Optimization (smart center crop, responsive dimensions, lazy/eager)
    let optimizedUrl = candidate.url;
    if (candidate.source === "bing" && optimizedUrl.includes("bing.net")) {
      optimizedUrl = buildBingThumbnailUrl(query, width, height, (context.slotIndex || 0) + 1);
    }

    return {
      url: optimizedUrl,
      hash,
      alt: altText,
      width,
      height,
      source: candidate.source,
      fallbackUrl: localSvgFallback,
      allFallbacks: [localSvgFallback],
      localSvgFallback,
      localPath,
      status: "assigned",
      intent,
      searchQuery: query,
      optimization: {
        loading: isHero ? "eager" : "lazy",
        decoding: "async",
        fetchpriority: isHero ? "high" : "auto",
        optimizedUrl,
      },
    };
  }

  // =========================================================================
  // COMPLETE PIPELINE EXECUTION FOR A SINGLE SLOT
  // =========================================================================
  public async processSlot(context: ImageSlotContext): Promise<ResolvedEngineImage> {
    const pageSlug = (context.pageSlug || "index").toLowerCase().replace(/\.html$/, "");

    // 1. Page Intent
    const intent = this.determinePageIntent(context);

    // 2. Search Query
    const query = this.generateSearchQuery(intent, context);

    if (this.mode === "none") {
      return this.assignImage(null, intent, context, query);
    }

    // 3. Candidate Images
    let candidates = await this.fetchCandidateImages(query, intent, context);

    // Rule 3: Sort candidates by global cross-site usage ascending (prefer least used across sites)
    candidates.sort((a, b) => {
      const countA = ImageEngine.globalCrossSiteRegistry.get(a.hash) || 0;
      const countB = ImageEngine.globalCrossSiteRegistry.get(b.hash) || 0;
      return countA - countB;
    });

    let chosenCandidate: ImageCandidate | null = null;

    for (const cand of candidates) {
      // 4. URL Validation (Reject broken images)
      const isValidUrl = await this.validateCandidateUrl(cand);
      if (!isValidUrl) continue;

      // 5. Relevance Check
      const relevance = this.checkRelevance(cand, intent);
      if (!relevance.isRelevant) continue;

      // 6. Duplicate Check (Rule 1 & Rule 2)
      const dupCheck = this.isDuplicate(cand, pageSlug);
      if (dupCheck.isDuplicate) continue;

      // 7. Dimension Check (Rule 6)
      const dimCheck = this.checkDimensions(cand, context.section);
      if (!dimCheck.valid) continue;

      chosenCandidate = cand;
      break;
    }

    // Failover: If no candidate passed strict non-duplicate filters,
    // generate an on-the-fly Bing candidate with a fresh modifier to avoid duplicating
    if (!chosenCandidate) {
      const modifier = `diagnostic equipment #${(context.slotIndex || 0) + 7}`;
      const freshBingUrl = buildBingThumbnailUrl(`${query} ${modifier}`, context.width || 800, context.height || 533);
      const freshHash = this.imageHash(freshBingUrl);

      if (!this.siteUsedImages.has(freshHash)) {
        chosenCandidate = {
          url: freshBingUrl,
          source: "bing",
          width: context.width || 800,
          height: context.height || 533,
          alt: query,
          hash: freshHash,
        };
      }
    }

    // 8 & 9. Assignment & Optimization
    return this.assignImage(chosenCandidate, intent, context, query);
  }
}
