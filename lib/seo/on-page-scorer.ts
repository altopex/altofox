/**
 * On-Page SEO Scorer and Checklist Engine (0–100)
 * Evaluates HTML content strictly in code with actionable suggestions.
 */

export interface SEOCheckResult {
  id: string;
  name: string;
  category: "keyword" | "meta" | "content" | "structure" | "links";
  status: "pass" | "warning" | "fail";
  scoreEarned: number;
  maxScore: number;
  message: string;
  suggestion?: string;
}

export interface PageSEOResult {
  pagePath: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  totalScore: number; // 0 - 100
  checks: SEOCheckResult[];
  metrics: {
    wordCount: number;
    keywordDensityPercent: number;
    keywordCount: number;
    titleLength: number;
    metaDescriptionLength: number;
    h1Count: number;
    internalLinksCount: number;
    hasContactLink: boolean;
    hasValidSchema: boolean;
    hasTelLink: boolean;
  };
}

/**
 * Strips HTML tags and script/style contents to count actual body words.
 */
export function extractCleanBodyText(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z0-9#]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calculates keyword occurrences in body text.
 */
export function countKeywordMatches(text: string, keyword: string): number {
  if (!keyword || !keyword.trim()) return 0;
  const escaped = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${escaped}\\b`, "gi");
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

/**
 * Audits a single HTML page against its primary and secondary keywords.
 */
export function auditPageSEO(
  html: string,
  pagePath: string,
  primaryKeyword: string,
  secondaryKeywords: string[] = []
): PageSEOResult {
  const checks: SEOCheckResult[] = [];
  const cleanBody = extractCleanBodyText(html);
  const words = cleanBody.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const kw = (primaryKeyword || "").trim().toLowerCase();
  const kwWords = kw ? kw.split(/\s+/).length : 1;

  // Extract meta tags & headings
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const pageTitle = titleMatch ? titleMatch[1].trim() : "";
  const titleLength = pageTitle.length;

  const metaDescMatch = html.match(/<meta[^>]*?name=["']description["'][^>]*?content=["']([^"']*)["']/i);
  const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : "";
  const metaDescriptionLength = metaDescription.length;

  const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  const h1Count = h1Matches.length;
  const h1Text = h1Matches.map((h) => h.replace(/<[^>]+>/g, "").trim()).join(" ");

  const h2Matches = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) || [];
  const h2Texts = h2Matches.map((h) => h.replace(/<[^>]+>/g, "").trim().toLowerCase());

  // First 100 words of body
  const first100Words = words.slice(0, 100).join(" ").toLowerCase();

  // URL Slug evaluation
  const slug = pagePath.toLowerCase().replace(/\.html$/i, "");

  // Image alts
  const imgMatches = html.match(/<img[^>]+>/gi) || [];
  let altHasKeyword = false;
  let allImagesHaveAlt = imgMatches.length > 0;
  for (const img of imgMatches) {
    const altMatch = img.match(/alt=["']([^"']*)["']/i);
    if (!altMatch || !altMatch[1].trim()) {
      allImagesHaveAlt = false;
    } else if (kw && altMatch[1].toLowerCase().includes(kw)) {
      altHasKeyword = true;
    }
  }

  // Keyword Count & Density
  const kwMatches = kw ? countKeywordMatches(cleanBody, kw) : 0;
  // Keyword density = (matches * words in keyword / total words) * 100
  const keywordDensityPercent = wordCount > 0 && kw ? Number(((kwMatches * kwWords / wordCount) * 100).toFixed(2)) : 0;

  // Internal links
  const linkMatches = html.match(/<a\b[^>]*?href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi) || [];
  let internalLinksCount = 0;
  let hasContactLink = false;
  let hasTelLink = /href=["']tel:[^"']+["']/i.test(html);

  for (const link of linkMatches) {
    const hrefMatch = link.match(/href=["']([^"']+)["']/i);
    if (hrefMatch) {
      const href = hrefMatch[1].toLowerCase();
      if (!href.startsWith("http://") && !href.startsWith("https://") && !href.startsWith("mailto:") && !href.startsWith("#")) {
        internalLinksCount++;
        if (href.includes("contact")) {
          hasContactLink = true;
        }
      } else if (href.includes("/contact")) {
        hasContactLink = true;
      }
    }
  }

  // Schema presence & validity
  let hasValidSchema = false;
  const jsonLdBlocks = html.match(/<script[^>]*?type=["']application\/ld\+json["'][^>]*?>([\s\S]*?)<\/script>/gi) || [];
  if (jsonLdBlocks.length > 0) {
    try {
      for (const block of jsonLdBlocks) {
        const jsonText = block.replace(/<script[^>]*?>|<\/script>/gi, "").trim();
        JSON.parse(jsonText);
      }
      hasValidSchema = true;
    } catch {
      hasValidSchema = false;
    }
  }

  // Determine minimum word count based on page type
  let minWords = 400;
  let pageCategory = "General";
  if (pagePath === "index.html") {
    minWords = 800;
    pageCategory = "Home";
  } else if (pagePath.includes("service-") || pagePath.includes("-plumber") || pagePath.includes("-repair") || pagePath.startsWith("services/")) {
    minWords = 600;
    pageCategory = "Service";
  } else if (pagePath.split("-").length >= 3 && !pagePath.startsWith("blog/")) {
    minWords = 600;
    pageCategory = "Location";
  } else if (pagePath.startsWith("blog/") || pagePath.includes("blog")) {
    minWords = 1200;
    pageCategory = "Blog";
  }

  // 1. Primary Keyword in Title
  const kwInTitle = kw ? pageTitle.toLowerCase().includes(kw) : false;
  checks.push({
    id: "kw-title",
    name: "Primary Keyword in <title>",
    category: "keyword",
    status: kwInTitle ? "pass" : "fail",
    scoreEarned: kwInTitle ? 10 : 0,
    maxScore: 10,
    message: kwInTitle ? `Title contains "${primaryKeyword}".` : `Title does not contain "${primaryKeyword}".`,
    suggestion: kwInTitle ? undefined : `Add "${primaryKeyword}" near the start of the <title> tag.`,
  });

  // 2. Primary Keyword in Meta Description
  const kwInMeta = kw ? metaDescription.toLowerCase().includes(kw) : false;
  checks.push({
    id: "kw-meta",
    name: "Primary Keyword in Meta Description",
    category: "keyword",
    status: kwInMeta ? "pass" : "fail",
    scoreEarned: kwInMeta ? 8 : 0,
    maxScore: 8,
    message: kwInMeta ? `Meta description includes "${primaryKeyword}".` : `Meta description missing "${primaryKeyword}".`,
    suggestion: kwInMeta ? undefined : `Include "${primaryKeyword}" naturally in your meta description with a call to action.`,
  });

  // 3. Primary Keyword in H1
  const kwInH1 = kw ? h1Text.toLowerCase().includes(kw) : false;
  checks.push({
    id: "kw-h1",
    name: "Primary Keyword in H1 Heading",
    category: "keyword",
    status: kwInH1 ? "pass" : "fail",
    scoreEarned: kwInH1 ? 10 : 0,
    maxScore: 10,
    message: kwInH1 ? `H1 includes "${primaryKeyword}".` : `H1 does not contain "${primaryKeyword}".`,
    suggestion: kwInH1 ? undefined : `Include "${primaryKeyword}" in the main H1 headline.`,
  });

  // 4. Primary Keyword in URL Slug
  const kwSlugCheck = kw ? kw.replace(/\s+/g, "-") : "";
  const kwInSlug = kw ? slug.includes(kwSlugCheck) || slug.includes(kw.split(" ")[0]) : false;
  checks.push({
    id: "kw-slug",
    name: "Primary Keyword in URL Slug",
    category: "keyword",
    status: kwInSlug || pagePath === "index.html" ? "pass" : "warning",
    scoreEarned: kwInSlug || pagePath === "index.html" ? 8 : 4,
    maxScore: 8,
    message: kwInSlug || pagePath === "index.html" ? `URL slug aligns with target keyword.` : `URL slug "${pagePath}" could include "${primaryKeyword}".`,
    suggestion: kwInSlug || pagePath === "index.html" ? undefined : `Name the file using hyphens containing your service and location.`,
  });

  // 5. Keyword in First 100 Words
  const kwInFirst100 = kw ? first100Words.includes(kw) : false;
  checks.push({
    id: "kw-first-100",
    name: "Primary Keyword in First 100 Words",
    category: "content",
    status: kwInFirst100 ? "pass" : "warning",
    scoreEarned: kwInFirst100 ? 8 : 3,
    maxScore: 8,
    message: kwInFirst100 ? `Primary keyword appears in introductory paragraph.` : `Primary keyword not found in the opening 100 words.`,
    suggestion: kwInFirst100 ? undefined : `Mention "${primaryKeyword}" in the very first paragraph of the page for fast crawl relevance.`,
  });

  // 6. Keyword in At Least One H2
  const kwInH2 = kw ? h2Texts.some((h) => h.includes(kw) || kw.split(" ").slice(0, 2).every((w) => h.includes(w))) : false;
  checks.push({
    id: "kw-h2",
    name: "Target Keyword in H2 Subheadings",
    category: "structure",
    status: kwInH2 ? "pass" : "warning",
    scoreEarned: kwInH2 ? 6 : 2,
    maxScore: 6,
    message: kwInH2 ? `Target keyword found in subheadings.` : `None of the H2 subheadings mention "${primaryKeyword}".`,
    suggestion: kwInH2 ? undefined : `Include "${primaryKeyword}" or its core topic in at least one H2 section heading.`,
  });

  // 7. Title Length (30–60 characters)
  const titleValid = titleLength >= 30 && titleLength <= 60;
  checks.push({
    id: "meta-title-length",
    name: "Title Length (30–60 chars)",
    category: "meta",
    status: titleValid ? "pass" : "warning",
    scoreEarned: titleValid ? 6 : 2,
    maxScore: 6,
    message: `Title length is ${titleLength} characters (recommended: 30–60).`,
    suggestion: titleValid ? undefined : titleLength < 30 ? "Expand your title with your main city and business name." : "Shorten your title to under 60 characters to avoid Google truncation.",
  });

  // 8. Meta Description Length (120–155 characters)
  const metaValid = metaDescriptionLength >= 120 && metaDescriptionLength <= 160;
  checks.push({
    id: "meta-desc-length",
    name: "Meta Description Length (120–160 chars)",
    category: "meta",
    status: metaValid ? "pass" : "warning",
    scoreEarned: metaValid ? 6 : 2,
    maxScore: 6,
    message: `Meta description is ${metaDescriptionLength} characters (ideal: 120–160).`,
    suggestion: metaValid ? undefined : "Aim for 120–160 characters with your main service, location, and phone number.",
  });

  // 9. Word Count Meets Minimum
  const wordCountPass = wordCount >= minWords;
  checks.push({
    id: "content-word-count",
    name: `Word Count (${minWords}+ words for ${pageCategory})`,
    category: "content",
    status: wordCountPass ? "pass" : "warning",
    scoreEarned: wordCountPass ? 8 : Math.round((wordCount / minWords) * 8),
    maxScore: 8,
    message: `Page contains ${wordCount} words (target minimum: ${minWords} words).`,
    suggestion: wordCountPass ? undefined : `Add more detailed service explanations, customer FAQs, or process steps to reach at least ${minWords} words.`,
  });

  // 10. Keyword Density (0.5%–2%)
  let densityStatus: "pass" | "warning" | "fail" = "pass";
  let densityScore = 6;
  let densitySuggestion: string | undefined = undefined;

  if (keywordDensityPercent > 2.2) {
    densityStatus = "fail";
    densityScore = 0;
    densitySuggestion = `Google spam risk: Keyword density is ${keywordDensityPercent}%. Reduce repetitive mentions of "${primaryKeyword}" to stay below 2.0%.`;
  } else if (keywordDensityPercent < 0.4 && kwMatches === 0) {
    densityStatus = "warning";
    densityScore = 2;
    densitySuggestion = `Keyword density is low (${keywordDensityPercent}%). Use "${primaryKeyword}" naturally 2–4 times in the body.`;
  }

  checks.push({
    id: "keyword-density",
    name: "Keyword Density (0.5%–2.0%)",
    category: "keyword",
    status: densityStatus,
    scoreEarned: densityScore,
    maxScore: 6,
    message: `Keyword density is ${keywordDensityPercent}% (${kwMatches} occurrences).`,
    suggestion: densitySuggestion,
  });

  // 11. Secondary Keywords Usage
  const cleanSecondaries = secondaryKeywords.map((s) => s.trim()).filter(Boolean);
  let secondariesMatched = 0;
  if (cleanSecondaries.length > 0) {
    for (const sec of cleanSecondaries) {
      if (cleanBody.toLowerCase().includes(sec.toLowerCase())) {
        secondariesMatched++;
      }
    }
  }
  const secondaryScore = cleanSecondaries.length === 0 ? 5 : Math.round((secondariesMatched / cleanSecondaries.length) * 5);
  checks.push({
    id: "secondary-keywords",
    name: "Secondary Keywords Coverage",
    category: "keyword",
    status: cleanSecondaries.length === 0 || secondariesMatched === cleanSecondaries.length ? "pass" : "warning",
    scoreEarned: secondaryScore,
    maxScore: 5,
    message: cleanSecondaries.length === 0 ? "No secondary keywords assigned." : `${secondariesMatched} of ${cleanSecondaries.length} secondary keywords found in page content.`,
    suggestion: cleanSecondaries.length > 0 && secondariesMatched < cleanSecondaries.length ? `Incorporate remaining secondary terms: ${cleanSecondaries.filter((s) => !cleanBody.toLowerCase().includes(s.toLowerCase())).join(", ")}.` : undefined,
  });

  // 12. Internal Links (at least 3 internal + contact link)
  const linksPass = internalLinksCount >= 3 && hasContactLink;
  checks.push({
    id: "internal-links",
    name: "Internal Linking (3+ links & Contact CTA)",
    category: "links",
    status: linksPass ? "pass" : internalLinksCount >= 2 ? "warning" : "fail",
    scoreEarned: linksPass ? 5 : internalLinksCount >= 2 ? 3 : 1,
    maxScore: 5,
    message: `Found ${internalLinksCount} internal links (${hasContactLink ? "includes link to contact page" : "missing contact page link"}).`,
    suggestion: linksPass ? undefined : "Ensure at least 3 internal links to services or location hub, plus a clear link to the contact page.",
  });

  // 13. Single H1 & Heading Hierarchy
  const h1Pass = h1Count === 1;
  checks.push({
    id: "h1-hierarchy",
    name: "Single H1 Headline Structure",
    category: "structure",
    status: h1Pass ? "pass" : "fail",
    scoreEarned: h1Pass ? 4 : 1,
    maxScore: 4,
    message: h1Count === 1 ? "Exactly one H1 found on the page." : `Found ${h1Count} H1 elements. Google requires exactly one H1 per page.`,
    suggestion: h1Pass ? undefined : "Ensure exactly one H1 element is used for the main page headline.",
  });

  // 14. Image Alt Texts & Clickable Phone
  const mediaPass = allImagesHaveAlt && hasTelLink;
  checks.push({
    id: "media-tel-check",
    name: "Accessible Images & Clickable tel: Links",
    category: "structure",
    status: mediaPass ? "pass" : "warning",
    scoreEarned: mediaPass ? 3 : 1,
    maxScore: 3,
    message: `${allImagesHaveAlt ? "All images have alt text." : "Some images missing alt text."} ${hasTelLink ? "Phone is a clickable tel: link." : "Phone missing tel: protocol."}`,
    suggestion: mediaPass ? undefined : "Add descriptive alt attributes to all <img> tags and ensure phone numbers use href='tel:...'.",
  });

  // 15. Valid Schema.org Structured Data
  checks.push({
    id: "schema-validity",
    name: "Valid Schema.org Structured Data",
    category: "structure",
    status: hasValidSchema ? "pass" : "warning",
    scoreEarned: hasValidSchema ? 3 : 1,
    maxScore: 3,
    message: hasValidSchema ? "Valid JSON-LD schema embedded." : "Schema missing or malformed JSON syntax.",
    suggestion: hasValidSchema ? undefined : "Embed a valid LocalBusiness or Service JSON-LD schema.",
  });

  // Sum total score
  const totalScore = Math.min(
    100,
    Math.max(
      0,
      checks.reduce((acc, c) => acc + c.scoreEarned, 0)
    )
  );

  return {
    pagePath,
    primaryKeyword: primaryKeyword || "Not specified",
    secondaryKeywords,
    totalScore,
    checks,
    metrics: {
      wordCount,
      keywordDensityPercent,
      keywordCount: kwMatches,
      titleLength,
      metaDescriptionLength,
      h1Count,
      internalLinksCount,
      hasContactLink,
      hasValidSchema,
      hasTelLink,
    },
  };
}

/**
 * Cannibalization Checker:
 * Flags any pages sharing the exact same primary keyword.
 */
export function detectKeywordCannibalization(
  keywordMap: { pagePath: string; primaryKeyword: string }[]
): { keyword: string; competingPages: string[] }[] {
  const map = new Map<string, string[]>();

  for (const item of keywordMap) {
    const kw = item.primaryKeyword.trim().toLowerCase();
    if (!kw) continue;
    const existing = map.get(kw) || [];
    existing.push(item.pagePath);
    map.set(kw, existing);
  }

  const conflicts: { keyword: string; competingPages: string[] }[] = [];
  for (const [keyword, pages] of map.entries()) {
    if (pages.length > 1) {
      conflicts.push({ keyword, competingPages: pages });
    }
  }

  return conflicts;
}

/**
 * Auto-suggest primary and secondary keywords for a given page
 */
export function suggestKeywordsForPage(
  pagePath: string,
  businessType: string,
  city: string,
  state: string,
  services: string[] = []
): { primary: string; secondaries: string[] } {
  const normType = businessType.trim();
  const normCity = city.trim();
  const normState = state.trim();

  // Home page
  if (pagePath === "index.html") {
    return {
      primary: `${normType} in ${normCity} ${normState}`,
      secondaries: [
        `best ${normType.toLowerCase()} ${normCity}`,
        `local ${normType.toLowerCase()} services`,
        `emergency ${normType.toLowerCase()} ${normCity}`,
        `${normCity} ${normType.toLowerCase()} company`,
      ],
    };
  }

  // Location pages (e.g. plumber-beaverton-or.html)
  if (pagePath.split("-").length >= 3 && !pagePath.startsWith("blog/")) {
    const cleanName = pagePath.replace(/\.html$/i, "");
    const parts = cleanName.split("-");
    const statePart = parts[parts.length - 1].toUpperCase();
    const cityPart = parts.slice(1, parts.length - 1).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    return {
      primary: `${normType} in ${cityPart}, ${statePart}`,
      secondaries: [
        `${cityPart} ${normType.toLowerCase()} near me`,
        `licensed ${normType.toLowerCase()} ${cityPart}`,
        `${cityPart} ${normType.toLowerCase()} contractor`,
        `emergency ${normType.toLowerCase()} ${cityPart} ${statePart}`,
      ],
    };
  }

  // Service pages (e.g. drain-cleaning.html)
  const matchedService = services.find(
    (s) => pagePath.toLowerCase().includes(s.toLowerCase().replace(/\s+/g, "-"))
  );
  if (matchedService) {
    return {
      primary: `${matchedService} in ${normCity} ${normState}`,
      secondaries: [
        `${matchedService.toLowerCase()} near me`,
        `emergency ${matchedService.toLowerCase()} ${normCity}`,
        `affordable ${matchedService.toLowerCase()}`,
        `local ${matchedService.toLowerCase()} company`,
      ],
    };
  }

  // About page
  if (pagePath.includes("about")) {
    return {
      primary: `About Our ${normType} Company in ${normCity}`,
      secondaries: [
        `licensed ${normType.toLowerCase()} technicians`,
        `locally owned ${normType.toLowerCase()} ${normCity}`,
        `${normCity} trusted contractors`,
      ],
    };
  }

  // Contact page
  if (pagePath.includes("contact")) {
    return {
      primary: `Contact ${normCity} ${normType}`,
      secondaries: [
        `schedule ${normType.toLowerCase()} appointment`,
        `free ${normType.toLowerCase()} estimate ${normCity}`,
        `call ${normType.toLowerCase()} today`,
      ],
    };
  }

  // Blog pages
  if (pagePath.startsWith("blog/")) {
    const slugTopic = pagePath.replace(/^blog\//, "").replace(/\.html$/, "").replace(/-/g, " ");
    return {
      primary: `${slugTopic} ${normCity}`,
      secondaries: [
        `${normType.toLowerCase()} homeowner guide`,
        `maintenance tips ${normCity}`,
      ],
    };
  }

  // General fallback
  return {
    primary: `${normType} ${normCity}`,
    secondaries: [`${normCity} local services`, `licensed ${normType.toLowerCase()}`],
  };
}

/**
 * Bulk paste parser:
 * Accepts lines formatted as: "page-url | primary keyword | secondary1, secondary2"
 */
export function parseBulkKeywordPaste(
  rawText: string
): { pagePath: string; primaryKeyword: string; secondaryKeywords: string[] }[] {
  const lines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const results: { pagePath: string; primaryKeyword: string; secondaryKeywords: string[] }[] = [];

  for (const line of lines) {
    const parts = line.split("|").map((p) => p.trim());
    if (parts.length >= 2) {
      let pagePath = parts[0];
      if (!pagePath.endsWith(".html") && !pagePath.includes(".")) {
        pagePath = `${pagePath}.html`;
      }
      const primaryKeyword = parts[1];
      const secondaryKeywords = parts[2]
        ? parts[2].split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      results.push({ pagePath, primaryKeyword, secondaryKeywords });
    }
  }

  return results;
}
