/**
 * Shared telemetry snapshot sanitizer (P3 runtime audit, EDGE-06 / ASSESS-02).
 * Recursively strips non-finite numbers from a snapshot so NaN or Infinity can
 * never reach React state, the LLM prompt, the deterministic fallback, or
 * persistence. Non-number values (strings, contracts, arrays, nested objects)
 * pass through untouched.
 *
 * Used at every snapshot boundary:
 *  - client engine telemetry emission (SimulationEngine)
 *  - server-side interpret ingestion (app/api/simulations/interpret/route.ts)
 */
export function sanitizeSnapshot(snapshot: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(snapshot)) {
    if (typeof value === 'number' && !Number.isFinite(value)) continue;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      clean[key] = sanitizeSnapshot(value as Record<string, unknown>);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}