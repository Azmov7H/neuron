"use client";

import { TrendingUp, Target, Zap } from "lucide-react";
import type { DashboardSummary } from "@/app/api/dashboard/summary/route";

export function EvolutionProgress({
  weeklyStats,
}: {
  weeklyStats: DashboardSummary["weeklyStats"];
}) {
  const stats = [
    {
      label: "Cognitive Velocity",
      value: weeklyStats.cognitiveVelocityLabel,
      icon: Zap,
      color: "text-blue-400",
      stroke: "var(--chart-1)",
      // A rising exponential curve indicating acceleration
      path: "M 0 35 Q 20 32, 40 28 T 80 18 T 120 5",
      gradientId: "grad-cognitive",
      gradientColors: { start: "rgba(59, 130, 246, 0.2)", end: "rgba(59, 130, 246, 0)" },
    },
    {
      label: "Weekly XP",
      value: weeklyStats.weeklyXP.toLocaleString(),
      icon: TrendingUp,
      color: "text-emerald-400",
      stroke: "var(--chart-2)",
      // Fluctuating daily XP gains ending in a high note
      path: "M 0 25 Q 15 5, 30 30 T 60 10 T 90 28 T 120 8",
      gradientId: "grad-xp",
      gradientColors: { start: "rgba(16, 185, 129, 0.2)", end: "rgba(16, 185, 129, 0)" },
    },
    {
      label: "Concepts Mastered",
      value: String(weeklyStats.conceptsMastered),
      icon: Target,
      color: "text-purple-400",
      stroke: "var(--chart-3)",
      // Step-like accumulation curve representing concepts discovered
      path: "M 0 32 L 25 32 L 25 22 L 60 22 L 60 12 L 95 12 L 95 6 L 120 6",
      gradientId: "grad-concepts",
      gradientColors: { start: "rgba(139, 92, 246, 0.2)", end: "rgba(139, 92, 246, 0)" },
    },
  ];

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-card p-5 animate-fade-in shadow-sm">
      <h3 className="text-[13px] font-semibold text-foreground mb-4">Evolution Progress</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex flex-col p-4 rounded-[var(--radius-md)] border border-white/3 bg-white/2 hover:border-white/8 hover:bg-white/3 transition-all duration-300 group"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <s.icon size={13} className={s.color} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                {s.label}
              </span>
            </div>
            <p className="text-xl font-bold text-foreground mb-3 tabular-nums">{s.value}</p>

            {/* Premium Custom SVG Sparkline */}
            <div className="h-10 w-full relative overflow-hidden mt-auto">
              <svg
                viewBox="0 0 120 40"
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id={s.gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={s.gradientColors.start} />
                    <stop offset="100%" stopColor={s.gradientColors.end} />
                  </linearGradient>
                </defs>
                {/* Area fill under curve */}
                <path
                  d={`${s.path} L 120 40 L 0 40 Z`}
                  fill={`url(#${s.gradientId})`}
                  className="opacity-70"
                />
                {/* Stroke curve line */}
                <path
                  d={s.path}
                  fill="none"
                  stroke={s.stroke}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="transition-all duration-500 ease-out group-hover:stroke-width-2"
                />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}