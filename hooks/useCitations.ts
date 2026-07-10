'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiGet, apiPost, apiPut, apiDelete, ApiClientError } from '@/lib/api/client';
import type { ICitation } from '@/types';
import type { CreateCitationInput } from '@/validations/knowledge';
import type { CitationFormatInput } from '@/validations/knowledge';

export type UpdateCitationInput = Partial<CreateCitationInput>;

export function useCitations(conceptId?: string) {
  const [citations, setCitations] = useState<ICitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCitations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<ICitation[]>('/api/knowledge/citations', conceptId ? { conceptId } : undefined);
      setCitations(data);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Failed to load citations';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [conceptId]);

  useEffect(() => {
    fetchCitations();
  }, [fetchCitations]);

  const getById = useCallback(
    (citationId: string) => apiGet<ICitation>(`/api/knowledge/citations/${citationId}`),
    []
  );

  const format = useCallback(
    (citationId: string, style?: CitationFormatInput['style']) =>
      apiGet<{ citationId: string; style: string; formatted: string }>(
        `/api/knowledge/citations/${citationId}/format`,
        { citationId, style: style ?? 'apa' }
      ),
    []
  );

  const create = useCallback(
    async (input: CreateCitationInput) => {
      const created = await apiPost<ICitation>('/api/knowledge/citations', input);
      toast.success('Citation created');
      fetchCitations();
      return created;
    },
    [fetchCitations]
  );

  const update = useCallback(
    async (citationId: string, patch: UpdateCitationInput) => {
      const updated = await apiPut<ICitation>(`/api/knowledge/citations/${citationId}`, patch);
      toast.success('Citation updated');
      fetchCitations();
      return updated;
    },
    [fetchCitations]
  );

  const remove = useCallback(
    async (citationId: string) => {
      await apiDelete(`/api/knowledge/citations/${citationId}`);
      toast.success('Citation deleted');
      fetchCitations();
    },
    [fetchCitations]
  );

  return {
    citations,
    loading,
    error,
    refetch: fetchCitations,
    getById,
    format,
    create,
    update,
    remove,
  };
}
