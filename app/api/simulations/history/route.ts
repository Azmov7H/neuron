import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { getAuthContext, withErrorHandling, requireAuth } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { logger } from '@/lib/logger';
import { SimulationRun } from '@/database/models/simulation-run';
import mongoose from 'mongoose';

async function handler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) {
    return ApiResponseHandler.unauthorized();
  }

  await connectDB();

  try {
    const searchParams = request.nextUrl.searchParams;
    const domain = searchParams.get('domain');
    const simulationId = searchParams.get('simulationId');
    const limit = parseInt(searchParams.get('limit') || '15', 10);

    const query: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(auth.userId)
    };

    if (domain) {
      query.domain = domain;
    }
    if (simulationId) {
      query.simulationId = simulationId;
    }

    const history = await SimulationRun.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return ApiResponseHandler.success(history);
  } catch (err: unknown) {
    logger.error('[Simulation History API] Fetch failed:', err);
    return ApiResponseHandler.internalError('Failed to retrieve simulation history.');
  }
}

export const GET = withErrorHandling(requireAuth(handler));
