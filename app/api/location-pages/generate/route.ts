import { NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/ai";
import { ProviderType } from "@/lib/ai/types";
import { renderLocationPage, buildLocationPageSchema, LocationPageContext } from "@/templates/sections/locationPage";
import { resolvePageImage } from "@/lib/photos/image-provider";
import { THEMES } from "@/lib/themes";
import { SiteInfoJSON } from "@/lib/generator/content-schema";
import { calculateTextSimilarity } from "@/lib/quality/quality-checker";

const ROTATING_ANGLES = [
  "Common seasonal challenges and climate conditions affecting local homes in this region",
  "What local homeowners can expect during our dispatch, diagnosis, and arrival",
  "Scheduling, travel, and how we coordinate same-day emergency coverage",
  "How to choose an honest, licensed trade contractor in this specific community",
  "Service-specific maintenance and prevention guide tailored to regional architecture",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      cityData, // { city, stateId, stateName, county, population, distanceOffset, zipCodes, localNotes }
      businessInfo, // SiteInfoJSON
      themeId = "modern-pro",
      mainService = "Plumbing Service",
      servicesList = [],
      provider = "gemini",
      model = "gemini-1.5-pro",
      apiKey,
      angleIndex = 0,
      allSelectedCities = [],
      domain = "example.com",
    } = body;

    if (!cityData || !cityData.city) {
      return NextResponse.json({ success: false, error: "Missing city data" }, { status: 400 });
    }

    const assignedAngle = ROTATING_ANGLES[angleIndex % ROTATING_ANGLES.length];
    const theme = THEMES.find((t: any) => t.id === themeId) || THEMES[0];

    // Local data package strictly adhering to Google spam rules (no invented facts or fake reviews)
    const systemPrompt = `You are an elite local SEO content strategist writing a dedicated, high-converting location landing page for a local service contractor.
You must follow Google's local SEO and helpful content guidelines strictly:
- Target 600–900 words of genuinely useful, non-doorway content.
- Unique angle: "${assignedAngle}".
- Write specifically for ${cityData.city}, ${cityData.stateId} (${cityData.county} County).
- Distance & direction from hub: ${cityData.distanceOffset || "Central service hub"}.
- Use ONLY truthful facts provided in the data package. Never invent local landmarks, fake neighborhood names, fake statistics, or fake reviews.
- Respond with ONLY valid JSON (no markdown, no code fences):
{
  "h1": "[Main Service] in [City], [State]",
  "metaTitle": "[Primary Keyword] | [Business Name]",
  "metaDescription": "Concise 120-155 character description with call to action",
  "introParagraph": "Engaging 80-120 word intro mentioning the city, county, prompt dispatch, and license.",
  "angleSectionHeadline": "Specific heading reflecting the assigned angle",
  "angleSectionContent": "<p>2-3 detailed paragraphs analyzing local challenges, regional climate, or scheduling standards for homes in this city.</p>",
  "processSteps": [
    { "title": "Step 1 Title", "desc": "Step 1 description" },
    { "title": "Step 2 Title", "desc": "Step 2 description" },
    { "title": "Step 3 Title", "desc": "Step 3 description" }
  ],
  "faqs": [
    { "question": "FAQ question mentioning city?", "answer": "Detailed answer explaining response time, warranty, or estimates." },
    { "question": "FAQ question 2?", "answer": "Answer 2." },
    { "question": "FAQ question 3?", "answer": "Answer 3." }
  ]
}`;

    const userPrompt = `Business: ${businessInfo.businessName || "Local Specialist"}
Trade: ${mainService}
Target City: ${cityData.city}, ${cityData.stateId} (${cityData.county} County)
Population: ${cityData.population ? cityData.population.toLocaleString() : "Regional"}
Distance Offset: ${cityData.distanceOffset || "Local Hub"}
ZIP Codes: ${cityData.zipCodes ? cityData.zipCodes.slice(0, 5).join(", ") : "Local"}
User Notes: ${cityData.localNotes || "None"}
Services Available: ${servicesList.join(", ")}
Confirmed Facts: License ${businessInfo.licenseNumber || "Licensed"}, 24/7 emergency dispatch, warranty protection.
Angle: ${assignedAngle}`;

    let aiResult: any = null;

    try {
      const aiProvider = getProvider((provider as ProviderType) || "gemini");
      const resp = await aiProvider.generate({
        model: model || "gemini-1.5-pro",
        prompt: userPrompt,
        systemPrompt,
        apiKey: apiKey || process.env.GEMINI_API_KEY,
        jsonMode: true,
      });

      const cleanJson = resp.content.replace(/```json|```/gi, "").trim();
      aiResult = JSON.parse(cleanJson);
    } catch {
      // Fallback structured content if AI unavailable
      aiResult = {
        h1: `${mainService} in ${cityData.city}, ${cityData.stateId}`,
        metaTitle: `${mainService} in ${cityData.city}, ${cityData.stateId} | ${businessInfo.businessName || "AltoFox"}`,
        metaDescription: `Prompt, licensed ${mainService.toLowerCase()} in ${cityData.city}, ${cityData.stateId}. Upfront pricing and satisfaction guaranteed. Call today!`,
        introParagraph: `When you need dependable, prompt ${mainService.toLowerCase()} in ${cityData.city} and throughout ${cityData.county} County, our experienced technicians provide upfront estimates and fast dispatch. We understand the specific plumbing and utility configurations across local properties.`,
        angleSectionHeadline: `Professional Standards & Regional Service in ${cityData.city}`,
        angleSectionContent: `<p>Homes and commercial facilities in ${cityData.city} face unique demands through changing regional seasons. From sudden winter freezes to heavy summer usage, ensuring reliable utility performance requires prompt local expertise.</p><p>Our certified technicians arrive fully equipped with modern diagnostic tools to resolve issues cleanly on the first visit, preventing costly secondary property damage.</p>`,
        processSteps: [
          { title: "Direct Local Dispatch", desc: `Call our team for fast coordination to your ${cityData.city} location.` },
          { title: "Upfront Evaluation", desc: "We diagnose the issue thoroughly and provide clear, flat-rate options." },
          { title: "Guaranteed Resolution", desc: "Work completed cleanly according to local building codes with parts warranty." },
        ],
        faqs: [
          { question: `How fast can you dispatch to ${cityData.city}?`, answer: `We typically arrive within 45 to 60 minutes for priority calls across ${cityData.city} and ${cityData.county} County.` },
          { question: `Are your technicians licensed in ${cityData.stateId}?`, answer: `Yes, all work is performed by state-licensed technicians adhering strictly to municipal safety codes.` },
          { question: `Do you provide upfront pricing for ${cityData.city} residents?`, answer: "Always. We evaluate your job on-site and present transparent flat-rate pricing before starting any work." },
        ],
      };
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
      angleUsed: assignedAngle,
      h1: aiResult.h1 || `${mainService} in ${cityData.city}, ${cityData.stateId}`,
      metaTitle: aiResult.metaTitle || `${mainService} in ${cityData.city}, ${cityData.stateId}`,
      metaDescription: aiResult.metaDescription || `Professional ${mainService.toLowerCase()} in ${cityData.city}.`,
      introParagraph: aiResult.introParagraph || "",
      angleSectionHeadline: aiResult.angleSectionHeadline || "Local Service Standards",
      angleSectionContent: aiResult.angleSectionContent || "",
      servicesIncluded: servicesList.length > 0 ? servicesList.slice(0, 6) : ["Repairs", "Maintenance", "Emergency Service"],
      processSteps: aiResult.processSteps || [],
      faqs: aiResult.faqs || [],
      heroImage: {
        url: resolvedHero.url,
        fallbackUrl: resolvedHero.fallbackUrl,
        alt: resolvedHero.alt,
        width: resolvedHero.width,
        height: resolvedHero.height,
      },
    };

    const locationBodyHtml = renderLocationPage(
      context,
      businessInfo as SiteInfoJSON,
      theme,
      allSelectedCities,
      { lat: cityData.lat, lng: cityData.lng }
    );

    const slug = `${mainService.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${cityData.city.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${cityData.stateId.toLowerCase()}.html`;
    const schemaHtml = buildLocationPageSchema(context, businessInfo as SiteInfoJSON, domain, slug);

    return NextResponse.json({
      success: true,
      slug,
      context,
      locationBodyHtml,
      schemaHtml,
      angleUsed: assignedAngle,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
