"use client";

import { TrendingUp, Target, Zap, TrendingDown, Minus } from "lucide-react";
import type { DashboardSummary } from "@/app/api/dashboard/summary/route";
import { useCountUp } from "@/hooks/use-count-up";
import { useIntersection } from "@/hooks/use-intersection";
import { Sparkline } from "@/components/ui/sparkline";

// ── Individual animated stat card ────────────────────────────────────────────

interface StatCardProps {
  label: string;
  rawValue: number;
  displayLabel?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconClass: string;
  stroke: string;
  gradientStart: string;
  sparkId: string;
  sparkPoints: number[];
  trend: "up" | "down" | "flat";
  format?: (n: number) => string;
}

function StatCard({
  label,
  rawValue,
  displayLabel,
  icon: Icon,
  iconClass,
  stroke,
  gradientStart,
  sparkId,
  sparkPoints,
  trend,
  format = (n) => n.toLocaleString(),
}: StatCardProps) {
  const [ref, visible] = useIntersection<HTMLDivElement>({ threshold: 0.3 });
  const animated = useCountUp(visible ? rawValue : 0, 1100);

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-muted-foreground/40";

  return (
    <div
      ref={ref}
      className="flex flex-col p-4 rounded-[var(--radius-md)] border border-white/5 bg-white/2 hover:border-white/10 hover:bg-white/3 transition-all duration-300 group"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Icon size={12} className={iconClass} />
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">
            {label}
          </span>
        </div>
        <TrendIcon size={10} className={trendColor} />
      </div>

      {/* Value */}
      <p className="text-xl font-bold text-foreground tabular-nums mb-3">
        {displayLabel ?? format(animated)}
      </p>

      {/* Sparkline */}
      <Sparkline
        id={sparkId}
        points={sparkPoints}
        stroke={stroke}
        gradientStart={gradientStart}
        showEndDot
      />
    </div>
  );
}

// ── EvolutionProgress ─────────────────────────────────────────────────────────

export function EvolutionProgress({
  weeklyStats,
}: {
  weeklyStats: DashboardSummary["weeklyStats"];
}) {
  // Synthetic sparkline point arrays derived from available stats
  const xpPoints = [20, 35, 28, 50, 42, 68, weeklyStats.weeklyXP > 0 ? 85 : 60];
  const cogPoints = [30, 28, 45, 38, 55, 62, 80];
  const conceptPoints = [0, 15, 15, 35, 35, 60, Math.min(weeklyStats.conceptsMastered * 10, 95)];

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-card p-5 animate-fade-in shadow-sm">
      <h3 className="text-[13px] font-semibold text-foreground mb-4">Evolution Progress</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Cognitive Velocity"
          rawValue={72}
          displayLabel={weeklyStats.cognitiveVelocityLabel}
          icon={Zap}
          iconClass="text-[hsl(var(--chart-1))]"
          stroke="hsl(var(--chart-1))"
          gradientStart="hsl(var(--chart-1) / 0.2)"
          sparkId="cognitive"
          sparkPoints={cogPoints}
          trend="up"
          format={(n) => `${n}%`}
        />
        <StatCard
          label="Weekly XP"
          rawValue={weeklyStats.weeklyXP}
          icon={TrendingUp}
          iconClass="text-[hsl(var(--chart-2))]"
          stroke="hsl(var(--chart-2))"
          gradientStart="hsl(var(--chart-2) / 0.2)"
          sparkId="weekly-xp"
          sparkPoints={xpPoints}
          trend="up"
        />
        <StatCard
          label="Concepts Mastered"
          rawValue={weeklyStats.conceptsMastered}
          icon={Target}
          iconClass="text-[hsl(var(--chart-3))]"
          stroke="hsl(var(--chart-3))"
          gradientStart="hsl(var(--chart-3) / 0.2)"
          sparkId="concepts"
          sparkPoints={conceptPoints}
          trend={weeklyStats.conceptsMastered > 3 ? "up" : "flat"}
        />
      </div>
    </div>
  );
}