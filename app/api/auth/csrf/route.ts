/**
 * GET /api/auth/csrf
 * Issues a one-time CSRF token and stores it in a same-site cookie.
 */

import { ApiResponseHandler } from '@/lib/utils/response';
import { generateCsrfToken, setCsrfCookie } from '@/lib/security/csrf';

export async function GET() {
  const token = generateCsrfToken();
  const response = ApiResponseHandler.success({ csrfToken: token }, 'CSRF token issued');
  setCsrfCookie(response, token);
  return response;
}
