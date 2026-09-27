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
