import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { authenticateServerRequest } from "@/lib/supabase/server";
import { getDbPool } from "@/lib/supabase/db-pool";

export const dynamic = "force-dynamic";

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export async function POST(req: NextRequest) {
  try {
    // 1. Trace and execute authorization middleware
    const auth = await authenticateServerRequest(req);
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to issue team invitations." },
        { status: 401 }
      );
    }

    // 2. Role-Based Access Control (RBAC): Enforce workspace owner permission
    if (!auth.isOwner) {
      return NextResponse.json(
        { error: "Forbidden: Only workspace owners have permission to invite team members." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email, fullName, role = "editor" } = body;

    const cleanEmail = email?.trim().toLowerCase();
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      return NextResponse.json(
        { error: "Please provide a valid, well-formed email address." },
        { status: 400 }
      );
    }

    const assignedRole = role === "owner" ? "owner" : "editor";
    const assignedName = fullName?.trim() || cleanEmail.split("@")[0];
    const pool = getDbPool();

    // 3. Check if user is already registered in the system
    const userCheck = await pool.query(
      `SELECT u.id, u.email, p.role, p.status 
       FROM auth.users u 
       LEFT JOIN public.profiles p ON u.id = p.id 
       WHERE LOWER(u.email) = LOWER($1) 
       LIMIT 1;`,
      [cleanEmail]
    );

    if (userCheck.rows.length > 0) {
      const existingUser = userCheck.rows[0];
      
      // User exists - update profile role & ensure approval
      await pool.query(
        `UPDATE public.profiles 
         SET role = $1, status = 'approved', full_name = COALESCE(NULLIF(full_name, ''), $2), updated_at = now() 
         WHERE id = $3::uuid;`,
        [assignedRole, assignedName, existingUser.id]
      );

      // Sync user metadata
      await pool.query(
        `UPDATE auth.users 
         SET raw_user_meta_data = raw_user_meta_data || json_build_object('role', $1::text, 'status', 'approved')::jsonb,
             updated_at = now()
         WHERE id = $2::uuid;`,
        [assignedRole, existingUser.id]
      );

      // Log activity
      await pool.query(
        `INSERT INTO public.activity_log (user_id, user_name, user_avatar, action, entity_type, entity_id, details)
         VALUES ($1::uuid, $2, $3, 'invite', 'team', $4, $5::jsonb);`,
        [
          auth.user.id,
          auth.profile.full_name || "Owner",
          auth.profile.avatar_url,
          existingUser.id,
          JSON.stringify({
            description: `${auth.profile.full_name || "Owner"} added existing member ${cleanEmail} as ${assignedRole}`,
            invitedEmail: cleanEmail,
            assignedRole,
            existingMember: true,
          }),
        ]
      );

      return NextResponse.json({
        success: true,
        message: `Member ${cleanEmail} is already registered. Role successfully updated to ${assignedRole}.`,
        user: {
          id: existingUser.id,
          email: cleanEmail,
          role: assignedRole,
        },
      });
    }

    // 4. Generate cryptographically secure invitation token with 7-day expiration
    const inviteToken =
      crypto.randomUUID().replace(/-/g, "") + crypto.randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7-day expiration window

    // Store in team_invitations table
    await pool.query(
      `INSERT INTO public.team_invitations (email, full_name, role, token, invited_by, status, expires_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5::uuid, 'pending', $6, now(), now())
       ON CONFLICT (token) DO UPDATE 
       SET role = EXCLUDED.role, expires_at = EXCLUDED.expires_at, updated_at = now();`,
      [cleanEmail, assignedName, assignedRole, inviteToken, auth.user.id, expiresAt.toISOString()]
    );

    // Form invite URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ranklocal.site";
    const inviteUrl = `${siteUrl}/signup?invite=${inviteToken}&email=${encodeURIComponent(cleanEmail)}`;

    // Log to audit activity_log
    await pool.query(
      `INSERT INTO public.activity_log (user_id, user_name, user_avatar, action, entity_type, entity_id, details)
       VALUES ($1::uuid, $2, $3, 'invite', 'team', $4, $5::jsonb);`,
      [
        auth.user.id,
        auth.profile.full_name || "Owner",
        auth.profile.avatar_url,
        inviteToken,
        JSON.stringify({
          description: `${auth.profile.full_name || "Owner"} issued invitation to ${cleanEmail} as ${assignedRole}`,
          invitedEmail: cleanEmail,
          assignedRole,
          expiresAt: expiresAt.toISOString(),
          inviteUrl,
        }),
      ]
    );

    // 5. Return standard HTTP 200 response with invitation details
    return NextResponse.json({
      success: true,
      message: `Invitation successfully sent to ${cleanEmail}`,
      invitation: {
        email: cleanEmail,
        fullName: assignedName,
        role: assignedRole,
        token: inviteToken,
        inviteUrl,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (err: any) {
    console.error("[Team] Invite error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to issue invitation" },
      { status: 500 }
    );
  }
}
