"use client";

import { MonitorPlay, ArrowRight, Play, Atom, Dna, Brain, FlaskConical } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const FEATURED = [
  {
    id: "pendulum",
    label: "Double Pendulum",
    domain: "Physics",
    domainColor: "hsl(var(--sci-physics))",
    icon: Atom,
    status: "ready" as const,
    href: "/dashboard/simulations?slug=double-pendulum",
  },
  {
    id: "dna-replication",
    label: "DNA Replication",
    domain: "Biology",
    domainColor: "hsl(var(--sci-biology))",
    icon: Dna,
    status: "ready" as const,
    href: "/dashboard/simulations?slug=dna-replication",
  },
  {
    id: "neural-net",
    label: "Neural Network",
    domain: "AI",
    domainColor: "hsl(var(--sci-ai))",
    icon: Brain,
    status: "ready" as const,
    href: "/dashboard/simulations?slug=neural-net",
  },
  {
    id: "titration",
    label: "Acid-Base Titration",
    domain: "Chemistry",
    domainColor: "hsl(var(--sci-chemistry))",
    icon: FlaskConical,
    status: "ready" as const,
    href: "/dashboard/simulations?slug=titration",
  },
];

const STATUS_STYLES = {
  ready: "text-[hsl(var(--sim-output))] bg-[hsl(var(--sim-output)/0.1)] border-[hsl(var(--sim-output)/0.2)]",
  draft: "text-[hsl(var(--sim-paused))] bg-[hsl(var(--sim-paused)/0.1)] border-[hsl(var(--sim-paused)/0.2)]",
};

export function SimulationsPreview() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-card p-5 animate-fade-in shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MonitorPlay size={13} className="text-[hsl(var(--sim-running))]" />
          <h3 className="text-[13px] font-semibold text-foreground">Featured Simulations</h3>
        </div>
        <Link
          href="/dashboard/simulations"
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          View all <ArrowRight size={10} />
        </Link>
      </div>

      {/* Simulation tiles */}
      <div className="flex flex-col gap-2">
        {FEATURED.map((sim) => (
          <Link
            key={sim.id}
            href={sim.href}
            className={cn(
              "group flex items-center gap-3 p-3 rounded-[var(--radius-sm)] border border-white/5",
              "bg-white/2 hover:bg-white/4 hover:border-white/10",
              "transition-all duration-200"
            )}
          >
            {/* Icon */}
            <div
              className="flex items-center justify-center w-8 h-8 rounded-md shrink-0 border border-white/6 transition-all duration-200 group-hover:scale-105"
              style={{ background: `${sim.domainColor}18` }}
            >
              <sim.icon size={15} style={{ color: sim.domainColor }} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-foreground truncate">{sim.label}</p>
              <p className="text-[10px] text-muted-foreground">{sim.domain}</p>
            </div>

            {/* Status + Run */}
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={cn(
                  "inline-flex items-center px-1.5 py-0.5 rounded-full border text-[9px] uppercase tracking-wider font-bold",
                  STATUS_STYLES[sim.status]
                )}
              >
                {sim.status}
              </span>
              <div
                className="w-6 h-6 rounded flex items-center justify-center bg-primary/10 border border-primary/20 text-primary opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Play size={9} fill="currentColor" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer CTA */}
      <Link
        href="/dashboard/simulations"
        className="mt-3 flex items-center justify-center gap-2 py-2 rounded-[var(--radius-sm)] border border-white/5 text-[11px] text-muted-foreground hover:text-foreground hover:border-white/10 hover:bg-white/3 transition-all"
      >
        <MonitorPlay size={11} />
        Browse all simulations
      </Link>
    </div>
  );
}