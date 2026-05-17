/**
 * POST /api/auth/register
 * Create a new user account
 */

import { NextRequest } from 'next/server';
import { ZodError } from 'zod';

import { connectDB } from '@/database/connection';
import { AuthService } from '@/modules/auth/auth.service';
import { ApiResponseHandler, zodValidationError } from '@/lib/utils/response';
import { RegisterSchema } from '@/validations/schemas';
import { withErrorHandling, withRateLimit } from '@/middleware/auth';

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

  return ApiResponseHandler.created(result, 'Account created successfully');
}

export const POST = withErrorHandling(
  withRateLimit(handler, 50, 3_600_000) // 50 registrations per hour per IP (production only)
);