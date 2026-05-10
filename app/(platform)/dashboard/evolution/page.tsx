// app/(platform)/dashboard/evolution/page.tsx
import { HeroEvolution } from "@/components/evolution/hero-evolution";
import { NeuralStreak } from "@/components/evolution/neural-streak";
import { CognitiveInsights } from "@/components/evolution/cognitive-insights";
import { KnowledgeMastery } from "@/components/evolution/knowledge-mastery";
import { EvolutionTimeline } from "@/components/evolution/evolution-timeline";
import { Milestones } from "@/components/evolution/milestones";

export default function EvolutionPage() {
  return (
    <div className="relative min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        <HeroEvolution />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NeuralStreak />
          <CognitiveInsights />
        </div>

        <KnowledgeMastery />

        <EvolutionTimeline />

        <Milestones />

      </div>
    </div>
  );
}