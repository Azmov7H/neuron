import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { getAuthContext, withErrorHandling, requireAuth } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { NeuralPathsService } from '@/modules/neural-paths/neural-paths.service';

async function handler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();

  await connectDB();

  const url = new URL(request.url);
  const domain = url.searchParams.get('domain') || undefined;
  const difficulty = url.searchParams.get('difficulty') as any;

  const result = await NeuralPathsService.getPaths({
    domain,
    difficulty,
    userId: auth.userId
  });

  return ApiResponseHandler.success(result, 'Paths retrieved successfully');
}

export const GET = withErrorHandling(requireAuth(handler));
