/**
 * GET /api/cognitive/discoveries
 * GET user discoveries
 * 
 * POST /api/cognitive/discoveries
 * POST record a new discovery
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, getAuthContext, withErrorHandling } from '@/middleware/auth';
import { ApiResponseHandler, zodValidationError } from '@/lib/utils/response';
import { DiscoveryEngineService } from '@/modules/cognitive-engine/discovery-engine.service';
import { RecordDiscoverySchema } from '@/validations/schemas';

async function getHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();

  await connectDB();

  const url = new URL(request.url);
  const domain = url.searchParams.get('domain') || undefined;
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);

  const discoveries = await DiscoveryEngineService.getUserDiscoveries(auth.userId, { domain, limit });
  return ApiResponseHandler.success(discoveries, 'Discoveries retrieved');
}

async function postHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();

  await connectDB();

  const body = await request.json();
  const validation = RecordDiscoverySchema.safeParse(body);

  if (!validation.success) {
    return zodValidationError(validation.error);
  }

  const discovery = await DiscoveryEngineService.recordDiscovery(auth.userId, validation.data);
  return ApiResponseHandler.success(discovery, 'Discovery recorded');
}

export const GET = withErrorHandling(requireAuth(getHandler));
export const POST = withErrorHandling(requireAuth(postHandler));