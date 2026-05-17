import { CheckCircle, Circle, Dot } from "lucide-react";
import type { DashboardSummary } from "@/app/api/dashboard/summary/route";

export function ActiveNeuralPath({ activePath }: { activePath: DashboardSummary["activePath"] }) {
  if (!activePath) {
    return (
      <div className="glass rounded-2xl p-8 glow-border text-center flex flex-col items-center justify-center min-h-[200px]">
        <p className="text-muted-foreground">Select a path to see your milestones.</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-8 glow-border">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-semibold text-foreground">Active Neural Path</h3>
        <span className="text-xs font-medium text-accent bg-accent/10 px-3 py-1 rounded-full capitalize">
          {activePath.domain}
        </span>
      </div>

      <div className="relative flex justify-between items-center">
        {/* The Line */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -translate-y-1/2" />
        <div 
          className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-primary to-accent -translate-y-1/2 transition-all" 
          style={{ width: `${activePath.overallCompletion}%` }}
        />

        {/* The Nodes */}
        {activePath.milestones.map((milestone, idx) => (
          <div key={idx} className="relative z-10 flex flex-col items-center gap-3">
            <div className={`p-1 rounded-full bg-background ${milestone.current ? "shadow-[0_0_15px_rgba(59,130,246,0.5)]" : ""}`}>
              {milestone.completed ? (
                <CheckCircle className="text-primary" size={24} />
              ) : milestone.current ? (
                <div className="w-6 h-6 rounded-full border-2 border-primary bg-primary/20 flex items-center justify-center animate-pulse">
                  <Dot className="text-primary" size={16} fill="currentColor" />
                </div>
              ) : (
                <Circle className="text-muted-foreground/40" size={24} />
              )}
            </div>
            <span className={`text-xs text-center max-w-[80px] truncate ${milestone.current ? "text-foreground font-medium" : "text-muted-foreground"}`} title={milestone.label}>
              {milestone.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}