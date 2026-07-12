"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { DashboardSummary } from "@/app/api/dashboard/summary/route";
import { Stepper } from "@/components/ui/stepper";
import type { StepperItem } from "@/components/ui/stepper";
import { DomainBadge } from "@/components/ui/domain-badge";

export function ActiveNeuralPath({
  activePath,
}: {
  activePath: DashboardSummary["activePath"];
}) {
  if (!activePath) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-border bg-card p-5 animate-fade-in flex flex-col gap-3 min-h-[160px] items-center justify-center text-center">
        <p className="text-[12px] text-muted-foreground">
          No active neural path.{" "}
          <Link href="/dashboard/neural-paths" className="text-primary hover:underline">
            Browse paths →
          </Link>
        </p>
      </div>
    );
  }

  // Convert milestones → stepper items
  const stepperItems: StepperItem[] = activePath.milestones.slice(0, 6).map((m, i) => ({
    id: String(i),
    label: m.label,
    status: m.completed ? "done" : m.current ? "active" : "upcoming",
  }));

  // Fallback if milestones is empty
  if (stepperItems.length === 0) {
    stepperItems.push(
      { id: "current", label: activePath.currentChapterTitle, status: "active" },
      { id: "next", label: "Next Chapter", sublabel: "Unlock at 100% progress", status: "upcoming" }
    );
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-card p-5 animate-fade-in shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[13px] font-semibold text-foreground truncate">
              {activePath.title}
            </h3>
            <DomainBadge domain={activePath.domain} size="xs" />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {activePath.overallCompletion}% complete
          </p>
        </div>
        <Link
          href="/dashboard/neural-paths"
          className="shrink-0 inline-flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 transition-colors"
        >
          View all <ArrowRight size={10} />
        </Link>
      </div>

      {/* Overall progress bar */}
      <div className="h-1 bg-white/6 rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-700 ease-out"
          style={{ width: `${activePath.overallCompletion}%` }}
        />
      </div>

      {/* Chapter stepper */}
      <Stepper items={stepperItems} />
    </div>
  );
}