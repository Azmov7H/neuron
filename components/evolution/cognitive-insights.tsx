import { Sparkles, Eye, Moon, Brain } from "lucide-react";

export function CognitiveInsights({ userDomains }: { userDomains?: any[] }) {
  // Find user's highest XP domain
  let topDomain = "General Knowledge";
  if (userDomains && userDomains.length > 0) {
    const sorted = [...userDomains].sort((a, b) => b.xp - a.xp);
    if (sorted[0]?.xp > 0) {
      topDomain = sorted[0].domain.charAt(0).toUpperCase() + sorted[0].domain.slice(1);
    }
  }

  const insights = [
    { icon: Eye, text: "You learn fastest through cognitive neural path visual simulations.", color: "text-blue-400" },
    { icon: Moon, text: "You explore abstract concepts more deeply during late active hours.", color: "text-purple-400" },
    { icon: Brain, text: `Your strongest intellectual growth is currently in ${topDomain}.`, color: "text-emerald-400" },
  ];

  return (
    <div className="glass rounded-2xl p-8 glow-border border-secondary/20 h-full flex flex-col relative overflow-hidden animate-fade-up delay-100">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-secondary/5 to-transparent animate-shimmer" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="text-secondary" size={18} />
          <h3 className="text-lg font-semibold text-foreground">Cognitive Insights</h3>
        </div>

        <div className="space-y-4">
          {insights.map((insight, idx) => (
            <div key={idx} className="flex items-start gap-4 p-3 rounded-lg bg-white/5 border border-white/5">
              <div className={`mt-0.5 ${insight.color}`}><insight.icon size={16} /></div>
              <p className="text-sm text-foreground/80 leading-relaxed">{insight.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}