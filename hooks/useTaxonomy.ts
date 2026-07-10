'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiGet, apiPost, apiDelete, ApiClientError } from '@/lib/api/client';
import type { ITaxonomyNode } from '@/types';
import type { CreateTaxonomyNodeInput } from '@/validations/knowledge';

export function useTaxonomy() {
  const [nodes, setNodes] = useState<ITaxonomyNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNodes = useCallback(async (domain?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<ITaxonomyNode[]>(
        '/api/knowledge/taxonomy',
        domain ? { domain } : undefined
      );
      setNodes(data);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Failed to load taxonomy';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  const fetchTree = useCallback(
    (nodeId?: string) =>
      apiGet<ITaxonomyNode[]>('/api/knowledge/taxonomy/tree', nodeId ? { nodeId } : undefined),
    []
  );

  const fetchChildren = useCallback(
    (nodeId: string) => apiGet<ITaxonomyNode[]>(`/api/knowledge/taxonomy/${nodeId}/children`),
    []
  );

  const fetchNode = useCallback(
    (nodeId: string) => apiGet<ITaxonomyNode>(`/api/knowledge/taxonomy/${nodeId}`),
    []
  );

  const createNode = useCallback(
    async (input: CreateTaxonomyNodeInput) => {
      const created = await apiPost<ITaxonomyNode>('/api/knowledge/taxonomy', input);
      toast.success('Taxonomy node created');
      fetchNodes(input.domain);
      return created;
    },
    [fetchNodes]
  );

  const deleteNode = useCallback(
    async (nodeId: string) => {
      await apiDelete(`/api/knowledge/taxonomy/${nodeId}`);
      toast.success('Taxonomy node deleted');
      fetchNodes();
    },
    [fetchNodes]
  );

  return {
    nodes,
    loading,
    error,
    refetch: fetchNodes,
    fetchTree,
    fetchChildren,
    fetchNode,
    createNode,
    deleteNode,
  };
}
