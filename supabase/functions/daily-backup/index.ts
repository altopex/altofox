// Supabase Edge Function: daily-backup
// Invoked by Supabase cron schedule or webhook
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase service environment variables" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find active projects updated in last 24h
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: projects, error: projErr } = await supabase
      .from("projects")
      .select("id, name, updated_at")
      .eq("status", "active")
      .gte("updated_at", yesterday);

    if (projErr) throw projErr;

    const backupResults = [];

    for (const project of projects || []) {
      const { data: pages } = await supabase
        .from("pages")
        .select("*")
        .eq("project_id", project.id);

      const { data: versions } = await supabase
        .from("versions")
        .select("*")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false })
        .limit(20);

      const backupPayload = JSON.stringify({
        project,
        pages: pages || [],
        versions: versions || [],
        backedUpAt: new Date().toISOString(),
      });

      const dateSlug = new Date().toISOString().split("T")[0];
      const filename = `${project.id}/backup-${dateSlug}-${Date.now()}.json`;

      const { error: uploadErr } = await supabase.storage
        .from("backups")
        .upload(filename, backupPayload, {
          contentType: "application/json",
          upsert: true,
        });

      if (!uploadErr) {
        backupResults.push({ projectId: project.id, status: "backed_up", file: filename });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        backedUp: backupResults.length,
        results: backupResults,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
