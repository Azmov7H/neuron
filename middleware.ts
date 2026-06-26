/**
 * Next.js Edge Middleware
 * Protects private routes — runs before every matching request.
 *
 * Strategy:
 *   - Reads `neuron_session` httpOnly cookie set by /api/auth/session
 *   - If cookie is absent → redirect to /auth/login
 *   - Public routes (auth pages, api, static) are excluded via `matcher`
 */

import { NextRequest, NextResponse } from 'next/server';

const ACCESS_COOKIE_NAME = 'neuron_session';
const LOGIN_PATH = '/auth/login';
const CSRF_COOKIE_NAME = 'neuron_csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Allow auth API routes to pass through. Authentication and CSRF protection
  // are handled by route-level wrappers for /api/auth.
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/') && !SAFE_METHODS.includes(request.method)) {
    const csrfCookie = request.cookies.get(CSRF_COOKIE_NAME)?.value;
    const csrfHeader = request.headers.get(CSRF_HEADER_NAME);

    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Invalid CSRF token' },
          statusCode: 403,
        },
        { status: 403 }
      );
    }
  }

  const token = request.cookies.get(ACCESS_COOKIE_NAME)?.value;

  if (!token) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = LOGIN_PATH;
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!auth|api/auth|_next|favicon.ico).*)',
  ],
};
