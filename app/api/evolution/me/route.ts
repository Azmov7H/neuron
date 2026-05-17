import { NextRequest } from 'next/server';
import { getAuthContext, withErrorHandling, requireAuth } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { EvolutionService } from '@/modules/evolution/evolution.service';
import { connectDB } from '@/database/connection';

async function handler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();

  await connectDB();

  const stats = await EvolutionService.getUserStats(auth.userId);
  
  // Calculate next rank XP
  const xp = stats.user.totalXP;
  let nextRankXP = 1000;
  if (xp >= 1000) nextRankXP = 5000;
  if (xp >= 5000) nextRankXP = 15000;
  if (xp >= 15000) nextRankXP = 35000;
  if (xp >= 35000) nextRankXP = 35000; // max

  const responseData = {
    ...stats,
    nextRankXP
  };

  return ApiResponseHandler.success(responseData, 'Evolution state retrieved');
}

export const GET = withErrorHandling(requireAuth(handler));
