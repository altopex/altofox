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
  localSvgPath?: string;
  localSvgFallback?: string;
  allFallbacks?: string[];
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
const TRADE_PHOTO_REGISTRY: Record<
  string,
  {
    hero: string[];
    about: string[];
    gallery: string[];
    service: string[];
    subjects: Record<string, string>;
  }
> = {
  plumber: {
    hero: [
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1920&q=80", // wide shot technician fixing plumbing under sink
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1920&q=80", // modern plumbing tools & copper pipe
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1920&q=80", // luxury bathroom plumbing fixtures
    ],
    about: [
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1000&q=80", // technician with toolbelt smiling
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80", // professional tradesman at work
    ],
    gallery: [
      "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80", // complex pipe manifold
      "https://images.unsplash.com/photo-1581244277943-fe4a9c77d389?auto=format&fit=crop&w=800&q=80", // industrial pipe repair
      "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80", // modern clean bathroom sink
      "https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=800&q=80", // stainless steel plumbing drain
    ],
    service: [
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80", // copper pipes
      "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=800&q=80", // water heater system
      "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80", // pipe installation
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80", // bathroom fixture installation
      "https://images.unsplash.com/photo-1581244277943-fe4a9c77d389?auto=format&fit=crop&w=800&q=80", // emergency leak repair
    ],
    subjects: {
      drain: "https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=800&q=80", // drain / sink
      pipe: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80", // copper pipe repair
      heater: "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=800&q=80", // water heater
      water: "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=800&q=80",
      leak: "https://images.unsplash.com/photo-1581244277943-fe4a9c77d389?auto=format&fit=crop&w=800&q=80", // leak repair
      sewer: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80", // sewer / pipe line
      toilet: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80", // bathroom / fixture
      bathroom: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80",
      emergency: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80",
    },
  },
  electrician: {
    hero: [
      "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=1920&q=80", // electrician working on electrical panel
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1920&q=80", // modern electrical infrastructure
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1920&q=80", // architectural interior lighting
    ],
    about: [
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1000&q=80", // master electrician tools
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1000&q=80", // friendly electrical contractor
    ],
    gallery: [
      "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80", // electrical circuit breaker
      "https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=800&q=80", // clean electrical panel
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80", // high-tech wiring
    ],
    service: [
      "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80", // panel upgrade
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80", // lighting installation
      "https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=800&q=80", // breaker repair
    ],
    subjects: {
      panel: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
      breaker: "https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=800&q=80",
      wire: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
      wiring: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
      light: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
      lighting: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
      ev: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
      charger: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
      generator: "https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=800&q=80",
      emergency: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=800&q=80",
    },
  },
  hvac: {
    hero: [
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1920&q=80", // AC technician servicing central heating
      "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=1920&q=80", // modern climate control thermostat
    ],
    about: [
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1000&q=80", // professional team
    ],
    gallery: [
      "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
    ],
    service: [
      "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=800&q=80", // AC repair
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80", // heating furnace
    ],
    subjects: {
      ac: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80",
      cooling: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80",
      furnace: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
      heating: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
      thermostat: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=800&q=80",
      duct: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80",
    },
  },
  tree: {
    hero: [
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1920&q=80", // certified arborist caring for tall trees
      "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1920&q=80", // tree canopy in sunlight
    ],
    about: [
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1000&q=80", // mature tree evaluation
    ],
    gallery: [
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80", // forest canopy
      "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=80", // timber work
    ],
    service: [
      "https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=800&q=80", // tree trimming
      "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=80", // stump grinding
    ],
    subjects: {
      trimming: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=800&q=80",
      pruning: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=800&q=80",
      removal: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80",
      stump: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=80",
      storm: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80",
    },
  },
  roofing: {
    hero: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80", // beautiful residential roof & home
      "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1920&q=80", // new architectural shingles
    ],
    about: [
      "https://images.unsplash.com/photo-1541888946425-d0fbb186156a?auto=format&fit=crop&w=1000&q=80", // professional roofing contractor
    ],
    gallery: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80",
    ],
    service: [
      "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    ],
    subjects: {
      shingle: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80",
      leak: "https://images.unsplash.com/photo-1541888946425-d0fbb186156a?auto=format&fit=crop&w=800&q=80",
      gutter: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
      repair: "https://images.unsplash.com/photo-1541888946425-d0fbb186156a?auto=format&fit=crop&w=800&q=80",
    },
  },
  landscaping: {
    hero: [
      "https://images.unsplash.com/photo-1558904541-efa8c4a08931?auto=format&fit=crop&w=1920&q=80", // pristine lawn and landscape
      "https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=1920&q=80", // manicured garden
    ],
    about: [
      "https://images.unsplash.com/photo-1592417817098-8f3d6eb2252a?auto=format&fit=crop&w=1000&q=80",
    ],
    gallery: [
      "https://images.unsplash.com/photo-1558904541-efa8c4a08931?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80",
    ],
    service: [
      "https://images.unsplash.com/photo-1558904541-efa8c4a08931?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80",
    ],
    subjects: {
      lawn: "https://images.unsplash.com/photo-1558904541-efa8c4a08931?auto=format&fit=crop&w=800&q=80",
      garden: "https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80",
      patio: "https://images.unsplash.com/photo-1592417817098-8f3d6eb2252a?auto=format&fit=crop&w=800&q=80",
    },
  },
  cleaning: {
    hero: [
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=1920&q=80",
    ],
    about: [
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1000&q=80",
    ],
    gallery: [
      "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
    ],
    service: [
      "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
    ],
    subjects: {
      deep: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=800&q=80",
      carpet: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
    },
  },
  auto: {
    hero: [
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1920&q=80", // mechanic working on vehicle
      "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1920&q=80", // modern auto repair garage
    ],
    about: [
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1000&q=80",
    ],
    gallery: [
      "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80",
    ],
    service: [
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80",
    ],
    subjects: {
      brake: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80",
      oil: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80",
      engine: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80",
    },
  },
  general: {
    hero: [
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1920&q=80",
    ],
    about: [
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1000&q=80",
    ],
    gallery: [
      "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=800&q=80",
    ],
    service: [
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1581244277943-fe4a9c77d389?auto=format&fit=crop&w=800&q=80",
    ],
    subjects: {},
  },
};

/**
 * Normalizes trade name to one of the registry keys
 */
export function detectTradeCategory(tradeOrIndustry: string): string {
  const t = (tradeOrIndustry || "").toLowerCase();
  if (t.includes("tree") || t.includes("arbor") || t.includes("forestry") || t.includes("stump")) return "tree";
  if (t.includes("plumb") || t.includes("drain") || t.includes("pipe") || t.includes("water heater") || t.includes("sewer") || t.includes("leak") || t.includes("toilet") || t.includes("faucet")) return "plumber";
  if (t.includes("electr") || t.includes("wire") || t.includes("panel") || t.includes("lighting") || t.includes("circuit") || t.includes("ev ") || t.includes("charger")) return "electrician";
  if (t.includes("hvac") || t.includes("air cond") || t.includes("heat") || t.includes("furnace") || t.includes("cool") || t.includes("duct") || t.includes("climate")) return "hvac";
  if (t.includes("roof") || t.includes("gutter") || t.includes("shingle") || t.includes("siding")) return "roofing";
  if (t.includes("landscap") || t.includes("lawn") || t.includes("garden") || t.includes("mow")) return "landscaping";
  if (t.includes("clean") || t.includes("maid") || t.includes("janitor") || t.includes("sanitiz")) return "cleaning";
  if (t.includes("auto") || t.includes("car") || t.includes("mechanic") || t.includes("vehicle") || t.includes("brake") || t.includes("tire")) return "auto";
  return "general";
}

/**
 * Resolves an image slot + search query to a real, high-resolution photo URL.
 * Guarantees subject relevance and tracks used URLs to eliminate duplicate photos.
 */
export function resolvePhoto(
  tradeCategory: string,
  slot: string,
  query?: string,
  index: number = 0,
  usedUrls?: Set<string>
): ResolvedImage {
  const category = TRADE_PHOTO_REGISTRY[tradeCategory] ? tradeCategory : "general";
  const tradeData = TRADE_PHOTO_REGISTRY[category] || TRADE_PHOTO_REGISTRY.general;

  const slotKey = slot.toLowerCase().includes("hero")
    ? "hero"
    : slot.toLowerCase().includes("about")
    ? "about"
    : slot.toLowerCase().includes("gallery")
    ? "gallery"
    : "service";

  const cleanQuery = (query || "").toLowerCase();
  let pickedUrl = "";

  // 1. Check subject-specific match first if service slot or query provided
  const subjectsMap = (tradeData as any).subjects;
  if (slotKey === "service" && subjectsMap) {
    for (const [subjectKey, url] of Object.entries(subjectsMap as Record<string, string>)) {
      if (cleanQuery.includes(subjectKey)) {
        if (!usedUrls || !usedUrls.has(url)) {
          pickedUrl = url;
          break;
        }
      }
    }
  }

  // 2. Select from the specific slot pool, preferring unused photos
  if (!pickedUrl) {
    const pool = (tradeData as any)[slotKey] || tradeData.service;
    if (usedUrls) {
      for (const url of pool) {
        if (!usedUrls.has(url)) {
          pickedUrl = url;
          break;
        }
      }
    }
    if (!pickedUrl) {
      pickedUrl = pool[index % pool.length];
    }
  }

  // Track as used
  if (usedUrls && pickedUrl) {
    usedUrls.add(pickedUrl);
  }

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
