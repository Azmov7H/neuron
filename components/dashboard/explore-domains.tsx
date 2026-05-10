// components/dashboard/explore-domains.tsx
import { Atom, Brain, Leaf, Pi, Eye, Scale } from "lucide-react";

const domains = [
  { icon: Atom, label: "Physics", desc: "Fundamental laws of reality", gradient: "from-blue-500/20 to-transparent" },
  { icon: Brain, label: "AI", desc: "Neural architectures & cognition", gradient: "from-purple-500/20 to-transparent" },
  { icon: Eye, label: "Consciousness", desc: "The observer effect & mind", gradient: "from-amber-500/20 to-transparent" },
  { icon: Leaf, label: "Biology", desc: "Systems of life & evolution", gradient: "from-emerald-500/20 to-transparent" },
  { icon: Pi, label: "Mathematics", desc: "The language of the universe", gradient: "from-cyan-500/20 to-transparent" },
  { icon: Scale, label: "Philosophy", desc: "Structures of reason & logic", gradient: "from-rose-500/20 to-transparent" },
];

export function ExploreDomains() {
  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-6">Explore Domains</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {domains.map((domain) => (
          <div 
            key={domain.label} 
            className="group glass rounded-xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] glow-border relative overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-b ${domain.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            <div className="relative z-10">
              <domain.icon className="text-muted-foreground group-hover:text-foreground transition-colors mb-4" size={24} />
              <h4 className="font-semibold text-foreground text-sm mb-1">{domain.label}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{domain.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}