# 📍 RankLocal — AI Static Website Builder for Local SEO

> Build high-converting, SEO-optimized static websites for local home services & contractors using Google Gemini, OpenAI, Claude, Groq, or OpenRouter — with 20 trade niche packs, multi-suburb location pages, Schema.org JSON-LD, and zero WordPress bloat.

**Official Domain:** [https://ranklocal.site](https://ranklocal.site)

![Next.js 14](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3ECF8E?style=flat-square&logo=supabase)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## 🌟 Key Features

- **20 Trade Niche Packs**: Generate websites tailored to local trade niches (Plumbing, Electrical, HVAC, Roofing, Landscaping, Pest Control, and more) in any city or state.
- **Multi-Suburb Location Pages**: Automated service-area expansion with unique contextual content and neighborhood landmark references to prevent duplicate content penalties.
- **Local SEO & Schema.org**: Every generated website automatically embeds **Schema.org `LocalBusiness` JSON-LD** markup, click-to-call mobile buttons, service areas list, and localized reviews for Google Maps & search ranking.
- **Multi-Model AI Engine**: Google Gemini (1.5 Pro & Flash), OpenAI (GPT-4o), Anthropic Claude (Sonnet 3.5), Groq, and OpenRouter.
- **Zero-Build Static Output**: Outputs 100% pure static files (`index.html`, `styles.css`, `script.js`) with responsive layouts, working mobile drawer, FAQ accordion, and interactive quote forms.
- **Live Preview & 1-Click ZIP Download**: Test desktop and mobile viewport previews immediately and download the complete folder in a single `.zip` file ready to double-click and run or deploy for free.
- **Private Team Workspace & Access Control**: Owner/Editor role permissions, real-time presence indicators, audit activity feed, and user approval workflows.

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/altopex/altofox.git
cd altofox
npm install
```

### 2. Set Up Environment

Create your local `.env` file:

```bash
cp .env.example .env
```

Ensure `NEXT_PUBLIC_SITE_URL="https://ranklocal.site"` is set.

Generate Prisma client & initialize SQLite database:

```bash
npm run prisma:generate
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the landing page and dashboard.

---

## 🌐 Production Domain & Deployment

- **Custom Domain:** `ranklocal.site`
- **Support:** `support@ranklocal.site`
- **Hosting:** Vercel (Edge-optimized Next.js App Router)
