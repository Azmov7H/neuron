import { Atom, Brain, Leaf, Orbit, Pi, Eye, Scale, Cpu, Lightbulb } from "lucide-react";

interface Domain {
  name: string;
  theme: string;
  iconName: string;
  gradient: string;
  glow: string;
}

const iconMap: Record<string, any> = {
  Atom, Brain, Leaf, Orbit, Pi, Eye, Scale, Cpu
};

export function DomainsGrid({ 
  domains, 
  onDomainClick 
}: { 
  domains: Domain[];
  onDomainClick: (name: string) => void;
}) {
  return (
    <section className="animate-fade-up delay-100">
      <h2 className="text-2xl font-bold text-foreground mb-8">Domains of Knowledge</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {domains.map((domain) => {
          const IconComponent = iconMap[domain.iconName] || Lightbulb;
          
          return (
            <div 
              key={domain.name} 
              onClick={() => onDomainClick(domain.name)}
              className={`group relative glass rounded-xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${domain.glow} glow-border overflow-hidden`}
            >
              <div className={`absolute inset-0 bg-gradient-to-b ${domain.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="relative z-10">
                <IconComponent className="text-muted-foreground group-hover:text-foreground transition-colors mb-4" size={28} />
                <h3 className="text-lg font-semibold text-foreground mb-1">{domain.name}</h3>
                <p className="text-xs text-muted-foreground">{domain.theme}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}