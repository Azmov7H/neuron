// components/explore/featured-paths.tsx
import Link from "next/link";
import { Route, Clock, Zap, ArrowRight } from "lucide-react";

const paths = [
  { slug: "quantum-entanglement", title: "Quantum Entanglement & Spacetime", xp: 3200, duration: "8 Hours", difficulty: "Intermediate" },
  { slug: "architecture-of-intelligence", title: "The Architecture of Intelligence", xp: 4500, duration: "12 Hours", difficulty: "Advanced" },
];

export function FeaturedPaths() {
  return (
    <section className="animate-fade-up delay-400">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Route className="text-accent" size={20} />
          <h2 className="text-2xl font-bold text-foreground">Featured Neural Paths</h2>
        </div>
        <Link href="/neural-paths" className="text-sm text-primary hover:underline flex items-center gap-1">
          View All <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {paths.map((path) => (
          <Link key={path.slug} href={`/neural-paths/${path.slug}`} className="group glass rounded-xl p-8 glow-border border-accent/10 hover:border-accent/30 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl group-hover:bg-accent/10 transition-colors" />
            
            <div className="relative z-10">
              <span className="text-[10px] uppercase tracking-widest font-semibold text-accent/80 mb-2 block">Journey</span>
              <h3 className="text-xl font-bold text-foreground mb-6">{path.title}</h3>
              
              <div className="flex items-center gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-1"><Clock size={12} /> {path.duration}</div>
                <div className="flex items-center gap-1"><Zap size={12} className="text-amber-400" /> {path.xp} XP</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}