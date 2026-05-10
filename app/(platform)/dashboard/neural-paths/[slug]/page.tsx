// app/(platform)/dashboard/neural-paths/[slug]/page.tsx
import { use } from "react";
import { pathsData } from "@/lib/mock-data";
import { PathHero } from "@/components/neural-paths/path-hero";
import { ChapterTimeline } from "@/components/neural-paths/chapter-timeline";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function PathDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const path = pathsData.find(p => p.slug === slug);

  if (!path) {
    notFound();
  }

  return (
    <div className="relative min-h-screen">
      <PathHero path={path} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ChapterTimeline chapters={path.chapters} pathSlug={path.slug} />
      </div>
    </div>
  );
}