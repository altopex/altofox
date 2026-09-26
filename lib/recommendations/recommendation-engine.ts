/**
 * Recommendation Engine for Static HTML Website Builder
 * Analyzes HTML content in real-time across SEO, Visual Accessibility, and Content Structure.
 * Produces standardized BuilderRecommendation objects with actionable proposed changes.
 */

export type RecommendationCategory = "seo" | "accessibility" | "structure";
export type RecommendationSeverity = "critical" | "warning" | "suggestion";

export interface ProposedChange {
  action:
    | "replace_text"
    | "set_attribute"
    | "insert_meta"
    | "insert_element"
    | "replace_tag"
    | "wrap_element";
  targetSelector?: string;
  targetTag?: string;
  attributeName?: string;
  currentValue?: string;
  newValue: string;
  explanation: string;
}

export interface BuilderRecommendation {
  id: string;
  type: RecommendationCategory;
  severity: RecommendationSeverity;
  title: string;
  description: string;
  TargetElementId?: string;
  proposedChange: ProposedChange;
}

export interface AnalyzeContext {
  pagePath: string;
  primaryKeyword?: string;
  businessName?: string;
  phone?: string;
  city?: string;
  trade?: string;
}

/**
 * Scans an HTML document string and returns a standardized list of recommendations with auto-fixes.
 */
export function analyzeHtmlRecommendations(
  html: string,
  context: AnalyzeContext
): BuilderRecommendation[] {
  const recommendations: BuilderRecommendation[] = [];
  if (!html || typeof html !== "string") return recommendations;

  const kw = (context.primaryKeyword || `${context.trade || "Local Service"} in ${context.city || "Area"}`).trim();
  const businessName = context.businessName || "Local Business";
  const city = context.city || "Local";
  const phone = context.phone || "(555) 000-0000";

  // -------------------------------------------------------------
  // 1. SEO RECOMMENDATIONS
  // -------------------------------------------------------------

  // 1.1 Title Tag Check
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!titleMatch) {
    const suggestedTitle = `${kw} | ${businessName}`;
    recommendations.push({
      id: "seo-title-missing",
      type: "seo",
      severity: "critical",
      title: "Missing <title> Tag",
      description: "Search engines require a title tag to display your webpage in search results.",
      TargetElementId: "head > title",
      proposedChange: {
        action: "insert_meta",
        targetTag: "title",
        newValue: `<title>${suggestedTitle}</title>`,
        explanation: `Insert SEO title: "${suggestedTitle}"`,
      },
    });
  } else {
    const currentTitle = titleMatch[1].trim();
    if (kw && !currentTitle.toLowerCase().includes(kw.toLowerCase())) {
      const fixedTitle = currentTitle.includes("|")
        ? `${kw} | ${currentTitle.split("|")[1].trim()}`
        : `${currentTitle} - ${kw}`;
      recommendations.push({
        id: "seo-title-missing-keyword",
        type: "seo",
        severity: "warning",
        title: "Title Tag Lacks Primary Keyword",
        description: `Your primary keyword "${kw}" is missing from the title tag.`,
        TargetElementId: "head > title",
        proposedChange: {
          action: "replace_text",
          targetSelector: "title",
          currentValue: currentTitle,
          newValue: fixedTitle,
          explanation: `Update title to include primary keyword: "${fixedTitle}"`,
        },
      });
    } else if (currentTitle.length > 60) {
      const trimmed = currentTitle.slice(0, 57) + "...";
      recommendations.push({
        id: "seo-title-too-long",
        type: "seo",
        severity: "warning",
        title: "Title Tag Exceeds 60 Characters",
        description: `Current title is ${currentTitle.length} characters. Google truncates titles longer than 60 characters.`,
        TargetElementId: "head > title",
        proposedChange: {
          action: "replace_text",
          targetSelector: "title",
          currentValue: currentTitle,
          newValue: trimmed,
          explanation: `Shorten title to ${trimmed.length} characters`,
        },
      });
    }
  }

  // 1.2 Meta Description Check
  const metaDescMatch = html.match(/<meta[^>]*?name=["']description["'][^>]*?content=["']([^"']*)["'][^>]*>/i);
  if (!metaDescMatch) {
    const suggestedDesc = `Looking for trusted ${kw}? ${businessName} provides upfront quotes and top-rated local dispatch in ${city}. Call ${phone}.`;
    recommendations.push({
      id: "seo-meta-desc-missing",
      type: "seo",
      severity: "critical",
      title: "Missing Meta Description",
      description: "A meta description is required for click-through rate optimization in search engine snippets.",
      TargetElementId: "head > meta[name=description]",
      proposedChange: {
        action: "insert_meta",
        targetTag: "meta-description",
        newValue: `<meta name="description" content="${suggestedDesc}">`,
        explanation: `Insert meta description: "${suggestedDesc}"`,
      },
    });
  } else {
    const currentDesc = metaDescMatch[1].trim();
    if (currentDesc.length < 70) {
      const expandedDesc = `${currentDesc} Contact ${businessName} in ${city} at ${phone} for prompt local service.`.slice(0, 155);
      recommendations.push({
        id: "seo-meta-desc-too-short",
        type: "seo",
        severity: "warning",
        title: "Meta Description Too Short",
        description: `Current description is only ${currentDesc.length} characters (recommended: 120-160).`,
        TargetElementId: "head > meta[name=description]",
        proposedChange: {
          action: "set_attribute",
          targetSelector: 'meta[name="description"]',
          attributeName: "content",
          currentValue: currentDesc,
          newValue: expandedDesc,
          explanation: `Expand meta description to ${expandedDesc.length} characters`,
        },
      });
    }
  }

  // 1.3 Canonical URL Check
  if (!html.includes('<link rel="canonical"')) {
    const canonicalTag = `<link rel="canonical" href="https://${businessName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com/${context.pagePath === "index.html" ? "" : context.pagePath}">`;
    recommendations.push({
      id: "seo-canonical-missing",
      type: "seo",
      severity: "suggestion",
      title: "Missing Canonical Tag",
      description: "Canonical tags prevent duplicate content penalties from search engines.",
      TargetElementId: "head > link[rel=canonical]",
      proposedChange: {
        action: "insert_meta",
        targetTag: "canonical",
        newValue: canonicalTag,
        explanation: "Inject self-referencing canonical URL link tag",
      },
    });
  }

  // 1.4 Structured Data / Schema.org Check
  if (!html.includes('type="application/ld+json"')) {
    const schemaJson = JSON.stringify(
      {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: businessName,
        telephone: phone,
        address: {
          "@type": "PostalAddress",
          addressLocality: city,
          addressCountry: "US",
        },
      },
      null,
      2
    );
    const schemaTag = `<script type="application/ld+json">\n${schemaJson}\n</script>`;
    recommendations.push({
      id: "seo-schema-missing",
      type: "seo",
      severity: "warning",
      title: "Missing Schema.org Structured Data",
      description: "Adding LocalBusiness JSON-LD markup helps search engines qualify your business for local map packs and rich snippets.",
      TargetElementId: "head > script[type=application/ld+json]",
      proposedChange: {
        action: "insert_meta",
        targetTag: "schema",
        newValue: schemaTag,
        explanation: "Add LocalBusiness JSON-LD structured data",
      },
    });
  }

  // -------------------------------------------------------------
  // 2. VISUAL ACCESSIBILITY RECOMMENDATIONS (WCAG)
  // -------------------------------------------------------------

  // 2.1 HTML Lang Attribute
  const htmlTagMatch = html.match(/<html([^>]*)>/i);
  if (htmlTagMatch && !htmlTagMatch[1].includes("lang=")) {
    recommendations.push({
      id: "a11y-html-lang-missing",
      type: "accessibility",
      severity: "critical",
      title: 'Missing lang="en" on <html> Element',
      description: "Screen readers require a language attribute to announce text with correct pronunciation.",
      TargetElementId: "html",
      proposedChange: {
        action: "set_attribute",
        targetSelector: "html",
        attributeName: "lang",
        newValue: "en",
        explanation: 'Add lang="en" to <html>',
      },
    });
  }

  // 2.2 Images Missing Alt Text
  const imgRegex = /<img\b([^>]*?)>/gi;
  let imgMatch: RegExpExecArray | null;
  let imgIndex = 0;

  while ((imgMatch = imgRegex.exec(html)) !== null) {
    imgIndex++;
    const attrs = imgMatch[1];
    const hasAlt = /alt=["'][^"']*["']/i.test(attrs);
    const emptyAlt = /alt=["']\s*["']/i.test(attrs);

    if (!hasAlt || emptyAlt) {
      const srcMatch = attrs.match(/src=["']([^"']*)["']/i);
      const src = srcMatch ? srcMatch[1] : `image-${imgIndex}`;
      const fallbackAlt = `${kw} - ${businessName} in ${city}`;

      recommendations.push({
        id: `a11y-img-alt-${imgIndex}`,
        type: "accessibility",
        severity: "critical",
        title: `Image Missing Alt Text (${src.split("/").pop() || "image"})`,
        description: "WCAG 2.1 Level A requires all images to have informative descriptive alt text.",
        TargetElementId: `img[src*="${src}"]`,
        proposedChange: {
          action: "set_attribute",
          targetSelector: `img[src="${src}"]`,
          attributeName: "alt",
          newValue: fallbackAlt,
          explanation: `Add descriptive alt="${fallbackAlt}"`,
        },
      });
    }
  }

  // 2.3 Buttons without Accessible Name
  const buttonRegex = /<button\b([^>]*?)>([\s\S]*?)<\/button>/gi;
  let btnMatch: RegExpExecArray | null;
  let btnIndex = 0;

  while ((btnMatch = buttonRegex.exec(html)) !== null) {
    btnIndex++;
    const attrs = btnMatch[1];
    const content = btnMatch[2].replace(/<[^>]+>/g, "").trim();

    // Icon button with no text and no aria-label
    if (!content && !attrs.includes("aria-label")) {
      const isMenuBtn = attrs.includes("nav") || attrs.includes("menu") || attrs.includes("toggle");
      const suggestedLabel = isMenuBtn ? "Toggle Navigation Menu" : "Action Button";

      recommendations.push({
        id: `a11y-button-label-${btnIndex}`,
        type: "accessibility",
        severity: "warning",
        title: `Icon Button Missing Accessible Name (#${btnIndex})`,
        description: "Buttons without text must have an aria-label attribute for screen readers.",
        TargetElementId: `button:nth-of-type(${btnIndex})`,
        proposedChange: {
          action: "set_attribute",
          targetSelector: `button:nth-of-type(${btnIndex})`,
          attributeName: "aria-label",
          newValue: suggestedLabel,
          explanation: `Add aria-label="${suggestedLabel}"`,
        },
      });
    }
  }

  // -------------------------------------------------------------
  // 3. CONTENT STRUCTURE RECOMMENDATIONS
  // -------------------------------------------------------------

  // 3.1 Viewport Meta Tag
  if (!html.includes('name="viewport"')) {
    const viewportMeta = '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
    recommendations.push({
      id: "structure-viewport-missing",
      type: "structure",
      severity: "critical",
      title: "Missing Viewport Meta Tag",
      description: "Without a viewport meta tag, mobile devices render pages at desktop width, causing layout breakage.",
      TargetElementId: "head > meta[name=viewport]",
      proposedChange: {
        action: "insert_meta",
        targetTag: "viewport",
        newValue: viewportMeta,
        explanation: "Add standard responsive viewport meta tag",
      },
    });
  }

  // 3.2 Exactly One H1 Check
  const h1Matches = html.match(/<h1[\s\S]*?<\/h1>/gi) || [];
  if (h1Matches.length === 0) {
    const defaultH1 = `<h1>${kw} in ${city}</h1>`;
    recommendations.push({
      id: "structure-h1-missing",
      type: "structure",
      severity: "critical",
      title: "Page Has No Main H1 Heading",
      description: "Every page should have exactly one main <h1> heading clearly stating the topic.",
      TargetElementId: "main > h1",
      proposedChange: {
        action: "insert_element",
        targetSelector: "main, body",
        newValue: defaultH1,
        explanation: `Insert main H1: "${kw} in ${city}"`,
      },
    });
  } else if (h1Matches.length > 1) {
    recommendations.push({
      id: "structure-multiple-h1",
      type: "structure",
      severity: "warning",
      title: `Multiple H1 Headings Found (${h1Matches.length})`,
      description: "Pages should have exactly one H1. Subsequent H1s should be downgraded to H2.",
      TargetElementId: "h1:nth-of-type(2)",
      proposedChange: {
        action: "replace_tag",
        targetSelector: "h1:nth-of-type(2)",
        currentValue: "h1",
        newValue: "h2",
        explanation: "Downgrade redundant H1 heading to H2",
      },
    });
  }

  // 3.3 Semantic <main> Landmark
  if (!html.includes("<main") && html.includes("<body")) {
    recommendations.push({
      id: "structure-main-landmark-missing",
      type: "structure",
      severity: "suggestion",
      title: "Missing <main> Landmark",
      description: "A <main> landmark element communicates the central content area to assistive devices.",
      TargetElementId: "body",
      proposedChange: {
        action: "wrap_element",
        targetSelector: "body",
        newValue: "main",
        explanation: "Wrap primary sections inside a semantic <main> tag",
      },
    });
  }

  return recommendations;
}
