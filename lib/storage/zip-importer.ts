/**
 * Static Website ZIP & .siteproject Import Engine
 * Reads static HTML websites, parses pages, extracts metadata,
 * maps HTML sections to semantic types, captures unmapped content as custom blocks,
 * detects business details from JSON-LD schema & DOM, and matches themes from CSS.
 */

import JSZip from "jszip";
import { THEMES, Theme } from "../themes";
import { SavedProject, ProjectKeywordItem, ProjectChangeLogEntry } from "./project-types";
import { CustomContentBlock, GlobalBusinessDetails } from "../tools/custom-content";
import { SectionJSON, PageSeoJSON } from "../generator/content-schema";

export interface MappedPageSummary {
  path: string;
  title: string;
  description: string;
  h1: string;
  canonical?: string;
  sectionsCount: number;
  mappedSections: Array<{ type: string; title?: string }>;
  unmappedBlocksCount: number;
}

export interface WebsiteImportSummary {
  fileName: string;
  isSiteprojectBackup: boolean;
  pageCount: number;
  pages: MappedPageSummary[];
  imageCount: number;
  images: string[];
  detectedDetails: GlobalBusinessDetails;
  detectedTheme: Theme;
  detectedFonts: { heading: string; body: string };
  unmappedBlocksCount: number;
  customBlocks: CustomContentBlock[];
  warnings: string[];
}

/**
 * Calculates Euclidean distance between two hex color codes.
 */
function hexColorDistance(hex1: string, hex2: string): number {
  const parseHex = (h: string) => {
    let clean = h.replace("#", "").trim();
    if (clean.length === 3) {
      clean = clean.split("").map((c) => c + c).join("");
    }
    if (clean.length !== 6) return [0, 0, 0];
    return [
      parseInt(clean.slice(0, 2), 16) || 0,
      parseInt(clean.slice(2, 4), 16) || 0,
      parseInt(clean.slice(4, 6), 16) || 0,
    ];
  };

  const [r1, g1, b1] = parseHex(hex1);
  const [r2, g2, b2] = parseHex(hex2);

  return Math.sqrt(
    Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)
  );
}

/**
 * Detects theme colors and fonts from CSS files.
 */
export function detectThemeFromCss(cssText: string): {
  theme: Theme;
  fonts: { heading: string; body: string };
  detectedPrimary?: string;
} {
  let primaryColor: string | null = null;
  let headingFont: string = "Plus Jakarta Sans";
  let bodyFont: string = "Inter";

  // Check CSS variables
  const primaryVarMatch = cssText.match(/--color-primary\s*:\s*([^;}\n]+)/i);
  if (primaryVarMatch) {
    primaryColor = primaryVarMatch[1].trim();
  }

  const headingFontMatch = cssText.match(/--font-heading\s*:\s*['"]?([^,'";}\n]+)/i);
  if (headingFontMatch) {
    headingFont = headingFontMatch[1].trim();
  }

  const bodyFontMatch = cssText.match(/--font-body\s*:\s*['"]?([^,'";}\n]+)/i);
  if (bodyFontMatch) {
    bodyFont = bodyFontMatch[1].trim();
  }

  // Fallback: look for common font-family rules
  if (headingFont === "Plus Jakarta Sans") {
    const fontHeadingRule = cssText.match(/h1[^{]*\{[^}]*font-family\s*:\s*['"]?([^,'";}\n]+)/i);
    if (fontHeadingRule) headingFont = fontHeadingRule[1].trim();
  }

  // Fallback: search for top hex color in background or button
  if (!primaryColor) {
    const hexMatches = cssText.match(/#[0-9a-fA-F]{6}\b/g);
    if (hexMatches && hexMatches.length > 0) {
      // Find most common non-black/white/grey hex
      const counts: Record<string, number> = {};
      const ignore = new Set(["#ffffff", "#000000", "#f8fafc", "#f1f5f9", "#e2e8f0", "#cbd5e1", "#64748b", "#0f172a"]);
      for (const h of hexMatches) {
        const lower = h.toLowerCase();
        if (!ignore.has(lower)) {
          counts[lower] = (counts[lower] || 0) + 1;
        }
      }
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0) {
        primaryColor = sorted[0][0];
      }
    }
  }

  // Find closest theme from THEMES
  let bestTheme = THEMES[0];
  let minDistance = Infinity;

  if (primaryColor) {
    for (const t of THEMES) {
      const dist = hexColorDistance(primaryColor, t.colors.primary);
      if (dist < minDistance) {
        minDistance = dist;
        bestTheme = t;
      }
    }
  }

  return {
    theme: bestTheme,
    fonts: {
      heading: headingFont,
      body: bodyFont,
    },
    detectedPrimary: primaryColor || undefined,
  };
}

/**
 * Extracts business details from HTML files using JSON-LD LocalBusiness schema & DOM fallbacks.
 */
export function detectBusinessDetailsFromHtml(
  htmlFiles: { path: string; content: string }[]
): GlobalBusinessDetails {
  const details: GlobalBusinessDetails = {
    businessName: "Imported Business",
    phone: "(555) 000-0000",
    email: "",
    streetAddress: "",
    city: "Local",
    stateRegion: "TX",
    zipPostalCode: "",
    businessHours: "Mon-Sat: 7:00 AM - 7:00 PM",
    websiteDomain: "example.com",
    businessModel: "service-area",
  };

  // 1. Try JSON-LD schema across all pages (starting with index.html)
  const indexFirst = [...htmlFiles].sort((a, b) => {
    if (a.path === "index.html") return -1;
    if (b.path === "index.html") return 1;
    return 0;
  });

  for (const file of indexFirst) {
    const jsonLdMatches = file.content.matchAll(
      /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    );

    for (const match of jsonLdMatches) {
      try {
        const parsed = JSON.parse(match[1]);
        const items = Array.isArray(parsed) ? parsed : [parsed];

        for (const item of items) {
          const type = (item["@type"] || "").toLowerCase();
          if (
            type.includes("localbusiness") ||
            type.includes("organization") ||
            type.includes("service") ||
            type.includes("contractor") ||
            type.includes("plumber") ||
            type.includes("electrician") ||
            type.includes("hvac")
          ) {
            if (item.name && typeof item.name === "string") {
              details.businessName = item.name.trim();
            }
            if (item.telephone && typeof item.telephone === "string") {
              details.phone = item.telephone.trim();
            }
            if (item.email && typeof item.email === "string") {
              details.email = item.email.trim();
            }
            if (item.url && typeof item.url === "string") {
              details.websiteDomain = item.url.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
            }
            if (item.address) {
              const addr = item.address;
              if (addr.streetAddress) details.streetAddress = addr.streetAddress.trim();
              if (addr.addressLocality) details.city = addr.addressLocality.trim();
              if (addr.addressRegion) details.stateRegion = addr.addressRegion.trim();
              if (addr.postalCode) details.zipPostalCode = addr.postalCode.trim();
            }
            if (item.openingHoursSpecification && Array.isArray(item.openingHoursSpecification)) {
              details.businessHours = "24/7 Emergency Service Available";
            }
          }
        }
      } catch (err) {
        // invalid JSON-LD script, ignore
      }
    }
  }

  // 2. Fallbacks from DOM text if fields still empty or default
  for (const file of indexFirst) {
    // Phone fallback from tel: links
    if (details.phone === "(555) 000-0000") {
      const telMatch = file.content.match(/href=["']tel:([^"']+)["']/i);
      if (telMatch) {
        details.phone = telMatch[1].trim();
      }
    }

    // Email fallback from mailto: links
    if (!details.email) {
      const mailtoMatch = file.content.match(/href=["']mailto:([^"']+)["']/i);
      if (mailtoMatch) {
        details.email = mailtoMatch[1].trim();
      }
    }

    // Business Name fallback from title tag (e.g. "Service in City | Business Name")
    if (details.businessName === "Imported Business") {
      const titleMatch = file.content.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (titleMatch) {
        const fullTitle = titleMatch[1].trim();
        if (fullTitle.includes("|")) {
          const parts = fullTitle.split("|");
          details.businessName = parts[parts.length - 1].trim();
        } else if (fullTitle.includes(" - ")) {
          const parts = fullTitle.split(" - ");
          details.businessName = parts[parts.length - 1].trim();
        }
      }
    }

    // City & State fallback from title or footer
    if (details.city === "Local") {
      const cityStateMatch = file.content.match(/\bin\s+([A-Za-z\s]+),\s*([A-Z]{2})\b/i);
      if (cityStateMatch) {
        details.city = cityStateMatch[1].trim();
        details.stateRegion = cityStateMatch[2].trim().toUpperCase();
      }
    }
  }

  return details;
}

/**
 * Parses an HTML string and extracts page SEO metadata, semantic section mappings,
 * and preserves any unmapped content containers as custom content blocks.
 */
export function parseHtmlPageToSections(
  html: string,
  pagePath: string
): {
  seo: PageSeoJSON;
  sections: SectionJSON[];
  unmappedBlocks: CustomContentBlock[];
} {
  const seo: PageSeoJSON = {
    title: "",
    description: "",
    h1: "",
  };

  const sections: SectionJSON[] = [];
  const unmappedBlocks: CustomContentBlock[] = [];

  // Extract <title>
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) seo.title = titleMatch[1].replace(/<[^>]+>/g, "").trim();

  // Extract meta description
  const metaMatch = html.match(
    /<meta[^>]*?name=["']description["'][^>]*?content=["']([^"']*)["']/i
  ) || html.match(
    /<meta[^>]*?content=["']([^"']*)["'][^>]*?name=["']description["']/i
  );
  if (metaMatch) seo.description = metaMatch[1].trim();

  // Extract canonical
  const canonicalMatch = html.match(/<link[^>]*?rel=["']canonical["'][^>]*?href=["']([^"']*)["']/i);
  if (canonicalMatch) (seo as any).canonical = canonicalMatch[1].trim();

  // Extract H1
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match) seo.h1 = h1Match[1].replace(/<[^>]+>/g, "").trim();

  // Use DOMParser if available in browser
  if (typeof window !== "undefined" && typeof DOMParser !== "undefined") {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      const body = doc.body;
      const main = doc.querySelector("main") || body;

      // Scan all direct section/header/footer elements or top-level containers
      const elements = Array.from(main.querySelectorAll("section, header.hero, div.hero, footer"));

      // Helper to classify section type
      const classifyElement = (el: Element): { type: string; title?: string } | null => {
        const cls = (el.className || "").toLowerCase();
        const id = (el.id || "").toLowerCase();
        const tag = el.tagName.toLowerCase();
        const text = el.textContent?.toLowerCase() || "";

        if (tag === "footer" || cls.includes("footer")) {
          return { type: "footer", title: "Footer" };
        }
        if (cls.includes("hero") || id.includes("hero") || el.querySelector("h1")) {
          return { type: "hero", title: "Hero Header" };
        }
        if (cls.includes("trust") || cls.includes("badge") || text.includes("star rated") || text.includes("licensed & insured")) {
          return { type: "trust_bar", title: "Trust Bar & Accreditations" };
        }
        if (cls.includes("service") || id.includes("service")) {
          return { type: "services", title: "Services Overview" };
        }
        if (cls.includes("about") || id.includes("about")) {
          return { type: "about", title: "About Business" };
        }
        if (cls.includes("why") || id.includes("why") || cls.includes("benefit")) {
          return { type: "why_choose_us", title: "Why Choose Us" };
        }
        if (cls.includes("process") || cls.includes("step") || id.includes("process")) {
          return { type: "process", title: "Working Process" };
        }
        if (cls.includes("faq") || id.includes("faq") || cls.includes("accordion")) {
          return { type: "faq", title: "Frequently Asked Questions" };
        }
        if (cls.includes("review") || cls.includes("testimonial") || id.includes("review")) {
          return { type: "reviews", title: "Customer Reviews" };
        }
        if (cls.includes("emergency") || cls.includes("banner") || text.includes("24/7 emergency")) {
          return { type: "emergency_banner", title: "Emergency Dispatch Banner" };
        }
        if (cls.includes("area") || cls.includes("coverage") || id.includes("service-areas")) {
          return { type: "service_areas", title: "Service Areas & Coverage" };
        }
        if (cls.includes("contact") || id.includes("contact") || el.querySelector("form")) {
          return { type: "contact", title: "Contact & Quote Form" };
        }

        return null;
      };

      if (elements.length > 0) {
        elements.forEach((el, index) => {
          const classified = classifyElement(el);
          if (classified) {
            sections.push({
              type: classified.type,
              variant: "imported",
              content: {
                title: classified.title,
                heading: el.querySelector("h2, h3")?.textContent?.trim() || classified.title,
                rawHtml: el.outerHTML,
              },
            });
          } else {
            // Unmapped section - retain as CustomContentBlock
            const blockId = `block-${pagePath.replace(/[^a-z0-9]/gi, "-")}-${index + 1}`;
            unmappedBlocks.push({
              id: blockId,
              title: `Unmapped Section (${pagePath} #${index + 1})`,
              content: el.outerHTML,
              placement: "specific",
              specificPages: [pagePath],
              position: "end-of-main",
              mode: "exact",
              active: true,
            });
          }
        });
      } else {
        // No explicit sections: check main body inner HTML
        sections.push({
          type: "hero",
          variant: "imported",
          content: {
            title: seo.h1 || seo.title || "Main Content",
          },
        });
      }
    } catch (err) {
      // Fallback if DOMParser throws
    }
  }

  // Fallback section mapping if DOM parsing didn't create any
  if (sections.length === 0) {
    sections.push({
      type: "hero",
      variant: "imported",
      content: {
        title: seo.h1 || "Main Section",
      },
    });
  }

  return { seo, sections, unmappedBlocks };
}

/**
 * Main importer function: reads a static website ZIP or .siteproject file,
 * extracts all HTML pages, images, and styling, and synthesizes a full SavedProject.
 */
export async function importWebsiteZip(
  file: File | Blob
): Promise<{ summary: WebsiteImportSummary; project: SavedProject }> {
  const zip = await JSZip.loadAsync(file);
  const fileEntries = Object.keys(zip.files).filter((k) => !zip.files[k].dir && !k.startsWith("__MACOSX") && !k.includes(".DS_Store"));

  // Check if this is a .siteproject backup archive
  const projectJsonFile = zip.file("project.json");
  if (projectJsonFile) {
    const jsonText = await projectJsonFile.async("string");
    const parsed = JSON.parse(jsonText);
    const originalProj: SavedProject = parsed.project || parsed;

    // Refresh ID and stamp import history
    const restoredProject: SavedProject = {
      ...originalProj,
      id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${originalProj.name} (Imported)`,
      lastEditedAt: Date.now(),
      changeLog: [
        {
          id: `log-${Date.now()}`,
          timestamp: Date.now(),
          dateStr: new Date().toLocaleDateString(),
          summary: `Imported backup on ${new Date().toLocaleDateString()}`,
          affectedPages: originalProj.files?.map((f) => f.path) || [],
        },
        ...(originalProj.changeLog || []),
      ],
    };

    const summary: WebsiteImportSummary = {
      fileName: (file as any).name || "website-backup.siteproject",
      isSiteprojectBackup: true,
      pageCount: restoredProject.files.filter((f) => f.path.endsWith(".html")).length,
      pages: restoredProject.files
        .filter((f) => f.path.endsWith(".html"))
        .map((f) => ({
          path: f.path,
          title: f.path,
          description: "Restored from .siteproject backup",
          h1: f.path,
          sectionsCount: 1,
          mappedSections: [{ type: "hero", title: "Restored Page" }],
          unmappedBlocksCount: 0,
        })),
      imageCount: restoredProject.files.filter((f) => f.path.startsWith("images/")).length,
      images: restoredProject.files.filter((f) => f.path.startsWith("images/")).map((f) => f.path),
      detectedDetails: restoredProject.businessDetails,
      detectedTheme: restoredProject.theme,
      detectedFonts: restoredProject.theme?.fonts || { heading: "Plus Jakarta Sans", body: "Inter" },
      unmappedBlocksCount: restoredProject.customBlocks?.length || 0,
      customBlocks: restoredProject.customBlocks || [],
      warnings: [],
    };

    return { summary, project: restoredProject };
  }

  // Otherwise, it's a static HTML Website ZIP!
  const htmlFiles: { path: string; content: string }[] = [];
  const cssFiles: { path: string; content: string }[] = [];
  const imageFiles: { path: string; content: string; mimeType: string }[] = [];
  const otherFiles: { path: string; content: string }[] = [];

  for (const path of fileEntries) {
    const entry = zip.file(path);
    if (!entry) continue;

    const lowerPath = path.toLowerCase();

    // Clean relative path (strip top-level root folder wrapper if any)
    const cleanPath = path.replace(/^[^/]+\//, (match) => {
      // If all files share a common single root folder e.g. "my-site/index.html"
      const allShareFolder = fileEntries.every((f) => f.startsWith(match));
      return allShareFolder ? "" : match;
    });

    if (lowerPath.endsWith(".html") || lowerPath.endsWith(".htm")) {
      const content = await entry.async("string");
      htmlFiles.push({ path: cleanPath, content });
    } else if (lowerPath.endsWith(".css")) {
      const content = await entry.async("string");
      cssFiles.push({ path: cleanPath, content });
    } else if (
      lowerPath.endsWith(".png") ||
      lowerPath.endsWith(".jpg") ||
      lowerPath.endsWith(".jpeg") ||
      lowerPath.endsWith(".webp") ||
      lowerPath.endsWith(".svg") ||
      lowerPath.endsWith(".gif") ||
      lowerPath.endsWith(".ico")
    ) {
      let mimeType = "image/png";
      if (lowerPath.endsWith(".jpg") || lowerPath.endsWith(".jpeg")) mimeType = "image/jpeg";
      if (lowerPath.endsWith(".webp")) mimeType = "image/webp";
      if (lowerPath.endsWith(".svg")) mimeType = "image/svg+xml";
      if (lowerPath.endsWith(".gif")) mimeType = "image/gif";

      const base64 = await entry.async("base64");
      const dataUrl = `data:${mimeType};base64,${base64}`;
      imageFiles.push({ path: cleanPath, content: dataUrl, mimeType });
    } else {
      const content = await entry.async("string").catch(() => "");
      otherFiles.push({ path: cleanPath, content });
    }
  }

  if (htmlFiles.length === 0) {
    throw new Error("No HTML files found in ZIP archive. Please upload a valid website ZIP containing .html files.");
  }

  // 1. Detect Business Details
  const detectedDetails = detectBusinessDetailsFromHtml(htmlFiles);

  // 2. Detect Theme & Fonts from combined CSS
  const combinedCss = cssFiles.map((c) => c.content).join("\n");
  const { theme: detectedTheme, fonts: detectedFonts } = detectThemeFromCss(combinedCss);

  // 3. Process every HTML page: SEO metadata, sections, unmapped blocks
  const pagesSummary: MappedPageSummary[] = [];
  const allCustomBlocks: CustomContentBlock[] = [];
  const keywordMap: ProjectKeywordItem[] = [];
  const pageContentMap: Record<string, any> = {};

  for (const page of htmlFiles) {
    const { seo, sections, unmappedBlocks } = parseHtmlPageToSections(page.content, page.path);

    pagesSummary.push({
      path: page.path,
      title: seo.title || page.path,
      description: seo.description || "Imported page",
      h1: seo.h1 || seo.title || page.path,
      canonical: (seo as any).canonical,
      sectionsCount: sections.length,
      mappedSections: sections.map((s) => ({ type: s.type, title: s.content?.title || s.type })),
      unmappedBlocksCount: unmappedBlocks.length,
    });

    if (unmappedBlocks.length > 0) {
      allCustomBlocks.push(...unmappedBlocks);
    }

    // Keyword targeting initialization
    keywordMap.push({
      pagePath: page.path,
      primaryKeyword: seo.h1 || `${detectedDetails.businessName} ${detectedDetails.city}`,
      secondaryKeywords: [],
      seoScore: 75,
    });

    pageContentMap[page.path] = {
      slug: page.path.replace(/\.html$/, ""),
      seo,
      sections,
    };
  }

  // 4. Build SavedProject structure
  const now = Date.now();
  const dateStr = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const changeLog: ProjectChangeLogEntry[] = [
    {
      id: `log-${now}`,
      timestamp: now,
      dateStr,
      summary: `Imported ${dateStr}`,
      affectedPages: htmlFiles.map((h) => h.path),
      note: `Imported static website with ${htmlFiles.length} pages, ${imageFiles.length} images, and ${allCustomBlocks.length} custom blocks.`,
    },
  ];

  // Consolidate project files (preserve exact URLs)
  const allFiles: SavedProject["files"] = [
    ...htmlFiles.map((h) => ({
      path: h.path,
      content: h.content,
      mimeType: "text/html",
      lastModified: now,
    })),
    ...cssFiles.map((c) => ({
      path: c.path,
      content: c.content,
      mimeType: "text/css",
      lastModified: now,
    })),
    ...imageFiles.map((img) => ({
      path: img.path,
      content: img.content,
      mimeType: img.mimeType,
      lastModified: now,
    })),
    ...otherFiles.map((o) => ({
      path: o.path,
      content: o.content,
      lastModified: now,
    })),
  ];

  // Ensure sitemap.xml exists
  if (!allFiles.some((f) => f.path === "sitemap.xml")) {
    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${htmlFiles
  .map(
    (p) => `  <url>
    <loc>https://${detectedDetails.websiteDomain}/${p.path}</loc>
    <changefreq>weekly</changefreq>
    <priority>${p.path === "index.html" ? "1.0" : "0.8"}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;
    allFiles.push({
      path: "sitemap.xml",
      content: sitemapContent,
      mimeType: "application/xml",
      lastModified: now,
    });
  }

  const project: SavedProject = {
    id: `proj-${now}-${Math.random().toString(36).substring(2, 6)}`,
    name: detectedDetails.businessName || "Imported Website",
    createdAt: now,
    lastEditedAt: now,
    theme: detectedTheme,
    nicheId: "general",
    schemaType: "LocalBusiness",
    businessDetails: detectedDetails,
    formData: {
      businessName: detectedDetails.businessName,
      businessType: "Local Business",
      city: detectedDetails.city,
      stateRegion: detectedDetails.stateRegion,
      phone: detectedDetails.phone,
      email: detectedDetails.email,
      websiteDomain: detectedDetails.websiteDomain,
      theme: detectedTheme,
    },
    serviceAreaCities: [
      {
        city: detectedDetails.city,
        stateId: detectedDetails.stateRegion,
        county: "",
        lat: 0,
        lng: 0,
      },
    ],
    keywordMap,
    customBlocks: allCustomBlocks,
    pageContentMap,
    files: allFiles,
    changeLog,
    redirects: [],
    optimizationCycles: [],
  };

  const summary: WebsiteImportSummary = {
    fileName: (file as any).name || "website.zip",
    isSiteprojectBackup: false,
    pageCount: htmlFiles.length,
    pages: pagesSummary,
    imageCount: imageFiles.length,
    images: imageFiles.map((i) => i.path),
    detectedDetails,
    detectedTheme,
    detectedFonts,
    unmappedBlocksCount: allCustomBlocks.length,
    customBlocks: allCustomBlocks,
    warnings:
      allCustomBlocks.length > 0
        ? [
            `${allCustomBlocks.length} section(s) had non-standard markup and were safely saved as Custom Content Blocks to guarantee zero content loss.`,
          ]
        : [],
  };

  return { summary, project };
}
