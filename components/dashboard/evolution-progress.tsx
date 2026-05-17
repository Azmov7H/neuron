import { TrendingUp, Target, Zap } from "lucide-react";
import type { DashboardSummary } from "@/app/api/dashboard/summary/route";

export function EvolutionProgress({ weeklyStats }: { weeklyStats: DashboardSummary["weeklyStats"] }) {
  const stats = [
    { label: "Cognitive Velocity", value: weeklyStats.cognitiveVelocityLabel, icon: Zap, color: "text-blue-400" },
    { label: "Weekly XP", value: weeklyStats.weeklyXP.toLocaleString(), icon: TrendingUp, color: "text-emerald-400" },
    { label: "Concepts Mastered", value: weeklyStats.conceptsMastered.toString(), icon: Target, color: "text-purple-400" },
  ];

  return (
    <div className="glass rounded-2xl p-8 glow-border">
      <h3 className="text-lg font-semibold text-foreground mb-6">Evolution Progress</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={14} className={stat.color} />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground mb-4">{stat.value}</p>
            
            {/* Minimal Chart Placeholder */}
            <div className="h-10 w-full flex items-end gap-1 opacity-30">
              {[40, 70, 50, 90, 60, 85, 95].map((h, i) => (
                <div key={i} className="flex-1 bg-foreground/20 rounded-t-sm" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}