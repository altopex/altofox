export type SearchIntentCategory =
  | "emergency"
  | "replacement"
  | "repair"
  | "maintenance"
  | "installation"
  | "diagnostic"
  | "general";

export interface IntentProfile {
  category: SearchIntentCategory;
  urgencyLevel: "high" | "medium" | "standard";
  primaryGoal: string;
  recommendedSections: string[];
  sampleQuestions: string[];
  ctaEmphasis: "call_now" | "schedule_estimate" | "book_inspection";
}

export interface ProblemItem {
  title: string;
  description: string;
  whyItHappens?: string;
  severity?: "critical" | "warning" | "routine";
}

export interface ScopeStep {
  title: string;
  description: string;
}

export interface LocalFaqItem {
  question: string;
  answer: string;
}

export interface LocationContentStrategy {
  serviceName: string;
  city: string;
  stateId: string;
  stateName: string;
  county: string;
  distanceOffset?: string;
  population?: number;
  zipCodes?: string[];
  localNotes?: string;
  searchIntent: SearchIntentCategory;
  intentProfile: IntentProfile;
  primaryKeyword: string;
  secondaryKeywords: string[];
  h1: string;
  metaTitle: string;
  metaDescription: string;
  introParagraph: string;
  overviewHeadline: string;
  overviewContent: string;
  commonProblemsTitle: string;
  commonProblems: ProblemItem[];
  whenToCall: Array<{ symptom: string; action: string }>;
  customerPrepSteps: string[];
  serviceScopeTitle: string;
  serviceScope: ScopeStep[];
  regionalClimateHeadline: string;
  regionalClimateContent: string;
  serviceAvailability: string;
  faqs: LocalFaqItem[];
  servicesOfferedInCity: string[];
  nearbyCommunities: Array<{ city: string; stateId: string; slug?: string; distanceMiles?: number }>;
  assignedAngle: string;
}

export interface LocationQualityDimensionScore {
  usefulness: number; // 0 - 15
  intentCoverage: number; // 0 - 15
  locationRelevance: number; // 0 - 15
  originality: number; // 0 - 15
  keywordNaturalness: number; // 0 - 10
  pageStructure: number; // 0 - 10
  internalLinking: number; // 0 - 10
  conversionQuality: number; // 0 - 10
  technicalSeo: number; // 0 - 10
}

export interface LocationQualityCheckResult {
  id: string;
  name: string;
  category: "intent" | "uniqueness" | "seo" | "conversion" | "links" | "content";
  passed: boolean;
  score: number;
  maxScore: number;
  details: string;
  recommendation?: string;
}

export interface LocationQualityScore {
  overallScore: number; // 0 - 100
  grade: "A+" | "A" | "B" | "C" | "Needs Improvement";
  status: "ready" | "needs_improvement" | "too_similar";
  dimensions: LocationQualityDimensionScore;
  checks: LocationQualityCheckResult[];
  recommendations: string[];
  similarityMetrics: {
    maxSimilarity: number;
    mostSimilarSlug?: string;
    isDuplicateDoorway: boolean;
  };
  keywordMetrics: {
    keywordDensityPercent: number;
    isKeywordStuffed: boolean;
    repeatedPhraseCount: number;
  };
  linkingMetrics: {
    internalLinksCount: number;
    hasIncomingContextLinks: boolean;
    hasNearbyAreaLinks: boolean;
    hasSiblingServiceLinks: boolean;
    isOrphanPage: boolean;
  };
}

export interface BulkLocationItemReport {
  slug: string;
  city: string;
  stateId: string;
  service: string;
  intent: SearchIntentCategory;
  score: number;
  grade: string;
  status: "ready" | "needs_improvement" | "too_similar";
  maxSimilarity: number;
  mostSimilarPage?: string;
  issues: string[];
  recommendations: string[];
}

export interface BulkLocationAnalysis {
  totalPages: number;
  readyCount: number;
  needsImprovementCount: number;
  tooSimilarCount: number;
  averageScore: number;
  items: BulkLocationItemReport[];
}
