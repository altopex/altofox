import { SectionJSON } from "../../lib/generator/content-schema";
import { ResolvedImage } from "../../lib/photos/photo-service";

export function renderAbout(
  section: SectionJSON,
  siteName: string,
  images: ResolvedImage[] = []
): string {
  const content = section.content || {};
  const variant = section.variant || "split";

  const eyebrow = content.eyebrow || "About Our Company";
  const headline = content.headline || `Dedicated to Craftsmanship & Community at ${siteName}`;
  const story = content.story || `${siteName} was built upon a simple promise: treat every customer's home with the respect it deserves, arrive on time, and provide honest, upfront pricing with no surprises.`;
  const subtext = content.subtext || "Our certified master technicians undergo continuous background checks and trade training, guaranteeing modern, compliant, and durable solutions.";
  const highlights: string[] = content.highlights || [
    "Locally owned and operated with deep community roots",
    "Master licensed, insured, and certified specialists",
    "Upfront flat-rate pricing — you approve the quote before we start",
    "Lifetime workmanship warranty on all installations",
  ];

  const fallbackImg: ResolvedImage = {
    url: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1000&q=80",
    alt: headline,
    slot: "main",
  };
  const mainImage = images[0] || fallbackImg;
  const secondImage = images[1] || mainImage;

  const checkListSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

  // Variant 1: Split (Image Left / Text Right)
  if (variant === "split") {
    return `
  <!-- About Section: Split Variant -->
  <section class="section" id="about">
    <div class="container about-grid">
      <div class="reveal">
        <picture>
          <source srcset="${mainImage.url || mainImage.localWebpPath || mainImage.localPath}" type="image/webp">
          <img src="${mainImage.url || mainImage.localPath}" data-remote-src="${mainImage.url}" alt="${mainImage.alt}" class="img-card" style="aspect-ratio: 4/3; box-shadow: var(--shadow-lg);" width="800" height="600" loading="lazy"${mainImage.fallbackUrl ? ` onerror="this.onerror=null;this.src='${mainImage.fallbackUrl}';"` : ""}>
        </picture>
      </div>
      <div class="reveal">
        <span class="badge">${eyebrow}</span>
        <h2>${headline}</h2>
        <p>${story}</p>
        <p>${subtext}</p>
        <ul class="check-list">
          ${highlights.map((h) => `<li>${checkListSvg} <span>${h}</span></li>`).join("\n          ")}
        </ul>
        <a href="contact.html" class="btn btn-primary" style="margin-top: 1rem;">Contact Our Team →</a>
      </div>
    </div>
  </section>`;
  }

  // Variant 2: Text with Image Collage
  return `
  <!-- About Section: Collage Variant -->
  <section class="section" id="about">
    <div class="container about-grid">
      <div class="reveal">
        <span class="badge">${eyebrow}</span>
        <h2>${headline}</h2>
        <p>${story}</p>
        <p>${subtext}</p>
        <ul class="check-list">
          ${highlights.map((h) => `<li>${checkListSvg} <span>${h}</span></li>`).join("\n          ")}
        </ul>
        <a href="contact.html" class="btn btn-primary" style="margin-top: 1rem;">Work With Us →</a>
      </div>
      <div class="reveal" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <picture>
          <source srcset="${mainImage.url || mainImage.localWebpPath || mainImage.localPath}" type="image/webp">
          <img src="${mainImage.url || mainImage.localPath}" data-remote-src="${mainImage.url}" alt="${mainImage.alt}" class="img-card" style="aspect-ratio: 1/1; box-shadow: var(--shadow-md);" width="600" height="600" loading="lazy"${mainImage.fallbackUrl ? ` onerror="this.onerror=null;this.src='${mainImage.fallbackUrl}';"` : ""}>
        </picture>
        <picture>
          <source srcset="${secondImage.url || secondImage.localWebpPath || secondImage.localPath}" type="image/webp">
          <img src="${secondImage.url || secondImage.localPath}" data-remote-src="${secondImage.url}" alt="${secondImage.alt}" class="img-card" style="aspect-ratio: 1/1; margin-top: 2rem; box-shadow: var(--shadow-md);" width="600" height="600" loading="lazy"${secondImage.fallbackUrl ? ` onerror="this.onerror=null;this.src='${secondImage.fallbackUrl}';"` : ""}>
        </picture>
      </div>
    </div>
  </section>`;
}
