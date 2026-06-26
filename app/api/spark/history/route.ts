/**
 * GET /api/spark/history
 * Retrieves saved message history and session details for an active Spark conversation.
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { getAuthContext, withErrorHandling, requireAuth } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { logger } from '@/lib/logger';
import { SparkService } from '@/modules/spark/spark.service';
import { AppError } from '@/types';

async function handler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) {
    return ApiResponseHandler.unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return ApiResponseHandler.badRequest('Session ID is required');
  }

  await connectDB();

  try {
    const session = await SparkService.getSessionHistory(sessionId, auth.userId);
    return ApiResponseHandler.success(session);
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    const errorLike = error as Error & { statusCode?: number; code?: string };

    logger.error('[Spark History API] Error fetching history:', error);
    return ApiResponseHandler.error(
      new AppError(
        typeof errorLike.statusCode === 'number' ? errorLike.statusCode : 500,
        errorLike.message || 'Failed to fetch session history',
        typeof errorLike.code === 'string' ? errorLike.code : 'SESSION_HISTORY_ERROR'
      )
    );
  }
}

export const GET = withErrorHandling(requireAuth(handler));
