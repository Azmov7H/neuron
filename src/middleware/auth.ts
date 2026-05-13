/**
 * Authentication Middleware
 * Request authentication and context extraction
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, extractTokenFromHeader } from '@/lib/auth/jwt';
import { RequestContext, AppError } from '@/types';
import { ApiResponseHandler } from '@/lib/utils/response';

/**
 * Authenticate request and extract user context
 */
export function authenticateRequest(request: NextRequest): RequestContext | null {
  const authHeader = request.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return null;
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return null;
  }

  return {
    userId: payload.userId,
    email: payload.email,
    username: payload.username,
    isAuthenticated: true,
  };
}

/**
 * Middleware: Require authentication
 */
export function requireAuth(handler: Function) {
  return async (request: NextRequest, context: any) => {
    try {
      const auth = authenticateRequest(request);

      if (!auth) {
        return ApiResponseHandler.unauthorized('Authentication required');
      }

      // Add auth context to request
      (request as any).auth = auth;

      return handler(request, context);
    } catch (error) {
      console.error('[Auth] Error:', error);
      return ApiResponseHandler.unauthorized('Invalid token');
    }
  };
}

/**
 * Extract user context from request (safe - returns null if not authenticated)
 */
export function getAuthContext(request: NextRequest): RequestContext | null {
  return authenticateRequest(request);
}

/**
 * Rate limiting middleware (basic implementation)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function withRateLimit(
  handler: Function,
  limit = 100,
  windowMs = 60000 // 1 minute
) {
  return async (request: NextRequest, context: any) => {
    const identifier = request.ip || 'anonymous';
    const now = Date.now();

    let record = rateLimitStore.get(identifier);

    if (!record || record.resetTime < now) {
      record = { count: 0, resetTime: now + windowMs };
      rateLimitStore.set(identifier, record);
    }

    record.count++;

    if (record.count > limit) {
      return ApiResponseHandler.error(
        new AppError(429, 'Too many requests', 'RATE_LIMIT_EXCEEDED'),
        429
      );
    }

    return handler(request, context);
  };
}

/**
 * Error handling middleware wrapper
 */
export function withErrorHandling(handler: Function) {
  return async (request: NextRequest, context: any) => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error('[API] Error:', error);

      if (error instanceof AppError) {
        return ApiResponseHandler.error(error, error.statusCode);
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      return ApiResponseHandler.internalError(message);
    }
  };
}
