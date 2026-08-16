import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/database/connection';
import { getAuthContext, withErrorHandling, requireAuth } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { logger } from '@/lib/logger';
import { SimulationRun } from '@/database/models/simulation-run';
import crypto from 'crypto';
import { parseHistoryLimit, buildHistoryQuery } from '@/lib/simulation/history-params';

async function handler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) {
    return ApiResponseHandler.unauthorized();
  }

  await connectDB();

  try {
    const searchParams = request.nextUrl.searchParams;
    // Client-supplied limits are always clamped into [1, 100] — an arbitrary
    // value must never reach the Mongo .limit() call.
    const limit = parseHistoryLimit(searchParams.get('limit'));
    const clientETag = request.headers.get('if-none-match');

    // Ownership is enforced here: the userId filter always comes from the
    // authenticated context, never from request parameters.
    const query = buildHistoryQuery(auth.userId, {
      domain: searchParams.get('domain'),
      simulationId: searchParams.get('simulationId'),
    });

    const history = await SimulationRun.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    // Compute ETag for cache validation
    const eTag = '"' + crypto.createHash('md5').update(JSON.stringify(history)).digest('hex') + '"';

    // Return 304 Not Modified if ETag matches
    if (clientETag === eTag) {
      return new NextResponse(null, { status: 304 });
    }

    const response = new NextResponse(
      JSON.stringify({ success: true, data: history }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    response.headers.set('Cache-Control', 'private, max-age=60');
    response.headers.set('ETag', eTag);
    return response;
  } catch (err: unknown) {
    logger.error('[Simulation History API] Fetch failed:', err);
    return ApiResponseHandler.internalError('Failed to retrieve simulation history.');
  }
}

export const GET = withErrorHandling(requireAuth(handler));
