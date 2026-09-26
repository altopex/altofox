import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Standard CORS headers allowing external static sites to submit leads
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "RankLocal Lead & Rank-and-Rent Forwarding Engine",
      timestamp: new Date().toISOString(),
    },
    { headers: corsHeaders }
  );
}

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      body = await req.json();
    } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      formData.forEach((val, key) => {
        body[key] = val.toString();
      });
    } else {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    const {
      name,
      phone,
      email,
      service,
      message,
      webhookUrl,
      forwardEmail,
      tenantName,
      siteId,
      sourceUrl,
    } = body;

    if (!phone && !name) {
      return NextResponse.json(
        { error: "Phone number or name is required to submit a lead." },
        { status: 400, headers: corsHeaders }
      );
    }

    const leadPayload = {
      event: "new_lead",
      leadId: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      receivedAt: new Date().toISOString(),
      lead: {
        name: name || "Anonymous Request",
        phone: phone || "",
        email: email || "",
        service: service || "General Inquiry",
        message: message || "",
      },
      metadata: {
        siteId: siteId || "RankLocal Website",
        tenant: tenantName || "Unassigned",
        sourceUrl: sourceUrl || req.headers.get("referer") || "",
        forwardEmail: forwardEmail || null,
        userAgent: req.headers.get("user-agent") || "",
      },
    };

    let webhookDelivered = false;
    let webhookStatus: number | null = null;
    let webhookError: string | null = null;

    // Forward to Tenant / Agency Webhook if configured (e.g. Zapier, Make, GoHighLevel)
    if (webhookUrl && typeof webhookUrl === "string" && webhookUrl.startsWith("http")) {
      try {
        const webhookRes = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(leadPayload),
          signal: AbortSignal.timeout(5000),
        });

        webhookDelivered = webhookRes.ok;
        webhookStatus = webhookRes.status;
      } catch (err: any) {
        webhookDelivered = false;
        webhookError = err.message || "Webhook delivery failed";
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Lead received and processed successfully.",
        leadId: leadPayload.leadId,
        forwarding: {
          webhookConfigured: Boolean(webhookUrl),
          webhookDelivered,
          webhookStatus,
          webhookError,
          emailAlertRecipient: forwardEmail || null,
        },
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to process lead request: " + (error.message || String(error)) },
      { status: 500, headers: corsHeaders }
    );
  }
}
