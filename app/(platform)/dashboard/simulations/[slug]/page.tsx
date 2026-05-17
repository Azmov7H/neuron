// app/(platform)/dashboard/simulations/[slug]/page.tsx
import { use } from "react";
import { SimulationRunner } from "@/components/simulation-runner/simulation-runner";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function SimulationPage({ params }: PageProps) {
  const { slug } = use(params);

  return (
    <div className="w-full h-[calc(100vh-8.5rem)] p-4 relative overflow-hidden bg-background">
      <SimulationRunner slug={slug} />
    </div>
  );
}