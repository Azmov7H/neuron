/**
 * POST /api/auth/refresh
 * Rotate authentication cookies using a valid refresh token cookie.
 */

import { NextRequest } from 'next/server';

import { connectDB } from '@/database/connection';
import { AuthService } from '@/modules/auth/auth.service';
import { ApiResponseHandler } from '@/lib/utils/response';
import { withErrorHandling } from '@/middleware/auth';
import { requireCsrfProtection } from '@/lib/security/csrf';
import { REFRESH_COOKIE_NAME, setAuthCookies } from '@/lib/auth/cookies';

async function handler(request: NextRequest) {
  await connectDB();

  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
  if (!refreshToken) {
    return ApiResponseHandler.unauthorized('Refresh token cookie missing');
  }

  const tokens = await AuthService.refreshToken(refreshToken);
  const response = ApiResponseHandler.success(
    { expiresIn: tokens.expiresIn },
    'Token refreshed successfully'
  );

  setAuthCookies(response, tokens.accessToken, tokens.refreshToken);
  return response;
}

export const POST = withErrorHandling(requireCsrfProtection(handler));
