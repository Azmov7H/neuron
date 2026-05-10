// components/simulation-runner/sim-header.tsx
import { Sparkles, Volume2 } from "lucide-react";

interface HeaderProps {
  title: string;
}

export function SimHeader({ title }: HeaderProps) {
  return (
    <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-between z-20 pointer-events-none">
      <div className="pointer-events-auto">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight drop-shadow-lg">{title}</h1>
        <p className="text-xs text-muted-foreground mt-1 hidden sm:block">Interactive Experimentation Environment</p>
      </div>
      
      <div className="flex items-center gap-2 pointer-events-auto">
        <button className="p-2 rounded-lg glass hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground">
          <Volume2 size={18} />
        </button>
        <button className="p-2 rounded-lg glass hover:bg-white/10 transition-colors text-secondary">
          <Sparkles size={18} />
        </button>
      </div>
    </div>
  );
}