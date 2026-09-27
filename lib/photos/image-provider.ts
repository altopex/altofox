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
 * Dynamic Query Generator:
 * Generates unique, highly contextual, page-specific image queries based on
 * service, location, target keyword, and search intent.
 */
export function generateDynamicImageQuery(
  context: ImageContext,
  usedQueries?: Set<string>
): { query: string; alt: string } {
  const trade = (context.trade || "local service").trim();
  const service = (context.serviceName || trade).trim();
  const city = (context.city || context.cityName || "").trim();
  const state = (context.stateCode || context.state || "").trim();
  const location = [city, state].filter(Boolean).join(" ");
  const slot = context.slot || "hero";
  const index = context.index || 0;

  let baseQuery = "";
  let baseAlt = "";

  if (slot === "hero") {
    if (context.pageType === "service" || (context.serviceName && context.serviceName.toLowerCase() !== trade.toLowerCase())) {
      baseQuery = location ? `${service} ${location}` : `${service} service`;
      baseAlt = location ? `${service} in ${location}` : `Professional ${service}`;
    } else if (context.pageType === "location" || (location && !context.serviceName)) {
      baseQuery = `${trade} in ${location}`;
      baseAlt = `Licensed ${trade} serving ${location}`;
    } else if (context.targetKeyword) {
      baseQuery = context.targetKeyword;
      baseAlt = `${context.targetKeyword} by local specialists`;
    } else {
      baseQuery = location ? `${trade} in ${location}` : `${trade} professional service`;
      baseAlt = location ? `Trusted ${trade} in ${location}` : `Top-rated ${trade} service`;
    }
  } else if (slot === "service") {
    const serviceName = context.serviceName || `${trade} repair`;
    baseQuery = location ? `${serviceName} ${location}` : `${serviceName} service`;
    baseAlt = location ? `${serviceName} in ${location}` : `${serviceName} work in progress`;
  } else if (slot === "about") {
    baseQuery = location ? `${trade} team ${location}` : `${trade} professional technicians`;
    baseAlt = location ? `Dedicated ${trade} team serving ${location}` : `Experienced ${trade} team`;
  } else if (slot === "gallery") {
    const variations = [
      "installation work",
      "repair project",
      "maintenance inspection",
      "completed job",
      "tools and equipment",
    ];
    const modifier = variations[index % variations.length];
    baseQuery = location ? `${trade} ${modifier} ${location}` : `${trade} ${modifier}`;
    baseAlt = location ? `Completed ${trade} ${modifier} in ${location}` : `Quality ${trade} project`;
  } else {
    baseQuery = location ? `${service} in ${location}` : `${service} service`;
    baseAlt = `${service} service`;
  }

  let cleanQuery = baseQuery.toLowerCase().replace(/\s+/g, " ").trim();

  if (usedQueries && usedQueries.has(cleanQuery)) {
    const tradeVariations = ["specialist", "technician", "contractor", "expert", "work", "repairs"];
    const suffix = tradeVariations[index % tradeVariations.length];
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
 * Resolves an image result with multi-tier fallback and pre-validation.
 * 
 * Execution order:
 * 1. Primary external source (Bing or Pexels/Pixabay if key provided)
 * 2. Alternate external source
 * 3. Curated high-res trade stock photo (Unsplash)
 * 4. AI image generation fallback (if OpenAI key present)
 * 5. Guaranteed local trade-specific SVG vector asset (100% offline, zero network, zero broken image)
 */
export async function resolveValidatedPageImage(
  context: ImageContext,
  options: {
    preferredSource?: ImageProviderType;
    usedQueries?: Set<string>;
    pexelsKey?: string;
    pixabayKey?: string;
    openaiKey?: string;
    validateNetwork?: boolean; // Set false in fast unit tests or when offline
  } = {}
): Promise<PageImageResult> {
  const tradeCategory = detectTradeCategory(context.trade || context.serviceName || "");
  const slot = context.slot || "hero";
  const index = context.index || 0;
  const validateNetwork = options.validateNetwork ?? true;

  const defaultWidth = slot === "hero" ? 1920 : slot === "avatar" ? 200 : 800;
  const defaultHeight = slot === "hero" ? 1080 : slot === "avatar" ? 200 : 533;
  const width = context.width || defaultWidth;
  const height = context.height || defaultHeight;

  // 1. Generate unique contextual query and natural alt text
  const { query, alt } = generateDynamicImageQuery(context, options.usedQueries);

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

  // Candidate A: Primary Source
  if (provider === "bing") {
    candidates.push({
      url: buildBingThumbnailUrl(query, width, height, index + 1),
      source: "Bing",
    });
  } else if (provider === "unsplash") {
    const curated = resolvePhoto(tradeCategory, slot, alt, index);
    candidates.push({ url: curated.url, source: "Unsplash" });
  }

  // Candidate B: Pexels or Pixabay if keys available
  if (options.pexelsKey) {
    try {
      const pexelsResults = await searchPexels(query, options.pexelsKey, slot === "hero" ? "landscape" : "landscape", width);
      if (pexelsResults.length > 0) {
        candidates.push({ url: pexelsResults[0].url, source: "Pexels" });
      }
    } catch (_) {}
  }

  if (options.pixabayKey) {
    try {
      const pixabayResults = await searchPixabay(query, options.pixabayKey, slot === "hero" ? "landscape" : "landscape");
      if (pixabayResults.length > 0) {
        candidates.push({ url: pixabayResults[0].url, source: "Pixabay" });
      }
    } catch (_) {}
  }

  // Candidate C: Curated trade photo from Unsplash
  const curatedFallback = resolvePhoto(tradeCategory, slot, alt, index);
  if (!candidates.some((c) => c.url === curatedFallback.url)) {
    candidates.push({ url: curatedFallback.url, source: "Curated Unsplash" });
  }

  // Candidate D: Secondary Bing with simpler query
  const simpleBing = buildBingThumbnailUrl(`${tradeCategory} service`, width, height, index + 2);
  if (!candidates.some((c) => c.url === simpleBing)) {
    candidates.push({ url: simpleBing, source: "Bing Fallback" });
  }

  // 4. Validate candidates sequentially
  let selectedUrl = "";
  let selectedSource = "";
  let status: PageImageResult["status"] = "validated";
  const allFallbacks: string[] = [];

  if (validateNetwork) {
    for (const cand of candidates) {
      const check = await validateImageUrl(cand.url, 2500);
      if (check.valid) {
        if (!selectedUrl) {
          selectedUrl = cand.url;
          selectedSource = cand.source;
        } else {
          allFallbacks.push(cand.url);
        }
      }
    }
  } else {
    // When network validation skipped (e.g. offline unit testing), trust primary candidate
    selectedUrl = candidates[0].url;
    selectedSource = candidates[0].source;
    allFallbacks.push(...candidates.slice(1).map((c) => c.url));
  }

  // 5. If all external sources failed validation, attempt AI Image Generation
  if (!selectedUrl && options.openaiKey) {
    const aiResult = await tryGenerateAiImage(
      {
        trade: tradeCategory,
        service: context.serviceName,
        location: [context.city, context.state].filter(Boolean).join(", "),
        slot,
        width,
        height,
      },
      options.openaiKey,
      7000
    );

    if (aiResult?.url) {
      selectedUrl = aiResult.url;
      selectedSource = "AI-Generated";
      status = "ai_generated";
    }
  }

  // 6. If all external sources and AI failed, use local trade SVG fallback
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
