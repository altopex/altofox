import {
  IHostingAdapter,
  HostingCredentials,
  PublishRequest,
  PublishResult,
  HostingDestination,
} from "../types";
import {
  getCloudflareCredentials,
  verifyCloudflareConnection,
  listPagesProjects,
  deployToCloudflarePages,
  addCustomDomain,
  verifyCustomDomain,
  sanitizePagesProjectName,
  PublishFileInput,
} from "@/lib/cloudflare/cloudflare-service";
import { buildCanonicalWebsiteFiles } from "@/lib/export/canonical-files";

export class CloudflareAdapter implements IHostingAdapter {
  readonly provider = "cloudflare" as const;

  async testConnection(credentials: HostingCredentials): Promise<{
    success: boolean;
    message: string;
    accountName?: string;
  }> {
    let apiToken = credentials.apiToken?.trim();
    let accountId = credentials.accountId?.trim();

    if (!apiToken || !accountId) {
      const stored = await getCloudflareCredentials();
      if (stored) {
        apiToken = stored.apiToken;
        accountId = stored.accountId;
      }
    }

    if (!apiToken || !accountId) {
      return {
        success: false,
        message: "Cloudflare API Token and Account ID are required.",
      };
    }

    const verification = await verifyCloudflareConnection(apiToken, accountId);
    if (!verification.valid) {
      return {
        success: false,
        message: verification.error || "Cloudflare authentication failed.",
      };
    }

    return {
      success: true,
      message: `Connected to Cloudflare account: ${verification.accountName || accountId}`,
      accountName: verification.accountName || accountId,
    };
  }

  async listDestinations(credentials: HostingCredentials): Promise<HostingDestination[]> {
    try {
      const projects = await listPagesProjects();
      return projects.map((p) => ({
        id: p.name,
        name: p.name,
        subdomain: p.subdomain,
        url: `https://${p.subdomain}`,
      }));
    } catch {
      return [];
    }
  }

  async publish(request: PublishRequest): Promise<PublishResult> {
    const cleanProjectName = sanitizePagesProjectName(request.projectName);

    // Build canonical files
    const canonical = buildCanonicalWebsiteFiles(request.files, {
      projectName: cleanProjectName,
      domain: request.domain,
    });

    const deployFiles: PublishFileInput[] = canonical.files.map((f) => ({
      path: f.path.replace(/^\/+/, ""),
      content: f.content,
    }));

    const result = await deployToCloudflarePages({
      projectName: cleanProjectName,
      files: deployFiles,
      branch: request.customOptions?.branch || "main",
    });

    if (!result.success) {
      return {
        success: false,
        provider: "cloudflare",
        projectName: cleanProjectName,
        publishedAt: Date.now(),
        status: "failed",
        error: (result as any).error || (result as any).message || "Cloudflare deployment failed.",
      };
    }

    let customDomainStatus: PublishResult["customDomainStatus"] = undefined;
    if (request.domain) {
      const domResult = await this.connectDomain(request.domain, cleanProjectName, request.credentials || { provider: "cloudflare" });
      customDomainStatus = {
        domain: request.domain,
        status: domResult.status,
        cnameTarget: domResult.cnameTarget,
        dnsRecords: domResult.dnsRecords,
        message: domResult.message,
      };
    }

    return {
      success: true,
      provider: "cloudflare",
      projectName: cleanProjectName,
      deploymentId: result.deploymentId,
      liveUrl: result.liveUrl,
      subdomain: result.subdomain,
      publishedAt: result.publishedAt || Date.now(),
      status: "published",
      customDomainStatus,
    };
  }

  async connectDomain(domain: string, projectName: string, credentials: HostingCredentials): Promise<{
    success: boolean;
    status: "active" | "pending" | "action_required";
    cnameTarget?: string;
    dnsRecords?: any[];
    message?: string;
  }> {
    const cleanProjectName = sanitizePagesProjectName(projectName);
    const res = await addCustomDomain({ projectName: cleanProjectName, domain });
    const targetHost = `${cleanProjectName}.pages.dev`;
    const normalizedStatus: "active" | "pending" | "action_required" =
      res.status === "active" ? "active" : res.status === "pending" ? "pending" : "action_required";

    return {
      success: res.success,
      status: normalizedStatus,
      cnameTarget: targetHost,
      dnsRecords: res.dnsRecords,
      message: res.message,
    };
  }
}
