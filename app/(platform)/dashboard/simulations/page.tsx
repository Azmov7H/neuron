import { SimulationsHero } from "@/components/simulations/simulations-hero";
import { SimCategories } from "@/components/simulations/sim-categories";
import { ContinueExperimenting } from "@/components/simulations/continue-experimenting";
import { ExperimentalLabs } from "@/components/simulations/experimental-labs";

export default function SimulationsPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12">
            <SimulationsHero />
          </div>
          <div className="col-span-12">
            <ContinueExperimenting />
          </div>
          <div className="col-span-12">
            <SimCategories />
          </div>
          <div className="col-span-12">
            <ExperimentalLabs />
          </div>
        </div>
      </div>
    </div>
  );
}
