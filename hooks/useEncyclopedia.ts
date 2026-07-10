'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiGet, apiPost, apiPut, apiDelete, ApiClientError } from '@/lib/api/client';
import type { IEncyclopediaArticle, PaginatedResponse, ScientificDomain } from '@/types';
import type { CreateArticleInput, UpdateArticleInput } from '@/validations/knowledge';

export type ArticleQuery = {
  domain?: ScientificDomain;
  conceptId?: string;
  isFeatured?: boolean;
  isPublished?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export function useEncyclopedia(initialQuery: ArticleQuery = {}) {
  const [articles, setArticles] = useState<IEncyclopediaArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialQuery.page ?? 1);
  const [pageSize, setPageSize] = useState(initialQuery.pageSize ?? 20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<ArticleQuery>(initialQuery);

  const fetchArticles = useCallback(async (q: ArticleQuery = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<PaginatedResponse<IEncyclopediaArticle>>(
        '/api/knowledge/encyclopedia',
        q
      );
      setArticles(data.items);
      setTotal(data.total);
      setPage(data.page);
      setPageSize(data.pageSize);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Failed to load articles';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles(query);
  }, [fetchArticles, query]);

  const getBySlug = useCallback(
    (slug: string) => apiGet<IEncyclopediaArticle>(`/api/knowledge/encyclopedia/${slug}`),
    []
  );

  const fetchFeatured = useCallback(
    () => apiGet<IEncyclopediaArticle[]>('/api/knowledge/encyclopedia/featured'),
    []
  );

  const create = useCallback(
    async (input: CreateArticleInput) => {
      const created = await apiPost<IEncyclopediaArticle>('/api/knowledge/encyclopedia', input);
      toast.success('Article created');
      fetchArticles(query);
      return created;
    },
    [fetchArticles, query]
  );

  const update = useCallback(
    async (slug: string, patch: UpdateArticleInput) => {
      const updated = await apiPut<IEncyclopediaArticle>(`/api/knowledge/encyclopedia/${slug}`, patch);
      toast.success('Article updated');
      fetchArticles(query);
      return updated;
    },
    [fetchArticles, query]
  );

  const remove = useCallback(
    async (slug: string) => {
      await apiDelete(`/api/knowledge/encyclopedia/${slug}`);
      toast.success('Article deleted');
      fetchArticles(query);
    },
    [fetchArticles, query]
  );

  return {
    articles,
    total,
    page,
    pageSize,
    loading,
    error,
    refetch: fetchArticles,
    getBySlug,
    fetchFeatured,
    create,
    update,
    remove,
  };
}
