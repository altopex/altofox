/**
 * Niche Pack Type Definitions for AltoFox.
 * Each niche pack provides expert, industry-specific content, real services,
 * trust signals, pain points, FAQs, process steps, photo search queries,
 * and SEO keyword patterns.
 */

export interface NicheProcessStep {
  step: number;
  title: string;
  description: string;
}

export interface NicheFaqTopic {
  question: string;
  answerSummary: string;
}

export interface NicheImageQueries {
  hero: string[];
  services: string[];
  team: string[];
  work: string[];
}

export interface NichePack {
  id: string;
  name: string;
  schemaType: string;
  commonServices: string[];
  emergencyService: boolean;
  customerPainPoints: string[];
  trustSignals: string[];
  faqTopics: NicheFaqTopic[];
  processSteps: NicheProcessStep[];
  recommendedSections: string[];
  recommendedThemes: string[];
  recommendedPages: string[];
  imageQueries: NicheImageQueries;
  keywordPatterns: string[];
  toneNotes: string;
  aliases: string[];
}
