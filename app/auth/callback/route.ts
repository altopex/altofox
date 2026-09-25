import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  if (code) {
    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      "https://udxjxkkcpdrlceucxqfk.supabase.co";

    const supabaseAnonKey =
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "";

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      const token = data.session.access_token;

      // Check profile status
      const { data: profile } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", data.session.user.id)
        .single();

      const status = profile?.status || "pending";
      const targetPath = status === "approved" ? next : "/pending";
      const response = NextResponse.redirect(new URL(targetPath, req.url));

      response.cookies.set("ranklocal_token", token, {
        path: "/",
        maxAge: 604800,
        sameSite: "lax",
      });
      response.cookies.set("altofox_token", token, {
        path: "/",
        maxAge: 604800,
        sameSite: "lax",
      });
      response.cookies.set("ranklocal_status", status, {
        path: "/",
        maxAge: 604800,
        sameSite: "lax",
      });
      response.cookies.set("altofox_status", status, {
        path: "/",
        maxAge: 604800,
        sameSite: "lax",
      });

      return response;
    }
  }

  // Fallback if code exchange failed
  return NextResponse.redirect(new URL("/login?error=Invalid+or+expired+link", req.url));
}
