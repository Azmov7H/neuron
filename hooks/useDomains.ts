'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiGet, apiPost, ApiClientError } from '@/lib/api/client';
import type { IDomainMeta } from '@/types';
import type { CreateDomainInput } from '@/validations/knowledge';

export function useDomains(includeInactive = false) {
  const [domains, setDomains] = useState<IDomainMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDomains = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<IDomainMeta[]>(
        '/api/knowledge/domains',
        includeInactive ? { all: true } : undefined
      );
      setDomains(data);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Failed to load domains';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  const create = useCallback(async (input: CreateDomainInput) => {
    const created = await apiPost<IDomainMeta>('/api/knowledge/domains', input);
    toast.success('Domain created');
    fetchDomains();
    return created;
  }, [fetchDomains]);

  return { domains, loading, error, refetch: fetchDomains, create };
}
