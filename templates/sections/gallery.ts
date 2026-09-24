import { SectionJSON } from "../../lib/generator/content-schema";
import { ResolvedImage } from "../../lib/photos/photo-service";

export function renderGallery(
  section: SectionJSON,
  images: ResolvedImage[] = []
): string {
  const content = section.content || {};
  const eyebrow = content.eyebrow || "Real Local Work";
  const headline = content.headline || "Our Recent Project Gallery";
  const subheadline = content.subheadline || "Browse real completed jobs across our service territory. Click any photo to enlarge.";

  const galleryImages = images.length > 0 ? images : [
    { url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80", alt: "Completed project", slot: "gallery" },
    { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80", alt: "Modern repair", slot: "gallery" },
    { url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80", alt: "Commercial installation", slot: "gallery" },
    { url: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80", alt: "Inspection in progress", slot: "gallery" },
    { url: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80", alt: "System overhaul", slot: "gallery" },
    { url: "https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=800&q=80", alt: "Clean fixture setup", slot: "gallery" },
  ];

  return `
  <!-- Gallery Section -->
  <section class="section" id="gallery">
    <div class="container">
      <div class="section-header reveal">
        <span class="badge">${eyebrow}</span>
        <h2>${headline}</h2>
        <p>${subheadline}</p>
      </div>
      <div class="gallery-grid">
        ${galleryImages
          .map(
            (img, idx) => `
        <div class="gallery-item reveal" tabindex="0" role="button" aria-label="View photo ${idx + 1}">
          <picture>
            <source srcset="${img.localWebpPath || img.localPath || img.url}" type="image/webp">
            <img src="${img.localPath || img.url}" data-remote-src="${img.url}" alt="${img.alt || "Completed service project"}" class="img-gallery" width="800" height="600" loading="lazy">
          </picture>
        </div>`
          )
          .join("\n        ")}
      </div>
    </div>
  </section>`;
}
