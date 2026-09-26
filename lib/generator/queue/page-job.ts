import { PageRegistry } from "../../registry/page-registry";
import { RankLocalBusinessProfile, LocationEntity, ServiceEntity } from "../../entities/types";
import { findNearbyLocations } from "../../entities/geo-silo";
import {
  PageGenerationJob,
  PageJobStatus,
  QueueBatchProgress,
  LocalizedPromptContext,
} from "./types";

/**
 * Builds an independent, hyper-localized prompt for generating a single high-ranking local SEO page.
 * Strictly enforces Google Search Helpful Content standards:
 * - Prohibits duplicate doorway templating
 * - Injects geographic entities (neighborhoods, landmarks, climate notes)
 * - Injects trade-specific problem solving
 * - Formats internal link candidates as [[link:page-id|Anchor Text]]
 */
export function buildLocalizedPagePrompt(context: LocalizedPromptContext): {
  systemPrompt: string;
  userPrompt: string;
} {
  const { businessProfile, job, nearbyLocations, siblingServices, internalLinkSnippets } = context;
  const isLocationPage = Boolean(job.location);
  const isServicePage = Boolean(job.service);
  const city = job.location?.city || businessProfile.headquarters.city;
  const state = job.location?.stateCode || businessProfile.headquarters.state;
  const trade = businessProfile.nicheTrade;
  const serviceName = job.service?.name || trade;

  const systemPrompt = `You are a premier local SEO content strategist and conversion copywriter for high-end local service contractors.
Your goal is to write a comprehensive, 100% unique, authoritative page designed to rank #1 organically on Google and generate incoming phone calls.

CRITICAL ANTI-DOORWAY REQUIREMENTS (GOOGLE SEARCH COMPLIANCE):
1. ZERO BOILERPLATE DUPLICATION: Never output generic copy where only the city or service name is replaced. Every page must read as an independent, locally researched authority piece.
2. HYPER-LOCAL ENTITY EMBEDDING: Mention specific neighborhoods, regional weather/environmental factors, local water or soil conditions, and historic housing styles native to this area.
3. PRACTICAL PROBLEM SOLVING: Detail exact technical diagnostics, step-by-step procedures, required safety standards, and real homeowner troubleshooting steps.
4. NATURAL INTERNAL LINKING: Seamlessly integrate relevant internal links using the special token syntax: [[link:PAGE_ID|Anchor Text]].
5. STRICT OUTPUT FORMAT: Respond ONLY with valid JSON conforming to the requested schema. No conversational filler or markdown wrappers.`;

  const neighborhoodsList = job.location?.neighborhoods && job.location.neighborhoods.length > 0
    ? `Neighborhoods to reference naturally: ${job.location.neighborhoods.join(", ")}`
    : "";

  const landmarksList = job.location?.landmarks && job.location.landmarks.length > 0
    ? `Local landmarks & area context: ${job.location.landmarks.join(", ")}`
    : "";

  const localNotes = job.location?.localContextNotes
    ? `Regional building & environmental notes: ${job.location.localContextNotes}`
    : "";

  const commonProblemsList = job.service?.commonProblems && job.service.commonProblems.length > 0
    ? `Common homeowner problems to address: ${job.service.commonProblems.join(", ")}`
    : "";

  const nearbyLinks = nearbyLocations && nearbyLocations.length > 0
    ? `Nearby service areas to cross-link: ${nearbyLocations.map((l) => `${l.city} ([[link:loc-${l.slug}|${l.city} ${trade}]])`).join(", ")}`
    : "";

  const siblingLinks = siblingServices && siblingServices.length > 0
    ? `Complementary services to link: ${siblingServices.map((s) => `${s.name} ([[link:svc-${s.slug}|${s.name}]])`).join(", ")}`
    : "";

  const userPrompt = `Generate a dedicated, high-converting local service page for:
Business Name: ${businessProfile.businessName}
Target Service: ${serviceName}
Target Location: ${city}, ${state}
Page Role: ${job.pageType}
Target Primary Keyword: "${serviceName.toLowerCase()} in ${city.toLowerCase()} ${state.toLowerCase()}"
Secondary Keywords: ${job.targetKeywords.join(", ")}

Business Facts:
- Phone: ${businessProfile.phone}
- License: ${businessProfile.licenseNumber || "Fully Licensed, Bonded & Insured"}
- Experience: ${businessProfile.yearsInBusiness || "10+"} Years Serving the Community
- Pricing Policy: ${businessProfile.pricingPolicy || "Upfront flat-rate pricing before work begins"}
- Warranty: ${businessProfile.warrantyGuarantee || "100% Satisfaction Guarantee on parts and labor"}

Geographic & Technical Local Directives:
${neighborhoodsList}
${landmarksList}
${localNotes}
${commonProblemsList}

Internal Linking Guidelines:
${nearbyLinks}
${siblingLinks}

Required Output JSON Structure:
{
  "seo": {
    "title": "${serviceName} in ${city}, ${state} | ${businessProfile.businessName}",
    "description": "Engaging, action-oriented meta description under 155 characters with phone CTA.",
    "h1": "Authoritative H1 headline matching search intent",
    "primaryKeyword": "${serviceName} in ${city}, ${state}"
  },
  "sections": [
    {
      "type": "hero",
      "content": {
        "headline": "Compelling local hero headline",
        "subheadline": "Benefit-driven subtext citing local reliability and rapid dispatch in ${city}",
        "primaryCta": "Call Now: ${businessProfile.phone}",
        "secondaryCta": "Request Fast Quote"
      }
    },
    {
      "type": "trust_bar",
      "content": {
        "highlights": [
          "Locally Owned & Operated in ${city}",
          "Licensed & Insured (${businessProfile.licenseNumber || "State Certified"})",
          "Upfront Transparent Estimates",
          "Emergency Response Available"
        ]
      }
    },
    {
      "type": "content_body",
      "content": {
        "headline": "Professional ${serviceName} Tailored for ${city} Properties",
        "bodyMarkdown": "Deep 400-600 word technical overview detailing local challenges, diagnostic methodology, code compliance, and natural mentions of nearby neighborhoods."
      }
    },
    {
      "type": "process",
      "content": {
        "headline": "Our 4-Step Resolution Process",
        "steps": [
          { "title": "1. Local Dispatch & Rapid Assessment", "description": "Prompt arrival at your ${city} home or commercial building." },
          { "title": "2. Transparent Diagnostic & Flat-Rate Quote", "description": "No hidden fees or surprise invoices." },
          { "title": "3. Precision Workmanship", "description": "Executed to strict municipal standards using premium parts." },
          { "title": "4. Final Inspection & Clean-up", "description": "Backed by our complete warranty and guarantee." }
        ]
      }
    },
    {
      "type": "faq",
      "content": {
        "headline": "Frequently Asked Questions About ${serviceName} in ${city}",
        "faqs": [
          { "q": "How fast can you arrive at a home in ${city}?", "a": "Specific local response time explanation." },
          { "q": "Do you handle permits required in ${state}?", "a": "Clear local permitting explanation." },
          { "q": "What causes common ${serviceName.toLowerCase()} issues in ${city}?", "a": "Specific local context explanation (water hardness, temperature swings, soil, or tree roots)." }
        ]
      }
    },
    {
      "type": "coverage_areas",
      "content": {
        "headline": "Serving ${city} and Neighboring Communities",
        "intro": "Reliable dispatch throughout ${city} and surrounding areas."
      }
    },
    {
      "type": "cta",
      "content": {
        "headline": "Need Reliable ${serviceName} in ${city}?",
        "subheadline": "Speak directly with a local specialist today.",
        "phone": "${businessProfile.phone}",
        "ctaText": "Call Now: ${businessProfile.phone}"
      }
    }
  ]
}`;

  return { systemPrompt, userPrompt };
}

/**
 * Creates discrete PageGenerationJob objects from a PageRegistry
 */
export function createJobsFromRegistry(
  registry: PageRegistry,
  profile: RankLocalBusinessProfile
): PageGenerationJob[] {
  const pages = registry.getAll();
  const jobs: PageGenerationJob[] = [];

  for (const page of pages) {
    const pageData = page.data;
    const service: ServiceEntity | undefined = pageData?.service ||
      (pageData?.serviceId ? profile.services.find((s) => s.id === pageData.serviceId) : undefined);

    const location: LocationEntity | undefined = pageData?.location ||
      (pageData?.locationId ? profile.locations.find((l) => l.id === pageData.locationId) : undefined);

    const keywords: string[] = [];
    if (service) {
      keywords.push(service.name.toLowerCase());
      if (service.targetKeywords) keywords.push(...service.targetKeywords);
    }
    if (location) {
      keywords.push(location.city.toLowerCase());
      if (service) {
        keywords.push(`${service.name.toLowerCase()} in ${location.city.toLowerCase()}`);
      }
    }

    jobs.push({
      id: `job-${page.id}`,
      pageId: page.id,
      slug: page.outputFilePath.replace(/(\/index)?\.html$/, "").replace(/^\//, "") || "home",
      outputFilePath: page.outputFilePath,
      pageType: page.pageType,
      title: page.title,
      service,
      location,
      targetKeywords: Array.from(new Set(keywords)),
      status: "pending",
      attempts: 0,
      maxAttempts: 3,
    });
  }

  return jobs;
}

/**
 * Page Generation Queue Runner
 * Executes generation jobs sequentially or in small concurrency batches with real progress tracking
 */
export class PageQueueRunner {
  private jobs: PageGenerationJob[] = [];
  private isRunning: boolean = false;
  private progressListeners: Array<(progress: QueueBatchProgress) => void> = [];

  constructor(jobs: PageGenerationJob[] = []) {
    this.jobs = [...jobs];
  }

  public getJobs(): PageGenerationJob[] {
    return [...this.jobs];
  }

  public getProgress(): QueueBatchProgress {
    const total = this.jobs.length;
    const completed = this.jobs.filter((j) => j.status === "completed").length;
    const failed = this.jobs.filter((j) => j.status === "failed").length;
    const inProgress = this.jobs.filter((j) => j.status === "in_progress").length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    const current = this.jobs.find((j) => j.status === "in_progress");

    return {
      total,
      completed,
      failed,
      inProgress,
      percent,
      currentJobId: current?.id,
      currentJobSlug: current?.slug,
    };
  }

  public onProgress(listener: (progress: QueueBatchProgress) => void): () => void {
    this.progressListeners.push(listener);
    return () => {
      this.progressListeners = this.progressListeners.filter((l) => l !== listener);
    };
  }

  private notifyProgress(): void {
    const p = this.getProgress();
    for (const listener of this.progressListeners) {
      try {
        listener(p);
      } catch (err) {
        console.error("Queue progress listener error:", err);
      }
    }
  }

  /**
   * Executes all pending jobs using an injected generator callback
   */
  public async runQueue(
    generatorFn: (job: PageGenerationJob) => Promise<{ html: string; seo?: any }>
  ): Promise<PageGenerationJob[]> {
    if (this.isRunning) {
      throw new Error("PageQueueRunner is already executing.");
    }

    this.isRunning = true;

    try {
      for (const job of this.jobs) {
        if (job.status === "completed") continue;

        job.status = "in_progress";
        job.startedAt = new Date().toISOString();
        job.attempts += 1;
        this.notifyProgress();

        try {
          const result = await generatorFn(job);
          job.generatedHtml = result.html;
          job.generatedSeo = result.seo;
          job.status = "completed";
          job.completedAt = new Date().toISOString();
        } catch (err: any) {
          job.error = err?.message || String(err);
          if (job.attempts >= job.maxAttempts) {
            job.status = "failed";
          } else {
            job.status = "pending"; // Will retry if run again
          }
        }

        this.notifyProgress();
      }
    } finally {
      this.isRunning = false;
    }

    return this.jobs;
  }
}
