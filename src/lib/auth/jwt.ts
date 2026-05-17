/**
 * JWT Authentication Utilities
 * Token generation, verification, and payload handling
 */

import jwt, { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';
import { config } from '@/config/env';
import { JWTPayload, AuthTokens } from '@/types';

/**
 * Generate access token
 */
export function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  const jwtSecret: Secret = config.auth.jwtSecret;
  const options: SignOptions = {
    expiresIn: config.auth.jwtExpiration as SignOptions['expiresIn'],
    algorithm: 'HS256',
  };

  return jwt.sign(payload, jwtSecret, options);
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(userId: string): string {
  const refreshSecret: Secret = config.auth.refreshTokenSecret;
  const options: SignOptions = {
    expiresIn: config.auth.refreshTokenExpiration as SignOptions['expiresIn'],
    algorithm: 'HS256',
  };

  return jwt.sign({ userId }, refreshSecret, options);
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
    const jwtSecret: Secret = config.auth.jwtSecret;
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
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
    const refreshSecret: Secret = config.auth.refreshTokenSecret;
    const decoded = jwt.verify(token, refreshSecret) as {
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
export function extractTokenFromHeader(authHeader?: string | null): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}
