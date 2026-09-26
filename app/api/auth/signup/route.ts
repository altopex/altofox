import { NextRequest, NextResponse } from "next/server";
import { getDbPool } from "@/lib/supabase/db-pool";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// RFC 5322 compliant email regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request payload." },
        { status: 400, headers: corsHeaders }
      );
    }

    const { email, password, fullName, companyName, plan = "starter" } = body;

    const cleanEmail = (typeof email === "string" ? email : "").trim().toLowerCase();
    const cleanPassword = typeof password === "string" ? password : "";
    const cleanFullName = (typeof fullName === "string" ? fullName : "").trim();
    const cleanCompany = (typeof companyName === "string" ? companyName : "").trim();
    const chosenPlan = plan === "agency" ? "agency" : "starter";
    const websiteLimit = chosenPlan === "agency" ? 30 : 5;

    // 1. Request Validation
    if (!cleanEmail) {
      return NextResponse.json(
        { error: "Email address is required." },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address (e.g. yourname@company.com)." },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!cleanFullName || cleanFullName.length < 2) {
      return NextResponse.json(
        { error: "Please enter your full name (at least 2 characters)." },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!cleanPassword || cleanPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400, headers: corsHeaders }
      );
    }

    const pool = getDbPool();

    // 2. Check signup_mode from app_settings
    let signupMode = "approval_required";
    let contactEmail = "support@ranklocal.site";
    try {
      const settingsRes = await pool.query(
        "SELECT signup_mode, contact_email FROM public.app_settings LIMIT 1;"
      );
      if (settingsRes.rows.length > 0) {
        if (settingsRes.rows[0].signup_mode) signupMode = settingsRes.rows[0].signup_mode;
        if (settingsRes.rows[0].contact_email) contactEmail = settingsRes.rows[0].contact_email;
      }
    } catch (e) {
      console.warn("[SignUp Route] Could not read app_settings, using defaults:", e);
    }

    if (signupMode === "invite_only") {
      return NextResponse.json(
        { error: `Registration is currently invite-only. Please contact ${contactEmail} for workspace access.` },
        { status: 403, headers: corsHeaders }
      );
    }

    // 3. Check if email is already registered
    const existingCheck = await pool.query(
      "SELECT id FROM auth.users WHERE LOWER(email) = LOWER($1) LIMIT 1;",
      [cleanEmail]
    );

    if (existingCheck.rows.length > 0) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please sign in or reset your password." },
        { status: 409, headers: corsHeaders }
      );
    }

    // 4. Insert into auth.users with Bcrypt hash and auto-confirmed email
    // This auto-confirms the email and completely avoids Supabase's rate-limited free email provider
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
          'plan', $5::text,
          'website_limit', $6::int,
          'email_verified', true
        )::jsonb,
        now(),
        now()
      ) RETURNING id, email;
    `;

    const userRes = await pool.query(insertUserQuery, [
      cleanEmail,
      cleanPassword,
      cleanFullName,
      cleanCompany,
      chosenPlan,
      websiteLimit,
    ]);

    const newUserId = userRes.rows[0].id;

    // 5. Insert into auth.identities
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
      );
    `;

    await pool.query(insertIdentityQuery, [newUserId, cleanEmail]);

    // 6. Query profile status assigned by database trigger
    let userStatus = signupMode === "open" ? "approved" : "pending";
    let userRole = "editor";
    try {
      const profRes = await pool.query(
        "SELECT status, role FROM public.profiles WHERE id = $1::uuid LIMIT 1;",
        [newUserId]
      );
      if (profRes.rows.length > 0) {
        userStatus = profRes.rows[0].status || userStatus;
        userRole = profRes.rows[0].role || userRole;
      }
    } catch (e) {
      console.warn("[SignUp Route] Profile lookup notice:", e);
    }

    // 7. Generate authenticated session using Supabase Auth Client
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://udxjxkkcpdrlceucxqfk.supabase.co";
    const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_0Quf-D6ZTC7-bDorA1UDKQ_5fqv35PA";
    const supabase = createClient(supabaseUrl, supabaseKey);

    let session: any = null;
    let authUser: any = null;

    try {
      const authRes = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (authRes.data?.session) {
        session = authRes.data.session;
        authUser = authRes.data.user;
      }
    } catch (authErr) {
      console.warn("[SignUp Route] Auto-signin notice:", authErr);
    }

    // 8. Prepare JSON response with cookies set
    const response = NextResponse.json(
      {
        success: true,
        userId: newUserId,
        user: authUser || { id: newUserId, email: cleanEmail },
        session,
        status: userStatus,
        role: userRole,
        message: "Account registered successfully.",
      },
      { status: 201, headers: corsHeaders }
    );

    // Set secure authentication cookies if session token exists
    if (session?.access_token) {
      const token = session.access_token;
      response.cookies.set("ranklocal_token", token, {
        path: "/",
        sameSite: "lax",
        maxAge: 604800,
        httpOnly: false,
      });
      response.cookies.set("altofox_token", token, {
        path: "/",
        sameSite: "lax",
        maxAge: 604800,
        httpOnly: false,
      });
      response.cookies.set("ranklocal_status", userStatus, {
        path: "/",
        sameSite: "lax",
        maxAge: 604800,
        httpOnly: false,
      });
      response.cookies.set("altofox_status", userStatus, {
        path: "/",
        sameSite: "lax",
        maxAge: 604800,
        httpOnly: false,
      });
    }

    return response;
  } catch (err: any) {
    console.error("[SignUp Route] Internal error creating user:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create account. Please try again." },
      { status: 500, headers: corsHeaders }
    );
  }
}
