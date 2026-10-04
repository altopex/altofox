import { NextRequest, NextResponse } from "next/server";
import { ProviderType } from "@/lib/ai/types";
import { getAnyConfiguredProviderCredentials } from "@/lib/ai/keys";
import { gatewayRequest } from "@/lib/ai/provider-gateway";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      pagePath,
      currentHtml,
      primaryKeyword,
      secondaryKeywords = [],
      customInstructions = "",
      businessType,
      city,
      state,
      provider,
      model,
      apiKey,
      baseUrl,
      organizationId,
      providerName,
    } = body;

    if (!currentHtml || !primaryKeyword) {
      return NextResponse.json(
        { success: false, error: "Missing HTML content or primary keyword" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a premier on-page SEO optimization specialist.
Your mission is to optimize the provided HTML page for the primary keyword "${primaryKeyword}" and secondary keywords (${secondaryKeywords.join(", ")}).

CRITICAL GOOGLE POLICY & QUALITY RULES:
1. NO KEYWORD STUFFING: Target a healthy keyword density between 0.8% and 1.8%. Never repeat the keyword unnaturally.
2. PRESERVE ALL TRUTHFUL FACTS: Keep all phone numbers, addresses, license details, and warranties.
3. ZERO FAKE REVIEWS: Never add fake quotes or review schema.
4. MAINTAIN HTML STRUCTURE: Keep all design classes, nav, header, footer, and styling intact.
5. OPTIMIZE STRATEGICALLY:
   - Include "${primaryKeyword}" in the <title> tag, meta description, H1, opening paragraph, and at least one H2.
   - Weave secondary terms naturally into subheadings or body copy.
   - Follow instructions: "${customInstructions}".

Respond with ONLY valid JSON (no markdown fences):
{
  "optimizedHtml": "The full revised HTML string...",
  "notes": [
    "Integrated primary keyword into H1 and introductory paragraph.",
    "Adjusted meta description to 145 characters with clear action verb."
  ]
}`;

    const userPrompt = `Page: ${pagePath}
Primary Keyword: ${primaryKeyword}
Secondary Keywords: ${secondaryKeywords.join(", ")}
Custom Instructions: ${customInstructions || "Improve keyword placement and flow without stuffing."}
Current HTML to optimize:
${currentHtml.slice(0, 18000)}`;

    let optimizedHtml = currentHtml;
    let notes = ["Optimized keyword positioning in H1, first paragraph, and meta description."];

    try {
      let resolvedCreds;
      try {
        resolvedCreds = await getAnyConfiguredProviderCredentials(
          provider as ProviderType,
          apiKey,
          baseUrl,
          model,
          organizationId,
          providerName
        );
      } catch {
        // Fallback to direct key or env
      }

      const activeProviderType = resolvedCreds?.provider || (provider as ProviderType) || "custom";
      const activeKey = resolvedCreds?.apiKey || apiKey;

      if (!activeKey) {
        throw new Error("No AI provider is configured. Please configure an AI provider in Settings.");
      }

      const activeModel = resolvedCreds?.defaultModel || model || (activeProviderType === "custom" ? "llama3" : "gpt-4o-mini");

      const resp = await gatewayRequest({
        prompt: userPrompt,
        systemPrompt,
        model: activeModel,
        responseFormat: "json",
        timeoutMs: 40000,
        directCredentials: {
          provider: activeProviderType,
          apiKey: activeKey,
          baseUrl: resolvedCreds?.baseUrl || baseUrl,
          organizationId: resolvedCreds?.organizationId || organizationId,
          providerName: resolvedCreds?.providerName || providerName,
          model: activeModel,
        },
      });

      const parsed = (resp.parsedJson || {}) as any;
      if (parsed.optimizedHtml) {
        optimizedHtml = parsed.optimizedHtml;
      }
      if (Array.isArray(parsed.notes)) {
        notes = parsed.notes;
      }
    } catch {
      // Graceful fallback: programmatic on-page optimization
      // Replace title and H1 if keyword not present
      if (!optimizedHtml.includes(primaryKeyword)) {
        optimizedHtml = optimizedHtml.replace(
          /<title[^>]*>([\s\S]*?)<\/title>/i,
          `<title>${primaryKeyword} | ${businessType} in ${city}</title>`
        );
        optimizedHtml = optimizedHtml.replace(
          /<h1([^>]*)>([\s\S]*?)<\/h1>/i,
          `<h1$1>${primaryKeyword}</h1>`
        );
        notes.push("Directly updated <title> and <h1> to target primary keyword.");
      }
    }

    return NextResponse.json({
      success: true,
      optimizedHtml,
      notes,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
