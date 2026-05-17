/**
 * POST /api/auth/session  — Set httpOnly auth cookie after login
 * DELETE /api/auth/session — Clear auth cookie (logout)
 *
 * The Next.js Edge middleware reads this cookie to protect private routes.
 * The token is still stored in localStorage for client-side API calls.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { config } from '@/config/env';

const COOKIE_NAME = 'neuron_session';

// ─────────────────────────────────────────────
// POST — set session cookie
// ─────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid request body' }, statusCode: 400 },
      { status: 400 }
    );
  }

  const token =
    body !== null && typeof body === 'object' && 'accessToken' in body
      ? (body as { accessToken: unknown }).accessToken
      : undefined;

  if (typeof token !== 'string' || !token) {
    return NextResponse.json(
      { success: false, error: { message: 'accessToken is required' }, statusCode: 400 },
      { status: 400 }
    );
  }

  // Verify the token is legitimate before issuing the cookie
  const payload = verifyAccessToken(token);
  if (!payload) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid or expired token' }, statusCode: 401 },
      { status: 401 }
    );
  }

  // Remaining lifetime in seconds
  const maxAge = payload.exp - Math.floor(Date.now() / 1000);

  const response = NextResponse.json(
    { success: true, message: 'Session established', statusCode: 200 },
    { status: 200 }
  );

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.server.isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: maxAge > 0 ? maxAge : 86_400, // fallback: 24 h
  });

  return response;
}

// ─────────────────────────────────────────────
// DELETE — clear session cookie (logout)
// ─────────────────────────────────────────────

export async function DELETE(_request: NextRequest) {
  const response = NextResponse.json(
    { success: true, message: 'Logged out', statusCode: 200 },
    { status: 200 }
  );

  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: config.server.isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // immediate expiry
  });

  return response;
}
