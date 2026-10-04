import {
  IHostingAdapter,
  HostingCredentials,
  PublishRequest,
  PublishResult,
  HostingDestination,
  DnsRecordGuidance,
} from "../types";
import { buildCanonicalWebsiteFiles } from "@/lib/export/canonical-files";
import JSZip from "jszip";
import { getStoredHostingCredentials } from "../credential-store";
import { stripSensitiveTokens } from "../token-sanitizer";

export function sanitizeNetlifyProjectName(name: string): string {
  let clean = (name || "my-website")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (!clean) clean = "ranklocal-site";
  if (clean.length > 50) clean = clean.slice(0, 50);
  return clean;
}

export class NetlifyAdapter implements IHostingAdapter {
  readonly provider = "netlify" as const;

  private getAuthHeaders(apiToken: string) {
    return {
      Authorization: `Bearer ${apiToken.trim()}`,
      "User-Agent": "RankLocal-Publishing",
    };
  }

  async testConnection(credentials: HostingCredentials): Promise<{
    success: boolean;
    message: string;
    accountName?: string;
  }> {
    const creds: HostingCredentials = credentials.apiToken?.trim()
      ? credentials
      : (await getStoredHostingCredentials("netlify")) || { apiToken: "" };
    const token = creds.apiToken?.trim() || process.env.NETLIFY_AUTH_TOKEN || "";
    if (!token) {
      return {
        success: false,
        message: "Netlify Personal Access Token is required. Generate one at https://app.netlify.com/user/applications",
      };
    }

    try {
      const res = await fetch("https://api.netlify.com/api/v1/user", {
        headers: this.getAuthHeaders(token),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return {
          success: false,
          message: err?.message || `Netlify authentication failed (${res.status}): ${res.statusText}`,
        };
      }

      const user = await res.json();
      const accountName = user.full_name || user.email || user.slug || "Netlify User";

      return {
        success: true,
        message: `Connected to Netlify account: ${accountName}`,
        accountName,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || "Failed to reach Netlify API.",
      };
    }
  }

  async listDestinations(credentials: HostingCredentials): Promise<HostingDestination[]> {
    const token = credentials.apiToken?.trim() || process.env.NETLIFY_AUTH_TOKEN || "";
    if (!token) return [];

    try {
      const res = await fetch("https://api.netlify.com/api/v1/sites?filter=all", {
        headers: this.getAuthHeaders(token),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) return [];
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];

      return list.map((s: any) => ({
        id: s.id,
        name: s.name,
        url: s.ssl_url || s.url,
        subdomain: `${s.name}.netlify.app`,
      }));
    } catch {
      return [];
    }
  }

  async publish(request: PublishRequest): Promise<PublishResult> {
    const creds: HostingCredentials = request.credentials?.apiToken?.trim()
      ? request.credentials
      : (await getStoredHostingCredentials("netlify")) || { apiToken: "" };
    const token = creds.apiToken?.trim() || process.env.NETLIFY_AUTH_TOKEN || "";
    if (!token) {
      return {
        success: false,
        provider: "netlify",
        projectName: request.projectName,
        publishedAt: Date.now(),
        status: "failed",
        error: "Netlify Access Token is required. Please provide a token in Settings or Publish options.",
      };
    }

    const cleanProjectName = sanitizeNetlifyProjectName(request.projectName);

    // 1. Build canonical website files
    const canonical = buildCanonicalWebsiteFiles(request.files, {
      projectName: cleanProjectName,
      domain: request.domain,
    });

    try {
      // 2. Build in-memory ZIP package
      const zip = new JSZip();
      for (const f of canonical.files) {
        if (!f?.path) continue;
        const normalized = f.path.replace(/^\/+/, "");
        zip.file(normalized, f.content);
      }

      // Add Netlify redirects file if custom domain or spa handling is present
      zip.file(
        "_redirects",
        "/*    /index.html   200\n"
      );

      const zipBuffer = await zip.generateAsync({
        type: "nodebuffer",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      // 3. Resolve destination site
      let targetSiteId = request.customOptions?.existingDestinationId;
      let targetSubdomain = `${cleanProjectName}.netlify.app`;
      let siteUrl = `https://${targetSubdomain}`;

      if (!targetSiteId) {
        // Check if a site with this name already exists in account
        const existingList = await this.listDestinations({
          provider: "netlify",
          apiToken: token,
        });
        const match = existingList.find((s) => s.name.toLowerCase() === cleanProjectName.toLowerCase());

        if (match) {
          targetSiteId = match.id;
          siteUrl = match.url || siteUrl;
        } else {
          // Create new Netlify site
          const createRes = await fetch("https://api.netlify.com/api/v1/sites", {
            method: "POST",
            headers: {
              ...this.getAuthHeaders(token),
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ name: cleanProjectName }),
            signal: AbortSignal.timeout(15000),
          });

          if (!createRes.ok) {
            // If name is taken, fallback to auto-generated name by Netlify
            const fallbackCreate = await fetch("https://api.netlify.com/api/v1/sites", {
              method: "POST",
              headers: {
                ...this.getAuthHeaders(token),
                "Content-Type": "application/json",
              },
              body: JSON.stringify({}),
              signal: AbortSignal.timeout(15000),
            });

            if (!fallbackCreate.ok) {
              const err = await fallbackCreate.json().catch(() => ({}));
              return {
                success: false,
                provider: "netlify",
                projectName: cleanProjectName,
                publishedAt: Date.now(),
                status: "failed",
                error: err?.message || `Netlify site creation failed (${fallbackCreate.status})`,
              };
            }

            const fallbackData = await fallbackCreate.json();
            targetSiteId = fallbackData.id;
            targetSubdomain = `${fallbackData.name}.netlify.app`;
            siteUrl = fallbackData.ssl_url || fallbackData.url || `https://${targetSubdomain}`;
          } else {
            const siteData = await createRes.json();
            targetSiteId = siteData.id;
            targetSubdomain = `${siteData.name}.netlify.app`;
            siteUrl = siteData.ssl_url || siteData.url || `https://${targetSubdomain}`;
          }
        }
      }

      // 4. Deploy ZIP archive to the Netlify site
      const deployRes = await fetch(`https://api.netlify.com/api/v1/sites/${targetSiteId}/deploys`, {
        method: "POST",
        headers: {
          ...this.getAuthHeaders(token),
          "Content-Type": "application/zip",
        },
        body: new Uint8Array(zipBuffer),
        signal: AbortSignal.timeout(45000),
      });

      if (!deployRes.ok) {
        const err = await deployRes.json().catch(() => ({}));
        return {
          success: false,
          provider: "netlify",
          projectName: cleanProjectName,
          publishedAt: Date.now(),
          status: "failed",
          error: stripSensitiveTokens(err?.message || `Netlify upload failed (${deployRes.status}): ${deployRes.statusText}`),
        };
      }

      const deployData = await deployRes.json();
      if (deployData.state === "error") {
        return {
          success: false,
          provider: "netlify",
          projectName: cleanProjectName,
          deploymentId: deployData.id,
          publishedAt: Date.now(),
          status: "failed",
          error: stripSensitiveTokens(deployData.error_message || "Netlify build reported an error state."),
        };
      }

      const liveUrl = deployData.ssl_url || deployData.url || siteUrl;

      // 5. Connect domain if specified
      let customDomainStatus: PublishResult["customDomainStatus"] = undefined;
      if (request.domain && targetSiteId) {
        const domRes = await this.connectDomain(request.domain, targetSiteId, {
          provider: "netlify",
          apiToken: token,
          siteId: targetSiteId,
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
        provider: "netlify",
        projectName: cleanProjectName,
        deploymentId: deployData.id,
        deploymentUrl: liveUrl,
        liveUrl,
        subdomain: targetSubdomain,
        publishedAt: Date.now(),
        status: deployData.state === "ready" ? "published" : "building",
        customDomainStatus,
      };
    } catch (err: any) {
      return {
        success: false,
        provider: "netlify",
        projectName: cleanProjectName,
        publishedAt: Date.now(),
        status: "failed",
        error: stripSensitiveTokens(err?.message || "Failed to publish to Netlify."),
      };
    }
  }

  async connectDomain(
    domain: string,
    siteIdOrName: string,
    credentials: HostingCredentials
  ) {
    const token = credentials.apiToken?.trim() || process.env.NETLIFY_AUTH_TOKEN || "";
    const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");

    const dnsRecords: DnsRecordGuidance[] = [
      {
        type: "CNAME",
        name: cleanDomain.startsWith("www.") ? "www" : cleanDomain,
        content: "apex-loadbalancer.netlify.com",
        ttl: "Auto",
        status: "required",
      },
    ];

    if (!token) {
      return {
        success: false,
        status: "action_required" as const,
        cnameTarget: "apex-loadbalancer.netlify.com",
        dnsRecords,
        message: "No Netlify token provided.",
      };
    }

    try {
      const siteId = credentials.siteId || siteIdOrName;
      const res = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
        method: "PUT",
        headers: {
          ...this.getAuthHeaders(token),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ custom_domain: cleanDomain }),
        signal: AbortSignal.timeout(15000),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return {
          success: true,
          status: "pending" as const,
          cnameTarget: "apex-loadbalancer.netlify.com",
          dnsRecords,
          message: `Domain ${cleanDomain} connected to Netlify site. Add the CNAME record in your DNS provider.`,
        };
      }

      return {
        success: false,
        status: "action_required" as const,
        cnameTarget: "apex-loadbalancer.netlify.com",
        dnsRecords,
        message: data?.message || "Could not register domain on Netlify.",
      };
    } catch (err: any) {
      return {
        success: false,
        status: "action_required" as const,
        cnameTarget: "apex-loadbalancer.netlify.com",
        dnsRecords,
        message: err?.message || "Netlify domain connection error.",
      };
    }
  }
}
