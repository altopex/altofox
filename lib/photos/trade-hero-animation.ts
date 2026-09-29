/**
 * Trade Hero Animation Generator (RankLocal)
 *
 * Generates self-contained animated SVG illustrations for each trade category.
 * Used in the hero section instead of unreliable external photos.
 *
 * Design goals:
 * - 100% relevant: a plumber site shows plumbing tools, not a generic photo
 * - Animated: CSS keyframe animations baked inline — works in any static HTML
 * - Zero network requests: pure SVG + CSS, no external images or scripts
 * - Lightweight: ~3-8KB each
 * - Professional: clean illustration style, not clipart
 */

import { detectTradeCategory } from "./photo-service";

export interface TradeHeroAnimationOptions {
  trade: string;
  businessName?: string;
  city?: string;
  width?: number;
  height?: number;
}

// ─────────────────────────────────────────────────────────────
// PLUMBER ANIMATION
// Animated: water droplet falling, pipe wrench rotating slightly,
// water ripple expanding, steam rising from pipe
// ─────────────────────────────────────────────────────────────
function plumberAnimation(w: number, h: number): string {
  const cx = w * 0.5;
  const cy = h * 0.5;
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Professional plumbing service illustration">
<defs>
  <style>
    @keyframes rl-drop { 0%{opacity:0;transform:translateY(-18px)} 60%{opacity:1} 100%{opacity:0;transform:translateY(32px)} }
    @keyframes rl-ripple { 0%{r:4;opacity:.9;stroke-width:3} 100%{r:28;opacity:0;stroke-width:1} }
    @keyframes rl-wrench { 0%,100%{transform:rotate(-8deg)} 50%{transform:rotate(8deg)} }
    @keyframes rl-steam { 0%{opacity:0;transform:translateY(0) scaleX(1)} 40%{opacity:.7} 100%{opacity:0;transform:translateY(-28px) scaleX(.3)} }
    @keyframes rl-pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }
    @keyframes rl-flow { 0%{stroke-dashoffset:60} 100%{stroke-dashoffset:0} }
    .rl-drop1{animation:rl-drop 2s ease-in infinite}
    .rl-drop2{animation:rl-drop 2s ease-in .7s infinite}
    .rl-drop3{animation:rl-drop 2s ease-in 1.4s infinite}
    .rl-rip1{animation:rl-ripple 2s ease-out infinite}
    .rl-rip2{animation:rl-ripple 2s ease-out .8s infinite}
    .rl-wrench{animation:rl-wrench 2.4s ease-in-out infinite;transform-origin:${cx * 0.95}px ${cy * 0.8}px}
    .rl-steam1{animation:rl-steam 2s ease-out infinite}
    .rl-steam2{animation:rl-steam 2s ease-out .6s infinite}
    .rl-steam3{animation:rl-steam 2s ease-out 1.2s infinite}
    .rl-pulse{animation:rl-pulse 2s ease-in-out infinite}
    .rl-flow{animation:rl-flow 1.5s linear infinite;stroke-dasharray:12 6}
  </style>
  <linearGradient id="rl-bg-p" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#0f2744"/>
    <stop offset="100%" stop-color="#0284c7"/>
  </linearGradient>
  <linearGradient id="rl-pipe-p" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#94a3b8"/>
    <stop offset="100%" stop-color="#475569"/>
  </linearGradient>
  <filter id="rl-glow-p">
    <feGaussianBlur stdDeviation="3" result="blur"/>
    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>

<!-- Background -->
<rect width="${w}" height="${h}" fill="url(#rl-bg-p)" rx="12"/>

<!-- Subtle grid -->
<path d="M0 ${h*0.25} H${w} M0 ${h*0.5} H${w} M0 ${h*0.75} H${w} M${w*0.25} 0 V${h} M${w*0.5} 0 V${h} M${w*0.75} 0 V${h}" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>

<!-- Main horizontal pipe -->
<rect x="${w*0.15}" y="${cy - 16}" width="${w*0.7}" height="32" rx="8" fill="url(#rl-pipe-p)" stroke="#94a3b8" stroke-width="1.5"/>
<!-- Pipe shine -->
<rect x="${w*0.15}" y="${cy - 12}" width="${w*0.7}" height="8" rx="4" fill="rgba(255,255,255,0.15)"/>

<!-- Pipe elbow left -->
<rect x="${w*0.12}" y="${cy - 16}" width="32" height="${h*0.28}" rx="8" fill="url(#rl-pipe-p)" stroke="#94a3b8" stroke-width="1.5"/>

<!-- Pipe elbow right -->
<rect x="${w*0.73}" y="${cy - 16}" width="32" height="${h*0.3}" rx="8" fill="url(#rl-pipe-p)" stroke="#94a3b8" stroke-width="1.5"/>

<!-- Valve/joint left -->
<circle cx="${w*0.15 + 16}" cy="${cy}" r="18" fill="#1e3a5f" stroke="#38bdf8" stroke-width="2.5"/>
<rect x="${w*0.15 + 8}" y="${cy - 5}" width="16" height="10" rx="3" fill="#38bdf8" class="rl-pulse"/>

<!-- Valve/joint right -->
<circle cx="${w*0.73 + 16}" cy="${cy}" r="18" fill="#1e3a5f" stroke="#38bdf8" stroke-width="2.5"/>
<rect x="${w*0.73 + 8}" y="${cy - 5}" width="16" height="10" rx="3" fill="#38bdf8" class="rl-pulse"/>

<!-- Water flow indicator lines inside pipe -->
<line x1="${w*0.22}" y1="${cy}" x2="${w*0.35}" y2="${cy}" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" class="rl-flow"/>
<line x1="${w*0.45}" y1="${cy}" x2="${w*0.6}" y2="${cy}" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" class="rl-flow"/>

<!-- Water dripping from bottom of left elbow -->
<ellipse cx="${w*0.15 + 16}" cy="${cy + h*0.28 + 10}" rx="12" ry="4" fill="rgba(56,189,248,0.3)" class="rl-rip1"/>
<ellipse cx="${w*0.15 + 16}" cy="${cy + h*0.28 + 10}" rx="12" ry="4" fill="none" stroke="#38bdf8" stroke-width="1.5" class="rl-rip2"/>
<!-- Drops -->
<path d="M${w*0.15+10} ${cy+h*0.28} Q${w*0.15+16} ${cy+h*0.28+14} ${w*0.15+22} ${cy+h*0.28}" fill="#38bdf8" class="rl-drop1"/>
<path d="M${w*0.15+12} ${cy+h*0.22} Q${w*0.15+16} ${cy+h*0.22+12} ${w*0.15+20} ${cy+h*0.22}" fill="#38bdf8" class="rl-drop2"/>

<!-- Wrench tool -->
<g class="rl-wrench" filter="url(#rl-glow-p)">
  <!-- Handle -->
  <rect x="${cx - 6}" y="${cy * 0.25}" width="12" height="${cy * 0.55}" rx="6" fill="#64748b" stroke="#94a3b8" stroke-width="1.5"/>
  <!-- Wrench jaw top -->
  <path d="M${cx-18} ${cy*0.25} A18 18 0 0 1 ${cx+18} ${cy*0.25} L${cx+10} ${cy*0.38} A10 10 0 0 0 ${cx-10} ${cy*0.38} Z" fill="#475569" stroke="#94a3b8" stroke-width="1.5"/>
  <!-- Wrench opening -->
  <rect x="${cx-6}" y="${cy*0.26}" width="12" height="14" rx="2" fill="#1e3a5f"/>
</g>

<!-- Steam from hot water -->
<path d="M${w*0.73+28} ${cy-30} Q${w*0.73+32} ${cy-42} ${w*0.73+24} ${cy-54}" stroke="rgba(147,210,255,0.7)" stroke-width="3" stroke-linecap="round" fill="none" class="rl-steam1"/>
<path d="M${w*0.73+36} ${cy-30} Q${w*0.73+42} ${cy-44} ${w*0.73+34} ${cy-58}" stroke="rgba(147,210,255,0.7)" stroke-width="3" stroke-linecap="round" fill="none" class="rl-steam2"/>
<path d="M${w*0.73+44} ${cy-28} Q${w*0.73+50} ${cy-42} ${w*0.73+42} ${cy-56}" stroke="rgba(147,210,255,0.7)" stroke-width="3" stroke-linecap="round" fill="none" class="rl-steam3"/>

<!-- Water drop icon top right -->
<g transform="translate(${w*0.8}, ${h*0.12})">
  <path d="M0 -22 Q-14 -8 -14 4 A14 14 0 0 0 14 4 Q14 -8 0 -22Z" fill="#38bdf8" opacity="0.9"/>
  <ellipse cx="-5" cy="-2" rx="4" ry="6" fill="rgba(255,255,255,0.3)" transform="rotate(-20)"/>
</g>

</svg>`;
}

// ─────────────────────────────────────────────────────────────
// ELECTRICIAN ANIMATION
// Animated: lightning bolt flashing, circuit traces lighting up,
// bulb glowing, sparks
// ─────────────────────────────────────────────────────────────
function electricianAnimation(w: number, h: number): string {
  const cx = w * 0.5;
  const cy = h * 0.5;
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Professional electrician service illustration">
<defs>
  <style>
    @keyframes rl-bolt { 0%,100%{opacity:1;filter:drop-shadow(0 0 6px #fbbf24)} 50%{opacity:.3;filter:none} }
    @keyframes rl-glow-bulb { 0%,100%{opacity:.9;r:22} 50%{opacity:.5;r:18} }
    @keyframes rl-circuit { 0%{stroke-dashoffset:120} 100%{stroke-dashoffset:0} }
    @keyframes rl-spark { 0%{opacity:1;transform:scale(1) translate(0,0)} 100%{opacity:0;transform:scale(.2) translate(10px,-15px)} }
    @keyframes rl-spark2 { 0%{opacity:1;transform:scale(1) translate(0,0)} 100%{opacity:0;transform:scale(.2) translate(-12px,-10px)} }
    @keyframes rl-flicker { 0%,95%,100%{opacity:1} 96%{opacity:.2} 97%{opacity:.9} 98%{opacity:.1} }
    .rl-bolt{animation:rl-bolt 1.2s ease-in-out infinite}
    .rl-bulb-glow{animation:rl-glow-bulb 1.2s ease-in-out infinite}
    .rl-c1{animation:rl-circuit 2s linear infinite;stroke-dasharray:20 8}
    .rl-c2{animation:rl-circuit 2s linear .4s infinite;stroke-dasharray:20 8}
    .rl-c3{animation:rl-circuit 2s linear .8s infinite;stroke-dasharray:20 8}
    .rl-spark1{animation:rl-spark .8s ease-out infinite}
    .rl-spark2{animation:rl-spark2 .8s ease-out .3s infinite}
    .rl-flicker{animation:rl-flicker 3s linear infinite}
  </style>
  <linearGradient id="rl-bg-e" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#0f172a"/>
    <stop offset="100%" stop-color="#92400e"/>
  </linearGradient>
  <radialGradient id="rl-bulb-g" cx="50%" cy="40%" r="60%">
    <stop offset="0%" stop-color="#fef08a"/>
    <stop offset="60%" stop-color="#fbbf24"/>
    <stop offset="100%" stop-color="#d97706"/>
  </radialGradient>
  <filter id="rl-glow-e">
    <feGaussianBlur stdDeviation="5" result="blur"/>
    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>

<rect width="${w}" height="${h}" fill="url(#rl-bg-e)" rx="12"/>
<path d="M0 ${h*0.25} H${w} M0 ${h*0.5} H${w} M0 ${h*0.75} H${w} M${w*0.25} 0 V${h} M${w*0.5} 0 V${h} M${w*0.75} 0 V${h}" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>

<!-- Circuit board lines -->
<g stroke="#1d4ed8" stroke-width="2" fill="none">
  <path d="M${w*0.05} ${cy-40} H${w*0.3} V${cy-80} H${w*0.55} V${cy-40} H${w*0.75}" class="rl-c1"/>
  <path d="M${w*0.05} ${cy+40} H${w*0.25} V${cy+80} H${w*0.6} V${cy+40} H${w*0.8}" class="rl-c2"/>
  <path d="M${w*0.12} ${cy} H${w*0.35} V${cy-60} H${w*0.65} V${cy} H${w*0.88}" class="rl-c3"/>
</g>

<!-- Circuit nodes -->
<circle cx="${w*0.3}" cy="${cy-40}" r="5" fill="#fbbf24" opacity="0.8"/>
<circle cx="${w*0.55}" cy="${cy-40}" r="5" fill="#fbbf24" opacity="0.8"/>
<circle cx="${w*0.25}" cy="${cy+40}" r="5" fill="#fbbf24" opacity="0.8"/>
<circle cx="${w*0.6}" cy="${cy+40}" r="5" fill="#fbbf24" opacity="0.8"/>
<circle cx="${w*0.35}" cy="${cy-60}" r="5" fill="#fbbf24" opacity="0.8"/>
<circle cx="${w*0.65}" cy="${cy-60}" r="5" fill="#fbbf24" opacity="0.8"/>

<!-- Light bulb body -->
<g transform="translate(${cx}, ${cy - 20})" filter="url(#rl-glow-e)" class="rl-flicker">
  <!-- Glow aura -->
  <circle cx="0" cy="-10" r="38" fill="rgba(251,191,36,0.12)" class="rl-bulb-glow"/>
  <!-- Glass dome -->
  <path d="M-22 0 A22 28 0 0 1 22 0 L16 28 Q0 34 -16 28 Z" fill="url(#rl-bulb-g)" opacity="0.95"/>
  <!-- Filament detail -->
  <path d="M-8 10 Q-4 4 0 10 Q4 4 8 10" stroke="#92400e" stroke-width="2" fill="none"/>
  <!-- Base -->
  <rect x="-14" y="28" width="28" height="8" rx="2" fill="#64748b"/>
  <rect x="-12" y="36" width="24" height="6" rx="1" fill="#475569"/>
  <rect x="-10" y="42" width="20" height="4" rx="1" fill="#334155"/>
</g>

<!-- Main lightning bolt - center -->
<polygon points="${cx - 8},${cy - 70} ${cx + 12},${cy - 20} ${cx + 2},${cy - 20} ${cx + 14},${cy + 30} ${cx - 10},${cy - 10} ${cx + 2},${cy - 10}"
  fill="#fbbf24" stroke="#fff8" stroke-width="1" class="rl-bolt" filter="url(#rl-glow-e)"/>

<!-- Small secondary bolt left -->
<polygon points="${cx*0.4},${cy*0.5} ${cx*0.48},${cy*0.7} ${cx*0.43},${cy*0.7} ${cx*0.5},${cy*0.9} ${cx*0.37},${cy*0.72} ${cx*0.43},${cy*0.72}"
  fill="#fbbf24" opacity="0.6" class="rl-bolt"/>

<!-- Sparks near bolt -->
<g class="rl-spark1" transform="translate(${cx + 20}, ${cy - 30})">
  <line x1="0" y1="0" x2="8" y2="-8" stroke="#fef08a" stroke-width="2" stroke-linecap="round"/>
  <line x1="0" y1="0" x2="10" y2="2" stroke="#fef08a" stroke-width="2" stroke-linecap="round"/>
  <line x1="0" y1="0" x2="4" y2="10" stroke="#fef08a" stroke-width="2" stroke-linecap="round"/>
</g>
<g class="rl-spark2" transform="translate(${cx - 22}, ${cy - 15})">
  <line x1="0" y1="0" x2="-8" y2="-6" stroke="#fef08a" stroke-width="2" stroke-linecap="round"/>
  <line x1="0" y1="0" x2="-6" y2="8" stroke="#fef08a" stroke-width="2" stroke-linecap="round"/>
</g>

<!-- Panel icon top-left -->
<g transform="translate(${w*0.1}, ${h*0.15})">
  <rect width="40" height="52" rx="4" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
  <rect x="5" y="8" width="30" height="4" rx="2" fill="#3b82f6"/>
  <rect x="5" y="16" width="30" height="4" rx="2" fill="#3b82f6"/>
  <rect x="5" y="24" width="20" height="4" rx="2" fill="#fbbf24"/>
  <rect x="5" y="32" width="25" height="4" rx="2" fill="#3b82f6"/>
  <circle cx="32" cy="42" r="5" fill="#22c55e" stroke="#16a34a" stroke-width="1"/>
</g>

</svg>`;
}

// ─────────────────────────────────────────────────────────────
// HVAC ANIMATION
// Animated: fan blades spinning, air waves flowing, thermostat
// ─────────────────────────────────────────────────────────────
function hvacAnimation(w: number, h: number): string {
  const cx = w * 0.5;
  const cy = h * 0.5;
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="HVAC heating and cooling service illustration">
<defs>
  <style>
    @keyframes rl-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes rl-spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes rl-wave { 0%,100%{d:path("M0 0 Q15 -8 30 0 Q45 8 60 0")} 50%{d:path("M0 0 Q15 8 30 0 Q45 -8 60 0")} }
    @keyframes rl-airflow { 0%{transform:translateX(-20px);opacity:0} 40%{opacity:.8} 100%{transform:translateX(60px);opacity:0} }
    @keyframes rl-temp { 0%,100%{height:28px} 50%{height:42px} }
    .rl-fan{animation:rl-spin 1.5s linear infinite;transform-origin:${cx}px ${cy - 20}px}
    .rl-fan-outer{animation:rl-spin-slow 4s linear infinite;transform-origin:${cx}px ${cy - 20}px}
    .rl-air1{animation:rl-airflow 2s ease-in-out infinite}
    .rl-air2{animation:rl-airflow 2s ease-in-out .4s infinite}
    .rl-air3{animation:rl-airflow 2s ease-in-out .8s infinite}
    .rl-air4{animation:rl-airflow 2s ease-in-out 1.2s infinite}
    .rl-temp-bar{animation:rl-temp 2s ease-in-out infinite}
  </style>
  <linearGradient id="rl-bg-h" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#0c1a3a"/>
    <stop offset="100%" stop-color="#1d4ed8"/>
  </linearGradient>
  <linearGradient id="rl-cool" x1="0" y1="1" x2="0" y2="0">
    <stop offset="0%" stop-color="#3b82f6"/>
    <stop offset="100%" stop-color="#38bdf8"/>
  </linearGradient>
  <filter id="rl-glow-h">
    <feGaussianBlur stdDeviation="4" result="blur"/>
    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>

<rect width="${w}" height="${h}" fill="url(#rl-bg-h)" rx="12"/>
<path d="M0 ${h*0.25} H${w} M0 ${h*0.5} H${w} M0 ${h*0.75} H${w} M${w*0.25} 0 V${h} M${w*0.5} 0 V${h} M${w*0.75} 0 V${h}" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>

<!-- AC Unit Box -->
<rect x="${w*0.25}" y="${cy - 60}" width="${w*0.5}" height="${h*0.45}" rx="12" fill="#1e293b" stroke="#3b82f6" stroke-width="2"/>
<rect x="${w*0.25}" y="${cy - 60}" width="${w*0.5}" height="14" rx="6" fill="#3b82f6"/>
<!-- Grill lines on unit -->
<g stroke="#334155" stroke-width="1.5" stroke-linecap="round">
  ${Array.from({length:6}, (_,i) => `<line x1="${w*0.27}" y1="${cy - 36 + i*18}" x2="${w*0.73}" y2="${cy - 36 + i*18}"/>`).join("")}
</g>

<!-- Fan assembly -->
<g class="rl-fan-outer" filter="url(#rl-glow-h)">
  <!-- Outer ring -->
  <circle cx="${cx}" cy="${cy - 20}" r="38" fill="none" stroke="#1d4ed8" stroke-width="2" stroke-dasharray="6 4"/>
</g>
<g class="rl-fan">
  <!-- Fan blades -->
  <ellipse cx="${cx}" cy="${cy - 48}" rx="12" ry="26" fill="#2563eb" opacity="0.85" transform="rotate(0 ${cx} ${cy - 20})"/>
  <ellipse cx="${cx}" cy="${cy - 48}" rx="12" ry="26" fill="#2563eb" opacity="0.85" transform="rotate(120 ${cx} ${cy - 20})"/>
  <ellipse cx="${cx}" cy="${cy - 48}" rx="12" ry="26" fill="#2563eb" opacity="0.85" transform="rotate(240 ${cx} ${cy - 20})"/>
</g>
<!-- Fan hub -->
<circle cx="${cx}" cy="${cy - 20}" r="10" fill="#0f172a" stroke="#60a5fa" stroke-width="2"/>
<circle cx="${cx}" cy="${cy - 20}" r="4" fill="#60a5fa"/>

<!-- Airflow waves coming out right side -->
<g transform="translate(${w*0.73}, ${cy - 10})">
  <path d="M0 0 Q15 -10 30 0 Q45 10 60 0" stroke="#60a5fa" stroke-width="2.5" fill="none" stroke-linecap="round" class="rl-air1" opacity="0.8"/>
  <path d="M0 15 Q15 5 30 15 Q45 25 60 15" stroke="#93c5fd" stroke-width="2" fill="none" stroke-linecap="round" class="rl-air2" opacity="0.6"/>
  <path d="M0 -15 Q15 -25 30 -15 Q45 -5 60 -15" stroke="#93c5fd" stroke-width="2" fill="none" stroke-linecap="round" class="rl-air3" opacity="0.6"/>
  <path d="M0 30 Q15 20 30 30 Q45 40 60 30" stroke="#bfdbfe" stroke-width="1.5" fill="none" stroke-linecap="round" class="rl-air4" opacity="0.4"/>
</g>

<!-- Thermostat panel left -->
<g transform="translate(${w*0.08}, ${cy - 50})">
  <rect width="52" height="80" rx="8" fill="#1e293b" stroke="#3b82f6" stroke-width="1.5"/>
  <!-- Temperature display -->
  <rect x="8" y="10" width="36" height="22" rx="4" fill="#0f172a"/>
  <text x="26" y="25" font-family="monospace" font-size="14" font-weight="700" fill="#38bdf8" text-anchor="middle">72°</text>
  <!-- Up/down arrows -->
  <polygon points="26,38 20,46 32,46" fill="#60a5fa"/>
  <polygon points="26,68 20,60 32,60" fill="#f87171"/>
  <!-- Temp bar -->
  <rect x="22" y="48" width="8" height="12" rx="2" fill="#1d4ed8"/>
  <rect x="22" y="${48 + 12 - 8}" width="8" rx="2" fill="#38bdf8" class="rl-temp-bar"/>
</g>

<!-- Snowflake icon top right -->
<g transform="translate(${w*0.8}, ${h*0.15})" fill="none" stroke="#93c5fd" stroke-width="2" stroke-linecap="round">
  <line x1="0" y1="-20" x2="0" y2="20"/>
  <line x1="-20" y1="0" x2="20" y2="0"/>
  <line x1="-14" y1="-14" x2="14" y2="14"/>
  <line x1="14" y1="-14" x2="-14" y2="14"/>
  <!-- Endpoints -->
  <line x1="-5" y1="-15" x2="0" y2="-20"/><line x1="5" y1="-15" x2="0" y2="-20"/>
  <line x1="15" y1="-5" x2="20" y2="0"/><line x1="15" y1="5" x2="20" y2="0"/>
</g>

</svg>`;
}

// ─────────────────────────────────────────────────────────────
// ROOFING ANIMATION
// Animated: rain drops falling on a house roof, shingles
// ─────────────────────────────────────────────────────────────
function roofingAnimation(w: number, h: number): string {
  const cx = w * 0.5;
  const cy = h * 0.5;
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Roofing and exterior protection service illustration">
<defs>
  <style>
    @keyframes rl-rain { 0%{opacity:0;transform:translateY(-10px)} 60%{opacity:.7} 100%{opacity:0;transform:translateY(${h*0.4}px)} }
    @keyframes rl-shield { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)} }
    @keyframes rl-hammer { 0%,100%{transform:rotate(-25deg)} 50%{transform:rotate(15deg)} }
    @keyframes rl-cloud { 0%,100%{transform:translateX(0)} 50%{transform:translateX(${w*0.03}px)} }
    .rl-rain1{animation:rl-rain 1.4s ease-in infinite}
    .rl-rain2{animation:rl-rain 1.4s ease-in .18s infinite}
    .rl-rain3{animation:rl-rain 1.4s ease-in .36s infinite}
    .rl-rain4{animation:rl-rain 1.4s ease-in .54s infinite}
    .rl-rain5{animation:rl-rain 1.4s ease-in .72s infinite}
    .rl-rain6{animation:rl-rain 1.4s ease-in .9s infinite}
    .rl-shield{animation:rl-shield 2.5s ease-in-out infinite}
    .rl-hammer{animation:rl-hammer 1.2s ease-in-out infinite;transform-origin:${cx*1.3}px ${cy*0.65}px}
    .rl-cloud{animation:rl-cloud 4s ease-in-out infinite}
  </style>
  <linearGradient id="rl-bg-r" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#1c1917"/>
    <stop offset="100%" stop-color="#92400e"/>
  </linearGradient>
  <linearGradient id="rl-roof-g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#78350f"/>
    <stop offset="100%" stop-color="#451a03"/>
  </linearGradient>
  <linearGradient id="rl-wall-g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#d6d3d1"/>
    <stop offset="100%" stop-color="#a8a29e"/>
  </linearGradient>
</defs>

<rect width="${w}" height="${h}" fill="url(#rl-bg-r)" rx="12"/>
<path d="M0 ${h*0.25} H${w} M0 ${h*0.5} H${w} M0 ${h*0.75} H${w}" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>

<!-- Rain drops -->
${[
  [w*0.15, h*0.08], [w*0.3, h*0.05], [w*0.5, h*0.1], [w*0.65, h*0.06],
  [w*0.8, h*0.08], [w*0.42, h*0.04], [w*0.22, h*0.12], [w*0.72, h*0.1],
].map(([rx, ry], i) => `<line x1="${rx}" y1="${ry}" x2="${rx - 3}" y2="${ry + 18}" stroke="#93c5fd" stroke-width="2" stroke-linecap="round" class="rl-rain${(i%6)+1}"/>`).join("")}

<!-- Cloud moving -->
<g class="rl-cloud">
  <ellipse cx="${w*0.35}" cy="${h*0.12}" rx="${w*0.18}" ry="${h*0.07}" fill="#475569" opacity="0.9"/>
  <ellipse cx="${w*0.28}" cy="${h*0.14}" rx="${w*0.1}" ry="${h*0.055}" fill="#475569" opacity="0.9"/>
  <ellipse cx="${w*0.42}" cy="${h*0.15}" rx="${w*0.09}" ry="${h*0.045}" fill="#475569" opacity="0.9"/>
</g>

<!-- House walls -->
<rect x="${w*0.2}" y="${cy - 10}" width="${w*0.6}" height="${h*0.42}" fill="url(#rl-wall-g)" stroke="#d6d3d1" stroke-width="1.5"/>

<!-- House roof (triangle) -->
<polygon points="${cx},${h*0.2} ${w*0.12},${cy - 10} ${w*0.88},${cy - 10}" fill="url(#rl-roof-g)" stroke="#92400e" stroke-width="2"/>

<!-- Shingles rows on roof (simplified) -->
${Array.from({length: 4}, (_, row) => {
  const cols = 8;
  const roofW = w * 0.76;
  const roofH = cy - 10 - h * 0.2;
  const rowRatio = (row + 1) / 5;
  const rowY = h * 0.2 + roofH * rowRatio;
  const rowW = roofW * rowRatio;
  const rowX = cx - rowW / 2;
  return Array.from({length: Math.ceil(cols * rowRatio)}, (_, col) => {
    const shingleW = rowW / Math.ceil(cols * rowRatio);
    const sx = rowX + col * shingleW;
    return `<rect x="${sx + 1}" y="${rowY - 8}" width="${shingleW - 2}" height="12" rx="2" fill="#78350f" stroke="#451a03" stroke-width="1" opacity="${0.6 + row * 0.1}"/>`;
  }).join("");
}).join("")}

<!-- Door -->
<rect x="${cx - 20}" y="${cy + 40}" width="40" height="52" rx="4" fill="#92400e" stroke="#78350f" stroke-width="1.5"/>
<circle cx="${cx + 10}" cy="${cy + 66}" r="3" fill="#fbbf24"/>

<!-- Window left -->
<rect x="${w*0.27}" y="${cy + 15}" width="36" height="30" rx="3" fill="#bae6fd" stroke="#0369a1" stroke-width="1.5"/>
<line x1="${w*0.27 + 18}" y1="${cy + 15}" x2="${w*0.27 + 18}" y2="${cy + 45}" stroke="#0369a1" stroke-width="1"/>
<line x1="${w*0.27}" y1="${cy + 30}" x2="${w*0.27 + 36}" y2="${cy + 30}" stroke="#0369a1" stroke-width="1"/>

<!-- Window right -->
<rect x="${w*0.63}" y="${cy + 15}" width="36" height="30" rx="3" fill="#bae6fd" stroke="#0369a1" stroke-width="1.5"/>
<line x1="${w*0.63 + 18}" y1="${cy + 15}" x2="${w*0.63 + 18}" y2="${cy + 45}" stroke="#0369a1" stroke-width="1"/>
<line x1="${w*0.63}" y1="${cy + 30}" x2="${w*0.63 + 36}" y2="${cy + 30}" stroke="#0369a1" stroke-width="1"/>

<!-- Shield protection badge -->
<g class="rl-shield" transform="translate(${w*0.75}, ${h*0.18})">
  <path d="M22 2 L38 10 L38 26 Q38 38 22 44 Q6 38 6 26 L6 10 Z" fill="#166534" stroke="#4ade80" stroke-width="2"/>
  <path d="M14 22 L20 28 L30 16" stroke="#4ade80" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</g>

<!-- Hammer tool -->
<g class="rl-hammer">
  <rect x="${cx*1.2}" y="${cy*0.45}" width="10" height="44" rx="5" fill="#92400e"/>
  <rect x="${cx*1.1}" y="${cy*0.38}" width="32" height="16" rx="4" fill="#475569" stroke="#64748b" stroke-width="1"/>
</g>

</svg>`;
}

// ─────────────────────────────────────────────────────────────
// TREE SERVICE ANIMATION
// Animated: leaves gently falling, chainsaw vibrating, tree
// ─────────────────────────────────────────────────────────────
function treeAnimation(w: number, h: number): string {
  const cx = w * 0.5;
  const cy = h * 0.5;
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Tree care and arborist service illustration">
<defs>
  <style>
    @keyframes rl-leaf1 { 0%{opacity:0;transform:translate(0,0) rotate(0deg)} 20%{opacity:1} 100%{opacity:0;transform:translate(${w*0.1}px,${h*0.5}px) rotate(180deg)} }
    @keyframes rl-leaf2 { 0%{opacity:0;transform:translate(0,0) rotate(0deg)} 20%{opacity:1} 100%{opacity:0;transform:translate(-${w*0.08}px,${h*0.45}px) rotate(-150deg)} }
    @keyframes rl-leaf3 { 0%{opacity:0;transform:translate(0,0) rotate(0deg)} 20%{opacity:1} 100%{opacity:0;transform:translate(${w*0.06}px,${h*0.4}px) rotate(200deg)} }
    @keyframes rl-sway { 0%,100%{transform:rotate(-3deg)} 50%{transform:rotate(3deg)} }
    @keyframes rl-saw { 0%,100%{transform:translateX(0)} 25%{transform:translateX(3px)} 75%{transform:translateX(-3px)} }
    .rl-leaf1{animation:rl-leaf1 3s ease-in infinite}
    .rl-leaf2{animation:rl-leaf2 3s ease-in .8s infinite}
    .rl-leaf3{animation:rl-leaf3 3s ease-in 1.6s infinite}
    .rl-sway{animation:rl-sway 3s ease-in-out infinite;transform-origin:${cx}px ${h*0.72}px}
    .rl-saw{animation:rl-saw .15s linear infinite}
  </style>
  <linearGradient id="rl-bg-t" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#064e3b"/>
    <stop offset="100%" stop-color="#14532d"/>
  </linearGradient>
  <radialGradient id="rl-canopy" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#16a34a"/>
    <stop offset="70%" stop-color="#15803d"/>
    <stop offset="100%" stop-color="#14532d"/>
  </radialGradient>
</defs>

<rect width="${w}" height="${h}" fill="url(#rl-bg-t)" rx="12"/>

<!-- Ground -->
<ellipse cx="${cx}" cy="${h*0.88}" rx="${w*0.45}" ry="${h*0.06}" fill="#065f46" opacity="0.7"/>

<!-- Tree trunk -->
<g class="rl-sway">
  <!-- Trunk -->
  <rect x="${cx - 18}" y="${h*0.45}" width="36" height="${h*0.44}" rx="8" fill="#92400e"/>
  <rect x="${cx - 10}" y="${h*0.5}" width="8" height="${h*0.15}" rx="4" fill="#78350f"/>
  <!-- Root hints -->
  <path d="M${cx - 18} ${h*0.88} Q${cx - 40} ${h*0.9} ${cx - 60} ${h*0.85}" stroke="#78350f" stroke-width="6" stroke-linecap="round" fill="none"/>
  <path d="M${cx + 18} ${h*0.88} Q${cx + 40} ${h*0.9} ${cx + 60} ${h*0.85}" stroke="#78350f" stroke-width="6" stroke-linecap="round" fill="none"/>

  <!-- Branch left -->
  <path d="M${cx - 16} ${h*0.55} Q${cx - 55} ${h*0.45} ${cx - 70} ${h*0.38}" stroke="#92400e" stroke-width="10" stroke-linecap="round" fill="none"/>
  <!-- Branch right -->
  <path d="M${cx + 16} ${h*0.5} Q${cx + 55} ${h*0.42} ${cx + 72} ${h*0.36}" stroke="#92400e" stroke-width="8" stroke-linecap="round" fill="none"/>

  <!-- Main canopy layers -->
  <ellipse cx="${cx}" cy="${h*0.3}" rx="${w*0.28}" ry="${h*0.2}" fill="url(#rl-canopy)"/>
  <ellipse cx="${cx - w*0.1}" cy="${h*0.36}" rx="${w*0.18}" ry="${h*0.14}" fill="#16a34a"/>
  <ellipse cx="${cx + w*0.1}" cy="${h*0.34}" rx="${w*0.18}" ry="${h*0.14}" fill="#15803d"/>
  <ellipse cx="${cx}" cy="${h*0.22}" rx="${w*0.2}" ry="${h*0.14}" fill="#22c55e"/>

  <!-- Left small canopy -->
  <ellipse cx="${cx - w*0.22}" cy="${h*0.4}" rx="${w*0.14}" ry="${h*0.1}" fill="#16a34a"/>
  <!-- Right small canopy -->
  <ellipse cx="${cx + w*0.22}" cy="${h*0.37}" rx="${w*0.13}" ry="${h*0.09}" fill="#15803d"/>
</g>

<!-- Falling leaves -->
<g transform="translate(${cx - 20}, ${h*0.24})">
  <path d="M0 0 Q8 -8 14 0 Q8 8 0 0" fill="#4ade80" class="rl-leaf1"/>
</g>
<g transform="translate(${cx + 30}, ${h*0.28})">
  <path d="M0 0 Q7 -6 12 0 Q7 6 0 0" fill="#86efac" class="rl-leaf2"/>
</g>
<g transform="translate(${cx - 40}, ${h*0.32})">
  <path d="M0 0 Q6 -7 10 0 Q6 7 0 0" fill="#4ade80" class="rl-leaf3"/>
</g>

<!-- Chainsaw tool bottom right -->
<g class="rl-saw" transform="translate(${w*0.72}, ${h*0.65}) rotate(-30)">
  <!-- Engine body -->
  <rect x="0" y="0" width="44" height="22" rx="4" fill="#374151" stroke="#6b7280" stroke-width="1.5"/>
  <circle cx="10" cy="11" r="7" fill="#1f2937" stroke="#6b7280" stroke-width="1"/>
  <rect x="18" y="5" width="4" height="12" rx="2" fill="#6b7280"/>
  <!-- Bar -->
  <rect x="44" y="7" width="48" height="8" rx="2" fill="#94a3b8"/>
  <!-- Chain teeth -->
  ${Array.from({length:8}, (_,i) => `<rect x="${52 + i*6}" y="${i%2===0 ? 4 : 14}" width="4" height="6" rx="1" fill="#475569"/>`).join("")}
  <!-- Handle -->
  <rect x="-10" y="-8" width="12" height="38" rx="6" fill="#374151" stroke="#6b7280" stroke-width="1"/>
</g>

<!-- Safety helmet icon -->
<g transform="translate(${w*0.1}, ${h*0.65})">
  <path d="M8 28 Q8 8 28 4 Q48 8 48 28 Z" fill="#f59e0b"/>
  <rect x="4" y="28" width="48" height="8" rx="4" fill="#d97706"/>
  <rect x="16" y="28" width="24" height="5" fill="#92400e"/>
</g>

</svg>`;
}

// ─────────────────────────────────────────────────────────────
// LANDSCAPING ANIMATION
// Animated: growing plants, sun rotating, lawnmower
// ─────────────────────────────────────────────────────────────
function landscapingAnimation(w: number, h: number): string {
  const cx = w * 0.5;
  const cy = h * 0.5;
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Professional landscaping service illustration">
<defs>
  <style>
    @keyframes rl-grow { 0%{transform:scaleY(0)} 100%{transform:scaleY(1)} }
    @keyframes rl-sun-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes rl-mow { 0%,100%{transform:translateX(0)} 50%{transform:translateX(${w*0.12}px)} }
    @keyframes rl-grass { 0%,100%{transform:rotate(-8deg)} 50%{transform:rotate(8deg)} }
    .rl-sun-rays{animation:rl-sun-spin 8s linear infinite;transform-origin:${w*0.82}px ${h*0.2}px}
    .rl-mow{animation:rl-mow 3s ease-in-out infinite}
    .rl-g1{animation:rl-grass 2s ease-in-out infinite;transform-origin:bottom center}
    .rl-g2{animation:rl-grass 2s ease-in-out .3s infinite;transform-origin:bottom center}
    .rl-g3{animation:rl-grass 2s ease-in-out .6s infinite;transform-origin:bottom center}
  </style>
  <linearGradient id="rl-bg-l" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#0c2a1a"/>
    <stop offset="100%" stop-color="#15803d"/>
  </linearGradient>
  <linearGradient id="rl-sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#0c4a6e"/>
    <stop offset="100%" stop-color="#0ea5e9"/>
  </linearGradient>
  <linearGradient id="rl-grass-g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#22c55e"/>
    <stop offset="100%" stop-color="#15803d"/>
  </linearGradient>
</defs>

<rect width="${w}" height="${h}" fill="url(#rl-sky)" rx="12"/>
<!-- Ground -->
<ellipse cx="${cx}" cy="${h*0.78}" rx="${w*0.55}" ry="${h*0.14}" fill="url(#rl-grass-g)"/>
<rect x="0" y="${h*0.78}" width="${w}" height="${h*0.25}" fill="#15803d" rx="0 0 12 12"/>

<!-- Sun -->
<g class="rl-sun-rays">
  ${Array.from({length:12}, (_,i) => {
    const angle = i * 30 * Math.PI / 180;
    const x1 = w*0.82 + Math.cos(angle) * 26;
    const y1 = h*0.2 + Math.sin(angle) * 26;
    const x2 = w*0.82 + Math.cos(angle) * 38;
    const y2 = h*0.2 + Math.sin(angle) * 38;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#fef08a" stroke-width="3" stroke-linecap="round"/>`;
  }).join("")}
</g>
<circle cx="${w*0.82}" cy="${h*0.2}" r="22" fill="#fbbf24"/>
<circle cx="${w*0.82}" cy="${h*0.2}" r="16" fill="#fef08a"/>

<!-- Trees / bushes -->
<!-- Big tree center-left -->
<rect x="${cx - w*0.1 - 6}" y="${h*0.52}" width="12" height="${h*0.28}" rx="4" fill="#92400e"/>
<ellipse cx="${cx - w*0.1}" cy="${h*0.45}" rx="${w*0.1}" ry="${h*0.12}" fill="#16a34a"/>
<ellipse cx="${cx - w*0.1}" cy="${h*0.38}" rx="${w*0.07}" ry="${h*0.09}" fill="#22c55e"/>

<!-- Bush right -->
<ellipse cx="${cx + w*0.2}" cy="${h*0.68}" rx="${w*0.12}" ry="${h*0.08}" fill="#15803d"/>
<ellipse cx="${cx + w*0.2}" cy="${h*0.63}" rx="${w*0.08}" ry="${h*0.06}" fill="#16a34a"/>

<!-- Animated grass blades -->
<g transform="translate(${w*0.38}, ${h*0.76})">
  <path d="M0 0 Q-4 -18 -2 -32" stroke="#4ade80" stroke-width="3" stroke-linecap="round" fill="none" class="rl-g1"/>
</g>
<g transform="translate(${w*0.44}, ${h*0.76})">
  <path d="M0 0 Q4 -20 0 -36" stroke="#86efac" stroke-width="3" stroke-linecap="round" fill="none" class="rl-g2"/>
</g>
<g transform="translate(${w*0.5}, ${h*0.76})">
  <path d="M0 0 Q-3 -16 1 -28" stroke="#4ade80" stroke-width="3" stroke-linecap="round" fill="none" class="rl-g3"/>
</g>

<!-- Lawnmower moving across -->
<g class="rl-mow" transform="translate(${w*0.12}, ${h*0.72})">
  <!-- Body -->
  <rect x="0" y="0" width="60" height="24" rx="8" fill="#1e3a5f" stroke="#3b82f6" stroke-width="1.5"/>
  <!-- Engine bump -->
  <rect x="14" y="-10" width="24" height="16" rx="6" fill="#334155" stroke="#475569" stroke-width="1"/>
  <!-- Handle -->
  <path d="M50 0 L60 -20 L80 -20" stroke="#475569" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <!-- Wheels -->
  <circle cx="12" cy="24" r="12" fill="#374151" stroke="#6b7280" stroke-width="2"/>
  <circle cx="12" cy="24" r="5" fill="#6b7280"/>
  <circle cx="48" cy="24" r="12" fill="#374151" stroke="#6b7280" stroke-width="2"/>
  <circle cx="48" cy="24" r="5" fill="#6b7280"/>
  <!-- Blade indicator -->
  <rect x="2" y="28" width="56" height="4" rx="2" fill="#22c55e" opacity="0.7"/>
</g>

<!-- Flowers -->
${[[w*0.62, h*0.72], [w*0.68, h*0.7], [w*0.72, h*0.73]].map(([fx, fy]) => `
  <circle cx="${fx}" cy="${fy}" r="5" fill="#f472b6"/>
  <circle cx="${fx}" cy="${fy}" r="3" fill="#fbbf24"/>
  <line x1="${fx}" y1="${fy + 5}" x2="${fx}" y2="${fy + 18}" stroke="#16a34a" stroke-width="2" stroke-linecap="round"/>
`).join("")}

</svg>`;
}

// ─────────────────────────────────────────────────────────────
// CLEANING ANIMATION
// Animated: bubbles floating up, mop sweeping, sparkle
// ─────────────────────────────────────────────────────────────
function cleaningAnimation(w: number, h: number): string {
  const cx = w * 0.5;
  const cy = h * 0.5;
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Professional cleaning service illustration">
<defs>
  <style>
    @keyframes rl-bubble { 0%{opacity:0;transform:translateY(0) scale(.5)} 30%{opacity:.8} 100%{opacity:0;transform:translateY(-${h*0.55}px) scale(1.2)} }
    @keyframes rl-sparkle { 0%,100%{opacity:0;transform:scale(0)} 50%{opacity:1;transform:scale(1)} }
    @keyframes rl-mop { 0%,100%{transform:rotate(-15deg)} 50%{transform:rotate(15deg)} }
    .rl-b1{animation:rl-bubble 2.4s ease-out infinite}
    .rl-b2{animation:rl-bubble 2.4s ease-out .5s infinite}
    .rl-b3{animation:rl-bubble 2.4s ease-out 1s infinite}
    .rl-b4{animation:rl-bubble 2.4s ease-out 1.5s infinite}
    .rl-b5{animation:rl-bubble 2.4s ease-out 2s infinite}
    .rl-sp1{animation:rl-sparkle 1.5s ease-in-out infinite}
    .rl-sp2{animation:rl-sparkle 1.5s ease-in-out .5s infinite}
    .rl-sp3{animation:rl-sparkle 1.5s ease-in-out 1s infinite}
    .rl-mop-tool{animation:rl-mop 2s ease-in-out infinite;transform-origin:${cx}px ${cy*0.5}px}
  </style>
  <linearGradient id="rl-bg-c" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#0f2a35"/>
    <stop offset="100%" stop-color="#0d9488"/>
  </linearGradient>
</defs>

<rect width="${w}" height="${h}" fill="url(#rl-bg-c)" rx="12"/>

<!-- Floor surface -->
<rect x="0" y="${h*0.74}" width="${w}" height="${h*0.3}" fill="#134e4a" rx="0 0 12 12"/>
<rect x="0" y="${h*0.74}" width="${w}" height="3" fill="#2dd4bf" opacity="0.5"/>

<!-- Window being cleaned -->
<rect x="${w*0.12}" y="${h*0.1}" width="${w*0.35}" height="${h*0.52}" rx="6" fill="#0c4a6e" stroke="#0ea5e9" stroke-width="2"/>
<!-- Window panes -->
<line x1="${w*0.12 + w*0.175}" y1="${h*0.1}" x2="${w*0.12 + w*0.175}" y2="${h*0.62}" stroke="#0ea5e9" stroke-width="2"/>
<line x1="${w*0.12}" y1="${h*0.1 + h*0.26}" x2="${w*0.47}" y2="${h*0.1 + h*0.26}" stroke="#0ea5e9" stroke-width="2"/>
<!-- Clean streak on window -->
<path d="M${w*0.17} ${h*0.16} Q${w*0.24} ${h*0.3} ${w*0.2} ${h*0.55}" stroke="rgba(255,255,255,0.3)" stroke-width="12" stroke-linecap="round" fill="none"/>
<!-- Reflection shine -->
<path d="M${w*0.28} ${h*0.13} Q${w*0.38} ${h*0.25} ${w*0.34} ${h*0.55}" stroke="rgba(255,255,255,0.18)" stroke-width="8" stroke-linecap="round" fill="none"/>

<!-- Mop / squeegee tool -->
<g class="rl-mop-tool">
  <!-- Handle -->
  <rect x="${cx - 4}" y="${cy*0.3}" width="8" height="${cy*1.2}" rx="4" fill="#64748b"/>
  <!-- Mop head -->
  <rect x="${cx - 28}" y="${cy*0.3 + cy*1.2 - 10}" width="56" height="16" rx="4" fill="#2dd4bf" stroke="#0d9488" stroke-width="1.5"/>
  ${Array.from({length:8}, (_,i) => `<line x1="${cx - 24 + i*7}" y1="${cy*0.3 + cy*1.2 + 6}" x2="${cx - 22 + i*7}" y2="${cy*0.3 + cy*1.2 + 22}" stroke="#5eead4" stroke-width="2" stroke-linecap="round"/>`).join("")}
</g>

<!-- Bubbles floating up from floor -->
<circle cx="${w*0.55}" cy="${h*0.74}" r="10" fill="none" stroke="#2dd4bf" stroke-width="1.5" opacity="0.8" class="rl-b1"/>
<circle cx="${w*0.62}" cy="${h*0.74}" r="6" fill="none" stroke="#2dd4bf" stroke-width="1.5" opacity="0.8" class="rl-b2"/>
<circle cx="${w*0.7}" cy="${h*0.74}" r="14" fill="none" stroke="#5eead4" stroke-width="1.5" opacity="0.7" class="rl-b3"/>
<circle cx="${w*0.58}" cy="${h*0.74}" r="8" fill="none" stroke="#2dd4bf" stroke-width="1.5" opacity="0.8" class="rl-b4"/>
<circle cx="${w*0.65}" cy="${h*0.74}" r="5" fill="none" stroke="#2dd4bf" stroke-width="1.5" opacity="0.6" class="rl-b5"/>

<!-- Sparkle stars at clean spots -->
<g class="rl-sp1" transform="translate(${w*0.22}, ${h*0.2})">
  <path d="M0 -10 L2 -2 L10 0 L2 2 L0 10 L-2 2 L-10 0 L-2 -2 Z" fill="#fef08a"/>
</g>
<g class="rl-sp2" transform="translate(${w*0.37}, ${h*0.15})">
  <path d="M0 -7 L1.5 -1.5 L7 0 L1.5 1.5 L0 7 L-1.5 1.5 L-7 0 L-1.5 -1.5 Z" fill="#fef08a"/>
</g>
<g class="rl-sp3" transform="translate(${w*0.28}, ${h*0.45})">
  <path d="M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2 Z" fill="#fef08a"/>
</g>

<!-- Spray bottle -->
<g transform="translate(${w*0.74}, ${h*0.3})">
  <rect x="0" y="10" width="30" height="44" rx="6" fill="#0e7490" stroke="#22d3ee" stroke-width="1.5"/>
  <rect x="0" y="0" width="22" height="14" rx="4" fill="#0c4a6e" stroke="#22d3ee" stroke-width="1"/>
  <path d="M22 6 L38 6 L44 16" stroke="#22d3ee" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <!-- Spray droplets -->
  <circle cx="48" cy="14" r="2" fill="#67e8f9" opacity="0.8"/>
  <circle cx="52" cy="10" r="1.5" fill="#67e8f9" opacity="0.6"/>
  <circle cx="50" cy="18" r="1.5" fill="#67e8f9" opacity="0.7"/>
  <circle cx="54" cy="15" r="1" fill="#67e8f9" opacity="0.5"/>
</g>

</svg>`;
}

// ─────────────────────────────────────────────────────────────
// AUTO / MECHANIC ANIMATION
// Animated: wrench spinning, engine piston, gear rotating
// ─────────────────────────────────────────────────────────────
function autoAnimation(w: number, h: number): string {
  const cx = w * 0.5;
  const cy = h * 0.5;
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Auto repair and mechanic service illustration">
<defs>
  <style>
    @keyframes rl-gear1 { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes rl-gear2 { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
    @keyframes rl-piston { 0%,100%{transform:translateY(-10px)} 50%{transform:translateY(10px)} }
    @keyframes rl-wrench-spin { 0%,100%{transform:rotate(-20deg)} 50%{transform:rotate(20deg)} }
    .rl-gear-main{animation:rl-gear1 4s linear infinite;transform-origin:${cx}px ${cy}px}
    .rl-gear-small{animation:rl-gear2 2.2s linear infinite;transform-origin:${cx + w*0.2}px ${cy - h*0.05}px}
    .rl-piston{animation:rl-piston 1s ease-in-out infinite}
    .rl-wrench-a{animation:rl-wrench-spin 2s ease-in-out infinite;transform-origin:${cx - w*0.2}px ${cy + h*0.1}px}
  </style>
  <linearGradient id="rl-bg-a" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#0f172a"/>
    <stop offset="100%" stop-color="#7f1d1d"/>
  </linearGradient>
</defs>

<rect width="${w}" height="${h}" fill="url(#rl-bg-a)" rx="12"/>
<path d="M0 ${h*0.25} H${w} M0 ${h*0.5} H${w} M0 ${h*0.75} H${w} M${w*0.25} 0 V${h} M${w*0.5} 0 V${h} M${w*0.75} 0 V${h}" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>

<!-- Main gear -->
<g class="rl-gear-main">
  ${Array.from({length:12}, (_,i) => {
    const angle = i * 30 * Math.PI / 180;
    const x = cx + Math.cos(angle) * 68;
    const y = cy + Math.sin(angle) * 68;
    return `<rect x="${x - 7}" y="${y - 12}" width="14" height="24" rx="3" fill="#374151" transform="rotate(${i * 30} ${cx} ${cy})"/>`;
  }).join("")}
  <circle cx="${cx}" cy="${cy}" r="58" fill="none" stroke="#374151" stroke-width="16"/>
  <circle cx="${cx}" cy="${cy}" r="42" fill="#1f2937"/>
  <circle cx="${cx}" cy="${cy}" r="28" fill="#111827" stroke="#4b5563" stroke-width="2"/>
  <circle cx="${cx}" cy="${cy}" r="10" fill="#6b7280"/>
</g>

<!-- Small gear top right -->
<g class="rl-gear-small">
  ${Array.from({length:8}, (_,i) => {
    const angle = i * 45 * Math.PI / 180;
    const gx = cx + w*0.2;
    const gy = cy - h*0.05;
    const x = gx + Math.cos(angle) * 36;
    const y = gy + Math.sin(angle) * 36;
    return `<rect x="${x - 5}" y="${y - 8}" width="10" height="16" rx="2" fill="#374151" transform="rotate(${i * 45} ${gx} ${gy})"/>`;
  }).join("")}
  <circle cx="${cx + w*0.2}" cy="${cy - h*0.05}" r="30" fill="none" stroke="#374151" stroke-width="10"/>
  <circle cx="${cx + w*0.2}" cy="${cy - h*0.05}" r="18" fill="#1f2937"/>
  <circle cx="${cx + w*0.2}" cy="${cy - h*0.05}" r="7" fill="#6b7280"/>
</g>

<!-- Piston cylinder left -->
<g transform="translate(${w*0.08}, ${cy - h*0.2})">
  <rect x="0" y="0" width="28" height="${h*0.42}" rx="4" fill="#1e293b" stroke="#475569" stroke-width="2"/>
  <!-- Piston head -->
  <g class="rl-piston">
    <rect x="2" y="20" width="24" height="20" rx="3" fill="#6b7280" stroke="#94a3b8" stroke-width="1.5"/>
    <rect x="6" y="23" width="16" height="14" rx="2" fill="#4b5563"/>
    <!-- Piston rod -->
    <rect x="11" y="40" width="6" height="${h*0.18}" rx="3" fill="#94a3b8"/>
  </g>
</g>

<!-- Wrench tool lower left -->
<g class="rl-wrench-a">
  <rect x="${cx - w*0.28}" y="${cy + h*0.04}" width="12" height="${h*0.38}" rx="6" fill="#475569" stroke="#64748b" stroke-width="1.5"/>
  <path d="M${cx - w*0.34} ${cy + h*0.04} A18 18 0 0 1 ${cx - w*0.16} ${cy + h*0.04} L${cx - w*0.2} ${cy + h*0.1} A10 10 0 0 0 ${cx - w*0.3} ${cy + h*0.1} Z" fill="#374151" stroke="#64748b" stroke-width="1.5"/>
  <rect x="${cx - w*0.27}" y="${cy + h*0.04}" width="14" height="14" rx="3" fill="#1e293b"/>
</g>

<!-- Car silhouette faint in background -->
<g opacity="0.12">
  <path d="M${w*0.12} ${h*0.7} L${w*0.22} ${h*0.55} L${w*0.78} ${h*0.55} L${w*0.88} ${h*0.7} Z" fill="#94a3b8"/>
  <circle cx="${w*0.25}" cy="${h*0.7}" r="${h*0.08}" fill="#475569"/>
  <circle cx="${w*0.75}" cy="${h*0.7}" r="${h*0.08}" fill="#475569"/>
</g>

<!-- Diagnostic screen -->
<g transform="translate(${w*0.72}, ${h*0.58})">
  <rect width="56" height="38" rx="5" fill="#0f172a" stroke="#3b82f6" stroke-width="1.5"/>
  <rect x="4" y="6" width="12" height="6" rx="2" fill="#22c55e"/>
  <rect x="4" y="16" width="20" height="6" rx="2" fill="#22c55e"/>
  <rect x="4" y="26" width="8" height="6" rx="2" fill="#f87171"/>
  <rect x="22" y="6" width="28" height="4" rx="1" fill="#1d4ed8"/>
  <rect x="22" y="14" width="22" height="4" rx="1" fill="#1d4ed8"/>
  <rect x="22" y="22" width="26" height="4" rx="1" fill="#1d4ed8"/>
</g>

</svg>`;
}

// ─────────────────────────────────────────────────────────────
// GENERAL CONTRACTOR ANIMATION
// Animated: hammer, blueprint, tools
// ─────────────────────────────────────────────────────────────
function generalAnimation(w: number, h: number): string {
  const cx = w * 0.5;
  const cy = h * 0.5;
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Professional contractor service illustration">
<defs>
  <style>
    @keyframes rl-hammer-g { 0%,100%{transform:rotate(-30deg)} 50%{transform:rotate(20deg)} }
    @keyframes rl-ruler-g { 0%{opacity:.5} 50%{opacity:1} 100%{opacity:.5} }
    @keyframes rl-gear-g { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes rl-check { 0%{stroke-dashoffset:40} 100%{stroke-dashoffset:0} }
    .rl-hammer-g{animation:rl-hammer-g 1.4s ease-in-out infinite;transform-origin:${cx}px ${cy}px}
    .rl-ruler-g{animation:rl-ruler-g 2.5s ease-in-out infinite}
    .rl-gear-g{animation:rl-gear-g 5s linear infinite;transform-origin:${w*0.78}px ${h*0.3}px}
    .rl-check{animation:rl-check 1.5s ease-in-out infinite;stroke-dasharray:40}
  </style>
  <linearGradient id="rl-bg-g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#0f172a"/>
    <stop offset="100%" stop-color="#312e81"/>
  </linearGradient>
</defs>

<rect width="${w}" height="${h}" fill="url(#rl-bg-g)" rx="12"/>
<path d="M0 ${h*0.25} H${w} M0 ${h*0.5} H${w} M0 ${h*0.75} H${w} M${w*0.25} 0 V${h} M${w*0.5} 0 V${h} M${w*0.75} 0 V${h}" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>

<!-- Blueprint background -->
<rect x="${w*0.1}" y="${h*0.1}" width="${w*0.55}" height="${h*0.72}" rx="6" fill="#1e3a5f" stroke="#3b82f6" stroke-width="1.5"/>
<!-- Blueprint grid lines -->
<g stroke="#1d4ed8" stroke-width="0.8" opacity="0.7">
  ${Array.from({length:8}, (_,i) => `<line x1="${w*0.1}" y1="${h*0.1 + i*h*0.09}" x2="${w*0.65}" y2="${h*0.1 + i*h*0.09}"/>`).join("")}
  ${Array.from({length:7}, (_,i) => `<line x1="${w*0.1 + i*w*0.08}" y1="${h*0.1}" x2="${w*0.1 + i*w*0.08}" y2="${h*0.82}"/>`).join("")}
</g>
<!-- Blueprint house outline drawing -->
<g stroke="#60a5fa" stroke-width="2" fill="none">
  <polygon points="${w*0.22},${h*0.28} ${cx*0.7},${h*0.19} ${w*0.55},${h*0.28}"/>
  <rect x="${w*0.22}" y="${h*0.28}" width="${w*0.33}" height="${h*0.32}"/>
  <rect x="${w*0.35}" y="${h*0.42}" width="${w*0.08}" height="${h*0.18}"/>
  <rect x="${w*0.25}" y="${h*0.32}" width="${w*0.07}" height="${h*0.1}"/>
  <rect x="${w*0.46}" y="${h*0.32}" width="${w*0.07}" height="${h*0.1}"/>
</g>
<!-- Dimensions arrows on blueprint -->
<line x1="${w*0.12}" y1="${h*0.6}" x2="${w*0.12}" y2="${h*0.82}" stroke="#fbbf24" stroke-width="1.5" marker-start="url(#arr)" marker-end="url(#arr)" class="rl-ruler-g"/>
<line x1="${w*0.22}" y1="${h*0.84}" x2="${w*0.55}" y2="${h*0.84}" stroke="#fbbf24" stroke-width="1.5" class="rl-ruler-g"/>
<text x="${w*0.37}" y="${h*0.9}" font-size="10" fill="#fbbf24" text-anchor="middle" font-family="monospace" class="rl-ruler-g">24 ft</text>

<!-- Hammer -->
<g class="rl-hammer-g">
  <rect x="${cx + w*0.04}" y="${cy - h*0.05}" width="10" height="${h*0.38}" rx="5" fill="#92400e"/>
  <rect x="${cx}" y="${cy - h*0.12}" width="30" height="16" rx="5" fill="#374151" stroke="#6b7280" stroke-width="1.5"/>
  <rect x="${cx + 26}" y="${cy - h*0.08}" width="6" height="8" rx="2" fill="#475569"/>
</g>

<!-- Gear -->
<g class="rl-gear-g">
  ${Array.from({length:8}, (_,i) => {
    const angle = i * 45 * Math.PI / 180;
    const gx = w*0.78, gy = h*0.3;
    const x = gx + Math.cos(angle) * 24;
    const y = gy + Math.sin(angle) * 24;
    return `<rect x="${x-4}" y="${y-7}" width="8" height="14" rx="2" fill="#4f46e5" transform="rotate(${i*45} ${gx} ${gy})"/>`;
  }).join("")}
  <circle cx="${w*0.78}" cy="${h*0.3}" r="18" fill="#312e81" stroke="#4f46e5" stroke-width="8"/>
  <circle cx="${w*0.78}" cy="${h*0.3}" r="7" fill="#818cf8"/>
</g>

<!-- Checkmark completion badge -->
<g transform="translate(${w*0.7}, ${h*0.56})">
  <circle cx="22" cy="22" r="22" fill="#14532d" stroke="#4ade80" stroke-width="2"/>
  <path d="M10 22 L18 30 L34 14" stroke="#4ade80" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none" class="rl-check"/>
</g>

<!-- Ruler tool bottom -->
<g transform="translate(${w*0.1}, ${h*0.86})">
  <rect width="${w*0.55}" height="12" rx="3" fill="#374151" stroke="#6b7280" stroke-width="1"/>
  ${Array.from({length:11}, (_,i) => `<rect x="${10 + i*w*0.047}" y="0" width="1.5" height="${i%5===0 ? 12 : 7}" fill="#9ca3af"/>`).join("")}
</g>

</svg>`;
}

// ─────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────

/**
 * Generates a trade-specific animated SVG illustration for the hero section.
 * Returns a complete, self-contained SVG string with inline CSS animations.
 */
export function generateTradeHeroAnimation(options: TradeHeroAnimationOptions): string {
  const category = detectTradeCategory(options.trade || "general");
  const w = options.width || 560;
  const h = options.height || 420;

  switch (category) {
    case "plumber":     return plumberAnimation(w, h);
    case "electrician": return electricianAnimation(w, h);
    case "hvac":        return hvacAnimation(w, h);
    case "roofing":     return roofingAnimation(w, h);
    case "tree":        return treeAnimation(w, h);
    case "landscaping": return landscapingAnimation(w, h);
    case "cleaning":    return cleaningAnimation(w, h);
    case "auto":        return autoAnimation(w, h);
    default:            return generalAnimation(w, h);
  }
}

/**
 * Returns the trade hero animation as an inline HTML element
 * suitable for direct injection into the hero section.
 * Wrapped in a div for layout control.
 */
export function generateTradeHeroAnimationHtml(options: TradeHeroAnimationOptions): string {
  const svg = generateTradeHeroAnimation(options);
  return `<div class="hero-trade-animation" aria-hidden="true" role="presentation">${svg}</div>`;
}
