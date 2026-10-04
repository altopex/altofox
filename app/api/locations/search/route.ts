import { NextRequest, NextResponse } from "next/server";
import { US_CITIES, CityData } from "@/lib/data/us-cities";

export const dynamic = "force-dynamic";

export interface NormalizedLocationResult {
  id: string;
  city: string;
  stateId: string;
  stateName: string;
  county?: string;
  country: string;
  lat: number;
  lng: number;
  population?: number;
  displayName: string;
  source: "user_selected" | "us_dataset" | "osm";
}

// In-memory geocoding and search cache
const cache = new Map<string, { timestamp: number; results: NormalizedLocationResult[] }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

// Helper to normalize US state names to 2-letter codes
const US_STATE_MAP: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
  hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA",
  kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS", missouri: "MO",
  montana: "MT", nebraska: "NE", nevada: "NV", "new hampshire": "NH", "new jersey": "NJ",
  "new mexico": "NM", "new york": "NY", "north carolina": "NC", "north dakota": "ND",
  ohio: "OH", oklahoma: "OK", oregon: "OR", pennsylvania: "PA", "rhode island": "RI",
  "south carolina": "SC", "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT",
  vermont: "VT", virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI",
  wyoming: "WY", "district of columbia": "DC"
};

function normalizeStateCode(input: string): string {
  const clean = input.trim().toLowerCase();
  if (clean.length === 2) return clean.toUpperCase();
  return US_STATE_MAP[clean] || input.trim().toUpperCase();
}

/**
 * Searches local SimpleMaps US_CITIES index
 */
function searchLocalDataset(query: string, limit = 8): NormalizedLocationResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const matched: NormalizedLocationResult[] = [];
  for (const c of US_CITIES) {
    const cityLower = c.city.toLowerCase();
    const stateLower = c.stateId.toLowerCase();
    const stateNameLower = c.stateName.toLowerCase();
    const combo = `${cityLower}, ${stateLower}`;

    if (
      cityLower.startsWith(q) ||
      combo.startsWith(q) ||
      cityLower.includes(q) ||
      stateNameLower.startsWith(q) ||
      c.zips?.some((z) => z.startsWith(q))
    ) {
      matched.push({
        id: c.id,
        city: c.city,
        stateId: c.stateId,
        stateName: c.stateName,
        county: c.county ? `${c.county} County` : undefined,
        country: "USA",
        lat: c.lat,
        lng: c.lng,
        population: c.population,
        displayName: `${c.city}, ${c.stateId}${c.county ? ` (${c.county} County)` : ""}`,
        source: "us_dataset",
      });
      if (matched.length >= limit) break;
    }
  }

  return matched;
}

/**
 * Queries OpenStreetMap Nominatim for any US city, borough, town, or municipality
 */
async function searchOpenStreetMap(query: string, limit = 8): Promise<NormalizedLocationResult[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=us&q=${encodeURIComponent(
      query
    )}&limit=${limit}`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "RankLocal-Builder/2.0 (support@ranklocal.site)",
        Accept: "application/json",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const results: NormalizedLocationResult[] = [];
    const seen = new Set<string>();

    for (const item of data) {
      const addr = item.address || {};
      const cityName =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.borough ||
        addr.municipality ||
        addr.hamlet ||
        item.name;

      const stateRaw = addr.state || "";
      const stateId = normalizeStateCode(stateRaw);
      const county = addr.county || "";
      const lat = parseFloat(item.lat);
      const lng = parseFloat(item.lon);

      if (!cityName || !stateId || isNaN(lat) || isNaN(lng)) continue;

      const key = `${cityName.toLowerCase()}-${stateId.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);

      results.push({
        id: `${cityName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${stateId.toLowerCase()}`,
        city: cityName,
        stateId: stateId,
        stateName: stateRaw,
        county: county ? (county.toLowerCase().includes("county") ? county : `${county} County`) : undefined,
        country: "USA",
        lat,
        lng,
        displayName: `${cityName}, ${stateId}${county ? ` (${county})` : ""}`,
        source: "osm",
      });
    }

    return results;
  } catch (err) {
    console.warn("[Location Search API] OpenStreetMap query failed:", (err as any)?.message);
    return [];
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const rawQ = searchParams.get("q") || "";
  const cityParam = searchParams.get("city") || "";
  const stateParam = searchParams.get("state") || "";
  const geocodeOnly = searchParams.get("geocode") === "true";

  const query = (rawQ || `${cityParam} ${stateParam}`).trim();

  if (!query) {
    return NextResponse.json({ success: true, results: [] });
  }

  const cacheKey = query.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({ success: true, results: cached.results });
  }

  // 1. Try local dataset first
  let results = searchLocalDataset(query, geocodeOnly ? 1 : 8);

  // 2. If not found in static 154 cities, query OpenStreetMap
  if (results.length === 0 || (!geocodeOnly && results.length < 3)) {
    const osmResults = await searchOpenStreetMap(query, 8);
    // Combine results prioritizing local dataset, deduplicating by city+state
    const seen = new Set(results.map((r) => `${r.city.toLowerCase()}-${r.stateId.toLowerCase()}`));
    for (const osm of osmResults) {
      const key = `${osm.city.toLowerCase()}-${osm.stateId.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push(osm);
      }
    }
  }

  // Cache results
  cache.set(cacheKey, { timestamp: Date.now(), results });

  return NextResponse.json({
    success: true,
    query,
    count: results.length,
    results,
  });
}
