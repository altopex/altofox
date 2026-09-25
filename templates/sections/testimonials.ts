import { SectionJSON, SiteContentJSON } from "../../lib/generator/content-schema";

export function renderTestimonials(
  section: SectionJSON,
  site?: SiteContentJSON["site"]
): string {
  const content = section.content || {};
  const variant = section.variant || "grid";

  const hasConfirmedRealReviews = Boolean(
    site?.realReviewsConfirmed &&
    site?.realReviews &&
    site.realReviews.length > 0
  );

  const googleReviewUrl = site?.googleReviewUrl?.trim();

  // Option A: Real Reviews (User confirmed and provided real reviews)
  if (hasConfirmedRealReviews && site?.realReviews) {
    const eyebrow = content.eyebrow || "Real Reviews";
    const headline = content.headline || "What Verified Customers Are Saying";
    const subheadline =
      content.subheadline ||
      "Direct, unedited feedback from real local homeowners and business owners.";

    const renderStars = (rating: number = 5) => {
      const fullStars = Math.min(5, Math.max(1, Math.round(rating)));
      return `<div class="star-rating" aria-label="${fullStars} out of 5 stars">${"★".repeat(fullStars)}${"☆".repeat(5 - fullStars)}</div>`;
    };

    if (variant === "slider") {
      return `
  <!-- Testimonials Section: Real Customer Reviews (Slider) -->
  <section class="section" id="testimonials">
    <div class="container">
      <div class="section-header reveal">
        <span class="badge">${eyebrow}</span>
        <h2>${headline}</h2>
        <p>${subheadline}</p>
      </div>
      <div class="testimonial-slider reveal" style="max-width: 760px; margin: 0 auto; text-align: center;">
        <div class="testimonial-track">
          ${site.realReviews
            .map(
              (r, idx) => `
          <div class="testimonial-slide card" style="${idx === 0 ? "display: block;" : "display: none;"} padding: 2.5rem;">
            ${renderStars(r.rating)}
            <blockquote style="font-size: 1.2rem; font-style: italic; color: var(--color-text); margin: 1.5rem 0; line-height: 1.6;">
              "${r.text}"
            </blockquote>
            <div class="review-author-name" style="font-weight: 700; color: var(--color-secondary); font-size: 1rem;">${r.author}</div>
            <div style="font-size: 0.85rem; color: var(--color-muted); margin-top: 0.25rem;">
              <span>Source: ${r.source || "Google"}</span>
              ${r.date ? ` • <span>${r.date}</span>` : ""}
            </div>
          </div>`
            )
            .join("\n          ")}
        </div>
        <div class="testimonial-slider-controls" style="margin-top: 1.5rem; display: flex; justify-content: center; gap: 0.75rem;">
          <button class="slider-btn slider-prev" aria-label="Previous Testimonial">←</button>
          <button class="slider-btn slider-next" aria-label="Next Testimonial">→</button>
        </div>
        <div style="margin-top: 1.25rem; font-size: 0.8rem; color: var(--color-muted);">
          Verified real reviews from confirmed customers.
        </div>
      </div>
    </div>
  </section>`;
    }

    // Grid Variant (Default)
    return `
  <!-- Testimonials Section: Real Customer Reviews (Grid) -->
  <section class="section" id="testimonials">
    <div class="container">
      <div class="section-header reveal">
        <span class="badge">${eyebrow}</span>
        <h2>${headline}</h2>
        <p>${subheadline}</p>
      </div>
      <div class="testimonials-grid">
        ${site.realReviews
          .map(
            (r) => `
        <div class="card reveal" style="display: flex; flex-direction: column; justify-content: space-between; padding: 1.75rem;">
          <div>
            ${renderStars(r.rating)}
            <p style="font-style: italic; color: var(--color-text); margin: 1rem 0; line-height: 1.6;">"${r.text}"</p>
          </div>
          <div class="review-author-row" style="border-top: 1px solid var(--color-border); padding-top: 1rem; margin-top: 1rem;">
            <div>
              <div class="review-author-name" style="font-weight: 700; color: var(--color-secondary); font-size: 0.95rem;">${r.author}</div>
              <div style="font-size: 0.8rem; color: var(--color-muted); margin-top: 0.2rem;">
                <span>Source: ${r.source || "Google"}</span>
                ${r.date ? ` • <span>${r.date}</span>` : ""}
              </div>
            </div>
          </div>
        </div>`
          )
          .join("\n        ")}
      </div>
      <div style="text-align: center; margin-top: 1.75rem; font-size: 0.85rem; color: var(--color-muted);">
        Verified real customer reviews.
      </div>
    </div>
  </section>`;
  }

  // Option B: Google Review CTA (No real reviews, but Google review link is provided)
  if (googleReviewUrl) {
    const bizName = site?.businessName || "our local team";
    const city = site?.address?.city || "our service area";

    return `
  <!-- Google Review CTA Section -->
  <section class="section" id="review-cta" style="background: var(--color-surface, #F8FAFC);">
    <div class="container">
      <div class="card reveal" style="max-width: 800px; margin: 0 auto; text-align: center; padding: 3rem 2rem; border: 1px solid var(--color-border);">
        <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 50%; background: #EEF2FF; margin-bottom: 1.25rem;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-primary);"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
        </div>
        <h2 style="margin-bottom: 0.75rem;">Had a Great Experience with ${bizName}?</h2>
        <p style="max-width: 600px; margin: 0 auto 1.75rem; color: var(--color-muted); font-size: 1.05rem; line-height: 1.6;">
          Your feedback helps homeowners and businesses in ${city} discover dependable, honest trade service. Share your experience directly on Google.
        </p>
        <div>
          <a href="${googleReviewUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-large">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 0.5rem;"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/></svg>
            <span>Review Us on Google</span>
          </a>
        </div>
      </div>
    </div>
  </section>`;
  }

  // Option C: Neither real reviews nor Google Review URL provided -> Skip section completely
  return "";
}
