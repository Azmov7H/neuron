'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiGet, apiPost, apiPut, apiDelete, ApiClientError } from '@/lib/api/client';
import type { ITimelineEvent, PaginatedResponse, ScientificDomain, TimelineEra } from '@/types';
import type { CreateTimelineEventInput } from '@/validations/knowledge';

export type UpdateTimelineEventInput = Partial<CreateTimelineEventInput>;

export type TimelineQuery = {
  era?: TimelineEra;
  domain?: ScientificDomain;
  minYear?: number;
  maxYear?: number;
  significanceMin?: number;
  page?: number;
  pageSize?: number;
}

export function useTimeline(initialQuery: TimelineQuery = {}) {
  const [events, setEvents] = useState<ITimelineEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialQuery.page ?? 1);
  const [pageSize, setPageSize] = useState(initialQuery.pageSize ?? 50);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<TimelineQuery>(initialQuery);

  const fetchEvents = useCallback(async (q: TimelineQuery = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<PaginatedResponse<ITimelineEvent>>('/api/knowledge/timeline', q);
      setEvents(data.items);
      setTotal(data.total);
      setPage(data.page);
      setPageSize(data.pageSize);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Failed to load timeline';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(query);
  }, [fetchEvents, query]);

  const getById = useCallback(
    (eventId: string) => apiGet<ITimelineEvent>(`/api/knowledge/timeline/${eventId}`),
    []
  );

  const fetchSpine = useCallback(
    () => apiGet<ITimelineEvent[]>('/api/knowledge/timeline/spine'),
    []
  );

  const create = useCallback(
    async (input: CreateTimelineEventInput) => {
      const created = await apiPost<ITimelineEvent>('/api/knowledge/timeline', input);
      toast.success('Timeline event created');
      fetchEvents(query);
      return created;
    },
    [fetchEvents, query]
  );

  const update = useCallback(
    async (eventId: string, patch: UpdateTimelineEventInput) => {
      const updated = await apiPut<ITimelineEvent>(`/api/knowledge/timeline/${eventId}`, patch);
      toast.success('Timeline event updated');
      fetchEvents(query);
      return updated;
    },
    [fetchEvents, query]
  );

  const remove = useCallback(
    async (eventId: string) => {
      await apiDelete(`/api/knowledge/timeline/${eventId}`);
      toast.success('Timeline event deleted');
      fetchEvents(query);
    },
    [fetchEvents, query]
  );

  return {
    events,
    total,
    page,
    pageSize,
    loading,
    error,
    refetch: fetchEvents,
    getById,
    fetchSpine,
    create,
    update,
    remove,
  };
}
