"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Play, Lock, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function PathDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const pathId = params.pathId as string;
  
  const [pathData, setPathData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPathDetails() {
      try {

        const res = await fetch(`/api/neural-paths/${pathId}`, {
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
        });

        if (res.ok) {
          const data = await res.json();
          setPathData(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch path details", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPathDetails();
  }, [pathId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!pathData) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <h2 className="text-xl text-foreground">Path not found</h2>
        <Link href="/dashboard/neural-paths" className="text-primary hover:underline">Return to Paths</Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Link href="/dashboard/neural-paths" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} /> Back to Paths
        </Link>
        
        <div className="glass rounded-2xl p-8 glow-border">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-widest font-semibold text-primary/80 mb-2 block">{pathData.category}</span>
              <h1 className="text-3xl font-bold text-foreground mb-4">{pathData.title}</h1>
              <p className="text-muted-foreground mb-6">{pathData.description}</p>
              
              <div className="flex items-center gap-4 text-sm">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">{pathData.xpReward} XP</span>
                <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full capitalize">{pathData.difficulty}</span>
                <span className="text-muted-foreground">{pathData.overallCompletion}% Completed</span>
              </div>
            </div>
            
            <div className="hidden md:block">
              {/* Progress Circle Visual */}
              <div className="w-24 h-24 rounded-full border-4 border-primary/20 flex items-center justify-center relative">
                <span className="text-lg font-bold text-foreground">{pathData.overallCompletion}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground mb-6">Curriculum</h2>
          
          {pathData.chapters.map((chapter: any) => (
            <div 
              key={chapter.id}
              className={`glass rounded-xl p-6 border transition-all ${chapter.isCurrent ? 'border-primary shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'border-white/5'} ${!chapter.isUnlocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}`}
              onClick={() => {
                if (chapter.isUnlocked) {
                  router.push(`/dashboard/neural-paths/${pathData.slug}/chapter/${chapter.id}`);
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                    {chapter.isCompleted ? (
                      <CheckCircle2 className="text-emerald-500" size={20} />
                    ) : chapter.isUnlocked ? (
                      <Play className="text-primary" size={20} />
                    ) : (
                      <Lock className="text-muted-foreground" size={20} />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{chapter.title}</h3>
                    <p className="text-sm text-muted-foreground">{chapter.duration} mins • {chapter.concepts.length} Concepts</p>
                  </div>
                </div>
                {chapter.isCurrent && (
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">Current</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
