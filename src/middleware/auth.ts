/**
 * Authentication Middleware
 * Request authentication, rate limiting, and error handling wrappers
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, extractTokenFromHeader } from '@/lib/auth/jwt';
import { RequestContext, AppError } from '@/types';
import { ApiResponseHandler } from '@/lib/utils/response';
import { config } from '@/config/env';
import { logger } from '@/lib/logger';
import { getRateLimitData } from '@/lib/redis/client';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

// Next.js 15+ passes params as a Promise in the App Router context
type RouteContext = { params: Promise<Record<string, string | string[]>> };
type RouteHandler = (
  request: NextRequest,
  context: RouteContext
) => Promise<NextResponse> | NextResponse;

// ─────────────────────────────────────────────
// Core: Extract auth context from request
// ─────────────────────────────────────────────

/**
 * Validates the Bearer token and returns the decoded RequestContext.
 * Returns null if no token or token is invalid — does NOT throw.
 */
export function authenticateRequest(request: NextRequest): RequestContext | null {
  const authHeader = request.headers.get('authorization');
  let token = extractTokenFromHeader(authHeader);

  if (!token) {
    token = request.cookies.get('neuron_session')?.value || null;
  }

  if (!token) return null;

  const payload = verifyAccessToken(token);
  if (!payload) return null;

  return {
    userId: payload.userId,
    email: payload.email,
    username: payload.username,
    isAuthenticated: true,
  };
}

/** Alias — safe, returns null when unauthenticated */
export function getAuthContext(request: NextRequest): RequestContext | null {
  return authenticateRequest(request);
}

// ─────────────────────────────────────────────
// Middleware: requireAuth
// ─────────────────────────────────────────────

/**
 * Wraps a route handler to require a valid JWT.
 * Attaches `request.auth` with the decoded context.
 * Returns 401 if missing or invalid.
 */
export function requireAuth(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    try {
      const auth = authenticateRequest(request);

      if (!auth) {
        return ApiResponseHandler.unauthorized('Authentication required');
      }

      // Attach auth context — consumed by the handler
      (request as NextRequest & { auth: RequestContext }).auth = auth;

      return handler(request, context);
    } catch (error) {
      logger.error('[Auth] requireAuth error:', error);
      return ApiResponseHandler.unauthorized('Invalid token');
    }
  };
}

// ─────────────────────────────────────────────
// Middleware: withRateLimit
// ─────────────────────────────────────────────

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Production-capable rate limiter backed by Redis with memory fallback.
 * Uses IP or authenticated user ID as the request key.
 */
export function withRateLimit(
  handler: RouteHandler,
  limit = config.rateLimit.maxRequests,
  windowMs = config.rateLimit.windowMs
): RouteHandler {
  return async (request, context) => {
    if (config.server.isDevelopment) {
      return handler(request, context);
    }

    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const identifier =
      forwardedFor?.split(',')[0].trim() ?? realIp ?? 'anonymous';

    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader) ?? request.cookies.get('neuron_session')?.value;
    const userId = token ? verifyAccessToken(token)?.userId : null;
    const rateKey = userId ? `user:${userId}` : `ip:${identifier}`;

    try {
      const data = await getRateLimitData(rateKey, limit, windowMs);
      if (data) {
        if (!data.allowed) {
          logger.warn('[RateLimiter] Rate limit exceeded', { rateKey, limit, count: data.count });
          return ApiResponseHandler.error(
            new AppError(429, 'Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED'),
            429
          );
        }
        return handler(request, context);
      }
    } catch (error) {
      logger.warn('[RateLimiter] Redis rate limit failed, using local fallback', error);
    }

    const now = Date.now();
    let record = rateLimitStore.get(rateKey);

    if (!record || record.resetTime < now) {
      record = { count: 0, resetTime: now + windowMs };
      rateLimitStore.set(rateKey, record);
    }

    record.count++;

    if (record.count > limit) {
      logger.warn('[RateLimiter] Local fallback rate limit exceeded', { rateKey, limit, count: record.count });
      return ApiResponseHandler.error(
        new AppError(429, 'Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED'),
        429
      );
    }

    return handler(request, context);
  };
}

// ─────────────────────────────────────────────
// Middleware: withErrorHandling
// ─────────────────────────────────────────────

/**
 * Wraps a route handler with a top-level error boundary.
 * Converts AppError → structured error response.
 * Converts unknown errors → 500 Internal Server Error.
 */
export function withErrorHandling(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      logger.error('[API] Unhandled error', error);

      if (error instanceof AppError) {
        return ApiResponseHandler.error(error, error.statusCode);
      }

      const message =
        error instanceof Error ? error.message : 'An unexpected error occurred';
      return ApiResponseHandler.internalError(message);
    }
  };
}
