/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { AuthService } from '@/modules/auth/auth.service';
import { ApiResponseHandler } from '@/lib/utils/response';
import { RefreshTokenSchema } from '@/validations/schemas';
import { withErrorHandling } from '@/middleware/auth';

async function handler(request: NextRequest) {
  try {
    await connectDB();

    // Parse and validate
    const body = await request.json();
    const { refreshToken } = RefreshTokenSchema.parse(body);

    // Refresh tokens
    const tokens = await AuthService.refreshToken(refreshToken);

    return ApiResponseHandler.success(tokens, 'Token refreshed');
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return ApiResponseHandler.badRequest('Invalid input');
    }

    throw error;
  }
}

export const POST = withErrorHandling(handler);
