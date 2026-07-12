"use client";

import { Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { DashboardSummary } from "@/app/api/dashboard/summary/route";
import { DomainBadge } from "@/components/ui/domain-badge";

function timeAgo(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const DOMAIN_BORDER: Record<string, string> = {
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

function getBorderColor(domain?: string | null) {
  if (!domain) return "hsl(var(--primary)/0.5)";
  return DOMAIN_BORDER[domain.toLowerCase()] ?? "hsl(var(--primary)/0.5)";
}

type Discovery = DashboardSummary["recentDiscoveries"][number];

export function RecentDiscoveries({
  discoveries,
}: {
  discoveries: Discovery[];
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-card p-5 animate-fade-in shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-semibold text-foreground">Recent Discoveries</h3>
        <Link
          href="/dashboard/explore"
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          View all <ArrowRight size={10} />
        </Link>
      </div>

      {discoveries.length === 0 ? (
        <p className="text-[12px] text-muted-foreground/50 text-center py-6">
          No discoveries yet — start learning to see activity here.
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {discoveries.map((d, i) => (
            <div
              // concept+domain is the natural composite key since there's no id
              key={`${d.concept}-${d.domain}-${i}`}
              className="group relative flex items-start gap-3 py-2.5 px-3 rounded-[var(--radius-sm)] hover:bg-white/3 transition-all duration-200"
            >
              {/* Domain-coloured left accent */}
              <div
                className="absolute left-0 top-2 bottom-2 w-[2px] rounded-r transition-opacity duration-300 opacity-50 group-hover:opacity-100"
                style={{ background: getBorderColor(d.domain) }}
              />

              {/* Content */}
              <div className="flex-1 min-w-0 pl-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[12px] text-foreground font-medium leading-snug line-clamp-2">
                    {d.concept}
                  </p>
                  <Link
                    href="/dashboard/explore"
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-primary hover:text-primary/80 mt-0.5"
                  >
                    Review →
                  </Link>
                </div>

                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {d.domain && <DomainBadge domain={d.domain} size="xs" />}
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
                    <Clock size={9} />
                    {timeAgo(d.discoveredAt)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}