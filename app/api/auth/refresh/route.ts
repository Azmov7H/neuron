/**
 * POST /api/auth/refresh
 * Rotate access token using a valid refresh token
 */

import { NextRequest } from 'next/server';
import { ZodError } from 'zod';

import { connectDB } from '@/database/connection';
import { AuthService } from '@/modules/auth/auth.service';
import { ApiResponseHandler, zodValidationError } from '@/lib/utils/response';
import { RefreshTokenSchema } from '@/validations/schemas';
import { withErrorHandling } from '@/middleware/auth';

async function handler(request: NextRequest) {
  await connectDB();

  const body: unknown = await request.json();

  let refreshToken: string;
  try {
    ({ refreshToken } = RefreshTokenSchema.parse(body));
  } catch (error) {
    if (error instanceof ZodError) {
      return zodValidationError(error);
    }
    throw error;
  }

  const tokens = await AuthService.refreshToken(refreshToken);

  return ApiResponseHandler.success(tokens, 'Token refreshed successfully');
}

export const POST = withErrorHandling(handler);
