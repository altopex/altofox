import { generateWebsite, GenerateWebsiteParams } from "../ai/generate-website";
import { extractAndParseJSON, validateGeneratedWebsite, GeneratedFile } from "./validator";
import {
  SYSTEM_PROMPT,
  WebsiteFormData,
  TargetPage,
  computeTargetPages,
  buildUserPrompt,
  buildSinglePagePrompt,
} from "./prompt";
import { THEMES } from "../themes";

export interface SharedSiteLayout {
  headerHtml: string;
  footerHtml: string;
  fontHeadTags: string;
  mobileCallBar: string;
  metaTags: string;
}

/**
 * Extracts shared layout elements (header, footer, sticky call bar, font links) from index.html
 */
export function extractSharedSiteLayout(indexHtml: string, formData: WebsiteFormData): SharedSiteLayout {
  // 1. Extract Font links from <head>
  const fontMatches = indexHtml.match(/<link[^>]*fonts\.(?:googleapis|gstatic)\.com[^>]*>/gi);
  let fontHeadTags = fontMatches ? fontMatches.join("\n") : "";
  if (!fontHeadTags && formData.theme) {
    const headingFont = encodeURIComponent(formData.theme.fonts.heading);
    const bodyFont = encodeURIComponent(formData.theme.fonts.body);
    fontHeadTags = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=${headingFont}:wght@400;600;700;800&family=${bodyFont}:wght@300;400;500;600;700&display=swap" rel="stylesheet">`;
  }

  // 2. Extract <header ...>...</header>
  const headerMatch = indexHtml.match(/<header[\s\S]*?<\/header>/i);
  let headerHtml = headerMatch ? headerMatch[0] : "";

  // 3. Extract <footer ...>...</footer>
  const footerMatch = indexHtml.match(/<footer[\s\S]*?<\/footer>/i);
  let footerHtml = footerMatch ? footerMatch[0] : "";

  // 4. Extract sticky mobile call bar (if present)
  const mobileBarMatch =
    indexHtml.match(/<div[^>]*(?:class|id)=["'][^"']*(?:mobile|sticky)[^"']*call[^"']*["'][\s\S]*?<\/div>/i) ||
    indexHtml.match(/<div[^>]*class=["'][^"']*call-bar[^"']*["'][\s\S]*?<\/div>/i);
  let mobileCallBar = mobileBarMatch ? mobileBarMatch[0] : "";

  if (!mobileCallBar && formData.phone) {
    mobileCallBar = `
  <!-- Sticky Mobile Call Bar -->
  <div class="sticky-call-bar" id="sticky-call-bar">
    <a href="tel:${formData.phone.replace(/[^\d+]/g, "")}" class="btn-call-mobile">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
      <span>Call Now: ${formData.phone}</span>
    </a>
  </div>`;
  }

  // 5. Fallback headers/footers if extraction did not match
  if (!headerHtml) {
    headerHtml = generateFallbackHeader(formData);
  }
  if (!footerHtml) {
    footerHtml = generateFallbackFooter(formData);
  }

  return {
    headerHtml,
    footerHtml,
    fontHeadTags,
    mobileCallBar,
    metaTags: `<meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">`,
  };
}

/**
 * Builds high-converting fallback semantic HTML for an individual page
 * Used if an LLM call for a single subpage encounters a network or parsing issue
 */
export function buildFallbackPageContent(
  formData: WebsiteFormData,
  page: TargetPage,
  layout: SharedSiteLayout
): string {
  const bizName = formData.businessName || "Local Business";
  const city = formData.city || "Our Area";
  const state = formData.stateRegion || "";
  const phone = formData.phone || "(555) 123-4567";
  const cleanPhone = phone.replace(/[^\d+]/g, "");
  const theme = formData.theme;

  let pageHeroH1 = `${page.title}`;
  let pageHeroSub = `Professional, guaranteed local services in ${city}, ${state}. Available 24/7 with upfront transparent pricing.`;
  let mainBodyHtml = "";

  if (page.type === "individual-service" && page.serviceName) {
    pageHeroH1 = `${page.serviceName} in ${city}, ${state}`;
    pageHeroSub = `Fast, reliable, and licensed ${page.serviceName.toLowerCase()} by experienced master technicians in ${city}.`;
    mainBodyHtml = `
    <section class="section section-overview">
      <div class="container">
        <div class="content-grid-2">
          <div>
            <span class="badge">Local Expertise</span>
            <h2>Top-Rated ${page.serviceName} in ${city}</h2>
            <p>When you need dependable ${page.serviceName.toLowerCase()} in ${city}, ${bizName} is ready to help. Our certified specialists arrive fully equipped with advanced diagnostic tools and parts to solve your problems on the first visit.</p>
            <p>We pride ourselves on 100% upfront flat-rate pricing, respectful technicians, and guaranteed workmanship on every single job.</p>
            <ul class="check-list">
              <li>Immediate response and rapid local dispatch</li>
              <li>Fully licensed, insured, and background-checked technicians</li>
              <li>Honest, upfront pricing with zero hidden surcharges</li>
              <li>Comprehensive 100% customer satisfaction guarantee</li>
            </ul>
          </div>
          <div class="card card-highlight">
            <h3>Need Emergency ${page.serviceName}?</h3>
            <p>Don't wait for minor issues to turn into costly damage. Talk to a local dispatcher right now.</p>
            <a href="tel:${cleanPhone}" class="btn btn-primary btn-large">Call ${phone}</a>
            <div class="card-meta">
              <span>⚡ Average response under 45 mins</span>
              <span>⭐ 5-Star Rated Across ${city}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        <div class="section-header">
          <span class="badge">How It Works</span>
          <h2>Our Simple 3-Step ${page.serviceName} Process</h2>
        </div>
        <div class="process-grid">
          <div class="process-card">
            <div class="process-number">01</div>
            <h3>Call or Request Quote</h3>
            <p>Contact our dispatch team 24/7. We listen to your problem and schedule immediate service.</p>
          </div>
          <div class="process-card">
            <div class="process-number">02</div>
            <h3>Diagnosis & Upfront Estimate</h3>
            <p>Our expert inspects your system and presents transparent repair options before any work begins.</p>
          </div>
          <div class="process-card">
            <div class="process-number">03</div>
            <h3>Expert Solution & Guarantee</h3>
            <p>We complete the job cleanly, test thoroughly, and back everything with our warranty.</p>
          </div>
        </div>
      </div>
    </section>`;
  } else if (page.type === "individual-area" && page.areaName) {
    pageHeroH1 = `${formData.businessType || "Contractor"} in ${page.areaName}, ${state}`;
    pageHeroSub = `Serving homes and businesses across ${page.areaName} with top-rated local services and fast dispatch.`;
    mainBodyHtml = `
    <section class="section section-overview">
      <div class="container">
        <div class="content-grid-2">
          <div>
            <span class="badge">Local Community Service</span>
            <h2>Trusted ${formData.businessType || "Contractors"} Serving ${page.areaName}</h2>
            <p>${bizName} has proudly served ${page.areaName} and surrounding neighborhoods with dependable, prompt solutions for over ${formData.yearsInBusiness || "15"} years.</p>
            <p>Whether you have an urgent emergency or a planned improvement, our local dispatch units are stationed nearby in ${page.areaName} to minimize waiting time.</p>
            <div class="stats-row">
              <div class="stat-item"><span class="stat-num">45m</span><span class="stat-lbl">Average Arrival in ${page.areaName}</span></div>
              <div class="stat-item"><span class="stat-num">100%</span><span class="stat-lbl">Satisfaction Guarantee</span></div>
              <div class="stat-item"><span class="stat-num">5★</span><span class="stat-lbl">Google Rating</span></div>
            </div>
          </div>
          <div class="card card-highlight">
            <h3>Direct Service in ${page.areaName}</h3>
            <p>Ready for fast, friendly service in ${page.areaName}? Call our priority dispatch line now.</p>
            <a href="tel:${cleanPhone}" class="btn btn-primary btn-large">Call ${phone}</a>
            <div class="card-meta">
              <a href="contact.html" class="link-subtle">Or request a quote online →</a>
            </div>
          </div>
        </div>
      </div>
    </section>`;
  } else if (page.type === "about") {
    mainBodyHtml = `
    <section class="section">
      <div class="container">
        <div class="content-grid-2">
          <div>
            <span class="badge">Our Story</span>
            <h2>Dedicated to Excellence in ${city}</h2>
            <p>${formData.businessDescription || `${bizName} was founded with a straightforward mission: deliver unmatched craftsmanship and honest customer care to homeowners and businesses throughout ${city}.`}</p>
            <p>Our team consists of background-checked, licensed professionals who treat your property with the utmost care. We never cut corners and always provide transparent pricing upfront.</p>
          </div>
          <div class="card card-highlight">
            <h3>Why Local Neighbors Trust Us</h3>
            <ul class="check-list">
              <li>${formData.uniqueSellingPoints || "Licensed, insured, and verified master specialists"}</li>
              <li>Upfront pricing with no surprise invoices</li>
              <li>Clean, courteous technicians who respect your space</li>
              <li>100% workmanship warranty on all completed jobs</li>
            </ul>
          </div>
        </div>
      </div>
    </section>`;
  } else if (page.type === "services") {
    const servicesList = formData.services || (formData.servicesOffered ? formData.servicesOffered.split(",") : ["Complete Service Solutions"]);
    mainBodyHtml = `
    <section class="section">
      <div class="container">
        <div class="section-header">
          <span class="badge">What We Do</span>
          <h2>Comprehensive Services in ${city}</h2>
          <p>Explore our complete range of specialized solutions designed to keep your home running smoothly.</p>
        </div>
        <div class="services-grid">
          ${servicesList
            .map(
              (s) => `
            <div class="service-card">
              <div class="service-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              </div>
              <h3>${s.trim()}</h3>
              <p>Expert, guaranteed ${s.trim().toLowerCase()} performed by certified professionals with state-of-the-art tools.</p>
              <a href="contact.html" class="btn btn-outline btn-sm">Request Service →</a>
            </div>`
            )
            .join("\n")}
        </div>
      </div>
    </section>`;
  } else if (page.type === "contact") {
    mainBodyHtml = `
    <section class="section">
      <div class="container">
        <div class="contact-grid">
          <div>
            <span class="badge">Get in Touch</span>
            <h2>We're Here When You Need Us</h2>
            <p>Have a question or need emergency dispatch in ${city}? Contact us anytime by phone, email, or with the quote form.</p>
            <div class="contact-methods">
              <div class="contact-method-item">
                <strong>Phone (24/7):</strong> <a href="tel:${cleanPhone}">${phone}</a>
              </div>
              ${formData.email ? `<div class="contact-method-item"><strong>Email:</strong> <a href="mailto:${formData.email}">${formData.email}</a></div>` : ""}
              ${formData.businessHours ? `<div class="contact-method-item"><strong>Hours:</strong> ${formData.businessHours}</div>` : ""}
              ${formData.streetAddress ? `<div class="contact-method-item"><strong>Address:</strong> ${formData.streetAddress}, ${city}, ${state}</div>` : ""}
            </div>
          </div>
          <div class="card card-form">
            <h3>Request a Free Quote</h3>
            <form id="contact-form" onsubmit="event.preventDefault(); alert('Thank you! Your quote request has been received. We will contact you shortly.'); this.reset();">
              <div class="form-group">
                <label for="name">Your Name</label>
                <input type="text" id="name" required placeholder="John Smith">
              </div>
              <div class="form-group">
                <label for="phone">Phone Number</label>
                <input type="tel" id="phone" required placeholder="(555) 000-0000">
              </div>
              <div class="form-group">
                <label for="service">Service Needed</label>
                <input type="text" id="service" placeholder="${page.serviceName || "Service description"}">
              </div>
              <button type="submit" class="btn btn-primary btn-block">Submit Request</button>
            </form>
          </div>
        </div>
      </div>
    </section>`;
  } else {
    mainBodyHtml = `
    <section class="section">
      <div class="container">
        <div class="section-header">
          <h2>${page.title}</h2>
          <p>Reliable, localized solutions by ${bizName} in ${city}, ${state}.</p>
        </div>
      </div>
    </section>`;
  }

  // Schema for page
  const schemaType = page.type === "individual-service" ? "Service" : "WebPage";
  const jsonLd = `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "${schemaType}",
    "name": "${page.title}",
    "description": "${pageHeroSub.replace(/"/g, '\\"')}",
    "provider": {
      "@type": "LocalBusiness",
      "name": "${bizName}",
      "telephone": "${phone}",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "${city}",
        "addressRegion": "${state}"
      }
    }
  }
  </script>`;

  return `<!DOCTYPE html>
<html lang="${formData.language ? formData.language.slice(0, 2).toLowerCase() : "en"}">
<head>
  ${layout.metaTags}
  <title>${page.title} | ${bizName}</title>
  <meta name="description" content="${pageHeroSub.slice(0, 155)}">
  ${layout.fontHeadTags}
  <link rel="stylesheet" href="styles.css">
  <script src="script.js" defer></script>
  ${jsonLd}
</head>
<body class="theme-${theme?.id || "modern"}">
  ${layout.headerHtml}

  <main>
    <!-- Subpage Hero Banner -->
    <section class="page-hero">
      <div class="container">
        <nav aria-label="breadcrumb" class="breadcrumb">
          <a href="index.html">Home</a>
          <span class="sep">/</span>
          <span class="current">${page.title}</span>
        </nav>
        <h1>${pageHeroH1}</h1>
        <p class="hero-sub">${pageHeroSub}</p>
        <div class="hero-actions">
          <a href="tel:${cleanPhone}" class="btn btn-primary">Call ${phone}</a>
          <a href="contact.html" class="btn btn-secondary">Get a Quote</a>
        </div>
      </div>
    </section>

    ${mainBodyHtml}

    <!-- Pre-Footer CTA Banner -->
    <section class="section cta-banner">
      <div class="container cta-container">
        <div>
          <h2>Ready to Schedule Service in ${city}?</h2>
          <p>Our licensed technicians are on standby for immediate response.</p>
        </div>
        <div class="cta-actions">
          <a href="tel:${cleanPhone}" class="btn btn-primary btn-large">Call ${phone}</a>
          <a href="contact.html" class="btn btn-outline btn-large">Book Online</a>
        </div>
      </div>
    </section>
  </main>

  ${layout.footerHtml}
  ${layout.mobileCallBar}
</body>
</html>`;
}

/**
 * Generates a clean fallback header navigation with dropdowns for services and areas
 */
function generateFallbackHeader(formData: WebsiteFormData): string {
  const bizName = formData.businessName || "Local Business";
  const phone = formData.phone || "(555) 123-4567";
  const cleanPhone = phone.replace(/[^\d+]/g, "");

  return `
  <header class="site-header" id="site-header">
    <div class="header-container container">
      <a href="index.html" class="brand-logo">
        <span class="logo-icon">⚡</span>
        <span class="logo-text">${bizName}</span>
      </a>

      <button class="nav-toggle" id="nav-toggle" aria-label="Toggle navigation menu" aria-expanded="false">
        <span class="hamburger-bar"></span>
        <span class="hamburger-bar"></span>
        <span class="hamburger-bar"></span>
      </button>

      <nav class="main-nav" id="main-nav">
        <ul class="nav-list">
          <li><a href="index.html" class="nav-link">Home</a></li>
          <li><a href="about.html" class="nav-link">About</a></li>
          <li><a href="services.html" class="nav-link">Services</a></li>
          <li><a href="service-areas.html" class="nav-link">Service Areas</a></li>
          <li><a href="faq.html" class="nav-link">FAQ</a></li>
          <li><a href="contact.html" class="nav-link">Contact</a></li>
        </ul>
      </nav>

      <div class="header-cta">
        <a href="tel:${cleanPhone}" class="btn btn-primary btn-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          <span>${phone}</span>
        </a>
      </div>
    </div>
  </header>`;
}

/**
 * Generates a clean fallback footer with NAP and links
 */
function generateFallbackFooter(formData: WebsiteFormData): string {
  const bizName = formData.businessName || "Local Business";
  const city = formData.city || "Local City";
  const state = formData.stateRegion || "";
  const phone = formData.phone || "(555) 123-4567";
  const cleanPhone = phone.replace(/[^\d+]/g, "");

  return `
  <footer class="site-footer">
    <div class="footer-top container">
      <div class="footer-col footer-col-brand">
        <div class="brand-logo">
          <span class="logo-icon">⚡</span>
          <span class="logo-text">${bizName}</span>
        </div>
        <p class="footer-desc">${formData.businessDescription || `Reliable, licensed local services in ${city}, ${state}. Available 24/7 with upfront pricing.`}</p>
        <div class="footer-phone">
          <a href="tel:${cleanPhone}" class="footer-phone-link">${phone}</a>
        </div>
      </div>
      <div class="footer-col">
        <h4>Quick Links</h4>
        <ul class="footer-links">
          <li><a href="index.html">Home</a></li>
          <li><a href="about.html">About Us</a></li>
          <li><a href="services.html">Services</a></li>
          <li><a href="service-areas.html">Service Areas</a></li>
          <li><a href="faq.html">FAQ</a></li>
          <li><a href="contact.html">Contact Us</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Service Coverage</h4>
        <p>Serving ${formData.serviceAreas || city} and surrounding communities.</p>
        ${formData.businessHours ? `<p><strong>Hours:</strong><br>${formData.businessHours}</p>` : ""}
      </div>
      <div class="footer-col">
        <h4>Contact & Dispatch</h4>
        <p>${formData.streetAddress ? `${formData.streetAddress}<br>` : ""}${city}, ${state}</p>
        ${formData.email ? `<p><a href="mailto:${formData.email}">${formData.email}</a></p>` : ""}
      </div>
    </div>
    <div class="footer-bottom container">
      <p>© ${new Date().getFullYear()} ${bizName}. All rights reserved. Locally Owned & Operated.</p>
    </div>
  </footer>`;
}

/**
 * Orchestrates multi-page website generation.
 * If targetPages.length <= 4: single prompt generation
 * If targetPages.length > 4: generates foundation (index.html, styles.css, script.js, sitemap.xml, robots.txt),
 * then generates each remaining page page-by-page using the exact same styles.css, header, and footer!
 */
export async function generateMultiPageWebsite(
  formData: WebsiteFormData,
  targetPages: TargetPage[],
  aiParams: {
    provider: string;
    apiKey: string;
    model: string;
    baseUrl?: string;
  }
): Promise<{ files: GeneratedFile[]; notes?: string }> {
  const { provider, apiKey, model, baseUrl } = aiParams;

  console.log(`[MultiPage] Target pages count: ${targetPages.length}`);

  // CASE 1: 4 or fewer pages -> single prompt generation
  if (targetPages.length <= 4) {
    const singlePrompt = buildUserPrompt(formData, targetPages);
    const raw = await generateWebsite({
      provider,
      apiKey,
      model,
      baseUrl,
      systemPrompt: SYSTEM_PROMPT,
      prompt: singlePrompt,
      maxTokens: 16000,
    });

    const parsed = extractAndParseJSON(raw);
    const validated = validateGeneratedWebsite(parsed);
    return validated;
  }

  // CASE 2: More than 4 pages -> Page-by-Page generation with shared foundation
  console.log(`[MultiPage] >4 pages detected (${targetPages.length} pages). Starting Page-by-Page generation...`);

  // Step 1: Generate foundation (index.html, styles.css, script.js, sitemap.xml, robots.txt)
  const foundationPrompt = `${buildUserPrompt(formData, targetPages)}

FOUNDATION GENERATION PHASE (Page 1 of Multi-Page Pipeline):
Please generate the complete core website package:
1. "index.html" (The complete Home page. MUST include the full <header> with navigation links and dropdowns for all ${targetPages.length} requested pages, and the full <footer>).
2. "styles.css" (The complete shared CSS stylesheet with CSS variables in :root for theme colors and typography, responsive layout, dropdown menus, mobile navigation, hero, cards, and sticky mobile call bar).
3. "script.js" (Complete vanilla JS for mobile menu toggle, sticky header scroll effect, dropdown menus, FAQ accordion, and contact form).
4. "sitemap.xml" (XML sitemap listing ALL ${targetPages.length} pages: ${targetPages.map(p => p.path).join(", ")}).
5. "robots.txt" (Allow: / and Sitemap reference).

Respond with ONLY valid JSON containing these foundation files.`;

  let foundationRaw: string;
  try {
    foundationRaw = await generateWebsite({
      provider,
      apiKey,
      model,
      baseUrl,
      systemPrompt: SYSTEM_PROMPT,
      prompt: foundationPrompt,
      maxTokens: 16000,
    });
  } catch (err) {
    console.error("[MultiPage] Foundation generation error:", err);
    throw err;
  }

  const foundationParsed = extractAndParseJSON(foundationRaw);
  const foundationValidated = validateGeneratedWebsite(foundationParsed);

  const fileMap = new Map<string, string>();
  for (const f of foundationValidated.files) {
    fileMap.set(f.path, f.content);
  }

  const indexHtml = fileMap.get("index.html") || "";
  const layout = extractSharedSiteLayout(indexHtml, formData);

  // Step 2: Determine remaining pages to generate
  const remainingPages = targetPages.filter((p) => p.path !== "index.html" && !fileMap.has(p.path));
  console.log(`[MultiPage] Foundation generated ${fileMap.size} files. Remaining subpages to generate: ${remainingPages.length}`);

  // Step 3: Generate remaining pages page-by-page in controlled concurrent chunks (concurrency 2)
  const chunkSize = 2;
  for (let i = 0; i < remainingPages.length; i += chunkSize) {
    const chunk = remainingPages.slice(i, i + chunkSize);

    await Promise.all(
      chunk.map(async (page) => {
        console.log(`[MultiPage] Generating subpage: ${page.path} (${page.title})...`);
        const pagePrompt = buildSinglePagePrompt(
          formData,
          page,
          layout.headerHtml,
          layout.footerHtml,
          layout.fontHeadTags,
          layout.mobileCallBar
        );

        try {
          const pageRaw = await generateWebsite({
            provider,
            apiKey,
            model,
            baseUrl,
            systemPrompt: SYSTEM_PROMPT,
            prompt: pagePrompt,
            maxTokens: 6000,
          });

          const pageParsed = extractAndParseJSON(pageRaw) as { files?: { path: string; content: string }[] };
          if (Array.isArray(pageParsed?.files) && pageParsed.files.length > 0) {
            for (const file of pageParsed.files) {
              if (file.path && file.content) {
                fileMap.set(file.path, file.content);
              }
            }
          } else {
            throw new Error("No files array in subpage response");
          }
        } catch (pageErr) {
          console.warn(`[MultiPage] AI subpage generation for ${page.path} failed. Using consistent layout fallback:`, pageErr);
          const fallbackContent = buildFallbackPageContent(formData, page, layout);
          fileMap.set(page.path, fallbackContent);
        }
      })
    );
  }

  // Ensure sitemap.xml contains all generated pages
  if (!fileMap.has("sitemap.xml")) {
    const domain = (formData.websiteDomain || "www.example.com").replace(/^https?:\/\//, "");
    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Array.from(fileMap.keys())
  .filter((k) => k.endsWith(".html"))
  .map(
    (k) => `  <url>
    <loc>https://${domain}/${k}</loc>
    <changefreq>weekly</changefreq>
    <priority>${k === "index.html" ? "1.0" : "0.8"}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;
    fileMap.set("sitemap.xml", sitemapContent);
  }

  if (!fileMap.has("robots.txt")) {
    const domain = (formData.websiteDomain || "www.example.com").replace(/^https?:\/\//, "");
    fileMap.set("robots.txt", `User-agent: *\nAllow: /\nSitemap: https://${domain}/sitemap.xml\n`);
  }

  const finalFiles: GeneratedFile[] = Array.from(fileMap.entries()).map(([path, content]) => ({
    path,
    content,
  }));

  return {
    files: finalFiles,
    notes: `Complete multi-page static website (${finalFiles.length} files) generated page-by-page using consistent styles.css, header navigation, and footer.`,
  };
}
