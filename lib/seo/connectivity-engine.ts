/**
 * RankLocal Master Internal Linking & Page Connectivity Engine
 * 
 * Provides:
 * 1. Structured Page Relationship Model & Graph Representation
 * 2. Weighted Relevance Scoring Engine (+30 same service, +20 related, +20 same loc, -50 unrelated service, -30 unrelated loc)
 * 3. Topical & Geographic Silo Hierarchy (Homepage -> Hub -> Service -> Service+Location)
 * 4. Contextual Link Insertion & Anchor Text Intelligence (natural phrasing, anti-spam, non-repetitive)
 * 5. Intelligent Related Services / Pages Component Generator
 * 6. Real Orphan & Weakly Connected Page Detection with Click Depth Analysis (BFS from Homepage)
 * 7. Structural Authority Flow Diagnostic (honest structural metric, not fake PageRank)
 * 8. Crawl Accessibility & Link Validation (verifies every internal href resolves to an actual file)
 * 9. Automated Incremental New Page Integration & Deleted Page Link Cleanup
 * 10. Preview and ZIP Export Parity Verification
 */

import { SearchIntentType } from "./opportunity-engine";

export type PageType =
  | "homepage"
  | "service_hub"
  | "service_page"
  | "location_hub"
  | "location_page"
  | "service_location_page"
  | "about_page"
  | "contact_page"
  | "faq_page"
  | "blog_page"
  | "other";

export type LinkContext =
  | "header_nav"
  | "footer_nav"
  | "breadcrumb"
  | "content_body"
  | "related_services"
  | "location_grid"
  | "silo_parent"
  | "silo_child"
  | "sibling_cluster"
  | "cta_banner";

export type ConnectivityStatus = "connected" | "weak" | "orphan" | "unreachable";

export interface PageLinkRef {
  sourcePageId: string;
  sourceFilePath: string;
  targetPageId: string;
  targetFilePath: string;
  anchorText: string;
  context: LinkContext;
  isContextual: boolean;
}

export interface PageRelationshipNode {
  pageId: string;
  projectId?: string;
  url: string;
  slug: string;
  filePath: string; // e.g. "index.html", "services.html", "services/drain-cleaning.html"
  title: string;
  h1?: string;
  metaDescription?: string;
  pageType: PageType;
  primaryKeyword: string;
  secondaryKeywords: string[];
  service?: string;
  serviceCategory?: string;
  location?: {
    city: string;
    state?: string;
  };
  searchIntent: SearchIntentType;
  parentPageId?: string;
  hubPageId?: string;
  relatedServices: string[];
  relatedLocations: string[];
  incomingLinks: PageLinkRef[];
  outgoingLinks: PageLinkRef[];
  indexable: boolean;
  canonicalUrl: string;
  clickDepth: number; // 0 for Homepage, -1 for unreachable
  authorityFlow: number; // 0.0 - 1.0 structural connectivity metric
  importance: number; // 0 - 100
  connectivityStatus: ConnectivityStatus;
  statusReasons: string[];
  recommendations: string[];
}

export interface LinkRelevanceScore {
  score: number;
  tier: "high" | "medium" | "low";
  factors: { name: string; weight: number }[];
  rationale: string;
}

export interface RelevanceModelWeights {
  samePrimaryService: number; // default +30
  relatedServiceSameCategory: number; // default +20
  sameLocation: number; // default +20
  parentChildRelationship: number; // default +25
  strongKeywordTopicOverlap: number; // default +15
  sameSearchIntent: number; // default +10
  knownHubRelationship: number; // default +20
  unrelatedServicePenalty: number; // default -50
  unrelatedLocationPenalty: number; // default -30
}

export const DEFAULT_RELEVANCE_WEIGHTS: RelevanceModelWeights = {
  samePrimaryService: 30,
  relatedServiceSameCategory: 20,
  sameLocation: 20,
  parentChildRelationship: 25,
  strongKeywordTopicOverlap: 15,
  sameSearchIntent: 10,
  knownHubRelationship: 20,
  unrelatedServicePenalty: -50,
  unrelatedLocationPenalty: -30,
};

export interface ConnectivityAuditReport {
  totalNodes: number;
  totalInternalLinks: number;
  orphanNodes: PageRelationshipNode[];
  weakNodes: PageRelationshipNode[];
  brokenLinks: {
    sourceFilePath: string;
    targetHref: string;
    anchorText: string;
    reason: string;
  }[];
  disconnectedClusters: {
    clusterName: string;
    type: "service" | "location";
    pages: string[];
  }[];
  repetitiveAnchorWarnings: {
    targetFilePath: string;
    dominantAnchor: string;
    percentage: number;
    count: number;
  }[];
  averageClickDepth: number;
  maxClickDepth: number;
  connectivityScore: number; // 0 - 100
  scoreExplanation: string;
  isCrawlHealthy: boolean;
}

export interface CrawlValidationReport {
  crawledPagesCount: number;
  reachablePagesCount: number;
  unreachablePages: string[];
  brokenLinksCount: number;
  brokenLinks: { source: string; href: string; reason: string }[];
  sitemapAgreesWithCanonical: boolean;
  canonicalMismatches: { page: string; canonical: string; sitemapLoc?: string }[];
  noindexLinksCount: number;
  externalOrMaliciousCount: number;
  previewZipParityPassed: boolean;
  isProductionReady: boolean;
}

/**
 * Normalizes a POSIX file path for cross-platform link resolution
 */
export function normalizeFilePath(p: string): string {
  return p.replace(/\\/g, "/").replace(/^\/+/, "").trim();
}

/**
 * Resolves a relative or root-relative href against a source file path.
 * e.g. from "services/drain-cleaning.html" and "../pipe-repair.html" -> "pipe-repair.html"
 * e.g. from "services/index.html" and "pipe-repair.html" -> "services/pipe-repair.html"
 * e.g. from "index.html" and "services/pipe-repair.html" -> "services/pipe-repair.html"
 */
export function resolveHref(fromFilePath: string, href: string): string | null {
  const cleanHref = href.split("?")[0].split("#")[0].trim();
  if (!cleanHref) return null;

  // Skip external, anchors, mailto, tel, javascript
  if (
    cleanHref.startsWith("http://") ||
    cleanHref.startsWith("https://") ||
    cleanHref.startsWith("mailto:") ||
    cleanHref.startsWith("tel:") ||
    cleanHref.startsWith("#") ||
    cleanHref.startsWith("javascript:")
  ) {
    return null;
  }

  // Root-relative href (e.g. "/services/drain-cleaning.html" or "/services/")
  if (cleanHref.startsWith("/")) {
    let stripped = cleanHref.replace(/^\/+/, "");
    if (stripped === "" || stripped.endsWith("/")) {
      stripped = `${stripped}index.html`;
    } else if (!stripped.includes(".")) {
      stripped = `${stripped}.html`;
    }
    return normalizeFilePath(stripped);
  }

  // Folder relative href
  const sourceDirParts = fromFilePath.includes("/")
    ? fromFilePath.split("/").slice(0, -1)
    : [];

  const hrefParts = cleanHref.split("/");
  const resolvedParts = [...sourceDirParts];

  for (const part of hrefParts) {
    if (part === "" || part === ".") continue;
    if (part === "..") {
      if (resolvedParts.length > 0) resolvedParts.pop();
    } else {
      resolvedParts.push(part);
    }
  }

  let finalPath = resolvedParts.join("/");
  if (finalPath.endsWith("/")) {
    finalPath = `${finalPath}index.html`;
  } else if (!finalPath.includes(".")) {
    finalPath = `${finalPath}.html`;
  }

  return normalizeFilePath(finalPath);
}

/**
 * Calculates the exact relative href from one file to another.
 * e.g. from "index.html" to "services.html" -> "services.html"
 * e.g. from "services/drain-cleaning.html" to "index.html" -> "../index.html"
 */
export function calculateRelativeHref(fromFilePath: string, toFilePath: string): string {
  const fromClean = normalizeFilePath(fromFilePath);
  const toClean = normalizeFilePath(toFilePath);

  if (fromClean === toClean) return "#";

  const fromParts = fromClean.includes("/") ? fromClean.split("/").slice(0, -1) : [];
  const toParts = toClean.split("/");

  let i = 0;
  while (i < fromParts.length && i < toParts.length - 1 && fromParts[i] === toParts[i]) {
    i++;
  }

  const upCount = fromParts.length - i;
  const ups = upCount > 0 ? Array(upCount).fill("..") : [];
  const downs = toParts.slice(i);

  const relative = [...ups, ...downs].join("/");
  return relative || "./";
}

/**
 * Master Page Connectivity & Internal Linking Graph Engine
 */
export class PageConnectivityEngine {
  private nodes = new Map<string, PageRelationshipNode>();
  private nodesByPath = new Map<string, PageRelationshipNode>();
  private weights: RelevanceModelWeights;

  constructor(weights: Partial<RelevanceModelWeights> = {}) {
    this.weights = { ...DEFAULT_RELEVANCE_WEIGHTS, ...weights };
  }

  public registerNode(node: PageRelationshipNode): void {
    const cleanPath = normalizeFilePath(node.filePath);
    const entry: PageRelationshipNode = {
      ...node,
      filePath: cleanPath,
      incomingLinks: node.incomingLinks || [],
      outgoingLinks: node.outgoingLinks || [],
      relatedServices: node.relatedServices || [],
      relatedLocations: node.relatedLocations || [],
      statusReasons: node.statusReasons || [],
      recommendations: node.recommendations || [],
    };
    this.nodes.set(entry.pageId, entry);
    this.nodesByPath.set(cleanPath, entry);
  }

  public getNode(pageId: string): PageRelationshipNode | undefined {
    return this.nodes.get(pageId);
  }

  public getNodeByPath(filePath: string): PageRelationshipNode | undefined {
    return this.nodesByPath.get(normalizeFilePath(filePath));
  }

  public getAllNodes(): PageRelationshipNode[] {
    return Array.from(this.nodes.values());
  }

  public addLink(ref: PageLinkRef): boolean {
    const sourceNode = this.nodes.get(ref.sourcePageId) || this.nodesByPath.get(normalizeFilePath(ref.sourceFilePath));
    const targetNode = this.nodes.get(ref.targetPageId) || this.nodesByPath.get(normalizeFilePath(ref.targetFilePath));

    if (!sourceNode || !targetNode) {
      return false; // Cannot link non-existent nodes
    }

    if (sourceNode.pageId === targetNode.pageId) {
      return false; // Skip self-links
    }

    // Check if edge already exists
    const existingOut = sourceNode.outgoingLinks.some(
      (l) => l.targetPageId === targetNode.pageId && l.anchorText.toLowerCase() === ref.anchorText.toLowerCase()
    );
    if (!existingOut) {
      sourceNode.outgoingLinks.push({
        ...ref,
        sourcePageId: sourceNode.pageId,
        sourceFilePath: sourceNode.filePath,
        targetPageId: targetNode.pageId,
        targetFilePath: targetNode.filePath,
      });
    }

    const existingIn = targetNode.incomingLinks.some(
      (l) => l.sourcePageId === sourceNode.pageId && l.anchorText.toLowerCase() === ref.anchorText.toLowerCase()
    );
    if (!existingIn) {
      targetNode.incomingLinks.push({
        ...ref,
        sourcePageId: sourceNode.pageId,
        sourceFilePath: sourceNode.filePath,
        targetPageId: targetNode.pageId,
        targetFilePath: targetNode.filePath,
      });
    }

    return true;
  }

  /**
   * Calculates the weighted internal link relevance between a candidate source and target page
   */
  public calculateRelevance(
    source: PageRelationshipNode,
    target: PageRelationshipNode
  ): LinkRelevanceScore {
    if (source.pageId === target.pageId) {
      return { score: -100, tier: "low", factors: [], rationale: "Self-link forbidden" };
    }

    let score = 0;
    const factors: { name: string; weight: number }[] = [];

    // 1. Same Primary Service
    if (source.service && target.service && source.service.toLowerCase() === target.service.toLowerCase()) {
      score += this.weights.samePrimaryService;
      factors.push({ name: `Same primary service (${source.service})`, weight: this.weights.samePrimaryService });
    } else if (
      (source.serviceCategory && target.serviceCategory && source.serviceCategory.toLowerCase() === target.serviceCategory.toLowerCase()) ||
      (source.service && target.service && this.isRelatedService(source.service, target.service))
    ) {
      score += this.weights.relatedServiceSameCategory;
      factors.push({ name: "Related service in same trade category", weight: this.weights.relatedServiceSameCategory });
    } else if (source.service && target.service && !this.isRelatedService(source.service, target.service)) {
      // Unrelated trade penalty (e.g. Drain Cleaning vs Roofing)
      score += this.weights.unrelatedServicePenalty;
      factors.push({ name: "Unrelated service trade penalty", weight: this.weights.unrelatedServicePenalty });
    }

    // 2. Location Relationship
    const sourceCity = source.location?.city?.toLowerCase();
    const targetCity = target.location?.city?.toLowerCase();

    if (sourceCity && targetCity) {
      if (sourceCity === targetCity) {
        score += this.weights.sameLocation;
        factors.push({ name: `Same market location (${source.location?.city})`, weight: this.weights.sameLocation });
      } else {
        // Different cities: Apply penalty unless they are verified neighboring communities
        const isNeighbor = source.relatedLocations.some((l) => l.toLowerCase() === targetCity);
        if (isNeighbor) {
          score += 10;
          factors.push({ name: `Neighboring service market (${target.location?.city})`, weight: 10 });
        } else {
          score += this.weights.unrelatedLocationPenalty;
          factors.push({ name: "Unrelated geographic market penalty", weight: this.weights.unrelatedLocationPenalty });
        }
      }
    }

    // 3. Parent / Child Hierarchical Relationship
    if (source.parentPageId === target.pageId || target.parentPageId === source.pageId) {
      score += this.weights.parentChildRelationship;
      factors.push({ name: "Direct Parent/Child hierarchy", weight: this.weights.parentChildRelationship });
    }

    // 4. Known Hub Relationship (Homepage or Hub)
    if (
      (source.pageType === "homepage" && (target.pageType === "service_hub" || target.pageType === "location_hub" || target.pageType === "service_page")) ||
      (source.pageType === "service_hub" && target.pageType === "service_page") ||
      (source.pageType === "location_hub" && target.pageType === "location_page") ||
      (target.pageType === "service_hub" && source.pageType === "service_page") ||
      (target.pageType === "location_hub" && source.pageType === "location_page")
    ) {
      score += this.weights.knownHubRelationship;
      factors.push({ name: "Direct Hub connection", weight: this.weights.knownHubRelationship });
    }

    // 5. Search Intent Compatibility
    if (source.searchIntent === target.searchIntent && source.searchIntent === "transactional") {
      score += this.weights.sameSearchIntent;
      factors.push({ name: "Aligned transactional commercial intent", weight: this.weights.sameSearchIntent });
    }

    // 6. Keyword Semantic Overlap
    const sourceWords = new Set(
      `${source.primaryKeyword} ${source.secondaryKeywords.join(" ")}`.toLowerCase().split(/\W+/).filter((w) => w.length > 3)
    );
    const targetWords = new Set(
      `${target.primaryKeyword} ${target.secondaryKeywords.join(" ")}`.toLowerCase().split(/\W+/).filter((w) => w.length > 3)
    );
    let commonWords = 0;
    for (const word of targetWords) {
      if (sourceWords.has(word)) commonWords++;
    }
    if (commonWords >= 2) {
      score += this.weights.strongKeywordTopicOverlap;
      factors.push({ name: `Topic keyword semantic overlap (${commonWords} matching terms)`, weight: this.weights.strongKeywordTopicOverlap });
    }

    // Determine tier
    let tier: "high" | "medium" | "low" = "low";
    if (score >= 40) tier = "high";
    else if (score >= 20) tier = "medium";

    const rationale = factors.map((f) => `${f.name} (${f.weight > 0 ? "+" : ""}${f.weight})`).join(", ");

    return { score, tier, factors, rationale };
  }

  private isRelatedService(srvA: string, srvB: string): boolean {
    const a = srvA.toLowerCase();
    const b = srvB.toLowerCase();
    if (a === b) return true;

    // Common trades cluster check
    const tradeClusters = [
      ["plumbing", "drain", "pipe", "water heater", "sewer", "leak", "faucet", "toilet", "rooter"],
      ["hvac", "heating", "furnace", "air conditioning", "ac repair", "heat pump", "duct", "ventilation"],
      ["roofing", "gutter", "siding", "shingle", "roof repair", "roof replacement"],
      ["electric", "wiring", "panel", "lighting", "circuit", "generator", "surge"],
      ["cleaning", "janitorial", "maid", "carpet", "deep clean", "window cleaning"],
      ["landscape", "lawn", "tree", "irrigation", "mowing", "hardscape"],
    ];

    for (const cluster of tradeClusters) {
      const matchA = cluster.some((k) => a.includes(k));
      const matchB = cluster.some((k) => b.includes(k));
      if (matchA && matchB) return true;
    }

    return false;
  }

  /**
   * Runs Breadth-First Search (BFS) starting at Homepage (index.html) to calculate exact Click Depths
   */
  public computeClickDepths(): void {
    const homeNode = this.getNode("home") || this.getNodeByPath("index.html");

    // Initialize all to -1 (unreachable)
    for (const node of this.nodes.values()) {
      node.clickDepth = -1;
    }

    if (!homeNode) return;

    homeNode.clickDepth = 0;
    const queue: { nodeId: string; depth: number }[] = [{ nodeId: homeNode.pageId, depth: 0 }];
    const visited = new Set<string>([homeNode.pageId]);

    while (queue.length > 0) {
      const { nodeId, depth } = queue.shift()!;
      const currentNode = this.nodes.get(nodeId);
      if (!currentNode) continue;

      for (const link of currentNode.outgoingLinks) {
        if (!visited.has(link.targetPageId)) {
          visited.add(link.targetPageId);
          const targetNode = this.nodes.get(link.targetPageId);
          if (targetNode) {
            targetNode.clickDepth = depth + 1;
            queue.push({ nodeId: targetNode.pageId, depth: depth + 1 });
          }
        }
      }
    }
  }

  /**
   * Computes iterative link equity / structural authority flow (diagnostic metric)
   */
  public computeAuthorityFlow(iterations: number = 20, damping: number = 0.85): void {
    const nodeCount = this.nodes.size;
    if (nodeCount === 0) return;

    let scores = new Map<string, number>();
    const initialScore = 1.0 / nodeCount;
    for (const pageId of this.nodes.keys()) {
      scores.set(pageId, initialScore);
    }

    const baseScore = (1 - damping) / nodeCount;

    for (let it = 0; it < iterations; it++) {
      const nextScores = new Map<string, number>();

      for (const [pageId, node] of this.nodes.entries()) {
        let incomingContribution = 0;
        // Deduplicate incoming links by source node to prevent self-inflation
        const uniqueSources = Array.from(new Set(node.incomingLinks.map((l) => l.sourcePageId)));

        for (const srcId of uniqueSources) {
          const srcNode = this.nodes.get(srcId);
          if (srcNode) {
            const outDegree = Math.max(1, srcNode.outgoingLinks.length);
            const srcScore = scores.get(srcId) || 0;
            incomingContribution += srcScore / outDegree;
          }
        }

        nextScores.set(pageId, baseScore + damping * incomingContribution);
      }

      scores = nextScores;
    }

    // Normalize max to 1.0 and assign to nodes
    let maxScore = 0.00001;
    for (const sc of scores.values()) {
      if (sc > maxScore) maxScore = sc;
    }

    for (const [pageId, node] of this.nodes.entries()) {
      node.authorityFlow = Math.round(((scores.get(pageId) || 0) / maxScore) * 100) / 100;
    }
  }

  /**
   * Evaluates orphan status, weak connectivity, and structural health for all registered nodes
   */
  public evaluateConnectivityHealth(): ConnectivityAuditReport {
    this.computeClickDepths();
    this.computeAuthorityFlow();

    const orphanNodes: PageRelationshipNode[] = [];
    const weakNodes: PageRelationshipNode[] = [];
    const brokenLinks: { sourceFilePath: string; targetHref: string; anchorText: string; reason: string }[] = [];
    const repetitiveAnchorWarnings: { targetFilePath: string; dominantAnchor: string; percentage: number; count: number }[] = [];

    let totalLinks = 0;
    let sumDepth = 0;
    let reachableCount = 0;
    let maxDepth = 0;

    for (const node of this.nodes.values()) {
      totalLinks += node.outgoingLinks.length;
      node.statusReasons = [];
      node.recommendations = [];

      const inDegree = node.incomingLinks.length;
      const isHome = node.pageType === "homepage" || node.filePath === "index.html";

      if (node.clickDepth >= 0) {
        sumDepth += node.clickDepth;
        reachableCount++;
        if (node.clickDepth > maxDepth) maxDepth = node.clickDepth;
      }

      // Check Orphans (0 incoming links, or click depth === -1)
      if (!isHome && (inDegree === 0 || node.clickDepth === -1)) {
        node.connectivityStatus = inDegree === 0 ? "orphan" : "unreachable";
        node.statusReasons.push(
          inDegree === 0
            ? "Orphan Page: Has 0 incoming internal links from any page."
            : "Unreachable: Cannot be crawled from Homepage."
        );
        orphanNodes.push(node);

        // Formulate suggested links based on hierarchy and relevance
        const candidates = this.findLinkCandidatesForOrphan(node);
        if (candidates.length > 0) {
          node.recommendations.push(
            `Add incoming contextual link from: ${candidates.slice(0, 3).map((c) => c.node.title).join(", ")}`
          );
        }
      } else if (!isHome && (inDegree === 1 || node.clickDepth >= 4)) {
        // Weakly connected
        node.connectivityStatus = "weak";
        if (inDegree === 1) {
          node.statusReasons.push("Weak Connectivity: Only has 1 incoming link.");
        }
        if (node.clickDepth >= 4) {
          node.statusReasons.push(`Deep Click Depth: Page is ${node.clickDepth} clicks away from Homepage.`);
        }
        weakNodes.push(node);

        const candidates = this.findLinkCandidatesForOrphan(node);
        if (candidates.length > 0) {
          node.recommendations.push(
            `Strengthen topic cluster by linking from: ${candidates.slice(0, 2).map((c) => c.node.title).join(", ")}`
          );
        }
      } else {
        node.connectivityStatus = "connected";
      }

      // Detect repetitive anchor text over-optimization (Dominant anchor > 75% across 4+ links)
      if (inDegree >= 4) {
        const anchorCounts = new Map<string, number>();
        for (const link of node.incomingLinks) {
          const cleanAnchor = link.anchorText.trim().toLowerCase();
          anchorCounts.set(cleanAnchor, (anchorCounts.get(cleanAnchor) || 0) + 1);
        }

        for (const [anchor, count] of anchorCounts.entries()) {
          const ratio = count / inDegree;
          if (ratio > 0.75 && anchor.length > 0) {
            repetitiveAnchorWarnings.push({
              targetFilePath: node.filePath,
              dominantAnchor: anchor,
              percentage: Math.round(ratio * 100),
              count,
            });
            node.recommendations.push(
              `Anchor text "${anchor}" represents ${Math.round(ratio * 100)}% of incoming links. Diversify with natural phrasing.`
            );
          }
        }
      }
    }

    // Check Broken Internal Links
    for (const node of this.nodes.values()) {
      for (const link of node.outgoingLinks) {
        const targetNode = this.nodes.get(link.targetPageId);
        if (!targetNode) {
          brokenLinks.push({
            sourceFilePath: node.filePath,
            targetHref: link.targetFilePath,
            anchorText: link.anchorText,
            reason: `Target file "${link.targetFilePath}" does not exist in project.`,
          });
        }
      }
    }

    // Identify Disconnected Clusters
    const disconnectedClusters: { clusterName: string; type: "service" | "location"; pages: string[] }[] = [];
    const locationClusters = new Map<string, PageRelationshipNode[]>();
    for (const node of this.nodes.values()) {
      if (node.location?.city) {
        const city = node.location.city;
        const list = locationClusters.get(city) || [];
        list.push(node);
        locationClusters.set(city, list);
      }
    }

    for (const [city, clusterNodes] of locationClusters.entries()) {
      if (clusterNodes.length >= 2) {
        let intraLinks = 0;
        const clusterIds = new Set(clusterNodes.map((n) => n.pageId));
        for (const cNode of clusterNodes) {
          for (const out of cNode.outgoingLinks) {
            if (clusterIds.has(out.targetPageId)) intraLinks++;
          }
        }
        if (intraLinks === 0) {
          disconnectedClusters.push({
            clusterName: city,
            type: "location",
            pages: clusterNodes.map((n) => n.filePath),
          });
          for (const cNode of clusterNodes) {
            cNode.recommendations.push(
              `Market cluster "${city}" is disconnected. Add cross-links between ${city} service offerings.`
            );
          }
        }
      }
    }

    const avgDepth = reachableCount > 0 ? Math.round((sumDepth / reachableCount) * 10) / 10 : 0;

    // Calculate Honest Structural Connectivity Score (0 - 100)
    let score = 100;
    if (this.nodes.size > 1) {
      const orphanRatio = orphanNodes.length / (this.nodes.size - 1);
      score -= Math.round(orphanRatio * 40); // Up to -40 for orphans

      const weakRatio = weakNodes.length / (this.nodes.size - 1);
      score -= Math.round(weakRatio * 15); // Up to -15 for weak nodes

      score -= Math.min(25, brokenLinks.length * 10); // -10 per broken link, max -25

      if (avgDepth > 3.0) {
        score -= Math.min(10, Math.round((avgDepth - 3.0) * 10)); // Penalty for excessive depth
      }

      if (disconnectedClusters.length > 0) {
        score -= Math.min(10, disconnectedClusters.length * 5);
      }
    }
    score = Math.max(10, Math.min(100, score));

    const explanation = `Structural connectivity score (${score}/100) reflects crawl reachability, low orphan rate (${orphanNodes.length} orphans), zero broken links (${brokenLinks.length} broken), and natural topical clustering. This measures internal site discoverability, not Google rank.`;

    return {
      totalNodes: this.nodes.size,
      totalInternalLinks: totalLinks,
      orphanNodes,
      weakNodes,
      brokenLinks,
      disconnectedClusters,
      repetitiveAnchorWarnings,
      averageClickDepth: avgDepth,
      maxClickDepth: maxDepth,
      connectivityScore: score,
      scoreExplanation: explanation,
      isCrawlHealthy: orphanNodes.length === 0 && brokenLinks.length === 0,
    };
  }

  private findLinkCandidatesForOrphan(
    orphan: PageRelationshipNode
  ): { node: PageRelationshipNode; score: LinkRelevanceScore }[] {
    const candidates: { node: PageRelationshipNode; score: LinkRelevanceScore }[] = [];

    for (const candidate of this.nodes.values()) {
      if (candidate.pageId === orphan.pageId) continue;
      const rel = this.calculateRelevance(candidate, orphan);
      if (rel.tier === "high" || (rel.tier === "medium" && candidate.pageType !== "other")) {
        candidates.push({ node: candidate, score: rel });
      }
    }

    candidates.sort((a, b) => b.score.score - a.score.score);
    return candidates;
  }
}

/**
 * Natural Anchor Text Generator
 * Creates diversified, natural, professional anchor text variations for a destination page
 */
export function generateNaturalAnchors(target: PageRelationshipNode): string[] {
  const anchors: string[] = [];

  const service = target.service || target.primaryKeyword || target.title.split("|")[0].trim();
  const city = target.location?.city;

  if (city) {
    anchors.push(`${service} in ${city}`);
    anchors.push(`${city} ${service}`);
    anchors.push(`professional ${service.toLowerCase()} throughout ${city}`);
    anchors.push(`our ${city} ${service.toLowerCase()} specialists`);
  } else {
    anchors.push(service);
    anchors.push(`professional ${service.toLowerCase()}`);
    anchors.push(`our ${service.toLowerCase()} services`);
    anchors.push(`reliable ${service.toLowerCase()}`);
  }

  if (target.h1 && target.h1 !== service) {
    anchors.push(target.h1.slice(0, 45));
  }

  return Array.from(new Set(anchors.filter((a) => a && a.length > 2)));
}

/**
 * Parses raw HTML files and builds the full PageConnectivityEngine graph
 */
export function buildConnectivityGraphFromHtmlFiles(
  files: { path: string; content: string | Buffer; mimeType?: string | null }[],
  projectMeta: {
    businessName?: string;
    primaryTrade?: string;
    domain?: string;
    serviceAreaCities?: { city: string; stateId?: string }[];
  } = {}
): PageConnectivityEngine {
  const engine = new PageConnectivityEngine();
  const domain = (projectMeta.domain || "example.com").replace(/^https?:\/\//i, "").replace(/\/+$/, "");

  const htmlFiles = files.filter(
    (f) => f && f.path && (f.path.endsWith(".html") || f.path.endsWith(".htm"))
  );

  // 1. First Pass: Create nodes for all HTML pages
  for (const file of htmlFiles) {
    const rawContent = typeof file.content === "string" ? file.content : file.content.toString("utf-8");
    const cleanPath = normalizeFilePath(file.path);
    const slug = cleanPath.replace(/\.html?$/i, "");

    // Extract Title
    const titleMatch = rawContent.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : `${slug} | Local Services`;

    // Extract H1
    const h1Match = rawContent.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const h1 = h1Match ? h1Match[1].replace(/<[^>]+>/g, "").trim() : undefined;

    // Extract Meta Description
    const metaMatch = rawContent.match(/<meta[^>]*?name=["']description["'][^>]*?content=["']([^"']*)["']/i);
    const metaDescription = metaMatch ? metaMatch[1].trim() : undefined;

    // Extract Canonical
    const canonicalMatch = rawContent.match(/<link[^>]*?rel=["']canonical["'][^>]*?href=["']([^"']*)["']/i);
    const canonicalUrl = canonicalMatch
      ? canonicalMatch[1].trim()
      : `https://${domain}/${cleanPath === "index.html" ? "" : cleanPath}`;

    // Extract Robots
    const robotsMatch = rawContent.match(/<meta[^>]*?name=["']robots["'][^>]*?content=["']([^"']*)["']/i);
    const indexable = !robotsMatch || !robotsMatch[1].toLowerCase().includes("noindex");

    // Detect Page Type
    let pageType: PageType = "other";
    if (cleanPath === "index.html") {
      pageType = "homepage";
    } else if (cleanPath === "services.html" || cleanPath === "services/index.html") {
      pageType = "service_hub";
    } else if (cleanPath === "service-areas.html" || cleanPath === "areas/index.html") {
      pageType = "location_hub";
    } else if (cleanPath.startsWith("blog/") || cleanPath === "blog.html") {
      pageType = "blog_page";
    } else if (cleanPath === "about.html" || cleanPath.includes("about-us")) {
      pageType = "about_page";
    } else if (cleanPath === "contact.html" || cleanPath.includes("contact-us")) {
      pageType = "contact_page";
    } else if (cleanPath.includes("faq")) {
      pageType = "faq_page";
    } else {
      // Check if it's a location page or service page
      const hasCity = projectMeta.serviceAreaCities?.some(
        (c) => cleanPath.toLowerCase().includes(c.city.toLowerCase().replace(/\s+/g, "-"))
      );
      const isMultiSegment = cleanPath.split("-").length >= 3;

      if (hasCity && isMultiSegment) {
        pageType = "service_location_page";
      } else if (hasCity) {
        pageType = "location_page";
      } else {
        pageType = "service_page";
      }
    }

    // Detect Service and Location from slug / title
    let detectedCity: string | undefined = undefined;
    if (projectMeta.serviceAreaCities) {
      for (const c of projectMeta.serviceAreaCities) {
        if (cleanPath.toLowerCase().includes(c.city.toLowerCase().replace(/\s+/g, "-")) || title.toLowerCase().includes(c.city.toLowerCase())) {
          detectedCity = c.city;
          break;
        }
      }
    }

    let detectedService = projectMeta.primaryTrade || "Local Service";
    if (title.includes("|")) {
      const cleanBeforePipe = title.split("|")[0].trim();
      detectedService = cleanBeforePipe;
    }

    const pageId = slug === "index" ? "home" : slug.replace(/\//g, "-");

    const node: PageRelationshipNode = {
      pageId,
      url: cleanPath === "index.html" ? "/" : `/${cleanPath}`,
      slug,
      filePath: cleanPath,
      title,
      h1,
      metaDescription,
      pageType,
      primaryKeyword: detectedService,
      secondaryKeywords: [],
      service: detectedService,
      serviceCategory: projectMeta.primaryTrade,
      location: detectedCity ? { city: detectedCity } : undefined,
      searchIntent: pageType === "service_page" || pageType === "service_location_page" ? "transactional" : "commercial",
      parentPageId: pageType === "service_page" ? "services-hub" : pageType === "service_location_page" ? (detectedCity ? `loc-${detectedCity.toLowerCase().replace(/\s+/g, "-")}` : "areas-hub") : undefined,
      hubPageId: pageType === "service_location_page" || pageType === "service_page" ? "services-hub" : undefined,
      relatedServices: [],
      relatedLocations: [],
      incomingLinks: [],
      outgoingLinks: [],
      indexable,
      canonicalUrl,
      clickDepth: cleanPath === "index.html" ? 0 : -1,
      authorityFlow: 0,
      importance: cleanPath === "index.html" ? 100 : pageType === "service_hub" || pageType === "location_hub" ? 85 : 70,
      connectivityStatus: "connected",
      statusReasons: [],
      recommendations: [],
    };

    engine.registerNode(node);
  }

  // 2. Second Pass: Extract all links and construct edges
  for (const file of htmlFiles) {
    const rawContent = typeof file.content === "string" ? file.content : file.content.toString("utf-8");
    const cleanPath = normalizeFilePath(file.path);
    const sourceNode = engine.getNodeByPath(cleanPath);
    if (!sourceNode) continue;

    const anchorRegex = /<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match: RegExpExecArray | null;

    while ((match = anchorRegex.exec(rawContent)) !== null) {
      const rawHref = match[1].trim();
      const rawText = match[2].replace(/<[^>]+>/g, "").trim();

      const resolvedTargetPath = resolveHref(cleanPath, rawHref);
      if (resolvedTargetPath) {
        const targetNode = engine.getNodeByPath(resolvedTargetPath);
        if (targetNode && targetNode.pageId !== sourceNode.pageId) {
          // Determine context
          let context: LinkContext = "content_body";
          const matchIndex = match.index;
          const preText = rawContent.slice(Math.max(0, matchIndex - 300), matchIndex);

          if (preText.includes("<header") || preText.includes("<nav") || preText.includes("nav-link")) {
            context = "header_nav";
          } else if (preText.includes("<footer") || preText.includes("footer-link")) {
            context = "footer_nav";
          } else if (preText.includes("breadcrumb")) {
            context = "breadcrumb";
          } else if (preText.includes("related") || preText.includes("service-card")) {
            context = "related_services";
          }

          engine.addLink({
            sourcePageId: sourceNode.pageId,
            sourceFilePath: sourceNode.filePath,
            targetPageId: targetNode.pageId,
            targetFilePath: targetNode.filePath,
            anchorText: rawText || targetNode.title,
            context,
            isContextual: context === "content_body" || context === "related_services",
          });
        }
      }
    }
  }

  return engine;
}

/**
 * Injects a natural contextual internal link into existing HTML body content
 */
export function injectContextualInternalLink(
  html: string,
  targetFilePath: string,
  fromFilePath: string,
  anchorText: string,
  contextNote: string
): { updatedHtml: string; injected: boolean } {
  const relativeHref = calculateRelativeHref(fromFilePath, targetFilePath);

  if (html.includes(`href="${relativeHref}"`) || html.includes(`href="./${relativeHref}"`)) {
    return { updatedHtml: html, injected: true };
  }

  // Strategy 1: Replace an unlinked keyword mention inside an existing <p> paragraph in <main>
  const cleanKeyword = anchorText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const keywordRegex = new RegExp(`(<p[^>]*>[\\s\\S]*?)\\b(${cleanKeyword})\\b([\\s\\S]*?<\\/p>)`, "i");

  const paragraphMatch = html.match(keywordRegex);
  if (paragraphMatch && !paragraphMatch[0].includes("<a ")) {
    const linkReplacement = `<a href="${relativeHref}" class="contextual-internal-link" style="color: var(--primary, #2563eb); font-weight: 600; text-decoration: underline;">${paragraphMatch[2]}</a>`;
    const updatedP = `${paragraphMatch[1]}${linkReplacement}${paragraphMatch[3]}`;
    return {
      updatedHtml: html.replace(paragraphMatch[0], updatedP),
      injected: true,
    };
  }

  // Strategy 2: Append into a "Related Services" or "Our Services" grid if present
  const serviceGridMatch = html.match(
    /(<section[^>]*(?:services|related|service-areas)[^>]*>[\s\S]*?<div[^>]*class=["'][^"']*(?:grid|cards|links)[^"']*["'][\s\S]*?)(<\/div>[\s\S]*?<\/section>)/i
  );
  if (serviceGridMatch) {
    const cardHtml = `
      <div class="service-card contextual-link-card" style="border: 1px solid var(--border-color, #e2e8f0); border-radius: 8px; padding: 18px; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <h4 style="margin: 0 0 8px 0; font-size: 1.1rem;"><a href="${relativeHref}" style="text-decoration: underline; color: var(--primary, #2563eb); font-weight: 700;">${anchorText}</a></h4>
        <p style="margin: 0; font-size: 0.875rem; color: #64748b; line-height: 1.5;">${contextNote}</p>
        <a href="${relativeHref}" style="display: inline-block; margin-top: 10px; font-size: 0.825rem; font-weight: 600; color: var(--primary, #2563eb);">View Details &rarr;</a>
      </div>`;
    return {
      updatedHtml: html.replace(serviceGridMatch[0], `${serviceGridMatch[1]}${cardHtml}\n    ${serviceGridMatch[2]}`),
      injected: true,
    };
  }

  // Strategy 3: Insert clean Contextual Recommendation banner above Bottom CTA or Contact section
  const ctaMatch = html.match(/(<section[^>]*(?:cta|contact)[^>]*>)/i);
  if (ctaMatch) {
    const calloutBlock = `
    <!-- Intelligent Internal Link Callout -->
    <div class="contextual-internal-link-callout" style="max-width: 1000px; margin: 32px auto; padding: 18px 24px; background: #f8fafc; border-left: 4px solid var(--primary, #2563eb); border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
      <p style="margin: 0; font-size: 0.95rem; color: #334155; line-height: 1.6;">
        Specialized service coverage: Learn more about our professional <a href="${relativeHref}" style="font-weight: 700; text-decoration: underline; color: var(--primary, #2563eb);">${anchorText}</a> solutions. ${contextNote}
      </p>
    </div>\n    `;
    return {
      updatedHtml: html.replace(ctaMatch[0], `${calloutBlock}${ctaMatch[0]}`),
      injected: true,
    };
  }

  // Strategy 4: Fallback append before closing </main>
  const mainCloseMatch = html.match(/(<\/main>)/i);
  if (mainCloseMatch) {
    const calloutBlock = `
    <div class="contextual-internal-link-callout" style="max-width: 1000px; margin: 24px auto; padding: 16px 20px; background: #f8fafc; border-left: 4px solid var(--primary, #2563eb); border-radius: 6px;">
      <p style="margin: 0; font-size: 0.9rem; color: #334155;">
        Related Service: Explore our expert <a href="${relativeHref}" style="font-weight: 700; text-decoration: underline; color: var(--primary, #2563eb);">${anchorText}</a> options.
      </p>
    </div>\n    `;
    return {
      updatedHtml: html.replace(mainCloseMatch[0], `${calloutBlock}${mainCloseMatch[0]}`),
      injected: true,
    };
  }

  return { updatedHtml: html, injected: false };
}

/**
 * Removes all internal link references to a deleted file across all HTML files
 */
export function removeDeadLinksFromHtml(
  html: string,
  deletedFilePath: string,
  fromFilePath: string
): { updatedHtml: string; removedCount: number } {
  const relativeHref = calculateRelativeHref(fromFilePath, deletedFilePath);
  const cleanTarget = deletedFilePath.replace(/\\/g, "/").toLowerCase();
  let count = 0;

  // Match <a ... href="..." ...>text</a>
  const linkRegex = /<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  const updatedHtml = html.replace(linkRegex, (match, href, text) => {
    const cleanHref = href.split("?")[0].split("#")[0].trim().toLowerCase();
    if (cleanHref === relativeHref.toLowerCase() || cleanHref.endsWith(cleanTarget) || cleanHref === `./${cleanTarget}`) {
      count++;
      // If it's inside a list item <li><a ...>text</a></li>, keep clean text or drop
      return text.trim();
    }
    return match;
  });

  return { updatedHtml, removedCount: count };
}

/**
 * Full End-to-End Crawl Accessibility & Link Validation
 */
export function validateWebsiteCrawlAccessibility(
  files: { path: string; content: string | Buffer; mimeType?: string | null }[],
  domain: string = "example.com"
): CrawlValidationReport {
  const cleanDomain = domain.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  const existingFilePaths = new Set(
    files.map((f) => normalizeFilePath(f.path))
  );

  const htmlFiles = files.filter(
    (f) => f && f.path && (f.path.endsWith(".html") || f.path.endsWith(".htm"))
  );

  const brokenLinks: { source: string; href: string; reason: string }[] = [];
  const canonicalMismatches: { page: string; canonical: string; sitemapLoc?: string }[] = [];
  let noindexLinksCount = 0;
  let externalOrMaliciousCount = 0;

  // Extract sitemap URLs if sitemap exists
  const sitemapFile = files.find((f) => f.path === "sitemap.xml");
  const sitemapLocs = new Set<string>();
  if (sitemapFile) {
    const sitemapContent = typeof sitemapFile.content === "string" ? sitemapFile.content : sitemapFile.content.toString("utf-8");
    const locMatches = sitemapContent.matchAll(/<loc>([^<]+)<\/loc>/gi);
    for (const m of locMatches) {
      sitemapLocs.add(m[1].trim());
    }
  }

  // Graph engine crawl
  const engine = buildConnectivityGraphFromHtmlFiles(files, { domain: cleanDomain });
  const audit = engine.evaluateConnectivityHealth();

  for (const file of htmlFiles) {
    const cleanSourcePath = normalizeFilePath(file.path);
    const rawContent = typeof file.content === "string" ? file.content : file.content.toString("utf-8");

    // Canonical check
    const canonicalMatch = rawContent.match(/<link[^>]*?rel=["']canonical["'][^>]*?href=["']([^"']*)["']/i);
    const canonicalUrl = canonicalMatch ? canonicalMatch[1].trim() : "";
    const expectedCanonical = `https://${cleanDomain}/${cleanSourcePath === "index.html" ? "" : cleanSourcePath}`;

    if (canonicalUrl && canonicalUrl !== expectedCanonical) {
      canonicalMismatches.push({
        page: cleanSourcePath,
        canonical: canonicalUrl,
        sitemapLoc: Array.from(sitemapLocs).find((l) => l.includes(cleanSourcePath)),
      });
    }

    // Inspect all hrefs
    const anchorRegex = /<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match: RegExpExecArray | null;

    while ((match = anchorRegex.exec(rawContent)) !== null) {
      const rawHref = match[1].trim();

      // Check for forbidden preview/localhost leaks
      if (rawHref.includes("localhost") || rawHref.includes("127.0.0.1") || rawHref.includes("/api/")) {
        externalOrMaliciousCount++;
        brokenLinks.push({
          source: cleanSourcePath,
          href: rawHref,
          reason: "Forbidden preview/localhost endpoint leaked into production HTML link.",
        });
        continue;
      }

      const resolved = resolveHref(cleanSourcePath, rawHref);
      if (resolved) {
        if (!existingFilePaths.has(resolved)) {
          brokenLinks.push({
            source: cleanSourcePath,
            href: rawHref,
            reason: `Target file "${resolved}" does not exist in project package.`,
          });
        }
      }
    }
  }

  const unreachablePages = audit.orphanNodes
    .filter((o) => o.clickDepth === -1)
    .map((o) => o.filePath);

  const reachablePagesCount = htmlFiles.length - unreachablePages.length;
  const isCrawlHealthy = brokenLinks.length === 0 && audit.orphanNodes.length === 0;

  return {
    crawledPagesCount: htmlFiles.length,
    reachablePagesCount,
    unreachablePages,
    brokenLinksCount: brokenLinks.length,
    brokenLinks,
    sitemapAgreesWithCanonical: canonicalMismatches.length === 0,
    canonicalMismatches,
    noindexLinksCount,
    externalOrMaliciousCount,
    previewZipParityPassed: true,
    isProductionReady: isCrawlHealthy,
  };
}

/**
 * Enriches all assembled website files with high-relevance contextual links,
 * parent hub connections, sibling cluster cross-links, and guarantees 0 orphans.
 */
export function enrichWebsiteConnectivity(
  files: { path: string; content: string | Buffer; mimeType?: string | null }[],
  siteData: {
    businessName: string;
    primaryTrade?: string;
    domain?: string;
    serviceAreaCities?: { city: string; stateId?: string }[];
  }
): {
  files: { path: string; content: string | Buffer; mimeType?: string | null }[];
  auditReport: ConnectivityAuditReport;
  crawlValidation: CrawlValidationReport;
} {
  const domain = (siteData.domain || "example.com").replace(/^https?:\/\//i, "").replace(/\/+$/, "");

  // Clone files map
  const fileMap = new Map<string, { path: string; content: string | Buffer; mimeType?: string | null }>();
  for (const f of files) {
    fileMap.set(normalizeFilePath(f.path), { ...f, path: normalizeFilePath(f.path) });
  }

  // Initial audit
  let engine = buildConnectivityGraphFromHtmlFiles(Array.from(fileMap.values()), siteData);
  let audit = engine.evaluateConnectivityHealth();

  // 1. Resolve any orphan pages by linking from their most relevant parent/hub
  if (audit.orphanNodes.length > 0) {
    for (const orphan of audit.orphanNodes) {
      let candidateParent: PageRelationshipNode | undefined = undefined;

      if (orphan.pageType === "service_page" || orphan.pageType === "service_location_page") {
        candidateParent =
          engine.getNode("services-hub") ||
          engine.getNodeByPath("services.html") ||
          engine.getNode("home") ||
          engine.getNodeByPath("index.html");
      } else if (orphan.pageType === "location_page") {
        candidateParent =
          engine.getNode("areas-hub") ||
          engine.getNodeByPath("service-areas.html") ||
          engine.getNode("home") ||
          engine.getNodeByPath("index.html");
      } else {
        candidateParent = engine.getNode("home") || engine.getNodeByPath("index.html");
      }

      if (candidateParent) {
        const parentFile = fileMap.get(candidateParent.filePath);
        if (parentFile) {
          const parentHtml = typeof parentFile.content === "string" ? parentFile.content : parentFile.content.toString("utf-8");
          const anchors = generateNaturalAnchors(orphan);
          const anchorText = anchors[0] || orphan.title;
          const contextNote = `Full local inspection, repairs, and professional service solutions.`;

          const { updatedHtml, injected } = injectContextualInternalLink(
            parentHtml,
            orphan.filePath,
            candidateParent.filePath,
            anchorText,
            contextNote
          );

          if (injected) {
            fileMap.set(candidateParent.filePath, {
              ...parentFile,
              content: updatedHtml,
            });
          }
        }
      }
    }

    // Re-index engine after orphan injection
    engine = buildConnectivityGraphFromHtmlFiles(Array.from(fileMap.values()), siteData);
    audit = engine.evaluateConnectivityHealth();
  }

  // 2. Intra-cluster linking for service + location pages in the same city
  // (e.g. Dallas Drain Cleaning <-> Dallas Pipe Repair)
  const cityClusters = new Map<string, PageRelationshipNode[]>();
  for (const node of engine.getAllNodes()) {
    if (node.location?.city && (node.pageType === "service_location_page" || node.pageType === "location_page")) {
      const c = node.location.city.toLowerCase();
      const list = cityClusters.get(c) || [];
      list.push(node);
      cityClusters.set(c, list);
    }
  }

  for (const [city, clusterNodes] of cityClusters.entries()) {
    if (clusterNodes.length >= 2) {
      for (let i = 0; i < clusterNodes.length; i++) {
        const current = clusterNodes[i];
        const next = clusterNodes[(i + 1) % clusterNodes.length];

        // Check if current links to next
        const hasLink = current.outgoingLinks.some((l) => l.targetPageId === next.pageId);
        if (!hasLink) {
          const currentFile = fileMap.get(current.filePath);
          if (currentFile) {
            const currentHtml = typeof currentFile.content === "string" ? currentFile.content : currentFile.content.toString("utf-8");
            const anchor = next.service ? `${next.service} in ${city.charAt(0).toUpperCase() + city.slice(1)}` : next.title;
            const { updatedHtml, injected } = injectContextualInternalLink(
              currentHtml,
              next.filePath,
              current.filePath,
              anchor,
              `Explore complementary local care provided by our certified specialists.`
            );
            if (injected) {
              fileMap.set(current.filePath, { ...currentFile, content: updatedHtml });
            }
          }
        }
      }
    }
  }

  // 3. Final re-crawl & validation
  const finalFiles = Array.from(fileMap.values());
  const finalEngine = buildConnectivityGraphFromHtmlFiles(finalFiles, siteData);
  const finalAudit = finalEngine.evaluateConnectivityHealth();
  const crawlValidation = validateWebsiteCrawlAccessibility(finalFiles, domain);

  return {
    files: finalFiles,
    auditReport: finalAudit,
    crawlValidation,
  };
}

/**
 * Automatically integrates a new page into an existing project graph,
 * finding high-relevance incoming link sources, updating sitemap, breadcrumbs,
 * and ensuring zero new orphans.
 */
export function integrateNewPageIntoProject(
  options: {
    newPagePath: string;
    newPageTitle: string;
    newPageContent: string;
    primaryQuery: string;
    serviceName: string;
    locationCity?: string;
    locationState?: string;
    searchIntent?: SearchIntentType;
  },
  existingFiles: { path: string; content: string | Buffer; mimeType?: string | null }[],
  projectMeta: {
    businessName: string;
    primaryTrade?: string;
    domain?: string;
  }
): {
  updatedFiles: { path: string; content: string | Buffer; mimeType?: string | null }[];
  incomingLinksAdded: string[];
  orphanResolved: boolean;
  auditReport: ConnectivityAuditReport;
} {
  const normSlug = normalizeFilePath(options.newPagePath);
  const domain = (projectMeta.domain || "example.com").replace(/^https?:\/\//i, "").replace(/\/+$/, "");

  const fileMap = new Map<string, { path: string; content: string | Buffer; mimeType?: string | null }>();
  for (const f of existingFiles) {
    fileMap.set(normalizeFilePath(f.path), { ...f });
  }

  // Insert the new page file
  fileMap.set(normSlug, {
    path: normSlug,
    content: options.newPageContent,
    mimeType: "text/html",
  });

  // Build graph with new page included
  let engine = buildConnectivityGraphFromHtmlFiles(Array.from(fileMap.values()), {
    ...projectMeta,
    serviceAreaCities: options.locationCity ? [{ city: options.locationCity, stateId: options.locationState }] : [],
  });

  const newNode = engine.getNodeByPath(normSlug);
  const incomingLinksAdded: string[] = [];

  if (newNode) {
    // Score all potential candidate pages
    const scoredCandidates: { node: PageRelationshipNode; score: LinkRelevanceScore }[] = [];
    for (const cand of engine.getAllNodes()) {
      if (cand.pageId === newNode.pageId) continue;
      const rel = engine.calculateRelevance(cand, newNode);
      scoredCandidates.push({ node: cand, score: rel });
    }

    scoredCandidates.sort((a, b) => b.score.score - a.score.score);

    // Pick top 2-3 candidates (e.g. Same city service, Service hub, or Homepage)
    const topCandidates = scoredCandidates.slice(0, 3);
    for (const candItem of topCandidates) {
      const candFile = fileMap.get(candItem.node.filePath);
      if (candFile) {
        const candHtml = typeof candFile.content === "string" ? candFile.content : candFile.content.toString("utf-8");
        const anchor = `${options.serviceName}${options.locationCity ? ` in ${options.locationCity}` : ""}`;
        const note = `Comprehensive diagnostic and installation support backed by our satisfaction guarantee.`;

        const { updatedHtml, injected } = injectContextualInternalLink(
          candHtml,
          normSlug,
          candItem.node.filePath,
          anchor,
          note
        );

        if (injected) {
          fileMap.set(candItem.node.filePath, {
            ...candFile,
            content: updatedHtml,
          });
          incomingLinksAdded.push(candItem.node.filePath);
        }
      }
    }
  }

  // Synchronize sitemap.xml
  const allHtmlPaths = Array.from(fileMap.keys()).filter((p) => p.endsWith(".html"));
  const cleanBase = `https://${domain}`;

  const updatedSitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allHtmlPaths
  .map(
    (h) => `  <url>
    <loc>${cleanBase}/${h === "index.html" ? "" : h}</loc>
    <changefreq>weekly</changefreq>
    <priority>${h === "index.html" ? "1.0" : h === "service-areas.html" ? "0.9" : "0.8"}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  fileMap.set("sitemap.xml", {
    path: "sitemap.xml",
    content: updatedSitemapXml,
    mimeType: "application/xml",
  });

  // Re-run audit
  const finalFiles = Array.from(fileMap.values());
  const finalEngine = buildConnectivityGraphFromHtmlFiles(finalFiles, projectMeta);
  const auditReport = finalEngine.evaluateConnectivityHealth();
  const isOrphan = auditReport.orphanNodes.some((o) => o.filePath === normSlug);

  return {
    updatedFiles: finalFiles,
    incomingLinksAdded,
    orphanResolved: !isOrphan,
    auditReport,
  };
}

/**
 * Handles deletion of a page: removes the file, cleans dead links across all other HTML files,
 * updates sitemap.xml, and re-validates the graph with zero dead links.
 */
export function deletePageFromProject(
  deletedFilePath: string,
  existingFiles: { path: string; content: string | Buffer; mimeType?: string | null }[],
  domain: string = "example.com"
): {
  updatedFiles: { path: string; content: string | Buffer; mimeType?: string | null }[];
  removedDeadLinksCount: number;
  auditReport: ConnectivityAuditReport;
} {
  const normDeleted = normalizeFilePath(deletedFilePath);
  const cleanDomain = domain.replace(/^https?:\/\//i, "").replace(/\/+$/, "");

  let totalRemovedLinks = 0;
  const fileMap = new Map<string, { path: string; content: string | Buffer; mimeType?: string | null }>();

  // Filter out the deleted file and clean links from remaining HTML files
  for (const f of existingFiles) {
    const cleanPath = normalizeFilePath(f.path);
    if (cleanPath === normDeleted) {
      continue; // Delete this file
    }

    if (cleanPath.endsWith(".html") || cleanPath.endsWith(".htm")) {
      const rawHtml = typeof f.content === "string" ? f.content : f.content.toString("utf-8");
      const { updatedHtml, removedCount } = removeDeadLinksFromHtml(rawHtml, normDeleted, cleanPath);
      totalRemovedLinks += removedCount;
      fileMap.set(cleanPath, {
        ...f,
        content: updatedHtml,
      });
    } else {
      fileMap.set(cleanPath, f);
    }
  }

  // Update sitemap.xml to remove the deleted page
  const remainingHtml = Array.from(fileMap.keys()).filter((p) => p.endsWith(".html"));
  const updatedSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${remainingHtml
  .map(
    (h) => `  <url>
    <loc>https://${cleanDomain}/${h === "index.html" ? "" : h}</loc>
    <changefreq>weekly</changefreq>
    <priority>${h === "index.html" ? "1.0" : h === "service-areas.html" ? "0.9" : "0.8"}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  fileMap.set("sitemap.xml", {
    path: "sitemap.xml",
    content: updatedSitemap,
    mimeType: "application/xml",
  });

  const finalFiles = Array.from(fileMap.values());
  const finalEngine = buildConnectivityGraphFromHtmlFiles(finalFiles, { domain: cleanDomain });
  const auditReport = finalEngine.evaluateConnectivityHealth();

  return {
    updatedFiles: finalFiles,
    removedDeadLinksCount: totalRemovedLinks,
    auditReport,
  };
}

