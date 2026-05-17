/**
 * GET /api/dashboard/secret
 * Returns a dashboard secret only for authenticated users.
 */

import { NextRequest } from 'next/server';
import { requireAuth, getAuthContext, withErrorHandling } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { config } from '@/config/env';

async function handler(request: NextRequest) {
  const auth = getAuthContext(request);

  if (!auth) {
    return ApiResponseHandler.unauthorized();
  }

  return ApiResponseHandler.success(
    { secret: config.server.dashboardSecret },
    'Dashboard secret retrieved'
  );
}

export const GET = withErrorHandling(requireAuth(handler));
