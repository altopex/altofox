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

  // Homepage Variant: High-converting Direct Phone Dispatch Card (Zero Forms)
  if (isHomePage) {
    return `
  <!-- Direct Phone Dispatch Card (Homepage Call Focus) -->
  <section class="section contact-section-secondary" id="contact" style="padding: 3.5rem 0; background: var(--color-background, #F8FAFC);">
    <div class="container">
      <div class="contact-secondary-card card" style="max-width: 880px; margin: 0 auto; padding: 2.5rem 2.25rem; border: 1px solid var(--color-border); border-radius: var(--radius-lg, 16px); text-align: center;">
        <span class="badge" style="background: rgba(15, 23, 42, 0.06); color: var(--color-primary); font-size: 0.8rem; text-transform: uppercase; font-weight: 700; margin-bottom: 0.75rem; display: inline-block;">⚡ Priority Local Dispatch</span>
        <h2 style="font-size: 1.75rem; color: var(--color-secondary); margin-bottom: 0.75rem;">Need Fast Service or an Immediate Quote?</h2>
        <p style="font-size: 1.05rem; color: var(--color-muted); max-width: 620px; margin: 0 auto 1.75rem;">
          Skip the delay of online message forms. Speak directly with our local dispatch desk for real-time scheduling and upfront pricing.
        </p>

        <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 2rem;">
          <a href="tel:${cleanPhone}" class="btn btn-primary btn-large btn-call-primary" style="font-size: 1.15rem; padding: 0.95rem 2rem; display: inline-flex; align-items: center; gap: 0.6rem;" aria-label="Call Now: ${phone}">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            <span>Call Now: ${phone}</span>
          </a>
        </div>

        <div style="display: flex; justify-content: center; align-items: center; gap: 2rem; flex-wrap: wrap; font-size: 0.9rem; color: var(--color-muted); border-top: 1px solid var(--color-border); padding-top: 1.25rem;">
          <span>✓ Direct Dispatch — No Middleman</span>
          <span>✓ Upfront Phone Estimates</span>
          <span>✓ 24/7 Rapid Emergency Response</span>
        </div>
      </div>
    </div>
  </section>`;
  }

  // Standard Variant (for dedicated contact.html page - Pure Phone Dispatch & Contact Hub)
  const eyebrow = content.eyebrow || "Get In Touch";
  const headline = content.headline || "Direct Phone Dispatch & Customer Support";
  const subheadline =
    content.subheadline ||
    "Call us directly for fastest emergency service, upfront pricing, and priority dispatch.";

  return `
  <!-- Contact & Dispatch Center (Phone-First, Zero Message Forms) -->
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
          <h3>Immediate Dispatch & Office Details</h3>
          <p>For fastest response and emergency scheduling, please call our 24/7 dispatch desk directly.</p>

          <div class="contact-info-list">
            <div class="contact-info-item contact-phone-highlight" style="background: rgba(var(--color-primary-rgb, 29, 78, 216), 0.05); padding: 1.25rem; border-radius: var(--radius, 12px); border: 1px solid var(--color-border);">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              <div>
                <strong>Direct Phone (Primary CTA):</strong>
                <div><a href="tel:${cleanPhone}" style="color: var(--color-primary); font-weight: 800; font-size: 1.35rem;">${phone}</a></div>
                <div style="font-size: 0.85rem; color: var(--color-muted); margin-top: 0.25rem;">Live Operators Standing By</div>
              </div>
            </div>

            ${
              email
                ? `
            <div class="contact-info-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              <div>
                <strong>Office Inquiries:</strong>
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
                <strong>Operating Hours:</strong>
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

        <!-- Phone Dispatch & Priority Booking Desk (Zero Forms) -->
        <div class="card reveal" style="padding: 2.5rem; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <span class="badge" style="background: rgba(var(--color-primary-rgb, 29, 78, 216), 0.1); color: var(--color-primary); font-size: 0.8rem; text-transform: uppercase; font-weight: 700; margin-bottom: 0.75rem; display: inline-block;">Priority Phone Booking</span>
            <h3 style="font-size: 1.45rem; color: var(--color-secondary); margin-bottom: 0.75rem;">Fastest Service by Phone</h3>
            <p style="margin-bottom: 1.5rem; font-size: 0.95rem; color: var(--color-muted);">
              We prioritize telephone dispatch to guarantee immediate availability, upfront pricing, and real-time appointment confirmation.
            </p>

            <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.75rem;">
              <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
                <span style="font-size: 1.25rem;">⚡</span>
                <div>
                  <strong style="color: var(--color-secondary); display: block; font-size: 0.95rem;">Instant Scheduling</strong>
                  <span style="font-size: 0.875rem; color: var(--color-muted);">Speak directly with a local specialist to book your exact service time.</span>
                </div>
              </div>

              <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
                <span style="font-size: 1.25rem;">⏱️</span>
                <div>
                  <strong style="color: var(--color-secondary); display: block; font-size: 0.95rem;">Upfront Pricing Guidance</strong>
                  <span style="font-size: 0.875rem; color: var(--color-muted);">Receive clear price guidance and transparent repair estimates over the phone.</span>
                </div>
              </div>

              <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
                <span style="font-size: 1.25rem;">🚨</span>
                <div>
                  <strong style="color: var(--color-secondary); display: block; font-size: 0.95rem;">24/7 Emergency Dispatch</strong>
                  <span style="font-size: 0.875rem; color: var(--color-muted);">Immediate on-call technicians ready for urgent residential &amp; commercial needs.</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <a href="tel:${cleanPhone}" class="btn btn-primary btn-large btn-call-primary" style="width: 100%; justify-content: center; text-align: center; font-size: 1.2rem; padding: 1.15rem 1.5rem; display: flex; align-items: center; gap: 0.6rem; box-shadow: 0 4px 14px rgba(0,0,0,0.12);" aria-label="Call ${phone} Now">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              <span>Call ${phone} Now</span>
            </a>
            <div style="text-align: center; margin-top: 0.75rem; font-size: 0.8rem; color: var(--color-muted);">
              Average wait time under 30 seconds · Live local operators
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}
