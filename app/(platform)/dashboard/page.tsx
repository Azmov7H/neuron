// app/(dashboard)/page.tsx
import { NeuralWelcome } from "@/components/dashboard/neural-welcome";
import { ContinueLearning } from "@/components/dashboard/continue-learning";
import { SparkRecommendation } from "@/components/dashboard/spark-recommendation";
import { ActiveNeuralPath } from "@/components/dashboard/active-neural-path";
import { DailyKnowledgePulse } from "@/components/dashboard/daily-knowledge-pulse";
import { ExploreDomains } from "@/components/dashboard/explore-domains";
import { EvolutionProgress } from "@/components/dashboard/evolution-progress";
import { RecentDiscoveries } from "@/components/dashboard/recent-discoveries";
import { SimulationsPreview } from "@/components/dashboard/simulations-preview";

export default function DashboardPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Ambient Depth Particles/Glows */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full animate-breathe pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-secondary/5 rounded-full animate-breathe pointer-events-none delay-4000" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* 1. Neural Welcome */}
        <NeuralWelcome />

        {/* 2 & 3. Continue Learning + Spark */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 animate-fade-up delay-100">
            <ContinueLearning />
          </div>
          <div className="lg:col-span-1 animate-fade-up delay-200">
            <SparkRecommendation />
          </div>
        </div>

        {/* 4 & 5. Active Path + Daily Pulse */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 animate-fade-up delay-200">
            <ActiveNeuralPath />
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
          <EvolutionProgress />
        </div>

        {/* 8 & 9. Recent Discoveries + Simulations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="animate-fade-up delay-400">
            <RecentDiscoveries />
          </div>
          <div className="animate-fade-up delay-500">
            <SimulationsPreview />
          </div>
        </div>

      </div>
    </main>
  );
}