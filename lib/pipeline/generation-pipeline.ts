/**
 * Centralized Website Generation Pipeline Architecture
 *
 * Implements a strict, observable, and resilient state machine for website generation:
 *
 *   QUEUED
 *   → RESEARCHING
 *   → BLUEPRINT_READY
 *   → CONTENT_PLANNING
 *   → GENERATING_CONTENT
 *   → COLLECTING_IMAGES
 *   → BUILDING_PAGES
 *   → GENERATING_INTERNAL_LINKS
 *   → GENERATING_SEO
 *   → RUNNING_AUDIT
 *   → AUTO_FIXING
 *   → FINAL_VALIDATION
 *   → PACKAGING
 *   → READY
 *
 * Supported Failure States:
 *   - FAILED_PROVIDER
 *   - FAILED_CONTENT
 *   - FAILED_IMAGE
 *   - FAILED_RENDER
 *   - FAILED_LINKING
 *   - FAILED_SEO
 *   - FAILED_AUDIT
 *   - FAILED_PACKAGE
 *
 * Every stage tracks: status, progress, startTime, endTime, error, and retry capability.
 * No fake progress. Honest stage reporting.
 */

export const GENERATION_STAGES = [
  "QUEUED",
  "RESEARCHING",
  "BLUEPRINT_READY",
  "CONTENT_PLANNING",
  "GENERATING_CONTENT",
  "COLLECTING_IMAGES",
  "BUILDING_PAGES",
  "GENERATING_INTERNAL_LINKS",
  "GENERATING_SEO",
  "RUNNING_AUDIT",
  "AUTO_FIXING",
  "FINAL_VALIDATION",
  "PACKAGING",
  "READY",
] as const;

export type GenerationStageName = (typeof GENERATION_STAGES)[number];

export type GenerationFailureStage =
  | "FAILED_PROVIDER"
  | "FAILED_CONTENT"
  | "FAILED_IMAGE"
  | "FAILED_RENDER"
  | "FAILED_LINKING"
  | "FAILED_SEO"
  | "FAILED_AUDIT"
  | "FAILED_PACKAGE";

export type StageExecutionStatus = "pending" | "running" | "completed" | "failed" | "skipped";

export interface PipelineStageRecord {
  name: GenerationStageName;
  label: string;
  status: StageExecutionStatus;
  progress: number; // 0 - 100
  startTime?: number;
  endTime?: number;
  durationMs?: number;
  error?: string;
  retryCount?: number;
  canRetry?: boolean;
  message?: string;
}

export interface PipelineFailureDetails {
  failureStage: GenerationFailureStage;
  failedAtStage: GenerationStageName;
  error: string;
  canRetry: boolean;
  timestamp: number;
}

export interface PipelineState {
  id: string;
  currentStage: GenerationStageName | GenerationFailureStage;
  activeStageName: GenerationStageName;
  status: "idle" | "running" | "completed" | "failed";
  overallProgress: number; // 0 - 100
  stages: Record<GenerationStageName, PipelineStageRecord>;
  startedAt: number;
  completedAt?: number;
  durationMs?: number;
  failure?: PipelineFailureDetails;
}

export const STAGE_CONFIG: Record<
  GenerationStageName,
  { label: string; defaultPercent: number; description: string }
> = {
  QUEUED: {
    label: "Queued",
    defaultPercent: 5,
    description: "Validating input parameters and queueing generation request",
  },
  RESEARCHING: {
    label: "Researching",
    defaultPercent: 12,
    description: "Analyzing trade niche, service areas, and local search intent",
  },
  BLUEPRINT_READY: {
    label: "Blueprint Ready",
    defaultPercent: 20,
    description: "Determining page architecture and structural layout strategy",
  },
  CONTENT_PLANNING: {
    label: "Content Planning",
    defaultPercent: 28,
    description: "Structuring section schemas, prompts, and conversion constraints",
  },
  GENERATING_CONTENT: {
    label: "Generating Copy",
    defaultPercent: 48,
    description: "Generating conversion copy and structured content via AI Gateway",
  },
  COLLECTING_IMAGES: {
    label: "Collecting Images",
    defaultPercent: 60,
    description: "Resolving and deduplicating high-relevance trade photography",
  },
  BUILDING_PAGES: {
    label: "Building Pages",
    defaultPercent: 72,
    description: "Assembling semantic HTML sections and theme design tokens",
  },
  GENERATING_INTERNAL_LINKS: {
    label: "Internal Linking",
    defaultPercent: 80,
    description: "Wiring service silos, location hubs, and contextual navigation",
  },
  GENERATING_SEO: {
    label: "Generating SEO",
    defaultPercent: 86,
    description: "Compiling meta tags, sitemap.xml, robots.txt, and LocalBusiness schema",
  },
  RUNNING_AUDIT: {
    label: "Running Audit",
    defaultPercent: 91,
    description: "Auditing on-page SEO, heading hierarchy, and mobile viewport readiness",
  },
  AUTO_FIXING: {
    label: "Auto-Fixing",
    defaultPercent: 95,
    description: "Applying programmatic improvements for thin copy and missing alt tags",
  },
  FINAL_VALIDATION: {
    label: "Final Validation",
    defaultPercent: 98,
    description: "Scanning for placeholder tokens and validating static files",
  },
  PACKAGING: {
    label: "Packaging",
    defaultPercent: 99,
    description: "Registering static project bundle and generating preview assets",
  },
  READY: {
    label: "Ready",
    defaultPercent: 100,
    description: "Static website generated successfully and ready for preview",
  },
};

/**
 * Creates an initial clean pipeline state tracking all 14 stages.
 */
export function createInitialPipelineState(id?: string): PipelineState {
  const pipelineId = id || `pipe-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = Date.now();

  const stages = {} as Record<GenerationStageName, PipelineStageRecord>;
  for (const name of GENERATION_STAGES) {
    stages[name] = {
      name,
      label: STAGE_CONFIG[name].label,
      status: "pending",
      progress: 0,
      retryCount: 0,
      canRetry: false,
    };
  }

  return {
    id: pipelineId,
    currentStage: "QUEUED",
    activeStageName: "QUEUED",
    status: "idle",
    overallProgress: 0,
    stages,
    startedAt: now,
  };
}

export type PipelineEventCallback = (state: PipelineState, event: {
  type: "stage_start" | "stage_progress" | "stage_complete" | "stage_failed" | "pipeline_complete";
  stage: GenerationStageName;
  message?: string;
  progress: number;
}) => void;

export class PipelineStageError extends Error {
  public stage: GenerationStageName;
  public failureStage: GenerationFailureStage;
  public canRetry: boolean;
  public originalError?: any;

  constructor(
    message: string,
    stage: GenerationStageName,
    failureStage: GenerationFailureStage,
    canRetry = false,
    originalError?: any
  ) {
    super(message);
    this.name = "PipelineStageError";
    this.stage = stage;
    this.failureStage = failureStage;
    this.canRetry = canRetry;
    this.originalError = originalError;
  }
}

/**
 * Observable Pipeline Execution Tracker.
 */
export class GenerationPipelineTracker {
  private state: PipelineState;
  private onUpdate?: PipelineEventCallback;

  constructor(id?: string, onUpdate?: PipelineEventCallback) {
    this.state = createInitialPipelineState(id);
    this.onUpdate = onUpdate;
  }

  public getState(): PipelineState {
    return { ...this.state };
  }

  public getStage(name: GenerationStageName): PipelineStageRecord | undefined {
    return this.state.stages[name];
  }

  public async executeStage<T>(
    name: GenerationStageName,
    failureStage: GenerationFailureStage,
    fn: () => Promise<T> | T,
    options?: { message?: string; targetProgress?: number; canRetry?: boolean }
  ): Promise<T> {
    this.startStage(name, options?.message, options?.targetProgress);
    try {
      const result = await fn();
      this.completeStage(name);
      return result;
    } catch (err: any) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const canRetry = options?.canRetry ?? false;
      this.failStage(name, failureStage, errorMsg, canRetry);
      throw new PipelineStageError(errorMsg, name, failureStage, canRetry, err);
    }
  }

  public startStage(name: GenerationStageName, message?: string, targetProgress?: number): void {
    const now = Date.now();
    if (this.state.status === "idle") {
      this.state.status = "running";
      this.state.startedAt = now;
    }

    this.state.currentStage = name;
    this.state.activeStageName = name;
    const progress = targetProgress ?? STAGE_CONFIG[name].defaultPercent;
    this.state.overallProgress = Math.max(this.state.overallProgress, progress);

    const stageRec = this.state.stages[name];
    stageRec.status = "running";
    stageRec.startTime = now;
    stageRec.progress = progress;
    stageRec.message = message || STAGE_CONFIG[name].description;

    this.notify({
      type: "stage_start",
      stage: name,
      message: stageRec.message,
      progress: this.state.overallProgress,
    });
  }

  public updateProgress(name: GenerationStageName, progressPercent: number, message?: string): void {
    const stageRec = this.state.stages[name];
    if (stageRec) {
      stageRec.progress = Math.max(stageRec.progress, progressPercent);
      if (message) stageRec.message = message;
    }

    this.state.overallProgress = Math.max(this.state.overallProgress, progressPercent);

    this.notify({
      type: "stage_progress",
      stage: name,
      message: message || stageRec?.message,
      progress: this.state.overallProgress,
    });
  }

  public completeStage(name: GenerationStageName, message?: string): void {
    const now = Date.now();
    const stageRec = this.state.stages[name];
    if (stageRec) {
      stageRec.status = "completed";
      stageRec.endTime = now;
      if (stageRec.startTime) {
        stageRec.durationMs = now - stageRec.startTime;
      }
      stageRec.progress = STAGE_CONFIG[name].defaultPercent;
      if (message) stageRec.message = message;
    }

    this.notify({
      type: "stage_complete",
      stage: name,
      message: message || stageRec?.message,
      progress: this.state.overallProgress,
    });
  }

  public failStage(
    name: GenerationStageName,
    failureStage: GenerationFailureStage,
    error: string,
    canRetry = false
  ): void {
    const now = Date.now();
    this.state.status = "failed";
    this.state.currentStage = failureStage;
    this.state.activeStageName = name;

    const stageRec = this.state.stages[name];
    if (stageRec) {
      stageRec.status = "failed";
      stageRec.endTime = now;
      if (stageRec.startTime) {
        stageRec.durationMs = now - stageRec.startTime;
      }
      stageRec.error = error;
      stageRec.canRetry = canRetry;
    }

    this.state.failure = {
      failureStage,
      failedAtStage: name,
      error,
      canRetry,
      timestamp: now,
    };

    this.notify({
      type: "stage_failed",
      stage: name,
      message: error,
      progress: this.state.overallProgress,
    });
  }

  public completePipeline(): void {
    const now = Date.now();
    this.state.status = "completed";
    this.state.currentStage = "READY";
    this.state.activeStageName = "READY";
    this.state.overallProgress = 100;
    this.state.completedAt = now;
    this.state.durationMs = now - this.state.startedAt;

    const readyStage = this.state.stages.READY;
    readyStage.status = "completed";
    readyStage.progress = 100;
    readyStage.startTime = now;
    readyStage.endTime = now;
    readyStage.durationMs = 0;

    this.notify({
      type: "pipeline_complete",
      stage: "READY",
      message: "Website generation pipeline completed successfully.",
      progress: 100,
    });
  }

  private notify(event: {
    type: "stage_start" | "stage_progress" | "stage_complete" | "stage_failed" | "pipeline_complete";
    stage: GenerationStageName;
    message?: string;
    progress: number;
  }): void {
    if (this.onUpdate) {
      try {
        this.onUpdate(this.getState(), event);
      } catch (err) {
        console.warn("[PipelineTracker] Notification listener error:", err);
      }
    }
  }
}
