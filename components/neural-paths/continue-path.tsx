// components/neural-paths/continue-path.tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface PathProps {
  path: any;
}

export function ContinuePath({ path }: PathProps) {
  return (
    <div className="glass rounded-2xl p-8 glow-border border-primary/10">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary/80 mb-2">Resume Your Exploration</p>
          <h3 className="text-2xl font-bold text-foreground mb-4">{path.title}</h3>
          
          <div className="flex items-center gap-4 w-full max-w-md">
            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all" 
                style={{ width: `${path.progress}%` }} 
              />
            </div>
            <span className="text-sm font-semibold text-foreground">{path.progress}%</span>
          </div>
        </div>

        <Link 
          href={`/neural-paths/${path.slug}`} 
          className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-primary/30 text-foreground px-6 py-3 rounded-lg font-medium transition-all group"
        >
          Continue <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}