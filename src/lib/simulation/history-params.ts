/**
 * History API Parameter Guards
 * Pure helpers so the history route's limit handling can be contract-tested
 * without a database. The route must never forward an unvalidated client
 * limit straight into a Mongo `.limit()` call.
 */

import mongoose from 'mongoose';

export const HISTORY_LIMIT_MIN = 1;
export const HISTORY_LIMIT_MAX = 100;
export const HISTORY_LIMIT_DEFAULT = 15;

export interface HistoryFilters {
  domain?: string | null;
  simulationId?: string | null;
}

/**
 * Builds the ownership-scoped Mongo query for history reads. The user id is
 * always derived from the authenticated context — never from client input —
 * and any client-supplied filters are appended without overriding it.
 */
export function buildHistoryQuery(
  authUserId: string,
  filters: HistoryFilters = {}
): Record<string, unknown> {
  const query: Record<string, unknown> = {
    userId: new mongoose.Types.ObjectId(authUserId),
  };
  if (filters.domain) {
    query.domain = filters.domain;
  }
  if (filters.simulationId) {
    query.simulationId = filters.simulationId;
  }
  return query;
}

/**
 * Resolves a raw `limit` query value to a safe integer within [1, 100].
 * Non-numeric input falls back to the default; out-of-range values are
 * clamped into bounds rather than rejected, keeping the existing API
 * ergonomics intact.
 */
export function parseHistoryLimit(
  raw: string | null | undefined,
  fallback: number = HISTORY_LIMIT_DEFAULT
): number {
  if (raw === null || raw === undefined || raw.trim() === '') {
    return fallback;
  }
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  const floored = Math.floor(n);
  if (floored < HISTORY_LIMIT_MIN) return HISTORY_LIMIT_MIN;
  if (floored > HISTORY_LIMIT_MAX) return HISTORY_LIMIT_MAX;
  return floored;
}