/**
 * DELETE /api/auth/session — Clear auth cookies and logout.
 *
 * The Next.js Edge middleware reads the auth cookie to protect private routes.
 */

import { ApiResponseHandler } from '@/lib/utils/response';
import { withErrorHandling } from '@/middleware/auth';
import { requireCsrfProtection } from '@/lib/security/csrf';
import { clearAuthCookies, CSRF_COOKIE_NAME } from '@/lib/auth/cookies';

async function handler() {
  const response = ApiResponseHandler.success(
    { message: 'Logged out' },
    'Logged out successfully'
  );

  clearAuthCookies(response);
  response.cookies.set(CSRF_COOKIE_NAME, '', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}

export const DELETE = withErrorHandling(requireCsrfProtection(handler));
