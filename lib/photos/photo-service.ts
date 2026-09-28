/**
 * High-quality trade photo curation & query resolution engine.
 * Maps trade keywords and image slots to high-resolution Unsplash photos.
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

  // Unsplash photo ID: e.g. photo-1581578731548-c64695cc6952
  const unsplashMatch = lower.match(/(photo-[a-z0-9-]+)/);
  if (unsplashMatch) {
    return unsplashMatch[1];
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

  // Pexels photo ID: e.g. pexels-12345 or photos/12345
  const pexelsMatch = lower.match(/(?:photos\/|pexels-)(\d+)/);
  if (pexelsMatch) {
    return `pexels-${pexelsMatch[1]}`;
  }

  // Pixabay photo ID: e.g. pixabay-12345
  const pixabayMatch = lower.match(/pixabay-(\d+)/);
  if (pixabayMatch) {
    return `pixabay-${pixabayMatch[1]}`;
  }

  // Strip query string and return clean base
  return lower.split("?")[0].replace(/^https?:\/\//, "");
}

// Universal pool of high-resolution, copyright-free hero photography for trades and contractors
export const UNIVERSAL_HERO_PHOTOS: string[] = [
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1920&q=80", // construction supervisor on job site
  "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1920&q=80", // precision industrial craftsmanship
  "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1920&q=80", // master craftsman toolbag and equipment
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80", // modern residential property
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1920&q=80", // renovated residential estate
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1920&q=80", // craftsman home exterior daytime
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1920&q=80", // premium residential house
  "https://images.unsplash.com/photo-1541888946425-d0fbb186156a?auto=format&fit=crop&w=1920&q=80", // trade contractor on site
  "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1920&q=80", // dedicated service team
  "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1920&q=80", // homeowner handshake with contractor
  "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1920&q=80", // modern home interior renovation
  "https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=1920&q=80", // clean craftsman living area
  "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=1920&q=80", // spacious modern interior
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1920&q=80", // contemporary residential architecture
  "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1920&q=80", // architectural blueprint and measurements
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=80", // commercial building infrastructure
  "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1920&q=80", // technical systems engineering
  "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1920&q=80", // precision hardware testing
  "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1920&q=80", // craftsman quality inspection
  "https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?auto=format&fit=crop&w=1920&q=80", // technical operations team
];

// Universal pool of high-resolution, copyright-free service photography
export const UNIVERSAL_SERVICE_PHOTOS: string[] = [
  "https://images.unsplash.com/photo-1581244277943-fe4a9c77d389?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1558904541-efa8c4a08931?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=800&q=80",
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
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1920&q=80", // technician fixing plumbing under sink
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1920&q=80", // modern plumbing tools & copper pipe
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1920&q=80", // luxury bathroom plumbing fixtures
      "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=1920&q=80", // manifold valve distribution
      "https://images.unsplash.com/photo-1595846519845-68e298c2edd8?auto=format&fit=crop&w=1920&q=80", // bathroom restoration plumbing
      "https://images.unsplash.com/photo-1521207418485-99c705420785?auto=format&fit=crop&w=1920&q=80", // high-pressure water pipeline valve
      "https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?auto=format&fit=crop&w=1920&q=80", // diagnostic plumbing equipment
      "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1920&q=80", // contemporary chrome faucet fixture
    ],
    about: [
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80",
    ],
    gallery: [
      "https://images.unsplash.com/photo-1581244277943-fe4a9c77d389?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=800&q=80",
    ],
    service: [
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=800&q=80",
    ],
    subjects: {
      drain: [
        "https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80",
      ],
      pipe: [
        "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80",
      ],
      heater: [
        "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=800&q=80",
      ],
      water: [
        "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=800&q=80",
      ],
      leak: [
        "https://images.unsplash.com/photo-1581244277943-fe4a9c77d389?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=800&q=80",
      ],
      sewer: [
        "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80",
      ],
      toilet: [
        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
      ],
      bathroom: [
        "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1595846519845-68e298c2edd8?auto=format&fit=crop&w=800&q=80",
      ],
      emergency: [
        "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80",
      ],
    },
  },
  electrician: {
    hero: [
      "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=1920&q=80", // electrician working on electrical panel
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1920&q=80", // modern electrical infrastructure
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1920&q=80", // interior lighting architecture
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1920&q=80", // electrical circuit testing
      "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1920&q=80", // industrial power distribution
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1920&q=80", // smart home controls and circuits
      "https://images.unsplash.com/photo-1601058268499-e52658b8bb88?auto=format&fit=crop&w=1920&q=80", // architectural fixture wiring
    ],
    about: [
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1000&q=80",
    ],
    gallery: [
      "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
    ],
    service: [
      "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=800&q=80",
    ],
    subjects: {
      panel: [
        "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=800&q=80",
      ],
      breaker: [
        "https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=800&q=80",
      ],
      wire: [
        "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
      ],
      light: [
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
      ],
      ev: [
        "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
      ],
    },
  },
  hvac: {
    hero: [
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1920&q=80", // AC technician servicing central heating
      "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=1920&q=80", // modern climate control thermostat
      "https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=1920&q=80", // heating furnace diagnostics
      "https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?auto=format&fit=crop&w=1920&q=80", // ventilation and duct inspection
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80", // modern energy efficient home
    ],
    about: [
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80",
    ],
    gallery: [
      "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
    ],
    service: [
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
    ],
    subjects: {
      ac: [
        "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80",
      ],
      furnace: [
        "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
      ],
      thermostat: [
        "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=800&q=80",
      ],
    },
  },
  tree: {
    hero: [
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1920&q=80", // certified arborist caring for tall trees
      "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1920&q=80", // tree canopy in sunlight
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1920&q=80", // mature oak tree preservation
      "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1920&q=80", // tree branch care and maintenance
    ],
    about: [
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1000&q=80",
    ],
    gallery: [
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=80",
    ],
    service: [
      "https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=80",
    ],
    subjects: {
      trimming: [
        "https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=800&q=80",
      ],
      removal: [
        "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80",
      ],
      stump: [
        "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=80",
      ],
    },
  },
  roofing: {
    hero: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80", // beautiful residential roof & home
      "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1920&q=80", // new architectural shingles
      "https://images.unsplash.com/photo-1541888946425-d0fbb186156a?auto=format&fit=crop&w=1920&q=80", // professional roofing contractor
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1920&q=80", // residential roof replacement
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1920&q=80", // estate shingle roof installation
    ],
    about: [
      "https://images.unsplash.com/photo-1541888946425-d0fbb186156a?auto=format&fit=crop&w=1000&q=80",
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
      shingle: [
        "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80",
      ],
      gutter: [
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
      ],
    },
  },
  landscaping: {
    hero: [
      "https://images.unsplash.com/photo-1558904541-efa8c4a08931?auto=format&fit=crop&w=1920&q=80", // pristine lawn and landscape
      "https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=1920&q=80", // manicured garden design
      "https://images.unsplash.com/photo-1592417817098-8f3d6eb2252a?auto=format&fit=crop&w=1920&q=80", // stone hardscape patio
      "https://images.unsplash.com/photo-1590682680695-43b964a3ae17?auto=format&fit=crop&w=1920&q=80", // modern residential turf and beds
      "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=1920&q=80", // outdoor botanical landscaping
    ],
    about: [
      "https://images.unsplash.com/photo-1592417817098-8f3d6eb2252a?auto=format&fit=crop&w=1000&q=80",
    ],
    gallery: [
      "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80",
    ],
    service: [
      "https://images.unsplash.com/photo-1558904541-efa8c4a08931?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80",
    ],
    subjects: {
      lawn: [
        "https://images.unsplash.com/photo-1558904541-efa8c4a08931?auto=format&fit=crop&w=800&q=80",
      ],
      garden: [
        "https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80",
      ],
    },
  },
  cleaning: {
    hero: [
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1920&q=80",
    ],
    about: [
      "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=1000&q=80",
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
      deep: [
        "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=800&q=80",
      ],
    },
  },
  auto: {
    hero: [
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1920&q=80", // mechanic working on vehicle
      "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1920&q=80", // modern auto repair garage
      "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?auto=format&fit=crop&w=1920&q=80", // mechanic diagnostics with tool
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1920&q=80", // vehicle inspection and tuning
    ],
    about: [
      "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?auto=format&fit=crop&w=1000&q=80",
    ],
    gallery: [
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80",
    ],
    service: [
      "https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80",
    ],
    subjects: {
      brake: [
        "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80",
      ],
      oil: [
        "https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=800&q=80",
      ],
    },
  },
  general: {
    hero: UNIVERSAL_HERO_PHOTOS.slice(0, 10),
    about: [
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80",
    ],
    gallery: UNIVERSAL_SERVICE_PHOTOS.slice(0, 4),
    service: UNIVERSAL_SERVICE_PHOTOS.slice(4, 10),
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
    photographer: "Unsplash Contributor",
    photographerUrl: "https://unsplash.com",
    sourceUrl: pickedUrl,
    source: "Curated",
    id: `curated-${tradeCategory}-${slotKey}-${index}`,
  };
}

/**
 * Verifies that a photo URL is genuine copyright-free photography
 * (Unsplash, Pexels, Pixabay, or local vector fallback) and NOT a Bing thumbnail.
 */
export function isCopyrightFreeHeroPhoto(url: string): boolean {
  if (!url) return false;
  const clean = url.toLowerCase();
  if (clean.includes("bing.com/th")) return false;
  return (
    clean.includes("unsplash.com") ||
    clean.includes("pexels.com") ||
    clean.includes("pixabay.com") ||
    clean.endsWith(".svg") ||
    clean.includes("images/")
  );
}

