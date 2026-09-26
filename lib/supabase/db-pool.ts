import { Pool } from "pg";

let pool: Pool | null = null;

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
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}
