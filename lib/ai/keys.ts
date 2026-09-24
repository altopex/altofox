import { db } from "../db";
import { encryptApiKey, decryptApiKey, maskApiKey } from "./encryption";
import { ProviderType, PROVIDER_PRESETS } from "./types";

export interface StoredKeyInfo {
  provider: ProviderType;
  hasKey: boolean;
  maskedKey: string;
  baseUrl?: string | null;
  defaultModel?: string | null;
  updatedAt?: Date;
}

export async function getProviderCredentials(
  provider: ProviderType,
  directKey?: string,
  directBaseUrl?: string,
  directModel?: string
): Promise<{ apiKey: string; baseUrl?: string; defaultModel?: string }> {
  // 1. If direct key provided, use it
  if (directKey && directKey.trim()) {
    return {
      apiKey: directKey.trim(),
      baseUrl: directBaseUrl?.trim() || PROVIDER_PRESETS[provider]?.defaultBaseUrl,
      defaultModel: directModel?.trim() || PROVIDER_PRESETS[provider]?.defaultModel,
    };
  }

  // 2. Check Database for encrypted key (optional)
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
      return {
        apiKey: decrypted,
        baseUrl: record.baseUrl || PROVIDER_PRESETS[provider]?.defaultBaseUrl,
        defaultModel: record.defaultModel || PROVIDER_PRESETS[provider]?.defaultModel,
      };
    }
  } catch {
    // Database is optional; fallback to environment variables
  }

  // 3. Fallback to environment variables
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
      defaultModel: PROVIDER_PRESETS[provider]?.defaultModel,
    };
  }

  throw new Error(
    `No API key configured for ${PROVIDER_PRESETS[provider]?.name || provider}. Please add your API key in Settings.`
  );
}

export async function saveProviderKey(
  provider: ProviderType,
  apiKey: string,
  baseUrl?: string,
  defaultModel?: string
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
    },
    create: {
      provider,
      encryptedKey: encrypted.encryptedKey,
      iv: encrypted.iv,
      tag: encrypted.tag,
      baseUrl: baseUrl?.trim() || null,
      defaultModel: defaultModel?.trim() || null,
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
    "openai",
    "anthropic",
    "gemini",
    "groq",
    "deepseek",
    "openrouter",
    "custom",
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
        baseUrl: process.env.CUSTOM_AI_BASE_URL,
        defaultModel: PROVIDER_PRESETS[provider]?.defaultModel,
      };
    }

    return {
      provider,
      hasKey: false,
      maskedKey: "",
      baseUrl: PROVIDER_PRESETS[provider]?.defaultBaseUrl,
      defaultModel: PROVIDER_PRESETS[provider]?.defaultModel,
    };
  });
}
