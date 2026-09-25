import { WebsiteFormData, TargetPage, computeTargetPages, slugify, getBusinessKeywordSlug } from "./prompt";
import { SiteContentJSON } from "./content-schema";
import { detectTradeCategory } from "../photos/photo-service";
import { findNicheByIndustry } from "../../niches";

export const AI_CONTENT_SYSTEM_PROMPT = `You are an expert local-business copywriter and local SEO strategist. You write website content for local service businesses (plumbers, electricians, tree services, etc.) that ranks in local Google search and turns visitors into phone calls.

You DO NOT write HTML or CSS. You return ONLY valid JSON in the exact format given — no markdown, no code fences, no commentary. The app turns your JSON into a designed website.

GOOGLE POLICY RULES (strict):
- NEVER write reviews, testimonials, customer names, or quotes. The app handles reviews separately.
- NEVER invent facts: years in business, license numbers, awards, response times, or guarantees. Only use what the user provided.
- If the business has no storefront, do not include a street address.
- Service area pages must have 100% unique text with genuinely different angles — no template copying.
- No unbacked claims: do NOT write "#1", "top-rated", "5-star", "best in [city]" unless instructed.

CONTENT RULES
- Write specifically for THIS business, THIS trade, and THIS city. Use the niche knowledge provided (services, pain points, trust signals, process).
- Every page must have 100% unique content. Never repeat the same sentences or paragraphs across pages.
- Service area pages: each one must be genuinely different — change the angle, examples, and structure, mention the area naturally, and relate services to local situations (home types, weather, seasons) only when generally true for that region. Never just swap the city name.
- Sound human, confident, and helpful. Short paragraphs, clear benefits, active voice. No clichés like "look no further", "in today's fast-paced world", "one-stop shop", "we pride ourselves".
- Never invent facts: no fake awards, license numbers, review counts, prices, or years in business. Only use claims from the provided details. Where helpful, use safe general claims (e.g. "locally owned", "upfront pricing", "free estimates" only if stated).
- REVIEWS & TESTIMONIALS: DO NOT write reviews or testimonials. The application handles reviews separately using verified customer data or Google Review links.
- Each service page: 500+ words covering what the service is, signs you need it, what's included, the process, why choose this business, and 3–4 service-specific FAQs.
- Each service area page: 400+ words.
- Home page: strong hero headline with main service + city, clear value, and calls to action throughout.

LOCAL SEO RULES
- Put the primary keyword + city in: SEO title, H1, first paragraph, and at least one heading. Use secondary keywords naturally across pages. Never keyword-stuff (keep any single keyword under ~2% of the text).
- SEO title under 60 characters: "Primary Keyword in City | Business Name". Meta description under 155 characters with the city and a call to action.
- Use internal links: mention related services and service areas by name so the app can link them.
- Alt text for every image: describe the photo + service + city, naturally.

DESIGN CHOICES (you pick, the app renders)
- Choose section order and variants from the available list to fit the niche (e.g. emergencyBanner for plumbers and locksmiths, gallery for landscaping and painting, process for roofing).
- Choose image search queries that are realistic and specific to the trade (e.g. "electrician installing panel" not "electricity"). Avoid queries that return people's faces for the team section unless the business provided photos.

EXACT JSON FORMAT TO RETURN:
{
  "site": {
    "businessName": "Exact Business Name",
    "tagline": "Compelling local tagline with city",
    "phone": "(555) 123-4567",
    "email": "contact@business.com",
    "address": { "street": "123 Main St", "city": "City", "state": "ST", "zip": "12345", "country": "USA" },
    "hours": ["Monday - Sunday: 24/7 Emergency Dispatch"],
    "serviceAreas": ["City 1", "City 2", "City 3"],
    "social": { "facebook": "", "instagram": "" },
    "nav": [
      { "label": "Home", "slug": "index" },
      { "label": "About", "slug": "about" },
      { "label": "Services", "slug": "services" },
      { "label": "Service Areas", "slug": "service-areas" },
      { "label": "FAQ", "slug": "faq" },
      { "label": "Contact", "slug": "contact" }
    ]
  },
  "pages": [
    {
      "slug": "index",
      "seo": {
        "title": "Primary Keyword in City | Business Name",
        "description": "Compelling meta description under 155 chars including city and phone CTA.",
        "h1": "Trusted Service in City, ST",
        "primaryKeyword": "emergency plumber dallas",
        "ogDescription": "Fast dispatch across the area."
      },
      "sections": [
        {
          "type": "emergencyBanner",
          "content": { "text": "24/7 Priority Emergency Service Available in City" }
        },
        {
          "type": "hero",
          "variant": "split",
          "content": {
            "eyebrow": "Local Trade Specialists",
            "h1": "Trusted Plumber in Dallas, TX",
            "subheadline": "Upfront pricing, fast dispatch, and guaranteed workmanship on every repair.",
            "primaryCta": "Call (214) 555-0198",
            "secondaryCta": "Get a Free Quote",
            "secondaryUrl": "contact.html",
            "trustBadges": ["Locally Owned & Operated", "Upfront Pricing", "Guaranteed Workmanship"]
          },
          "images": [
            { "slot": "main", "query": "plumber fixing kitchen sink", "alt": "Plumber repairing a sink in Dallas home" }
          ]
        },
        { "type": "trustBar", "content": {} },
        {
          "type": "services",
          "variant": "cards",
          "content": {
            "eyebrow": "Our Capabilities",
            "headline": "Full-Service Residential & Commercial Solutions",
            "subheadline": "Every job handled cleanly by certified technicians.",
            "items": [
              { "title": "Emergency Repairs", "description": "Rapid response for sudden leaks and pipe bursts.", "slug": "services" },
              { "title": "Drain Clearing", "description": "High-pressure hydro-jetting to clear stubborn clogs.", "slug": "services" }
            ]
          }
        },
        {
          "type": "stats",
          "content": {
            "stats": [
              { "number": "100%", "label": "Satisfaction Guarantee" },
              { "number": "Fast", "label": "Local Response" }
            ]
          }
        },
        { "type": "whyUs", "content": {} },
        { "type": "process", "content": {} },
        { "type": "serviceAreas", "content": {} },
        { "type": "faq", "content": {} },
        { "type": "ctaBanner", "variant": "gradient", "content": {} },
        { "type": "contactForm", "content": {} }
      ]
    }
  ],
  "schema": {
    "type": "Plumber",
    "priceRange": "$$"
  }
}

AVAILABLE SECTION TYPES & VARIANTS TO CHOOSE:
- header (rendered automatically by app)
- emergencyBanner: content: { text: "..." } (only if niche offers emergency services)
- hero: variants: "split", "fullImage", "centered" | content: { eyebrow, h1, subheadline, primaryCta, secondaryCta, secondaryUrl, trustBadges: string[] } | images: [{ slot: "main", query, alt }]
- trustBar: content: { badges?: [{ icon, label, subtext }] }
- services: variants: "cards", "icons", "alternating" | content: { eyebrow, headline, subheadline, items: [{ title, description, icon?, slug }] }
- stats: content: { stats: [{ number, label }] } (metrics strictly derived from provided details)
- about: variants: "split", "collage" | content: { eyebrow, headline, story, highlights: string[], values: string[] } | images: [{ slot: "main", query, alt }]
- whyUs: content: { eyebrow, headline, subheadline, reasons: [{ title, description, icon? }] } (4-6 benefit cards)
- process: content: { eyebrow, headline, steps: [{ step: 1, title, description }] } (3-4 numbered steps from niche process)
- gallery: content: { eyebrow, headline, items: [{ title, category, query, alt }] } (photo grid with lightbox)
- serviceAreas: content: { eyebrow, headline, description, areas: string[], guarantees: string[] } (list/grid of areas with map)
- testimonials: (rendered automatically by app only if user verified real reviews or Google Review link; DO NOT write quotes or names)
- faq: content: { eyebrow, headline, questions: [{ q, a }] } (accessible accordion with trade-specific Q&As)
- ctaBanner: variants: "gradient", "photo" | content: { headline, subheadline, buttonText, phone }
- contactForm: content: { headline, subheadline, formHeadline, address, phone, email, hours }
- footer (rendered automatically by app)
- mobileCallBar (rendered automatically by app)
`;

export const QUALITY_REVIEW_SYSTEM_PROMPT = `You are a meticulous local-business editor and senior local SEO strategist.
Your job is to perform a rigorous "Quality Review" second-pass audit on website content JSON generated for a local service business.

You DO NOT write HTML or CSS. You return ONLY the corrected, perfected JSON in the exact same format given — no markdown, no code fences, no commentary.

AUDIT & CORRECTION TASKS:
1. FIND & FIX REPEATED SENTENCES ACROSS PAGES:
   - Check every page (Home, About, Services, Service Areas, FAQs, etc.).
   - If any sentences, paragraphs, or introductory phrases are repeated across pages, rewrite them so that 100% of the content is unique.
   - For Service Area pages: make sure each one is genuinely different in angle, examples, and structure. Relate services to local situations (home types, weather, seasons) only when generally true. Never just swap the city name.
2. ELIMINATE GENERIC FILLER & CLICHÉS:
   - Remove clichés like "look no further", "in today's fast-paced world", "one-stop shop", "we pride ourselves", "second to none".
   - Replace with human, confident, active, benefit-driven copy.
3. AUDIT & REMOVE INVENTED FACTS & UNBACKED CLAIMS (STRICT GOOGLE POLICY):
   - Strictly remove unbacked banned phrases: "#1", "top-rated", "5-star", "five-star", "500+ reviews", "500+ happy customers", "best in [city]" unless provided in user details or allowed claims.
   - Remove any fake awards, invented license numbers, hallucinated prices, or unverified claims.
   - Replace them with safe general claims (e.g. "locally owned", "upfront pricing", "free estimates" only if stated).
4. REVIEWS & TESTIMONIALS CLEANUP:
   - If any AI-generated reviews, testimonials, customer names, or quotes were generated, REMOVE them completely. The application injects verified reviews or a Google review CTA separately.
5. SERVICE-AREA BUSINESS ADDRESS COMPLIANCE:
   - If the business model is a service-area business (travels to customers, no storefront), ensure NO street address appears anywhere in the content or address object.
6. VERIFY LOCAL SEO & TARGET KEYWORDS:
   - Ensure the primary keyword and city are naturally present in the SEO title, H1, first paragraph, and at least one section heading.
   - Ensure SEO title is under 60 characters ("Primary Keyword in City | Business Name") and meta description under 155 characters with a clear phone call-to-action.
   - Ensure keyword density remains under 2% for any phrase.
7. PAGE WORD COUNT & DEPTH:
   - Ensure service pages have 500+ words of depth (what it is, signs you need it, process, FAQs).
   - Ensure service area pages have 400+ words.

OUTPUT FORMAT:
Respond with ONLY valid JSON matching the exact schema. No markdown code blocks, no preamble, no postscript.`;

/**
 * Builds the user prompt requesting content JSON
 */
export function buildAIContentPrompt(formData: WebsiteFormData, targetPages?: TargetPage[]): string {
  const pages = targetPages || computeTargetPages(formData);
  const niche = findNicheByIndustry(formData.businessType);
  const themeName = formData.theme?.name || (formData.styleTone ? formData.styleTone.split("-")[0].trim() : "Modern Pro");
  const isServiceArea = formData.businessModel === "service-area";
  const lines: string[] = [];

  lines.push("Please generate the structured content JSON for this local service business website:");
  lines.push("");

  // === STRICT GOOGLE COMPLIANCE RULES ===
  lines.push("=== STRICT GOOGLE COMPLIANCE RULES ===");
  lines.push("- NEVER write reviews, testimonials, customer names, or quotes. The app handles reviews separately.");
  lines.push("- NEVER invent facts: years in business, license numbers, awards, response times, or guarantees. Only use what the user provided.");
  if (isServiceArea) {
    lines.push("- SERVICE-AREA BUSINESS (NO STOREFRONT): DO NOT include a street address anywhere in text, contact, or address objects. Use 'Serving [City] and surrounding areas'.");
  }
  lines.push("- Service area pages must have 100% unique text with genuinely different angles — no template copying.");
  lines.push("- No unbacked claims: do NOT write '#1', 'top-rated', '5-star', '500+ reviews', 'best in [city]' unless explicitly provided in Allowed Claims.");
  lines.push("");

  // === 1. BUSINESS DETAILS & CONFIRMED FACTS ===
  lines.push("=== 1. BUSINESS DETAILS & CONFIRMED FACTS ===");
  lines.push(`- Business Name: ${formData.businessName}`);
  lines.push(`- Trade / Industry: ${formData.businessType}`);
  lines.push(`- Business Model: ${isServiceArea ? "Service-Area Business (travels to customers, NO public storefront)" : "Storefront / Office (customers visit location)"}`);
  if (formData.businessDescription) lines.push(`- Business Description: ${formData.businessDescription}`);
  if (formData.yearsInBusiness) lines.push(`- Confirmed Years in Business: ${formData.yearsInBusiness}`);
  if (formData.licenseNumber) lines.push(`- Confirmed License Number: ${formData.licenseNumber}`);
  if (formData.certifications) lines.push(`- Confirmed Certifications: ${formData.certifications}`);
  if (formData.warrantyGuarantee) lines.push(`- Confirmed Warranty/Guarantee: ${formData.warrantyGuarantee}`);
  if (formData.responseTime) lines.push(`- Confirmed Response Time: ${formData.responseTime}`);
  if (formData.emergency247 !== undefined) lines.push(`- 24/7 Emergency Service: ${formData.emergency247 ? "YES" : "NO"}`);
  if (formData.freeEstimates !== undefined) lines.push(`- Free Estimates: ${formData.freeEstimates ? "YES" : "NO"}`);
  if (formData.insuredBonded !== undefined) lines.push(`- Insured & Bonded: ${formData.insuredBonded ? "YES" : "NO"}`);
  if (formData.ownerName) lines.push(`- Business Owner: ${formData.ownerName}${formData.ownerBio ? ` (${formData.ownerBio})` : ""}`);
  if (formData.allowedClaims && formData.allowedClaims.length > 0) {
    lines.push(`- User-Verified Allowed Claims: ${formData.allowedClaims.join(", ")}`);
  }
  if (formData.uniqueSellingPoints) lines.push(`- Unique Selling Points: ${formData.uniqueSellingPoints}`);
  const services = formData.services || (formData.servicesOffered ? formData.servicesOffered.split(",") : []);
  if (services.length > 0) lines.push(`- Core Services Offered: ${services.join(", ")}`);
  if (formData.phone) lines.push(`- Phone Number: ${formData.phone} (MUST be used for all click-to-call CTAs)`);
  if (formData.email) lines.push(`- Email Address: ${formData.email}`);
  if (formData.businessHours) lines.push(`- Business Hours: ${formData.businessHours}`);
  if (formData.websiteDomain) lines.push(`- Website Domain: ${formData.websiteDomain}`);

  // === 2. LOCATION & GEOGRAPHY ===
  lines.push("");
  lines.push("=== 2. LOCATION & GEOGRAPHY ===");
  if (!isServiceArea) {
    const addressParts = [formData.streetAddress, formData.city, formData.stateRegion, formData.zipPostalCode, formData.country]
      .filter(Boolean)
      .map((s) => s?.trim())
      .filter(Boolean);
    if (addressParts.length > 0) lines.push(`- Physical Address: ${addressParts.join(", ")}`);
  } else {
    lines.push(`- Address Rule: Service-area business — OMIT street address. Serving ${formData.city} and surrounding areas.`);
  }
  lines.push(`- Primary City: ${formData.city}`);
  if (formData.stateRegion) lines.push(`- State / Region: ${formData.stateRegion}`);
  if (formData.zipPostalCode) lines.push(`- ZIP / Postal Code: ${formData.zipPostalCode}`);
  if (formData.country) lines.push(`- Country: ${formData.country}`);
  if (!isServiceArea && formData.googleMaps) lines.push(`- Google Maps Link: ${formData.googleMaps}`);

  // === 3. SERVICE AREAS ===
  lines.push("");
  lines.push("=== 3. SERVICE AREAS ===");
  const areasList = formData.serviceAreasList || (formData.serviceAreas ? formData.serviceAreas.split(/[\n,]+/).map((a) => a.trim()).filter(Boolean) : []);
  if (areasList.length > 0) {
    lines.push(`- Covered Areas & Suburbs: ${areasList.join(", ")}`);
  } else if (formData.serviceAreas) {
    lines.push(`- Service Areas: ${formData.serviceAreas}`);
  }

  // === 4. LOCAL SEO TARGET KEYWORDS ===
  lines.push("");
  lines.push("=== 4. LOCAL SEO TARGET KEYWORDS ===");
  lines.push(`- Target Keywords: ${formData.targetKeywords}`);
  lines.push(`- Instruction: Place primary keyword + city in title, H1, first paragraph, and at least one heading. Keep any single keyword under ~2% of the text. Title under 60 chars: "Primary Keyword in City | Business Name". Meta description under 155 chars with phone CTA.`);

  // === 5. PAGES LIST TO GENERATE ===
  lines.push("");
  lines.push(`=== 5. PAGES LIST TO GENERATE (${pages.length} total pages) ===`);
  for (const page of pages) {
    const slug = page.path.replace(/\.html$/, "");
    let requirement = "";
    if (page.type === "home") requirement = "500+ words, strong hero headline with main service + city, value points, CTAs throughout";
    else if (page.type === "services" || page.type === "individual-service") requirement = "500+ words: what it is, signs you need it, what's included, the process, why choose this business, and 3-4 service FAQs";
    else if (page.type === "service-areas" || page.type === "individual-area") requirement = "400+ words: genuinely different angle, examples, structure, local context, never just swap city name";
    else requirement = "100% unique, human, helpful conversion copy";

    lines.push(`- slug: "${slug}" (${page.title}) [${page.type}] -> Requirement: ${requirement}`);
  }

  // === 6. THEME NAME & VISUAL STYLE ===
  lines.push("");
  lines.push("=== 6. THEME NAME & VISUAL STYLE ===");
  lines.push(`- Selected Theme Name: ${themeName}`);
  if (formData.theme?.description) lines.push(`- Theme Description: ${formData.theme.description}`);
  if (formData.brandColors) lines.push(`- Brand Palette: ${formData.brandColors}`);

  // === 7. THE NICHE PACK INTELLIGENCE ===
  lines.push("");
  lines.push(`=== NICHE PACK / INDUSTRY INTELLIGENCE (${niche.name.toUpperCase()}) ===`);
  lines.push(`- SCHEMA TYPE: ${niche.schemaType}`);
  lines.push(`- Emergency Trade: ${niche.emergencyService ? "YES (Include emergencyBanner and 24/7 priority response messaging)" : "NO"}`);
  lines.push(`- Recommended Sections: ${niche.recommendedSections.join(", ")}`);
  lines.push(`- KEY CUSTOMER PAIN POINTS TO SOLVE:`);
  niche.customerPainPoints.forEach((p, i) => lines.push(`    ${i + 1}. ${p}`));
  lines.push(`- Essential Trust Signals to Highlight:`);
  niche.trustSignals.forEach((t, i) => lines.push(`    ${i + 1}. ${t}`));
  lines.push(`- Standard Job Process:`);
  niche.processSteps.forEach((s) => lines.push(`    Step ${s.step}: ${s.title} — ${s.description}`));
  lines.push(`- Industry-Specific Customer FAQs:`);
  niche.faqTopics.slice(0, 8).forEach((f) => lines.push(`    Q: ${f.question} | Key takeaway: ${f.answerSummary}`));
  lines.push(`- Image Search Query Inspiration:`);
  lines.push(`    • Hero: ${niche.imageQueries.hero.join(", ")}`);
  lines.push(`    • Services: ${niche.imageQueries.services.join(", ")}`);
  lines.push(`    • Team/About: ${niche.imageQueries.team.join(", ")}`);
  lines.push(`    • Completed Work: ${niche.imageQueries.work.join(", ")}`);
  lines.push(`- Tone & Voice Notes: ${niche.toneNotes}`);

  // === 8. AVAILABLE SECTION TYPES & VARIANTS ===
  lines.push("");
  lines.push("=== 8. AVAILABLE SECTION TYPES & VARIANTS ===");
  lines.push("Available section types you may choose from (order and select them to fit the trade):");
  lines.push("- emergencyBanner: content: { text: string } (use if emergency trade)");
  lines.push("- hero: variants: 'split', 'fullImage', 'centered' | content: { eyebrow, h1, subheadline, primaryCta, secondaryCta, secondaryUrl, trustBadges } | images: [{ slot: 'main', query, alt }]");
  lines.push("- trustBar: content: { badges?: [{ icon, label, subtext }] }");
  lines.push("- services: variants: 'cards', 'icons', 'alternating' | content: { eyebrow, headline, subheadline, items: [{ title, description, icon?, slug }] }");
  lines.push("- stats: content: { stats: [{ number, label }] } (metrics strictly derived from provided details)");
  lines.push("- about: variants: 'split', 'collage' | content: { eyebrow, headline, story, highlights, values } | images: [{ slot: 'main', query, alt }]");
  lines.push("- whyUs: content: { eyebrow, headline, subheadline, reasons: [{ title, description, icon? }] }");
  lines.push("- process: content: { eyebrow, headline, steps: [{ step, title, description }] }");
  lines.push("- gallery: content: { eyebrow, headline, items: [{ title, category, query, alt }] }");
  lines.push("- serviceAreas: content: { eyebrow, headline, description, areas, guarantees }");
  lines.push("- faq: content: { eyebrow, headline, questions: [{ q, a }] }");
  lines.push("- ctaBanner: variants: 'gradient', 'photo' | content: { headline, subheadline, buttonText, phone }");
  lines.push("- contactForm: content: { headline, subheadline, formHeadline, address, phone, email, hours }");

  // === 9. EXACT JSON OUTPUT INSTRUCTION ===
  lines.push("");
  lines.push("=== 9. EXACT JSON OUTPUT INSTRUCTION ===");
  lines.push("Respond with ONLY valid JSON in the exact format specified in the system prompt. No markdown, no code fences, no commentary. Ensure every page has 100% unique content, service pages 500+ words, service area pages 400+ words, realistic image queries, and DO NOT generate fake reviews or quotes.");

  return lines.join("\n");
}

/**
 * Builds user prompt for the second Quality Review AI pass
 */
export function buildQualityReviewPrompt(
  currentJSON: SiteContentJSON,
  formData: WebsiteFormData
): string {
  const lines: string[] = [];
  lines.push("Please perform a Quality Review audit on this generated website content JSON, correcting all duplicate copy, generic filler, missing keywords, and invented facts.");
  lines.push("");
  lines.push("=== VERIFIED BUSINESS CONTEXT ===");
  lines.push(`- Business Name: ${formData.businessName}`);
  lines.push(`- Trade / Industry: ${formData.businessType}`);
  lines.push(`- Primary Location: ${formData.city}, ${formData.stateRegion || ""} ${formData.zipPostalCode || ""}`);
  if (formData.serviceAreas) lines.push(`- Service Areas: ${formData.serviceAreas}`);
  if (formData.targetKeywords) lines.push(`- Target SEO Keywords: ${formData.targetKeywords}`);
  if (formData.yearsInBusiness) lines.push(`- Verified Years in Business: ${formData.yearsInBusiness}`);
  if (formData.uniqueSellingPoints) lines.push(`- Verified Selling Points: ${formData.uniqueSellingPoints}`);
  lines.push("");
  lines.push("=== AUDIT INSTRUCTIONS ===");
  lines.push("1. Find and replace any repeated sentences or paragraphs across pages with 100% unique, fresh copy.");
  lines.push("2. Delete any generic filler and clichés ('look no further', 'in today's fast-paced world', 'one-stop shop', 'we pride ourselves').");
  lines.push("3. Verify that the primary keyword + city appears in SEO titles, H1s, and first paragraphs without keyword stuffing.");
  lines.push("4. Ensure all service area pages have distinct local angles, not just swapped city names.");
  lines.push("5. Remove any invented awards, fake license numbers, or hallucinated prices.");
  lines.push("6. Ensure testimonials have 'isPlaceholder': true.");
  lines.push("");
  lines.push("=== CURRENT CONTENT JSON TO AUDIT & RETURN PERFECTED ===");
  lines.push(JSON.stringify(currentJSON, null, 2));
  lines.push("");
  lines.push("Respond with ONLY the perfected, valid JSON object. No markdown code blocks.");
  return lines.join("\n");
}

/**
 * Generates instant, complete default structured content JSON for any trade
 * Used for demo testing or as an infallible fallback.
 */
export function buildDefaultTradeContentJSON(formData: WebsiteFormData, targetPages?: TargetPage[]): SiteContentJSON {
  const pages = targetPages || computeTargetPages(formData);
  const niche = findNicheByIndustry(formData.businessType);
  const tradeCategory = detectTradeCategory(formData.businessType);
  const isEmergencyTrade = niche.emergencyService;

  const bizName = formData.businessName || "Local Service Pros";
  const city = formData.city || "Dallas";
  const state = formData.stateRegion || "TX";
  const phone = formData.phone || "(555) 123-4567";
  const domain = (formData.websiteDomain || "www.example.com").replace(/^https?:\/\//, "");

  const servicesList = formData.services && formData.services.length > 0
    ? formData.services
    : formData.servicesOffered
    ? formData.servicesOffered.split(",").map((s) => s.trim()).filter(Boolean)
    : niche.commonServices.slice(0, 6);

  const areasList = formData.serviceAreasList && formData.serviceAreasList.length > 0
    ? formData.serviceAreasList
    : formData.serviceAreas
    ? formData.serviceAreas.split(",").map((a) => a.trim()).filter(Boolean)
    : [city, "Plano", "Frisco", "McKinney", "Irving", "Richardson"];

  // Build navigation items
  const navItems = [
    { label: "Home", slug: "index" },
    { label: "About", slug: "about" },
    { label: "Services", slug: "services" },
    { label: "Service Areas", slug: "service-areas" },
    { label: "FAQ", slug: "faq" },
    { label: "Contact", slug: "contact" },
  ];

  const schemaType = tradeCategory === "tree" ? "TreeService" : (niche.schemaType || "HomeAndConstructionBusiness");
  const isServiceArea = formData.businessModel === "service-area";

  // Build verified trust badges dynamically
  const verifiedTrustBadges: string[] = [];
  if (formData.insuredBonded || formData.licenseNumber) {
    verifiedTrustBadges.push(formData.licenseNumber ? `Lic. #${formData.licenseNumber}` : "🛡️ Licensed & Insured");
  }
  if (formData.yearsInBusiness) {
    verifiedTrustBadges.push(`⭐ ${formData.yearsInBusiness} Experience`);
  }
  if (formData.warrantyGuarantee) {
    verifiedTrustBadges.push(`✅ ${formData.warrantyGuarantee}`);
  }
  if (formData.responseTime) {
    verifiedTrustBadges.push(`⚡ ${formData.responseTime} Response`);
  } else if (isEmergencyTrade && formData.emergency247) {
    verifiedTrustBadges.push("⚡ 24/7 Emergency Dispatch");
  }
  if (formData.freeEstimates) {
    verifiedTrustBadges.push("📋 Free Estimates");
  }
  if (formData.allowedClaims && formData.allowedClaims.length > 0) {
    verifiedTrustBadges.push(...formData.allowedClaims.slice(0, 2));
  }
  if (verifiedTrustBadges.length === 0) {
    verifiedTrustBadges.push("Locally Owned & Operated", "Upfront Pricing", `Serving ${city}`);
  }

  // Include testimonials section ONLY if real reviews are confirmed or Google Review link is given
  const hasRealReviews = Boolean(formData.realReviewsConfirmed && formData.realReviews && formData.realReviews.length > 0);
  const hasGoogleReviewUrl = Boolean(formData.googleReviewUrl?.trim());
  const shouldIncludeReviews = hasRealReviews || hasGoogleReviewUrl;

  // Build each page content
  const pagesContent = pages.map((page) => {
    const slug = page.path.replace(/\.html$/, "");
    const isHome = slug === "index";

    // 1. Home Page
    if (isHome) {
      return {
        slug: "index",
        seo: {
          title: `${formData.targetKeywords?.split(",")[0] || `${formData.businessType} in ${city}, ${state}`} | ${bizName}`,
          description: `Dependable ${formData.businessType.toLowerCase()} in ${city}, ${state}. Fast response, licensed specialists, and upfront flat pricing. Call ${phone}.`,
          h1: `Trusted ${formData.businessType} in ${city}, ${state}`,
          primaryKeyword: formData.targetKeywords?.split(",")[0] || `${formData.businessType} ${city}`,
          ogDescription: `Reliable ${isEmergencyTrade ? "24/7 " : ""}${formData.businessType.toLowerCase()} in ${city}. Call ${phone}.`,
        },
        sections: [
          ...(isEmergencyTrade
            ? [
                {
                  type: "emergencyBanner",
                  content: {
                    text: `24/7 Priority Emergency Service Available in ${city} — Fast Dispatch!`,
                    phone,
                  },
                },
              ]
            : []),
          {
            type: "hero",
            variant: tradeCategory === "tree" ? "fullImage" : "split",
            content: {
              eyebrow: isEmergencyTrade ? `24/7 Priority Dispatch in ${city}` : `Professional ${niche.name} in ${city}`,
              h1: `Trusted ${formData.businessType} in ${city}, ${state}`,
              subheadline: formData.businessDescription || `Delivering dependable, upfront-priced solutions for homes and businesses across ${city} with master certified specialists.`,
              primaryCta: `Call ${phone}`,
              secondaryCta: "Get a Free Quote",
              secondaryUrl: "contact.html",
              trustBadges: verifiedTrustBadges,
            },
            images: [
              {
                slot: "main",
                query: niche.imageQueries.hero[0] || `${tradeCategory} professional in action`,
                alt: `Certified ${formData.businessType} team in ${city}`,
              },
            ],
          },
          { type: "trustBar", content: {} },
          {
            type: "services",
            variant: "cards",
            content: {
              eyebrow: "Our Core Services",
              headline: `Specialized ${formData.businessType} Solutions`,
              subheadline: `Complete commercial and residential service handled with precision and care in ${city}.`,
              items: servicesList.map((s) => ({
                title: s,
                description: `Professional, guaranteed ${s.toLowerCase()} performed by certified specialists with advanced equipment.`,
                slug: "services",
              })),
            },
          },
          {
            type: "stats",
            content: {
              stats: [
                formData.yearsInBusiness ? { number: formData.yearsInBusiness, label: `Years Serving ${city}` } : null,
                formData.responseTime ? { number: formData.responseTime, label: "Response Time" } : (isEmergencyTrade ? { number: "45m", label: "Average Arrival Time" } : null),
                { number: "100%", label: "Satisfaction Guarantee" },
                { number: "Fast", label: "Local Dispatch" },
              ].filter(Boolean),
            },
          },
          {
            type: "whyUs",
            content: {
              eyebrow: "The Local Difference",
              headline: `Why ${city} Property Owners Rely on ${bizName}`,
              subheadline: "We are committed to transparent pricing, courteous service, and lasting craftsmanship.",
            },
          },
          {
            type: "process",
            content: {
              headline: "How Our Process Works",
              subheadline: `Getting your ${niche.name.toLowerCase()} completed right takes 4 simple steps.`,
              steps: niche.processSteps.map((s) => ({
                number: `0${s.step}`,
                title: s.title,
                description: s.description,
              })),
            },
          },
          {
            type: "gallery",
            content: {
              eyebrow: "Completed Work",
              headline: "Recent Project Highlights",
              subheadline: `Real results delivered for residential and commercial customers throughout ${city}.`,
            },
            images: niche.imageQueries.work.map((q, i) => ({
              slot: "gallery",
              query: q,
              alt: `${niche.name} project ${i + 1} by ${bizName}`,
            })),
          },
          {
            type: "serviceAreas",
            content: {
              eyebrow: "Coverage Radius",
              headline: `Communities We Serve Around ${city}`,
              subheadline: "Stationed dispatch hubs enable fast response times across the entire metro area.",
            },
          },
          ...(shouldIncludeReviews
            ? [
                {
                  type: "testimonials",
                  variant: tradeCategory === "tree" ? "slider" : "grid",
                  content: {
                    eyebrow: hasRealReviews ? "Customer Reviews" : "Client Feedback",
                    headline: hasRealReviews ? "What Our Customers Are Saying" : "Review Us on Google",
                    subheadline: hasRealReviews
                      ? "Real feedback from property owners across our local community."
                      : "Help other homeowners discover our dependable service by sharing your experience.",
                  },
                },
              ]
            : []),
          {
            type: "faq",
            content: {
              headline: "Frequently Asked Questions",
              subheadline: `Clear answers to common questions about ${niche.name.toLowerCase()} in ${city}.`,
              items: niche.faqTopics.slice(0, 6).map((f) => ({
                question: f.question,
                answer: f.answerSummary,
              })),
            },
          },
          {
            type: "ctaBanner",
            variant: tradeCategory === "tree" ? "photo" : "gradient",
            content: {
              headline: `Need Expert ${formData.businessType} in ${city}?`,
              text: "Our certified technicians are ready to assist you right now with upfront flat pricing.",
              phone,
            },
          },
          { type: "contactForm", content: {} },
        ],
      };
    }

    // 2. Inner Pages (About, Services, Contact, Subpages)
    return {
      slug,
      seo: {
        title: `${page.title} | ${bizName}`,
        description: `Professional, licensed ${page.title.toLowerCase()} in ${city}, ${state}. Upfront pricing and written warranties. Call ${phone}.`,
        h1: page.title,
        primaryKeyword: `${page.title} ${city}`,
        ogDescription: `Contact ${bizName} for dependable ${page.title.toLowerCase()} in ${city}.`,
      },
      sections: [
        {
          type: "hero",
          variant: "split",
          content: {
            eyebrow: "Local Expertise",
            h1: page.title,
            subheadline: `Certified, guaranteed service in ${city} and surrounding communities. Upfront rates and zero surprise charges.`,
            primaryCta: `Call ${phone}`,
            secondaryCta: "Request Quote",
            secondaryUrl: "contact.html",
            trustBadges: verifiedTrustBadges,
          },
          images: [
            {
              slot: "main",
              query: niche.imageQueries.services[0] || `${tradeCategory} ${page.title}`,
              alt: `${page.title} by ${bizName}`,
            },
          ],
        },
        {
          type: "about",
          variant: "split",
          content: {
            eyebrow: "Our Standard of Service",
            headline: `Delivering Unmatched ${page.title} in ${city}`,
            story: `At ${bizName}, we take immense pride in providing dependable, safe, and transparent services. When you contact us for ${page.title.toLowerCase()}, you get seasoned technicians who respect your schedule and property.`,
          },
          images: [
            {
              slot: "main",
              query: niche.imageQueries.team[0] || `${niche.name.toLowerCase()} team`,
              alt: `Expert ${niche.name} team at ${bizName}`,
            },
          ],
        },
        { type: "whyUs", content: {} },
        { type: "process", content: {} },
        { type: "faq", content: {} },
        {
          type: "ctaBanner",
          variant: "gradient",
          content: {
            headline: `Ready to Schedule ${page.title}?`,
            text: `Speak directly with a local specialist in ${city} today.`,
            phone,
          },
        },
        { type: "contactForm", content: {} },
      ],
    };
  });

  return {
    site: {
      businessName: bizName,
      tagline: formData.businessDescription?.slice(0, 80) || `Reliable ${formData.businessType} in ${city}`,
      phone,
      email: formData.email || `dispatch@${domain}`,
      businessModel: formData.businessModel || "storefront",
      address: {
        street: isServiceArea ? "" : (formData.streetAddress || ""),
        city,
        state,
        zip: formData.zipPostalCode || "75201",
        country: formData.country || "USA",
      },
      hours: [formData.businessHours || "Monday - Sunday: 24/7 Priority Emergency Dispatch"],
      serviceAreas: areasList,
      social: {
        facebook: "https://facebook.com",
        instagram: "https://instagram.com",
      },
      nav: navItems,
      licenseNumber: formData.licenseNumber,
      certifications: formData.certifications,
      yearsInBusiness: formData.yearsInBusiness,
      warrantyGuarantee: formData.warrantyGuarantee,
      responseTime: formData.responseTime,
      emergency247: formData.emergency247,
      freeEstimates: formData.freeEstimates,
      insuredBonded: formData.insuredBonded,
      ownerName: formData.ownerName,
      ownerBio: formData.ownerBio,
      googleReviewUrl: formData.googleReviewUrl,
      realReviewsConfirmed: formData.realReviewsConfirmed,
      realReviews: formData.realReviews,
      allowedClaims: formData.allowedClaims,
    },
    pages: pagesContent,
    schema: {
      type: schemaType,
      priceRange: "$$",
    },
  };
}
