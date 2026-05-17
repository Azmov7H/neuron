import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { getAuthContext, withErrorHandling, requireAuth } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { NeuralPathsService } from '@/modules/neural-paths/neural-paths.service';

async function handler(request: NextRequest, { params }: any) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();

  await connectDB();

  const resolvedParams = await params;
  const id = resolvedParams.id;

  const result = await NeuralPathsService.getPathBySlug(id, auth.userId);

  return ApiResponseHandler.success(result, 'Path retrieved successfully');
}

export const GET = withErrorHandling(requireAuth(handler));
