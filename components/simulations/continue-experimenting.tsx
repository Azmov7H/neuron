// components/simulations/continue-experimenting.tsx
import Link from "next/link";
import { ArrowRight, Atom, Clock  } from "lucide-react";

export function ContinueExperimenting() {
  return (
    <section className="animate-fade-up delay-200">
      <div className="glass rounded-2xl p-8 glow-border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 hidden md:block">
            <Atom size={24} className="text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/80 mb-1">Resume Experiment</p>
            <h3 className="text-2xl font-bold text-foreground mb-1">Black Hole Gravity Lab</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock size={12} /> Last run: 2 hours ago
            </div>
          </div>
        </div>
        <Link 
          href="/simulations/black-hole" 
          className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-primary/30 text-foreground px-6 py-3 rounded-lg font-medium transition-all group"
        >
          Continue <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </section>
  );
}