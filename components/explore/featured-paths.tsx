import Link from "next/link";
import { Route, Clock, Zap, ArrowRight } from "lucide-react";
import type { NeuralPathItem } from "@/types/neural-paths";

export function FeaturedPaths({ paths }: { paths: NeuralPathItem[] }) {
  return (
    <section id="featured" className="animate-fade-up delay-400 scroll-mt-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Route className="text-accent" size={20} />
          <h2 className="text-2xl font-bold text-foreground">Featured Neural Paths</h2>
        </div>
        <Link href="/dashboard/neural-paths" className="text-sm text-primary hover:underline flex items-center gap-1">
          View All <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {paths.map((path) => (
          <Link
            key={path._id}
            href={`/dashboard/neural-paths/${path.slug}`}
            className="group glass rounded-xl p-8 glow-border border-accent/10 hover:border-accent/30 transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl group-hover:bg-accent/10 transition-colors" />

            <div className="relative z-10">
              <span className="text-[10px] uppercase tracking-widest font-semibold text-accent/80 mb-2 block">Journey</span>
              <h3 className="text-xl font-bold text-foreground mb-6">{path.title}</h3>

              <div className="flex items-center gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-1"><Clock size={12} /> {Math.round(path.estimatedTime / 60)} Hours</div>
                <div className="flex items-center gap-1"><Zap size={12} className="text-amber-400" /> {path.xpReward} XP</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
