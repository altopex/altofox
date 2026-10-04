import { NextRequest, NextResponse } from "next/server";
import { ProviderType } from "@/lib/ai/types";
import { getAnyConfiguredProviderCredentials } from "@/lib/ai/keys";
import { gatewayRequest, gatewayErrorMessage, GatewayError } from "@/lib/ai/provider-gateway";
import { renderBlogPostHtml, buildBlogPostSchema, BlogPostData } from "@/lib/blog/blog-engine";
import { THEMES } from "@/lib/themes";
import { SiteInfoJSON } from "@/lib/generator/content-schema";
import { integrateNewPageIntoProject } from "@/lib/seo/connectivity-engine";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      topic, // { title, slug, primaryKeyword, category, searchIntent, targetServiceLink }
      businessInfo,
      themeId = "modern-pro",
      domain = "example.com",
      provider = "gemini",
      model = "gemini-1.5-pro",
      apiKey,
      availablePages = [],
      projectId,
      project: clientProject,
      files: requestFiles,
    } = body;

    if (!topic || !topic.title) {
      return NextResponse.json({ success: false, error: "Missing blog topic" }, { status: 400 });
    }

    const theme = THEMES.find((t: any) => t.id === themeId) || THEMES[0];

    const systemPrompt = `You are a licensed trade authority and conversion copywriter creating a comprehensive, homeowner-focused educational blog post (1200–1800 words).

RULES:
1. Target length: 1200–1800 words. Genuinely informative, clear, and structured for easy reading.
2. Structure:
   - Immediate direct answer in the first 100 words.
   - 4-5 well-structured H2 sections with practical tips, checklists, or steps.
   - Dedicated "When to Call a Licensed Professional" section (emphasize safety; never give dangerous DIY advice on gas, high-voltage electrical, or structural loads).
   - 3-5 practical FAQs.
   - Mention the local region/city naturally where relevant.
   - Include 2-4 natural internal links to service pages and location hub: ${availablePages.slice(0, 8).join(", ")}.
3. GOOGLE E-E-A-T POLICY: No invented facts, no fake quotes, no invented prices.

Respond with ONLY valid JSON:
{
  "metaDescription": "Concise 120-155 character description",
  "contentHtml": "<h2>...</h2><p>...</p>",
  "faqs": [
    { "question": "Question 1?", "answer": "Answer 1." },
    { "question": "Question 2?", "answer": "Answer 2." },
    { "question": "Question 3?", "answer": "Answer 3." }
  ],
  "imageAlt": "Descriptive image alt text containing keyword"
}`;

    const userPrompt = `Title: ${topic.title}
Primary Keyword: ${topic.primaryKeyword}
Category: ${topic.category}
Search Intent: ${topic.searchIntent}
Business: ${businessInfo.businessName}
City: ${businessInfo.address?.city || "Local"}
Confirmed Facts: License ${businessInfo.licenseNumber || "State Licensed"}, ${businessInfo.warrantyGuarantee || "Satisfaction Guaranteed"}.`;

    let contentHtml = "";
    let metaDescription = `Helpful homeowner guide: ${topic.title}. Understand key symptoms, safety steps, and expert recommendations.`;
    let faqs: { question: string; answer: string }[] = [];
    let imageAlt = `${topic.primaryKeyword} maintenance guide`;

    try {
      // Resolve credentials server-side (keys never exposed to client)
      const providerType = (provider as ProviderType) || "gemini";
      const creds = await getAnyConfiguredProviderCredentials(
        providerType,
        apiKey,          // client may pass a key it already has (server-to-server calls)
        undefined,
        model,
        undefined,
        undefined
      );

      const gatewayResponse = await gatewayRequest({
        prompt: userPrompt,
        systemPrompt,
        directCredentials: {
          provider: creds.provider,
          apiKey: creds.apiKey,
          baseUrl: creds.baseUrl,
          model: creds.defaultModel || model,
          organizationId: creds.organizationId,
          providerName: creds.providerName,
        },
        model: creds.defaultModel || model,
        responseFormat: "json",
        maxTokens: 4000,
        timeoutMs: 30000,
        feature: "blog",
      });

      const parsed = gatewayResponse.parsedJson as any;
      contentHtml = parsed?.contentHtml || "";
      metaDescription = parsed?.metaDescription || metaDescription;
      faqs = parsed?.faqs || [];
      imageAlt = parsed?.imageAlt || imageAlt;
    } catch (aiErr) {
      // Log and use static fallback — blog generation is non-critical
      const msg = aiErr instanceof GatewayError ? gatewayErrorMessage(aiErr) : String(aiErr);
      console.warn(`[Blog Gen API] AI generation skipped, using static fallback: ${msg}`);
      contentHtml = `
<p class="lead text-lg font-medium text-slate-800">Dealing with home maintenance issues can feel daunting. If you've been noticing unusual behavior or suspect a malfunction, understanding the underlying mechanics can help you protect your investment, maintain safety, and avoid expensive emergency repairs.</p>

<h2>Understanding the Core Symptoms and Early Warning Signs</h2>
<p>Most home utility systems rarely fail without providing advance warning. By paying close attention to subtle shifts in sound, temperature, pressure, or utility bill spikes, you can address issues before they cause structural property damage.</p>
<ul class="list-disc pl-6 space-y-2">
  <li><strong>Unexplained Utility Increases:</strong> Sudden rises in water or energy costs frequently point toward hidden leaks or failing components.</li>
  <li><strong>Unusual Sounds:</strong> Clanking, humming, or gurgling sounds within pipes or ducts indicate pressure imbalances or sediment accumulation.</li>
  <li><strong>Delayed Performance:</strong> If fixtures take significantly longer to achieve desired temperatures or flow rates, the internal heating elements or valves are degrading.</li>
</ul>

<h2>Step-by-Step Preventative Maintenance for Homeowners</h2>
<p>Regular maintenance performed seasonally can dramatically extend your equipment's operating lifespan while maintaining optimal efficiency.</p>
<ol class="list-decimal pl-6 space-y-2">
  <li><strong>Visual Inspection:</strong> Check around connections, fittings, and shutoff valves at least once a month for trace condensation or mineral deposits.</li>
  <li><strong>Test Emergency Shutoffs:</strong> Ensure all main shutoff valves turn smoothly without excessive force. In a burst pipe scenario, every second counts.</li>
  <li><strong>Filter & Strainer Clearing:</strong> Remove sediment buildup from aerators and line filters every six months to sustain steady water flow.</li>
</ol>

<h2>When to Call a Licensed Professional</h2>
<p>While basic visual inspections and filter replacements are great DIY tasks, critical utility work requires specialized equipment and licensing. Attempting complex work on pressurized gas lines, high-voltage electrical panels, or main drain stacks can result in severe injury and void manufacturer warranties.</p>
<p>Whenever you suspect a gas smell, persistent sewer backups, or structural leaks inside walls, shut off the main supply immediately and contact a licensed master technician.</p>

<h2>Long-Term Cost Analysis: Repair vs. Replacement</h2>
<p>When weighing repairs against complete replacement, consider the age of your equipment. As a general industry rule of thumb, if the repair cost exceeds 50% of a new unit's value and the unit is past three-quarters of its expected lifespan, upgrading to modern high-efficiency models yields superior return on investment.</p>
`;
      faqs = [
        { question: "How often should routine maintenance be performed?", answer: "We recommend a comprehensive professional tune-up and safety inspection at least once per year." },
        { question: "What should I do first if an emergency occurs?", answer: "Locate and close your property's main water or utility shutoff valve, then call a certified technician immediately." },
        { question: "Are modern energy-efficient models worth the upfront cost?", answer: "Yes. High-efficiency units reduce monthly utility bills by 20% to 40% and qualify for municipal rebates." },
      ];
    }

    const words = contentHtml.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    const postData: BlogPostData = {
      title: topic.title,
      slug: topic.slug,
      primaryKeyword: topic.primaryKeyword,
      secondaryKeywords: [topic.primaryKeyword, `${businessInfo.address?.city || "local"} tips`],
      metaDescription,
      datePublished: today,
      dateModified: today,
      authorName: businessInfo.ownerName || `The ${businessInfo.businessName} Team`,
      authorBio: businessInfo.ownerBio || `Experienced local service specialists serving ${businessInfo.address?.city || "the community"}.`,
      wordCount: words,
      contentHtml,
      faqs,
      relatedSlugs: [],
      imageAlt,
    };

    const fullHtml = renderBlogPostHtml(postData, businessInfo as SiteInfoJSON, theme, domain);
    const schemaHtml = buildBlogPostSchema(postData, businessInfo as SiteInfoJSON, domain);

    // If project files are available, connect new blog post into internal linking graph
    let updatedFiles: { path: string; content: string | Buffer; mimeType?: string | null }[] | undefined;
    let incomingLinksAdded: string[] | undefined;
    let connectivityAudit: any;

    let targetFiles = requestFiles || clientProject?.files;
    if (!targetFiles && projectId) {
      try {
        const dbProject = await db.project.findUnique({
          where: { id: projectId },
          include: { files: true },
        });
        if (dbProject) {
          targetFiles = dbProject.files.map((f) => ({
            path: f.path,
            content: f.content,
            mimeType: f.mimeType || undefined,
          }));
        }
      } catch (e) {
        console.warn("[Blog Gen API] Could not fetch DB files:", e);
      }
    }

    if (targetFiles && targetFiles.length > 0) {
      const integration = integrateNewPageIntoProject(
        {
          newPagePath: `blog/${postData.slug}.html`,
          newPageTitle: postData.title,
          newPageContent: fullHtml,
          primaryQuery: postData.primaryKeyword,
          serviceName: topic.category || "Homeowner Guide",
          locationCity: businessInfo.address?.city,
          searchIntent: "informational",
        },
        targetFiles,
        {
          businessName: businessInfo.businessName,
          primaryTrade: businessInfo.primaryTrade || businessInfo.businessType,
          domain,
        }
      );

      updatedFiles = integration.updatedFiles;
      incomingLinksAdded = integration.incomingLinksAdded;
      connectivityAudit = integration.auditReport;

      // Sync to database if projectId exists
      if (projectId) {
        try {
          await db.projectFile.deleteMany({ where: { projectId } });
          await db.projectFile.createMany({
            data: integration.updatedFiles.map((f) => ({
              projectId,
              path: f.path,
              content: String(f.content),
              mimeType: f.mimeType || "text/html",
            })),
          });
        } catch (dbErr) {
          console.warn("[Blog Gen API] Could not sync DB files:", dbErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      postData,
      fullHtml,
      schemaHtml,
      updatedFiles,
      incomingLinksAdded,
      connectivityAudit,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
