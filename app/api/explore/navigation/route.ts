import { NextRequest } from 'next/server';
import { getAuthContext, withErrorHandling, requireAuth } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { ExploreService } from '@/modules/explore/explore.service';

async function handler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();

  const navConfig = await ExploreService.getNavigationConfig();

  return ApiResponseHandler.success(navConfig, 'Navigation config retrieved successfully');
}

export const GET = withErrorHandling(requireAuth(handler));
