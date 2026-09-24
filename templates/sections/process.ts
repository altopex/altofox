import { SectionJSON } from "../../lib/generator/content-schema";

export function renderProcess(section: SectionJSON): string {
  const content = section.content || {};
  const eyebrow = content.eyebrow || "Simple & Transparent";
  const headline = content.headline || "How Our Process Works";
  const subheadline = content.subheadline || "Getting your trade services completed right the first time takes just 3 easy steps.";
  const steps: { number: string; title: string; description: string }[] = content.steps || [
    {
      number: "01",
      title: "Call or Request Quote",
      description: "Contact our local dispatch team 24/7. We assess your issue and schedule rapid service.",
    },
    {
      number: "02",
      title: "On-Site Inspection & Flat Quote",
      description: "Our certified technician diagnoses the problem and provides clear, upfront pricing.",
    },
    {
      number: "03",
      title: "Guaranteed Repair & Warranty",
      description: "We complete the work cleanly, test all systems, and back everything with our warranty.",
    },
  ];

  return `
  <!-- Process Section -->
  <section class="section" id="process">
    <div class="container">
      <div class="section-header reveal">
        <span class="badge">${eyebrow}</span>
        <h2>${headline}</h2>
        <p>${subheadline}</p>
      </div>
      <div class="process-grid">
        ${steps
          .map(
            (step) => `
        <div class="card process-card reveal">
          <div class="process-step-num">${step.number}</div>
          <h3>${step.title}</h3>
          <p>${step.description}</p>
        </div>`
          )
          .join("\n        ")}
      </div>
    </div>
  </section>`;
}
