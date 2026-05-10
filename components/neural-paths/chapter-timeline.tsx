// components/neural-paths/chapter-timeline.tsx
import Link from "next/link";
import { CheckCircle, Circle, Lock, Play, Zap } from "lucide-react";

interface Chapter {
  id: string;
  title: string;
  status: "completed" | "active" | "locked";
  xp: number;
}

interface TimelineProps {
  chapters: Chapter[];
  pathSlug: string;
}

export function ChapterTimeline({ chapters, pathSlug }: TimelineProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-xl font-semibold text-foreground mb-8">Journey Milestones</h3>
      
      <div className="relative pl-8">
        <div className="absolute left-3 top-2 bottom-2 w-px bg-white/5" />
        <div 
          className="absolute left-3 top-2 w-px bg-gradient-to-b from-primary to-primary/0 transition-all" 
          style={{ height: `${(chapters.filter(c => c.status === 'completed').length / chapters.length) * 100}%` }} 
        />

        <div className="space-y-8">
          {chapters.map((chapter, index) => {
            const isCompleted = chapter.status === "completed";
            const isActive = chapter.status === "active";
            const isLocked = chapter.status === "locked";

            return (
              <div key={chapter.id} className="relative flex items-start gap-6 group">
                <div className={`absolute -left-8 mt-1 rounded-full p-1 bg-background z-10 ${isActive ? 'shadow-[0_0_15px_rgba(59,130,246,0.5)]' : ''}`}>
                  {isCompleted ? (
                    <CheckCircle className="text-primary" size={24} />
                  ) : isActive ? (
                    <div className="w-6 h-6 rounded-full border-2 border-primary bg-primary/20 flex items-center justify-center animate-pulse">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                  ) : (
                    <Circle className="text-muted-foreground/20" size={24} />
                  )}
                </div>

                <div className={`flex-1 p-6 rounded-xl border transition-all ${
                  isActive 
                    ? "bg-primary/5 border-primary/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]" 
                    : isCompleted 
                      ? "bg-white/5 border-white/5 opacity-80 hover:opacity-100" 
                      : "bg-card/50 border-white/5 opacity-50"
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Chapter {index + 1}</p>
                      <h4 className="text-lg font-semibold text-foreground">{chapter.title}</h4>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Zap size={12} className="text-amber-400" /> {chapter.xp} XP</span>
                      
                      {isLocked ? (
                        <Lock size={16} className="text-muted-foreground/30" />
                      ) : isActive ? (
                        <Link 
                          href={`/dashboard/neural-paths/${pathSlug}/chapter/${chapter.id}`}
                          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all active:scale-95"
                        >
                          <Play size={14} fill="currentColor" /> Explore
                        </Link>
                      ) : (
                        <Link href={`/dashboard/neural-paths/${pathSlug}/chapter/${chapter.id}`} className="text-xs text-primary hover:underline">
                          Revisit
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}