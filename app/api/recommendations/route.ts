/**
 * POST /api/recommendations
 * Get personalized recommendations
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { getAuthContext, withErrorHandling, requireAuth } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { RecommendationsService } from '@/modules/recommendations/recommendations.service';

async function handler(request: NextRequest) {
  const auth = getAuthContext(request);

  if (!auth) {
    return ApiResponseHandler.unauthorized();
  }

  await connectDB();

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 20);

  // Check for cached recommendations first
  let recommendations = await RecommendationsService.getRecommendations(auth.userId);

  // If no recommendations or too few, generate new ones
  if (recommendations.length === 0) {
    await RecommendationsService.generateRecommendations(auth.userId, limit);
    recommendations = await RecommendationsService.getRecommendations(auth.userId);
  }

  return ApiResponseHandler.success(recommendations.slice(0, limit), 'Recommendations retrieved');
}

export const GET = withErrorHandling(requireAuth(handler));
