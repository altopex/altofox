import { SectionJSON } from "../../lib/generator/content-schema";
import { ResolvedImage } from "../../lib/photos/photo-service";

export function renderCtaBanner(
  section: SectionJSON,
  sitePhone: string,
  images: ResolvedImage[] = []
): string {
  const content = section.content || {};
  const variant = section.variant || "gradient";

  const headline = content.headline || "Ready to Get Your Service Done Right?";
  const text = content.text || "Our certified master technicians are on standby for immediate dispatch across the area.";
  const phone = content.phone || sitePhone || "(555) 123-4567";
  const cleanPhone = phone.replace(/[^\d+]/g, "");
  const buttonText = content.buttonText || `Call Now: ${phone}`;
  const secondaryBtnText = content.secondaryBtnText || "Book Online";

  const bgPhoto = images[0];
  const bgUrl = bgPhoto?.localPath || bgPhoto?.url || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80";
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
