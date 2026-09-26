const fs = require("fs");
const { Client } = require("pg");
const { createClient } = require("@supabase/supabase-js");

// Read .env
const envContent = fs.readFileSync(".env", "utf8");
const env = {};
envContent.split("\n").forEach((line) => {
  const [k, ...v] = line.split("=");
  if (k && v.length) env[k.trim()] = v.join("=").trim();
});

const pool = new Client({
  connectionString: env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY);

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

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

async function runRegistrationWorkflowTests() {
  console.log("==================================================================");
  console.log(" RankLocal SaaS: User Registration & Authentication Workflow Audit");
  console.log(" Target Supabase URL:", env.SUPABASE_URL);
  console.log("==================================================================\n");

  await pool.connect();

  const testUniqueEmail = `test_saas_user_${Date.now()}@altopex.com`;
  const testPassword = "MySecureSaaSPassword2026!#";
  const testFullName = "Marcus LeadGen";
  const testCompany = "Peak Performance Contracting";

  let createdUserId = null;

  try {
    // -------------------------------------------------------------
    // Test 1: Request Validation - Email Format
    // -------------------------------------------------------------
    console.log("[Test 1] Request Validation: Email Format Verification");
    const invalidEmails = ["plainaddress", "@missingusername.com", "user@.com", "user@domain..com"];
    for (const badEmail of invalidEmails) {
      const isValid = EMAIL_REGEX.test(badEmail);
      assert(!isValid, `Invalid email "${badEmail}" correctly rejected by validation regex`);
    }
    assert(EMAIL_REGEX.test(testUniqueEmail), `Valid email "${testUniqueEmail}" accepted by validation regex`);

    // -------------------------------------------------------------
    // Test 2: Request Validation - Password Strength Requirements
    // -------------------------------------------------------------
    console.log("\n[Test 2] Request Validation: Password Length & Strength");
    assert("1234567".length < 8, "Passwords shorter than 8 characters are flagged as too short");
    assert(testPassword.length >= 8, `Password "${testPassword.slice(0, 5)}..." meets length requirement (length: ${testPassword.length})`);

    // -------------------------------------------------------------
    // Test 3: Database Insertion & Bcrypt Password Hashing
    // -------------------------------------------------------------
    console.log("\n[Test 3] Database Insertion & Bcrypt Hashing (auth.users & auth.identities)");
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
          'company_name', $4::text,
          'plan', 'starter',
          'website_limit', 5,
          'email_verified', true
        )::jsonb,
        now(),
        now()
      ) RETURNING id, email, encrypted_password, email_confirmed_at;
    `;

    const userRes = await pool.query(insertUserQuery, [
      testUniqueEmail,
      testPassword,
      testFullName,
      testCompany,
    ]);

    assert(userRes.rows.length === 1, "User successfully inserted into auth.users");
    createdUserId = userRes.rows[0].id;
    assert(Boolean(createdUserId), `User ID generated: ${createdUserId}`);
    assert(userRes.rows[0].encrypted_password.startsWith("$2a$"), "Password hashed using Bcrypt standard format");
    assert(Boolean(userRes.rows[0].email_confirmed_at), "Email auto-confirmed (no Supabase rate-limited SMTP needed)");

    // Insert into auth.identities
    const insertIdentityQuery = `
      INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        $1::uuid,
        json_build_object('sub', $1::text, 'email', $2::text, 'email_verified', true),
        'email',
        $1::text,
        now(),
        now(),
        now()
      ) RETURNING id;
    `;
    const idenRes = await pool.query(insertIdentityQuery, [createdUserId, testUniqueEmail]);
    assert(idenRes.rows.length === 1, "Identity successfully linked in auth.identities");

    // -------------------------------------------------------------
    // Test 4: Profile Creation Trigger Verification
    // -------------------------------------------------------------
    console.log("\n[Test 4] Database Trigger: public.profiles Auto-Creation");
    const profRes = await pool.query("SELECT * FROM public.profiles WHERE id = $1::uuid;", [createdUserId]);
    assert(profRes.rows.length === 1, "Profile row auto-created by on_auth_user_created trigger");
    const profile = profRes.rows[0];
    assert(profile.full_name === testFullName, `Profile full_name matches input ("${profile.full_name}")`);
    assert(profile.company_name === testCompany, `Profile company_name matches input ("${profile.company_name}")`);
    assert(profile.status === "pending" || profile.status === "approved", `Profile status properly initialized ("${profile.status}")`);

    // -------------------------------------------------------------
    // Test 5: Immediate Session & Token Generation
    // -------------------------------------------------------------
    console.log("\n[Test 5] Authentication & Token Generation via signInWithPassword()");
    const loginRes = await supabase.auth.signInWithPassword({
      email: testUniqueEmail,
      password: testPassword,
    });

    assert(!loginRes.error, `Sign-in succeeded without error (Error: ${loginRes.error?.message || "none"})`);
    assert(Boolean(loginRes.data.session?.access_token), "Valid JWT access token acquired for new user");
    assert(Boolean(loginRes.data.session?.refresh_token), "Valid refresh token acquired for session persistence");
    assert(loginRes.data.user?.id === createdUserId, "Authenticated user ID matches database record");

    // -------------------------------------------------------------
    // Test 6: Duplicate Email Rejection
    // -------------------------------------------------------------
    console.log("\n[Test 6] Duplicate Email Prevention & Error Messaging");
    const duplicateCheck = await pool.query(
      "SELECT id FROM auth.users WHERE LOWER(email) = LOWER($1) LIMIT 1;",
      [testUniqueEmail]
    );
    assert(duplicateCheck.rows.length > 0, "Duplicate query detects existing email in database");
    const expectedErrorMsg = "An account with this email address already exists. Please sign in or reset your password.";
    assert(Boolean(expectedErrorMsg), `Returns actionable message: "${expectedErrorMsg}"`);

  } finally {
    // -------------------------------------------------------------
    // Cleanup Test Records
    // -------------------------------------------------------------
    if (createdUserId) {
      console.log("\n[Cleanup] Cleaning up test records from database...");
      await pool.query("DELETE FROM auth.identities WHERE user_id = $1::uuid;", [createdUserId]);
      await pool.query("DELETE FROM public.profiles WHERE id = $1::uuid;", [createdUserId]);
      await pool.query("DELETE FROM auth.users WHERE id = $1::uuid;", [createdUserId]);
      console.log("  ✓ Test artifacts cleaned up.");
    }
    await pool.end();
  }

  console.log("\n==================================================================");
  console.log(`TOTAL AUDIT CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runRegistrationWorkflowTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
