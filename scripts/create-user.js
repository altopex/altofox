import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !secretKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY in environment");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: node scripts/create-user.js <email> [password] [role] [full_name]");
    process.exit(1);
  }
  const password = process.argv[3] || ("Altofox@" + Math.random().toString(36).slice(-8) + "!9A");
  const role = process.argv[4] || "editor";
  const fullName = process.argv[5] || email.split("@")[0];

  console.log(`Creating user: ${email} with role: ${role}...`);

  // 1. Try to create user via admin API
  const { data: createData, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: role,
    },
  });

  let userId = createData?.user?.id;

  if (createError) {
    if (createError.message.includes("already registered") || createError.message.includes("already exists")) {
      console.log(`User ${email} already exists. Updating password and metadata...`);
      // Find user
      const { data: listData } = await supabase.auth.admin.listUsers();
      const existing = listData?.users?.find((u) => u.email === email);
      if (existing) {
        userId = existing.id;
        const { error: updateErr } = await supabase.auth.admin.updateUserById(userId, {
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            role: role,
          },
        });
        if (updateErr) {
          console.error("Failed to update user:", updateErr.message);
          process.exit(1);
        }
      } else {
        console.error("User exists but could not be located via admin list:", createError.message);
        process.exit(1);
      }
    } else {
      console.error("Error creating user:", createError.message);
      process.exit(1);
    }
  }

  // 2. Ensure profile exists and has owner role
  if (userId) {
    const { error: profileErr } = await supabase.from("profiles").upsert(
      {
        id: userId,
        full_name: fullName,
        role: role,
        last_active_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (profileErr) {
      console.warn("Notice updating profile table:", profileErr.message);
    } else {
      console.log(`Profile updated in public.profiles with role = "${role}".`);
    }
  }

  console.log("\n=======================================================");
  console.log(" USER ACCOUNT READY");
  console.log("=======================================================");
  console.log(` Email:    ${email}`);
  console.log(` Password: ${password}`);
  console.log(` Role:     ${role}`);
  console.log(` User ID:  ${userId}`);
  console.log(" Status:   Email confirmed (Instant Login Ready)");
  console.log("=======================================================\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
