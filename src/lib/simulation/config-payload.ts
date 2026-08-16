/**
 * Simulation Config Payload
 * The single aggregation of the registry into the client-facing catalog
 * shape. Used by BOTH the `/api/simulations/config` route and the client
 * local fallback, so the API contract and the client contract can never
 * diverge (they share one type and one builder).
 *
 * Presentation fields (colorClass/glowClass/accentHex) are attached from
 * the UI presentation boundary (`components/simulations/domain-presentation`)
 * — the registry itself owns only simulation identity and data.
 */

import { DOMAIN_ORDER, getAllSimulations, toClientSimulation } from './registry';
import { DOMAIN_STYLES } from '@/components/simulations/domain-presentation';
import type { ClientSimulation, ScientificDomain } from './registry.types';

/**
 * Exact wire shape of `GET /api/simulations/config` (and of the client
 * config cache). One type for both sides of the fetch.
 */
export interface SimulationDomainConfig {
  domainKey: ScientificDomain;
  name: string;
  colorClass: string;
  glowClass: string;
  accentHex: string;
  simulations: ClientSimulation[];
}

export function buildSimulationConfigPayload(): SimulationDomainConfig[] {
  const all = getAllSimulations();
  return DOMAIN_ORDER.map((domain) => {
    const style = DOMAIN_STYLES[domain];
    return {
      domainKey: domain,
      name: style.displayName,
      colorClass: style.colorClass,
      glowClass: style.glowClass,
      accentHex: style.accentHex,
      simulations: all[domain].map(toClientSimulation),
    };
  });
}