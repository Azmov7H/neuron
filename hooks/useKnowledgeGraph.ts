'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface KnowledgeNode {
  conceptId: string;
  title: string;
  domain: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  importance: number;
  prerequisites: string[];
  relatedConcepts: string[];
  applications: string[];
  historicalContext: string[];
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface KnowledgeEdge {
  source: string;
  target: string;
  type: 'prerequisite' | 'related' | 'application' | 'historical';
  weight: number;
}

export interface KnowledgeGraph {
  userId: string;
  nodes: Map<string, KnowledgeNode>;
  edges: KnowledgeEdge[];
  domains: Map<string, { conceptIds: string[]; centrality: number }>;
  lastUpdated: Date;
  version: number;
}

interface UseKnowledgeGraphOptions {
  fallbackData?: Partial<KnowledgeGraph>;
}

export function useKnowledgeGraph(options: UseKnowledgeGraphOptions = {}) {
  const { fallbackData } = options;
  const [graph, setGraph] = useState<KnowledgeGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchGraph = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/cognitive/graph', {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch graph: ${res.status}`);
      }

      const data = await res.json();
      setGraph(data.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      if (fallbackData) {
        setGraph({
          userId: '',
          nodes: new Map(),
          edges: [],
          domains: new Map(),
          lastUpdated: new Date(),
          version: 1,
          ...fallbackData,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [fallbackData]);

  const addNode = useCallback(async (node: {
    conceptId: string;
    title: string;
    domain: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    importance?: number;
    prerequisites?: string[];
    relatedConcepts?: string[];
    applications?: string[];
    historicalContext?: string[];
  }) => {
    try {
      const res = await fetch('/api/cognitive/graph/nodes', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(node),
      });

      if (!res.ok) {
        throw new Error(`Failed to add node: ${res.status}`);
      }

      const data = await res.json();
      setGraph(data.data);
      toast.success('Concept added to knowledge graph');
      return data.data;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add node');
      throw err;
    }
  }, []);

  const getNode = useCallback(async (conceptId: string) => {
    try {
      const res = await fetch(`/api/cognitive/graph/nodes/${conceptId}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`Failed to get node: ${res.status}`);
      }

      return res.json();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to get node');
      throw err;
    }
  }, []);

  const getRelatedNodes = useCallback(async (conceptId: string) => {
    try {
      const res = await fetch(`/api/cognitive/graph/nodes/${conceptId}/related`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`Failed to get related nodes: ${res.status}`);
      }

      return res.json();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to get related nodes');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  return {
    graph,
    loading,
    error,
    refetch: fetchGraph,
    addNode,
    getNode,
    getRelatedNodes,
  };
}