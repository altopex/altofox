/**
 * Master Page Registry for RankLocal Website Builder
 * 
 * Provides single source of truth for:
 * 1. All pages in the website built before HTML generation
 * 2. Exact relative path calculations (linkTo, assetPath)
 * 3. Two link styles: "web" (clean folder URLs) and "local" (index.html for local folder opening)
 * 4. AI internal linking parser ([[link:page-id|text]])
 * 5. Automatic page connections (Header, Footer, Breadcrumbs, Hubs, Cross-links)
 */

export type PageType =
  | "home"
  | "service"
  | "location"
  | "service_location"
  | "blog"
  | "about"
  | "contact"
  | "services hub"
  | "areas hub"
  | "blog hub";

export type LinkStyle = "web" | "local";

export interface RegistryPage {
  id: string;
  pageType: PageType;
  title: string;
  navLabel: string;
  outputFilePath: string; // e.g. "index.html", "about.html", "services/index.html", "areas/beaverton-or/index.html"
  parentPageId?: string;
  order?: number;
  data?: Record<string, any>; // City details, service items, coordinates, etc.
}

export interface BreadcrumbItem {
  name: string;
  url: string;
  isCurrent: boolean;
}

export class PageRegistry {
  private pagesById = new Map<string, RegistryPage>();
  private pagesByPath = new Map<string, RegistryPage>();
  private allPages: RegistryPage[] = [];

  constructor(pages: RegistryPage[] = []) {
    for (const p of pages) {
      this.register(p);
    }
  }

  public register(page: RegistryPage): void {
    const normalizedPath = normalizePath(page.outputFilePath);
    const entry: RegistryPage = {
      ...page,
      outputFilePath: normalizedPath,
    };
    this.pagesById.set(page.id, entry);
    this.pagesByPath.set(normalizedPath, entry);
    // Update or append in allPages
    const idx = this.allPages.findIndex((p) => p.id === page.id);
    if (idx >= 0) {
      this.allPages[idx] = entry;
    } else {
      this.allPages.push(entry);
    }
  }

  public getById(id: string): RegistryPage | undefined {
    return this.pagesById.get(id);
  }

  public getByPath(pathStr: string): RegistryPage | undefined {
    return this.pagesByPath.get(normalizePath(pathStr));
  }

  public getAll(): RegistryPage[] {
    return [...this.allPages];
  }

  public getByType(type: PageType): RegistryPage[] {
    return this.allPages.filter((p) => p.pageType === type);
  }

  public getChildren(parentId: string): RegistryPage[] {
    return this.allPages.filter((p) => p.parentPageId === parentId);
  }

  public getBreadcrumbTrail(pageIdOrPath: string): RegistryPage[] {
    const trail: RegistryPage[] = [];
    let current = this.getById(pageIdOrPath) || this.getByPath(pageIdOrPath);
    const visited = new Set<string>();

    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      trail.unshift(current);
      if (current.parentPageId) {
        current = this.getById(current.parentPageId);
      } else if (current.pageType !== "home") {
        // Fallback parent is home if not explicitly set
        current = this.getByType("home")[0];
      } else {
        break;
      }
    }

    return trail;
  }
}

/**
 * Normalizes a relative file path (removes leading slashes, backslashes to forward slashes)
 */
export function normalizePath(p: string): string {
  return p.replace(/\\/g, "/").replace(/^\/+/, "");
}

/**
 * Computes the relative path from the directory of `fromPage` to the target file `toFile`.
 */
function getRelativePath(fromFilePath: string, toFilePath: string): string {
  const fromClean = normalizePath(fromFilePath);
  const toClean = normalizePath(toFilePath);

  // Split into directory segments
  const fromParts = fromClean.split("/").slice(0, -1); // directory parts only
  const toParts = toClean.split("/");

  // Remove common prefix directories
  let i = 0;
  while (i < fromParts.length && i < toParts.length - 1 && fromParts[i] === toParts[i]) {
    i++;
  }

  const upCount = fromParts.length - i;
  const ups = upCount > 0 ? Array(upCount).fill("..") : [];
  const downs = toParts.slice(i);

  const relativeParts = [...ups, ...downs];
  return relativeParts.join("/") || "./";
}

/**
 * Calculates the exact relative link from one page to another.
 * 
 * Supports both link styles:
 * - "web": clean folder links (e.g. "../../areas/beaverton-or/" or "services/")
 * - "local": includes filename (e.g. "../../areas/beaverton-or/index.html" or "index.html")
 */
export function linkTo(
  fromPage: string | RegistryPage,
  toPage: string | RegistryPage,
  style: LinkStyle = "web"
): string {
  const fromPath = typeof fromPage === "string" ? fromPage : fromPage.outputFilePath;
  const toPath = typeof toPage === "string" ? toPage : toPage.outputFilePath;

  const rawRelative = getRelativePath(fromPath, toPath);

  if (style === "local") {
    // Local opening needs the exact HTML filename so double-clicking in file explorer works
    return rawRelative;
  }

  // "web" style: convert index.html references to clean folder URLs
  if (rawRelative === "index.html") {
    return "./";
  }
  if (rawRelative.endsWith("/index.html")) {
    return rawRelative.replace(/\/index\.html$/, "/");
  }

  return rawRelative;
}

/**
 * Calculates the exact relative path from a page's folder to a static asset (CSS, JS, images, fonts, favicon).
 * E.g. from "areas/beaverton-or/index.html" to "css/style.css" -> "../../css/style.css"
 */
export function assetPath(fromPage: string | RegistryPage, assetFilePath: string): string {
  const fromPath = typeof fromPage === "string" ? fromPage : fromPage.outputFilePath;
  const cleanAsset = normalizePath(assetFilePath);
  return getRelativePath(fromPath, cleanAsset);
}

/**
 * Converts internal AI link tags ([[link:page-id|Anchor Text]]) into verified <a> tags.
 * If the page id does not exist in the registry, the link is omitted and the plain text is preserved.
 */
export function resolveInternalLinks(
  contentHtml: string,
  fromPage: string | RegistryPage,
  registry: PageRegistry,
  style: LinkStyle = "web"
): string {
  if (!contentHtml) return "";

  // Pattern: [[link:page-id|Anchor Text]] or [[link:page-id]]
  const linkRegex = /\[\[link:([a-zA-Z0-9_\-\.\/]+)(?:\|([^\]]+))?\]\]/g;

  return contentHtml.replace(linkRegex, (_match, pageId, customText) => {
    const targetPage = registry.getById(pageId) || registry.getByPath(pageId);
    const displayText = customText ? customText.trim() : (targetPage ? targetPage.navLabel || targetPage.title : pageId);

    if (targetPage) {
      const href = linkTo(fromPage, targetPage, style);
      return `<a href="${href}" class="internal-link">${displayText}</a>`;
    }

    // Unrecognized ID: drop link tag, keep plain text
    return displayText;
  });
}

/**
 * Generates an accessible Breadcrumb trail HTML component and JSON-LD schema
 */
export function renderBreadcrumbs(
  registry: PageRegistry,
  currentPage: RegistryPage,
  domain: string = "example.com",
  style: LinkStyle = "web"
): { html: string; jsonLd: string } {
  const trail = registry.getBreadcrumbTrail(currentPage.id);
  if (trail.length <= 1) {
    return { html: "", jsonLd: "" };
  }

  const items: BreadcrumbItem[] = trail.map((page, index) => {
    const isCurrent = index === trail.length - 1;
    return {
      name: page.navLabel || page.title,
      url: linkTo(currentPage, page, style),
      isCurrent,
    };
  });

  const listItemsHtml = items
    .map((item) => {
      if (item.isCurrent) {
        return `<li class="breadcrumb-item active" aria-current="page"><span>${item.name}</span></li>`;
      }
      return `<li class="breadcrumb-item"><a href="${item.url}">${item.name}</a></li>`;
    })
    .join('\n      <li class="breadcrumb-separator" aria-hidden="true">/</li>\n      ');

  const html = `
  <nav aria-label="Breadcrumb" class="breadcrumbs-container container">
    <ol class="breadcrumb-list">
      ${listItemsHtml}
    </ol>
  </nav>`;

  const schemaItems = trail.map((page, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    name: page.navLabel || page.title,
    item: `https://${domain}/${page.outputFilePath === "index.html" ? "" : page.outputFilePath}`,
  }));

  const jsonLd = `
  <script type="application/ld+json">
  ${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: schemaItems,
  }, null, 2)}
  </script>`;

  return { html, jsonLd };
}

/**
 * Options to construct the Master Page Registry
 */
export interface RegistryBuilderOptions {
  businessName: string;
  nicheTrade?: string;
  mainPages?: { slug: string; title: string; navLabel?: string }[];
  services?: { slug: string; name: string; description?: string }[];
  locations?: {
    city: string;
    stateId: string;
    county?: string;
    slug?: string;
    lat?: number;
    lng?: number;
  }[];
  blogs?: { slug: string; title: string; date?: string }[];
  hasServicesHub?: boolean;
  hasAreasHub?: boolean;
  hasBlogHub?: boolean;
  useFolderStructure?: boolean; // false = flat files (services.html, plumber-beaverton-or.html); true = folder structure
}

/**
 * Builds the Master Page Registry before any HTML generation starts.
 */
export function buildMasterPageRegistry(options: RegistryBuilderOptions): PageRegistry {
  const registry = new PageRegistry();
  const trade = options.nicheTrade || "Local Service";
  const tradeSlug = trade.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const useFolders = Boolean(options.useFolderStructure);

  // 1. Home Page
  registry.register({
    id: "home",
    pageType: "home",
    title: `${options.businessName} | Top-Rated ${trade}`,
    navLabel: "Home",
    outputFilePath: "index.html",
    order: 1,
  });

  // 2. Main Standard Pages (About, Contact, FAQ, etc.)
  const standardPages = options.mainPages || [
    { slug: "about", title: `About Us | ${options.businessName}`, navLabel: "About" },
    { slug: "contact", title: `Contact Us | ${options.businessName}`, navLabel: "Contact" },
    { slug: "reviews", title: `Customer Reviews | ${options.businessName}`, navLabel: "Reviews" },
  ];

  for (const p of standardPages) {
    const slug = p.slug.replace(/\.html$/, "");
    if (slug === "index" || slug === "services" || slug === "service-areas") continue;

    const pageType: PageType = slug === "about" ? "about" : slug === "contact" ? "contact" : "about";
    registry.register({
      id: `page-${slug}`,
      pageType,
      title: p.title,
      navLabel: p.navLabel || p.title,
      outputFilePath: useFolders ? `${slug}/index.html` : `${slug}.html`,
      parentPageId: "home",
      order: 10,
    });
  }

  // 3. Services Hub
  const hasServicesHub = options.hasServicesHub !== false;
  if (hasServicesHub) {
    registry.register({
      id: "services-hub",
      pageType: "services hub",
      title: `Our Services | ${options.businessName}`,
      navLabel: "Services",
      outputFilePath: useFolders ? "services/index.html" : "services.html",
      parentPageId: "home",
      order: 2,
    });
  }

  // 4. Individual Service Pages
  if (options.services && options.services.length > 0) {
    for (const svc of options.services) {
      const svcSlug = svc.slug.replace(/^services\//, "").replace(/\.html$/, "");
      registry.register({
        id: `svc-${svcSlug}`,
        pageType: "service",
        title: `${svc.name} | ${options.businessName}`,
        navLabel: svc.name,
        outputFilePath: useFolders ? `services/${svcSlug}/index.html` : `service-${svcSlug}.html`,
        parentPageId: hasServicesHub ? "services-hub" : "home",
        order: 3,
        data: svc,
      });
    }
  }

  // 5. Service Areas Hub
  const hasAreasHub = options.hasAreasHub !== false && options.locations && options.locations.length > 0;
  if (hasAreasHub) {
    registry.register({
      id: "areas-hub",
      pageType: "areas hub",
      title: `Service Areas | ${options.businessName}`,
      navLabel: "Service Areas",
      outputFilePath: useFolders ? "service-areas/index.html" : "service-areas.html",
      parentPageId: "home",
      order: 4,
    });
  }

  // 6. Individual Location Pages
  if (options.locations && options.locations.length > 0) {
    for (const loc of options.locations) {
      const cityClean = loc.city.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const stateClean = loc.stateId.toLowerCase();
      const defaultSlug = `${tradeSlug}-${cityClean}-${stateClean}`;
      const slug = (loc.slug ? loc.slug.replace(/\.html$/, "") : defaultSlug);

      registry.register({
        id: `loc-${cityClean}-${stateClean}`,
        pageType: "location",
        title: `${trade} in ${loc.city}, ${loc.stateId} | ${options.businessName}`,
        navLabel: `${loc.city}, ${loc.stateId}`,
        outputFilePath: useFolders ? `areas/${cityClean}-${stateClean}/index.html` : `${slug}.html`,
        parentPageId: hasAreasHub ? "areas-hub" : "home",
        order: 5,
        data: loc,
      });
    }
  }

  // 7. Blog Hub & Posts
  if (options.blogs && options.blogs.length > 0) {
    const hasBlogHub = options.hasBlogHub !== false;
    if (hasBlogHub) {
      registry.register({
        id: "blog-hub",
        pageType: "blog hub",
        title: `Tips & Advice | ${options.businessName}`,
        navLabel: "Blog",
        outputFilePath: useFolders ? "blog/index.html" : "blog.html",
        parentPageId: "home",
        order: 6,
      });
    }

    for (const b of options.blogs) {
      const bSlug = b.slug.replace(/^blog\//, "").replace(/\.html$/, "");
      registry.register({
        id: `blog-${bSlug}`,
        pageType: "blog",
        title: `${b.title} | ${options.businessName}`,
        navLabel: b.title,
        outputFilePath: useFolders ? `blog/${bSlug}/index.html` : `blog-${bSlug}.html`,
        parentPageId: hasBlogHub ? "blog-hub" : "home",
        order: 7,
        data: b,
      });
    }
  }

  return registry;
}
