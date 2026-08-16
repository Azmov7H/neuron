/**
 * Simulation hub constants (compatibility shim).
 *
 * There is exactly ONE authoritative definition of the interactive
 * simulation IDs, the interactive classification, and the domain ordering:
 * `src/lib/simulation/registry.ts`. The single UI presentation definition
 * lives in `./domain-presentation`. This file only re-exports both so the
 * hub components keep a stable import surface — it declares nothing.
 */

export {
  INTERACTIVE_SIM_IDS,
  isInteractiveSim,
  DOMAIN_ORDER,
} from '@/lib/simulation/registry';

export { DOMAIN_STYLES } from './domain-presentation';
export type { DomainPresentation } from './domain-presentation';