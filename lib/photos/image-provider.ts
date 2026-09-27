import { detectTradeCategory, resolvePhoto, ResolvedImage } from "./photo-service";
import { validateImageUrl } from "./image-validator";
import { generateTradeSvgDataUri, generateTradeSvg } from "./trade-svg-fallback";
import { tryGenerateAiImage } from "./ai-image-service";
import { buildBingImageUrl, searchPexels, searchPixabay } from "./stock-service";

export type ImageProviderType = "bing" | "pexels" | "pixabay" | "unsplash";

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

/**
 * Tracks used image URLs and queries across the entire website generation session
 * to guarantee that different sections and pages never unnecessarily reuse the same image.
 */
export class ImageDeduplicationTracker {
  private usedUrls = new Set<string>();
  private usedQueries = new Set<string>();

  public isUrlUsed(url: string): boolean {
    if (!url) return false;
    const normalized = url.toLowerCase().split("?")[0].replace(/^https?:\/\//, "");
    return this.usedUrls.has(normalized);
  }

  public recordUrl(url: string, query?: string): void {
    if (!url) return;
    const normalized = url.toLowerCase().split("?")[0].replace(/^https?:\/\//, "");
    this.usedUrls.add(normalized);
    if (query) this.usedQueries.add(query.toLowerCase().trim());
  }

  public registerUsedUrl(url: string, query?: string, _slot?: string): void {
    this.recordUrl(url, query);
  }

  public getUsedUrlsSet(): Set<string> {
    return this.usedUrls;
  }

  public getUsedQueriesSet(): Set<string> {
    return this.usedQueries;
  }
}

/**
 * Dynamic Query Generator:
 * Generates unique, highly contextual, page-specific image queries based on:
 * BUSINESS TYPE + SERVICE + SECTION PURPOSE + PAGE TOPIC + LOCATION + SEARCH INTENT
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

  let baseQuery = "";
  let baseAlt = "";

  const cleanService = service.toLowerCase();

  if (slot === "hero") {
    if (context.pageType === "service" || (context.serviceName && context.serviceName.toLowerCase() !== trade.toLowerCase())) {
      baseQuery = location
        ? `residential ${service} specialist repairing system in ${location}`
        : `residential ${service} technician helping homeowner with repair`;
      baseAlt = location ? `Professional ${service} in ${location}` : `Professional ${service} specialist`;
    } else if (context.pageType === "location" || (location && !context.serviceName)) {
      baseQuery = `licensed ${trade} contractor residential service in ${location}`;
      baseAlt = `Licensed ${trade} serving ${location}`;
    } else if (context.targetKeyword) {
      baseQuery = `professional residential ${context.targetKeyword} contractor`;
      baseAlt = `${context.targetKeyword} by local specialists`;
    } else {
      baseQuery = location
        ? `professional residential ${trade} contractor working in ${location}`
        : `professional residential ${trade} contractor on job site`;
      baseAlt = location ? `Trusted ${trade} in ${location}` : `Top-rated ${trade} service`;
    }
  } else if (slot === "service") {
    // Subject-specific action mapping
    if (cleanService.includes("drain")) {
      baseQuery = "plumber operating professional drain cleaning snake equipment";
      baseAlt = "Professional drain cleaning service in action";
    } else if (cleanService.includes("pipe") || cleanService.includes("repipe")) {
      baseQuery = "plumber repairing leaking copper pipe under kitchen sink";
      baseAlt = "Technician repairing damaged residential pipe";
    } else if (cleanService.includes("water heater") || cleanService.includes("tankless")) {
      baseQuery = "technician installing residential tankless water heater system";
      baseAlt = "Water heater installation and maintenance";
    } else if (cleanService.includes("leak")) {
      baseQuery = "specialist using acoustic ultrasonic pipe leak detection device";
      baseAlt = "Technician performing non-invasive leak detection";
    } else if (cleanService.includes("sewer")) {
      baseQuery = "plumber performing sewer line camera inspection";
      baseAlt = "Sewer line inspection and repair";
    } else if (cleanService.includes("toilet") || cleanService.includes("fixture") || cleanService.includes("faucet")) {
      baseQuery = "plumber replacing modern bathroom faucet fixture";
      baseAlt = "Bathroom fixture repair and installation";
    } else if (cleanService.includes("panel") || cleanService.includes("breaker")) {
      baseQuery = "licensed electrician upgrading modern circuit breaker panel";
      baseAlt = "Electrical panel upgrade and wiring";
    } else if (cleanService.includes("ev") || cleanService.includes("charger")) {
      baseQuery = "electrician installing home electric vehicle EV charging station";
      baseAlt = "Residential EV charger installation";
    } else if (cleanService.includes("lighting") || cleanService.includes("light")) {
      baseQuery = "electrician installing modern recessed LED ceiling lighting";
      baseAlt = "Interior lighting installation";
    } else if (cleanService.includes("wiring") || cleanService.includes("wire")) {
      baseQuery = "electrician inspecting home electrical wiring and outlets";
      baseAlt = "Electrical safety inspection and wiring";
    } else if (cleanService.includes("ac") || cleanService.includes("cooling") || cleanService.includes("air cond")) {
      baseQuery = "hvac technician servicing residential outdoor air conditioning unit";
      baseAlt = "Air conditioning maintenance and repair";
    } else if (cleanService.includes("furnace") || cleanService.includes("heat")) {
      baseQuery = "hvac technician inspecting residential gas furnace heating system";
      baseAlt = "Furnace heating repair and tune-up";
    } else if (cleanService.includes("duct")) {
      baseQuery = "hvac technician cleaning air ducts and ventilation filters";
      baseAlt = "Ductwork cleaning and airflow inspection";
    } else if (cleanService.includes("shingle") || cleanService.includes("roof")) {
      baseQuery = "roofing contractor installing modern architectural roof shingles";
      baseAlt = "Roof shingle replacement and repair";
    } else if (cleanService.includes("gutter")) {
      baseQuery = "contractor installing seamless gutters and downspouts on home";
      baseAlt = "Seamless gutter installation and cleaning";
    } else if (cleanService.includes("trimming") || cleanService.includes("pruning")) {
      baseQuery = "certified arborist climbing tree for precision branch trimming";
      baseAlt = "Professional tree trimming and pruning";
    } else if (cleanService.includes("removal")) {
      baseQuery = "tree service crew safely removing hazardous large tree";
      baseAlt = "Emergency tree removal service";
    } else if (cleanService.includes("stump")) {
      baseQuery = "commercial stump grinder machine removing large tree stump";
      baseAlt = "Tree stump grinding and removal";
    } else if (cleanService.includes("emergency")) {
      baseQuery = `emergency ${trade} technician service van arriving at home`;
      baseAlt = `24/7 Emergency ${trade} service response`;
    } else {
      baseQuery = location
        ? `technician performing ${service} residential service in ${location}`
        : `technician performing professional ${service} repair`;
      baseAlt = `${service} service by certified technicians`;
    }
  } else if (slot === "about") {
    baseQuery = location
      ? `friendly professional ${trade} technician contractor team in ${location}`
      : `friendly professional ${trade} technician contractor team with service van`;
    baseAlt = location ? `Dedicated ${trade} team serving ${location}` : `Experienced ${trade} team`;
  } else if (slot === "gallery") {
    const galleryVariations = [
      "finished precision installation project",
      "completed diagnostic and restoration work",
      "new high efficiency equipment installation",
      "before and after clean workmanship result",
      "professional maintenance and system upgrade",
    ];
    const modifier = galleryVariations[index % galleryVariations.length];
    baseQuery = `completed ${service} ${modifier}`;
    baseAlt = `Completed ${service} ${modifier}`;
  } else {
    baseQuery = location ? `${service} in ${location}` : `${service} service`;
    baseAlt = `${service} service`;
  }

  let cleanQuery = baseQuery.toLowerCase().replace(/\s+/g, " ").trim();

  // Deduplicate query string
  if (usedQueries && usedQueries.has(cleanQuery)) {
    const variations = ["contractor", "specialist", "technician", "work", "repairs", "installation", "inspection"];
    const suffix = variations[index % variations.length];
    const variedQuery = `${cleanQuery} ${suffix}`;
    if (!usedQueries.has(variedQuery)) {
      cleanQuery = variedQuery;
    }
  }

  if (usedQueries) {
    usedQueries.add(cleanQuery);
  }

  const alt = context.customAlt || baseAlt.replace(/\s+/g, " ").trim();

  return { query: cleanQuery, alt };
}

/**
 * Resolves an image result with multi-tier fallback, subject-specific matching,
 * pre-validation, and cross-section deduplication.
 * 
 * 5-Source Fallback Chain:
 * 1. Primary external source (Bing Image Search or preferred provider)
 * 2. Secondary source (Curated trade stock photo with subject matching)
 * 3. Tertiary source (Pexels / Pixabay with subject-specific query)
 * 4. Quaternary source (Secondary Bing with semantic action query)
 * 5. Quinary source (Semantic Trade Curated Photo Registry)
 * 6. AI image generation fallback (configured AI provider)
 * 7. Guaranteed local trade & service SVG vector asset (100% offline, zero network, zero broken image)
 */
export async function resolveValidatedPageImage(
  context: ImageContext,
  options: {
    preferredSource?: ImageProviderType;
    usedQueries?: Set<string>;
    pexelsKey?: string;
    pixabayKey?: string;
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
    validateNetwork?: boolean; // Set false in fast unit tests or when offline
  } = {}
): Promise<PageImageResult> {
  const tradeCategory = detectTradeCategory(context.trade || context.serviceName || "");
  const slot = context.slot || "hero";
  const index = context.index || 0;
  const validateNetwork = options.validateNetwork ?? true;
  const tracker = options.deduplicationTracker;

  const defaultWidth = slot === "hero" ? 1920 : slot === "avatar" ? 200 : 800;
  const defaultHeight = slot === "hero" ? 1080 : slot === "avatar" ? 200 : 533;
  const width = context.width || defaultWidth;
  const height = context.height || defaultHeight;

  // 1. Generate unique subject-specific contextual query and natural alt text
  const { query, alt } = generateDynamicImageQuery(
    context,
    tracker ? tracker.getUsedQueriesSet() : options.usedQueries
  );

  // 2. Generate guaranteed local SVG fallback (Never fails, zero network requirement)
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
  const provider = options.preferredSource || (process.env.IMAGE_PROVIDER as ImageProviderType) || "bing";
  const candidates: Array<{ url: string; source: string }> = [];

  // Candidate 1: Primary Source with subject-specific query
  if (provider === "bing") {
    candidates.push({
      url: buildBingThumbnailUrl(query, width, height, index + 1),
      source: "Bing",
    });
  } else if (provider === "unsplash") {
    const curated = resolvePhoto(tradeCategory, slot, query, index, tracker ? tracker.getUsedUrlsSet() : undefined);
    candidates.push({ url: curated.url, source: "Unsplash" });
  }

  // Candidate 2: Curated trade stock photo with subject matching
  const curatedFallback = resolvePhoto(tradeCategory, slot, query, index, tracker ? tracker.getUsedUrlsSet() : undefined);
  if (!candidates.some((c) => c.url === curatedFallback.url)) {
    candidates.push({ url: curatedFallback.url, source: "Curated Trade Photo" });
  }

  // Candidate 3: Pexels or Pixabay if keys available
  if (options.pexelsKey) {
    try {
      const pexelsResults = await searchPexels(query, options.pexelsKey, slot === "hero" ? "landscape" : "landscape", width);
      if (pexelsResults.length > 0 && (!tracker || !tracker.isUrlUsed(pexelsResults[0].url))) {
        candidates.push({ url: pexelsResults[0].url, source: "Pexels" });
      }
    } catch (_) {}
  }

  if (options.pixabayKey) {
    try {
      const pixabayResults = await searchPixabay(query, options.pixabayKey, slot === "hero" ? "landscape" : "landscape");
      if (pixabayResults.length > 0 && (!tracker || !tracker.isUrlUsed(pixabayResults[0].url))) {
        candidates.push({ url: pixabayResults[0].url, source: "Pixabay" });
      }
    } catch (_) {}
  }

  // Candidate 4: Secondary Bing with semantic action query
  const secondaryBingQuery = `${tradeCategory} ${context.serviceName || "technician"} commercial service`;
  const secondaryBingUrl = buildBingThumbnailUrl(secondaryBingQuery, width, height, index + 2);
  if (!candidates.some((c) => c.url === secondaryBingUrl)) {
    candidates.push({ url: secondaryBingUrl, source: "Bing Fallback" });
  }

  // Candidate 5: Quinary fallback from photo registry with index offset
  const quinaryPhoto = resolvePhoto(tradeCategory, slot, query, index + 3, tracker ? tracker.getUsedUrlsSet() : undefined);
  if (!candidates.some((c) => c.url === quinaryPhoto.url)) {
    candidates.push({ url: quinaryPhoto.url, source: "Trade Stock Registry" });
  }

  // 4. Validate candidates sequentially and enforce deduplication
  let selectedUrl = "";
  let selectedSource = "";
  let status: PageImageResult["status"] = "validated";
  const allFallbacks: string[] = [];

  if (validateNetwork) {
    for (const cand of candidates) {
      // Deduplication check: reject if already used elsewhere in the site
      if (tracker && tracker.isUrlUsed(cand.url)) {
        continue;
      }

      const check = await validateImageUrl(cand.url, 2500);
      if (check.valid) {
        if (!selectedUrl) {
          selectedUrl = cand.url;
          selectedSource = cand.source;
          tracker?.recordUrl(cand.url, query);
        } else {
          allFallbacks.push(cand.url);
        }
      }
    }
  } else {
    // When network validation skipped (e.g. offline unit testing), trust first unused candidate
    for (const cand of candidates) {
      if (tracker && tracker.isUrlUsed(cand.url)) {
        continue;
      }
      if (!selectedUrl) {
        selectedUrl = cand.url;
        selectedSource = cand.source;
        tracker?.recordUrl(cand.url, query);
      } else {
        allFallbacks.push(cand.url);
      }
    }
    // If all were used, accept primary
    if (!selectedUrl && candidates.length > 0) {
      selectedUrl = candidates[0].url;
      selectedSource = candidates[0].source;
    }
  }

  // 5. If all external sources failed validation, attempt AI Image Generation
  if (!selectedUrl) {
    const aiCreds = options.providerCredentials || (options.openaiKey ? { apiKey: options.openaiKey } : undefined);
    const aiResult = await tryGenerateAiImage(
      {
        trade: tradeCategory,
        service: context.serviceName,
        location: [context.city, context.state].filter(Boolean).join(", "),
        slot,
        width,
        height,
      },
      aiCreds,
      7000
    );

    if (aiResult?.url) {
      selectedUrl = aiResult.url;
      selectedSource = "AI-Generated";
      status = "ai_generated";
      tracker?.recordUrl(selectedUrl, query);
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
 * Synchronous resolver for backward compatibility (defaults to curated fallback if unvalidated)
 */
export function resolvePageImage(
  context: ImageContext,
  options: {
    preferredSource?: ImageProviderType;
    usedQueries?: Set<string>;
    pexelsKey?: string;
    pixabayKey?: string;
  } = {}
): PageImageResult {
  const tradeCategory = detectTradeCategory(context.trade || context.serviceName || "");
  const slot = context.slot || "hero";
  const index = context.index || 0;

  const defaultWidth = slot === "hero" ? 1920 : slot === "avatar" ? 200 : 800;
  const defaultHeight = slot === "hero" ? 1080 : slot === "avatar" ? 200 : 533;
  const width = context.width || defaultWidth;
  const height = context.height || defaultHeight;

  const { query, alt } = generateDynamicImageQuery(context, options.usedQueries);
  const curatedFallback = resolvePhoto(tradeCategory, slot, alt, index);
  const fallbackUrl = curatedFallback.url;

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

  const provider = options.preferredSource || (process.env.IMAGE_PROVIDER as ImageProviderType) || "bing";
  const primaryUrl = provider === "unsplash" ? fallbackUrl : buildBingThumbnailUrl(query, width, height, index + 1);

  return {
    query,
    url: primaryUrl,
    fallbackUrl,
    allFallbacks: [fallbackUrl, localSvgFallback],
    localSvgFallback,
    localPath: `images/${cleanSlug}.jpg`,
    localSvgPath: `images/${cleanSlug}.svg`,
    alt,
    width,
    height,
    source: provider === "unsplash" ? "Unsplash" : "Bing",
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

  return `<img src="${src}" data-remote-src="${src}" data-fallbacks="${safeFallbacks}" data-local-svg="${safeLocalSvg}" alt="${safeAlt}" width="${width}" height="${height}" loading="${loading}"${fetchPriorityAttr}${styleAttr} class="${className}" onerror="handleImageFallback(this)">`;
}

/**
 * Global Browser-Side Image Fallback Script
 * Safely cycles through fallback URLs, removes parent <picture> <source> locks,
 * and falls back to local SVG data URI without infinite loops.
 */
export const IMAGE_FALLBACK_SCRIPT = `
function handleImageFallback(img) {
  if (!img || img.dataset.failed === 'true') return;

  // 1. If wrapped in <picture>, remove <source> elements so they do not block <img> fallback
  var pic = img.closest('picture');
  if (pic) {
    var sources = pic.querySelectorAll('source');
    for (var i = 0; i < sources.length; i++) {
      sources[i].remove();
    }
  }

  // 2. Parse fallback URLs
  var fallbacks = (img.dataset.fallbacks || '').split(',').map(function(s) { return s.trim(); }).filter(Boolean);
  var currentIdx = parseInt(img.dataset.fallbackIdx || '0', 10);

  if (currentIdx < fallbacks.length) {
    var nextUrl = fallbacks[currentIdx];
    img.dataset.fallbackIdx = String(currentIdx + 1);
    img.src = nextUrl;
  } else {
    // 3. All remote fallbacks exhausted -> switch to local trade SVG
    img.dataset.failed = 'true';
    img.removeAttribute('onerror');
    var localSvg = img.dataset.localSvg;
    if (localSvg && img.src !== localSvg) {
      img.src = localSvg;
    }
  }
}
`;
