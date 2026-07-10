'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiGet, apiPost, ApiClientError } from '@/lib/api/client';
import type { IRelationship, PaginatedResponse, RelationshipType } from '@/types';
import type { CreateRelationshipInput } from '@/validations/knowledge';

export type RelationshipQuery = {
  sourceId?: string;
  targetId?: string;
  type?: RelationshipType;
  page?: number;
  pageSize?: number;
}

export function useRelationships(initialQuery: RelationshipQuery = {}) {
  const [relationships, setRelationships] = useState<IRelationship[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialQuery.page ?? 1);
  const [pageSize, setPageSize] = useState(initialQuery.pageSize ?? 50);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<RelationshipQuery>(initialQuery);

  const fetchRelationships = useCallback(async (q: RelationshipQuery = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<PaginatedResponse<IRelationship>>('/api/knowledge/relationships', q);
      setRelationships(data.items);
      setTotal(data.total);
      setPage(data.page);
      setPageSize(data.pageSize);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Failed to load relationships';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRelationships(query);
  }, [fetchRelationships, query]);

  const create = useCallback(
    async (input: CreateRelationshipInput) => {
      const created = await apiPost<IRelationship>('/api/knowledge/relationships', input);
      toast.success('Relationship created');
      fetchRelationships(query);
      return created;
    },
    [fetchRelationships, query]
  );

  return {
    relationships,
    total,
    page,
    pageSize,
    loading,
    error,
    refetch: fetchRelationships,
    create,
  };
}
