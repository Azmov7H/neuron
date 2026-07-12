"use client";

import { FlaskConical, Lightbulb, Brain, Orbit, Dna, Telescope, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { DashboardSummary } from "@/app/api/dashboard/summary/route";

function getDiscoveryIcon(domain: string) {
  const dom = domain.toLowerCase();
  if (dom.includes("physic")) return FlaskConical;
  if (dom.includes("biolog")) return Dna;
  if (dom.includes("ai") || dom.includes("neural") || dom.includes("cognit")) return Brain;
  if (dom.includes("quantum")) return Orbit;
  if (dom.includes("astro") || dom.includes("space")) return Telescope;
  return Lightbulb;
}

function getDomainColorClass(domain: string) {
  const dom = domain.toLowerCase();
  if (dom.includes("physic")) return "text-sci-physics bg-sci-physics/8";
  if (dom.includes("biolog")) return "text-sci-biology bg-sci-biology/8";
  if (dom.includes("ai") || dom.includes("neural") || dom.includes("cognit")) return "text-sci-ai bg-sci-ai/8";
  if (dom.includes("quantum")) return "text-sci-quantum bg-sci-quantum/8";
  if (dom.includes("astro") || dom.includes("space")) return "text-sci-astronomy bg-sci-astronomy/8";
  return "text-muted-foreground bg-white/4";
}

export function RecentDiscoveries({
  discoveries,
}: {
  discoveries: DashboardSummary["recentDiscoveries"];
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-card p-5 animate-fade-in shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-semibold text-foreground">Recent Discoveries</h3>
        <Link
          href="/dashboard/evolution"
          className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors inline-flex items-center gap-0.5"
        >
          View all <ArrowRight size={10} />
        </Link>
      </div>

      {!discoveries || discoveries.length === 0 ? (
        <p className="text-[11px] text-muted-foreground/50 text-center py-6">
          No recent discoveries. Keep exploring!
        </p>
      ) : (
        <div className="space-y-1">
          {discoveries.slice(0, 5).map((d, i) => {
            const Icon = getDiscoveryIcon(d.domain);
            const colorClass = getDomainColorClass(d.domain);
            const dateLabel = new Date(d.discoveredAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            });

            return (
              <div
                key={`${d.concept}-${i}`}
                className="flex items-center gap-3 py-2 px-2.5 rounded-[var(--radius-sm)] hover:bg-white/3 transition-colors cursor-pointer group"
              >
                <div className={`p-1.5 rounded-[var(--radius-sm)] shrink-0 transition-transform group-hover:scale-105 ${colorClass}`}>
                  <Icon size={12} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {d.concept}
                  </p>
                  <p className="text-[9px] text-muted-foreground/50 capitalize font-medium">
                    {d.domain}
                  </p>
                </div>
                <span className="text-[9px] text-muted-foreground/40 shrink-0 font-medium tabular-nums">
                  {dateLabel}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}