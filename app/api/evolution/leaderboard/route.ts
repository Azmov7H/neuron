/**
 * GET /api/evolution/leaderboard
 * Get global leaderboard
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { ApiResponseHandler } from '@/lib/utils/response';
import { EvolutionService } from '@/modules/evolution/evolution.service';
import { withErrorHandling } from '@/middleware/auth';

async function handler(request: NextRequest) {
  await connectDB();

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);

  const leaderboard = await EvolutionService.getLeaderboard(limit);

  return ApiResponseHandler.success(
    {
      leaderboard,
      count: leaderboard.length,
    },
    'Leaderboard retrieved'
  );
}

export const GET = withErrorHandling(handler);
