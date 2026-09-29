/**
 * RankLocal Centralized Hosting & Publishing Service
 * 
 * Flow:
 * Website Workspace -> publishWebsite({ provider, files, project, configuration })
 *   -> Adapter Registry
 *   -> [Cloudflare | Vercel | Netlify | GitHub]
 *   -> Verified Result & Telemetry
 */

import {
  HostingProviderType,
  HostingCredentials,
  PublishRequest,
  PublishResult,
  HostingDestination,
  IHostingAdapter,
} from "./types";
import { CloudflareAdapter } from "./adapters/cloudflare-adapter";
import { VercelAdapter } from "./adapters/vercel-adapter";
import { NetlifyAdapter } from "./adapters/netlify-adapter";
import { GithubAdapter } from "./adapters/github-adapter";

const adapters: Record<HostingProviderType, IHostingAdapter> = {
  cloudflare: new CloudflareAdapter(),
  vercel: new VercelAdapter(),
  netlify: new NetlifyAdapter(),
  github: new GithubAdapter(),
};

export function getHostingAdapter(provider: HostingProviderType): IHostingAdapter {
  const adapter = adapters[provider];
  if (!adapter) {
    throw new Error(`Unsupported hosting provider "${provider}". Supported: cloudflare, vercel, netlify, github.`);
  }
  return adapter;
}

export async function publishWebsite(request: PublishRequest): Promise<PublishResult> {
  const adapter = getHostingAdapter(request.provider);
  return await adapter.publish(request);
}

export async function testHostingConnection(
  provider: HostingProviderType,
  credentials: HostingCredentials
): Promise<{ success: boolean; message: string; accountName?: string }> {
  const adapter = getHostingAdapter(provider);
  return await adapter.testConnection(credentials);
}

export async function listHostingDestinations(
  provider: HostingProviderType,
  credentials: HostingCredentials
): Promise<HostingDestination[]> {
  const adapter = getHostingAdapter(provider);
  if (!adapter.listDestinations) return [];
  return await adapter.listDestinations(credentials);
}

export async function connectHostingDomain(
  provider: HostingProviderType,
  domain: string,
  projectName: string,
  credentials: HostingCredentials
) {
  const adapter = getHostingAdapter(provider);
  if (!adapter.connectDomain) {
    return {
      success: false,
      status: "action_required" as const,
      message: `Domain connection not directly supported for ${provider}.`,
    };
  }
  return await adapter.connectDomain(domain, projectName, credentials);
}

export * from "./types";
