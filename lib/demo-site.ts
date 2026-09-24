import { ProjectData } from "@/components/LivePreview";

export const SAMPLE_DEMO_PROJECT: ProjectData = {
  projectId: "demo-carolina-plumbing",
  name: "Carolina Pro Plumbing & Drain",
  notes: "Full-featured interactive demo static website with Schema.org LocalBusiness JSON-LD, emergency call buttons, and working quote form.",
  provider: "altofox",
  model: "static-architect-v1",
  downloadUrl: "#",
  files: [
    {
      path: "index.html",
      mimeType: "text/html",
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Carolina Pro Plumbing & Drain — Emergency Plumber in Charlotte, NC</title>
  <meta name="description" content="24/7 Emergency Plumber in Charlotte, NC. Fast 45-minute dispatch, upfront pricing, licensed & insured technicians. Call (704) 555-0199 for immediate service.">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="styles.css">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "PlumbingService",
    "name": "Carolina Pro Plumbing & Drain",
    "telephone": "(704) 555-0199",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Charlotte",
      "addressRegion": "NC",
      "addressCountry": "US"
    },
    "priceRange": "$$",
    "openingHours": "Mo-Su 00:00-23:59",
    "areaServed": ["Charlotte", "Matthews", "Huntersville", "Concord", "Pineville"]
  }
  </script>
</head>
<body class="bg-slate-900 text-slate-100 font-sans antialiased">

  <!-- Top Emergency Dispatch Banner -->
  <div class="bg-amber-500 text-slate-950 font-semibold text-xs sm:text-sm py-2 px-4 text-center flex items-center justify-center gap-2 shadow-md">
    <span>🚨 24/7 Emergency Dispatch Available in Charlotte & Surrounding Suburbs:</span>
    <a href="tel:7045550199" class="underline font-bold hover:text-white transition">(704) 555-0199</a>
  </div>

  <!-- Header / Navigation -->
  <header class="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <div class="w-9 h-9 rounded-lg bg-sky-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-sky-500/30">🦊</div>
        <span class="font-extrabold text-lg text-white tracking-tight">Carolina Pro <span class="text-sky-400">Plumbing</span></span>
      </div>
      <nav class="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-300">
        <a href="#services" class="hover:text-white transition">Services</a>
        <a href="#why-us" class="hover:text-white transition">Why Choose Us</a>
        <a href="#areas" class="hover:text-white transition">Service Areas</a>
        <a href="#faq" class="hover:text-white transition">FAQ</a>
      </nav>
      <div class="flex items-center space-x-3">
        <a href="tel:7045550199" class="hidden sm:inline-flex items-center px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/25 transition">
          📞 (704) 555-0199
        </a>
        <a href="#quote" class="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition">
          Free Estimate
        </a>
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="relative py-16 sm:py-24 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 overflow-hidden">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
      <div class="lg:col-span-7 space-y-6 text-left">
        <div class="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold">
          <span>⚡ Licensed NC Plumber #34891 • 45-Min Response</span>
        </div>
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
          Charlotte's Most Trusted <br/>
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">Emergency Plumber</span>
        </h1>
        <p class="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
          Burst pipes, backed-up drains, or broken water heaters? Our master-certified technicians deliver prompt, guaranteed repairs with 100% upfront pricing.
        </p>

        <!-- Trust Badges Row -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div class="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl text-center">
            <div class="text-amber-400 font-bold text-sm">★★★★★</div>
            <div class="text-[11px] text-slate-300 font-medium">5-Star Google Rated</div>
          </div>
          <div class="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl text-center">
            <div class="text-sky-400 font-bold text-sm">45 Min</div>
            <div class="text-[11px] text-slate-300 font-medium">Avg Dispatch Time</div>
          </div>
          <div class="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl text-center">
            <div class="text-emerald-400 font-bold text-sm">Upfront</div>
            <div class="text-[11px] text-slate-300 font-medium">No Hidden Fees</div>
          </div>
          <div class="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl text-center">
            <div class="text-indigo-400 font-bold text-sm">100%</div>
            <div class="text-[11px] text-slate-300 font-medium">Work Guarantee</div>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-4 pt-4">
          <a href="tel:7045550199" class="px-7 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm shadow-xl shadow-sky-500/30 transition transform hover:-translate-y-0.5">
            📞 Call (704) 555-0199 Now
          </a>
          <a href="#services" class="px-6 py-3.5 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-medium text-sm transition">
            Explore Services ↓
          </a>
        </div>
      </div>

      <!-- Quick Quote Booking Card -->
      <div id="quote" class="lg:col-span-5 bg-slate-800/90 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <h3 class="text-xl font-bold text-white mb-1">Get an Instant Free Quote</h3>
        <p class="text-xs text-slate-400 mb-6">Same-day dispatch slots currently available</p>
        
        <form id="contactForm" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Your Name</label>
            <input type="text" required placeholder="John Doe" class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
            <input type="tel" required placeholder="(704) 000-0000" class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Service Needed</label>
            <select class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500">
              <option>Emergency Burst Pipe / Leak</option>
              <option>24/7 Clogged Drain Cleaning</option>
              <option>Water Heater Repair / Replacement</option>
              <option>Sewer Line Video Inspection</option>
              <option>Fixture Installation / Other</option>
            </select>
          </div>
          <button type="submit" class="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-sm transition shadow-lg shadow-amber-500/20">
            Request Dispatch Callback →
          </button>
          <div id="formSuccess" class="hidden p-3 bg-emerald-500/20 border border-emerald-500 text-emerald-300 rounded-lg text-xs text-center font-medium">
            ✓ Request received! A Charlotte dispatcher will call you in &lt; 5 minutes.
          </div>
        </form>
      </div>
    </div>
  </section>

  <!-- Core Services Grid -->
  <section id="services" class="py-16 bg-slate-950 border-t border-slate-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
      <h2 class="text-3xl font-extrabold text-white">Full-Service Residential & Commercial Plumbing</h2>
      <p class="text-sm text-slate-400 max-w-xl mx-auto">Equipped with state-of-the-art diagnostic cameras, hydro-jetting, and premium fixtures.</p>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 text-left">
        <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-sky-500/50 transition group">
          <div class="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold text-lg mb-4">🚰</div>
          <h3 class="font-bold text-white text-lg mb-2 group-hover:text-sky-400 transition">Emergency Drain Cleaning</h3>
          <p class="text-xs text-slate-400 leading-relaxed">High-pressure hydro-jetting clears root intrusions, grease buildup, and heavy clogs instantly.</p>
        </div>
        <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-sky-500/50 transition group">
          <div class="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold text-lg mb-4">🔥</div>
          <h3 class="font-bold text-white text-lg mb-2 group-hover:text-sky-400 transition">Water Heater Repair & Install</h3>
          <p class="text-xs text-slate-400 leading-relaxed">Tankless and conventional water heater repairs with same-day unit swap options.</p>
        </div>
        <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-sky-500/50 transition group">
          <div class="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold text-lg mb-4">🔍</div>
          <h3 class="font-bold text-white text-lg mb-2 group-hover:text-sky-400 transition">Sewer Line Camera Inspection</h3>
          <p class="text-xs text-slate-400 leading-relaxed">Non-destructive high-definition camera scoping pinpoints exact pipe damage without digging.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Service Areas Section -->
  <section id="areas" class="py-14 bg-slate-900 border-t border-slate-800">
    <div class="max-w-5xl mx-auto px-4 text-center space-y-4">
      <h2 class="text-2xl font-bold text-white">Serving Greater Charlotte, NC & Nearby Communities</h2>
      <p class="text-xs text-slate-400">Guaranteed response times across Mecklenburg, Cabarrus, and Union Counties</p>
      <div class="flex flex-wrap items-center justify-center gap-2 pt-4">
        <span class="px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">Uptown Charlotte</span>
        <span class="px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">South End</span>
        <span class="px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">Ballantyne</span>
        <span class="px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">Matthews, NC</span>
        <span class="px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">Huntersville, NC</span>
        <span class="px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">Concord, NC</span>
        <span class="px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">Pineville, NC</span>
      </div>
    </div>
  </section>

  <!-- FAQ Accordion -->
  <section id="faq" class="py-14 bg-slate-950 border-t border-slate-800">
    <div class="max-w-3xl mx-auto px-4 space-y-6">
      <h2 class="text-2xl font-bold text-white text-center">Frequently Asked Questions</h2>
      <div class="space-y-3">
        <div class="faq-item border border-slate-800 rounded-xl p-4 bg-slate-900 cursor-pointer">
          <div class="flex justify-between items-center font-semibold text-sm text-white">
            <span>How fast can your Charlotte emergency plumber arrive?</span>
            <span class="text-sky-400 font-bold text-lg">+</span>
          </div>
          <p class="faq-content hidden text-xs text-slate-400 pt-2 leading-relaxed">
            Our average dispatch time is under 45 minutes for emergency calls in Charlotte, South End, Ballantyne, and Matthews.
          </p>
        </div>
        <div class="faq-item border border-slate-800 rounded-xl p-4 bg-slate-900 cursor-pointer">
          <div class="flex justify-between items-center font-semibold text-sm text-white">
            <span>Do you offer upfront estimates before work starts?</span>
            <span class="text-sky-400 font-bold text-lg">+</span>
          </div>
          <p class="faq-content hidden text-xs text-slate-400 pt-2 leading-relaxed">
            Yes! We diagnose the issue and give you a written, fixed-price quote with zero hidden surprise charges.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="py-8 bg-slate-950 border-t border-slate-800 text-center text-xs text-slate-500">
    <p>© 2026 Carolina Pro Plumbing & Drain. All Rights Reserved. NC License #34891.</p>
  </footer>

  <!-- Sticky Mobile Emergency CTA Bar -->
  <div class="sm:hidden fixed bottom-0 inset-x-0 bg-slate-950/95 border-t border-slate-800 p-3 z-50 backdrop-blur-md">
    <a href="tel:7045550199" class="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-center block text-sm shadow-xl">
      🚨 Tap to Call Plumber Now (704) 555-0199
    </a>
  </div>

  <script src="script.js" defer></script>
</body>
</html>`,
    },
    {
      path: "styles.css",
      mimeType: "text/css",
      content: `/* Custom Polish for Carolina Pro Plumbing */
html {
  scroll-behavior: smooth;
}

.faq-item.active .faq-content {
  display: block;
}

.faq-item.active span:last-child {
  transform: rotate(45deg);
}`,
    },
    {
      path: "script.js",
      mimeType: "application/javascript",
      content: `// Carolina Pro Plumbing Interactive Scripts
document.addEventListener("DOMContentLoaded", function () {
  // FAQ Accordion
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach((item) => {
    item.addEventListener("click", () => {
      item.classList.toggle("active");
    });
  });

  // Quote Form Submission
  const form = document.getElementById("contactForm");
  const successBanner = document.getElementById("formSuccess");
  if (form && successBanner) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      successBanner.classList.remove("hidden");
      form.reset();
    });
  }
});`,
    },
  ],
};
