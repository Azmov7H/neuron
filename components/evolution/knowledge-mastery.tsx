// components/evolution/knowledge-mastery.tsx
import { Atom, Brain, Leaf, Scale } from "lucide-react";

const domains = [
  { name: "Physics", percent: 82, color: "#3b82f6", icon: Atom },
  { name: "AI", percent: 74, color: "#8b5cf6", icon: Brain },
  { name: "Biology", percent: 48, color: "#10b981", icon: Leaf },
  { name: "Philosophy", percent: 61, color: "#f59e0b", icon: Scale },
];

function RadialChart({ percent, color }: { percent: number; color: string }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
        <circle 
          cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
        />
      </svg>
      <span className="text-lg font-bold text-foreground">{percent}%</span>
    </div>
  );
}

export function KnowledgeMastery() {
  return (
    <div className="glass rounded-2xl p-8 glow-border animate-fade-up delay-100">
      <h3 className="text-lg font-semibold text-foreground mb-8">Knowledge Mastery</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {domains.map((domain) => (
          <div key={domain.name} className="flex flex-col items-center text-center gap-3">
            <RadialChart percent={domain.percent} color={domain.color} />
            <div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <domain.icon size={14} style={{ color: domain.color }} />
                <span className="text-sm font-medium text-foreground">{domain.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">{domain.percent > 70 ? "Advanced" : domain.percent > 40 ? "Intermediate" : "Beginner"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}