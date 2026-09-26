import { NextRequest, NextResponse } from "next/server";
import { getProvider, ProviderType } from "@/lib/ai";
import { getAnyConfiguredProviderCredentials } from "@/lib/ai/keys";
import { optimizePageWithGscData } from "@/lib/search-console/search-console-optimizer";
import { GSCQueryRow } from "@/lib/search-console/search-console-analyzer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      pagePath,
      currentHtml,
      query,
      impressions = 25,
      position = 11,
      dateRange,
      businessType = "Contractor",
      businessName,
      phone,
      city = "Local",
      state = "TX",
      queries: rawQueries,
      availablePagePaths,
      provider,
      model,
      apiKey,
      baseUrl,
      organizationId,
      providerName,
    } = body;

    if (!currentHtml || typeof currentHtml !== "string") {
      return NextResponse.json({ success: false, error: "Missing or invalid currentHtml." }, { status: 400 });
    }

    // Assemble query dataset for targeted optimization
    const queryRows: GSCQueryRow[] = Array.isArray(rawQueries) && rawQueries.length > 0
      ? rawQueries
      : [{ query, clicks: Math.round(impressions * 0.03), impressions, ctr: 0.03, position }];

    // 1. Run deterministic, fact-preserving GSC optimization
    const gscResult = optimizePageWithGscData(currentHtml, {
      pagePath,
      queries: queryRows,
      businessName,
      businessType,
      phone,
      city,
      state,
      availablePagePaths,
    });

    let suggestions = gscResult.changesApplied;
    let finalHtml = gscResult.optimizedHtml;

    // 2. Optionally invoke AI to refine copy nuances if credentials are provided
    try {
      const resolvedCreds = await getAnyConfiguredProviderCredentials(
        provider as ProviderType,
        apiKey,
        baseUrl,
        model,
        organizationId,
        providerName
      );

      const activeProviderType = resolvedCreds?.provider || (provider as ProviderType) || "custom";
      const activeKey = resolvedCreds?.apiKey || apiKey || process.env.CUSTOM_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

      if (activeKey) {
        const aiProvider = getProvider(activeProviderType);
        const systemPrompt = `You are a surgical technical SEO analyst optimizing an existing local service web page based on Google Search Console data.
Your job is to provide 3 concise, specific bullet points summarizing how ranking for "${query}" (Position ${position}, ${impressions} impressions) was strengthened.
Do NOT rewrite the whole page. Respond with valid JSON:
{
  "suggestions": ["Refined title and meta description to target '${query}'.", "Added an FAQ answering customer intent around '${query}'.", "Preserved all contact numbers and navigation."]
}`;

        const resp = await aiProvider.generate({
          model: resolvedCreds?.defaultModel || model || (activeProviderType === "custom" ? "llama3" : "gpt-4o-mini"),
          prompt: `Page: ${pagePath}, Query: ${query}`,
          systemPrompt,
          apiKey: activeKey,
          baseUrl: resolvedCreds?.baseUrl || baseUrl,
          organizationId: resolvedCreds?.organizationId || organizationId,
          providerName: resolvedCreds?.providerName || providerName,
          jsonMode: true,
        });

        const cleanJson = resp.content.replace(/```json|```/gi, "").trim();
        const parsed = JSON.parse(cleanJson);
        if (Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0) {
          suggestions = parsed.suggestions;
        }
      }
    } catch {
      // AI refinement optional; deterministic optimization succeeded
    }

    return NextResponse.json({
      success: true,
      suggestions,
      optimizedHtml: finalHtml,
      preservedFacts: gscResult.preservedFacts,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
