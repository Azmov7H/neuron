// components/dashboard/daily-knowledge-pulse.tsx
import { Lightbulb } from "lucide-react";

export function DailyKnowledgePulse() {
  return (
    <div className="h-full glass rounded-2xl p-8 flex flex-col justify-center items-center text-center glow-border border-amber-500/10 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-center gap-2 mb-6 text-amber-400/80">
          <Lightbulb size={16} />
          <span className="text-xs font-semibold uppercase tracking-widest">Daily Knowledge Pulse</span>
        </div>
        
        <p className="text-xl font-light text-foreground/90 leading-relaxed italic">
          “Your body contains atoms older than Earth.”
        </p>
        
        <div className="mt-6 h-1 w-12 bg-amber-400/30 rounded-full mx-auto" />
      </div>
    </div>
  );
}