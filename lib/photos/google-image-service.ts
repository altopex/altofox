/**
 * Google Custom Search JSON API — Image Search Provider (RankLocal)
 * 
 * Fetches relevant, live web photography directly via Google Image Search API.
 * Follows the zero-download / zero-storage philosophy:
 * Image URLs are placed directly in generated static HTML:
 *   <img src="IMAGE_URL" alt="Emergency leak detection in Houston Texas">
 * No local disk downloading or database bloat required.
 */

export interface GoogleImageItem {
  url: string;
  alt: string;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
  contextUrl?: string;
  title?: string;
}

export interface GoogleImageSearchOptions {
  num?: number;
  timeoutMs?: number;
  siteSearch?: string;
}

/**
 * Builds the canonical search query following RankLocal's local SEO pattern:
 * e.g. Business: Texas Leak Detection, Location: Houston, TX, Keyword: emergency leak detection
 * → "emergency leak detection Houston Texas"
 */
export function buildGoogleImageQuery(context: {
  businessName?: string;
  location?: string;
  keyword?: string;
  service?: string;
  city?: string;
  state?: string;
  stateCode?: string;
}): string {
  const parts: string[] = [];

  // 1. Primary Keyword / Service Intent
  const keyword = (context.keyword || context.service || "").trim();
  if (keyword) {
    parts.push(keyword);
  }

  // 2. Parse City & State from explicit fields or location string
  let city = (context.city || "").trim();
  let state = (context.state || context.stateCode || "").trim();

  if ((!city || !state) && context.location) {
    const locParts = context.location.split(",").map((s) => s.trim());
    if (locParts.length >= 2) {
      if (!city) city = locParts[0];
      if (!state) state = locParts[1];
    } else if (!city) {
      city = context.location.trim();
    }
  }

  // 3. Add City if not already present
  if (city && !keyword.toLowerCase().includes(city.toLowerCase())) {
    parts.push(city);
  }
  // Expand common 2-letter codes or clean punctuation
  if (state.length === 2) {
    const STATE_NAMES: Record<string, string> = {
      TX: "Texas",
      CA: "California",
      FL: "Florida",
      NY: "New York",
      IL: "Illinois",
      PA: "Pennsylvania",
      OH: "Ohio",
      GA: "Georgia",
      NC: "North Carolina",
      MI: "Michigan",
      NJ: "New Jersey",
      VA: "Virginia",
      WA: "Washington",
      AZ: "Arizona",
      MA: "Massachusetts",
      TN: "Tennessee",
      IN: "Indiana",
      MO: "Missouri",
      MD: "Maryland",
      WI: "Wisconsin",
      CO: "Colorado",
      MN: "Minnesota",
      SC: "South Carolina",
      AL: "Alabama",
      LA: "Louisiana",
      KY: "Kentucky",
      OR: "Oregon",
      OK: "Oklahoma",
      CT: "Connecticut",
      UT: "Utah",
      NV: "Nevada",
    };
    state = STATE_NAMES[state.toUpperCase()] || state;
  }

  if (state && !parts.some((p) => p.toLowerCase().includes(state.toLowerCase()))) {
    parts.push(state);
  }

  // 4. Fallback if location string was passed raw (e.g. "Houston, TX")
  if (parts.length <= 1 && context.location) {
    const cleanLoc = context.location.replace(/,/g, " ").replace(/\s+/g, " ").trim();
    if (cleanLoc && !parts.join(" ").toLowerCase().includes(cleanLoc.toLowerCase())) {
      parts.push(cleanLoc);
    }
  }

  const query = parts
    .join(" ")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return query || "local contractor service";
}

/**
 * Searches Google Custom Search API for relevant image results.
 * Endpoint: https://customsearch.googleapis.com/customsearch/v1
 */
export async function searchGoogleImages(
  query: string,
  apiKey: string,
  cx: string,
  options: GoogleImageSearchOptions = {}
): Promise<GoogleImageItem[]> {
  const cleanKey = (apiKey || "").trim();
  const cleanCx = (cx || "").trim();

  if (!cleanKey || !cleanCx) {
    return [];
  }

  const num = Math.min(Math.max(options.num || 5, 1), 10);
  const timeoutMs = options.timeoutMs || 4000;

  const url = new URL("https://customsearch.googleapis.com/customsearch/v1");
  url.searchParams.set("key", cleanKey);
  url.searchParams.set("cx", cleanCx);
  url.searchParams.set("searchType", "image");
  url.searchParams.set("q", query);
  url.searchParams.set("num", String(num));
  url.searchParams.set("safe", "active");

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    clearTimeout(timer);

    if (!res.ok) {
      console.warn(`[GoogleImageSearch] HTTP ${res.status} from Google API: ${await res.text().catch(() => "")}`);
      return [];
    }

    const data = await res.json();
    const items = data.items || [];

    return items
      .filter((item: any) => item && item.link && typeof item.link === "string" && !item.link.includes(".svg"))
      .map((item: any): GoogleImageItem => ({
        url: item.link,
        alt: item.title || query,
        width: item.image?.width,
        height: item.image?.height,
        thumbnailUrl: item.image?.thumbnailLink,
        contextUrl: item.image?.contextLink,
        title: item.title,
      }));
  } catch (err: any) {
    console.warn(`[GoogleImageSearch] Error searching images for "${query}": ${err?.message}`);
    return [];
  }
}
