/**
 * GET /api/spark/context
 * Retrieves aggregated active learning context for the current user and domain.
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { getAuthContext, withErrorHandling, requireAuth } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { logger } from '@/lib/logger';
import { SparkContext } from '@/modules/spark/spark.context';
import { AppError } from '@/types';

async function handler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) {
    return ApiResponseHandler.unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain') || 'science';
  const currentPathId = searchParams.get('pathId') || undefined;
  const currentChapterId = searchParams.get('chapterId') || undefined;

  await connectDB();

  try {
    const context = await SparkContext.aggregateContext(auth.userId, domain, {
      currentPathId,
      currentChapterId,
    });
    
    return ApiResponseHandler.success(context);
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('[Spark Context API] Error aggregating context:', error);
    return ApiResponseHandler.error(
      new AppError(500, error.message || 'Failed to aggregate active context', 'CONTEXT_AGGREGATION_ERROR')
    );
  }
}

export const GET = withErrorHandling(requireAuth(handler));
