'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface UserMemory {
  userId: string;
  currentLearningGoal: string;
  currentPathId: string | null;
  currentChapterId: string | null;
  preferredExplanationStyle: string;
  knowledgeGaps: string[];
  recentConcepts: Array<{
    concept: string;
    domain: string;
    importance: number;
    firstDiscovered: Date;
    lastRevisited: Date;
    revisitCount: number;
    relatedConcepts: string[];
  }>;
  longTermInterests: string[];
  masteredConcepts: string[];
  interactionHistory: Array<{
    type: string;
    targetId: string;
    timestamp: Date;
    duration: number;
    outcome: string;
    metadata: Record<string, unknown>;
  }>;
  commonMistakes: Array<{
    concept: string;
    mistake: string;
    correctedAt: Date;
    frequency: number;
  }>;
  futureRecommendations: string[];
  lastUpdated: Date;
  version: number;
}

interface UseUserMemoryOptions {
  fallbackData?: Partial<UserMemory>;
}

export function useUserMemory(options: UseUserMemoryOptions = {}) {
  const { fallbackData } = options;
  const [memory, setMemory] = useState<UserMemory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMemory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/cognitive/memory', {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch memory: ${res.status}`);
      }

      const data = await res.json();
      setMemory(data.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      if (fallbackData) {
        setMemory({
          userId: '',
          currentLearningGoal: '',
          currentPathId: null,
          currentChapterId: null,
          preferredExplanationStyle: 'text',
          knowledgeGaps: [],
          recentConcepts: [],
          longTermInterests: [],
          masteredConcepts: [],
          interactionHistory: [],
          commonMistakes: [],
          futureRecommendations: [],
          lastUpdated: new Date(),
          version: 1,
          ...fallbackData,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [fallbackData]);

  const updateMemory = useCallback(async (updates: Partial<UserMemory>) => {
    try {
      const res = await fetch('/api/cognitive/memory', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        throw new Error(`Failed to update memory: ${res.status}`);
      }

      const data = await res.json();
      setMemory(data.data);
      toast.success('Memory updated');
      return data.data;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update memory');
      throw err;
    }
  }, []);

  const recordInteraction = useCallback(async (interaction: {
    type: string;
    targetId: string;
    duration?: number;
    outcome?: string;
    metadata?: Record<string, unknown>;
  }) => {
    try {
      const res = await fetch('/api/cognitive/memory', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: interaction.type,
          targetId: interaction.targetId,
          duration: interaction.duration || 0,
          outcome: interaction.outcome || 'completed',
          metadata: interaction.metadata || {},
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to record interaction: ${res.status}`);
      }

      const data = await res.json();
      setMemory(data.data);
      return data.data;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to record interaction');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchMemory();
  }, [fetchMemory]);

  return {
    memory,
    loading,
    error,
    refetch: fetchMemory,
    update: updateMemory,
    recordInteraction,
  };
}