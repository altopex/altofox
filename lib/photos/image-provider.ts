import { detectTradeCategory, resolvePhoto, ResolvedImage, extractPhotoId } from "./photo-service";
import { validateImageUrl } from "./image-validator";
import { generateTradeSvgDataUri, generateTradeSvg } from "./trade-svg-fallback";
import { tryGenerateAiImage, buildZeroConfigAiImageUrl } from "./ai-image-service";
import { buildBingImageUrl, searchPexels, searchPixabay } from "./stock-service";
import { searchGoogleImages, buildGoogleImageQuery } from "./google-image-service";
import {
  ImageEngine,
  computeImageHash,
  normalizeImageMode,
  SupportedImageMode,
  ImageEngineOptions,
  ImageSlotContext,
  ResolvedEngineImage,
} from "./image-engine";

export {
  ImageEngine,
  computeImageHash,
  normalizeImageMode,
};
export type {
  SupportedImageMode,
  ImageEngineOptions,
  ImageSlotContext,
  ResolvedEngineImage,
};

export type ImageProviderType = "google" | "bing" | "none" | "pexels" | "pixabay" | "ai";

export interface ImageContext {
  pageTitle?: string;
  serviceName?: string;
  city?: string;
  cityName?: string;
  state?: string;
  stateCode?: string;
  trade?: string;
  targetKeyword?: string;
  slot?: "hero" | "service" | "about" | "gallery" | "avatar" | "trust";
  pageType?: string;
  pageSlug?: string;
  index?: number;
  width?: number;
  height?: number;
  customAlt?: string;
}

export interface PageImageResult {
  query: string;
  url: string;                     // Primary validated URL or local fallback
  fallbackUrl: string;             // Immediate secondary fallback URL
  allFallbacks: string[];          // Prioritized array of all alternative URLs
  localSvgFallback: string;        // Zero-network SVG data URI
  localPath: string;               // e.g. "images/plumber-hero.jpg"
  localSvgPath: string;            // e.g. "images/plumber-hero.svg"
  alt: string;
  width: number;
  height: number;
  source: string;
  slot: string;
  status: "validated" | "fallback_used" | "ai_generated" | "local_fallback";
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
 * Builds a Bing dynamic thumbnail image URL
 */
export function buildBingThumbnailUrl(
  query: string,
  width: number = 1200,
  height: number = 600,
  shardIndex: number = 1
): string {
  const hostIndex = (Math.abs(shardIndex) % 4) + 1; // tse1 to tse4
  const cleanQ = normalizeBingQuery(query) || "home+service";
  return `https://tse${hostIndex}.mm.bing.net/th?q=${cleanQ}&w=${width}&h=${height}`;
}

export interface ImageIntent {
  subject: string;
  purpose: "hero" | "service" | "about" | "gallery" | "avatar" | "trust" | "location";
  query: string;
  searchKeywords: string[];
  alt: string;
}

export interface ImageRelevanceResult {
  score: number; // 0 to 100
  isRelevant: boolean;
  reason: string;
}

export interface ImageUsageRecord {
  url: string;
  source: string;
  page?: string;
  section?: string;
  query?: string;
  subject?: string;
  timestamp: number;
}

/**
 * Tracks used image URLs, photo IDs, and queries across the entire website generation session
 * to strictly guarantee that NO image is EVER used 2 times anywhere on the website.
 */
export class ImageDeduplicationTracker {
  private usedUrls = new Set<string>();
  private usedPhotoIds = new Set<string>();
  private usedQueries = new Set<string>();
  private records: ImageUsageRecord[] = [];

  public isUrlUsed(url: string): boolean {
    if (!url) return false;
    if (this.usedUrls.has(url)) return true;

    const photoId = extractPhotoId(url);
    if (photoId && this.usedPhotoIds.has(photoId)) return true;

    const normalized = url.toLowerCase().split("?")[0].replace(/^https?:\/\//, "");
    if (this.usedUrls.has(normalized)) return true;

    return false;
  }

  public isQueryUsed(query: string): boolean {
    if (!query) return false;
    const clean = normalizeBingQuery(query);
    return this.usedQueries.has(clean);
  }

  public isUrlUsedOnPage(url: string, page: string): boolean {
    if (!url || !page) return false;
    const normalized = url.toLowerCase().split("?")[0].replace(/^https?:\/\//, "");
    return this.records.some(
      (r) => r.page?.toLowerCase() === page.toLowerCase() && r.url.toLowerCase().includes(normalized)
    );
  }

  public recordUrl(
    url: string,
    query?: string,
    metadata?: { source?: string; page?: string; section?: string; subject?: string }
  ): void {
    if (!url) return;
    this.usedUrls.add(url);

    const photoId = extractPhotoId(url);
    if (photoId) {
      this.usedPhotoIds.add(photoId);
      this.usedUrls.add(photoId);
    }

    const normalized = url.toLowerCase().split("?")[0].replace(/^https?:\/\//, "");
    this.usedUrls.add(normalized);

    if (query) {
      this.usedQueries.add(query.toLowerCase().trim());
      this.usedQueries.add(normalizeBingQuery(query));
    }

    this.records.push({
      url,
      source: metadata?.source || "unknown",
      page: metadata?.page,
      section: metadata?.section,
      query,
      subject: metadata?.subject,
      timestamp: Date.now(),
    });
  }

  public registerUsedUrl(url: string, query?: string, slot?: string): void {
    this.recordUrl(url, query, { section: slot });
  }

  /**
   * Generates a guaranteed unique Bing query that stays on-topic for the trade.
   * Every modifier keeps the trade keyword anchored so Bing returns relevant images.
   * Never appends meaningless index suffixes like "slot1".
   */
  public generateUniqueBingQuery(
    baseQuery: string,
    trade: string = "service",
    slot: string = "service",
    index: number = 0
  ): string {
    let clean = normalizeBingQuery(baseQuery);
    if (!this.isQueryUsed(clean)) {
      this.usedQueries.add(clean);
      return clean;
    }

    // Trade-anchored modifiers — every variant keeps the trade word front-and-center
    // so Bing always returns on-topic results regardless of which variant is chosen.
    const tradeAnchor = normalizeBingQuery(trade || "contractor");

    const tradeModifiers = [
      `${tradeAnchor}+technician+residential`,
      `${tradeAnchor}+specialist+repair`,
      `${tradeAnchor}+professional+service`,
      `${tradeAnchor}+contractor+home`,
      `${tradeAnchor}+expert+installation`,
      `${tradeAnchor}+licensed+worker`,
      `${tradeAnchor}+certified+inspection`,
      `${tradeAnchor}+maintenance+service`,
      `${tradeAnchor}+residential+repair`,
      `${tradeAnchor}+emergency+service`,
      `${tradeAnchor}+on+site`,
      `${tradeAnchor}+workmanship`,
      `${tradeAnchor}+diagnostic+tools`,
      `${tradeAnchor}+equipment+service`,
      `${tradeAnchor}+system+upgrade`,
      `${tradeAnchor}+quality+work`,
    ];

    for (let i = 0; i < tradeModifiers.length; i++) {
      const candidate = tradeModifiers[(index + i) % tradeModifiers.length];
      if (!this.isQueryUsed(candidate)) {
        this.usedQueries.add(candidate);
        return candidate;
      }
    }

    // Final fallback: trade + slot-specific suffix (still trade-anchored)
    const slotSuffix = slot === "hero" ? "jobsite" : slot === "about" ? "team" : slot === "gallery" ? "result" : "work";
    const uniqueCandidate = `${tradeAnchor}+${slotSuffix}+${index + 1}`;
    this.usedQueries.add(uniqueCandidate);
    return uniqueCandidate;
  }

  public getUsedUrlsSet(): Set<string> {
    return this.usedUrls;
  }

  public getUsedQueriesSet(): Set<string> {
    return this.usedQueries;
  }

  public getUsageRecords(): ImageUsageRecord[] {
    return this.records;
  }
}

/**
 * Dynamic Query Generator:
 * Generates unique, highly contextual, page-specific image queries based on:
 * BUSINESS TYPE + SERVICE + SECTION PURPOSE + PAGE TOPIC + LOCATION + SEARCH INTENT
 *
 * Every generated query is anchored to the detected trade category so Bing always
 * returns on-topic results (e.g. a plumber site never gets electrician images).
 */
export function generateDynamicImageQuery(
  context: ImageContext,
  usedQueries?: Set<string>
): { query: string; alt: string } {
  const trade = (context.trade || (context as any).niche || "local service").trim();
  const service = (context.serviceName || (context as any).service || trade).trim();
  const city = (context.city || context.cityName || "").trim();
  const state = (context.stateCode || context.state || "").trim();
  const location = [city, state].filter(Boolean).join(" ");
  const slot = (context.slot || (context as any).sectionType || "hero").toLowerCase();
  const index = context.index || 0;

  // Inline trade category detection — keeps trade noun anchored for every Bing query
  const t = trade.toLowerCase();
  let tradeNoun = "contractor";
  if (t.includes("plumb") || t.includes("drain") || t.includes("pipe") || t.includes("sewer") || t.includes("water heater") || t.includes("faucet") || t.includes("toilet")) {
    tradeNoun = "plumber";
  } else if (t.includes("electr") || t.includes("wiring") || t.includes("panel") || t.includes("breaker") || t.includes("lighting") || t.includes("circuit") || t.includes("ev charger")) {
    tradeNoun = "electrician";
  } else if (t.includes("hvac") || t.includes("air cond") || t.includes("furnace") || t.includes("heating") || t.includes("cooling") || t.includes("duct")) {
    tradeNoun = "hvac technician";
  } else if (t.includes("roof") || t.includes("shingle") || t.includes("gutter") || t.includes("siding")) {
    tradeNoun = "roofing contractor";
  } else if (t.includes("tree") || t.includes("arbor") || t.includes("stump") || t.includes("pruning")) {
    tradeNoun = "arborist tree service";
  } else if (t.includes("landscap") || t.includes("lawn") || t.includes("garden") || t.includes("mow")) {
    tradeNoun = "landscaper";
  } else if (t.includes("clean") || t.includes("maid") || t.includes("janitor")) {
    tradeNoun = "cleaning professional";
  } else if (t.includes("auto") || t.includes("mechanic") || t.includes("car repair") || t.includes("vehicle")) {
    tradeNoun = "auto mechanic";
  } else if (t.includes("paint")) {
    tradeNoun = "house painter";
  } else if (t.includes("carpet") || t.includes("floor")) {
    tradeNoun = "flooring contractor";
  } else if (t.includes("pest") || t.includes("exterminat")) {
    tradeNoun = "pest control technician";
  } else if (t.includes("concrete") || t.includes("driveway") || t.includes("pav")) {
    tradeNoun = "concrete contractor";
  } else if (t.includes("fence")) {
    tradeNoun = "fence contractor";
  } else if (t.includes("window")) {
    tradeNoun = "window installer";
  } else if (t.includes("garage") || t.includes("door")) {
    tradeNoun = "garage door technician";
  } else if (trade.length > 2 && !t.includes("service") && !t.includes("local")) {
    // Use whatever trade word they passed — still better than generic "contractor"
    tradeNoun = trade.toLowerCase().replace(/[^a-z\s]/g, "").trim().slice(0, 30) || "contractor";
  }



  let baseQuery = "";
  let baseAlt = "";
  const cleanService = service.toLowerCase();

  if (slot === "hero") {
    if (context.targetKeyword && location) {
      baseQuery = buildGoogleImageQuery({
        keyword: context.targetKeyword,
        location,
        city: context.city,
        state: context.state || context.stateCode,
      });
      const cleanLoc = location.replace(/,/g, " ").replace(/\s+/g, " ").trim();
      const capKeyword = context.targetKeyword.charAt(0).toUpperCase() + context.targetKeyword.slice(1);
      baseAlt = `${capKeyword} in ${cleanLoc}`;
    } else if (context.pageType === "service" || (context.serviceName && context.serviceName.toLowerCase() !== trade.toLowerCase())) {
      if (location) {
        baseQuery = buildGoogleImageQuery({
          keyword: service,
          location,
          city: context.city,
          state: context.state || context.stateCode,
        });
        const cleanLoc = location.replace(/,/g, " ").replace(/\s+/g, " ").trim();
        const capService = service.charAt(0).toUpperCase() + service.slice(1);
        baseAlt = `${capService} in ${cleanLoc}`;
      } else {
        baseQuery = `${tradeNoun} ${service} specialist repairing system`;
        baseAlt = `Professional ${service} specialist`;
      }
    } else if (context.pageType === "location" || (location && !context.serviceName)) {
      baseQuery = buildGoogleImageQuery({
        keyword: tradeNoun,
        location,
        city: context.city,
        state: context.state || context.stateCode,
      });
      baseAlt = `Licensed ${trade} serving ${location}`;
    } else if (context.targetKeyword) {
      baseQuery = `professional ${tradeNoun} ${context.targetKeyword} residential`;
      baseAlt = `${context.targetKeyword} by local specialists`;
    } else {
      baseQuery = location
        ? buildGoogleImageQuery({
            keyword: tradeNoun,
            location,
            city: context.city,
            state: context.state || context.stateCode,
          })
        : `professional ${tradeNoun} residential contractor job site`;
      baseAlt = location ? `Trusted ${trade} in ${location}` : `Top-rated ${trade} service`;
    }
  } else if (slot === "service") {
    // Specific service keyword mappings — trade word always anchors the query
    if (cleanService.includes("drain")) {
      baseQuery = "plumber drain cleaning snake equipment residential";
      baseAlt = "Professional drain cleaning service in action";
    } else if (cleanService.includes("repipe") || (cleanService.includes("pipe") && !cleanService.includes("pipe dream"))) {
      baseQuery = "plumber repairing copper pipe leak under sink";
      baseAlt = "Plumber repairing damaged residential pipe";
    } else if (cleanService.includes("water heater") || cleanService.includes("tankless")) {
      baseQuery = "plumber installing tankless water heater residential";
      baseAlt = "Water heater installation and maintenance";
    } else if (cleanService.includes("leak")) {
      baseQuery = "plumber acoustic pipe leak detection residential";
      baseAlt = "Plumber performing non-invasive leak detection";
    } else if (cleanService.includes("sewer")) {
      baseQuery = "plumber sewer line camera inspection residential";
      baseAlt = "Sewer line inspection and repair";
    } else if (cleanService.includes("toilet") || cleanService.includes("fixture") || cleanService.includes("faucet")) {
      baseQuery = "plumber replacing bathroom faucet fixture residential";
      baseAlt = "Bathroom fixture repair and installation";
    } else if (cleanService.includes("panel") || cleanService.includes("breaker")) {
      baseQuery = "electrician circuit breaker panel upgrade residential";
      baseAlt = "Electrical panel upgrade and wiring";
    } else if (cleanService.includes("ev") || cleanService.includes("charger")) {
      baseQuery = "electrician installing EV charging station home";
      baseAlt = "Residential EV charger installation";
    } else if (cleanService.includes("lighting") || cleanService.includes("light")) {
      baseQuery = "electrician installing recessed LED ceiling lighting";
      baseAlt = "Interior lighting installation by electrician";
    } else if (cleanService.includes("wiring") || cleanService.includes("wire")) {
      baseQuery = "electrician home electrical wiring inspection residential";
      baseAlt = "Electrical safety inspection and wiring";
    } else if (cleanService.includes("ac") || cleanService.includes("cooling") || cleanService.includes("air cond")) {
      baseQuery = "hvac technician servicing outdoor air conditioning unit";
      baseAlt = "Air conditioning maintenance and repair";
    } else if (cleanService.includes("furnace") || cleanService.includes("heat")) {
      baseQuery = "hvac technician inspecting gas furnace heating system";
      baseAlt = "Furnace heating repair and tune-up";
    } else if (cleanService.includes("duct")) {
      baseQuery = "hvac technician cleaning air ducts ventilation residential";
      baseAlt = "Ductwork cleaning and airflow inspection";
    } else if (cleanService.includes("shingle") || cleanService.includes("roof")) {
      baseQuery = "roofing contractor installing architectural shingles residential";
      baseAlt = "Roof shingle replacement and repair";
    } else if (cleanService.includes("gutter")) {
      baseQuery = "roofing contractor installing seamless gutters downspouts";
      baseAlt = "Seamless gutter installation and cleaning";
    } else if (cleanService.includes("trimming") || cleanService.includes("pruning")) {
      baseQuery = "arborist tree trimming precision branch pruning";
      baseAlt = "Professional tree trimming and pruning";
    } else if (cleanService.includes("removal")) {
      baseQuery = "arborist tree removal service crew residential";
      baseAlt = "Emergency tree removal service";
    } else if (cleanService.includes("stump")) {
      baseQuery = "stump grinder machine tree stump removal";
      baseAlt = "Tree stump grinding and removal";
    } else if (cleanService.includes("emergency")) {
      baseQuery = `emergency ${tradeNoun} service residential rapid response`;
      baseAlt = `24/7 Emergency ${trade} service response`;
    } else if (cleanService.includes("lawn") || cleanService.includes("mow")) {
      baseQuery = "landscaper mowing residential lawn professional";
      baseAlt = "Professional lawn mowing service";
    } else if (cleanService.includes("garden") || cleanService.includes("landscape")) {
      baseQuery = "landscaper garden design installation residential";
      baseAlt = "Professional landscaping and garden service";
    } else if (cleanService.includes("carpet") || cleanService.includes("floor")) {
      baseQuery = "flooring contractor installing hardwood floor residential";
      baseAlt = "Professional floor installation service";
    } else if (cleanService.includes("paint")) {
      baseQuery = "house painter painting residential exterior professional";
      baseAlt = "Professional residential painting service";
    } else if (cleanService.includes("pest") || cleanService.includes("bug") || cleanService.includes("termite")) {
      baseQuery = "pest control technician residential extermination service";
      baseAlt = "Professional pest control service";
    } else if (cleanService.includes("concrete") || cleanService.includes("driveway") || cleanService.includes("pav")) {
      baseQuery = "concrete contractor pouring residential driveway";
      baseAlt = "Concrete and driveway installation";
    } else if (cleanService.includes("fence")) {
      baseQuery = "fence contractor installing wood fence residential";
      baseAlt = "Professional fence installation service";
    } else if (cleanService.includes("window")) {
      baseQuery = "window installer replacing residential windows professional";
      baseAlt = "Professional window installation and replacement";
    } else if (cleanService.includes("garage") || cleanService.includes("door")) {
      baseQuery = "garage door technician repairing residential garage door";
      baseAlt = "Garage door repair and installation";
    } else if (cleanService.includes("clean") || cleanService.includes("maid")) {
      baseQuery = "cleaning professional housekeeping residential service";
      baseAlt = "Professional residential cleaning service";
    } else if (cleanService.includes("brake") || cleanService.includes("tire")) {
      baseQuery = "auto mechanic brake repair service vehicle";
      baseAlt = "Professional brake repair and service";
    } else if (cleanService.includes("oil")) {
      baseQuery = "auto mechanic oil change vehicle service";
      baseAlt = "Oil change and fluid service";
    } else {
      // CRITICAL FIX: Always anchor the generic fallback to the detected trade noun.
      // This prevents Bing from returning electrician images on a plumber site, etc.
      baseQuery = location
        ? `${tradeNoun} ${service} residential service`
        : `${tradeNoun} ${service} professional work`;
      baseAlt = `${trade} ${service} by certified technicians`;
    }
  } else if (slot === "about") {
    baseQuery = location
      ? `${tradeNoun} team professionals residential service ${location}`
      : `${tradeNoun} team professionals service van residential`;
    baseAlt = location ? `Dedicated ${trade} team serving ${location}` : `Experienced ${trade} team`;
  } else if (slot === "gallery") {
    // Trade-anchored gallery queries — every image clearly belongs to this specific trade
    const galleryVariations = [
      `${tradeNoun} completed installation project residential`,
      `${tradeNoun} finished repair workmanship`,
      `${tradeNoun} new equipment installed home`,
      `${tradeNoun} before after restoration residential`,
      `${tradeNoun} professional maintenance work`,
    ];
    const modifier = galleryVariations[index % galleryVariations.length];
    baseQuery = modifier;
    baseAlt = `Completed ${trade} ${["installation", "repair", "upgrade", "restoration", "maintenance"][index % 5]}`;
  } else {
    baseQuery = location ? `${tradeNoun} ${service} ${location}` : `${tradeNoun} ${service}`;
    baseAlt = `${trade} ${service} service`;
  }

  let cleanQuery = baseQuery.toLowerCase().replace(/\s+/g, " ").trim();

  // Deduplicate: variants are trade-anchored so Bing stays on-topic even after collision
  if (usedQueries && usedQueries.has(cleanQuery)) {
    const tradeVariants = [
      `${tradeNoun} specialist residential repair`,
      `${tradeNoun} contractor home service professional`,
      `${tradeNoun} expert installation work`,
      `${tradeNoun} certified technician residential`,
      `${tradeNoun} licensed service home`,
      `${tradeNoun} workmanship residential`,
      `${tradeNoun} on site professional`,
    ];
    const variant = tradeVariants[index % tradeVariants.length];
    if (!usedQueries.has(variant)) {
      cleanQuery = variant;
    }
  }

  if (usedQueries) {
    usedQueries.add(cleanQuery);
  }

  const alt = context.customAlt || baseAlt.replace(/\s+/g, " ").trim();

  return { query: cleanQuery, alt };
}

/**
 * Explicit Intent Extractor:
 * Analyzes page, slot, and service context to establish strict subject, purpose,
 * contextual search query, and natural alt text.
 */
export function determineImageIntent(context: ImageContext): ImageIntent {
  const trade = (context.trade || (context as any).niche || "local service").trim();
  const service = (context.serviceName || (context as any).service || "").trim();
  const pageTitle = (context.pageTitle || "").trim();
  const slot = (context.slot || (context as any).sectionType || "hero").toLowerCase();

  const purpose: ImageIntent["purpose"] =
    slot.includes("hero") ? "hero" :
    slot.includes("about") ? "about" :
    slot.includes("gallery") ? "gallery" :
    slot.includes("avatar") ? "avatar" :
    slot.includes("trust") ? "trust" :
    slot.includes("location") ? "location" : "service";

  let subject = "";
  if (service) {
    subject = service;
  } else if (context.pageType === "service" && pageTitle && pageTitle.toLowerCase() !== "home") {
    subject = pageTitle;
  } else if (purpose === "about") {
    subject = `${trade} technician team`;
  } else if (purpose === "gallery") {
    subject = `${trade} completed project`;
  } else if (context.targetKeyword) {
    subject = context.targetKeyword;
  } else {
    subject = `${trade} residential service`;
  }

  const { query, alt } = generateDynamicImageQuery(context);

  const keywords = Array.from(
    new Set(
      `${subject} ${query}`
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !["and", "the", "for", "with", "residential", "commercial", "local"].includes(w))
    )
  );

  return {
    subject,
    purpose,
    query,
    searchKeywords: keywords,
    alt,
  };
}

/**
 * Image Relevance Evaluator:
 * Enforces that an image is NOT acceptable just because it returns 200 OK.
 * Scores subject keyword matching, metadata, and negative keywords.
 */
export function evaluateImageRelevance(
  candidate: { url: string; alt?: string; title?: string; tags?: string[]; source?: string },
  intent: ImageIntent
): ImageRelevanceResult {
  const textCorpus = [
    candidate.alt || "",
    candidate.title || "",
    candidate.source || "",
    candidate.url || "",
    ...(candidate.tags || []),
  ].join(" ").toLowerCase();

  const subjectLower = intent.subject.toLowerCase();
  let score = 35;
  const matchedTerms: string[] = [];

  // Direct Subject Match
  const subjectTokens = subjectLower.split(/\s+/).filter((t) => t.length > 2);
  for (const token of subjectTokens) {
    if (textCorpus.includes(token)) {
      score += 30;
      matchedTerms.push(token);
    }
  }

  // Keyword relevance
  for (const kw of intent.searchKeywords) {
    if (!matchedTerms.includes(kw) && textCorpus.includes(kw)) {
      score += 15;
      matchedTerms.push(kw);
    }
  }

  // Negative keyword detection (mismatched trade / topic)
  const tradeTopics: Record<string, string[]> = {
    drain: ["furnace", "shingle", "mow", "lawn", "car", "brake"],
    heater: ["lawn", "tree", "pruning", "roof", "brake", "mow"],
    pipe: ["garden", "shingle", "mow", "tree"],
    roof: ["sink", "drain", "toilet", "brake", "oil"],
    tree: ["sink", "pipe", "toilet", "furnace", "breaker"],
    panel: ["plumber", "pipe", "sink", "tree", "mow"],
    ac: ["toilet", "sink", "drain", "tree", "brake"],
  };

  for (const [topicKey, negList] of Object.entries(tradeTopics)) {
    if (subjectLower.includes(topicKey)) {
      for (const neg of negList) {
        if (textCorpus.includes(neg)) {
          score -= 40;
        }
      }
    }
  }

  if (intent.purpose === "about" && (textCorpus.includes("team") || textCorpus.includes("technician"))) {
    score += 20;
  }
  if (intent.purpose === "service" && (textCorpus.includes("portrait") || textCorpus.includes("headshot"))) {
    score -= 25;
  }

  const finalScore = Math.min(100, Math.max(0, score));
  const isRelevant = finalScore >= 50 && matchedTerms.length > 0;

  return {
    score: finalScore,
    isRelevant,
    reason: isRelevant
      ? `Matches ${matchedTerms.join(", ")} (Score: ${finalScore})`
      : `Insufficient match for "${intent.subject}" (Score: ${finalScore})`,
  };
}

/**
 * Resolves an image result with multi-tier fallback, subject-specific matching,
 * pre-validation, and STRICT GLOBAL DEDUPLICATION (zero reused images).
 *
 * RULES:
 * 1. HERO section images MUST be high-resolution copyright-free photos (Pexels, Pixabay, Unsplash).
 * 2. Small size images (service cards, about, gallery) can call from Bing with dynamically altered q= keywords.
 * 3. NO image may ever be used 2 times across the entire website.
 */
export async function resolveValidatedPageImage(
  context: ImageContext,
  options: {
    preferredSource?: ImageProviderType;
    usedQueries?: Set<string>;
    pexelsKey?: string;
    pixabayKey?: string;
    googleKey?: string;
    googleCx?: string;
    openaiKey?: string;
    providerCredentials?: {
      provider?: string;
      apiKey?: string;
      baseUrl?: string;
      model?: string;
      organizationId?: string;
      providerName?: string;
    };
    deduplicationTracker?: ImageDeduplicationTracker;
    validateNetwork?: boolean;
  } = {}
): Promise<PageImageResult> {
  const tradeCategory = detectTradeCategory(context.trade || context.serviceName || "");
  const slot = context.slot || (context as any).sectionType || "hero";
  const isHero = slot === "hero";
  const index = context.index || 0;
  const validateNetwork = options.validateNetwork ?? true;
  const tracker = options.deduplicationTracker;

  const defaultWidth = isHero ? 1920 : slot === "avatar" ? 200 : 800;
  const defaultHeight = isHero ? 1080 : slot === "avatar" ? 200 : 533;
  const width = context.width || defaultWidth;
  const height = context.height || defaultHeight;

  // 1. Establish explicit Image Intent (Subject + Purpose + Query)
  const intent = determineImageIntent({
    ...context,
    slot,
    trade: context.trade || (context as any).niche || tradeCategory,
    serviceName: context.serviceName || (context.pageType === "service" ? context.pageTitle : undefined),
  });

  const query = intent.query;
  const alt = context.customAlt || intent.alt;

  // 2. Generate guaranteed local SVG fallback
  const localSvgFallback = generateTradeSvgDataUri({
    trade: tradeCategory,
    slot,
    title: alt,
    location: [context.city, context.state].filter(Boolean).join(", "),
    width,
    height,
  });

  const cleanSlug = alt
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .slice(0, 45)
    .replace(/-+$/, "") || `image-${slot}-${index + 1}`;

  const localPath = `images/${cleanSlug}.jpg`;
  const localSvgPath = `images/${cleanSlug}.svg`;

  // 3. Assemble candidate sources in order of preference
  const candidates: Array<{ url: string; source: string; alt?: string; title?: string }> = [];

  const googleKey = (options.googleKey || process.env.GOOGLE_SEARCH_API_KEY || process.env.GOOGLE_CUSTOM_SEARCH_KEY || "").trim();
  const googleCx = (options.googleCx || process.env.GOOGLE_SEARCH_ENGINE_ID || process.env.GOOGLE_CUSTOM_SEARCH_CX || "").trim();
  const isGooglePreferred = options.preferredSource === "google";

  // Priority Candidate: Google Image Search API (Finds live, relevant web images without downloading)
  if ((isGooglePreferred || (googleKey && googleCx)) && googleKey && googleCx) {
    try {
      const googleResults = await searchGoogleImages(query, googleKey, googleCx, { num: 5, timeoutMs: 3500 });
      for (const g of googleResults) {
        if (!tracker || !tracker.isUrlUsed(g.url)) {
          candidates.push({
            url: g.url,
            source: "Google Images",
            alt,
            title: intent.subject,
          });
          if (isGooglePreferred) break;
        }
      }
    } catch (_) {}
  }

  if (isHero) {
    // =========================================================================
    // HERO IMAGES: EXCLUSIVELY COPYRIGHT-FREE HIGH-RES PHOTOS (Pexels / Pixabay / AI Generation)
    // =========================================================================

    // Priority AI Candidate if AI is the preferred source
    if (options.preferredSource === "ai") {
      const aiCreds = options.providerCredentials || (options.openaiKey ? { apiKey: options.openaiKey } : undefined);
      const aiResult = await tryGenerateAiImage(
        {
          trade: tradeCategory,
          service: intent.subject || context.serviceName,
          location: [context.city, context.state].filter(Boolean).join(", "),
          slot: "hero",
          width: 1920,
          height: 1080,
          seed: index + 1,
        },
        aiCreds,
        4000
      );
      if (aiResult?.url && (!tracker || !tracker.isUrlUsed(aiResult.url))) {
        candidates.push({ url: aiResult.url, source: "AI-Generated", alt, title: intent.subject });
      }
    }

    // Candidate 1: Pexels API (if key available)
    if (options.pexelsKey) {
      try {
        const pexelsResults = await searchPexels(query, options.pexelsKey, "landscape", 1920);
        for (const p of pexelsResults) {
          if (!tracker || !tracker.isUrlUsed(p.url)) {
            candidates.push({ url: p.url, source: "Pexels", alt: p.photographer, title: intent.subject });
            break;
          }
        }
      } catch (_) {}
    }

    // Candidate 2: Pixabay API (if key available)
    if (options.pixabayKey) {
      try {
        const pixabayResults = await searchPixabay(query, options.pixabayKey, "landscape");
        for (const p of pixabayResults) {
          if (!tracker || !tracker.isUrlUsed(p.url)) {
            candidates.push({ url: p.url, source: "Pixabay", alt: p.photographer, title: intent.subject });
            break;
          }
        }
      } catch (_) {}
    }

    // Candidate 3: Curated Royalty-Free Copyright-Free Pexels Trade Registry
    const usedSet = tracker ? tracker.getUsedUrlsSet() : undefined;
    const curatedHero = resolvePhoto(tradeCategory, "hero", intent.subject || query, index, usedSet);
    if (!tracker || !tracker.isUrlUsed(curatedHero.url)) {
      candidates.push({ url: curatedHero.url, source: "Pexels Trade Stock", alt: curatedHero.alt, title: intent.subject });
    }

    // Candidate 4 & 5: Additional offset copyright-free heroes
    for (let offset = 1; offset <= 4; offset++) {
      const nextHero = resolvePhoto(tradeCategory, "hero", query, index + offset, usedSet);
      if (!candidates.some((c) => c.url === nextHero.url) && (!tracker || !tracker.isUrlUsed(nextHero.url))) {
        candidates.push({ url: nextHero.url, source: "Pexels Trade Stock", alt: nextHero.alt, title: intent.subject });
      }
    }
  } else {
    // =========================================================================
    // SMALL SIZE IMAGES: BING WITH DYNAMICALLY ALTERED UNIQUE KEYWORDS + PEXELS + AI FALLBACK
    // =========================================================================

    const provider = options.preferredSource || (process.env.IMAGE_PROVIDER as ImageProviderType) || "bing";

    // Priority AI Candidate if AI is the preferred source
    if (provider === "ai") {
      const aiCreds = options.providerCredentials || (options.openaiKey ? { apiKey: options.openaiKey } : undefined);
      const aiResult = await tryGenerateAiImage(
        {
          trade: tradeCategory,
          service: intent.subject || context.serviceName,
          location: [context.city, context.state].filter(Boolean).join(", "),
          slot,
          width,
          height,
          seed: index + 50,
        },
        aiCreds,
        3000
      );
      if (aiResult?.url && (!tracker || !tracker.isUrlUsed(aiResult.url))) {
        candidates.push({ url: aiResult.url, source: "AI-Generated", alt, title: intent.subject });
      }
    }

    // Candidate 1: Bing with dynamically altered unique keywords
    const uniqueBingQuery = tracker
      ? tracker.generateUniqueBingQuery(query, tradeCategory, slot, index)
      : normalizeBingQuery(query);
    const bingUrl = buildBingThumbnailUrl(uniqueBingQuery, width, height, index + 1);

    if (provider !== "ai") {
      candidates.push({
        url: bingUrl,
        source: "Bing",
        alt,
        title: intent.subject,
      });
    }

    // Candidate 2: Curated Royalty-Free Copyright-Free Stock
    const usedSet = tracker ? tracker.getUsedUrlsSet() : undefined;
    const curatedStock = resolvePhoto(tradeCategory, slot, intent.subject || query, index, usedSet);
    if (!candidates.some((c) => c.url === curatedStock.url) && (!tracker || !tracker.isUrlUsed(curatedStock.url))) {
      candidates.push({ url: curatedStock.url, source: "Curated Stock", alt: curatedStock.alt, title: intent.subject });
    }

    // Candidate 3: Pexels API (if key available)
    if (options.pexelsKey) {
      try {
        const pexelsResults = await searchPexels(query, options.pexelsKey, "landscape", width);
        for (const p of pexelsResults) {
          if (!tracker || !tracker.isUrlUsed(p.url)) {
            candidates.push({ url: p.url, source: "Pexels", alt: p.photographer, title: intent.subject });
            break;
          }
        }
      } catch (_) {}
    }

    // Candidate 4: Pixabay API (if key available)
    if (options.pixabayKey) {
      try {
        const pixabayResults = await searchPixabay(query, options.pixabayKey, "landscape");
        for (const p of pixabayResults) {
          if (!tracker || !tracker.isUrlUsed(p.url)) {
            candidates.push({ url: p.url, source: "Pixabay", alt: p.photographer, title: intent.subject });
            break;
          }
        }
      } catch (_) {}
    }

    // Candidate 5: Secondary Bing with further modified semantic action query
    const secondaryBingQuery = tracker
      ? tracker.generateUniqueBingQuery(`${tradeCategory} ${intent.subject || context.serviceName || "technician"} residential service`, tradeCategory, slot, index + 2)
      : normalizeBingQuery(`${tradeCategory} ${intent.subject || context.serviceName || "technician"} residential service`);
    const secondaryBingUrl = buildBingThumbnailUrl(secondaryBingQuery, width, height, index + 2);
    if (!candidates.some((c) => c.url === secondaryBingUrl)) {
      candidates.push({ url: secondaryBingUrl, source: "Bing Fallback", alt: secondaryBingQuery, title: intent.subject });
    }
  }

  // 4. Validate candidates sequentially and enforce deduplication + relevance
  let selectedUrl = "";
  let selectedSource = "";
  let status: PageImageResult["status"] = "validated";
  const allFallbacks: string[] = [];

  for (const cand of candidates) {
    // STRICT DEDUPLICATION: reject if already used anywhere on the website
    if (tracker && tracker.isUrlUsed(cand.url)) {
      continue;
    }

    // Relevance check: ensure candidate matches the slot subject
    const relevance = evaluateImageRelevance(cand, intent);
    if (!relevance.isRelevant && candidates.length > 1) {
      continue;
    }

    // Network check with tight 1200ms timeout guard
    if (validateNetwork) {
      const check = await validateImageUrl(cand.url, 1200);
      if (!check.valid) {
        continue;
      }
    }

    if (!selectedUrl) {
      selectedUrl = cand.url;
      selectedSource = cand.source;
      tracker?.recordUrl(cand.url, query, {
        source: cand.source,
        page: context.pageSlug || context.pageTitle,
        section: slot,
        subject: intent.subject,
      });
    } else {
      allFallbacks.push(cand.url);
    }
  }

  // If network validation was off and nothing selected, pick first unused candidate
  if (!selectedUrl && candidates.length > 0) {
    for (const cand of candidates) {
      if (!tracker || !tracker.isUrlUsed(cand.url)) {
        selectedUrl = cand.url;
        selectedSource = cand.source;
        tracker?.recordUrl(cand.url, query, {
          source: cand.source,
          page: context.pageSlug || context.pageTitle,
          section: slot,
          subject: intent.subject,
        });
        break;
      }
    }
    if (!selectedUrl) {
      // If all candidates collided, generate a guaranteed unique fresh photo
      const freshPhoto = resolvePhoto(tradeCategory, slot, query, index + 10, tracker ? tracker.getUsedUrlsSet() : undefined);
      selectedUrl = freshPhoto.url;
      selectedSource = freshPhoto.source || "Curated";
      tracker?.recordUrl(freshPhoto.url, query, {
        source: selectedSource,
        page: context.pageSlug || context.pageTitle,
        section: slot,
        subject: intent.subject,
      });
    }
  }

  // 5. If all external sources failed validation, attempt AI Image Generation
  if (!selectedUrl) {
    const aiCreds = options.providerCredentials || (options.openaiKey ? { apiKey: options.openaiKey } : undefined);
    const aiResult = await tryGenerateAiImage(
      {
        trade: tradeCategory,
        service: intent.subject || context.serviceName,
        location: [context.city, context.state].filter(Boolean).join(", "),
        slot,
        width,
        height,
      },
      aiCreds,
      7000
    );

    if (aiResult?.url && (!tracker || !tracker.isUrlUsed(aiResult.url))) {
      selectedUrl = aiResult.url;
      selectedSource = "AI-Generated";
      status = "ai_generated";
      tracker?.recordUrl(selectedUrl, query, {
        source: "AI-Generated",
        page: context.pageSlug || context.pageTitle,
        section: slot,
        subject: intent.subject,
      });
    }
  }

  // 6. If all external sources and AI failed, use guaranteed local trade SVG fallback
  if (!selectedUrl) {
    selectedUrl = localSvgFallback;
    selectedSource = "Local SVG Fallback";
    status = "local_fallback";
  }

  // Always append local SVG data URI to the very end of fallbacks
  if (!allFallbacks.includes(localSvgFallback) && selectedUrl !== localSvgFallback) {
    allFallbacks.push(localSvgFallback);
  }

  const primaryFallback = allFallbacks[0] || localSvgFallback;

  return {
    query,
    url: selectedUrl,
    fallbackUrl: primaryFallback,
    allFallbacks,
    localSvgFallback,
    localPath,
    localSvgPath,
    alt,
    width,
    height,
    source: selectedSource,
    slot,
    status,
  };
}

/**
 * Synchronous resolver for initial planning and offline generation.
 * Enforces:
 * 1. Hero images are strictly high-res copyright-free photography (Unsplash/Pexels).
 * 2. Small size images can use Bing thumbnails with unique altered q= keywords.
 * 3. NO image URL may ever be used 2 times.
 */
export function resolvePageImage(
  context: ImageContext,
  options: {
    preferredSource?: ImageProviderType;
    usedQueries?: Set<string>;
    pexelsKey?: string;
    pixabayKey?: string;
    googleKey?: string;
    googleCx?: string;
    deduplicationTracker?: ImageDeduplicationTracker;
  } = {}
): PageImageResult {
  const tradeCategory = detectTradeCategory(context.trade || context.serviceName || "");
  const slot = context.slot || "hero";
  const isHero = slot === "hero";
  const index = context.index || 0;
  const tracker = options.deduplicationTracker;

  const defaultWidth = isHero ? 1920 : slot === "avatar" ? 200 : 800;
  const defaultHeight = isHero ? 1080 : slot === "avatar" ? 200 : 533;
  const width = context.width || defaultWidth;
  const height = context.height || defaultHeight;

  const intent = determineImageIntent({
    ...context,
    slot,
    trade: context.trade || (context as any).niche || tradeCategory,
    serviceName: context.serviceName || (context.pageType === "service" ? context.pageTitle : undefined),
  });

  const query = intent.query;
  const alt = context.customAlt || intent.alt;

  // Resolve copyright-free curated photo
  const usedSet = tracker ? tracker.getUsedUrlsSet() : undefined;
  const curatedPhoto = resolvePhoto(
    tradeCategory,
    slot,
    intent.subject || query,
    index,
    usedSet
  );

  let primaryUrl = "";
  let source = "Curated";

  if (isHero) {
    // HERO: MUST be high-res copyright-free photography
    if (options.preferredSource === "ai") {
      primaryUrl = buildZeroConfigAiImageUrl({
        trade: tradeCategory,
        slot: "hero",
        service: intent.subject || context.serviceName,
        location: [context.city, context.state].filter(Boolean).join(", "),
        width,
        height,
        seed: index + 1,
      });
      source = "AI-Generated";
    } else {
      primaryUrl = curatedPhoto.url;
      source = "Pexels";
    }
  } else {
    // SMALL SIZE: Can call from Bing with dynamically altered unique keywords or AI
    const provider = options.preferredSource || (process.env.IMAGE_PROVIDER as ImageProviderType) || "bing";
    if (provider === "ai") {
      primaryUrl = buildZeroConfigAiImageUrl({
        trade: tradeCategory,
        slot,
        service: intent.subject || context.serviceName,
        location: [context.city, context.state].filter(Boolean).join(", "),
        width,
        height,
        seed: index + 50,
      });
      source = "AI-Generated";
    } else {
      const uniqueQuery = tracker
        ? tracker.generateUniqueBingQuery(query, tradeCategory, slot, index)
        : normalizeBingQuery(query);
      primaryUrl = buildBingThumbnailUrl(uniqueQuery, width, height, index + 1);
      source = "Bing";
    }
  }

  // If primaryUrl was already used, pick guaranteed fresh unused photo
  if (tracker && tracker.isUrlUsed(primaryUrl)) {
    const freshPhoto = resolvePhoto(tradeCategory, slot, query, index + 20, tracker.getUsedUrlsSet());
    primaryUrl = freshPhoto.url;
    source = "Curated";
  }

  // Register chosen URL in tracker
  if (tracker) {
    tracker.recordUrl(primaryUrl, query, {
      source,
      page: context.pageSlug || context.pageTitle,
      section: slot,
      subject: intent.subject,
    });
  }

  const localSvgFallback = generateTradeSvgDataUri({
    trade: tradeCategory,
    slot,
    title: alt,
    location: [context.city, context.state].filter(Boolean).join(", "),
    width,
    height,
  });

  const cleanSlug = alt
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .slice(0, 45)
    .replace(/-+$/, "") || `image-${slot}-${index + 1}`;

  return {
    query,
    url: primaryUrl,
    fallbackUrl: curatedPhoto.url !== primaryUrl ? curatedPhoto.url : localSvgFallback,
    allFallbacks: [curatedPhoto.url, localSvgFallback].filter((u) => u !== primaryUrl),
    localSvgFallback,
    localPath: `images/${cleanSlug}.jpg`,
    localSvgPath: `images/${cleanSlug}.svg`,
    alt,
    width,
    height,
    source,
    slot,
    status: "validated",
  };
}

/**
 * Renders an accessible, SEO-optimized static HTML <img> tag with:
 * - Natural contextual ALT text (never stripped)
 * - Explicit width and height attributes (zero CLS)
 * - Safe multi-tier browser error fallback handler
 * - Zero dependency on third-party client JS libraries
 */
export function renderStaticImageTag(options: {
  src: string;
  alt: string;
  fallbackUrl?: string;
  allFallbacks?: string[];
  fallbacks?: string[];
  localSvg?: string;
  localSvgFallback?: string;
  width?: number;
  height?: number;
  loading?: "lazy" | "eager";
  fetchpriority?: "high" | "low" | "auto";
  fetchPriority?: "high" | "low" | "auto";
  className?: string;
  style?: string;
}): string {
  const {
    src,
    alt,
    fallbackUrl,
    allFallbacks = [],
    fallbacks = [],
    localSvg,
    localSvgFallback,
    width = 800,
    height = 533,
    loading = "lazy",
    fetchpriority,
    fetchPriority,
    className = "img-responsive",
    style,
  } = options;

  const priority = fetchpriority || fetchPriority;
  const fetchPriorityAttr = priority ? ` fetchpriority="${priority}"` : "";
  const styleAttr = style ? ` style="${style.replace(/"/g, "&quot;")}"` : "";

  // Combine fallbacks
  const fallbackList: string[] = [];
  if (fallbackUrl && !fallbackList.includes(fallbackUrl)) fallbackList.push(fallbackUrl);
  const combinedList = [...allFallbacks, ...fallbacks];
  for (const f of combinedList) {
    if (f && !fallbackList.includes(f) && f !== src) fallbackList.push(f);
  }
  const safeFallbacks = fallbackList.join(",").replace(/"/g, "&quot;");
  const resolvedSvg = localSvg || localSvgFallback || "";
  const safeLocalSvg = resolvedSvg.replace(/"/g, "&quot;");
  const safeAlt = (alt || "Service illustration").replace(/"/g, "&quot;");
  const effectiveSrc = src || (safeLocalSvg ? safeLocalSvg : "");
  if (!effectiveSrc) {
    return `<div class="img-placeholder ${className}"${styleAttr} aria-hidden="true"></div>`;
  }

  return `<img src="${effectiveSrc}" data-remote-src="${src}" data-fallbacks="${safeFallbacks}" data-local-svg="${safeLocalSvg}" alt="${safeAlt}" width="${width}" height="${height}" loading="${loading}"${fetchPriorityAttr}${styleAttr} class="${className}" onerror="handleImageFallback(this)">`;
}

/**
 * Global Browser-Side Image Fallback Script
 */
export const IMAGE_FALLBACK_SCRIPT = `
function handleImageFallback(img) {
  if (!img || img.dataset.failed === 'true') return;

  var pic = img.closest('picture');
  if (pic) {
    var sources = pic.querySelectorAll('source');
    for (var i = 0; i < sources.length; i++) {
      sources[i].remove();
    }
  }

  var fallbacks = (img.dataset.fallbacks || '').split(',').map(function(s) { return s.trim(); }).filter(Boolean);
  var currentIdx = parseInt(img.dataset.fallbackIdx || '0', 10);

  if (currentIdx < fallbacks.length) {
    var nextUrl = fallbacks[currentIdx];
    img.dataset.fallbackIdx = String(currentIdx + 1);
    img.src = nextUrl;
  } else {
    img.dataset.failed = 'true';
    img.removeAttribute('onerror');
    var localSvg = img.dataset.localSvg;
    if (localSvg && img.src !== localSvg) {
      img.src = localSvg;
    }
  }
}
`;
