import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { getAuthContext, withErrorHandling, requireAuth } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { ProgressService } from '@/modules/neural-paths/progress.service';

async function handler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();

  await connectDB();

  const stats = await ProgressService.getLearningStats(auth.userId);

  return ApiResponseHandler.success(stats, 'Learning stats retrieved successfully');
}

export const GET = withErrorHandling(requireAuth(handler));
