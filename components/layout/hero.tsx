"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, FlaskConical } from "lucide-react";

const STATS = [
  { value: "12,400+", label: "Active learners" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "340+", label: "Simulations" },
];

function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const onScroll = () => setY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return y;
}

export function HeroSection() {
  const [mounted, setMounted] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { setMounted(true); }, []);

  return (
    <section className="relative flex min-h-[92vh] items-center justify-center px-4 pt-16 pb-24 overflow-hidden">
      {/* ── Ambient background depth ── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.025]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hero-bg-grid" width="36" height="36" patternUnits="userSpaceOnUse">
                <path d="M 36 0 L 0 0 0 36" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-bg-grid)" />
          </svg>
        </div>
        {/* Radial glow blobs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/8 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-secondary/6 blur-[100px]" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-accent/5 blur-[80px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        {/* Live badge */}
        <div
          className={`mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary transition-all duration-700 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
          style={{ transitionDelay: "100ms" }}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          Neural Engine v3.2 — Now Live
        </div>

        {/* Main Title */}
        <h1
          ref={headingRef}
          className={`text-glow text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl transition-all duration-700 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: "200ms" }}
        >
          Decode Reality Through{" "}
          <span className="bg-gradient-to-r from-primary via-emerald-300 to-secondary bg-clip-text text-transparent">
            Neural Mastery
          </span>
        </h1>

        {/* Description */}
        <p
          className={`mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl transition-all duration-700 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: "350ms" }}
        >
          An AI-driven cognitive engine that transforms how you perceive, learn,
          and evolve. Unlock the patterns hidden within complexity through
          quantum-enhanced neural pathways.
        </p>

        {/* CTAs */}
        <div
          className={`mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center transition-all duration-700 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: "500ms" }}
        >
          <Link
            href="/auth/register"
            className="group relative inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:shadow-[0_0_36px_hsl(var(--primary)/0.3)] hover:scale-[1.02] active:scale-[0.98]"
          >
            Begin Your Evolution
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-border px-8 py-3.5 text-sm font-medium text-foreground transition-all hover:bg-muted/50 hover:border-muted-foreground/30"
          >
            <FlaskConical size={14} className="text-muted-foreground" />
            Explore Labs
          </Link>
        </div>

        {/* Stats strip */}
        <div
          className={`mt-16 flex items-center justify-center gap-8 text-sm text-muted-foreground transition-all duration-700 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: "650ms" }}
        >
          {STATS.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <span className="text-base font-bold text-foreground tabular-nums">{s.value}</span>
              <span className="text-xs text-muted-foreground/70">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}