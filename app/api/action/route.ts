import { NextRequest } from 'next/server';
import { getAuthContext, withErrorHandling, requireAuth } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { ActionHandler, ActionType } from '@/core/actionHandler';
import { connectDB } from '@/database/connection';
import { z } from 'zod';

const ActionPayloadSchema = z.object({
  type: z.nativeEnum(ActionType),
  metadata: z.any(),
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

  const result = ActionPayloadSchema.safeParse(body);
  if (!result.success) {
    return ApiResponseHandler.badRequest('Invalid payload structure: ' + result.error.message);
  }

  const response = await ActionHandler.handleUserAction(auth.userId, result.data);

  return ApiResponseHandler.success(response, 'Action processed successfully');
}

export const POST = withErrorHandling(requireAuth(handler));
