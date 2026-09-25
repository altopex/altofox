"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Globe,
  Zap,
  Shield,
  Layers,
  Search,
  TrendingUp,
  MapPin,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Code,
  FileCheck,
  Server,
  Star,
  Users,
  Check,
  X,
  Laptop,
  Flame,
  Wrench,
  Fan,
  Home as HomeIcon,
  Trees,
  Menu,
} from "lucide-react";

// Interactive Niche showcase presets for the hero mockup
const HERO_NICHES = [
  {
    id: "plumber",
    name: "Plumbing",
    icon: Wrench,
    headline: "24/7 Emergency Plumbing & Drain Cleaning in Austin, TX",
    badge: "PlumberSchema · 14 Location Pages",
    city: "Austin, TX + 8 Suburbs",
    rating: "4.9 ★ (184 Reviews)",
    usp: "Fast 45-Min Emergency Dispatch · Upfront Pricing",
  },
  {
    id: "hvac",
    name: "HVAC & Heating",
    icon: Fan,
    headline: "AC Repair & Furnace Installation in Denver, CO",
    badge: "HVACBusinessSchema · 12 Location Pages",
    city: "Denver, CO + 6 Suburbs",
    rating: "5.0 ★ (210 Reviews)",
    usp: "Same-Day Service · Certified NATE Technicians",
  },
  {
    id: "roofing",
    name: "Roofing",
    icon: HomeIcon,
    headline: "Hail Damage & Roof Replacement in Dallas, TX",
    badge: "RoofingContractor · 16 Location Pages",
    city: "Dallas, TX + 10 Suburbs",
    rating: "4.8 ★ (142 Reviews)",
    usp: "Free Roof Inspections · Lifetime Shingle Warranties",
  },
  {
    id: "tree-service",
    name: "Tree Service",
    icon: Trees,
    headline: "Tree Trimming & 24/7 Storm Removal in Charlotte, NC",
    badge: "TreeServiceSchema · 10 Location Pages",
    city: "Charlotte, NC + 5 Suburbs",
    rating: "4.9 ★ (95 Reviews)",
    usp: "Licensed Arborists · Crane-Assisted Removals",
  },
];

const FAQS = [
  {
    q: "Why does AltoFox generate static HTML instead of WordPress or Webflow?",
    a: "Static HTML pages load in under 200 milliseconds, require zero database queries, and cannot be hacked through vulnerable plugins. Google rewards high Core Web Vitals and lightning-fast mobile speeds with higher local map and organic rankings.",
  },
  {
    q: "How does AltoFox prevent duplicate content penalties across multiple service areas?",
    a: "AltoFox avoids spammy keyword stuffing. Each location and service-location page generates unique, contextual local copy—including specific local neighborhood landmarks, regional climate factors, tailored service descriptions, and localized Schema.org data.",
  },
  {
    q: "Where can I host the generated static websites?",
    a: "Anywhere! Because the output is zero-build static HTML, CSS, JavaScript, and images, you can export a ZIP and host for free or pennies on Cloudflare Pages, Netlify, Vercel, AWS S3, GitHub Pages, or standard cPanel Apache/Nginx servers.",
  },
  {
    q: "Can I optimize existing websites month after month?",
    a: "Yes. AltoFox includes a Search Console Optimization helper. Simply drop your Google Search Console performance export into the project dashboard, and AltoFox will identify low-CTR queries and high-impression pages, giving you actionable 1-click SEO refinements.",
  },
  {
    q: "Can my team collaborate on client websites?",
    a: "Yes. AltoFox has built-in team workspace management with role-based access control (Owner, Editor), real-time presence indicators, an audit activity feed, and approval controls.",
  },
];

export default function MarketingLandingPage() {
  const { user, isApproved, loading } = useAuth();
  const [activeNicheIndex, setActiveNicheIndex] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeNiche = HERO_NICHES[activeNicheIndex];

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. STICKY TOPBAR */}
      <header className="sticky top-0 z-50 w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl font-bold tracking-tight text-white">
                Alto<span className="text-indigo-400">Fox</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                SEO Studio
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#niches" className="hover:text-white transition">20 Niche Packs</a>
            <a href="#how-it-works" className="hover:text-white transition">How It Works</a>
            <a href="#comparison" className="hover:text-white transition">Why AltoFox</a>
            <Link href="/pricing" className="text-indigo-400 font-bold hover:text-indigo-300 transition">Pricing</Link>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {loading ? (
              <div className="w-24 h-8 bg-slate-800 animate-pulse rounded-xl" />
            ) : isApproved ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-500/25"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : user ? (
              <Link
                href="/pending"
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-md"
              >
                <span>Check Approval</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold transition shadow-md shadow-indigo-500/25"
                >
                  <span>Get Access</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-3 pb-6 space-y-3">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-300 hover:text-white py-2"
            >
              Features
            </a>
            <a
              href="#niches"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-300 hover:text-white py-2"
            >
              20 Niche Packs
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-300 hover:text-white py-2"
            >
              How It Works
            </a>
            <a
              href="#comparison"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-300 hover:text-white py-2"
            >
              Why AltoFox
            </a>
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-bold text-indigo-400 py-2"
            >
              Pricing
            </Link>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-300 hover:text-white py-2"
            >
              FAQ
            </a>

            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
              {isApproved ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-xl border border-slate-700 text-slate-200 font-semibold text-xs"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-600/30"
                  >
                    Get Access
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-20 pb-24 overflow-hidden border-b border-slate-800">
        {/* Glow Gradients */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Pill Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold mb-6 animate-in fade-in">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Turnkey Local SEO Architecture · Zero WordPress Bloat</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
            Build Local Service Websites That{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-300 to-amber-300">
              Actually Rank on Google.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mt-6 leading-relaxed">
            AltoFox creates blazing-fast, 100% static HTML websites engineered to dominate local search. Complete with 20 trade niche packs, multi-suburb location pages, Schema.org markup, and Search Console optimization cycles.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-8">
            <Link
              href={isApproved ? "/dashboard" : "/signup"}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5"
            >
              <span>{isApproved ? "Launch Website Builder" : "Request Workspace Access"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#demo"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition border border-slate-700"
            >
              <span>Explore Interactive Demo</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </a>
          </div>

          {/* Metric Chips */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mt-14 text-left">
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-xs">
              <div className="text-xl font-black text-indigo-400">20</div>
              <div className="text-xs text-slate-400 font-medium">Trade Niche Packs</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-xs">
              <div className="text-xl font-black text-emerald-400">100%</div>
              <div className="text-xs text-slate-400 font-medium">Zero-Build Static HTML</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-xs">
              <div className="text-xl font-black text-amber-400">&lt;200ms</div>
              <div className="text-xs text-slate-400 font-medium">Global CDN PageSpeed</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-xs">
              <div className="text-xl font-black text-cyan-400">Schema.org</div>
              <div className="text-xs text-slate-400 font-medium">Built-in Local SEO JSON-LD</div>
            </div>
          </div>
        </div>

        {/* 3. INTERACTIVE HERO DEMO SHOWCASE */}
        <div id="demo" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-3 sm:p-5 shadow-2xl overflow-hidden">
            {/* Window Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-mono text-slate-400 ml-2">altofox-preview.local</span>
              </div>

              {/* Trade Switcher Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto">
                {HERO_NICHES.map((niche, idx) => {
                  const Icon = niche.icon;
                  const isCurrent = activeNicheIndex === idx;
                  return (
                    <button
                      key={niche.id}
                      type="button"
                      onClick={() => setActiveNicheIndex(idx)}
                      className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                        isCurrent
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{niche.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Simulated Live Website Preview */}
            <div className="bg-white text-slate-900 rounded-2xl overflow-hidden mt-3 shadow-inner">
              {/* Site Header */}
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between text-xs border-b border-slate-800">
                <div className="flex items-center space-x-2 font-bold text-sm">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span>{activeNiche.name} Pro Experts</span>
                </div>
                <div className="hidden sm:flex items-center space-x-4 text-xs font-medium text-slate-300">
                  <span>Home</span>
                  <span>Services</span>
                  <span>Locations ({activeNiche.city.split("+")[0]})</span>
                  <span>Reviews</span>
                  <span className="px-3 py-1 bg-indigo-600 text-white rounded-lg font-bold">
                    Call (555) 234-5678
                  </span>
                </div>
              </div>

              {/* Site Hero Banner */}
              <div className="p-8 sm:p-12 bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 text-center space-y-4">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{activeNiche.badge}</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight max-w-2xl mx-auto">
                  {activeNiche.headline}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto font-medium">
                  {activeNiche.usp} · Serving {activeNiche.city}
                </p>

                <div className="flex items-center justify-center gap-2 pt-2">
                  <span className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md">
                    Schedule Free Estimate
                  </span>
                  <span className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs bg-white">
                    View 14 Service Suburbs
                  </span>
                </div>

                <div className="pt-4 flex items-center justify-center space-x-4 text-xs text-slate-500 font-medium">
                  <span>{activeNiche.rating}</span>
                  <span>·</span>
                  <span>100% Guaranteed Workmanship</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CORE FEATURES GRID */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
            Engineered For Local Service Dominance
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2">
            Everything your business needs to own local search.
          </h2>
          <p className="text-sm text-slate-400 mt-3">
            Generic website builders generate bloated code that ignores local search signals. AltoFox is built specifically to address Google&apos;s local search ranking factors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-800/40 border border-slate-800 hover:border-indigo-500/40 transition group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <Flame className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">20 Turnkey Trade Packs</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real industry terminology, emergency dispatch copy, licensing disclaimers, and service lists for Plumbers, Electricians, Roofers, HVAC, Landscapers, and more.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-800/40 border border-slate-800 hover:border-indigo-500/40 transition group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Multi-City Location Pages</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Target your main city and surrounding suburbs with dedicated location and service-location landing pages. No duplicate content penalties.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-800/40 border border-slate-800 hover:border-indigo-500/40 transition group">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <FileCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Schema.org Local SEO</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automatically generates rich JSON-LD structured data for LocalBusiness, Service, FAQPage, and BreadcrumbList to capture Google Rich Snippets.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-800/40 border border-slate-800 hover:border-indigo-500/40 transition group">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Search Console Cycles</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload Search Console performance exports to discover low-CTR queries and high-impression pages. Optimize pages in 1 click and track ranking lifts.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-800/40 border border-slate-800 hover:border-indigo-500/40 transition group">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <Server className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">100% Zero-Build Static Export</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Export pure static HTML, CSS, JavaScript, and WebP images in one clean ZIP. Host anywhere without database maintenance, PHP updates, or plugin crashes.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-800/40 border border-slate-800 hover:border-indigo-500/40 transition group">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Team Governance &amp; History</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Private workspace authentication with role-based access control (Owner, Editor), version history, instant backups, and an activity audit log.
            </p>
          </div>
        </div>
      </section>

      {/* 5. NICHE PACKS SHOWCASE */}
      <section id="niches" className="py-20 bg-slate-950 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
            Pre-Trained On Real Trades
          </span>
          <h2 className="text-3xl font-black text-white tracking-tight mt-2">
            20 Turnkey Trade Niche Packs
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto mt-2">
            Don&apos;t start from scratch. Each niche pack comes pre-loaded with curated services, FAQs, emergency copy, and localized trade keywords.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mt-10 text-xs font-semibold">
            {[
              "Plumber", "Electrician", "HVAC / Heating", "Roofing", "Tree Service",
              "Landscaping", "Pest Control", "House Cleaning", "Pressure Washing", "Painting",
              "Handyman", "General Contractor", "Locksmith", "Garage Doors", "Moving Co",
              "Pool Service", "Appliance Repair", "Water Damage", "Junk Removal", "Carpet Cleaning"
            ].map((trade) => (
              <div
                key={trade}
                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-indigo-500/40 transition flex items-center justify-center text-center"
              >
                <span>{trade}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. COMPARISON: ALTOFOX VS GENERIC BUILDERS */}
      <section id="comparison" className="py-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
            The Smart Local Choice
          </span>
          <h2 className="text-3xl font-black text-white tracking-tight mt-2">
            AltoFox vs. Traditional Builders
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Why local contractors and agencies choose AltoFox over slow, vulnerable WordPress stacks.
          </p>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Capability</th>
                  <th className="py-4 px-6 text-indigo-400 bg-indigo-950/40">AltoFox</th>
                  <th className="py-4 px-6">WordPress + Elementor</th>
                  <th className="py-4 px-6">Generic AI Builders</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                <tr>
                  <td className="py-4 px-6 font-semibold text-white">Multi-City Suburb Pages</td>
                  <td className="py-4 px-6 bg-indigo-950/20 font-bold text-emerald-400">Automated &amp; Unique</td>
                  <td className="py-4 px-6 text-slate-500">Manual copy/paste plugin bloat</td>
                  <td className="py-4 px-6 text-slate-500">1 generic city only</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-white">Core Web Vitals &amp; PageSpeed</td>
                  <td className="py-4 px-6 bg-indigo-950/20 font-bold text-emerald-400">95–100 / 100 Mobile</td>
                  <td className="py-4 px-6 text-rose-400">30–60 (Slow JS &amp; CSS)</td>
                  <td className="py-4 px-6 text-amber-400">60–80 Average</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-white">Local Schema.org JSON-LD</td>
                  <td className="py-4 px-6 bg-indigo-950/20 font-bold text-emerald-400">Native &amp; Complete</td>
                  <td className="py-4 px-6 text-slate-500">Requires \$99/yr SEO plugin</td>
                  <td className="py-4 px-6 text-slate-500">Basic or None</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-white">GSC Optimization Cycles</td>
                  <td className="py-4 px-6 bg-indigo-950/20 font-bold text-emerald-400">Built-in 1-Click Optimizer</td>
                  <td className="py-4 px-6 text-slate-500">No integration</td>
                  <td className="py-4 px-6 text-slate-500">No integration</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-white">Hosting Costs &amp; Maintenance</td>
                  <td className="py-4 px-6 bg-indigo-950/20 font-bold text-emerald-400">\$0 / Zero Maintenance</td>
                  <td className="py-4 px-6 text-rose-400">\$25–\$50/mo + constant updates</td>
                  <td className="py-4 px-6 text-amber-400">\$20–\$40/mo platform lock-in</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-white">Static ZIP Code Export</td>
                  <td className="py-4 px-6 bg-indigo-950/20 font-bold text-emerald-400">100% Owned &amp; Portable</td>
                  <td className="py-4 px-6 text-slate-500">Difficult migration</td>
                  <td className="py-4 px-6 text-rose-400">Locked in proprietary cloud</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 7. HOW IT WORKS */}
      <section id="how-it-works" className="py-20 bg-slate-950 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
              Simple 3-Step Process
            </span>
            <h2 className="text-3xl font-black text-white tracking-tight mt-2">
              From zero to ranking in minutes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 relative">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 font-black text-sm flex items-center justify-center text-white mb-4">
                1
              </div>
              <h3 className="text-base font-bold text-white mb-2">Select Trade &amp; Service Cities</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Choose from 20 trade packs, specify your primary city, and pick all surrounding suburbs you serve.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 relative">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 font-black text-sm flex items-center justify-center text-white mb-4">
                2
              </div>
              <h3 className="text-base font-bold text-white mb-2">AI Generates Local Architecture</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                AltoFox generates static pages for each service and suburb with Schema.org markup, localized FAQs, and responsive themes.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 relative">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 font-black text-sm flex items-center justify-center text-white mb-4">
                3
              </div>
              <h3 className="text-base font-bold text-white mb-2">Export &amp; Optimize with GSC</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Download the site ZIP to host anywhere. Re-upload Search Console exports each month to systematically lift local rankings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ ACCORDION */}
      <section id="faq" className="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
            Common Questions
          </span>
          <h2 className="text-3xl font-black text-white tracking-tight mt-2">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3.5">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={faq.q}
                className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left font-bold text-sm text-white flex items-center justify-between gap-4"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      isOpen ? "rotate-180 text-indigo-400" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-slate-400 leading-relaxed border-t border-slate-900 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 9. BOTTOM CALL TO ACTION BANNER */}
      <section className="py-20 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 border-t border-indigo-500/20 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 relative z-10 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Ready to rank in every neighborhood you serve?
          </h2>
          <p className="text-sm text-indigo-200/80 max-w-xl mx-auto leading-relaxed">
            Stop losing local search leads to generic WordPress sites. Build lightning-fast, multi-city websites designed to convert.
          </p>

          <div className="pt-2">
            <Link
              href={isApproved ? "/dashboard" : "/signup"}
              className="inline-flex items-center space-x-2 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition shadow-xl shadow-indigo-600/30 hover:scale-105"
            >
              <span>{isApproved ? "Open Team Dashboard" : "Request Workspace Access"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer className="py-12 bg-slate-950 border-t border-slate-800 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-white tracking-tight">
              AltoFox Website Builder
            </span>
          </div>

          <div className="flex items-center space-x-6 text-slate-400">
            <Link href="/pricing" className="text-indigo-400 font-semibold hover:text-white transition">Pricing</Link>
            <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
            <Link href="/login" className="hover:text-white transition">Sign In</Link>
            <Link href="/signup" className="hover:text-white transition">Create Account</Link>
          </div>

          <div className="text-slate-500 text-[11px]">
            &copy; {new Date().getFullYear()} AltoFox. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
