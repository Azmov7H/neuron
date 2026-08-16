import { describe, it, expect } from 'vitest';
import {
  parseHistoryLimit,
  buildHistoryQuery,
  HISTORY_LIMIT_MIN,
  HISTORY_LIMIT_MAX,
} from '../history-params';

describe('parseHistoryLimit', () => {
  it('uses the default for missing or empty input', () => {
    expect(parseHistoryLimit(null)).toBe(15);
    expect(parseHistoryLimit(undefined)).toBe(15);
    expect(parseHistoryLimit('')).toBe(15);
    expect(parseHistoryLimit('   ')).toBe(15);
  });

  it('accepts values within the allowed range', () => {
    expect(parseHistoryLimit('1')).toBe(1);
    expect(parseHistoryLimit('15')).toBe(15);
    expect(parseHistoryLimit('100')).toBe(100);
  });

  it('clamps values above the maximum', () => {
    expect(parseHistoryLimit('101')).toBe(HISTORY_LIMIT_MAX);
    expect(parseHistoryLimit('99999')).toBe(HISTORY_LIMIT_MAX);
  });

  it('clamps values below the minimum', () => {
    expect(parseHistoryLimit('0')).toBe(HISTORY_LIMIT_MIN);
    expect(parseHistoryLimit('-5')).toBe(HISTORY_LIMIT_MIN);
  });

  it('falls back for malformed input instead of producing a huge query', () => {
    expect(parseHistoryLimit('abc')).toBe(15);
    expect(parseHistoryLimit('Infinity')).toBe(15);
    expect(parseHistoryLimit('1e9')).toBe(HISTORY_LIMIT_MAX);
  });

  it('floors fractional values', () => {
    expect(parseHistoryLimit('12.9')).toBe(12);
  });
});

describe('buildHistoryQuery — ownership', () => {
  const validUserId = '64b8f0a1c1e2a3b4c5d6e7f8';

  it('always scopes the query to the authenticated user', () => {
    const query = buildHistoryQuery(validUserId);
    expect(String(query.userId)).toBe(validUserId);
  });

  it('appends optional filters without replacing ownership', () => {
    const query = buildHistoryQuery(validUserId, {
      domain: 'physics',
      simulationId: 'relativity',
    });
    expect(String(query.userId)).toBe(validUserId);
    expect(query.domain).toBe('physics');
    expect(query.simulationId).toBe('relativity');
  });

  it('skips empty filters', () => {
    const query = buildHistoryQuery(validUserId, { domain: null, simulationId: undefined });
    expect(query).toEqual({ userId: query.userId });
    expect(query.domain).toBeUndefined();
    expect(query.simulationId).toBeUndefined();
  });

  it('rejects a user id that cannot be a Mongo ObjectId', () => {
    expect(() => buildHistoryQuery('not-an-object-id')).toThrow();
  });
});