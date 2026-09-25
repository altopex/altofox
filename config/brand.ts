/**
 * Central Brand Configuration for RankLocal
 * 
 * Single source of truth for all branding, URLs, emails, logos, and SEO metadata.
 * Update values here to propagate brand changes across the entire application.
 */

const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ranklocal.site";
const normalizedSiteUrl = rawSiteUrl.endsWith("/") ? rawSiteUrl.slice(0, -1) : rawSiteUrl;

export const BRAND = {
  // Brand identity
  name: "RankLocal",
  legalName: "RankLocal Studio",
  domain: "ranklocal.site",
  siteUrl: normalizedSiteUrl,
  tagline: "AI Static Website Builder for Local Service Businesses",
  subtagline: "High-ranking local service websites with multi-location SEO, Schema.org markup, and zero WordPress bloat.",
  supportEmail: "support@ranklocal.site",
  adminEmail: "support@ranklocal.site",

  // Visual Assets
  logos: {
    light: "/brand/logo-light.svg",
    dark: "/brand/logo-dark.svg",
    icon: "/brand/icon.svg",
    ogImage: "/brand/og-image.png",
    faviconIco: "/favicon.ico",
    favicon16: "/favicon-16x16.png",
    favicon32: "/favicon-32x32.png",
    appleTouchIcon: "/apple-touch-icon.png",
  },

  // Color Palette Tokens
  colors: {
    primary: "#4F46E5", // Indigo 600
    primaryLight: "#6366F1", // Indigo 500
    primaryDark: "#3730A3", // Indigo 900
    accent: "#06B6D4", // Cyan 500
    rankGreen: "#10B981", // Emerald 500
    backgroundDark: "#0B0F19",
    backgroundSlate: "#0F172A",
  },

  // Social & Community Links
  social: {
    twitter: "https://twitter.com/ranklocalsite",
    twitterHandle: "@ranklocalsite",
    github: "https://github.com/altopex/altofox",
    linkedin: "https://linkedin.com/company/ranklocal",
  },

  // SEO & OpenGraph Defaults
  seo: {
    title: "RankLocal — Premium AI Static Website Builder for Local SEO",
    titleTemplate: "%s | RankLocal",
    description:
      "Generate blazing-fast, 100% static HTML websites engineered to dominate local search. 20 trade niche packs, multi-suburb location pages, Schema.org markup, and Google Search Console optimization.",
    keywords: [
      "AI website builder",
      "RankLocal",
      "local SEO website generator",
      "contractor website builder",
      "home services web design",
      "Schema.org local business markup",
      "multi location pages generator",
      "static HTML website builder",
    ],
  },

  // Utility to generate absolute URLs with fallback
  getAbsoluteUrl(path: string = ""): string {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${normalizedSiteUrl}${cleanPath}`;
  },
} as const;

export type BrandConfig = typeof BRAND;
export default BRAND;
