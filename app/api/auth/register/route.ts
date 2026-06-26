/**
 * POST /api/auth/register
 * Create a new user account without exposing auth tokens in JSON.
 */

import { NextRequest } from 'next/server';
import { ZodError } from 'zod';

import { connectDB } from '@/database/connection';
import { AuthService } from '@/modules/auth/auth.service';
import { ApiResponseHandler, zodValidationError } from '@/lib/utils/response';
import { RegisterSchema } from '@/validations/schemas';
import { withErrorHandling, withRateLimit } from '@/middleware/auth';
import { requireCsrfProtection } from '@/lib/security/csrf';

async function handler(request: NextRequest) {
  await connectDB();

  const body: unknown = await request.json();

  // Validate — throws ZodError on failure
  let validatedData;
  try {
    validatedData = RegisterSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      return zodValidationError(error);
    }
    throw error;
  }

  const result = await AuthService.register(validatedData);

  return ApiResponseHandler.created(
    { user: result.user },
    'Account created successfully'
  );
}

export const POST = withErrorHandling(
  withRateLimit(requireCsrfProtection(handler), 50, 3_600_000) // 50 registrations per hour per IP (production only)
);