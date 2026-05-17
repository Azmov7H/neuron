/**
 * Response Utilities
 * Standardized API response formatting — all responses follow:
 * { success, data?, error?: { message, fields? }, message?, statusCode }
 */

import { NextResponse } from 'next/server';
import { ApiResponse, PaginatedResponse, AppError } from '@/types';

// ─────────────────────────────────────────────
// Core Handler
// ─────────────────────────────────────────────

export class ApiResponseHandler {
  static success<T>(
    data: T,
    message = 'Success',
    statusCode = 200
  ): NextResponse<ApiResponse<T>> {
    return NextResponse.json(
      { success: true, data, message, statusCode },
      { status: statusCode }
    );
  }

  static created<T>(data: T, message = 'Created successfully'): NextResponse<ApiResponse<T>> {
    return this.success(data, message, 201);
  }

  static paginated<T>(
    items: T[],
    total: number,
    page: number,
    pageSize: number,
    message = 'Success'
  ): NextResponse<ApiResponse<PaginatedResponse<T>>> {
    const totalPages = Math.ceil(total / pageSize);
    return this.success(
      {
        items,
        total,
        page,
        pageSize,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      message,
      200
    );
  }

  static error(
    error: Error | AppError | string,
    statusCode = 500
  ): NextResponse<ApiResponse> {
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          success: false,
          error: { message: error.message },
          message: error.code ?? 'An error occurred',
          statusCode: error.statusCode,
        },
        { status: error.statusCode }
      );
    }

    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: { message },
        message: 'An error occurred',
        statusCode,
      },
      { status: statusCode }
    );
  }

  static badRequest(message: string): NextResponse<ApiResponse> {
    return this.error(new AppError(400, message, 'BAD_REQUEST'), 400);
  }

  static unauthorized(message = 'Unauthorized'): NextResponse<ApiResponse> {
    return this.error(new AppError(401, message, 'UNAUTHORIZED'), 401);
  }

  static forbidden(message = 'Forbidden'): NextResponse<ApiResponse> {
    return this.error(new AppError(403, message, 'FORBIDDEN'), 403);
  }

  static notFound(message = 'Not found'): NextResponse<ApiResponse> {
    return this.error(new AppError(404, message, 'NOT_FOUND'), 404);
  }

  static conflict(message: string): NextResponse<ApiResponse> {
    return this.error(new AppError(409, message, 'CONFLICT'), 409);
  }

  static internalError(message = 'Internal server error'): NextResponse<ApiResponse> {
    return this.error(new AppError(500, message, 'INTERNAL_ERROR'), 500);
  }
}

// ─────────────────────────────────────────────
// Validation Error — field-level errors
// ─────────────────────────────────────────────

/**
 * Returns a 422 response with per-field validation errors.
 * Shape: { success: false, error: { message, fields }, statusCode: 422 }
 */
export function validationError(
  fields: Record<string, string[]>
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        message: 'Validation failed',
        fields,
      },
      message: 'Invalid input',
      statusCode: 422,
    },
    { status: 422 }
  );
}

// ─────────────────────────────────────────────
// Zod Error Mapper
// ─────────────────────────────────────────────

import type { ZodError } from 'zod';

/**
 * Converts a ZodError into a { field: string[] } map and returns a 422 response.
 */
export function zodValidationError(error: ZodError): NextResponse<ApiResponse> {
  const fields: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_root';
    if (!fields[path]) fields[path] = [];
    fields[path].push(issue.message);
  }

  return validationError(fields);
}
