// components/dashboard/active-neural-path.tsx
import { CheckCircle, Circle, Dot } from "lucide-react";

const milestones = [
  { label: "Classical Mechanics", completed: true },
  { label: "Wave Functions", completed: true },
  { label: "Superposition", completed: true },
  { label: "Entanglement", current: true },
  { label: "Quantum Computing", completed: false },
];

export function ActiveNeuralPath() {
  return (
    <div className="glass rounded-2xl p-8 glow-border">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-semibold text-foreground">Active Neural Path</h3>
        <span className="text-xs font-medium text-accent bg-accent/10 px-3 py-1 rounded-full">Quantum Physics</span>
      </div>

      <div className="relative flex justify-between items-center">
        {/* The Line */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -translate-y-1/2" />
        <div className="absolute top-1/2 left-0 w-3/4 h-0.5 bg-gradient-to-r from-primary to-accent -translate-y-1/2" />

        {/* The Nodes */}
        {milestones.map((milestone, idx) => (
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
            <span className={`text-xs text-center max-w-[80px] ${milestone.current ? "text-foreground font-medium" : "text-muted-foreground"}`}>
              {milestone.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}