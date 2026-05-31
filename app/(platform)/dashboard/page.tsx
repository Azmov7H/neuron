"use client";

import { useEffect, useState } from "react";
import { NeuralWelcome } from "@/components/dashboard/neural-welcome";
import { ContinueLearning } from "@/components/dashboard/continue-learning";
import { SparkRecommendation } from "@/components/dashboard/spark-recommendation";
import { ActiveNeuralPath } from "@/components/dashboard/active-neural-path";
import { DailyKnowledgePulse } from "@/components/dashboard/daily-knowledge-pulse";
import { ExploreDomains } from "@/components/dashboard/explore-domains";
import { EvolutionProgress } from "@/components/dashboard/evolution-progress";
import { RecentDiscoveries } from "@/components/dashboard/recent-discoveries";
import { SimulationsPreview } from "@/components/dashboard/simulations-preview";
import { DashboardSecret } from "@/components/dashboard/dashboard-secret";
import type { DashboardSummary } from "@/app/api/dashboard/summary/route";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        // Token handled via httpOnly cookie; no client-side token needed

        const res = await fetch("/api/dashboard/summary");
        
        const payload = await res.json();
        
        if (!res.ok) {
          setError(payload?.error?.message || payload?.message || "Failed to load dashboard.");
          return;
        }
        
        setSummary(payload.data);
      } catch (err) {
        setError("Network error while loading dashboard.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-125">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="flex h-full items-center justify-center min-h-125 text-red-400 font-mono">
        {error || "Unknown error"}
      </div>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Ambient Depth Particles/Glows */}
 {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[800px] h-[800px] rounded-full bg-secondary/10 blur-[150px]"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[150px]"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* 1. Neural Welcome */}
        <NeuralWelcome user={summary.user} activePath={summary.activePath} />
        <DashboardSecret />

        {/* 2 & 3. Continue Learning + Spark */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 animate-fade-up delay-100">
            <ContinueLearning activePath={summary.activePath} />
          </div>
          <div className="lg:col-span-1 animate-fade-up delay-200">
            <SparkRecommendation />
          </div>
        </div>

        {/* 4 & 5. Active Path + Daily Pulse */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 animate-fade-up delay-200">
            <ActiveNeuralPath activePath={summary.activePath} />
          </div>
          <div className="lg:col-span-2 animate-fade-up delay-300">
            <DailyKnowledgePulse />
          </div>
        </div>

        {/* 6. Explore Domains */}
        <div className="animate-fade-up delay-300">
          <ExploreDomains />
        </div>

        {/* 7. Evolution Progress */}
        <div className="animate-fade-up delay-400">
          <EvolutionProgress weeklyStats={summary.weeklyStats} />
        </div>

        {/* 8 & 9. Recent Discoveries + Simulations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="animate-fade-up delay-400">
            <RecentDiscoveries discoveries={summary.recentDiscoveries} />
          </div>
          <div className="animate-fade-up delay-500">
            <SimulationsPreview />
          </div>
        </div>

      </div>
    </main>
  );
}