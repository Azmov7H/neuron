"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Zap, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ChapterViewPage() {
  const params = useParams();
  const router = useRouter();
  const pathId = params.pathId as string;
  const chapterId = params.chapterId as string;
  
  const [pathData, setPathData] = useState<any>(null);
  const [chapterData, setChapterData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completionResult, setCompletionResult] = useState<any>(null);

  useEffect(() => {
    async function fetchChapter() {
      try {

        const res = await fetch(`/api/neural-paths/${pathId}`, {
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
        });

        if (res.ok) {
          const data = await res.json();
          setPathData(data.data);
          const ch = data.data.chapters.find((c: any) => c.id === chapterId);
          setChapterData(ch);
        }
      } catch (err) {
        console.error("Failed to fetch chapter details", err);
      } finally {
        setLoading(false);
      }
    }

    fetchChapter();
  }, [pathId, chapterId]);

  const completeChapter = async () => {
    if (completing || chapterData?.isCompleted) return;
    setCompleting(true);

    try {

      const res = await fetch("/api/neural-paths/complete-chapter", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pathId: pathData._id, chapterId }),
      });

      if (res.ok) {
        const result = await res.json();
        setCompletionResult(result.data);
      }
    } catch (err) {
      console.error("Failed to complete chapter", err);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!chapterData) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <h2 className="text-xl text-foreground">Chapter not found</h2>
        <Link href={`/dashboard/neural-paths/${pathId}`} className="text-primary hover:underline">Return to Path</Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Link href={`/dashboard/neural-paths/${pathId}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} /> Back to Path Curriculum
        </Link>
        
        <div className="glass rounded-2xl p-10 glow-border">
          <div className="mb-8">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-primary/80 mb-2 block">Chapter {chapterData.order}</span>
            <h1 className="text-3xl font-bold text-foreground mb-4">{chapterData.title}</h1>
            <p className="text-muted-foreground text-lg">{chapterData.description}</p>
          </div>

          <div className="space-y-6">
            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Learning Objectives</h3>
              <ul className="space-y-2">
                {chapterData.objectives.map((obj: string, i: number) => (
                  <li key={i} className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {obj}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Key Concepts</h3>
              <div className="flex flex-wrap gap-2">
                {chapterData.concepts.map((concept: string, i: number) => (
                  <span key={i} className="bg-secondary/10 text-secondary text-xs px-3 py-1 rounded-full">
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col items-center">
            {completionResult || chapterData.isCompleted ? (
              <div className="text-center animate-fade-up">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="text-emerald-500" size={32} />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Chapter Complete!</h3>
                {completionResult?.xpEarned && (
                  <p className="text-emerald-400 font-semibold flex items-center justify-center gap-2 mb-6">
                    <Zap size={16} /> +{completionResult.xpEarned} XP Earned
                  </p>
                )}
                {completionResult?.nextChapterId ? (
                  <button 
                    onClick={() => {
                      window.location.href = `/dashboard/neural-paths/${pathId}/chapter/${completionResult.nextChapterId}`;
                    }}
                    className="bg-primary text-white px-8 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Continue to Next Chapter
                  </button>
                ) : (
                  <Link 
                    href={`/dashboard/neural-paths/${pathId}`}
                    className="bg-primary text-white px-8 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors inline-block"
                  >
                    Return to Path
                  </Link>
                )}
              </div>
            ) : (
              <button 
                onClick={completeChapter}
                disabled={completing}
                className="bg-primary text-white px-8 py-4 rounded-xl font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2 w-full justify-center md:w-auto min-w-[250px]"
              >
                {completing ? <Loader2 className="animate-spin" /> : 'Mark as Complete'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
