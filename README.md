# 🦊 AltoFox — Local Home Service Static Website Builder

> Build high-converting, SEO-optimized static websites for local home services & contractors using ChatGPT, Google Gemini, Claude, Groq, or any Custom API model — preview instantly & download in 1 click (.ZIP).

![Next.js 14](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-SQLite-2D3748?style=flat-square&logo=prisma)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## 🌟 Key Features

- **Local Home Service & Geo-Targeting**: Generate websites tailored to local trade niches (Plumbing, Electrical, HVAC, Roofing, Landscaping, Pest Control) in any city or state.
- **Local SEO & Schema.org**: Every generated website automatically embeds **Schema.org `LocalBusiness` JSON-LD** markup, click-to-call mobile buttons, service areas list, and localized reviews for Google Maps & search ranking.
- **Multi-Model & Custom API Engine**:
  - Google Gemini (Gemini 1.5 Pro & Flash)
  - OpenAI ChatGPT (GPT-4o & GPT-4o-mini)
  - Anthropic Claude (Sonnet 3.5 & Haiku)
  - Groq (Llama 3.3 70B & 3.1 8B)
  - **Custom API**: Connect any model via OpenAI-compatible Base URL (Ollama, OpenRouter, Together AI, LM Studio, DeepSeek, vLLM).
- **Zero-Build Static Output**: Outputs 100% pure static files (`index.html`, `styles.css`, `script.js`) with responsive layouts, working mobile drawer, FAQ accordion, and interactive quote forms.
- **Live Preview & 1-Click ZIP Download**: Test desktop and mobile viewport previews immediately and download the complete folder in a single `.zip` file ready to double-click and run or deploy for free.
- **AES-256-GCM Key Encryption**: Your API keys are encrypted at rest in local SQLite and never leave your machine.

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

Generate Prisma client & initialize SQLite database:

```bash
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database & ORM**: SQLite + Prisma Client
- **Packaging**: JSZip
- **Icons**: Lucide React
- **Cryptography**: AES-256-GCM (Node.js crypto)

---

## 📄 License

MIT License. Free to use for personal and commercial projects.
