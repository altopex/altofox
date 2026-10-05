import { NextRequest, NextResponse } from "next/server";
import { executeJobBatch } from "@/lib/pipeline/generation-job";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobId, blueprint, batchIndex, pageSlugs, verifiedFacts, credentials } = body;

    if (!blueprint || !Array.isArray(pageSlugs) || pageSlugs.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid batch parameters: blueprint and pageSlugs are required." },
        { status: 400 }
      );
    }

    const result = await executeJobBatch({
      jobId,
      blueprint,
      batchIndex: typeof batchIndex === "number" ? batchIndex : 0,
      pageSlugs,
      verifiedFacts: verifiedFacts || {
        businessName: blueprint.businessName,
        trade: blueprint.niche,
        city: blueprint.primaryCity,
        state: blueprint.state,
      },
      credentials,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Route /api/generate/batch] Error executing batch:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to execute batch.",
      },
      { status: 500 }
    );
  }
}
