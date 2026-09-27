/**
 * Dedicated Page Creator & Intelligent Internal Linking Engine
 * 
 * Generates an individual, high-converting, SEO-optimized page for an existing website
 * without rewriting or regenerating existing pages. Updates sitemap.xml and injects
 * contextual internal links across the website.
 */

import { GeneratedFile } from "./validator";
import { extractSharedSiteLayout, SharedSiteLayout } from "./multi-page";
import { WebsiteFormData } from "./prompt";
import { generateWebsite } from "../ai/generate-website";
import { SYSTEM_PROMPT } from "./prompt";
import { generateSchemaJsonLd } from "../seo/export-seo-optimizer";
import { SearchIntentType } from "../seo/opportunity-engine";
import { integrateNewPageIntoProject } from "../seo/connectivity-engine";

export interface CreateNewPageOptions {
  primaryQuery: string;
  serviceName: string;
  locationCity?: string;
  locationState?: string;
  searchIntent?: SearchIntentType;
  title: string;
  slug: string;
  relatedQueries?: string[];
  navPlacement?: "contextual_only" | "main_nav" | "service_submenu" | "footer_only";
  customContentInstructions?: string;
  metaDescription?: string;
  aiConfig?: {
    provider?: string;
    apiKey?: string;
    model?: string;
    baseUrl?: string;
  };
}

export interface CreateNewPageResult {
  newPageFile: GeneratedFile;
  updatedExistingFiles: GeneratedFile[];
  sitemapFile: GeneratedFile;
  incomingLinksCount: number;
  outgoingLinksCount: number;
  linkedFromPages: string[];
}

/**
 * Normalizes slug to ensure it ends with .html and has no leading/trailing slashes.
 */
export function normalizePageSlug(rawSlug: string): string {
  let cleaned = rawSlug.trim().toLowerCase().replace(/^\/+/, "").replace(/\/+$/, "");
  if (!cleaned.endsWith(".html")) {
    cleaned = `${cleaned}.html`;
  }
  return cleaned;
}

/**
 * Updates or creates sitemap.xml with the newly added page URL.
 */
export function updateSitemapWithNewPage(
  existingSitemapContent: string | undefined,
  allHtmlFiles: string[],
  domain: string
): string {
  const cleanDomain = domain.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  const baseUrl = `https://${cleanDomain}`;

  if (!existingSitemapContent || !existingSitemapContent.includes("<urlset")) {
    // Generate fresh sitemap
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allHtmlFiles
  .map(
    (file) => `  <url>
    <loc>${baseUrl}/${file === "index.html" ? "" : file}</loc>
    <changefreq>weekly</changefreq>
    <priority>${file === "index.html" ? "1.0" : "0.8"}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;
  }

  // If sitemap already has the page, return it as-is
  const lastAddedFile = allHtmlFiles[allHtmlFiles.length - 1];
  const pageLoc = `${baseUrl}/${lastAddedFile === "index.html" ? "" : lastAddedFile}`;
  if (existingSitemapContent.includes(pageLoc) || existingSitemapContent.includes(lastAddedFile)) {
    return existingSitemapContent;
  }

  // Insert before closing </urlset>
  const newEntry = `  <url>
    <loc>${pageLoc}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

  return existingSitemapContent.replace(/<\/urlset>/i, newEntry);
}

/**
 * Injects a navigation link into existing HTML header or footer navigation.
 */
export function injectNavLinkIntoHtml(
  html: string,
  newSlug: string,
  newTitle: string,
  placement: "main_nav" | "service_submenu" | "footer_only"
): string {
  if (html.includes(`href="${newSlug}"`) || html.includes(`href="./${newSlug}"`)) {
    return html;
  }

  if (placement === "main_nav") {
    // Try to append inside <nav>...</nav>
    const navMatch = html.match(/(<nav[^>]*>[\s\S]*?)(<\/nav>)/i);
    if (navMatch) {
      const linkTag = `\n    <a href="${newSlug}" class="nav-link">${newTitle}</a>\n  `;
      return html.replace(navMatch[0], `${navMatch[1]}${linkTag}${navMatch[2]}`);
    }
  } else if (placement === "service_submenu") {
    // Try to find a services dropdown list
    const dropdownMatch = html.match(/(<div[^>]*class=["'][^"']*dropdown-content[^"']*["'][\s\S]*?)(<\/div>)/i) ||
      html.match(/(<ul[^>]*class=["'][^"']*dropdown[^"']*["'][\s\S]*?)(<\/ul>)/i);
    if (dropdownMatch) {
      const linkTag = `\n      <a href="${newSlug}" class="dropdown-item">${newTitle}</a>\n    `;
      return html.replace(dropdownMatch[0], `${dropdownMatch[1]}${linkTag}${dropdownMatch[2]}`);
    }
  }

  // Fallback to footer navigation
  const footerNavMatch = html.match(/(<footer[\s\S]*?<ul[^>]*>)([\s\S]*?)(<\/ul>[\s\S]*?<\/footer>)/i);
  if (footerNavMatch) {
    const linkTag = `\n        <li><a href="${newSlug}">${newTitle}</a></li>`;
    return html.replace(footerNavMatch[0], `${footerNavMatch[1]}${footerNavMatch[2]}${linkTag}\n      ${footerNavMatch[3]}`);
  }

  return html;
}

/**
 * Injects a contextual link into the main body or service list of a relevant existing page.
 */
export function injectContextualInternalLink(
  html: string,
  newSlug: string,
  anchorText: string,
  contextNote: string
): { updatedHtml: string; injected: boolean } {
  if (html.includes(`href="${newSlug}"`) || html.includes(`href="./${newSlug}"`)) {
    return { updatedHtml: html, injected: true };
  }

  // Try finding an existing "related services" or "our services" grid/list
  const serviceListMatch = html.match(/(<section[^>]*(?:services|service-areas|related)[^>]*>[\s\S]*?<div[^>]*class=["'][^"']*(?:grid|cards|links)[^"']*["'][\s\S]*?)(<\/div>[\s\S]*?<\/section>)/i);
  if (serviceListMatch) {
    const cardHtml = `
      <div class="service-card contextual-link-card" style="border: 1px solid var(--border-color, #e2e8f0); border-radius: 8px; padding: 16px; background: #fff;">
        <h4 style="margin: 0 0 8px 0; font-size: 1.1rem;"><a href="${newSlug}" style="text-decoration: underline; color: var(--primary, #2563eb); font-weight: 600;">${anchorText}</a></h4>
        <p style="margin: 0; font-size: 0.875rem; color: #64748b;">${contextNote}</p>
        <a href="${newSlug}" style="display: inline-block; margin-top: 10px; font-size: 0.825rem; font-weight: 600; color: var(--primary, #2563eb);">Learn More &rarr;</a>
      </div>`;
    return {
      updatedHtml: html.replace(serviceListMatch[0], `${serviceListMatch[1]}${cardHtml}\n    ${serviceListMatch[2]}`),
      injected: true,
    };
  }

  // Fallback: look for a paragraph near the bottom of main or before the first footer/CTA section
  const ctaMatch = html.match(/(<section[^>]*(?:cta|contact)[^>]*>)/i);
  if (ctaMatch) {
    const linkBlock = `
    <!-- Contextual Internal Link -->
    <div class="contextual-internal-link-banner" style="max-width: 1100px; margin: 30px auto; padding: 16px 20px; background: #f8fafc; border-left: 4px solid var(--primary, #2563eb); border-radius: 6px;">
      <p style="margin: 0; font-size: 0.95rem; color: #334155;">
        Looking for specialized care? Explore our dedicated <a href="${newSlug}" style="font-weight: 700; text-decoration: underline; color: var(--primary, #2563eb);">${anchorText}</a> solutions. ${contextNote}
      </p>
    </div>\n    `;
    return {
      updatedHtml: html.replace(ctaMatch[0], `${linkBlock}${ctaMatch[0]}`),
      injected: true,
    };
  }

  return { updatedHtml: html, injected: false };
}

/**
 * Builds high-converting, accessible, semantically structured HTML for the new page.
 */
export function buildDeterministicDedicatedPageHtml(
  options: CreateNewPageOptions,
  formData: WebsiteFormData,
  layout: SharedSiteLayout,
  existingFiles: GeneratedFile[]
): string {
  const bizName = formData.businessName || "Local Service Pros";
  const city = options.locationCity || formData.city || "Local Community";
  const state = options.locationState || formData.stateRegion || "";
  const phone = formData.phone || "(555) 123-4567";
  const cleanPhone = phone.replace(/[^\d+]/g, "");
  const domain = (formData.websiteDomain || "www.example.com").replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  const pageUrl = `https://${domain}/${options.slug}`;

  const metaDesc =
    options.metaDescription ||
    `Expert ${options.serviceName.toLowerCase()} in ${city}, ${state}. Fully licensed local specialists providing transparent upfront pricing and rapid dispatch. Call ${phone}.`;

  // Schema structured data
  const schemaObj = generateSchemaJsonLd({
    pagePath: options.slug,
    projectName: bizName,
    domain,
    businessName: bizName,
    businessType: formData.businessType || options.serviceName,
    phone,
    email: formData.email,
    city,
    state,
    address: (formData as any).address,
    zipCode: (formData as any).zipCode,
    description: metaDesc,
  });

  // Breadcrumbs
  const breadcrumbHtml = `
    <nav class="breadcrumbs" aria-label="Breadcrumb" style="font-size: 0.85rem; padding: 12px 0; color: #64748b;">
      <div style="max-width: 1200px; margin: 0 auto; padding: 0 20px;">
        <a href="index.html" style="color: #64748b; text-decoration: none;">Home</a>
        <span style="margin: 0 8px;">/</span>
        ${existingFiles.some((f) => f.path === "services.html") ? `<a href="services.html" style="color: #64748b; text-decoration: none;">Services</a><span style="margin: 0 8px;">/</span>` : ""}
        <span style="color: #0f172a; font-weight: 600;">${options.serviceName}</span>
      </div>
    </nav>`;

  // Related Queries tags
  const relatedTagsHtml = (options.relatedQueries || [])
    .slice(0, 4)
    .map((q) => `<span style="display: inline-block; padding: 4px 10px; background: #e2e8f0; color: #334155; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; margin: 4px;">${q}</span>`)
    .join(" ");

  // Custom instructions note (if applicable)
  const instructionsVoice = options.customContentInstructions
    ? `\n    <!-- Note: Crafted following instructions: ${options.customContentInstructions.slice(0, 100)}... -->`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title}</title>
  <meta name="description" content="${metaDesc}">
  <link rel="canonical" href="${pageUrl}">
  <meta property="og:title" content="${options.title}">
  <meta property="og:description" content="${metaDesc}">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:type" content="website">
  <link rel="stylesheet" href="styles.css">${instructionsVoice}
  ${layout.fontHeadTags}
  <script type="application/ld+json">
${JSON.stringify(schemaObj, null, 2)}
  </script>
</head>
<body>
  ${layout.headerHtml}

  ${breadcrumbHtml}

  <main id="main-content">
    <!-- Hero Section -->
    <section class="page-hero" style="padding: 60px 20px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ffffff; text-align: center;">
      <div style="max-width: 900px; margin: 0 auto;">
        <span style="display: inline-block; padding: 6px 14px; background: rgba(255, 255, 255, 0.1); border-radius: 9999px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px;">
          Dedicated Local Service • ${city}, ${state}
        </span>
        <h1 style="font-size: 2.5rem; line-height: 1.2; font-weight: 800; margin-bottom: 16px;">
          ${options.serviceName} in ${city}, ${state}
        </h1>
        <p style="font-size: 1.15rem; color: #cbd5e1; max-width: 750px; margin: 0 auto 28px; line-height: 1.6;">
          Professional, licensed, and dependable ${options.serviceName.toLowerCase()} solutions engineered for long-term safety, efficiency, and upfront pricing in ${city}.
        </p>
        <div style="display: flex; gap: 14px; justify-content: center; flex-wrap: wrap;">
          <a href="tel:${cleanPhone}" class="btn-primary" style="display: inline-flex; align-items: center; padding: 14px 26px; background: var(--primary, #2563eb); color: #fff; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 1rem;">
            <span>Call Now: ${phone}</span>
          </a>
          <a href="#contact-quote" class="btn-secondary" style="display: inline-flex; align-items: center; padding: 14px 24px; background: #ffffff; color: #0f172a; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 1rem;">
            <span>Request Fast Quote</span>
          </a>
        </div>
      </div>
    </section>

    <!-- Direct Answer & Service Overview -->
    <section class="service-overview" style="padding: 60px 20px; max-width: 1100px; margin: 0 auto;">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 40px; align-items: center;">
        <div>
          <h2 style="font-size: 1.85rem; font-weight: 800; margin-bottom: 16px; color: #0f172a;">
            Reliable ${options.serviceName} Tailored for ${city} Residents
          </h2>
          <p style="font-size: 1rem; line-height: 1.7; color: #334155; margin-bottom: 16px;">
            When property owners in ${city} search for <strong>${options.primaryQuery}</strong>, they require clear diagnostics, prompt arrival, and honest evaluations. Our certified technicians understand local building codes, soil conditions, and regional climate pressures that impact ${options.serviceName.toLowerCase()} systems.
          </p>
          <p style="font-size: 1rem; line-height: 1.7; color: #334155; margin-bottom: 20px;">
            Every appointment begins with a thorough inspection of your setup, followed by a transparent, flat-rate quote before any work commences. No surprise charges or hidden fees.
          </p>
          ${options.relatedQueries && options.relatedQueries.length > 0 ? `<div style="margin-top: 16px;"><span style="font-size: 0.8rem; font-weight: 700; color: #64748b; text-transform: uppercase;">Related Topics Covered:</span><div style="margin-top: 6px;">${relatedTagsHtml}</div></div>` : ""}
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 30px;">
          <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 16px; color: #0f172a;">Why Local Homeowners Choose Us:</h3>
          <ul style="list-style: none; padding: 0; margin: 0; space-y: 12px;">
            <li style="display: flex; gap: 10px; margin-bottom: 12px; font-size: 0.95rem; color: #334155;">
              <span style="color: #10b981; font-weight: bold;">&#10003;</span> Fully licensed, insured, and background-checked technicians
            </li>
            <li style="display: flex; gap: 10px; margin-bottom: 12px; font-size: 0.95rem; color: #334155;">
              <span style="color: #10b981; font-weight: bold;">&#10003;</span> Transparent, upfront flat-rate pricing before work begins
            </li>
            <li style="display: flex; gap: 10px; margin-bottom: 12px; font-size: 0.95rem; color: #334155;">
              <span style="color: #10b981; font-weight: bold;">&#10003;</span> Rapid dispatch throughout ${city} and nearby communities
            </li>
            <li style="display: flex; gap: 10px; margin-bottom: 12px; font-size: 0.95rem; color: #334155;">
              <span style="color: #10b981; font-weight: bold;">&#10003;</span> 100% satisfaction guarantee on all parts and labor
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Common Problems Diagnosed Section -->
    <section style="background: #f1f5f9; padding: 60px 20px;">
      <div style="max-width: 1100px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h2 style="font-size: 1.85rem; font-weight: 800; color: #0f172a; margin-bottom: 12px;">
            Common ${options.serviceName} Issues We Resolve
          </h2>
          <p style="font-size: 1rem; color: #64748b; max-width: 650px; margin: 0 auto;">
            Accurate root-cause diagnosis saves thousands in preventable water, structural, or electrical damages.
          </p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;">
          <div style="background: #ffffff; padding: 24px; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
            <h3 style="font-size: 1.15rem; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Age-Related Wear &amp; Material Fatigue</h3>
            <p style="font-size: 0.9rem; line-height: 1.6; color: #475569; margin: 0;">
              Components deteriorate over time due to constant operational cycles and regional environmental exposure, leading to micro-fissures and declining efficiency.
            </p>
          </div>
          <div style="background: #ffffff; padding: 24px; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
            <h3 style="font-size: 1.15rem; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Sudden Pressure &amp; Flow Fluctuations</h3>
            <p style="font-size: 0.9rem; line-height: 1.6; color: #475569; margin: 0;">
              Irregular line pressure or compromised regulator valves place undue stress on residential connections, causing intermittent performance drops.
            </p>
          </div>
          <div style="background: #ffffff; padding: 24px; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
            <h3 style="font-size: 1.15rem; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Safety Failures &amp; Sensor Calibration</h3>
            <p style="font-size: 0.9rem; line-height: 1.6; color: #475569; margin: 0;">
              Malfunctioning safety shutoffs, tripped thermal switches, or worn mechanical couplings create reliability risks if left unattended.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Step-by-Step Diagnostic & Execution Process -->
    <section style="padding: 60px 20px; max-width: 1100px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 40px;">
        <h2 style="font-size: 1.85rem; font-weight: 800; color: #0f172a; margin-bottom: 12px;">
          Our 4-Step ${options.serviceName} Workflow
        </h2>
        <p style="font-size: 1rem; color: #64748b;">
          Every project in ${city} is executed with precision, accountability, and clear communication.
        </p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 24px;">
        <div style="text-align: center; padding: 20px;">
          <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--primary, #2563eb); color: #fff; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-weight: 800; font-size: 1.2rem;">1</div>
          <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 8px;">Initial Inspection</h3>
          <p style="font-size: 0.875rem; color: #64748b; line-height: 1.5;">Thorough technical assessment of the primary system and surrounding infrastructure.</p>
        </div>
        <div style="text-align: center; padding: 20px;">
          <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--primary, #2563eb); color: #fff; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-weight: 800; font-size: 1.2rem;">2</div>
          <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 8px;">Flat-Rate Quote</h3>
          <p style="font-size: 0.875rem; color: #64748b; line-height: 1.5;">Clear written proposal with exact parts and labor cost before any work commences.</p>
        </div>
        <div style="text-align: center; padding: 20px;">
          <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--primary, #2563eb); color: #fff; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-weight: 800; font-size: 1.2rem;">3</div>
          <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 8px;">Precise Execution</h3>
          <p style="font-size: 0.875rem; color: #64748b; line-height: 1.5;">Careful repair or installation using high-grade materials conforming to local codes.</p>
        </div>
        <div style="text-align: center; padding: 20px;">
          <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--primary, #2563eb); color: #fff; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-weight: 800; font-size: 1.2rem;">4</div>
          <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 8px;">Testing &amp; Warranty</h3>
          <p style="font-size: 0.875rem; color: #64748b; line-height: 1.5;">Pressure testing, operational verification, clean work area, and documented warranty.</p>
        </div>
      </div>
    </section>

    <!-- FAQ Accordion Section -->
    <section style="background: #f8fafc; padding: 60px 20px;">
      <div style="max-width: 800px; margin: 0 auto;">
        <h2 style="font-size: 1.85rem; font-weight: 800; text-align: center; color: #0f172a; margin-bottom: 30px;">
          Frequently Asked Questions
        </h2>

        <div style="space-y: 16px;">
          <details style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 12px; cursor: pointer;">
            <summary style="font-weight: 700; font-size: 1rem; color: #0f172a;">How quickly can you dispatch a specialist for ${options.serviceName.toLowerCase()} in ${city}?</summary>
            <p style="margin-top: 10px; font-size: 0.9rem; color: #475569; line-height: 1.6;">
              We maintain dedicated mobile units across ${city} and neighboring areas. For emergency needs, we provide priority same-day dispatch. Non-emergency consultations can be scheduled at your convenience.
            </p>
          </details>

          <details style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 12px; cursor: pointer;">
            <summary style="font-weight: 700; font-size: 1rem; color: #0f172a;">How do you determine pricing for ${options.serviceName.toLowerCase()}?</summary>
            <p style="margin-top: 10px; font-size: 0.9rem; color: #475569; line-height: 1.6;">
              We operate strictly on transparent flat-rate pricing based on national industry standards. Our technician presents the exact price after examining the issue on-site, so you know the full cost before work begins.
            </p>
          </details>

          <details style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 12px; cursor: pointer;">
            <summary style="font-weight: 700; font-size: 1rem; color: #0f172a;">Are your technicians fully licensed and insured in ${state || "our region"}?</summary>
            <p style="margin-top: 10px; font-size: 0.9rem; color: #475569; line-height: 1.6;">
              Yes. All our technicians undergo rigorous certification, background screening, and continuous safety training in accordance with all state and municipal regulations.
            </p>
          </details>
        </div>
      </div>
    </section>

    <!-- Bottom CTA Banner -->
    <section id="contact-quote" class="bottom-cta" style="padding: 60px 20px; background: #0f172a; color: #ffffff; text-align: center;">
      <div style="max-width: 800px; margin: 0 auto;">
        <h2 style="font-size: 2rem; font-weight: 800; margin-bottom: 16px;">
          Need Expert ${options.serviceName} in ${city}?
        </h2>
        <p style="font-size: 1.05rem; color: #94a3b8; margin-bottom: 28px; line-height: 1.6;">
          Contact our local team today for immediate assistance, honest advice, and guaranteed results.
        </p>
        <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
          <a href="tel:${cleanPhone}" class="btn-primary" style="display: inline-flex; align-items: center; padding: 14px 28px; background: var(--primary, #2563eb); color: #fff; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 1.05rem;">
            <span>Call Now: ${phone}</span>
          </a>
          <a href="index.html" style="display: inline-flex; align-items: center; padding: 14px 24px; background: rgba(255,255,255,0.1); color: #fff; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 1rem;">
            <span>Back to Home</span>
          </a>
        </div>
      </div>
    </section>
  </main>

  ${layout.footerHtml}
  ${layout.mobileCallBar}
  <script src="script.js"></script>
</body>
</html>`;
}

/**
 * Creates a dedicated page and executes full bidirectional internal linking across the site.
 */
export async function createDedicatedPage(
  options: CreateNewPageOptions,
  existingFiles: GeneratedFile[],
  formData: WebsiteFormData
): Promise<CreateNewPageResult> {
  const normSlug = normalizePageSlug(options.slug);
  const optionsWithNormSlug: CreateNewPageOptions = {
    ...options,
    slug: normSlug,
    navPlacement: options.navPlacement || "contextual_only",
  };

  // 1. Extract shared layout from index.html
  const indexFile = existingFiles.find((f) => f.path === "index.html");
  const indexHtml = indexFile ? indexFile.content : "";
  const layout = extractSharedSiteLayout(indexHtml, formData);

  let newPageContent = "";

  // 2. Try AI generation if configured
  if (options.aiConfig?.apiKey && options.aiConfig.provider) {
    try {
      const customInstructionText = options.customContentInstructions
        ? `\nCUSTOM CONTENT INSTRUCTIONS (STRICTLY HONOR THIS VOICE & TONE):\n${options.customContentInstructions}`
        : "";

      const prompt = `Generate a dedicated, high-converting semantic HTML page for an existing website.
PAGE PARAMETERS:
- File Name: "${normSlug}"
- Primary Target Keyword: "${options.primaryQuery}"
- Service: "${options.serviceName}"
- Location: "${options.locationCity || formData.city || "Local Area"}", ${options.locationState || formData.stateRegion || ""}
- Search Intent: "${options.searchIntent || "transactional"}"
- Page Title: "${options.title}"
- Business Name: "${formData.businessName || "Local Service Pros"}"
- Phone: "${formData.phone || "(555) 123-4567"}"
- Related Queries to naturally include: ${(options.relatedQueries || []).join(", ")}
${customInstructionText}

LAYOUT REQUIREMENTS:
- Reuse the EXACT shared layout elements:
  HEADER:
${layout.headerHtml}
  FOOTER:
${layout.footerHtml}
  MOBILE CALL BAR:
${layout.mobileCallBar}
  FONTS:
${layout.fontHeadTags}
- Link to "styles.css" and "script.js".
- Include Schema.org LocalBusiness JSON-LD markup.
- Include single <h1>, engaging intro, diagnostic problems, 4-step process, transparent pricing reassurance, FAQ accordion (<details>), and bottom CTA.
- Internal breadcrumb linking back to "index.html".
- Fast, clean, valid HTML5 with responsive mobile styling.

Respond with ONLY valid JSON:
{
  "path": "${normSlug}",
  "content": "<!DOCTYPE html>..."
}`;

      const aiResponse = await generateWebsite({
        provider: options.aiConfig.provider as any,
        apiKey: options.aiConfig.apiKey,
        model: options.aiConfig.model || "gpt-4o-mini",
        baseUrl: options.aiConfig.baseUrl,
        systemPrompt: SYSTEM_PROMPT,
        prompt,
        maxTokens: 6000,
      });

      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.content && parsed.content.includes("<body")) {
          newPageContent = parsed.content;
        }
      }
    } catch (aiErr) {
      console.warn("[PageCreator] AI generation error, falling back to deterministic high-quality assembler:", aiErr);
    }
  }

  // Fallback to high-quality deterministic generator if AI was not run or failed
  if (!newPageContent) {
    newPageContent = buildDeterministicDedicatedPageHtml(optionsWithNormSlug, formData, layout, existingFiles);
  }

  const newPageFile: GeneratedFile = {
    path: normSlug,
    content: newPageContent,
  };

  // 3. Intelligent Internal Linking via PageConnectivityEngine
  const domain = (formData.websiteDomain || "www.example.com").replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  const integrationResult = integrateNewPageIntoProject(
    {
      newPagePath: normSlug,
      newPageTitle: options.title,
      newPageContent,
      primaryQuery: options.primaryQuery,
      serviceName: options.serviceName,
      locationCity: options.locationCity || formData.city,
      locationState: options.locationState || formData.stateRegion,
      searchIntent: options.searchIntent,
    },
    existingFiles,
    {
      businessName: formData.businessName || "Local Service Pros",
      primaryTrade: formData.businessType || options.serviceName,
      domain,
    }
  );

  // Apply optional navigation insertion if user chose main_nav or service_submenu or footer_only
  const updatedExistingFiles: GeneratedFile[] = [];
  const linkedFromPages: string[] = [...integrationResult.incomingLinksAdded];

  for (const f of integrationResult.updatedFiles) {
    if (f.path === normSlug) continue; // New page itself
    if (f.path === "sitemap.xml") continue; // Sitemap handled separately

    let content = typeof f.content === "string" ? f.content : f.content.toString("utf-8");
    if (
      optionsWithNormSlug.navPlacement &&
      optionsWithNormSlug.navPlacement !== "contextual_only" &&
      (f.path === "index.html" || f.path === "services.html")
    ) {
      content = injectNavLinkIntoHtml(content, normSlug, options.serviceName, optionsWithNormSlug.navPlacement);
      if (!linkedFromPages.includes(f.path)) {
        linkedFromPages.push(f.path);
      }
    }

    // Only add to updatedExistingFiles if it was actually changed
    const original = existingFiles.find((ef) => ef.path === f.path);
    if (original && (original.content !== content || linkedFromPages.includes(f.path))) {
      updatedExistingFiles.push({
        path: f.path,
        content,
      });
    }
  }

  const sitemapFileItem = integrationResult.updatedFiles.find((f) => f.path === "sitemap.xml");
  const sitemapFile: GeneratedFile = {
    path: "sitemap.xml",
    content: sitemapFileItem
      ? typeof sitemapFileItem.content === "string"
        ? sitemapFileItem.content
        : sitemapFileItem.content.toString("utf-8")
      : "",
  };

  const incomingLinksCount = linkedFromPages.length;
  const outgoingLinksMatches = newPageContent.match(/href=["'](?!#|tel:|mailto:|https?:)[^"']+\.html["']/gi) || [];
  const outgoingLinksCount = outgoingLinksMatches.length;

  return {
    newPageFile,
    updatedExistingFiles,
    sitemapFile,
    incomingLinksCount,
    outgoingLinksCount,
    linkedFromPages,
  };
}
