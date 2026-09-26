import { db } from "../db";
import { encryptApiKey, decryptApiKey, maskApiKey } from "./encryption";
import { ProviderType, PROVIDER_PRESETS } from "./types";

export interface StoredKeyInfo {
  provider: ProviderType;
  hasKey: boolean;
  maskedKey: string;
  baseUrl?: string | null;
  defaultModel?: string | null;
  organizationId?: string | null;
  providerName?: string | null;
  updatedAt?: Date;
}

export async function getProviderCredentials(
  provider: ProviderType,
  directKey?: string,
  directBaseUrl?: string,
  directModel?: string,
  directOrgId?: string,
  directProviderName?: string
): Promise<{
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  organizationId?: string;
  providerName?: string;
  resolvedProvider?: ProviderType;
}> {
  // 1. If direct key provided, use it
  if (directKey && directKey.trim()) {
    return {
      apiKey: directKey.trim(),
      baseUrl: directBaseUrl?.trim() || PROVIDER_PRESETS[provider]?.defaultBaseUrl,
      defaultModel: directModel?.trim() || PROVIDER_PRESETS[provider]?.defaultModel,
      organizationId: directOrgId?.trim() || undefined,
      providerName: directProviderName?.trim() || PROVIDER_PRESETS[provider]?.name || provider,
      resolvedProvider: provider,
    };
  }

  // 2. Check Database for encrypted key for requested provider
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
          apiKey: decrypted.trim(),
          baseUrl: record.baseUrl || PROVIDER_PRESETS[provider]?.defaultBaseUrl,
          defaultModel: record.defaultModel || directModel || PROVIDER_PRESETS[provider]?.defaultModel,
          organizationId: record.organizationId || directOrgId || undefined,
          providerName: record.providerName || directProviderName || PROVIDER_PRESETS[provider]?.name || provider,
          resolvedProvider: provider,
        };
      }
    }
  } catch {
    // Database is optional; fallback to environment variables
  }

  // 3. Fallback to environment variable for requested provider
  const envMap: Record<ProviderType, string | undefined> = {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    groq: process.env.GROQ_API_KEY,
    deepseek: process.env.DEEPSEEK_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
    custom: process.env.CUSTOM_AI_API_KEY,
  };

  const envKey = envMap[provider];
  if (envKey && envKey.trim()) {
    return {
      apiKey: envKey.trim(),
      baseUrl: process.env.CUSTOM_AI_BASE_URL || PROVIDER_PRESETS[provider]?.defaultBaseUrl,
      defaultModel: directModel || process.env.CUSTOM_AI_MODEL || PROVIDER_PRESETS[provider]?.defaultModel,
      organizationId: process.env.CUSTOM_AI_ORG_ID || directOrgId || undefined,
      providerName: process.env.CUSTOM_AI_PROVIDER_NAME || directProviderName || PROVIDER_PRESETS[provider]?.name || provider,
      resolvedProvider: provider,
    };
  }

  // 4. Intelligent Cross-Provider Fallback:
  // If the requested provider has no key, check if ANY other provider has a valid key configured in DB or env
  const allProviders: ProviderType[] = [
    "custom",
    "gemini",
    "openai",
    "anthropic",
    "groq",
    "openrouter",
    "deepseek",
  ];

  for (const altProvider of allProviders) {
    if (altProvider === provider) continue;

    // Check DB for altProvider
    try {
      const altRecord = await db.apiKey.findUnique({
        where: { provider: altProvider },
      });
      if (altRecord) {
        const decrypted = decryptApiKey({
          encryptedKey: altRecord.encryptedKey,
          iv: altRecord.iv,
          tag: altRecord.tag,
        });
        if (decrypted && decrypted.trim()) {
          console.log(`[AI Key Resolver] Using active configured provider ${altProvider} as fallback for ${provider}`);
          return {
            apiKey: decrypted.trim(),
            baseUrl: altRecord.baseUrl || PROVIDER_PRESETS[altProvider]?.defaultBaseUrl,
            defaultModel: altRecord.defaultModel || PROVIDER_PRESETS[altProvider]?.defaultModel,
            organizationId: altRecord.organizationId || undefined,
            providerName: altRecord.providerName || PROVIDER_PRESETS[altProvider]?.name || altProvider,
            resolvedProvider: altProvider,
          };
        }
      }
    } catch {
      // Continue search
    }

    // Check Env for altProvider
    const altEnv = envMap[altProvider];
    if (altEnv && altEnv.trim()) {
      console.log(`[AI Key Resolver] Using environment key for ${altProvider} as fallback for ${provider}`);
      return {
        apiKey: altEnv.trim(),
        baseUrl: process.env.CUSTOM_AI_BASE_URL || PROVIDER_PRESETS[altProvider]?.defaultBaseUrl,
        defaultModel: process.env.CUSTOM_AI_MODEL || PROVIDER_PRESETS[altProvider]?.defaultModel,
        organizationId: process.env.CUSTOM_AI_ORG_ID || undefined,
        providerName: process.env.CUSTOM_AI_PROVIDER_NAME || PROVIDER_PRESETS[altProvider]?.name || altProvider,
        resolvedProvider: altProvider,
      };
    }
  }

  // Generic message when no valid provider is available
  throw new Error("No AI provider is configured. Please configure an AI provider in Settings.");
}

/**
 * Resolves credentials for any currently active or configured provider.
 */
export async function getAnyConfiguredProviderCredentials(
  preferredProvider?: ProviderType,
  directKey?: string,
  directBaseUrl?: string,
  directModel?: string,
  directOrgId?: string,
  directProviderName?: string
): Promise<{
  provider: ProviderType;
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  organizationId?: string;
  providerName?: string;
}> {
  const targetProvider = preferredProvider || "custom";
  const creds = await getProviderCredentials(
    targetProvider,
    directKey,
    directBaseUrl,
    directModel,
    directOrgId,
    directProviderName
  );
  return {
    provider: creds.resolvedProvider || targetProvider,
    apiKey: creds.apiKey,
    baseUrl: creds.baseUrl,
    defaultModel: creds.defaultModel,
    organizationId: creds.organizationId,
    providerName: creds.providerName,
  };
}

export async function saveProviderKey(
  provider: ProviderType,
  apiKey: string,
  baseUrl?: string,
  defaultModel?: string,
  organizationId?: string,
  providerName?: string
): Promise<void> {
  const encrypted = encryptApiKey(apiKey.trim());

  await db.apiKey.upsert({
    where: { provider },
    update: {
      encryptedKey: encrypted.encryptedKey,
      iv: encrypted.iv,
      tag: encrypted.tag,
      baseUrl: baseUrl?.trim() || null,
      defaultModel: defaultModel?.trim() || null,
      organizationId: organizationId?.trim() || null,
      providerName: providerName?.trim() || null,
    },
    create: {
      provider,
      encryptedKey: encrypted.encryptedKey,
      iv: encrypted.iv,
      tag: encrypted.tag,
      baseUrl: baseUrl?.trim() || null,
      defaultModel: defaultModel?.trim() || null,
      organizationId: organizationId?.trim() || null,
      providerName: providerName?.trim() || null,
    },
  });
}

export async function deleteProviderKey(provider: ProviderType): Promise<void> {
  await db.apiKey.deleteMany({
    where: { provider },
  });
}

export async function listConfiguredProviders(): Promise<StoredKeyInfo[]> {
  const dbKeys = await db.apiKey.findMany();
  const dbMap = new Map(dbKeys.map((k) => [k.provider, k]));

  const providers: ProviderType[] = [
    "custom",
    "openai",
    "anthropic",
    "gemini",
    "groq",
    "deepseek",
    "openrouter",
  ];

  return providers.map((provider) => {
    const dbRecord = dbMap.get(provider);
    if (dbRecord) {
      let masked = "••••••••";
      try {
        const decrypted = decryptApiKey({
          encryptedKey: dbRecord.encryptedKey,
          iv: dbRecord.iv,
          tag: dbRecord.tag,
        });
        masked = maskApiKey(decrypted);
      } catch {
        masked = "••••••••";
      }

      return {
        provider,
        hasKey: true,
        maskedKey: masked,
        baseUrl: dbRecord.baseUrl,
        defaultModel: dbRecord.defaultModel,
        organizationId: dbRecord.organizationId,
        providerName: dbRecord.providerName || (provider === "custom" ? "Custom (OpenAI-compatible)" : PROVIDER_PRESETS[provider]?.name),
        updatedAt: dbRecord.updatedAt,
      };
    }

    // Check env fallback
    const envMap: Record<ProviderType, string | undefined> = {
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
      gemini: process.env.GEMINI_API_KEY,
      groq: process.env.GROQ_API_KEY,
      deepseek: process.env.DEEPSEEK_API_KEY,
      openrouter: process.env.OPENROUTER_API_KEY,
      custom: process.env.CUSTOM_AI_API_KEY,
    };
    const envKey = envMap[provider];
    if (envKey) {
      return {
        provider,
        hasKey: true,
        maskedKey: maskApiKey(envKey) + " (env)",
        baseUrl: process.env.CUSTOM_AI_BASE_URL || PROVIDER_PRESETS[provider]?.defaultBaseUrl,
        defaultModel: process.env.CUSTOM_AI_MODEL || PROVIDER_PRESETS[provider]?.defaultModel,
        organizationId: process.env.CUSTOM_AI_ORG_ID,
        providerName: process.env.CUSTOM_AI_PROVIDER_NAME || (provider === "custom" ? "Custom (OpenAI-compatible)" : PROVIDER_PRESETS[provider]?.name),
      };
    }

    return {
      provider,
      hasKey: false,
      maskedKey: "",
      baseUrl: PROVIDER_PRESETS[provider]?.defaultBaseUrl,
      defaultModel: PROVIDER_PRESETS[provider]?.defaultModel,
      organizationId: null,
      providerName: provider === "custom" ? "Custom (OpenAI-compatible)" : PROVIDER_PRESETS[provider]?.name,
    };
  });
}
