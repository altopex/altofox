import { NextRequest, NextResponse } from "next/server";
import { finalizeAndAssembleJob } from "@/lib/pipeline/generation-job";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobId, blueprint, allPages, theme, websiteData, options, saveToDb } = body;

    if (!blueprint || !Array.isArray(allPages) || allPages.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid assemble parameters: blueprint and allPages are required." },
        { status: 400 }
      );
    }

    const result = await finalizeAndAssembleJob({
      jobId,
      blueprint,
      allPages,
      theme: theme || blueprint.theme || { id: "modern-pro", name: "Modern Pro" },
      websiteData: websiteData || {
        businessName: blueprint.businessName,
        businessType: blueprint.niche,
        city: blueprint.primaryCity,
      },
      options,
      saveToDb: Boolean(saveToDb),
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to finalize and assemble website." },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Route /api/generate/assemble] Error assembling job:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to finalize and assemble website.",
      },
      { status: 500 }
    );
  }
}
