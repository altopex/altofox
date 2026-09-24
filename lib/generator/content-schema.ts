import { z } from "zod";

export interface ImageSlotJSON {
  slot?: string;
  query?: string;
  alt?: string;
}

export interface SectionJSON {
  type: string;
  variant?: string;
  content?: Record<string, any>;
  images?: ImageSlotJSON[];
}

export interface PageSeoJSON {
  title: string;
  description: string;
  h1: string;
  primaryKeyword?: string;
  ogDescription?: string;
}

export interface PageContentJSON {
  slug: string;
  seo: PageSeoJSON;
  sections?: SectionJSON[];
}

export interface SiteNavJSON {
  label: string;
  slug: string;
  children?: { label: string; slug: string }[];
}

export interface SiteInfoJSON {
  businessName: string;
  tagline?: string;
  phone: string;
  email?: string;
  address?: {
    street?: string;
    city: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  hours?: string[];
  serviceAreas?: string[];
  social?: Record<string, string>;
  nav: SiteNavJSON[];
}

export interface SchemaOrgInfoJSON {
  type: string;
  priceRange?: string;
}

export interface SiteContentJSON {
  site: SiteInfoJSON;
  pages: PageContentJSON[];
  schema?: SchemaOrgInfoJSON;
}

export const ImageSlotSchema = z.object({
  slot: z.string().optional().default("main"),
  query: z.string().optional().default("professional service"),
  alt: z.string().optional().default("Service photo"),
});

export const SectionSchema = z.object({
  type: z.string().min(1),
  variant: z.string().optional().default("default"),
  content: z.record(z.any()).optional().default({}),
  images: z.array(ImageSlotSchema).optional().default([]),
});

export const PageSeoSchema = z.object({
  title: z.string().default("Local Services"),
  description: z.string().default("Professional, reliable local services with 24/7 emergency dispatch."),
  h1: z.string().default("Trusted Local Services"),
  primaryKeyword: z.string().optional().default("local service"),
  ogDescription: z.string().optional().default("Licensed, guaranteed local service with upfront pricing."),
});

export const PageContentSchema = z.object({
  slug: z.string().min(1),
  seo: PageSeoSchema.default({
    title: "Local Services",
    description: "Professional, reliable local services.",
    h1: "Trusted Local Services",
  }),
  sections: z.array(SectionSchema).optional().default([]),
});

export const SiteNavSchema = z.object({
  label: z.string().default("Home"),
  slug: z.string().default("index"),
  children: z.array(z.object({ label: z.string(), slug: z.string() })).optional(),
});

export const SiteInfoSchema = z.object({
  businessName: z.string().default("Local Business"),
  tagline: z.string().optional().default("Professional & Reliable Local Services"),
  phone: z.string().default("(555) 000-0000"),
  email: z.string().optional().default(""),
  address: z
    .object({
      street: z.string().optional().default(""),
      city: z.string().default("Local City"),
      state: z.string().optional().default(""),
      zip: z.string().optional().default(""),
      country: z.string().optional().default("USA"),
    })
    .optional()
    .default({ city: "Local City" }),
  hours: z.array(z.string()).optional().default(["Mon - Sun: 24/7 Emergency Service"]),
  serviceAreas: z.array(z.string()).optional().default([]),
  social: z.record(z.string()).optional().default({}),
  nav: z.array(SiteNavSchema).default([]),
});

export const SchemaOrgInfoSchema = z.object({
  type: z.string().default("LocalBusiness"),
  priceRange: z.string().optional().default("$$"),
});

export const SiteContentJSONSchema = z.object({
  site: SiteInfoSchema,
  pages: z.array(PageContentSchema).min(1),
  schema: SchemaOrgInfoSchema.optional().default({ type: "LocalBusiness", priceRange: "$$" }),
});

/**
 * Validates raw JSON from AI or applies robust fallback defaults
 */
export function validateContentJSON(data: unknown): SiteContentJSON {
  const result = SiteContentJSONSchema.safeParse(data);
  if (result.success) {
    return result.data as SiteContentJSON;
  }
  console.warn("[Validation] Partial schema mismatch, applying sanitized fallbacks:", result.error);

  if (typeof data === "object" && data !== null) {
    const raw = data as Record<string, any>;
    return {
      site: SiteInfoSchema.parse(raw.site || {}),
      pages: Array.isArray(raw.pages) && raw.pages.length > 0
        ? raw.pages.map((p) => PageContentSchema.parse(p))
        : [
            {
              slug: "index",
              seo: PageSeoSchema.parse({}),
              sections: [],
            },
          ],
      schema: SchemaOrgInfoSchema.parse(raw.schema || {}),
    } as SiteContentJSON;
  }

  throw new Error("Invalid content JSON structure returned by AI.");
}
