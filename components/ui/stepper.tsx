"use client";

import { cn } from "@/lib/utils";

export type StepperStatus = "done" | "active" | "upcoming";

export interface StepperItem {
  id: string;
  label: string;
  sublabel?: string;
  status: StepperStatus;
}

interface StepperProps {
  items: StepperItem[];
  className?: string;
}

const STATUS_STYLES: Record<StepperStatus, { dot: string; line: string; label: string }> = {
  done: {
    dot: "bg-primary border-primary shadow-[0_0_8px_hsl(var(--primary)/0.4)]",
    line: "bg-primary",
    label: "text-muted-foreground",
  },
  active: {
    dot: "bg-warning border-warning shadow-[0_0_12px_hsl(var(--evo-streak)/0.6)] animate-pulse",
    line: "bg-white/10",
    label: "text-foreground font-semibold",
  },
  upcoming: {
    dot: "bg-transparent border-white/15",
    line: "bg-white/8",
    label: "text-muted-foreground/50",
  },
};

/**
 * Vertical step timeline for displaying neural path chapter progress.
 * Shows completed (green), active (amber pulse), and upcoming (muted) nodes.
 */
export function Stepper({ items, className }: StepperProps) {
  return (
    <ol className={cn("flex flex-col gap-0", className)} aria-label="Chapter progress">
      {items.map((item, i) => {
        const s = STATUS_STYLES[item.status];
        const isLast = i === items.length - 1;

        return (
          <li key={item.id} className="flex gap-3">
            {/* Timeline column */}
            <div className="flex flex-col items-center">
              {/* Node dot */}
              <div
                className={cn(
                  "w-2.5 h-2.5 rounded-full border shrink-0 mt-0.5 transition-all duration-500",
                  s.dot
                )}
                aria-hidden="true"
              />
              {/* Connector line */}
              {!isLast && (
                <div className={cn("w-px flex-1 mt-1 mb-0", s.line)} style={{ minHeight: 16 }} />
              )}
            </div>

            {/* Content */}
            <div className={cn("pb-4 min-w-0", isLast && "pb-0")}>
              <p className={cn("text-[12px] leading-snug truncate", s.label)}>
                {item.label}
              </p>
              {item.sublabel && (
                <p className="text-[10px] text-muted-foreground/40 mt-0.5 truncate">
                  {item.sublabel}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
