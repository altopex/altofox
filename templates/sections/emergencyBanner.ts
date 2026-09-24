import { SectionJSON } from "../../lib/generator/content-schema";

export function renderEmergencyBanner(
  section: SectionJSON,
  sitePhone: string
): string {
  const content = section.content || {};
  const text = content.text || "24/7 Emergency Dispatch Available Across the Area — Call for Immediate Service!";
  const phone = content.phone || sitePhone || "(555) 123-4567";
  const cleanPhone = phone.replace(/[^\d+]/g, "");

  return `
  <!-- Emergency Banner Section -->
  <div class="emergency-banner" role="alert">
    <div class="container emergency-banner-content">
      <span>🚨 ${text}</span>
      <a href="tel:${cleanPhone}">Call ${phone}</a>
    </div>
  </div>`;
}
