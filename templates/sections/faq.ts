import { SectionJSON } from "../../lib/generator/content-schema";

export function renderFaq(section: SectionJSON): string {
  const content = section.content || {};
  const eyebrow = content.eyebrow || "Help & Clarity";
  const headline = content.headline || "Frequently Asked Questions";
  const subheadline = content.subheadline || "Quick answers to the questions local home and business owners ask us most.";
  const items: { question: string; answer: string }[] = content.items || [
    {
      question: "How quickly can your team arrive for an emergency?",
      answer: "Our mobile technicians are stationed throughout our service areas. In emergency situations, our average dispatch arrival time is under 45 minutes.",
    },
    {
      question: "Do you charge extra for night or weekend calls?",
      answer: "No! We pride ourselves on upfront flat-rate pricing. You will always receive a clear, approved price before any work begins, with no surprise surcharges.",
    },
    {
      question: "Are your technicians licensed and insured?",
      answer: "Yes, 100%. Every specialist is fully state-licensed, insured, bonded, and has passed criminal background checks and drug screenings.",
    },
    {
      question: "What warranties do you provide on parts and labor?",
      answer: "All completed repairs and installations come with our written workmanship guarantee in addition to full manufacturer warranties on all hardware.",
    },
    {
      question: "How do I request a free quote?",
      answer: "You can call our 24/7 dispatch phone number directly or submit our online quote request form. We respond within minutes.",
    },
  ];

  return `
  <!-- FAQ Accordion Section -->
  <section class="section section-alt" id="faq">
    <div class="container">
      <div class="section-header reveal">
        <span class="badge">${eyebrow}</span>
        <h2>${headline}</h2>
        <p>${subheadline}</p>
      </div>
      <div class="faq-accordion reveal">
        ${items
          .map(
            (item, idx) => `
        <div class="faq-item ${idx === 0 ? "active" : ""}">
          <button class="faq-question" aria-expanded="${idx === 0 ? "true" : "false"}">
            <span>${item.question}</span>
            <span class="faq-icon">+</span>
          </button>
          <div class="faq-answer">
            <p>${item.answer}</p>
          </div>
        </div>`
          )
          .join("\n        ")}
      </div>
    </div>
  </section>`;
}
