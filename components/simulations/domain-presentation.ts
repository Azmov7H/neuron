/**
 * Domain Presentation Metadata
 * The SINGLE UI presentation definition for the six scientific domains.
 *
 * Boundary rule: the neuroscience/scientific model (`src/lib/simulation/`)
 * owns domain identity (labels, ordering, membership). Tailwind classes,
 * Lucide icons, and accent colors are UI-only concerns and live HERE —
 * never inside the registry or engine. Both the hub components and the
 * SimulationRunner sidebar consume this one map.
 */

import { Atom, Brain, Compass, Heart, Landmark, Orbit } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { DOMAIN_LABELS } from '@/lib/simulation/registry';
import type { ScientificDomain } from '@/lib/simulation/registry.types';

export interface DomainPresentation {
  /** Identity names forwarded from the registry (kept here for shape parity). */
  label: string;
  displayName: string;
  /** Lucide icon component used by the hub cards and the runner sidebar. */
  icon: LucideIcon;
  /** SciOS token Tailwind classes. */
  text: string;
  bg: string;
  border: string;
  /** Legacy presentation tokens retained for the wire contract. */
  colorClass: string;
  glowClass: string;
  accentHex: string;
}

/**
 * One presentation entry per canonical domain — the key set is proven equal
 * to the canonical domain enumeration at compile time via the `satisfies`
 * annotation below.
 */
export const DOMAIN_STYLES = {
  physics: {
    ...DOMAIN_LABELS.physics,
    icon: Atom,
    text: 'text-sci-physics',
    bg: 'bg-sci-physics/10',
    border: 'border-sci-physics/20',
    colorClass: 'text-blue-400 border-blue-500/20 bg-blue-500/5',
    glowClass: 'shadow-[0_0_20px_rgba(96,165,250,0.15)]',
    accentHex: '#3b82f6',
  },
  biology: {
    ...DOMAIN_LABELS.biology,
    icon: Compass,
    text: 'text-sci-biology',
    bg: 'bg-sci-biology/10',
    border: 'border-sci-biology/20',
    colorClass: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
    glowClass: 'shadow-[0_0_20px_rgba(52,211,153,0.15)]',
    accentHex: '#10b981',
  },
  anatomy: {
    ...DOMAIN_LABELS.anatomy,
    icon: Heart,
    text: 'text-sci-anatomy',
    bg: 'bg-sci-anatomy/10',
    border: 'border-sci-anatomy/20',
    colorClass: 'text-rose-400 border-rose-500/20 bg-rose-500/5',
    glowClass: 'shadow-[0_0_20px_rgba(251,113,133,0.15)]',
    accentHex: '#f43f5e',
  },
  mathematics: {
    ...DOMAIN_LABELS.mathematics,
    icon: Landmark,
    text: 'text-sci-math',
    bg: 'bg-sci-math/10',
    border: 'border-sci-math/20',
    colorClass: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
    glowClass: 'shadow-[0_0_20px_rgba(251,191,36,0.15)]',
    accentHex: '#fbbf24',
  },
  quantum: {
    ...DOMAIN_LABELS.quantum,
    icon: Brain,
    text: 'text-sci-quantum',
    bg: 'bg-sci-quantum/10',
    border: 'border-sci-quantum/20',
    colorClass: 'text-purple-400 border-purple-500/20 bg-purple-500/5',
    glowClass: 'shadow-[0_0_20px_rgba(192,132,252,0.15)]',
    accentHex: '#c084fc',
  },
  space: {
    ...DOMAIN_LABELS.space,
    icon: Orbit,
    text: 'text-sci-space',
    bg: 'bg-sci-space/10',
    border: 'border-sci-space/20',
    colorClass: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5',
    glowClass: 'shadow-[0_0_20px_rgba(34,211,238,0.15)]',
    accentHex: '#22d3ee',
  },
} as const satisfies Record<ScientificDomain, DomainPresentation>;

export function getDomainPresentation(domain: ScientificDomain): DomainPresentation {
  return DOMAIN_STYLES[domain];
}