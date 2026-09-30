import { SectionJSON, SiteContentJSON } from "../../lib/generator/content-schema";
import { ResolvedImage } from "../../lib/photos/photo-service";
import { renderGoogleMapEmbed } from "../../lib/location/map-embed";

export function renderCtaBanner(
  section: SectionJSON,
  sitePhone: string,
  images: ResolvedImage[] = [],
  site?: SiteContentJSON["site"],
  mapEmbed?: string
): string {
  const content = section.content || {};
  const variant = section.variant || "gradient";

  const phone = content.phone || sitePhone || site?.phone || "(555) 123-4567";
  const cleanPhone = phone.replace(/[^\d+]/g, "");
  const bizName = site?.businessName || "Our Local Team";
  const trade =
    (site as any)?.trade ||
    (site as any)?.industry ||
    (site as any)?.primaryService ||
    "Professional Service";

  // Variant: Location Map (Compact Final CTA + Map immediately above footer)
  if (variant === "locationMap" || (site && mapEmbed && variant !== "photo" && variant !== "gradient")) {
    const defaultHeadline = `Need ${trade}?`;
    const headline =
      !content.headline || content.headline.startsWith("Ready for Reliable")
        ? defaultHeadline
        : content.headline;
    const text =
      content.text ||
      `Call ${bizName} today for fast, upfront-priced service across our local coverage area.`;
    const address = site?.address || { city: "Local Area" };
    const locationServingText = address.city
      ? `${address.city}${address.state ? `, ${address.state}` : ""}`
      : "Our Local Community";

    const mapInput =
      mapEmbed ||
      (site as any)?.googleMaps ||
      (address.street ? `${address.street}, ${address.city || ""}, ${address.state || ""}` : address.city);

    const renderedMap = renderGoogleMapEmbed({
      input: mapInput,
      address: site?.businessModel === "service-area" ? { city: address.city, state: address.state } : address,
      city: address.city,
      state: address.state,
      businessName: bizName,
      height: 250,
      className: "final-cta-map-container",
    });

    return `
  <!-- Final CTA + Location Map Section (Immediately Above Footer) -->
  <section class="section final-cta-section" id="final-cta">
    <div class="container">
      <div class="final-cta-card reveal">
        <div class="final-cta-grid">
          <!-- Left: Call Conversion Focus -->
          <div class="final-cta-col-left">
            <span class="badge final-cta-badge">⚡ Priority Local Dispatch</span>
            <h2 class="final-cta-title">${headline}</h2>
            <p class="final-cta-text">${text}</p>

            <div class="final-cta-actions">
              <a href="tel:${cleanPhone}" class="btn btn-primary btn-large btn-call-primary" aria-label="Call ${phone} for service">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                <span>Call Now: ${phone}</span>
              </a>
              <div class="final-cta-phone-display">
                <span class="final-cta-phone-caption">Direct Priority Line</span>
                <a href="tel:${cleanPhone}" class="final-cta-phone-link">${phone}</a>
              </div>
            </div>

            <div class="final-cta-meta">
              <span class="final-cta-meta-item">✓ 24/7 Rapid Emergency Response</span>
              <span class="final-cta-meta-item">✓ Upfront Flat Pricing</span>
              <span class="final-cta-meta-item">✓ Licensed &amp; Insured</span>
            </div>

            <p class="final-cta-secondary-line">
              Need immediate service or real-time scheduling? <a href="tel:${cleanPhone}" style="color: var(--color-primary); font-weight: 700;">Call ${phone} directly</a> or <a href="contact.html">view dispatch details</a>.
            </p>
          </div>

          <!-- Right: Small Compact Location Map -->
          <div class="final-cta-col-right">
            <div class="final-cta-location-info">
              <span class="final-cta-pin">📍</span>
              <span class="final-cta-location-text">Serving <strong>${locationServingText}</strong> and nearby areas</span>
            </div>
            ${renderedMap}
          </div>
        </div>
      </div>
    </div>
  </section>`;
  }

  const headline = content.headline || "Ready to Get Your Service Done Right?";
  const text =
    content.text ||
    "Our certified master technicians are on standby for immediate dispatch across the area.";
  const buttonText = content.buttonText || `Call Now: ${phone}`;
  const secondaryBtnText = content.secondaryBtnText || "Schedule by Phone";

  const bgPhoto = images[0];
  const bgUrl =
    bgPhoto?.localPath ||
    bgPhoto?.url ||
    "https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg?auto=compress&cs=tinysrgb&w=1200";
  const remoteUrl = bgPhoto?.url || bgUrl;

  // Variant 1: Photo Background
  if (variant === "photo") {
    return `
  <!-- CTA Banner: Photo Variant -->
  <section class="section cta-banner variant-photo" style="background-image: url('${bgUrl}');" data-bg-remote="${remoteUrl}">
    <div class="cta-overlay"></div>
    <div class="container reveal">
      <div>
        <h2>${headline}</h2>
        <p>${text}</p>
      </div>
      <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
        <a href="tel:${cleanPhone}" class="btn btn-primary btn-large btn-mobile-full">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          <span>${buttonText}</span>
        </a>
        <a href="contact.html" class="btn btn-outline btn-large btn-mobile-full" style="color: #FFFFFF; border-color: #FFFFFF;">${secondaryBtnText}</a>
      </div>
    </div>
  </section>`;
  }

  // Variant 2: Gradient Background (Default)
  return `
  <!-- CTA Banner: Gradient Variant -->
  <section class="section cta-banner variant-gradient">
    <div class="container reveal">
      <div>
        <h2>${headline}</h2>
        <p>${text}</p>
      </div>
      <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
        <a href="tel:${cleanPhone}" class="btn btn-primary btn-large btn-mobile-full" style="background: #FFFFFF; color: var(--color-secondary) !important;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          <span>${buttonText}</span>
        </a>
        <a href="contact.html" class="btn btn-outline btn-large btn-mobile-full" style="color: #FFFFFF; border-color: #FFFFFF;">${secondaryBtnText}</a>
      </div>
    </div>
  </section>`;
}
