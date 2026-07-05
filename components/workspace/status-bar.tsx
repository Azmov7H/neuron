import * as React from "react";
import { cn } from "@/lib/utils";
import { Zap, TrendingUp, Flame, Clock } from "lucide-react";

type LucideIcon = React.ComponentType<{ size?: number; className?: string }>;

interface StatItem {
  icon: LucideIcon;
  label: string;
  value: string;
  color: string;
}

interface StatusBarProps {
  stats: StatItem[];
  className?: string;
}

/**
 * Compact inline stat strip — replaces the 4-card stat grid in the
 * dashboard welcome section with a dense, workspace-style status bar.
 */
export function StatusBar({ stats, className }: StatusBarProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 h-9 px-2 rounded-md",
        "bg-white/3 border border-white/5",
        className
      )}
      role="status"
      aria-label="User statistics"
    >
      {stats.map((stat, idx) => (
        <React.Fragment key={stat.label}>
          {idx > 0 && (
            <div className="w-px h-4 bg-white/8 mx-1 shrink-0" />
          )}
          <div className="flex items-center gap-1.5 px-2 py-1">
            <stat.icon
              size={12}
              className={cn("shrink-0", stat.color)}
              aria-hidden="true"
            />
            <span className="text-[11px] text-muted-foreground">
              {stat.label}
            </span>
            <span className="text-[11px] font-semibold text-foreground">
              {stat.value}
            </span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Default stat builders ────────────────────────────────────

export function buildDefaultStats(opts: {
  xp: number;
  rank: string;
  streak: number;
}): StatItem[] {
  return [
    {
      icon: Zap,
      label: "XP",
      value: opts.xp.toLocaleString(),
      color: "text-blue-400",
    },
    {
      icon: TrendingUp,
      label: "Rank",
      value: opts.rank,
      color: "text-purple-400",
    },
    {
      icon: Flame,
      label: "Streak",
      value: `${opts.streak}d`,
      color: "text-amber-400",
    },
    {
      icon: Clock,
      label: "Status",
      value: "Active",
      color: "text-emerald-400",
    },
  ];
}
