import { GSCQueryRow, normalizeGscUrlToPagePath } from "./search-console-analyzer";

export interface GscPageOptimizationOptions {
  pagePath: string;
  queries: GSCQueryRow[];
  businessName?: string;
  businessType?: string;
  phone?: string;
  city?: string;
  state?: string;
  availablePagePaths?: string[];
}

export interface GscOptimizationResult {
  optimizedHtml: string;
  changesApplied: string[];
  preservedFacts: {
    phone?: string;
    businessName?: string;
    canonical?: string;
  };
}

/**
 * Parses and safely preserves business facts from existing page HTML.
 */
function extractFactsFromHtml(html: string): {
  phone: string;
  businessName: string;
  city: string;
  title: string;
  metaDesc: string;
  canonical: string;
} {
  // 1. Phone
  let phone = "";
  const telMatch = html.match(/href=["']tel:([^"']+)["']/i);
  if (telMatch) {
    phone = telMatch[1].trim();
  } else {
    const rawPhoneMatch = html.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (rawPhoneMatch) phone = rawPhoneMatch[0].trim();
  }

  // 2. Title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";

  // 3. Meta description
  const metaMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  const metaDesc = metaMatch ? metaMatch[1].trim() : "";

  // 4. Canonical
  const canonMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  const canonical = canonMatch ? canonMatch[1].trim() : "";

  // 5. Business Name & City (from schema or title)
  let businessName = "";
  let city = "";
  const schemaMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (schemaMatch) {
    try {
      const parsed = JSON.parse(schemaMatch[1]);
      if (parsed.name) businessName = parsed.name;
      if (parsed.address?.addressLocality) city = parsed.address.addressLocality;
      else if (parsed.areaServed?.name) city = parsed.areaServed.name;
    } catch {
      // Ignore JSON parse error in regex fallback
    }
  }

  return { phone, businessName, city, title, metaDesc, canonical };
}

/**
 * Optimizes an existing page using Google Search Console opportunity data.
 * STRICTLY preserves existing page structure, slugs, phone numbers, design, images, and valid markup.
 */
export function optimizePageWithGscData(
  originalHtml: string,
  options: GscPageOptimizationOptions
): GscOptimizationResult {
  let html = originalHtml;
  const changes: string[] = [];

  const facts = extractFactsFromHtml(originalHtml);
  const activePhone = options.phone || facts.phone;
  const activeCity = options.city || facts.city || "Local";
  const activeBusinessName = options.businessName || facts.businessName || "Local Specialist";

  const highImpressionQueries = [...options.queries].sort((a, b) => b.impressions - a.impressions);
  const primaryQuery = highImpressionQueries[0]?.query || "";
  const secondaryQueries = highImpressionQueries.slice(1, 4).map((q) => q.query);

  if (!primaryQuery) {
    return {
      optimizedHtml: originalHtml,
      changesApplied: ["No high-impression queries found for targeted optimization."],
      preservedFacts: facts,
    };
  }

  // --------------------------------------------------------------------------
  // 1. Title Optimization (Incorporates Primary Query + CTR Magnet + Phone)
  // --------------------------------------------------------------------------
  const currentTitleLower = facts.title.toLowerCase();
  const primaryQueryLower = primaryQuery.toLowerCase();

  if (!currentTitleLower.includes(primaryQueryLower)) {
    const formattedQuery = primaryQuery
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    let newTitle = `${formattedQuery} | ${activeBusinessName}`;
    if (activePhone && newTitle.length < 52) {
      newTitle += ` | ${activePhone}`;
    }

    if (newTitle.length > 68) {
      newTitle = `${formattedQuery} | ${activeCity} Top Rated`;
    }

    if (html.includes("<title>")) {
      html = html.replace(/<title[^>]*>[^<]*<\/title>/i, `<title>${newTitle}</title>`);
      changes.push(`Optimized <title> to target Search Console query "${primaryQuery}" (${facts.title} → ${newTitle}).`);
    }
  }

  // --------------------------------------------------------------------------
  // 2. Meta Description Optimization (Action CTA targeting query intent)
  // --------------------------------------------------------------------------
  const currentDescLower = facts.metaDesc.toLowerCase();
  if (!currentDescLower.includes(primaryQueryLower) || facts.metaDesc.length < 90 || facts.metaDesc.length > 165) {
    const phoneCta = activePhone ? ` Call ${activePhone} for immediate dispatch!` : " Upfront pricing & fast service.";
    let newDesc = `Top-rated ${primaryQuery} in ${activeCity}. Licensed technicians, prompt arrival, and guaranteed satisfaction.${phoneCta}`;

    if (newDesc.length > 160) {
      newDesc = `Expert ${primaryQuery} in ${activeCity}. Upfront pricing and prompt local dispatch.${phoneCta}`;
    }

    if (html.includes('name="description"')) {
      html = html.replace(
        /<meta[^>]+name=["']description["'][^>]+content=["'][^"']*["'][^>]*>/i,
        `<meta name="description" content="${newDesc}">`
      );
      changes.push(`Refined meta description to include "${primaryQuery}" and high-CTR call-to-action.`);
    } else if (html.includes("</head>")) {
      html = html.replace("</head>", `  <meta name="description" content="${newDesc}">\n</head>`);
      changes.push(`Injected targeted meta description for "${primaryQuery}".`);
    }
  }

  // --------------------------------------------------------------------------
  // 3. Section Heading & Content Gap Coverage (Natural FAQ or Service Feature)
  // --------------------------------------------------------------------------
  // Check if primary query is present in main content body text
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const mainContentLower = (mainMatch ? mainMatch[1] : (bodyMatch ? bodyMatch[1] : html)).toLowerCase();

  if (!mainContentLower.includes(primaryQueryLower)) {
    const formattedQuery = primaryQuery.charAt(0).toUpperCase() + primaryQuery.slice(1);
    
    // Inject a helpful, conversion-oriented FAQ block addressing the query
    const faqItemHtml = `
      <!-- GSC Opportunity Content: ${primaryQuery} -->
      <div class="gsc-optimized-block bg-slate-50 border border-slate-200 rounded-xl p-5 my-6">
        <h3 class="text-base font-bold text-slate-900 mb-2 flex items-center space-x-2">
          <span>Looking for Reliable ${formattedQuery}?</span>
        </h3>
        <p class="text-sm text-slate-600 leading-relaxed">
          When you need prompt, professional <strong>${primaryQuery}</strong> in ${activeCity}, our licensed team delivers upfront pricing, certified workmanship, and 100% satisfaction guarantees. ${
            activePhone ? `Call <a href="tel:${activePhone.replace(/[^\d+]/g, "")}" class="text-indigo-600 font-bold hover:underline">${activePhone}</a> today for immediate assistance.` : ""
          }
        </p>
      </div>`;

    if (html.includes("</main>")) {
      html = html.replace("</main>", `${faqItemHtml}\n    </main>`);
      changes.push(`Enriched page body with dedicated service section addressing Search Console query "${primaryQuery}".`);
    } else if (html.includes("<footer")) {
      html = html.replace("<footer", `${faqItemHtml}\n    <footer`);
      changes.push(`Added targeted service section for "${primaryQuery}".`);
    }
  }

  // --------------------------------------------------------------------------
  // 4. Secondary Queries Coverage (Natural Bulleted Benefits / FAQ Items)
  // --------------------------------------------------------------------------
  if (secondaryQueries.length > 0) {
    const uncoveredQueries = secondaryQueries.filter((sq) => !mainContentLower.includes(sq.toLowerCase()));
    if (uncoveredQueries.length > 0) {
      const secondaryItemsHtml = uncoveredQueries
        .map(
          (sq) => `
        <li class="flex items-start space-x-2 text-sm text-slate-700">
          <span class="text-emerald-600 font-bold">✓</span>
          <span>Comprehensive solutions for <strong>${sq}</strong> across ${activeCity}.</span>
        </li>`
        )
        .join("\n");

      const listContainerHtml = `
      <!-- Secondary GSC Opportunities -->
      <div class="my-4 p-4 bg-indigo-50/60 rounded-xl border border-indigo-100">
        <h4 class="text-xs font-bold uppercase tracking-wider text-indigo-900 mb-2">Related Service Capabilities</h4>
        <ul class="space-y-1.5">
          ${secondaryItemsHtml}
        </ul>
      </div>`;

      if (html.includes("</main>")) {
        html = html.replace("</main>", `${listContainerHtml}\n    </main>`);
        changes.push(`Integrated secondary query coverage for: ${uncoveredQueries.join(", ")}.`);
      }
    }
  }

  // --------------------------------------------------------------------------
  // 5. Contextual Internal Linking (Connects Related Service & City Pages)
  // --------------------------------------------------------------------------
  if (Array.isArray(options.availablePagePaths) && options.availablePagePaths.length > 1) {
    const relatedLinks: Array<{ path: string; label: string }> = [];
    const currentNorm = options.pagePath.replace(/^\/+/, "");

    for (const otherPath of options.availablePagePaths) {
      const otherNorm = otherPath.replace(/^\/+/, "");
      if (otherNorm === currentNorm || !otherNorm.endsWith(".html") || otherNorm === "index.html") continue;

      // Extract clean readable name from slug
      const slug = otherNorm.replace(/\.html$/, "").split("/").pop() || "";
      const readable = slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

      // Check if not already linked
      if (!html.includes(`href="${otherNorm}"`) && !html.includes(`href="./${otherNorm}"`) && !html.includes(`href="/${otherNorm}"`)) {
        relatedLinks.push({ path: otherNorm, label: readable });
      }

      if (relatedLinks.length >= 3) break;
    }

    if (relatedLinks.length > 0 && !html.includes("gsc-internal-links")) {
      const linksHtml = `
      <!-- Related Local Service Links -->
      <div class="gsc-internal-links my-6 pt-4 border-t border-slate-200">
        <p class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Explore Related Services & Locations</p>
        <div class="flex flex-wrap gap-2">
          ${relatedLinks
            .map(
              (l) =>
                `<a href="${l.path}" class="inline-block px-3 py-1 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg text-xs font-semibold text-slate-700 hover:text-indigo-600 transition">${l.label}</a>`
            )
            .join("\n          ")}
        </div>
      </div>`;

      if (html.includes("</main>")) {
        html = html.replace("</main>", `${linksHtml}\n    </main>`);
        changes.push(`Injected ${relatedLinks.length} contextual internal links (${relatedLinks.map((l) => l.label).join(", ")}) to improve crawl equity.`);
      }
    }
  }

  // --------------------------------------------------------------------------
  // 6. Guarantee Preservation of Verified Business Phone & CTAs
  // --------------------------------------------------------------------------
  if (activePhone) {
    const cleanDigits = activePhone.replace(/[^\d+]/g, "");
    // Ensure all existing tel: links retain original clean number
    if (facts.phone && facts.phone !== activePhone) {
      html = html.replace(new RegExp(`href=["']tel:[^"']+["']`, "gi"), `href="tel:${cleanDigits}"`);
    }
  }

  return {
    optimizedHtml: html,
    changesApplied: changes,
    preservedFacts: {
      phone: activePhone,
      businessName: activeBusinessName,
      canonical: facts.canonical,
    },
  };
}
