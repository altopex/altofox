import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // Standard recommended length for GCM

function getSecretKey(customFallback?: string): Buffer {
  const secret = process.env.ENCRYPTION_SECRET || customFallback || "ranklocal-development-secret-key-32b!";
  // Hash the secret to ensure it is exactly 32 bytes for aes-256
  return crypto.createHash("sha256").update(secret).digest();
}

export interface EncryptedData {
  encryptedKey: string;
  iv: string;
  tag: string;
}

export function encryptApiKey(plainTextKey: string): EncryptedData {
  if (!plainTextKey) {
    throw new Error("Cannot encrypt empty API key");
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getSecretKey(), iv);

  let encrypted = cipher.update(plainTextKey, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag().toString("hex");

  return {
    encryptedKey: encrypted,
    iv: iv.toString("hex"),
    tag: tag,
  };
}

export function decryptApiKey(data: { encryptedKey: string; iv: string; tag: string }): string {
  if (!data.encryptedKey || !data.iv || !data.tag) {
    throw new Error("Invalid encrypted payload");
  }

  try {
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      getSecretKey(),
      Buffer.from(data.iv, "hex")
    );

    decipher.setAuthTag(Buffer.from(data.tag, "hex"));

    let decrypted = decipher.update(data.encryptedKey, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (err) {
    // If ENCRYPTION_SECRET is not set, try legacy fallback key
    if (!process.env.ENCRYPTION_SECRET) {
      try {
        const legacyDecipher = crypto.createDecipheriv(
          ALGORITHM,
          getSecretKey("altofox-development-secret-key-32b!"),
          Buffer.from(data.iv, "hex")
        );
        legacyDecipher.setAuthTag(Buffer.from(data.tag, "hex"));
        let decrypted = legacyDecipher.update(data.encryptedKey, "hex", "utf8");
        decrypted += legacyDecipher.final("utf8");
        return decrypted;
      } catch {}
    }
    throw err;
  }
}

export function maskApiKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "••••••••";
  const start = key.slice(0, 4);
  const end = key.slice(-4);
  return `${start}••••••••${end}`;
}
