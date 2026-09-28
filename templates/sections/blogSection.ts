import { SectionJSON, SiteContentJSON } from "../../lib/generator/content-schema";
import { BlogPostData } from "../../lib/blog/blog-engine";

export interface BlogSectionOptions {
  blogHubHref?: string;
  maxPosts?: number;
}

/**
 * Renders the Blog / Latest Articles section for Homepages and Hubs
 * Uses genuine semantic HTML, theme-adaptive cards, and crawlable links.
 */
export function renderBlogSection(
  section: SectionJSON,
  blogPosts: BlogPostData[] = [],
  site?: SiteContentJSON["site"],
  options: BlogSectionOptions = {}
): string {
  const content = section.content || {};
  const eyebrow = content.eyebrow || "Helpful Advice & Guides";
  const headline = content.headline || "Latest Tips & Homeowner Guides";
  const subheadline =
    content.subheadline ||
    "Practical advice on diagnostics, preventative maintenance, and when to call a licensed specialist.";
  const maxPosts = options.maxPosts || content.maxPosts || 3;
  const blogHubHref = options.blogHubHref || content.blogHubHref || "blog.html";

  const trade = (site as any)?.trade || (site as any)?.niche || "Home Service";
  const city = site?.address?.city || "Local Area";

  // If no posts provided, use realistic, trade-specific default demo guides
  const effectivePosts: BlogPostData[] =
    blogPosts && blogPosts.length > 0
      ? blogPosts.slice(0, maxPosts)
      : [
          {
            title: `5 Early Warning Signs Your ${trade} Needs Immediate Attention`,
            slug: "warning-signs-need-repair",
            primaryKeyword: `${trade.toLowerCase()} warning signs`,
            secondaryKeywords: [`emergency ${trade.toLowerCase()}`, `${city} repair`],
            metaDescription: `Discover the critical signs that indicate your home's ${trade.toLowerCase()} system is struggling before a costly breakdown occurs.`,
            datePublished: "Oct 12, 2026",
            dateModified: "Oct 14, 2026",
            authorName: site?.ownerName || `The ${site?.businessName || "Service"} Team`,
            authorBio: `Certified local technicians serving ${city}.`,
            wordCount: 1450,
            contentHtml: "",
            faqs: [],
            relatedSlugs: [],
            imageUrl: "images/vector-article-1.svg",
            imageAlt: `Technician inspecting home ${trade.toLowerCase()} system`,
          },
          {
            title: `How Much Does Professional ${trade} Typically Cost? Key Price Factors`,
            slug: "understanding-cost-factors",
            primaryKeyword: `${trade.toLowerCase()} cost factors`,
            secondaryKeywords: [`transparent pricing`, `${city} rates`],
            metaDescription: `An honest breakdown of parts, labor, diagnostic fees, and efficiency factors that influence repair and replacement costs in ${city}.`,
            datePublished: "Oct 08, 2026",
            dateModified: "Oct 10, 2026",
            authorName: site?.ownerName || `The ${site?.businessName || "Service"} Team`,
            authorBio: `Certified local technicians serving ${city}.`,
            wordCount: 1520,
            contentHtml: "",
            faqs: [],
            relatedSlugs: [],
            imageUrl: "images/vector-article-2.svg",
            imageAlt: `Transparent cost estimate breakdown and consultation`,
          },
          {
            title: `When to Call an Emergency ${trade} vs. Scheduling Routine Service`,
            slug: "emergency-vs-routine-service",
            primaryKeyword: `emergency ${trade.toLowerCase()}`,
            secondaryKeywords: [`24/7 service`, `urgent home repair`],
            metaDescription: `Learn how to triage urgent home hazards like active leaks or electrical sparks versus minor issues that can wait for morning hours.`,
            datePublished: "Sep 28, 2026",
            dateModified: "Oct 01, 2026",
            authorName: site?.ownerName || `The ${site?.businessName || "Service"} Team`,
            authorBio: `Certified local technicians serving ${city}.`,
            wordCount: 1380,
            contentHtml: "",
            faqs: [],
            relatedSlugs: [],
            imageUrl: "images/vector-article-3.svg",
            imageAlt: `Emergency dispatch vehicle arriving at residential home`,
          },
        ];

  return `
  <!-- Blog & Homeowner Guides Section -->
  <section class="section section-alt blog-section" id="blog">
    <div class="container">
      <div class="section-header reveal">
        <span class="badge">${eyebrow}</span>
        <h2>${headline}</h2>
        <p>${subheadline}</p>
      </div>

      <div class="blog-grid">
        ${effectivePosts
          .map((post) => {
            const postHref = post.slug.startsWith("blog/")
              ? `${post.slug.replace(/\.html$/, "")}.html`
              : `blog/${post.slug.replace(/\.html$/, "")}.html`;

            const imgHtml = post.imageUrl
              ? `
            <div class="blog-card-image-wrap">
              <img
                src="${post.imageUrl}"
                alt="${post.imageAlt || post.title}"
                class="img-card img-blog"
                width="800"
                height="533"
                loading="lazy"
              />
            </div>`
              : "";

            return `
        <article class="card blog-card reveal">
          ${imgHtml}
          <div class="blog-card-content">
            <div class="blog-card-meta">
              <span class="blog-card-date">${post.datePublished}</span>
              <span class="blog-card-sep">•</span>
              <span class="blog-card-read">${Math.max(3, Math.round(post.wordCount / 220))} min read</span>
            </div>
            <h3 class="blog-card-title">
              <a href="${postHref}" class="blog-card-title-link">${post.title}</a>
            </h3>
            <p class="blog-card-excerpt">${post.metaDescription}</p>
            <div class="blog-card-footer">
              <span class="blog-card-author">By ${post.authorName}</span>
              <a href="${postHref}" class="blog-read-more" aria-label="Read guide: ${post.title}">
                Read Guide <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </article>`;
          })
          .join("\n        ")}
      </div>

      <div class="blog-section-cta reveal">
        <a href="${blogHubHref}" class="btn btn-outline" aria-label="View all homeowner advice and guides">
          <span>Browse All Guides &amp; Insights</span>
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  </section>`;
}
