// components/dashboard/spark-recommendation.tsx
import { Sparkles, ArrowUpRight } from "lucide-react";

export function SparkRecommendation() {
  return (
    <div className="h-full glass rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden glow-border border-secondary/20">
      {/* AI Shimmer Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-secondary/5 to-transparent animate-shimmer" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="text-secondary" size={20} />
          <span className="text-xs font-semibold uppercase tracking-widest text-secondary">Spark Suggests</span>
        </div>
        
        <p className="text-muted-foreground text-sm mb-4">Spark believes you may enjoy this concept:</p>
        
        <h3 className="text-xl font-semibold text-foreground leading-relaxed">
          “How does entropy shape the arrow of time?”
        </h3>
      </div>

      <button className="relative z-10 mt-8 self-start flex items-center gap-2 text-sm font-medium text-secondary hover:text-secondary/80 transition-colors group">
        Explore Concept 
        <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </button>
    </div>
  );
}