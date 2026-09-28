import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

/**
 * Resolves the canonical SQLite database URL to an absolute path that is
 * guaranteed to exist and be accessible in both local development, standalone builds,
 * and serverless / Vercel runtime environments.
 */
function resolveDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL;

  // If a remote database (Postgres, MySQL, etc.) is configured, use it directly
  if (envUrl && !envUrl.startsWith("file:")) {
    return envUrl;
  }

  const isServerless =
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
    Boolean(process.env.LAMBDA_TASK_ROOT);

  // Candidate locations where dev.db might be located
  const candidatePaths = [
    path.resolve(process.cwd(), "prisma", "dev.db"),
    path.resolve(process.cwd(), "dev.db"),
    path.join(__dirname, "..", "prisma", "dev.db"),
    path.join(__dirname, "..", "..", "prisma", "dev.db"),
    "/var/task/prisma/dev.db",
    "/var/task/dev.db",
  ];

  let sourceDbPath: string | null = null;
  for (const cand of candidatePaths) {
    try {
      if (fs.existsSync(cand)) {
        sourceDbPath = cand;
        break;
      }
    } catch {
      // Ignore filesystem permission check errors
    }
  }

  if (isServerless) {
    // In serverless environments (e.g. AWS Lambda / Vercel), /var/task is read-only.
    // SQLite requires write access to create lock and journal files; /tmp is the only writable path.
    const tmpDbPath = path.join("/tmp", "dev.db");
    if (!fs.existsSync(tmpDbPath)) {
      if (sourceDbPath && fs.existsSync(sourceDbPath)) {
        try {
          fs.copyFileSync(sourceDbPath, tmpDbPath);
          fs.chmodSync(tmpDbPath, 0o666);
          console.log(`[lib/db] Copied SQLite database from ${sourceDbPath} to writable ${tmpDbPath}`);
        } catch (copyErr) {
          console.warn("[lib/db] Failed copying SQLite db to /tmp:", copyErr);
        }
      } else {
        try {
          fs.writeFileSync(tmpDbPath, "", { mode: 0o666 });
        } catch (writeErr) {
          console.warn("[lib/db] Failed creating /tmp/dev.db:", writeErr);
        }
      }
    }
    const serverlessUrl = `file:${tmpDbPath}`;
    process.env.DATABASE_URL = serverlessUrl;
    return serverlessUrl;
  }

  // Local development or dedicated Node server
  const canonicalDbPath = sourceDbPath || path.resolve(process.cwd(), "prisma", "dev.db");
  const parentDir = path.dirname(canonicalDbPath);

  try {
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    if (!fs.existsSync(canonicalDbPath)) {
      // If root dev.db exists, copy it to prisma/dev.db
      const rootDb = path.resolve(process.cwd(), "dev.db");
      if (fs.existsSync(rootDb)) {
        fs.copyFileSync(rootDb, canonicalDbPath);
      } else {
        fs.writeFileSync(canonicalDbPath, "", { mode: 0o666 });
      }
    }
    fs.chmodSync(canonicalDbPath, 0o666);
  } catch (fsErr) {
    console.warn("[lib/db] Warning ensuring local database file:", fsErr);
  }

  const resolvedUrl = `file:${canonicalDbPath}`;
  process.env.DATABASE_URL = resolvedUrl;
  return resolvedUrl;
}

const activeDatabaseUrl = resolveDatabaseUrl();

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var __dbInitialized: Promise<void> | undefined;
}

export const db =
  global.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: activeDatabaseUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = db;
}

const INIT_DDL = `
CREATE TABLE IF NOT EXISTS "ApiKey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "encryptedKey" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "baseUrl" TEXT,
    "defaultModel" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "organizationId" TEXT,
    "providerName" TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS "ApiKey_provider_key" ON "ApiKey"("provider");

CREATE TABLE IF NOT EXISTS "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ready',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "customInstructions" TEXT
);

CREATE TABLE IF NOT EXISTS "ProjectFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mimeType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectFile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ProjectFile_projectId_path_key" ON "ProjectFile"("projectId", "path");

CREATE TABLE IF NOT EXISTS "DownloadToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DownloadToken_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "DownloadToken_token_key" ON "DownloadToken"("token");

CREATE TABLE IF NOT EXISTS "Template" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "badge" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "fullName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'editor',
    "status" TEXT NOT NULL DEFAULT 'approved',
    "companyName" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'starter',
    "websiteLimit" INTEGER NOT NULL DEFAULT 5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
`;

/**
 * Ensures all required SQLite tables and indices exist in the database,
 * making serverless cold starts 100% resilient even with fresh /tmp/dev.db files.
 */
export async function ensureDbInitialized(): Promise<void> {
  if (global.__dbInitialized) {
    return global.__dbInitialized;
  }

  global.__dbInitialized = (async () => {
    try {
      const statements = INIT_DDL.split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const stmt of statements) {
        await db.$executeRawUnsafe(stmt).catch((err) => {
          // Ignore table already exists or index already exists
          if (!err.message?.includes("already exists")) {
            console.warn("[lib/db] Statement execution warning:", err.message);
          }
        });
      }
    } catch (err: any) {
      console.warn("[lib/db] ensureDbInitialized error:", err.message);
    }
  })();

  return global.__dbInitialized;
}

