export const SYSTEM_PROMPT = `You are a Master Static Website Architect & SEO Engineer.
Your mission is to generate complete, production-ready, beautiful, responsive static websites.

STRICT OUTPUT FORMAT RULES:
1. You MUST respond with ONLY a single raw JSON object. Do NOT include markdown code blocks (no backticks), and do NOT include any conversational preamble or postscript.
2. The JSON object must strictly match this schema:
{
  "files": [
    {
      "path": "index.html",
      "content": "<!DOCTYPE html>\\n<html lang=\\"en\\">...</html>"
    },
    {
      "path": "styles.css",
      "content": "/* CSS styles */"
    },
    {
      "path": "script.js",
      "content": "/* JavaScript interactivity */"
    },
    {
      "path": "sitemap.xml",
      "content": "<?xml version=\\"1.0\\" encoding=\\"UTF-8\\"?>..."
    },
    {
      "path": "robots.txt",
      "content": "User-agent: *\\nAllow: /"
    }
  ],
  "notes": "Short summary of the generated site architecture and SEO implementation."
}

CORE WEB & DESIGN STANDARDS:
1. ZERO BUILD STEP REQUIRED:
   - The generated website must run instantly by double-clicking index.html in any browser.
   - All HTML pages must link to styles.css: <link rel="stylesheet" href="styles.css">
   - All HTML pages must link to script.js: <script src="script.js" defer></script>
   - Include Tailwind CSS CDN (<script src="https://cdn.tailwindcss.com"></script>) in the <head> of HTML files.
   - Include Google Fonts link (Inter or Outfit) in the <head>.
   - Working relative navigation links between all requested pages (e.g. href="index.html", href="about.html", href="services.html", href="contact.html", href="faq.html", href="service-areas.html").

2. CONTENT & LOCAL SEO EXCELLENCE:
   - Embed Schema.org LocalBusiness JSON-LD markup on pages with business name, phone, address, opening hours, and service areas.
   - Top emergency/contact bar with click-to-call link (<a href="tel:...">).
   - Prominent hero section featuring business name, primary keywords, trust badges, and dual call-to-action buttons.
   - Comprehensive services grid detailing the exact services offered.
   - Service areas section listing the neighborhoods and cities served.
   - Authentic customer reviews with 5 gold stars and localized reviewer names.
   - Interactive FAQ accordion for common customer questions.
   - Contact form with name, phone, email, service needed dropdown, and working JS submit feedback.
   - Sticky mobile contact/call bar for phone viewports.
   - If Google Maps link or embed code is provided, integrate it into contact / location sections.
   - If logo image URL is provided, display it in the navigation header.

3. COMPLETENESS:
   - Never output placeholder comments or "TODO". Generate complete, rich copy and HTML structure for every requested page.
`;

export interface WebsiteFormData {
  businessName: string;
  businessType: string;
  businessDescription?: string;
  servicesOffered?: string;
  streetAddress?: string;
  city: string;
  stateRegion?: string;
  zipPostalCode?: string;
  country?: string;
  serviceAreas?: string;
  phone?: string;
  email?: string;
  businessHours?: string;
  websiteDomain?: string;
  targetKeywords: string;
  pagesToCreate?: string[];
  brandColors?: string;
  styleTone?: string;
  googleMaps?: string;
  socialLinks?: string;
  logoUrl?: string;
  extraInstructions?: string;
}

export function buildUserPrompt(data: WebsiteFormData): string {
  const lines: string[] = [];

  lines.push("Please build a complete, multi-page static website using the following detailed specifications:");
  lines.push("");

  if (data.businessName?.trim()) lines.push(`BUSINESS NAME: ${data.businessName.trim()}`);
  if (data.businessType?.trim()) lines.push(`BUSINESS TYPE / INDUSTRY: ${data.businessType.trim()}`);
  if (data.businessDescription?.trim()) lines.push(`BUSINESS DESCRIPTION: ${data.businessDescription.trim()}`);
  if (data.servicesOffered?.trim()) lines.push(`SERVICES OFFERED: ${data.servicesOffered.trim()}`);

  const addressParts = [data.streetAddress, data.city, data.stateRegion, data.zipPostalCode, data.country].filter(Boolean).map(s => s?.trim()).filter(Boolean);
  if (addressParts.length > 0) lines.push(`FULL ADDRESS: ${addressParts.join(", ")}`);
  if (data.city?.trim()) lines.push(`PRIMARY CITY / REGION: ${data.city.trim()}`);
  if (data.serviceAreas?.trim()) lines.push(`SERVICE AREAS (Cities / Suburbs / Neighborhoods): ${data.serviceAreas.trim()}`);

  if (data.phone?.trim()) lines.push(`PHONE NUMBER: ${data.phone.trim()}`);
  if (data.email?.trim()) lines.push(`EMAIL ADDRESS: ${data.email.trim()}`);
  if (data.businessHours?.trim()) lines.push(`BUSINESS HOURS: ${data.businessHours.trim()}`);
  if (data.websiteDomain?.trim()) lines.push(`WEBSITE DOMAIN: ${data.websiteDomain.trim()}`);
  if (data.targetKeywords?.trim()) lines.push(`TARGET KEYWORDS FOR LOCAL SEO: ${data.targetKeywords.trim()}`);

  const pages = data.pagesToCreate && data.pagesToCreate.length > 0 ? data.pagesToCreate : ["Home", "About", "Services", "Contact", "FAQ", "Service Areas"];
  lines.push(`PAGES TO CREATE: ${pages.join(", ")}`);

  if (data.brandColors?.trim()) lines.push(`BRAND COLORS: ${data.brandColors.trim()}`);
  if (data.styleTone?.trim()) lines.push(`STYLE & TONE: ${data.styleTone.trim()}`);
  if (data.logoUrl?.trim()) lines.push(`LOGO IMAGE URL: ${data.logoUrl.trim()}`);
  if (data.googleMaps?.trim()) lines.push(`GOOGLE MAPS LINK / EMBED: ${data.googleMaps.trim()}`);
  if (data.socialLinks?.trim()) lines.push(`SOCIAL MEDIA LINKS: ${data.socialLinks.trim()}`);
  if (data.extraInstructions?.trim()) lines.push(`EXTRA INSTRUCTIONS: ${data.extraInstructions.trim()}`);

  lines.push("");
  lines.push("Generate all HTML files (index.html for Home, and corresponding files like about.html, services.html, contact.html, faq.html, service-areas.html for each selected page), plus styles.css, script.js, sitemap.xml, and robots.txt. Ensure all navigation links between pages work seamlessly. Output strictly the single JSON object.");

  return lines.join("\n");
}
