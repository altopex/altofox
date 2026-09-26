import { z } from "zod";
import { SiteInfoJSON } from "./content-schema";
import { findNicheByIndustry } from "../../niches";

// ============================================================================
// 1. Strict Zod Schemas for Every Section Type
// ============================================================================

export const HeroSectionContentSchema = z.object({
  eyebrow: z.string().optional().default("Trusted Local Specialists"),
  h1: z.string().min(5, "Hero H1 must be at least 5 characters"),
  subheadline: z.string().min(10, "Hero subheadline must be at least 10 characters"),
  primaryButtonText: z.string().min(2, "Primary button text must be at least 2 characters"),
  primaryButtonUrl: z.string().optional(),
  secondaryButtonText: z.string().optional(),
  secondaryButtonUrl: z.string().optional(),
  trustBadges: z.array(z.string().min(2)).optional().default([]),
});

export const ServiceItemSchema = z.object({
  title: z.string().min(3, "Service title must be at least 3 characters"),
  description: z.string().min(10, "Service description must be at least 10 characters"),
  slug: z.string().optional(),
  icon: z.string().optional(),
});

export const ServicesSectionContentSchema = z.object({
  eyebrow: z.string().optional().default("What We Do"),
  headline: z.string().min(5, "Services headline must be at least 5 characters"),
  subheadline: z.string().min(10, "Services subheadline must be at least 10 characters"),
  items: z.array(ServiceItemSchema).min(3, "Services section requires at least 3 service items"),
});

export const FaqItemSchema = z.object({
  question: z.string().min(5, "FAQ question must be at least 5 characters"),
  answer: z.string().min(10, "FAQ answer must be at least 10 characters"),
});

export const FaqSectionContentSchema = z.object({
  eyebrow: z.string().optional().default("Common Questions"),
  headline: z.string().min(5, "FAQ headline must be at least 5 characters"),
  subheadline: z.string().optional(),
  items: z.array(FaqItemSchema).min(4, "FAQ section requires at least 4 items"),
});

export const AboutSectionContentSchema = z.object({
  eyebrow: z.string().optional().default("About Our Company"),
  headline: z.string().min(5, "About headline must be at least 5 characters"),
  paragraphs: z.array(z.string().min(20, "Paragraph must be at least 20 characters")).min(1),
  values: z.array(z.string()).optional(),
  ownerQuote: z.string().optional(),
});

export const WhyUsItemSchema = z.object({
  title: z.string().min(3, "WhyUs title must be at least 3 characters"),
  description: z.string().min(10, "WhyUs description must be at least 10 characters"),
  icon: z.string().optional(),
});

export const WhyUsSectionContentSchema = z.object({
  eyebrow: z.string().optional().default("The Local Advantage"),
  headline: z.string().min(5, "WhyUs headline must be at least 5 characters"),
  subheadline: z.string().optional(),
  items: z.array(WhyUsItemSchema).min(3, "WhyUs section requires at least 3 items"),
});

export const ProcessStepSchema = z.object({
  stepNumber: z.number().optional(),
  title: z.string().min(3, "Step title must be at least 3 characters"),
  description: z.string().min(10, "Step description must be at least 10 characters"),
});

export const ProcessSectionContentSchema = z.object({
  eyebrow: z.string().optional().default("Simple 3-Step Process"),
  headline: z.string().min(5, "Process headline must be at least 5 characters"),
  subheadline: z.string().optional(),
  steps: z.array(ProcessStepSchema).min(3, "Process section requires at least 3 steps"),
});

export const StatItemSchema = z.object({
  value: z.string().min(1, "Stat value is required"),
  label: z.string().min(2, "Stat label is required"),
});

export const StatsSectionContentSchema = z.object({
  headline: z.string().optional(),
  items: z.array(StatItemSchema).min(3, "Stats section requires at least 3 items"),
});

export const CtaBannerSectionContentSchema = z.object({
  headline: z.string().min(5, "CTA headline must be at least 5 characters"),
  subheadline: z.string().optional(),
  primaryButtonText: z.string().min(2, "CTA button text must be at least 2 characters"),
  primaryButtonUrl: z.string().optional(),
});

export const EmergencyBannerSectionContentSchema = z.object({
  text: z.string().min(5, "Emergency banner text must be at least 5 characters"),
  phone: z.string().optional(),
});

export const TestimonialItemSchema = z.object({
  author: z.string().min(2, "Author name required"),
  location: z.string().optional(),
  rating: z.number().min(1).max(5).default(5),
  text: z.string().min(10, "Testimonial text must be at least 10 characters"),
});

export const TestimonialsSectionContentSchema = z.object({
  headline: z.string().min(5, "Testimonials headline must be at least 5 characters"),
  items: z.array(TestimonialItemSchema).min(2, "Testimonials section requires at least 2 reviews"),
});

// ============================================================================
// 2. Section Validation, Repair, and Safe Default Fallbacks
// ============================================================================

export interface GenerationAuditEntry {
  pageSlug: string;
  sectionIndex: number;
  sectionType: string;
  repairedFields: string[];
  defaultsUsed: string[];
  removed: boolean;
  removalReason?: string;
}

export interface SectionValidationResult {
  valid: boolean;
  content: Record<string, any>;
  audit: GenerationAuditEntry;
}

/**
 * Normalizes input: cleans markdown formatting, parses JSON safely, handles wrong types
 */
export function normalizeRawContent(raw: unknown): Record<string, any> {
  if (typeof raw === "string") {
    let clean = raw.trim();
    if (clean.startsWith("```json")) {
      clean = clean.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    } else if (clean.startsWith("```")) {
      clean = clean.replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    }
    try {
      return JSON.parse(clean);
    } catch {
      return {};
    }
  }
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    return { ...raw } as Record<string, any>;
  }
  return {};
}

/**
 * Validates, repairs, and sanitizes section content using strict Zod schemas and business context
 */
export function validateAndRepairSection(
  sectionType: string,
  rawContent: unknown,
  site: SiteInfoJSON,
  pageSlug: string,
  sectionIndex: number
): SectionValidationResult {
  const content = normalizeRawContent(rawContent);
  const trade = site.businessName || "Local Services";
  const city = site.address?.city || "Local Area";
  const state = site.address?.state || "";
  const phone = site.phone || "(555) 123-4567";
  const niche = findNicheByIndustry(trade);

  const audit: GenerationAuditEntry = {
    pageSlug,
    sectionIndex,
    sectionType,
    repairedFields: [],
    defaultsUsed: [],
    removed: false,
  };

  switch (sectionType) {
    case "hero": {
      // Required: h1, subheadline, primaryButtonText
      if (!content.h1 || typeof content.h1 !== "string" || content.h1.trim().length < 5) {
        content.h1 = `Trusted ${trade} in ${city}${state ? `, ${state}` : ""}`;
        audit.repairedFields.push("h1");
        audit.defaultsUsed.push("business-derived H1");
      }
      if (!content.subheadline || typeof content.subheadline !== "string" || content.subheadline.trim().length < 10) {
        content.subheadline = `Licensed, prompt, and upfront ${trade.toLowerCase()} across ${city} and surrounding areas. Call now for priority dispatch.`;
        audit.repairedFields.push("subheadline");
        audit.defaultsUsed.push("business-derived subheadline");
      }
      if (!content.primaryButtonText || typeof content.primaryButtonText !== "string" || content.primaryButtonText.trim().length < 2) {
        content.primaryButtonText = `Call ${phone}`;
        audit.repairedFields.push("primaryButtonText");
        audit.defaultsUsed.push("phone CTA button");
      }
      if (!content.primaryButtonUrl) {
        content.primaryButtonUrl = `tel:${phone.replace(/[^\d+]/g, "")}`;
      }
      if (!content.secondaryButtonText) {
        content.secondaryButtonText = "Get a Free Quote";
      }
      if (!content.secondaryButtonUrl) {
        content.secondaryButtonUrl = "contact.html";
      }

      const parseResult = HeroSectionContentSchema.safeParse(content);
      return { valid: parseResult.success, content: parseResult.success ? parseResult.data : content, audit };
    }

    case "services": {
      if (!content.headline || typeof content.headline !== "string" || content.headline.trim().length < 5) {
        content.headline = `Professional ${trade} Solutions in ${city}`;
        audit.repairedFields.push("headline");
        audit.defaultsUsed.push("default services headline");
      }
      if (!content.subheadline || typeof content.subheadline !== "string" || content.subheadline.trim().length < 10) {
        content.subheadline = `Upfront flat-rate pricing, certified technicians, and guaranteed workmanship on every job.`;
        audit.repairedFields.push("subheadline");
        audit.defaultsUsed.push("default services subheadline");
      }

      // Ensure at least 3 items
      let items = Array.isArray(content.items) ? content.items : [];
      items = items.filter((it: any) => it && typeof it === "object" && it.title && it.description);

      if (items.length < 3) {
        const fallbackNames = niche.commonServices && niche.commonServices.length >= 3
          ? niche.commonServices
          : ["Emergency Repairs", "Maintenance & Inspection", "Full Replacement & Installation"];

        for (const sName of fallbackNames) {
          if (items.length >= 3) break;
          items.push({
            title: sName,
            description: `Dependable, licensed ${sName.toLowerCase()} delivered with upfront flat-rate pricing.`,
            slug: "services.html",
          });
        }
        audit.repairedFields.push("items");
        audit.defaultsUsed.push(`injected ${items.length} niche services`);
      }
      content.items = items;

      const parseResult = ServicesSectionContentSchema.safeParse(content);
      return { valid: parseResult.success, content: parseResult.success ? parseResult.data : content, audit };
    }

    case "faq": {
      if (!content.headline || typeof content.headline !== "string" || content.headline.trim().length < 5) {
        content.headline = `Frequently Asked Questions About ${trade}`;
        audit.repairedFields.push("headline");
        audit.defaultsUsed.push("default faq headline");
      }

      let items = Array.isArray(content.items) ? content.items : [];
      items = items.filter((it: any) => it && typeof it === "object" && it.question && it.answer);

      if (items.length < 4) {
        const fallbackFaqs = [
          {
            question: `How quickly can you dispatch a technician in ${city}?`,
            answer: `We provide priority response and can typically arrive within 45 to 60 minutes for emergency calls in ${city} and surrounding communities.`,
          },
          {
            question: "Do you offer upfront, flat-rate pricing?",
            answer: "Yes, our technicians inspect the issue on-site and present clear, transparent pricing before starting any work. No surprises.",
          },
          {
            question: "Are your technicians licensed and insured?",
            answer: `Yes, all work is performed by state-licensed, insured, and thoroughly background-checked professionals adhering to all safety codes.`,
          },
          {
            question: "Do you guarantee your workmanship and parts?",
            answer: "Every repair and installation includes our satisfaction guarantee alongside comprehensive manufacturer warranties.",
          },
        ];

        for (const ff of fallbackFaqs) {
          if (items.length >= 4) break;
          items.push(ff);
        }
        audit.repairedFields.push("items");
        audit.defaultsUsed.push(`injected ${items.length} verified FAQs`);
      }
      content.items = items;

      const parseResult = FaqSectionContentSchema.safeParse(content);
      return { valid: parseResult.success, content: parseResult.success ? parseResult.data : content, audit };
    }

    case "emergencyBanner": {
      if (!content.text || typeof content.text !== "string" || content.text.trim().length < 5) {
        content.text = `24/7 Priority Emergency ${trade} Available in ${city} — Call Now!`;
        audit.repairedFields.push("text");
        audit.defaultsUsed.push("default emergency banner text");
      }
      content.phone = phone;

      const parseResult = EmergencyBannerSectionContentSchema.safeParse(content);
      return { valid: parseResult.success, content: parseResult.success ? parseResult.data : content, audit };
    }

    case "whyUs": {
      if (!content.headline || typeof content.headline !== "string" || content.headline.trim().length < 5) {
        content.headline = `Why Homeowners in ${city} Choose ${site.businessName}`;
        audit.repairedFields.push("headline");
        audit.defaultsUsed.push("default whyUs headline");
      }

      let items = Array.isArray(content.items) ? content.items : [];
      items = items.filter((it: any) => it && typeof it === "object" && it.title && it.description);

      if (items.length < 3) {
        items = [
          { title: "Upfront Transparent Pricing", description: "No hidden fees, travel surcharges, or surprises on your invoice." },
          { title: "Prompt Emergency Dispatch", description: `Equipped service vans ready for fast dispatch across ${city}.` },
          { title: "Workmanship Guaranteed", description: "All repairs and installations completed to local building code standards." },
        ];
        audit.repairedFields.push("items");
        audit.defaultsUsed.push("default whyUs items");
      }
      content.items = items;

      const parseResult = WhyUsSectionContentSchema.safeParse(content);
      return { valid: parseResult.success, content: parseResult.success ? parseResult.data : content, audit };
    }

    case "process": {
      if (!content.headline || typeof content.headline !== "string" || content.headline.trim().length < 5) {
        content.headline = `Our Fast & Seamless Service Process`;
        audit.repairedFields.push("headline");
        audit.defaultsUsed.push("default process headline");
      }

      let steps = Array.isArray(content.steps) ? content.steps : [];
      steps = steps.filter((s: any) => s && typeof s === "object" && s.title && s.description);

      if (steps.length < 3) {
        steps = [
          { stepNumber: 1, title: "Call or Request Online", description: "Connect with our friendly local dispatch team immediately." },
          { stepNumber: 2, title: "On-Site Diagnosis & Quote", description: "A licensed technician assesses the work and provides clear flat-rate options." },
          { stepNumber: 3, title: "Clean, Guaranteed Execution", description: "Work completed cleanly with complete inspection and parts warranty." },
        ];
        audit.repairedFields.push("steps");
        audit.defaultsUsed.push("default process steps");
      }
      content.steps = steps;

      const parseResult = ProcessSectionContentSchema.safeParse(content);
      return { valid: parseResult.success, content: parseResult.success ? parseResult.data : content, audit };
    }

    case "ctaBanner": {
      if (!content.headline || typeof content.headline !== "string" || content.headline.trim().length < 5) {
        content.headline = `Ready for Reliable ${trade} in ${city}?`;
        audit.repairedFields.push("headline");
        audit.defaultsUsed.push("default cta headline");
      }
      if (!content.primaryButtonText) {
        content.primaryButtonText = `Call ${phone}`;
      }
      if (!content.primaryButtonUrl) {
        content.primaryButtonUrl = `tel:${phone.replace(/[^\d+]/g, "")}`;
      }

      const parseResult = CtaBannerSectionContentSchema.safeParse(content);
      return { valid: parseResult.success, content: parseResult.success ? parseResult.data : content, audit };
    }

    case "about": {
      if (!content.headline || typeof content.headline !== "string" || content.headline.trim().length < 5) {
        content.headline = `Locally Owned & Dedicated to ${city}`;
        audit.repairedFields.push("headline");
        audit.defaultsUsed.push("default about headline");
      }
      let paragraphs = Array.isArray(content.paragraphs) ? content.paragraphs : [];
      paragraphs = paragraphs.filter((p: any) => typeof p === "string" && p.trim().length >= 20);
      if (paragraphs.length < 1) {
        paragraphs = [
          `At ${site.businessName}, we take pride in delivering honest, dependable ${trade.toLowerCase()} across ${city} and neighboring areas.`,
          `Our licensed technicians combine decades of industry expertise with upfront pricing and a commitment to treating your home with utmost care.`,
        ];
        audit.repairedFields.push("paragraphs");
        audit.defaultsUsed.push("default about paragraphs");
      }
      content.paragraphs = paragraphs;

      const parseResult = AboutSectionContentSchema.safeParse(content);
      return { valid: parseResult.success, content: parseResult.success ? parseResult.data : content, audit };
    }

    default:
      // For any other section (e.g. trustBar, contactForm), allow through if non-empty
      return { valid: true, content, audit };
  }
}

// ============================================================================
// 3. Final Guard Scanner: Scans Final HTML for Forbidden Leaks
// ============================================================================

export interface ForbiddenTokenError {
  token: string;
  line: number;
  snippet: string;
}

export function scanHtmlForForbiddenTokens(html: string): ForbiddenTokenError[] {
  const errors: ForbiddenTokenError[] = [];
  const FORBIDDEN = [
    "undefined",
    "null",
    "NaN",
    "[object Object]",
    "{{",
    "}}",
    "lorem ipsum",
  ];

  const lines = html.split("\n");

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    // Skip script tags containing legitimate "null" or schema JSON strings if needed
    // but check visible text and attributes
    for (const token of FORBIDDEN) {
      if (token === "null") {
        // Only flag "null" if outside of <script type="application/ld+json">
        if (line.includes("<script") || line.includes("</script>")) continue;
        // In HTML body/attributes
        const nullRegex = /(?:>|\s|'|")null(?:<|\s|'|"|\/)/i;
        if (nullRegex.test(line)) {
          errors.push({
            token,
            line: lineIdx + 1,
            snippet: line.trim().slice(0, 100),
          });
        }
      } else {
        const lowerLine = line.toLowerCase();
        if (lowerLine.includes(token.toLowerCase())) {
          errors.push({
            token,
            line: lineIdx + 1,
            snippet: line.trim().slice(0, 100),
          });
        }
      }
    }
  }

  return errors;
}
