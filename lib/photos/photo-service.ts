/**
 * High-quality trade photo curation & query resolution engine.
 * Maps trade keywords and image slots to high-resolution Unsplash photos.
 */

export interface ResolvedImage {
  url: string;
  alt: string;
  slot: string;
  downloadUrl?: string;
  localPath?: string;
  localWebpPath?: string;
  width?: number;
  height?: number;
  photographer?: string;
  photographerUrl?: string;
  sourceUrl?: string;
  source?: string;
  id?: string;
  fallbackUrl?: string;
}

// Curated high-resolution photos by trade and slot type
const TRADE_PHOTO_REGISTRY: Record<string, Record<string, string[]>> = {
  plumber: {
    hero: [
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80", // plumber fixing kitchen sink
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80", // clean bathroom pipes
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1200&q=80", // modern tools
    ],
    service: [
      "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80", // water pipes
      "https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=800&q=80", // sink basin
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80", // copper plumbing
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80", // modern shower
      "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=800&q=80", // water heater inspection
      "https://images.unsplash.com/photo-1581244277943-fe4a9c77d389?auto=format&fit=crop&w=800&q=80", // pipe repair
    ],
    about: [
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1000&q=80", // technician with toolbelt
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1000&q=80", // professional handshake
    ],
    gallery: [
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=800&q=80",
    ],
  },
  tree: {
    hero: [
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80", // arborist caring for tall green trees
      "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1200&q=80", // tall canopy looking up
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80", // lush forest canopy
    ],
    service: [
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80", // large mature oak tree
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80", // tree trimming in action
      "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=80", // pine trees in sunlight
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80", // stump grinding & forest care
      "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80", // emergency storm branch clearing
      "https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=800&q=80", // tree removal site
    ],
    about: [
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1000&q=80", // certified arborist team
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1000&q=80", // tree health assessment
    ],
    gallery: [
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=800&q=80",
    ],
  },
  electrician: {
    hero: [
      "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=1200&q=80", // electrician working on electrical panel
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80", // modern electrical wires
    ],
    service: [
      "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
    ],
    about: [
      "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=1000&q=80",
    ],
    gallery: [
      "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
    ],
  },
  hvac: {
    hero: [
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1200&q=80", // HVAC maintenance tech
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80", // AC unit
    ],
    service: [
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
    ],
    about: [
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1000&q=80",
    ],
    gallery: [
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    ],
  },
  roofing: {
    hero: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80", // beautiful residential roof
      "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=80", // modern home exterior
    ],
    service: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
    ],
    about: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80",
    ],
    gallery: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80",
    ],
  },
  general: {
    hero: [
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1200&q=80",
    ],
    service: [
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
    ],
    about: [
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1000&q=80",
    ],
    gallery: [
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
    ],
  },
};

/**
 * Normalizes trade name to one of the registry keys
 */
export function detectTradeCategory(tradeOrIndustry: string): string {
  const t = (tradeOrIndustry || "").toLowerCase();
  if (t.includes("tree") || t.includes("arbor") || t.includes("forestry") || t.includes("stump")) return "tree";
  if (t.includes("plumb") || t.includes("drain") || t.includes("pipe") || t.includes("water heater")) return "plumber";
  if (t.includes("electr") || t.includes("wire") || t.includes("panel") || t.includes("lighting")) return "electrician";
  if (t.includes("hvac") || t.includes("air cond") || t.includes("heat") || t.includes("furnace") || t.includes("cool")) return "hvac";
  if (t.includes("roof") || t.includes("gutter") || t.includes("shingle")) return "roofing";
  return "general";
}

/**
 * Resolves an image slot + search query to a real, high-resolution photo URL
 */
export function resolvePhoto(
  tradeCategory: string,
  slot: string,
  query?: string,
  index: number = 0
): ResolvedImage {
  const category = TRADE_PHOTO_REGISTRY[tradeCategory] ? tradeCategory : "general";
  const slotKey = slot.toLowerCase().includes("hero")
    ? "hero"
    : slot.toLowerCase().includes("about")
    ? "about"
    : slot.toLowerCase().includes("gallery")
    ? "gallery"
    : "service";

  const pool = TRADE_PHOTO_REGISTRY[category][slotKey] || TRADE_PHOTO_REGISTRY[category].service;
  const pickedUrl = pool[index % pool.length];

  const defaultAlt = `${tradeCategory.toUpperCase()} service professional in action`;
  const alt = query || defaultAlt;

  // Clean slug for SEO filename
  const cleanSlug = alt
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .slice(0, 45)
    .replace(/-+$/, "") || `service-photo-${index + 1}`;

  const targetWidth = slotKey === "hero" ? 1920 : 800;
  const targetHeight = slotKey === "hero" ? 1080 : 600;

  return {
    url: pickedUrl,
    downloadUrl: pickedUrl,
    alt,
    slot,
    localPath: `images/${cleanSlug}.jpg`,
    localWebpPath: `images/${cleanSlug}.webp`,
    width: targetWidth,
    height: targetHeight,
    photographer: "Unsplash Contributor",
    photographerUrl: "https://unsplash.com",
    sourceUrl: pickedUrl,
    source: "Curated",
    id: `curated-${tradeCategory}-${slotKey}-${index}`,
  };
}
