import { z } from "zod";

/**
 * Structured Location Entity representing a physical market or service area.
 * Decouples geographic and demographic realities from marketing text.
 */
export interface LocationEntity {
  id: string;                      // e.g. "loc-portland-or"
  slug: string;                    // e.g. "portland-or"
  city: string;                    // e.g. "Portland"
  state: string;                   // e.g. "Oregon"
  stateCode: string;               // e.g. "OR"
  county?: string;                 // e.g. "Multnomah County"
  zipCodes?: string[];             // e.g. ["97201", "97202", "97205"]
  coordinates?: {
    lat: number;
    lng: number;
  };
  neighborhoods?: string[];        // e.g. ["Pearl District", "Hawthorne", "St. Johns"]
  landmarks?: string[];            // e.g. ["Pioneer Courthouse Square", "Forest Park"]
  surroundingCities?: string[];    // e.g. ["Beaverton", "Gresham", "Lake Oswego"]
  localContextNotes?: string;      // e.g. "High rainfall, older cast-iron residential plumbing common in historic homes"
  isPrimaryLocation?: boolean;     // Headquarters or main office location
}

/**
 * Structured Service Entity representing a distinct trade capability or offering.
 * Organized hierarchically (Parent service vs specialized sub-service).
 */
export interface ServiceEntity {
  id: string;                      // e.g. "srv-water-heater-repair"
  slug: string;                    // e.g. "water-heater-repair"
  name: string;                    // e.g. "Water Heater Repair & Replacement"
  shortName?: string;              // e.g. "Water Heater Repair"
  category?: string;               // e.g. "Plumbing"
  parentServiceId?: string;        // ID of parent service (e.g. "srv-residential-plumbing")
  subServiceIds?: string[];        // Child service IDs
  commonProblems?: string[];       // e.g. ["No hot water", "Leaking tank", "Rumbling sounds", "Pilot light failure"]
  emergencyAvailable?: boolean;    // Offered as 24/7 emergency service
  targetKeywords?: string[];       // e.g. ["water heater repair", "hot water tank replacement", "tankless water heater fix"]
  priceRange?: string;             // e.g. "$150 - $1,800" or "$$"
  schemaServiceType?: string;      // Schema.org category or Service type
  deliverables?: string[];         // What customer receives (e.g. ["Full inspection", "Code compliance check", "1-yr labor warranty"])
}

/**
 * Business NAP (Name, Address, Phone) & Brand Identity
 */
export interface BusinessHeadquarters {
  street?: string;
  city: string;
  state: string;
  stateCode?: string;
  zip?: string;
  country?: string;
}

/**
 * Comprehensive Local SEO Business Profile for Rank Local
 */
export interface RankLocalBusinessProfile {
  businessName: string;
  legalName?: string;
  tagline?: string;
  phone: string;
  emergencyPhone?: string;
  email?: string;
  headquarters: BusinessHeadquarters;
  businessModel: "storefront" | "service-area" | "hybrid";
  nicheTrade: string;              // e.g. "Plumbing", "Roofing", "HVAC", "Pest Control"
  schemaType: string;              // e.g. "Plumber", "RoofingContractor", "HVACBusiness", "Electrician"
  licenseNumber?: string;
  yearsInBusiness?: string | number;
  certifications?: string[];
  serviceRadiusMiles?: number;
  locations: LocationEntity[];
  services: ServiceEntity[];
  pricingPolicy?: string;          // e.g. "Upfront flat-rate pricing before work starts"
  warrantyGuarantee?: string;      // e.g. "100% satisfaction guarantee with 2-year warranty on parts & labor"
}

// Zod Validation Schemas
export const LocationEntitySchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  stateCode: z.string().min(2).max(4),
  county: z.string().optional(),
  zipCodes: z.array(z.string()).optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  neighborhoods: z.array(z.string()).optional(),
  landmarks: z.array(z.string()).optional(),
  surroundingCities: z.array(z.string()).optional(),
  localContextNotes: z.string().optional(),
  isPrimaryLocation: z.boolean().optional(),
});

export const ServiceEntitySchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  shortName: z.string().optional(),
  category: z.string().optional(),
  parentServiceId: z.string().optional(),
  subServiceIds: z.array(z.string()).optional(),
  commonProblems: z.array(z.string()).optional(),
  emergencyAvailable: z.boolean().optional(),
  targetKeywords: z.array(z.string()).optional(),
  priceRange: z.string().optional(),
  schemaServiceType: z.string().optional(),
  deliverables: z.array(z.string()).optional(),
});

export const RankLocalBusinessProfileSchema = z.object({
  businessName: z.string().min(1),
  legalName: z.string().optional(),
  tagline: z.string().optional(),
  phone: z.string().min(1),
  emergencyPhone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  headquarters: z.object({
    street: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    stateCode: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional().default("US"),
  }),
  businessModel: z.enum(["storefront", "service-area", "hybrid"]).default("service-area"),
  nicheTrade: z.string().min(1),
  schemaType: z.string().min(1).default("LocalBusiness"),
  licenseNumber: z.string().optional(),
  yearsInBusiness: z.union([z.string(), z.number()]).optional(),
  certifications: z.array(z.string()).optional(),
  serviceRadiusMiles: z.number().optional().default(30),
  locations: z.array(LocationEntitySchema).default([]),
  services: z.array(ServiceEntitySchema).default([]),
  pricingPolicy: z.string().optional(),
  warrantyGuarantee: z.string().optional(),
});
