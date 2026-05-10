// components/explore/domains-grid.tsx
import { Atom, Brain, Leaf, Orbit, Pi, Eye, Scale, Cpu } from "lucide-react";

const domains = [
  { name: "Physics", theme: "Reality & Matter", icon: Atom, gradient: "from-blue-600/20 to-transparent", glow: "group-hover:shadow-blue-500/20" },
  { name: "AI", theme: "Intelligence", icon: Brain, gradient: "from-purple-600/20 to-transparent", glow: "group-hover:shadow-purple-500/20" },
  { name: "Biology", theme: "Life Systems", icon: Leaf, gradient: "from-emerald-600/20 to-transparent", glow: "group-hover:shadow-emerald-500/20" },
  { name: "Space", theme: "Cosmos", icon: Orbit, gradient: "from-cyan-600/20 to-transparent", glow: "group-hover:shadow-cyan-500/20" },
  { name: "Mathematics", theme: "Structure", icon: Pi, gradient: "from-rose-600/20 to-transparent", glow: "group-hover:shadow-rose-500/20" },
  { name: "Consciousness", theme: "Mind", icon: Eye, gradient: "from-amber-600/20 to-transparent", glow: "group-hover:shadow-amber-500/20" },
  { name: "Philosophy", theme: "Meaning", icon: Scale, gradient: "from-indigo-600/20 to-transparent", glow: "group-hover:shadow-indigo-500/20" },
  { name: "Future Tech", theme: "Civilization", icon: Cpu, gradient: "from-teal-600/20 to-transparent", glow: "group-hover:shadow-teal-500/20" },
];

export function DomainsGrid() {
  return (
    <section className="animate-fade-up delay-100">
      <h2 className="text-2xl font-bold text-foreground mb-8">Domains of Knowledge</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {domains.map((domain) => (
          <div 
            key={domain.name} 
            className={`group relative glass rounded-xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${domain.glow} glow-border overflow-hidden`}
          >
            <div className={`absolute inset-0 bg-gradient-to-b ${domain.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            
            <div className="relative z-10">
              <domain.icon className="text-muted-foreground group-hover:text-foreground transition-colors mb-4" size={28} />
              <h3 className="text-lg font-semibold text-foreground mb-1">{domain.name}</h3>
              <p className="text-xs text-muted-foreground">{domain.theme}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}