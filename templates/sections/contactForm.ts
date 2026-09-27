import { SectionJSON, SiteContentJSON } from "../../lib/generator/content-schema";
import { renderGoogleMapEmbed } from "../../lib/location/map-embed";

export function renderContactForm(
  section: SectionJSON,
  site: SiteContentJSON["site"],
  mapEmbed?: string,
  isHomePage: boolean = false
): string {
  const content = section.content || {};
  const phone = site.phone || "(555) 123-4567";
  const cleanPhone = phone.replace(/[^\d+]/g, "");
  const email = site.email || "";
  const address = site.address || { city: "Local Area" };
  const isServiceArea = site.businessModel === "service-area";
  const fullAddress = [address.street, address.city, address.state, address.zip]
    .filter(Boolean)
    .join(", ");
  const hours = site.hours || ["Mon - Sun: 24/7 Priority Emergency Service"];

  // Homepage Variant: Short, compact, visually secondary (phone call remains primary)
  if (isHomePage) {
    return `
  <!-- Secondary Contact Form (Short & Compact) -->
  <section class="section contact-section-secondary" id="contact" style="padding: 3rem 0; background: var(--color-background, #F8FAFC);">
    <div class="container">
      <div class="contact-secondary-card card" style="max-width: 860px; margin: 0 auto; padding: 2rem 2.25rem; border: 1px solid var(--color-border); border-radius: var(--radius-lg, 16px);">
        <div class="contact-secondary-grid" style="display: grid; grid-template-columns: 1fr; gap: 2rem;">
          <div>
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem; border-bottom: 1px solid var(--color-border); padding-bottom: 0.75rem;">
              <div>
                <span class="badge" style="background: rgba(15, 23, 42, 0.06); color: var(--color-muted); font-size: 0.75rem; text-transform: uppercase;">Optional Message</span>
                <h3 style="margin-top: 0.25rem; font-size: 1.25rem; color: var(--color-secondary);">Prefer to Send a Quick Note?</h3>
              </div>
              <div style="font-size: 0.875rem; color: var(--color-muted);">
                ⚡ Fastest response: <a href="tel:${cleanPhone}" style="color: var(--color-primary); font-weight: 700;">Call ${phone}</a>
              </div>
            </div>

            <p style="font-size: 0.9rem; color: var(--color-muted); margin-bottom: 1.25rem;">
              Phone calls receive immediate priority dispatch. If you prefer to reach us online, leave a short message below.
            </p>

            <form data-ajax-form>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label for="contact-name" style="font-size: 0.85rem; font-weight: 600;">Name *</label>
                  <input type="text" id="contact-name" name="name" required placeholder="Your Full Name" style="padding: 0.65rem 0.85rem; font-size: 0.95rem;">
                </div>

                <div class="form-group" style="margin-bottom: 0;">
                  <label for="contact-phone" style="font-size: 0.85rem; font-weight: 600;">Phone *</label>
                  <input type="tel" id="contact-phone" name="phone" required placeholder="${phone}" style="padding: 0.65rem 0.85rem; font-size: 0.95rem;">
                </div>
              </div>

              <div class="form-group" style="margin-bottom: 1rem;">
                <label for="contact-message" style="font-size: 0.85rem; font-weight: 600;">Message</label>
                <textarea id="contact-message" name="message" rows="2" placeholder="Briefly describe what you need..." style="padding: 0.65rem 0.85rem; font-size: 0.95rem;"></textarea>
              </div>

              <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
                <button type="submit" class="btn btn-outline" style="border-color: var(--color-border); color: var(--color-secondary); padding: 0.6rem 1.5rem; font-size: 0.9rem;">
                  <span>Send Online Message</span>
                </button>
                <span style="font-size: 0.8rem; color: var(--color-muted);">We never sell or share your contact info.</span>
              </div>
              <div class="form-status-msg" style="display:none; margin-top: 1rem; padding: 0.75rem 1rem; border-radius: var(--radius-md, 8px); font-size: 0.9rem;"></div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </section>`;
  }

  // Standard Variant (for dedicated contact.html page)
  const eyebrow = content.eyebrow || "Get In Touch";
  const headline = content.headline || "Contact Dispatch & Customer Support";
  const subheadline =
    content.subheadline ||
    "Call us directly for fastest emergency service, or submit your details below.";

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
          <p>For fastest response and emergency scheduling, please call our 24/7 dispatch desk directly.</p>

          <div class="contact-info-list">
            <div class="contact-info-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              <div>
                <strong>Direct Phone (Primary CTA):</strong>
                <div><a href="tel:${cleanPhone}" style="color: var(--color-primary); font-weight: 800; font-size: 1.25rem;">${phone}</a></div>
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
            mapEmbed
              ? `
          <div style="margin-top: 2rem;">
            ${renderGoogleMapEmbed({
              input: mapEmbed,
              address: isServiceArea ? { city: address.city, state: address.state } : address,
              city: address.city,
              state: address.state,
              businessName: site.businessName,
              height: 280,
            })}
          </div>`
              : ""
          }
        </div>

        <!-- Form Column -->
        <div class="card reveal" style="padding: 2.25rem;">
          <h3 style="font-size: 1.35rem;">Send an Online Inquiry</h3>
          <p style="margin-bottom: 1.5rem; font-size: 0.95rem; color: var(--color-muted);">For fastest service, please call directly. You may also leave your contact information below.</p>

          <form data-ajax-form>
            <div class="form-group">
              <label for="contact-name">Full Name *</label>
              <input type="text" id="contact-name" name="name" required placeholder="Your Name">
            </div>

            <div class="form-group">
              <label for="contact-phone">Phone Number *</label>
              <input type="tel" id="contact-phone" name="phone" required placeholder="${phone}">
            </div>

            <div class="form-group">
              <label for="contact-message">Message</label>
              <textarea id="contact-message" name="message" rows="3" placeholder="Briefly describe what you need..."></textarea>
            </div>

            <button type="submit" class="btn btn-outline btn-large" style="width: 100%; border-color: var(--color-border); color: var(--color-secondary);">
              <span>Submit Inquiry</span>
              <span>→</span>
            </button>
            <div class="form-status-msg" style="display:none; margin-top: 1rem; padding: 0.875rem 1.25rem; border-radius: var(--radius-md, 8px); font-size: 0.95rem; font-weight: 500;"></div>
          </form>
        </div>
      </div>
    </div>
  </section>`;
}
