import { SectionJSON } from "../../lib/generator/content-schema";

export function renderStats(section: SectionJSON): string {
  const content = section.content || {};
  const stats: { number: string; label: string }[] = content.stats || [
    { number: "20+", label: "Years Serving Local Community" },
    { number: "45m", label: "Average Arrival Time" },
    { number: "10,000+", label: "Completed Projects" },
    { number: "100%", label: "Satisfaction Guarantee" },
  ];

  return `
  <!-- Stats Section -->
  <section class="section section-alt" aria-label="Key Milestones">
    <div class="container">
      <div class="stats-grid">
        ${stats
          .map(
            (stat) => `
        <div class="stat-card reveal">
          <div class="stat-number">${stat.number}</div>
          <div class="stat-label">${stat.label}</div>
        </div>`
          )
          .join("\n        ")}
      </div>
    </div>
  </section>`;
}
