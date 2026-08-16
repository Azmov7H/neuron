/**
 * Simulation Config Client Cache
 * Fetches `/api/simulations/config` once per page lifetime and caches the
 * promise. The API response type is the exact same `SimulationDomainConfig`
 * used by the server builder (`src/lib/simulation/config-payload.ts`), so
 * TypeScript proves API/client compatibility — no casts between divergent
 * local contracts.
 */

import type { SimulationDomainConfig } from '@/lib/simulation/config-payload';
import type { ScientificDomain } from '@/lib/simulation/registry.types';

export type { SimulationDomainConfig };

let configPromise: Promise<Record<ScientificDomain, SimulationDomainConfig> | null> | null = null;

export async function fetchSimulationConfig(): Promise<Record<ScientificDomain, SimulationDomainConfig> | null> {
  if (configPromise) return configPromise;

  configPromise = fetch("/api/simulations/config")
    .then(async (res) => {
      if (!res.ok) {
        throw new Error("Failed to fetch simulation config");
      }
      const body = await res.json();
      if (!body?.success || !Array.isArray(body.data)) {
        throw new Error("Simulation config response invalid");
      }

      // Untrusted fetch boundary: the JSON payload is narrowed to the
      // shared contract here, once — every downstream consumer is typed.
      const data = body.data as SimulationDomainConfig[];
      return data.reduce((acc, entry) => {
        acc[entry.domainKey] = entry;
        return acc;
      }, {} as Record<ScientificDomain, SimulationDomainConfig>);
    })
    .catch((error: Error) => {
      configPromise = null;
      console.warn("[Simulation Config Cache] fetch failed, falling back:", error);
      return null;
    });

  return configPromise;
}

export function clearSimulationConfigCache() {
  configPromise = null;
}