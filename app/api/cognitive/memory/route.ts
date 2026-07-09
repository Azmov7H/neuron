/**
 * GET /api/cognitive/memory
 * GET user memory
 * 
 * PUT /api/cognitive/memory
 * PUT update user memory
 * 
 * POST /api/cognitive/memory/interaction
 * POST record user interaction
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, getAuthContext, withErrorHandling } from '@/middleware/auth';
import { ApiResponseHandler, zodValidationError } from '@/lib/utils/response';
import { UserMemoryService } from '@/modules/cognitive-engine/user-memory.service';
import { UpdateUserMemorySchema, RecordInteractionSchema } from '@/validations/schemas';

async function getHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();

  await connectDB();

  const memory = await UserMemoryService.getOrCreateMemory(auth.userId);
  return ApiResponseHandler.success(memory, 'User memory retrieved');
}

async function putHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();

  await connectDB();

  const body = await request.json();
  const validation = UpdateUserMemorySchema.safeParse(body);

  if (!validation.success) {
    return zodValidationError(validation.error);
  }

  const memory = await UserMemoryService.updateMemory(auth.userId, validation.data);
  return ApiResponseHandler.success(memory, 'User memory updated');
}

async function postInteractionHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();

  await connectDB();

  const body = await request.json();
  const validation = RecordInteractionSchema.safeParse(body);

  if (!validation.success) {
    return zodValidationError(validation.error);
  }

  const memory = await UserMemoryService.recordInteraction(auth.userId, validation.data);
  return ApiResponseHandler.success(memory, 'Interaction recorded');
}

export const GET = withErrorHandling(requireAuth(getHandler));
export const PUT = withErrorHandling(requireAuth(putHandler));
export const POST = withErrorHandling(requireAuth(postInteractionHandler));