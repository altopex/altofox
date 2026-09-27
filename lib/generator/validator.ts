import { z } from "zod";

export const GeneratedFileSchema = z.object({
  path: z.string().min(1),
  content: z.string(),
});

export const GeneratedWebsiteSchema = z.object({
  files: z.array(GeneratedFileSchema).min(1),
  notes: z.string().optional().default(""),
});

export type GeneratedWebsite = z.infer<typeof GeneratedWebsiteSchema>;
export type GeneratedFile = z.infer<typeof GeneratedFileSchema>;

/**
 * Robustly parses and extracts JSON from raw LLM output.
 * Handles markdown code fences, leading/trailing commentary, unclosed quotes,
 * unclosed brackets/braces from token truncation, trailing commas, and escaping issues.
 */
export function repairTruncatedJson(str: string): string {
  let cleaned = str.trim();

  // Strip markdown code fences if present
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    cleaned = codeBlockMatch[1].trim();
  } else {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }

  // Look for the first '{' or '['
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  let startIdx = 0;
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }
  if (startIdx > 0) {
    cleaned = cleaned.slice(startIdx);
  }

  // Quick check if already valid JSON
  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch {}

  // 1. Remove trailing commas before closing braces/brackets
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");

  // 2. Remove non-printable control characters except \n, \r, \t
  cleaned = cleaned.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "");

  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch {}

  // 3. Scan for unclosed strings and bracket/brace nesting
  let inString = false;
  let escape = false;
  const stack: string[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (ch === "{" || ch === "[") {
        stack.push(ch);
      } else if (ch === "}") {
        if (stack.length > 0 && stack[stack.length - 1] === "{") {
          stack.pop();
        }
      } else if (ch === "]") {
        if (stack.length > 0 && stack[stack.length - 1] === "[") {
          stack.pop();
        }
      }
    }
  }

  let repaired = cleaned;
  // If ended mid-string, close the quote
  if (inString) {
    repaired += '"';
  }

  // Remove trailing dangling key or comma e.g. ',"someKey":' or ',"' or ','
  repaired = repaired.replace(/,\s*$/g, "");
  repaired = repaired.replace(/,\s*"[^"]*"\s*:\s*$/g, "");
  repaired = repaired.replace(/:\s*$/g, ": null");

  // Close open brackets and braces in LIFO order
  while (stack.length > 0) {
    const openToken = stack.pop();
    if (openToken === "{") {
      repaired = repaired.replace(/,\s*$/g, "") + "}";
    } else if (openToken === "[") {
      repaired = repaired.replace(/,\s*$/g, "") + "]";
    }
  }

  // Final sweep for any newly created trailing commas before brackets
  repaired = repaired.replace(/,\s*([}\]])/g, "$1");

  return repaired;
}

export function extractAndParseJSON(raw: string): unknown {
  if (!raw || typeof raw !== "string") {
    throw new Error("Empty or non-string input provided for JSON extraction.");
  }

  let cleaned = raw.trim();

  // Strip markdown code fences if present
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    cleaned = codeBlockMatch[1].trim();
  } else {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }

  // Look for the first '{' and last '}'
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const slice = cleaned.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(slice);
    } catch {}
  }

  // Try repairing with auto-closing
  try {
    const repaired = repairTruncatedJson(cleaned);
    return JSON.parse(repaired);
  } catch (err) {
    if (firstBrace !== -1) {
      try {
        const repairedFromBrace = repairTruncatedJson(cleaned.slice(firstBrace));
        return JSON.parse(repairedFromBrace);
      } catch {}
    }
    throw new Error(
      `Failed to parse AI output as JSON: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

export function validateGeneratedWebsite(data: unknown): GeneratedWebsite {
  const result = GeneratedWebsiteSchema.safeParse(data);
  if (!result.success) {
    const errorDetails = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
    throw new Error(`Invalid website structure generated: ${errorDetails}`);
  }

  // Ensure index.html exists; if not, find the primary HTML file or rename first HTML to index.html
  const files = [...result.data.files];
  const hasIndex = files.some((f) => f.path.toLowerCase() === "index.html");

  if (!hasIndex) {
    const firstHtmlIndex = files.findIndex((f) => f.path.toLowerCase().endsWith(".html"));
    if (firstHtmlIndex !== -1) {
      files[firstHtmlIndex] = {
        ...files[firstHtmlIndex],
        path: "index.html",
      };
    }
  }

  return {
    files,
    notes: result.data.notes || "Successfully generated website files.",
  };
}

export interface ContentSanitizationContext {
  businessName?: string;
  phone?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zip?: string;
  email?: string;
  licenseNumber?: string;
  certifications?: string;
  warrantyGuarantee?: string;
  emergency247?: boolean;
  freeEstimates?: boolean;
  insuredBonded?: boolean;
  realReviewsConfirmed?: boolean;
  realReviews?: Array<{ author: string; text: string; rating: number; source?: string; date?: string }>;
}

/**
 * Sanitizes strings by replacing leaked prompt placeholder tokens with ground-truth values
 * and removing forbidden or hallucinated placeholder text.
 */
export function sanitizePlaceholderTokens(text: string, ctx: ContentSanitizationContext): string {
  if (!text || typeof text !== "string") return "";

  let out = text;

  // Business Name placeholders
  if (ctx.businessName) {
    out = out.replace(/\[(?:Insert\s+)?(?:Your\s+)?(?:Business|Company)\s+Name\]/gi, ctx.businessName);
  }

  // Phone placeholders
  if (ctx.phone) {
    out = out.replace(/\[(?:Insert\s+)?(?:Your\s+)?Phone(?:\s+Number)?\]/gi, ctx.phone);
    out = out.replace(/\[Phone\]/gi, ctx.phone);
    out = out.replace(/\(555\)\s*000-0000/g, ctx.phone);
  }

  // City placeholders
  if (ctx.city) {
    out = out.replace(/\[(?:Insert\s+)?(?:Your\s+)?City\]/gi, ctx.city);
    out = out.replace(/\[City,\s*State\]/gi, ctx.state ? `${ctx.city}, ${ctx.state}` : ctx.city);
  }

  // State placeholders
  if (ctx.state) {
    out = out.replace(/\[(?:Insert\s+)?(?:Your\s+)?State\]/gi, ctx.state);
  }

  // Address placeholders
  if (ctx.streetAddress) {
    out = out.replace(/\[(?:Insert\s+)?(?:Your\s+)?(?:Street\s+)?Address\]/gi, ctx.streetAddress);
  } else if (ctx.city) {
    out = out.replace(/\[(?:Insert\s+)?(?:Your\s+)?(?:Street\s+)?Address\]/gi, ctx.city);
  }

  // Email placeholders
  if (ctx.email) {
    out = out.replace(/\[(?:Insert\s+)?(?:Your\s+)?Email\]/gi, ctx.email);
  }

  // Strip generic developer placeholders
  out = out.replace(/Lorem ipsum[^\.\n]*[\.\n]?/gi, "");
  out = out.replace(/\[TODO[^\]]*\]/gi, "");
  out = out.replace(/TODO:[^\.\n]*[\.\n]?/gi, "");
  out = out.replace(/\[TBD\]/gi, "");
  out = out.replace(/\bTBD\b/g, "");
  out = out.replace(/\[object Object\]/g, "");

  return out.trim();
}

/**
 * Deeply traverses any object and sanitizes text strings.
 */
export function sanitizeDeep(obj: any, ctx: ContentSanitizationContext): any {
  if (typeof obj === "string") {
    return sanitizePlaceholderTokens(obj, ctx);
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeDeep(item, ctx));
  }
  if (obj !== null && typeof obj === "object") {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = sanitizeDeep(value, ctx);
    }
    return result;
  }
  return obj;
}
