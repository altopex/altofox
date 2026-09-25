const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

async function run() {
  const sqlPath = path.join(__dirname, "../supabase/migrations/20260925000000_initial_schema.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    console.error("Missing SUPABASE_DB_URL in environment.");
    process.exit(1);
  }

  console.log("Connecting to Supabase PostgreSQL database...");
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  await client.connect();
  console.log("Connected successfully! Applying schema migration...");

  try {
    await client.query(sql);
    console.log("Migration 20260925000000_initial_schema.sql applied successfully!");

    // Verify created tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log("\nVerified public tables:");
    res.rows.forEach((r, idx) => console.log(`  ${idx + 1}. ${r.table_name}`));

    // Verify RLS enabled on all tables
    const rlsRes = await client.query(`
      SELECT relname, relrowsecurity 
      FROM pg_class 
      JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace 
      WHERE pg_namespace.nspname = 'public' AND relkind = 'r'
      ORDER BY relname;
    `);
    console.log("\nRow Level Security Status:");
    rlsRes.rows.forEach((r) => {
      console.log(`  ${r.relname}: RLS ${r.relrowsecurity ? "ENABLED ✓" : "DISABLED ✗"}`);
    });
  } catch (err) {
    console.error("Migration error:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
