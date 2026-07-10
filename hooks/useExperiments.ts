'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiGet, apiPost, apiPut, apiDelete, ApiClientError } from '@/lib/api/client';
import type { IExperiment, PaginatedResponse, ScientificDomain, Difficulty } from '@/types';
import type { CreateExperimentInput } from '@/validations/knowledge';

export type UpdateExperimentInput = Partial<CreateExperimentInput>;

export type ExperimentQuery = {
  domain?: ScientificDomain;
  conceptId?: string;
  difficulty?: Difficulty;
  isPublished?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export function useExperiments(initialQuery: ExperimentQuery = {}) {
  const [experiments, setExperiments] = useState<IExperiment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialQuery.page ?? 1);
  const [pageSize, setPageSize] = useState(initialQuery.pageSize ?? 20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<ExperimentQuery>(initialQuery);

  const fetchExperiments = useCallback(async (q: ExperimentQuery = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<PaginatedResponse<IExperiment>>('/api/knowledge/experiments', q);
      setExperiments(data.items);
      setTotal(data.total);
      setPage(data.page);
      setPageSize(data.pageSize);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Failed to load experiments';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExperiments(query);
  }, [fetchExperiments, query]);

  const getBySlug = useCallback(
    (slug: string) => apiGet<IExperiment>(`/api/knowledge/experiments/${slug}`),
    []
  );

  const create = useCallback(
    async (input: CreateExperimentInput) => {
      const created = await apiPost<IExperiment>('/api/knowledge/experiments', input);
      toast.success('Experiment created');
      fetchExperiments(query);
      return created;
    },
    [fetchExperiments, query]
  );

  const update = useCallback(
    async (slug: string, patch: UpdateExperimentInput) => {
      const updated = await apiPut<IExperiment>(`/api/knowledge/experiments/${slug}`, patch);
      toast.success('Experiment updated');
      fetchExperiments(query);
      return updated;
    },
    [fetchExperiments, query]
  );

  const remove = useCallback(
    async (slug: string) => {
      await apiDelete(`/api/knowledge/experiments/${slug}`);
      toast.success('Experiment deleted');
      fetchExperiments(query);
    },
    [fetchExperiments, query]
  );

  return {
    experiments,
    total,
    page,
    pageSize,
    loading,
    error,
    refetch: fetchExperiments,
    getBySlug,
    create,
    update,
    remove,
  };
}
