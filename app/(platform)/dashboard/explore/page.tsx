"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Atom, Lightbulb, Sparkles, LucideIcon, Loader2 } from "lucide-react";
import { ExploreHero } from "@/components/explore/explore-hero";
import { ExploreCard } from "@/components/explore/ExploreCard";
import { DomainsGrid } from "@/components/explore/domains-grid";
import { TrendingConcepts } from "@/components/explore/trending-concepts";
import { FeaturedPaths } from "@/components/explore/featured-paths";
import { RecommendedExplorations } from "@/components/explore/recommended-explorations";
import { DiscoveryStream, DiscoveryItem } from "@/components/explore/discovery-stream";
import { KnowledgeConnections } from "@/components/explore/knowledge-connections";
import { SimulationsPreview } from "@/components/explore/simulations-preview";
import type { ExploreDomain } from "@/types/explore";
import type { IRecommendation } from "@/types";
import type { NeuralPathItem } from "@/types/neural-paths";

interface NavSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  type: string;
  isActive: boolean;
}

interface ActivityDTO {
  _id: string;
  action: string;
  targetId: string;
  createdAt: string;
}

const ACTIVITY_ICON: Record<string, { icon: LucideIcon; color: string }> = {
  view_domain: { icon: Atom, color: "text-blue-400" },
  view_concept: { icon: Lightbulb, color: "text-emerald-400" },
  view_recommendation: { icon: Sparkles, color: "text-purple-400" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function mapActivity(activities: ActivityDTO[]): DiscoveryItem[] {
  return activities.slice(0, 6).map((a) => {
    const meta = ACTIVITY_ICON[a.action] ?? ACTIVITY_ICON.view_concept;
    const label =
      a.action === "view_domain"
        ? `Explored ${a.targetId}`
        : a.action === "view_recommendation"
          ? "Viewed a recommendation"
          : `Viewed ${a.targetId}`;
    return {
      icon: meta.icon,
      title: label,
      desc: `You explored ${a.targetId}`,
      time: timeAgo(a.createdAt),
      color: meta.color,
    };
  });
}

export default function ExplorePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<NavSection[]>([]);
  const [domains, setDomains] = useState<ExploreDomain[]>([]);
  const [concepts, setConcepts] = useState<string[]>([]);
  const [paths, setPaths] = useState<NeuralPathItem[]>([]);
  const [recommendations, setRecommendations] = useState<IRecommendation[]>([]);
  const [discoveryItems, setDiscoveryItems] = useState<DiscoveryItem[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [navRes, domRes, trendRes, pathsRes, recRes, actRes] = await Promise.all([
          fetch("/api/explore/navigation", { credentials: "include" }),
          fetch("/api/explore/domains", { credentials: "include" }),
          fetch("/api/explore/trending", { credentials: "include" }),
          fetch("/api/neural-paths?limit=4", { credentials: "include" }),
          fetch("/api/recommendations", { credentials: "include" }),
          fetch("/api/explore/activity", { credentials: "include" }),
        ]);

        const nav = await navRes.json();
        const dom = await domRes.json();
        const trend = await trendRes.json();
        const pathsData = await pathsRes.json();
        const recs = await recRes.json();
        const acts = await actRes.json();

        setSections(nav.data?.sections ?? []);
        setDomains(dom.data ?? []);
        setConcepts(trend.data ?? []);
        setPaths(pathsData.data?.items ?? []);
        setRecommendations(recs.data ?? []);
        setDiscoveryItems(mapActivity(acts.data ?? []));
      } catch (err) {
        console.error("Failed to load explore hub", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const logActivity = async (action: string, targetId: string) => {
    try {
      await fetch("/api/explore/activity", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, targetId }),
      });
    } catch {
      // activity logging is best-effort
    }
  };

  const handleDomainClick = async (name: string) => {
    await logActivity("view_domain", name);
    router.push("/dashboard/neural-paths");
  };

  const handleConceptClick = async (name: string) => {
    await logActivity("view_concept", name);
    router.push("/dashboard/neural-paths");
  };

  const handleRecommendationClick = async (id: string, targetId: string) => {
    void targetId;
    try {
      await fetch("/api/recommendations/click", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendationId: id }),
      });
    } catch {
      // click tracking is best-effort
    }
    router.push("/dashboard/neural-paths");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
        <ExploreHero />

        {sections.filter((s) => s.isActive).length > 0 && (
          <section className="animate-fade-up delay-100">
            <h2 className="text-2xl font-bold text-foreground mb-8">Exploration Hub</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sections.filter((s) => s.isActive).map((section) => (
                <ExploreCard key={section.id} section={section} />
              ))}
            </div>
          </section>
        )}

        <div id="domains" className="scroll-mt-24">
          <DomainsGrid domains={domains} onDomainClick={handleDomainClick} />
        </div>

        <div id="trending" className="scroll-mt-24">
          <TrendingConcepts concepts={concepts} onConceptClick={handleConceptClick} />
        </div>

        <FeaturedPaths paths={paths} />

        <RecommendedExplorations
          recommendations={recommendations}
          onRecommendationClick={handleRecommendationClick}
        />

        <DiscoveryStream items={discoveryItems.length > 0 ? discoveryItems : undefined} />

        <div id="connections" className="scroll-mt-24">
          <KnowledgeConnections />
        </div>

        <SimulationsPreview />
      </div>
    </div>
  );
}
