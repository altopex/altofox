/**
 * Local Trade-Specific SVG Fallback Graphic Generator (RankLocal)
 * 
 * Provides guaranteed, lightweight, zero-network visual assets for every trade
 * and image slot (hero, service, about, gallery).
 * 
 * When external CDN images are blocked, offline, or fail, these SVGs display
 * beautifully and crisply at any screen resolution without broken image icons
 * or layout shift.
 */

import { detectTradeCategory } from "./photo-service";

export interface TradeSvgOptions {
  trade: string;
  slot?: "hero" | "service" | "about" | "gallery" | "avatar" | "trust";
  title?: string;
  location?: string;
  width?: number;
  height?: number;
  primaryColor?: string;
  accentColor?: string;
}

interface TradeTheme {
  name: string;
  gradientStart: string;
  gradientEnd: string;
  accentColor: string;
  iconPath: string;
  badgeText: string;
}

const TRADE_THEMES: Record<string, TradeTheme> = {
  plumber: {
    name: "Plumbing & Drain Specialists",
    gradientStart: "#0F172A",
    gradientEnd: "#0284C7",
    accentColor: "#38BDF8",
    badgeText: "Master Certified • 24/7 Priority Dispatch",
    iconPath: `
      <path d="M18 7C14.5 12 11 15.5 11 20C11 23.866 14.134 27 18 27C21.866 27 25 23.866 25 20C25 15.5 21.5 12 18 7Z" fill="currentColor"/>
      <path d="M15.5 19.5C15.5 17.5 17 15.5 18 14C19 15.5 20.5 17.5 20.5 19.5C20.5 20.88 19.38 22 18 22C16.62 22 15.5 20.88 15.5 19.5Z" fill="#FFFFFF"/>
      <path d="M8 29H28" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    `,
  },
  electrician: {
    name: "Electrical Systems & Wiring",
    gradientStart: "#0F172A",
    gradientEnd: "#D97706",
    accentColor: "#FBBF24",
    badgeText: "Licensed Electricians • Code Compliant",
    iconPath: `
      <polygon points="19 3 7 15 15 15 13 27 25 13 17 13 19 3" fill="currentColor" stroke="#FFFFFF" stroke-width="1.5"/>
    `,
  },
  hvac: {
    name: "Heating, Cooling & Air Quality",
    gradientStart: "#0F172A",
    gradientEnd: "#2563EB",
    accentColor: "#60A5FA",
    badgeText: "Climate Control • High-Efficiency Systems",
    iconPath: `
      <path d="M18 8V28M8 18H28M11 11L25 25M25 11L11 25" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="18" cy="18" r="4" fill="currentColor"/>
      <circle cx="18" cy="18" r="2" fill="#FFFFFF"/>
    `,
  },
  roofing: {
    name: "Roofing & Exterior Protection",
    gradientStart: "#0F172A",
    gradientEnd: "#B45309",
    accentColor: "#F59E0B",
    badgeText: "Architectural Grade • Weatherproof Craftsmanship",
    iconPath: `
      <path d="M5 18L18 6L31 18H27V28H9V18H5Z" fill="currentColor" stroke="#FFFFFF" stroke-width="1.5"/>
      <path d="M14 28V20H22V28" fill="#FFFFFF"/>
    `,
  },
  tree: {
    name: "Tree Care & Arborist Services",
    gradientStart: "#064E3B",
    gradientEnd: "#059669",
    accentColor: "#34D399",
    badgeText: "Certified Arborists • Safe Emergency Removal",
    iconPath: `
      <path d="M18 4L9 16H14L7 24H15V30H21V24H29L22 16H27L18 4Z" fill="currentColor" stroke="#FFFFFF" stroke-width="1.5"/>
    `,
  },
  landscaping: {
    name: "Landscaping & Grounds Care",
    gradientStart: "#064E3B",
    gradientEnd: "#15803D",
    accentColor: "#4ADE80",
    badgeText: "Complete Grounds Maintenance & Design",
    iconPath: `
      <path d="M12 28C12 28 8 20 8 14C8 8 14 4 18 4C22 4 28 8 28 14C28 20 24 28 24 28H12Z" fill="currentColor"/>
      <path d="M18 4V28" stroke="#FFFFFF" stroke-width="2"/>
    `,
  },
  cleaning: {
    name: "Professional Cleaning Specialists",
    gradientStart: "#0F172A",
    gradientEnd: "#0D9488",
    accentColor: "#2DD4BF",
    badgeText: "Deep Sanitization & Routine Maintenance",
    iconPath: `
      <path d="M18 4L20 12L28 14L20 16L18 24L16 16L8 14L16 12L18 4Z" fill="currentColor"/>
      <circle cx="27" cy="8" r="3" fill="#FFFFFF"/>
    `,
  },
  auto: {
    name: "Automotive Repair & Diagnostics",
    gradientStart: "#0F172A",
    gradientEnd: "#DC2626",
    accentColor: "#F87171",
    badgeText: "Certified Technicians • OEM Standards",
    iconPath: `
      <path d="M6 18L10 8H26L30 18H6Z" fill="currentColor"/>
      <circle cx="11" cy="22" r="3" fill="#FFFFFF"/>
      <circle cx="25" cy="22" r="3" fill="#FFFFFF"/>
    `,
  },
  general: {
    name: "Professional Local Craftsmanship",
    gradientStart: "#0F172A",
    gradientEnd: "#4F46E5",
    accentColor: "#818CF8",
    badgeText: "Licensed & Insured • Guaranteed Workmanship",
    iconPath: `
      <rect x="7" y="7" width="22" height="22" rx="4" fill="currentColor"/>
      <path d="M14 18L17 21L23 13" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    `,
  },
};

function escapeXml(unsafe: string): string {
  return (unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Generates an SVG string tailored to the trade, slot, and dimensions
 */
export function generateTradeSvg(options: TradeSvgOptions): string {
  const category = detectTradeCategory(options.trade || "");
  const theme = TRADE_THEMES[category] || TRADE_THEMES.general;

  const width = options.width || (options.slot === "hero" ? 1200 : 800);
  const height = options.height || (options.slot === "hero" ? 600 : 533);
  const title = escapeXml(options.title || theme.name);
  const location = escapeXml(options.location || "Local Community");
  const badge = escapeXml(theme.badgeText);
  const isHero = options.slot === "hero";

  const gradStart = options.primaryColor || theme.gradientStart;
  const gradEnd = options.accentColor || theme.gradientEnd;
  const accent = theme.accentColor;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${title}">
  <defs>
    <linearGradient id="tradeGrad-${category}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${gradStart}"/>
      <stop offset="50%" stop-color="${gradStart}"/>
      <stop offset="100%" stop-color="${gradEnd}"/>
    </linearGradient>
    <radialGradient id="glow-${category}" cx="75%" cy="35%" r="65%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.35"/>
      <stop offset="60%" stop-color="${accent}" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="${gradStart}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid-${category}" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
    </pattern>
  </defs>

  <!-- Background Base -->
  <rect width="100%" height="100%" fill="url(#tradeGrad-${category})"/>
  <rect width="100%" height="100%" fill="url(#glow-${category})"/>
  <rect width="100%" height="100%" fill="url(#grid-${category})"/>

  <!-- Subtle Decorative Geometric Geometry -->
  <circle cx="${width * 0.82}" cy="${height * 0.4}" r="${Math.min(width, height) * 0.42}" fill="none" stroke="${accent}" stroke-opacity="0.12" stroke-width="2"/>
  <circle cx="${width * 0.82}" cy="${height * 0.4}" r="${Math.min(width, height) * 0.28}" fill="none" stroke="${accent}" stroke-opacity="0.18" stroke-dasharray="8 6" stroke-width="1.5"/>

  <!-- Center Trade Emblem Visual -->
  <g transform="translate(${width * 0.72}, ${height * 0.28}) scale(${isHero ? 2.4 : 1.8})" color="${accent}">
    <rect width="36" height="36" rx="8" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
    ${theme.iconPath}
  </g>

  <!-- Content Card Overlay -->
  <g transform="translate(${isHero ? 80 : 40}, ${height * 0.42})">
    <!-- Verified Badge -->
    <rect x="0" y="0" width="${Math.min(badge.length * 7.5 + 24, width * 0.6)}" height="26" rx="13" fill="rgba(255,255,255,0.12)" stroke="${accent}" stroke-width="1"/>
    <text x="12" y="17" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="${accent}" letter-spacing="0.5">
      ★ ${badge}
    </text>

    <!-- Headline -->
    <text x="0" y="60" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${isHero ? 32 : 24}" font-weight="800" fill="#FFFFFF">
      ${title.length > 40 ? title.slice(0, 38) + "…" : title}
    </text>

    <!-- Location & Assurance Subtext -->
    <text x="0" y="${isHero ? 96 : 88}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${isHero ? 16 : 14}" font-weight="500" fill="rgba(255,255,255,0.85)">
      Serving ${location} • Upfront Pricing • Verified Guarantee
    </text>
  </g>
</svg>`;
}

/**
 * Encodes the SVG into a high-efficiency data URI for zero-network inline fallback
 */
export function generateTradeSvgDataUri(options: TradeSvgOptions): string {
  const svg = generateTradeSvg(options);
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, "%27")
    .replace(/"/g, "%22");
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

/**
 * Returns binary Buffer of the trade SVG for local bundle storage in images/
 */
export function generateTradeSvgBuffer(options: TradeSvgOptions): Buffer {
  const svg = generateTradeSvg(options);
  return Buffer.from(svg, "utf-8");
}
