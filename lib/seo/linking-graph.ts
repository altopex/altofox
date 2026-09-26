import { PageRegistry, RegistryPage, LinkStyle } from "../registry/page-registry";
import { LocationEntity, ServiceEntity } from "../entities/types";
import { findNearbyLocations } from "../entities/geo-silo";

export type LinkContext =
  | "header_nav"
  | "footer_nav"
  | "content_body"
  | "silo_parent"
  | "silo_child"
  | "sibling_geo"
  | "related_service"
  | "breadcrumb";

export interface GraphNode {
  id: string;
  slug: string;
  title: string;
  navLabel?: string;
  pageType: string;
  outputFilePath: string;
  serviceId?: string;
  locationId?: string;
  parentPageId?: string;
}

export interface GraphEdge {
  sourceId: string;
  targetId: string;
  anchorText: string;
  context: LinkContext;
}

export interface LinkRecommendation {
  targetNodeId: string;
  targetSlug: string;
  targetTitle: string;
  recommendedAnchor: string;
  reason: string;
  context: LinkContext;
  priority: number; // 1 (Highest) to 5
}

export interface GraphHealthReport {
  totalNodes: number;
  totalEdges: number;
  averageInDegree: number;
  orphanNodes: GraphNode[];
  weakNodes: GraphNode[]; // In-degree < 2
  deadEndNodes: GraphNode[]; // Out-degree === 0
  repetitiveAnchorWarnings: Array<{ targetId: string; dominantAnchor: string; percentage: number }>;
  isHealthy: boolean;
}

/**
 * Graph-Theoretic Internal Linking Engine for Rank Local
 * Computes in-degree, out-degree, link equity flow, orphan detection,
 * and contextual silo recommendations across large multi-page local SEO sites.
 */
export class InternalLinkingGraph {
  private nodes = new Map<string, GraphNode>();
  private nodesByPath = new Map<string, GraphNode>();
  private outgoingEdges = new Map<string, GraphEdge[]>();
  private incomingEdges = new Map<string, GraphEdge[]>();

  constructor(initialNodes: GraphNode[] = []) {
    for (const node of initialNodes) {
      this.addNode(node);
    }
  }

  public addNode(node: GraphNode): void {
    const cleanPath = node.outputFilePath.replace(/\\/g, "/").replace(/^\/+/, "");
    const entry = { ...node, outputFilePath: cleanPath };
    this.nodes.set(entry.id, entry);
    this.nodesByPath.set(cleanPath, entry);

    if (!this.outgoingEdges.has(entry.id)) {
      this.outgoingEdges.set(entry.id, []);
    }
    if (!this.incomingEdges.has(entry.id)) {
      this.incomingEdges.set(entry.id, []);
    }
  }

  public getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  public getNodeByPath(path: string): GraphNode | undefined {
    const clean = path.replace(/\\/g, "/").replace(/^\/+/, "");
    return this.nodesByPath.get(clean);
  }

  public getAllNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  public addEdge(edge: GraphEdge): void {
    if (!this.nodes.has(edge.sourceId) || !this.nodes.has(edge.targetId)) {
      return; // Ignore links between non-existent nodes
    }

    const outList = this.outgoingEdges.get(edge.sourceId) || [];
    outList.push(edge);
    this.outgoingEdges.set(edge.sourceId, outList);

    const inList = this.incomingEdges.get(edge.targetId) || [];
    inList.push(edge);
    this.incomingEdges.set(edge.targetId, inList);
  }

  public getInDegree(nodeId: string): number {
    return (this.incomingEdges.get(nodeId) || []).length;
  }

  public getOutDegree(nodeId: string): number {
    return (this.outgoingEdges.get(nodeId) || []).length;
  }

  public getIncomingEdges(nodeId: string): GraphEdge[] {
    return this.incomingEdges.get(nodeId) || [];
  }

  public getOutgoingEdges(nodeId: string): GraphEdge[] {
    return this.outgoingEdges.get(nodeId) || [];
  }

  /**
   * Identifies orphan pages (0 incoming links, excluding the homepage root)
   */
  public getOrphanNodes(): GraphNode[] {
    const orphans: GraphNode[] = [];
    for (const node of this.nodes.values()) {
      if (node.id === "home" || node.pageType === "home") continue;
      if (this.getInDegree(node.id) === 0) {
        orphans.push(node);
      }
    }
    return orphans;
  }

  /**
   * Identifies weak pages (fewer than minInDegree incoming links)
   */
  public getWeakNodes(minInDegree: number = 2): GraphNode[] {
    const weak: GraphNode[] = [];
    for (const node of this.nodes.values()) {
      if (node.id === "home" || node.pageType === "home") continue;
      const count = this.getInDegree(node.id);
      if (count > 0 && count < minInDegree) {
        weak.push(node);
      }
    }
    return weak;
  }

  /**
   * Identifies dead-end pages (pages that have incoming links but zero outgoing links)
   */
  public getDeadEndNodes(): GraphNode[] {
    const deadEnds: GraphNode[] = [];
    for (const node of this.nodes.values()) {
      if (this.getOutDegree(node.id) === 0) {
        deadEnds.push(node);
      }
    }
    return deadEnds;
  }

  /**
   * Calculates iterative Link Equity / PageRank across the internal link network.
   * Damping factor = 0.85, 20 iterations.
   */
  public calculateLinkEquity(damping: number = 0.85, iterations: number = 20): Map<string, number> {
    const nodeCount = this.nodes.size;
    if (nodeCount === 0) return new Map();

    const initialScore = 1.0 / nodeCount;
    let scores = new Map<string, number>();

    for (const id of this.nodes.keys()) {
      scores.set(id, initialScore);
    }

    const baseScore = (1 - damping) / nodeCount;

    for (let it = 0; it < iterations; it++) {
      const nextScores = new Map<string, number>();

      for (const [nodeId] of this.nodes.entries()) {
        let incomingContribution = 0;
        const inEdges = this.incomingEdges.get(nodeId) || [];

        // Deduplicate incoming links from the same source node to prevent self-inflation
        const uniqueSourceIds = Array.from(new Set(inEdges.map((e) => e.sourceId)));

        for (const sourceId of uniqueSourceIds) {
          const sourceOutDegree = Math.max(1, this.getOutDegree(sourceId));
          const sourceScore = scores.get(sourceId) || 0;
          incomingContribution += sourceScore / sourceOutDegree;
        }

        nextScores.set(nodeId, baseScore + damping * incomingContribution);
      }

      scores = nextScores;
    }

    return scores;
  }

  /**
   * Contextual Link Recommendation Engine:
   * Generates intelligent, non-spammy internal link suggestions for a given page.
   */
  public recommendLinksForPage(
    sourceNodeId: string,
    options: {
      allLocations?: LocationEntity[];
      allServices?: ServiceEntity[];
      maxRecommendations?: number;
    } = {}
  ): LinkRecommendation[] {
    const sourceNode = this.nodes.get(sourceNodeId);
    if (!sourceNode) return [];

    const existingTargets = new Set(
      (this.outgoingEdges.get(sourceNodeId) || []).map((e) => e.targetId)
    );
    existingTargets.add(sourceNodeId); // Never recommend self-link

    const recommendations: LinkRecommendation[] = [];
    const maxRecs = options.maxRecommendations || 5;

    // 1. Silo Parent Recommendation: Inner pages should always link up to their parent hub
    if (sourceNode.parentPageId && !existingTargets.has(sourceNode.parentPageId)) {
      const parentNode = this.nodes.get(sourceNode.parentPageId);
      if (parentNode) {
        recommendations.push({
          targetNodeId: parentNode.id,
          targetSlug: parentNode.slug,
          targetTitle: parentNode.title,
          recommendedAnchor: parentNode.navLabel || parentNode.title,
          reason: "Connect page upward to its parent Silo Hub",
          context: "silo_parent",
          priority: 1,
        });
        existingTargets.add(parentNode.id);
      }
    }

    // 2. Geographic Sibling Recommendation: Location pages should cross-link to 2–3 nearby cities
    if (sourceNode.locationId && options.allLocations && options.allLocations.length > 0) {
      const currentLoc = options.allLocations.find((l) => l.id === sourceNode.locationId || l.slug === sourceNode.slug);
      if (currentLoc) {
        const nearby = findNearbyLocations(currentLoc, options.allLocations, 3);
        for (const near of nearby) {
          const targetNode = Array.from(this.nodes.values()).find(
            (n) => n.locationId === near.id || n.slug.includes(near.slug)
          );
          if (targetNode && !existingTargets.has(targetNode.id)) {
            recommendations.push({
              targetNodeId: targetNode.id,
              targetSlug: targetNode.slug,
              targetTitle: targetNode.title,
              recommendedAnchor: `${near.city} Service Area`,
              reason: `Geographic proximity link to nearby market (${near.city})`,
              context: "sibling_geo",
              priority: 2,
            });
            existingTargets.add(targetNode.id);
          }
        }
      }
    }

    // 3. Service Cross-Link Recommendation: Service pages should link to complementary services
    if (sourceNode.serviceId && options.allServices && options.allServices.length > 0) {
      const currentSrv = options.allServices.find((s) => s.id === sourceNode.serviceId || s.slug === sourceNode.slug);
      if (currentSrv) {
        // Find sibling services in same category
        const siblings = options.allServices.filter(
          (s) => s.id !== currentSrv.id && (s.category === currentSrv.category || !s.parentServiceId)
        );

        for (const sib of siblings.slice(0, 2)) {
          const targetNode = Array.from(this.nodes.values()).find(
            (n) => n.serviceId === sib.id || n.slug.includes(sib.slug)
          );
          if (targetNode && !existingTargets.has(targetNode.id)) {
            recommendations.push({
              targetNodeId: targetNode.id,
              targetSlug: targetNode.slug,
              targetTitle: targetNode.title,
              recommendedAnchor: sib.name,
              reason: `Contextual trade link to complementary service (${sib.name})`,
              context: "related_service",
              priority: 3,
            });
            existingTargets.add(targetNode.id);
          }
        }
      }
    }

    // 4. Orphan Relief: If there are orphan or weak pages in the site, route links from healthy pages
    const orphans = this.getOrphanNodes();
    for (const orphan of orphans) {
      if (recommendations.length >= maxRecs) break;
      if (!existingTargets.has(orphan.id)) {
        recommendations.push({
          targetNodeId: orphan.id,
          targetSlug: orphan.slug,
          targetTitle: orphan.title,
          recommendedAnchor: orphan.navLabel || orphan.title,
          reason: "Orphan recovery: Page currently has zero incoming links",
          context: "content_body",
          priority: 1,
        });
        existingTargets.add(orphan.id);
      }
    }

    return recommendations.slice(0, maxRecs);
  }

  /**
   * Health Audit: Scans the graph for crawlability risks, orphan pages, and anchor text over-optimization
   */
  public auditGraphHealth(): GraphHealthReport {
    const totalNodes = this.nodes.size;
    let totalEdges = 0;
    for (const edges of this.outgoingEdges.values()) {
      totalEdges += edges.length;
    }

    const orphanNodes = this.getOrphanNodes();
    const weakNodes = this.getWeakNodes(2);
    const deadEndNodes = this.getDeadEndNodes();
    const averageInDegree = totalNodes > 0 ? totalEdges / totalNodes : 0;

    // Detect repetitive anchor text (over-optimization check)
    const repetitiveAnchorWarnings: Array<{ targetId: string; dominantAnchor: string; percentage: number }> = [];

    for (const [targetId, inEdges] of this.incomingEdges.entries()) {
      if (inEdges.length >= 4) {
        const anchorCounts = new Map<string, number>();
        for (const edge of inEdges) {
          const cleanAnchor = edge.anchorText.trim().toLowerCase();
          anchorCounts.set(cleanAnchor, (anchorCounts.get(cleanAnchor) || 0) + 1);
        }

        for (const [anchor, count] of anchorCounts.entries()) {
          const ratio = count / inEdges.length;
          if (ratio > 0.75 && anchor.length > 0) {
            repetitiveAnchorWarnings.push({
              targetId,
              dominantAnchor: anchor,
              percentage: Math.round(ratio * 100),
            });
          }
        }
      }
    }

    const isHealthy = orphanNodes.length === 0 && averageInDegree >= 1.5;

    return {
      totalNodes,
      totalEdges,
      averageInDegree: Math.round(averageInDegree * 100) / 100,
      orphanNodes,
      weakNodes,
      deadEndNodes,
      repetitiveAnchorWarnings,
      isHealthy,
    };
  }

  /**
   * Ingests parsed HTML string to extract internal links and populate graph edges
   */
  public extractLinksFromHtml(sourceNodeId: string, html: string): GraphEdge[] {
    const edges: GraphEdge[] = [];
    if (!html) return edges;

    const sourceNode = this.nodes.get(sourceNodeId);
    if (!sourceNode) return edges;

    // Match <a ... href="..." ...>anchor</a>
    const anchorRegex = /<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match: RegExpExecArray | null;

    while ((match = anchorRegex.exec(html)) !== null) {
      const rawHref = match[1].trim();
      const rawText = match[2].replace(/<[^>]+>/g, "").trim();

      // Skip external, anchors, mailto, tel
      if (
        rawHref.startsWith("http://") ||
        rawHref.startsWith("https://") ||
        rawHref.startsWith("mailto:") ||
        rawHref.startsWith("tel:") ||
        rawHref.startsWith("#") ||
        rawHref.startsWith("javascript:")
      ) {
        continue;
      }

      // Resolve relative href to clean output file path
      const targetNode = this.resolveHrefToNode(rawHref, sourceNode);
      if (targetNode && targetNode.id !== sourceNode.id) {
        const edge: GraphEdge = {
          sourceId: sourceNode.id,
          targetId: targetNode.id,
          anchorText: rawText || targetNode.navLabel || targetNode.title,
          context: "content_body",
        };
        edges.push(edge);
        this.addEdge(edge);
      }
    }

    return edges;
  }

  private resolveHrefToNode(href: string, sourceNode: GraphNode): GraphNode | undefined {
    // Strip query or fragment
    const cleanHref = href.split("?")[0].split("#")[0];
    if (!cleanHref) return undefined;

    // Check exact path match
    const exact = this.nodesByPath.get(cleanHref);
    if (exact) return exact;

    // Clean relative path segments (e.g. "../services/index.html")
    const sourceDirParts = sourceNode.outputFilePath.split("/").slice(0, -1);
    const hrefParts = cleanHref.split("/");

    const resolvedParts = [...sourceDirParts];
    for (const part of hrefParts) {
      if (part === "" || part === ".") continue;
      if (part === "..") {
        resolvedParts.pop();
      } else {
        resolvedParts.push(part);
      }
    }

    const resolvedPath = resolvedParts.join("/");
    const resolvedMatch = this.nodesByPath.get(resolvedPath);
    if (resolvedMatch) return resolvedMatch;

    // Check if it's a folder URL matching index.html
    const asIndex = `${resolvedPath.replace(/\/$/, "")}/index.html`;
    const asIndexMatch = this.nodesByPath.get(asIndex);
    if (asIndexMatch) return asIndexMatch;

    // Check matching by slug
    for (const node of this.nodes.values()) {
      if (cleanHref.includes(node.slug)) {
        return node;
      }
    }

    return undefined;
  }
}

/**
 * Builds an InternalLinkingGraph from a PageRegistry
 */
export function buildGraphFromRegistry(registry: PageRegistry): InternalLinkingGraph {
  const allPages = registry.getAll();
  const graph = new InternalLinkingGraph();

  for (const page of allPages) {
    const node: GraphNode = {
      id: page.id,
      slug: page.outputFilePath.replace(/(\/index)?\.html$/, "").replace(/^\//, "") || "home",
      title: page.title,
      navLabel: page.navLabel,
      pageType: page.pageType,
      outputFilePath: page.outputFilePath,
      parentPageId: page.parentPageId,
      serviceId: page.data?.serviceId,
      locationId: page.data?.locationId,
    };
    graph.addNode(node);
  }

  // Pre-seed parent-child silo hierarchy edges
  for (const page of allPages) {
    if (page.parentPageId && graph.getNode(page.parentPageId)) {
      // Upward link (Child -> Parent, e.g. Breadcrumb or Silo)
      graph.addEdge({
        sourceId: page.id,
        targetId: page.parentPageId,
        anchorText: registry.getById(page.parentPageId)?.navLabel || "Back to Parent",
        context: "silo_parent",
      });

      // Downward link (Parent -> Child, e.g. Hub listing)
      graph.addEdge({
        sourceId: page.parentPageId,
        targetId: page.id,
        anchorText: page.navLabel || page.title,
        context: "silo_child",
      });
    }
  }

  return graph;
}
