/**
 * GET /api/cognitive/context
 * GET unified context for AI requests
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, getAuthContext, withErrorHandling } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { ContextBuilderService } from '@/modules/cognitive-engine/context-builder.service';

async function getHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();

  await connectDB();

  const url = new URL(request.url);
  const domain = url.searchParams.get('domain') || undefined;
  const pathId = url.searchParams.get('pathId') || undefined;
  const chapterId = url.searchParams.get('chapterId') || undefined;

  const context = await ContextBuilderService.buildContext(auth.userId, {
    currentPathId: pathId || undefined,
    currentChapterId: chapterId || undefined,
  });

  return ApiResponseHandler.success(context, 'Context retrieved');
}

async function postFormatHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();

  await connectDB();

  const url = new URL(request.url);
  const domain = url.searchParams.get('domain') || undefined;
  const pathId = url.searchParams.get('pathId') || undefined;
  const chapterId = url.searchParams.get('chapterId') || undefined;

  const context = await ContextBuilderService.buildContext(auth.userId, {
    currentPathId: pathId || undefined,
    currentChapterId: chapterId || undefined,
  });

  const prompt = ContextBuilderService.formatForPrompt(context);
  return ApiResponseHandler.success({ prompt }, 'Formatted prompt retrieved');
}

export const GET = withErrorHandling(requireAuth(getHandler));
export const POST = withErrorHandling(requireAuth(postFormatHandler));