import { db } from "../db";
import { encryptApiKey, decryptApiKey, maskApiKey } from "../ai/encryption";
import { HostingProviderType, HostingCredentials } from "./types";
import { getCloudflareCredentials } from "../cloudflare/cloudflare-service";

/**
 * Retrieves stored credentials for any hosting provider from encrypted DB or environment.
 */
export async function getStoredHostingCredentials(
  provider: HostingProviderType
): Promise<HostingCredentials | null> {
  if (provider === "cloudflare") {
    const cf = await getCloudflareCredentials();
    if (!cf) return null;
    return {
      apiToken: cf.apiToken,
      accountId: cf.accountId,
    };
  }

  // Check SQLite Database
  try {
    const record = await db.apiKey.findUnique({
      where: { provider },
    });

    if (record) {
      const decrypted = decryptApiKey({
        encryptedKey: record.encryptedKey,
        iv: record.iv,
        tag: record.tag,
      });

      if (decrypted && decrypted.trim()) {
        return {
          apiToken: decrypted.trim(),
          teamId: provider === "vercel" ? record.organizationId || undefined : undefined,
          owner: provider === "github" ? record.organizationId || undefined : undefined,
        };
      }
    }
  } catch (err) {
    console.warn(`[CredentialStore] Could not read ${provider} credentials from DB:`, err);
  }

  // Fallback to environment variables
  if (provider === "vercel") {
    const token = process.env.VERCEL_TOKEN || process.env.VERCEL_API_TOKEN;
    if (token) return { apiToken: token, teamId: process.env.VERCEL_TEAM_ID };
  } else if (provider === "netlify") {
    const token = process.env.NETLIFY_TOKEN || process.env.NETLIFY_AUTH_TOKEN;
    if (token) return { apiToken: token };
  } else if (provider === "github") {
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    const owner = process.env.GITHUB_OWNER || process.env.GITHUB_USER;
    if (token) return { apiToken: token, owner };
  }

  return null;
}

/**
 * Saves encrypted hosting credentials to DB.
 */
export async function saveStoredHostingCredentials(
  provider: HostingProviderType,
  creds: HostingCredentials
): Promise<void> {
  if (!creds.apiToken || !creds.apiToken.trim()) {
    throw new Error(`API token is required for ${provider}.`);
  }

  const encrypted = encryptApiKey(creds.apiToken.trim());
  const orgId =
    provider === "cloudflare"
      ? creds.accountId || ""
      : provider === "vercel"
      ? creds.teamId || ""
      : provider === "github"
      ? creds.owner || ""
      : "";

  const providerNames: Record<HostingProviderType, string> = {
    cloudflare: "Cloudflare Pages",
    vercel: "Vercel",
    netlify: "Netlify",
    github: "GitHub Pages",
  };

  await db.apiKey.upsert({
    where: { provider },
    create: {
      provider,
      encryptedKey: encrypted.encryptedKey,
      iv: encrypted.iv,
      tag: encrypted.tag,
      organizationId: orgId,
      providerName: providerNames[provider],
    },
    update: {
      encryptedKey: encrypted.encryptedKey,
      iv: encrypted.iv,
      tag: encrypted.tag,
      organizationId: orgId,
      providerName: providerNames[provider],
    },
  });
}

/**
 * Retrieves connection and masked status for UI.
 */
export async function getHostingCredentialsStatus(
  provider: HostingProviderType
): Promise<{ connected: boolean; maskedToken?: string; accountName?: string; source?: string }> {
  const creds = await getStoredHostingCredentials(provider);
  if (!creds || !creds.apiToken) {
    return { connected: false };
  }

  return {
    connected: true,
    maskedToken: maskApiKey(creds.apiToken),
    accountName: creds.owner || creds.accountId || creds.teamId || `${provider} account`,
    source: "database",
  };
}
