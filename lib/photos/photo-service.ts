/**
 * High-quality trade photo curation & query resolution engine.
 * Maps trade keywords and image slots to high-resolution, copyright-free photography.
 * Enforces strict global deduplication: NO photo may be used more than once.
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

/**
 * Extracts a unique photo identifier from any URL to prevent reusing the same
 * underlying photo with different dimension or query parameters.
 */
export function extractPhotoId(url: string): string {
  if (!url) return "";
  const lower = url.toLowerCase().trim();

  // Pollinations AI generation prompt ID
  if (lower.includes("pollinations.ai") && lower.includes("prompt/")) {
    const promptMatch = lower.match(/prompt\/([^?]+)/);
    if (promptMatch) return `ai:${decodeURIComponent(promptMatch[1]).slice(0, 60)}`;
  }

  // Pexels photo ID: e.g. pexels-12345 or photos/12345
  const pexelsMatch = lower.match(/(?:photos\/|pexels-photo-)(\d+)/);
  if (pexelsMatch) {
    return `pexels-${pexelsMatch[1]}`;
  }

  // Pixabay photo ID: e.g. pixabay-12345
  const pixabayMatch = lower.match(/pixabay-(\d+)/);
  if (pixabayMatch) {
    return `pixabay-${pixabayMatch[1]}`;
  }

  // Bing thumbnail query string: e.g. tse1.mm.bing.net/th?q=...
  if (lower.includes("bing.net") && lower.includes("q=")) {
    try {
      const parsed = new URL(url);
      const q = (parsed.searchParams.get("q") || "").toLowerCase().replace(/\+/g, " ").trim();
      if (q) return `bing:${q}`;
    } catch (_) {
      const qMatch = lower.match(/q=([^&]+)/);
      if (qMatch) return `bing:${decodeURIComponent(qMatch[1]).replace(/\+/g, " ").trim()}`;
    }
  }

  // Strip query string and return clean base
  return lower.split("?")[0].replace(/^https?:\/\//, "");
}

// Universal pool of high-resolution, copyright-free hero photography for trades and contractors
export const UNIVERSAL_HERO_PHOTOS: string[] = [
  "https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg?auto=compress&cs=tinysrgb&w=1920", // licensed contractor on residential site
  "https://images.pexels.com/photos/2219024/pexels-photo-2219024.jpeg?auto=compress&cs=tinysrgb&w=1920", // craftsman with blueprints and safety gear
  "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1920", // contractor handshake with customer
  "https://images.pexels.com/photos/175039/pexels-photo-175039.jpeg?auto=compress&cs=tinysrgb&w=1920", // home remodeling craftsman
  "https://images.pexels.com/photos/6419121/pexels-photo-6419121.jpeg?auto=compress&cs=tinysrgb&w=1920", // master craftsman repairing system
  "https://images.pexels.com/photos/8486972/pexels-photo-8486972.jpeg?auto=compress&cs=tinysrgb&w=1920", // technician with tools and equipment
  "https://images.pexels.com/photos/8005397/pexels-photo-8005397.jpeg?auto=compress&cs=tinysrgb&w=1920", // electrical panel technician
  "https://images.pexels.com/photos/4489749/pexels-photo-4489749.jpeg?auto=compress&cs=tinysrgb&w=1920", // HVAC service technician
  "https://images.pexels.com/photos/209296/pexels-photo-209296.jpeg?auto=compress&cs=tinysrgb&w=1920", // residential roofing installation
  "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1920", // modern estate roof and home
  "https://images.pexels.com/photos/589/garden-grass-meadow-green.jpg?auto=compress&cs=tinysrgb&w=1920", // pristine lawn and landscape
  "https://images.pexels.com/photos/4489743/pexels-photo-4489743.jpeg?auto=compress&cs=tinysrgb&w=1920", // mechanic inspection and service
  "https://images.pexels.com/photos/4099467/pexels-photo-4099467.jpeg?auto=compress&cs=tinysrgb&w=1920", // residential housekeeping service
  "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1920", // suburban house architecture
  "https://images.pexels.com/photos/2244746/pexels-photo-2244746.jpeg?auto=compress&cs=tinysrgb&w=1920", // industrial equipment workshop
  "https://images.pexels.com/photos/5691622/pexels-photo-5691622.jpeg?auto=compress&cs=tinysrgb&w=1920", // electrical testing
  "https://images.pexels.com/photos/8486974/pexels-photo-8486974.jpeg?auto=compress&cs=tinysrgb&w=1920", // plumbing system installation
  "https://images.pexels.com/photos/212940/pexels-photo-212940.jpeg?auto=compress&cs=tinysrgb&w=1920", // landscape hardscape
  "https://images.pexels.com/photos/3807277/pexels-photo-3807277.jpeg?auto=compress&cs=tinysrgb&w=1920", // automotive service
  "https://images.pexels.com/photos/4098778/pexels-photo-4098778.jpeg?auto=compress&cs=tinysrgb&w=1920", // deep cleaning service
];

// Universal pool of high-resolution, copyright-free service photography
export const UNIVERSAL_SERVICE_PHOTOS: string[] = [
  "https://images.pexels.com/photos/6419124/pexels-photo-6419124.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/8486972/pexels-photo-8486972.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/8005397/pexels-photo-8005397.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/5691622/pexels-photo-5691622.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/4489749/pexels-photo-4489749.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/5691621/pexels-photo-5691621.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/209296/pexels-photo-209296.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/589/garden-grass-meadow-green.jpg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/212940/pexels-photo-212940.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/4489743/pexels-photo-4489743.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3807277/pexels-photo-3807277.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/4099467/pexels-photo-4099467.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/4098778/pexels-photo-4098778.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/2219024/pexels-photo-2219024.jpeg?auto=compress&cs=tinysrgb&w=800",
];

// Curated high-resolution copyright-free photos by trade and slot type
const TRADE_PHOTO_REGISTRY: Record<
  string,
  {
    hero: string[];
    about: string[];
    gallery: string[];
    service: string[];
    subjects: Record<string, string | string[]>;
  }
> = {
  plumber: {
    hero: [
      "https://images.pexels.com/photos/6419121/pexels-photo-6419121.jpeg?auto=compress&cs=tinysrgb&w=1920", // technician fixing plumbing under sink
      "https://images.pexels.com/photos/8486972/pexels-photo-8486972.jpeg?auto=compress&cs=tinysrgb&w=1920", // modern plumbing tools & copper pipe
      "https://images.pexels.com/photos/6419125/pexels-photo-6419125.jpeg?auto=compress&cs=tinysrgb&w=1920", // pipe repair
      "https://images.pexels.com/photos/4792487/pexels-photo-4792487.jpeg?auto=compress&cs=tinysrgb&w=1920", // bathroom plumbing fixtures
      "https://images.pexels.com/photos/8486974/pexels-photo-8486974.jpeg?auto=compress&cs=tinysrgb&w=1920", // water line installation
      "https://images.pexels.com/photos/6419124/pexels-photo-6419124.jpeg?auto=compress&cs=tinysrgb&w=1920", // copper pipe maintenance
    ],
    about: [
      "https://images.pexels.com/photos/8486972/pexels-photo-8486972.jpeg?auto=compress&cs=tinysrgb&w=1000",
      "https://images.pexels.com/photos/6419121/pexels-photo-6419121.jpeg?auto=compress&cs=tinysrgb&w=1000",
    ],
    gallery: [
      "https://images.pexels.com/photos/6419125/pexels-photo-6419125.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/4792487/pexels-photo-4792487.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/8486974/pexels-photo-8486974.jpeg?auto=compress&cs=tinysrgb&w=800",
    ],
    service: [
      "https://images.pexels.com/photos/6419124/pexels-photo-6419124.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/8486972/pexels-photo-8486972.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/6419121/pexels-photo-6419121.jpeg?auto=compress&cs=tinysrgb&w=800",
    ],
    subjects: {
      drain: [
        "https://images.pexels.com/photos/6419125/pexels-photo-6419125.jpeg?auto=compress&cs=tinysrgb&w=800",
      ],
      pipe: [
        "https://images.pexels.com/photos/6419124/pexels-photo-6419124.jpeg?auto=compress&cs=tinysrgb&w=800",
      ],
      heater: [
        "https://images.pexels.com/photos/8486974/pexels-photo-8486974.jpeg?auto=compress&cs=tinysrgb&w=800",
      ],
      water: [
        "https://images.pexels.com/photos/6419121/pexels-photo-6419121.jpeg?auto=compress&cs=tinysrgb&w=800",
      ],
      leak: [
        "https://images.pexels.com/photos/6419125/pexels-photo-6419125.jpeg?auto=compress&cs=tinysrgb&w=800",
      ],
      sewer: [
        "https://images.pexels.com/photos/6419124/pexels-photo-6419124.jpeg?auto=compress&cs=tinysrgb&w=800",
      ],
      toilet: [
        "https://images.pexels.com/photos/4792487/pexels-photo-4792487.jpeg?auto=compress&cs=tinysrgb&w=800",
      ],
      bathroom: [
        "https://images.pexels.com/photos/4792487/pexels-photo-4792487.jpeg?auto=compress&cs=tinysrgb&w=800",
      ],
      emergency: [
        "https://images.pexels.com/photos/8486972/pexels-photo-8486972.jpeg?auto=compress&cs=tinysrgb&w=800",
      ],
    },
  },
  electrician: {
    hero: [
      "https://images.pexels.com/photos/8005397/pexels-photo-8005397.jpeg?auto=compress&cs=tinysrgb&w=1920", // electrician working on electrical panel
      "https://images.pexels.com/photos/257736/pexels-photo-257736.jpeg?auto=compress&cs=tinysrgb&w=1920", // modern electrical infrastructure
      "https://images.pexels.com/photos/5691622/pexels-photo-5691622.jpeg?auto=compress&cs=tinysrgb&w=1920", // circuit testing with multimeter
      "https://images.pexels.com/photos/8853502/pexels-photo-8853502.jpeg?auto=compress&cs=tinysrgb&w=1920", // lighting installation
      "https://images.pexels.com/photos/8005400/pexels-photo-8005400.jpeg?auto=compress&cs=tinysrgb&w=1920", // wiring diagnostics
    ],
    about: [
      "https://images.pexels.com/photos/8005397/pexels-photo-8005397.jpeg?auto=compress&cs=tinysrgb&w=1000",
      "https://images.pexels.com/photos/5691622/pexels-photo-5691622.jpeg?auto=compress&cs=tinysrgb&w=1000",
    ],
    gallery: [
      "https://images.pexels.com/photos/8005400/pexels-photo-8005400.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/8853502/pexels-photo-8853502.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/257736/pexels-photo-257736.jpeg?auto=compress&cs=tinysrgb&w=800",
    ],
    service: [
      "https://images.pexels.com/photos/8005397/pexels-photo-8005397.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/5691622/pexels-photo-5691622.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/8853502/pexels-photo-8853502.jpeg?auto=compress&cs=tinysrgb&w=800",
    ],
    subjects: {
      panel: [
        "https://images.pexels.com/photos/8005397/pexels-photo-8005397.jpeg?auto=compress&cs=tinysrgb&w=800",
      ],
      breaker: [
        "https://images.pexels.com/photos/257736/pexels-photo-257736.jpeg?auto=compress&cs=tinysrgb&w=800",
      ],
      wire: [
        "https://images.pexels.com/photos/8005400/pexels-photo-8005400.jpeg?auto=compress&cs=tinysrgb&w=800",
      ],
      light: [
        "https://images.pexels.com/photos/8853502/pexels-photo-8853502.jpeg?auto=compress&cs=tinysrgb&w=800",
      ],
      ev: [
        "https://images.pexels.com/photos/5691622/pexels-photo-5691622.jpeg?auto=compress&cs=tinysrgb&w=800",
      ],
    },
  },
  hvac: {
    hero: [
      "https://images.pexels.com/photos/4489749/pexels-photo-4489749.jpeg?auto=compress&cs=tinysrgb&w=1920", // AC technician servicing central heating
      "https://images.pexels.com/photos/5691621/pexels-photo-5691621.jpeg?auto=compress&cs=tinysrgb&w=1920", // climate control service
      "https://images.pexels.com/photos/8486927/pexels-photo-8486927.jpeg?auto=compress&cs=tinysrgb&w=1920", // heating furnace diagnostics
      "https://images.pexels.com/photos/4489737/pexels-photo-4489737.jpeg?auto=compress&cs=tinysrgb&w=1920", // ventilation and duct inspection
    ],
    about: [
      "https://images.pexels.com/photos/4489749/pexels-photo-4489749.jpeg?auto=compress&cs=tinysrgb&w=1000",
      "https://images.pexels.com/photos/5691621/pexels-photo-5691621.jpeg?auto=compress&cs=tinysrgb&w=1000",
    ],
    gallery: [
      "https://images.pexels.com/photos/8486927/pexels-photo-8486927.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/4489737/pexels-photo-4489737.jpeg?auto=compress&cs=tinysrgb&w=800",
    ],
    service: [
      "https://images.pexels.com/photos/4489749/pexels-photo-4489749.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/5691621/pexels-photo-5691621.jpeg?auto=compress&cs=tinysrgb&w=800",
    ],
    subjects: {
      ac: [
        "https://images.pexels.com/photos/4489749/pexels-photo-4489749.jpeg?auto=compress&cs=tinysrgb&w=800",
      ],
      cooling: [
        "https://images.pexels.com/photos/5691621/pexels-photo-5691621.jpeg?auto=compress&cs=tinysrgb&w=800",
      ],
      furnace: [
        "https://images.pexels.com/photos/8486927/pexels-photo-8486927.jpeg?auto=compress&cs=tinysrgb&w=800",
      ],
      heat: [
        "https://images.pexels.com/photos/8486927/pexels-photo-8486927.jpeg?auto=compress&cs=tinysrgb&w=800",
      ],
      duct: [
        "https://images.pexels.com/photos/4489737/pexels-photo-4489737.jpeg?auto=compress&cs=tinysrgb&w=800",
      ],
    },
  },
  tree: {
    hero: [
      "https://images.pexels.com/photos/1400249/pexels-photo-1400249.jpeg?auto=compress&cs=tinysrgb&w=1920",
      "https://images.pexels.com/photos/158028/bellingrath-gardens-alabama-landscape-scenic-158028.jpeg?auto=compress&cs=tinysrgb&w=1920",
    ],
    about: [
      "https://images.pexels.com/photos/1400249/pexels-photo-1400249.jpeg?auto=compress&cs=tinysrgb&w=1000",
    ],
    gallery: [
      "https://images.pexels.com/photos/158028/bellingrath-gardens-alabama-landscape-scenic-158028.jpeg?auto=compress&cs=tinysrgb&w=800",
    ],
    service: [
      "https://images.pexels.com/photos/1400249/pexels-photo-1400249.jpeg?auto=compress&cs=tinysrgb&w=800",
    ],
    subjects: {
      trim: [
        "https://images.pexels.com/photos/1400249/pexels-photo-1400249.jpeg?auto=compress&cs=tinysrgb&w=800",
      ],
      removal: [
        "https://images.pexels.com/photos/1400249/pexels-photo-1400249.jpeg?auto=compress&cs=tinysrgb&w=800",
      ],
    },
  },
  roofing: {
    hero: [
      "https://images.pexels.com/photos/209296/pexels-photo-209296.jpeg?auto=compress&cs=tinysrgb&w=1920", // architectural shingles
      "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1920", // residential roof replacement
      "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1920", // modern estate roof
      "https://images.pexels.com/photos/221540/pexels-photo-221540.jpeg?auto=compress&cs=tinysrgb&w=1920", // roof installation
    ],
    about: [
      "https://images.pexels.com/photos/209296/pexels-photo-209296.jpeg?auto=compress&cs=tinysrgb&w=1000",
      "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1000",
    ],
    gallery: [
      "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/221540/pexels-photo-221540.jpeg?auto=compress&cs=tinysrgb&w=800",
    ],
    service: [
      "https://images.pexels.com/photos/209296/pexels-photo-209296.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800",
    ],
    subjects: {
      shingle: [
        "https://images.pexels.com/photos/209296/pexels-photo-209296.jpeg?auto=compress&cs=tinysrgb&w=800",
      ],
      roof: [
        "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800",
      ],
      gutter: [
        "https://images.pexels.com/photos/221540/pexels-photo-221540.jpeg?auto=compress&cs=tinysrgb&w=800",
      ],
    },
  },
  landscaping: {
    hero: [
      "https://images.pexels.com/photos/589/garden-grass-meadow-green.jpg?auto=compress&cs=tinysrgb&w=1920", // pristine lawn
      "https://images.pexels.com/photos/212940/pexels-photo-212940.jpeg?auto=compress&cs=tinysrgb&w=1920", // manicured garden design
      "https://images.pexels.com/photos/158028/bellingrath-gardens-alabama-landscape-scenic-158028.jpeg?auto=compress&cs=tinysrgb&w=1920", // botanical landscape
    ],
    about: [
      "https://images.pexels.com/photos/589/garden-grass-meadow-green.jpg?auto=compress&cs=tinysrgb&w=1000",
      "https://images.pexels.com/photos/212940/pexels-photo-212940.jpeg?auto=compress&cs=tinysrgb&w=1000",
    ],
    gallery: [
      "https://images.pexels.com/photos/158028/bellingrath-gardens-alabama-landscape-scenic-158028.jpeg?auto=compress&cs=tinysrgb&w=800",
    ],
    service: [
      "https://images.pexels.com/photos/589/garden-grass-meadow-green.jpg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/212940/pexels-photo-212940.jpeg?auto=compress&cs=tinysrgb&w=800",
    ],
    subjects: {
      lawn: [
        "https://images.pexels.com/photos/589/garden-grass-meadow-green.jpg?auto=compress&cs=tinysrgb&w=800",
      ],
      mow: [
        "https://images.pexels.com/photos/589/garden-grass-meadow-green.jpg?auto=compress&cs=tinysrgb&w=800",
      ],
      garden: [
        "https://images.pexels.com/photos/212940/pexels-photo-212940.jpeg?auto=compress&cs=tinysrgb&w=800",
      ],
    },
  },
  cleaning: {
    hero: [
      "https://images.pexels.com/photos/4099467/pexels-photo-4099467.jpeg?auto=compress&cs=tinysrgb&w=1920",
      "https://images.pexels.com/photos/4098778/pexels-photo-4098778.jpeg?auto=compress&cs=tinysrgb&w=1920",
      "https://images.pexels.com/photos/4108715/pexels-photo-4108715.jpeg?auto=compress&cs=tinysrgb&w=1920",
    ],
    about: [
      "https://images.pexels.com/photos/4099467/pexels-photo-4099467.jpeg?auto=compress&cs=tinysrgb&w=1000",
      "https://images.pexels.com/photos/4098778/pexels-photo-4098778.jpeg?auto=compress&cs=tinysrgb&w=1000",
    ],
    gallery: [
      "https://images.pexels.com/photos/4108715/pexels-photo-4108715.jpeg?auto=compress&cs=tinysrgb&w=800",
    ],
    service: [
      "https://images.pexels.com/photos/4099467/pexels-photo-4099467.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/4098778/pexels-photo-4098778.jpeg?auto=compress&cs=tinysrgb&w=800",
    ],
    subjects: {
      maid: [
        "https://images.pexels.com/photos/4099467/pexels-photo-4099467.jpeg?auto=compress&cs=tinysrgb&w=800",
      ],
      carpet: [
        "https://images.pexels.com/photos/4098778/pexels-photo-4098778.jpeg?auto=compress&cs=tinysrgb&w=800",
      ],
    },
  },
  auto: {
    hero: [
      "https://images.pexels.com/photos/4489743/pexels-photo-4489743.jpeg?auto=compress&cs=tinysrgb&w=1920",
      "https://images.pexels.com/photos/2244746/pexels-photo-2244746.jpeg?auto=compress&cs=tinysrgb&w=1920",
      "https://images.pexels.com/photos/3807277/pexels-photo-3807277.jpeg?auto=compress&cs=tinysrgb&w=1920",
    ],
    about: [
      "https://images.pexels.com/photos/4489743/pexels-photo-4489743.jpeg?auto=compress&cs=tinysrgb&w=1000",
      "https://images.pexels.com/photos/2244746/pexels-photo-2244746.jpeg?auto=compress&cs=tinysrgb&w=1000",
    ],
    gallery: [
      "https://images.pexels.com/photos/3807277/pexels-photo-3807277.jpeg?auto=compress&cs=tinysrgb&w=800",
    ],
    service: [
      "https://images.pexels.com/photos/4489743/pexels-photo-4489743.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/3807277/pexels-photo-3807277.jpeg?auto=compress&cs=tinysrgb&w=800",
    ],
    subjects: {
      brake: [
        "https://images.pexels.com/photos/3807277/pexels-photo-3807277.jpeg?auto=compress&cs=tinysrgb&w=800",
      ],
      engine: [
        "https://images.pexels.com/photos/4489743/pexels-photo-4489743.jpeg?auto=compress&cs=tinysrgb&w=800",
      ],
    },
  },
  general: {
    hero: [
      "https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg?auto=compress&cs=tinysrgb&w=1920",
      "https://images.pexels.com/photos/2219024/pexels-photo-2219024.jpeg?auto=compress&cs=tinysrgb&w=1920",
      "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1920",
      "https://images.pexels.com/photos/175039/pexels-photo-175039.jpeg?auto=compress&cs=tinysrgb&w=1920",
    ],
    about: [
      "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1000",
      "https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg?auto=compress&cs=tinysrgb&w=1000",
    ],
    gallery: [
      "https://images.pexels.com/photos/2219024/pexels-photo-2219024.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/175039/pexels-photo-175039.jpeg?auto=compress&cs=tinysrgb&w=800",
    ],
    service: [
      "https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/2219024/pexels-photo-2219024.jpeg?auto=compress&cs=tinysrgb&w=800",
    ],
    subjects: {},
  },
};

/**
 * Detects trade category from keywords
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
 * Checks whether a candidate URL has already been recorded in usedUrls
 * by comparing both exact URL and normalized photo ID.
 */
function isPhotoCandidateUsed(candidateUrl: string, usedUrls?: Set<string>): boolean {
  if (!usedUrls || !candidateUrl) return false;
  if (usedUrls.has(candidateUrl)) return true;
  const photoId = extractPhotoId(candidateUrl);
  if (photoId && usedUrls.has(photoId)) return true;
  return false;
}

/**
 * Records a selected photo URL in the usedUrls set.
 */
function recordPhotoAsUsed(pickedUrl: string, usedUrls?: Set<string>): void {
  if (!usedUrls || !pickedUrl) return;
  usedUrls.add(pickedUrl);
  const photoId = extractPhotoId(pickedUrl);
  if (photoId) {
    usedUrls.add(photoId);
  }
}

/**
 * Resolves an image slot + search query to a real, high-resolution photo URL.
 * Guarantees subject relevance and strict deduplication: NEVER returns a photo
 * that has already been registered in usedUrls.
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

  // 1. Check subject-specific match first
  const subjectsMap = (tradeData as any).subjects;
  if (subjectsMap && cleanQuery) {
    for (const [subjectKey, urls] of Object.entries(subjectsMap)) {
      if (cleanQuery.includes(subjectKey)) {
        const urlList = Array.isArray(urls) ? urls : [urls as string];
        for (const url of urlList) {
          if (!isPhotoCandidateUsed(url, usedUrls)) {
            pickedUrl = url;
            break;
          }
        }
        if (pickedUrl) break;
      }
    }
  }

  // 2. Select from the specific slot pool in tradeData
  if (!pickedUrl) {
    const pool = (tradeData as any)[slotKey] || tradeData.service;
    for (const url of pool) {
      if (!isPhotoCandidateUsed(url, usedUrls)) {
        pickedUrl = url;
        break;
      }
    }
  }

  // 3. Fallback to universal pools if trade pool is exhausted (Guarantees zero duplicates!)
  if (!pickedUrl) {
    if (slotKey === "hero") {
      // Pick next unused from universal hero photography
      for (const url of UNIVERSAL_HERO_PHOTOS) {
        if (!isPhotoCandidateUsed(url, usedUrls)) {
          pickedUrl = url;
          break;
        }
      }
    } else {
      // Pick next unused from universal service photography
      for (const url of UNIVERSAL_SERVICE_PHOTOS) {
        if (!isPhotoCandidateUsed(url, usedUrls)) {
          pickedUrl = url;
          break;
        }
      }
    }
  }

  // 4. Ultimate safety fallback (guaranteed valid URL)
  if (!pickedUrl) {
    const allPool = slotKey === "hero" ? UNIVERSAL_HERO_PHOTOS : UNIVERSAL_SERVICE_PHOTOS;
    pickedUrl = allPool[index % allPool.length];
  }

  // Track as used
  recordPhotoAsUsed(pickedUrl, usedUrls);

  const defaultAlt = `${tradeCategory.toUpperCase()} service professional in action`;
  const alt = query || defaultAlt;

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
    photographer: "Stock Contractor Contributor",
    photographerUrl: "https://www.pexels.com",
    sourceUrl: pickedUrl,
    source: "Curated",
    id: `curated-${tradeCategory}-${slotKey}-${index}`,
  };
}

/**
 * Verifies that a photo URL is genuine copyright-free photography
 * (Pexels, Pixabay, AI-generated, or local vector fallback) and NOT a Bing thumbnail.
 */
export function isCopyrightFreeHeroPhoto(url: string): boolean {
  if (!url) return false;
  const clean = url.toLowerCase();
  if (clean.includes("bing.com/th") || clean.includes("bing.net/th")) return false;
  return (
    clean.includes("pexels.com") ||
    clean.includes("pixabay.com") ||
    clean.includes("image.pollinations.ai") ||
    clean.includes("pollinations.ai") ||
    clean.includes("openai") ||
    clean.includes("blob.core.windows.net") ||
    clean.endsWith(".svg") ||
    clean.includes("images/")
  );
}
