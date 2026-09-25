/**
 * Google Search Console (GSC) Performance Analyzer & Opportunity Engine
 * Parses CSV/TSV performance exports, detects column formats, and computes
 * actionable SEO opportunities and before/after performance diffs.
 */

export interface GSCQueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number; // e.g. 0.045 for 4.5%
  position: number; // e.g. 9.4
  pageUrl?: string;
}

export interface GSCPageRow {
  pageUrl: string;
  matchedPagePath: string; // e.g. "index.html" or "plumber-beaverton-or.html"
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCUploadDataset {
  id: string;
  dateRangeLabel: string; // e.g. "Last 28 days, ending Oct 20"
  uploadedAt: number;
  type: "site-wide" | "per-page";
  targetPagePath?: string;
  queries: GSCQueryRow[];
  pages?: GSCPageRow[];
}

export interface GSCOpportunitiesReport {
  almostPageOne: GSCQueryRow[]; // Position 8 - 20 with good impressions
  lowCtrOpportunities: GSCQueryRow[]; // High impressions, low CTR
  missingContentQueries: { query: string; impressions: number; missingWords: string[]; pagePath: string }[];
  wrongPageRanking: { query: string; rankingPage: string; intendedPage: string; position: number }[];
  newPageIdeas: { query: string; impressions: number; suggestedType: "location" | "service"; suggestedTitle: string }[];
  topPerformers: GSCPageRow[];
}

/**
 * Normalizes any URL from Search Console into a project relative path (e.g. "index.html").
 */
export function normalizeGscUrlToPagePath(rawUrl: string): string {
  let cleaned = rawUrl.trim();
  // Strip protocol and domain
  cleaned = cleaned.replace(/^https?:\/\/[^\/]+/i, "");
  // Strip query params and hash
  cleaned = cleaned.split("?")[0].split("#")[0];
  // Strip leading slash
  cleaned = cleaned.replace(/^\/+/, "");

  if (!cleaned || cleaned === "/" || cleaned === "") {
    return "index.html";
  }

  // Remove trailing slash
  cleaned = cleaned.replace(/\/+$/, "");

  if (!cleaned.includes(".")) {
    cleaned = `${cleaned}.html`;
  }

  return cleaned;
}

/**
 * Expected average CTR benchmark curve by Google position (approximate industry standard).
 */
export function getExpectedCtrForPosition(pos: number): number {
  if (pos <= 1.5) return 0.28;
  if (pos <= 2.5) return 0.15;
  if (pos <= 3.5) return 0.10;
  if (pos <= 5) return 0.06;
  if (pos <= 10) return 0.025;
  if (pos <= 15) return 0.012;
  return 0.006;
}

/**
 * Parses raw CSV or TSV text into structured query rows.
 * Automatically identifies columns in English or localized formats.
 */
export function parseGscCsv(rawText: string, defaultPageUrl?: string): { queries: GSCQueryRow[]; pages: GSCPageRow[] } {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return { queries: [], pages: [] };

  const delimiter = lines[0].includes("\t") ? "\t" : ",";
  const headerTokens = lines[0].split(delimiter).map((h) => h.replace(/^["']|["']$/g, "").trim().toLowerCase());

  // Detect column indices
  let queryCol = -1;
  let pageCol = -1;
  let clicksCol = -1;
  let impressionsCol = -1;
  let ctrCol = -1;
  let positionCol = -1;

  headerTokens.forEach((col, idx) => {
    if (col.includes("query") || col.includes("search term") || col.includes("requête") || col.includes("consultas")) {
      queryCol = idx;
    } else if (col.includes("page") || col.includes("url") || col.includes("seite") || col.includes("página")) {
      pageCol = idx;
    } else if (col.includes("click") || col.includes("clic")) {
      clicksCol = idx;
    } else if (col.includes("impression") || col.includes("imp")) {
      impressionsCol = idx;
    } else if (col.includes("ctr") || col.includes("taux") || col.includes("porcentaje")) {
      ctrCol = idx;
    } else if (col.includes("position") || col.includes("pos")) {
      positionCol = idx;
    }
  });

  const queries: GSCQueryRow[] = [];
  const pages: GSCPageRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawTokens = lines[i].split(delimiter).map((t) => t.replace(/^["']|["']$/g, "").trim());
    if (rawTokens.length < 3) continue;

    const clicks = clicksCol !== -1 ? parseInt(rawTokens[clicksCol].replace(/,/g, ""), 10) || 0 : 0;
    const impressions = impressionsCol !== -1 ? parseInt(rawTokens[impressionsCol].replace(/,/g, ""), 10) || 0 : 0;

    let ctr = 0;
    if (ctrCol !== -1) {
      const ctrRaw = rawTokens[ctrCol].replace("%", "").trim();
      ctr = parseFloat(ctrRaw) || 0;
      if (ctr > 1) ctr = ctr / 100; // normalize percentage
    } else if (impressions > 0) {
      ctr = clicks / impressions;
    }

    const position = positionCol !== -1 ? parseFloat(rawTokens[positionCol]) || 0 : 0;

    if (queryCol !== -1 && rawTokens[queryCol]) {
      queries.push({
        query: rawTokens[queryCol],
        clicks,
        impressions,
        ctr,
        position,
        pageUrl: defaultPageUrl || (pageCol !== -1 ? rawTokens[pageCol] : undefined),
      });
    } else if (pageCol !== -1 && rawTokens[pageCol]) {
      const pageUrl = rawTokens[pageCol];
      pages.push({
        pageUrl,
        matchedPagePath: normalizeGscUrlToPagePath(pageUrl),
        clicks,
        impressions,
        ctr,
        position,
      });
    }
  }

  return { queries, pages };
}

/**
 * Calculates Opportunity Reports from GSC data and existing site files.
 */
export function generateGscOpportunities(
  dataset: GSCUploadDataset,
  files: { path: string; content: string }[],
  keywordMap: { pagePath: string; primaryKeyword: string }[] = [],
  serviceAreas: string[] = []
): GSCOpportunitiesReport {
  const { queries, pages = [] } = dataset;

  // 1. "Almost Page 1": Position 8–20 with good impressions (>= 15)
  const almostPageOne = queries
    .filter((q) => q.position >= 7.5 && q.position <= 20.0 && q.impressions >= 10)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 15);

  // 2. "Low Click Rate": Queries where CTR is less than 50% of expected benchmark and impressions >= 25
  const lowCtrOpportunities = queries
    .filter((q) => {
      if (q.impressions < 20 || q.position > 12) return false;
      const expected = getExpectedCtrForPosition(q.position);
      return q.ctr < expected * 0.6;
    })
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 15);

  // 3. "Missing Content": Queries where substantive words do NOT appear in the page HTML
  const missingContentQueries: GSCOpportunitiesReport["missingContentQueries"] = [];
  const stopWords = new Set(["in", "the", "a", "an", "for", "near", "me", "to", "and", "of", "on", "at", "by", "tx"]);

  for (const q of queries.slice(0, 50)) {
    if (q.impressions < 10) continue;
    const targetPath = q.pageUrl ? normalizeGscUrlToPagePath(q.pageUrl) : dataset.targetPagePath || "index.html";
    const file = files.find((f) => f.path === targetPath);
    if (!file) continue;

    const lowerHtml = file.content.toLowerCase();
    const queryTokens = q.query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));

    const missingWords = queryTokens.filter((token) => !lowerHtml.includes(token));
    if (missingWords.length > 0) {
      missingContentQueries.push({
        query: q.query,
        impressions: q.impressions,
        missingWords,
        pagePath: targetPath,
      });
    }
  }

  // 4. "Wrong Page Ranking": Query ranks on Page A, but Keyword Map assigned it to Page B
  const wrongPageRanking: GSCOpportunitiesReport["wrongPageRanking"] = [];
  for (const q of queries) {
    if (!q.pageUrl) continue;
    const rankingPath = normalizeGscUrlToPagePath(q.pageUrl);

    // Look for intended page in keywordMap
    const intended = keywordMap.find(
      (k) => k.primaryKeyword.toLowerCase().includes(q.query.toLowerCase()) || q.query.toLowerCase().includes(k.primaryKeyword.toLowerCase())
    );

    if (intended && intended.pagePath !== rankingPath && q.position <= 20) {
      wrongPageRanking.push({
        query: q.query,
        rankingPage: rankingPath,
        intendedPage: intended.pagePath,
        position: q.position,
      });
    }
  }

  // 5. "New Page Ideas": Queries mentioning a distinct service or city without an existing page
  const newPageIdeas: GSCOpportunitiesReport["newPageIdeas"] = [];
  const existingSlugs = new Set(files.map((f) => f.path.toLowerCase().replace(/\.html$/, "")));

  for (const q of queries) {
    if (q.impressions < 15) continue;
    const qLower = q.query.toLowerCase();

    // Check if query mentions a service area city
    for (const area of serviceAreas) {
      const areaLower = area.toLowerCase();
      if (qLower.includes(areaLower)) {
        const potentialSlug = qLower.replace(/\s+/g, "-");
        if (!existingSlugs.has(potentialSlug)) {
          newPageIdeas.push({
            query: q.query,
            impressions: q.impressions,
            suggestedType: "location",
            suggestedTitle: `${area} Landing Page`,
          });
          break;
        }
      }
    }
  }

  // 6. "Top Performers": Pages with highest clicks
  const topPerformers = [...pages].sort((a, b) => b.clicks - a.clicks).slice(0, 10);

  return {
    almostPageOne,
    lowCtrOpportunities,
    missingContentQueries: missingContentQueries.slice(0, 10),
    wrongPageRanking: wrongPageRanking.slice(0, 10),
    newPageIdeas: newPageIdeas.slice(0, 8),
    topPerformers,
  };
}

/**
 * Compares two historical uploads (older vs newer) and computes metrics diffs.
 */
export function compareGscDatasets(
  older: GSCUploadDataset,
  newer: GSCUploadDataset
): {
  totalClicksDelta: number;
  totalImpressionsDelta: number;
  avgPositionDelta: number;
  ctrDelta: number;
} {
  const olderClicks = older.queries.reduce((acc, q) => acc + q.clicks, 0);
  const newerClicks = newer.queries.reduce((acc, q) => acc + q.clicks, 0);

  const olderImpressions = older.queries.reduce((acc, q) => acc + q.impressions, 0);
  const newerImpressions = newer.queries.reduce((acc, q) => acc + q.impressions, 0);

  const olderAvgPos = older.queries.length > 0 ? older.queries.reduce((acc, q) => acc + q.position, 0) / older.queries.length : 0;
  const newerAvgPos = newer.queries.length > 0 ? newer.queries.reduce((acc, q) => acc + q.position, 0) / newer.queries.length : 0;

  const olderCtr = olderImpressions > 0 ? olderClicks / olderImpressions : 0;
  const newerCtr = newerImpressions > 0 ? newerClicks / newerImpressions : 0;

  return {
    totalClicksDelta: newerClicks - olderClicks,
    totalImpressionsDelta: newerImpressions - olderImpressions,
    avgPositionDelta: Number((olderAvgPos - newerAvgPos).toFixed(1)), // positive means improved rank
    ctrDelta: Number(((newerCtr - olderCtr) * 100).toFixed(2)),
  };
}
