import {
  LocationEntity,
  ServiceEntity,
  RankLocalBusinessProfile,
} from "./types";
import { WebsiteFormData } from "../generator/prompt";

/**
 * Normalizes city/state string like "Beaverton, OR" or "Portland Oregon" or "Dallas"
 */
export function parseCityState(input: string, fallbackState: string = "OR"): { city: string; stateCode: string; state: string } {
  const trimmed = input.trim();
  const commaMatch = trimmed.match(/^([^,]+),\s*([A-Za-z]{2})(?:\s+.*)?$/);
  if (commaMatch) {
    const city = commaMatch[1].trim();
    const st = commaMatch[2].toUpperCase();
    return { city, stateCode: st, state: st };
  }

  const spaceMatch = trimmed.match(/^(.+?)\s+([A-Za-z]{2})$/);
  if (spaceMatch) {
    const city = spaceMatch[1].trim();
    const st = spaceMatch[2].toUpperCase();
    return { city, stateCode: st, state: st };
  }

  return {
    city: trimmed,
    stateCode: fallbackState.length === 2 ? fallbackState.toUpperCase() : "US",
    state: fallbackState,
  };
}

/**
 * Converts a string into a clean URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Builds a LocationEntity from a city string and optional context
 */
export function createLocationEntity(
  cityRaw: string,
  options: {
    state?: string;
    stateCode?: string;
    county?: string;
    zipCodes?: string[];
    isPrimary?: boolean;
    neighborhoods?: string[];
    landmarks?: string[];
    surroundingCities?: string[];
    localContextNotes?: string;
  } = {}
): LocationEntity {
  const parsed = parseCityState(cityRaw, options.state || "US");
  const city = parsed.city;
  const stateCode = options.stateCode || parsed.stateCode;
  const state = options.state || parsed.state;
  const slug = `${slugify(city)}-${stateCode.toLowerCase()}`;
  const id = `loc-${slug}`;

  return {
    id,
    slug,
    city,
    state,
    stateCode,
    county: options.county,
    zipCodes: options.zipCodes || [],
    neighborhoods: options.neighborhoods || [],
    landmarks: options.landmarks || [],
    surroundingCities: options.surroundingCities || [],
    localContextNotes: options.localContextNotes,
    isPrimaryLocation: options.isPrimary ?? false,
  };
}

/**
 * Builds a ServiceEntity from a service name and trade category
 */
export function createServiceEntity(
  name: string,
  options: {
    category?: string;
    parentServiceId?: string;
    emergencyAvailable?: boolean;
    targetKeywords?: string[];
    commonProblems?: string[];
    priceRange?: string;
    deliverables?: string[];
  } = {}
): ServiceEntity {
  const slug = slugify(name);
  const id = `srv-${slug}`;

  return {
    id,
    slug,
    name,
    shortName: name,
    category: options.category || "General",
    parentServiceId: options.parentServiceId,
    emergencyAvailable: options.emergencyAvailable ?? false,
    targetKeywords: options.targetKeywords || [name.toLowerCase()],
    commonProblems: options.commonProblems || [],
    priceRange: options.priceRange,
    deliverables: options.deliverables || [],
  };
}

/**
 * Converts legacy/current WebsiteFormData into structured RankLocalBusinessProfile
 */
export function formDataToBusinessProfile(data: WebsiteFormData): RankLocalBusinessProfile {
  const primaryState = data.stateRegion || "US";
  const primaryLocation = createLocationEntity(data.city || "Headquarters", {
    state: primaryState,
    isPrimary: true,
  });

  // Parse additional locations
  const locationEntities: LocationEntity[] = [primaryLocation];
  const rawAreas = data.serviceAreasList && data.serviceAreasList.length > 0
    ? data.serviceAreasList
    : data.serviceAreas
      ? data.serviceAreas.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean)
      : [];

  const seenLocations = new Set<string>([primaryLocation.slug]);

  for (const rawArea of rawAreas) {
    const loc = createLocationEntity(rawArea, {
      state: primaryState,
      isPrimary: false,
    });
    if (!seenLocations.has(loc.slug)) {
      seenLocations.add(loc.slug);
      locationEntities.push(loc);
    }
  }

  // Parse services
  const rawServices = data.services && data.services.length > 0
    ? data.services
    : data.servicesOffered
      ? data.servicesOffered.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean)
      : ["General Service"];

  const serviceEntities: ServiceEntity[] = [];
  const seenServices = new Set<string>();

  for (const sName of rawServices) {
    const srv = createServiceEntity(sName, {
      category: data.nicheId || data.businessType || "Service",
      emergencyAvailable: Boolean(data.emergency247),
    });
    if (!seenServices.has(srv.slug)) {
      seenServices.add(srv.slug);
      serviceEntities.push(srv);
    }
  }

  const certificationsList = data.certifications
    ? data.certifications.split(/[,;\n]+/).map(c => c.trim()).filter(Boolean)
    : [];

  return {
    businessName: data.businessName || "Local Business",
    tagline: data.uniqueSellingPoints || data.businessDescription?.slice(0, 100),
    phone: data.phone || "(555) 000-0000",
    emergencyPhone: data.emergency247 ? data.phone : undefined,
    email: data.email || "",
    headquarters: {
      street: data.streetAddress,
      city: primaryLocation.city,
      state: primaryLocation.state,
      stateCode: primaryLocation.stateCode,
      zip: data.zipPostalCode,
      country: data.country || "US",
    },
    businessModel: data.businessModel || "service-area",
    nicheTrade: data.nicheId || data.businessType || "Local Contractor",
    schemaType: data.schemaType || "LocalBusiness",
    licenseNumber: data.licenseNumber,
    yearsInBusiness: data.yearsInBusiness,
    certifications: certificationsList,
    serviceRadiusMiles: 35,
    locations: locationEntities,
    services: serviceEntities,
    pricingPolicy: data.freeEstimates ? "Free Estimates & Upfront Transparent Pricing" : undefined,
    warrantyGuarantee: data.warrantyGuarantee,
  };
}

/**
 * Converts a structured RankLocalBusinessProfile back into partial WebsiteFormData
 * for backward compatibility with existing components and templates
 */
export function businessProfileToFormData(profile: RankLocalBusinessProfile): Partial<WebsiteFormData> {
  const primaryLoc = profile.locations.find(l => l.isPrimaryLocation) || profile.locations[0];
  const serviceAreaNames = profile.locations
    .filter(l => !l.isPrimaryLocation)
    .map(l => `${l.city}, ${l.stateCode}`);

  return {
    businessName: profile.businessName,
    businessType: profile.nicheTrade,
    businessModel: profile.businessModel === "storefront" ? "storefront" : "service-area",
    phone: profile.phone,
    email: profile.email,
    streetAddress: profile.headquarters.street,
    city: primaryLoc ? primaryLoc.city : profile.headquarters.city,
    stateRegion: primaryLoc ? primaryLoc.stateCode : profile.headquarters.state,
    zipPostalCode: profile.headquarters.zip,
    country: profile.headquarters.country,
    serviceAreas: serviceAreaNames.join(", "),
    serviceAreasList: serviceAreaNames,
    services: profile.services.map(s => s.name),
    servicesOffered: profile.services.map(s => s.name).join(", "),
    schemaType: profile.schemaType,
    licenseNumber: profile.licenseNumber,
    yearsInBusiness: String(profile.yearsInBusiness || ""),
    warrantyGuarantee: profile.warrantyGuarantee,
    emergency247: profile.services.some(s => s.emergencyAvailable) || Boolean(profile.emergencyPhone),
  };
}
