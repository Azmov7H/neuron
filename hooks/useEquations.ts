'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiGet, apiPost, apiPut, apiDelete, ApiClientError } from '@/lib/api/client';
import type { IEquation, PaginatedResponse, ScientificDomain } from '@/types';
import type { CreateEquationInput } from '@/validations/knowledge';

export type UpdateEquationInput = Partial<CreateEquationInput>;

export type EquationQuery = {
  domain?: ScientificDomain;
  conceptId?: string;
  graphSupport?: boolean;
  isPublished?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export function useEquations(initialQuery: EquationQuery = {}) {
  const [equations, setEquations] = useState<IEquation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialQuery.page ?? 1);
  const [pageSize, setPageSize] = useState(initialQuery.pageSize ?? 20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<EquationQuery>(initialQuery);

  const fetchEquations = useCallback(async (q: EquationQuery = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<PaginatedResponse<IEquation>>('/api/knowledge/equations', q);
      setEquations(data.items);
      setTotal(data.total);
      setPage(data.page);
      setPageSize(data.pageSize);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Failed to load equations';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEquations(query);
  }, [fetchEquations, query]);

  const getById = useCallback(
    (equationId: string) => apiGet<IEquation>(`/api/knowledge/equations/${equationId}`),
    []
  );

  const fetchSolvable = useCallback(
    () => apiGet<IEquation[]>('/api/knowledge/equations/solvable'),
    []
  );

  const create = useCallback(
    async (input: CreateEquationInput) => {
      const created = await apiPost<IEquation>('/api/knowledge/equations', input);
      toast.success('Equation created');
      fetchEquations(query);
      return created;
    },
    [fetchEquations, query]
  );

  const update = useCallback(
    async (equationId: string, patch: UpdateEquationInput) => {
      const updated = await apiPut<IEquation>(`/api/knowledge/equations/${equationId}`, patch);
      toast.success('Equation updated');
      fetchEquations(query);
      return updated;
    },
    [fetchEquations, query]
  );

  const remove = useCallback(
    async (equationId: string) => {
      await apiDelete(`/api/knowledge/equations/${equationId}`);
      toast.success('Equation deleted');
      fetchEquations(query);
    },
    [fetchEquations, query]
  );

  return {
    equations,
    total,
    page,
    pageSize,
    loading,
    error,
    refetch: fetchEquations,
    getById,
    fetchSolvable,
    create,
    update,
    remove,
  };
}
