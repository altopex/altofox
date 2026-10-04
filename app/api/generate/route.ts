import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProviderCredentials } from "@/lib/ai/keys";
import { ProviderType, PROVIDER_PRESETS } from "@/lib/ai/types";
import { getProviderProfile, listProviderProfiles } from "@/lib/ai/provider-manager";
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
import { tempStorage } from "@/lib/storage/temp-storage";
import { gatewayRequest } from "@/lib/ai/provider-gateway";
import {
  GenerationPipelineTracker,
  GenerationFailureStage,
  GenerationStageName,
} from "@/lib/pipeline/generation-pipeline";

export const maxDuration = 180;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const tracker = new GenerationPipelineTracker();

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
      googleKey,
      googleCx,
      preferredSource = "bing",
      // Fallback individual fields if passed flatly
      name,
      businessName,
      businessType,
      serviceCategory,
      targetLocation,
      city,
      focusKeywords,
      targetKeywords,
      keywords,
      prompt,
    } = body;

    // =========================================================================
    // STAGE 1: QUEUED
    // =========================================================================
    tracker.startStage("QUEUED", "Validating business parameters and generation settings...");

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
        parseKeywordList(formData?.keywords || formData?.targetKeywords || keywords || focusKeywords || targetKeywords || "")
      ),
      keywords: parseKeywordList(
        formData?.keywords || formData?.targetKeywords || keywords || focusKeywords || targetKeywords || ""
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
      tracker.failStage("QUEUED", "FAILED_CONTENT", "Business / Website Name is required.", true);
      return NextResponse.json(
        { success: false, failedStage: "FAILED_CONTENT", error: "Business / Website Name is required.", pipeline: tracker.getState() },
        { status: 400 }
      );
    }
    if (!websiteData.businessType) {
      tracker.failStage("QUEUED", "FAILED_CONTENT", "Business Type / Industry is required.", true);
      return NextResponse.json(
        { success: false, failedStage: "FAILED_CONTENT", error: "Business Type / Industry is required.", pipeline: tracker.getState() },
        { status: 400 }
      );
    }
    if (!websiteData.city) {
      tracker.failStage("QUEUED", "FAILED_CONTENT", "City is required for localized website generation.", true);
      return NextResponse.json(
        { success: false, failedStage: "FAILED_CONTENT", error: "City is required for localized website generation.", pipeline: tracker.getState() },
        { status: 400 }
      );
    }
    if (!websiteData.targetKeywords || (websiteData.keywords && websiteData.keywords.length === 0)) {
      tracker.failStage("QUEUED", "FAILED_CONTENT", "At least one target keyword is required.", true);
      return NextResponse.json(
        { success: false, failedStage: "FAILED_CONTENT", error: "At least one target keyword is required.", pipeline: tracker.getState() },
        { status: 400 }
      );
    }

    tracker.completeStage("QUEUED", "Input parameters verified successfully.");

    // =========================================================================
    // STAGE 2: RESEARCHING
    // =========================================================================
    tracker.startStage("RESEARCHING", "Analyzing trade niche, service areas, and local market...");

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

    tracker.completeStage("RESEARCHING", `Theme "${activeTheme.name}" and trade profile resolved.`);

    // =========================================================================
    // STAGE 3: BLUEPRINT_READY
    // =========================================================================
    tracker.startStage("BLUEPRINT_READY", "Computing page architecture and sitemap blueprints...");

    const targetPages = computeTargetPages(websiteData);
    console.log(
      `[Pipeline] Assembling ${targetPages.length} pages for "${websiteData.businessName}" in "${websiteData.city}" using theme "${activeTheme.name}".`
    );

    tracker.completeStage("BLUEPRINT_READY", `Site blueprint ready: ${targetPages.length} pages mapped.`);

    // =========================================================================
    // STAGE 4: CONTENT_PLANNING
    // =========================================================================
    tracker.startStage("CONTENT_PLANNING", "Structuring section schemas and conversion prompts...");

    const effectivePexelsKey = (pexelsKey || formData?.pexelsKey || process.env.PEXELS_API_KEY || "").trim();
    const effectivePixabayKey = (pixabayKey || formData?.pixabayKey || process.env.PIXABAY_API_KEY || "").trim();
    const effectiveGoogleKey = (googleKey || formData?.googleKey || process.env.GOOGLE_SEARCH_API_KEY || process.env.GOOGLE_CUSTOM_SEARCH_KEY || "").trim();
    const effectiveGoogleCx = (googleCx || formData?.googleCx || process.env.GOOGLE_SEARCH_ENGINE_ID || process.env.GOOGLE_CUSTOM_SEARCH_CX || "").trim();
    const effectivePrefSource = (preferredSource || formData?.preferredSource || "bing") as
      | "bing"
      | "pexels"
      | "pixabay"
      | "google"
      | "ai";

    const assembleOptions: AssembleOptions = {
      domain: websiteData.websiteDomain,
      mapEmbed: websiteData.googleMaps,
      pexelsKey: effectivePexelsKey || undefined,
      pixabayKey: effectivePixabayKey || undefined,
      googleKey: effectiveGoogleKey || undefined,
      googleCx: effectiveGoogleCx || undefined,
      preferredSource: effectivePrefSource,
      serviceAreaCities: Array.isArray(formData?.serviceAreaCities) ? formData.serviceAreaCities : undefined,
      customContentInstructions: websiteData.customContentInstructions || undefined,
      onProgress: (stageName: GenerationStageName, progressPct: number, msg: string) => {
        tracker.startStage(stageName, msg, progressPct);
        tracker.completeStage(stageName, msg);
      },
    };

    tracker.completeStage("CONTENT_PLANNING", "Conversion prompts and schemas structured.");

    // =========================================================================
    // STAGE 5: GENERATING_CONTENT
    // =========================================================================
    tracker.startStage("GENERATING_CONTENT", "Generating structured content via AI Provider Gateway...");

    let contentJSON: SiteContentJSON;
    let generationMethod = "ai";
    let qualityReviewApplied = false;
    const providerType = provider as ProviderType;
    let targetModel = model || "gemini-1.5-pro";

    // Fast-path for explicit demo template generation
    if (demo === true) {
      contentJSON = buildDefaultTradeContentJSON(websiteData, targetPages);
      generationMethod = "demo-templates";
      tracker.completeStage("GENERATING_CONTENT", "Curated template content loaded.");
    } else {
      // 1. Resolve Provider Credentials
      let creds: any;
      let resolvedProvider = provider;

      try {
        const targetProviderId = body.providerId;
        if (targetProviderId) {
          const prof = await getProviderProfile(targetProviderId);
          if (prof && prof.apiKey) {
            creds = {
              apiKey: prof.apiKey,
              baseUrl: prof.baseUrl,
              defaultModel: prof.model,
              organizationId: prof.organizationId,
              providerName: prof.name,
            };
            resolvedProvider = prof.presetId || prof.apiType || "custom";
          }
        }

        if (!creds && !apiKey) {
          const { profiles, settings } = await listProviderProfiles();
          const active = profiles.find((p) => p.id === settings.activeProviderId && p.hasKey);
          if (active) {
            const fullProf = await getProviderProfile(active.id);
            if (fullProf?.apiKey) {
              creds = {
                apiKey: fullProf.apiKey,
                baseUrl: fullProf.baseUrl,
                defaultModel: fullProf.model,
                organizationId: fullProf.organizationId,
                providerName: fullProf.name,
              };
              resolvedProvider = fullProf.presetId || fullProf.apiType || "custom";
            }
          }
        }

        if (!creds) {
          creds = await getProviderCredentials(providerType, apiKey, baseUrl, model, organizationId, providerName);
        }

        if (creds?.apiKey) {
          assembleOptions.providerCredentials = {
            apiKey: creds.apiKey,
            baseUrl: creds.baseUrl,
            provider: resolvedProvider || providerType,
            model: model || creds.defaultModel,
          };
        }
      } catch (err: any) {
        console.warn("Could not resolve credentials for provider:", err);
        const errMsg = `No API key configured for provider "${providerType}". Please add your API key in Settings or click "Assemble with Curated Templates".`;
        tracker.failStage("GENERATING_CONTENT", "FAILED_PROVIDER", errMsg, true);
        return NextResponse.json(
          {
            success: false,
            failedStage: "FAILED_PROVIDER",
            error: errMsg,
            canFallbackToTemplates: true,
            provider: providerType,
            pipeline: tracker.getState(),
          },
          { status: 400 }
        );
      }

      if (!creds?.apiKey) {
        const errMsg = `No API key configured for provider "${providerType}". Please configure your API key in Settings or click "Assemble with Curated Templates".`;
        tracker.failStage("GENERATING_CONTENT", "FAILED_PROVIDER", errMsg, true);
        return NextResponse.json(
          {
            success: false,
            failedStage: "FAILED_PROVIDER",
            error: errMsg,
            canFallbackToTemplates: true,
            provider: providerType,
            pipeline: tracker.getState(),
          },
          { status: 400 }
        );
      }

      targetModel = model || creds.defaultModel || PROVIDER_PRESETS[providerType]?.defaultModel || "gemini-1.5-pro";
      if (assembleOptions.providerCredentials) {
        assembleOptions.providerCredentials.model = targetModel;
      }

      const contentPrompt = buildAIContentPrompt(websiteData, targetPages);
      let lastError: string | null = null;

      try {
        console.log(`[Pipeline] Attempt 1: Requesting structured content from ${providerType} (${targetModel})...`);
        const attempt1 = await gatewayRequest({
          prompt: contentPrompt,
          systemPrompt: AI_CONTENT_SYSTEM_PROMPT,
          directCredentials: {
            provider: resolvedProvider || providerType,
            apiKey: creds.apiKey,
            baseUrl: creds.baseUrl,
            model: targetModel,
            organizationId: creds.organizationId,
            providerName: creds.providerName,
          },
          model: targetModel,
          responseFormat: "text",
          maxTokens: 4000,
          timeoutMs: 30000,
          feature: "website-generation",
        });

        const parsed = extractAndParseJSON(attempt1.text);
        contentJSON = validateContentJSON(parsed);
      } catch (attempt1Err: any) {
        console.warn("[Pipeline] Attempt 1 failed:", attempt1Err?.message || attempt1Err);
        lastError = attempt1Err?.message || String(attempt1Err);

        const errLower = (lastError || "").toLowerCase();
        const isAuthError =
          errLower.includes("401") ||
          errLower.includes("unauthorized") ||
          errLower.includes("invalid api key") ||
          errLower.includes("403") ||
          errLower.includes("forbidden");

        if (isAuthError) {
          console.warn(`[Pipeline] Authentication failure for ${providerType}. Skipping Attempt 2.`);
          const errMsg = `AI generation failed: ${lastError}`;
          tracker.failStage("GENERATING_CONTENT", "FAILED_PROVIDER", errMsg, false);
          return NextResponse.json(
            {
              success: false,
              failedStage: "FAILED_PROVIDER",
              error: errMsg,
              canFallbackToTemplates: true,
              isAuthError: true,
              provider: providerType,
              model: targetModel,
              pipeline: tracker.getState(),
            },
            { status: 401 }
          );
        }

        // Attempt 2: Concise repair prompt with context (20s budget)
        try {
          console.log(`[Pipeline] Attempt 2: Sending concise JSON repair prompt to ${providerType}...`);
          const pageLabels = (targetPages as any[])
            .map((p) => (typeof p === "string" ? p : p?.slug || p?.title || ""))
            .filter(Boolean)
            .join(", ");

          const repairPrompt = `The previous response was not valid JSON or was truncated.
CRITICAL INSTRUCTION: Return ONLY a single valid JSON object matching the requested website content schema.
Do NOT include any preamble, commentary, or markdown text.
Begin directly with { and end with }.

Error details: ${lastError ? lastError.slice(0, 300) : "Invalid or truncated JSON"}

Original Request Summary:
Business: "${websiteData.businessName}"
Trade: "${websiteData.businessType}"
City: "${websiteData.city}"
Pages required: ${pageLabels}
Services: ${((websiteData.services || []) as any[]).map((s) => typeof s === "string" ? s : s?.title || "").filter(Boolean).join(", ") || websiteData.servicesOffered || "Standard local trade services"}`;

          const attempt2 = await gatewayRequest({
            prompt: repairPrompt,
            systemPrompt: AI_CONTENT_SYSTEM_PROMPT,
            directCredentials: {
              provider: resolvedProvider || providerType,
              apiKey: creds.apiKey,
              baseUrl: creds.baseUrl,
              model: targetModel,
              organizationId: creds.organizationId,
              providerName: creds.providerName,
            },
            model: targetModel,
            responseFormat: "text",
            maxTokens: 4000,
            timeoutMs: 20000,
            feature: "repair",
          });

          const retryParsed = extractAndParseJSON(attempt2.text);
          contentJSON = validateContentJSON(retryParsed);
          generationMethod = "ai-repaired";
        } catch (attempt2Err: any) {
          console.warn("[Pipeline] Attempt 2 failed:", attempt2Err?.message || attempt2Err);
          lastError = attempt2Err?.message || String(attempt2Err);

          const errMsg = `AI generation failed: ${lastError}`;
          tracker.failStage("GENERATING_CONTENT", "FAILED_CONTENT", errMsg, true);
          return NextResponse.json(
            {
              success: false,
              failedStage: "FAILED_CONTENT",
              error: errMsg,
              canFallbackToTemplates: true,
              provider: providerType,
              model: targetModel,
              pipeline: tracker.getState(),
            },
            { status: 502 }
          );
        }
      }

      // Optional Second AI Pass: "Quality Review"
      const enableQualityReview = body.qualityReview === true || formData?.qualityReview === true;
      if (enableQualityReview && creds?.apiKey && generationMethod.startsWith("ai")) {
        console.log(`[Pipeline] Running optional Pass 2: Quality Review...`);
        try {
          const reviewPrompt = buildQualityReviewPrompt(contentJSON, websiteData);
          const reviewResponse = await gatewayRequest({
            prompt: reviewPrompt,
            systemPrompt: QUALITY_REVIEW_SYSTEM_PROMPT,
            directCredentials: {
              provider: resolvedProvider || providerType,
              apiKey: creds.apiKey,
              baseUrl: creds.baseUrl,
              model: targetModel,
              organizationId: creds.organizationId,
              providerName: creds.providerName,
            },
            model: targetModel,
            responseFormat: "text",
            maxTokens: 4000,
            timeoutMs: 20000,
            feature: "quality-review",
          });
          const parsedReview = extractAndParseJSON(reviewResponse.text);
          contentJSON = validateContentJSON(parsedReview);
          qualityReviewApplied = true;
        } catch (reviewErr) {
          console.warn("[Pipeline] Quality Review pass issue; falling back cleanly to initial pass content:", reviewErr);
        }
      }

      tracker.completeStage("GENERATING_CONTENT", "Structured website copy generated and validated.");
    }

    // =========================================================================
    // Ground-Truth Fact Sanitization & Hard Constraints
    // =========================================================================
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

    contentJSON = sanitizeDeep(contentJSON, sanitizationCtx);

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

    // =========================================================================
    // STAGES 6–12: Handled cleanly by Assembler lifecycle hooks
    // (COLLECTING_IMAGES → BUILDING_PAGES → GENERATING_INTERNAL_LINKS →
    //  GENERATING_SEO → RUNNING_AUDIT → AUTO_FIXING → FINAL_VALIDATION)
    // =========================================================================
    let assembled: any;
    try {
      console.log(`[Pipeline] Assembling website pages from section template library...`);
      assembled = await assembleWebsite(contentJSON, activeTheme, assembleOptions);
    } catch (assemblerErr: any) {
      console.error("[Pipeline] Assembler failed:", assemblerErr);
      const activeStage = tracker.getState().activeStageName;
      let failureStage: GenerationFailureStage = "FAILED_RENDER";

      if (activeStage === "COLLECTING_IMAGES") failureStage = "FAILED_IMAGE";
      else if (activeStage === "GENERATING_INTERNAL_LINKS") failureStage = "FAILED_LINKING";
      else if (activeStage === "GENERATING_SEO") failureStage = "FAILED_SEO";
      else if (activeStage === "RUNNING_AUDIT" || activeStage === "AUTO_FIXING") failureStage = "FAILED_AUDIT";

      const errMsg = assemblerErr instanceof Error ? assemblerErr.message : "Website assembly failed.";
      tracker.failStage(activeStage, failureStage, errMsg, false);
      return NextResponse.json(
        {
          success: false,
          failedStage: failureStage,
          error: errMsg,
          pipeline: tracker.getState(),
        },
        { status: 500 }
      );
    }

    // =========================================================================
    // STAGE 13: PACKAGING
    // =========================================================================
    tracker.startStage("PACKAGING", "Packaging static assets and registering preview bundle...");

    const projectName = websiteData.businessName || "Static Website";
    const saveToDb = Boolean(body.saveToDb);
    let projectId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    let isSaved = false;

    try {
      tempStorage.register({
        id: projectId,
        name: projectName,
        files: assembled.files.map((f: any) => ({
          path: f.path,
          content: f.content,
          mimeType: f.mimeType || "text/plain",
        })),
        photos: assembled.photos || [],
        qualityReport: assembled.qualityReport,
        notes: qualityReviewApplied
          ? `Assembled static website (${assembled.files.length} files) with two-pass Quality Review audit + real photos.`
          : `Assembled static website (${assembled.files.length} files) from section template library + AI content + real trade photos.`,
        provider: providerType,
        model: targetModel,
        domain: websiteData.websiteDomain,
        themeName: activeTheme.name,
        customContentInstructions: websiteData.customContentInstructions || undefined,
        formData,
      });

      if (saveToDb) {
        try {
          const project = await db.project.create({
            data: {
              name: projectName,
              prompt: `Theme: ${activeTheme.name} | Pages: ${assembled.files.filter((f: any) => f.path.endsWith(".html")).length} | Biz: ${websiteData.businessName}`,
              provider: providerType,
              model: targetModel,
              status: "saved",
              notes: JSON.stringify({
                notes: qualityReviewApplied
                  ? `Assembled static website (${assembled.files.length} files) with two-pass Quality Review audit + real photos.`
                  : `Assembled static website (${assembled.files.length} files) from section template library + AI content + real trade photos.`,
                businessName: websiteData.businessName,
                domain: websiteData.websiteDomain,
                themeName: activeTheme.name,
                themeId: activeTheme.id,
                niche: websiteData.businessType,
                city: websiteData.city,
                state: websiteData.stateRegion,
                overallScore: assembled.qualityReport?.overallScore,
                lastOptimizedAt: Date.now(),
              }),
              customInstructions: websiteData.customContentInstructions || null,
              files: {
                create: assembled.files.map((f: any) => ({
                  path: f.path,
                  content: typeof f.content === "string" ? f.content : f.content.toString("base64"),
                  mimeType: f.mimeType || "text/plain",
                })),
              },
            },
          });
          projectId = project.id;
          isSaved = true;
        } catch (dbErr) {
          console.warn("Database storage skipped (stateless execution):", dbErr);
        }
      }

      tracker.completeStage("PACKAGING", "Package registered in storage.");
    } catch (packErr: any) {
      const errMsg = packErr instanceof Error ? packErr.message : "Failed to package generated website.";
      tracker.failStage("PACKAGING", "FAILED_PACKAGE", errMsg, false);
      return NextResponse.json(
        {
          success: false,
          failedStage: "FAILED_PACKAGE",
          error: errMsg,
          pipeline: tracker.getState(),
        },
        { status: 500 }
      );
    }

    // =========================================================================
    // STAGE 14: READY
    // =========================================================================
    tracker.completePipeline();

    return NextResponse.json({
      success: true,
      projectId,
      isSaved,
      name: projectName,
      notes: qualityReviewApplied
        ? `Complete static website assembled successfully with two-pass Quality Review audit and real photos.`
        : `Complete static website assembled successfully with professional section templates and real photos.`,
      qualityReviewApplied,
      generationMethod,
      provider: providerType,
      model: targetModel,
      createdAt: new Date().toISOString(),
      files: assembled.files,
      photos: assembled.photos || [],
      qualityReport: assembled.qualityReport,
      pipeline: tracker.getState(),
      downloadUrl: `/api/projects/${projectId}/download`,
    });
  } catch (error) {
    console.error("[Pipeline] Website generation failed:", error);
    const activeStage = tracker.getState().activeStageName;
    const errMsg = error instanceof Error ? error.message : "Failed to generate website.";
    tracker.failStage(activeStage, "FAILED_RENDER", errMsg, false);

    return NextResponse.json(
      {
        success: false,
        failedStage: "FAILED_RENDER",
        error: errMsg,
        pipeline: tracker.getState(),
      },
      { status: 500 }
    );
  }
}
