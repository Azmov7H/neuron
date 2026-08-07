export type SimulationDomainConfig = {
  domainKey: string;
  name: string;
  simulations: Array<{
    id: string;
    name: string;
    desc?: string;
    defaultParams?: Record<string, number>;
    paramsList?: Array<{ key: string; label: string; min: number; max: number; step: number }>;
  }>;
  colorClass?: string;
  glowClass?: string;
  accentHex?: string;
};

let configPromise: Promise<Record<string, SimulationDomainConfig> | null> | null = null;

export async function fetchSimulationConfig(): Promise<Record<string, SimulationDomainConfig> | null> {
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

      return body.data.reduce((acc: Record<string, SimulationDomainConfig>, entry: SimulationDomainConfig) => {
        acc[entry.domainKey] = entry;
        return acc;
      }, {});
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
