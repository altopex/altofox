import { SectionJSON } from "../../lib/generator/content-schema";

export function renderWhyUs(section: SectionJSON): string {
  const content = section.content || {};
  const eyebrow = content.eyebrow || "The Local Advantage";
  const headline = content.headline || "Why Neighbors Trust Our Team";
  const subheadline = content.subheadline || "We go above and beyond to provide dependable, worry-free trade craftsmanship.";
  const benefits: { title: string; description: string; icon?: string }[] = content.benefits || [
    {
      title: "Upfront Flat Pricing",
      description: "No hidden charges or surprise invoices. You review and authorize the price before work starts.",
    },
    {
      title: "24/7 Priority Emergency Help",
      description: "Urgent issues don't wait for business hours. Our on-call crew responds day and night.",
    },
    {
      title: "Certified Master Specialists",
      description: "State-licensed, drug-tested, and background-checked technicians for your total peace of mind.",
    },
    {
      title: "Fully Stocked Mobile Units",
      description: "Over 90% of service requests are fixed right on the spot during our very first visit.",
    },
    {
      title: "Spotless Clean-Up Guarantee",
      description: "We use protective floor covers, shoe boots, and clean up completely after every single job.",
    },
    {
      title: "Written Workmanship Warranty",
      description: "We stand behind every repair and replacement with an unconditional written warranty.",
    },
  ];

  const defaultIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;

  return `
  <!-- Why Us Section -->
  <section class="section section-alt" id="why-us">
    <div class="container">
      <div class="section-header reveal">
        <span class="badge">${eyebrow}</span>
        <h2>${headline}</h2>
        <p>${subheadline}</p>
      </div>
      <div class="services-grid">
        ${benefits
          .map(
            (b) => `
        <div class="card reveal" style="display: flex; flex-direction: column;">
          <div class="service-icon-box">
            ${defaultIcon}
          </div>
          <h3>${b.title}</h3>
          <p>${b.description}</p>
        </div>`
          )
          .join("\n        ")}
      </div>
    </div>
  </section>`;
}
