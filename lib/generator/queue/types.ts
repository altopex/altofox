import { PageType } from "../../registry/page-registry";
import { LocationEntity, ServiceEntity, RankLocalBusinessProfile } from "../../entities/types";

export type PageJobStatus = "pending" | "in_progress" | "completed" | "failed" | "skipped";

export interface PageGenerationJob {
  id: string;                      // Unique job ID
  pageId: string;                  // Target page ID in registry
  slug: string;
  outputFilePath: string;
  pageType: PageType;
  title: string;
  service?: ServiceEntity;
  location?: LocationEntity;
  targetKeywords: string[];
  status: PageJobStatus;
  attempts: number;
  maxAttempts: number;
  error?: string;
  generatedHtml?: string;
  generatedSeo?: {
    title: string;
    description: string;
    h1: string;
    primaryKeyword?: string;
  };
  startedAt?: string;
  completedAt?: string;
}

export interface QueueBatchProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
  percent: number;
  currentJobId?: string;
  currentJobSlug?: string;
}

export interface LocalizedPromptContext {
  businessProfile: RankLocalBusinessProfile;
  job: PageGenerationJob;
  nearbyLocations?: LocationEntity[];
  siblingServices?: ServiceEntity[];
  internalLinkSnippets?: Array<{ anchor: string; linkTag: string }>;
}
