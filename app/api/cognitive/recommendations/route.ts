/**
 * GET /api/cognitive/recommendations
 * GET user recommendations
 * 
 * POST /api/cognitive/recommendations/generate
 * POST generate new recommendations
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, getAuthContext, withErrorHandling } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { RecommendationEngineService } from '@/modules/cognitive-engine/recommendation-engine.service';

async function getHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();

  await connectDB();

  const url = new URL(request.url);
  const type = url.searchParams.get('type') as 'concept' | 'path' | 'simulation' | 'research' | undefined;
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);

  const recommendations = await RecommendationEngineService.getUserRecommendations(auth.userId, type, limit);
  return ApiResponseHandler.success(recommendations, 'Recommendations retrieved');
}

async function postGenerateHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();

  await connectDB();

  const url = new URL(request.url);
  const type = (url.searchParams.get('type') as 'concept' | 'path' | 'simulation' | 'research') || 'path';
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);

  const recommendations = await RecommendationEngineService.generateRecommendations(auth.userId, type, limit);
  return ApiResponseHandler.success(recommendations, 'Recommendations generated');
}

async function postClickHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();

  await connectDB();

  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return ApiResponseHandler.badRequest('Recommendation ID required');
  }

  const recommendation = await RecommendationEngineService.markClicked(auth.userId, id);
  if (!recommendation) {
    return ApiResponseHandler.notFound('Recommendation not found');
  }

  return ApiResponseHandler.success(recommendation, 'Recommendation clicked');
}

export const GET = withErrorHandling(requireAuth(getHandler));
export const POST = withErrorHandling(requireAuth(postGenerateHandler));