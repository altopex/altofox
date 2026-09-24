import { SectionJSON } from "../../lib/generator/content-schema";

export function renderTrustBar(section?: SectionJSON): string {
  const content = section?.content || {};
  const items: { icon: string; title: string; subtitle: string }[] = content.items || [
    {
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
      title: "Licensed & Insured",
      subtitle: "Verified Master Techs",
    },
    {
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
      title: "5-Star Rated",
      subtitle: "Over 500+ Local Reviews",
    },
    {
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
      title: "Fast Local Arrival",
      subtitle: "Stationed in Your City",
    },
    {
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
      title: "100% Guaranteed",
      subtitle: "Written Warranty on Work",
    },
  ];

  return `
  <!-- Trust Bar Section -->
  <section class="trust-bar" aria-label="Key Trust Signals">
    <div class="container">
      <div class="trust-bar-grid">
        ${items
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
