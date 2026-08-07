import { type LucideIcon, Atom, Compass, Heart, Landmark, Brain, Orbit } from "lucide-react";

// The 17 canvas-backed simulations rendered by the <SimulationRunner> engine.
// Every other configuration falls back to the SVG "Conceptual Telemetry" mode.
export const INTERACTIVE_SIM_IDS = [
  "relativity", "motion", "gravity",
  "bacteria", "virus", "immune",
  "heart", "neural", "blood",
  "functions", "probability", "graph",
  "wave", "uncertainty",
  "orbit", "blackhole", "stellar",
];

export const isInteractiveSim = (id: string): boolean => INTERACTIVE_SIM_IDS.includes(id);

export interface DomainStyle {
  label: string;
  icon: LucideIcon;
  text: string;
  bg: string;
  border: string;
}

// SciOS token mapping for the six simulation domains.
export const DOMAIN_STYLES: Record<string, DomainStyle> = {
  physics:     { label: "Physics",     icon: Atom,     text: "text-sci-physics",  bg: "bg-sci-physics/10",  border: "border-sci-physics/20" },
  biology:     { label: "Biology",     icon: Compass,  text: "text-sci-biology",  bg: "bg-sci-biology/10",  border: "border-sci-biology/20" },
  anatomy:     { label: "Anatomy",     icon: Heart,    text: "text-sci-anatomy",  bg: "bg-sci-anatomy/10",  border: "border-sci-anatomy/20" },
  mathematics: { label: "Mathematics", icon: Landmark, text: "text-sci-math",     bg: "bg-sci-math/10",     border: "border-sci-math/20" },
  quantum:     { label: "Quantum",     icon: Brain,    text: "text-sci-quantum",  bg: "bg-sci-quantum/10",  border: "border-sci-quantum/20" },
  space:       { label: "Space",       icon: Orbit,    text: "text-sci-space",    bg: "bg-sci-space/10",    border: "border-sci-space/20" },
};

// Stable ordering used across the hub and runner sidebars.
export const DOMAIN_ORDER = ["physics", "biology", "anatomy", "mathematics", "quantum", "space"];
