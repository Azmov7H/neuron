import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { getAuthContext, withErrorHandling, requireAuth } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { ExploreService } from '@/modules/explore/explore.service';

async function handler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();

  await connectDB();
  const recommendations = await ExploreService.getRecommendations(auth.userId);

  return ApiResponseHandler.success(recommendations, 'Recommendations retrieved successfully');
}

export const GET = withErrorHandling(requireAuth(handler));
