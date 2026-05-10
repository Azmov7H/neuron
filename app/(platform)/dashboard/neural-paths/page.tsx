// app/(dashboard)/neural-paths/page.tsx
import { pathsData, categories } from "@/lib/mock-data";
import { FeaturedPath } from "@/components/neural-paths/featured-path";
import { ContinuePath } from "@/components/neural-paths/continue-path";
import { PathCategories } from "@/components/neural-paths/path-categories";
import { RecommendedGrid } from "@/components/neural-paths/recommended-grid";

export default function NeuralPathsPage() {
  const featuredPath = pathsData[0];
  const continuePath = pathsData.find(p => p.progress > 0 && p.progress < 100);
  const recommendedPaths = pathsData.filter(p => p.progress === 0);

  return (
    <div className="relative min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        
        {/* Featured Cinematic Path */}
        <section className="animate-fade-up">
          <FeaturedPath path={featuredPath} />
        </section>

        {/* Continue Journey */}
        {continuePath && (
          <section className="animate-fade-up delay-100">
            <ContinuePath path={continuePath} />
          </section>
        )}

        {/* Categories */}
        <section className="animate-fade-up delay-200">
          <PathCategories categories={categories} />
        </section>

        {/* Recommended Paths */}
        <section className="animate-fade-up delay-300">
          <RecommendedGrid paths={recommendedPaths} />
        </section>

      </div>
    </div>
  );
}