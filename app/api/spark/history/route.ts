/**
 * GET /api/spark/history
 * Retrieves saved message history and session details for an active Spark conversation.
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { getAuthContext, withErrorHandling, requireAuth } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
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
  } catch (err: any) {
    console.error('[Spark History API] Error fetching history:', err);
    return ApiResponseHandler.error(
      new AppError(err.statusCode || 500, err.message || 'Failed to fetch session history', err.code || 'SESSION_HISTORY_ERROR')
    );
  }
}

export const GET = withErrorHandling(requireAuth(handler));
