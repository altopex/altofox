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

export function sanitizeGithubRepoName(name: string): string {
  let clean = (name || "my-website")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (!clean) clean = "ranklocal-site";
  if (clean.length > 50) clean = clean.slice(0, 50);
  return clean;
}

export class GithubAdapter implements IHostingAdapter {
  readonly provider = "github" as const;

  private getAuthHeaders(apiToken: string) {
    return {
      Authorization: `Bearer ${apiToken.trim()}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "RankLocal-Publisher",
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
      : (await getStoredHostingCredentials("github")) || { apiToken: "" };
    const token = creds.apiToken?.trim() || process.env.GITHUB_TOKEN || "";
    if (!token) {
      return {
        success: false,
        message: "GitHub Personal Access Token is required. Generate one at https://github.com/settings/tokens (needs repo scope)",
      };
    }

    try {
      const res = await fetch("https://api.github.com/user", {
        headers: this.getAuthHeaders(token),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return {
          success: false,
          message: err?.message || `GitHub authentication failed (${res.status}): ${res.statusText}`,
        };
      }

      const user = await res.json();
      const accountName = user.login || user.name || "GitHub User";

      return {
        success: true,
        message: `Connected to GitHub user: ${accountName}`,
        accountName,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || "Failed to reach GitHub API.",
      };
    }
  }

  async listDestinations(credentials: HostingCredentials): Promise<HostingDestination[]> {
    const token = credentials.apiToken?.trim() || process.env.GITHUB_TOKEN || "";
    if (!token) return [];

    try {
      const res = await fetch("https://api.github.com/user/repos?type=owner&sort=updated&per_page=30", {
        headers: this.getAuthHeaders(token),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) return [];
      const list = await res.json();
      if (!Array.isArray(list)) return [];

      return list.map((r: any) => ({
        id: r.name,
        name: r.name,
        url: r.html_url,
        subdomain: `${r.owner?.login || "user"}.github.io/${r.name}`,
      }));
    } catch {
      return [];
    }
  }

  async publish(request: PublishRequest): Promise<PublishResult> {
    const creds: HostingCredentials = request.credentials?.apiToken?.trim()
      ? request.credentials
      : (await getStoredHostingCredentials("github")) || { apiToken: "" };
    const token = creds.apiToken?.trim() || process.env.GITHUB_TOKEN || "";
    if (!token) {
      return {
        success: false,
        provider: "github",
        projectName: request.projectName,
        publishedAt: Date.now(),
        status: "failed",
        error: "GitHub Personal Access Token is required. Please provide a token in Settings or Publish options.",
      };
    }

    const cleanRepoName = sanitizeGithubRepoName(request.projectName);

    try {
      // 1. Resolve GitHub username
      let owner = request.credentials?.owner?.trim();
      if (!owner) {
        const userRes = await fetch("https://api.github.com/user", {
          headers: this.getAuthHeaders(token),
          signal: AbortSignal.timeout(10000),
        });
        if (!userRes.ok) {
          throw new Error("Invalid GitHub token or user could not be authenticated.");
        }
        const user = await userRes.json();
        owner = user.login;
      }

      // 2. Ensure repository exists or create new
      const repoCheck = await fetch(`https://api.github.com/repos/${owner}/${cleanRepoName}`, {
        headers: this.getAuthHeaders(token),
        signal: AbortSignal.timeout(10000),
      });

      if (!repoCheck.ok) {
        // Create new repository
        const createRes = await fetch("https://api.github.com/user/repos", {
          method: "POST",
          headers: this.getAuthHeaders(token),
          body: JSON.stringify({
            name: cleanRepoName,
            description: "Static website generated with RankLocal",
            private: Boolean(request.customOptions?.isPrivate),
            auto_init: true,
          }),
          signal: AbortSignal.timeout(15000),
        });

        if (!createRes.ok) {
          const err = await createRes.json().catch(() => ({}));
          throw new Error(err?.message || `Failed to create GitHub repo "${cleanRepoName}".`);
        }

        // Wait brief moment for repo initialization
        await new Promise((r) => setTimeout(r, 1500));
      }

      // 3. Build canonical files
      const canonical = buildCanonicalWebsiteFiles(request.files, {
        projectName: cleanRepoName,
        domain: request.domain,
      });

      // 4. Create blobs in Git Data API
      const treeEntries: Array<{ path: string; mode: string; type: string; sha: string }> = [];

      for (const file of canonical.files) {
        if (!file?.path) continue;
        const normalized = file.path.replace(/^\/+/, "");
        const base64Content = Buffer.from(file.content).toString("base64");

        const blobRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepoName}/git/blobs`, {
          method: "POST",
          headers: this.getAuthHeaders(token),
          body: JSON.stringify({
            content: base64Content,
            encoding: "base64",
          }),
          signal: AbortSignal.timeout(10000),
        });

        if (blobRes.ok) {
          const blobData = await blobRes.json();
          treeEntries.push({
            path: normalized,
            mode: "100644",
            type: "blob",
            sha: blobData.sha,
          });
        }
      }

      if (treeEntries.length === 0) {
        throw new Error("No files could be committed to the repository.");
      }

      // 5. Get latest commit SHA on main
      let latestCommitSha: string | null = null;
      let branchName = request.customOptions?.branch || "main";

      const refRes = await fetch(
        `https://api.github.com/repos/${owner}/${cleanRepoName}/git/refs/heads/${branchName}`,
        {
          headers: this.getAuthHeaders(token),
          signal: AbortSignal.timeout(10000),
        }
      );

      if (refRes.ok) {
        const refData = await refRes.json();
        latestCommitSha = refData.object?.sha;
      }

      // 6. Create Git tree
      const treePayload: any = { tree: treeEntries };
      if (latestCommitSha) {
        treePayload.base_tree = latestCommitSha;
      }

      const createTreeRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepoName}/git/trees`, {
        method: "POST",
        headers: this.getAuthHeaders(token),
        body: JSON.stringify(treePayload),
        signal: AbortSignal.timeout(15000),
      });

      if (!createTreeRes.ok) {
        const err = await createTreeRes.json().catch(() => ({}));
        throw new Error(err?.message || "Failed to create Git tree.");
      }

      const newTreeData = await createTreeRes.json();

      // 7. Create commit
      const commitPayload: any = {
        message: "Publish website from RankLocal",
        tree: newTreeData.sha,
        parents: latestCommitSha ? [latestCommitSha] : [],
      };

      const createCommitRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepoName}/git/commits`, {
        method: "POST",
        headers: this.getAuthHeaders(token),
        body: JSON.stringify(commitPayload),
        signal: AbortSignal.timeout(15000),
      });

      if (!createCommitRes.ok) {
        const err = await createCommitRes.json().catch(() => ({}));
        throw new Error(err?.message || "Failed to create Git commit.");
      }

      const newCommit = await createCommitRes.json();
      const commitSha = newCommit.sha;
      const commitUrl = `https://github.com/${owner}/${cleanRepoName}/commit/${commitSha}`;

      // 8. Update ref (or create if repo was brand new)
      if (latestCommitSha) {
        await fetch(`https://api.github.com/repos/${owner}/${cleanRepoName}/git/refs/heads/${branchName}`, {
          method: "PATCH",
          headers: this.getAuthHeaders(token),
          body: JSON.stringify({ sha: commitSha, force: true }),
        });
      } else {
        await fetch(`https://api.github.com/repos/${owner}/${cleanRepoName}/git/refs`, {
          method: "POST",
          headers: this.getAuthHeaders(token),
          body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: commitSha }),
        });
      }

      const resolvedOwner = owner || "user";

      // 9. Check or Enable GitHub Pages
      let pagesUrl = `https://${resolvedOwner.toLowerCase()}.github.io/${cleanRepoName}/`;
      let pagesStatus: "published" | "building" = "building";

      try {
        const pagesRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepoName}/pages`, {
          headers: this.getAuthHeaders(token),
        });

        if (pagesRes.ok) {
          const pagesData = await pagesRes.json();
          pagesUrl = pagesData.html_url || pagesUrl;
          if (pagesData.status === "built") {
            pagesStatus = "published";
          }
        } else {
          // Attempt to enable Pages
          const enableRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepoName}/pages`, {
            method: "POST",
            headers: this.getAuthHeaders(token),
            body: JSON.stringify({
              source: { branch: branchName, path: "/" },
            }),
          });
          if (enableRes.ok) {
            const enabledData = await enableRes.json();
            pagesUrl = enabledData.html_url || pagesUrl;
          }
        }
      } catch {}

      // 10. Handle Custom Domain on GitHub Pages if specified
      let customDomainStatus: PublishResult["customDomainStatus"] = undefined;
      if (request.domain) {
        const domRes = await this.connectDomain(request.domain, cleanRepoName, {
          provider: "github",
          apiToken: token,
          owner,
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
        provider: "github",
        projectName: cleanRepoName,
        deploymentId: commitSha,
        liveUrl: pagesUrl,
        subdomain: `${resolvedOwner.toLowerCase()}.github.io/${cleanRepoName}`,
        commitUrl,
        publishedAt: Date.now(),
        status: pagesStatus,
        customDomainStatus,
      };
    } catch (err: any) {
      return {
        success: false,
        provider: "github",
        projectName: cleanRepoName,
        publishedAt: Date.now(),
        status: "failed",
        error: err?.message || "Failed to publish to GitHub.",
      };
    }
  }

  async connectDomain(
    domain: string,
    projectName: string,
    credentials: HostingCredentials
  ) {
    const token = credentials.apiToken?.trim() || process.env.GITHUB_TOKEN || "";
    const owner = credentials.owner?.trim();
    const cleanRepoName = sanitizeGithubRepoName(projectName);
    const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");

    const cnameTarget = `${owner ? owner.toLowerCase() : "user"}.github.io`;
    const dnsRecords: DnsRecordGuidance[] = [
      {
        type: "CNAME",
        name: cleanDomain.startsWith("www.") ? "www" : cleanDomain,
        content: cnameTarget,
        ttl: "Auto",
        status: "required",
      },
    ];

    if (!token || !owner) {
      return {
        success: false,
        status: "action_required" as const,
        cnameTarget,
        dnsRecords,
        message: "GitHub credentials incomplete.",
      };
    }

    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${cleanRepoName}/pages`, {
        method: "PUT",
        headers: this.getAuthHeaders(token),
        body: JSON.stringify({ cname: cleanDomain }),
        signal: AbortSignal.timeout(15000),
      });

      if (res.ok) {
        return {
          success: true,
          status: "pending" as const,
          cnameTarget,
          dnsRecords,
          message: `Custom domain ${cleanDomain} configured on GitHub Pages. Point CNAME to ${cnameTarget}.`,
        };
      }

      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        status: "action_required" as const,
        cnameTarget,
        dnsRecords,
        message: err?.message || "Could not set custom domain on GitHub Pages.",
      };
    } catch (err: any) {
      return {
        success: false,
        status: "action_required" as const,
        cnameTarget,
        dnsRecords,
        message: err?.message || "GitHub domain connection error.",
      };
    }
  }
}
