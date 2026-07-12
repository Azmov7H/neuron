"use client";

import { Atom, Brain, Dna, Pi, Orbit, Telescope, ArrowRight } from "lucide-react";
import Link from "next/link";

const domains = [
  {
    label: "Physics",
    icon: Atom,
    desc: "Classical and relativistic mechanics",
    colorClass: "text-sci-physics",
    bgClass: "bg-sci-physics/8 border-sci-physics/10 hover:border-sci-physics/20",
    href: "/dashboard/simulations",
  },
  {
    label: "Biology",
    icon: Dna,
    desc: "Molecular genetics & cellular systems",
    colorClass: "text-sci-biology",
    bgClass: "bg-sci-biology/8 border-sci-biology/10 hover:border-sci-biology/20",
    href: "/dashboard/simulations",
  },
  {
    label: "AI",
    icon: Brain,
    desc: "Neural networks & cognitive modeling",
    colorClass: "text-sci-ai",
    bgClass: "bg-sci-ai/8 border-sci-ai/10 hover:border-sci-ai/20",
    href: "/dashboard/explore",
  },
  {
    label: "Mathematics",
    icon: Pi,
    desc: "Abstract geometry & field theory",
    colorClass: "text-sci-math",
    bgClass: "bg-sci-math/8 border-sci-math/10 hover:border-sci-math/20",
    href: "/dashboard/explore",
  },
  {
    label: "Quantum",
    icon: Orbit,
    desc: "Superposition & wave mechanics",
    colorClass: "text-sci-quantum",
    bgClass: "bg-sci-quantum/8 border-sci-quantum/10 hover:border-sci-quantum/20",
    href: "/dashboard/simulations",
  },
  {
    label: "Astronomy",
    icon: Telescope,
    desc: "Astrophysics & stellar evolution",
    colorClass: "text-sci-astronomy",
    bgClass: "bg-sci-astronomy/8 border-sci-astronomy/10 hover:border-sci-astronomy/20",
    href: "/dashboard/explore",
  },
];

export function ExploreDomains() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-card p-5 animate-fade-in shadow-sm">
      <h3 className="text-[13px] font-semibold text-foreground mb-4">Explore Domains</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {domains.map((d) => (
          <Link
            key={d.label}
            href={d.href}
            className={`flex flex-col p-4 rounded-[var(--radius-md)] border text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md cursor-pointer group ${d.bgClass}`}
          >
            <div className="flex items-center justify-between mb-3">
              <d.icon size={20} className={`${d.colorClass} group-hover:scale-105 transition-transform duration-300`} />
              <ArrowRight size={12} className="text-muted-foreground/30 group-hover:text-muted-foreground/80 group-hover:translate-x-0.5 transition-all" />
            </div>
            <h4 className="text-[12px] font-semibold text-foreground mb-1">{d.label}</h4>
            <p className="text-[10px] text-muted-foreground leading-normal">{d.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}