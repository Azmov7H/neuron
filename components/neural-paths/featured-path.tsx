// components/neural-paths/featured-path.tsx
import Link from "next/link";
import { Play, Clock, Zap, BarChart } from "lucide-react";

interface PathProps {
  path: any;
}

export function FeaturedPath({ path }: PathProps) {
  return (
    <Link 
      href={`/neural-paths/${path.slug}`} 
      className="block group relative h-[450px] rounded-2xl overflow-hidden border border-white/5 transition-all hover:border-primary/20 hover:shadow-[0_0_40px_rgba(59,130,246,0.15)]"
    >
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 opacity-40 mix-blend-luminosity"
        style={{ backgroundImage: `url(${path.image})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      
      <div className="relative h-full flex flex-col justify-end p-8 lg:p-12 z-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 rounded-full">
            Featured Journey
          </span>
          <span className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest bg-white/5 text-muted-foreground border border-white/10 rounded-full">
            {path.category}
          </span>
        </div>

        <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-3 max-w-2xl">
          {path.title}
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mb-8">{path.description}</p>

        <div className="flex items-center gap-8">
          <button className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all active:scale-95">
            <Play size={18} fill="currentColor" /> Begin Journey
          </button>

          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><Clock size={14} /> {path.duration}</div>
            <div className="flex items-center gap-2"><Zap size={14} /> {path.xp} XP</div>
            <div className="flex items-center gap-2"><BarChart size={14} /> {path.difficulty}</div>
          </div>
        </div>
      </div>
    </Link>
  );
}