/**
 * JWT Authentication Utilities
 * Token generation, verification, and payload handling
 */

import jwt, { JwtPayload } from 'jsonwebtoken';
import { config } from '@/config/env';
import { JWTPayload, AuthTokens } from '@/types';

/**
 * Generate access token
 */
export function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiration,
    algorithm: 'HS256',
  });
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, config.auth.refreshTokenSecret, {
    expiresIn: config.auth.refreshTokenExpiration,
    algorithm: 'HS256',
  });
}

/**
 * Generate token pair (access + refresh)
 */
export function generateTokens(payload: Omit<JWTPayload, 'iat' | 'exp'>): AuthTokens {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload.userId);

  // Get expiration time in seconds
  const decode = jwt.decode(accessToken) as JwtPayload;
  const expiresIn = (decode.exp || 0) - Math.floor(Date.now() / 1000);

  return {
    accessToken,
    refreshToken,
    expiresIn,
  };
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, config.auth.refreshTokenSecret) as {
      userId: string;
    };
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Decode token without verification (unsafe - use only for inspection)
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}
