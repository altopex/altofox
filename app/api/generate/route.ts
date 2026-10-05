import { NextRequest, NextResponse } from "next/server";
import {
  executeGenerationPipeline,
  GenerationPipelineInput,
} from "@/lib/pipeline/pipeline-executor";
import { GenerationPipelineTracker } from "@/lib/pipeline/generation-pipeline";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const tracker = new GenerationPipelineTracker();

  try {
    const body: GenerationPipelineInput = await req.json();
    const result = await executeGenerationPipeline(body, tracker);

    if (!result.success) {
      let status = 500;
      if (result.failedStage === "FAILED_CONTENT") {
        status = 400;
      } else if (result.failedStage === "FAILED_PROVIDER") {
        status = result.isAuthError ? 401 : 400;
      } else if (
        result.failedStage === "FAILED_IMAGE" ||
        result.failedStage === "FAILED_RENDER" ||
        result.failedStage === "FAILED_LINKING" ||
        result.failedStage === "FAILED_SEO" ||
        result.failedStage === "FAILED_AUDIT" ||
        result.failedStage === "FAILED_PACKAGE"
      ) {
        status = 500;
      }

      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Route /api/generate] Uncaught error during generation pipeline:", error);
    const activeStage = tracker.getState().activeStageName;
    const errMsg = error instanceof Error ? error.message : "Failed to generate website.";
    tracker.failStage(activeStage, "FAILED_RENDER", errMsg, false);

    return NextResponse.json(
      {
        success: false,
        failedStage: "FAILED_RENDER",
        error: errMsg,
        pipeline: tracker.getState(),
      },
      { status: 500 }
    );
  }
}
