/**
 * GET /api/cognitive/profile
 * GET cognitive profile for user
 * 
 * PUT /api/cognitive/profile
 * PUT update cognitive profile
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, getAuthContext, withErrorHandling } from '@/middleware/auth';
import { ApiResponseHandler, zodValidationError } from '@/lib/utils/response';
import { CognitiveProfileService } from '@/modules/cognitive-engine/cognitive-profile.service';
import { UpdateCognitiveProfileSchema } from '@/validations/schemas';

async function getHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();

  await connectDB();

  const profile = await CognitiveProfileService.getOrCreateProfile(auth.userId);
  return ApiResponseHandler.success(profile, 'Cognitive profile retrieved');
}

async function putHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();

  await connectDB();

  const body = await request.json();
  const validation = UpdateCognitiveProfileSchema.safeParse(body);

  if (!validation.success) {
    return zodValidationError(validation.error);
  }

  const profile = await CognitiveProfileService.updateProfile(auth.userId, validation.data);
  return ApiResponseHandler.success(profile, 'Cognitive profile updated');
}

async function postDeriveHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();

  await connectDB();

  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  const profile = await CognitiveProfileService.getOrCreateProfile(auth.userId);

  switch (action) {
    case 'learning-style':
      await CognitiveProfileService.deriveLearningStyle(auth.userId);
      break;
    case 'attention':
      await CognitiveProfileService.deriveAttentionMetrics(auth.userId);
      break;
    case 'retention':
      await CognitiveProfileService.deriveRetentionMetrics(auth.userId);
      break;
    case 'curiosity':
      await CognitiveProfileService.deriveCuriosityMetrics(auth.userId);
      break;
    case 'problem-solving':
      await CognitiveProfileService.deriveProblemSolvingMetrics(auth.userId);
      break;
    case 'learning-speed':
      await CognitiveProfileService.deriveLearningSpeed(auth.userId);
      break;
    case 'all':
      await CognitiveProfileService.updateAllDerivedMetrics(auth.userId);
      break;
    default:
      return ApiResponseHandler.badRequest('Invalid action parameter');
  }

  const updatedProfile = await CognitiveProfileService.getOrCreateProfile(auth.userId);
  return ApiResponseHandler.success(updatedProfile, 'Metrics derived successfully');
}

export const GET = withErrorHandling(requireAuth(getHandler));
export const PUT = withErrorHandling(requireAuth(putHandler));
export const POST = withErrorHandling(requireAuth(postDeriveHandler));