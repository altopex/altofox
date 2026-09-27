import { SectionJSON, SiteContentJSON } from "../../lib/generator/content-schema";
import { ResolvedImage } from "../../lib/photos/photo-service";
import { renderStaticImageTag } from "../../lib/photos/image-provider";

export function renderHero(
  section: SectionJSON,
  sitePhone: string,
  images: ResolvedImage[] = [],
  site?: SiteContentJSON["site"]
): string {
  const content = section.content || {};
  const variant = section.variant || "split";

  const eyebrow = content.eyebrow || "Trusted Local Service";
  const h1 = content.h1 || "Expert Local Services in Your Area";
  const subheadline =
    content.subheadline ||
    "Fast response, upfront transparent pricing, and guaranteed workmanship on every job.";
  const phone = content.primaryCta || sitePhone || "(555) 123-4567";
  const cleanPhone = phone.replace(/[^\d+]/g, "");
  const secondaryCta = content.secondaryCta || "Get a Free Quote";
  const secondaryUrl = content.secondaryUrl || "contact.html";

  // Build trust badges strictly from user-confirmed facts (Google Policy Compliance)
  const confirmedBadges: string[] = [];
  if (site?.insuredBonded || site?.licenseNumber) {
    confirmedBadges.push(site.licenseNumber ? `Lic. #${site.licenseNumber}` : "🛡️ Licensed & Insured");
  }
  if (site?.yearsInBusiness) {
    confirmedBadges.push(`⭐ ${site.yearsInBusiness} Experience`);
  }
  if (site?.warrantyGuarantee) {
    confirmedBadges.push(`✅ ${site.warrantyGuarantee}`);
  }
  if (site?.responseTime) {
    confirmedBadges.push(`⚡ ${site.responseTime} Response`);
  } else if (site?.emergency247) {
    confirmedBadges.push("⚡ 24/7 Emergency Dispatch");
  }
  if (site?.freeEstimates) {
    confirmedBadges.push("📋 Free Estimates");
  }
  if (site?.allowedClaims && site.allowedClaims.length > 0) {
    confirmedBadges.push(...site.allowedClaims.slice(0, 2));
  }

  // Filter any unbacked claims from AI section badges
  const filteredAiBadges = Array.isArray(content.trustBadges)
    ? content.trustBadges.filter((b: string) => {
        const lower = b.toLowerCase();
        if (
          lower.includes("5-star") ||
          lower.includes("5.0") ||
          lower.includes("#1") ||
          lower.includes("top rated") ||
          lower.includes("top-rated") ||
          lower.includes("best in")
        ) {
          return (site?.allowedClaims || []).some((ac) => lower.includes(ac.toLowerCase()));
        }
        return true;
      })
    : [];

  const trustBadges: string[] =
    confirmedBadges.length > 0
      ? confirmedBadges
      : filteredAiBadges.length > 0
      ? filteredAiBadges
      : ["Locally Owned & Operated", "Upfront Pricing", `Serving ${site?.address?.city || "Local Area"}`];

  // Floating card display: only show ratings if verified real reviews exist or allowed claim
  let floatingCardHtml = "";
  if (site?.realReviewsConfirmed && site?.realReviews && site.realReviews.length > 0) {
    floatingCardHtml = `
        <div class="hero-floating-card">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          <div>
            <div style="font-weight: 700; color: var(--color-secondary); font-size: 0.95rem;">${site.realReviews.length} Verified Customer Reviews</div>
            <div style="font-size: 0.8rem; color: var(--color-muted);">Real Local Feedback</div>
          </div>
        </div>`;
  } else if (site?.insuredBonded || site?.licenseNumber) {
    floatingCardHtml = `
        <div class="hero-floating-card">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          <div>
            <div style="font-weight: 700; color: var(--color-secondary); font-size: 0.95rem;">Licensed &amp; Insured</div>
            <div style="font-size: 0.8rem; color: var(--color-muted);">${site.licenseNumber ? `Lic. #${site.licenseNumber}` : "Verified Local Specialists"}</div>
          </div>
        </div>`;
  } else {
    floatingCardHtml = `
        <div class="hero-floating-card">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          <div>
            <div style="font-weight: 700; color: var(--color-secondary); font-size: 0.95rem;">Dedicated Local Service</div>
            <div style="font-size: 0.8rem; color: var(--color-muted);">Serving ${site?.address?.city || "Our Community"}</div>
          </div>
        </div>`;
  }

  const fallbackImg: ResolvedImage = {
    url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80",
    alt: h1,
    slot: "main",
  };
  const mainImage = images.find((img) => img.slot === "main") || images[0] || fallbackImg;

  const renderTrustBadges = () => {
    return trustBadges
      .map((badge) => `<div class="trust-badge-item"><span>${badge}</span></div>`)
      .join("\n            ");
  };

  // 1. VARIANT: COMPACT-BOLD (Bold Conversion Theme)
  if (variant === "compact-bold") {
    return `
  <!-- Hero Section: Compact Bold Variant -->
  <section class="hero hero-compact-bold">
    <div class="container hero-compact-grid">
      <div class="hero-text-col reveal">
        <div class="urgent-dispatch-banner">
          <span class="pulsing-dot"></span>
          <span>Available Now for Immediate Local Dispatch in ${site?.address?.city || "Your Area"}</span>
        </div>
        <h1>${h1}</h1>
        <p class="hero-subheadline">${subheadline}</p>
        <div class="hero-actions">
          <a href="tel:${cleanPhone}" class="btn btn-primary btn-large btn-mobile-full btn-call-primary btn-pulsing" aria-label="Call Now: ${phone}">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            <span>CALL NOW: ${phone}</span>
          </a>
          <a href="${secondaryUrl}" class="btn btn-secondary btn-large btn-mobile-full">${secondaryCta}</a>
        </div>
        <div class="trust-badges-row">
          ${renderTrustBadges()}
        </div>
      </div>
      <div class="hero-image-wrap reveal">
        ${renderStaticImageTag({
          src: mainImage.url || mainImage.localPath || "",
          alt: mainImage.alt || h1,
          fallbackUrl: mainImage.fallbackUrl,
          allFallbacks: mainImage.allFallbacks,
          localSvg: mainImage.localSvgFallback,
          width: 1920,
          height: 1080,
          loading: "eager",
          fetchpriority: "high",
          className: "img-hero img-hero-compact",
        })}
        ${floatingCardHtml}
      </div>
    </div>
  </section>`;
  }

  // 2. VARIANT: SPLIT-FULL (Split Hero Theme)
  if (variant === "split-full") {
    return `
  <!-- Hero Section: Split Full Variant -->
  <section class="hero hero-split hero-split-full">
    <div class="container hero-split-grid">
      <div class="hero-text-col reveal">
        <span class="badge">${eyebrow}</span>
        <h1>${h1}</h1>
        <p class="hero-subheadline">${subheadline}</p>
        <div class="hero-actions">
          <a href="tel:${cleanPhone}" class="btn btn-primary btn-large btn-mobile-full btn-call-primary" aria-label="Call Now: ${phone}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            <span>Call Now: ${phone}</span>
          </a>
          <a href="${secondaryUrl}" class="btn btn-secondary btn-large btn-mobile-full">${secondaryCta}</a>
        </div>
        <div class="trust-badges-row">
          ${renderTrustBadges()}
        </div>
      </div>
      <div class="hero-image-wrap hero-image-full-height reveal">
        ${renderStaticImageTag({
          src: mainImage.url || mainImage.localPath || "",
          alt: mainImage.alt || h1,
          fallbackUrl: mainImage.fallbackUrl,
          allFallbacks: mainImage.allFallbacks,
          localSvg: mainImage.localSvgFallback,
          width: 1920,
          height: 1080,
          loading: "eager",
          fetchpriority: "high",
          className: "img-hero img-hero-fullheight",
        })}
        ${floatingCardHtml}
      </div>
    </div>
  </section>`;
  }

  // 3. VARIANT: ASYMMETRIC (Premium Local & Editorial Modern)
  if (variant === "asymmetric") {
    return `
  <!-- Hero Section: Asymmetric Variant -->
  <section class="hero hero-asymmetric">
    <div class="container hero-asymmetric-grid">
      <div class="hero-text-col reveal">
        <span class="badge badge-refined">${eyebrow}</span>
        <h1 class="heading-editorial">${h1}</h1>
        <p class="hero-subheadline">${subheadline}</p>
        <div class="hero-actions">
          <a href="tel:${cleanPhone}" class="btn btn-primary btn-large btn-mobile-full btn-call-primary" aria-label="Call Now: ${phone}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            <span>Speak With a Specialist: ${phone}</span>
          </a>
          <a href="${secondaryUrl}" class="btn btn-outline btn-large btn-mobile-full">${secondaryCta}</a>
        </div>
        <div class="trust-badges-row">
          ${renderTrustBadges()}
        </div>
      </div>
      <div class="hero-image-wrap hero-image-asymmetric reveal">
        <div class="asymmetric-frame">
          ${renderStaticImageTag({
            src: mainImage.url || mainImage.localPath || "",
            alt: mainImage.alt || h1,
            fallbackUrl: mainImage.fallbackUrl,
            allFallbacks: mainImage.allFallbacks,
            localSvg: mainImage.localSvgFallback,
            width: 1920,
            height: 1080,
            loading: "eager",
            fetchpriority: "high",
            className: "img-hero img-hero-asymmetric",
          })}
        </div>
        ${floatingCardHtml}
      </div>
    </div>
  </section>`;
  }

  // 4. VARIANT: SERVICE-FIRST (Modern Service Grid)
  if (variant === "service-first") {
    return `
  <!-- Hero Section: Service First Variant -->
  <section class="hero hero-service-first">
    <div class="container">
      <div class="hero-compact-header reveal">
        <span class="badge">${eyebrow}</span>
        <h1>${h1}</h1>
        <p class="hero-subheadline">${subheadline}</p>
        <div class="hero-actions">
          <a href="tel:${cleanPhone}" class="btn btn-primary btn-large btn-mobile-full btn-call-primary" aria-label="Call Now: ${phone}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            <span>Call For Instant Dispatch: ${phone}</span>
          </a>
          <a href="#services" class="btn btn-secondary btn-large btn-mobile-full">Browse All Services ↓</a>
        </div>
        <!-- Quick 3-Step Reassurance Strip -->
        <div class="hero-quick-strip">
          <div class="quick-strip-item">⚡ <strong>1. Quick Call</strong> — Live Dispatch</div>
          <div class="quick-strip-item">🛡️ <strong>2. Upfront Price</strong> — Zero Surprises</div>
          <div class="quick-strip-item">✅ <strong>3. Guaranteed Fix</strong> — 100% Guaranteed</div>
        </div>
      </div>
    </div>
  </section>`;
  }

  // 5. VARIANT: SOFT (Contemporary Soft)
  if (variant === "soft") {
    return `
  <!-- Hero Section: Soft Variant -->
  <section class="hero hero-soft">
    <div class="container hero-split-grid">
      <div class="hero-text-col reveal">
        <span class="badge badge-pill">${eyebrow}</span>
        <h1>${h1}</h1>
        <p class="hero-subheadline">${subheadline}</p>
        <div class="hero-actions">
          <a href="tel:${cleanPhone}" class="btn btn-primary btn-large btn-pill btn-mobile-full btn-call-primary" aria-label="Call Now: ${phone}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            <span>Call Today: ${phone}</span>
          </a>
          <a href="${secondaryUrl}" class="btn btn-outline btn-large btn-pill btn-mobile-full">${secondaryCta}</a>
        </div>
        <div class="trust-badges-row">
          ${renderTrustBadges()}
        </div>
      </div>
      <div class="hero-image-wrap reveal">
        ${renderStaticImageTag({
          src: mainImage.url || mainImage.localPath || "",
          alt: mainImage.alt || h1,
          fallbackUrl: mainImage.fallbackUrl,
          allFallbacks: mainImage.allFallbacks,
          localSvg: mainImage.localSvgFallback,
          width: 1920,
          height: 1080,
          loading: "eager",
          fetchpriority: "high",
          className: "img-hero img-hero-soft",
        })}
        ${floatingCardHtml}
      </div>
    </div>
  </section>`;
  }

  // 6. VARIANT: HIGH CONTRAST (High Contrast Modern)
  if (variant === "high-contrast") {
    return `
  <!-- Hero Section: High Contrast Variant -->
  <section class="hero hero-high-contrast">
    <div class="container hero-split-grid">
      <div class="hero-text-col reveal">
        <span class="badge badge-high-contrast">${eyebrow}</span>
        <h1 class="heading-high-contrast">${h1}</h1>
        <p class="hero-subheadline">${subheadline}</p>
        <div class="hero-actions">
          <a href="tel:${cleanPhone}" class="btn btn-primary btn-large btn-mobile-full btn-call-primary" aria-label="Call Now: ${phone}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            <span>CALL DIRECT: ${phone}</span>
          </a>
          <a href="${secondaryUrl}" class="btn btn-secondary btn-large btn-mobile-full">${secondaryCta}</a>
        </div>
        <div class="trust-badges-row">
          ${renderTrustBadges()}
        </div>
      </div>
      <div class="hero-image-wrap reveal">
        ${renderStaticImageTag({
          src: mainImage.url || mainImage.localPath || "",
          alt: mainImage.alt || h1,
          fallbackUrl: mainImage.fallbackUrl,
          allFallbacks: mainImage.allFallbacks,
          localSvg: mainImage.localSvgFallback,
          width: 1920,
          height: 1080,
          loading: "eager",
          fetchpriority: "high",
          className: "img-hero img-hero-contrast",
        })}
        ${floatingCardHtml}
      </div>
    </div>
  </section>`;
  }

  // 7. VARIANT: MINIMAL (Clean Minimal)
  if (variant === "minimal") {
    return `
  <!-- Hero Section: Clean Minimal Variant -->
  <section class="hero hero-minimal">
    <div class="container hero-minimal-grid reveal">
      <div class="hero-text-col">
        <span class="badge badge-minimal">${eyebrow}</span>
        <h1 class="heading-minimal">${h1}</h1>
        <p class="hero-subheadline">${subheadline}</p>
        <div class="hero-actions">
          <a href="tel:${cleanPhone}" class="btn btn-primary btn-large btn-mobile-full btn-call-primary" aria-label="Call Now: ${phone}">
            <span>Call Now: ${phone}</span>
          </a>
          <a href="${secondaryUrl}" class="btn btn-outline btn-large btn-mobile-full">${secondaryCta}</a>
        </div>
      </div>
      <div class="hero-image-wrap reveal">
        ${renderStaticImageTag({
          src: mainImage.url || mainImage.localPath || "",
          alt: mainImage.alt || h1,
          fallbackUrl: mainImage.fallbackUrl,
          allFallbacks: mainImage.allFallbacks,
          localSvg: mainImage.localSvgFallback,
          width: 1920,
          height: 1080,
          loading: "eager",
          fetchpriority: "high",
          className: "img-hero img-hero-minimal",
        })}
      </div>
    </div>
  </section>`;
  }

  // 8. VARIANT: FULL IMAGE (Photo Background with Dark Gradient Overlay - Legacy)
  if (variant === "fullImage") {
    return `
  <!-- Hero Section: Full Image Variant -->
  <section class="hero hero-full-image" style="background-image: url('${mainImage.url || mainImage.localPath}');" data-bg-remote="${mainImage.url || ''}" data-fallbacks="${(mainImage.allFallbacks || []).join(',')}" data-local-svg="${mainImage.localSvgFallback || ''}">
    <div class="hero-overlay"></div>
    <div class="container reveal">
      <span class="badge" style="background: rgba(255, 255, 255, 0.15); color: #FFFFFF;">${eyebrow}</span>
      <h1>${h1}</h1>
      <p class="hero-subheadline">${subheadline}</p>
      <div class="hero-actions">
        <a href="tel:${cleanPhone}" class="btn btn-primary btn-large btn-mobile-full btn-call-primary" aria-label="Call Now: ${phone}">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          <span>Call Now: ${phone}</span>
        </a>
        <a href="${secondaryUrl}" class="btn btn-outline btn-large btn-mobile-full" style="color: #FFFFFF; border-color: #FFFFFF;">${secondaryCta}</a>
      </div>
      <div class="trust-badges-row">
        ${renderTrustBadges()}
      </div>
    </div>
  </section>`;
  }

  // 9. DEFAULT / VARIANT: SPLIT (Modern Local Pro)
  return `
  <!-- Hero Section: Split Variant -->
  <section class="hero hero-split">
    <div class="container hero-split-grid">
      <div class="hero-text-col reveal">
        <span class="badge">${eyebrow}</span>
        <h1>${h1}</h1>
        <p class="hero-subheadline">${subheadline}</p>
        <div class="hero-actions">
          <a href="tel:${cleanPhone}" class="btn btn-primary btn-large btn-mobile-full btn-call-primary" aria-label="Call Now: ${phone}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            <span>Call Now: ${phone}</span>
          </a>
          <a href="${secondaryUrl}" class="btn btn-secondary btn-large btn-mobile-full">${secondaryCta}</a>
        </div>
        <div class="trust-badges-row">
          ${renderTrustBadges()}
        </div>
      </div>
      <div class="hero-image-wrap reveal">
        ${renderStaticImageTag({
          src: mainImage.url || mainImage.localPath || "",
          alt: mainImage.alt || h1,
          fallbackUrl: mainImage.fallbackUrl,
          allFallbacks: mainImage.allFallbacks,
          localSvg: mainImage.localSvgFallback,
          width: 1920,
          height: 1080,
          loading: "eager",
          fetchpriority: "high",
          className: "img-hero img-hero-split",
        })}
        ${floatingCardHtml}
      </div>
    </div>
  </section>`;
}
