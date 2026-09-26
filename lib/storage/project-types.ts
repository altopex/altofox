import { SiteInfoJSON, SiteContentJSON } from "../generator/content-schema";
import { CustomContentBlock, GlobalBusinessDetails } from "../tools/custom-content";
import { Theme } from "../themes";
import { BlogPostData } from "../blog/blog-engine";

export interface ProjectKeywordItem {
  pagePath: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  seoScore?: number;
}

export interface ProjectChangeLogEntry {
  id: string;
  timestamp: number;
  dateStr: string;
  summary: string;
  affectedPages: string[];
  note?: string;
}

export interface URLRedirect {
  oldUrl: string;
  newUrl: string;
  code: 301 | 302;
  createdAt: number;
}

export interface PageMetricSnapshot {
  pagePath: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface AppliedPageOptimization {
  pagePath: string;
  targetQuery?: string;
  previousPosition?: number;
  impressions?: number;
  summary: string;
  appliedAt: number;
  seoScoreBefore?: number;
  seoScoreAfter?: number;
}

export interface OptimizationCycle {
  id: string;
  cycleNumber: number;
  date: string; // ISO date string e.g. "2026-10-20"
  dateStr: string; // Formatted date e.g. "Oct 20, 2026"
  dateRange: string; // User entered, e.g. "Last 28 days, ending Oct 20"
  timestamp: number;
  notes?: string;
  siteMetrics: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  };
  pageMetrics: PageMetricSnapshot[];
  pagesChanged: string[];
  appliedOptimizations: AppliedPageOptimization[];
  pageScores?: Record<string, number>;
}

export interface SavedProject {
  id: string; // unique project id
  name: string; // e.g. "Lone Star Plumbing"
  createdAt: number;
  lastEditedAt: number;
  lastDownloadedAt?: number;
  thumbnail?: string;

  // Global settings & data
  formData: any; // All wizard input state
  theme: Theme;
  nicheId: string;
  schemaType: string;
  businessDetails: GlobalBusinessDetails;

  // Selected Service Areas
  serviceAreaCities: {
    city: string;
    stateId: string;
    county: string;
    lat: number;
    lng: number;
    population?: number;
    slug?: string;
    distanceOffset?: string;
    localNotes?: string;
  }[];

  // Keywords
  keywordMap: ProjectKeywordItem[];

  // Custom Blocks & Must-Include Text
  customBlocks: CustomContentBlock[];
  mustIncludeText?: string;

  // Content JSON per page (key = file path e.g. "index.html")
  pageContentMap: Record<string, any>;

  // Blog posts
  blogPosts?: BlogPostData[];

  // Generated Files (path -> content)
  files: { path: string; content: string; mimeType?: string; size?: number; lastModified?: number }[];

  // Change History & Redirects
  changeLog: ProjectChangeLogEntry[];
  redirects: URLRedirect[];

  // Monthly Optimization Cycles
  optimizationCycles?: OptimizationCycle[];

  // Rank & Rent Configuration & Leads
  rankRentConfig?: RankRentConfig;
  leads?: CapturedLead[];
}

export type RankRentStatus = "available" | "rented" | "prospecting" | "paused";

export interface CapturedLead {
  id: string;
  timestamp: number;
  dateStr: string;
  name: string;
  phone: string;
  email?: string;
  service?: string;
  message?: string;
  sourcePage?: string;
  deliveredTo?: string;
  status: "delivered" | "failed" | "pending";
}

export interface RankRentConfig {
  enabled: boolean;
  status: RankRentStatus;
  monthlyRent: number;
  currency?: string;
  leaseStartDate?: string;
  leaseRenewalDate?: string;
  billingInterval?: "monthly" | "quarterly" | "yearly";

  // Tenant / Client Info
  clientName?: string;
  clientContact?: string;
  clientEmail?: string;
  clientPhone?: string;
  trackingPhone?: string;

  // Lead Forwarding
  leadForwardEmail?: string;
  leadWebhookUrl?: string;
  leadDeliveryMethod?: "webhook" | "email" | "both" | "api";

  // "Rent This Site" Prospect Banner (for available sites)
  showProspectBanner?: boolean;
  prospectBannerText?: string;
  prospectContactPhone?: string;
  prospectContactEmail?: string;

  notes?: string;
}
