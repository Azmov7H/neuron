"use client";

import { useEffect, useState } from "react";
import { ExploreHero } from "@/components/explore/explore-hero";
import { ExploreCard } from "@/components/explore/ExploreCard";
import { Loader2 } from "lucide-react";

export default function ExplorePage() {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNavConfig() {
      try {

        const res = await fetch("/api/explore/navigation", {
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
        });

        const data = await res.json();
        
        if (data?.data?.sections) {
          setSections(data.data.sections);
        }
      } catch (err) {
        console.error("Failed to fetch navigation config", err);
      } finally {
        setLoading(false);
      }
    }

    fetchNavConfig();
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
        
        <ExploreHero />
        
        <section className="animate-fade-up delay-100">
          <h2 className="text-2xl font-bold text-foreground mb-8">Exploration Hub</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.filter(s => s.isActive).map(section => (
              <ExploreCard key={section.id} section={section} />
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}