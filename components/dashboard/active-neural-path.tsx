"use client";

import { CheckCircle, Circle, Dot } from "lucide-react";
import type { DashboardSummary } from "@/app/api/dashboard/summary/route";

export function ActiveNeuralPath({
  activePath,
}: {
  activePath: DashboardSummary["activePath"];
}) {
  if (!activePath) return null;

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-card p-5 animate-fade-in shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[13px] font-semibold text-foreground">Path Milestones</h3>
        <span className="text-[10px] font-semibold text-muted-foreground bg-white/4 border border-white/5 px-2 py-0.5 rounded-[var(--radius-xs)] capitalize">
          {activePath.domain}
        </span>
      </div>

      <div className="relative py-4">
        {/* Timeline Progress Bar Line */}
        <div className="relative flex justify-between items-center">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/8 -translate-y-1/2" />
          <div
            className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-primary to-secondary -translate-y-1/2 transition-all duration-500"
            style={{ width: `${activePath.overallCompletion}%` }}
          />

          {/* Timeline Nodes */}
          {activePath.milestones.map((m, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center gap-2 group cursor-pointer">
              <div
                className={`p-0.5 rounded-full bg-background border transition-all duration-300 ${
                  m.current
                    ? "border-primary shadow-[0_0_12px_rgba(var(--primary),0.3)] scale-110"
                    : m.completed
                    ? "border-primary"
                    : "border-white/10"
                }`}
              >
                {m.completed ? (
                  <CheckCircle className="text-primary hover:scale-105 transition-transform" size={16} />
                ) : m.current ? (
                  <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center relative">
                    <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
                    <Dot className="text-primary relative z-10" size={12} fill="currentColor" />
                  </div>
                ) : (
                  <Circle className="text-muted-foreground/30 hover:text-muted-foreground/50 transition-colors" size={16} />
                )}
              </div>
              
              {/* Node label */}
              <span
                className={`text-[10px] text-center max-w-[72px] truncate transition-colors duration-200 ${
                  m.current
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground/60 group-hover:text-muted-foreground"
                }`}
                title={m.label}
              >
                {m.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}