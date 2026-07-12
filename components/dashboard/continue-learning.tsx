"use client";

import { Play, ArrowRight, Compass } from "lucide-react";
import Link from "next/link";
import type { DashboardSummary } from "@/app/api/dashboard/summary/route";

export function ContinueLearning({
  activePath,
}: {
  activePath: DashboardSummary["activePath"];
}) {
  if (!activePath) {
    return (
      <div className="relative rounded-[var(--radius-lg)] border border-border bg-card p-6 min-h-[200px] flex flex-col items-center justify-center text-center gap-4 animate-fade-in shadow-sm">
        {/* Subtle grid pattern behind */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" aria-hidden="true">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="empty-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#empty-grid)" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col items-center max-w-[320px] gap-2">
          <div className="p-3 rounded-full bg-white/3 border border-white/5 text-muted-foreground mb-1">
            <Compass size={20} className="text-secondary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">No Active Path</h3>
          <p className="text-[12px] text-muted-foreground leading-normal">
            Begin your scientific journey by enrolling in an exploratory neural learning path.
          </p>
          <Link
            href="/dashboard/neural-paths"
            className="mt-2 inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-1.5 rounded-[var(--radius-sm)] text-[12px] font-semibold transition-all hover:opacity-90 active:scale-95 shadow-[0_0_16px_rgba(var(--primary),0.2)]"
          >
            Explore Paths <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-[var(--radius-lg)] overflow-hidden border border-white/8 bg-card min-h-[200px] animate-fade-in shadow-md group">
      {/* Cinematic Background Gradient Mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background/90 to-secondary/8 z-0 pointer-events-none" />
      
      {/* Decorative Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.04] z-0 pointer-events-none group-hover:opacity-[0.06] transition-opacity duration-300" aria-hidden="true">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hero-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 h-full flex flex-col justify-between min-h-[200px]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] uppercase tracking-[0.2em] text-primary font-semibold">
              Continue Exploring
            </span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-semibold capitalize">
              {activePath.domain}
            </span>
          </div>
          <h2 className="text-xl font-bold text-foreground leading-tight">
            {activePath.title}
          </h2>
          {activePath.currentChapterTitle && (
            <p className="text-[12px] text-muted-foreground mt-1">
              Current Chapter: <span className="text-foreground font-medium">{activePath.currentChapterTitle}</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 mt-6 flex-wrap md:flex-nowrap">
          <Link
            href={`/dashboard/neural-paths`}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-[var(--radius-md)] text-[12px] font-semibold transition-all hover:opacity-95 active:scale-95 shadow-[0_4px_12px_rgba(var(--primary),0.15)] shrink-0"
          >
            <Play size={12} fill="currentColor" /> Resume Exploration
          </Link>
          <div className="flex-1 min-w-[140px] space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Path Progress</span>
              <span className="font-semibold text-foreground tabular-nums">
                {activePath.overallCompletion}%
              </span>
            </div>
            <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${activePath.overallCompletion}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}