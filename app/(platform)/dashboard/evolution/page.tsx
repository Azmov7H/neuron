"use client";

import { useEffect, useState } from "react";
import { HeroEvolution } from "@/components/evolution/hero-evolution";
import { NeuralStreak } from "@/components/evolution/neural-streak";
import { CognitiveInsights } from "@/components/evolution/cognitive-insights";
import { KnowledgeMastery } from "@/components/evolution/knowledge-mastery";
import { EvolutionTimeline } from "@/components/evolution/evolution-timeline";
import { Milestones } from "@/components/evolution/milestones";
import { Loader2 } from "lucide-react";

export default function EvolutionPage() {
  const [state, setState] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvolutionData() {
      try {
        const token = localStorage.getItem("neuronAccessToken");
        if (!token) return;

        const [resMe, resLogs] = await Promise.all([
          fetch("/api/evolution/me", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/evolution/logs", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (resMe.ok && resLogs.ok) {
          const dataMe = await resMe.json();
          const dataLogs = await resLogs.json();
          setState(dataMe.data);
          setLogs(dataLogs.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch evolution data", err);
      } finally {
        setLoading(false);
      }
    }

    fetchEvolutionData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {state && (
          <HeroEvolution 
            user={{ 
              totalXP: state.user.totalXP, 
              rank: state.user.rank 
            }} 
            nextRankXP={state.nextRankXP} 
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {state && <NeuralStreak streak={state.user.streak} />}
          {state && <CognitiveInsights userDomains={state.user.domains} />}
        </div>

        {state && <KnowledgeMastery userDomains={state.user.domains} />}

        <EvolutionTimeline logs={logs} />

        {state && <Milestones streak={state.user.streak} stats={state.stats} />}

      </div>
    </div>
  );
}