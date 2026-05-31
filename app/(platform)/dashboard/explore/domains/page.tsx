"use client";

import { useEffect, useState } from "react";
import { DomainsGrid } from "@/components/explore/domains-grid";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DomainsPage() {
  const [domains, setDomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDomains() {
      try {

        const res = await fetch("/api/explore/domains", {
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
        });

        const data = await res.json();
        setDomains(data.data || []);
      } catch (err) {
        console.error("Failed to fetch domains", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDomains();
  }, []);

  const handleDomainClick = async (name: string) => {
    try {

      await fetch("/api/explore/activity", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: 'view_domain', targetId: name }),
      });
      // Future: route to specific domain page
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
        <DomainsGrid domains={domains} onDomainClick={handleDomainClick} />
      </div>
    </div>
  );
}
