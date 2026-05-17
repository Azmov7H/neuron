import { NextRequest } from 'next/server';
import { getAuthContext, withErrorHandling, requireAuth } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { EvolutionService } from '@/modules/evolution/evolution.service';
import { connectDB } from '@/database/connection';

async function handler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();

  await connectDB();

  const user = await EvolutionService.updateStreak(auth.userId);

  return ApiResponseHandler.success({ streak: user.streak, lastActiveDate: user.lastActiveDate }, 'Streak updated');
}

export const POST = withErrorHandling(requireAuth(handler));
