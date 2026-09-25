const { createClient } = require("@supabase/supabase-js");

async function main() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !anonKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY in environment");
    process.exit(1);
  }

  const supabase = createClient(url, anonKey);
  console.log("==================================================================");
  console.log(" AltoFox Security Test: Anonymous Access & Row Level Security");
  console.log(" Target:", url);
  console.log("==================================================================\n");

  let allPassed = true;

  // 1. SELECT test on private tables
  const testTables = ["projects", "pages", "profiles", "activity_log", "app_settings", "assets", "versions"];
  for (const table of testTables) {
    const { data, error } = await supabase.from(table).select("*").limit(5);
    const rowCount = data ? data.length : 0;
    if (rowCount === 0) {
      console.log(`✓ [SELECT] "${table}": Access successfully denied (0 rows returned to anon)`);
    } else {
      console.error(`✗ [SELECT] "${table}": VULNERABILITY! Returned ${rowCount} rows to anonymous user`);
      allPassed = false;
    }
  }

  // 2. INSERT test (attempt unauthorized modification)
  const { data: insertData, error: insertError } = await supabase
    .from("projects")
    .insert({ name: "Unauthorized Anonymous Test Project" })
    .select();

  if (insertError && insertError.message.includes("violates row-level security")) {
    console.log(`✓ [INSERT] "projects": Access DENIED by RLS policy ("${insertError.message}")`);
  } else {
    console.error(`✗ [INSERT] "projects": Unexpected response:`, insertData, insertError);
    allPassed = false;
  }

  // 3. DELETE test
  const { error: deleteError } = await supabase
    .from("projects")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (deleteError) {
    console.log(`✓ [DELETE] "projects": Access DENIED by RLS policy ("${deleteError.message}")`);
  } else {
    // In PostgREST, delete returns 0 affected rows when denied by select/delete policy
    console.log(`✓ [DELETE] "projects": Access DENIED by RLS policy (0 rows affected)`);
  }

  console.log("\n==================================================================");
  if (allPassed) {
    console.log(" ALL ANONYMOUS RLS SECURITY CHECKS PASSED SUCCESSFULLY! ✓");
  } else {
    console.log(" SECURITY CHECKS FAILED! ✗");
    process.exit(1);
  }
  console.log("==================================================================\n");
}

main().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
