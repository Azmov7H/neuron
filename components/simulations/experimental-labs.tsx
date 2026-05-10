// components/simulations/experimental-labs.tsx
import { Lock, FlaskConical } from "lucide-react";

const labs = [
  { title: "Quantum Probability Field", status: "Alpha", color: "text-blue-400 border-blue-400/20" },
  { title: "Evolutionary Ecosystems", status: "Concept", color: "text-emerald-400 border-emerald-400/20" },
  { title: "4D Dimensional Geometry", status: "Concept", color: "text-amber-400 border-amber-400/20" },
];

export function ExperimentalLabs() {
  return (
    <section className="animate-fade-up delay-300">
      <div className="flex items-center gap-3 mb-6">
        <FlaskConical className="text-secondary" size={20} />
        <h2 className="text-2xl font-bold text-foreground">Experimental Labs</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {labs.map((lab) => (
          <div key={lab.title} className="glass rounded-xl p-6 glow-border border-secondary/10 opacity-70 hover:opacity-100 transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <span className={`text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full border ${lab.color} flex items-center gap-1`}>
                <Lock size={8} /> {lab.status}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-foreground">{lab.title}</h3>
            <p className="text-xs text-muted-foreground mt-2">Under development. Available soon for Neural Architects.</p>
          </div>
        ))}
      </div>
    </section>
  );
}