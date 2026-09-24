import { SectionJSON } from "../../lib/generator/content-schema";

export function renderTestimonials(section: SectionJSON): string {
  const content = section.content || {};
  const variant = section.variant || "grid";

  const eyebrow = content.eyebrow || "Real Reviews";
  const headline = content.headline || "What Local Customers Are Saying";
  const subheadline = content.subheadline || "Honest feedback from satisfied homeowners and business managers across our community.";
  const reviews: { quote: string; name: string; city: string; stars?: number }[] = content.reviews || [
    {
      stars: 5,
      quote: "Arrived within 35 minutes on a Sunday evening. Fixed our emergency cleanly and the price was exactly what they quoted upfront. Highly recommend!",
      name: "Marcus Henderson",
      city: "Local Customer",
    },
    {
      stars: 5,
      quote: "Professional, respectful, and very knowledgeable. Explained everything clearly and solved an ongoing issue that two other companies couldn't.",
      name: "Sarah Jenkins",
      city: "Verified Resident",
    },
    {
      stars: 5,
      quote: "Super impressed with the speed and honesty. They are definitely our go-to trade team from now on!",
      name: "David Zhao",
      city: "Property Owner",
    },
  ];

  const starsHtml = `<div class="star-rating" aria-label="5 stars">★★★★★</div>`;

  // Variant 1: Cards Grid
  if (variant === "grid") {
    return `
  <!-- Testimonials Section: Cards Grid Variant -->
  <section class="section" id="testimonials">
    <div class="container">
      <div class="section-header reveal">
        <span class="badge">${eyebrow}</span>
        <h2>${headline}</h2>
        <p>${subheadline}</p>
      </div>
      <div class="testimonials-grid">
        ${reviews
          .map(
            (r) => `
        <div class="card reveal" style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            ${starsHtml}
            <p style="font-style: italic; color: var(--color-text); margin-bottom: 1rem;">"${r.quote}"</p>
          </div>
          <div class="review-author-row">
            <div>
              <div class="review-author-name">${r.name}</div>
              <div class="review-author-city">${r.city}</div>
            </div>
          </div>
        </div>`
          )
          .join("\n        ")}
      </div>
    </div>
  </section>`;
  }

  // Variant 2: Interactive Slider
  return `
  <!-- Testimonials Section: Slider Variant -->
  <section class="section" id="testimonials">
    <div class="container">
      <div class="section-header reveal">
        <span class="badge">${eyebrow}</span>
        <h2>${headline}</h2>
        <p>${subheadline}</p>
      </div>
      <div class="testimonial-slider reveal" style="max-width: 760px; margin: 0 auto; text-align: center;">
        <div class="testimonial-track">
          ${reviews
            .map(
              (r, idx) => `
          <div class="testimonial-slide card" style="${idx === 0 ? "display: block;" : "display: none;"} padding: 2.5rem;">
            ${starsHtml}
            <blockquote style="font-size: 1.25rem; font-style: italic; color: var(--color-secondary); margin: 1.5rem 0;">
              "${r.quote}"
            </blockquote>
            <div class="review-author-name">${r.name}</div>
            <div class="review-author-city">${r.city}</div>
          </div>`
            )
            .join("\n          ")}
        </div>
        <div class="testimonial-slider-controls">
          <button class="slider-btn slider-prev" aria-label="Previous Testimonial">←</button>
          <button class="slider-btn slider-next" aria-label="Next Testimonial">→</button>
        </div>
      </div>
    </div>
  </section>`;
}
