// components/explore/recommended-explorations.tsx
import { Sparkles, ArrowUpRight } from "lucide-react";

const recommendations = [
  { title: "The Nature of Computation", desc: "Bridge between physics and computer science.", type: "Concept" },
  { title: "Neural Darwinism", desc: "How neuronal groups evolve through selection.", type: "Theory" },
  { title: "Quantum Biology", desc: "Quantum effects in biological processes.", type: "Domain" },
];

export function RecommendedExplorations() {
  return (
    <section className="animate-fade-up delay-300">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="text-secondary" size={20} />
        <h2 className="text-2xl font-bold text-foreground">Recommended For You</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendations.map((rec) => (
          <div key={rec.title} className="glass rounded-xl p-6 glow-border border-secondary/10 cursor-pointer group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-secondary/5 to-transparent animate-shimmer" />
            
            <div className="relative z-10">
              <span className="text-[10px] uppercase tracking-widest font-semibold text-secondary/80 mb-2 block">{rec.type}</span>
              <h3 className="text-lg font-semibold text-foreground mb-2">{rec.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{rec.desc}</p>
              <div className="flex items-center gap-1 text-sm font-medium text-secondary group-hover:text-primary transition-colors">
                Explore <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}