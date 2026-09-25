/**
 * Blog Engine for Local Contractors & Service Businesses
 * Suggests high-intent local topics, generates comprehensive 1200-1800 word guides,
 * and formats E-E-A-T author boxes, BlogPosting schema, and related articles.
 */

import { SiteInfoJSON } from "../generator/content-schema";
import { Theme } from "../themes";

export interface BlogTopicSuggestion {
  id: string;
  title: string;
  slug: string;
  primaryKeyword: string;
  category: "problem" | "cost" | "seasonal" | "comparison" | "guide";
  searchIntent: "Informational" | "Commercial Investigation" | "Local Decision";
  targetServiceLink?: string;
  estimatedWords: number;
}

export interface BlogPostData {
  title: string;
  slug: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  metaDescription: string;
  datePublished: string;
  dateModified: string;
  authorName: string;
  authorBio: string;
  imageUrl?: string;
  imageAlt?: string;
  wordCount: number;
  seoScore?: number;
  contentHtml: string;
  faqs: { question: string; answer: string }[];
  relatedSlugs: string[];
}

/**
 * Generates 15 tailored topic ideas based on trade niche, services, and city.
 */
export function generateBlogTopicIdeas(
  businessType: string,
  city: string,
  state: string,
  services: string[] = []
): BlogTopicSuggestion[] {
  const trade = businessType || "Home Service";
  const srv1 = services[0] || `${trade} Repair`;
  const srv2 = services[1] || `${trade} Maintenance`;
  const srv3 = services[2] || `${trade} Replacement`;

  return [
    {
      id: "topic-1",
      title: `5 Early Warning Signs Your ${srv1} Needs Immediate Attention`,
      slug: `warning-signs-need-${srv1.toLowerCase().replace(/\s+/g, "-")}`,
      primaryKeyword: `${srv1.toLowerCase()} warning signs`,
      category: "problem",
      searchIntent: "Informational",
      targetServiceLink: "services.html",
      estimatedWords: 1400,
    },
    {
      id: "topic-2",
      title: `How Much Does ${srv1} Typically Cost? Key Price Factors Explained`,
      slug: `understanding-cost-factors-${srv1.toLowerCase().replace(/\s+/g, "-")}`,
      primaryKeyword: `${srv1.toLowerCase()} cost factors`,
      category: "cost",
      searchIntent: "Commercial Investigation",
      targetServiceLink: "services.html",
      estimatedWords: 1550,
    },
    {
      id: "topic-3",
      title: `Preparing Your Home for Winter in ${city}: Seasonal ${trade} Checklist`,
      slug: `winter-prep-${trade.toLowerCase().replace(/\s+/g, "-")}-guide-${city.toLowerCase()}`,
      primaryKeyword: `winter ${trade.toLowerCase()} checklist ${city}`,
      category: "seasonal",
      searchIntent: "Local Decision",
      targetServiceLink: "index.html",
      estimatedWords: 1600,
    },
    {
      id: "topic-4",
      title: `Repair vs. Replace: How to Decide on Your ${srv2}`,
      slug: `repair-vs-replace-${srv2.toLowerCase().replace(/\s+/g, "-")}-guide`,
      primaryKeyword: `${srv2.toLowerCase()} repair or replace`,
      category: "comparison",
      searchIntent: "Commercial Investigation",
      targetServiceLink: "services.html",
      estimatedWords: 1450,
    },
    {
      id: "topic-5",
      title: `How to Choose a Licensed, Trusted ${trade} in ${city}, ${state}`,
      slug: `how-to-hire-licensed-${trade.toLowerCase().replace(/\s+/g, "-")}-${city.toLowerCase()}`,
      primaryKeyword: `how to hire a ${trade.toLowerCase()} in ${city}`,
      category: "guide",
      searchIntent: "Local Decision",
      targetServiceLink: "about.html",
      estimatedWords: 1500,
    },
    {
      id: "topic-6",
      title: `Why Is My ${srv1} Making Strange Noises? Diagnostics & Fixes`,
      slug: `strange-noises-from-${srv1.toLowerCase().replace(/\s+/g, "-")}`,
      primaryKeyword: `${srv1.toLowerCase()} strange noise`,
      category: "problem",
      searchIntent: "Informational",
      targetServiceLink: "services.html",
      estimatedWords: 1350,
    },
    {
      id: "topic-7",
      title: `Summer Heat & Your Home: Preventing Common ${trade} Overloads in ${city}`,
      slug: `summer-heat-home-tips-${city.toLowerCase()}`,
      primaryKeyword: `summer ${trade.toLowerCase()} tips ${city}`,
      category: "seasonal",
      searchIntent: "Local Decision",
      targetServiceLink: "index.html",
      estimatedWords: 1400,
    },
    {
      id: "topic-8",
      title: `Top Energy Efficiency Upgrades for Modern ${srv3}`,
      slug: `energy-efficient-upgrades-${srv3.toLowerCase().replace(/\s+/g, "-")}`,
      primaryKeyword: `energy efficient ${srv3.toLowerCase()}`,
      category: "comparison",
      searchIntent: "Commercial Investigation",
      targetServiceLink: "services.html",
      estimatedWords: 1500,
    },
    {
      id: "topic-9",
      title: `What to Do in an Emergency: Step-by-Step Homeowner Safety Guide`,
      slug: `emergency-${trade.toLowerCase().replace(/\s+/g, "-")}-safety-first-steps`,
      primaryKeyword: `emergency ${trade.toLowerCase()} steps`,
      category: "problem",
      searchIntent: "Informational",
      targetServiceLink: "contact.html",
      estimatedWords: 1300,
    },
    {
      id: "topic-10",
      title: `Home Inspection Checklist: Evaluating Your ${trade} Systems Before Buying`,
      slug: `homebuyer-inspection-checklist-${trade.toLowerCase().replace(/\s+/g, "-")}`,
      primaryKeyword: `home inspection ${trade.toLowerCase()} checklist`,
      category: "guide",
      searchIntent: "Informational",
      targetServiceLink: "about.html",
      estimatedWords: 1650,
    },
    {
      id: "topic-11",
      title: `Understanding Hard Water and Mineral Buildup in ${city} Homes`,
      slug: `hard-water-effects-solutions-${city.toLowerCase()}`,
      primaryKeyword: `hard water problems ${city}`,
      category: "problem",
      searchIntent: "Informational",
      targetServiceLink: "services.html",
      estimatedWords: 1350,
    },
    {
      id: "topic-12",
      title: `DIY vs Professional ${trade}: Which Jobs Are Safe and Which Need a License`,
      slug: `diy-vs-professional-${trade.toLowerCase().replace(/\s+/g, "-")}-safety`,
      primaryKeyword: `diy ${trade.toLowerCase()} safety risks`,
      category: "guide",
      searchIntent: "Commercial Investigation",
      targetServiceLink: "contact.html",
      estimatedWords: 1550,
    },
    {
      id: "topic-13",
      title: `How Routine Maintenance Can Double Your Equipment Lifespan`,
      slug: `how-preventative-maintenance-extends-equipment-life`,
      primaryKeyword: `${trade.toLowerCase()} preventative maintenance benefits`,
      category: "guide",
      searchIntent: "Commercial Investigation",
      targetServiceLink: "services.html",
      estimatedWords: 1400,
    },
    {
      id: "topic-14",
      title: `Smart Home Tech & Modern ${trade} Automation for Homeowners`,
      slug: `smart-home-tech-${trade.toLowerCase().replace(/\s+/g, "-")}-upgrades`,
      primaryKeyword: `smart home ${trade.toLowerCase()} automation`,
      category: "comparison",
      searchIntent: "Commercial Investigation",
      targetServiceLink: "services.html",
      estimatedWords: 1300,
    },
    {
      id: "topic-15",
      title: `Common Building Code Violations in ${city} and How to Fix Them`,
      slug: `building-code-regulations-${trade.toLowerCase().replace(/\s+/g, "-")}-${city.toLowerCase()}`,
      primaryKeyword: `${city} building codes ${trade.toLowerCase()}`,
      category: "guide",
      searchIntent: "Local Decision",
      targetServiceLink: "about.html",
      estimatedWords: 1500,
    },
  ];
}

/**
 * Renders an accessible, responsive blog article page (blog/[slug].html)
 */
export function renderBlogPostHtml(
  post: BlogPostData,
  site: SiteInfoJSON,
  theme: Theme,
  domain: string,
  allPosts: { title: string; slug: string; metaDescription: string }[] = []
): string {
  const authorName = site.ownerName || post.authorName || `The ${site.businessName} Team`;
  const authorBio =
    site.ownerBio || post.authorBio || `Certified master technicians providing honest service across ${site.address?.city || "the community"}.`;

  const related = allPosts.filter((p) => p.slug !== post.slug).slice(0, 3);

  return `
<!-- Breadcrumbs -->
<nav aria-label="Breadcrumb" class="py-3 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-xs text-slate-500">
  <ol class="flex items-center space-x-2">
    <li><a href="../index.html" class="hover:text-indigo-600 font-medium">Home</a></li>
    <li><span class="text-slate-400">/</span></li>
    <li><a href="../blog.html" class="hover:text-indigo-600 font-medium">Blog</a></li>
    <li><span class="text-slate-400">/</span></li>
    <li class="font-semibold text-slate-900 truncate max-w-[200px]" aria-current="page">${post.title}</li>
  </ol>
</nav>

<article class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
  <!-- Article Header -->
  <header class="space-y-4 mb-8">
    <div class="inline-flex items-center space-x-2 text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
      <span>Homeowner Advice</span>
      <span>•</span>
      <span>${post.wordCount} words</span>
    </div>
    <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
      ${post.title}
    </h1>
    <div class="flex items-center space-x-4 text-xs text-slate-500 pt-2 border-b border-slate-100 pb-4">
      <span>By <strong class="text-slate-800">${authorName}</strong></span>
      <span>•</span>
      <span>Published ${post.datePublished}</span>
      <span>•</span>
      <span>Updated ${post.dateModified}</span>
    </div>
  </header>

  <!-- Featured Image -->
  ${
    post.imageUrl
      ? `
  <div class="rounded-2xl overflow-hidden mb-8 border border-slate-200 shadow-sm max-h-[460px]">
    <img src="${post.imageUrl}" alt="${post.imageAlt || post.title}" class="w-full h-full object-cover" width="800" height="450" />
  </div>
  `
      : ""
  }

  <!-- Body Content -->
  <div class="prose prose-slate prose-lg max-w-none text-slate-700 leading-relaxed space-y-6">
    ${post.contentHtml}
  </div>

  <!-- FAQs Section -->
  ${
    post.faqs && post.faqs.length > 0
      ? `
  <section class="mt-12 pt-8 border-t border-slate-200">
    <h2 class="text-2xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
    <div class="space-y-3">
      ${post.faqs
        .map(
          (faq) => `
        <details class="bg-slate-50 border border-slate-200 rounded-xl p-4 transition open:ring-1 open:ring-indigo-500">
          <summary class="font-bold text-sm text-slate-900 cursor-pointer select-none">${faq.question}</summary>
          <p class="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed pt-2 border-t border-slate-200">${faq.answer}</p>
        </details>
      `
        )
        .join("")}
    </div>
  </section>
  `
      : ""
  }

  <!-- E-E-A-T Author Card -->
  <div class="mt-12 p-6 rounded-2xl bg-slate-50 border border-slate-200 flex items-start space-x-4">
    <div class="w-12 h-12 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-lg shrink-0">
      ${authorName.charAt(0)}
    </div>
    <div class="space-y-1">
      <div class="text-xs font-bold uppercase tracking-wider text-slate-400">Written by</div>
      <h3 class="text-base font-bold text-slate-900">${authorName}</h3>
      <p class="text-xs text-slate-600 leading-relaxed">${authorBio}</p>
    </div>
  </div>

  <!-- Related Posts -->
  ${
    related.length > 0
      ? `
  <section class="mt-12 pt-8 border-t border-slate-200">
    <h3 class="text-xl font-bold text-slate-900 mb-4">Related Articles</h3>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      ${related
        .map(
          (rel) => `
        <a href="${rel.slug}.html" class="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 transition bg-white space-y-2 block">
          <h4 class="text-sm font-bold text-slate-900 line-clamp-2 hover:text-indigo-600">${rel.title}</h4>
          <p class="text-xs text-slate-500 line-clamp-2 leading-relaxed">${rel.metaDescription}</p>
        </a>
      `
        )
        .join("")}
    </div>
  </section>
  `
      : ""
  }

  <!-- Call to Action Banner -->
  <div class="mt-12 p-8 rounded-2xl bg-indigo-600 text-white text-center space-y-4">
    <h2 class="text-2xl font-bold">Have Questions or Need Professional Help?</h2>
    <p class="text-indigo-100 text-xs sm:text-sm max-w-xl mx-auto">
      Contact our team today for honest estimates, fast response times, and experienced local specialists.
    </p>
    <div class="pt-2 flex flex-wrap justify-center gap-3">
      <a href="tel:${site.phone.replace(/[^\d+]/g, "")}" class="px-6 py-2.5 rounded-xl font-bold text-indigo-700 bg-white hover:bg-slate-100 transition shadow-sm text-sm">
        Call ${site.phone}
      </a>
      <a href="../contact.html" class="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-800 hover:bg-indigo-900 transition text-sm">
        Request Appointment
      </a>
    </div>
  </div>
</article>
  `.trim();
}

/**
 * Builds BlogPosting JSON-LD Schema for Blog Post
 */
export function buildBlogPostSchema(
  post: BlogPostData,
  site: SiteInfoJSON,
  domain: string
): string {
  const schemaList: any[] = [];

  // BlogPosting Schema
  schemaList.push({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.metaDescription,
    datePublished: post.datePublished,
    dateModified: post.dateModified,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://${domain}/blog/${post.slug}.html`,
    },
    author: {
      "@type": "Person",
      name: site.ownerName || post.authorName || site.businessName,
    },
    publisher: {
      "@type": "Organization",
      name: site.businessName,
      logo: {
        "@type": "ImageObject",
        url: (site as any).logo || (site as any).logoUrl || `https://${domain}/images/logo.png`,
      },
    },
    image: post.imageUrl || undefined,
  });

  // FAQPage Schema
  if (post.faqs && post.faqs.length > 0) {
    schemaList.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: post.faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: f.answer,
        },
      })),
    });
  }

  return schemaList
    .map((s) => `<script type="application/ld+json">\n${JSON.stringify(s, null, 2)}\n</script>`)
    .join("\n");
}

/**
 * Renders the Blog Index Directory page (blog.html)
 */
export function renderBlogIndexHtml(
  posts: BlogPostData[],
  site: SiteInfoJSON,
  theme: Theme
): string {
  return `
<!-- Breadcrumbs -->
<nav aria-label="Breadcrumb" class="py-3 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-xs text-slate-500">
  <ol class="flex items-center space-x-2">
    <li><a href="index.html" class="hover:text-indigo-600 font-medium">Home</a></li>
    <li><span class="text-slate-400">/</span></li>
    <li class="font-semibold text-slate-900" aria-current="page">Blog &amp; Homeowner Tips</li>
  </ol>
</nav>

<!-- Hero Section -->
<section class="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-4">
  <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700 mx-auto">
    <span>💡 Homeowner Maintenance &amp; Advice</span>
  </div>
  <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
    Expert Tips, Guides &amp; Insights
  </h1>
  <p class="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed">
    Practical knowledge to help you maintain your home, prevent costly breakdowns, and choose the right solutions.
  </p>
</section>

<!-- Blog Posts Grid -->
<section class="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
  ${
    posts.length === 0
      ? `<div class="text-center py-12 bg-slate-50 border border-slate-200 rounded-2xl p-8 text-slate-600">
           <p class="text-sm font-semibold">New articles are currently being prepared.</p>
         </div>`
      : `
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    ${posts
      .map(
        (p) => `
      <article class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between group">
        <div>
          ${
            p.imageUrl
              ? `<div class="h-48 overflow-hidden bg-slate-100">
                   <img src="${p.imageUrl}" alt="${p.imageAlt || p.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" loading="lazy" />
                 </div>`
              : ""
          }
          <div class="p-6 space-y-3">
            <div class="flex items-center space-x-2 text-[11px] font-semibold text-slate-400">
              <span>${p.datePublished}</span>
              <span>•</span>
              <span>${p.wordCount} words</span>
            </div>
            <h2 class="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition leading-snug">
              <a href="blog/${p.slug}.html">${p.title}</a>
            </h2>
            <p class="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
              ${p.metaDescription}
            </p>
          </div>
        </div>
        <div class="p-6 pt-0 border-t border-slate-50 mt-4 flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500">By ${p.authorName}</span>
          <a href="blog/${p.slug}.html" class="text-xs font-bold text-indigo-600 hover:text-indigo-800">
            Read Guide →
          </a>
        </div>
      </article>
    `
      )
      .join("")}
  </div>
  `
  }
</section>
  `.trim();
}
