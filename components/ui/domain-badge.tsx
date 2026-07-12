"use client";

import { cn } from "@/lib/utils";

const DOMAIN_MAP: Record<
  string,
  { label: string; colorClass: string; bgClass: string }
> = {
  physics:    { label: "Physics",    colorClass: "text-sci-physics",   bgClass: "bg-sci-physics/10 border-sci-physics/20" },
  biology:    { label: "Biology",    colorClass: "text-sci-biology",   bgClass: "bg-sci-biology/10 border-sci-biology/20" },
  math:       { label: "Math",       colorClass: "text-sci-math",      bgClass: "bg-sci-math/10 border-sci-math/20" },
  mathematics:{ label: "Math",       colorClass: "text-sci-math",      bgClass: "bg-sci-math/10 border-sci-math/20" },
  quantum:    { label: "Quantum",    colorClass: "text-sci-quantum",   bgClass: "bg-sci-quantum/10 border-sci-quantum/20" },
  space:      { label: "Space",      colorClass: "text-sci-space",     bgClass: "bg-sci-space/10 border-sci-space/20" },
  tech:       { label: "Tech",       colorClass: "text-sci-tech",      bgClass: "bg-sci-tech/10 border-sci-tech/20" },
  technology: { label: "Tech",       colorClass: "text-sci-tech",      bgClass: "bg-sci-tech/10 border-sci-tech/20" },
  ai:         { label: "AI",         colorClass: "text-sci-ai",        bgClass: "bg-sci-ai/10 border-sci-ai/20" },
  chemistry:  { label: "Chemistry",  colorClass: "text-sci-chemistry", bgClass: "bg-sci-chemistry/10 border-sci-chemistry/20" },
  anatomy:    { label: "Anatomy",    colorClass: "text-sci-anatomy",   bgClass: "bg-sci-anatomy/10 border-sci-anatomy/20" },
  astronomy:  { label: "Astronomy",  colorClass: "text-sci-astronomy", bgClass: "bg-sci-astronomy/10 border-sci-astronomy/20" },
};

interface DomainBadgeProps {
  domain: string;
  className?: string;
  size?: "xs" | "sm";
}

/**
 * A domain-semantically-coloured badge chip.
 * Uses `--sci-*` design tokens from the SciOS system.
 */
export function DomainBadge({ domain, className, size = "sm" }: DomainBadgeProps) {
  const key = domain.toLowerCase().replace(/\s+/g, "");
  const def = DOMAIN_MAP[key] ?? {
    label: domain,
    colorClass: "text-muted-foreground",
    bgClass: "bg-muted/50 border-white/10",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-semibold uppercase tracking-wider",
        size === "xs" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]",
        def.colorClass,
        def.bgClass,
        className
      )}
    >
      {def.label}
    </span>
  );
}
