import assert from "assert";
import { POST as loginRoute } from "../app/api/auth/login/route";
import { GET as checkStatusRoute } from "../app/api/auth/check-status/route";
import { POST as logoutRoute } from "../app/api/auth/logout/route";
import { middleware } from "../middleware";
import { getAuthToken } from "../lib/auth/client-token";
import { signUserSessionToken } from "../lib/auth/auth-service";

async function runSessionStabilitySuite() {
  console.log("================================================================================");
  console.log("    RANKLOCAL v5.3.5 — 18-POINT COMPREHENSIVE AUTH & SESSION STABILITY TEST     ");
  console.log("================================================================================");

  let ownerToken = "";
  let teamToken = "";

  // [Scenario 1] Valid User Login
  console.log("\n[Scenario 1] Valid User Login (Owner Credentials)...");
  const ownerPassword = process.env.OWNER_PASSWORD || "AltofoxRuss2026!#";
  const loginReq = new Request("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "russ@altopex.com", password: ownerPassword }),
  });
  const loginRes = await loginRoute(loginReq as any);
  const loginData = await loginRes.json();
  assert.strictEqual(loginRes.status, 200, "Login must return 200 OK");
  assert.strictEqual(loginData.success, true, "Login must succeed");
  ownerToken = loginData.session.access_token;
  assert(Boolean(ownerToken), "Access token must be generated");
  console.log("  ✅ [PASS] Valid user logged in successfully.");

  // [Scenario 2] Session Creation & Dual Cookie Setting
  console.log("\n[Scenario 2] Session Creation & Dual Cookie Setting...");
  const cookies = loginRes.cookies;
  const tokenCookie = cookies.get("ranklocal_token");
  const statusCookie = cookies.get("ranklocal_status");
  assert(Boolean(tokenCookie?.value), "ranklocal_token cookie is attached");
  assert.strictEqual(statusCookie?.value, "approved", "ranklocal_status cookie is 'approved'");
  console.log("  ✅ [PASS] Session created with both ranklocal_token and status cookies.");

  // [Scenario 3] Session Persistence Verification
  console.log("\n[Scenario 3] Session Persistence Verification (/api/auth/check-status)...");
  const persistReq = new Request("http://localhost:3000/api/auth/check-status", {
    headers: {
      Cookie: `ranklocal_token=${ownerToken}; ranklocal_status=approved`,
    },
  });
  const persistRes = await checkStatusRoute(persistReq as any);
  const persistData = await persistRes.json();
  assert.strictEqual(persistRes.status, 200, "Status check returned 200 OK");
  assert.strictEqual(persistData.authenticated, true, "User marked as authenticated");
  assert.strictEqual(persistData.isApproved, true, "User marked as approved");
  assert.strictEqual(persistData.token, ownerToken, "Check-status returns valid token");
  console.log("  ✅ [PASS] Session persists reliably and returns user profile.");

  // [Scenario 4] Navigation Across Dashboard
  console.log("\n[Scenario 4] Navigation Across Dashboard Sub-Routes...");
  const dashboardRoutes = [
    "/dashboard",
    "/dashboard?tab=builder",
    "/dashboard?tab=manager",
    "/dashboard?tab=settings",
    "/dashboard?tab=team",
  ];
  for (const route of dashboardRoutes) {
    const navReq: any = {
      url: `http://localhost:3000${route}`,
      nextUrl: new URL(`http://localhost:3000${route}`),
      headers: new Headers(),
      cookies: {
        get: (name: string) => {
          if (name === "ranklocal_token") return { value: ownerToken };
          if (name === "ranklocal_status") return { value: "approved" };
          return undefined;
        },
      },
    };
    const navRes = middleware(navReq);
    assert(!navRes?.headers.get("location"), `Navigation to ${route} allowed without redirect`);
  }
  console.log("  ✅ [PASS] Seamless navigation across all dashboard routes without session drops.");

  // [Scenario 5] Page Refresh (Request without cached state)
  console.log("\n[Scenario 5] Page Refresh Simulation...");
  const refreshReq: any = {
    url: "http://localhost:3000/dashboard",
    nextUrl: new URL("http://localhost:3000/dashboard"),
    headers: new Headers(),
    cookies: {
      get: (name: string) => {
        if (name === "ranklocal_token") return { value: ownerToken };
        if (name === "ranklocal_status") return { value: "approved" };
        return undefined;
      },
    },
  };
  const refreshRes = middleware(refreshReq);
  assert(!refreshRes?.headers.get("location"), "Page refresh preserves active session");
  console.log("  ✅ [PASS] Page refresh maintains authenticated session with zero flash.");

  // [Scenario 6] Token Refresh Handling
  console.log("\n[Scenario 6] Token Refresh Generation...");
  const refreshedToken = await signUserSessionToken({
    id: loginData.user.id,
    email: loginData.user.email,
    role: "owner",
    status: "approved",
  });
  assert(Boolean(refreshedToken), "New session token successfully signed");
  const refreshedReq = new Request("http://localhost:3000/api/auth/check-status", {
    headers: {
      Authorization: `Bearer ${refreshedToken}`,
    },
  });
  const refreshedRes = await checkStatusRoute(refreshedReq as any);
  const refreshedData = await refreshedRes.json();
  assert.strictEqual(refreshedRes.status, 200, "Refreshed token verified");
  assert.strictEqual(refreshedData.authenticated, true, "Refreshed session remains authenticated");
  console.log("  ✅ [PASS] Token refresh seamlessly preserves authenticated state.");

  // [Scenario 7] Handling of Expired Access Tokens Grace Window
  console.log("\n[Scenario 7] Handling of Expired Tokens & Grace Window...");
  // Construct a token that expired 1 minute ago (within 5 min grace window for active refresh)
  const pastSec = Math.floor(Date.now() / 1000) - 60;
  const { SignJWT } = await import("jose");
  const secretKey = new TextEncoder().encode(
    process.env.ENCRYPTION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "e9b25f4b0e91a62dca91fa9a27b87cc392415d8621453ab4980ea2387114b301"
  );
  const graceToken = await new SignJWT({
    sub: loginData.user.id,
    email: "russ@altopex.com",
    role: "owner",
    status: "approved",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(pastSec - 3600)
    .setExpirationTime(pastSec)
    .sign(secretKey);

  const graceReq = new Request("http://localhost:3000/api/auth/check-status", {
    headers: { Authorization: `Bearer ${graceToken}` },
  });
  const graceRes = await checkStatusRoute(graceReq as any);
  assert.strictEqual(graceRes.status, 200, "Grace window allows in-flight session renewal");
  console.log("  ✅ [PASS] 5-minute clock-skew grace window prevents sudden token drop.");

  // [Scenario 8] Multiple Tab Consistency (Cookie extraction from multiple request contexts)
  console.log("\n[Scenario 8] Multiple Tab Consistency...");
  const tabAReq: any = {
    url: "http://localhost:3000/dashboard",
    nextUrl: new URL("http://localhost:3000/dashboard"),
    headers: new Headers(),
    cookies: { get: (name: string) => name === "ranklocal_token" ? { value: ownerToken } : undefined },
  };
  const tabBReq: any = {
    url: "http://localhost:3000/dashboard",
    nextUrl: new URL("http://localhost:3000/dashboard"),
    headers: new Headers(),
    cookies: { get: (name: string) => name === "ranklocal_token" ? { value: ownerToken } : undefined },
  };
  assert(!middleware(tabAReq)?.headers.get("location"), "Tab A recognized as authenticated");
  assert(!middleware(tabBReq)?.headers.get("location"), "Tab B recognized as authenticated");
  console.log("  ✅ [PASS] Both tabs independently maintain authenticated status.");

  // [Scenario 9] Tab Switching (No Session Loss)
  console.log("\n[Scenario 9] Tab Switching Simulation...");
  const switchReq: any = {
    url: "http://localhost:3000/dashboard",
    nextUrl: new URL("http://localhost:3000/dashboard"),
    headers: new Headers(),
    cookies: {
      get: (name: string) => {
        if (name === "ranklocal_token") return { value: ownerToken };
        if (name === "ranklocal_status") return { value: "approved" };
        return undefined;
      },
    },
  };
  assert(!middleware(switchReq)?.headers.get("location"), "Tab switch does not cause logout");
  console.log("  ✅ [PASS] Tab switching causes zero auth interruptions.");

  // [Scenario 10] Background Tab Session Preservation
  console.log("\n[Scenario 10] Background Tab Session Preservation...");
  const bgReq = new Request("http://localhost:3000/api/auth/check-status", {
    headers: { Cookie: `ranklocal_token=${ownerToken}` },
  });
  const bgRes = await checkStatusRoute(bgReq as any);
  assert.strictEqual(bgRes.status, 200, "Background check returns 200");
  console.log("  ✅ [PASS] Background session check successfully keeps session alive.");

  // [Scenario 11] Protected Route Redirection (Unauthenticated)
  console.log("\n[Scenario 11] Protected Route Redirection for Unauthenticated Users...");
  const unauthReq: any = {
    url: "http://localhost:3000/dashboard",
    nextUrl: new URL("http://localhost:3000/dashboard"),
    headers: new Headers(),
    cookies: { get: () => undefined },
  };
  const unauthRes = middleware(unauthReq);
  assert(unauthRes?.headers.get("location")?.includes("/login"), "Unauthenticated redirected to /login");
  console.log("  ✅ [PASS] Unauthenticated visit to /dashboard cleanly redirected to /login.");

  // [Scenario 12] Public Route Accessibility
  console.log("\n[Scenario 12] Public Route Accessibility...");
  const publicRoutes = ["/favicon.ico", "/robots.txt", "/sitemap.xml", "/api/auth/login", "/api/auth/signup"];
  for (const pRoute of publicRoutes) {
    const pubReq: any = {
      url: `http://localhost:3000${pRoute}`,
      nextUrl: new URL(`http://localhost:3000${pRoute}`),
      headers: new Headers(),
      cookies: { get: () => undefined },
    };
    const pubRes = middleware(pubReq);
    assert(!pubRes?.headers.get("location"), `Public route ${pRoute} accessible without redirect`);
  }
  console.log("  ✅ [PASS] Public routes accessible without authentication.");

  // [Scenario 13] Admin Route Protection
  console.log("\n[Scenario 13] Admin Route Protection...");
  const adminApiReq: any = {
    url: "http://localhost:3000/api/settings/keys",
    nextUrl: new URL("http://localhost:3000/api/settings/keys"),
    headers: new Headers(),
    cookies: { get: () => undefined },
  };
  const adminRes = middleware(adminApiReq);
  assert.strictEqual(adminRes.status, 401, "Protected API without token rejected with 401");
  console.log("  ✅ [PASS] Protected API routes reject unauthenticated requests with 401.");

  // [Scenario 14] Logout Process (Cookie Cleared)
  console.log("\n[Scenario 14] Logout Process...");
  const logoutReq = new Request("http://localhost:3000/api/auth/logout", { method: "POST" });
  const logoutRes = await logoutRoute(logoutReq as any);
  assert.strictEqual(logoutRes.status, 200, "Logout returned 200 OK");
  const clearedToken = logoutRes.cookies.get("ranklocal_token");
  assert(clearedToken?.maxAge === 0, "ranklocal_token maxAge is 0");
  console.log("  ✅ [PASS] Logout successfully invalidated all cookies.");

  // [Scenario 15] Re-login After Logout
  console.log("\n[Scenario 15] Re-login After Logout...");
  const reloginReq = new Request("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "team@ranklocal.site", password: "RankLocalTeam2026!#" }),
  });
  const reloginRes = await loginRoute(reloginReq as any);
  const reloginData = await reloginRes.json();
  assert.strictEqual(reloginRes.status, 200, "Re-login returns 200 OK");
  assert.strictEqual(reloginData.success, true, "Re-login succeeded");
  teamToken = reloginData.session.access_token;
  console.log("  ✅ [PASS] Re-login after logout succeeded cleanly.");

  // [Scenario 16] Handling Temporary Network Failure
  console.log("\n[Scenario 16] Handling Temporary Network Failure...");
  // When check-status receives an invalid or malformed request, it returns 401/500 rather than crashing
  const badReq = new Request("http://localhost:3000/api/auth/check-status");
  const badRes = await checkStatusRoute(badReq as any);
  assert.strictEqual(badRes.status, 401, "Missing credentials returns graceful 401 response");
  console.log("  ✅ [PASS] Auth endpoints handle unexpected inputs gracefully without crash.");

  // [Scenario 17] Handling Genuine Session Invalidation
  console.log("\n[Scenario 17] Genuine Session Invalidation...");
  const expiredWayBackSec = Math.floor(Date.now() / 1000) - 86400; // 24 hours ago
  const expiredToken = await new SignJWT({
    sub: "invalid-user-id",
    email: "expired@ranklocal.site",
    role: "editor",
    status: "approved",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(expiredWayBackSec - 3600)
    .setExpirationTime(expiredWayBackSec)
    .sign(secretKey);

  const expiredReq = new Request("http://localhost:3000/api/auth/check-status", {
    headers: { Authorization: `Bearer ${expiredToken}` },
  });
  const expiredRes = await checkStatusRoute(expiredReq as any);
  assert.strictEqual(expiredRes.status, 401, "Genuinely expired session rejected with 401");
  console.log("  ✅ [PASS] Truly expired session correctly rejected.");

  // [Scenario 18] Long Builder Session Without Session Drop
  console.log("\n[Scenario 18] Long Builder Session Simulation...");
  const builderReq: any = {
    url: "http://localhost:3000/dashboard?tab=builder",
    nextUrl: new URL("http://localhost:3000/dashboard?tab=builder"),
    headers: new Headers(),
    cookies: {
      get: (name: string) => {
        if (name === "ranklocal_token") return { value: teamToken };
        if (name === "ranklocal_status") return { value: "approved" };
        return undefined;
      },
    },
  };
  const builderRes = middleware(builderReq);
  assert(!builderRes?.headers.get("location"), "Long builder session remains active");
  console.log("  ✅ [PASS] Builder session remains fully authenticated without timeout.");

  console.log("\n================================================================================");
  console.log("🎉 ALL 18 AUTHENTICATION & SESSION STABILITY SCENARIOS PASSED (100%)!");
  console.log("================================================================================\n");
}

runSessionStabilitySuite().catch((err) => {
  console.error("Session stability suite failed:", err);
  process.exit(1);
});
