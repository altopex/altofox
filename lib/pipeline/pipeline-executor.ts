import { db } from "@/lib/db";
import { getProviderCredentials } from "@/lib/ai/keys";
import { ProviderType, PROVIDER_PRESETS } from "@/lib/ai/types";
import { normalizeModelForProvider } from "@/lib/ai/provider-models";
import { getProviderProfile, listProviderProfiles } from "@/lib/ai/provider-manager";
import { WebsiteFormData, computeTargetPages } from "@/lib/generator/prompt";
import {
  QUALITY_REVIEW_SYSTEM_PROMPT,
  buildQualityReviewPrompt,
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
import { createSiteBlueprint, SiteBlueprint } from "@/lib/blueprint/site-blueprint";
import { generateSiteContentFromBlueprint } from "@/lib/generator/content-generators";
import {
  GenerationPipelineTracker,
  GenerationFailureStage,
  GenerationStageName,
  PipelineState,
} from "@/lib/pipeline/generation-pipeline";
import { QualityAuditResult } from "@/lib/quality/quality-audit-engine";

export interface GenerationPipelineInput {
  provider?: string;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  organizationId?: string;
  providerName?: string;
  providerId?: string;
  formData?: any;
  demo?: boolean;
  pexelsKey?: string;
  pixabayKey?: string;
  googleKey?: string;
  googleCx?: string;
  preferredSource?: "bing" | "google" | "none" | "pexels" | "pixabay" | "ai" | string;
  // Flat fallback fields
  name?: string;
  businessName?: string;
  businessType?: string;
  serviceCategory?: string;
  targetLocation?: string;
  city?: string;
  focusKeywords?: string;
  targetKeywords?: string;
  keywords?: string;
  prompt?: string;
  qualityReview?: boolean;
  saveToDb?: boolean;
}

export interface GenerationPipelineResult {
  success: boolean;
  projectId?: string;
  isSaved?: boolean;
  name?: string;
  notes?: string;
  qualityReviewApplied?: boolean;
  generationMethod?: string;
  provider?: string;
  model?: string;
  createdAt?: string;
  files?: Array<{ path: string; content: string | Buffer; mimeType?: string }>;
  photos?: any[];
  qualityReport?: any;
  qualityAudit?: QualityAuditResult;
  pipeline: PipelineState;
  blueprint?: SiteBlueprint;
  downloadUrl?: string;
  failedStage?: GenerationFailureStage;
  error?: string;
  canFallbackToTemplates?: boolean;
  isAuthError?: boolean;
}

/**
 * Centralized generation pipeline executor.
 * Executes all 14 stages deterministically with real progress, accurate timings,
 * and robust failure isolation.
 */
export async function executeGenerationPipeline(
  input: GenerationPipelineInput,
  existingTracker?: GenerationPipelineTracker
): Promise<GenerationPipelineResult> {
  const tracker = existingTracker || new GenerationPipelineTracker();

  const {
    provider = "gemini",
    model,
    apiKey,
    baseUrl,
    organizationId,
    providerName,
    providerId,
    formData,
    demo = false,
    pexelsKey,
    pixabayKey,
    googleKey,
    googleCx,
    preferredSource = "bing",
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
    qualityReview,
    saveToDb = false,
  } = input;

  // =========================================================================
  // STAGE 1: QUEUED
  // =========================================================================
  tracker.startStage("QUEUED", "Validating business parameters and generation settings...");

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
    pagesToCreate:
      Array.isArray(formData?.pagesToCreate) && formData.pagesToCreate.length > 0
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

  if (!websiteData.businessName) {
    const errMsg = "Business / Website Name is required.";
    tracker.failStage("QUEUED", "FAILED_CONTENT", errMsg, true);
    return {
      success: false,
      failedStage: "FAILED_CONTENT",
      error: errMsg,
      canFallbackToTemplates: false,
      pipeline: tracker.getState(),
    };
  }
  if (!websiteData.businessType) {
    const errMsg = "Business Type / Industry is required.";
    tracker.failStage("QUEUED", "FAILED_CONTENT", errMsg, true);
    return {
      success: false,
      failedStage: "FAILED_CONTENT",
      error: errMsg,
      canFallbackToTemplates: false,
      pipeline: tracker.getState(),
    };
  }
  if (!websiteData.city) {
    const errMsg = "City is required for localized website generation.";
    tracker.failStage("QUEUED", "FAILED_CONTENT", errMsg, true);
    return {
      success: false,
      failedStage: "FAILED_CONTENT",
      error: errMsg,
      canFallbackToTemplates: false,
      pipeline: tracker.getState(),
    };
  }
  if (!websiteData.targetKeywords || (websiteData.keywords && websiteData.keywords.length === 0)) {
    const errMsg = "At least one target keyword is required.";
    tracker.failStage("QUEUED", "FAILED_CONTENT", errMsg, true);
    return {
      success: false,
      failedStage: "FAILED_CONTENT",
      error: errMsg,
      canFallbackToTemplates: false,
      pipeline: tracker.getState(),
    };
  }

  tracker.completeStage("QUEUED", "Input parameters verified successfully.");

  // =========================================================================
  // STAGE 2: RESEARCHING
  // =========================================================================
  tracker.startStage("RESEARCHING", "Analyzing trade niche, service areas, and local market...");

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
  tracker.startStage("BLUEPRINT_READY", "Synthesizing structured Site Blueprint architecture...");

  const effectivePexelsKey = (pexelsKey || formData?.pexelsKey || process.env.PEXELS_API_KEY || "").trim();
  const effectivePixabayKey = (pixabayKey || formData?.pixabayKey || process.env.PIXABAY_API_KEY || "").trim();
  const effectiveGoogleKey = (
    googleKey ||
    formData?.googleKey ||
    process.env.GOOGLE_SEARCH_API_KEY ||
    process.env.GOOGLE_CUSTOM_SEARCH_KEY ||
    ""
  ).trim();
  const effectiveGoogleCx = (
    googleCx ||
    formData?.googleCx ||
    process.env.GOOGLE_SEARCH_ENGINE_ID ||
    process.env.GOOGLE_CUSTOM_SEARCH_CX ||
    ""
  ).trim();
  const effectivePrefSource = (preferredSource || formData?.preferredSource || "bing") as
    | "bing"
    | "google"
    | "none"
    | "pexels"
    | "pixabay"
    | "ai";

  const siteBlueprint = createSiteBlueprint({
    businessName: websiteData.businessName,
    businessDescription: websiteData.businessDescription,
    niche: websiteData.businessType,
    primaryCity: websiteData.city,
    state: websiteData.stateRegion,
    services:
      websiteData.services ||
      (websiteData.servicesOffered
        ? websiteData.servicesOffered.split(/[\n,]+/).map((s: string) => s.trim()).filter(Boolean)
        : undefined),
    locations:
      websiteData.serviceAreasList ||
      (websiteData.serviceAreas ? parseLocationList(websiteData.serviceAreas) : undefined),
    keywords: websiteData.keywords || websiteData.targetKeywords,
    phone: websiteData.phone,
    streetAddress: websiteData.streetAddress,
    theme: activeTheme,
    selectedTheme: activeTheme.id,
    preferredSource: effectivePrefSource,
    separateServicePages: websiteData.separateServicePages,
    separateAreaPages: websiteData.separateAreaPages,
    pagesToCreate: websiteData.pagesToCreate,
    yearsInBusiness: websiteData.yearsInBusiness,
    licenseNumber: websiteData.licenseNumber,
    styleTone: websiteData.styleTone,
    uniqueSellingPoints: websiteData.uniqueSellingPoints,
    customContentInstructions: websiteData.customContentInstructions,
  });

  computeTargetPages(websiteData, siteBlueprint);

  tracker.completeStage(
    "BLUEPRINT_READY",
    `Site blueprint ready (${siteBlueprint.siteSeed}): ${siteBlueprint.pageCount} pages mapped.`
  );

  // =========================================================================
  // STAGE 4: CONTENT_PLANNING
  // =========================================================================
  tracker.startStage("CONTENT_PLANNING", "Structuring section schemas and conversion prompts...");

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
    blueprint: siteBlueprint,
    hasBlog: Boolean((websiteData as any)?.hasBlog || (websiteData as any)?.includeBlog || (input as any)?.includeBlog || (formData as any)?.hasBlog),
    blogPosts: Array.isArray((formData as any)?.blogPosts) ? (formData as any).blogPosts : undefined,
    tracker,
    validateNetwork: false,
    fastOfflinePreview: true,
    onProgress: (stageName: GenerationStageName, progressPct: number, msg: string) => {
      tracker.updateProgress(stageName, progressPct, msg);
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
  let targetModel = normalizeModelForProvider(
    providerType || "gemini",
    model || PROVIDER_PRESETS[providerType]?.defaultModel || "gemini-3.8-flash"
  );

  const verifiedFacts = {
    businessName: websiteData.businessName,
    trade: websiteData.businessType,
    city: websiteData.city,
    state: websiteData.stateRegion,
    phone: websiteData.phone,
    streetAddress: websiteData.businessModel === "service-area" ? "" : websiteData.streetAddress,
    yearsInBusiness: websiteData.yearsInBusiness,
    licenseNumber: websiteData.licenseNumber,
    certifications: websiteData.certifications,
    emergency247: websiteData.emergency247,
    freeEstimates: websiteData.freeEstimates,
    insuredBonded: websiteData.insuredBonded,
    allowedClaims: websiteData.allowedClaims,
  };

  if (demo === true) {
    contentJSON = await generateSiteContentFromBlueprint(siteBlueprint, verifiedFacts);
    contentJSON = validateContentJSON(contentJSON);
    generationMethod = "demo-templates";
    tracker.completeStage("GENERATING_CONTENT", "Curated template content loaded.");
  } else {
    let creds: any;
    let resolvedProvider = provider;

    try {
      const targetProviderId = providerId || input.formData?.providerId;
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
        // If caller passed an explicit provider, look for that specific provider profile
        const matchingProfile = profiles.find(
          (p) => (p.id === provider || p.presetId === provider || p.apiType === provider) && p.hasKey
        );
        if (matchingProfile) {
          const fullProf = await getProviderProfile(matchingProfile.id);
          if (fullProf?.apiKey) {
            creds = {
              apiKey: fullProf.apiKey,
              baseUrl: fullProf.baseUrl,
              defaultModel: fullProf.model,
              organizationId: fullProf.organizationId,
              providerName: fullProf.name,
            };
            resolvedProvider = fullProf.presetId || fullProf.apiType || provider;
          }
        } else if (!input.provider) {
          // Only fall back to global activeProviderId if caller did not specify a provider
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
      }

      if (!creds) {
        creds = await getProviderCredentials(
          providerType,
          apiKey,
          baseUrl,
          model,
          organizationId,
          providerName,
          true
        );
        if (creds?.resolvedProvider) {
          resolvedProvider = creds.resolvedProvider;
        }
      }

      if (creds?.apiKey) {
        assembleOptions.providerCredentials = {
          apiKey: creds.apiKey,
          baseUrl: creds.baseUrl,
          provider: resolvedProvider || creds.resolvedProvider || providerType,
          model: model || creds.defaultModel,
        };
      }
    } catch (err: any) {
      console.warn("[Pipeline] Credential resolution error, proceeding statelessly:", err);
    }

    if (!creds?.apiKey) {
      console.log(`[Pipeline] No API key configured for provider "${providerType}". Generating complete website using deterministic blueprint engine...`);
      contentJSON = await generateSiteContentFromBlueprint(siteBlueprint, verifiedFacts);
      contentJSON = validateContentJSON(contentJSON);
      generationMethod = "blueprint-deterministic";
    } else {
      let rawTargetModel = model || creds.defaultModel || PROVIDER_PRESETS[providerType]?.defaultModel || "gemini-3.8-flash";
      if (resolvedProvider && resolvedProvider !== providerType) {
        rawTargetModel = creds.defaultModel || PROVIDER_PRESETS[resolvedProvider as ProviderType]?.defaultModel || "default";
      }
      targetModel = normalizeModelForProvider(
        ((resolvedProvider || providerType) as ProviderType) || "gemini",
        rawTargetModel
      );
      if (assembleOptions.providerCredentials) {
        assembleOptions.providerCredentials.model = targetModel;
      }

      const gatewayParams = {
        directCredentials: {
          provider: resolvedProvider || providerType,
          apiKey: creds.apiKey,
          baseUrl: creds.baseUrl,
          model: targetModel,
          organizationId: creds.organizationId,
          providerName: creds.providerName,
        },
        model: targetModel,
        maxTokens: 3000,
        timeoutMs: 6500,
      };

      try {
        console.log(`[Pipeline] Generating blueprint pages via dedicated archetype generators (${resolvedProvider || providerType} - ${targetModel})...`);
        contentJSON = await generateSiteContentFromBlueprint(siteBlueprint, verifiedFacts, gatewayParams);
        contentJSON = validateContentJSON(contentJSON);
        generationMethod = "ai-archetypes";
      } catch (genErr: any) {
        console.warn(`[Pipeline] AI provider generation encountered an issue (${genErr?.message || genErr}). Seamlessly falling back to deterministic blueprint generator for all ${siteBlueprint.pageCount} pages...`);
        contentJSON = await generateSiteContentFromBlueprint(siteBlueprint, verifiedFacts);
        contentJSON = validateContentJSON(contentJSON);
        generationMethod = "blueprint-deterministic";
      }
    }

    // Optional Quality Review Pass
    const enableQualityReview = qualityReview === true || formData?.qualityReview === true;
    if (enableQualityReview && creds?.apiKey && generationMethod.startsWith("ai")) {
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
          maxTokens: 3000,
          timeoutMs: 5000,
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

  // Sanitize ground-truth facts
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
    assembled = await assembleWebsite(contentJSON, activeTheme, assembleOptions);
  } catch (assemblerErr: any) {
    console.error("[Pipeline] Assembler failed:", assemblerErr);
    const failure = tracker.getState().failure;
    const failureStage: GenerationFailureStage = failure?.failureStage || "FAILED_RENDER";
    const failedStageName: GenerationStageName = failure?.failedAtStage || tracker.getState().activeStageName;
    const errMsg = assemblerErr instanceof Error ? assemblerErr.message : "Website assembly failed.";

    if (!failure) {
      tracker.failStage(failedStageName, failureStage, errMsg, false);
    }

    return {
      success: false,
      failedStage: failureStage,
      error: errMsg,
      pipeline: tracker.getState(),
    };
  }

  // =========================================================================
  // STAGE 13: PACKAGING
  // =========================================================================
  tracker.startStage("PACKAGING", "Packaging static assets and registering preview bundle...");

  const projectName = websiteData.businessName || "Static Website";
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
    tracker.failStage("PACKAGING", "FAILED_PACKAGE", errMsg, true);
    return {
      success: false,
      failedStage: "FAILED_PACKAGE",
      error: errMsg,
      pipeline: tracker.getState(),
    };
  }

  // =========================================================================
  // STAGE 14: READY
  // =========================================================================
  tracker.completePipeline();

  return {
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
    qualityAudit: assembled.qualityAudit,
    pipeline: tracker.getState(),
    blueprint: siteBlueprint,
    downloadUrl: `/api/projects/${projectId}/download`,
  };
}
