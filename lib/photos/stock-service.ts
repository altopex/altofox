/**
 * Stock Photography Service for RankLocal.
 * Integrates with free royalty-free image APIs (Pexels and Pixabay).
 * Handles orientation selection, deduplication, query simplification,
 * SEO-friendly naming, and attribution credits.
 */

import { detectTradeCategory, resolvePhoto } from "./photo-service";
import { BRAND } from "@/config/brand";

export type ImageOrientation = "landscape" | "portrait" | "square";
export type ImageSlotType = "hero" | "service" | "about" | "gallery" | "avatar" | "trust";

export interface StockPhoto {
  id: string;
  source: "Pexels" | "Pixabay" | "Bing" | "Curated";
  url: string;              // High-quality CDN URL for web preview
  downloadUrl: string;      // Sized direct image URL for ZIP bundle
  width: number;
  height: number;
  alt: string;
  photographer: string;
  photographerUrl: string;
  sourceUrl: string;
  slot: ImageSlotType;
  localPath: string;        // e.g. "images/emergency-plumber-dallas-tx.jpg"
  localWebpPath: string;    // e.g. "images/emergency-plumber-dallas-tx.webp"
}

export interface StockPhotoSearchOptions {
  query: string;
  alt?: string;
  slot?: ImageSlotType | string;
  preferredSource?: "bing" | "pexels" | "pixabay";
  pexelsKey?: string;
  pixabayKey?: string;
  usedPhotoIds?: Set<string>;
  tradeCategory?: string;
  city?: string;
  businessName?: string;
  index?: number;
  width?: number;
  height?: number;
}

/**
 * Determines the ideal orientation based on section image slot
 */
export function getOrientationForSlot(slot: string): ImageOrientation {
  const s = slot.toLowerCase();
  if (s.includes("hero")) return "landscape";
  if (s.includes("avatar") || s.includes("icon") || s.includes("profile")) return "square";
  if (s.includes("about")) return "portrait";
  if (s.includes("service") || s.includes("card")) return "landscape";
  return "landscape";
}

/**
 * Generates an SEO-friendly filename based on alt text and business context
 */
export function slugifyImageName(altOrQuery: string, fallbackSuffix: number): string {
  const clean = (altOrQuery || "")
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const base = clean.length > 3 ? clean.slice(0, 48) : `service-photo-${fallbackSuffix}`;
  return base.replace(/-+$/, "");
}

/**
 * Simplifies a detailed query down to core trade keywords
 * e.g. "licensed plumber fixing kitchen sink in dallas home" -> "plumber sink" -> "plumber"
 */
export function simplifyQuery(query: string, tradeCategory?: string): string {
  if (!query) return tradeCategory || "home service";

  // Common descriptive words to strip when narrowing search
  const noiseWords = new Set([
    "licensed", "master", "certified", "professional", "expert", "best",
    "fixing", "repairing", "installing", "clearing", "inspecting", "cutting",
    "in", "action", "home", "commercial", "residential", "fast", "emergency",
    "team", "worker", "technician", "quality", "clean", "top", "rated",
    "dallas", "austin", "houston", "chicago", "new", "york", "los", "angeles"
  ]);

  const words = query
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !noiseWords.has(w));

  if (words.length > 0) {
    return words.slice(0, 2).join(" ");
  }

  return tradeCategory || "craftsman work";
}

/**
 * Builds a Bing dynamic thumbnail image URL for any keyword and dimensions.
 * Uses Bing's high-speed image CDN (tse1.mm.bing.net) with zero API keys required.
 * Examples:
 * https://tse1.mm.bing.net/th?q=water+damage&w=575&h=274
 * https://tse1.mm.bing.net/th?q=plumber+in+CA&w=575&h=274
 */
export function buildBingImageUrl(
  query: string,
  width: number = 575,
  height: number = 274,
  shardIndex: number = 1
): string {
  const hostIndex = (Math.abs(shardIndex) % 4) + 1; // 1 to 4
  const clean = (query || "home service")
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .trim()
    .replace(/\s+/g, "+");
  return `https://tse${hostIndex}.mm.bing.net/th?q=${clean}&w=${width}&h=${height}`;
}

/**
 * Queries Pexels API
 * https://api.pexels.com/v1/search?query={query}&per_page=10&orientation={orientation}
 */
export async function searchPexels(
  query: string,
  apiKey: string,
  orientation: ImageOrientation,
  targetWidth: number = 1200
): Promise<Array<{
  id: string;
  url: string;
  downloadUrl: string;
  width: number;
  height: number;
  photographer: string;
  photographerUrl: string;
  sourceUrl: string;
}>> {
  const pexelsOrientation = orientation === "square" ? "square" : orientation;
  const endpoint = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=10&orientation=${pexelsOrientation}`;

  const res = await fetch(endpoint, {
    headers: {
      Authorization: apiKey,
    },
  });

  if (!res.ok) {
    throw new Error(`Pexels API responded with status ${res.status}`);
  }

  const data = await res.json();
  if (!data || !Array.isArray(data.photos)) {
    return [];
  }

  return data.photos.map((p: any) => {
    // Sized download URL tailored to the slot
    const webUrl = p.src?.large2x || p.src?.large || p.src?.original;
    const downloadUrl =
      targetWidth <= 400
        ? p.src?.medium || p.src?.large || webUrl
        : targetWidth <= 900
        ? p.src?.large || webUrl
        : p.src?.large2x || webUrl;

    return {
      id: `pexels-${p.id}`,
      url: webUrl,
      downloadUrl: downloadUrl || webUrl,
      width: p.width || 1200,
      height: p.height || 800,
      photographer: p.photographer || "Pexels Contributor",
      photographerUrl: p.photographer_url || "https://www.pexels.com",
      sourceUrl: p.url || "https://www.pexels.com",
    };
  });
}

/**
 * Queries Pixabay API
 * https://pixabay.com/api/?key={KEY}&q={query}&image_type=photo&safesearch=true&per_page=10&orientation={orientation}
 */
export async function searchPixabay(
  query: string,
  apiKey: string,
  orientation: ImageOrientation
): Promise<Array<{
  id: string;
  url: string;
  downloadUrl: string;
  width: number;
  height: number;
  photographer: string;
  photographerUrl: string;
  sourceUrl: string;
}>> {
  const pixabayOrientation =
    orientation === "portrait" ? "vertical" : orientation === "landscape" ? "horizontal" : "all";

  const endpoint = `https://pixabay.com/api/?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(
    query
  )}&image_type=photo&safesearch=true&per_page=10&orientation=${pixabayOrientation}`;

  const res = await fetch(endpoint);
  if (!res.ok) {
    throw new Error(`Pixabay API responded with status ${res.status}`);
  }

  const data = await res.json();
  if (!data || !Array.isArray(data.hits)) {
    return [];
  }

  return data.hits.map((h: any) => {
    const webUrl = h.largeImageURL || h.webformatURL;
    return {
      id: `pixabay-${h.id}`,
      url: webUrl,
      downloadUrl: webUrl,
      width: h.imageWidth || 1280,
      height: h.imageHeight || 800,
      photographer: h.user || "Pixabay Photographer",
      photographerUrl: `https://pixabay.com/users/${encodeURIComponent(h.user || "")}-${h.user_id}/`,
      sourceUrl: h.pageURL || "https://pixabay.com",
    };
  });
}

/**
 * Core image resolver:
 * 1. Checks orientation & slot sizing.
 * 2. Tries preferred source first (Pexels / Pixabay).
 * 3. Tries secondary source if preferred yielded no new results.
 * 4. Simplifies query and retries if both empty.
 * 5. Deduplicates IDs across the entire website.
 * 6. Randomizes within top 5 candidates.
 * 7. Falls back smoothly to curated high-res trade stock.
 */
export async function resolveStockPhoto(options: StockPhotoSearchOptions): Promise<StockPhoto> {
  const slot = (options.slot || "service").toLowerCase() as ImageSlotType;
  const orientation = getOrientationForSlot(slot);
  const tradeCategory = options.tradeCategory || detectTradeCategory(options.query || "");
  const usedIds = options.usedPhotoIds || new Set<string>();
  const preferred =
    options.preferredSource ||
    (options.pexelsKey ? "pexels" : options.pixabayKey ? "pixabay" : "bing");
  const index = options.index || 0;

  // Target max width depending on slot
  const targetWidth = slot === "hero" ? 1920 : slot === "avatar" ? 200 : 800;
  const targetHeight = slot === "hero" ? 1080 : slot === "avatar" ? 200 : 600;

  // 1. Direct Bing Free Image Search (Zero API keys required, dynamic keywords)
  if (preferred === "bing") {
    const rawQuery = (
      options.query ||
      options.alt ||
      (tradeCategory !== "general" ? `${tradeCategory} in ${options.city || "CA"}` : "professional service")
    ).trim();

    // Default card/service sizes to 575x274 (standard Bing thumbnail aspect) or 1200x600 for hero
    const bingWidth = options.width || (slot === "hero" ? 1200 : slot === "avatar" ? 200 : 575);
    const bingHeight = options.height || (slot === "hero" ? 600 : slot === "avatar" ? 200 : 274);
    const bingUrl = buildBingImageUrl(rawQuery, bingWidth, bingHeight, index + 1);

    const altText = options.alt || options.query || `${tradeCategory.toUpperCase()} professional service`;
    const filenameSlug = slugifyImageName(altText, index + 1);
    const photoId = `bing-${encodeURIComponent(rawQuery).replace(/[^a-zA-Z0-9]/g, "-")}-${index}`;
    usedIds.add(photoId);

    return {
      id: photoId,
      source: "Bing",
      url: bingUrl,
      downloadUrl: bingUrl,
      width: bingWidth,
      height: bingHeight,
      alt: altText,
      photographer: "Bing Free Image Search",
      photographerUrl: "https://www.bing.com/images",
      sourceUrl: bingUrl,
      slot,
      localPath: `images/${filenameSlug}.jpg`,
      localWebpPath: `images/${filenameSlug}.webp`,
    };
  }

  let candidates: Array<{
    id: string;
    source: "Pexels" | "Pixabay";
    url: string;
    downloadUrl: string;
    width: number;
    height: number;
    photographer: string;
    photographerUrl: string;
    sourceUrl: string;
  }> = [];

  // Helper search executor for a given source
  const searchSource = async (
    source: "pexels" | "pixabay",
    searchQuery: string
  ): Promise<typeof candidates> => {
    try {
      if (source === "pexels" && options.pexelsKey) {
        const results = await searchPexels(searchQuery, options.pexelsKey, orientation, targetWidth);
        return results.map((r) => ({ ...r, source: "Pexels" as const }));
      }
      if (source === "pixabay" && options.pixabayKey) {
        const results = await searchPixabay(searchQuery, options.pixabayKey, orientation);
        return results.map((r) => ({ ...r, source: "Pixabay" as const }));
      }
    } catch (err) {
      console.warn(`[StockService] Search failed for ${source} (${searchQuery}):`, err);
    }
    return [];
  };

  const primarySource = preferred;
  const secondarySource = preferred === "pexels" ? "pixabay" : "pexels";

  // Pass 1: Original query on preferred source
  if (options.query) {
    const r1 = await searchSource(primarySource, options.query);
    candidates.push(...r1.filter((c) => !usedIds.has(c.id)));

    // Pass 2: Original query on secondary source if needed
    if (candidates.length === 0) {
      const r2 = await searchSource(secondarySource, options.query);
      candidates.push(...r2.filter((c) => !usedIds.has(c.id)));
    }

    // Pass 3: Simplified query if still empty
    if (candidates.length === 0) {
      const simpleQ = simplifyQuery(options.query, tradeCategory);
      if (simpleQ !== options.query) {
        const r3 = await searchSource(primarySource, simpleQ);
        candidates.push(...r3.filter((c) => !usedIds.has(c.id)));
        if (candidates.length === 0) {
          const r4 = await searchSource(secondarySource, simpleQ);
          candidates.push(...r4.filter((c) => !usedIds.has(c.id)));
        }
      }
    }
  }

  // Final Pass: Trade fallback search if still empty and we have keys
  if (candidates.length === 0) {
    const tradeTerm = tradeCategory === "general" ? "contractor home repair" : `${tradeCategory} service`;
    const r5 = await searchSource(primarySource, tradeTerm);
    candidates.push(...r5.filter((c) => !usedIds.has(c.id)));
  }

  const altText = options.alt || options.query || `${tradeCategory.toUpperCase()} professional service`;
  const filenameSlug = slugifyImageName(altText, index + 1);

  // If we found live API candidates, pick randomly from top 5
  if (candidates.length > 0) {
    const topCandidates = candidates.slice(0, 5);
    const randomIndex = Math.floor(Math.random() * topCandidates.length);
    const chosen = topCandidates[randomIndex];
    usedIds.add(chosen.id);

    return {
      id: chosen.id,
      source: chosen.source,
      url: chosen.url,
      downloadUrl: chosen.downloadUrl,
      width: targetWidth,
      height: targetHeight,
      alt: altText,
      photographer: chosen.photographer,
      photographerUrl: chosen.photographerUrl,
      sourceUrl: chosen.sourceUrl,
      slot,
      localPath: `images/${filenameSlug}.jpg`,
      localWebpPath: `images/${filenameSlug}.webp`,
    };
  }

  // Fallback 1: Bing Free Image Search (dynamic keywords matching trade & location)
  const dynamicQuery = (
    options.query ||
    options.alt ||
    (tradeCategory !== "general" ? `${tradeCategory} in ${options.city || "CA"}` : "professional service")
  ).trim();

  const bingWidth = options.width || (slot === "hero" ? 1200 : slot === "avatar" ? 200 : 575);
  const bingHeight = options.height || (slot === "hero" ? 600 : slot === "avatar" ? 200 : 274);
  const bingUrl = buildBingImageUrl(dynamicQuery, bingWidth, bingHeight, index + 1);
  const bingId = `bing-${encodeURIComponent(dynamicQuery).replace(/[^a-zA-Z0-9]/g, "-")}-${index}`;

  if (!usedIds.has(bingId)) {
    usedIds.add(bingId);
    return {
      id: bingId,
      source: "Bing",
      url: bingUrl,
      downloadUrl: bingUrl,
      width: bingWidth,
      height: bingHeight,
      alt: altText,
      photographer: "Bing Free Image Search",
      photographerUrl: "https://www.bing.com/images",
      sourceUrl: bingUrl,
      slot,
      localPath: `images/${filenameSlug}.jpg`,
      localWebpPath: `images/${filenameSlug}.webp`,
    };
  }

  // Fallback 2: Curated high-res trade stock (never broken, zero failure)
  const curated = resolvePhoto(tradeCategory, slot, altText, index);
  const fallbackId = `curated-${tradeCategory}-${slot}-${index}`;
  usedIds.add(fallbackId);

  return {
    id: fallbackId,
    source: "Curated",
    url: curated.url,
    downloadUrl: curated.url,
    width: targetWidth,
    height: targetHeight,
    alt: altText,
    photographer: "Unsplash Contributor",
    photographerUrl: "https://unsplash.com",
    sourceUrl: curated.url,
    slot,
    localPath: `images/${filenameSlug}.jpg`,
    localWebpPath: `images/${filenameSlug}.webp`,
  };
}

/**
 * Builds the /images/CREDITS.txt content documenting attribution for all stock photos
 */
export function buildCreditsTxt(photos: StockPhoto[], businessName: string): string {
  const lines: string[] = [];
  lines.push("==================================================================");
  lines.push(`STOCK PHOTO CREDITS & ATTRIBUTION`);
  lines.push(`Website: ${businessName || `${BRAND.name} Static Website`}`);
  lines.push(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`);
  lines.push("==================================================================\n");
  lines.push(
    "All photos in this directory are royalty-free assets provided under\n" +
    "the Bing Free Image Search, Pexels, Pixabay, or Unsplash licenses for commercial & personal use.\n"
  );

  const seen = new Set<string>();
  let count = 1;

  for (const p of photos) {
    if (seen.has(p.localPath)) continue;
    seen.add(p.localPath);

    lines.push(`[${count++}] ${p.localPath}`);
    lines.push(`    Alt: "${p.alt}"`);
    lines.push(`    Slot: ${p.slot} (${p.width}x${p.height})`);
    lines.push(`    Photographer: ${p.photographer}`);
    lines.push(`    Source: ${p.source}`);
    lines.push(`    Source URL: ${p.sourceUrl}`);
    if (p.photographerUrl && p.photographerUrl !== p.sourceUrl) {
      lines.push(`    Photographer Profile: ${p.photographerUrl}`);
    }
    lines.push("");
  }

  lines.push("------------------------------------------------------------------");
  lines.push(`Generated by ${BRAND.name} Static Website Builder`);
  lines.push("------------------------------------------------------------------");

  return lines.join("\n");
}
