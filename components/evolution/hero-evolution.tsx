// components/evolution/hero-evolution.tsx
import { TrendingUp, Sparkles, Brain, Target } from "lucide-react";

const xpTypes = [
  { label: "Knowledge", value: 4500, color: "bg-blue-500", icon: Brain },
  { label: "Curiosity", value: 2100, color: "bg-purple-500", icon: Sparkles },
  { label: "Insight", value: 1200, color: "bg-amber-500", icon: TrendingUp },
  { label: "Mastery", value: 4650, color: "bg-emerald-500", icon: Target },
];

export function HeroEvolution() {
  const totalXP = xpTypes.reduce((acc, curr) => acc + curr.value, 0);
  const maxXP = 20000;
  const progress = (totalXP / maxXP) * 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-up">
      {/* Cognitive Rank Card */}
      <div className="lg:col-span-1 glass rounded-2xl p-8 flex flex-col items-center justify-center text-center glow-border border-primary/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        
        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Current Rank</p>
          
          <div className="relative w-32 h-32 mx-auto mb-6 flex items-center justify-center">
            {/* Glowing Ring */}
            <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
              <circle 
                cx="50" cy="50" r="45" fill="none" stroke="url(#rankGradient)" strokeWidth="4" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 45}`} 
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - 0.74)}`} 
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="rankGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <span className="text-4xl font-bold text-primary">S</span>
          </div>

          <h2 className="text-2xl font-bold text-foreground tracking-tight mb-2">SYNTHESIST</h2>
          <p className="text-sm text-muted-foreground">74% toward Architect</p>
        </div>
      </div>

      {/* XP Progress */}
      <div className="lg:col-span-2 glass rounded-2xl p-8 glow-border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Neural Progression</h3>
          <span className="text-sm text-primary font-medium">{totalXP.toLocaleString()} / {maxXP.toLocaleString()} XP</span>
        </div>

        {/* Main Progress Bar */}
        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden mb-8">
          <div 
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000 relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
        </div>

        {/* XP Types Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {xpTypes.map((xp) => (
            <div key={xp.label} className="p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <xp.icon size={14} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">{xp.label}</span>
              </div>
              <p className="text-xl font-bold text-foreground">{xp.value.toLocaleString()}</p>
              <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full ${xp.color} rounded-full opacity-60`} style={{ width: `${(xp.value / 5000) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}