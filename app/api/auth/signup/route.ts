import { NextRequest, NextResponse } from "next/server";
import { getDbPool } from "@/lib/supabase/db-pool";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, fullName, companyName, plan = "starter" } = body;

    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPassword = password || "";
    const cleanFullName = (fullName || "").trim();
    const cleanCompany = (companyName || "").trim();
    const chosenPlan = plan === "agency" ? "agency" : "starter";
    const websiteLimit = chosenPlan === "agency" ? 30 : 5;

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    if (cleanPassword.length < 12) {
      return NextResponse.json(
        { error: "Password must be at least 12 characters long." },
        { status: 400 }
      );
    }

    if (!cleanFullName) {
      return NextResponse.json(
        { error: "Full name is required." },
        { status: 400 }
      );
    }

    const pool = getDbPool();

    // 1. Check if email is already registered
    const existingCheck = await pool.query(
      "SELECT id FROM auth.users WHERE LOWER(email) = LOWER($1) LIMIT 1;",
      [cleanEmail]
    );

    if (existingCheck.rows.length > 0) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please sign in." },
        { status: 409 }
      );
    }

    // 2. Insert into auth.users with email_confirmed_at = now()
    // This auto-confirms the email and completely bypasses Supabase's rate-limited free email provider
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

    // 3. Insert into auth.identities
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

    return NextResponse.json(
      {
        success: true,
        userId: newUserId,
        message: "Account created successfully.",
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[SignUp Route] Error creating user:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create account. Please try again." },
      { status: 500 }
    );
  }
}
