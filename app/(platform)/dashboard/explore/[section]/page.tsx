"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Box } from "lucide-react";

export default function DynamicExploreSectionPage() {
  const params = useParams();
  const section = params.section as string;

  return (
    <div className="relative min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Link href="/dashboard/explore" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} /> Back to Hub
        </Link>
        
        <div className="glass rounded-2xl p-12 text-center glow-border flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
            <Box size={32} />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-4 capitalize">
            {section.replace("-", " ")}
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            This section is dynamically routed. Future specific content for the "{section}" category will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
