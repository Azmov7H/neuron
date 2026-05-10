// app/(platform)/dashboard/simulations/[slug]/page.tsx
import { use } from "react";
import { SimulationRunner } from "@/components/simulation-runner/simulation-runner";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function SimulationPage({ params }: PageProps) {
  const { slug } = use(params);

  return (
    <div className="min-h-screen h-screen lg:h-[calc(100vh-4rem)] lg:-m-8 relative overflow-hidden bg-background">
      <SimulationRunner slug={slug} />
    </div>
  );
}