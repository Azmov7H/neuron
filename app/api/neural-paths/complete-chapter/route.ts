import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { getAuthContext, withErrorHandling, requireAuth } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { NeuralPathsService } from '@/modules/neural-paths/neural-paths.service';
import { z } from 'zod';

const CompleteChapterSchema = z.object({
  pathId: z.string().min(1),
  chapterId: z.string().min(1),
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

  const result = CompleteChapterSchema.safeParse(body);
  if (!result.success) {
    return ApiResponseHandler.badRequest('Invalid payload');
  }

  const { pathId, chapterId } = result.data;

  const response = await NeuralPathsService.completeChapter(auth.userId, pathId, chapterId);

  return ApiResponseHandler.success(response, response.message);
}

export const POST = withErrorHandling(requireAuth(handler));
