/**
 * RankLocal 2.0: Master Internal Linking Engine
 *
 * Implements a strict, graph-theoretic internal linking architecture:
 *
 * 1. Create complete URL map before generating links.
 * 2. Verify every target exists before planning edges.
 * 3. Generate links adhering strictly to relationship types:
 *    - Homepage → Services
 *    - Homepage → Locations
 *    - Service → Related Services
 *    - Service → Locations
 *    - Location → Services
 *    - Location → Related Locations
 *    - Blog → Services
 *    - Blog → Locations
 * 4. Validate links.
 * 5. Detect and eliminate orphan pages.
 * 6. Detect and prevent excessive repeated anchor text.
 * 7. Insert links into HTML with relative URL resolution.
 * 8. Run full internal-link audit (Total pages, Internal links, Broken links, Orphan pages).
 *
 * Guarantees:
 * - NEVER generate links to nonexistent pages.
 * - NEVER allow broken internal links.
 */

import {
  calculateRelativeHref,
  resolveHref,
  normalizeFilePath,
  PageType,
} from "./connectivity-engine";

export type InternalRelationshipType =
  | "homepage_to_services"
  | "homepage_to_locations"
  | "service_to_related_services"
  | "service_to_locations"
  | "location_to_services"
  | "location_to_related_locations"
  | "blog_to_services"
  | "blog_to_locations"
  | "silo_child_to_hub"
  | "orphan_recovery";

export interface PageUrlEntry {
  filePath: string;          // Normalized: e.g. "index.html", "services.html", "water-heater-repair.html"
  url: string;               // "/" or "/water-heater-repair.html"
  slug: string;              // "index", "services", "water-heater-repair"
  title: string;
  h1?: string;
  metaDescription?: string;
  pageType: PageType;
  serviceName?: string;
  serviceCategory?: string;
  locationCity?: string;
  locationState?: string;
  rawHtml: string;
}

export interface PlannedInternalLink {
  sourceFilePath: string;
  targetFilePath: string;
  relationshipType: InternalRelationshipType;
  anchorText: string;
  contextNote?: string;
  priority: number;
}

export interface InternalLinkAuditReport {
  totalPages: number;
  internalLinks: number;
  brokenLinks: number;
  orphanPages: number;
  brokenLinksList: Array<{ source: string; href: string; reason: string }>;
  orphanPagesList: string[];
  repeatedAnchorWarnings: Array<{
    target: string;
    dominantAnchor: string;
    count: number;
    percentage: number;
  }>;
  relationshipBreakdown: Record<InternalRelationshipType, number>;
  clickDepthMap: Record<string, number>;
  maxClickDepth: number;
  averageClickDepth: number;
  isHealthy: boolean;
  reportText: string;
  summaryReportText: string;
}

export interface InternalLinkEngineOptions {
  businessName?: string;
  primaryTrade?: string;
  domain?: string;
  serviceAreaCities?: { city: string; stateId?: string }[];
  maxLinksPerPage?: number;
  maxRepeatedAnchorThreshold?: number; // default 0.35 (35%)
}

export class InternalLinkEngine {
  // 1. Complete URL Map
  public urlMap: Map<string, PageUrlEntry> = new Map();

  // 2. Internal Link Graph (Planned before insertion)
  public plannedEdges: Map<string, PlannedInternalLink[]> = new Map(); // sourceFilePath -> PlannedInternalLink[]
  public incomingPlannedEdges: Map<string, PlannedInternalLink[]> = new Map(); // targetFilePath -> PlannedInternalLink[]

  private options: InternalLinkEngineOptions;
  private anchorUsageTracker: Map<string, Map<string, number>> = new Map(); // targetPath -> (anchorText -> count)

  constructor(options: InternalLinkEngineOptions = {}) {
    this.options = {
      maxLinksPerPage: 8,
      maxRepeatedAnchorThreshold: 0.35,
      ...options,
    };
  }

  // =========================================================================
  // STEP 1: CREATE COMPLETE URL MAP
  // =========================================================================
  public createUrlMap(
    files: { path: string; content: string | Buffer; mimeType?: string | null }[]
  ): Map<string, PageUrlEntry> {
    this.urlMap.clear();
    this.plannedEdges.clear();
    this.incomingPlannedEdges.clear();
    this.anchorUsageTracker.clear();

    const domain = (this.options.domain || "example.com")
      .replace(/^https?:\/\//i, "")
      .replace(/\/+$/, "");

    const htmlFiles = files.filter(
      (f) => f && f.path && (f.path.endsWith(".html") || f.path.endsWith(".htm"))
    );

    for (const file of htmlFiles) {
      const cleanPath = normalizeFilePath(file.path);
      const rawHtml =
        typeof file.content === "string"
          ? file.content
          : file.content.toString("utf-8");
      const slug = cleanPath.replace(/\.html?$/i, "");

      // Extract Title
      const titleMatch = rawHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : `${slug} | Local Services`;

      // Extract H1
      const h1Match = rawHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      const h1 = h1Match ? h1Match[1].replace(/<[^>]+>/g, "").trim() : undefined;

      // Extract Meta Description
      const metaMatch = rawHtml.match(
        /<meta[^>]*?name=["']description["'][^>]*?content=["']([^"']*)["']/i
      );
      const metaDescription = metaMatch ? metaMatch[1].trim() : undefined;

      // Classify Page Type
      const pageType = this.classifyPageType(cleanPath, title);

      // Detect City
      let detectedCity: string | undefined = undefined;
      if (this.options.serviceAreaCities) {
        for (const c of this.options.serviceAreaCities) {
          const citySlug = c.city.toLowerCase().replace(/\s+/g, "-");
          if (
            cleanPath.toLowerCase().includes(citySlug) ||
            title.toLowerCase().includes(c.city.toLowerCase())
          ) {
            detectedCity = c.city;
            break;
          }
        }
      }

      if (!detectedCity) {
        const inMatch = title.match(/\bin\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
        if (inMatch) {
          detectedCity = inMatch[1].trim();
        } else if (
          cleanPath.startsWith("plumber-") ||
          cleanPath.startsWith("electrician-") ||
          cleanPath.startsWith("roofing-") ||
          cleanPath.startsWith("hvac-")
        ) {
          const rawCity = cleanPath.replace(/^[a-z]+-/, "").replace(/\.html$/, "");
          detectedCity = rawCity
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
        }
      }

      // Detect Service Name
      let serviceName = this.options.primaryTrade || "Local Service";
      if (title.includes("|")) {
        serviceName = title.split("|")[0].trim();
      } else if (title.includes("-")) {
        serviceName = title.split("-")[0].trim();
      }

      const entry: PageUrlEntry = {
        filePath: cleanPath,
        url: cleanPath === "index.html" ? "/" : `/${cleanPath}`,
        slug,
        title,
        h1,
        metaDescription,
        pageType,
        serviceName,
        serviceCategory: this.options.primaryTrade,
        locationCity: detectedCity,
        locationState: this.options.serviceAreaCities?.[0]?.stateId,
        rawHtml,
      };

      this.urlMap.set(cleanPath, entry);
      this.plannedEdges.set(cleanPath, []);
      this.incomingPlannedEdges.set(cleanPath, []);
    }

    return this.urlMap;
  }

  private classifyPageType(cleanPath: string, title: string): PageType {
    if (cleanPath === "index.html") return "homepage";
    if (cleanPath === "services.html" || cleanPath === "services/index.html") return "service_hub";
    if (cleanPath === "service-areas.html" || cleanPath === "areas/index.html") return "location_hub";
    if (cleanPath === "blog.html" || cleanPath === "blog/index.html") return "blog_hub";
    if (cleanPath.startsWith("blog/")) return "blog_post";
    if (cleanPath === "about.html" || cleanPath.includes("about-us")) return "about_page";
    if (cleanPath === "contact.html" || cleanPath.includes("contact-us")) return "contact_page";
    if (cleanPath.includes("faq")) return "faq_page";

    let hasCity = Boolean(
      this.options.serviceAreaCities?.some(
        (c) =>
          cleanPath.toLowerCase().includes(c.city.toLowerCase().replace(/\s+/g, "-")) ||
          title.toLowerCase().includes(c.city.toLowerCase())
      ) ||
        cleanPath.startsWith("areas/") ||
        cleanPath.startsWith("locations/")
    );

    if (!hasCity) {
      if (
        cleanPath.startsWith("plumber-") ||
        cleanPath.startsWith("electrician-") ||
        cleanPath.startsWith("roofing-") ||
        cleanPath.startsWith("hvac-") ||
        /\bin\s+[A-Z][a-z]+/i.test(title)
      ) {
        hasCity = true;
      }
    }

    const parts = cleanPath.replace(/\.html$/, "").split("-");
    if (hasCity && parts.length >= 3) {
      return "service_location_page";
    }
    if (hasCity) {
      return "location_page";
    }

    return "service_page";
  }

  // =========================================================================
  // STEP 2: VERIFY EVERY TARGET EXISTS
  // =========================================================================
  /**
   * Strictly verifies if a candidate target file path exists in the URL map.
   * NEVER links to a nonexistent page!
   */
  public verifyTargetExists(targetFilePath: string): boolean {
    const cleanTarget = normalizeFilePath(targetFilePath);
    return this.urlMap.has(cleanTarget);
  }

  /**
   * Strictly verifies all candidate target paths against the URL map before link generation.
   * Guarantees: Never generate links to nonexistent pages.
   */
  public verifyEveryTargetExists(candidateTargets?: string[]): {
    allExist: boolean;
    validTargets: string[];
    missingTargets: string[];
  } {
    const targets = candidateTargets || Array.from(this.urlMap.keys());
    const validTargets: string[] = [];
    const missingTargets: string[] = [];

    for (const target of targets) {
      if (this.verifyTargetExists(target)) {
        validTargets.push(normalizeFilePath(target));
      } else {
        missingTargets.push(target);
      }
    }

    return {
      allExist: missingTargets.length === 0,
      validTargets,
      missingTargets,
    };
  }

  // =========================================================================
  // STEP 3: GENERATE LINKS (BUILD LINK GRAPH BEFORE INSERTING)
  // =========================================================================
  /**
   * Generates links by building the directed internal link graph across all 8 relationship types
   * BEFORE inserting any links into HTML.
   */
  public generateLinks(): void {
    this.buildLinkGraph();
  }
  /**
   * Plans a directed edge in the graph if and only if both source and target exist,
   * it is not a self-link, and it is not a duplicate edge.
   */
  public planEdge(edge: PlannedInternalLink): boolean {
    const cleanSource = normalizeFilePath(edge.sourceFilePath);
    const cleanTarget = normalizeFilePath(edge.targetFilePath);

    // Rule 1: Never link to non-existent target
    if (!this.verifyTargetExists(cleanTarget)) {
      return false;
    }
    // Rule 2: Source must exist in URL map
    if (!this.verifyTargetExists(cleanSource)) {
      return false;
    }
    // Rule 3: No self-links
    if (cleanSource === cleanTarget) {
      return false;
    }

    const currentOut = this.plannedEdges.get(cleanSource) || [];
    // Rule 4: Prevent duplicate edges between same pair
    if (currentOut.some((e) => normalizeFilePath(e.targetFilePath) === cleanTarget)) {
      return false;
    }

    // Record planned edge
    const finalizedEdge: PlannedInternalLink = {
      ...edge,
      sourceFilePath: cleanSource,
      targetFilePath: cleanTarget,
    };

    currentOut.push(finalizedEdge);
    this.plannedEdges.set(cleanSource, currentOut);

    const currentIn = this.incomingPlannedEdges.get(cleanTarget) || [];
    currentIn.push(finalizedEdge);
    this.incomingPlannedEdges.set(cleanTarget, currentIn);

    // Track anchor usage for repetition prevention
    const targetAnchors = this.anchorUsageTracker.get(cleanTarget) || new Map<string, number>();
    const count = targetAnchors.get(finalizedEdge.anchorText.toLowerCase().trim()) || 0;
    targetAnchors.set(finalizedEdge.anchorText.toLowerCase().trim(), count + 1);
    this.anchorUsageTracker.set(cleanTarget, targetAnchors);

    return true;
  }

  /**
   * Generates diversified anchor text variants for a target page.
   */
  public generateAnchorVariants(
    target: PageUrlEntry,
    relationship: InternalRelationshipType
  ): string[] {
    const variants: string[] = [];
    const cleanTitle = target.title.split("|")[0].trim();
    const service = target.serviceName || cleanTitle;
    const city = target.locationCity;

    if (target.pageType === "service_hub") {
      variants.push("Our Services");
      variants.push("Explore All Services");
      variants.push("Comprehensive Service Offerings");
      variants.push("View All Professional Solutions");
      return variants;
    }

    if (target.pageType === "location_hub") {
      variants.push("Service Areas");
      variants.push("View All Service Areas");
      variants.push("Our Regional Coverage");
      variants.push("Communities We Serve");
      return variants;
    }

    if (target.pageType === "blog_hub") {
      variants.push("Helpful Homeowner Guides");
      variants.push("Tips & Diagnostic Guides");
      variants.push("Homeowner Maintenance Blog");
      variants.push("Expert Diagnostic Advice");
      return variants;
    }

    if (target.pageType === "blog_post") {
      variants.push(cleanTitle);
      variants.push(`Read our guide: ${cleanTitle}`);
      variants.push(`Homeowner guide: ${service}`);
      variants.push(`Diagnostic tips for ${service.toLowerCase()}`);
      return variants;
    }

    // Service or Location page
    if (city && (relationship === "service_to_locations" || relationship === "homepage_to_locations" || relationship === "location_to_related_locations")) {
      variants.push(`${city} Service Area`);
      variants.push(`Plumbing & Repair in ${city}`);
      variants.push(`Serving ${city} Homeowners`);
      variants.push(`Local ${city} Dispatch Team`);
      variants.push(`${city} Area Specialists`);
    } else if (city) {
      variants.push(`${service} in ${city}`);
      variants.push(`${city} ${service}`);
      variants.push(`Professional ${service.toLowerCase()} throughout ${city}`);
      variants.push(`Certified ${city} ${service.toLowerCase()} team`);
    } else {
      variants.push(service);
      variants.push(`Professional ${service}`);
      variants.push(`Reliable ${service.toLowerCase()} solutions`);
      variants.push(`Expert ${service.toLowerCase()} repair & installation`);
      variants.push(`Schedule ${service.toLowerCase()}`);
    }

    return Array.from(new Set(variants.filter(Boolean)));
  }

  /**
   * Selects the least-used anchor variant for a target to avoid repetitive anchor text.
   */
  public pickBestAnchor(
    source: PageUrlEntry,
    target: PageUrlEntry,
    relationship: InternalRelationshipType
  ): string {
    const variants = this.generateAnchorVariants(target, relationship);
    const targetUsage = this.anchorUsageTracker.get(target.filePath) || new Map<string, number>();

    // Pick variant with minimum usage count
    let bestVariant = variants[0];
    let minCount = Infinity;

    for (const v of variants) {
      const cleanV = v.toLowerCase().trim();
      const count = targetUsage.get(cleanV) || 0;
      if (count < minCount) {
        minCount = count;
        bestVariant = v;
      }
    }

    return bestVariant;
  }

  /**
   * Builds the entire Internal Link Graph across all 8 specified relationship types.
   */
  public buildLinkGraph(): void {
    const nodes = Array.from(this.urlMap.values());

    const homeNode = nodes.find((n) => n.pageType === "homepage");
    const serviceHub = nodes.find((n) => n.pageType === "service_hub");
    const locationHub = nodes.find((n) => n.pageType === "location_hub");
    const blogHub = nodes.find((n) => n.pageType === "blog_hub");

    const servicePages = nodes.filter(
      (n) => n.pageType === "service_page" || n.pageType === "service_location_page"
    );
    const locationPages = nodes.filter(
      (n) => n.pageType === "location_page" || n.pageType === "service_location_page"
    );
    const pureLocationPages = nodes.filter((n) => n.pageType === "location_page");
    const blogPosts = nodes.filter((n) => n.pageType === "blog_post");

    // =========================================================================
    // RELATIONSHIP TYPE 1: Homepage → Services
    // =========================================================================
    if (homeNode) {
      if (serviceHub && this.verifyTargetExists(serviceHub.filePath)) {
        this.planEdge({
          sourceFilePath: homeNode.filePath,
          targetFilePath: serviceHub.filePath,
          relationshipType: "homepage_to_services",
          anchorText: this.pickBestAnchor(homeNode, serviceHub, "homepage_to_services"),
          contextNote: "Complete overview of all licensed professional services.",
          priority: 1,
        });
      }

      // Link to top 4-6 primary services
      for (const srv of servicePages.slice(0, 6)) {
        if (this.verifyTargetExists(srv.filePath)) {
          this.planEdge({
            sourceFilePath: homeNode.filePath,
            targetFilePath: srv.filePath,
            relationshipType: "homepage_to_services",
            anchorText: this.pickBestAnchor(homeNode, srv, "homepage_to_services"),
            contextNote: `Comprehensive ${srv.serviceName || srv.title} for residential and commercial properties.`,
            priority: 2,
          });
        }
      }
    }

    // =========================================================================
    // RELATIONSHIP TYPE 2: Homepage → Locations
    // =========================================================================
    if (homeNode) {
      if (locationHub && this.verifyTargetExists(locationHub.filePath)) {
        this.planEdge({
          sourceFilePath: homeNode.filePath,
          targetFilePath: locationHub.filePath,
          relationshipType: "homepage_to_locations",
          anchorText: this.pickBestAnchor(homeNode, locationHub, "homepage_to_locations"),
          contextNote: "Browse all cities, counties, and local service coverage areas.",
          priority: 1,
        });
      }

      // Link to top 4-6 primary location pages
      const targetLocs = (pureLocationPages.length > 0 ? pureLocationPages : locationPages).slice(0, 6);
      for (const loc of targetLocs) {
        if (this.verifyTargetExists(loc.filePath)) {
          this.planEdge({
            sourceFilePath: homeNode.filePath,
            targetFilePath: loc.filePath,
            relationshipType: "homepage_to_locations",
            anchorText: this.pickBestAnchor(homeNode, loc, "homepage_to_locations"),
            contextNote: `Fast dispatch and local technicians available across ${loc.locationCity || "your community"}.`,
            priority: 2,
          });
        }
      }
    }

    // =========================================================================
    // RELATIONSHIP TYPE 3: Service → Related Services
    // =========================================================================
    for (const currentSrv of servicePages) {
      const otherServices = servicePages.filter((s) => s.filePath !== currentSrv.filePath);
      // Pick 2-4 complementary services
      for (const relSrv of otherServices.slice(0, 3)) {
        if (this.verifyTargetExists(relSrv.filePath)) {
          this.planEdge({
            sourceFilePath: currentSrv.filePath,
            targetFilePath: relSrv.filePath,
            relationshipType: "service_to_related_services",
            anchorText: this.pickBestAnchor(currentSrv, relSrv, "service_to_related_services"),
            contextNote: `Complementary care: Explore our licensed ${relSrv.serviceName || relSrv.title} solutions.`,
            priority: 2,
          });
        }
      }

      // Silo Child -> Hub link: Service connects up to Services Hub
      if (serviceHub && this.verifyTargetExists(serviceHub.filePath)) {
        this.planEdge({
          sourceFilePath: currentSrv.filePath,
          targetFilePath: serviceHub.filePath,
          relationshipType: "silo_child_to_hub",
          anchorText: this.pickBestAnchor(currentSrv, serviceHub, "silo_child_to_hub"),
          contextNote: "Return to complete services catalog.",
          priority: 3,
        });
      }
    }

    // =========================================================================
    // RELATIONSHIP TYPE 4: Service → Locations
    // =========================================================================
    for (const currentSrv of servicePages) {
      // Connect to location hub if present
      if (locationHub && this.verifyTargetExists(locationHub.filePath)) {
        this.planEdge({
          sourceFilePath: currentSrv.filePath,
          targetFilePath: locationHub.filePath,
          relationshipType: "service_to_locations",
          anchorText: this.pickBestAnchor(currentSrv, locationHub, "service_to_locations"),
          contextNote: "Check service coverage in your neighborhood.",
          priority: 3,
        });
      }

      // If service is tied to a specific city, link to that city's page
      if (currentSrv.locationCity) {
        const matchingLoc = locationPages.find(
          (l) => l.locationCity?.toLowerCase() === currentSrv.locationCity?.toLowerCase() && l.filePath !== currentSrv.filePath
        );
        if (matchingLoc && this.verifyTargetExists(matchingLoc.filePath)) {
          this.planEdge({
            sourceFilePath: currentSrv.filePath,
            targetFilePath: matchingLoc.filePath,
            relationshipType: "service_to_locations",
            anchorText: this.pickBestAnchor(currentSrv, matchingLoc, "service_to_locations"),
            contextNote: `Local service coverage for ${currentSrv.locationCity} residents.`,
            priority: 2,
          });
        }
      } else {
        // General service page links to 2-3 prominent location pages
        for (const loc of locationPages.slice(0, 3)) {
          if (this.verifyTargetExists(loc.filePath)) {
            this.planEdge({
              sourceFilePath: currentSrv.filePath,
              targetFilePath: loc.filePath,
              relationshipType: "service_to_locations",
              anchorText: this.pickBestAnchor(currentSrv, loc, "service_to_locations"),
              contextNote: `Available in ${loc.locationCity || "your area"}.`,
              priority: 3,
            });
          }
        }
      }
    }

    // =========================================================================
    // RELATIONSHIP TYPE 5: Location → Services
    // =========================================================================
    for (const currentLoc of locationPages) {
      if (serviceHub && this.verifyTargetExists(serviceHub.filePath)) {
        this.planEdge({
          sourceFilePath: currentLoc.filePath,
          targetFilePath: serviceHub.filePath,
          relationshipType: "location_to_services",
          anchorText: this.pickBestAnchor(currentLoc, serviceHub, "location_to_services"),
          contextNote: "Explore our full array of trade solutions available in your area.",
          priority: 1,
        });
      }

      // Link to 3-5 core service pages
      for (const srv of servicePages.slice(0, 4)) {
        if (this.verifyTargetExists(srv.filePath)) {
          this.planEdge({
            sourceFilePath: currentLoc.filePath,
            targetFilePath: srv.filePath,
            relationshipType: "location_to_services",
            anchorText: this.pickBestAnchor(currentLoc, srv, "location_to_services"),
            contextNote: `Certified technicians ready for dispatch in ${currentLoc.locationCity || "your area"}.`,
            priority: 2,
          });
        }
      }
    }

    // =========================================================================
    // RELATIONSHIP TYPE 6: Location → Related Locations
    // =========================================================================
    for (let i = 0; i < locationPages.length; i++) {
      const currentLoc = locationPages[i];

      // Connect to 2-3 sibling location pages
      for (let j = 1; j <= 3; j++) {
        const neighbor = locationPages[(i + j) % locationPages.length];
        if (neighbor && neighbor.filePath !== currentLoc.filePath && this.verifyTargetExists(neighbor.filePath)) {
          this.planEdge({
            sourceFilePath: currentLoc.filePath,
            targetFilePath: neighbor.filePath,
            relationshipType: "location_to_related_locations",
            anchorText: this.pickBestAnchor(currentLoc, neighbor, "location_to_related_locations"),
            contextNote: `Nearby coverage: Also servicing communities in ${neighbor.locationCity || "adjacent regions"}.`,
            priority: 3,
          });
        }
      }

      // Silo Child -> Hub link: Location connects up to Location Hub
      if (locationHub && this.verifyTargetExists(locationHub.filePath)) {
        this.planEdge({
          sourceFilePath: currentLoc.filePath,
          targetFilePath: locationHub.filePath,
          relationshipType: "silo_child_to_hub",
          anchorText: this.pickBestAnchor(currentLoc, locationHub, "silo_child_to_hub"),
          contextNote: "View all regional service communities.",
          priority: 3,
        });
      }
    }

    // =========================================================================
    // RELATIONSHIP TYPE 7: Blog → Services
    // =========================================================================
    for (const post of blogPosts) {
      // Find matching service or link to top 2-3 services
      let matchedServices = servicePages.filter((s) =>
        post.rawHtml.toLowerCase().includes(s.serviceName?.toLowerCase() || "___")
      );
      if (matchedServices.length === 0) {
        matchedServices = servicePages.slice(0, 3);
      }

      for (const srv of matchedServices.slice(0, 3)) {
        if (this.verifyTargetExists(srv.filePath)) {
          this.planEdge({
            sourceFilePath: post.filePath,
            targetFilePath: srv.filePath,
            relationshipType: "blog_to_services",
            anchorText: this.pickBestAnchor(post, srv, "blog_to_services"),
            contextNote: "Need professional assistance? Schedule licensed service today.",
            priority: 1,
          });
        }
      }

      // Also ensure blog hub connects to top services
      if (blogHub && this.verifyTargetExists(blogHub.filePath)) {
        this.planEdge({
          sourceFilePath: post.filePath,
          targetFilePath: blogHub.filePath,
          relationshipType: "silo_child_to_hub",
          anchorText: this.pickBestAnchor(post, blogHub, "silo_child_to_hub"),
          contextNote: "Explore all homeowner diagnostic articles.",
          priority: 2,
        });
      }
    }

    if (blogHub) {
      for (const srv of servicePages.slice(0, 3)) {
        if (this.verifyTargetExists(srv.filePath)) {
          this.planEdge({
            sourceFilePath: blogHub.filePath,
            targetFilePath: srv.filePath,
            relationshipType: "blog_to_services",
            anchorText: this.pickBestAnchor(blogHub, srv, "blog_to_services"),
            contextNote: "Direct repair and installation services.",
            priority: 2,
          });
        }
      }
    }

    // =========================================================================
    // RELATIONSHIP TYPE 8: Blog → Locations
    // =========================================================================
    for (const post of blogPosts) {
      if (locationHub && this.verifyTargetExists(locationHub.filePath)) {
        this.planEdge({
          sourceFilePath: post.filePath,
          targetFilePath: locationHub.filePath,
          relationshipType: "blog_to_locations",
          anchorText: this.pickBestAnchor(post, locationHub, "blog_to_locations"),
          contextNote: "Check if our technicians service your city or county.",
          priority: 3,
        });
      }

      for (const loc of locationPages.slice(0, 2)) {
        if (this.verifyTargetExists(loc.filePath)) {
          this.planEdge({
            sourceFilePath: post.filePath,
            targetFilePath: loc.filePath,
            relationshipType: "blog_to_locations",
            anchorText: this.pickBestAnchor(post, loc, "blog_to_locations"),
            contextNote: `Serving residential homeowners in ${loc.locationCity || "your area"}.`,
            priority: 3,
          });
        }
      }
    }

    // =========================================================================
    // General Supporting Pages (About, Contact, FAQ)
    // =========================================================================
    const utilityPages = nodes.filter(
      (n) => n.pageType === "about_page" || n.pageType === "contact_page" || n.pageType === "faq_page"
    );
    for (const util of utilityPages) {
      if (homeNode && this.verifyTargetExists(homeNode.filePath)) {
        this.planEdge({
          sourceFilePath: util.filePath,
          targetFilePath: homeNode.filePath,
          relationshipType: "silo_child_to_hub",
          anchorText: "Return to Homepage",
          contextNote: "Learn more about our company background and service standards.",
          priority: 3,
        });
      }
      if (serviceHub && this.verifyTargetExists(serviceHub.filePath)) {
        this.planEdge({
          sourceFilePath: util.filePath,
          targetFilePath: serviceHub.filePath,
          relationshipType: "location_to_services",
          anchorText: "View Our Services",
          contextNote: "Explore full service details.",
          priority: 3,
        });
      }
    }
  }

  // =========================================================================
  // STEP 4: VALIDATE LINKS
  // =========================================================================
  public validateLinks(): { valid: boolean; errors: string[]; prunedCount: number } {
    return this.validateAndPrunePlannedLinks();
  }

  public validatePlannedLinks(): { valid: boolean; errors: string[] } {
    const res = this.validateAndPrunePlannedLinks();
    return { valid: res.valid, errors: res.errors };
  }

  public validateAndPrunePlannedLinks(): { valid: boolean; errors: string[]; prunedCount: number } {
    const errors: string[] = [];
    let prunedCount = 0;

    for (const [sourcePath, edges] of this.plannedEdges.entries()) {
      if (!this.verifyTargetExists(sourcePath)) {
        errors.push(`Source page "${sourcePath}" does not exist in URL map.`);
      }

      const validEdges: PlannedInternalLink[] = [];
      for (const edge of edges) {
        if (!this.verifyTargetExists(edge.targetFilePath)) {
          errors.push(
            `Broken Planned Link: Source "${sourcePath}" points to nonexistent target "${edge.targetFilePath}". Pruning edge.`
          );
          prunedCount++;
          continue;
        }
        if (normalizeFilePath(edge.sourceFilePath) === normalizeFilePath(edge.targetFilePath)) {
          errors.push(`Self-link planned on page "${sourcePath}". Pruning edge.`);
          prunedCount++;
          continue;
        }
        validEdges.push(edge);
      }
      this.plannedEdges.set(sourcePath, validEdges);
    }

    return {
      valid: errors.length === 0,
      errors,
      prunedCount,
    };
  }

  // =========================================================================
  // STEP 5: DETECT ORPHAN PAGES
  // =========================================================================
  /**
   * Scans for orphan pages (nodes with 0 incoming links, excluding homepage root).
   */
  public detectOrphanPages(): string[] {
    const orphans: string[] = [];
    for (const [filePath, node] of this.urlMap.entries()) {
      if (filePath === "index.html" || node.pageType === "homepage") continue;
      const incoming = this.incomingPlannedEdges.get(filePath) || [];
      if (incoming.length === 0) {
        orphans.push(filePath);
      }
    }
    return orphans;
  }

  /**
   * Scans for orphan pages and automatically adds planned recovery edges from homepage or parent hub!
   */
  public detectAndResolveOrphans(): string[] {
    const orphans = this.detectOrphanPages();
    const homeNode = this.urlMap.get("index.html");

    for (const filePath of orphans) {
      const node = this.urlMap.get(filePath);
      if (!node) continue;

      let sourceToUse = "index.html";
      if (node.pageType === "service_page" && this.verifyTargetExists("services.html")) {
        sourceToUse = "services.html";
      } else if (node.pageType === "location_page" && this.verifyTargetExists("service-areas.html")) {
        sourceToUse = "service-areas.html";
      } else if (node.pageType === "blog_post" && this.verifyTargetExists("blog.html")) {
        sourceToUse = "blog.html";
      }

      const sourceNode = this.urlMap.get(sourceToUse) || homeNode;
      if (sourceNode) {
        const anchor = this.pickBestAnchor(sourceNode, node, "orphan_recovery");
        this.planEdge({
          sourceFilePath: sourceNode.filePath,
          targetFilePath: filePath,
          relationshipType: "orphan_recovery",
          anchorText: anchor,
          contextNote: `Discover complete details regarding our ${node.serviceName || node.title}.`,
          priority: 1,
        });
      }
    }

    return orphans;
  }

  // =========================================================================
  // STEP 6: DETECT EXCESSIVE REPEATED ANCHOR TEXT
  // =========================================================================
  public detectExcessiveRepeatedAnchorText(
    threshold: number = 0.35
  ): Array<{ target: string; dominantAnchor: string; count: number; percentage: number }> {
    return this.detectAndDiversifyRepeatedAnchors(threshold);
  }
  /**
   * Scans all incoming links per target page.
   * If any anchor text accounts for > maxThreshold of total links (with >= 3 links),
   * rotates the repeated links to alternative anchor texts.
   */
  public detectAndDiversifyRepeatedAnchors(
    threshold: number = 0.35
  ): Array<{ target: string; dominantAnchor: string; count: number; percentage: number }> {
    const warnings: Array<{ target: string; dominantAnchor: string; count: number; percentage: number }> = [];

    for (const [targetPath, inEdges] of this.incomingPlannedEdges.entries()) {
      if (inEdges.length < 3) continue;

      const targetNode = this.urlMap.get(targetPath);
      if (!targetNode) continue;

      const anchorCounts = new Map<string, number>();
      for (const edge of inEdges) {
        const cleanA = edge.anchorText.toLowerCase().trim();
        anchorCounts.set(cleanA, (anchorCounts.get(cleanA) || 0) + 1);
      }

      for (const [anchor, count] of anchorCounts.entries()) {
        const pct = count / inEdges.length;
        if (pct > threshold && count >= 2) {
          warnings.push({
            target: targetPath,
            dominantAnchor: anchor,
            count,
            percentage: Math.round(pct * 100),
          });

          // Diversify! Find edges using this dominant anchor and swap to alternatives
          const variants = this.generateAnchorVariants(targetNode, "service_to_related_services");
          let swapIdx = 0;
          let changed = 0;

          for (const edge of inEdges) {
            if (edge.anchorText.toLowerCase().trim() === anchor) {
              if (changed > 0) {
                // Swap this duplicate
                swapIdx = (swapIdx + 1) % variants.length;
                edge.anchorText = variants[swapIdx];
              }
              changed++;
            }
          }
        }
      }
    }

    return warnings;
  }

  // =========================================================================
  // STEP 7: INSERT LINKS INTO HTML
  // =========================================================================
  /**
   * Inserts the planned links into the HTML content of each file.
   */
  public insertLinksIntoHtml(
    files: { path: string; content: string | Buffer; mimeType?: string | null }[]
  ): { path: string; content: string | Buffer; mimeType?: string | null }[] {
    const fileMap = new Map<string, { path: string; content: string | Buffer; mimeType?: string | null }>();
    for (const f of files) {
      fileMap.set(normalizeFilePath(f.path), { ...f, path: normalizeFilePath(f.path) });
    }

    for (const [sourcePath, edges] of this.plannedEdges.entries()) {
      if (edges.length === 0) continue;

      const fileEntry = fileMap.get(sourcePath);
      if (!fileEntry) continue;

      let html =
        typeof fileEntry.content === "string"
          ? fileEntry.content
          : fileEntry.content.toString("utf-8");

      for (const edge of edges) {
        // Double-check target existence
        if (!this.verifyTargetExists(edge.targetFilePath)) continue;

        const relativeHref = calculateRelativeHref(sourcePath, edge.targetFilePath);

        // Check if link already exists in HTML
        if (
          html.includes(`href="${relativeHref}"`) ||
          html.includes(`href="./${relativeHref}"`) ||
          html.includes(`href="/${edge.targetFilePath}"`)
        ) {
          continue; // Already linked
        }

        // Multi-strategy injection
        const { updatedHtml, injected } = this.injectSingleLink(
          html,
          relativeHref,
          edge.anchorText,
          edge.contextNote || "Explore related local service solutions."
        );

        if (injected) {
          html = updatedHtml;
        }
      }

      fileMap.set(sourcePath, { ...fileEntry, content: html });
    }

    return Array.from(fileMap.values());
  }

  private injectSingleLink(
    html: string,
    relativeHref: string,
    anchorText: string,
    contextNote: string
  ): { updatedHtml: string; injected: boolean } {
    // Strategy 1: Replace unlinked text mention in a paragraph
    const cleanKeyword = anchorText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pRegex = new RegExp(`(<p[^>]*>[\\s\\S]*?)\\b(${cleanKeyword})\\b([\\s\\S]*?<\\/p>)`, "i");
    const pMatch = html.match(pRegex);

    if (pMatch && !pMatch[0].includes("<a ")) {
      const linkHtml = `<a href="${relativeHref}" class="contextual-internal-link" style="color: var(--primary, #2563eb); font-weight: 600; text-decoration: underline;">${pMatch[2]}</a>`;
      return {
        updatedHtml: html.replace(pMatch[0], `${pMatch[1]}${linkHtml}${pMatch[3]}`),
        injected: true,
      };
    }

    // Strategy 2: Append into a "Related Services" or "Service Areas" grid
    const gridMatch = html.match(
      /(<section[^>]*(?:services|related|service-areas|coverage)[^>]*>[\s\S]*?<div[^>]*class=["'][^"']*(?:grid|cards|links)[^"']*["'][\s\S]*?)(<\/div>[\s\S]*?<\/section>)/i
    );
    if (gridMatch) {
      const cardHtml = `
      <div class="service-card contextual-link-card" style="border: 1px solid var(--border-color, #e2e8f0); border-radius: 8px; padding: 18px; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <h4 style="margin: 0 0 8px 0; font-size: 1.1rem;"><a href="${relativeHref}" style="text-decoration: underline; color: var(--primary, #2563eb); font-weight: 700;">${anchorText}</a></h4>
        <p style="margin: 0; font-size: 0.875rem; color: #64748b; line-height: 1.5;">${contextNote}</p>
        <a href="${relativeHref}" style="display: inline-block; margin-top: 10px; font-size: 0.825rem; font-weight: 600; color: var(--primary, #2563eb);">View Details &rarr;</a>
      </div>`;
      return {
        updatedHtml: html.replace(gridMatch[0], `${gridMatch[1]}${cardHtml}\n    ${gridMatch[2]}`),
        injected: true,
      };
    }

    // Strategy 3: Insert Callout above closing CTA / Contact section
    const ctaMatch = html.match(/(<section[^>]*(?:cta|contact)[^>]*>)/i);
    if (ctaMatch) {
      const calloutHtml = `
    <!-- Contextual Internal Link -->
    <div class="contextual-internal-link-callout" style="max-width: 1000px; margin: 28px auto; padding: 16px 22px; background: #f8fafc; border-left: 4px solid var(--primary, #2563eb); border-radius: 8px;">
      <p style="margin: 0; font-size: 0.95rem; color: #334155; line-height: 1.6;">
        Specialized local care: Explore our licensed <a href="${relativeHref}" style="font-weight: 700; text-decoration: underline; color: var(--primary, #2563eb);">${anchorText}</a>. ${contextNote}
      </p>
    </div>\n    `;
      return {
        updatedHtml: html.replace(ctaMatch[0], `${calloutHtml}${ctaMatch[0]}`),
        injected: true,
      };
    }

    // Strategy 4: Append before closing </main>
    const mainCloseMatch = html.match(/(<\/main>)/i);
    if (mainCloseMatch) {
      const calloutHtml = `
    <div class="contextual-internal-link-callout" style="max-width: 1000px; margin: 24px auto; padding: 16px 20px; background: #f8fafc; border-left: 4px solid var(--primary, #2563eb); border-radius: 6px;">
      <p style="margin: 0; font-size: 0.9rem; color: #334155;">
        Related Service: <a href="${relativeHref}" style="font-weight: 700; text-decoration: underline; color: var(--primary, #2563eb);">${anchorText}</a> &mdash; ${contextNote}
      </p>
    </div>\n    `;
      return {
        updatedHtml: html.replace(mainCloseMatch[0], `${calloutHtml}${mainCloseMatch[0]}`),
        injected: true,
      };
    }

    return { updatedHtml: html, injected: false };
  }

  // =========================================================================
  // STEP 8: RUN INTERNAL-LINK AUDIT
  // =========================================================================
  /**
   * Re-parses all HTML files, verifies every link target against the URL map,
   * counts valid internal links, detects broken links and orphan pages,
   * and computes click depths from Homepage.
   */
  public runInternalLinkAudit(
    files: { path: string; content: string | Buffer; mimeType?: string | null }[]
  ): InternalLinkAuditReport {
    const htmlFiles = files.filter(
      (f) => f && f.path && (f.path.endsWith(".html") || f.path.endsWith(".htm"))
    );

    const existingFilePaths = new Set(htmlFiles.map((f) => normalizeFilePath(f.path)));

    const brokenLinksList: Array<{ source: string; href: string; reason: string }> = [];
    const actualLinksPerSource = new Map<string, Array<{ target: string; anchor: string }>>();
    const incomingLinkCount = new Map<string, number>();

    for (const path of existingFilePaths) {
      actualLinksPerSource.set(path, []);
      incomingLinkCount.set(path, 0);
    }

    let totalInternalLinks = 0;

    for (const file of htmlFiles) {
      const sourcePath = normalizeFilePath(file.path);
      const rawHtml =
        typeof file.content === "string"
          ? file.content
          : file.content.toString("utf-8");

      const anchorRegex = /<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let match: RegExpExecArray | null;

      while ((match = anchorRegex.exec(rawHtml)) !== null) {
        const rawHref = match[1].trim();
        const rawAnchor = match[2].replace(/<[^>]+>/g, "").trim();

        // Skip non-internal links
        if (
          rawHref.startsWith("#") ||
          rawHref.startsWith("tel:") ||
          rawHref.startsWith("mailto:") ||
          rawHref.startsWith("javascript:") ||
          rawHref.startsWith("http://") ||
          rawHref.startsWith("https://")
        ) {
          continue;
        }

        // Check for forbidden localhost/preview leaks
        if (rawHref.includes("localhost") || rawHref.includes("127.0.0.1") || rawHref.includes("/api/")) {
          brokenLinksList.push({
            source: sourcePath,
            href: rawHref,
            reason: "Forbidden localhost or API preview link found in static production HTML.",
          });
          continue;
        }

        const resolvedTarget = resolveHref(sourcePath, rawHref);
        if (!resolvedTarget) {
          brokenLinksList.push({
            source: sourcePath,
            href: rawHref,
            reason: "Unable to resolve relative path.",
          });
          continue;
        }

        // Rule: Never allow broken internal links
        if (!existingFilePaths.has(resolvedTarget)) {
          brokenLinksList.push({
            source: sourcePath,
            href: rawHref,
            reason: `Target file "${resolvedTarget}" does not exist in URL map.`,
          });
        } else if (resolvedTarget !== sourcePath) {
          totalInternalLinks++;
          actualLinksPerSource.get(sourcePath)?.push({ target: resolvedTarget, anchor: rawAnchor });
          incomingLinkCount.set(
            resolvedTarget,
            (incomingLinkCount.get(resolvedTarget) || 0) + 1
          );
        }
      }
    }

    // Detect Orphan Pages (0 incoming links, excluding index.html)
    const orphanPagesList: string[] = [];
    for (const path of existingFilePaths) {
      if (path === "index.html") continue;
      const count = incomingLinkCount.get(path) || 0;
      if (count === 0) {
        orphanPagesList.push(path);
      }
    }

    // Compute BFS Click Depth from index.html
    const clickDepthMap: Record<string, number> = {};
    for (const path of existingFilePaths) {
      clickDepthMap[path] = path === "index.html" ? 0 : -1;
    }

    const queue: Array<{ path: string; depth: number }> = [{ path: "index.html", depth: 0 }];
    const visited = new Set<string>(["index.html"]);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const outgoing = actualLinksPerSource.get(curr.path) || [];

      for (const edge of outgoing) {
        if (!visited.has(edge.target)) {
          visited.add(edge.target);
          clickDepthMap[edge.target] = curr.depth + 1;
          queue.push({ path: edge.target, depth: curr.depth + 1 });
        }
      }
    }

    let reachableCount = 0;
    let sumDepth = 0;
    let maxDepth = 0;

    for (const [path, depth] of Object.entries(clickDepthMap)) {
      if (depth >= 0) {
        reachableCount++;
        sumDepth += depth;
        if (depth > maxDepth) maxDepth = depth;
      }
    }

    const averageClickDepth =
      reachableCount > 0 ? Math.round((sumDepth / reachableCount) * 10) / 10 : 0;

    // Detect repeated anchors across actual HTML links
    const repeatedAnchorWarnings: Array<{
      target: string;
      dominantAnchor: string;
      count: number;
      percentage: number;
    }> = [];

    const targetIncomingAnchors = new Map<string, string[]>();
    for (const [src, links] of actualLinksPerSource.entries()) {
      for (const link of links) {
        const list = targetIncomingAnchors.get(link.target) || [];
        list.push(link.anchor);
        targetIncomingAnchors.set(link.target, list);
      }
    }

    for (const [tgt, anchors] of targetIncomingAnchors.entries()) {
      if (anchors.length >= 4) {
        const counts = new Map<string, number>();
        for (const a of anchors) {
          const cleanA = a.toLowerCase().trim();
          counts.set(cleanA, (counts.get(cleanA) || 0) + 1);
        }
        for (const [a, c] of counts.entries()) {
          const pct = c / anchors.length;
          if (pct > 0.4 && c >= 3) {
            repeatedAnchorWarnings.push({
              target: tgt,
              dominantAnchor: a,
              count: c,
              percentage: Math.round(pct * 100),
            });
          }
        }
      }
    }

    // Relationship Breakdown from Planned Graph
    const relationshipBreakdown: Record<InternalRelationshipType, number> = {
      homepage_to_services: 0,
      homepage_to_locations: 0,
      service_to_related_services: 0,
      service_to_locations: 0,
      location_to_services: 0,
      location_to_related_locations: 0,
      blog_to_services: 0,
      blog_to_locations: 0,
      silo_child_to_hub: 0,
      orphan_recovery: 0,
    };

    for (const edges of this.plannedEdges.values()) {
      for (const e of edges) {
        relationshipBreakdown[e.relationshipType] =
          (relationshipBreakdown[e.relationshipType] || 0) + 1;
      }
    }

    const isHealthy = brokenLinksList.length === 0 && orphanPagesList.length === 0;

    const reportText = [
      "================================================================================",
      "                      INTERNAL LINKING AUDIT REPORT                             ",
      "================================================================================",
      `Total pages:    ${htmlFiles.length}`,
      `Internal links: ${totalInternalLinks}`,
      `Broken links:   ${brokenLinksList.length}`,
      `Orphan pages:   ${orphanPagesList.length}`,
      "--------------------------------------------------------------------------------",
      "Relationship Breakdown:",
      `  - Homepage → Services:           ${relationshipBreakdown.homepage_to_services}`,
      `  - Homepage → Locations:          ${relationshipBreakdown.homepage_to_locations}`,
      `  - Service → Related Services:    ${relationshipBreakdown.service_to_related_services}`,
      `  - Service → Locations:           ${relationshipBreakdown.service_to_locations}`,
      `  - Location → Services:           ${relationshipBreakdown.location_to_services}`,
      `  - Location → Related Locations:  ${relationshipBreakdown.location_to_related_locations}`,
      `  - Blog → Services:               ${relationshipBreakdown.blog_to_services}`,
      `  - Blog → Locations:              ${relationshipBreakdown.blog_to_locations}`,
      `  - Silo Child → Hub:              ${relationshipBreakdown.silo_child_to_hub}`,
      `  - Orphan Recovery Links:         ${relationshipBreakdown.orphan_recovery}`,
      `Average Click Depth: ${averageClickDepth} | Max Click Depth: ${maxDepth}`,
      `Graph Status: ${isHealthy ? "HEALTHY (0 Broken, 0 Orphans)" : "NEEDS ATTENTION"}`,
      "================================================================================",
    ].join("\n");

    const summaryReportText = [
      `Total pages:    ${htmlFiles.length}`,
      `Internal links: ${totalInternalLinks}`,
      `Broken links:   ${brokenLinksList.length}`,
      `Orphan pages:   ${orphanPagesList.length}`,
    ].join("\n");

    return {
      totalPages: htmlFiles.length,
      internalLinks: totalInternalLinks,
      brokenLinks: brokenLinksList.length,
      orphanPages: orphanPagesList.length,
      reportText,
      summaryReportText,
      brokenLinksList,
      orphanPagesList,
      repeatedAnchorWarnings,
      relationshipBreakdown,
      clickDepthMap,
      maxClickDepth: maxDepth,
      averageClickDepth,
      isHealthy,
    };
  }

  /**
   * Scans and heals pre-existing broken links in HTML files so they point to
   * legitimate, existing files in the URL map.
   * Guarantees: Never allow broken internal links.
   */
  public healPreExistingLinks(
    files: { path: string; content: string | Buffer; mimeType?: string | null }[]
  ): { path: string; content: string | Buffer; mimeType?: string | null }[] {
    const existingTargets = Array.from(this.urlMap.keys());
    const serviceHub = existingTargets.find((p) => p === "services.html");
    const locationHub = existingTargets.find((p) => p === "service-areas.html");
    const servicePages = existingTargets.filter((p) => {
      const node = this.urlMap.get(p);
      return node?.pageType === "service_page" || node?.pageType === "service_location_page";
    });
    const locationPages = existingTargets.filter((p) => {
      const node = this.urlMap.get(p);
      return node?.pageType === "location_page" || node?.pageType === "service_location_page";
    });

    return files.map((file) => {
      if (!file.path.endsWith(".html") && !file.path.endsWith(".htm")) return file;
      const sourcePath = normalizeFilePath(file.path);
      let html = typeof file.content === "string" ? file.content : file.content.toString("utf-8");

      html = html.replace(/<a\s+([^>]*?)href=["']([^"']+)["']([^>]*?)>/gi, (match, before, rawHref, after) => {
        const cleanHref = rawHref.trim();

        // Skip non-internal links
        if (
          cleanHref.startsWith("#") ||
          cleanHref.startsWith("tel:") ||
          cleanHref.startsWith("mailto:") ||
          cleanHref.startsWith("javascript:") ||
          cleanHref.startsWith("http://") ||
          cleanHref.startsWith("https://")
        ) {
          return match;
        }

        const resolved = resolveHref(sourcePath, cleanHref);

        // If already valid and exists in URL map
        if (resolved && this.verifyTargetExists(resolved)) {
          return match;
        }

        // Target does not exist! Find closest valid target in urlMap
        let healedTarget = "index.html";

        const strippedSlug = (resolved || cleanHref)
          .replace(/\.html?$/i, "")
          .replace(/^(?:service|services|location|locations|area|areas)-+/i, "")
          .toLowerCase();

        // 1. Direct slug match
        const directMatch = existingTargets.find((p) => {
          const s = p.replace(/\.html?$/i, "").toLowerCase();
          return s === strippedSlug || s.endsWith(strippedSlug) || strippedSlug.endsWith(s);
        });

        if (directMatch) {
          healedTarget = directMatch;
        } else if (cleanHref.includes("service") && (serviceHub || servicePages.length > 0)) {
          healedTarget = serviceHub || servicePages[0] || "index.html";
        } else if ((cleanHref.includes("area") || cleanHref.includes("location") || cleanHref.includes("city")) && (locationHub || locationPages.length > 0)) {
          healedTarget = locationHub || locationPages[0] || "index.html";
        } else if (cleanHref.includes("about") && this.verifyTargetExists("about.html")) {
          healedTarget = "about.html";
        } else if (cleanHref.includes("contact") && this.verifyTargetExists("contact.html")) {
          healedTarget = "contact.html";
        } else if (cleanHref.includes("faq") && this.verifyTargetExists("faq.html")) {
          healedTarget = "faq.html";
        } else if (cleanHref.includes("blog") && this.verifyTargetExists("blog.html")) {
          healedTarget = "blog.html";
        }

        const newRelativeHref = calculateRelativeHref(sourcePath, healedTarget);
        return `<a ${before}href="${newRelativeHref}"${after}>`;
      });

      return {
        ...file,
        content: html,
      };
    });
  }

  // =========================================================================
  // COMPLETE END-TO-END PIPELINE ORCHESTRATOR
  // =========================================================================
  /**
   * Executes the full pipeline in strict sequence:
   * 1. Create complete URL map.
   * 2. Verify every target exists.
   * 3. Generate links (build link graph).
   * 4. Validate links.
   * 5. Detect & eliminate orphan pages.
   * 6. Detect & diversify excessive repeated anchor text.
   * 7. Heal pre-existing template links & insert planned links into HTML files.
   * 8. Run full internal-link audit.
   */
  public execute(
    files: { path: string; content: string | Buffer; mimeType?: string | null }[]
  ): {
    files: { path: string; content: string | Buffer; mimeType?: string | null }[];
    auditReport: InternalLinkAuditReport;
  } {
    // 1. Create complete URL map
    this.createUrlMap(files);

    // 2. Verify every target exists
    this.verifyEveryTargetExists();

    // 3. Generate links (build link graph BEFORE inserting links)
    this.generateLinks();

    // 4. Validate links
    const validation = this.validateLinks();
    if (!validation.valid) {
      console.warn("[InternalLinkEngine] Planned link validation warnings:", validation.errors);
    }

    // 5. Detect & eliminate orphan pages
    const initialOrphans = this.detectAndResolveOrphans();
    if (initialOrphans.length > 0) {
      console.log(`[InternalLinkEngine] Resolved ${initialOrphans.length} orphan page(s) in link graph.`);
    }

    // 6. Detect & diversify excessive repeated anchor text
    const anchorWarnings = this.detectExcessiveRepeatedAnchorText(
      this.options.maxRepeatedAnchorThreshold || 0.35
    );
    if (anchorWarnings.length > 0) {
      console.log(`[InternalLinkEngine] Diversified ${anchorWarnings.length} repetitive anchor text patterns.`);
    }

    // 7. Heal pre-existing template links to guarantee 0 broken links, then insert planned links
    const healedFiles = this.healPreExistingLinks(files);
    const updatedFiles = this.insertLinksIntoHtml(healedFiles);

    // 8. Run internal-link audit
    const auditReport = this.runInternalLinkAudit(updatedFiles);

    // Print Clean Formatted Audit Report
    console.log("\n" + auditReport.reportText + "\n");

    return {
      files: updatedFiles,
      auditReport,
    };
  }
}
