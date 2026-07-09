'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface CognitiveProfile {
  userId: string;
  learningStyle: {
    visual: number;
    reading: number;
    simulation: number;
    practical: number;
    theory: number;
  };
  attention: {
    focusDuration: number;
    attentionSpan: number;
    distractionFrequency: number;
    peakFocusHours: number[];
  };
  retention: {
    shortTerm: number;
    mediumTerm: number;
    longTerm: number;
    recallStrength: number;
  };
  curiosity: number;
  explorationRate: number;
  problemSolving: number;
  learningSpeed: number;
  strongDomains: string[];
  weakDomains: string[];
  masteredConcepts: string[];
  recentConcepts: string[];
  preferredDifficulty: string;
  aiInteractionStyle: string;
  explanationPreference: string;
  confidenceScore: number;
  masteryScore: number;
  lastUpdated: Date;
  version: number;
}

interface UseCognitiveProfileOptions {
  fallbackData?: Partial<CognitiveProfile>;
  revalidateOnMount?: boolean;
}

export function useCognitiveProfile(options: UseCognitiveProfileOptions = {}) {
  const { fallbackData, revalidateOnMount = false } = options;
  const [profile, setProfile] = useState<CognitiveProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/cognitive/profile', {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch profile: ${res.status}`);
      }

      const data = await res.json();
      setProfile(data.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      if (fallbackData) {
        setProfile({
          userId: '',
          learningStyle: { visual: 50, reading: 50, simulation: 50, practical: 50, theory: 50 },
          attention: { focusDuration: 25, attentionSpan: 50, distractionFrequency: 2, peakFocusHours: [9, 14, 19] },
          retention: { shortTerm: 50, mediumTerm: 50, longTerm: 50, recallStrength: 50 },
          curiosity: 50,
          explorationRate: 50,
          problemSolving: 50,
          learningSpeed: 50,
          strongDomains: [],
          weakDomains: [],
          masteredConcepts: [],
          recentConcepts: [],
          preferredDifficulty: 'adaptive',
          aiInteractionStyle: 'collaborative',
          explanationPreference: 'detailed',
          confidenceScore: 50,
          masteryScore: 0,
          lastUpdated: new Date(),
          version: 1,
          ...fallbackData,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [fallbackData]);

  const updateProfile = useCallback(async (updates: Partial<CognitiveProfile>) => {
    try {
      const res = await fetch('/api/cognitive/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        throw new Error(`Failed to update profile: ${res.status}`);
      }

      const data = await res.json();
      setProfile(data.data);
      toast.success('Profile updated');
      return data.data;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    }
  }, []);

  const deriveMetrics = useCallback(async (action: 'learning-style' | 'attention' | 'retention' | 'curiosity' | 'problem-solving' | 'learning-speed' | 'all' = 'all') => {
    try {
      const res = await fetch(`/api/cognitive/profile?action=${action}`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`Failed to derive metrics: ${res.status}`);
      }

      const data = await res.json();
      setProfile(data.data);
      toast.success('Metrics derived successfully');
      return data.data;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to derive metrics');
      throw err;
    }
  }, []);

  useEffect(() => {
    if (revalidateOnMount || !profile) {
      fetchProfile();
    }
  }, [fetchProfile, revalidateOnMount, profile]);

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
    update: updateProfile,
    deriveMetrics,
  };
}