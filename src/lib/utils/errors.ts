/**
 * Error Utilities
 * Error handling and logging helpers
 */

import { AppError } from '@/types';

/**
 * Handle and log errors consistently
 */
export function handleError(error: unknown, context?: string): AppError {
  const prefix = context ? `[${context}]` : '[Error]';

  if (error instanceof AppError) {
    console.error(`${prefix} ${error.statusCode}: ${error.message}`);
    return error;
  }

  if (error instanceof Error) {
    console.error(`${prefix} ${error.name}: ${error.message}`);
    console.error(error.stack);

    // Map common errors to AppError
    if (error.message.includes('ENOENT')) {
      return new AppError(404, 'Resource not found', 'NOT_FOUND');
    }

    if (error.message.includes('E11000') || error.message.includes('duplicate key')) {
      return new AppError(409, 'Resource already exists', 'CONFLICT');
    }

    if (
      error.message.includes('ValidationError') ||
      error.message.includes('Cast to ObjectId failed')
    ) {
      return new AppError(400, 'Invalid input', 'VALIDATION_ERROR');
    }

    return new AppError(500, error.message, 'INTERNAL_ERROR');
  }

  const message = String(error);
  console.error(`${prefix} Unknown error: ${message}`);
  return new AppError(500, 'An unknown error occurred', 'INTERNAL_ERROR');
}

/**
 * Validate required fields in object
 */
export function validateRequired(
  obj: Record<string, any>,
  fields: string[]
): { valid: boolean; missing: string[] } {
  const missing = fields.filter((field) => !obj[field]);

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Retry logic for async operations
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(
        `[Retry] Attempt ${attempt}/${maxRetries} failed:`,
        lastError.message
      );

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw lastError;
}

/**
 * Normalize error response for API
 */
export function normalizeErrorResponse(error: any) {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
    };
  }

  if (error instanceof Error) {
    return {
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: error.message,
    };
  }

  return {
    statusCode: 500,
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
  };
}
