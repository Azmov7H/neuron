"use client";

import { useEffect, useState } from "react";
import { FeaturedPath } from "@/components/neural-paths/featured-path";
import { ContinuePath } from "@/components/neural-paths/continue-path";
import { PathCategories } from "@/components/neural-paths/path-categories";
import { RecommendedGrid } from "@/components/neural-paths/recommended-grid";
import { Loader2 } from "lucide-react";
import { categories } from "@/lib/mock-data"; // We can keep categories as static UI config for now

export default function NeuralPathsPage() {
  const [paths, setPaths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPaths() {
      try {
        const token = localStorage.getItem("neuronAccessToken");
        if (!token) return;

        const res = await fetch("/api/neural-paths", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        setPaths(data.data?.items || []);
      } catch (err) {
        console.error("Failed to fetch paths", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPaths();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Find paths based on progress
  const featuredPath = paths.length > 0 ? paths.reduce((prev, current) => (prev.xpReward > current.xpReward) ? prev : current) : null;
  const continuePath = paths.find(p => p.progress > 0 && p.progress < 100);
  const recommendedPaths = paths.filter(p => p.progress === 0);

  return (
    <div className="relative min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        
        {/* Featured Cinematic Path */}
        {featuredPath && (
          <section className="animate-fade-up">
            <FeaturedPath path={featuredPath} />
          </section>
        )}

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
        {recommendedPaths.length > 0 && (
          <section className="animate-fade-up delay-300">
            <RecommendedGrid paths={recommendedPaths} />
          </section>
        )}

      </div>
    </div>
  );
}