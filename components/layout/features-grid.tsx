import { FeatureCard } from "./feature-card";
import { KnowledgeMap } from "./knowledge-map"

const features = [
  {
    id: "quantum",
    icon: "quantum",
    tag: "Module 01",
    title: "Quantum Fluid Dynamics",
    description:
      "Simulate complex fluid systems at quantum resolution. Visualize flow patterns that emerge from molecular interactions in real-time.",
    image: "https://picsum.photos/seed/quantum-fluid/600/400.jpg",
    accent: "primary" as const,
  },
  {
    id: "mentorship",
    icon: "brain",
    tag: "Module 02",
    title: "AI Mentorship",
    description:
      "Personalized neural guidance that adapts to your cognitive patterns. Learn faster with an AI mentor that evolves alongside you.",
    image: "https://picsum.photos/seed/ai-mentor-face/600/400.jpg",
    accent: "secondary" as const,
  },
  {
    id: "simulations",
    icon: "simulation",
    tag: "Module 03",
    title: "Simulations",
    description:
      "Run high-fidelity simulations of reality layers. Test hypotheses, explore outcomes, and compress months of learning into hours.",
    image: "https://picsum.photos/seed/neural-sim/600/400.jpg",
    accent: "primary" as const,
  },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="relative py-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section Title */}
        <div className="mb-16 text-center">
          <span className="font-mono text-xs font-medium uppercase tracking-widest text-primary">
            Core Modules
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Neural Pathways to Mastery
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Four interconnected modules designed to accelerate your cognitive evolution through AI-powered systems.
          </p>
        </div>

        {/* Feature Cards - First Row of 3 Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.id} {...feature} />
          ))}

          {/* Knowledge Map Card - Larger Size */}
          <div className="md:col-span-2 lg:col-span-3">
            <div className="glow-border group relative overflow-hidden rounded-2xl border border-border bg-card p-0 transition-all duration-500 hover:border-primary/30">
              <div className="grid lg:grid-cols-2">
                {/* Text Content */}
                <div className="flex flex-col justify-center p-8 lg:p-10">
                  <span className="font-mono text-xs font-medium uppercase tracking-widest text-secondary">
                    Module 04
                  </span>
                  <h3 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                    Knowledge Maps
                  </h3>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    Navigate the interconnected landscape of human knowledge through dynamic node graphs. Discover hidden relationships and accelerate understanding through spatial learning.
                  </p>
                  <div className="mt-6 flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary border border-secondary/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                      Live Graph
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1 text-xs font-medium text-primary border border-primary/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      247 Nodes
                    </span>
                  </div>
                </div>
                {/* Interactive Knowledge Map */}
                <div className="relative min-h-[300px] lg:min-h-[400px] bg-muted/30">
                  <KnowledgeMap />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}