/**
 * GET /api/evolution/stats
 * Get user evolution statistics
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { getAuthContext, withErrorHandling, requireAuth } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { EvolutionService } from '@/modules/evolution/evolution.service';

async function handler(request: NextRequest) {
  const auth = getAuthContext(request);

  if (!auth) {
    return ApiResponseHandler.unauthorized();
  }

  await connectDB();

  const stats = await EvolutionService.getUserStats(auth.userId);

  return ApiResponseHandler.success(stats, 'Stats retrieved');
}

export const GET = withErrorHandling(requireAuth(handler));
