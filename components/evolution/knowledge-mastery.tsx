import { Atom, Brain, Leaf, Scale, Orbit, HelpCircle } from "lucide-react";

const domainStyles: Record<string, { color: string; icon: any }> = {
  physics: { color: "#3b82f6", icon: Atom },
  ai: { color: "#8b5cf6", icon: Brain },
  biology: { color: "#10b981", icon: Leaf },
  philosophy: { color: "#f59e0b", icon: Scale },
  space: { color: "#06b6d4", icon: Orbit },
};

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

export function KnowledgeMastery({ userDomains }: { userDomains?: any[] }) {
  // If user has no active domains yet, render a fallback with zero progress
  const activeDomains = userDomains && userDomains.length > 0 ? userDomains : [
    { domain: "physics", xp: 0 },
    { domain: "ai", xp: 0 },
    { domain: "biology", xp: 0 },
    { domain: "philosophy", xp: 0 }
  ];

  return (
    <div className="glass rounded-2xl p-8 glow-border animate-fade-up delay-100">
      <h3 className="text-lg font-semibold text-foreground mb-8">Knowledge Mastery</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {activeDomains.map((d: any) => {
          const name = d.domain.charAt(0).toUpperCase() + d.domain.slice(1);
          const style = domainStyles[d.domain as string] || { color: "#a855f7", icon: HelpCircle };
          const percent = Math.min(Math.floor((d.xp || 0) / 10), 100);
          
          return (
            <div key={d.domain} className="flex flex-col items-center text-center gap-3">
              <RadialChart percent={percent} color={style.color} />
              <div>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <style.icon size={14} style={{ color: style.color }} />
                  <span className="text-sm font-medium text-foreground">{name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {percent > 70 ? "Advanced" : percent > 40 ? "Intermediate" : "Beginner"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}