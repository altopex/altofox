import { BRAND } from "@/config/brand";

export interface PricingPlan {
  id: "starter" | "agency" | "unlimited";
  name: string;
  price: number;
  period: string; // e.g. "one-time"
  websiteLimit: number;
  pricePerWebsite: string;
  description: string;
  badge?: string;
  popular?: boolean;
  ctaText: string;
  features: string[];
}

export const PLANS: Record<"starter" | "agency", PricingPlan> = {
  starter: {
    id: "starter",
    name: "Starter",
    price: 99,
    period: "one-time",
    websiteLimit: 5,
    pricePerWebsite: "$19.80 per website",
    description: "Ideal for solo operators, local trades, and contractors building targeted lead generation sites.",
    ctaText: "Get started with Starter",
    features: [
      "Up to 5 static websites",
      "AI-written unique content (Gemini / OpenAI)",
      "Automated location & service area pages",
      "Local SEO optimization & Schema.org markup",
      "High-res royalty-free stock photos integrated",
      "Lightning-fast, mobile-ready static pages",
      "Visual page editor & complete version history",
      "Google Search Console optimization cycles",
      "Keyword rank tracking & search performance",
      "Instant ZIP download & self-hosting ready",
      "Community & email support",
    ],
  },
  agency: {
    id: "agency",
    name: "Agency",
    price: 499,
    period: "one-time",
    websiteLimit: 30,
    pricePerWebsite: "$16.63 per website",
    description: "Designed for digital marketing agencies, SEO professionals, and multi-location business networks.",
    badge: "Best value",
    popular: true,
    ctaText: "Get started with Agency",
    features: [
      "Up to 30 static websites",
      "AI-written unique content (Gemini / OpenAI)",
      "Automated location & service area pages",
      "Local SEO optimization & Schema.org markup",
      "High-res royalty-free stock photos integrated",
      "Lightning-fast, mobile-ready static pages",
      "Visual page editor & complete version history",
      "Google Search Console optimization cycles",
      "Keyword rank tracking & search performance",
      "Instant ZIP download & self-hosting ready",
      "Unlimited page revisions & instant exports",
      "Priority customer & technical support",
    ],
  },
};

export interface PlanComparisonRow {
  feature: string;
  category: string;
  starter: string | boolean;
  agency: string | boolean;
  tooltip?: string;
}

export const PLAN_COMPARISON: PlanComparisonRow[] = [
  {
    feature: "Website Allowance",
    category: "Capacity",
    starter: "5 websites",
    agency: "30 websites",
  },
  {
    feature: "Effective Cost per Website",
    category: "Capacity",
    starter: "$19.80 / site",
    agency: "$16.63 / site",
  },
  {
    feature: "Billing Structure",
    category: "Capacity",
    starter: "One-time payment",
    agency: "One-time payment",
  },
  {
    feature: "AI Content Generation",
    category: "Website Builder",
    starter: true,
    agency: true,
    tooltip: "Unique AI generation powered by OpenAI, Claude, and Google Gemini.",
  },
  {
    feature: "Automated Location Pages",
    category: "Website Builder",
    starter: true,
    agency: true,
    tooltip: "Generates geo-targeted landing pages for every surrounding city/suburb.",
  },
  {
    feature: "Local SEO & Schema.org Markup",
    category: "Website Builder",
    starter: true,
    agency: true,
  },
  {
    feature: "Royalty-free Stock Photos",
    category: "Website Builder",
    starter: true,
    agency: true,
    tooltip: "Automatic niche-relevant image sourcing from Bing, Pexels, and Pixabay.",
  },
  {
    feature: "Mobile-Responsive HTML/Tailwind",
    category: "Website Builder",
    starter: true,
    agency: true,
  },
  {
    feature: "Visual Page Editor & Versions",
    category: "Management",
    starter: true,
    agency: true,
  },
  {
    feature: "Google Search Console Cycles",
    category: "Management",
    starter: true,
    agency: true,
  },
  {
    feature: "Keyword Rank Tracking",
    category: "Management",
    starter: true,
    agency: true,
  },
  {
    feature: "ZIP Code / Static Asset Export",
    category: "Management",
    starter: true,
    agency: true,
  },
  {
    feature: "Support Level",
    category: "Support",
    starter: "Standard Email Support",
    agency: "Priority Agency Support",
  },
];

export interface PricingFAQ {
  question: string;
  answer: string;
}

export const PRICING_FAQS: PricingFAQ[] = [
  {
    question: "What counts as a website toward my limit?",
    answer:
      "A website is defined as one complete generated domain project, which includes all of its homepage sections, multi-city location pages, service landing pages, schema markup, and blog posts. Generating revisions, editing content, or downloading updated versions of that project never counts as an additional site.",
  },
  {
    question: "Can I upgrade from Starter to Agency later?",
    answer:
      "Yes! You can upgrade your workspace at any time. When upgrading, you immediately expand your capacity to 30 websites while retaining all previously created websites, version histories, and SEO tracking logs.",
  },
  {
    question: "What happens when I reach my website limit?",
    answer:
      "Once you reach your plan limit (5 for Starter, 30 for Agency), existing websites remain fully functional, editable, and downloadable. To generate new static websites, you can easily upgrade to Agency or contact team support for custom enterprise limits.",
  },
  {
    question: "Are there any recurring subscription fees or hidden costs?",
    answer:
      "No. Both the Starter ($99) and Agency ($499) plans are one-time payments for permanent lifetime access to create your allotted websites. You connect your own AI provider keys (Gemini, OpenAI, Groq, or OpenRouter), meaning you pay near zero cents per generation directly to the provider without markup.",
  },
  {
    question: "What is your refund policy?",
    answer:
      `We want you to be completely satisfied with ${BRAND.name}. We offer a 14-day money-back guarantee if the platform does not meet your website generation needs. Please review our Terms of Service for complete details on claim procedures.`,
  },
];

export function getPlanConfig(planId?: string | null): PricingPlan {
  if (planId === "agency") return PLANS.agency;
  if (planId === "starter") return PLANS.starter;
  // Default to starter
  return PLANS.starter;
}

export function getWebsiteLimitForPlan(planId?: string | null, role?: string): number {
  if (role === "owner") return 999999;
  if (planId === "unlimited") return 999999;
  if (planId === "agency") return 30;
  if (planId === "starter") return 5;
  // Default legacy/team limit
  return 999999;
}
