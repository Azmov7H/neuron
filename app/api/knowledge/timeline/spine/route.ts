/**
 * GET /api/knowledge/timeline/spine?domain=physics
 * Full chronological spine (no pagination) for timeline visualizations.
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, withErrorHandling, getAuthContext } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { TimelineService } from '@/modules/knowledge/timeline.service';
import { ScientificDomain } from '@/types';

async function getHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const domain = (new URL(request.url).searchParams.get('domain') as ScientificDomain) ?? undefined;
  const spine = await TimelineService.getSpine(domain);
  return ApiResponseHandler.success(spine, 'Timeline spine retrieved');
}

export const GET = withErrorHandling(requireAuth(getHandler));
