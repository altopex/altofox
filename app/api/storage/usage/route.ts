import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient, authenticateServerRequest } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    // Even if not logged in yet or checking from dashboard, admin client can report
    const admin = getSupabaseAdminClient();

    let totalBytes = 0;

    // List objects in site-assets
    const { data: assetFiles } = await admin.storage.from("site-assets").list("", {
      limit: 1000,
      sortBy: { column: "created_at", order: "desc" },
    });

    if (Array.isArray(assetFiles)) {
      for (const f of assetFiles) {
        if (f.metadata?.size) totalBytes += Number(f.metadata.size);
      }
    }

    // List objects in backups
    const { data: backupFiles } = await admin.storage.from("backups").list("", {
      limit: 1000,
    });

    if (Array.isArray(backupFiles)) {
      for (const f of backupFiles) {
        if (f.metadata?.size) totalBytes += Number(f.metadata.size);
      }
    }

    const limitBytes = 1024 * 1024 * 1024; // 1 GB
    const percentUsed = Math.min(100, Math.round((totalBytes / limitBytes) * 100));
    const usedMB = (totalBytes / (1024 * 1024)).toFixed(1);

    return NextResponse.json({
      usedBytes: totalBytes,
      limitBytes,
      usedFormatted: `${usedMB} MB`,
      percentUsed,
      isNearLimit: percentUsed >= 80,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        usedBytes: 0,
        limitBytes: 1024 * 1024 * 1024,
        usedFormatted: "0 MB",
        percentUsed: 0,
        isNearLimit: false,
        error: err.message,
      },
      { status: 200 }
    );
  }
}
