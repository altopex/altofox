import { NextRequest, NextResponse } from "next/server";
import { publishWebsite, HostingProviderType } from "@/lib/publishing/publishing-service";
import { tempStorage } from "@/lib/storage/temp-storage";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      provider = "cloudflare",
      projectName,
      projectId,
      files: clientFiles,
      domain,
      credentials,
      customOptions,
    } = body || {};

    if (!projectName || typeof projectName !== "string" || !projectName.trim()) {
      return NextResponse.json(
        { success: false, error: "Project name is required for publishing." },
        { status: 400 }
      );
    }

    // 1. Gather raw website files
    let rawFiles: Array<{ path: string; content: string }> = [];

    if (Array.isArray(clientFiles) && clientFiles.length > 0) {
      rawFiles = clientFiles.map((f: any) => ({
        path: f.path,
        content: typeof f.content === "string" ? f.content : "",
      }));
    } else if (projectId) {
      // Check ephemeral temporary storage first
      const tempProject = tempStorage.get(projectId);
      if (tempProject?.files && tempProject.files.length > 0) {
        rawFiles = tempProject.files.map((f: any) => ({
          path: f.path,
          content: typeof f.content === "string" ? f.content : "",
        }));
      } else {
        // Check SQLite Database
        try {
          const dbProject = await db.project.findUnique({
            where: { id: projectId },
            include: { files: true },
          });
          if (dbProject?.files && dbProject.files.length > 0) {
            rawFiles = dbProject.files.map((f: any) => ({
              path: f.path,
              content: f.content || "",
            }));
          }
        } catch {}
      }
    }

    if (rawFiles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No website files found to publish. Please generate or open a website first.",
        },
        { status: 400 }
      );
    }

    // 2. Call unified publishing service
    const result = await publishWebsite({
      provider: provider as HostingProviderType,
      projectName: projectName.trim(),
      projectId,
      files: rawFiles,
      domain: domain ? domain.trim() : undefined,
      credentials,
      customOptions,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 502 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Hosting Publish Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to publish website.",
      },
      { status: 500 }
    );
  }
}
