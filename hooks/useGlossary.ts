'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiGet, apiPost, apiPut, apiDelete, ApiClientError } from '@/lib/api/client';
import type { IGlossaryTerm, PaginatedResponse, ScientificDomain, Difficulty } from '@/types';
import type { CreateGlossaryTermInput } from '@/validations/knowledge';

export type UpdateGlossaryTermInput = Partial<CreateGlossaryTermInput>;

export type GlossaryQuery = {
  domain?: ScientificDomain;
  difficulty?: Difficulty;
  isPublished?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export function useGlossary(initialQuery: GlossaryQuery = {}) {
  const [terms, setTerms] = useState<IGlossaryTerm[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialQuery.page ?? 1);
  const [pageSize, setPageSize] = useState(initialQuery.pageSize ?? 50);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<GlossaryQuery>(initialQuery);

  const fetchTerms = useCallback(async (q: GlossaryQuery = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<PaginatedResponse<IGlossaryTerm>>('/api/knowledge/glossary', q);
      setTerms(data.items);
      setTotal(data.total);
      setPage(data.page);
      setPageSize(data.pageSize);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Failed to load glossary';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTerms(query);
  }, [fetchTerms, query]);

  const getBySlug = useCallback(
    (slug: string) => apiGet<IGlossaryTerm>(`/api/knowledge/glossary/${slug}`),
    []
  );

  const fetchRandom = useCallback(
    (domain?: ScientificDomain) =>
      apiGet<IGlossaryTerm>('/api/knowledge/glossary/random', domain ? { domain } : undefined),
    []
  );

  const create = useCallback(
    async (input: CreateGlossaryTermInput) => {
      const created = await apiPost<IGlossaryTerm>('/api/knowledge/glossary', input);
      toast.success('Glossary term created');
      fetchTerms(query);
      return created;
    },
    [fetchTerms, query]
  );

  const update = useCallback(
    async (slug: string, patch: UpdateGlossaryTermInput) => {
      const updated = await apiPut<IGlossaryTerm>(`/api/knowledge/glossary/${slug}`, patch);
      toast.success('Glossary term updated');
      fetchTerms(query);
      return updated;
    },
    [fetchTerms, query]
  );

  const remove = useCallback(
    async (slug: string) => {
      await apiDelete(`/api/knowledge/glossary/${slug}`);
      toast.success('Glossary term deleted');
      fetchTerms(query);
    },
    [fetchTerms, query]
  );

  return {
    terms,
    total,
    page,
    pageSize,
    loading,
    error,
    refetch: fetchTerms,
    getBySlug,
    fetchRandom,
    create,
    update,
    remove,
  };
}
