/**
 * Auth cookie helpers for secure server-side auth state.
 */

import { NextResponse } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { config } from '@/config/env';

export const ACCESS_COOKIE_NAME = 'neuron_session';
export const REFRESH_COOKIE_NAME = 'neuron_refresh';
export const CSRF_COOKIE_NAME = 'neuron_csrf';

function getTokenMaxAge(token: string): number {
  const decoded = jwt.decode(token) as JwtPayload | null;
  const now = Math.floor(Date.now() / 1000);
  const maxAge = decoded?.exp ? decoded.exp - now : 0;
  return Math.max(maxAge, 0);
}

const cookieOptions = {
  httpOnly: true,
  secure: config.server.isProduction,
  sameSite: 'lax' as const,
  path: '/',
};

export function setAuthCookies(response: NextResponse, accessToken: string, refreshToken: string): NextResponse {
  response.cookies.set(ACCESS_COOKIE_NAME, accessToken, {
    ...cookieOptions,
    maxAge: getTokenMaxAge(accessToken),
  });

  response.cookies.set(REFRESH_COOKIE_NAME, refreshToken, {
    ...cookieOptions,
    maxAge: getTokenMaxAge(refreshToken),
  });

  return response;
}

export function clearAuthCookies(response: NextResponse): NextResponse {
  response.cookies.set(ACCESS_COOKIE_NAME, '', {
    ...cookieOptions,
    maxAge: 0,
  });

  response.cookies.set(REFRESH_COOKIE_NAME, '', {
    ...cookieOptions,
    maxAge: 0,
  });

  return response;
}
