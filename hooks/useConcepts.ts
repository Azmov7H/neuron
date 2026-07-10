'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiGet, apiPost, ApiClientError } from '@/lib/api/client';
import type { IConcept, PaginatedResponse } from '@/types';
import type { CreateConceptInput } from '@/validations/knowledge';

export type ConceptQuery = {
  domain?: string;
  difficulty?: string;
  learningLevel?: string;
  isPublished?: boolean;
  prerequisiteOf?: string;
  relatedTo?: string;
  search?: string;
  sort?: 'importance' | 'views' | 'recent' | 'title';
  page?: number;
  pageSize?: number;
}

export function useConcepts(initialQuery: ConceptQuery = {}) {
  const [concepts, setConcepts] = useState<IConcept[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialQuery.page ?? 1);
  const [pageSize, setPageSize] = useState(initialQuery.pageSize ?? 20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<ConceptQuery>(initialQuery);

  const fetchConcepts = useCallback(async (q: ConceptQuery = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<PaginatedResponse<IConcept>>('/api/knowledge/concepts', q);
      setConcepts(data.items);
      setTotal(data.total);
      setPage(data.page);
      setPageSize(data.pageSize);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Failed to load concepts';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConcepts(query);
  }, [fetchConcepts, query]);

  const setFilters = useCallback((q: ConceptQuery) => {
    setQuery((prev) => ({ ...prev, ...q, page: 1 }));
  }, []);

  const goToPage = useCallback((p: number) => {
    setQuery((prev) => ({ ...prev, page: p }));
  }, []);

  const createConcept = useCallback(
    async (input: CreateConceptInput) => {
      try {
        const created = await apiPost<IConcept>('/api/knowledge/concepts', input);
        toast.success('Concept created');
        fetchConcepts(query);
        return created;
      } catch (err) {
        const message = err instanceof ApiClientError ? err.message : 'Failed to create concept';
        toast.error(message);
        throw err;
      }
    },
    [fetchConcepts, query]
  );

  return {
    concepts,
    total,
    page,
    pageSize,
    loading,
    error,
    refetch: fetchConcepts,
    setFilters,
    goToPage,
    createConcept,
  };
}
