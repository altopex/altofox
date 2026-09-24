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
 * Handles markdown code fences, leading/trailing commentary, and common escaping issues.
 */
export function extractAndParseJSON(raw: string): unknown {
  let cleaned = raw.trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
    cleaned = cleaned.replace(/\s*```$/, "");
    cleaned = cleaned.trim();
  }

  // Look for the first '{' and last '}'
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (initialErr) {
    // Attempt standard auto-repairs
    // 1. Remove trailing commas before closing braces/brackets
    const repairedTrailingCommas = cleaned.replace(/,\s*([}\]])/g, "$1");
    try {
      return JSON.parse(repairedTrailingCommas);
    } catch {
      // 2. Try fixing unescaped control characters in string literals
      try {
        const repairedControls = repairedTrailingCommas.replace(
          /[\u0000-\u001F\u007F-\u009F]/g,
          (c) => (c === "\n" || c === "\r" || c === "\t" ? c : "")
        );
        return JSON.parse(repairedControls);
      } catch {
        throw new Error(
          `Failed to parse AI output as JSON: ${initialErr instanceof Error ? initialErr.message : String(initialErr)}`
        );
      }
    }
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
