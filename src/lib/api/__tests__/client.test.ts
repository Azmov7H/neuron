import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiGet, resolveApiUrl } from '../client';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('resolveApiUrl', () => {
  it('keeps same-origin paths when the base URL is unset', () => {
    expect(resolveApiUrl('/api/health', undefined)).toBe('/api/health');
  });

  it('keeps same-origin paths when the base URL is empty', () => {
    expect(resolveApiUrl('/api/health', '')).toBe('/api/health');
    expect(resolveApiUrl('/api/health', '   ')).toBe('/api/health');
  });

  it('prefixes the configured base URL', () => {
    expect(resolveApiUrl('/api/health', 'https://api.example.com')).toBe(
      'https://api.example.com/api/health'
    );
  });

  it('removes trailing slashes from the base and adds a missing leading slash', () => {
    expect(resolveApiUrl('api/health', 'https://api.example.com///')).toBe(
      'https://api.example.com/api/health'
    );
  });

  it('preserves the query string', () => {
    expect(resolveApiUrl('/api/knowledge/search?q=gravity', 'https://api.example.com')).toBe(
      'https://api.example.com/api/knowledge/search?q=gravity'
    );
  });

  it('leaves absolute URLs unchanged', () => {
    expect(resolveApiUrl('https://cdn.example.com/file.json', 'https://api.example.com')).toBe(
      'https://cdn.example.com/file.json'
    );
  });
});

describe('apiGet', () => {
  it('requests a same-origin path when no base URL is configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', '');
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        jsonResponse({ success: true, data: { ok: true }, message: 'ok', statusCode: 200 })
      );
    vi.stubGlobal('fetch', fetchMock);

    await apiGet('/api/health');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/health',
      expect.objectContaining({ credentials: 'include' })
    );
  });

  it('requests the configured API origin', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'https://api.example.com/');
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        jsonResponse({ success: true, data: { ok: true }, message: 'ok', statusCode: 200 })
      );
    vi.stubGlobal('fetch', fetchMock);

    await apiGet('/api/health', { verbose: true });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/api/health?verbose=true',
      expect.objectContaining({ credentials: 'include' })
    );
  });
});
