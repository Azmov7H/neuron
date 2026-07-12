"use client";

import { Play, ArrowRight, Compass } from "lucide-react";
import Link from "next/link";
import type { DashboardSummary } from "@/app/api/dashboard/summary/route";
import { ProgressRing } from "@/components/ui/progress-ring";
import { DomainBadge } from "@/components/ui/domain-badge";
import { cn } from "@/lib/utils";

// ── Domain accent colours keyed off the SciOS token names ────────────────────
const DOMAIN_COLOR: Record<string, string> = {
  physics:    "hsl(var(--sci-physics))",
  biology:    "hsl(var(--sci-biology))",
  math:       "hsl(var(--sci-math))",
  mathematics:"hsl(var(--sci-math))",
  quantum:    "hsl(var(--sci-quantum))",
  space:      "hsl(var(--sci-space))",
  tech:       "hsl(var(--sci-tech))",
  technology: "hsl(var(--sci-tech))",
  ai:         "hsl(var(--sci-ai))",
  chemistry:  "hsl(var(--sci-chemistry))",
  anatomy:    "hsl(var(--sci-anatomy))",
  astronomy:  "hsl(var(--sci-astronomy))",
};

function getDomainColor(domain: string | null | undefined) {
  if (!domain) return "hsl(var(--primary))";
  return DOMAIN_COLOR[domain.toLowerCase()] ?? "hsl(var(--primary))";
}

export function ContinueLearning({
  activePath,
}: {
  activePath: DashboardSummary["activePath"];
}) {
  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!activePath) {
    return (
      <div className="relative rounded-[var(--radius-lg)] border border-border bg-card p-6 min-h-[200px] flex flex-col items-center justify-center text-center gap-4 animate-fade-in overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.035] pointer-events-none" aria-hidden="true">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="empty-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#empty-grid)" />
          </svg>
        </div>
        <div className="relative z-10 flex flex-col items-center max-w-[320px] gap-3">
          <div className="p-3 rounded-full bg-white/3 border border-white/5 text-muted-foreground mb-1">
            <Compass size={20} className="text-secondary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">No Active Path</h3>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            Begin your scientific journey by enrolling in a neural learning path.
          </p>
          <Link
            href="/dashboard/neural-paths"
            className="mt-1 inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-[var(--radius-sm)] text-[12px] font-semibold transition-all hover:opacity-90 active:scale-95 shadow-[0_0_16px_hsl(var(--primary)/0.2)]"
          >
            Explore Paths <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    );
  }

  const domainColor = getDomainColor(activePath.domain);
  const pct = activePath.overallCompletion;

  return (
    <div className="relative rounded-[var(--radius-lg)] overflow-hidden border border-white/8 bg-card min-h-[220px] animate-fade-in shadow-md group">
      {/* Cinematic Background — domain-coloured ambient mesh */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70% 80% at 85% 50%, ${domainColor}14 0%, transparent 70%),
                       linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--background)/0.7) 100%)`,
        }}
      />

      {/* Decorative grid overlay */}
      <div className="absolute inset-0 opacity-[0.035] z-0 pointer-events-none" aria-hidden="true">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="cl-grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M 28 0 L 0 0 0 28" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cl-grid)" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 h-full flex items-start gap-6 min-h-[220px]">
        {/* Left: Progress ring */}
        <div className="shrink-0 flex flex-col items-center gap-2 pt-1">
          <ProgressRing
            value={pct}
            size={72}
            strokeWidth={4}
            color={domainColor}
            label={
              <span
                className="text-[14px] font-bold tabular-nums"
                style={{ color: domainColor }}
              >
                {pct}%
              </span>
            }
          />
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-semibold">
            Progress
          </span>
        </div>

        {/* Right: Path info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between h-full min-h-[140px]">
          <div>
            {/* Domain label + badge */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] uppercase tracking-[0.2em] font-bold" style={{ color: domainColor }}>
                Continue Exploring
              </span>
              <DomainBadge domain={activePath.domain ?? "science"} size="xs" />
            </div>

            {/* Title */}
            <h2 className="text-lg font-bold text-foreground leading-snug mb-1 line-clamp-2">
              {activePath.title}
            </h2>

            {/* Current chapter */}
            {activePath.currentChapterTitle && (
              <p className="text-[11px] text-muted-foreground mt-1">
                <span className="text-muted-foreground/50">Current chapter —</span>{" "}
                <span className="text-foreground/80 font-medium">{activePath.currentChapterTitle}</span>
              </p>
            )}
          </div>

          {/* CTA */}
          <div className="mt-5">
            <Link
              href="/dashboard/neural-paths"
              className={cn(
                "inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-md)]",
                "text-[12px] font-semibold transition-all active:scale-95",
                "text-primary-foreground shadow-md"
              )}
              style={{
                background: domainColor,
                boxShadow: `0 4px 16px ${domainColor}33`,
              }}
            >
              <Play size={11} fill="currentColor" /> Resume Exploration
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}