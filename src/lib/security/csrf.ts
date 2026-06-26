/**
 * CSRF helpers for App Router-compatible state change protection.
 */

import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseHandler } from '@/lib/utils/response';
import { config } from '@/config/env';

export const CSRF_COOKIE_NAME = 'neuron_csrf';
export const CSRF_HEADER_NAME = 'x-csrf-token';
export const CSRF_TOKEN_TTL_SECONDS = 60 * 60 * 24;

export type RouteContext = { params: Promise<Record<string, string | string[]>> };
export type RouteHandler = (
  request: NextRequest,
  context: RouteContext
) => Promise<NextResponse> | NextResponse;

export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

export function setCsrfCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: config.server.isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: CSRF_TOKEN_TTL_SECONDS,
  });
  return response;
}

export function getCsrfTokenFromRequest(request: NextRequest): string | null {
  const header = request.headers.get(CSRF_HEADER_NAME);
  return typeof header === 'string' ? header : null;
}

export function validateCsrfRequest(request: NextRequest): boolean {
  const tokenCookie = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = getCsrfTokenFromRequest(request);
  return Boolean(tokenCookie && headerToken && tokenCookie === headerToken);
}

export function requireCsrfProtection(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return handler(request, context);
    }

    if (!validateCsrfRequest(request)) {
      return ApiResponseHandler.forbidden('Missing or invalid CSRF token');
    }

    return handler(request, context);
  };
}
