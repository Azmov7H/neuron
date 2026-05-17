"use client";

import { useEffect, useState } from "react";
import { TrendingConcepts } from "@/components/explore/trending-concepts";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TrendingPage() {
  const [concepts, setConcepts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConcepts() {
      try {
        const token = localStorage.getItem("neuronAccessToken");
        if (!token) return;

        const res = await fetch("/api/explore/trending", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        setConcepts(data.data || []);
      } catch (err) {
        console.error("Failed to fetch concepts", err);
      } finally {
        setLoading(false);
      }
    }

    fetchConcepts();
  }, []);

  const handleConceptClick = async (name: string) => {
    try {
      const token = localStorage.getItem("neuronAccessToken");
      if (!token) return;

      await fetch("/api/explore/activity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'view_concept', targetId: name }),
      });
      // Future: route to specific concept page
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
        <TrendingConcepts concepts={concepts} onConceptClick={handleConceptClick} />
      </div>
    </div>
  );
}
