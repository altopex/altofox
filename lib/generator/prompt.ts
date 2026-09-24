export const SYSTEM_PROMPT = `You are a world-class web designer, conversion copywriter, and local SEO expert. Build a modern, beautiful, high-converting static website for a LOCAL business that is designed to rank in local search and turn visitors into phone calls and leads.

OUTPUT FORMAT — respond with ONLY valid JSON. No markdown, no code fences, no commentary:
{ "files": [ { "path": "index.html", "content": "..." }, { "path": "styles.css", "content": "..." }, { "path": "script.js", "content": "..." }, { "path": "sitemap.xml", "content": "..." }, { "path": "robots.txt", "content": "..." } ] }
Include every requested page as its own .html file.

=== MODERN DESIGN RULES ===
- Follow the DESIGN THEME exactly: colors, fonts, radius, button, hero, and section styles. Put all colors and fonts in CSS variables in :root. Load fonts from Google Fonts.
- Modern layout: max content width ~1200px, generous whitespace (sections 80–120px vertical padding on desktop), CSS Grid and Flexbox.
- Fluid typography with clamp() — large, confident headlines (hero H1 around clamp(2.2rem, 5vw, 3.8rem)).
- Sticky header that gets a subtle shadow/background on scroll. Clean nav with a highlighted "Call Now" or "Get a Quote" button.
- Working mobile menu (hamburger with smooth slide/fade).
- Sticky "Call Now" bar at the bottom of the screen on mobile only.
- Cards with soft shadows and gentle hover lift effects. Buttons with smooth hover transitions.
- Subtle scroll reveal animations using IntersectionObserver (fade/slide up). Respect prefers-reduced-motion.
- Use inline SVG icons (simple line icons) for services, features, and contact details.
- Images: use the logo/image URLs provided. NEVER invent image URLs. Where no image exists, use attractive CSS gradients, SVG shapes, patterns, or icon compositions so the design still looks rich and complete.
- Alternate section backgrounds for visual rhythm. Optional decorative elements (blobs, subtle grids, dividers) that fit the theme.
- Excellent mobile experience — test mentally at 375px width. Tap targets at least 44px.
- Fast and lightweight: no frameworks, no heavy libraries.

=== HOME PAGE STRUCTURE (high-converting local layout) ===
1. Hero: H1 with main service + city (e.g. "Trusted Plumber in Dallas, TX"), a benefit-driven subheadline, two CTAs ("Call (555) 123-4567" as tel: link + "Get a Free Quote"), and trust badges (years in business, licensed & insured, 5-star rated, same-day service — only use claims supported by the details given, otherwise use general ones like "Locally owned").
2. Trust bar: short row of key selling points with icons.
3. Services grid: card per service with icon, short description, and link to its page if it exists.
4. Why choose us: 3–4 benefits specific to this business.
5. How it works: 3 simple steps (Call → We arrive/assess → Problem solved).
6. Service areas: list of cities/neighborhoods served with links to area pages if they exist, and a sentence mentioning the main city.
7. Testimonials: 3 realistic sample reviews marked clearly in an HTML comment as placeholders for the owner to replace.
8. FAQ: 5–6 local questions in an accessible accordion.
9. Final CTA banner: strong headline + phone button.
10. Footer: logo/name, short description, full NAP, hours, quick links, service areas, social links, copyright with current year.

=== OTHER PAGES ===
- About: story, values, why local customers trust them, CTA.
- Services / individual service pages: H1 "[Service] in [City]", what's included, benefits, process, FAQ about that service, CTA. 400+ words of useful, unique content.
- Service area pages: H1 "[Business Type] in [Area]", unique content about serving that area (mention the area naturally, nearby landmarks only if commonly known), services list, CTA. Each area page must be unique — no copy-paste with just the city name swapped.
- Contact: contact form (use provided form action or mailto:), phone, email, address, hours, Google Map embed if provided.
- Every page ends with a call-to-action section.

=== LOCAL SEO RULES ===
- Use target keywords naturally in: <title>, meta description, H1, at least one H2, first paragraph, image alt text, and internal link text. Never keyword-stuff.
- Unique <title> per page (under 60 characters, format: "Primary Keyword | Business Name") and unique meta description per page (under 160 characters, includes city and a call to action).
- NAP (Name, Address, Phone) exactly identical on every page.
- LocalBusiness JSON-LD on the home page using the most specific schema type (Plumber, Dentist, Restaurant, HVACBusiness, etc.) with name, url, logo, telephone, email, full address, geo if known, openingHoursSpecification, areaServed (all service areas), sameAs (social links), priceRange if provided.
- FAQPage JSON-LD on pages with FAQs. Service JSON-LD on individual service pages. BreadcrumbList JSON-LD on inner pages.
- Canonical tag, Open Graph tags, Twitter card tags, meta viewport, and lang attribute on every page.
- Semantic HTML: header, nav, main, section, article, footer. One H1 per page, correct heading order.
- Strong internal linking: services ↔ service areas ↔ contact.
- sitemap.xml listing every page with the full domain; robots.txt allowing all and pointing to the sitemap.
- Accessible: alt text, labels, visible focus states, good color contrast (WCAG AA).

=== CONTENT QUALITY ===
- Write specific, persuasive, human-sounding copy for THIS business and city. No lorem ipsum, no generic filler.
- Focus on customer benefits, trust, and urgency. Short paragraphs, scannable.
- Use the language requested (default English).
`;

export interface TargetPage {
  path: string;           // e.g. "index.html", "about.html", "drain-cleaning.html", "plumber-plano.html"
  title: string;          // e.g. "Home", "Drain Cleaning in Dallas, TX", "Plumber in Plano, TX"
  type: "home" | "about" | "services" | "contact" | "faq" | "service-areas" | "individual-service" | "individual-area" | "custom";
  serviceName?: string;
  areaName?: string;
  description?: string;
}

export interface WebsiteFormData {
  businessName: string;
  businessType: string;
  businessDescription?: string;
  yearsInBusiness?: string;
  uniqueSellingPoints?: string;
  servicesOffered?: string;
  services?: string[];
  streetAddress?: string;
  city: string;
  stateRegion?: string;
  zipPostalCode?: string;
  country?: string;
  serviceAreas?: string;
  serviceAreasList?: string[];
  phone?: string;
  email?: string;
  businessHours?: string;
  websiteDomain?: string;
  targetKeywords: string;
  pagesToCreate?: string[];
  separateServicePages?: boolean;
  separateAreaPages?: boolean;
  brandColors?: string;
  styleTone?: string;
  googleMaps?: string;
  socialLinks?: string;
  logoUrl?: string;
  language?: string;
  theme?: {
    id: string;
    name: string;
    description?: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      surface: string;
      text: string;
      muted: string;
    };
    fonts: {
      heading: string;
      body: string;
    };
    borderRadius: string;
    buttonStyle: string;
    heroStyle: string;
    sectionStyle: string;
    designNotes: string;
  };
  extraInstructions?: string;
}

/**
 * Turns arbitrary text into a URL-safe, clean kebab-case slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^\w\s-]/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Extracts a concise business industry keyword slug (e.g. "plumber", "electrician", "hvac")
 */
export function getBusinessKeywordSlug(bizType: string): string {
  const clean = bizType.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  if (clean.includes("plumb")) return "plumber";
  if (clean.includes("electric")) return "electrician";
  if (clean.includes("roof")) return "roofing";
  if (clean.includes("hvac") || clean.includes("heat") || clean.includes("cool") || clean.includes("air")) return "hvac";
  if (clean.includes("clean") || clean.includes("maid")) return "cleaning";
  if (clean.includes("landscap") || clean.includes("lawn")) return "landscaping";
  if (clean.includes("dental") || clean.includes("dentist")) return "dentist";
  if (clean.includes("law") || clean.includes("attorney")) return "attorney";
  if (clean.includes("auto") || clean.includes("mechanic")) return "auto-repair";
  const firstWord = clean.split(/\s+/)[0];
  return slugify(firstWord || "service");
}

/**
 * Computes all target pages to generate based on form inputs and toggles
 */
export function computeTargetPages(data: WebsiteFormData): TargetPage[] {
  const targetMap = new Map<string, TargetPage>();

  // Always ensure index.html (Home) is first
  targetMap.set("index.html", {
    path: "index.html",
    title: `Home | ${data.businessName}`,
    type: "home",
    description: "Main conversion landing page with local hero, services grid, why choose us, trust proof, service areas, FAQ accordion, and contact trigger.",
  });

  const selectedPages = Array.isArray(data.pagesToCreate) && data.pagesToCreate.length > 0
    ? data.pagesToCreate
    : ["Home", "About", "Services", "Contact", "FAQ", "Service Areas"];

  for (const p of selectedPages) {
    const lower = p.toLowerCase().trim();
    if (lower === "home") continue; // already added

    if (lower.includes("about")) {
      targetMap.set("about.html", {
        path: "about.html",
        title: `About Us | ${data.businessName}`,
        type: "about",
        description: "Company story, core values, master credentials, licensed technicians, community involvement, and local trust.",
      });
    } else if (lower === "services" || lower === "all services") {
      targetMap.set("services.html", {
        path: "services.html",
        title: `Services | ${data.businessName}`,
        type: "services",
        description: "Comprehensive services directory with detailed breakdowns of all capabilities, pricing transparency, and booking CTAs.",
      });
    } else if (lower.includes("contact")) {
      targetMap.set("contact.html", {
        path: "contact.html",
        title: `Contact Us | ${data.businessName}`,
        type: "contact",
        description: "Interactive quote request form, phone click-to-call, direct dispatch email, business hours, and Google Map embed.",
      });
    } else if (lower.includes("faq")) {
      targetMap.set("faq.html", {
        path: "faq.html",
        title: `FAQ | ${data.businessName}`,
        type: "faq",
        description: "Frequently asked questions covering emergency response times, pricing, warranties, licensing, and preparation tips with FAQPage schema.",
      });
    } else if (lower.includes("service area") || lower.includes("locations") || lower.includes("areas")) {
      targetMap.set("service-areas.html", {
        path: "service-areas.html",
        title: `Service Areas | ${data.businessName}`,
        type: "service-areas",
        description: "Coverage map and directory of all serviced cities, neighborhoods, travel radius, and response guarantees.",
      });
    } else {
      const slug = slugify(p);
      if (slug && !targetMap.has(`${slug}.html`)) {
        targetMap.set(`${slug}.html`, {
          path: `${slug}.html`,
          title: `${p} | ${data.businessName}`,
          type: "custom",
          description: `Custom page for ${p}.`,
        });
      }
    }
  }

  // 1. Separate page per service toggle
  if (data.separateServicePages) {
    const rawServices: string[] = [];
    if (Array.isArray(data.services) && data.services.length > 0) {
      rawServices.push(...data.services);
    } else if (data.servicesOffered?.trim()) {
      rawServices.push(...data.servicesOffered.split(/[\n,]+/).map(s => s.trim()).filter(Boolean));
    }

    const uniqueServices = Array.from(new Set(rawServices)).slice(0, 8);
    for (const service of uniqueServices) {
      let slug = slugify(service);
      // Clean up common numerical / duration prefixes if they make slug awkward
      if (slug.startsWith("24-7-emergency-")) {
        slug = slug.replace(/^24-7-/, "");
      } else if (slug.startsWith("24-7-")) {
        slug = slug.replace(/^24-7-/, "emergency-");
      }
      const path = `${slug}.html`;

      if (!targetMap.has(path) && path !== "services.html") {
        targetMap.set(path, {
          path,
          title: `${service} in ${data.city || "Local Area"} | ${data.businessName}`,
          type: "individual-service",
          serviceName: service,
          description: `Dedicated landing page for ${service}: 400+ words of rich copy, step-by-step process, common issues solved, pricing guide, and service-specific FAQ and schema.`,
        });
      }
    }
  }

  // 2. Page per service area toggle
  if (data.separateAreaPages) {
    const rawAreas: string[] = [];
    if (Array.isArray(data.serviceAreasList) && data.serviceAreasList.length > 0) {
      rawAreas.push(...data.serviceAreasList);
    } else if (data.serviceAreas?.trim()) {
      rawAreas.push(...data.serviceAreas.split(/[\n,]+/).map(a => a.trim()).filter(Boolean));
    }

    const bizSlug = getBusinessKeywordSlug(data.businessType || "contractor");
    const uniqueAreas = Array.from(new Set(rawAreas)).slice(0, 8);

    for (const area of uniqueAreas) {
      const areaSlug = slugify(area);
      // e.g. "plumber-plano.html" as requested by user
      const path = `${bizSlug}-${areaSlug}.html`;

      if (!targetMap.has(path) && path !== "service-areas.html") {
        targetMap.set(path, {
          path,
          title: `${data.businessType || "Contractor"} in ${area}, ${data.stateRegion || ""} | ${data.businessName}`,
          type: "individual-area",
          areaName: area,
          description: `Dedicated local area landing page for ${area}: unique localized copy highlighting service in ${area}, neighborhood references, fast local dispatch times, and customer reviews.`,
        });
      }
    }
  }

  return Array.from(targetMap.values());
}

/**
 * Builds the complete, comprehensive user prompt with all form details clearly labeled
 */
export function buildUserPrompt(data: WebsiteFormData, targetPages?: TargetPage[]): string {
  const pages = targetPages || computeTargetPages(data);
  const lines: string[] = [];

  lines.push("Please build a complete, multi-page static website for the following local business.");
  lines.push("All details and theme settings are strictly specified below:\n");

  // === 1. BUSINESS INFORMATION ===
  lines.push("=== 1. BUSINESS INFORMATION ===");
  lines.push(`- Business Name: ${data.businessName.trim()}`);
  lines.push(`- Business Type / Industry: ${data.businessType.trim()}`);
  if (data.businessDescription?.trim()) {
    lines.push(`- Business Description: ${data.businessDescription.trim()}`);
  }
  if (data.yearsInBusiness?.trim()) {
    lines.push(`- Years in Business: ${data.yearsInBusiness.trim()}`);
  }
  if (data.uniqueSellingPoints?.trim()) {
    lines.push(`- Unique Selling Points & Trust Guarantees: ${data.uniqueSellingPoints.trim()}`);
  }

  const servicesList = (Array.isArray(data.services) && data.services.length > 0)
    ? data.services
    : (data.servicesOffered?.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) || []);
  if (servicesList.length > 0) {
    lines.push("- Core Services Offered:");
    servicesList.forEach((s, idx) => lines.push(`    ${idx + 1}. ${s}`));
  } else if (data.servicesOffered?.trim()) {
    lines.push(`- Services Offered: ${data.servicesOffered.trim()}`);
  }

  if (data.phone?.trim()) lines.push(`- Phone Number: ${data.phone.trim()} (MUST use click-to-call link <a href="tel:${data.phone.trim()}">)`);
  if (data.email?.trim()) lines.push(`- Email Address: ${data.email.trim()}`);
  if (data.businessHours?.trim()) lines.push(`- Business Hours: ${data.businessHours.trim()}`);
  if (data.websiteDomain?.trim()) lines.push(`- Website Domain: ${data.websiteDomain.trim()}`);

  // === 2. LOCATION & GEOGRAPHY ===
  lines.push("\n=== 2. LOCATION & GEOGRAPHY ===");
  const addressParts = [data.streetAddress, data.city, data.stateRegion, data.zipPostalCode, data.country]
    .filter(Boolean)
    .map(s => s?.trim())
    .filter(Boolean);
  if (addressParts.length > 0) lines.push(`- Full Physical Address: ${addressParts.join(", ")}`);
  lines.push(`- Primary City: ${data.city.trim()}`);
  if (data.stateRegion?.trim()) lines.push(`- State / Region: ${data.stateRegion.trim()}`);
  if (data.zipPostalCode?.trim()) lines.push(`- ZIP / Postal Code: ${data.zipPostalCode.trim()}`);
  if (data.country?.trim()) lines.push(`- Country: ${data.country.trim()}`);
  if (data.googleMaps?.trim()) lines.push(`- Google Maps Link or Embed: ${data.googleMaps.trim()}`);

  // === 3. SERVICE AREAS ===
  lines.push("\n=== 3. SERVICE AREAS (COVERAGE) ===");
  const areasList = (Array.isArray(data.serviceAreasList) && data.serviceAreasList.length > 0)
    ? data.serviceAreasList
    : (data.serviceAreas?.split(/[\n,]+/).map(a => a.trim()).filter(Boolean) || []);
  if (areasList.length > 0) {
    lines.push(`- Covered Cities / Neighborhoods: ${areasList.join(", ")}`);
  } else if (data.serviceAreas?.trim()) {
    lines.push(`- Service Areas: ${data.serviceAreas.trim()}`);
  }

  // === 4. LOCAL SEO TARGET KEYWORDS ===
  lines.push("\n=== 4. LOCAL SEO TARGET KEYWORDS ===");
  lines.push(`- Target Keywords: ${data.targetKeywords.trim()}`);
  lines.push("- Instruction: Integrate these keywords naturally into <title>, meta descriptions, H1/H2 headings, intro copy, and image alt text. Never keyword-stuff.");

  // === 5. WEBSITE ARCHITECTURE & PAGES TO GENERATE ===
  lines.push("\n=== 5. WEBSITE ARCHITECTURE & PAGES TO GENERATE ===");
  lines.push(`- Separate Landing Page per Service Toggle: ${data.separateServicePages ? "ENABLED (YES)" : "DISABLED (NO)"}`);
  lines.push(`- Dedicated Landing Page per Service Area Toggle: ${data.separateAreaPages ? "ENABLED (YES)" : "DISABLED (NO)"}`);
  lines.push(`- Total Pages to Generate: ${pages.length} pages`);
  lines.push("- EXACT LIST OF HTML FILES TO PRODUCE:");
  for (const page of pages) {
    lines.push(`    • [${page.path}]: "${page.title}" (${page.type}) - ${page.description || ""}`);
  }

  lines.push("\nNAVIGATION & INTERNAL LINKING REQUIREMENTS:");
  lines.push("1. Shared Header & Navigation Bar:");
  lines.push("   - All pages must have the EXACT SAME navigation bar structure.");
  lines.push("   - Primary links: Home (index.html), About (about.html), Contact (contact.html).");
  const serviceSubpages = pages.filter(p => p.type === "individual-service");
  if (serviceSubpages.length > 0) {
    lines.push("   - Services Dropdown Menu: Group services into a dropdown menu in the desktop navigation:");
    lines.push('     <li class="nav-dropdown"><a href="services.html">Services ▾</a><ul class="dropdown-menu">');
    serviceSubpages.forEach(sp => lines.push(`       <li><a href="${sp.path}">${sp.serviceName || sp.title}</a></li>`));
    lines.push("     </ul></li>");
  } else if (pages.some(p => p.path === "services.html")) {
    lines.push('   - Services Link: <a href="services.html">Services</a>');
  }

  const areaSubpages = pages.filter(p => p.type === "individual-area");
  if (areaSubpages.length > 0) {
    lines.push("   - Service Areas Dropdown Menu: Group service area pages into a dropdown menu:");
    lines.push('     <li class="nav-dropdown"><a href="service-areas.html">Locations ▾</a><ul class="dropdown-menu">');
    areaSubpages.forEach(ap => lines.push(`       <li><a href="${ap.path}">${ap.areaName || ap.title}</a></li>`));
    lines.push("     </ul></li>");
  } else if (pages.some(p => p.path === "service-areas.html")) {
    lines.push('   - Service Areas Link: <a href="service-areas.html">Service Areas</a>');
  }

  lines.push("   - Prominent Call to Action button in header (e.g. \"Call Now\" or \"Get Free Estimate\").");
  lines.push("   - Working mobile hamburger menu with smooth toggle for mobile viewports.");
  lines.push("   - Sticky \"Call Now\" bar fixed to the bottom of the screen on mobile devices only.");
  lines.push("2. Relative Links:");
  lines.push("   - All internal links between pages MUST use exact relative filenames (e.g. href=\"about.html\", href=\"drain-cleaning.html\", href=\"plumber-plano.html\", href=\"contact.html\").");
  lines.push("3. Sitemap & Robots:");
  lines.push("   - sitemap.xml must list every generated HTML file using the full domain (e.g. https://" + (data.websiteDomain || "www.example.com") + "/page.html).");
  lines.push("   - robots.txt must allow all crawlers and point to the sitemap URL.");

  // === 6. DESIGN THEME SPECIFICATIONS ===
  if (data.theme) {
    const t = data.theme;
    lines.push("\n=== 6. DESIGN THEME SPECIFICATIONS ===");
    lines.push(`- Active Theme: ${t.name}${t.description ? ` (${t.description})` : ""}`);
    lines.push("- Hex Color Palette:");
    lines.push(`    • Primary: ${t.colors.primary}`);
    lines.push(`    • Secondary: ${t.colors.secondary}`);
    lines.push(`    • Accent: ${t.colors.accent}`);
    lines.push(`    • Background: ${t.colors.background}`);
    lines.push(`    • Surface / Cards: ${t.colors.surface}`);
    lines.push(`    • Text: ${t.colors.text}`);
    lines.push(`    • Muted Text / Borders: ${t.colors.muted}`);
    lines.push("- Google Fonts Typography:");
    lines.push(`    • Heading Font: "${t.fonts.heading}", sans-serif`);
    lines.push(`    • Body Font: "${t.fonts.body}", sans-serif`);
    lines.push(`- Border Radius: ${t.borderRadius}`);
    lines.push(`- Button Style: ${t.buttonStyle}`);
    lines.push(`- Hero Style: ${t.heroStyle}`);
    lines.push(`- Section Style: ${t.sectionStyle}`);
    lines.push(`- Design Notes: ${t.designNotes}`);
    lines.push("\nMANDATORY STYLES.CSS & HEAD REQUIREMENTS:");
    lines.push("1. In styles.css, define ALL theme colors, fonts, and radius as CSS variables in :root:");
    lines.push("   :root {");
    lines.push(`     --color-primary: ${t.colors.primary};`);
    lines.push(`     --color-secondary: ${t.colors.secondary};`);
    lines.push(`     --color-accent: ${t.colors.accent};`);
    lines.push(`     --color-background: ${t.colors.background};`);
    lines.push(`     --color-surface: ${t.colors.surface};`);
    lines.push(`     --color-text: ${t.colors.text};`);
    lines.push(`     --color-muted: ${t.colors.muted};`);
    lines.push(`     --font-heading: '${t.fonts.heading}', sans-serif;`);
    lines.push(`     --font-body: '${t.fonts.body}', sans-serif;`);
    lines.push(`     --radius: ${t.borderRadius};`);
    lines.push("   }");
    lines.push(`2. In the <head> of EVERY HTML file, include Google Fonts <link> tags loading "${t.fonts.heading}" and "${t.fonts.body}".`);
    lines.push("3. Apply the theme's button style, hero treatment, card elevations, and section rhythm faithfully.");
  } else {
    if (data.brandColors?.trim()) lines.push(`\nBRAND COLORS: ${data.brandColors.trim()}`);
    if (data.styleTone?.trim()) lines.push(`STYLE & TONE: ${data.styleTone.trim()}`);
  }

  // === 7. ADDITIONAL ASSETS & SETTINGS ===
  lines.push("\n=== 7. ADDITIONAL ASSETS & SETTINGS ===");
  if (data.logoUrl?.trim()) {
    lines.push(`- Logo Image URL: ${data.logoUrl.trim()} (Display in header and schema)`);
  } else {
    lines.push(`- Logo: No image provided. Render a crisp, elegant inline SVG badge or stylized text logo with icon.`);
  }
  if (data.socialLinks?.trim()) lines.push(`- Social Media Links: ${data.socialLinks.trim()}`);
  if (data.language?.trim() && data.language.trim().toLowerCase() !== "english") {
    lines.push(`- Website Language: ${data.language.trim()} (Generate all titles, copy, buttons, and schema in ${data.language.trim()})`);
  }
  if (data.extraInstructions?.trim()) {
    lines.push(`- Extra Instructions: ${data.extraInstructions.trim()}`);
  }

  lines.push("\nOUTPUT INSTRUCTION: Output ONLY the single raw JSON object matching { \"files\": [ { \"path\": \"...\", \"content\": \"...\" } ] } with no markdown code fences and no preamble.");

  return lines.join("\n");
}

/**
 * Builds a prompt for generating one individual sub-page when using page-by-page generation
 */
export function buildSinglePagePrompt(
  data: WebsiteFormData,
  page: TargetPage,
  sharedHeader: string,
  sharedFooter: string,
  fontHeadTags: string,
  mobileCallBar: string
): string {
  const lines: string[] = [];

  lines.push(`Generate ONE complete static HTML page: "${page.path}" for the website of ${data.businessName} in ${data.city}, ${data.stateRegion || ""}.`);
  lines.push(`Page Subject / Role: "${page.title}" (${page.type})`);
  if (page.description) lines.push(`Page Description: ${page.description}`);

  lines.push("\nCRITICAL PAGE-BY-PAGE CONSISTENCY RULES:");
  lines.push(`1. Include the exact Google Fonts in <head>:\n${fontHeadTags}`);
  lines.push('2. Link to shared CSS and JS: <link rel="stylesheet" href="styles.css"> and <script src="script.js" defer></script>.');
  lines.push(`3. Use the EXACT shared <header> HTML provided below so header navigation and dropdowns match 100%:\n${sharedHeader}`);
  lines.push(`4. Use the EXACT shared <footer> HTML provided below:\n${sharedFooter}`);
  if (mobileCallBar) {
    lines.push(`5. Include the mobile sticky call bar before </body>:\n${mobileCallBar}`);
  }
  lines.push(`6. Inside <main>, produce 400+ words of rich, original, conversion-optimized content tailored specifically to ${page.title}:`);
  lines.push("   - Unique <title> (under 60 chars) and meta description (under 160 chars with city + CTA).");
  lines.push(`   - Breadcrumb navigation: Home > ${page.title}`);
  lines.push(`   - Page hero section with H1, localized subtitle, and phone CTA.`);
  lines.push("   - Detailed sections with icons, benefits, clear explanations, and localized references.");
  lines.push("   - Internal links back to relevant services, service areas, and contact.html.");
  lines.push("   - Appropriate Schema.org JSON-LD (Service, FAQPage, or BreadcrumbList schema).");
  lines.push("   - Strong pre-footer Call-to-Action banner.");
  lines.push(`7. Respond ONLY with valid JSON: { "files": [ { "path": "${page.path}", "content": "<!DOCTYPE html>..." } ] }`);

  return lines.join("\n");
}
