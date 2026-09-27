import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProviderCredentials } from "@/lib/ai/keys";
import { ProviderType, PROVIDER_PRESETS } from "@/lib/ai/types";
import { generateWebsite } from "@/lib/ai/generate-website";
import { WebsiteFormData, computeTargetPages } from "@/lib/generator/prompt";
import {
  AI_CONTENT_SYSTEM_PROMPT,
  QUALITY_REVIEW_SYSTEM_PROMPT,
  buildAIContentPrompt,
  buildQualityReviewPrompt,
  buildDefaultTradeContentJSON,
} from "@/lib/generator/ai-content-prompt";
import { validateContentJSON, SiteContentJSON } from "@/lib/generator/content-schema";
import { extractAndParseJSON, sanitizeDeep } from "@/lib/generator/validator";
import { assembleWebsite, AssembleOptions } from "@/templates/assembler";
import { THEMES, Theme } from "@/lib/themes";
import {
  parseKeywordList,
  formatKeywordsForStorage,
  parseLocationList,
  formatLocationsForStorage,
} from "@/lib/keywords/keyword-parser";

export const maxDuration = 180;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      provider = "gemini",
      model,
      apiKey,
      baseUrl,
      organizationId,
      providerName,
      formData,
      demo = false,
      pexelsKey,
      pixabayKey,
      preferredSource = "pexels",
      // Fallback individual fields if passed flatly
      name,
      businessName,
      businessType,
      serviceCategory,
      targetLocation,
      city,
      focusKeywords,
      targetKeywords,
      prompt,
    } = body;

    // Consolidate form data with all fields clearly captured
    const websiteData: WebsiteFormData = {
      businessName: (formData?.businessName || businessName || name || "").trim(),
      businessType: (formData?.businessType || serviceCategory || businessType || "").trim(),
      businessModel: formData?.businessModel || "storefront",
      nicheId: formData?.nicheId,
      schemaType: formData?.schemaType,
      businessDescription: (formData?.businessDescription || "").trim(),
      yearsInBusiness: (formData?.yearsInBusiness || "").trim(),
      licenseNumber: (formData?.licenseNumber || "").trim(),
      certifications: (formData?.certifications || "").trim(),
      warrantyGuarantee: (formData?.warrantyGuarantee || "").trim(),
      responseTime: (formData?.responseTime || "").trim(),
      emergency247: formData?.emergency247 !== undefined ? Boolean(formData.emergency247) : undefined,
      freeEstimates: formData?.freeEstimates !== undefined ? Boolean(formData.freeEstimates) : undefined,
      insuredBonded: formData?.insuredBonded !== undefined ? Boolean(formData.insuredBonded) : undefined,
      ownerName: (formData?.ownerName || "").trim(),
      ownerBio: (formData?.ownerBio || "").trim(),
      googleReviewUrl: (formData?.googleReviewUrl || "").trim(),
      realReviewsConfirmed: Boolean(formData?.realReviewsConfirmed),
      realReviews: Array.isArray(formData?.realReviews) ? formData.realReviews : undefined,
      allowedClaims: Array.isArray(formData?.allowedClaims) ? formData.allowedClaims : undefined,
      uniqueSellingPoints: (formData?.uniqueSellingPoints || "").trim(),
      servicesOffered: (formData?.servicesOffered || "").trim(),
      services: Array.isArray(formData?.services) ? formData.services : undefined,
      streetAddress: (formData?.streetAddress || "").trim(),
      city: (formData?.city || targetLocation || city || "").trim(),
      stateRegion: (formData?.stateRegion || "").trim(),
      zipPostalCode: (formData?.zipPostalCode || "").trim(),
      country: (formData?.country || "USA").trim(),
      serviceAreas: formatLocationsForStorage(
        parseLocationList(formData?.serviceAreasList || formData?.serviceAreas || formData?.locations || "")
      ),
      serviceAreasList: parseLocationList(
        formData?.serviceAreasList || formData?.serviceAreas || formData?.locations || ""
      ),
      phone: (formData?.phone || "").trim(),
      email: (formData?.email || "").trim(),
      businessHours: (formData?.businessHours || "").trim(),
      websiteDomain: (formData?.websiteDomain || "").trim(),
      targetKeywords: formatKeywordsForStorage(
        parseKeywordList(formData?.keywords || formData?.targetKeywords || focusKeywords || targetKeywords || "")
      ),
      keywords: parseKeywordList(
        formData?.keywords || formData?.targetKeywords || focusKeywords || targetKeywords || ""
      ),
      pagesToCreate: Array.isArray(formData?.pagesToCreate) && formData.pagesToCreate.length > 0
        ? formData.pagesToCreate
        : ["Home", "About", "Services", "Contact", "FAQ", "Service Areas"],
      separateServicePages: Boolean(formData?.separateServicePages),
      separateAreaPages: Boolean(formData?.separateAreaPages),
      brandColors: (formData?.brandColors || "").trim(),
      styleTone: (formData?.styleTone || "").trim(),
      googleMaps: (formData?.googleMaps || "").trim(),
      socialLinks: (formData?.socialLinks || "").trim(),
      logoUrl: (formData?.logoUrl || "").trim(),
      language: (formData?.language || "English").trim(),
      theme: formData?.theme || undefined,
      customContentInstructions: (formData?.customContentInstructions || "").trim(),
      extraInstructions: (formData?.extraInstructions || prompt || "").trim(),
    };

    // Validation for required fields
    if (!websiteData.businessName) {
      return NextResponse.json(
        { success: false, error: "Business / Website Name is required." },
        { status: 400 }
      );
    }
    if (!websiteData.businessType) {
      return NextResponse.json(
        { success: false, error: "Business Type / Industry is required." },
        { status: 400 }
      );
    }
    if (!websiteData.city) {
      return NextResponse.json(
        { success: false, error: "City is required for localized website generation." },
        { status: 400 }
      );
    }
    if (!websiteData.targetKeywords || (websiteData.keywords && websiteData.keywords.length === 0)) {
      return NextResponse.json(
        { success: false, error: "At least one target keyword is required." },
        { status: 400 }
      );
    }

    // Determine target theme
    const activeThemeId = websiteData.theme?.id || "modern-pro";
    const baseTheme = THEMES.find((t) => t.id === activeThemeId) || THEMES[0];
    const activeTheme: Theme = {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        ...(websiteData.theme?.colors || {}),
      },
      fonts: websiteData.theme?.fonts || baseTheme.fonts,
      borderRadius: websiteData.theme?.borderRadius || baseTheme.borderRadius,
      buttonStyle: websiteData.theme?.buttonStyle || baseTheme.buttonStyle,
      heroStyle: websiteData.theme?.heroStyle || baseTheme.heroStyle,
      sectionStyle: websiteData.theme?.sectionStyle || baseTheme.sectionStyle,
      designNotes: websiteData.theme?.designNotes || baseTheme.designNotes,
    };

    // Compute all target pages
    const targetPages = computeTargetPages(websiteData);
    console.log(
      `[Generate] Assembling ${targetPages.length} pages for "${websiteData.businessName}" in "${websiteData.city}" using theme "${activeTheme.name}".`
    );

    const effectivePexelsKey = (pexelsKey || formData?.pexelsKey || process.env.PEXELS_API_KEY || "").trim();
    const effectivePixabayKey = (pixabayKey || formData?.pixabayKey || process.env.PIXABAY_API_KEY || "").trim();
    const effectivePrefSource = (preferredSource || formData?.preferredSource || "bing") as
      | "bing"
      | "pexels"
      | "pixabay";

    const assembleOptions: AssembleOptions = {
      domain: websiteData.websiteDomain,
      mapEmbed: websiteData.googleMaps,
      pexelsKey: effectivePexelsKey || undefined,
      pixabayKey: effectivePixabayKey || undefined,
      preferredSource: effectivePrefSource,
      serviceAreaCities: Array.isArray(formData?.serviceAreaCities) ? formData.serviceAreaCities : undefined,
      customContentInstructions: websiteData.customContentInstructions || undefined,
    };

    // If explicit demo requested, immediately assemble using trade template defaults
    if (demo === true) {
      const defaultContent = buildDefaultTradeContentJSON(websiteData, targetPages);
      const assembled = await assembleWebsite(defaultContent, activeTheme, assembleOptions);

      const projectName = websiteData.businessName || "Static Website";
      return NextResponse.json({
        success: true,
        projectId: "demo-" + Date.now(),
        name: projectName,
        notes: `Complete static website assembled from section templates + real photos for ${activeTheme.name}.`,
        provider: "demo",
        model: "section-templates",
        createdAt: new Date().toISOString(),
        files: assembled.files,
        photos: assembled.photos || [],
        downloadUrl: `/api/projects/demo-${Date.now()}/download`,
      });
    }

    const providerType = provider as ProviderType;

    // 1. Get credentials for the provider
    let creds;
    try {
      creds = await getProviderCredentials(providerType, apiKey, baseUrl, model, organizationId, providerName);
      if (creds?.apiKey) {
        assembleOptions.providerCredentials = {
          apiKey: creds.apiKey,
          baseUrl: creds.baseUrl,
          provider: providerType,
          model: model || creds.defaultModel,
        };
      }
    } catch (err) {
      // If no API key configured, use default trade content JSON and assemble seamlessly
      console.warn("No API key configured. Generating with section template engine:", err);
      const defaultContent = buildDefaultTradeContentJSON(websiteData, targetPages);
      const assembled = await assembleWebsite(defaultContent, activeTheme, assembleOptions);

      const projectName = websiteData.businessName || "Static Website";
      return NextResponse.json({
        success: true,
        projectId: "assembled-" + Date.now(),
        name: projectName,
        notes: `Assembled from section templates + real trade photos. Add an API key in Settings to customize AI copy.`,
        provider: "template-engine",
        model: "curated-trade-engine",
        createdAt: new Date().toISOString(),
        files: assembled.files,
        photos: assembled.photos || [],
        downloadUrl: `/api/projects/assembled-${Date.now()}/download`,
      });
    }

    // 2. Select target model
    const targetModel =
      model || creds.defaultModel || PROVIDER_PRESETS[providerType]?.defaultModel || "gemini-1.5-pro";

    if (assembleOptions.providerCredentials) {
      assembleOptions.providerCredentials.model = targetModel;
    }

    // 3. Ask AI for content JSON with 3-Attempt Smart Retry System
    const contentPrompt = buildAIContentPrompt(websiteData, targetPages);
    let contentJSON: SiteContentJSON;
    let generationMethod = "ai";
    let lastError: string | null = null;

    try {
      console.log(`[Generate] Attempt 1: Requesting structured content JSON from ${providerType} (${targetModel})...`);
      const rawText = await generateWebsite({
        provider: providerType,
        apiKey: creds.apiKey,
        model: targetModel,
        prompt: contentPrompt,
        systemPrompt: AI_CONTENT_SYSTEM_PROMPT,
        maxTokens: 14000,
        baseUrl: creds.baseUrl,
        organizationId: creds.organizationId,
        providerName: creds.providerName,
      });

      const parsed = extractAndParseJSON(rawText);
      contentJSON = validateContentJSON(parsed);
    } catch (attempt1Err: any) {
      console.warn("[Generate] Attempt 1 failed:", attempt1Err?.message || attempt1Err);
      lastError = attempt1Err?.message || String(attempt1Err);

      // Attempt 2: Concise repair prompt with context
      try {
        console.log(`[Generate] Attempt 2: Sending concise JSON repair prompt to ${providerType}...`);
        const repairPrompt = `The previous response was not valid JSON or was truncated.
CRITICAL INSTRUCTION: Return ONLY a single valid JSON object matching the requested website content schema.
Do NOT include any preamble, commentary, or markdown text.
Begin directly with { and end with }.

Error details: ${lastError ? lastError.slice(0, 300) : "Invalid or truncated JSON"}

Original Request Summary:
Business: "${websiteData.businessName}"
Trade: "${websiteData.businessType}"
City: "${websiteData.city}"
Pages required: ${targetPages.join(", ")}
Services: ${((websiteData.services || []) as any[]).map((s) => typeof s === "string" ? s : s?.title || "").filter(Boolean).join(", ") || websiteData.servicesOffered || "Standard local trade services"}`;

        const repairRaw = await generateWebsite({
          provider: providerType,
          apiKey: creds.apiKey,
          model: targetModel,
          prompt: repairPrompt,
          systemPrompt: AI_CONTENT_SYSTEM_PROMPT,
          maxTokens: 14000,
          baseUrl: creds.baseUrl,
          organizationId: creds.organizationId,
          providerName: creds.providerName,
        });

        const retryParsed = extractAndParseJSON(repairRaw);
        contentJSON = validateContentJSON(retryParsed);
        generationMethod = "ai-repaired";
      } catch (attempt2Err: any) {
        console.warn("[Generate] Attempt 2 failed:", attempt2Err?.message || attempt2Err);
        lastError = attempt2Err?.message || String(attempt2Err);

        // Attempt 3: Structured trade template engine with targeted data merging
        console.log("[Generate] Attempt 3: Using structured trade template engine with targeted data merging.");
        contentJSON = buildDefaultTradeContentJSON(websiteData, targetPages);
        generationMethod = "trade-template-engine";
      }
    }

    // 3b. Optional Second AI Pass: "Quality Review"
    const enableQualityReview = body.qualityReview !== false && formData?.qualityReview !== false;
    let qualityReviewApplied = false;

    if (enableQualityReview && creds?.apiKey && generationMethod.startsWith("ai")) {
      console.log(`[Generate] Running optional Pass 2: Quality Review (auditing uniqueness, SEO & facts)...`);
      try {
        const reviewPrompt = buildQualityReviewPrompt(contentJSON, websiteData);
        const reviewRaw = await generateWebsite({
          provider: providerType,
          apiKey: creds.apiKey,
          model: targetModel,
          prompt: reviewPrompt,
          systemPrompt: QUALITY_REVIEW_SYSTEM_PROMPT,
          maxTokens: 14000,
          baseUrl: creds.baseUrl,
          organizationId: creds.organizationId,
          providerName: creds.providerName,
        });

        const parsedReview = extractAndParseJSON(reviewRaw);
        contentJSON = validateContentJSON(parsedReview);
        qualityReviewApplied = true;
        console.log(`[Generate] Quality Review pass completed successfully.`);
      } catch (reviewErr) {
        console.warn("[Generate] Quality Review pass encountered an issue; falling back cleanly to initial pass content:", reviewErr);
      }
    }

    // Enforce Ground-Truth Facts & Sanitize Placeholders
    const sanitizationCtx = {
      businessName: websiteData.businessName,
      phone: websiteData.phone,
      streetAddress: websiteData.businessModel === "service-area" ? "" : websiteData.streetAddress,
      city: websiteData.city,
      state: websiteData.stateRegion,
      zip: websiteData.zipPostalCode,
      email: websiteData.email,
      licenseNumber: websiteData.licenseNumber || undefined,
      certifications: websiteData.certifications || undefined,
      warrantyGuarantee: websiteData.warrantyGuarantee || undefined,
      emergency247: websiteData.emergency247,
      freeEstimates: websiteData.freeEstimates,
      insuredBonded: websiteData.insuredBonded,
      realReviewsConfirmed: websiteData.realReviewsConfirmed,
      realReviews: websiteData.realReviews,
    };

    // Deep sanitize text strings throughout contentJSON
    contentJSON = sanitizeDeep(contentJSON, sanitizationCtx);

    // Merge ground-truth facts from websiteData into contentJSON.site
    contentJSON.site = {
      ...contentJSON.site,
      businessName: websiteData.businessName || contentJSON.site.businessName,
      phone: websiteData.phone || contentJSON.site.phone,
      email: websiteData.email || contentJSON.site.email,
      businessModel: websiteData.businessModel || contentJSON.site.businessModel || "storefront",
      licenseNumber: websiteData.licenseNumber || undefined,
      certifications: websiteData.certifications || undefined,
      yearsInBusiness: websiteData.yearsInBusiness || undefined,
      warrantyGuarantee: websiteData.warrantyGuarantee || undefined,
      responseTime: websiteData.responseTime || undefined,
      emergency247: websiteData.emergency247 !== undefined ? websiteData.emergency247 : contentJSON.site.emergency247,
      freeEstimates: websiteData.freeEstimates !== undefined ? websiteData.freeEstimates : contentJSON.site.freeEstimates,
      insuredBonded: websiteData.insuredBonded !== undefined ? websiteData.insuredBonded : contentJSON.site.insuredBonded,
      ownerName: websiteData.ownerName || undefined,
      ownerBio: websiteData.ownerBio || undefined,
      googleReviewUrl: websiteData.googleReviewUrl || undefined,
      realReviewsConfirmed: websiteData.realReviewsConfirmed,
      realReviews: websiteData.realReviewsConfirmed ? websiteData.realReviews : undefined,
      allowedClaims: websiteData.allowedClaims,
      customContentInstructions: websiteData.customContentInstructions || contentJSON.site.customContentInstructions,
    };

    if (contentJSON.site.address) {
      contentJSON.site.address.city = websiteData.city || contentJSON.site.address.city;
      if (websiteData.stateRegion) contentJSON.site.address.state = websiteData.stateRegion;
      if (websiteData.zipPostalCode) contentJSON.site.address.zip = websiteData.zipPostalCode;
      if (websiteData.businessModel === "service-area" || !websiteData.streetAddress) {
        contentJSON.site.address.street = "";
      } else {
        contentJSON.site.address.street = websiteData.streetAddress;
      }
    }

    // 4. Assemble final website from pre-built section templates + design tokens + real photos
    console.log(`[Generate] Assembling website pages from section template library...`);
    const assembled = await assembleWebsite(contentJSON, activeTheme, assembleOptions);

    const projectName = websiteData.businessName || "Static Website";

    // 5. Optional non-blocking database record
    let projectId = "site-" + Date.now();
    try {
      const project = await db.project.create({
        data: {
          name: projectName,
          prompt: `Theme: ${activeTheme.name} | Pages: ${assembled.files.filter((f) => f.path.endsWith(".html")).length} | Biz: ${websiteData.businessName}`,
          provider: providerType,
          model: targetModel,
          status: "ready",
          notes: qualityReviewApplied
            ? `Assembled static website (${assembled.files.length} files) with two-pass Quality Review audit + real photos.`
            : `Assembled static website (${assembled.files.length} files) from section template library + AI content + real trade photos.`,
          customInstructions: websiteData.customContentInstructions || null,
          files: {
            create: assembled.files.map((f) => ({
              path: f.path,
              content: typeof f.content === "string" ? f.content : f.content.toString("base64"),
              mimeType: f.mimeType || "text/plain",
            })),
          },
        },
      });
      projectId = project.id;
    } catch (dbErr) {
      console.warn("Database storage skipped (stateless execution):", dbErr);
    }

    return NextResponse.json({
      success: true,
      projectId,
      name: projectName,
      notes: qualityReviewApplied
        ? `Complete static website assembled successfully with two-pass Quality Review audit and real photos.`
        : `Complete static website assembled successfully with professional section templates and real photos.`,
      qualityReviewApplied,
      provider: providerType,
      model: targetModel,
      createdAt: new Date().toISOString(),
      files: assembled.files,
      photos: assembled.photos || [],
      qualityReport: assembled.qualityReport,
      downloadUrl: `/api/projects/${projectId}/download`,
    });
  } catch (error) {
    console.error("Website generation failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate website.",
      },
      { status: 500 }
    );
  }
}
