// components/neural-paths/path-hero.tsx
import { Clock, Zap, BarChart } from "lucide-react";

interface PathProps {
  path: any;
}

export function PathHero({ path }: PathProps) {
  return (
    <div className="relative h-[50vh] min-h-[400px] flex items-end">
      {/* Cinematic Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity"
        style={{ backgroundImage: `url(${path.image})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-20">
        <div className="max-w-2xl">
          <span className="inline-block px-3 py-1 text-[10px] font-semibold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 rounded-full mb-4">
            {path.category} Path
          </span>
          
          <h1 className="text-5xl font-bold tracking-tight text-foreground mb-4">
            {path.title}
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8">{path.description}</p>

          <div className="flex items-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><Clock size={16} className="text-foreground" /> {path.duration}</div>
            <div className="flex items-center gap-2"><Zap size={16} className="text-amber-400" /> {path.xp} XP</div>
            <div className="flex items-center gap-2"><BarChart size={16} className="text-foreground" /> {path.difficulty}</div>
          </div>
        </div>
      </div>
    </div>
  );
}