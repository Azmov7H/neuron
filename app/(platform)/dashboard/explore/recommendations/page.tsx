"use client";

import { useEffect, useState } from "react";
import { RecommendedExplorations } from "@/components/explore/recommended-explorations";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecommendations() {
      try {

        const res = await fetch("/api/explore/recommendations", {
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
        });

        const data = await res.json();
        setRecommendations(data.data || []);
      } catch (err) {
        console.error("Failed to fetch recommendations", err);
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendations();
  }, []);

  const handleRecommendationClick = async (name: string) => {
    try {

      await fetch("/api/explore/activity", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: 'view_recommendation', targetId: name }),
      });
      // Future: route to specific recommendation page
    } catch (err) {
      console.error("Failed to log activity", err);
    }
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Link href="/dashboard/explore" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} /> Back to Hub
        </Link>
        <RecommendedExplorations recommendations={recommendations} onRecommendationClick={handleRecommendationClick} />
      </div>
    </div>
  );
}
