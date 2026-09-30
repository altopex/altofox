import { Pool } from "pg";

let pool: Pool | null = null;
let poolBrokenUntil = 0;

export function isDbPoolHealthy(): boolean {
  return Date.now() > poolBrokenUntil;
}

export function markDbPoolUnhealthy(): void {
  poolBrokenUntil = Date.now() + 60000; // 60-second backoff
}

export function getDbPool(): Pool {
  if (!pool) {
    const connectionString =
      process.env.SUPABASE_DB_URL ||
      "postgresql://postgres.udxjxkkcpdrlceucxqfk:AltofoxRussell%4012@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres";

    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 5,
      idleTimeoutMillis: 15000,
      connectionTimeoutMillis: 1500,
    });
  }
  return pool;
}
