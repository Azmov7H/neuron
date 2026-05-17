import { NextRequest } from 'next/server';
import { getAuthContext, withErrorHandling, requireAuth } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { EvolutionService } from '@/modules/evolution/evolution.service';
import { connectDB } from '@/database/connection';

async function handler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();

  await connectDB();

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '20');

  const logs = await EvolutionService.getLogs(auth.userId, limit);

  return ApiResponseHandler.success(logs, 'Evolution logs retrieved');
}

export const GET = withErrorHandling(requireAuth(handler));
