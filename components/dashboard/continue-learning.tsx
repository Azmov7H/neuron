import { Play } from "lucide-react";
import type { DashboardSummary } from "@/app/api/dashboard/summary/route";

export function ContinueLearning({ activePath }: { activePath: DashboardSummary["activePath"] }) {
  if (!activePath) {
    return (
      <div className="relative h-full min-h-[280px] rounded-2xl overflow-hidden group glow-border border-primary/20 flex flex-col items-center justify-center bg-card/30">
        <div className="text-center p-8">
          <p className="text-muted-foreground mb-4">No active learning path found.</p>
          <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-semibold shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all">
            Explore Paths
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[280px] rounded-2xl overflow-hidden group cursor-pointer glow-border border-primary/20">
      {/* Cinematic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20 z-0" />
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay group-hover:scale-105 transition-transform duration-700" />
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end p-8">
        <div className="mb-6 max-w-md">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary/80 mb-2">Continue Exploring</p>
          <h2 className="text-3xl font-bold tracking-tight mb-1">{activePath.title}</h2>
          <p className="text-muted-foreground">{activePath.currentChapterTitle}</p>
        </div>

        <div className="flex items-center gap-6">
          <button className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all active:scale-95">
            <Play size={18} fill="currentColor" /> Resume
          </button>
          
          <div className="flex-1 max-w-xs">
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full" 
                style={{ width: `${activePath.overallCompletion}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-right">{activePath.overallCompletion}% Complete</p>
          </div>
        </div>
      </div>
    </div>
  );
}