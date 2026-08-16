/**
 * Simulation Configuration Endpoint
 * Lightweight GET that exposes the simulation registry (the authoritative
 * source) in the shape consumed by the hub client. No database, no hidden
 * catalog: the payload is produced by the single shared builder
 * (`buildSimulationConfigPayload`) that also types the client-side cache.
 */

import { withErrorHandling } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { buildSimulationConfigPayload } from '@/lib/simulation/config-payload';

export const GET = withErrorHandling(async () => {
  return ApiResponseHandler.success(buildSimulationConfigPayload());
});