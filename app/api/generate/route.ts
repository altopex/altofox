import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProviderCredentials } from "@/lib/ai/keys";
import { ProviderType, PROVIDER_PRESETS } from "@/lib/ai/types";
import { WebsiteFormData, computeTargetPages } from "@/lib/generator/prompt";
import { generateMultiPageWebsite } from "@/lib/generator/multi-page";
import { generateThemeTestSite } from "@/lib/generator/template-engine";

export const maxDuration = 300; // 5 minutes timeout for multi-page website generation
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      provider = "gemini",
      model,
      apiKey,
      baseUrl,
      formData,
      demo = false,
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
      businessDescription: (formData?.businessDescription || "").trim(),
      yearsInBusiness: (formData?.yearsInBusiness || "").trim(),
      uniqueSellingPoints: (formData?.uniqueSellingPoints || "").trim(),
      servicesOffered: (formData?.servicesOffered || "").trim(),
      services: Array.isArray(formData?.services) ? formData.services : undefined,
      streetAddress: (formData?.streetAddress || "").trim(),
      city: (formData?.city || targetLocation || city || "").trim(),
      stateRegion: (formData?.stateRegion || "").trim(),
      zipPostalCode: (formData?.zipPostalCode || "").trim(),
      country: (formData?.country || "USA").trim(),
      serviceAreas: (formData?.serviceAreas || "").trim(),
      serviceAreasList: Array.isArray(formData?.serviceAreasList) ? formData.serviceAreasList : undefined,
      phone: (formData?.phone || "").trim(),
      email: (formData?.email || "").trim(),
      businessHours: (formData?.businessHours || "").trim(),
      websiteDomain: (formData?.websiteDomain || "").trim(),
      targetKeywords: (formData?.targetKeywords || focusKeywords || targetKeywords || "").trim(),
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
    if (!websiteData.targetKeywords) {
      return NextResponse.json(
        { success: false, error: "At least one target keyword is required." },
        { status: 400 }
      );
    }

    // Compute all target pages (including individual service pages and area pages if toggled on)
    const targetPages = computeTargetPages(websiteData);
    console.log(
      `[Generate] Building ${targetPages.length} pages for "${websiteData.businessName}" in "${websiteData.city}". Separate services: ${websiteData.separateServicePages}, Separate areas: ${websiteData.separateAreaPages}.`
    );

    // If explicit demo requested, generate complete theme test site directly
    if (demo === true) {
      const generatedFiles = generateThemeTestSite(websiteData, targetPages);
      const projectName = websiteData.businessName || "Static Website";
      return NextResponse.json({
        success: true,
        projectId: "demo-" + Date.now(),
        name: projectName,
        notes: `Complete static website generated in demo mode for ${websiteData.theme?.name || "Modern Pro"}.`,
        provider: "demo",
        model: "template-engine",
        createdAt: new Date().toISOString(),
        files: generatedFiles.map((f) => ({
          path: f.path,
          content: f.content,
          mimeType: f.path.endsWith(".html")
            ? "text/html"
            : f.path.endsWith(".css")
            ? "text/css"
            : f.path.endsWith(".js")
            ? "application/javascript"
            : "text/plain",
        })),
      });
    }

    const providerType = provider as ProviderType;

    // 1. Get credentials for the provider (from request, browser localStorage pass-through, or env)
    let creds;
    try {
      creds = await getProviderCredentials(providerType, apiKey, baseUrl, model);
    } catch (err) {
      return NextResponse.json(
        {
          success: false,
          error:
            err instanceof Error
              ? err.message
              : `No API key found for ${PROVIDER_PRESETS[providerType]?.name || provider}. Please connect your API key in Settings.`,
        },
        { status: 401 }
      );
    }

    // 2. Select target model
    const targetModel =
      model || creds.defaultModel || PROVIDER_PRESETS[providerType]?.defaultModel || "gemini-1.5-pro";

    // 3. Multi-page Generation
    // If targetPages.length <= 4: single prompt generation
    // If targetPages.length > 4: generates foundation and then page-by-page with consistent styles.css, header, footer
    let validated;
    try {
      validated = await generateMultiPageWebsite(websiteData, targetPages, {
        provider: providerType,
        apiKey: creds.apiKey,
        model: targetModel,
        baseUrl: creds.baseUrl,
      });
    } catch (apiErr) {
      console.error("[Generate] Multi-page generation error:", apiErr);
      return NextResponse.json(
        {
          success: false,
          error: apiErr instanceof Error ? apiErr.message : "AI generation request failed.",
        },
        { status: 502 }
      );
    }

    const projectName = websiteData.businessName || "Static Website";

    // 4. Optional non-blocking database record
    let projectId = "site-" + Date.now();
    try {
      const project = await db.project.create({
        data: {
          name: projectName,
          prompt: `Theme: ${websiteData.theme?.name || "Default"} | Pages: ${targetPages.length} | Biz: ${websiteData.businessName}`,
          provider: providerType,
          model: targetModel,
          status: "ready",
          notes: validated.notes || "Complete multi-page static website generated with HTML, CSS, and JS.",
          files: {
            create: validated.files.map((f) => ({
              path: f.path,
              content: f.content,
              mimeType: f.path.endsWith(".html")
                ? "text/html"
                : f.path.endsWith(".css")
                ? "text/css"
                : f.path.endsWith(".js")
                ? "application/javascript"
                : "text/plain",
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
      notes: validated.notes || "Complete static website generated successfully.",
      provider: providerType,
      model: targetModel,
      createdAt: new Date().toISOString(),
      files: validated.files.map((f) => ({
        path: f.path,
        content: f.content,
        mimeType: f.path.endsWith(".html")
          ? "text/html"
          : f.path.endsWith(".css")
          ? "text/css"
          : f.path.endsWith(".js")
          ? "application/javascript"
          : "text/plain",
      })),
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
