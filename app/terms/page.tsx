"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
      {/* Top Nav */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Alto<span className="text-indigo-600">Fox</span>
            </span>
          </Link>
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
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-sm space-y-8">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Legal Terms
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
              Terms of Service
            </h1>
            <p className="text-xs text-slate-500 mt-2">Last updated: September 25, 2026</p>
          </div>

          <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using the AltoFox software platform (&quot;Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not register for or use the Service.
            </p>
          </section>

          <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              2. Account Registration &amp; Workspace Approval
            </h2>
            <p>
              Access to AltoFox is private and subject to administrative approval or invitation. You agree to provide accurate registration information. Account sharing outside of designated team members is prohibited. The workspace owner reserves the right to suspend or terminate unapproved or unauthorized accounts.
            </p>
          </section>

          <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              3. Ownership of Generated Websites &amp; Content
            </h2>
            <p>
              You own all rights, title, and interest in the static websites, text, and media generated through your AltoFox projects. You are free to export, host, modify, and publish the static HTML/CSS/JS files on any hosting provider without ongoing software lock-in.
            </p>
          </section>

          <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              4. Prohibited Uses &amp; Search Engine Compliance
            </h2>
            <p>
              You agree not to use AltoFox to generate spam, misleading content, doorway pages that violate Google Search Essentials, or deceptive business claims. AltoFox includes on-page verification tools to assist in creating quality, helpful content that adheres to search engine best practices.
            </p>
          </section>

          <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              5. Disclaimer of Warranties
            </h2>
            <p>
              AltoFox is provided &quot;as is&quot; without warranties of any kind. While our platform is engineered to implement local SEO best practices, we cannot guarantee specific search ranking positions, which depend on numerous external algorithms and competitive factors.
            </p>
          </section>

          <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              6. Governing Law &amp; Inquiries
            </h2>
            <p>
              For legal inquiries regarding these Terms, contact our team at{" "}
              <a
                href="mailto:support@altopex.com"
                className="text-indigo-600 dark:text-indigo-400 font-semibold underline"
              >
                support@altopex.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
