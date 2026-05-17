// components/simulations/sim-categories.tsx
"use client";

import Link from "next/link";
import { Atom, Brain, Heart, Landmark, Orbit, Compass } from "lucide-react";

const categories = [
  { 
    name: "Physics", 
    slug: "physics",
    icon: Atom, 
    desc: "Relativity, motion vectors, and central orbits", 
    color: "text-blue-400 bg-blue-400/5 border-blue-400/10 hover:border-blue-400/35 hover:shadow-[0_0_25px_rgba(96,165,250,0.1)]", 
    count: 3 
  },
  { 
    name: "Biology", 
    slug: "biology",
    icon: Compass, 
    desc: "Logistic growth, SIR virus vectors, and immune Sweeps", 
    color: "text-emerald-400 bg-emerald-400/5 border-emerald-400/10 hover:border-emerald-400/35 hover:shadow-[0_0_25px_rgba(52,211,153,0.1)]", 
    count: 3 
  },
  { 
    name: "Anatomy", 
    slug: "anatomy",
    icon: Heart, 
    desc: "Cardiac output, saltatory conduction, and fluid hemodynamics", 
    color: "text-rose-400 bg-rose-400/5 border-rose-400/10 hover:border-rose-400/35 hover:shadow-[0_0_25px_rgba(251,113,133,0.1)]", 
    count: 3 
  },
  { 
    name: "Mathematics", 
    slug: "mathematics",
    icon: Landmark, 
    desc: "Functions curves, Galton probability, and graph networks", 
    color: "text-amber-400 bg-amber-400/5 border-amber-400/10 hover:border-amber-400/35 hover:shadow-[0_0_25px_rgba(251,191,36,0.1)]", 
    count: 3 
  },
  { 
    name: "Quantum Mechanics", 
    slug: "quantum",
    icon: Brain, 
    desc: "Quantized infinite potential wells and wave packet uncertainties", 
    color: "text-purple-400 bg-purple-400/5 border-purple-400/10 hover:border-purple-400/35 hover:shadow-[0_0_25px_rgba(192,132,252,0.1)]", 
    count: 2 
  },
  { 
    name: "Space Science", 
    slug: "space",
    icon: Orbit, 
    desc: "Kepler orbits, Schwarzschild black holes, and stellar collapses", 
    color: "text-cyan-400 bg-cyan-400/5 border-cyan-400/10 hover:border-cyan-400/35 hover:shadow-[0_0_25px_rgba(34,211,238,0.1)]", 
    count: 3 
  },
];

export function SimCategories() {
  return (
    <section className="animate-fade-up delay-100">
      <h2 className="text-2xl font-bold text-foreground mb-8">Simulation Domains</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link 
              key={cat.name} 
              href={`/dashboard/simulations/${cat.slug}`}
              className={`glass rounded-xl p-6 border transition-all cursor-pointer group glow-border ${cat.color}`}
            >
              <div className="flex items-center justify-between mb-4">
                <Icon size={24} className="transition-transform group-hover:scale-110" />
                <span className="text-[9px] uppercase tracking-widest font-black text-muted-foreground px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                  {cat.count} Labs
                </span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-white transition-colors">{cat.name}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{cat.desc}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}