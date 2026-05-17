/**
 * POST /api/auth/login
 * Login user and get tokens
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { AuthService } from '@/modules/auth/auth.service';
import { ApiResponseHandler } from '@/lib/utils/response';
import { LoginSchema } from '@/validations/schemas';
import { withErrorHandling, withRateLimit } from '@/middleware/auth';

async function handler(request: NextRequest) {
  try {
    await connectDB();

    // Parse and validate
    const body = await request.json();
    const validatedData = LoginSchema.parse(body);

    // Login user
    const result = await AuthService.login(validatedData);

    return ApiResponseHandler.success(result, 'Login successful');
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return ApiResponseHandler.badRequest('Invalid input');
    }

    throw error;
  }
}

export const POST = withErrorHandling(withRateLimit(handler, 10, 3600000)); // 10 requests per hour
