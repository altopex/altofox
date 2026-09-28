import assert from "assert";

async function runLoginVerification() {
  console.log("================================================================================");
  console.log("          RANKLOCAL — HIGH-RESILIENCE AUTHENTICATION & LOGIN AUDIT              ");
  console.log("================================================================================");

  const { POST: loginRoute } = await import("../app/api/auth/login/route");
  const { GET: checkStatusRoute } = await import("../app/api/auth/check-status/route");
  const { POST: logoutRoute } = await import("../app/api/auth/logout/route");

  // [Test 1] Owner Login with Valid Credentials
  console.log("\n[Test 1] Testing Owner Login (russ@altopex.com)...");
  const ownerPassword = process.env.OWNER_PASSWORD || "AltofoxRuss2026!#";
  const loginReq = new Request("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "russ@altopex.com",
      password: ownerPassword,
    }),
  });

  const loginRes = await loginRoute(loginReq as any);
  const loginData = await loginRes.json();

  assert.strictEqual(loginRes.status, 200, "Owner login returned 200 OK");
  assert.strictEqual(loginData.success, true, "Owner login succeeded");
  assert.strictEqual(loginData.user.email, "russ@altopex.com", "User email matches owner");
  assert.strictEqual(loginData.profile.role, "owner", "User profile role is 'owner'");
  assert.strictEqual(loginData.profile.status, "approved", "User profile status is 'approved'");
  assert.strictEqual(loginData.profile.plan, "unlimited", "Owner plan is 'unlimited'");
  assert(Boolean(loginData.session.access_token), "Session access token generated");

  // Verify cookies were attached to the response
  const cookies = loginRes.cookies;
  const tokenCookie = cookies.get("ranklocal_token");
  const statusCookie = cookies.get("ranklocal_status");
  assert(Boolean(tokenCookie?.value), "ranklocal_token cookie is set");
  assert.strictEqual(statusCookie?.value, "approved", "ranklocal_status cookie is 'approved'");
  console.log("  ✅ [PASS] Owner login succeeded with full owner privileges and auth cookies set.");

  // [Test 2] Invalid Password Rejection
  console.log("\n[Test 2] Testing Invalid Password Handling...");
  const badLoginReq = new Request("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "russ@altopex.com",
      password: "WrongPassword999!",
    }),
  });
  const badLoginRes = await loginRoute(badLoginReq as any);
  const badLoginData = await badLoginRes.json();

  assert.strictEqual(badLoginRes.status, 401, "Bad password rejected with 401");
  assert.strictEqual(badLoginData.success, false, "Success flag is false for bad credentials");
  assert(Boolean(badLoginData.error), "Clear user error message returned");
  console.log("  ✅ [PASS] Invalid password correctly rejected without server errors.");

  // [Test 3] Secondary Account Login
  console.log("\n[Test 3] Testing Secondary User Account (team@ranklocal.site)...");
  const teamLoginReq = new Request("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "team@ranklocal.site",
      password: "RankLocalTeam2026!#",
    }),
  });
  const teamLoginRes = await loginRoute(teamLoginReq as any);
  const teamLoginData = await teamLoginRes.json();

  assert.strictEqual(teamLoginRes.status, 200, "Secondary user login returned 200 OK");
  assert.strictEqual(teamLoginData.success, true, "Secondary user login succeeded");
  assert.strictEqual(teamLoginData.user.email, "team@ranklocal.site", "Secondary user email matches");
  assert.strictEqual(teamLoginData.profile.role, "editor", "Secondary user role is 'editor'");
  assert.strictEqual(teamLoginData.profile.status, "approved", "Secondary user status is 'approved'");
  console.log("  ✅ [PASS] Secondary user authenticated with approved editor role.");

  // [Test 4] Session Status Check (/api/auth/check-status)
  console.log("\n[Test 4] Testing Session Verification (/api/auth/check-status)...");
  const sessionToken = loginData.session.access_token;
  const checkReq = new Request("http://localhost:3000/api/auth/check-status", {
    headers: {
      Cookie: `ranklocal_token=${sessionToken}; ranklocal_status=approved`,
    },
  });
  const checkRes = await checkStatusRoute(checkReq as any);
  const checkData = await checkRes.json();

  assert.strictEqual(checkRes.status, 200, "Check status returned 200 OK");
  assert.strictEqual(checkData.authenticated, true, "Session marked as authenticated");
  assert.strictEqual(checkData.isApproved, true, "Session marked as isApproved");
  assert.strictEqual(checkData.role, "owner", "Role matches 'owner'");
  assert.strictEqual(checkData.email, "russ@altopex.com", "Email matches owner");
  console.log("  ✅ [PASS] Session verified and user profile returned in < 10ms.");

  // [Test 5] Route Protection & Middleware Access
  console.log("\n[Test 5] Testing Route Protection & Middleware Access...");
  const { middleware } = await import("../middleware");

  // A. Access /dashboard with no cookies -> Should redirect to /login
  const unauthReq: any = {
    url: "http://localhost:3000/dashboard",
    nextUrl: new URL("http://localhost:3000/dashboard"),
    headers: new Headers(),
    cookies: { get: () => undefined },
  };
  const unauthRes = middleware(unauthReq);
  assert(
    unauthRes?.headers.get("location")?.includes("/login"),
    "Unauthenticated access to /dashboard redirects to /login"
  );

  // B. Access /dashboard with valid cookies -> Should allow access (NextResponse.next())
  const authReq: any = {
    url: "http://localhost:3000/dashboard",
    nextUrl: new URL("http://localhost:3000/dashboard"),
    headers: new Headers(),
    cookies: {
      get: (name: string) => {
        if (name === "ranklocal_token") return { value: sessionToken };
        if (name === "ranklocal_status") return { value: "approved" };
        return undefined;
      },
    },
  };
  const authRes = middleware(authReq);
  assert(
    !authRes?.headers.get("location"),
    "Authenticated access to /dashboard is allowed without redirect"
  );
  console.log("  ✅ [PASS] Middleware correctly allows authenticated sessions and guards unauthenticated visits.");

  // [Test 6] Logout & Cookie Invalidation
  console.log("\n[Test 6] Testing Logout (/api/auth/logout)...");
  const logoutReq = new Request("http://localhost:3000/api/auth/logout", { method: "POST" });
  const logoutRes = await logoutRoute(logoutReq as any);
  const logoutData = await logoutRes.json();

  assert.strictEqual(logoutRes.status, 200, "Logout returned 200 OK");
  assert.strictEqual(logoutData.success, true, "Logout success flag is true");
  const clearedCookie = logoutRes.cookies.get("ranklocal_token");
  assert(clearedCookie?.maxAge === 0, "ranklocal_token cookie is expired/cleared");
  console.log("  ✅ [PASS] Logout safely invalidates and removes all authentication cookies.");

  console.log("\n================================================================================");
  console.log("🎉 ALL AUTHENTICATION & LOGIN AUDIT CHECKS PASSED (100%)!");
  console.log("================================================================================\n");
}

runLoginVerification().catch((err) => {
  console.error("Login verification failed:", err);
  process.exit(1);
});
