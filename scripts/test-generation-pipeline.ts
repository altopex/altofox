/**
 * Verification test suite for Centralized Website Generation Pipeline Architecture.
 *
 * Verifies:
 * 1. Complete end-to-end website generation executes all 14 stages:
 *    QUEUED → RESEARCHING → BLUEPRINT_READY → CONTENT_PLANNING → GENERATING_CONTENT →
 *    COLLECTING_IMAGES → BUILDING_PAGES → GENERATING_INTERNAL_LINKS → GENERATING_SEO →
 *    RUNNING_AUDIT → AUTO_FIXING → FINAL_VALIDATION → PACKAGING → READY
 * 2. Every stage records status, progress, start time, end time, duration, and retry capability.
 * 3. Failure states accurately report the failed stage and error without fake progress.
 *    - Validation failure -> FAILED_CONTENT at QUEUED
 *    - Provider auth/key failure -> FAILED_PROVIDER at GENERATING_CONTENT
 * 4. Output website validity: HTML files, sitemap.xml, robots.txt, credits, and quality report.
 */

import {
  executeGenerationPipeline,
  GenerationPipelineInput,
} from "../lib/pipeline/pipeline-executor";
import {
  GENERATION_STAGES,
  GenerationPipelineTracker,
  GenerationStageName,
} from "../lib/pipeline/generation-pipeline";

async function runTestSuite() {
  console.log("===============================================================================");
  console.log("   RANKLOCAL 2.0: GENERATION PIPELINE ARCHITECTURE VERIFICATION TEST");
  console.log("===============================================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, msg: string) {
    totalTests++;
    if (!condition) {
      console.error(`❌ FAILED: ${msg}`);
      throw new Error(`Assertion failed: ${msg}`);
    } else {
      console.log(`✅ PASSED: ${msg}`);
      passedTests++;
    }
  }

  // =========================================================================
  // TEST 1: Full End-to-End Generation Pipeline Run
  // =========================================================================
  console.log("\n--- TEST 1: Complete 14-Stage End-to-End Website Generation ---");
  const testInput: GenerationPipelineInput = {
    businessName: "Summit Peak Plumbing",
    businessType: "Plumbing",
    city: "Denver",
    targetLocation: "Denver",
    formData: {
      businessName: "Summit Peak Plumbing",
      businessType: "Plumbing",
      city: "Denver",
      stateRegion: "CO",
      phone: "(303) 555-0199",
      email: "info@summitpeakplumbing.com",
      streetAddress: "1200 17th St",
      services: [
        "Emergency Plumbing",
        "Drain Cleaning",
        "Water Heater Repair",
        "Pipe Replacement",
        "Leak Detection",
      ],
      serviceAreas: "Denver, Aurora, Lakewood, Littleton, Arvada",
      keywords: "plumber Denver, emergency plumbing Denver, drain cleaning, water heater repair",
      yearsInBusiness: "15",
      licenseNumber: "CO-PL-88392",
      emergency247: true,
      freeEstimates: true,
      insuredBonded: true,
      theme: { id: "pipe-and-wrench" },
    },
    demo: true, // Use deterministic archetype generators to test local speed and stability
  };

  const tracker = new GenerationPipelineTracker();
  const stagesEncountered: GenerationStageName[] = [];
  const progressLogs: Array<{ stage: string; progress: number }> = [];

  tracker["onUpdate"] = (state, event) => {
    if (event.type === "stage_start") {
      stagesEncountered.push(event.stage);
    }
    progressLogs.push({ stage: event.stage, progress: event.progress });
  };

  const startTime = Date.now();
  const result = await executeGenerationPipeline(testInput, tracker);
  const totalDuration = Date.now() - startTime;

  console.log(`\nGeneration completed in ${totalDuration}ms`);
  assert(result.success === true, "Pipeline execution succeeded");
  assert(Boolean(result.projectId), `Project ID assigned: ${result.projectId}`);
  assert(Boolean(result.pipeline), "Pipeline state returned in result");
  assert(result.pipeline.status === "completed", "Overall pipeline status is 'completed'");
  assert(result.pipeline.overallProgress === 100, "Final overall progress reached 100%");
  assert(result.pipeline.currentStage === "READY", "Current stage is 'READY'");

  console.log("\nVerifying Stage Execution & Timing Records:");
  for (const stageName of GENERATION_STAGES) {
    const stage = result.pipeline.stages[stageName];
    assert(Boolean(stage), `Stage record exists for ${stageName}`);
    assert(stage.status === "completed", `Stage ${stageName} status is 'completed'`);
    assert(stage.progress > 0, `Stage ${stageName} progress is positive (${stage.progress}%)`);
    assert(typeof stage.startTime === "number", `Stage ${stageName} has startTime (${stage.startTime})`);
    assert(typeof stage.endTime === "number", `Stage ${stageName} has endTime (${stage.endTime})`);
    assert((stage.durationMs ?? 0) >= 0, `Stage ${stageName} has non-negative durationMs (${stage.durationMs}ms)`);
    console.log(
      `   [${stageName.padEnd(25)}] status: ${stage.status} | progress: ${String(stage.progress).padStart(3)}% | duration: ${stage.durationMs}ms | msg: "${stage.message || ""}"`
    );
  }

  // Verify generated assets
  console.log("\nVerifying Generated Assets:");
  assert(Array.isArray(result.files) && result.files.length > 0, `Files generated: ${result.files?.length}`);
  const htmlFiles = result.files?.filter((f) => f.path.endsWith(".html")) || [];
  assert(htmlFiles.length >= 7, `At least 7 HTML pages generated (got ${htmlFiles.length})`);
  assert(result.files?.some((f) => f.path === "index.html"), "index.html exists");
  assert(result.files?.some((f) => f.path === "sitemap.xml"), "sitemap.xml exists");
  assert(result.files?.some((f) => f.path === "robots.txt"), "robots.txt exists");
  assert(result.files?.some((f) => f.path === "images/CREDITS.txt"), "images/CREDITS.txt exists");
  assert(Boolean(result.blueprint), "Site blueprint attached to result");
  assert(Boolean(result.qualityReport), `Quality report attached (score: ${result.qualityReport?.overallScore})`);

  // =========================================================================
  // TEST 2: Validation Failure at Stage 1 (QUEUED → FAILED_CONTENT)
  // =========================================================================
  console.log("\n--- TEST 2: Input Validation Failure Handling (QUEUED → FAILED_CONTENT) ---");
  const invalidInput: GenerationPipelineInput = {
    businessName: "", // Missing required field
    businessType: "Plumbing",
    city: "Denver",
  };

  const failTracker1 = new GenerationPipelineTracker();
  const failResult1 = await executeGenerationPipeline(invalidInput, failTracker1);

  assert(failResult1.success === false, "Execution failed as expected for empty businessName");
  assert(failResult1.failedStage === "FAILED_CONTENT", `Failure stage reported correctly as FAILED_CONTENT (got ${failResult1.failedStage})`);
  assert(failResult1.pipeline.status === "failed", "Pipeline status is 'failed'");
  assert(failResult1.pipeline.currentStage === "FAILED_CONTENT", "Pipeline currentStage is 'FAILED_CONTENT'");
  assert(failResult1.pipeline.activeStageName === "QUEUED", "Failed stage is accurately reported as 'QUEUED'");
  assert(failResult1.pipeline.stages.QUEUED.status === "failed", "QUEUED stage status is 'failed'");
  assert(failResult1.pipeline.stages.QUEUED.canRetry === true, "QUEUED validation failure is marked canRetry = true");
  assert(Boolean(failResult1.pipeline.failure), "Failure details recorded in pipeline state");
  console.log(`   Failure reason: "${failResult1.error}"`);

  // =========================================================================
  // TEST 3: Provider Failure Handling (GENERATING_CONTENT → FAILED_PROVIDER)
  // =========================================================================
  console.log("\n--- TEST 3: Provider Key Missing Handling (GENERATING_CONTENT → FAILED_PROVIDER) ---");
  const noKeyInput: GenerationPipelineInput = {
    businessName: "Acme Electric",
    businessType: "Electrician",
    city: "Seattle",
    targetLocation: "Seattle",
    formData: {
      businessName: "Acme Electric",
      businessType: "Electrician",
      city: "Seattle",
      keywords: "electrician seattle",
    },
    provider: "anthropic", // Explicit provider without key
    apiKey: "", // No key provided
    demo: false, // Disallow demo bypass
  };

  // Temporarily clear any ANTHROPIC_API_KEY environment variable if present
  const originalAnthropicKey = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;

  try {
    const failTracker2 = new GenerationPipelineTracker();
    const failResult2 = await executeGenerationPipeline(noKeyInput, failTracker2);

    assert(failResult2.success === false, "Execution failed as expected without API key");
    assert(failResult2.failedStage === "FAILED_PROVIDER", `Reported failure stage as FAILED_PROVIDER (got ${failResult2.failedStage})`);
    assert(failResult2.pipeline.status === "failed", "Pipeline status is 'failed'");
    assert(failResult2.pipeline.currentStage === "FAILED_PROVIDER", "Pipeline currentStage is 'FAILED_PROVIDER'");
    assert(failResult2.pipeline.activeStageName === "GENERATING_CONTENT", "Failed stage is accurately reported as 'GENERATING_CONTENT'");
    assert(failResult2.pipeline.stages.GENERATING_CONTENT.status === "failed", "GENERATING_CONTENT status is 'failed'");
    assert(failResult2.canFallbackToTemplates === true, "canFallbackToTemplates is true on provider key failure");
    console.log(`   Provider failure message: "${failResult2.error}"`);
  } finally {
    if (originalAnthropicKey) {
      process.env.ANTHROPIC_API_KEY = originalAnthropicKey;
    }
  }

  // =========================================================================
  // TEST 4: executeStage helper method verification
  // =========================================================================
  console.log("\n--- TEST 4: GenerationPipelineTracker.executeStage Helper Verification ---");
  const testTracker = new GenerationPipelineTracker();

  // Test success path
  const successVal = await testTracker.executeStage(
    "RESEARCHING",
    "FAILED_CONTENT",
    async () => {
      await new Promise((r) => setTimeout(r, 10));
      return 42;
    },
    { message: "Testing helper execution" }
  );
  assert(successVal === 42, "executeStage returns successful value");
  const researchingStage = testTracker.getStage("RESEARCHING");
  assert(researchingStage?.status === "completed", "executeStage completed the stage");
  assert((researchingStage?.durationMs ?? 0) >= 10, `Duration tracked accurately (${researchingStage?.durationMs}ms)`);

  // Test failure path
  let caughtError: any = null;
  try {
    await testTracker.executeStage(
      "GENERATING_SEO",
      "FAILED_SEO",
      async () => {
        throw new Error("Simulated SEO failure");
      },
      { canRetry: true }
    );
  } catch (err: any) {
    caughtError = err;
  }
  assert(caughtError !== null, "executeStage throws on failure");
  assert(caughtError.name === "PipelineStageError", "Threw PipelineStageError instance");
  assert(caughtError.stage === "GENERATING_SEO", "Error has correct stage 'GENERATING_SEO'");
  assert(caughtError.failureStage === "FAILED_SEO", "Error has correct failureStage 'FAILED_SEO'");
  assert(testTracker.getState().status === "failed", "Tracker transitioned to 'failed'");
  assert(testTracker.getState().currentStage === "FAILED_SEO", "Current stage is 'FAILED_SEO'");

  console.log("\n===============================================================================");
  console.log(`   ALL TESTS PASSED: ${passedTests}/${totalTests} assertions verified successfully!`);
  console.log("===============================================================================\n");
}

runTestSuite().catch((err) => {
  console.error("Test suite encountered fatal error:", err);
  process.exit(1);
});
