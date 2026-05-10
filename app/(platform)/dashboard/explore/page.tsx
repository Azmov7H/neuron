// app/(platform)/dashboard/explore/page.tsx
import { ExploreHero } from "@/components/explore/explore-hero";
import { DomainsGrid } from "@/components/explore/domains-grid";
import { TrendingConcepts } from "@/components/explore/trending-concepts";
import { RecommendedExplorations } from "@/components/explore/recommended-explorations";
import { FeaturedPaths } from "@/components/explore/featured-paths";
import { KnowledgeConnections } from "@/components/explore/knowledge-connections";
import { DiscoveryStream } from "@/components/explore/discovery-stream";
import { SimulationsPreview } from "@/components/explore/simulations-preview";

export default function ExplorePage() {
  return (
    <div className="relative min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
        
        <ExploreHero />
        <DomainsGrid />
        <TrendingConcepts />
        <RecommendedExplorations />
        <FeaturedPaths />
        <KnowledgeConnections />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <DiscoveryStream />
          <SimulationsPreview />
        </div>

      </div>
    </div>
  );
}