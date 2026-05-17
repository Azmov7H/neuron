/**
 * POST /api/auth/login
 * Authenticate a user and return a token pair
 */

import { NextRequest } from 'next/server';
import { ZodError } from 'zod';

import { connectDB } from '@/database/connection';
import { AuthService } from '@/modules/auth/auth.service';
import { ApiResponseHandler, zodValidationError } from '@/lib/utils/response';
import { LoginSchema } from '@/validations/schemas';
import { withErrorHandling, withRateLimit } from '@/middleware/auth';

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

  return ApiResponseHandler.success(result, 'Login successful');
}

export const POST = withErrorHandling(
  withRateLimit(handler, 10, 3_600_000) // 10 login attempts per hour per IP (production only)
);
