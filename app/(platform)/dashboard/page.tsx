"use client";

import { useEffect, useState } from "react";
import { Loader2, ArrowRight, MonitorPlay, Route } from "lucide-react";
import Link from "next/link";
import type { DashboardSummary } from "@/app/api/dashboard/summary/route";
import { useContextPanel } from "@/components/workspace/use-context-panel";
import { Inspector } from "@/components/workspace/inspector";
import { PanelRow } from "@/components/workspace/panel";

// Modular Dashboard Component Imports
import { NeuralWelcome } from "@/components/dashboard/neural-welcome";
import { ContinueLearning } from "@/components/dashboard/continue-learning";
import { ActiveNeuralPath } from "@/components/dashboard/active-neural-path";
import { EvolutionProgress } from "@/components/dashboard/evolution-progress";
import { SparkRecommendation } from "@/components/dashboard/spark-recommendation";
import { ExploreDomains } from "@/components/dashboard/explore-domains";
import { RecentDiscoveries } from "@/components/dashboard/recent-discoveries";
import { SimulationsPreview } from "@/components/dashboard/simulations-preview";

// ─── Context panel content for the home page ─────────────────

function HomeContextPanel({ summary }: { summary: DashboardSummary }) {
  const { activePath, user } = summary;
  return (
    <div className="py-1">
      <Inspector title="Current Path" defaultOpen>
        {activePath ? (
          <div className="space-y-2">
            <p className="text-[12px] text-foreground font-medium leading-snug">
              {activePath.title}
            </p>
            <div className="h-1 bg-white/8 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                style={{ width: `${activePath.overallCompletion}%` }}
              />
            </div>
            <PanelRow label="Progress" value={`${activePath.overallCompletion}%`} />
            <PanelRow label="Domain" value={activePath.domain} />
            <PanelRow label="Chapter" value={activePath.currentChapterTitle ?? "—"} />
          </div>
        ) : (
          <p className="text-[12px] text-muted-foreground">
            No active path. Choose one from Neural Paths.
          </p>
        )}
      </Inspector>

      <Inspector title="Your Stats" defaultOpen={false}>
        <PanelRow label="Total XP" value={user.totalXP.toLocaleString()} />
        <PanelRow label="Rank" value={user.rank} />
        <PanelRow label="Streak" value={`${user.streak} days`} />
      </Inspector>

      <Inspector title="Spark Suggestion" defaultOpen>
        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground">{"Today's concept:"}</p>
          <p className="text-[12px] text-foreground font-medium leading-snug">
            {"\"How does entropy shape the arrow of time?\""}
          </p>
          <Link
            href="/dashboard/spark"
            className="inline-flex items-center gap-1 text-[11px] text-primary hover:text-primary-800 focus:outline-none focus:ring-1 focus:ring-primary/40 rounded transition-colors mt-1"
          >
            Ask Spark <ArrowRight size={10} />
          </Link>
        </div>
      </Inspector>

      <Inspector title="Quick Access" defaultOpen={false}>
        <div className="space-y-1">
          {[
            { label: "Simulations", href: "/dashboard/simulations", icon: MonitorPlay },
            { label: "Neural Paths", href: "/dashboard/neural-paths", icon: Route },
          ].map(({ label, href, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className="flex items-center gap-2 py-1.5 text-[12px] text-muted-foreground hover:text-foreground focus:outline-none focus:text-foreground transition-colors"
            >
              <Icon size={12} /> {label}
            </Link>
          ))}
        </div>
      </Inspector>
    </div>
  );
}

// ─── Dashboard Home Page ──────────────────────────────────────

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch("/api/dashboard/summary");
        const payload = await res.json();
        if (!res.ok) {
          setError(payload?.error?.message || payload?.message || "Failed to load dashboard.");
          return;
        }
        setSummary(payload.data);
      } catch {
        setError("Network error while loading dashboard.");
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  // Populate context panel when summary is ready
  useContextPanel(
    summary ? <HomeContextPanel summary={summary} /> : null,
    [summary]
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary w-6 h-6" />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="flex h-full items-center justify-center min-h-[60vh] text-red-400 font-mono text-sm">
        {error ?? "Unknown error"}
      </div>
    );
  }

  const { user, activePath, weeklyStats, recentDiscoveries } = summary;

  return (
    <div className="min-h-full p-6 space-y-6 animate-fade-in max-w-[1400px] mx-auto">
      {/* ── Welcome Header Strip ── */}
      <NeuralWelcome user={user} activePath={activePath} />

      {/* ── Main 2-column workspace ── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* ── LEFT: Active learning surface (col-span 3) ── */}
        <div className="xl:col-span-3 space-y-5">
          <ContinueLearning activePath={activePath} />
          <ActiveNeuralPath activePath={activePath} />
          <EvolutionProgress weeklyStats={weeklyStats} />
        </div>

        {/* ── RIGHT: Activity feed & navigation (col-span 2) ── */}
        <div className="xl:col-span-2 space-y-5">
          <SparkRecommendation />
          <ExploreDomains />
          <RecentDiscoveries discoveries={recentDiscoveries} />
          <SimulationsPreview />
        </div>
      </div>
    </div>
  );
}