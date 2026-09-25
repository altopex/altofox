"use client";

export const dynamic = "force-dynamic";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { PLANS, PLAN_COMPARISON, PRICING_FAQS } from "@/config/plans";
import {
  Sparkles,
  Check,
  ArrowRight,
  ChevronDown,
  HelpCircle,
  CreditCard,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Lock,
  Layers,
  Globe,
  Menu,
  X,
} from "lucide-react";

export default function PricingPage() {
  const { user, isApproved, loading } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const starterPlan = PLANS.starter;
  const agencyPlan = PLANS.agency;

  // JSON-LD Structured Data for Product & Offers
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "AltoFox AI Static Website Builder",
    description:
      "AI-powered static website builder with local SEO, multi-city location pages, and automated Schema.org markup.",
    brand: {
      "@type": "Brand",
      name: "AltoFox",
    },
    offers: [
      {
        "@type": "Offer",
        name: "Starter Plan",
        price: "99.00",
        priceCurrency: "USD",
        priceValidUntil: "2027-12-31",
        availability: "https://schema.org/InStock",
        url: "https://altofox.com/pricing",
        description: "Up to 5 static websites, one-time payment ($19.80 per website)",
      },
      {
        "@type": "Offer",
        name: "Agency Plan",
        price: "499.00",
        priceCurrency: "USD",
        priceValidUntil: "2027-12-31",
        availability: "https://schema.org/InStock",
        url: "https://altofox.com/pricing",
        description: "Up to 30 static websites, one-time payment ($16.63 per website)",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-indigo-500 selection:text-white">
      {/* JSON-LD Script for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

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
            <Link href="/" className="hover:text-white transition">Home</Link>
            <Link href="/#features" className="hover:text-white transition">Features</Link>
            <Link href="/#niches" className="hover:text-white transition">20 Niche Packs</Link>
            <Link href="/pricing" className="text-indigo-400 font-bold hover:text-indigo-300 transition">Pricing</Link>
            <Link href="/#faq" className="hover:text-white transition">FAQ</Link>
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

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-3 pb-6 space-y-3">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-300 hover:text-white py-2"
            >
              Home
            </Link>
            <Link
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-300 hover:text-white py-2"
            >
              Features
            </Link>
            <Link
              href="/#niches"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-300 hover:text-white py-2"
            >
              20 Niche Packs
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-bold text-indigo-400 py-2"
            >
              Pricing
            </Link>
            <Link
              href="/#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-300 hover:text-white py-2"
            >
              FAQ
            </Link>

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

      {/* 2. HERO HEADER SECTION */}
      <section className="pt-16 pb-12 sm:pt-24 sm:pb-16 text-center px-4 relative overflow-hidden">
        {/* Background Radial Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span>Transparent One-Time Pricing · No Monthly Retainers</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
            Simple pricing for local websites that rank
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Pay once, build lifetime high-converting static websites with automated local SEO, multi-city location pages, and instant ZIP exports.
          </p>
        </div>
      </section>

      {/* 3. PLAN CARDS SECTION */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 items-stretch">
          {/* Card 1: Starter */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 sm:p-10 flex flex-col justify-between hover:border-slate-700 transition shadow-xl relative backdrop-blur-xs">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">{starterPlan.name}</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {starterPlan.description}
                </p>
              </div>

              {/* Price & Calculation */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl sm:text-6xl font-black text-white tracking-tight">${starterPlan.price}</span>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">one-time</span>
                </div>
                <div className="inline-block mt-2 px-3 py-1 rounded-full bg-slate-800 text-indigo-300 text-xs font-bold border border-slate-700/80">
                  {starterPlan.pricePerWebsite}
                </div>
              </div>

              {/* Limit Pill */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300">
                <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Up to <strong>{starterPlan.websiteLimit} complete static websites</strong> with all pages &amp; schemas</span>
              </div>

              {/* Features List */}
              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Everything included:</p>
                <ul className="space-y-2.5">
                  {starterPlan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-8 mt-8 border-t border-slate-800">
              <Link
                href={isApproved ? "/dashboard" : "/signup?plan=starter"}
                className="w-full py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm text-center transition flex items-center justify-center gap-2 border border-slate-700 hover:border-slate-600 shadow-sm"
              >
                <span>{isApproved ? "Go to Dashboard" : starterPlan.ctaText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 2: Agency (Highlighted, Best Value) */}
          <div className="bg-gradient-to-b from-indigo-950/70 via-slate-900 to-slate-900 border-2 border-indigo-500 rounded-3xl p-8 sm:p-10 flex flex-col justify-between transition shadow-2xl shadow-indigo-500/15 relative backdrop-blur-xs ring-1 ring-indigo-500/30">
            {/* Best Value Badge */}
            <div className="absolute -top-3.5 right-8">
              <span className="px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-indigo-500/40">
                {agencyPlan.badge}
              </span>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white tracking-tight">{agencyPlan.name}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Agency Scale
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {agencyPlan.description}
                </p>
              </div>

              {/* Price & Calculation */}
              <div className="pt-2 border-t border-indigo-500/20">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl sm:text-6xl font-black text-white tracking-tight">${agencyPlan.price}</span>
                  <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">one-time</span>
                </div>
                <div className="inline-block mt-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/40">
                  {agencyPlan.pricePerWebsite} (Lowest Cost / Site)
                </div>
              </div>

              {/* Limit Pill */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-xs text-indigo-200">
                <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Up to <strong>{agencyPlan.websiteLimit} complete static websites</strong> with priority SEO tools</span>
              </div>

              {/* Features List */}
              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold text-slate-200 uppercase tracking-wider">All features &amp; Agency perks:</p>
                <ul className="space-y-2.5">
                  {agencyPlan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-slate-200">
                      <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span className={i >= agencyPlan.features.length - 2 ? "font-bold text-indigo-300" : ""}>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-8 mt-8 border-t border-indigo-500/20">
              <Link
                href={isApproved ? "/dashboard" : "/signup?plan=agency"}
                className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm text-center transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 hover:scale-[1.02]"
              >
                <span>{isApproved ? "Go to Dashboard" : agencyPlan.ctaText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Payments coming soon placeholder notice */}
        <div className="mt-8 p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                Payment Processing Integration Coming Soon
              </p>
              <p className="text-[11px] text-indigo-200/80">
                Direct Stripe &amp; merchant checkout will connect here. For now, select your plan at sign-up to unlock your allotted website quota immediately!
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
            Preview Phase
          </span>
        </div>
      </section>

      {/* 4. COMPARISON TABLE SECTION */}
      <section className="py-16 bg-slate-950/60 border-t border-b border-slate-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Compare Plan Features
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Detailed breakdown of allowances and capabilities included in every package.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/50 text-slate-300">
                  <th className="py-4 px-6 font-bold w-1/2">Feature</th>
                  <th className="py-4 px-6 font-bold text-center w-1/4">Starter ($99)</th>
                  <th className="py-4 px-6 font-bold text-center w-1/4 text-indigo-400 bg-indigo-950/30">
                    Agency ($499)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {PLAN_COMPARISON.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-6 font-medium text-slate-200">
                      <div>{row.feature}</div>
                      {row.tooltip && (
                        <div className="text-[11px] text-slate-500 mt-0.5">{row.tooltip}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-center text-slate-300 font-semibold">
                      {typeof row.starter === "boolean" ? (
                        row.starter ? (
                          <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                        ) : (
                          <span className="text-slate-600">—</span>
                        )
                      ) : (
                        row.starter
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-center text-indigo-300 font-bold bg-indigo-950/20">
                      {typeof row.agency === "boolean" ? (
                        row.agency ? (
                          <Check className="w-4 h-4 text-indigo-400 mx-auto" />
                        ) : (
                          <span className="text-slate-600">—</span>
                        )
                      ) : (
                        row.agency
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. FAQ ACCORDION SECTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-semibold">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Everything you need to know about AltoFox plans, limits, and ownership.
          </p>
        </div>

        <div className="space-y-3">
          {PRICING_FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left font-bold text-sm text-white flex items-center justify-between gap-4"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      isOpen ? "rotate-180 text-indigo-400" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800 pt-3">
                    {faq.answer}
                    {idx === 4 && (
                      <span className="block mt-2 font-semibold">
                        Read our full policy in our{" "}
                        <Link href="/terms" className="text-indigo-400 underline hover:text-indigo-300">
                          Terms of Service
                        </Link>
                        .
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. FINAL CTA BANNER */}
      <section className="py-20 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 border-t border-indigo-500/20 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 relative z-10 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Start generating high-ranking local websites today
          </h2>
          <p className="text-sm text-indigo-200/80 max-w-xl mx-auto leading-relaxed">
            Choose your plan, connect your AI key, and publish clean zero-build static sites for every city your business covers.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={isApproved ? "/dashboard" : "/signup?plan=agency"}
              className="inline-flex items-center space-x-2 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition shadow-xl shadow-indigo-600/30 hover:scale-105"
            >
              <span>{isApproved ? "Open Dashboard" : "Get Started with Agency ($499)"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href={isApproved ? "/dashboard" : "/signup?plan=starter"}
              className="inline-flex items-center space-x-2 px-6 py-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-bold text-sm transition border border-slate-700"
            >
              <span>Or Choose Starter ($99)</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
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
            <Link href="/pricing" className="text-indigo-400 font-bold hover:text-white transition">Pricing</Link>
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
