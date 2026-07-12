import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { getAuthContext, withErrorHandling, requireAuth } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { RecommendationsService } from '@/modules/recommendations/recommendations.service';
import { z } from 'zod';

const ClickSchema = z.object({
  recommendationId: z.string().min(1),
});

async function handler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();

  await connectDB();

  let body;
  try {
    body = await request.json();
  } catch {
    return ApiResponseHandler.badRequest('Invalid JSON body');
  }

  const result = ClickSchema.safeParse(body);
  if (!result.success) {
    return ApiResponseHandler.badRequest('Invalid click payload');
  }

  await RecommendationsService.trackRecommendationClick(result.data.recommendationId);

  return ApiResponseHandler.success({ clicked: true }, 'Recommendation click tracked');
}

export const POST = withErrorHandling(requireAuth(handler));
