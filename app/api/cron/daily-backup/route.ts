import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import JSZip from "jszip";

export const dynamic = "force-dynamic";

/**
 * Scheduled daily backup job.
 * Packages projects modified in the last 24 hours into .siteproject ZIP files
 * and saves them to the private "backups" bucket. Retains the last 30 backups per project.
 */
export async function GET(req: NextRequest) {
  try {
    const admin = getSupabaseAdminClient();

    // Find active projects updated within the last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: projects, error: projErr } = await admin
      .from("projects")
      .select("id, name, updated_at")
      .eq("status", "active")
      .gte("updated_at", yesterday);

    if (projErr) throw projErr;

    const results: any[] = [];

    for (const project of projects || []) {
      try {
        // Fetch project pages
        const { data: pages } = await admin
          .from("pages")
          .select("*")
          .eq("project_id", project.id);

        // Fetch project versions
        const { data: versions } = await admin
          .from("versions")
          .select("*")
          .eq("project_id", project.id)
          .order("created_at", { ascending: false })
          .limit(20);

        // Build backup archive
        const zip = new JSZip();
        const projectData = {
          project,
          pages: pages || [],
          versions: versions || [],
          backedUpAt: new Date().toISOString(),
        };

        zip.file("project.json", JSON.stringify(projectData, null, 2));
        const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

        const dateSlug = new Date().toISOString().split("T")[0];
        const backupFilename = `backup-${dateSlug}-${Date.now()}.siteproject`;
        const storagePath = `${project.id}/${backupFilename}`;

        // Upload to private backups bucket
        const { error: uploadErr } = await admin.storage
          .from("backups")
          .upload(storagePath, zipBuffer, {
            contentType: "application/zip",
            upsert: true,
          });

        if (uploadErr) {
          results.push({ projectId: project.id, success: false, error: uploadErr.message });
          continue;
        }

        // Record in exports table
        await admin.from("exports").insert({
          project_id: project.id,
          type: "backup",
          storage_path: storagePath,
          file_list: (pages || []).map((p) => p.url_path),
        });

        // Prune older backups beyond 30
        const { data: existingBackups } = await admin.storage
          .from("backups")
          .list(project.id, {
            sortBy: { column: "created_at", order: "desc" },
          });

        if (Array.isArray(existingBackups) && existingBackups.length > 30) {
          const toDelete = existingBackups.slice(30).map((f) => `${project.id}/${f.name}`);
          await admin.storage.from("backups").remove(toDelete);
        }

        results.push({
          projectId: project.id,
          name: project.name,
          success: true,
          storagePath,
        });
      } catch (err: any) {
        results.push({ projectId: project.id, success: false, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      backedUpCount: results.filter((r) => r.success).length,
      results,
    });
  } catch (err: any) {
    console.error("[DailyBackup] Job failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
