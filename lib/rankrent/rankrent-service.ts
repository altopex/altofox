import { SavedProject, RankRentConfig, CapturedLead, ProjectChangeLogEntry } from "../storage/project-types";

/**
 * Creates default Rank & Rent configuration for a website
 */
export function createDefaultRankRentConfig(project: SavedProject): RankRentConfig {
  const city = project.formData?.city || project.businessDetails?.city || "Local";
  const trade = project.formData?.businessType || project.nicheId || "Contractor";

  return {
    enabled: true,
    status: "available",
    monthlyRent: 750,
    currency: "USD",
    billingInterval: "monthly",
    trackingPhone: project.businessDetails?.phone || "(555) 000-0000",
    clientName: "",
    clientContact: "",
    clientEmail: "",
    clientPhone: "",
    leadForwardEmail: project.businessDetails?.email || "",
    leadWebhookUrl: "",
    leadDeliveryMethod: "both",
    showProspectBanner: true,
    prospectBannerText: `Attention ${trade}s in ${city}: This top-ranking local website is available for exclusive lease!`,
    prospectContactPhone: project.businessDetails?.phone || "(555) 000-0000",
    prospectContactEmail: project.businessDetails?.email || "leasing@example.com",
    notes: `High-value Rank & Rent asset targeting ${trade} search volume in ${city}.`,
  };
}

/**
 * Renders HTML for the "Rent This Site" prospect banner
 */
export function renderProspectBannerHtml(config: RankRentConfig): string {
  const phone = config.prospectContactPhone || "";
  const cleanPhone = phone.replace(/[^\d+]/g, "");
  const text = config.prospectBannerText || "This top-ranking website is available for exclusive lease.";

  return `<!-- RANKRENT_PROSPECT_BANNER_START -->
<div class="rankrent-prospect-banner" style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: #ffffff; padding: 10px 16px; font-size: 13px; font-weight: 500; border-bottom: 2px solid #6366f1; position: relative; z-index: 9999;">
  <div style="max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="background: #4f46e5; color: #fff; font-size: 10px; font-weight: 800; text-transform: uppercase; padding: 2px 7px; border-radius: 4px; letter-spacing: 0.5px;">Lease Opportunity</span>
      <span>${text}</span>
    </div>
    ${
      phone
        ? `<a href="tel:${cleanPhone}" style="display: inline-flex; align-items: center; gap: 6px; background: #ffffff; color: #1e1b4b; padding: 4px 12px; border-radius: 6px; font-weight: 700; font-size: 12px; text-decoration: none; box-shadow: 0 1px 3px rgba(0,0,0,0.2); transition: background 0.2s;">
            <span>Inquire to Rent: ${phone}</span>
            <span>&rarr;</span>
          </a>`
        : ""
    }
  </div>
</div>
<!-- RANKRENT_PROSPECT_BANNER_END -->`;
}

/**
 * 1-Click Tenant Rebrand & Site Swapper
 * Updates all HTML files, schemas, form webhooks, phone numbers, and company names.
 */
export function applyTenantBranding(
  project: SavedProject,
  newConfig: RankRentConfig
): { updatedProject: SavedProject; affectedPagesCount: number } {
  const oldPhone = project.businessDetails?.phone || "";
  const newPhone = newConfig.trackingPhone?.trim() || newConfig.clientPhone?.trim() || oldPhone;
  const oldCleanPhone = oldPhone.replace(/[^\d+]/g, "");
  const newCleanPhone = newPhone.replace(/[^\d+]/g, "");

  const oldClientName = project.rankRentConfig?.clientName || project.businessDetails?.businessName || "";
  const newClientName = newConfig.clientName?.trim() || oldClientName;

  const oldEmail = project.businessDetails?.email || "";
  const newEmail = newConfig.clientEmail?.trim() || oldEmail;

  let affectedCount = 0;

  // Process all files
  const updatedFiles = project.files.map((file) => {
    if (!file.path.endsWith(".html")) {
      return file;
    }

    let html = file.content;
    let modified = false;

    // 1. Manage Prospect Banner
    const bannerRegex = /<!-- RANKRENT_PROSPECT_BANNER_START -->[\s\S]*?<!-- RANKRENT_PROSPECT_BANNER_END -->\n?/g;
    const hasBanner = bannerRegex.test(html);
    bannerRegex.lastIndex = 0;

    const shouldHaveBanner = newConfig.enabled && newConfig.showProspectBanner && newConfig.status === "available";

    if (hasBanner && !shouldHaveBanner) {
      html = html.replace(bannerRegex, "");
      modified = true;
    } else if (shouldHaveBanner) {
      const bannerHtml = renderProspectBannerHtml(newConfig) + "\n";
      if (hasBanner) {
        html = html.replace(bannerRegex, bannerHtml);
      } else {
        // Insert right after <body>
        if (/<body[^>]*>/i.test(html)) {
          html = html.replace(/(<body[^>]*>)/i, `$1\n${bannerHtml}`);
        } else {
          html = bannerHtml + html;
        }
      }
      modified = true;
    }

    // 2. Replace Phone Numbers in tel: links and text
    if (oldPhone && newPhone && oldPhone !== newPhone) {
      if (oldCleanPhone && newCleanPhone && oldCleanPhone !== newCleanPhone) {
        if (html.includes(`tel:${oldCleanPhone}`)) {
          html = html.split(`tel:${oldCleanPhone}`).join(`tel:${newCleanPhone}`);
          modified = true;
        }
      }
      if (html.includes(oldPhone)) {
        html = html.split(oldPhone).join(newPhone);
        modified = true;
      }
    }

    // 3. Update Contact Form Webhook & Forwarding Data Attributes
    if (html.includes("data-ajax-form")) {
      html = html.replace(
        /(<form[^>]*?data-ajax-form)([^>]*?>)/gi,
        (match, formStart, restOfTag) => {
          let updatedAttrs = restOfTag;
          // Replace or insert data-webhook-url
          const webhookUrl = newConfig.leadWebhookUrl || "";
          if (/data-webhook-url=["'][^"']*["']/i.test(updatedAttrs)) {
            updatedAttrs = updatedAttrs.replace(/data-webhook-url=["'][^"']*["']/i, `data-webhook-url="${webhookUrl}"`);
          } else {
            updatedAttrs = ` data-webhook-url="${webhookUrl}"` + updatedAttrs;
          }

          // Replace or insert data-forward-email
          const forwardEmail = newConfig.leadForwardEmail || "";
          if (/data-forward-email=["'][^"']*["']/i.test(updatedAttrs)) {
            updatedAttrs = updatedAttrs.replace(/data-forward-email=["'][^"']*["']/i, `data-forward-email="${forwardEmail}"`);
          } else {
            updatedAttrs = ` data-forward-email="${forwardEmail}"` + updatedAttrs;
          }

          // Replace or insert data-tenant-name
          const tenantName = newConfig.clientName || "";
          if (/data-tenant-name=["'][^"']*["']/i.test(updatedAttrs)) {
            updatedAttrs = updatedAttrs.replace(/data-tenant-name=["'][^"']*["']/i, `data-tenant-name="${tenantName}"`);
          } else {
            updatedAttrs = ` data-tenant-name="${tenantName}"` + updatedAttrs;
          }

          return `${formStart}${updatedAttrs}`;
        }
      );
      modified = true;
    }

    // 4. Update Schema.org Telephone
    if (newPhone && html.includes('"telephone"')) {
      html = html.replace(/"telephone"\s*:\s*"[^"]*"/g, `"telephone": "${newPhone}"`);
      modified = true;
    }

    if (modified) {
      affectedCount++;
      return {
        ...file,
        content: html,
        lastModified: Date.now(),
      };
    }

    return file;
  });

  // Updated business details
  const updatedBusinessDetails = {
    ...project.businessDetails,
    phone: newPhone,
    email: newEmail,
    businessName: newConfig.status === "rented" && newClientName ? newClientName : project.businessDetails.businessName,
  };

  // Change Log Entry
  const statusLabels: Record<string, string> = {
    rented: `Rented to ${newClientName || "Tenant"} ($${newConfig.monthlyRent}/mo)`,
    available: "Released to Available (Prospect Banner Active)",
    prospecting: "Status changed to Prospecting",
    paused: "Rental Paused",
  };

  const changeSummary = `[Rank & Rent] ${statusLabels[newConfig.status] || "Config updated"}. Tracking phone: ${newPhone}. Affected ${affectedCount} pages.`;

  const logEntry: ProjectChangeLogEntry = {
    id: `rankrent-${Date.now()}`,
    timestamp: Date.now(),
    dateStr: new Date().toLocaleString(),
    summary: changeSummary,
    affectedPages: updatedFiles.filter((f) => f.lastModified === Date.now()).map((f) => f.path),
    note: newConfig.notes,
  };

  const updatedProject: SavedProject = {
    ...project,
    businessDetails: updatedBusinessDetails,
    rankRentConfig: newConfig,
    files: updatedFiles,
    lastEditedAt: Date.now(),
    changeLog: [logEntry, ...(project.changeLog || [])],
  };

  return {
    updatedProject,
    affectedPagesCount: affectedCount,
  };
}

/**
 * Records an inbound lead to project leads history
 */
export function recordCapturedLead(
  project: SavedProject,
  leadData: Omit<CapturedLead, "id" | "timestamp" | "dateStr">
): SavedProject {
  const newLead: CapturedLead = {
    ...leadData,
    id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
    dateStr: new Date().toLocaleString(),
  };

  return {
    ...project,
    leads: [newLead, ...(project.leads || [])],
  };
}

/**
 * Tests a webhook URL by sending a sample lead payload
 */
export async function testLeadWebhook(
  webhookUrl: string,
  samplePayload: {
    siteName: string;
    trade: string;
    city: string;
    tenantName?: string;
  }
): Promise<{ success: boolean; status?: number; error?: string }> {
  try {
    const payload = {
      event: "test_lead",
      timestamp: new Date().toISOString(),
      lead: {
        name: "Test Customer (Sample Lead)",
        phone: "(555) 867-5309",
        email: "test.lead@example.com",
        service: `Sample ${samplePayload.trade} Service`,
        message: "This is an automated test lead from your RankLocal Rank & Rent dashboard.",
      },
      site: {
        name: samplePayload.siteName,
        trade: samplePayload.trade,
        city: samplePayload.city,
        tenant: samplePayload.tenantName || "Unassigned",
      },
    };

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok || res.status === 200 || res.status === 201 || res.status === 204) {
      return { success: true, status: res.status };
    }

    return {
      success: false,
      status: res.status,
      error: `Webhook returned HTTP ${res.status}: ${res.statusText}`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to connect to webhook URL",
    };
  }
}
