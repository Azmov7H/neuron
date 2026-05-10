// components/dashboard/simulations-preview.tsx
import { MonitorPlay } from "lucide-react";

const sims = [
  { title: "Quantum States", status: "Live", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  { title: "Gravity Wells", status: "Beta", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  { title: "Neural Nets", status: "Live", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
];

export function SimulationsPreview() {
  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-6">Simulations Lab</h3>
      <div className="grid grid-cols-3 gap-4">
        {sims.map((sim) => (
          <div key={sim.title} className="glass rounded-xl p-6 flex flex-col items-center justify-center text-center gap-4 cursor-pointer glow-border group">
            <div className="p-4 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
              <MonitorPlay className="text-muted-foreground group-hover:text-foreground transition-colors" size={24} />
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">{sim.title}</h4>
              <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${sim.color}`}>
                {sim.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}