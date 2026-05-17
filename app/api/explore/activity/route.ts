import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { getAuthContext, withErrorHandling, requireAuth } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { ExploreService } from '@/modules/explore/explore.service';
import { z } from 'zod';

const ActivitySchema = z.object({
  action: z.enum(['view_domain', 'view_concept', 'view_recommendation']),
  targetId: z.string().min(1),
  metadata: z.record(z.string(), z.any()).optional(),
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

  const result = ActivitySchema.safeParse(body);
  if (!result.success) {
    return ApiResponseHandler.badRequest('Invalid activity payload');
  }

  const { action, targetId, metadata } = result.data;

  await ExploreService.logActivity(auth.userId, action, targetId, metadata);

  return ApiResponseHandler.success({ logged: true }, 'Activity logged successfully');
}

export const POST = withErrorHandling(requireAuth(handler));
