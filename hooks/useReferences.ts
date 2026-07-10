'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiGet, apiPost, apiPut, apiDelete, ApiClientError } from '@/lib/api/client';
import type { IReference, PaginatedResponse, ScientificDomain, SourceProvider } from '@/types';
import type { CreateReferenceInput } from '@/validations/knowledge';

export type UpdateReferenceInput = Partial<CreateReferenceInput>;

export type ReferenceQuery = {
  provider?: SourceProvider;
  domain?: ScientificDomain;
  isPeerReviewed?: boolean;
  minTrust?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}

export function useReferences(initialQuery: ReferenceQuery = {}) {
  const [references, setReferences] = useState<IReference[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialQuery.page ?? 1);
  const [pageSize, setPageSize] = useState(initialQuery.pageSize ?? 20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<ReferenceQuery>(initialQuery);

  const fetchReferences = useCallback(async (q: ReferenceQuery = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<PaginatedResponse<IReference>>('/api/knowledge/references', q);
      setReferences(data.items);
      setTotal(data.total);
      setPage(data.page);
      setPageSize(data.pageSize);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Failed to load references';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReferences(query);
  }, [fetchReferences, query]);

  const getById = useCallback(
    (referenceId: string) => apiGet<IReference>(`/api/knowledge/references/${referenceId}`),
    []
  );

  const create = useCallback(
    async (input: CreateReferenceInput) => {
      const created = await apiPost<IReference>('/api/knowledge/references', input);
      toast.success('Reference created');
      fetchReferences(query);
      return created;
    },
    [fetchReferences, query]
  );

  const update = useCallback(
    async (referenceId: string, patch: UpdateReferenceInput) => {
      const updated = await apiPut<IReference>(`/api/knowledge/references/${referenceId}`, patch);
      toast.success('Reference updated');
      fetchReferences(query);
      return updated;
    },
    [fetchReferences, query]
  );

  const remove = useCallback(
    async (referenceId: string) => {
      await apiDelete(`/api/knowledge/references/${referenceId}`);
      toast.success('Reference deleted');
      fetchReferences(query);
    },
    [fetchReferences, query]
  );

  return {
    references,
    total,
    page,
    pageSize,
    loading,
    error,
    refetch: fetchReferences,
    getById,
    create,
    update,
    remove,
  };
}
