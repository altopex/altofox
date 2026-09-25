const { createClient } = require("@supabase/supabase-js");
const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());

const BASE_URL = "http://127.0.0.1:3000";

async function runTests() {
  console.log("=================================================");
  console.log("ALTOFOX ACCESS CONTROL & ROUTE PROTECTION TEST SUITE");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Unauthenticated visiting /dashboard -> Expect 307/308 redirect to /login?redirect=/dashboard
  console.log("[Test 1] Unauthenticated request to /dashboard");
  try {
    const res = await fetch(`${BASE_URL}/dashboard`, { redirect: "manual" });
    const location = res.headers.get("location");
    assert(
      res.status === 307 || res.status === 308,
      `Response is redirect status (${res.status})`
    );
    assert(
      location && location.includes("/login") && location.includes("redirect=%2Fdashboard"),
      `Redirects to /login with redirect parameter (Location: ${location})`
    );
  } catch (err) {
    assert(false, `Request failed: ${err.message}`);
  }

  // 2. Unauthenticated visiting deep dashboard route -> Expect redirect to deep path
  console.log("\n[Test 2] Unauthenticated request to /dashboard/projects/123");
  try {
    const res = await fetch(`${BASE_URL}/dashboard/projects/123`, { redirect: "manual" });
    const location = res.headers.get("location");
    assert(
      res.status === 307 || res.status === 308,
      `Response is redirect status (${res.status})`
    );
    assert(
      location && location.includes("/login") && location.includes("redirect=%2Fdashboard%2Fprojects%2F123"),
      `Redirect preserves deep path (Location: ${location})`
    );
  } catch (err) {
    assert(false, `Request failed: ${err.message}`);
  }

  // 3. Unauthenticated visiting protected API route -> Expect 401 Unauthorized
  console.log("\n[Test 3] Direct unauthenticated access to protected API route (/api/projects)");
  try {
    const res = await fetch(`${BASE_URL}/api/projects`);
    assert(res.status === 401, `Status code is 401 Unauthorized (got ${res.status})`);
    const json = await res.json();
    assert(
      json.error && json.error.toLowerCase().includes("unauthorized"),
      `Returns unauthorized JSON: ${JSON.stringify(json)}`
    );
  } catch (err) {
    assert(false, `Request failed: ${err.message}`);
  }

  // 4. Unauthenticated visiting /pending -> Expect redirect to /login
  console.log("\n[Test 4] Unauthenticated request to /pending");
  try {
    const res = await fetch(`${BASE_URL}/pending`, { redirect: "manual" });
    const location = res.headers.get("location");
    assert(
      res.status === 307 || res.status === 308,
      `Response is redirect status (${res.status})`
    );
    assert(
      location && location.includes("/login"),
      `Redirects to /login (Location: ${location})`
    );
  } catch (err) {
    assert(false, `Request failed: ${err.message}`);
  }

  // 5. Public pages accessible without login
  console.log("\n[Test 5] Public pages accessibility (/, /login, /signup, /privacy, /terms)");
  for (const path of ["/", "/login", "/signup", "/privacy", "/terms"]) {
    try {
      const res = await fetch(`${BASE_URL}${path}`, { redirect: "manual" });
      assert(res.status === 200, `Public page ${path} returns 200 OK`);
    } catch (err) {
      assert(false, `Failed to load ${path}: ${err.message}`);
    }
  }

  // 6. Test with Approved User (russ@altopex.com)
  console.log("\n[Test 6] Approved user (russ@altopex.com) authentication & access");
  const supabaseUrl = process.env.SUPABASE_URL || "https://udxjxkkcpdrlceucxqfk.supabase.co";
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  const userClient = createClient(supabaseUrl, publishableKey);
  const adminClient = createClient(supabaseUrl, secretKey);

  const { data: authData, error: authError } = await userClient.auth.signInWithPassword({
    email: "russ@altopex.com",
    password: "AltofoxRuss2026!#",
  });

  if (authError || !authData.session) {
    assert(false, `Failed to log in as russ@altopex.com: ${authError?.message}`);
  } else {
    assert(true, "Successfully signed in as russ@altopex.com");
    const token = authData.session.access_token;

    // Check /dashboard access with approved cookies
    const dashRes = await fetch(`${BASE_URL}/dashboard`, {
      headers: {
        Cookie: `altofox_token=${token}; altofox_status=approved`,
      },
      redirect: "manual",
    });
    assert(dashRes.status === 200, `/dashboard returns 200 OK for approved user (got ${dashRes.status})`);

    // Check /login redirects to /dashboard when approved
    const loginRes = await fetch(`${BASE_URL}/login`, {
      headers: {
        Cookie: `altofox_token=${token}; altofox_status=approved`,
      },
      redirect: "manual",
    });
    const loginLoc = loginRes.headers.get("location");
    assert(
      (loginRes.status === 307 || loginRes.status === 308) && loginLoc && loginLoc.includes("/dashboard"),
      `/login redirects approved user to /dashboard (Location: ${loginLoc})`
    );

    // Check API access with token
    const apiRes = await fetch(`${BASE_URL}/api/projects`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    assert(apiRes.status === 200, `Protected API /api/projects returns 200 OK with Bearer token`);
  }

  // 7. Test with Pending User
  console.log("\n[Test 7] Pending user restriction & route protection");
  const testPendingEmail = `test-pending-${Date.now()}@altopex.com`;
  const testPendingPassword = "AltofoxTemp123456!#";

  // Create pending user via admin
  const { data: createdUser, error: createErr } = await adminClient.auth.admin.createUser({
    email: testPendingEmail,
    password: testPendingPassword,
    email_confirm: true,
    user_metadata: {
      full_name: "Pending Test User",
      company_name: "Test Trade LLC",
      role: "editor",
    },
  });

  if (createErr || !createdUser.user) {
    assert(false, `Failed to create test pending user: ${createErr?.message}`);
  } else {
    const pendingUserId = createdUser.user.id;

    // Ensure status is explicitly 'pending' in profiles
    await adminClient.from("profiles").update({ status: "pending", role: "editor" }).eq("id", pendingUserId);

    // Sign in as pending user to get token
    const pendingAuth = await userClient.auth.signInWithPassword({
      email: testPendingEmail,
      password: testPendingPassword,
    });

    if (pendingAuth.data.session) {
      const pendingToken = pendingAuth.data.session.access_token;

      // Access /dashboard -> Must redirect to /pending
      const dashPendingRes = await fetch(`${BASE_URL}/dashboard`, {
        headers: {
          Cookie: `altofox_token=${pendingToken}; altofox_status=pending`,
        },
        redirect: "manual",
      });
      const dashPendingLoc = dashPendingRes.headers.get("location");
      assert(
        (dashPendingRes.status === 307 || dashPendingRes.status === 308) &&
          dashPendingLoc &&
          dashPendingLoc.includes("/pending"),
        `Visiting /dashboard as pending user redirects to /pending (Location: ${dashPendingLoc})`
      );

      // Access protected API with pending token -> Must return 403 Forbidden
      const apiPendingRes = await fetch(`${BASE_URL}/api/projects`, {
        headers: {
          Authorization: `Bearer ${pendingToken}`,
          Cookie: `altofox_token=${pendingToken}; altofox_status=pending`,
        },
      });
      assert(
        apiPendingRes.status === 403,
        `Direct API call as pending user returns 403 Forbidden (got ${apiPendingRes.status})`
      );

      // Direct RLS test: Query projects using pending user's authenticated Supabase client
      const pendingClient = createClient(supabaseUrl, publishableKey, {
        global: { headers: { Authorization: `Bearer ${pendingToken}` } },
      });

      const { data: rlsProjects, error: rlsError } = await pendingClient.from("projects").select("*");
      assert(
        !rlsProjects || rlsProjects.length === 0,
        `PostgreSQL RLS blocks pending user from reading projects (rows returned: ${rlsProjects?.length || 0})`
      );

      // Verify pending user CAN read their own profile row
      const { data: ownProfile } = await pendingClient
        .from("profiles")
        .select("id, status")
        .eq("id", pendingUserId)
        .single();
      assert(
        ownProfile && ownProfile.status === "pending",
        `Pending user CAN read their own profile row (status: ${ownProfile?.status})`
      );

      // Verify pending user CANNOT read other users' profile rows
      const { data: otherProfiles } = await pendingClient
        .from("profiles")
        .select("id")
        .neq("id", pendingUserId);
      assert(
        !otherProfiles || otherProfiles.length === 0,
        `PostgreSQL RLS blocks pending user from reading other profiles (rows returned: ${otherProfiles?.length || 0})`
      );
    }

    // Clean up temporary user
    await adminClient.auth.admin.deleteUser(pendingUserId);
    await adminClient.from("profiles").delete().eq("id", pendingUserId);
    console.log("  (Cleaned up temporary test user)");
  }

  console.log("\n=================================================");
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
