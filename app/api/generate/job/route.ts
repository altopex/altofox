import { NextRequest, NextResponse } from "next/server";
import { initializeGenerationJob } from "@/lib/pipeline/generation-job";
import { GenerationPipelineInput } from "@/lib/pipeline/pipeline-executor";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body: GenerationPipelineInput & { batchSize?: number } = await req.json();
    const batchSize = typeof body.batchSize === "number" ? body.batchSize : 5;

    const result = await initializeGenerationJob(body, batchSize);

    if (!result.success || !result.job) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to initialize generation job." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      job: result.job,
    });
  } catch (error: any) {
    console.error("[Route /api/generate/job] Error initializing job:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to initialize generation job.",
      },
      { status: 500 }
    );
  }
}
