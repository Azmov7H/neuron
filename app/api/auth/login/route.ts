/**
 * POST /api/auth/login
 * Authenticate a user and establish secure auth cookies.
 */

import { NextRequest } from 'next/server';
import { ZodError } from 'zod';

import { connectDB } from '@/database/connection';
import { AuthService } from '@/modules/auth/auth.service';
import { ApiResponseHandler, zodValidationError } from '@/lib/utils/response';
import { LoginSchema } from '@/validations/schemas';
import { withErrorHandling, withRateLimit } from '@/middleware/auth';
import { requireCsrfProtection } from '@/lib/security/csrf';
import { setAuthCookies } from '@/lib/auth/cookies';

async function handler(request: NextRequest) {
  await connectDB();

  const body: unknown = await request.json();

  let validatedData;
  try {
    validatedData = LoginSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      return zodValidationError(error);
    }
    throw error;
  }

  const result = await AuthService.login(validatedData);

  const response = ApiResponseHandler.success(
    { user: result.user },
    'Login successful'
  );

  setAuthCookies(response, result.tokens.accessToken, result.tokens.refreshToken);
  return response;
}

export const POST = withErrorHandling(
  withRateLimit(requireCsrfProtection(handler), 10, 3_600_000) // 10 login attempts per hour per IP (production only)
);
