import { THEMES, getThemeById } from "../themes";

export interface ChatGeneratorRequest {
  prompt: string;
  themeId?: string;
  outputType?: "single" | "multi";
}

export interface GeneratedFile {
  path: string;
  content: string;
  mimeType?: string;
}

export interface ChatGeneratorResult {
  title: string;
  description: string;
  files: GeneratedFile[];
  themeUsed: string;
}

export const CHAT_GENERATOR_SYSTEM_PROMPT = `You are an elite web architect specializing in lightweight, modern, production-ready static websites.
Your task is to generate complete, clean, self-contained static HTML and CSS code based on user requests.

CRITICAL ARCHITECTURE RULES:
1. PURE STATIC WEB: Output standard HTML5 and CSS. Minimal vanilla JavaScript ONLY when genuinely needed (mobile menu toggle, accordion). NO React, NO Vue, NO Tailwind CDN, NO heavy dependencies.
2. PRODUCTION QUALITY:
   - Valid <!DOCTYPE html> structure, responsive meta tags, modern typography, mobile-first design.
   - Dual Call-to-Action: prominent phone click-to-call ("tel:") and contact quote form.
   - Modern visual aesthetic: subtle gradients, clean cards, rounded corners, soft shadows, ample whitespace.
   - Local SEO: Schema.org LocalBusiness JSON-LD in <head>, meta description, canonical tags.
   - Realistic content: Write compelling, authentic copy with specific trade terminology, benefits, guarantees, and testimonials—never generic "Lorem Ipsum".
3. STANDALONE & SAFE:
   - For single-page: Put all CSS in a <style> block inside <head>.
   - For multi-page: Put shared styling in styles.css and link <link rel="stylesheet" href="styles.css"> in every page.
   - Use high-quality royalty-free thematic Unsplash image URLs or clean inline SVG illustrations.

OUTPUT FORMAT:
You MUST respond with a valid JSON object matching this schema:
{
  "title": "Short title describing the website",
  "description": "Brief 1-sentence summary of what was generated",
  "files": [
    {
      "path": "index.html",
      "content": "<!DOCTYPE html>\\n<html lang=\\"en\\">...</html>"
    }
  ]
}

Return ONLY the raw JSON object. Do not wrap in markdown or commentary unless using a standard \`\`\`json code block.`;

export function buildChatGeneratorUserPrompt(req: ChatGeneratorRequest): string {
  const selectedTheme = getThemeById(req.themeId || "modern-pro") || THEMES[0];
  const isMultiPage = req.outputType === "multi";

  let prompt = `Create a ${isMultiPage ? "multi-page static mini-site (index.html, services.html, contact.html, and styles.css)" : "single-page landing page (index.html with embedded CSS)"} for the following requirement:

"${req.prompt.trim()}"

DESIGN SPECIFICATIONS:
- Primary Color: ${selectedTheme.colors.primary}
- Accent Color: ${selectedTheme.colors.accent}
- Dark Surface: ${selectedTheme.colors.secondary}
- Background: ${selectedTheme.colors.background}
- Typography: Heading Font: "${selectedTheme.fonts.heading}", Body Font: "${selectedTheme.fonts.body}"
- Style Aesthetic: ${selectedTheme.name} (${selectedTheme.designNotes || "Clean, high-trust, modern"})
- Border Radius: ${selectedTheme.borderRadius || "12px"}

REQUIRED SECTIONS:
1. Header / Navigation: Logo, navigation links, and a prominent "Call Now" phone button with dual pulsing animation.
2. Hero Section: High-converting headline, sub-headline, trust badges (e.g. Licensed & Insured, 5-Star Rated, 24/7 Available), and primary CTA button.
3. Core Services: 3-4 feature cards with clear descriptions and icons/graphics.
4. Social Proof: Customer reviews with 5-star ratings and authentic feedback quotes.
5. FAQ: 3-4 common homeowner/customer questions with answers.
6. Contact & Quote Form: Simple interactive input fields (Name, Phone, Service Needed, Message) with a "Request Free Quote" submit button.
7. Footer: Copyright, phone, email, business hours, and service area summary.

Generate the complete, working, beautiful website files in JSON format now.`;

  return prompt;
}

/**
 * Robustly parses AI response into ChatGeneratorResult.
 * Handles clean JSON, code-fenced JSON, or raw HTML fallbacks.
 */
export function parseChatGeneratorResponse(
  rawText: string,
  defaultTitle: string = "Generated Website",
  themeName: string = "Modern Pro"
): ChatGeneratorResult {
  const trimmed = rawText.trim();

  // 1. Try parsing JSON directly
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && Array.isArray(parsed.files) && parsed.files.length > 0) {
      return {
        title: parsed.title || defaultTitle,
        description: parsed.description || "Generated with RankLocal Chat Generator",
        files: parsed.files.map((f: any) => ({
          path: (f.path || "index.html").replace(/^\/+/, ""),
          content: f.content || "",
          mimeType: f.path?.endsWith(".css") ? "text/css" : "text/html",
        })),
        themeUsed: themeName,
      };
    }
  } catch {}

  // 2. Try extracting JSON from markdown code block ```json ... ```
  const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed && Array.isArray(parsed.files) && parsed.files.length > 0) {
        return {
          title: parsed.title || defaultTitle,
          description: parsed.description || "Generated with RankLocal Chat Generator",
          files: parsed.files.map((f: any) => ({
            path: (f.path || "index.html").replace(/^\/+/, ""),
            content: f.content || "",
            mimeType: f.path?.endsWith(".css") ? "text/css" : "text/html",
          })),
          themeUsed: themeName,
        };
      }
    } catch {}
  }

  // 3. Fallback: If AI returned raw HTML or ```html ... ``` code block
  let htmlContent = trimmed;
  const htmlMatch = trimmed.match(/```(?:html)?\s*([\s\S]*?)\s*```/i);
  if (htmlMatch) {
    htmlContent = htmlMatch[1];
  }

  if (htmlContent.includes("<!DOCTYPE") || htmlContent.includes("<html") || htmlContent.includes("<body")) {
    return {
      title: defaultTitle,
      description: "Generated with RankLocal Chat Generator",
      files: [
        {
          path: "index.html",
          content: htmlContent,
          mimeType: "text/html",
        },
      ],
      themeUsed: themeName,
    };
  }

  throw new Error("Unable to parse website files from AI response. Please try again with a slightly different prompt.");
}
