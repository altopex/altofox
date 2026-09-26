import { NextRequest, NextResponse } from "next/server";
import { ProviderType } from "@/lib/ai/types";
import { getProviderCredentials } from "@/lib/ai/keys";
import { generateWebsite } from "@/lib/ai/generate-website";
import { renderLocationPage, buildLocationPageSchema, LocationPageContext } from "@/templates/sections/locationPage";
import { resolvePageImage } from "@/lib/photos/image-provider";
import { THEMES } from "@/lib/themes";
import { SiteInfoJSON } from "@/lib/generator/content-schema";
import {
  buildLocationContentStrategy,
  auditLocationPageQuality,
  auditBulkLocationPages,
} from "@/lib/location/quality-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      cityData, // { city, stateId, stateName, county, population, distanceOffset, zipCodes, localNotes, lat, lng }
      businessInfo, // SiteInfoJSON
      themeId = "modern-pro",
      mainService = "Plumbing Service",
      servicesList = [],
      provider = "gemini",
      model,
      baseUrl,
      organizationId,
      providerName,
      apiKey,
      angleIndex = 0,
      allSelectedCities = [],
      domain = "example.com",
      existingPages = [], // Array<{ slug: string; html: string }>
      bulkCities, // Optional array of cityData objects for bulk generation
    } = body;

    // Handle Bulk Location Generation if requested
    if (Array.isArray(bulkCities) && bulkCities.length > 0) {
      const generatedPages: Array<{
        slug: string;
        html: string;
        city: string;
        stateId: string;
        service: string;
        context: LocationPageContext;
      }> = [];

      const theme = THEMES.find((t: any) => t.id === themeId) || THEMES[0];

      for (let i = 0; i < bulkCities.length; i++) {
        const c = bulkCities[i];
        const strategy = buildLocationContentStrategy({
          serviceName: mainService,
          cityData: c,
          businessInfo: businessInfo as SiteInfoJSON,
          angleIndex: i,
          allSelectedCities,
        });

        const resolvedHero = resolvePageImage(
          {
            pageTitle: `${mainService} in ${c.city}, ${c.stateId}`,
            city: c.city,
            state: c.stateName || c.stateId,
            stateCode: c.stateId,
            trade: mainService,
            slot: "hero",
            pageType: "location",
            targetKeyword: `${mainService.toLowerCase()} in ${c.city.toLowerCase()}`,
            width: 1200,
            height: 800,
          },
          {
            preferredSource: provider === "bing" ? "bing" : (provider as any),
            pexelsKey: apiKey,
          }
        );

        const locCtx: LocationPageContext = {
          city: c.city,
          stateId: c.stateId,
          stateName: c.stateName || c.stateId,
          county: c.county || "Regional",
          population: c.population,
          distanceOffset: c.distanceOffset,
          zipCodes: c.zipCodes,
          localNotes: c.localNotes,
          angleUsed: strategy.assignedAngle,
          h1: strategy.h1,
          metaTitle: strategy.metaTitle,
          metaDescription: strategy.metaDescription,
          introParagraph: strategy.introParagraph,
          angleSectionHeadline: strategy.regionalClimateHeadline,
          angleSectionContent: strategy.regionalClimateContent,
          commonProblemsTitle: strategy.commonProblemsTitle,
          commonProblems: strategy.commonProblems,
          whenToCall: strategy.whenToCall,
          customerPrepSteps: strategy.customerPrepSteps,
          serviceScopeTitle: strategy.serviceScopeTitle,
          servicesIncluded: servicesList.length > 0 ? servicesList.slice(0, 6) : strategy.servicesOfferedInCity,
          processSteps: strategy.serviceScope,
          faqs: strategy.faqs,
          heroImage: {
            url: resolvedHero.url,
            fallbackUrl: resolvedHero.fallbackUrl,
            alt: resolvedHero.alt,
            width: resolvedHero.width,
            height: resolvedHero.height,
          },
        };

        const locationBodyHtml = renderLocationPage(
          locCtx,
          businessInfo as SiteInfoJSON,
          theme,
          allSelectedCities,
          { lat: c.lat, lng: c.lng }
        );

        const slug = `${mainService.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${c.city.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${c.stateId.toLowerCase()}.html`;

        generatedPages.push({
          slug,
          html: locationBodyHtml,
          city: c.city,
          stateId: c.stateId,
          service: mainService,
          context: locCtx,
        });
      }

      const bulkAnalysis = auditBulkLocationPages(generatedPages);

      return NextResponse.json({
        success: true,
        bulk: true,
        analysis: bulkAnalysis,
        pages: generatedPages.map((p) => ({
          slug: p.slug,
          city: p.city,
          stateId: p.stateId,
          context: p.context,
          html: p.html,
        })),
      });
    }

    // Single Location Page Generation
    if (!cityData || !cityData.city) {
      return NextResponse.json({ success: false, error: "Missing city data" }, { status: 400 });
    }

    const theme = THEMES.find((t: any) => t.id === themeId) || THEMES[0];

    // Build the intent-driven content strategy
    let strategy = buildLocationContentStrategy({
      serviceName: mainService,
      cityData,
      businessInfo: businessInfo as SiteInfoJSON,
      angleIndex,
      allSelectedCities,
    });

    // If AI generation is requested and API key or provider is present, attempt AI enhancement
    let creds: any = null;
    try {
      creds = await getProviderCredentials(provider as ProviderType, apiKey, baseUrl, model, organizationId, providerName);
    } catch {}

    if (creds?.apiKey) {
      try {
        const systemPrompt = `You are a top-tier local SEO content strategist. Write a high-converting, strictly truthful location landing page for ${mainService} in ${cityData.city}, ${cityData.stateId} (${cityData.county} County).
Follow Google helpful content & local search guidelines strictly:
- Target intent: "${strategy.searchIntent}".
- Assigned local angle: "${strategy.assignedAngle}".
- Never fabricate fake local landmarks, fake reviews, fake licenses, or fake statistics.
- Respond with ONLY valid JSON (no markdown backticks, no preamble):
{
  "h1": "[Service] in [City], [State]",
  "metaTitle": "[Title under 60 chars with brand]",
  "metaDescription": "[Action-oriented description under 155 chars]",
  "introParagraph": "[Direct 80-120 word opening answering service, location, need, and action]",
  "angleSectionHeadline": "[Headline reflecting assigned angle]",
  "angleSectionContent": "<p>2-3 detailed paragraphs analyzing local challenges, climate standards, or property architecture.</p>"
}`;

        const userPrompt = `Business: ${businessInfo.businessName || "Local Specialist"}
Trade Service: ${mainService}
Location: ${cityData.city}, ${cityData.stateId} (${cityData.county} County)
Phone: ${businessInfo.phone || "(555) 123-4567"}
Intent: ${strategy.searchIntent}
Angle: ${strategy.assignedAngle}`;

        const rawText = await generateWebsite({
          provider: provider as ProviderType,
          apiKey: creds.apiKey,
          model: model || creds.defaultModel,
          prompt: userPrompt,
          systemPrompt,
          maxTokens: 2000,
          baseUrl: creds.baseUrl,
          organizationId: creds.organizationId,
          providerName: creds.providerName,
        });

        const cleanJson = rawText.replace(/```json|```/gi, "").trim();
        const parsed = JSON.parse(cleanJson);
        if (parsed.h1) strategy.h1 = parsed.h1;
        if (parsed.metaTitle) strategy.metaTitle = parsed.metaTitle;
        if (parsed.metaDescription) strategy.metaDescription = parsed.metaDescription;
        if (parsed.introParagraph) strategy.introParagraph = parsed.introParagraph;
        if (parsed.angleSectionHeadline) strategy.regionalClimateHeadline = parsed.angleSectionHeadline;
        if (parsed.angleSectionContent) strategy.regionalClimateContent = parsed.angleSectionContent;
      } catch (aiErr) {
        console.warn("[Location Engine] AI call skipped or failed, using robust rule-based content strategy:", aiErr);
      }
    }

    const resolvedHero = resolvePageImage(
      {
        pageTitle: `${mainService} in ${cityData.city}, ${cityData.stateId}`,
        city: cityData.city,
        state: cityData.stateName || cityData.stateId,
        stateCode: cityData.stateId,
        trade: mainService,
        slot: "hero",
        pageType: "location",
        targetKeyword: `${mainService.toLowerCase()} in ${cityData.city.toLowerCase()}`,
        width: 1200,
        height: 800,
      },
      {
        preferredSource: provider === "bing" ? "bing" : (provider as any),
        pexelsKey: apiKey,
      }
    );

    const context: LocationPageContext = {
      city: cityData.city,
      stateId: cityData.stateId,
      stateName: cityData.stateName || cityData.stateId,
      county: cityData.county || "Regional",
      population: cityData.population,
      distanceOffset: cityData.distanceOffset,
      zipCodes: cityData.zipCodes,
      localNotes: cityData.localNotes,
      angleUsed: strategy.assignedAngle,
      searchIntent: strategy.searchIntent,
      h1: strategy.h1,
      metaTitle: strategy.metaTitle,
      metaDescription: strategy.metaDescription,
      introParagraph: strategy.introParagraph,
      angleSectionHeadline: strategy.regionalClimateHeadline,
      angleSectionContent: strategy.regionalClimateContent,
      commonProblemsTitle: strategy.commonProblemsTitle,
      commonProblems: strategy.commonProblems,
      whenToCall: strategy.whenToCall,
      customerPrepSteps: strategy.customerPrepSteps,
      serviceScopeTitle: strategy.serviceScopeTitle,
      servicesIncluded: servicesList.length > 0 ? servicesList.slice(0, 6) : strategy.servicesOfferedInCity,
      processSteps: strategy.serviceScope,
      faqs: strategy.faqs,
      heroImage: {
        url: resolvedHero.url,
        fallbackUrl: resolvedHero.fallbackUrl,
        alt: resolvedHero.alt,
        width: resolvedHero.width,
        height: resolvedHero.height,
      },
    };

    let locationBodyHtml = renderLocationPage(
      context,
      businessInfo as SiteInfoJSON,
      theme,
      allSelectedCities,
      { lat: cityData.lat, lng: cityData.lng }
    );

    const slug = `${mainService.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${cityData.city.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${cityData.stateId.toLowerCase()}.html`;
    const schemaHtml = buildLocationPageSchema(context, businessInfo as SiteInfoJSON, domain, slug);

    // Run Quality & Uniqueness Audit against sibling pages
    let qualityScore = auditLocationPageQuality(locationBodyHtml, context, existingPages);

    // If similarity is too high (> 0.65), auto-diversify angle and re-render
    if (qualityScore.similarityMetrics.maxSimilarity > 0.65 && existingPages.length > 0) {
      console.log(`[Location Engine] Similarity (${Math.round(qualityScore.similarityMetrics.maxSimilarity * 100)}%) exceeded threshold. Auto-diversifying angle...`);
      strategy = buildLocationContentStrategy({
        serviceName: mainService,
        cityData,
        businessInfo: businessInfo as SiteInfoJSON,
        angleIndex: angleIndex + 2, // Rotate to distinct technical angle
        allSelectedCities,
      });

      context.angleUsed = strategy.assignedAngle;
      context.angleSectionHeadline = strategy.regionalClimateHeadline;
      context.angleSectionContent = strategy.regionalClimateContent;
      context.commonProblems = strategy.commonProblems;
      context.processSteps = strategy.serviceScope;
      context.faqs = strategy.faqs;

      locationBodyHtml = renderLocationPage(
        context,
        businessInfo as SiteInfoJSON,
        theme,
        allSelectedCities,
        { lat: cityData.lat, lng: cityData.lng }
      );

      qualityScore = auditLocationPageQuality(locationBodyHtml, context, existingPages);
    }

    return NextResponse.json({
      success: true,
      slug,
      context,
      locationBodyHtml,
      schemaHtml,
      angleUsed: context.angleUsed,
      strategy,
      qualityScore,
      status: qualityScore.status,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
