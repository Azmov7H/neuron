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

const COOKIE_NAME = 'neuron_session';
const LOGIN_PATH = '/auth/login';

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Allow auth API routes to pass through (they set/clear the cookie)
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    // Preserve the intended destination for post-login redirect
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = LOGIN_PATH;
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Token exists — allow the request through.
  // Full JWT verification is done in requireAuth middleware for API routes.
  // For page routes, the dashboard components call APIs that enforce auth.
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     *  - /auth/*          → login/register pages
     *  - /api/auth/*      → auth API routes
     *  - /_next/*         → Next.js internals
     *  - /favicon.ico
     *  - / (marketing landing page)
     */
    '/dashboard/:path*',
    '/(platform)/:path*',
  ],
};
