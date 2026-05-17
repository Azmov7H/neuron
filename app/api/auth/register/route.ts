/**
 * POST /api/auth/register
 * Register a new user
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { AuthService } from '@/modules/auth/auth.service';
import { ApiResponseHandler } from '@/lib/utils/response';
import { RegisterSchema } from '@/validations/schemas';
import { withErrorHandling, withRateLimit } from '@/middleware/auth';

async function handler(request: NextRequest) {
  try {
    await connectDB();

    // Parse and validate
    const body = await request.json();
    const validatedData = RegisterSchema.parse(body);

    // Register user
    const result = await AuthService.register(validatedData);

    return ApiResponseHandler.created(result, 'User registered successfully');
  } catch (error: any) {
    if (error.name === 'ZodError') {
      const errors: Record<string, string[]> = {};
      error.errors.forEach((err: any) => {
        const path = err.path.join('.');
        if (!errors[path]) errors[path] = [];
        errors[path].push(err.message);
      });
      return ApiResponseHandler.badRequest(JSON.stringify(errors));
    }

    throw error;
  }
}

export const POST = withErrorHandling(withRateLimit(handler, 5, 3600000)); // 5 requests per hour
