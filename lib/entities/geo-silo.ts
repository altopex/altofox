import { LocationEntity } from "./types";

/**
 * Calculates straight-line distance in statute miles between two coordinate pairs using Haversine formula
 */
export function calculateDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8; // Earth's radius in statute miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Groups locations by their county (or "General Region" if county is undefined)
 */
export function groupLocationsByCounty(locations: LocationEntity[]): Map<string, LocationEntity[]> {
  const countyMap = new Map<string, LocationEntity[]>();

  for (const loc of locations) {
    const key = loc.county?.trim() || `${loc.stateCode || loc.state} Metro Area`;
    const list = countyMap.get(key) || [];
    list.push(loc);
    countyMap.set(key, list);
  }

  return countyMap;
}

/**
 * Finds the top N nearest or most geographically relevant neighbor locations for a target city
 * Used for building smart sibling internal links ("We also serve nearby...")
 */
export function findNearbyLocations(
  target: LocationEntity,
  allLocations: LocationEntity[],
  maxCount: number = 4
): LocationEntity[] {
  // Exclude self
  const candidates = allLocations.filter((l) => l.id !== target.id);
  if (candidates.length <= maxCount) {
    return candidates;
  }

  // Strategy 1: If coordinates exist on target and candidate, calculate actual distance
  if (target.coordinates && target.coordinates.lat && target.coordinates.lng) {
    const withDistances = candidates.map((loc) => {
      let distance = Infinity;
      if (loc.coordinates && loc.coordinates.lat && loc.coordinates.lng) {
        distance = calculateDistanceMiles(
          target.coordinates!.lat,
          target.coordinates!.lng,
          loc.coordinates.lat,
          loc.coordinates.lng
        );
      }
      return { loc, distance };
    });

    const sortedByDistance = withDistances
      .filter((item) => Number.isFinite(item.distance))
      .sort((a, b) => a.distance - b.distance);

    if (sortedByDistance.length >= maxCount) {
      return sortedByDistance.slice(0, maxCount).map((item) => item.loc);
    }
  }

  // Strategy 2: Check surroundingCities explicit list
  if (target.surroundingCities && target.surroundingCities.length > 0) {
    const surroundingNames = new Set(target.surroundingCities.map((c) => c.toLowerCase().trim()));
    const explicitMatches = candidates.filter((loc) => surroundingNames.has(loc.city.toLowerCase().trim()));

    if (explicitMatches.length >= maxCount) {
      return explicitMatches.slice(0, maxCount);
    }
  }

  // Strategy 3: Check same county
  if (target.county) {
    const sameCounty = candidates.filter((loc) => loc.county?.toLowerCase() === target.county?.toLowerCase());
    if (sameCounty.length > 0) {
      if (sameCounty.length >= maxCount) {
        return sameCounty.slice(0, maxCount);
      }
      // Combine same county + other candidates to fill maxCount
      const remaining = candidates.filter((c) => !sameCounty.includes(c));
      return [...sameCounty, ...remaining].slice(0, maxCount);
    }
  }

  // Strategy 4: Sibling slicing (adjacent elements)
  return candidates.slice(0, maxCount);
}

export interface GeoSiloCountyNode {
  countyName: string;
  cities: LocationEntity[];
  totalPopulationOrCoverage?: number;
}

export interface GeoSiloHierarchy {
  state: string;
  counties: GeoSiloCountyNode[];
}

/**
 * Organizes a flat list of locations into a clean Geo-Silo Hierarchy
 */
export function buildGeoSiloHierarchy(locations: LocationEntity[]): GeoSiloHierarchy[] {
  // Group by State first
  const stateMap = new Map<string, LocationEntity[]>();
  for (const loc of locations) {
    const stateKey = loc.stateCode || loc.state || "US";
    const list = stateMap.get(stateKey) || [];
    list.push(loc);
    stateMap.set(stateKey, list);
  }

  const results: GeoSiloHierarchy[] = [];

  for (const [state, locs] of stateMap.entries()) {
    const countyMap = groupLocationsByCounty(locs);
    const counties: GeoSiloCountyNode[] = [];

    for (const [countyName, cities] of countyMap.entries()) {
      counties.push({
        countyName,
        cities,
      });
    }

    results.push({
      state,
      counties,
    });
  }

  return results;
}
