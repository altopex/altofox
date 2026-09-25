import { SectionJSON, SiteContentJSON } from "../../lib/generator/content-schema";

export function renderTrustBar(
  section?: SectionJSON,
  site?: SiteContentJSON["site"]
): string {
  const content = section?.content || {};

  // Build items strictly from user-confirmed facts (Google Policy Compliance)
  const items: { icon: string; title: string; subtitle: string }[] = [];

  const shieldIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`;
  const checkIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
  const clockIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
  const mapPinIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
  const tagIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`;
  const starIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;

  if (site?.insuredBonded || site?.licenseNumber) {
    items.push({
      icon: shieldIcon,
      title: "Licensed & Insured",
      subtitle: site.licenseNumber ? `Lic. #${site.licenseNumber}` : "Fully Credentialed",
    });
  }

  if (site?.warrantyGuarantee) {
    items.push({
      icon: checkIcon,
      title: "Workmanship Warranty",
      subtitle: site.warrantyGuarantee,
    });
  }

  if (site?.emergency247) {
    items.push({
      icon: clockIcon,
      title: "24/7 Availability",
      subtitle: "Priority Emergency Dispatch",
    });
  } else if (site?.responseTime) {
    items.push({
      icon: clockIcon,
      title: "Fast Local Response",
      subtitle: `${site.responseTime} Arrival`,
    });
  }

  if (site?.yearsInBusiness) {
    items.push({
      icon: checkIcon,
      title: `${site.yearsInBusiness} Experience`,
      subtitle: `Serving ${site.address?.city || "Our Community"}`,
    });
  }

  if (site?.freeEstimates) {
    items.push({
      icon: tagIcon,
      title: "Free Estimates",
      subtitle: "Upfront Honest Pricing",
    });
  }

  if (site?.realReviewsConfirmed && site?.realReviews && site.realReviews.length > 0) {
    items.push({
      icon: starIcon,
      title: "Verified Reviews",
      subtitle: `${site.realReviews.length} Real Customer Ratings`,
    });
  }

  // If fewer than 3 confirmed items, add safe factual defaults
  if (items.length < 3) {
    if (!items.some((i) => i.title.includes("Pricing"))) {
      items.push({
        icon: tagIcon,
        title: "Upfront Pricing",
        subtitle: "Zero Hidden Fees",
      });
    }
    if (!items.some((i) => i.title.includes("Locally"))) {
      items.push({
        icon: mapPinIcon,
        title: "Locally Owned",
        subtitle: `Serving ${site?.address?.city || "Metro Area"}`,
      });
    }
    if (!items.some((i) => i.title.includes("Guaranteed") || i.title.includes("Warranty"))) {
      items.push({
        icon: checkIcon,
        title: "Quality Workmanship",
        subtitle: "Dedicated Trade Craft",
      });
    }
  }

  const finalItems = items.slice(0, 4);

  return `
  <!-- Trust Bar Section -->
  <section class="trust-bar" aria-label="Key Trust Signals">
    <div class="container">
      <div class="trust-bar-grid">
        ${finalItems
          .map(
            (item) => `
        <div class="trust-bar-item">
          ${item.icon}
          <div>
            <div style="color: #FFFFFF; font-weight: 700; font-size: 0.95rem;">${item.title}</div>
            <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.8rem;">${item.subtitle}</div>
          </div>
        </div>`
          )
          .join("\n        ")}
      </div>
    </div>
  </section>`;
}
