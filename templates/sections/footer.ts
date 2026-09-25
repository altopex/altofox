import { SiteContentJSON } from "../../lib/generator/content-schema";

export function renderFooter(site: SiteContentJSON["site"]): string {
  const bizName = site.businessName || "Local Services";
  const tagline = site.tagline || "Professional, licensed, and guaranteed local services.";
  const phone = site.phone || "(555) 123-4567";
  const cleanPhone = phone.replace(/[^\d+]/g, "");
  const address = site.address || { city: "Local Area" };
  const isServiceArea = site.businessModel === "service-area";

  // Google Policy: Service-area businesses must hide street address everywhere on the site
  const addressDisplay = isServiceArea
    ? `Serving ${address.city || "local communities"} and surrounding areas`
    : [address.street, address.city, address.state, address.zip].filter(Boolean).join(", ") || `Serving ${address.city || "local communities"}`;

  const email = site.email || "";
  const areas = site.serviceAreas && site.serviceAreas.length > 0 ? site.serviceAreas : ["Local Communities", "Suburbs", "Metro Area"];

  return `
  <!-- Site Footer: 4-Column Layout -->
  <footer class="site-footer" id="site-footer">
    <div class="container">
      <div class="footer-grid">
        <!-- Col 1: About & Brand -->
        <div class="footer-col">
          <div class="brand-logo" style="color: #FFFFFF; margin-bottom: 1rem;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color: var(--color-accent);"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
            <span>${bizName}</span>
          </div>
          <p>${tagline}</p>
          <div style="margin-top: 1.5rem;">
            <a href="tel:${cleanPhone}" style="color: var(--color-accent); font-weight: 800; font-size: 1.25rem;">${phone}</a>
          </div>
        </div>

        <!-- Col 2: Navigation Links -->
        <div class="footer-col">
          <h4>Quick Links</h4>
          <ul class="footer-links">
            ${site.nav
              .slice(0, 6)
              .map((item) => {
                const href = item.slug.endsWith(".html") || item.slug.startsWith("#") ? item.slug : `${item.slug}.html`;
                return `<li><a href="${href}">${item.label}</a></li>`;
              })
              .join("\n            ")}
          </ul>
        </div>

        <!-- Col 3: Service Areas Covered -->
        <div class="footer-col">
          <h4>Service Areas</h4>
          <p style="color: #94A3B8; font-size: 0.85rem; margin-bottom: 0.75rem;">Serving ${address.city || "local communities"} and surrounding areas.</p>
          <ul class="footer-links">
            <li><a href="service-areas.html" style="color: var(--color-accent); font-weight: 700;">View Service Areas Hub →</a></li>
            ${areas.slice(0, 4).map((a) => `<li><a href="service-areas.html">${a}</a></li>`).join("\n            ")}
          </ul>
        </div>

        <!-- Col 4: Contact & Hours -->
        <div class="footer-col">
          <h4>Dispatch & Contact</h4>
          <p>${addressDisplay}</p>
          ${email ? `<p style="margin-top: 0.5rem;"><a href="mailto:${email}" style="color: #CBD5E1;">${email}</a></p>` : ""}
          <p style="margin-top: 0.75rem; font-size: 0.85rem; color: #94A3B8;">${site.hours?.[0] || "24/7 Priority Emergency Service"}</p>
        </div>
      </div>

      <div class="footer-bottom">
        <p>© <span data-current-year>${new Date().getFullYear()}</span> ${bizName}. All rights reserved. Locally Owned & Operated. City data by <a href="https://simplemaps.com/data/us-cities" target="_blank" rel="noopener noreferrer" style="color: #94A3B8; text-decoration: underline;">SimpleMaps</a> under CC BY 4.0.</p>
      </div>
    </div>
  </footer>`;
}
