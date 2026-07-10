'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiGet, apiPost, apiPut, apiDelete, ApiClientError } from '@/lib/api/client';
import type { IConcept, RelationshipType } from '@/types';
import type { UpdateConceptInput } from '@/validations/knowledge';

export interface TraversalResult {
  conceptId: string;
  depth: number;
  via: RelationshipType;
}

export function useConcept(slug: string) {
  const [concept, setConcept] = useState<IConcept | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConcept = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<IConcept>(`/api/knowledge/concepts/${slug}`);
      setConcept(data);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Failed to load concept';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchConcept();
  }, [fetchConcept]);

  const updateConcept = useCallback(
    async (patch: UpdateConceptInput) => {
      const updated = await apiPut<IConcept>(`/api/knowledge/concepts/${slug}`, patch);
      setConcept(updated);
      toast.success('Concept updated');
      return updated;
    },
    [slug]
  );

  const deleteConcept = useCallback(async () => {
    await apiDelete(`/api/knowledge/concepts/${slug}`);
    toast.success('Concept deleted');
  }, [slug]);

  const publishConcept = useCallback(
    async (isPublished: boolean) => {
      const updated = await apiPost<IConcept>(`/api/knowledge/concepts/${slug}/publish`, { isPublished });
      setConcept(updated);
      toast.success(isPublished ? 'Concept published' : 'Concept unpublished');
      return updated;
    },
    [slug]
  );

  const rateConcept = useCallback(
    async (value: number) => {
      const updated = await apiPost<IConcept>(`/api/knowledge/concepts/${slug}/rate`, { value });
      setConcept(updated);
      return updated;
    },
    [slug]
  );

  const fetchRelated = useCallback(
    async (type?: RelationshipType) =>
      apiGet<IConcept[]>(
        `/api/knowledge/concepts/${slug}/relationships`,
        type ? { type } : undefined
      ),
    [slug]
  );

  const traverse = useCallback(
    async (direction: 'out' | 'in' | 'both' = 'out', maxDepth = 2) =>
      apiGet<TraversalResult[]>(`/api/knowledge/concepts/${slug}/traverse`, {
        direction,
        maxDepth,
      }),
    [slug]
  );

  return {
    concept,
    loading,
    error,
    refetch: fetchConcept,
    update: updateConcept,
    remove: deleteConcept,
    publish: publishConcept,
    rate: rateConcept,
    fetchRelated,
    traverse,
  };
}
