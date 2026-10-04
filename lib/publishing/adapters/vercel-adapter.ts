import {
  IHostingAdapter,
  HostingCredentials,
  PublishRequest,
  PublishResult,
  HostingDestination,
  DnsRecordGuidance,
} from "../types";
import { buildCanonicalWebsiteFiles } from "@/lib/export/canonical-files";

import { getStoredHostingCredentials } from "../credential-store";
import { stripSensitiveTokens } from "../token-sanitizer";

export function sanitizeVercelProjectName(name: string): string {
  let clean = (name || "my-website")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (!clean) clean = "ranklocal-site";
  if (clean.length > 50) clean = clean.slice(0, 50);
  return clean;
}

export class VercelAdapter implements IHostingAdapter {
  readonly provider = "vercel" as const;

  private getAuthHeaders(apiToken: string) {
    return {
      Authorization: `Bearer ${apiToken.trim()}`,
      "Content-Type": "application/json",
    };
  }

  async testConnection(credentials: HostingCredentials): Promise<{
    success: boolean;
    message: string;
    accountName?: string;
  }> {
    const creds: HostingCredentials = credentials.apiToken?.trim()
      ? credentials
      : (await getStoredHostingCredentials("vercel")) || { apiToken: "" };
    const token = creds.apiToken?.trim() || process.env.VERCEL_API_TOKEN || "";
    if (!token) {
      return {
        success: false,
        message: "Vercel API token is required. Create one at https://vercel.com/account/tokens",
      };
    }

    try {
      const res = await fetch("https://api.vercel.com/v2/user", {
        headers: this.getAuthHeaders(token),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return {
          success: false,
          message: err?.error?.message || `Vercel authentication failed (${res.status}): ${res.statusText}`,
        };
      }

      const data = await res.json();
      const user = data.user || data;
      const accountName = user.username || user.name || user.email || "Vercel User";

      return {
        success: true,
        message: `Connected to Vercel account: ${accountName}`,
        accountName,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || "Failed to reach Vercel API.",
      };
    }
  }

  async listDestinations(credentials: HostingCredentials): Promise<HostingDestination[]> {
    const token = credentials.apiToken?.trim() || process.env.VERCEL_API_TOKEN || "";
    if (!token) return [];

    try {
      const res = await fetch("https://api.vercel.com/v9/projects?limit=50", {
        headers: this.getAuthHeaders(token),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) return [];
      const data = await res.json();
      const list = Array.isArray(data.projects) ? data.projects : [];

      return list.map((p: any) => ({
        id: p.id || p.name,
        name: p.name,
        url: p.targets?.production?.url ? `https://${p.targets.production.url}` : `https://${p.name}.vercel.app`,
        subdomain: `${p.name}.vercel.app`,
      }));
    } catch {
      return [];
    }
  }

  async publish(request: PublishRequest): Promise<PublishResult> {
    const creds: HostingCredentials = request.credentials?.apiToken?.trim()
      ? request.credentials
      : (await getStoredHostingCredentials("vercel")) || { apiToken: "" };
    const token = creds.apiToken?.trim() || process.env.VERCEL_API_TOKEN || "";
    if (!token) {
      return {
        success: false,
        provider: "vercel",
        projectName: request.projectName,
        publishedAt: Date.now(),
        status: "failed",
        error: "Vercel API token is required. Please provide a token in Settings or Publish options.",
      };
    }

    const cleanProjectName = sanitizeVercelProjectName(request.projectName);

    // 1. Build canonical website files
    const canonical = buildCanonicalWebsiteFiles(request.files, {
      projectName: cleanProjectName,
      domain: request.domain,
    });

    const vercelFiles = canonical.files.map((f) => ({
      file: f.path.replace(/^\/+/, ""),
      data: f.content,
      encoding: "utf-8",
    }));

    try {
      // 2. Create or deploy via Vercel Deployments API
      const deployRes = await fetch("https://api.vercel.com/v13/deployments", {
        method: "POST",
        headers: this.getAuthHeaders(token),
        body: JSON.stringify({
          name: cleanProjectName,
          project: cleanProjectName,
          target: "production",
          files: vercelFiles,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!deployRes.ok) {
        const err = await deployRes.json().catch(() => ({}));
        return {
          success: false,
          provider: "vercel",
          projectName: cleanProjectName,
          publishedAt: Date.now(),
          status: "failed",
          error: stripSensitiveTokens(err?.error?.message || `Vercel deployment failed (${deployRes.status}): ${deployRes.statusText}`),
        };
      }

      const deployData = await deployRes.json();
      const deploymentId = deployData.id;

      if (deployData.readyState === "ERROR") {
        return {
          success: false,
          provider: "vercel",
          projectName: cleanProjectName,
          deploymentId,
          publishedAt: Date.now(),
          status: "failed",
          error: stripSensitiveTokens(deployData.error?.message || "Vercel build reported an error state."),
        };
      }

      const targetSubdomain = `${cleanProjectName}.vercel.app`;
      const liveUrl = deployData.targets?.production?.url
        ? `https://${deployData.targets.production.url}`
        : `https://${targetSubdomain}`;
      const deploymentUrl = deployData.url ? `https://${deployData.url}` : liveUrl;

      // 3. Connect custom domain if specified
      let customDomainStatus: PublishResult["customDomainStatus"] = undefined;
      if (request.domain) {
        const domRes = await this.connectDomain(request.domain, cleanProjectName, {
          provider: "vercel",
          apiToken: token,
        });
        customDomainStatus = {
          domain: request.domain,
          status: domRes.status,
          cnameTarget: domRes.cnameTarget,
          dnsRecords: domRes.dnsRecords,
          message: domRes.message,
        };
      }

      return {
        success: true,
        provider: "vercel",
        projectName: cleanProjectName,
        deploymentId,
        deploymentUrl,
        liveUrl,
        subdomain: targetSubdomain,
        publishedAt: Date.now(),
        status: deployData.readyState === "READY" ? "published" : "building",
        customDomainStatus,
      };
    } catch (err: any) {
      return {
        success: false,
        provider: "vercel",
        projectName: cleanProjectName,
        publishedAt: Date.now(),
        status: "failed",
        error: stripSensitiveTokens(err?.message || "Failed to publish to Vercel."),
      };
    }
  }

  async connectDomain(
    domain: string,
    projectName: string,
    credentials: HostingCredentials
  ) {
    const token = credentials.apiToken?.trim() || process.env.VERCEL_API_TOKEN || "";
    const cleanProjectName = sanitizeVercelProjectName(projectName);
    const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");

    const dnsRecords: DnsRecordGuidance[] = [
      {
        type: "CNAME",
        name: cleanDomain.startsWith("www.") ? "www" : cleanDomain,
        content: "cname.vercel-dns.com",
        ttl: "Auto",
        status: "required",
      },
    ];

    if (!token) {
      return {
        success: false,
        status: "action_required" as const,
        cnameTarget: "cname.vercel-dns.com",
        dnsRecords,
        message: "No Vercel API token provided.",
      };
    }

    try {
      const res = await fetch(`https://api.vercel.com/v9/projects/${cleanProjectName}/domains`, {
        method: "POST",
        headers: this.getAuthHeaders(token),
        body: JSON.stringify({ name: cleanDomain }),
        signal: AbortSignal.timeout(15000),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok || data.name) {
        return {
          success: true,
          status: "pending" as const,
          cnameTarget: "cname.vercel-dns.com",
          dnsRecords,
          message: `Domain ${cleanDomain} added to Vercel project ${cleanProjectName}. Add the CNAME record in your DNS settings.`,
        };
      }

      return {
        success: false,
        status: "action_required" as const,
        cnameTarget: "cname.vercel-dns.com",
        dnsRecords,
        message: data?.error?.message || "Could not register domain on Vercel.",
      };
    } catch (err: any) {
      return {
        success: false,
        status: "action_required" as const,
        cnameTarget: "cname.vercel-dns.com",
        dnsRecords,
        message: err?.message || "Vercel domain connection error.",
      };
    }
  }
}
