"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BRAND } from "@/config/brand";
import { RankLocalLogo } from "@/components/brand/RankLocalLogo";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
      {/* Top Nav */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <RankLocalLogo size="sm" showTagline />
          <Link
            href="/"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-xs space-y-8">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Legal Documentation
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
              Privacy Policy
            </h1>
            <p className="text-xs text-slate-500 mt-2">Last updated: September 25, 2026</p>
          </div>

          <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              1. Overview &amp; Commitment
            </h2>
            <p>
              {BRAND.name} (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) provides a static website generation and local search optimization platform. We respect the confidentiality and privacy of our users, contractors, agencies, and business clients. This Privacy Policy describes how we collect, store, and protect your information.
            </p>
          </section>

          <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              2. Information We Collect
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Account Credentials:</strong> Name, business email address, company name, and hashed passwords.
              </li>
              <li>
                <strong>Business &amp; Project Data:</strong> Trade type, business addresses, phone numbers, target service areas, service descriptions, and uploaded images.
              </li>
              <li>
                <strong>Search Console Data:</strong> Performance metrics (clicks, impressions, queries) uploaded manually by you for local optimization cycles.
              </li>
              <li>
                <strong>Technical Logs:</strong> Authentication timestamps, IP addresses for security auditing, and workspace activity logs.
              </li>
            </ul>
          </section>

          <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              3. Data Isolation &amp; Row Level Security
            </h2>
            <p>
              Your projects, pages, assets, and Search Console uploads are strictly isolated using PostgreSQL Row Level Security (RLS). Only approved members of your team workspace can view, modify, or export your website assets. We never sell, rent, or monetize your business or customer data.
            </p>
          </section>

          <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              4. Third-Party AI Services &amp; API Keys
            </h2>
            <p>
              When generating website copy, metadata, and blog content, prompts are sent to your configured AI provider (Google Gemini, OpenAI, Groq, or OpenRouter). You retain complete ownership of your generated static code and content. Third-party providers do not use your private API submissions to train foundation models according to their enterprise terms.
            </p>
          </section>

          <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              5. Contact Us
            </h2>
            <p>
              If you have any questions or data deletion inquiries regarding this policy, please reach out to our team at{" "}
              <a
                href={`mailto:${BRAND.supportEmail}`}
                className="text-indigo-600 dark:text-indigo-400 font-semibold underline"
              >
                {BRAND.supportEmail}
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
