/**
 * Search Console Opportunity Engine & Cannibalization Prevention
 * 
 * Analyzes GSC queries, determines whether to "Improve Existing Page" vs "Create Dedicated Page",
 * detects cannibalization and thin page risks, and maps queries to services & locations.
 */

import { GSCQueryRow, normalizeGscUrlToPagePath } from "../search-console/search-console-analyzer";

export type OpportunityAction = "improve_page" | "create_page" | "monitor";
export type SearchIntentType = "transactional" | "commercial" | "informational" | "navigational";

export interface CannibalizationCheckResult {
  hasRisk: boolean;
  severity: "none" | "low" | "high";
  conflictingPage?: string;
  reason?: string;
  matchedKeyword?: string;
}

export interface ThinPageAuditItem {
  pagePath: string;
  wordCount: number;
  headingCount: number;
  isThin: boolean;
  similarToPage?: string;
  similarityScore?: number; // 0 to 1
  issueSummary?: string;
}

export interface GSCOpportunityRecommendation {
  id: string;
  query: string;
  impressions: number;
  clicks: number;
  position: number;
  ctr: number;
  action: OpportunityAction;
  reason: string;
  searchIntent: SearchIntentType;
  serviceName: string;
  locationCity?: string;
  locationState?: string;
  suggestedTitle: string;
  suggestedSlug: string;
  targetExistingPage?: string;
  relatedQueries: string[];
  cannibalization: CannibalizationCheckResult;
}

const COMMON_STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "of", "with",
  "by", "near", "me", "best", "top", "local", "affordable", "cheap", "cost",
  "services", "service", "company", "contractor", "contractors"
]);

/**
 * Detects search intent from query keywords.
 */
export function detectSearchIntent(query: string): SearchIntentType {
  const q = query.toLowerCase();
  if (
    q.includes("emergency") ||
    q.includes("repair") ||
    q.includes("install") ||
    q.includes("replacement") ||
    q.includes("hire") ||
    q.includes("cost") ||
    q.includes("quote") ||
    q.includes("estimate") ||
    q.includes("near me") ||
    q.includes("call")
  ) {
    return "transactional";
  }
  if (
    q.includes("best") ||
    q.includes("top") ||
    q.includes("review") ||
    q.includes("versus") ||
    q.includes("vs") ||
    q.includes("comparison") ||
    q.includes("ratings")
  ) {
    return "commercial";
  }
  if (
    q.includes("how to") ||
    q.includes("why is") ||
    q.includes("what is") ||
    q.includes("diy") ||
    q.includes("guide") ||
    q.includes("tips")
  ) {
    return "informational";
  }
  return "transactional";
}

/**
 * Extracts a service name and location from a query using business context.
 */
export function mapQueryToServiceAndLocation(
  query: string,
  businessType?: string,
  serviceAreas: string[] = []
): { serviceName: string; locationCity?: string; locationState?: string } {
  const qLower = query.toLowerCase();

  // Find location match
  let detectedCity: string | undefined;
  for (const area of serviceAreas) {
    if (qLower.includes(area.toLowerCase())) {
      detectedCity = area;
      break;
    }
  }

  // Derive service name by removing location tokens and common noise words
  let cleanService = qLower;
  if (detectedCity) {
    cleanService = cleanService.replace(new RegExp(detectedCity.toLowerCase(), "gi"), "");
  }

  // Remove state abbreviations or words
  cleanService = cleanService.replace(/\b(al|ak|az|ar|ca|co|ct|de|fl|ga|hi|id|il|in|ia|ks|ky|la|me|md|ma|mi|mn|ms|mo|mt|ne|nv|nh|nj|nm|ny|nc|nd|oh|ok|or|pa|ri|sc|sd|tn|tx|ut|vt|va|wa|wv|wi|wy)\b/gi, "");
  cleanService = cleanService.replace(/\b(near me|cost|prices?|company|contractors?|pros?)\b/gi, "");
  cleanService = cleanService.trim().replace(/\s+/g, " ");

  // Title-case the service name
  let serviceName = cleanService
    .split(" ")
    .filter((w) => w.length > 0 && !COMMON_STOP_WORDS.has(w))
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  if (!serviceName || serviceName.length < 3) {
    serviceName = businessType || "Specialized Service";
  }

  return {
    serviceName,
    locationCity: detectedCity,
  };
}

/**
 * Generates an SEO-optimized slug from service and location.
 */
export function generatePageSlug(serviceName: string, locationCity?: string): string {
  const raw = locationCity ? `${serviceName} ${locationCity}` : serviceName;
  const slug = raw
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return `${slug}.html`;
}

/**
 * Generates an SEO title tag from service, location, and business name.
 */
export function generatePageTitle(
  serviceName: string,
  locationCity?: string,
  businessName?: string
): string {
  const biz = businessName ? ` | ${businessName}` : "";
  if (locationCity) {
    return `${serviceName} in ${locationCity} - Certified Experts${biz}`;
  }
  return `${serviceName} - Professional Services${biz}`;
}

/**
 * Checks for keyword and page cannibalization between a proposed page and existing site files.
 */
export function checkPageCannibalization(
  proposed: {
    query?: string;
    serviceName?: string;
    locationCity?: string;
    slug?: string;
    title?: string;
  },
  existingFiles: { path: string; content?: string }[],
  keywordMap: { pagePath: string; primaryKeyword: string }[] = []
): CannibalizationCheckResult {
  const normSlug = proposed.slug
    ? proposed.slug.toLowerCase().replace(/^\/+/, "").replace(/\.html$/, "")
    : "";

  // 1. Direct slug conflict
  for (const f of existingFiles) {
    const fileSlug = f.path.toLowerCase().replace(/^\/+/, "").replace(/\.html$/, "");
    if (fileSlug === normSlug) {
      return {
        hasRisk: true,
        severity: "high",
        conflictingPage: f.path,
        reason: `A page with this exact URL path (${f.path}) already exists on this website.`,
        matchedKeyword: fileSlug,
      };
    }
  }

  // 2. Keyword map conflict
  if (proposed.query) {
    const queryTokens = new Set(
      proposed.query
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2 && !COMMON_STOP_WORDS.has(w))
    );

    for (const entry of keywordMap) {
      const entryTokens = entry.primaryKeyword
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2 && !COMMON_STOP_WORDS.has(w));

      const overlap = entryTokens.filter((t) => queryTokens.has(t));
      if (overlap.length >= 3 || (entryTokens.length <= 2 && overlap.length === entryTokens.length)) {
        return {
          hasRisk: true,
          severity: "high",
          conflictingPage: entry.pagePath,
          reason: `Existing page "${entry.pagePath}" is already explicitly mapped to keyword "${entry.primaryKeyword}". Creating a new page will split topical authority.`,
          matchedKeyword: entry.primaryKeyword,
        };
      }
    }
  }

  // 3. Exact service + city combination check across file paths
  if (proposed.serviceName && proposed.locationCity) {
    const serviceSlug = proposed.serviceName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const citySlug = proposed.locationCity.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    for (const f of existingFiles) {
      const p = f.path.toLowerCase();
      if (p.includes(citySlug) && p.includes(serviceSlug)) {
        return {
          hasRisk: true,
          severity: "high",
          conflictingPage: f.path,
          reason: `Existing page "${f.path}" already specifically targets ${proposed.serviceName} in ${proposed.locationCity}.`,
          matchedKeyword: `${proposed.serviceName} ${proposed.locationCity}`,
        };
      }
    }
  }

  // 4. Title / H1 overlap in file content
  if (proposed.title) {
    const titleClean = proposed.title.toLowerCase().replace(/[^a-z0-9\s]/g, "");
    const titleWords = titleClean.split(/\s+/).filter((w) => w.length > 3 && !COMMON_STOP_WORDS.has(w));

    for (const f of existingFiles) {
      if (!f.content || !f.path.endsWith(".html")) continue;
      const titleMatch = f.content.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (titleMatch) {
        const existingTitle = titleMatch[1].toLowerCase().replace(/[^a-z0-9\s]/g, "");
        const existingWords = existingTitle.split(/\s+/).filter((w) => w.length > 3 && !COMMON_STOP_WORDS.has(w));

        const matched = titleWords.filter((w) => existingWords.includes(w));
        if (matched.length >= 3 && matched.length / titleWords.length > 0.7) {
          return {
            hasRisk: true,
            severity: "low",
            conflictingPage: f.path,
            reason: `Existing page "${f.path}" has a very similar title tag ("${titleMatch[1].trim()}"). Improving that page is recommended unless you intend to target a distinct sub-niche.`,
            matchedKeyword: matched.join(" "),
          };
        }
      }
    }
  }

  return {
    hasRisk: false,
    severity: "none",
  };
}

/**
 * Evaluates whether an opportunity should be an "improve_page" or "create_page" action.
 */
export function evaluateOpportunityAction(
  queryRow: GSCQueryRow,
  existingFiles: { path: string; content?: string }[],
  keywordMap: { pagePath: string; primaryKeyword: string }[],
  businessContext: {
    businessType?: string;
    city?: string;
    state?: string;
    serviceAreas?: string[];
  }
): {
  action: OpportunityAction;
  reason: string;
  suggestedTitle: string;
  suggestedSlug: string;
  targetExistingPage?: string;
  serviceName: string;
  locationCity?: string;
} {
  const { query, impressions, position, pageUrl } = queryRow;
  const mapped = mapQueryToServiceAndLocation(
    query,
    businessContext.businessType,
    businessContext.serviceAreas || []
  );

  const suggestedSlug = generatePageSlug(mapped.serviceName, mapped.locationCity);
  const suggestedTitle = generatePageTitle(mapped.serviceName, mapped.locationCity);

  // If query is already ranking reasonably well on a specific URL
  let targetPath = pageUrl ? normalizeGscUrlToPagePath(pageUrl) : undefined;
  const existingFile = targetPath ? existingFiles.find((f) => f.path === targetPath) : undefined;

  // Check cannibalization
  const cannibalization = checkPageCannibalization(
    {
      query,
      serviceName: mapped.serviceName,
      locationCity: mapped.locationCity,
      slug: suggestedSlug,
      title: suggestedTitle,
    },
    existingFiles,
    keywordMap
  );

  // RULE 1: If there's high cannibalization risk with an existing page, ALWAYS recommend improving the existing page
  if (cannibalization.hasRisk && cannibalization.conflictingPage) {
    return {
      action: "improve_page",
      reason: `High relevance to existing page "${cannibalization.conflictingPage}". Improving this page with targeted sections avoids keyword cannibalization.`,
      suggestedTitle,
      suggestedSlug,
      targetExistingPage: cannibalization.conflictingPage,
      serviceName: mapped.serviceName,
      locationCity: mapped.locationCity,
    };
  }

  // RULE 2: If the query already ranks on Page 1 or Page 2 on an existing page
  if (existingFile && position <= 20) {
    return {
      action: "improve_page",
      reason: `Query already ranks at position ${position.toFixed(1)} on "${existingFile.path}". Enhancing its content, headers, and meta description will yield faster page-one gains without creating duplicate URLs.`,
      suggestedTitle,
      suggestedSlug,
      targetExistingPage: existingFile.path,
      serviceName: mapped.serviceName,
      locationCity: mapped.locationCity,
    };
  }

  // RULE 3: Distinct service or location with solid impressions (>= 15) and no direct existing page
  if (impressions >= 15 && (mapped.locationCity || mapped.serviceName !== businessContext.businessType)) {
    return {
      action: "create_page",
      reason: `Distinct search intent for "${mapped.serviceName}${mapped.locationCity ? ` in ${mapped.locationCity}` : ""}" with ${impressions} impressions. Creating a dedicated page has strong ranking potential without cannibalizing existing pages.`,
      suggestedTitle,
      suggestedSlug,
      serviceName: mapped.serviceName,
      locationCity: mapped.locationCity,
    };
  }

  // RULE 4: Low impressions or unclear intent -> Monitor or improve homepage
  if (impressions < 15) {
    return {
      action: "monitor",
      reason: `Early traction query (${impressions} impressions, position ${position.toFixed(1)}). Monitor search volume before building a dedicated landing page.`,
      suggestedTitle,
      suggestedSlug,
      targetExistingPage: targetPath || "index.html",
      serviceName: mapped.serviceName,
      locationCity: mapped.locationCity,
    };
  }

  return {
    action: "improve_page",
    reason: `Query can be naturally satisfied inside an existing page. Adding a dedicated section or FAQ will improve coverage.`,
    suggestedTitle,
    suggestedSlug,
    targetExistingPage: targetPath || "index.html",
    serviceName: mapped.serviceName,
    locationCity: mapped.locationCity,
  };
}

/**
 * Runs a comprehensive opportunity audit across all GSC query rows.
 */
export function buildComprehensiveOpportunityList(
  queries: GSCQueryRow[],
  existingFiles: { path: string; content?: string }[],
  keywordMap: { pagePath: string; primaryKeyword: string }[] = [],
  businessContext: {
    businessType?: string;
    city?: string;
    state?: string;
    serviceAreas?: string[];
  }
): GSCOpportunityRecommendation[] {
  const recommendations: GSCOpportunityRecommendation[] = [];
  const processedSlugs = new Set<string>();

  // Sort queries by impressions descending
  const sortedQueries = [...queries].sort((a, b) => b.impressions - a.impressions);

  for (const q of sortedQueries.slice(0, 100)) {
    const evaluation = evaluateOpportunityAction(q, existingFiles, keywordMap, businessContext);
    const intent = detectSearchIntent(q.query);

    // Group related queries
    const qTokens = new Set(
      q.query
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2 && !COMMON_STOP_WORDS.has(w))
    );

    const relatedQueries = queries
      .filter((other) => {
        if (other.query === q.query) return false;
        const otherTokens = other.query.toLowerCase().split(/\s+/);
        return otherTokens.some((t) => qTokens.has(t));
      })
      .map((r) => r.query)
      .slice(0, 5);

    const cannibalization = checkPageCannibalization(
      {
        query: q.query,
        serviceName: evaluation.serviceName,
        locationCity: evaluation.locationCity,
        slug: evaluation.suggestedSlug,
        title: evaluation.suggestedTitle,
      },
      existingFiles,
      keywordMap
    );

    recommendations.push({
      id: `opp-${Math.random().toString(36).slice(2, 9)}`,
      query: q.query,
      impressions: q.impressions,
      clicks: q.clicks,
      position: q.position,
      ctr: q.ctr,
      action: evaluation.action,
      reason: evaluation.reason,
      searchIntent: intent,
      serviceName: evaluation.serviceName,
      locationCity: evaluation.locationCity,
      suggestedTitle: evaluation.suggestedTitle,
      suggestedSlug: evaluation.suggestedSlug,
      targetExistingPage: evaluation.targetExistingPage,
      relatedQueries,
      cannibalization,
    });

    processedSlugs.add(evaluation.suggestedSlug);
  }

  return recommendations;
}

/**
 * Audits project files for thin content (< 250 words) and high text similarity between pages.
 */
export function auditProjectThinAndSimilarPages(
  files: { path: string; content?: string }[]
): ThinPageAuditItem[] {
  const htmlFiles = files.filter((f) => f.path.endsWith(".html") && f.content);
  const items: ThinPageAuditItem[] = [];

  const fileTextMap = new Map<string, { words: string[]; rawText: string }>();

  for (const f of htmlFiles) {
    const rawHtml = f.content || "";
    // Strip tags and script/style
    const textOnly = rawHtml
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const words = textOnly
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2 && !COMMON_STOP_WORDS.has(w));

    fileTextMap.set(f.path, { words, rawText: textOnly });
    const headingMatches = rawHtml.match(/<h[1-6][^>]*>/gi) || [];

    const wordCount = textOnly.split(/\s+/).filter(Boolean).length;
    const isThin = wordCount < 250;

    items.push({
      pagePath: f.path,
      wordCount,
      headingCount: headingMatches.length,
      isThin,
      issueSummary: isThin
        ? `Low word count (${wordCount} words). Add location-specific details, FAQs, or service steps.`
        : undefined,
    });
  }

  // Cross-compare for similarity (Jaccard similarity on non-stop words)
  for (let i = 0; i < items.length; i++) {
    const itemA = items[i];
    const dataA = fileTextMap.get(itemA.pagePath);
    if (!dataA || dataA.words.length === 0) continue;
    const setA = new Set(dataA.words);

    for (let j = i + 1; j < items.length; j++) {
      const itemB = items[j];
      const dataB = fileTextMap.get(itemB.pagePath);
      if (!dataB || dataB.words.length === 0) continue;

      let intersection = 0;
      for (const w of dataB.words) {
        if (setA.has(w)) intersection++;
      }

      const union = new Set([...dataA.words, ...dataB.words]).size;
      const jaccard = union > 0 ? intersection / union : 0;

      // High similarity threshold
      if (jaccard > 0.85) {
        if (!itemA.similarToPage) {
          itemA.similarToPage = itemB.pagePath;
          itemA.similarityScore = Number(jaccard.toFixed(2));
          itemA.issueSummary = `High content similarity (${Math.round(jaccard * 100)}%) with "${itemB.pagePath}". Customize city landmarks and local specifics to avoid duplicate content penalties.`;
        }
        if (!itemB.similarToPage) {
          itemB.similarToPage = itemA.pagePath;
          itemB.similarityScore = Number(jaccard.toFixed(2));
          itemB.issueSummary = `High content similarity (${Math.round(jaccard * 100)}%) with "${itemA.pagePath}". Customize city landmarks and local specifics to avoid duplicate content penalties.`;
        }
      }
    }
  }

  return items;
}
