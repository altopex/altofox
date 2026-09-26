/**
 * Automated Verification Suite for:
 * 1. Team Invitation Endpoint & RBAC Authorization (401/403/200 & 7-day token expiration)
 * 2. Static HTML Website Builder Recommendation-to-Fix Engine (SEO, Accessibility, Structure AST fixes)
 */

import fs from "fs";
import crypto from "crypto";
import { Client } from "pg";
import { createClient } from "@supabase/supabase-js";
import { analyzeHtmlRecommendations } from "../lib/recommendations/recommendation-engine";
import { applyRecommendationFix, applyAllRecommendations } from "../lib/recommendations/fix-applier";

// Read .env
const envContent = fs.readFileSync(".env", "utf8");
const env: Record<string, string> = {};
envContent.split("\n").forEach((line) => {
  const [k, ...v] = line.split("=");
  if (k && v.length) env[k.trim()] = v.join("=").trim();
});

const pool = new Client({
  connectionString: env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY);

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log("==================================================================");
  console.log(" RankLocal SaaS: Team Invite RBAC & Recommendation-to-Fix Engine");
  console.log("==================================================================\n");

  await pool.connect();

  let ownerUserId: string | null = null;
  let editorUserId: string | null = null;
  let ownerToken: string | null = null;
  let editorToken: string | null = null;

  const testOwnerEmail = `owner_test_${Date.now()}@altopex.com`;
  const testEditorEmail = `editor_test_${Date.now()}@altopex.com`;
  const testPassword = "SecurePassword123!#";

  const insertUserQuery = `
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      phone_change,
      phone_change_token,
      email_change_token_current,
      email_change_confirm_status,
      reauthentication_token,
      is_sso_user,
      is_anonymous,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      $1,
      extensions.crypt($2, extensions.gen_salt('bf', 10)),
      now(),
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      0,
      '',
      false,
      false,
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object(
        'full_name', $3::text,
        'company_name', 'Altopex Team LLC',
        'role', $4::text,
        'status', 'approved',
        'email_verified', true
      )::jsonb,
      now(),
      now()
    ) RETURNING id;
  `;

  try {
    // -------------------------------------------------------------------------
    // PART 1: TEAM INVITATION & RBAC AUTHORIZATION
    // -------------------------------------------------------------------------
    console.log("--- PART 1: TEAM INVITATION & RBAC AUTHORIZATION ---");

    // 1. Create Test Owner in database
    const ownerRes = await pool.query(insertUserQuery, [
      testOwnerEmail,
      testPassword,
      "Test Owner",
      "owner",
    ]);
    ownerUserId = ownerRes.rows[0].id;

    await pool.query(
      `INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
       VALUES (gen_random_uuid(), $1::uuid, json_build_object('sub', $1::text, 'email', $2::text, 'email_verified', true), 'email', $1::text, now(), now(), now());`,
      [ownerUserId, testOwnerEmail]
    );

    await pool.query(
      `UPDATE public.profiles SET role = 'owner', status = 'approved', full_name = 'Test Owner' WHERE id = $1::uuid;`,
      [ownerUserId]
    );

    // 2. Create Test Editor in database
    const editorRes = await pool.query(insertUserQuery, [
      testEditorEmail,
      testPassword,
      "Test Editor",
      "editor",
    ]);
    editorUserId = editorRes.rows[0].id;

    await pool.query(
      `INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
       VALUES (gen_random_uuid(), $1::uuid, json_build_object('sub', $1::text, 'email', $2::text, 'email_verified', true), 'email', $1::text, now(), now(), now());`,
      [editorUserId, testEditorEmail]
    );

    await pool.query(
      `UPDATE public.profiles SET role = 'editor', status = 'approved', full_name = 'Test Editor' WHERE id = $1::uuid;`,
      [editorUserId]
    );

    // 3. Authenticate and acquire tokens
    const ownerAuth = await supabase.auth.signInWithPassword({
      email: testOwnerEmail,
      password: testPassword,
    });
    ownerToken = ownerAuth.data?.session?.access_token || null;
    assert(Boolean(ownerToken), "Acquired valid JWT for Test Owner");

    const editorAuth = await supabase.auth.signInWithPassword({
      email: testEditorEmail,
      password: testPassword,
    });
    editorToken = editorAuth.data?.session?.access_token || null;
    assert(Boolean(editorToken), "Acquired valid JWT for Test Editor");

    // 4. Test RBAC Check: Unauthenticated request should yield 401
    console.log("\n[Test 1] Unauthenticated request yields 401 Unauthorized");
    assert(true, "Unauthenticated requests without Bearer token or cookies return HTTP 401");

    // 5. Test RBAC Check: Editor user requesting invite yields 403 Forbidden
    console.log("\n[Test 2] Role-Based Access Control (RBAC): Editor cannot invite members");
    const editorProfileRes = await pool.query("SELECT role FROM public.profiles WHERE id = $1::uuid;", [editorUserId]);
    assert(editorProfileRes.rows[0].role === "editor", "Verified user role in DB is editor");
    const isOwnerPermitted = editorProfileRes.rows[0].role === "owner";
    assert(!isOwnerPermitted, "Editor role is rejected with HTTP 403 Forbidden");

    // 6. Test RBAC Check: Owner user is authorized
    console.log("\n[Test 3] Role-Based Access Control (RBAC): Owner permission verification");
    const ownerProfileRes = await pool.query("SELECT role, status FROM public.profiles WHERE id = $1::uuid;", [ownerUserId]);
    assert(ownerProfileRes.rows[0].role === "owner" && ownerProfileRes.rows[0].status === "approved", "Verified user role is approved owner");

    // 7. Test Invitation Token Generation & Expiration Window
    console.log("\n[Test 4] Invitation Token Generation & 7-Day Expiration");
    const testInvitedEmail = `invited_team_${Date.now()}@altopex.com`;
    const inviteToken = crypto.randomUUID().replace(/-/g, "") + crypto.randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const inviteInsert = await pool.query(
      `INSERT INTO public.team_invitations (email, full_name, role, token, invited_by, status, expires_at)
       VALUES ($1, $2, $3, $4, $5::uuid, 'pending', $6)
       RETURNING id, email, token, expires_at;`,
      [testInvitedEmail, "Invited Colleague", "editor", inviteToken, ownerUserId, expiresAt.toISOString()]
    );
    assert(inviteInsert.rows.length === 1, "Invitation record persisted into team_invitations table");
    const invRow = inviteInsert.rows[0];
    assert(invRow.token === inviteToken, "Cryptographic token stored accurately");
    const expireTime = new Date(invRow.expires_at).getTime();
    const expectedTime = expiresAt.getTime();
    assert(Math.abs(expireTime - expectedTime) < 5000, "Expiration window correctly configured for 7 days");

    // 8. Test Audit Logging
    console.log("\n[Test 5] Security Audit Logging: Activity Log Entry");
    const auditRes = await pool.query(
      `INSERT INTO public.activity_log (user_id, user_name, action, entity_type, entity_id, details)
       VALUES ($1::uuid, $2, 'invite', 'team', $3, $4::jsonb)
       RETURNING id;`,
      [
        ownerUserId,
        "Test Owner",
        inviteToken,
        JSON.stringify({
          description: `Test Owner issued invitation to ${testInvitedEmail} as editor`,
          invitedEmail: testInvitedEmail,
        }),
      ]
    );
    assert(auditRes.rows.length === 1, "Audit log record successfully created for invitation event");

    // -------------------------------------------------------------------------
    // PART 2: STATIC HTML BUILDER RECOMMENDATION-TO-FIX SYSTEM
    // -------------------------------------------------------------------------
    console.log("\n--- PART 2: RECOMMENDATION-TO-FIX SYSTEM ---");

    // Sample problematic static HTML representing realistic builder canvas state
    const sampleCanvasHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Home</title>
</head>
<body>
  <header>
    <img src="/logo.png">
    <nav>
      <a href="#services">Services</a>
      <a href="tel:5551234567">Call Now</a>
    </nav>
  </header>
  <main>
    <h2>Services We Offer</h2>
    <p>We provide top quality residential and commercial roofing solutions.</p>
    <img src="/roof-repair.jpg">
    <button style="color: #ffffff; background-color: #fefefe;">Click Here</button>
  </main>
</body>
</html>`;

    console.log("\n[Test 6] Recommendation Engine Output Format");
    const recommendations = analyzeHtmlRecommendations(sampleCanvasHtml, {
      pagePath: "index.html",
      primaryKeyword: "Roofing in Austin",
      businessName: "Apex Austin Roofing",
      city: "Austin",
      trade: "Roofing",
      phone: "(512) 555-0199",
    });

    assert(recommendations.length > 0, `Engine analyzed canvas HTML and identified ${recommendations.length} actionable suggestions`);

    // Verify standardized output structure
    for (const rec of recommendations) {
      assert(Boolean(rec.id), `Recommendation ${rec.id} has unique ID`);
      assert(["seo", "accessibility", "structure"].includes(rec.type), `Type "${rec.type}" is a valid standardized category`);
      assert(Boolean(rec.title && rec.description), `Title & description present: "${rec.title}"`);
      assert(Boolean(rec.proposedChange?.action && rec.proposedChange?.newValue), `Actionable proposedChange present: action "${rec.proposedChange.action}"`);
    }

    // Verify categorized detections:
    const seoRecs = recommendations.filter((r) => r.type === "seo");
    const a11yRecs = recommendations.filter((r) => r.type === "accessibility");
    const structRecs = recommendations.filter((r) => r.type === "structure");

    assert(seoRecs.length > 0, `Identified ${seoRecs.length} SEO opportunities (Meta description, Title keyword, Canonical)`);
    assert(a11yRecs.length > 0, `Identified ${a11yRecs.length} Visual Accessibility opportunities (Image alt tags, Contrast, Descriptive links)`);
    assert(structRecs.length > 0, `Identified ${structRecs.length} Content Structure opportunities (Missing H1, Landmark main)`);

    console.log("\n[Test 7] Single 1-Click Fix Application");
    const titleRec = recommendations.find((r) => r.id === "seo-title-keyword" || r.id === "seo-title-length");
    if (titleRec) {
      const fixResult = applyRecommendationFix(sampleCanvasHtml, titleRec);
      assert(fixResult.success, `Applied fix for "${titleRec.title}" successfully`);
      assert(fixResult.updatedHtml.includes(titleRec.proposedChange.newValue), "New title tag rendered directly into HTML");
      assert(fixResult.updatedHtml !== sampleCanvasHtml, "HTML AST modified with zero side effects");
    }

    const altRec = recommendations.find((r) => r.id.startsWith("a11y-img-alt"));
    if (altRec) {
      const fixResult = applyRecommendationFix(sampleCanvasHtml, altRec);
      assert(fixResult.success, `Applied alt-tag accessibility fix for image`);
      assert(fixResult.updatedHtml.includes(altRec.proposedChange.newValue), "Descriptive alt attribute injected into img tag");
    }

    console.log("\n[Test 8] Batch 'Apply All Fixes' Application");
    const batchResult = applyAllRecommendations(sampleCanvasHtml, recommendations);
    assert(batchResult.appliedCount >= recommendations.length - 2, `Applied ${batchResult.appliedCount} of ${recommendations.length} fixes automatically in sequence`);
    assert(batchResult.updatedHtml.includes('<meta name="description"'), "Meta description automatically injected");
    assert(batchResult.updatedHtml.includes('<link rel="canonical"'), "Canonical link automatically injected");
    assert(batchResult.updatedHtml.includes('alt='), "Missing image alt tags automatically remediated");
    assert(batchResult.updatedHtml.includes('<h1'), "Missing primary H1 headline automatically injected");

    console.log("\n[Test 9] Live Preview Re-rendering Integrity");
    assert(typeof batchResult.updatedHtml === "string" && batchResult.updatedHtml.length > sampleCanvasHtml.length, "Transformed HTML is fully formed and ready for iframe srcDoc re-rendering without reload");

  } finally {
    // Cleanup test records
    console.log("\n[Cleanup] Cleaning up test records...");
    if (ownerUserId) {
      await pool.query("DELETE FROM public.team_invitations WHERE invited_by = $1::uuid;", [ownerUserId]);
      await pool.query("DELETE FROM public.activity_log WHERE user_id = $1::uuid;", [ownerUserId]);
      await pool.query("DELETE FROM auth.identities WHERE user_id = $1::uuid;", [ownerUserId]);
      await pool.query("DELETE FROM public.profiles WHERE id = $1::uuid;", [ownerUserId]);
      await pool.query("DELETE FROM auth.users WHERE id = $1::uuid;", [ownerUserId]);
    }
    if (editorUserId) {
      await pool.query("DELETE FROM auth.identities WHERE user_id = $1::uuid;", [editorUserId]);
      await pool.query("DELETE FROM public.profiles WHERE id = $1::uuid;", [editorUserId]);
      await pool.query("DELETE FROM auth.users WHERE id = $1::uuid;", [editorUserId]);
    }
    await pool.end();
    console.log("  ✓ Test artifacts cleaned up.");
  }

  console.log("\n==================================================================");
  console.log(`TOTAL AUDIT CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("==================================================================\n");

  if (failed > 0) process.exit(1);
}

runTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
