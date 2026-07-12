import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { getAuthContext, withErrorHandling, requireAuth } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { NeuralPathsService } from '@/modules/neural-paths/neural-paths.service';
import { z } from 'zod';

const StartPathSchema = z.object({
  pathId: z.string().min(1),
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

  const result = StartPathSchema.safeParse(body);
  if (!result.success) {
    return ApiResponseHandler.badRequest('Invalid payload');
  }

  const { pathId } = result.data;

  const progress = await NeuralPathsService.startPath(auth.userId, pathId);

  return ApiResponseHandler.success(
    {
      progress,
      firstChapterId: progress.currentChapterId,
    },
    'Path started successfully'
  );
}

export const POST = withErrorHandling(requireAuth(handler));
