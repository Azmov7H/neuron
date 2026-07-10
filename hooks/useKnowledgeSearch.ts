'use client';

import { useState, useCallback } from 'react';
import { apiGet, ApiClientError } from '@/lib/api/client';
import type { ISearchResponse } from '@/types';

export type SearchParams = {
  q: string;
  domain?: string;
  difficulty?: string;
  types?: string[];
  limit?: number;
  offset?: number;
  includeRelationships?: boolean;
}

export function useKnowledgeSearch() {
  const [results, setResults] = useState<ISearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (params: SearchParams) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<ISearchResponse>('/api/knowledge/search', params);
      setResults(data);
      return data;
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Search failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const autocomplete = useCallback(
    async (q: string, domain?: string, limit = 8) =>
      apiGet<{ query: string; suggestions: string[] }>('/api/knowledge/search/autocomplete', {
        q,
        domain,
        limit,
      }).then((r) => r.suggestions),
    []
  );

  return { results, loading, error, search, autocomplete };
}
