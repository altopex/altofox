/**
 * RankLocal Unified Publishing Architecture
 * 
 * Standardized interfaces for multi-provider hosting (Cloudflare, Vercel, Netlify, GitHub).
 * All providers implement the same adapter contract, isolating provider-specific APIs.
 */

export type HostingProviderType = "cloudflare" | "vercel" | "netlify" | "github";

export interface HostingCredentials {
  provider?: HostingProviderType;
  apiToken?: string;
  accountId?: string; // Cloudflare
  teamId?: string; // Vercel
  owner?: string; // GitHub
  repo?: string; // GitHub
  siteId?: string; // Netlify
}

export interface PublishFileInput {
  path: string;
  content: string | Buffer;
  mimeType?: string;
}

export interface PublishRequest {
  provider: HostingProviderType;
  projectName: string;
  projectId?: string;
  files: Array<{ path: string; content: string }>;
  photos?: any[];
  domain?: string;
  credentials?: HostingCredentials;
  customOptions?: {
    branch?: string;
    isPrivate?: boolean;
    destinationMode?: "new" | "existing";
    existingDestinationId?: string;
  };
}

export interface DnsRecordGuidance {
  type: string;
  name: string;
  content?: string;
  target?: string;
  proxied?: boolean;
  ttl?: string | number;
  priority?: number;
  status?: string;
}

export interface PublishResult {
  success: boolean;
  provider: HostingProviderType;
  projectName: string;
  deploymentId?: string;
  deploymentUrl?: string;
  liveUrl?: string;
  subdomain?: string;
  publishedAt: number;
  status: "published" | "building" | "queued" | "failed" | "success";
  commitUrl?: string;
  customDomainStatus?: {
    domain: string;
    status: "none" | "pending" | "active" | "action_required";
    cnameTarget?: string;
    dnsRecords?: DnsRecordGuidance[];
    message?: string;
  };
  error?: string;
}

export interface HostingDestination {
  id: string;
  name: string;
  url?: string;
  subdomain?: string;
  createdAt?: number;
}

export interface IHostingAdapter {
  readonly provider: HostingProviderType;
  testConnection(credentials: HostingCredentials): Promise<{
    success: boolean;
    message: string;
    accountName?: string;
  }>;
  listDestinations?(credentials: HostingCredentials): Promise<HostingDestination[]>;
  publish(request: PublishRequest): Promise<PublishResult>;
  connectDomain?(
    domain: string,
    projectName: string,
    credentials: HostingCredentials
  ): Promise<{
    success: boolean;
    status: "pending" | "active" | "action_required";
    cnameTarget?: string;
    dnsRecords?: DnsRecordGuidance[];
    message?: string;
  }>;
}
