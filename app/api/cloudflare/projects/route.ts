import { NextResponse } from "next/server";
import { listPagesProjects } from "@/lib/cloudflare/cloudflare-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const projects = await listPagesProjects();
    return NextResponse.json({ success: true, projects });
  } catch (error: any) {
    console.error("[Cloudflare Projects API] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to list Cloudflare projects" },
      { status: 500 }
    );
  }
}
