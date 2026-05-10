// components/neural-paths/recommended-grid.tsx
import Link from "next/link";
import { Zap, Clock } from "lucide-react";

interface PathsProps {
  paths: any[];
}

export function RecommendedGrid({ paths }: PathsProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-6">Discover New Paths</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paths.map((path) => (
          <Link 
            key={path.slug} 
            href={`/dashboard/neural-paths/${path.slug}`} 
            className="group glass rounded-2xl overflow-hidden glow-border relative"
          >
            <div className="h-40 overflow-hidden relative">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110 opacity-60 mix-blend-luminosity"
                style={{ backgroundImage: `url(${path.image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
              <div className="absolute top-4 right-4 px-2 py-0.5 text-[10px] uppercase tracking-widest bg-background/50 backdrop-blur-sm border border-white/10 rounded-full text-foreground">
                {path.difficulty}
              </div>
            </div>

            <div className="p-6 relative">
              <h4 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">{path.title}</h4>
              <p className="text-sm text-muted-foreground mb-6 line-clamp-2">{path.description}</p>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-white/5 pt-4">
                <div className="flex items-center gap-2"><Clock size={14} /> {path.duration}</div>
                <div className="flex items-center gap-2"><Zap size={14} className="text-amber-400" /> {path.xp} XP</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}