/**
 * Geo utilities for AltoFox Service Area & Location Engine
 * Includes Haversine distance, compass directions, and SimpleMaps attribution.
 *
 * Attribution:
 * City geographic data provided by SimpleMaps (US Cities Basic) under CC BY 4.0:
 * https://simplemaps.com/data/us-cities
 */

export interface CityData {
  id: string; // e.g. "dallas-tx"
  city: string; // e.g. "Dallas"
  stateId: string; // e.g. "TX"
  stateName: string; // e.g. "Texas"
  county: string; // e.g. "Dallas"
  lat: number;
  lng: number;
  population: number;
  zips: string[];
}

export interface CityWithDistance extends CityData {
  distanceMiles: number;
  direction: string; // e.g. "southwest"
  formattedOffset: string; // e.g. "12 miles southwest"
}

export const SIMPLEMAPS_ATTRIBUTION = {
  name: "SimpleMaps US Cities Basic",
  url: "https://simplemaps.com/data/us-cities",
  license: "CC BY 4.0",
  attributionText: "Geographic city data provided by SimpleMaps under Creative Commons Attribution 4.0 license.",
};

/**
 * Great-circle distance between two lat/lng coordinates in statute miles.
 */
export function haversineDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Calculate human-readable compass direction from point 1 to point 2 (e.g. "southwest", "north").
 */
export function calculateCompassDirection(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLon);
  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  brng = (brng + 360) % 360;

  const directions = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"];
  const index = Math.round(brng / 45) % 8;
  return directions[index];
}

/**
 * Format relative offset string e.g. "14 miles north" or "Local business hub" if within 1 mile.
 */
export function formatDistanceAndDirection(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): { distance: number; direction: string; formatted: string } {
  const distance = haversineDistanceMiles(originLat, originLng, destLat, destLng);
  if (distance <= 1.0) {
    return {
      distance,
      direction: "central",
      formatted: "Central business location",
    };
  }
  const direction = calculateCompassDirection(originLat, originLng, destLat, destLng);
  return {
    distance,
    direction,
    formatted: `${distance} miles ${direction}`,
  };
}
