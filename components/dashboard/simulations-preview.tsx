"use client";

import { MonitorPlay, ArrowRight } from "lucide-react";
import Link from "next/link";

const sims = [
  {
    title: "Quantum States",
    status: "Live",
    colorClass: "text-blue-400 bg-blue-500/8 border-blue-500/10",
    iconColor: "text-blue-400",
    href: "/dashboard/simulations",
  },
  {
    title: "Gravity Wells",
    status: "Beta",
    colorClass: "text-amber-400 bg-amber-500/8 border-amber-500/10",
    iconColor: "text-amber-400",
    href: "/dashboard/simulations",
  },
  {
    title: "Neural Nets",
    status: "Live",
    colorClass: "text-emerald-400 bg-emerald-500/8 border-emerald-500/10",
    iconColor: "text-emerald-400",
    href: "/dashboard/simulations",
  },
];

export function SimulationsPreview() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-card p-5 animate-fade-in shadow-sm">
      <h3 className="text-[13px] font-semibold text-foreground mb-4">Simulations Lab</h3>
      <div className="space-y-2">
        {sims.map((sim) => (
          <Link
            key={sim.title}
            href={sim.href}
            className="flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] border border-white/3 hover:border-white/8 hover:bg-white/3 transition-all duration-300 group"
          >
            <MonitorPlay size={13} className={`${sim.iconColor} group-hover:scale-105 transition-transform duration-300`} />
            <span className="flex-1 text-[12px] font-medium text-foreground group-hover:text-primary transition-colors">
              {sim.title}
            </span>
            <span
              className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${sim.colorClass}`}
            >
              {sim.status}
            </span>
          </Link>
        ))}
        <Link
          href="/dashboard/simulations"
          className="flex items-center justify-center gap-1 pt-1.5 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors group/all"
        >
          All simulations
          <ArrowRight
            size={10}
            className="group-hover/all:translate-x-0.5 transition-transform"
          />
        </Link>
      </div>
    </div>
  );
}