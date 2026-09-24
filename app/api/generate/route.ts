import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateWebsite } from "@/lib/ai/generate-website";
import { getProviderCredentials } from "@/lib/ai/keys";
import { ProviderType, PROVIDER_PRESETS } from "@/lib/ai/types";
import { SYSTEM_PROMPT, buildUserPrompt, WebsiteFormData } from "@/lib/generator/prompt";
import { extractAndParseJSON, validateGeneratedWebsite } from "@/lib/generator/validator";

export const maxDuration = 120; // 2 minutes timeout for full website generation
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

    // Consolidate form data
    const websiteData: WebsiteFormData = {
      businessName: (formData?.businessName || businessName || name || "").trim(),
      businessType: (formData?.businessType || serviceCategory || businessType || "").trim(),
      businessDescription: (formData?.businessDescription || "").trim(),
      servicesOffered: (formData?.servicesOffered || "").trim(),
      streetAddress: (formData?.streetAddress || "").trim(),
      city: (formData?.city || targetLocation || city || "").trim(),
      stateRegion: (formData?.stateRegion || "").trim(),
      zipPostalCode: (formData?.zipPostalCode || "").trim(),
      country: (formData?.country || "USA").trim(),
      serviceAreas: (formData?.serviceAreas || "").trim(),
      phone: (formData?.phone || "").trim(),
      email: (formData?.email || "").trim(),
      businessHours: (formData?.businessHours || "").trim(),
      websiteDomain: (formData?.websiteDomain || "").trim(),
      targetKeywords: (formData?.targetKeywords || focusKeywords || targetKeywords || "").trim(),
      pagesToCreate: Array.isArray(formData?.pagesToCreate) && formData.pagesToCreate.length > 0
        ? formData.pagesToCreate
        : ["Home", "About", "Services", "Contact", "FAQ", "Service Areas"],
      brandColors: (formData?.brandColors || "").trim(),
      styleTone: (formData?.styleTone || "").trim(),
      googleMaps: (formData?.googleMaps || "").trim(),
      socialLinks: (formData?.socialLinks || "").trim(),
      logoUrl: (formData?.logoUrl || "").trim(),
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
              : `No API key found for ${PROVIDER_PRESETS[providerType]?.name || provider}. Please connect your API key.`,
        },
        { status: 401 }
      );
    }

    // 2. Select target model
    const targetModel =
      model || creds.defaultModel || PROVIDER_PRESETS[providerType]?.defaultModel || "gemini-1.5-pro";

    // 3. Build user prompt with all fields clearly labeled
    const userPrompt = buildUserPrompt(websiteData);

    console.log(`[Generate] Calling ${providerType} (${targetModel}) for: ${websiteData.businessName} in ${websiteData.city}...`);

    // 4. Call unified AI generator
    let rawText: string;
    try {
      rawText = await generateWebsite({
        provider: providerType,
        apiKey: creds.apiKey,
        model: targetModel,
        prompt: userPrompt,
        systemPrompt: SYSTEM_PROMPT,
        maxTokens: 16000,
        baseUrl: creds.baseUrl,
      });
    } catch (apiErr) {
      return NextResponse.json(
        {
          success: false,
          error: apiErr instanceof Error ? apiErr.message : "AI generation request failed.",
        },
        { status: 502 }
      );
    }

    // 5. Parse and validate generated website JSON with 1-time automatic repair retry
    let validated;
    try {
      const parsed = extractAndParseJSON(rawText);
      validated = validateGeneratedWebsite(parsed);
    } catch (parseError) {
      console.warn("Initial JSON parse failed. Retrying with a JSON repair prompt...", parseError);
      try {
        const repairPrompt = `Your previous output could not be parsed as clean JSON. Please re-output the EXACT same static website files strictly as a single valid raw JSON object matching {"files": [{"path": "...", "content": "..."}], "notes": "..."}. Do not include markdown code fences or backticks:\n\n${rawText.slice(0, 4000)}`;

        const retryText = await generateWebsite({
          provider: providerType,
          apiKey: creds.apiKey,
          model: targetModel,
          prompt: repairPrompt,
          systemPrompt: SYSTEM_PROMPT,
          maxTokens: 16000,
          baseUrl: creds.baseUrl,
        });

        const retryParsed = extractAndParseJSON(retryText);
        validated = validateGeneratedWebsite(retryParsed);
      } catch (retryError) {
        console.error("AI output parsing error after retry:", retryError);
        return NextResponse.json(
          {
            success: false,
            error: `AI returned an invalid website structure: ${parseError instanceof Error ? parseError.message : "Parse failed"}. Please try clicking Generate again.`,
            rawText: rawText.slice(0, 1000),
          },
          { status: 502 }
        );
      }
    }

    const projectName = websiteData.businessName || "Static Website";

    // 6. Optional non-blocking database record
    let projectId = "site-" + Date.now();
    try {
      const project = await db.project.create({
        data: {
          name: projectName,
          prompt: userPrompt.slice(0, 500),
          provider: providerType,
          model: targetModel,
          status: "ready",
          notes: validated.notes || "Complete static website generated with HTML, CSS, and JS.",
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
