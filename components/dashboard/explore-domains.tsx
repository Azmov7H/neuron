"use client";

import { Atom, Brain, Dna, Pi, Orbit, Telescope, FlaskConical, Cpu, ArrowRight, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const domains = [
  {
    label: "Physics",
    icon: Atom,
    desc: "Classical & relativistic mechanics",
    colorVar: "--sci-physics",
    href: "/dashboard/simulations?domain=physics",
  },
  {
    label: "Biology",
    icon: Dna,
    desc: "Molecular genetics & cellular systems",
    colorVar: "--sci-biology",
    href: "/dashboard/simulations?domain=biology",
  },
  {
    label: "AI",
    icon: Brain,
    desc: "Neural networks & cognitive modeling",
    colorVar: "--sci-ai",
    href: "/dashboard/explore?domain=ai",
  },
  {
    label: "Mathematics",
    icon: Pi,
    desc: "Abstract geometry & field theory",
    colorVar: "--sci-math",
    href: "/dashboard/explore?domain=mathematics",
  },
  {
    label: "Quantum",
    icon: Orbit,
    desc: "Superposition & wave mechanics",
    colorVar: "--sci-quantum",
    href: "/dashboard/simulations?domain=quantum",
  },
  {
    label: "Astronomy",
    icon: Telescope,
    desc: "Astrophysics & stellar evolution",
    colorVar: "--sci-astronomy",
    href: "/dashboard/explore?domain=astronomy",
  },
  {
    label: "Chemistry",
    icon: FlaskConical,
    desc: "Molecular bonds & thermodynamics",
    colorVar: "--sci-chemistry",
    href: "/dashboard/simulations?domain=chemistry",
  },
  {
    label: "Technology",
    icon: Cpu,
    desc: "Systems design & computer science",
    colorVar: "--sci-tech",
    href: "/dashboard/explore?domain=technology",
  },
];

export function ExploreDomains() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-card p-5 animate-fade-in shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-semibold text-foreground">Explore Domains</h3>
        <Link
          href="/dashboard/explore"
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          All domains <ArrowRight size={10} />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {domains.map((d) => (
          <Link
            key={d.label}
            href={d.href}
            className={cn(
              "relative flex flex-col p-3.5 rounded-[var(--radius-md)] border text-left",
              "transition-all duration-250 hover:-translate-y-0.5 cursor-pointer group overflow-hidden",
              "bg-white/2 border-white/5 hover:border-white/12"
            )}
          >
            {/* Domain halo on hover */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-[inherit]"
              style={{
                background: `radial-gradient(ellipse 80% 60% at 50% 0%, hsl(${d.colorVar}/0.12) 0%, transparent 70%)`,
              }}
            />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2.5">
                <d.icon
                  size={18}
                  style={{ color: `hsl(var(${d.colorVar}))` }}
                  className="group-hover:scale-110 transition-transform duration-250"
                />
                <ArrowRight
                  size={10}
                  className="text-muted-foreground/20 group-hover:text-muted-foreground/70 group-hover:translate-x-0.5 transition-all duration-200"
                />
              </div>
              <h4 className="text-[11px] font-semibold text-foreground mb-0.5">{d.label}</h4>
              <p className="text-[10px] text-muted-foreground leading-normal line-clamp-2">{d.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* All domains link — bottom */}
      <Link
        href="/dashboard/explore"
        className="mt-4 flex items-center justify-center gap-2 py-2 rounded-[var(--radius-sm)] border border-white/5 text-[11px] text-muted-foreground hover:text-foreground hover:border-white/10 hover:bg-white/3 transition-all"
      >
        <LayoutGrid size={11} />
        Browse all scientific domains
      </Link>
    </div>
  );
}