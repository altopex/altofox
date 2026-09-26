import { SectionJSON, SiteContentJSON } from "../../lib/generator/content-schema";

export function renderContactForm(
  section: SectionJSON,
  site: SiteContentJSON["site"],
  mapEmbed?: string
): string {
  const content = section.content || {};
  const eyebrow = content.eyebrow || "Get In Touch";
  const headline = content.headline || "Request a Free Inspection & Upfront Quote";
  const subheadline =
    content.subheadline ||
    "Contact our friendly dispatch coordinators. We respond to all inquiries within minutes.";

  const phone = site.phone || "(555) 123-4567";
  const cleanPhone = phone.replace(/[^\d+]/g, "");
  const email = site.email || "";
  const address = site.address || { city: "Local Area" };
  const isServiceArea = site.businessModel === "service-area";
  const fullAddress = [address.street, address.city, address.state, address.zip]
    .filter(Boolean)
    .join(", ");
  const hours = site.hours || ["Mon - Sun: 24/7 Priority Emergency Service"];

  return `
  <!-- Contact Form & Details Section -->
  <section class="section" id="contact">
    <div class="container">
      <div class="section-header reveal">
        <span class="badge">${eyebrow}</span>
        <h2>${headline}</h2>
        <p>${subheadline}</p>
      </div>
      <div class="contact-grid">
        <!-- Contact Details Column -->
        <div class="reveal">
          <h3>Immediate Dispatch & Office Hours</h3>
          <p>Whether you need emergency repairs or scheduled trade service, we are ready to assist you.</p>

          <div class="contact-info-list">
            <div class="contact-info-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              <div>
                <strong>Direct Phone (24/7):</strong>
                <div><a href="tel:${cleanPhone}" style="color: var(--color-primary); font-weight: 700; font-size: 1.15rem;">${phone}</a></div>
              </div>
            </div>

            ${
              email
                ? `
            <div class="contact-info-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              <div>
                <strong>Email Address:</strong>
                <div><a href="mailto:${email}">${email}</a></div>
              </div>
            </div>`
                : ""
            }

            ${
              isServiceArea
                ? `
            <div class="contact-info-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              <div>
                <strong>Service Area Coverage:</strong>
                <div>Serving ${address.city || "our local community"} and surrounding areas</div>
              </div>
            </div>`
                : fullAddress
                ? `
            <div class="contact-info-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              <div>
                <strong>Physical Address:</strong>
                <div>${fullAddress}</div>
              </div>
            </div>`
                : ""
            }

            <div class="contact-info-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <div>
                <strong>Business Hours:</strong>
                <div>${hours.join("<br>")}</div>
              </div>
            </div>
          </div>

          ${
            !isServiceArea && mapEmbed
              ? `
          <div style="margin-top: 2rem; border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow-sm);">
            ${mapEmbed}
          </div>`
              : ""
          }
        </div>

        <!-- Form Column -->
        <div class="card reveal" style="padding: 2.25rem;">
          <h3>Send Us a Direct Message</h3>
          <p style="margin-bottom: 1.5rem;">Fill out this quick form and a local team member will call you shortly.</p>

          <form data-ajax-form>
            <div class="form-group">
              <label for="contact-name">Full Name *</label>
              <input type="text" id="contact-name" name="name" required placeholder="John Smith">
            </div>

            <div class="form-group">
              <label for="contact-phone">Phone Number *</label>
              <input type="tel" id="contact-phone" name="phone" required placeholder="${phone}">
            </div>

            <div class="form-group">
              <label for="contact-service">Service Needed</label>
              <input type="text" id="contact-service" name="service" placeholder="e.g. Emergency Repair, Inspection, Installation">
            </div>

            <div class="form-group">
              <label for="contact-message">How can we help? (Optional)</label>
              <textarea id="contact-message" name="message" rows="4" placeholder="Briefly describe what you are experiencing..."></textarea>
            </div>

            <button type="submit" class="btn btn-primary btn-large" style="width: 100%;">
              <span>Submit Request</span>
              <span>→</span>
            </button>
            <div class="form-status-msg" style="display:none; margin-top: 1rem; padding: 0.875rem 1.25rem; border-radius: var(--radius-md, 8px); font-size: 0.95rem; font-weight: 500;"></div>
          </form>
        </div>
      </div>
    </div>
  </section>`;
}
