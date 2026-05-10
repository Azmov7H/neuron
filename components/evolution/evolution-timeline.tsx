// components/evolution/evolution-timeline.tsx
import { Unlock, Lightbulb, TrendingUp, CheckCircle } from "lucide-react";

const events = [
  { icon: Unlock, title: "Unlocked: Quantum Foundations", desc: "Completed the Neural Path", time: "2 hours ago", color: "text-blue-400" },
  { icon: Lightbulb, title: "Discovered: Non-local Reality", desc: "Spark Insight", time: "5 hours ago", color: "text-amber-400" },
  { icon: TrendingUp, title: "Reached Rank: Analyst", desc: "Cognitive Evolution", time: "2 days ago", color: "text-purple-400" },
  { icon: CheckCircle, title: "Mastered: Neural Systems", desc: "Chapter completed", time: "4 days ago", color: "text-emerald-400" },
];

export function EvolutionTimeline() {
  return (
    <div className="glass rounded-2xl p-8 glow-border animate-fade-up delay-200">
      <h3 className="text-lg font-semibold text-foreground mb-8">Evolution Timeline</h3>
      
      <div className="relative pl-8">
        <div className="absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-primary/50 via-white/10 to-transparent" />

        <div className="space-y-8">
          {events.map((event, idx) => (
            <div key={idx} className="relative flex items-start gap-6 group">
              <div className={`absolute -left-8 mt-1 p-1 rounded-full bg-background z-10 ${event.color}`}>
                <event.icon size={16} />
              </div>
              
              <div className="flex-1 pb-2">
                <p className="text-sm font-medium text-foreground">{event.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{event.desc}</p>
              </div>
              
              <span className="text-xs text-muted-foreground/50 whitespace-nowrap">{event.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}