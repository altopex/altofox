import { db } from "../db";
import { encryptApiKey, decryptApiKey, maskApiKey } from "../ai/encryption";
import fs from "fs";
import path from "path";
import os from "os";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface CloudflareCredentials {
  apiToken: string;
  accountId: string;
  accountName?: string;
  source: "database" | "environment";
}

export interface CloudflareStatus {
  connected: boolean;
  accountId?: string;
  accountName?: string;
  maskedToken?: string;
  source?: "database" | "environment";
  error?: string;
}

/**
 * Sanitizes project name to conform to Cloudflare Pages naming rules:
 * lowercase alphanumeric and hyphens, 1-63 chars, cannot start or end with hyphen.
 */
export function sanitizePagesProjectName(name: string): string {
  let clean = name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!clean) clean = "ranklocal-site";
  if (clean.length > 58) clean = clean.slice(0, 58);
  return clean;
}

/**
 * Retrieves Cloudflare credentials from database (encrypted) or environment variables.
 */
export async function getCloudflareCredentials(): Promise<CloudflareCredentials | null> {
  // 1. Check SQLite Database for stored Cloudflare key
  try {
    const record = await db.apiKey.findUnique({
      where: { provider: "cloudflare" },
    });

    if (record) {
      const decrypted = decryptApiKey({
        encryptedKey: record.encryptedKey,
        iv: record.iv,
        tag: record.tag,
      });

      if (decrypted && decrypted.trim() && record.organizationId) {
        return {
          apiToken: decrypted.trim(),
          accountId: record.organizationId.trim(),
          accountName: record.providerName || undefined,
          source: "database",
        };
      }
    }
  } catch (err) {
    console.warn("[CloudflareService] DB lookup warning:", err);
  }

  // 2. Check environment variables
  const envToken = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN;
  const envAccount = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID;

  if (envToken && envToken.trim() && envAccount && envAccount.trim()) {
    return {
      apiToken: envToken.trim(),
      accountId: envAccount.trim(),
      accountName: process.env.CLOUDFLARE_ACCOUNT_NAME || "Environment Account",
      source: "environment",
    };
  }

  return null;
}

/**
 * Saves Cloudflare credentials securely to the database (AES-256 encrypted).
 */
export async function saveCloudflareCredentials(
  apiToken: string,
  accountId: string,
  accountName?: string
): Promise<void> {
  if (!apiToken || !apiToken.trim()) {
    throw new Error("Cloudflare API Token is required.");
  }
  if (!accountId || !accountId.trim()) {
    throw new Error("Cloudflare Account ID is required.");
  }

  const cleanToken = apiToken.trim();
  const cleanAccount = accountId.trim();
  const encrypted = encryptApiKey(cleanToken);

  await db.apiKey.upsert({
    where: { provider: "cloudflare" },
    update: {
      encryptedKey: encrypted.encryptedKey,
      iv: encrypted.iv,
      tag: encrypted.tag,
      organizationId: cleanAccount,
      providerName: accountName?.trim() || null,
      updatedAt: new Date(),
    },
    create: {
      id: "cf-" + Date.now(),
      provider: "cloudflare",
      encryptedKey: encrypted.encryptedKey,
      iv: encrypted.iv,
      tag: encrypted.tag,
      organizationId: cleanAccount,
      providerName: accountName?.trim() || null,
      updatedAt: new Date(),
    },
  });
}

/**
 * Tests connection with Cloudflare by verifying token and checking account access.
 */
export async function verifyCloudflareConnection(
  directToken?: string,
  directAccountId?: string
): Promise<{ valid: boolean; accountName?: string; accountId?: string; error?: string }> {
  let token = directToken?.trim();
  let accountId = directAccountId?.trim();

  if (!token || !accountId) {
    const creds = await getCloudflareCredentials();
    if (!creds) {
      return { valid: false, error: "No Cloudflare credentials configured." };
    }
    token = creds.apiToken;
    accountId = creds.accountId;
  }

  try {
    // 1. Verify Token
    const verifyRes = await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const verifyData = await verifyRes.json();
    if (!verifyRes.ok || !verifyData.success) {
      const msg = verifyData.errors?.[0]?.message || "Invalid Cloudflare API Token.";
      return { valid: false, error: msg };
    }

    // 2. Verify Account Access
    const accountRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const accountData = await accountRes.json();
    if (!accountRes.ok || !accountData.success) {
      const msg =
        accountData.errors?.[0]?.message ||
        `Cannot access account ID "${accountId}". Ensure token has Account and Pages permissions.`;
      return { valid: false, error: msg };
    }

    const accountName = accountData.result?.name || "Connected Cloudflare Account";
    return { valid: true, accountName, accountId };
  } catch (err: any) {
    return { valid: false, error: err.message || "Network error connecting to Cloudflare API." };
  }
}

/**
 * Gets overall status for frontend UI display.
 */
export async function getCloudflareStatus(): Promise<CloudflareStatus> {
  const creds = await getCloudflareCredentials();
  if (!creds) {
    return { connected: false };
  }

  const check = await verifyCloudflareConnection(creds.apiToken, creds.accountId);
  return {
    connected: check.valid,
    accountId: creds.accountId,
    accountName: check.accountName || creds.accountName,
    maskedToken: maskApiKey(creds.apiToken),
    source: creds.source,
    error: check.error,
  };
}

/**
 * Lists all existing Cloudflare Pages projects in the connected account.
 */
export async function listPagesProjects(): Promise<Array<{ name: string; subdomain: string; createdOn?: string }>> {
  const creds = await getCloudflareCredentials();
  if (!creds) {
    return [];
  }

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${creds.accountId}/pages/projects`,
      {
        headers: {
          Authorization: `Bearer ${creds.apiToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await res.json();
    if (!res.ok || !data.success) {
      return [];
    }

    return (data.result || []).map((p: any) => ({
      name: p.name,
      subdomain: p.subdomain || `${p.name}.pages.dev`,
      createdOn: p.created_on,
    }));
  } catch (err) {
    console.warn("[CloudflareService] Error listing pages projects:", err);
    return [];
  }
}

/**
 * Ensures a Cloudflare Pages project exists, creating it if needed.
 */
export async function ensurePagesProject(
  projectName: string,
  credentials?: CloudflareCredentials
): Promise<{ projectName: string; subdomain: string; isNew: boolean }> {
  const creds = credentials || (await getCloudflareCredentials());
  if (!creds) {
    throw new Error("Cloudflare credentials not configured. Please configure your API token in Settings.");
  }

  const cleanName = sanitizePagesProjectName(projectName);
  const authHeaders = {
    Authorization: `Bearer ${creds.apiToken}`,
    "Content-Type": "application/json",
  };

  // 1. Check if project already exists
  const getRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${creds.accountId}/pages/projects/${cleanName}`,
    { headers: authHeaders }
  );

  if (getRes.ok) {
    const data = await getRes.json();
    if (data.success) {
      const subdomain = data.result?.subdomain || `${cleanName}.pages.dev`;
      return { projectName: cleanName, subdomain, isNew: false };
    }
  }

  // 2. Create project if not found
  const createRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${creds.accountId}/pages/projects`,
    {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        name: cleanName,
        production_branch: "main",
      }),
    }
  );

  const createData = await createRes.json();
  if (!createRes.ok || !createData.success) {
    const errText = createData.errors?.[0]?.message || `Failed creating Cloudflare Pages project "${cleanName}"`;
    throw new Error(errText);
  }

  const subdomain = createData.result?.subdomain || `${cleanName}.pages.dev`;
  return { projectName: cleanName, subdomain, isNew: true };
}

export interface PublishFileInput {
  path: string;
  content: string | Buffer;
}

export interface PublishResult {
  success: boolean;
  projectName: string;
  liveUrl: string;
  subdomain: string;
  deploymentId?: string;
  filesCount: number;
  publishedAt: number;
}

/**
 * Deploys static files directly to Cloudflare Pages using the official Wrangler deploy engine.
 * Writes files temporarily, deploys to Cloudflare edge, and cleans up temporary files immediately.
 */
export async function deployToCloudflarePages(params: {
  projectName: string;
  files: PublishFileInput[];
  branch?: string;
}): Promise<PublishResult> {
  const { projectName, files, branch = "main" } = params;

  if (!files || files.length === 0) {
    throw new Error("No website files provided for deployment.");
  }

  const creds = await getCloudflareCredentials();
  if (!creds) {
    throw new Error("Cloudflare is not connected. Please provide an API Token and Account ID.");
  }

  // 1. Ensure project exists in Cloudflare
  const projectInfo = await ensurePagesProject(projectName, creds);
  const cleanProject = projectInfo.projectName;

  // 2. Create an isolated temporary directory in /tmp
  const tempDeployId = `cf-deploy-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const tempDir = path.join(os.tmpdir(), tempDeployId);

  try {
    fs.mkdirSync(tempDir, { recursive: true });

    // Write all website files into the temporary directory
    for (const f of files) {
      const normalizedPath = f.path.replace(/^\/+/, "");
      const fullPath = path.join(tempDir, normalizedPath);
      const parentDir = path.dirname(fullPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }

      if (Buffer.isBuffer(f.content)) {
        fs.writeFileSync(fullPath, f.content);
      } else if (typeof f.content === "string") {
        fs.writeFileSync(fullPath, f.content, "utf8");
      }
    }

    // 3. Execute wrangler pages deploy with credentials in execution environment
    const wranglerBin = path.resolve(process.cwd(), "node_modules", ".bin", "wrangler");
    const cmd = `"${wranglerBin}" pages deploy "${tempDir}" --project-name "${cleanProject}" --branch "${branch}" --commit-dirty=true`;

    const env = {
      ...process.env,
      CLOUDFLARE_API_TOKEN: creds.apiToken,
      CLOUDFLARE_ACCOUNT_ID: creds.accountId,
    };

    const { stdout, stderr } = await execAsync(cmd, {
      env,
      timeout: 120000, // 2-minute timeout
      maxBuffer: 10 * 1024 * 1024,
    });

    // 4. Parse deployment URL from stdout
    // Wrangler outputs: "Deployment complete! Take a peek over at https://..."
    let liveUrl = `https://${cleanProject}.pages.dev`;
    const urlMatch = stdout.match(/https:\/\/[a-z0-9-]+\.[a-z0-9-]+\.pages\.dev/i) || stdout.match(/https:\/\/[a-z0-9-]+\.pages\.dev/i);
    if (urlMatch) {
      liveUrl = urlMatch[0];
    }

    // Extract deployment id if present
    const deployIdMatch = stdout.match(/Deployment ID:\s*([a-f0-9-]+)/i);
    const deploymentId = deployIdMatch ? deployIdMatch[1] : undefined;

    return {
      success: true,
      projectName: cleanProject,
      liveUrl: `https://${cleanProject}.pages.dev`,
      subdomain: `${cleanProject}.pages.dev`,
      deploymentId,
      filesCount: files.length,
      publishedAt: Date.now(),
    };
  } catch (err: any) {
    const errorDetails = err.stderr || err.stdout || err.message || "Failed to deploy website to Cloudflare Pages";
    console.error("[CloudflareService] Deployment error:", errorDetails);
    throw new Error(`Cloudflare deployment failed: ${errorDetails.slice(0, 300)}`);
  } finally {
    // 5. Clean up temporary directory immediately (zero lingering server storage)
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (cleanupErr) {
      console.warn("[CloudflareService] Temp dir cleanup warning:", cleanupErr);
    }
  }
}

export interface DnsRecordGuidance {
  type: string;
  name: string;
  target: string;
  proxied: boolean;
}

export interface DomainResult {
  success: boolean;
  domain: string;
  status: "active" | "pending" | "action_required" | "failed";
  dnsRecords: DnsRecordGuidance[];
  message?: string;
}

/**
 * Adds a custom domain to a Cloudflare Pages project and returns DNS setup guidance.
 */
export async function addCustomDomain(params: {
  projectName: string;
  domain: string;
}): Promise<DomainResult> {
  const { projectName, domain } = params;
  const cleanProject = sanitizePagesProjectName(projectName);
  const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");

  const creds = await getCloudflareCredentials();
  if (!creds) {
    throw new Error("Cloudflare credentials not configured.");
  }

  const authHeaders = {
    Authorization: `Bearer ${creds.apiToken}`,
    "Content-Type": "application/json",
  };

  const targetHost = `${cleanProject}.pages.dev`;
  const dnsRecords: DnsRecordGuidance[] = [
    {
      type: "CNAME",
      name: cleanDomain.startsWith("www.") ? cleanDomain : cleanDomain,
      target: targetHost,
      proxied: true,
    },
  ];

  // Call Cloudflare Pages Domains API
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${creds.accountId}/pages/projects/${cleanProject}/domains`,
    {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ name: cleanDomain }),
    }
  );

  const data = await res.json();
  if (!res.ok && !data.success) {
    // If domain already added, that's fine, we proceed to check its status
    const errMsg = data.errors?.[0]?.message || "";
    if (!errMsg.toLowerCase().includes("already exists")) {
      throw new Error(`Failed adding custom domain: ${errMsg}`);
    }
  }

  // Check current domain verification status
  return verifyCustomDomain({ projectName: cleanProject, domain: cleanDomain });
}

/**
 * Checks the verification and SSL status of a custom domain on Cloudflare Pages.
 */
export async function verifyCustomDomain(params: {
  projectName: string;
  domain: string;
}): Promise<DomainResult> {
  const { projectName, domain } = params;
  const cleanProject = sanitizePagesProjectName(projectName);
  const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");

  const creds = await getCloudflareCredentials();
  if (!creds) {
    throw new Error("Cloudflare credentials not configured.");
  }

  const authHeaders = {
    Authorization: `Bearer ${creds.apiToken}`,
    "Content-Type": "application/json",
  };

  const targetHost = `${cleanProject}.pages.dev`;
  const dnsRecords: DnsRecordGuidance[] = [
    {
      type: "CNAME",
      name: cleanDomain,
      target: targetHost,
      proxied: true,
    },
  ];

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${creds.accountId}/pages/projects/${cleanProject}/domains/${cleanDomain}`,
    { headers: authHeaders }
  );

  const data = await res.json();
  if (!res.ok || !data.success) {
    return {
      success: false,
      domain: cleanDomain,
      status: "action_required",
      dnsRecords,
      message: data.errors?.[0]?.message || "DNS configuration pending or action required.",
    };
  }

  const rawStatus = (data.result?.status || "").toLowerCase();
  let status: "active" | "pending" | "action_required" | "failed" = "pending";

  if (rawStatus === "active") {
    status = "active";
  } else if (rawStatus === "pending" || rawStatus === "initializing") {
    status = "pending";
  } else {
    status = "action_required";
  }

  return {
    success: true,
    domain: cleanDomain,
    status,
    dnsRecords,
    message: status === "active" ? "Domain is active and serving traffic." : "Waiting for DNS propagation.",
  };
}
