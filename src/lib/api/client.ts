/**
 * Typed API client for Neuron's internal REST endpoints.
 * Centralizes the `credentials: 'include'` requirement (httpOnly session
 * cookies) and unwraps the standard `{ success, data, error }` envelope.
 */

import type { ApiResponse } from '@/types';

export class ApiClientError extends Error {
  readonly statusCode: number;
  readonly fields?: Record<string, string[]>;

  constructor(message: string, statusCode: number, fields?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.fields = fields;
  }
}

export type QueryValue = string | number | boolean | undefined | null;
export type QueryParams = Record<string, unknown>;

export function buildQuery(params?: QueryParams): string {
  if (!params) return '';
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      if (value.length) sp.set(key, value.join(','));
    } else {
      sp.set(key, String(value));
    }
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type') && init?.body) headers.set('Content-Type', 'application/json');

  let response: Response;
  try {
    response = await fetch(path, { ...init, headers, credentials: 'include' });
  } catch (cause) {
    throw new ApiClientError(
      cause instanceof Error ? `Network error: ${cause.message}` : 'Network error',
      0
    );
  }

  let body: ApiResponse<T>;
  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    if (!response.ok) throw new ApiClientError(`Request failed (${response.status})`, response.status);
    throw new ApiClientError('Invalid server response', response.status);
  }

  if (!response.ok || !body.success) {
    throw new ApiClientError(
      body.error?.message ?? body.message ?? `Request failed (${response.status})`,
      body.statusCode ?? response.status,
      body.error?.fields
    );
  }

  return body.data as T;
}

export function apiGet<T>(path: string, params?: QueryParams): Promise<T> {
  return request<T>(`${path}${buildQuery(params)}`);
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
}

export function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined });
}

export function apiDelete<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined });
}
