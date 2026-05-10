// app/(platform)/dashboard/simulations/page.tsx
import { SimulationsHero } from "@/components/simulations/simulations-hero";
import { SimCategories } from "@/components/simulations/sim-categories";
import { ContinueExperimenting } from "@/components/simulations/continue-experimenting";
import { ExperimentalLabs } from "@/components/simulations/experimental-labs";

export default function SimulationsPage() {
  return (
    <div className="relative min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
        <SimulationsHero />
        <SimCategories />
        <ContinueExperimenting />
        <ExperimentalLabs />
      </div>
    </div>
  );
}