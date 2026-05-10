// components/simulations/sim-categories.tsx
import { Atom, Brain, Leaf, Pi } from "lucide-react";

const categories = [
  { name: "Physics", icon: Atom, desc: "Gravity, Quantum & Relativity", color: "text-blue-400 bg-blue-400/10 border-blue-400/20", count: 4 },
  { name: "Artificial Intelligence", icon: Brain, desc: "Neural Nets & Emergence", color: "text-purple-400 bg-purple-400/10 border-purple-400/20", count: 3 },
  { name: "Biology", icon: Leaf, desc: "Evolution & DNA", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", count: 2 },
  { name: "Mathematics", icon: Pi, desc: "Fractals & Topology", color: "text-amber-400 bg-amber-400/10 border-amber-400/20", count: 3 },
];

export function SimCategories() {
  return (
    <section className="animate-fade-up delay-100">
      <h2 className="text-2xl font-bold text-foreground mb-8">Simulation Domains</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <div key={cat.name} className={`glass rounded-xl p-6 border ${cat.color.split(' ')[2]} hover:-translate-y-1 transition-all cursor-pointer group glow-border`}>
            <div className="flex items-center justify-between mb-4">
              <cat.icon size={24} className={cat.color.split(' ')[0]} />
              <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">{cat.count} Labs</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">{cat.name}</h3>
            <p className="text-xs text-muted-foreground">{cat.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}