'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiGet, apiPost, apiPut, apiDelete, ApiClientError } from '@/lib/api/client';
import type { IScientist, PaginatedResponse } from '@/types';
import type { CreateScientistInput } from '@/validations/knowledge';

export type UpdateScientistInput = Partial<CreateScientistInput>;

export type ScientistQuery = {
  field?: string;
  nationality?: string;
  isPublished?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export function useScientists(initialQuery: ScientistQuery = {}) {
  const [scientists, setScientists] = useState<IScientist[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialQuery.page ?? 1);
  const [pageSize, setPageSize] = useState(initialQuery.pageSize ?? 20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<ScientistQuery>(initialQuery);

  const fetchScientists = useCallback(async (q: ScientistQuery = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<PaginatedResponse<IScientist>>('/api/knowledge/scientists', q);
      setScientists(data.items);
      setTotal(data.total);
      setPage(data.page);
      setPageSize(data.pageSize);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Failed to load scientists';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScientists(query);
  }, [fetchScientists, query]);

  const getBySlug = useCallback(
    (slug: string) => apiGet<IScientist>(`/api/knowledge/scientists/${slug}`),
    []
  );

  const create = useCallback(
    async (input: CreateScientistInput) => {
      const created = await apiPost<IScientist>('/api/knowledge/scientists', input);
      toast.success('Scientist created');
      fetchScientists(query);
      return created;
    },
    [fetchScientists, query]
  );

  const update = useCallback(
    async (slug: string, patch: UpdateScientistInput) => {
      const updated = await apiPut<IScientist>(`/api/knowledge/scientists/${slug}`, patch);
      toast.success('Scientist updated');
      fetchScientists(query);
      return updated;
    },
    [fetchScientists, query]
  );

  const remove = useCallback(
    async (slug: string) => {
      await apiDelete(`/api/knowledge/scientists/${slug}`);
      toast.success('Scientist deleted');
      fetchScientists(query);
    },
    [fetchScientists, query]
  );

  return {
    scientists,
    total,
    page,
    pageSize,
    loading,
    error,
    refetch: fetchScientists,
    getBySlug,
    create,
    update,
    remove,
  };
}
