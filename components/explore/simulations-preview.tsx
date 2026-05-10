// components/explore/simulations-preview.tsx
import { MonitorPlay, Lock } from "lucide-react";

const sims = [
  { title: "Quantum State Visualizer", status: "Live", color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" },
  { title: "Gravitational Wave Lab", status: "Live", color: "border-blue-500/20 bg-blue-500/5 text-blue-400" },
  { title: "Neural Network Topology", status: "Beta", color: "border-amber-500/20 bg-amber-500/5 text-amber-400" },
  { title: "Dark Matter Mapper", status: "Coming Soon", color: "border-white/10 bg-white/5 text-muted-foreground" },
];

export function SimulationsPreview() {
  return (
    <section>
      <h2 className="text-2xl font-bold text-foreground mb-6">Simulations Lab</h2>
      <div className="glass rounded-2xl p-6 glow-border h-full">
        <div className="grid grid-cols-2 gap-4">
          {sims.map((sim) => (
            <div key={sim.title} className={`relative rounded-xl border p-6 flex flex-col items-center justify-center text-center gap-3 cursor-pointer transition-all hover:-translate-y-1 ${sim.color}`}>
              <MonitorPlay size={24} className="opacity-50" />
              <h4 className="text-sm font-medium text-foreground">{sim.title}</h4>
              <span className={`text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full border ${sim.color}`}>
                {sim.status === "Coming Soon" && <Lock size={10} className="inline mr-1 -mt-0.5" />}
                {sim.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
